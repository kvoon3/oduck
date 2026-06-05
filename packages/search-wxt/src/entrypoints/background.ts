import { parseQuery, parseCustomBangs, type CustomBang } from "@oduck/ui";

let customBangs: CustomBang[] = [];

function loadFromStorage(saved: unknown) {
  if (saved) {
    customBangs = parseCustomBangs(typeof saved === "string" ? JSON.parse(saved) : saved);
  } else {
    customBangs = [];
  }
}

async function fetchCustomBangsFromActiveTab(): Promise<string | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    const res = await browser.tabs.sendMessage(tab.id, { type: "get-custom-bangs" });
    return res?.customBangs ?? null;
  } catch {
    return null;
  }
}

function encodeBangQuery(query: string): string {
  return encodeURIComponent(query).replace(/%2F/g, "/");
}

function resolveFallbackUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function getRedirectUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parsed = parseQuery(trimmed);
  const bang = customBangs.find((b) => b.t === parsed.bang) ?? null;

  if (bang) {
    if (!parsed.cleanQuery) return `https://${bang.d}`;
    return bang.u.replace("{{{s}}}", encodeBangQuery(parsed.cleanQuery));
  }

  if (!parsed.cleanQuery) return null;
  return resolveFallbackUrl(parsed.cleanQuery);
}

export default defineBackground(() => {
  // Initial load from extension storage (synced by content script on page load)
  void browser.storage.local.get("custom-bangs").then((result) => {
    loadFromStorage(result["custom-bangs"]);
  });

  browser.storage.local.onChanged.addListener((changes) => {
    if (changes["custom-bangs"]) {
      loadFromStorage(changes["custom-bangs"].newValue);
    }
  });

  browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
    // Try to refresh from active tab's content script before responding
    const fresh = await fetchCustomBangsFromActiveTab();
    if (fresh) {
      loadFromStorage(fresh);
    }

    const parsed = parseQuery(text.trim());
    const token = parsed.bang;
    if (!token) {
      suggest([]);
      return;
    }

    const matches = customBangs
      .filter((b) => b.t.startsWith(token))
      .slice(0, 5)
      .map((b) => ({
        content: `!${b.t} ${parsed.cleanQuery}`,
        description: `<match>!${b.t}</match> — ${b.s} (${b.d})`,
      }));

    suggest(matches);
  });

  browser.omnibox.onInputEntered.addListener((text) => {
    const url = getRedirectUrl(text);
    if (url) {
      void browser.tabs.update({ url });
    }
  });
});
