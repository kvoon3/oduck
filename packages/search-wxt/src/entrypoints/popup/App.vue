<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  DEFAULT_SHORTCUT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  normalizeShortcutKey,
  parseShortcutSettings,
  type ShortcutSettings,
} from "../../settings";

const customPageUrl = "https://oduck.kvoon.me/custom";
const settings = ref<ShortcutSettings>({ ...DEFAULT_SHORTCUT_SETTINGS });
const saved = ref(false);

const hasDuplicate = computed(() => settings.value.replaceKey === settings.value.newTabKey);

async function loadSettings() {
  try {
    const result = await browser.storage.local.get(SETTINGS_STORAGE_KEY);
    settings.value = parseShortcutSettings(result[SETTINGS_STORAGE_KEY]);
  } catch {
    settings.value = { ...DEFAULT_SHORTCUT_SETTINGS };
  }
}

async function saveSettings() {
  if (hasDuplicate.value) return;
  await browser.storage.local.set({ [SETTINGS_STORAGE_KEY]: { ...settings.value } });
  saved.value = true;
  window.setTimeout(() => {
    saved.value = false;
  }, 1200);
}

function setShortcut(kind: keyof ShortcutSettings, value: string) {
  settings.value[kind] = normalizeShortcutKey(value, DEFAULT_SHORTCUT_SETTINGS[kind]);
  void saveSettings();
}

async function openCustomPage() {
  await browser.tabs.create({ url: customPageUrl });
}

onMounted(() => {
  void loadSettings();
});
</script>

<template>
  <main class="w-[320px] bg-white p-4 text-neutral-900 dark:bg-[#0a0a0a] dark:text-neutral-100">
    <section class="flex flex-col gap-3">
      <label class="flex items-center justify-between gap-3">
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Current tab</span>
        <input
          :value="settings.replaceKey"
          class="input h-9 w-16 text-center"
          type="text"
          autocomplete="off"
          spellcheck="false"
          aria-label="Current tab shortcut"
          @input="setShortcut('replaceKey', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="flex items-center justify-between gap-3">
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">New tab</span>
        <input
          :value="settings.newTabKey"
          class="input h-9 w-16 text-center"
          type="text"
          autocomplete="off"
          spellcheck="false"
          aria-label="New tab shortcut"
          @input="setShortcut('newTabKey', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <p v-if="hasDuplicate" class="error-text m-0 text-xs">
        Shortcuts must be different.
      </p>
      <p v-else-if="saved" class="m-0 text-xs text-neutral-400 dark:text-neutral-500">
        Saved.
      </p>

      <button class="btn-primary mt-1 w-full py-2" type="button" @click="openCustomPage">
        Custom Page
      </button>
    </section>
  </main>
</template>
