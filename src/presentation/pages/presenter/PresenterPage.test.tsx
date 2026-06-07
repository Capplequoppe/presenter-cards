import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDeckRepository } from "../../../application/testing";
import { GetDeck } from "../../../application/use-cases/get-deck";
import { createDeck, createSlide, type Deck } from "../../../domain";
import { renderWithUseCases } from "../../composition-root/render-with-use-cases";
import { PresenterPage } from "./PresenterPage";

const enOnlySlide = createSlide({ textEn: "Welcome everyone!" });
const bilingualSlide = createSlide({
	textEn: "Welcome everyone!",
	textIt: "Benvenuti a tutti!",
});
const slideWithTitle = createSlide({
	title: "Opening",
	textEn: "Welcome everyone!",
});
const slideWithFullFields = createSlide({
	title: "Full slide",
	textEn: "Main text",
	textIt: "Testo principale",
	notes: "Remember to smile",
	durationMinutes: 2,
	speaker: "John",
});

const textOnlyDeck = createDeck({
	id: "text-only-id",
	name: "Text Only",
	slides: [enOnlySlide, createSlide({ textEn: "Second" })],
	importedAt: 1000,
});

const bilingualDeck = createDeck({
	id: "bilingual-id",
	name: "Bilingual",
	slides: [bilingualSlide, enOnlySlide],
	importedAt: 1000,
});

const titleTextDeck = createDeck({
	id: "title-text-id",
	name: "Title Text",
	slides: [slideWithTitle, createSlide({ textEn: "No title slide" })],
	importedAt: 1000,
});

const fullDeck = createDeck({
	id: "full-id",
	name: "Full",
	slides: [slideWithFullFields],
	importedAt: 1000,
});

const twoBilingualDeck = createDeck({
	id: "two-bilingual-id",
	name: "Two Bilingual",
	slides: [
		createSlide({ textEn: "First EN", textIt: "First IT" }),
		createSlide({ textEn: "Second EN", textIt: "Second IT" }),
	],
	importedAt: 1000,
});

/**
 * Renders the presenter with the given deck, waits for the first slide and
 * gives the root container a deterministic width so the 20% edge-zone math
 * is testable in jsdom (offsetWidth is otherwise 0).
 */
async function renderLoadedPresenter(
	deck: Deck,
	firstSlideText: string,
): Promise<HTMLElement> {
	const repo = new FakeDeckRepository();
	await repo.save(deck);
	const getDeck = new GetDeck(repo);

	const { container } = renderWithUseCases(<PresenterPage deckId={deck.id} />, {
		useCases: { getDeck },
	});

	await screen.findByText(firstSlideText);
	const root = container.firstChild as HTMLElement;
	Object.defineProperty(root, "offsetWidth", { value: 1000 });
	return root;
}

/** Simulates a pointer press at startX released at endX (tap when equal). */
function pointerGesture(root: HTMLElement, startX: number, endX: number): void {
	fireEvent.pointerDown(root, { clientX: startX, clientY: 200 });
	fireEvent.pointerMove(root, { clientX: endX, clientY: 200 });
	fireEvent.pointerUp(root, { clientX: endX, clientY: 200 });
}

function tap(root: HTMLElement, clientX: number): void {
	pointerGesture(root, clientX, clientX);
}

describe("PresenterPage", () => {
	beforeEach(() => {
		window.location.hash = "";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("valid deck id", () => {
		it("renders the first slide text and position indicator 1 / N", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(textOnlyDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="text-only-id" />, {
				useCases: { getDeck },
			});

			expect(await screen.findByText("Welcome everyone!")).toBeInTheDocument();
			expect(screen.getByText("1 / 2")).toBeInTheDocument();
		});

		it("renders the deck on a black background (fullscreen)", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(textOnlyDeck);
			const getDeck = new GetDeck(repo);

			const { container } = renderWithUseCases(
				<PresenterPage deckId="text-only-id" />,
				{ useCases: { getDeck } },
			);

			expect(await screen.findByText("Welcome everyone!")).toBeInTheDocument();
			// The root presenter element should have bg-black
			const root = container.firstChild as HTMLElement;
			expect(root.className).toMatch(/bg-black/);
		});
	});

	describe("unknown deck id", () => {
		it("redirects to the menu when deck id is not found", async () => {
			const repo = new FakeDeckRepository();
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="unknown-id" />, {
				useCases: { getDeck },
			});

			// Wait for async resolution
			await vi.waitFor(() => {
				expect(window.location.hash).toBe("#/");
			});
		});
	});

	describe("storage failure", () => {
		it("redirects to the menu instead of staying on a blank screen", async () => {
			const repo = new FakeDeckRepository();
			vi.spyOn(repo, "findById").mockRejectedValue(
				new Error("IndexedDB unavailable"),
			);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="any-id" />, {
				useCases: { getDeck },
			});

			await vi.waitFor(() => {
				expect(window.location.hash).toBe("#/");
			});
		});
	});

	describe("exit control", () => {
		it("clicking the exit button navigates to the menu", async () => {
			const user = userEvent.setup();
			const repo = new FakeDeckRepository();
			await repo.save(textOnlyDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="text-only-id" />, {
				useCases: { getDeck },
			});

			const exitBtn = await screen.findByRole("button", { name: /exit/i });
			await user.click(exitBtn);

			expect(window.location.hash).toBe("#/");
		});
	});

	describe("language indicator", () => {
		it("shows the language indicator on bilingual slides", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(bilingualDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="bilingual-id" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Welcome everyone!");
			expect(screen.getByTestId("language-indicator")).toBeInTheDocument();
		});

		it("hides the language indicator on EN-only slides", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(textOnlyDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="text-only-id" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Welcome everyone!");
			expect(
				screen.queryByTestId("language-indicator"),
			).not.toBeInTheDocument();
		});
	});

	describe("multi-paragraph slide text", () => {
		it("preserves line breaks in verbatim scripts (whitespace-pre-line)", async () => {
			const multiLineDeck = createDeck({
				id: "multi-line-id",
				name: "Multi Line",
				slides: [
					createSlide({
						textEn: "Good evening everyone.\n\nBefore we continue, a game.",
					}),
				],
				importedAt: 1000,
			});
			const repo = new FakeDeckRepository();
			await repo.save(multiLineDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="multi-line-id" />, {
				useCases: { getDeck },
			});

			const paragraph = await screen.findByText(/Good evening everyone\./);
			expect(paragraph).toHaveClass("whitespace-pre-line");
			expect(paragraph.textContent).toContain(
				"Good evening everyone.\n\nBefore we continue, a game.",
			);
		});
	});

	describe("layout: text-only", () => {
		it("shows slide text without title", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(textOnlyDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="text-only-id" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Welcome everyone!");
			expect(screen.queryByTestId("slide-title")).not.toBeInTheDocument();
		});
	});

	describe("layout: title-text", () => {
		it("shows the slide title above the text when present", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(titleTextDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="title-text-id" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Welcome everyone!");
			expect(screen.getByTestId("slide-title")).toHaveTextContent("Opening");
		});

		it("does not render title element when slide has no title", async () => {
			const repo = new FakeDeckRepository();
			const deck = createDeck({
				id: "no-title-id",
				name: "No Title",
				slides: [slideWithTitle, createSlide({ textEn: "No title here" })],
				importedAt: 1000,
			});
			await repo.save(deck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="no-title-id" />, {
				useCases: { getDeck },
			});

			// Navigate to second slide (no title)
			await screen.findByText("Opening");
			const nextBtn = screen.getByRole("button", { name: /next/i });
			await userEvent.click(nextBtn);

			await screen.findByText("No title here");
			expect(screen.queryByTestId("slide-title")).not.toBeInTheDocument();
		});
	});

	describe("layout: full", () => {
		it("shows notes, duration, and speaker in a secondary style", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(fullDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="full-id" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Main text");
			expect(screen.getByTestId("slide-notes")).toHaveTextContent(
				"Remember to smile",
			);
			expect(screen.getByTestId("slide-duration")).toHaveTextContent("2");
			expect(screen.getByTestId("slide-speaker")).toHaveTextContent("John");
		});

		it("does not show notes/duration/speaker in text-only layout", async () => {
			const repo = new FakeDeckRepository();
			await repo.save(textOnlyDeck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="text-only-id" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Welcome everyone!");
			expect(screen.queryByTestId("slide-notes")).not.toBeInTheDocument();
			expect(screen.queryByTestId("slide-duration")).not.toBeInTheDocument();
			expect(screen.queryByTestId("slide-speaker")).not.toBeInTheDocument();
		});
	});

	describe("gesture navigation (component level)", () => {
		it("swipe left anywhere advances; swipe right goes back", async () => {
			const root = await renderLoadedPresenter(
				textOnlyDeck,
				"Welcome everyone!",
			);

			pointerGesture(root, 500, 400); // 100px left swipe
			expect(screen.getByText("Second")).toBeInTheDocument();
			expect(screen.getByText("2 / 2")).toBeInTheDocument();

			pointerGesture(root, 400, 500); // 100px right swipe
			expect(screen.getByText("Welcome everyone!")).toBeInTheDocument();
			expect(screen.getByText("1 / 2")).toBeInTheDocument();
		});

		it("right-edge tap advances; left-edge tap goes back; indicator updates", async () => {
			const root = await renderLoadedPresenter(
				textOnlyDeck,
				"Welcome everyone!",
			);

			tap(root, 900); // right 20% zone of 1000px
			expect(screen.getByText("2 / 2")).toBeInTheDocument();

			tap(root, 100); // left 20% zone
			expect(screen.getByText("1 / 2")).toBeInTheDocument();
		});

		it("center tap toggles EN ⇄ IT on a bilingual slide", async () => {
			const root = await renderLoadedPresenter(twoBilingualDeck, "First EN");

			tap(root, 500); // center zone
			expect(screen.getByText("First IT")).toBeInTheDocument();
			expect(screen.getByTestId("language-indicator")).toHaveTextContent("it");

			tap(root, 500);
			expect(screen.getByText("First EN")).toBeInTheDocument();
			expect(screen.getByTestId("language-indicator")).toHaveTextContent("en");
		});

		it("center tap on an EN-only slide leaves the text unchanged", async () => {
			const root = await renderLoadedPresenter(
				textOnlyDeck,
				"Welcome everyone!",
			);

			tap(root, 500);
			expect(screen.getByText("Welcome everyone!")).toBeInTheDocument();
			expect(
				screen.queryByTestId("language-indicator"),
			).not.toBeInTheDocument();
		});

		it("does not wrap around at either end of the deck", async () => {
			const root = await renderLoadedPresenter(
				textOnlyDeck,
				"Welcome everyone!",
			);

			pointerGesture(root, 400, 500); // swipe right on first slide
			expect(screen.getByText("1 / 2")).toBeInTheDocument();

			pointerGesture(root, 500, 400); // move to last slide
			pointerGesture(root, 500, 400); // swipe left on last slide
			expect(screen.getByText("2 / 2")).toBeInTheDocument();
		});

		it("resets language to English when navigating after toggling to Italian", async () => {
			const root = await renderLoadedPresenter(twoBilingualDeck, "First EN");

			tap(root, 500); // toggle to IT
			expect(screen.getByText("First IT")).toBeInTheDocument();

			pointerGesture(root, 500, 400); // next slide
			expect(screen.getByText("Second EN")).toBeInTheDocument();
			expect(screen.getByTestId("language-indicator")).toHaveTextContent("en");
		});
	});
});
