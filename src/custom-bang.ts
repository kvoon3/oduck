import type { bangs } from "./bang";

export type Bang = (typeof bangs)[number];
export type CustomBang = Bang & {
  enabled?: boolean;
};

const CUSTOM_BANG_URL = "/custom-bang.json";

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

export async function loadCustomBangs(): Promise<CustomBang[]> {
  try {
    const response = await fetch(CUSTOM_BANG_URL, { cache: "no-store" });
    if (!response.ok) return [];

    return parseCustomBangs(await response.json());
  } catch (error) {
    console.warn("Failed to load custom bang config.", error);
    return [];
  }
}
