import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDeckRepository } from "../../../application/testing";
import { GetDeck } from "../../../application/use-cases/get-deck";
import { UpdateDeckSettings } from "../../../application/use-cases/update-deck-settings";
import { createSlide, reconstituteDeck } from "../../../domain";
import { renderWithUseCases } from "../../composition-root/render-with-use-cases";
import { PresenterPage } from "./PresenterPage";

const slide = createSlide({ textEn: "Hello world" });

function makeDeck(fontScale: number) {
	const repo = new FakeDeckRepository();
	const deck = reconstituteDeck({
		id: "deck-1",
		name: "Test",
		slides: [slide],
		importedAt: 1000,
		settings: { layout: "text-only", fontScale },
	});
	return { repo, deck };
}

describe("FontControls", () => {
	beforeEach(() => {
		// shouldAdvanceTime: true allows waitFor/findBy* to work with fake timers
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	describe("A+ increases font scale", () => {
		it("A+ from 1.0 renders larger text and invokes UpdateDeckSettings with 1.1", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			const { repo, deck } = makeDeck(1.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);
			const updateDeckSettings = new UpdateDeckSettings(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck, updateDeckSettings },
			});

			// Wait for deck to load
			await screen.findByText("Hello world");

			// Verify initial font scale (1.0 * 3 = 3rem)
			const slideText = screen.getByText("Hello world");
			expect(slideText.style.fontSize).toBe("3rem");

			// Click A+
			const increaseBtn = screen.getByRole("button", {
				name: /increase font size/i,
			});
			await user.click(increaseBtn);

			// Text should now be at 1.1 * 3 = 3.3rem
			expect(slideText.style.fontSize).toBe("3.3rem");

			// Repository should have saved the updated scale
			const saved = await repo.findById("deck-1");
			expect(saved.settings.fontScale).toBeCloseTo(1.1);
		});
	});

	describe("bounds enforcement", () => {
		it("A+ button is disabled at maximum scale (2.0)", async () => {
			const { repo, deck } = makeDeck(2.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Hello world");

			const increaseBtn = screen.getByRole("button", {
				name: /increase font size/i,
			});
			expect(increaseBtn).toBeDisabled();
		});

		it("A− button is disabled at minimum scale (0.5)", async () => {
			const { repo, deck } = makeDeck(0.5);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Hello world");

			const decreaseBtn = screen.getByRole("button", {
				name: /decrease font size/i,
			});
			expect(decreaseBtn).toBeDisabled();
		});

		it("A+ from 2.0 does not exceed 2.0", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			const { repo, deck } = makeDeck(2.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);
			const updateDeckSettings = new UpdateDeckSettings(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck, updateDeckSettings },
			});

			await screen.findByText("Hello world");

			// Force click even though disabled (the disabled attr should prevent it)
			const increaseBtn = screen.getByRole("button", {
				name: /increase font size/i,
			});
			expect(increaseBtn).toBeDisabled();

			// Attempt click via userEvent — disabled button should not trigger handler
			await user.click(increaseBtn);

			const saved = await repo.findById("deck-1");
			expect(saved.settings.fontScale).toBe(2.0);
		});

		it("A− from 0.5 does not go below 0.5", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			const { repo, deck } = makeDeck(0.5);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);
			const updateDeckSettings = new UpdateDeckSettings(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck, updateDeckSettings },
			});

			await screen.findByText("Hello world");

			const decreaseBtn = screen.getByRole("button", {
				name: /decrease font size/i,
			});
			expect(decreaseBtn).toBeDisabled();

			await user.click(decreaseBtn);

			const saved = await repo.findById("deck-1");
			expect(saved.settings.fontScale).toBe(0.5);
		});
	});

	describe("persistence — reopening deck applies saved scale", () => {
		it("reloading the deck presents at the saved fontScale", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			const { repo, deck } = makeDeck(1.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);
			const updateDeckSettings = new UpdateDeckSettings(repo);

			const { unmount } = renderWithUseCases(
				<PresenterPage deckId="deck-1" />,
				{ useCases: { getDeck, updateDeckSettings } },
			);

			await screen.findByText("Hello world");

			// Increase font scale
			const increaseBtn = screen.getByRole("button", {
				name: /increase font size/i,
			});
			await user.click(increaseBtn);

			// Verify scale was saved
			const saved = await repo.findById("deck-1");
			expect(saved.settings.fontScale).toBeCloseTo(1.1);

			unmount();

			// Remount — should load with saved scale
			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck, updateDeckSettings },
			});

			await screen.findByText("Hello world");
			const slideText = screen.getByText("Hello world");
			// 1.1 * 3 = 3.3rem
			expect(slideText.style.fontSize).toBe("3.3rem");
		});
	});

	describe("fading behavior", () => {
		it("controls are visible initially", async () => {
			const { repo, deck } = makeDeck(1.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Hello world");
			const controls = screen.getByTestId("font-controls");
			expect(controls.className).toMatch(/opacity-100/);
		});

		it("controls fade out after 3 seconds of inactivity", async () => {
			const { repo, deck } = makeDeck(1.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck },
			});

			await screen.findByText("Hello world");
			const controls = screen.getByTestId("font-controls");

			// Initially visible
			expect(controls.className).toMatch(/opacity-100/);

			// Advance timer past 3s fade delay
			act(() => {
				vi.advanceTimersByTime(3100);
			});

			expect(controls.className).toMatch(/opacity-0/);
		});

		it("controls reappear when the presenter screen is touched after fading out", async () => {
			const { repo, deck } = makeDeck(1.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);

			const { container } = renderWithUseCases(
				<PresenterPage deckId="deck-1" />,
				{ useCases: { getDeck } },
			);

			await screen.findByText("Hello world");
			const controls = screen.getByTestId("font-controls");

			// Let the controls fade out
			act(() => {
				vi.advanceTimersByTime(3100);
			});
			expect(controls.className).toMatch(/opacity-0/);

			// While faded the wrapper has pointer-events-none, so interaction
			// lands on the presenter root — it must bring the controls back.
			const root = container.firstChild as HTMLElement;
			fireEvent.pointerDown(root, { clientX: 500, clientY: 200 });

			expect(controls.className).toMatch(/opacity-100/);
		});

		it("interacting with controls resets the fade timer and keeps them visible", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			const { repo, deck } = makeDeck(1.0);
			await repo.save(deck);
			const getDeck = new GetDeck(repo);
			const updateDeckSettings = new UpdateDeckSettings(repo);

			renderWithUseCases(<PresenterPage deckId="deck-1" />, {
				useCases: { getDeck, updateDeckSettings },
			});

			await screen.findByText("Hello world");
			const controls = screen.getByTestId("font-controls");

			// Advance 2 seconds (not yet faded)
			act(() => {
				vi.advanceTimersByTime(2000);
			});

			// Click A+ to reset the timer
			const increaseBtn = screen.getByRole("button", {
				name: /increase font size/i,
			});
			await user.click(increaseBtn);

			// Advance 2 more seconds — still within 3s window from the click
			act(() => {
				vi.advanceTimersByTime(2000);
			});

			expect(controls.className).toMatch(/opacity-100/);

			// Advance another 1.5s to exceed the 3s window
			act(() => {
				vi.advanceTimersByTime(1500);
			});

			expect(controls.className).toMatch(/opacity-0/);
		});
	});

	describe("event isolation — font controls do not trigger slide navigation", () => {
		it("clicking A+ does not navigate to the next slide", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			const slide2 = createSlide({ textEn: "Second slide" });
			const repo = new FakeDeckRepository();
			const deck = reconstituteDeck({
				id: "deck-2",
				name: "Two Slides",
				slides: [slide, slide2],
				importedAt: 1000,
				settings: { layout: "text-only", fontScale: 1.0 },
			});
			await repo.save(deck);
			const getDeck = new GetDeck(repo);
			const updateDeckSettings = new UpdateDeckSettings(repo);

			renderWithUseCases(<PresenterPage deckId="deck-2" />, {
				useCases: { getDeck, updateDeckSettings },
			});

			await screen.findByText("Hello world");

			// The sr-only Next button is the navigation mechanism
			const nextBtn = screen.getByRole("button", { name: /next slide/i });
			expect(nextBtn).toBeInTheDocument();

			// Click A+ — should NOT navigate
			const increaseBtn = screen.getByRole("button", {
				name: /increase font size/i,
			});
			await user.click(increaseBtn);

			// Still on first slide
			expect(screen.getByText("Hello world")).toBeInTheDocument();
			expect(screen.queryByText("Second slide")).not.toBeInTheDocument();
		});
	});
});
