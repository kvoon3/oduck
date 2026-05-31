import type { bangs } from "./bang";

export type Bang = (typeof bangs)[number];
export type BangOrigin = string;

export type CustomBang = Bang & {
  enabled?: boolean;
  origin?: BangOrigin;
};

export const DEFAULT_CUSTOM_BANG_SOURCE_URL = import.meta.env.DEV
  ? "/oduck.json"
  : "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/oduck.json";

export interface CustomBangSource {
  name: string;
  url: string;
  tags: string[];
}

export function mergeBangs(customBangs: CustomBang[], builtinBangs: Bang[]): Bang[] {
  const seen = new Set<string>();
  const result: Bang[] = [];

  for (const b of customBangs) {
    if (b.enabled === false) continue;
    if (seen.has(b.u)) continue;
    seen.add(b.u);
    const { enabled: _enabled, origin: _origin, ...bang } = b;
    result.push(bang);
  }

  for (const b of builtinBangs) {
    if (seen.has(b.u)) continue;
    seen.add(b.u);
    result.push(b);
  }

  return result;
}

export function parseCustomBangs(value: CustomBang[]): CustomBang[] {
  return value.map((bang) =>
    Object.assign({}, bang, {
      t: bang.t.toLowerCase(),
      u: bang.u.replace("%s", "{{{s}}}"),
    }),
  );
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
