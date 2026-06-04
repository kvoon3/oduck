const RE_LEADING_BANG_MARKER = /^[!！]/;

export interface ParsedBangQuery {
  marker: string | null;
  bang: string;
  cleanQuery: string;
  start: number;
  end: number;
}

export function parseQuery(query: string): ParsedBangQuery {
  const match = /[!！](\S*)/i.exec(query);
  if (!match) {
    return {
      marker: null,
      bang: "",
      cleanQuery: query.trim(),
      start: -1,
      end: -1,
    };
  }

  const start = match.index;
  const end = start + match[0].length;

  return {
    marker: match[0][0],
    bang: match[1].toLowerCase(),
    cleanQuery: `${query.slice(0, start)}${query.slice(end).trimStart()}`.trim(),
    start,
    end,
  };
}

export function stripBangMarker(value: string): string {
  return value.trim().replace(RE_LEADING_BANG_MARKER, "").toLowerCase();
}
