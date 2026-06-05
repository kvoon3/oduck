<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { BangManagePanel, parseCustomBangs } from "@oduck/ui";
import type { CustomBang } from "@oduck/ui";

const customBangs = ref<CustomBang[]>([]);

const allBangs = computed<CustomBang[]>(() => customBangs.value);

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
  void browser.tabs.create({ url: "https://oduck.kvoon.me/custom" });
}

onMounted(() => {
  void loadCustomBangs();
});
</script>

<template>
  <div class="w-[420px] p-4 flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">
    <div class="flex items-center gap-2">
      <span class="i-ph-duck-duotone text-xl text-neutral-600 dark:text-neutral-400" />
      <h1 class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Bangs
      </h1>
      <span class="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
        {{ allBangs.length }} bangs
      </span>
    </div>

    <BangManagePanel
      :bangs="allBangs"
      :sources="[]"
      :resolutions="resolutions"
    >
      <template #actions="">
        <button
          class="btn btn-icon-transparent focus-ring h-9 w-9"
          aria-label="Open Manager"
          @click="openManager"
        >
          <span class="i-ph-gear-duotone text-[18px]" aria-hidden="true" />
        </button>
      </template>
    </BangManagePanel>
  </div>
</template>
