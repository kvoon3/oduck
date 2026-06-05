import { describe, expect, it } from "vitest";
import { parseCustomBangs, type CustomBang } from "./custom-bang";

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
