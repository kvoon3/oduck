import { createApp } from "vue";
import App from "./App.vue";
import "virtual:uno.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "oduck-search",
      position: "overlay",
      anchor: "body",
      onMount(container) {
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove(app) {
        app?.unmount();
      },
    });

    ui.mount();
  },
});
