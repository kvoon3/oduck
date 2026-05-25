import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";
import UnoCSS from "unocss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
    }),
    UnoCSS(),
    cloudflare(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        custom: resolve(__dirname, "custom.html"),
      },
    },
  },
});
