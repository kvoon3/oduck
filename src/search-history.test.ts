import { beforeEach, describe, expect, it, vi } from "vitest";
import { addSearchHistory, getSearchHistory, parseSearchHistory } from "./search-history";

function createLocalStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("search history", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorage());
  });

  it("parses valid entries and ignores invalid entries", () => {
    expect(parseSearchHistory([
      { query: "vue", url: "https://example.com?q=vue", updatedAt: 2 },
      { query: "", url: "https://example.com?q=empty", updatedAt: 3 },
      { query: "react", url: "https://example.com?q=react", updatedAt: 1 },
    ])).toEqual([
      { query: "vue", url: "https://example.com?q=vue", updatedAt: 2 },
      { query: "react", url: "https://example.com?q=react", updatedAt: 1 },
    ]);
  });

  it("deduplicates by query or URL when adding a history entry", () => {
    addSearchHistory({ query: "vue", url: "https://example.com?q=vue" });
    addSearchHistory({ query: "react", url: "https://example.com?q=react" });
    addSearchHistory({ query: "vue", url: "https://example.com?q=vue3" });

    expect(getSearchHistory().map((entry) => entry.query)).toEqual(["vue", "react"]);
    expect(getSearchHistory()[0].url).toBe("https://example.com?q=vue3");
  });
});
