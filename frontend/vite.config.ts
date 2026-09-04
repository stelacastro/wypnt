import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Telegram's in-app browser is picky about relative asset paths when the
// Mini App is served from a sub-path (e.g. GitHub Pages). `base: "./"`
// keeps built asset URLs relative so it works from any host.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow LAN/tunnel access for testing inside Telegram
    port: 5173,
  },
});
