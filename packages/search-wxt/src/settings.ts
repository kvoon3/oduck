export type ShortcutSettings = {
  replaceKey: string;
  newTabKey: string;
};

export const SETTINGS_STORAGE_KEY = "shortcut-settings";

export const DEFAULT_SHORTCUT_SETTINGS: ShortcutSettings = {
  replaceKey: "e",
  newTabKey: "E",
};

export function normalizeShortcutKey(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const chars = Array.from(trimmed);
  return chars[chars.length - 1] ?? fallback;
}

export function parseShortcutSettings(value: unknown): ShortcutSettings {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_SHORTCUT_SETTINGS };
  }

  const record = value as Partial<ShortcutSettings>;
  return {
    replaceKey: normalizeShortcutKey(record.replaceKey, DEFAULT_SHORTCUT_SETTINGS.replaceKey),
    newTabKey: normalizeShortcutKey(record.newTabKey, DEFAULT_SHORTCUT_SETTINGS.newTabKey),
  };
}
