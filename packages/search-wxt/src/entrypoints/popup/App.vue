<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { BangList, bangs, type Bang, mergeBangs, parseCustomBangs } from "@oduck/ui";
import type { CustomBang } from "@oduck/ui";

const customBangs = ref<CustomBang[]>([]);
const emptySet = new Set<string>();

const allBangs = computed<CustomBang[]>(() => {
  const merged = mergeBangs(customBangs.value, bangs);
  for (const b of merged) {
    (b as CustomBang).enabled ??= true;
  }
  return merged as CustomBang[];
});

const resolutions = computed(() => {
  const map: Record<string, string> = {};
  for (const b of allBangs.value) map[b.t] = b.s;
  return map;
});

async function loadCustomBangs() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const res = await browser.tabs.sendMessage(tab.id, { type: "get-custom-bangs" });
      if (res?.customBangs) {
        customBangs.value = parseCustomBangs(JSON.parse(res.customBangs));
        return;
      }
    }
  } catch {
    // fall through
  }

  try {
    const result = await browser.storage.local.get("custom-bangs");
    const saved = result["custom-bangs"];
    if (saved) {
      customBangs.value = parseCustomBangs(typeof saved === "string" ? JSON.parse(saved) : saved);
    }
  } catch {
    // ignore
  }
}

async function openManager() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ? new URL(tab.url).origin + "/custom.html" : "https://oduck.io/custom.html";
    void browser.tabs.create({ url });
  } catch {
    void browser.tabs.create({ url: "https://oduck.io/custom.html" });
  }
}

onMounted(() => {
  void loadCustomBangs();
});
</script>

<template>
  <div class="w-[420px] p-4 flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <span class="i-ph-duck-duotone text-xl text-neutral-600 dark:text-neutral-400" />
      <h1 class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Bangs
      </h1>
      <span class="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
        {{ allBangs.length }} bangs
      </span>
    </div>

    <div class="max-h-80 overflow-auto border border-neutral-200 dark:border-neutral-700 rounded-md">
      <BangList
        :custom-bangs="allBangs"
        :selected-bang-tags="emptySet"
        :resolutions="resolutions"
        height="h-64"
      />
    </div>

    <div class="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
      <button
        class="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
        @click="openManager"
      >
        Open Manager →
      </button>
    </div>
  </div>
</template>
