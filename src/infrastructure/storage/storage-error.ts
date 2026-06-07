/**
 * Thrown when an IndexedDB operation fails at the storage layer.
 *
 * Wraps the underlying cause so callers can inspect it if needed, while
 * keeping all IndexedDB-specific details inside the infrastructure layer.
 */
export class StorageError extends Error {
	readonly cause: unknown;

	constructor(message: string, cause: unknown) {
		super(message);
		this.name = "StorageError";
		this.cause = cause;
	}
}
