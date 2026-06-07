import { describe, expect, it } from "vitest";
import { toggleLanguage } from "./language";

describe("toggleLanguage", () => {
	it("toggles en to it", () => {
		expect(toggleLanguage("en")).toBe("it");
	});

	it("toggles it to en", () => {
		expect(toggleLanguage("it")).toBe("en");
	});

	it("round-trips en→it→en", () => {
		expect(toggleLanguage(toggleLanguage("en"))).toBe("en");
	});
});
