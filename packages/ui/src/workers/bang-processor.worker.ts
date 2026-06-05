import type { CustomBang, CustomBangInput } from "../types/custom-bang";

function toArray<T>(val: T | T[] | undefined | null): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function normalizeA(a: string | string[] | undefined): string[] | undefined {
  const arr = toArray(a).filter(Boolean);
  return arr.length > 0 ? arr.map((v) => v.toLowerCase()) : undefined;
}

function parseCustomBangs(value: CustomBangInput[]): CustomBang[] {
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

interface ProcessMessage {
  type: "process";
  payload: {
    rawBangs: CustomBangInput[];
    sourceName: string;
    existingBangs: CustomBang[];
    existingSourceTags: string[];
    keepRemote: boolean;
  };
}

globalThis.addEventListener("message", (e: MessageEvent<ProcessMessage>) => {
  const { type, payload } = e.data;
  if (type !== "process") return;

  const perfStart = performance.now();

  const {
    rawBangs,
    sourceName,
    existingBangs,
    existingSourceTags,
    keepRemote,
  } = payload;

  // Step 1: parse incoming bangs
  const parsed = parseCustomBangs(rawBangs).map((b) => {
    b.origin = sourceName;
    return b;
  });

  const newTags = new Set(parsed.map((b) => b.t));

  // Step 2: find conflicts (triggers that exist in other sources/manual)
  const conflicts: { local: CustomBang; remote: CustomBang }[] = [];
  const previousTags = new Set(existingSourceTags);

  for (const bang of parsed) {
    const existing = existingBangs.find((cb) => cb.t === bang.t);
    if (existing && !previousTags.has(existing.t)) {
      conflicts.push({ local: existing, remote: bang });
    }
  }

  // Step 3: merge
  const conflictTriggers = new Set(conflicts.map((c) => c.remote.t));

  const merged = [
    ...existingBangs.filter((bang) => {
      if (previousTags.has(bang.t)) return false;
      if (conflictTriggers.has(bang.t) && keepRemote) return false;
      return true;
    }),
    ...parsed.filter((t) => !conflictTriggers.has(t.t) || keepRemote),
  ];

  const perfEnd = performance.now();

  globalThis.postMessage({
    type: "done",
    result: {
      merged,
      newTags: Array.from(newTags),
      conflicts,
      duration: Math.round(perfEnd - perfStart),
    },
  });
});
