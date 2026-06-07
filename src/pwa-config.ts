/**
 * Typed PWA manifest and plugin configuration.
 *
 * Exported from a separate module so that vite.config.ts and Vitest unit
 * tests share a single source of truth — tests assert on these values rather
 * than on generated build output, giving fast feedback without requiring a
 * full build in CI.
 *
 * Build-output assertions (index.html base path, manifest in dist/) are
 * handled by a shell-level check in the test suite that runs after
 * `pnpm build`.
 */

import type { ManifestOptions, VitePWAOptions } from "vite-plugin-pwa";

/** Dark near-black matching the shell background (#121212). */
export const PWA_THEME_COLOR = "#121212" as const;

/** Same value used for both theme_color and background_color. */
export const PWA_BACKGROUND_COLOR = "#121212" as const;

export const PWA_MANIFEST: Partial<ManifestOptions> = {
	name: "Presenter Cards",
	short_name: "Presenter Cards",
	description: "Offline presenter prompt cards for bilingual toastmasters.",
	display: "standalone",
	orientation: "landscape",
	theme_color: PWA_THEME_COLOR,
	background_color: PWA_BACKGROUND_COLOR,
	start_url: "/presenter-cards/",
	scope: "/presenter-cards/",
	lang: "en",
	icons: [
		{
			src: "icons/icon-192.png",
			sizes: "192x192",
			type: "image/png",
		},
		{
			src: "icons/icon-512.png",
			sizes: "512x512",
			type: "image/png",
		},
		{
			src: "icons/icon-512-maskable.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "maskable",
		},
	],
};

/**
 * Full vite-plugin-pwa options shared between vite.config.ts and tests.
 *
 * `devOptions.enabled: false` keeps the service worker inert in dev mode to
 * avoid stale-cache interference during development.
 */
export const PWA_OPTIONS: Partial<VitePWAOptions> = {
	registerType: "autoUpdate",
	devOptions: {
		enabled: false,
	},
	workbox: {
		globPatterns: ["**/*.{html,js,css,ico,png,svg,woff2}"],
	},
	manifest: PWA_MANIFEST,
};
