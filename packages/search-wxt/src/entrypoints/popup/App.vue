<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { BangSearch, bangs, type CustomBang, type Bang, mergeBangs, parseCustomBangs } from "@oduck/ui";

const customBangs = ref<CustomBang[]>([]);

const allBangs = computed<Bang[]>(() => mergeBangs(customBangs.value, bangs));

async function loadCustomBangs() {
  try {
    const result = await browser.storage.local.get("custom-bangs");
    const saved = result["custom-bangs"];
    if (!saved) return;
    customBangs.value = parseCustomBangs(typeof saved === "string" ? JSON.parse(saved) : saved);
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadCustomBangs();
});
</script>

<template>
  <div class="w-[420px] p-4">
    <div class="flex items-center gap-2 mb-3">
      <span class="i-ph-duck-duotone text-xl text-neutral-600 dark:text-neutral-400" />
      <h1 class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Oduck Search
      </h1>
    </div>
    <BangSearch :all-bangs="allBangs" mode="new-tab" autofocus />
  </div>
</template>
