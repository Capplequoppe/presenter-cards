import { describe, expect, it } from "vitest";
import { CsvParseError, CsvParseErrorKind } from "../../application/ports";
import { PapaParseDeckCsvParser } from "./papa-parse-deck-csv-parser";

const parser = new PapaParseDeckCsvParser();

describe("PapaParseDeckCsvParser", () => {
	describe("full-featured CSV", () => {
		it("parses all columns into correct slides in order", async () => {
			const csv = [
				"title,text_en,text_it,notes,duration_minutes,speaker",
				'"Welcome","Welcome everyone!","Benvenuti a tutti!","Smile & pause",2,Alice',
				'"Agenda","Here is the agenda.","Ecco l\'agenda.","",3,Bob',
			].join("\n");

			const result = await parser.parse(csv, "my-deck");

			expect(result.name).toBe("my-deck");
			expect(result.slides).toHaveLength(2);

			const [s1, s2] = result.slides;

			expect(s1.title).toBe("Welcome");
			expect(s1.textEn).toBe("Welcome everyone!");
			expect(s1.textIt).toBe("Benvenuti a tutti!");
			expect(s1.notes).toBe("Smile & pause");
			expect(s1.durationMinutes).toBe(2);
			expect(s1.speaker).toBe("Alice");

			expect(s2.title).toBe("Agenda");
			expect(s2.textEn).toBe("Here is the agenda.");
			expect(s2.textIt).toBe("Ecco l'agenda.");
			expect(s2.notes).toBeUndefined();
			expect(s2.durationMinutes).toBe(3);
			expect(s2.speaker).toBe("Bob");
		});

		it("parses multi-line quoted cells into single field values", async () => {
			const csv = [
				"text_en,text_it",
				'"Line one\nLine two","Prima linea\nSeconda linea"',
			].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].textEn).toBe("Line one\nLine two");
			expect(result.slides[0].textIt).toBe("Prima linea\nSeconda linea");
		});

		it("parses cells containing commas inside quotes", async () => {
			const csv = ["text_en", '"Hello, world, and everyone"'].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].textEn).toBe("Hello, world, and everyone");
		});

		it("parses cells containing escaped double quotes", async () => {
			const csv = ["text_en", '"He said ""hello"""'].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].textEn).toBe('He said "hello"');
		});
	});

	describe("minimal CSV (text_en only)", () => {
		it("creates slides from a CSV with only text_en column", async () => {
			const csv = ["text_en", "Hello world", "Goodbye world"].join("\n");

			const result = await parser.parse(csv, "my-deck");

			expect(result.slides).toHaveLength(2);
			expect(result.slides[0].textEn).toBe("Hello world");
			expect(result.slides[1].textEn).toBe("Goodbye world");
			expect(result.slides[0].title).toBeUndefined();
			expect(result.slides[0].durationMinutes).toBeUndefined();
		});
	});

	describe("case-insensitive headers", () => {
		it("recognizes mixed/upper-case column names like Text_EN", async () => {
			const csv = ["Title,Text_EN,Text_IT", "Welcome,Hello,Ciao"].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].title).toBe("Welcome");
			expect(result.slides[0].textEn).toBe("Hello");
			expect(result.slides[0].textIt).toBe("Ciao");
		});

		it("recognizes all-uppercase DURATION_MINUTES", async () => {
			const csv = ["TEXT_EN,DURATION_MINUTES", "Hello,5"].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].durationMinutes).toBe(5);
		});
	});

	describe("missing text_en column", () => {
		it("throws UnrecognizedHeader error listing found vs required columns", async () => {
			const csv = ["title,notes,speaker", "Welcome,Smile,Alice"].join("\n");

			await expect(parser.parse(csv, "deck")).rejects.toSatisfy(
				(e: unknown) =>
					e instanceof CsvParseError &&
					e.kind === CsvParseErrorKind.UnrecognizedHeader,
			);
		});

		it("error message mentions the required column text_en", async () => {
			const csv = ["title,notes", "Welcome,Smile"].join("\n");

			let caught: CsvParseError | undefined;
			try {
				await parser.parse(csv, "deck");
			} catch (e) {
				caught = e as CsvParseError;
			}

			expect(caught?.message).toContain("text_en");
		});

		it("error message lists the found columns", async () => {
			const csv = ["title,notes", "Welcome,Smile"].join("\n");

			let caught: CsvParseError | undefined;
			try {
				await parser.parse(csv, "deck");
			} catch (e) {
				caught = e as CsvParseError;
			}

			expect(caught?.message).toContain("title");
			expect(caught?.message).toContain("notes");
		});
	});

	describe("empty text_en in data rows", () => {
		it("throws EmptyTextEn error naming the offending row numbers", async () => {
			const csv = ["text_en", "Valid row 1", "", "Valid row 3", "   "].join(
				"\n",
			);

			await expect(parser.parse(csv, "deck")).rejects.toSatisfy(
				(e: unknown) =>
					e instanceof CsvParseError &&
					e.kind === CsvParseErrorKind.EmptyTextEn &&
					JSON.stringify(e.rows) === JSON.stringify([2, 4]),
			);
		});

		it("error message includes the offending row numbers", async () => {
			const csv = ["text_en", "Valid row 1", "", "Valid row 3", "   "].join(
				"\n",
			);

			let caught: CsvParseError | undefined;
			try {
				await parser.parse(csv, "deck");
			} catch (e) {
				caught = e as CsvParseError;
			}

			expect(caught?.message).toContain("2");
			expect(caught?.message).toContain("4");
		});
	});

	describe("empty or header-only file", () => {
		it("throws an error for a completely empty file", async () => {
			await expect(parser.parse("", "deck")).rejects.toBeInstanceOf(
				CsvParseError,
			);
		});

		it("throws EmptyFile kind for a completely empty file", async () => {
			await expect(parser.parse("", "deck")).rejects.toSatisfy(
				(e: unknown) =>
					e instanceof CsvParseError && e.kind === CsvParseErrorKind.EmptyFile,
			);
		});

		it("throws an error for a header-only file (no data rows)", async () => {
			const csv = "text_en";

			await expect(parser.parse(csv, "deck")).rejects.toBeInstanceOf(
				CsvParseError,
			);
		});

		it("error message mentions no slides for header-only file", async () => {
			const csv = "text_en";

			let caught: CsvParseError | undefined;
			try {
				await parser.parse(csv, "deck");
			} catch (e) {
				caught = e as CsvParseError;
			}

			expect(caught?.message.toLowerCase()).toContain("slide");
		});
	});

	describe("non-numeric duration_minutes", () => {
		it("throws InvalidDuration error with the row number", async () => {
			const csv = ["text_en,duration_minutes", "Hello,not-a-number"].join("\n");

			await expect(parser.parse(csv, "deck")).rejects.toSatisfy(
				(e: unknown) =>
					e instanceof CsvParseError &&
					e.kind === CsvParseErrorKind.InvalidDuration &&
					(e.rows?.includes(1) ?? false),
			);
		});

		it("error message mentions the row number and the bad value", async () => {
			const csv = ["text_en,duration_minutes", "Hello,not-a-number"].join("\n");

			let caught: CsvParseError | undefined;
			try {
				await parser.parse(csv, "deck");
			} catch (e) {
				caught = e as CsvParseError;
			}

			expect(caught?.message).toContain("1");
		});
	});

	describe("BOM-prefixed file", () => {
		it("parses a UTF-8 BOM-prefixed CSV correctly", async () => {
			const bom = "﻿";
			const csv = `${bom}text_en\nHello BOM world`;

			const result = await parser.parse(csv, "deck");

			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].textEn).toBe("Hello BOM world");
		});
	});

	describe("unknown extra columns", () => {
		it("ignores unknown columns without throwing", async () => {
			const csv = [
				"text_en,unknown_column,another_extra",
				"Hello,ignored_value,also_ignored",
			].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides).toHaveLength(1);
			expect(result.slides[0].textEn).toBe("Hello");
		});
	});

	describe("trailing blank lines", () => {
		it("ignores trailing blank lines and does not treat them as invalid rows", async () => {
			const csv = ["text_en", "Hello", "World", "", ""].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides).toHaveLength(2);
			expect(result.slides[0].textEn).toBe("Hello");
			expect(result.slides[1].textEn).toBe("World");
		});

		it("ignores trailing blank lines even with multiple columns", async () => {
			const csv = ["text_en,title", "Hello,Welcome", "", ""].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides).toHaveLength(1);
		});
	});

	describe("blank optional fields", () => {
		it("normalizes blank optional fields to undefined", async () => {
			const csv = ["title,text_en,text_it,notes,speaker", ",Hello,,,"].join(
				"\n",
			);

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].title).toBeUndefined();
			expect(result.slides[0].textIt).toBeUndefined();
			expect(result.slides[0].notes).toBeUndefined();
			expect(result.slides[0].speaker).toBeUndefined();
		});

		it("blank duration_minutes is treated as absent (undefined)", async () => {
			const csv = ["text_en,duration_minutes", "Hello,"].join("\n");

			const result = await parser.parse(csv, "deck");

			expect(result.slides[0].durationMinutes).toBeUndefined();
		});
	});
});
