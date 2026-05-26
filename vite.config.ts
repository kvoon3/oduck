import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";
import UnoCSS from "unocss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
    }),
    UnoCSS(),
    cloudflare(),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        custom: resolve(import.meta.dirname, "custom.html"),
        search: resolve(import.meta.dirname, "search.html"),
      },
    },
  },
});
