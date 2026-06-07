import { useCallback, useEffect, useRef, useState } from "react";
import type { Deck } from "../../domain";
import { useUseCases } from "../composition-root";
import { navigateToPresenter } from "../routing";
import { DeckActionsMenu } from "./deck-menu/DeckActionsMenu";
import { ErrorBanner } from "./deck-menu/ErrorBanner";
import { ImportButton } from "./deck-menu/ImportButton";

/**
 * Deck menu page — main screen of the app.
 *
 * Renders the list of imported decks with per-deck actions, an import button,
 * and an empty state when no decks are available.
 */
export function DeckMenuPage() {
	const { listDecks, importDeck } = useUseCases();
	const [decks, setDecks] = useState<Deck[]>([]);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleError = useCallback((err: unknown): void => {
		if (err instanceof Error) {
			setError(err.message);
		} else {
			setError("An unexpected error occurred.");
		}
	}, []);

	useEffect(() => {
		listDecks.execute().then(setDecks).catch(handleError);
	}, [listDecks, handleError]);

	function dismissError(): void {
		setError(null);
	}

	function handleImportClick(): void {
		fileInputRef.current?.click();
	}

	async function handleFileChange(
		e: React.ChangeEvent<HTMLInputElement>,
	): Promise<void> {
		const file = e.target.files?.[0];
		if (!file) return;
		// Reset so the same file can be re-picked after dismissing an error
		e.target.value = "";
		try {
			const csvText = await file.text();
			await importDeck.execute(csvText, file.name);
			const updated = await listDecks.execute();
			setDecks(updated);
		} catch (err) {
			handleError(err);
		}
	}

	function handleDeckUpdated(updated: Deck[]): void {
		setDecks(updated);
	}

	return (
		<div className="min-h-screen bg-[#121212] text-gray-100">
			{/* Header */}
			<header className="flex items-center justify-between px-6 py-4">
				<h1 className="text-2xl font-bold tracking-tight">Presenter Cards</h1>
				<ImportButton onClick={handleImportClick} />
			</header>

			{/* Hidden file input — tabIndex={-1} keeps it out of the tab order */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				className="hidden"
				tabIndex={-1}
				onChange={handleFileChange}
			/>

			{/* Error banner */}
			{error !== null && (
				<ErrorBanner message={error} onDismiss={dismissError} />
			)}

			{/* Content */}
			<main className="px-6 pb-6">
				{decks.length === 0 ? (
					<EmptyState onImportClick={handleImportClick} />
				) : (
					<DeckList
						decks={decks}
						onError={handleError}
						onDeckUpdated={handleDeckUpdated}
					/>
				)}
			</main>
		</div>
	);
}

interface EmptyStateProps {
	readonly onImportClick: () => void;
}

function EmptyState({ onImportClick }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-24 text-center">
			<p className="text-gray-400 text-lg mb-4">No decks yet.</p>
			<p className="text-gray-500 text-sm mb-6">
				Import a CSV file to create your first deck.
			</p>
			<button
				type="button"
				onClick={onImportClick}
				className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
			>
				+ Import CSV
			</button>
		</div>
	);
}

interface DeckListProps {
	readonly decks: Deck[];
	readonly onError: (err: unknown) => void;
	readonly onDeckUpdated: (decks: Deck[]) => void;
}

function DeckList({ decks, onError, onDeckUpdated }: DeckListProps) {
	return (
		<ul className="space-y-3">
			{decks.map((deck) => (
				<DeckRow
					key={deck.id}
					deck={deck}
					onError={onError}
					onDeckUpdated={onDeckUpdated}
				/>
			))}
		</ul>
	);
}

interface DeckRowProps {
	readonly deck: Deck;
	readonly onError: (err: unknown) => void;
	readonly onDeckUpdated: (decks: Deck[]) => void;
}

function DeckRow({ deck, onError, onDeckUpdated }: DeckRowProps) {
	const slideCount = deck.slides.length;
	const importDate = new Date(deck.importedAt).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	function handleRowClick(): void {
		navigateToPresenter(deck.id);
	}

	function handleKeyDown(e: React.KeyboardEvent): void {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			navigateToPresenter(deck.id);
		}
	}

	return (
		<li className="flex items-center rounded-xl bg-gray-900 px-4 py-3 gap-3">
			{/* Clickable deck info area */}
			<button
				type="button"
				aria-label={`Open ${deck.name}`}
				className="flex-1 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
				onClick={handleRowClick}
				onKeyDown={handleKeyDown}
			>
				<span className="block font-semibold text-gray-100 truncate">
					{deck.name}
				</span>
				<span className="block text-sm text-gray-400 mt-0.5">
					{slideCount} {slideCount === 1 ? "slide" : "slides"} · imported{" "}
					{importDate}
				</span>
			</button>
			{/* Actions menu */}
			<DeckActionsMenu
				deck={deck}
				onError={onError}
				onDeckUpdated={onDeckUpdated}
			/>
		</li>
	);
}
