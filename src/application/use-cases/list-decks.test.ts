import { describe, expect, it } from "vitest";
import { createDeck, createSlide } from "../../domain";
import { FakeDeckRepository } from "../testing";
import { ListDecks } from "./list-decks";

const slide = createSlide({ textEn: "Hello" });

describe("ListDecks", () => {
	it("returns decks ordered most recently imported first", async () => {
		const repo = new FakeDeckRepository();
		const older = createDeck({
			id: "old",
			name: "Old",
			slides: [slide],
			importedAt: 1000,
		});
		const newer = createDeck({
			id: "new",
			name: "New",
			slides: [slide],
			importedAt: 3000,
		});
		const middle = createDeck({
			id: "mid",
			name: "Middle",
			slides: [slide],
			importedAt: 2000,
		});
		await repo.save(older);
		await repo.save(newer);
		await repo.save(middle);

		const useCase = new ListDecks(repo);
		const result = await useCase.execute();

		expect(result[0].id).toBe("new");
		expect(result[1].id).toBe("mid");
		expect(result[2].id).toBe("old");
	});

	it("returns an empty list when the repository is empty", async () => {
		const repo = new FakeDeckRepository();
		const useCase = new ListDecks(repo);
		const result = await useCase.execute();
		expect(result).toEqual([]);
	});
});
