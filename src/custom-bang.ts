import type { bangs } from "./bang";

export type Bang = (typeof bangs)[number];
export type BangOrigin = string;

export type CustomBang = Bang & {
  enabled?: boolean;
  origin?: BangOrigin;
  /** Alias: references another bang's t field. When set, all other fields are inherited from the target. */
  a?: string;
};

/** Minimal JSON bang input (used during import/parse). All Bang fields are optional when a is set. */
export interface CustomBangInput {
  t: string;
  c?: string;
  d?: string;
  r?: number;
  s?: string;
  sc?: string;
  u?: string;
  enabled?: boolean;
  origin?: BangOrigin;
  a?: string;
};

export const DEFAULT_CUSTOM_BANG_SOURCE_URL = import.meta.env.DEV
  ? "/oduck.json"
  : "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/oduck.json";

export interface CustomBangSource {
  name: string;
  url: string;
  tags: string[];
}

function resolveAliases(customBangs: CustomBang[], builtinBangs: Bang[]): Bang[] {
  const customByTrigger = new Map<string, CustomBang>();
  for (const b of customBangs) {
    customByTrigger.set(b.t, b);
  }

  const builtinByTrigger = new Map<string, Bang>();
  for (const b of builtinBangs) {
    builtinByTrigger.set(b.t, b);
  }

  const seenT = new Set<string>();
  const resolved: Bang[] = [];

  function resolveSingle(bang: CustomBang, visited: Set<string>): Bang | null {
    if (visited.has(bang.t)) return null;
    visited.add(bang.t);

    if (!bang.a) {
      const { enabled: _enabled, origin: _origin, a: _a, ...rest } = bang;
      return rest as Bang;
    }

    const targetCustom = customByTrigger.get(bang.a);
    if (targetCustom) {
      const resolved = resolveSingle(targetCustom, visited);
      if (!resolved) return null;
      return { ...resolved, t: bang.t };
    }

    const targetBuiltin = builtinByTrigger.get(bang.a);
    if (targetBuiltin) {
      return { ...targetBuiltin, t: bang.t };
    }

    return null;
  }

  for (const b of customBangs) {
    if (b.enabled === false) continue;
    const bang = resolveSingle(b, new Set());
    if (!bang) continue;
    if (seenT.has(bang.t)) continue;
    seenT.add(bang.t);
    resolved.push(bang);
  }

  for (const b of builtinBangs) {
    if (seenT.has(b.t)) continue;
    seenT.add(b.t);
    resolved.push(b);
  }

  return resolved;
}

export function mergeBangs(customBangs: CustomBang[], builtinBangs: Bang[]): Bang[] {
  return resolveAliases(customBangs, builtinBangs);
}

export function parseCustomBangs(value: CustomBangInput[]): CustomBang[] {
  return value.map((bang): CustomBang => ({
    c: bang.c ?? "Custom",
    d: bang.d ?? "",
    r: bang.r ?? 0,
    s: bang.s ?? bang.t,
    sc: bang.sc ?? "Custom",
    t: bang.t.toLowerCase(),
    u: bang.u ? bang.u.replace("%s", "{{{s}}}") : "",
    a: bang.a?.toLowerCase(),
    enabled: bang.enabled,
    origin: bang.origin,
  }));
}

export function normalizeCustomBangSourceUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl, window.location.origin);

  if (url.hostname === "github.com") {
    const [owner, repo, route, ref, ...path] = url.pathname.split("/").filter(Boolean);

    if (owner && repo && (route === "blob" || route === "raw") && ref && path.length > 0) {
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path.join("/")}`;
    }
  }

  return url.toString();
}

export async function loadCustomBangsFromUrl(sourceUrl: string): Promise<CustomBang[]> {
  const response = await fetch(normalizeCustomBangSourceUrl(sourceUrl), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load JSON source (${response.status}).`);
  }

  const bangs: CustomBang[] = await response.json();
  return parseCustomBangs(bangs);
}
