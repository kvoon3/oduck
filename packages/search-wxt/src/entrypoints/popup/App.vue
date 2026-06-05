<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { bangs, type Bang, mergeBangs, parseCustomBangs } from "@oduck/ui";
import type { CustomBang } from "@oduck/ui";

const customBangs = ref<CustomBang[]>([]);
const searchQuery = ref("");

const allBangs = computed<Bang[]>(() => mergeBangs(customBangs.value, bangs));

const filteredBangs = computed(() => {
  if (!searchQuery.value.trim()) return allBangs.value;
  const q = searchQuery.value.trim().toLowerCase();
  return allBangs.value.filter((b) =>
    b.t.toLowerCase().includes(q) ||
    b.s.toLowerCase().includes(q) ||
    (b.sc && b.sc.toLowerCase().includes(q))
  );
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
        {{ filteredBangs.length }} bangs
      </span>
    </div>

    <input
      v-model="searchQuery"
      type="text"
      class="input w-full"
      placeholder="Search bangs..."
    />

    <div class="max-h-80 overflow-auto border border-neutral-200 dark:border-neutral-700 rounded-md">
      <ul v-if="filteredBangs.length" class="list-none p-0 m-0">
        <li
          v-for="bang in filteredBangs"
          :key="bang.t"
          class="flex items-center gap-2 px-3 py-1.5 text-sm border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
        >
          <span class="text-xs text-neutral-500 dark:text-neutral-400 w-16 text-right truncate">
            {{ bang.sc }}
          </span>
          <span class="font-medium text-neutral-800 dark:text-neutral-200">
            !{{ bang.t }}
          </span>
          <span class="text-neutral-500 dark:text-neutral-400 truncate ml-auto text-xs">
            {{ bang.s }}
          </span>
        </li>
      </ul>
      <p v-else class="p-4 text-center text-sm text-neutral-400">
        No bangs match this filter.
      </p>
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
