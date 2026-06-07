<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { BangSearch, parseCustomBangs, type CustomBang } from "@oduck/ui";
import {
  DEFAULT_SHORTCUT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parseShortcutSettings,
  type ShortcutSettings,
} from "../../settings";

const visible = ref(false);
const panelRef = ref<HTMLDivElement | null>(null);
const mode = ref<"replace" | "new-tab">("replace");
const customBangs = ref<CustomBang[]>([]);
const shortcutSettings = ref<ShortcutSettings>({ ...DEFAULT_SHORTCUT_SETTINGS });

const allBangs = computed<CustomBang[]>(() => customBangs.value);

const isDark = ref(false);

function updateTheme() {
  isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

function openSearch(nextMode: "replace" | "new-tab") {
  mode.value = nextMode;
  visible.value = true;
}

function closeSearch() {
  visible.value = false;
}

function onKeydown(e: KeyboardEvent) {
  if (visible.value) {
    if (e.key === "Escape") {
      closeSearch();
      e.stopPropagation();
      return;
    }
    // 搜索框可见时，如果焦点不在面板内，阻止事件传到原网页
    if (!panelRef.value?.contains(e.target as Node)) {
      e.stopImmediatePropagation();
    }
    return;
  }

  if (isEditableTarget(e.target)) {
    return;
  }

  if (e.key === shortcutSettings.value.replaceKey) {
    e.preventDefault();
    openSearch("replace");
    return;
  }

  if (e.key === shortcutSettings.value.newTabKey) {
    e.preventDefault();
    openSearch("new-tab");
  }
}

function onBackdropClick() {
  closeSearch();
}

function loadCustomBangs() {
  try {
    const saved = localStorage.getItem("custom-bangs");
    if (!saved) return;
    customBangs.value = parseCustomBangs(JSON.parse(saved));
  } catch {
    // ignore
  }
}

async function loadShortcutSettings() {
  try {
    const result = await browser.storage.local.get(SETTINGS_STORAGE_KEY);
    shortcutSettings.value = parseShortcutSettings(result[SETTINGS_STORAGE_KEY]);
  } catch {
    shortcutSettings.value = { ...DEFAULT_SHORTCUT_SETTINGS };
  }
}

function onStorageChanged(changes: Record<string, Browser.storage.StorageChange>) {
  if (changes[SETTINGS_STORAGE_KEY]) {
    shortcutSettings.value = parseShortcutSettings(changes[SETTINGS_STORAGE_KEY].newValue);
  }
}

onMounted(() => {
  updateTheme();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateTheme);
  document.addEventListener("keydown", onKeydown, true);
  browser.storage.local.onChanged.addListener(onStorageChanged);
  loadCustomBangs();
  void loadShortcutSettings();
});

onUnmounted(() => {
  window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", updateTheme);
  document.removeEventListener("keydown", onKeydown, true);
  browser.storage.local.onChanged.removeListener(onStorageChanged);
});
</script>

<template>
  <div ref="panelRef" v-if="visible"
    :class="['fixed inset-0 z-[2147483647] flex items-start justify-center pt-[15vh]', isDark ? 'dark' : '']"
    @click="onBackdropClick" @keydown.stop>
    <div class="w-[560px]" @click.stop>
      <BangSearch :all-bangs="allBangs" :mode="mode" autofocus />
    </div>
  </div>
</template>
