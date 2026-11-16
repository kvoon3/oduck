export type { Bang } from "@oduck/ui";
export type BangOrigin = string;

export type CustomBang = import("@oduck/ui").Bang & {
  enabled?: boolean;
  origin?: BangOrigin;
  a?: string | string[];
};

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
  a?: string | string[];
}

export const DEFAULT_CUSTOM_BANG_SOURCE_URL = import.meta.env.DEV
  ? "/oduck.json"
  : "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/oduck.json";

export interface CustomBangSource {
  name: string;
  url: string;
  tags: string[];
}

import { toArray } from '@antfu/utils';

function normalizeA(a: string | string[] | undefined): string[] | undefined {
  const arr = toArray(a).filter(Boolean);
  return arr.length > 0 ? arr.map((v) => v.toLowerCase()) : undefined;
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
    a: bang.a != null ? normalizeA(bang.a) : undefined,
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

/**
 * Default bang sources shipped with the site (served from /public).
 * Oduck presets come first so they win over the unduck set on duplicate keys.
 */
export const DEFAULT_BANG_SOURCE_PATHS = [
  "/oduck.json",
  "/unduck.json",
] as const;

/**
 * Load the default bangs for browsers that have no saved bangs yet, so
 * `?q=!bang query` redirects work out of the box. Sources that fail to load
 * are skipped; duplicates are removed keeping the first occurrence.
 */
export async function fetchDefaultBangs(
  sourcePaths: readonly string[] = DEFAULT_BANG_SOURCE_PATHS,
): Promise<CustomBang[]> {
  const settled = await Promise.allSettled(sourcePaths.map(async (path) => {
    const response = await fetch(path);
    if (!response.ok)
      throw new Error(`Failed to load default bang source ${path} (${response.status}).`);
    return parseCustomBangs(await response.json());
  }));

  const seen = new Set<string>();
  const bangs: CustomBang[] = [];
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const bang of result.value) {
      if (seen.has(bang.t)) continue;
      seen.add(bang.t);
      bangs.push(bang);
    }
  }
  return bangs;
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
