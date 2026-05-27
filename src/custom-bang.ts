import type { bangs } from "./bang";

export type Bang = (typeof bangs)[number];
export type BangOrigin = string;

export type CustomBang = Bang & {
  enabled?: boolean;
  origin?: BangOrigin;
};

export const DEFAULT_CUSTOM_BANG_SOURCE_URL =
  "https://raw.githubusercontent.com/kagisearch/bangs/refs/heads/main/data/bangs.json";

export interface CustomBangSource {
  name: string;
  url: string;
  tags: string[];
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
  const url = new URL(sourceUrl);

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
