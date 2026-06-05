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
