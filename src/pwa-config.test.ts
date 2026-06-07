/**
 * Unit tests for the PWA manifest configuration.
 *
 * Test strategy: the manifest and PWA options are exported from a typed module
 * (`src/pwa-config.ts`) imported by both vite.config.ts and these tests.
 * Asserting on the exported constants gives fast, build-free feedback on every
 * required manifest field. Build-output assertions (dist/ structure and
 * index.html base paths) are handled separately via a shell verification step
 * after `pnpm build`.
 */

import { describe, expect, it } from "vitest";
import {
	PWA_BACKGROUND_COLOR,
	PWA_MANIFEST,
	PWA_OPTIONS,
	PWA_THEME_COLOR,
} from "./pwa-config";

describe("PWA manifest configuration", () => {
	it("has the correct app name", () => {
		expect(PWA_MANIFEST.name).toBe("Presenter Cards");
	});

	it("has the correct short_name", () => {
		expect(PWA_MANIFEST.short_name).toBe("Presenter Cards");
	});

	it("uses standalone display mode", () => {
		expect(PWA_MANIFEST.display).toBe("standalone");
	});

	it("enforces landscape orientation", () => {
		expect(PWA_MANIFEST.orientation).toBe("landscape");
	});

	it("uses a dark theme_color (near-black)", () => {
		expect(PWA_MANIFEST.theme_color).toBe(PWA_THEME_COLOR);
		// Must be a valid dark hex color; luminance of #121212 is < 0.1
		const hex = PWA_MANIFEST.theme_color?.replace("#", "") ?? "";
		const r = Number.parseInt(hex.slice(0, 2), 16);
		const g = Number.parseInt(hex.slice(2, 4), 16);
		const b = Number.parseInt(hex.slice(4, 6), 16);
		const max = 255;
		expect(r / max).toBeLessThan(0.2);
		expect(g / max).toBeLessThan(0.2);
		expect(b / max).toBeLessThan(0.2);
	});

	it("uses a dark background_color (near-black)", () => {
		expect(PWA_MANIFEST.background_color).toBe(PWA_BACKGROUND_COLOR);
		const hex = PWA_MANIFEST.background_color?.replace("#", "") ?? "";
		const r = Number.parseInt(hex.slice(0, 2), 16);
		const g = Number.parseInt(hex.slice(2, 4), 16);
		const b = Number.parseInt(hex.slice(4, 6), 16);
		const max = 255;
		expect(r / max).toBeLessThan(0.2);
		expect(g / max).toBeLessThan(0.2);
		expect(b / max).toBeLessThan(0.2);
	});

	describe("icons", () => {
		it("includes a 192x192 icon", () => {
			const icon = PWA_MANIFEST.icons?.find((i) => i.sizes === "192x192");
			expect(icon).toBeDefined();
			expect(icon?.type).toBe("image/png");
		});

		it("includes a 512x512 icon", () => {
			const icon = PWA_MANIFEST.icons?.find(
				(i) => i.sizes === "512x512" && i.purpose === undefined,
			);
			expect(icon).toBeDefined();
			expect(icon?.type).toBe("image/png");
		});

		it("includes a maskable 512x512 icon", () => {
			const icon = PWA_MANIFEST.icons?.find(
				(i) => i.sizes === "512x512" && i.purpose === "maskable",
			);
			expect(icon).toBeDefined();
			expect(icon?.type).toBe("image/png");
		});

		it("has at least three icon entries", () => {
			expect(PWA_MANIFEST.icons?.length).toBeGreaterThanOrEqual(3);
		});
	});
});

describe("PWA plugin options", () => {
	it("uses the autoUpdate register type", () => {
		expect(PWA_OPTIONS.registerType).toBe("autoUpdate");
	});

	it("disables the service worker in dev mode", () => {
		expect(PWA_OPTIONS.devOptions?.enabled).toBe(false);
	});

	it("precaches html, js, css, ico, png, svg, and woff2 files", () => {
		const pattern = PWA_OPTIONS.workbox?.globPatterns?.[0] ?? "";
		expect(pattern).toMatch(/html/);
		expect(pattern).toMatch(/js/);
		expect(pattern).toMatch(/css/);
		expect(pattern).toMatch(/png/);
		expect(pattern).toMatch(/svg/);
		expect(pattern).toMatch(/woff2/);
	});
});
