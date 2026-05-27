<script setup lang="ts">
import { watch, ref, computed, shallowRef } from "vue";
import type { CustomBang, CustomBangSource } from "../custom-bang";
import { parseCustomBangs } from "../custom-bang";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{
  visible: boolean;
  error: string;
  loading: boolean;
  sources: CustomBangSource[];
  syncingSourceIndex: number | null;
}>();

const emit = defineEmits<{
  close: [];
  addBang: [bang: CustomBang];
  importFile: [name: string, file: File];
  importUrl: [name: string, sourceUrl: string];
  removeSource: [index: number];
  syncSource: [index: number];
}>();

const tabs = [
  { id: "manual" as const, label: "Manual" },
  { id: "url" as const, label: "URL" },
  { id: "file" as const, label: "File" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const recommendedSources = [
  { name: 'Kagi', icon: 'i-simple-icons-kagi', url: 'https://raw.githubusercontent.com/kagisearch/bangs/refs/heads/main/data/bangs.json' },
  { name: 'Oduck', icon: 'i-simple-icons-duckduckgo', url: 'https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/custom-bang.json' },
] as const;

const uninstalledRecommendations = computed(() =>
  recommendedSources.filter(
    rec => !props.sources.some(s => s.name === rec.name)
  )
);

function findRecommended(name: string) {
  return recommendedSources.find(rec => rec.name === name);
}

const activeTab = ref<TabId>("manual");

// Manual form
const tag = ref("");
const name = ref("");
const domain = ref("");
const searchUrl = ref("");
const manualError = ref("");

// File
const fileInput = shallowRef<HTMLInputElement | null>(null);
const fileSourceName = ref("");

// URL
const sourceUrl = ref("");
const sourceName = ref("");

function reset() {
  tag.value = "";
  name.value = "";
  domain.value = "";
  searchUrl.value = "";
  manualError.value = "";
  sourceUrl.value = "";
  sourceName.value = "";
  fileSourceName.value = "";
}

watch(
  () => props.visible,
  (v) => {
    if (v) reset();
  },
);

const cleanDomain = computed(() => normalizeDomain(domain.value));

function normalizeDomain(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    return new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    ).hostname.toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .toLowerCase();
  }
}

function handleManualSubmit() {
  manualError.value = "";

  const cleanTag = tag.value.trim().replace(/^!/, "").toLowerCase();
  const cleanName = name.value.trim();
  const cleanUrl = searchUrl.value.trim();

  try {
    const parsed = parseCustomBangs([
      {
        c: "Custom",
        d: cleanDomain.value,
        enabled: true,
        r: 0,
        s: cleanName,
        sc: "Custom",
        t: cleanTag,
        u: cleanUrl,
      },
    ])[0];

    if (!parsed) throw new Error("Custom bang is invalid.");

    emit("addBang", parsed);
  } catch (err) {
    manualError.value =
      err instanceof Error ? err.message : "Custom bang config is invalid.";
  }
}

function handleUrlSubmit() {
  const trimmedName = sourceName.value.trim();
  const trimmedUrl = sourceUrl.value.trim();
  if (trimmedName && trimmedUrl) emit("importUrl", trimmedName, trimmedUrl);
}

function chooseFile() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  emit(
    "importFile",
    fileSourceName.value.trim() || `File ${new Date().toLocaleDateString()}`,
    file
  );
}
</script>

<template>
  <BaseModal :visible="visible" height="min(80vh,520px)" aria-labelledby="bang-add-modal-title" @close="$emit('close')">
    <div class="flex flex-col min-h-0 h-full">
    <div class="flex items-center justify-between gap-4">
      <h3 id="bang-add-modal-title" class="text-[18px]">
       Add
      </h3>
      <button
        class="btn-close"
        type="button"
        aria-label="Close"
        @click="$emit('close')"
      >
        ×
      </button>
    </div>

    <div class="flex border-b mt-4 shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="border-none bg-transparent text-sm cursor-pointer transition-colors"
        :class="activeTab === tab.id
          ? 'text-[#1a1a1a] border-b-2 border-[#1a1a1a] -mb-[1px] font-medium dark:(text-[#f1f1f1] border-[#f1f1f1])'
          : 'text-[#888] hover:text-[#555] dark:(text-[#777] hover:text-[#aaa])'
        "
        type="button"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex-1 overflow-auto min-h-0">
      <Transition name="tab-fade" mode="out-in">
        <!-- Manual tab -->
        <form v-if="activeTab === 'manual'" key="manual" class="grid gap-4 mt-6" @submit.prevent="handleManualSubmit">
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Bang shortcut
        </span>
        <input
          v-model="tag"
          class="input"
          placeholder="e.g. chatgpt"
          spellcheck="false"
          autocomplete="off"
          required
        />
      </label>
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Name
        </span>
        <input
          v-model="name"
          class="input"
          placeholder="e.g. ChatGPT"
          spellcheck="false"
          autocomplete="off"
          required
        />
      </label>
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Domain
        </span>
        <input
          v-model="domain"
          class="input"
          placeholder="e.g. chatgpt.com"
          spellcheck="false"
          autocomplete="off"
          required
        />
      </label>
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Search URL
        </span>
        <input
          v-model="searchUrl"
          class="input font-mono"
          placeholder="e.g. https://example.com/search?q={{{s}}}"
          spellcheck="false"
          autocomplete="off"
          required
        />
      </label>
      <p v-if="manualError" class="error-text">
        {{ manualError }}
      </p>
      <button class="btn-primary mt-1 py-2.5" type="submit">
        Add
      </button>
    </form>

    <!-- File tab -->
    <div v-else-if="activeTab === 'file'" key="file" class="grid gap-4 mt-6">
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Source name
        </span>
        <input
          v-model="fileSourceName"
          class="input"
          placeholder="e.g. My Bangs"
          spellcheck="false"
          autocomplete="off"
          :disabled="loading"
        />
      </label>
      <input
        ref="fileInput"
        class="hidden"
        type="file"
        accept="application/json,.json"
        @change="onFileChange"
      />
      <button class="btn-primary py-2.5" type="button" :disabled="loading" @click="chooseFile">
        Choose JSON File
      </button>
      <p class="m0 text-[13px] leading-5 text-[#666] dark:text-[#aaa]">
        Import bangs from a JSON file. The file must follow the custom bang format.
      </p>
    </div>

    <!-- URL tab -->
    <div v-else-if="activeTab === 'url'" key="url" class="grid gap-6 mt-6">
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Source name
        </span>
        <input
          v-model="sourceName"
          class="input"
          placeholder="e.g. Kagi"
          spellcheck="false"
          autocomplete="off"
          :disabled="loading"
        />
      </label>
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          JSON source URL
        </span>
        <div class="flex gap-2">
          <input
            v-model="sourceUrl"
            class="input font-mono flex-1"
            placeholder="https://github.com/user/repo/blob/main/custom-bang.json"
            spellcheck="false"
            autocomplete="off"
            :disabled="loading"
          />
          <button class="btn-primary py-2.5 shrink-0" type="button" :disabled="loading || !sourceName.trim() || !sourceUrl.trim()" @click="handleUrlSubmit">
            {{ loading ? "Syncing..." : "Add Source" }}
          </button>
        </div>
      </label>

      <div v-if="uninstalledRecommendations.length > 0">
        <p class="text-xs font-medium text-[#888] dark:text-[#666] mb-3">
          Recommended
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="rec in uninstalledRecommendations"
            :key="rec.name"
            class="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 bg-transparent cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
            :disabled="loading"
            @click="emit('importUrl', rec.name, rec.url)"
          >
            <div :class="rec.icon" class="text-2xl" />
            <span class="text-xs font-medium">{{ rec.name }}</span>
            <span class="btn-primary btn-xs mt-0.5">Add</span>
          </button>
        </div>
      </div>

      <div v-if="sources.length > 0">
        <p class="text-xs font-medium text-[#888] dark:text-[#666] mb-3">
          Installed
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="(source, index) in sources"
            :key="source.name"
            class="relative flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 bg-transparent"
          >

            <div class="absolute top-1 left-2 flex items-center gap-3">
              <a
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                cursor-pointer
              >
                <button class="size-4 i-ph-link-duotone" />
              </a>
            </div>
            <div class="absolute top-1 right-1 flex items-center gap-3">
              <button
                class="size-4 i-ph-x-circle-duotone"
                :disabled="loading || syncingSourceIndex !== null"
                @click="$emit('removeSource', index)"
              />
            </div>
            <div :class="findRecommended(source.name)?.icon ?? 'i-carbon-link'" class="text-2xl" />
            <span class="text-xs font-medium">{{ source.name }}</span>
            <button
              class="btn-primary btn-xs mt-0.5"
              type="button"
              :disabled="loading || syncingSourceIndex !== null"
              @click="$emit('syncSource', index)"
            >
              {{ syncingSourceIndex === index ? "Syncing..." : "Sync" }}
            </button>
          </div>
        </div>
      </div>
    </div>
      </Transition>
    </div>

    <p v-if="error" class="error-text m-0 mt-4 text-sm shrink-0">
      {{ error }}
    </p>
    </div>
  </BaseModal>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 120ms ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
