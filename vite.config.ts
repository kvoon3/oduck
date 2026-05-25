import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [VitePWA({
    registerType: "autoUpdate",
  }), cloudflare()],
});