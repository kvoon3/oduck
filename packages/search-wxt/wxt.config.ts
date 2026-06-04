import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-vue", "@wxt-dev/unocss"],
  manifest: {
    name: "Oduck Search",
    description: "Fast DuckDuckGo bang redirects",
    permissions: ["storage"],
    omnibox: {
      keyword: "od",
    },
  },
});
