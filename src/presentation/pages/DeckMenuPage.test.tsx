import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CsvParseError,
	CsvParseErrorKind,
} from "../../application/ports/deck-csv-parser";
import {
	FakeDeckCsvParser,
	FakeDeckRepository,
} from "../../application/testing";
import { createDeck, createSlide } from "../../domain";
import { StorageError } from "../../infrastructure/storage/storage-error";
import { renderWithUseCases } from "../composition-root/render-with-use-cases";
import { DeckMenuPage } from "./DeckMenuPage";

const slide = createSlide({ textEn: "Test slide" });
const twoSlides = [
	createSlide({ textEn: "Slide 1" }),
	createSlide({ textEn: "Slide 2" }),
];

describe("DeckMenuPage", () => {
	beforeEach(() => {
		window.location.hash = "";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("empty state", () => {
		it("shows an empty state inviting first import when no decks stored", async () => {
			renderWithUseCases(<DeckMenuPage />);
			await screen.findByText(/No decks yet/i);
			expect(screen.getByText(/Import a CSV file/i)).toBeInTheDocument();
		});

		it("does not render any deck rows in empty state", async () => {
			renderWithUseCases(<DeckMenuPage />);
			await screen.findByText(/No decks yet/i);
			expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
		});
	});

	describe("deck list with decks", () => {
		it("renders three decks newest-first with name, slide count, and import date", async () => {
			const repo = new FakeDeckRepository();
			const oldest = createDeck({
				id: "a",
				name: "Oldest Deck",
				slides: [slide],
				importedAt: 1_000_000,
			});
			const middle = createDeck({
				id: "b",
				name: "Middle Deck",
				slides: twoSlides,
				importedAt: 2_000_000,
			});
			const newest = createDeck({
				id: "c",
				name: "Newest Deck",
				slides: [slide],
				importedAt: 3_000_000,
			});
			await repo.save(oldest);
			await repo.save(middle);
			await repo.save(newest);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });

			await screen.findByText("Newest Deck");
			const items = screen.getAllByRole("listitem");
			expect(items[0]).toHaveTextContent("Newest Deck");
			expect(items[1]).toHaveTextContent("Middle Deck");
			expect(items[2]).toHaveTextContent("Oldest Deck");

			// Slide counts
			expect(items[0]).toHaveTextContent("1 slide");
			expect(items[1]).toHaveTextContent("2 slides");

			// Import dates (just check they contain text derived from the timestamp)
			expect(items[0]).toHaveTextContent(/imported/i);
		});
	});

	describe("import flow", () => {
		it("adds the deck to the list after successful import; deck name = file name sans extension", async () => {
			const user = userEvent.setup();
			const repo = new FakeDeckRepository();
			const csvParser = FakeDeckCsvParser.withSuccess([slide]);

			renderWithUseCases(<DeckMenuPage />, { repository: repo, csvParser });

			await screen.findByText(/No decks yet/i);

			const importBtn = screen.getAllByRole("button", {
				name: /import csv/i,
			})[0];

			const csvBlob = new File(["text_en\nHello"], "my-deck.csv", {
				type: "text/csv",
			});

			// Trigger the file input via the button
			await user.click(importBtn);
			const fileInput =
				document.querySelector<HTMLInputElement>('input[type="file"]');
			expect(fileInput).not.toBeNull();

			await userEvent.upload(fileInput as HTMLInputElement, csvBlob);

			await screen.findByText("my-deck");
		});

		it("does not modify the list when a parser error occurs", async () => {
			const user = userEvent.setup();
			const repo = new FakeDeckRepository();
			const csvParser = FakeDeckCsvParser.withFailure(
				new CsvParseError(
					'Missing required column "text_en".',
					CsvParseErrorKind.UnrecognizedHeader,
				),
			);

			renderWithUseCases(<DeckMenuPage />, { repository: repo, csvParser });

			await screen.findByText(/No decks yet/i);

			const importBtn = screen.getAllByRole("button", {
				name: /import csv/i,
			})[0];
			await user.click(importBtn);

			const fileInput =
				document.querySelector<HTMLInputElement>('input[type="file"]');
			const badFile = new File(["bad"], "bad.csv", { type: "text/csv" });
			await userEvent.upload(fileInput as HTMLInputElement, badFile);

			await screen.findByText(/Missing required column "text_en"/i);
			// List still empty
			expect(screen.getByText(/No decks yet/i)).toBeInTheDocument();
		});

		it("shows parser error message verbatim and it is dismissible", async () => {
			const user = userEvent.setup();
			const errorMessage =
				"Empty text_en on rows 2, 3. Each slide must have a non-empty text_en value.";
			const csvParser = FakeDeckCsvParser.withFailure(
				new CsvParseError(errorMessage, CsvParseErrorKind.EmptyTextEn, {
					rows: [2, 3],
				}),
			);

			renderWithUseCases(<DeckMenuPage />, { csvParser });

			await screen.findByText(/No decks yet/i);

			const importBtn = screen.getAllByRole("button", {
				name: /import csv/i,
			})[0];
			await user.click(importBtn);

			const fileInput =
				document.querySelector<HTMLInputElement>('input[type="file"]');
			await userEvent.upload(
				fileInput as HTMLInputElement,
				new File(["text_en\n"], "test.csv"),
			);

			await screen.findByText(errorMessage);
			expect(screen.getByRole("alert")).toBeInTheDocument();

			// Dismiss
			const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
			await user.click(dismissBtn);
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});

		it("shows the empty-file parser error verbatim and leaves the list unchanged", async () => {
			const user = userEvent.setup();
			const errorMessage = "The file is empty. Nothing to import.";
			const csvParser = FakeDeckCsvParser.withFailure(
				new CsvParseError(errorMessage, CsvParseErrorKind.EmptyFile),
			);

			renderWithUseCases(<DeckMenuPage />, { csvParser });

			await screen.findByText(/No decks yet/i);

			const importBtn = screen.getAllByRole("button", {
				name: /import csv/i,
			})[0];
			await user.click(importBtn);

			const fileInput =
				document.querySelector<HTMLInputElement>('input[type="file"]');
			await userEvent.upload(
				fileInput as HTMLInputElement,
				new File([""], "empty.csv"),
			);

			await screen.findByText(errorMessage);
			expect(screen.getByText(/No decks yet/i)).toBeInTheDocument();
		});

		it("shows a dismissible error message when repository save fails", async () => {
			const user = userEvent.setup();
			const repo = new FakeDeckRepository();
			const csvParser = FakeDeckCsvParser.withSuccess([slide]);

			// Make save throw a StorageError
			vi.spyOn(repo, "save").mockRejectedValue(
				new StorageError("Failed to save deck test-id", new Error("IDB error")),
			);

			renderWithUseCases(<DeckMenuPage />, { repository: repo, csvParser });

			await screen.findByText(/No decks yet/i);

			const importBtn = screen.getAllByRole("button", {
				name: /import csv/i,
			})[0];
			await user.click(importBtn);

			const fileInput =
				document.querySelector<HTMLInputElement>('input[type="file"]');
			await userEvent.upload(
				fileInput as HTMLInputElement,
				new File(["text_en\nHello"], "deck.csv"),
			);

			await screen.findByText(/Failed to save deck/i);
			expect(screen.getByRole("alert")).toBeInTheDocument();

			// Dismiss
			const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
			await user.click(dismissBtn);
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});

	describe("navigation", () => {
		it("tapping a deck row navigates to the presenter route with the deck id", async () => {
			const user = userEvent.setup();
			const repo = new FakeDeckRepository();
			const deck = createDeck({
				id: "deck-abc",
				name: "My Deck",
				slides: [slide],
				importedAt: Date.now(),
			});
			await repo.save(deck);

			renderWithUseCases(<DeckMenuPage />, { repository: repo });

			const deckButton = await screen.findByRole("button", {
				name: "Open My Deck",
			});
			await user.click(deckButton);

			expect(window.location.hash).toBe("#/deck/deck-abc");
		});
	});
});
