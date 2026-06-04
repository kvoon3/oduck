<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { BangSearch, bangs, mergeBangs, parseCustomBangs, type CustomBang, type Bang } from "@oduck/ui";

const visible = ref(false);
const customBangs = ref<CustomBang[]>([]);

const allBangs = computed<Bang[]>(() => mergeBangs(customBangs.value, bangs));

const isDark = ref(false);

function updateTheme() {
  isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "e" && !visible.value) {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }
    e.preventDefault();
    visible.value = true;
  }

  if (e.key === "Escape" && visible.value) {
    visible.value = false;
  }
}

function onBackdropClick() {
  visible.value = false;
}

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
  updateTheme();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateTheme);
  document.addEventListener("keydown", onKeydown, true);
  void loadCustomBangs();
});

onUnmounted(() => {
  window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", updateTheme);
  document.removeEventListener("keydown", onKeydown, true);
});
</script>

<template>
  <div v-if="visible" :class="['fixed inset-0 z-[2147483647] flex items-start justify-center pt-[15vh]', isDark ? 'dark' : '']"
    @click="onBackdropClick">
    <div class="w-[560px] bg-white dark:bg-neutral-900 rounded-lg shadow-2xl p-6 border border-neutral-200 dark:border-neutral-700"
      @click.stop>
      <div class="flex items-center gap-2 mb-4">
        <span class="i-ph-duck-duotone text-xl text-neutral-600 dark:text-neutral-400" />
        <h1 class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Oduck Search
        </h1>
        <span class="ml-auto text-xs text-neutral-400 dark:text-neutral-600">
          Press <kbd class="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400 font-mono text-[10px]">esc</kbd> to close
        </span>
      </div>
      <BangSearch :all-bangs="allBangs" mode="new-tab" autofocus />
    </div>
  </div>
</template>
