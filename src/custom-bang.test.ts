import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDefaultBangs, parseCustomBangs, type CustomBang } from "./custom-bang";

describe("parseCustomBangs", () => {
  it("lowercases single alias", () => {
    const input: CustomBang[] = [
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "c", u: "https://x.com?q={{{s}}}", a: "ChatGPT" },
    ];
    expect(parseCustomBangs(input)[0].a).toEqual(["chatgpt"]);
  });

  it("lowercases alias array", () => {
    const input: CustomBang[] = [
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "c", u: "", a: ["ChatGPT", "GH"] },
    ];
    expect(parseCustomBangs(input)[0].a).toEqual(["chatgpt", "gh"]);
  });

  it("leaves u empty for alias-only bangs", () => {
    const input: CustomBang[] = [
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "c", u: "", a: "chatgpt" },
    ];
    expect(parseCustomBangs(input)[0].u).toBe("");
  });
});

describe("fetchDefaultBangs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("merges sources and keeps the first duplicate bang", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => ({
      ok: true,
      json: async () =>
        path === "/oduck.json"
          ? [{ t: "pi", d: "pi.dev", u: "https://pi.dev/packages?name={{{s}}}" }]
          : [
              { t: "pi", d: "protonmail.com", u: "https://protonmail.com {{{s}}}" },
              { t: "g", d: "google.com", u: "https://www.google.com/search?q={{{s}}}" },
            ],
    })));

    const bangs = await fetchDefaultBangs(["/oduck.json", "/unduck.json"]);
    expect(bangs).toHaveLength(2);
    expect(bangs.find(b => b.t === "pi")?.d).toBe("pi.dev");
    expect(bangs.find(b => b.t === "g")?.d).toBe("google.com");
  });

  it("skips sources that fail to load", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) =>
      path === "/bad.json"
        ? { ok: false, status: 404 }
        : { ok: true, json: async () => [{ t: "g", u: "https://www.google.com/search?q={{{s}}}" }] },
    ));

    const bangs = await fetchDefaultBangs(["/bad.json", "/ok.json"]);
    expect(bangs).toHaveLength(1);
    expect(bangs[0].t).toBe("g");
  });

  it("returns an empty list when every source fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    expect(await fetchDefaultBangs(["/a.json", "/b.json"])).toEqual([]);
  });
});
