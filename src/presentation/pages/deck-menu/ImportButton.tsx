interface ImportButtonProps {
	readonly onClick: () => void;
}

/**
 * Blue accent "Import CSV" button shown in the header.
 */
export function ImportButton({ onClick }: ImportButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
		>
			+ Import CSV
		</button>
	);
}
