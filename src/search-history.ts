export interface SearchHistoryEntry {
  query: string;
  url: string;
  updatedAt: number;
}

const LS_SEARCH_HISTORY = "search-history";
const MAX_SEARCH_HISTORY = 50;

function normalizeEntry(entry: Partial<SearchHistoryEntry>): SearchHistoryEntry | null {
  const query = entry.query?.trim();
  const url = entry.url?.trim();

  if (!query || !url) return null;

  return {
    query,
    url,
    updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : Date.now(),
  };
}

function sortByUpdatedAt(entries: SearchHistoryEntry[]): SearchHistoryEntry[] {
  const sorted: SearchHistoryEntry[] = [];

  for (const entry of entries) {
    const index = sorted.findIndex((item) => item.updatedAt < entry.updatedAt);
    if (index === -1) {
      sorted.push(entry);
    } else {
      sorted.splice(index, 0, entry);
    }
  }

  return sorted;
}

export function parseSearchHistory(value: unknown): SearchHistoryEntry[] {
  if (!Array.isArray(value)) return [];

  const entries = value
    .map((entry) => normalizeEntry(entry))
    .filter((entry): entry is SearchHistoryEntry => entry !== null);

  return sortByUpdatedAt(entries).slice(0, MAX_SEARCH_HISTORY);
}

export function getSearchHistory(): SearchHistoryEntry[] {
  const saved = localStorage.getItem(LS_SEARCH_HISTORY);
  if (!saved) return [];

  try {
    return parseSearchHistory(JSON.parse(saved));
  } catch {
    return [];
  }
}

export function setSearchHistory(history: SearchHistoryEntry[]) {
  localStorage.setItem(LS_SEARCH_HISTORY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)));
}

export function addSearchHistory(entry: Pick<SearchHistoryEntry, "query" | "url">): SearchHistoryEntry[] {
  const normalized = normalizeEntry({ ...entry, updatedAt: Date.now() });
  if (!normalized) return getSearchHistory();

  const next = [
    normalized,
    ...getSearchHistory().filter((item) => item.url !== normalized.url && item.query !== normalized.query),
  ].slice(0, MAX_SEARCH_HISTORY);

  setSearchHistory(next);
  return next;
}
