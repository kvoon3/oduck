import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";
import UnoCSS from "unocss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith("oduck-"),
        },
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
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
      output: {
        manualChunks(id) {
          if (id.includes("bangs.ts") || id.includes("/src/bang.ts")) {
            return "bang-data";
          }
          return null;
        },
      },
    },
  },
});
