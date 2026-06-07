interface ErrorBannerProps {
	readonly message: string;
	readonly onDismiss: () => void;
}

/**
 * Dismissible error banner displayed above the deck list.
 * Message content is displayed verbatim — callers are responsible for
 * providing a human-readable string (typically from a typed error).
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
	return (
		<div
			role="alert"
			className="mx-6 mb-4 flex items-start gap-3 rounded-xl bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-200"
		>
			<span className="flex-1">{message}</span>
			<button
				type="button"
				aria-label="Dismiss error"
				onClick={onDismiss}
				className="shrink-0 text-red-300 hover:text-red-100 transition-colors"
			>
				✕
			</button>
		</div>
	);
}
