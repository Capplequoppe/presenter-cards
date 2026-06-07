import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { PWA_OPTIONS } from "./src/pwa-config";

export default defineConfig({
	base: "/presenter-cards/",
	plugins: [react(), tailwindcss(), VitePWA(PWA_OPTIONS)],
});
