import { bangs, parseQuery, mergeBangs, parseCustomBangs, type Bang, type CustomBang } from "@oduck/ui";

let customBangs: CustomBang[] = [];
let allBangs: Bang[] = bangs;

function syncAllBangs() {
  allBangs = mergeBangs(customBangs, bangs);
}

async function loadStoredBangs() {
  try {
    const result = await browser.storage.local.get("custom-bangs");
    const saved = result["custom-bangs"];
    if (saved) {
      customBangs = parseCustomBangs(typeof saved === "string" ? JSON.parse(saved) : saved);
      syncAllBangs();
    }
  } catch {
    // ignore
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
  const bang = allBangs.find((b) => b.t === parsed.bang) ?? null;

  if (bang) {
    if (!parsed.cleanQuery) return `https://${bang.d}`;
    return bang.u.replace("{{{s}}}", encodeBangQuery(parsed.cleanQuery));
  }

  if (!parsed.cleanQuery) return null;
  return resolveFallbackUrl(parsed.cleanQuery);
}

export default defineBackground(() => {
  void loadStoredBangs();

  browser.storage.local.onChanged.addListener((changes) => {
    if (changes["custom-bangs"]) {
      const saved = changes["custom-bangs"].newValue;
      if (saved) {
        customBangs = parseCustomBangs(typeof saved === "string" ? JSON.parse(saved) : saved);
      } else {
        customBangs = [];
      }
      syncAllBangs();
    }
  });

  browser.omnibox.onInputChanged.addListener((text, suggest) => {
    const parsed = parseQuery(text.trim());
    const token = parsed.bang;
    if (!token) {
      suggest([]);
      return;
    }

    const matches = allBangs
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
