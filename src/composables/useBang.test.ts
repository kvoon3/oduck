import { describe, expect, it } from "vitest";
import { ref } from "vue";
import type { Bang } from "../custom-bang";
import { useBang } from "./useBang";

const bangs: Bang[] = [
  {
    c: "Online Services",
    d: "github.com",
    r: 0,
    s: "GitHub",
    sc: "Code",
    t: "gh",
    u: "https://github.com/search?q={{{s}}}",
  },
];

describe("useBang", () => {
  it("matches full-width bang queries and resolves target URLs", () => {
    const query = ref("！gh vuejs/core");
    const bang = useBang({ allBangs: bangs, query });

    expect(bang.currentToken.value).toBe("gh");
    expect(bang.matchedBang.value?.t).toBe("gh");
    expect(bang.match.value).toEqual({
      bang: bangs[0],
      cleanQuery: "vuejs/core",
      url: "https://github.com/search?q=vuejs/core",
    });
  });

  it("uses the fallback URL when no bang matches", () => {
    const query = ref("！unknown vuejs/core");
    const bang = useBang({
      allBangs: bangs,
      query,
      resolveFallbackUrl: (cleanQuery) => `https://example.com/search?q=${cleanQuery}`,
    });

    expect(bang.match.value).toEqual({
      bang: null,
      cleanQuery: "vuejs/core",
      url: "https://example.com/search?q=vuejs/core",
    });
  });

  it("keeps the original bang marker when applying autocomplete", () => {
    const query = ref("docs ！g vue");
    const bang = useBang({ allBangs: bangs, query });

    expect(bang.createQueryWithBang(bangs[0])).toBe("docs ！gh vue");
  });
});
