import { describe, expect, it } from "vitest";
import { mergeBangs, parseCustomBangs, type CustomBang, type Bang } from "./custom-bang";

const builtinBangs: Bang[] = [
  {
    c: "AI",
    d: "www.t3.chat",
    r: 0,
    s: "T3 Chat",
    sc: "AI",
    t: "t3",
    u: "https://www.t3.chat/new?q={{{s}}}",
  },
  {
    c: "Online Services",
    d: "github.com",
    r: 0,
    s: "GitHub",
    sc: "Code",
    t: "gh",
    u: "https://github.com/search?q={{{s}}}",
  },
  {
    c: "AI",
    d: "chatgpt.com",
    r: 100,
    s: "ChatGPT",
    sc: "AI",
    t: "chatgpt",
    u: "https://chatgpt.com/?q={{{s}}}",
  },
];

describe("parseCustomBangs", () => {
  it("lowercases alias field", () => {
    const input: CustomBang[] = [
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "c", u: "https://x.com?q={{{s}}}", a: "ChatGPT" },
    ];
    expect(parseCustomBangs(input)[0].a).toBe("chatgpt");
  });

  it("leaves u empty for alias-only bangs", () => {
    const input: CustomBang[] = [
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "c", u: "", a: "chatgpt" },
    ];
    expect(parseCustomBangs(input)[0].u).toBe("");
  });
});

describe("mergeBangs with aliases", () => {
  it("resolves alias to a custom bang", () => {
    const custom: CustomBang[] = [
      { c: "AI", d: "chatgpt.com", r: 0, s: "ChatGPT", sc: "AI", t: "chatgpt", u: "https://chatgpt.com/?q={{{s}}}", enabled: true },
      { c: "AI", d: "chatgpt.com", r: 0, s: "ChatGPT", sc: "AI", t: "c", u: "https://chatgpt.com/?q={{{s}}}", enabled: true, a: "chatgpt" },
    ];

    const merged = mergeBangs(custom, builtinBangs);
    const cAlias = merged.find((b) => b.t === "c");
    expect(cAlias).toBeDefined();
    expect(cAlias!.u).toBe("https://chatgpt.com/?q={{{s}}}");
    expect(cAlias!.d).toBe("chatgpt.com");
    expect(cAlias!.s).toBe("ChatGPT");
  });

  it("resolves alias to a built-in bang", () => {
    const custom: CustomBang[] = [
      { c: "AI", d: "emptydomain.com", r: 0, s: "C", sc: "AI", t: "c", u: "", enabled: true, a: "chatgpt" },
    ];

    const merged = mergeBangs(custom, builtinBangs);
    const cAlias = merged.find((b) => b.t === "c");
    expect(cAlias).toBeDefined();
    expect(cAlias!.u).toBe("https://chatgpt.com/?q={{{s}}}");
    expect(cAlias!.s).toBe("ChatGPT");
    // the original chatgpt should still exist
    const chatgpt = merged.find((b) => b.t === "chatgpt");
    expect(chatgpt).toBeDefined();
  });

  it("skips alias whose target does not exist", () => {
    const custom: CustomBang[] = [
      { c: "AI", d: "emptydomain.com", r: 0, s: "C", sc: "AI", t: "c", u: "", enabled: true, a: "nonexistent" },
    ];

    const merged = mergeBangs(custom, builtinBangs);
    expect(merged.find((b) => b.t === "c")).toBeUndefined();
  });

  it("detects circular aliases and skips them", () => {
    const custom: CustomBang[] = [
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "a", u: "https://x.com?q={{{s}}}", enabled: true, a: "b" },
      { c: "X", d: "x.com", r: 0, s: "X", sc: "X", t: "b", u: "https://x.com?q={{{s}}}", enabled: true, a: "a" },
    ];

    const merged = mergeBangs(custom, builtinBangs);
    expect(merged.find((b) => b.t === "a")).toBeUndefined();
    expect(merged.find((b) => b.t === "b")).toBeUndefined();
  });

  it("disabled alias is excluded", () => {
    const custom: CustomBang[] = [
      { c: "AI", d: "emptydomain.com", r: 0, s: "C", sc: "AI", t: "c", u: "", enabled: false, a: "chatgpt" },
    ];

    const merged = mergeBangs(custom, builtinBangs);
    expect(merged.find((b) => b.t === "c")).toBeUndefined();
  });

  it("deduplicates by trigger when custom overrides builtin", () => {
    const custom: CustomBang[] = [
      { c: "AI", d: "custom-chatgpt.com", r: 0, s: "Custom ChatGPT", sc: "AI", t: "chatgpt", u: "https://custom-chatgpt.com/?q={{{s}}}", enabled: true },
    ];

    const merged = mergeBangs(custom, builtinBangs);
    // custom bang overrides builtin with same trigger
    const chatgptBangs = merged.filter((b) => b.t === "chatgpt");
    expect(chatgptBangs.length).toBe(1);
    expect(chatgptBangs[0].u).toBe("https://custom-chatgpt.com/?q={{{s}}}");
  });
});
