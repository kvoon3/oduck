import { createApp } from "vue";
import App from "./App.vue";
import "virtual:uno.css";

function getCustomBangs(): string | null {
  try {
    return localStorage.getItem("custom-bangs");
  } catch {
    return null;
  }
}

async function syncToExtensionStorage() {
  const saved = getCustomBangs();
  if (saved) {
    await browser.storage.local.set({ "custom-bangs": saved });
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // Sync localStorage → extension storage on load (keeps background cache fresh)
    void syncToExtensionStorage();

    // Respond to popup / background requests for the latest localStorage data
    const handleMessage = (message: unknown): Promise<{ customBangs: string | null }> | undefined => {
      if (
        typeof message === "object" &&
        message !== null &&
        "type" in message &&
        (message as Record<string, unknown>).type === "get-custom-bangs"
      ) {
        return Promise.resolve({ customBangs: getCustomBangs() });
      }
      return undefined;
    };
    browser.runtime.onMessage.addListener(handleMessage);

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

    ctx.onInvalidated(() => {
      browser.runtime.onMessage.removeListener(handleMessage);
    });
  },
});
