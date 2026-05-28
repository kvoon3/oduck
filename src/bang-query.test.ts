import { describe, expect, it } from "vitest";
import { parseQuery, stripBangMarker } from "./bang-query";

describe("parseQuery", () => {
  it("parses half-width bang queries", () => {
    expect(parseQuery("!gh vuejs/core")).toEqual({
      marker: "!",
      bang: "gh",
      cleanQuery: "vuejs/core",
      start: 0,
      end: 3,
    });
  });

  it("parses full-width bang queries", () => {
    expect(parseQuery("！gh vuejs/core")).toEqual({
      marker: "！",
      bang: "gh",
      cleanQuery: "vuejs/core",
      start: 0,
      end: 3,
    });
  });

  it("removes a bang token from the middle of the query", () => {
    expect(parseQuery("vue ！gh core").cleanQuery).toBe("vue core");
  });

  it("returns a plain query when no bang marker exists", () => {
    expect(parseQuery(" vuejs core ")).toEqual({
      marker: null,
      bang: "",
      cleanQuery: "vuejs core",
      start: -1,
      end: -1,
    });
  });
});

describe("stripBangMarker", () => {
  it("strips either bang marker only from the start", () => {
    expect(stripBangMarker("!GH")).toBe("gh");
    expect(stripBangMarker("！GH")).toBe("gh");
    expect(stripBangMarker("G!H")).toBe("g!h");
  });
});
