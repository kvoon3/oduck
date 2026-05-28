import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { parseQuery } from "../bang-query";
import type { Bang } from "../custom-bang";

export interface BangMatch {
  bang: Bang | null;
  cleanQuery: string;
  url: string;
}

interface UseBangOptions {
  allBangs: MaybeRefOrGetter<Bang[]>;
  query: MaybeRefOrGetter<string>;
  resolveFallbackUrl?: (query: string) => string;
}

function encodeBangQuery(query: string): string {
  return encodeURIComponent(query).replace(/%2F/g, "/");
}

export function useBang(options: UseBangOptions) {
  const parsedQuery = computed(() => parseQuery(toValue(options.query)));
  const currentToken = computed(() => parsedQuery.value.bang);
  const matchedBang = computed(
    () => toValue(options.allBangs).find((b) => b.t === currentToken.value) ?? null,
  );
  const cleanQuery = computed(() => parsedQuery.value.cleanQuery);

  const match = computed<BangMatch>(() => {
    const rawQuery = toValue(options.query).trim();
    if (!rawQuery) return { bang: null, cleanQuery: "", url: "" };

    const bang = matchedBang.value;
    const query = cleanQuery.value;

    if (!bang) {
      return {
        bang: null,
        cleanQuery: query,
        url: query ? options.resolveFallbackUrl?.(query) ?? "" : "",
      };
    }

    if (!query) return { bang, cleanQuery: "", url: `https://${bang.d}` };

    return {
      bang,
      cleanQuery: query,
      url: bang.u.replace("{{{s}}}", encodeBangQuery(query)),
    };
  });

  function createQueryWithBang(bang: Bang): string {
    const query = toValue(options.query);
    const parsed = parseQuery(query);
    if (!parsed.marker) return query;

    const before = query.slice(0, parsed.start);
    const after = query.slice(parsed.end).trimStart();
    return `${before}${parsed.marker}${bang.t} ${after}`;
  }

  return {
    cleanQuery,
    createQueryWithBang,
    currentToken,
    match,
    matchedBang,
    parsedQuery,
  };
}
