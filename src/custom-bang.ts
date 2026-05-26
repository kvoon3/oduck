import type { bangs } from "./bang";

export type Bang = (typeof bangs)[number];
export type CustomBang = Bang & {
  enabled?: boolean;
};

export const DEFAULT_CUSTOM_BANG_SOURCE_URL =
  "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/custom-bang.json";

export interface CustomBangSource {
  url: string;
  tags: string[];
}

export function isBang(value: unknown): value is CustomBang {
  if (!value || typeof value !== "object") return false;

  const bang = value as Record<string, unknown>;
  return (
    typeof bang.c === "string" &&
    typeof bang.d === "string" &&
    typeof bang.r === "number" &&
    typeof bang.s === "string" &&
    typeof bang.sc === "string" &&
    typeof bang.t === "string" &&
    typeof bang.u === "string" &&
    (bang.u.includes("{{{s}}}") || bang.u.includes("%s")) &&
    (bang.enabled === undefined || typeof bang.enabled === "boolean")
  );
}

export function parseCustomBangs(value: unknown): CustomBang[] {
  if (!Array.isArray(value)) {
    throw new Error("Custom bang config must be a JSON array.");
  }

  const invalidIndex = value.findIndex((item) => !isBang(item));
  if (invalidIndex !== -1) {
    throw new Error(`Custom bang at index ${invalidIndex} is invalid.`);
  }

  return value.map((bang) => ({
    ...bang,
    t: bang.t.toLowerCase(),
    u: bang.u.replace("%s", "{{{s}}}"),
  }));
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

  return parseCustomBangs(await response.json());
}
