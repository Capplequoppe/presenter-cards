import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CsvParseError,
	CsvParseErrorKind,
} from "../../../application/ports/deck-csv-parser";
import {
	FakeDeckCsvParser,
	FakeDeckRepository,
} from "../../../application/testing";
import { createDeck, createSlide } from "../../../domain";
import { StorageError } from "../../../infrastructure/storage/storage-error";
import { renderWithUseCases } from "../../composition-root/render-with-use-cases";
import { DeckMenuPage } from "../DeckMenuPage";

/**
 * DeckActionsMenu is tested through DeckMenuPage to ensure the full
 * rendering/update cycle (deck list updates after actions) is covered.
 */

const slide = createSlide({ textEn: "Original slide" });
const newSlides = [
	createSlide({ textEn: "New slide 1" }),
	createSlide({ textEn: "New slide 2" }),
	createSlide({ textEn: "New slide 3" }),
];

async function openActionsMenu(user: ReturnType<typeof userEvent.setup>) {
	const menuBtn = await screen.findByRole("button", {
		name: /Actions for Test Deck/i,
	});
	await user.click(menuBtn);
}

describe("DeckActionsMenu", () => {
	let repo: FakeDeckRepository;

	beforeEach(async () => {
		repo = new FakeDeckRepository();
		await repo.save(
			createDeck({
				id: "deck-1",
				name: "Test Deck",
				slides: [slide],
				importedAt: 1_000_000,
			}),
		);
		window.location.hash = "";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Rename", () => {
		it("happy path: updates the deck name in the list", async () => {
			const user = userEvent.setup();
			const promptSpy = vi
				.spyOn(window, "prompt")
				.mockReturnValue("Renamed Deck");

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Rename"));

			await screen.findByText("Renamed Deck");
			expect(screen.queryByText("Test Deck")).not.toBeInTheDocument();
			// The prompt must be pre-filled with the current deck name
			expect(promptSpy).toHaveBeenCalledWith(expect.any(String), "Test Deck");
		});

		it("cancelling prompt leaves deck unchanged", async () => {
			const user = userEvent.setup();
			vi.spyOn(window, "prompt").mockReturnValue(null);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Rename"));

			// Deck name unchanged
			await screen.findByText("Test Deck");
		});

		it("empty name is rejected with a visible error message", async () => {
			const user = userEvent.setup();
			vi.spyOn(window, "prompt").mockReturnValue("");

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Rename"));

			await screen.findByText(/Deck name cannot be empty/i);
			// Deck still in list
			expect(screen.getByText("Test Deck")).toBeInTheDocument();
		});

		it("storage error on rename surfaces as dismissible error", async () => {
			const user = userEvent.setup();
			vi.spyOn(window, "prompt").mockReturnValue("New Name");
			vi.spyOn(repo, "save").mockRejectedValue(
				new StorageError("Failed to save deck deck-1", new Error("IDB error")),
			);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Rename"));

			await screen.findByRole("alert");
			expect(screen.getByRole("alert")).toHaveTextContent(/Failed to save/i);
		});
	});

	describe("Re-import", () => {
		it("valid CSV replaces slide count and date while preserving name", async () => {
			const user = userEvent.setup();
			const csvParser = FakeDeckCsvParser.withSuccess(newSlides);

			renderWithUseCases(<DeckMenuPage />, { repository: repo, csvParser });

			await openActionsMenu(user);
			await user.click(screen.getByText("Re-import"));

			// Find the re-import file input (there are two file inputs: one for import, one for re-import)
			const fileInputs =
				document.querySelectorAll<HTMLInputElement>('input[type="file"]');
			// The second file input is the re-import one
			const reImportInput = fileInputs[fileInputs.length - 1];
			await userEvent.upload(
				reImportInput,
				new File(["text_en\nNew slide"], "test.csv"),
			);

			await screen.findByText(/3 slides/i);
			// Name preserved
			expect(screen.getByText("Test Deck")).toBeInTheDocument();
		});

		it("parse error shows message, deck unchanged", async () => {
			const user = userEvent.setup();
			const errorMsg = 'Missing required column "text_en".';
			const csvParser = FakeDeckCsvParser.withFailure(
				new CsvParseError(errorMsg, CsvParseErrorKind.UnrecognizedHeader),
			);

			renderWithUseCases(<DeckMenuPage />, { repository: repo, csvParser });

			await openActionsMenu(user);
			await user.click(screen.getByText("Re-import"));

			const fileInputs =
				document.querySelectorAll<HTMLInputElement>('input[type="file"]');
			const reImportInput = fileInputs[fileInputs.length - 1];
			await userEvent.upload(reImportInput, new File(["bad"], "bad.csv"));

			await screen.findByText(errorMsg);
			// Deck still shows original slide count
			expect(screen.getByText(/1 slide/i)).toBeInTheDocument();
		});

		it("storage error on re-import surfaces as dismissible error", async () => {
			const user = userEvent.setup();
			const csvParser = FakeDeckCsvParser.withSuccess(newSlides);

			vi.spyOn(repo, "save").mockRejectedValue(
				new StorageError("Failed to save deck deck-1", new Error("IDB error")),
			);

			renderWithUseCases(<DeckMenuPage />, { repository: repo, csvParser });

			await openActionsMenu(user);
			await user.click(screen.getByText("Re-import"));

			const fileInputs =
				document.querySelectorAll<HTMLInputElement>('input[type="file"]');
			const reImportInput = fileInputs[fileInputs.length - 1];
			await userEvent.upload(
				reImportInput,
				new File(["text_en\nSlide"], "test.csv"),
			);

			await screen.findByRole("alert");
			expect(screen.getByRole("alert")).toHaveTextContent(/Failed to save/i);
			// Deck still listed
			await waitFor(() =>
				expect(screen.queryByText("Test Deck")).toBeInTheDocument(),
			);
		});
	});

	describe("Delete", () => {
		it("confirming delete removes the deck row", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Delete"));

			await waitFor(() =>
				expect(screen.queryByText("Test Deck")).not.toBeInTheDocument(),
			);
			expect(screen.getByText(/No decks yet/i)).toBeInTheDocument();
			// The confirmation must name the deck being deleted
			expect(confirmSpy).toHaveBeenCalledWith(
				expect.stringContaining("Test Deck"),
			);
		});

		it("cancelling the confirmation leaves the deck row", async () => {
			const user = userEvent.setup();
			vi.spyOn(window, "confirm").mockReturnValue(false);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Delete"));

			// Deck still present
			await screen.findByText("Test Deck");
		});

		it("storage error on delete surfaces as dismissible error", async () => {
			const user = userEvent.setup();
			vi.spyOn(window, "confirm").mockReturnValue(true);
			vi.spyOn(repo, "deleteById").mockRejectedValue(
				new StorageError(
					"Failed to delete deck deck-1",
					new Error("IDB error"),
				),
			);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });
			await openActionsMenu(user);
			await user.click(screen.getByText("Delete"));

			await screen.findByRole("alert");
			expect(screen.getByRole("alert")).toHaveTextContent(/Failed to delete/i);
		});
	});
});
