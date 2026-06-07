import { useEffect, useRef, useState } from "react";
import type { Deck } from "../../../domain";
import { useUseCases } from "../../composition-root";

interface DeckActionsMenuProps {
	readonly deck: Deck;
	readonly onError: (err: unknown) => void;
	readonly onDeckUpdated: (decks: Deck[]) => void;
}

/**
 * Per-deck ⋮ menu with Rename, Re-import, and Delete actions.
 */
export function DeckActionsMenu({
	deck,
	onError,
	onDeckUpdated,
}: DeckActionsMenuProps) {
	const { renameDeck, reimportDeck, deleteDeck, listDecks } = useUseCases();
	const [open, setOpen] = useState(false);
	const [renameError, setRenameError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Close the dropdown when the user taps anywhere outside it (phone UX:
	// prevents multiple open menus and stale dropdowns lingering on screen).
	useEffect(() => {
		if (!open) return;
		function handleOutsidePointerDown(e: PointerEvent): void {
			const container = containerRef.current;
			if (
				container &&
				e.target instanceof Node &&
				!container.contains(e.target)
			) {
				setOpen(false);
				setRenameError(null);
			}
		}
		document.addEventListener("pointerdown", handleOutsidePointerDown);
		return () =>
			document.removeEventListener("pointerdown", handleOutsidePointerDown);
	}, [open]);

	function toggleMenu(): void {
		setOpen((prev) => !prev);
		setRenameError(null);
	}

	function closeMenu(): void {
		setOpen(false);
		setRenameError(null);
	}

	async function handleRename(): Promise<void> {
		closeMenu();
		const input = window.prompt("Rename deck", deck.name);
		if (input === null) return; // cancelled
		if (input.trim() === "") {
			setRenameError("Deck name cannot be empty.");
			return;
		}
		try {
			await renameDeck.execute(deck.id, input.trim());
			const updated = await listDecks.execute();
			onDeckUpdated(updated);
		} catch (err) {
			onError(err);
		}
	}

	function handleReimportClick(): void {
		closeMenu();
		fileInputRef.current?.click();
	}

	async function handleReimportFileChange(
		e: React.ChangeEvent<HTMLInputElement>,
	): Promise<void> {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		try {
			const csvText = await file.text();
			await reimportDeck.execute(deck.id, csvText);
			const updated = await listDecks.execute();
			onDeckUpdated(updated);
		} catch (err) {
			onError(err);
		}
	}

	async function handleDelete(): Promise<void> {
		closeMenu();
		const confirmed = window.confirm(
			`Delete "${deck.name}"? This cannot be undone.`,
		);
		if (!confirmed) return;
		try {
			await deleteDeck.execute(deck.id);
			const updated = await listDecks.execute();
			onDeckUpdated(updated);
		} catch (err) {
			onError(err);
		}
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				aria-label={`Actions for ${deck.name}`}
				aria-haspopup="true"
				aria-expanded={open}
				onClick={toggleMenu}
				className="flex min-h-11 min-w-11 items-center justify-center rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
			>
				⋮
			</button>

			{/* Hidden re-import file input — tabIndex={-1} keeps it out of the tab order */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				className="hidden"
				tabIndex={-1}
				onChange={handleReimportFileChange}
			/>

			{/* Inline rename error (shown below the button when name is empty) */}
			{renameError !== null && (
				<p
					role="alert"
					className="absolute right-0 mt-1 w-48 rounded-lg bg-red-900/80 border border-red-700 px-3 py-2 text-xs text-red-200 z-20"
				>
					{renameError}
				</p>
			)}

			{open && (
				<ul className="absolute right-0 mt-1 w-40 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-10 overflow-hidden">
					<MenuItem label="Rename" onClick={handleRename} />
					<MenuItem label="Re-import" onClick={handleReimportClick} />
					<MenuItem label="Delete" onClick={handleDelete} variant="danger" />
				</ul>
			)}
		</div>
	);
}

interface MenuItemProps {
	readonly label: string;
	readonly onClick: () => void;
	readonly variant?: "default" | "danger";
}

function MenuItem({ label, onClick, variant = "default" }: MenuItemProps) {
	const colorClass =
		variant === "danger"
			? "text-red-400 hover:bg-red-900/40"
			: "text-gray-100 hover:bg-gray-700";

	return (
		<li>
			<button
				type="button"
				onClick={onClick}
				className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${colorClass}`}
			>
				{label}
			</button>
		</li>
	);
}
