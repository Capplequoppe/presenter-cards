import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { DeckRepository } from "../../application/ports/deck-repository";
import { DeckNotFoundError } from "../../application/ports/deck-repository";
import type { Deck, DeckSettings, Layout } from "../../domain";
import { createSlide, reconstituteDeck } from "../../domain";
import { StorageError } from "./storage-error";

/**
 * Database name and version are constants to document the migration contract:
 *   - Bump DB_VERSION when adding/changing stores or indexes.
 *   - Add a migration block in openDB's `upgrade` callback for the new version.
 */
const DB_NAME = "presenter-cards";
const DB_VERSION = 1;

/**
 * Store name for deck aggregates.
 * Primary key is the deck id (string).
 */
const DECKS_STORE = "decks";

/**
 * JSON-safe representation of a slide as stored in IndexedDB.
 * isBilingual is a derived field recomputed via createSlide on read.
 */
interface PersistedSlide {
	readonly title?: string;
	readonly textEn: string;
	readonly textIt?: string;
	readonly notes?: string;
	readonly durationMinutes?: number;
	readonly speaker?: string;
}

/**
 * JSON-safe representation of DeckSettings as stored in IndexedDB.
 */
interface PersistedSettings {
	readonly layout: Layout;
	readonly fontScale: number;
}

/**
 * JSON-safe representation of a Deck aggregate as stored in IndexedDB.
 * The deck id is also the IndexedDB key (keyPath: "id").
 */
interface PersistedDeck {
	readonly id: string;
	readonly name: string;
	readonly settings: PersistedSettings;
	readonly slides: ReadonlyArray<PersistedSlide>;
	readonly importedAt: number;
}

/**
 * Typed idb schema for the presenter-cards database.
 * Extend this interface and bump DB_VERSION when adding stores or indexes.
 */
interface PresenterCardsDbSchema extends DBSchema {
	decks: {
		key: string;
		value: PersistedDeck;
	};
}

/** Factory type for opening the underlying database. Injectable for tests. */
export type DbFactory = (
	name: string,
) => Promise<IDBPDatabase<PresenterCardsDbSchema>>;

function toPersisted(deck: Deck): PersistedDeck {
	return {
		id: deck.id,
		name: deck.name,
		settings: {
			layout: deck.settings.layout,
			fontScale: deck.settings.fontScale,
		},
		slides: deck.slides.map((s) => ({
			title: s.title,
			textEn: s.textEn,
			textIt: s.textIt,
			notes: s.notes,
			durationMinutes: s.durationMinutes,
			speaker: s.speaker,
		})),
		importedAt: deck.importedAt,
	};
}

function fromPersisted(record: PersistedDeck): Deck {
	const slides = record.slides.map((s) => createSlide(s));
	const settings: DeckSettings = {
		layout: record.settings.layout,
		fontScale: record.settings.fontScale,
	};
	return reconstituteDeck({
		id: record.id,
		name: record.name,
		settings,
		slides,
		importedAt: record.importedAt,
	});
}

function defaultDbFactory(
	dbName: string,
): Promise<IDBPDatabase<PresenterCardsDbSchema>> {
	return openDB<PresenterCardsDbSchema>(dbName, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(DECKS_STORE)) {
				db.createObjectStore(DECKS_STORE, { keyPath: "id" });
			}
		},
	});
}

/**
 * IndexedDB-backed implementation of DeckRepository.
 *
 * Schema:
 *   database: "presenter-cards"  version: 1
 *   store:    "decks"            key: deck id (string, keyPath: "id")
 *
 * Serialization: Deck → PersistedDeck (plain JSON object).
 * Reconstruction: PersistedDeck → Deck via reconstituteDeck + createSlide,
 * preserving user-modified settings (layout, fontScale) without re-inference.
 *
 * All IndexedDB failures are wrapped in StorageError and re-thrown so that
 * callers receive a typed infrastructure error rather than an unhandled
 * IDBRequest rejection.
 */
export class IndexedDbDeckRepository implements DeckRepository {
	private readonly dbName: string;
	private readonly dbFactory: DbFactory;
	private db: IDBPDatabase<PresenterCardsDbSchema> | null = null;

	/**
	 * @param dbName    - Defaults to "presenter-cards". Override in tests to
	 *   isolate each suite (pass a unique name per describe block).
	 * @param dbFactory - Defaults to the real idb openDB. Injectable for tests
	 *   that need to simulate storage failures without ESM module patching.
	 */
	constructor(
		dbName: string = DB_NAME,
		dbFactory: DbFactory = defaultDbFactory,
	) {
		this.dbName = dbName;
		this.dbFactory = dbFactory;
	}

	private async getDb(): Promise<IDBPDatabase<PresenterCardsDbSchema>> {
		if (this.db === null) {
			try {
				this.db = await this.dbFactory(this.dbName);
			} catch (cause) {
				throw new StorageError("Failed to open IndexedDB database", cause);
			}
		}
		return this.db;
	}

	async save(deck: Deck): Promise<void> {
		const db = await this.getDb();
		try {
			await db.put(DECKS_STORE, toPersisted(deck));
		} catch (cause) {
			throw new StorageError(`Failed to save deck ${deck.id}`, cause);
		}
	}

	async findById(id: string): Promise<Deck> {
		const db = await this.getDb();
		let record: PersistedDeck | undefined;
		try {
			record = await db.get(DECKS_STORE, id);
		} catch (cause) {
			throw new StorageError(`Failed to find deck ${id}`, cause);
		}
		if (record === undefined) {
			throw new DeckNotFoundError(id);
		}
		return fromPersisted(record);
	}

	async listAll(): Promise<Deck[]> {
		const db = await this.getDb();
		let records: PersistedDeck[];
		try {
			records = await db.getAll(DECKS_STORE);
		} catch (cause) {
			throw new StorageError("Failed to list decks", cause);
		}
		return records.map(fromPersisted);
	}

	async deleteById(id: string): Promise<void> {
		const db = await this.getDb();
		// Verify existence before deleting (IDB delete is a no-op for missing keys).
		const record = await (async () => {
			try {
				return await db.get(DECKS_STORE, id);
			} catch (cause) {
				throw new StorageError(`Failed to find deck ${id} for deletion`, cause);
			}
		})();
		if (record === undefined) {
			throw new DeckNotFoundError(id);
		}
		try {
			await db.delete(DECKS_STORE, id);
		} catch (cause) {
			throw new StorageError(`Failed to delete deck ${id}`, cause);
		}
	}
}
