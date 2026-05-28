<script setup lang="ts">
import { watch, ref, computed, shallowRef } from "vue";
import type { CustomBang, CustomBangSource } from "../custom-bang";
import { parseCustomBangs } from "../custom-bang";
import { stripBangMarker } from "../bang-query";
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
  { name: 'Oduck', icon: 'i-simple-icons-duckduckgo', url: 'https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/oduck.json' },
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
const selectedFile = ref<File | null>(null);
const fileContent = ref("");
const fileContentError = ref("");
const fileHint = computed(() => {
  if (!fileSourceName.value.trim()) return "Please enter a source name.";
  if (!selectedFile.value) return "Please select a file.";
  return "";
});

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
  selectedFile.value = null;
  fileContent.value = "";
  fileContentError.value = "";
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

  const cleanTag = stripBangMarker(tag.value);
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

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  selectedFile.value = file;
  fileContentError.value = "";
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    fileContent.value = JSON.stringify(parsed, null, 2);
  } catch (err) {
    fileContent.value = "";
    fileContentError.value = err instanceof Error ? err.message : "Failed to parse file.";
  }
}

function removeFile() {
  selectedFile.value = null;
  fileContent.value = "";
  fileContentError.value = "";
  if (fileInput.value) fileInput.value.value = "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function handleFileUpload() {
  const importName = fileSourceName.value.trim();
  if (!importName || !selectedFile.value) return;
  emit("importFile", importName, selectedFile.value);
}
</script>

<template>
  <BaseModal :visible="visible" height="min(80vh,540px)" aria-labelledby="bang-add-modal-title" @close="$emit('close')">
    <template #header>
      <div class="p-7 pb-0 lt-sm:p-5 lt-sm:pb-0">
        <h3>Add</h3>
        <div class="flex mt-4">
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
      </div>
    </template>

    <div class="overflow-auto min-h-0 px-7 pb-4 lt-sm:px-5 lt-sm:pb-2">
      <Transition name="tab-fade" mode="out-in">
        <!-- Manual tab -->
        <form v-if="activeTab === 'manual'" id="add-form" key="manual" class="grid gap-4 mt-6" @submit.prevent="handleManualSubmit">
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

      <div
        class="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors"
        :class="loading
          ? 'border-neutral-200 bg-neutral-50 dark:(border-neutral-700 bg-neutral-800/40)'
          : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:(border-neutral-600 hover:border-neutral-500 hover:bg-neutral-800/30)'
        "
        role="button"
        tabindex="0"
        @click="chooseFile"
        @keydown.enter="chooseFile"
        @keydown.space.prevent="chooseFile"
      >
        <template v-if="selectedFile">
          <div class="i-ph-file-json-duotone text-2xl text-neutral-500 dark:text-neutral-400" />
          <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ selectedFile.name }}</span>
          <span class="text-xs text-neutral-500 dark:text-neutral-500">{{ formatFileSize(selectedFile.size) }}</span>
          <button
            class="absolute top-1.5 right-1.5 size-5 flex items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-300 dark:(bg-neutral-600 hover:bg-neutral-500) transition-colors text-xs"
            type="button"
            @click.stop="removeFile"
          >
            ×
          </button>
        </template>
        <template v-else>
          <div class="i-ph-upload-simple-duotone text-2xl text-neutral-400 dark:text-neutral-500" />
          <span class="text-sm text-neutral-500 dark:text-neutral-400">Click to browse</span>
          <span class="text-xs text-neutral-400 dark:text-neutral-500">.json</span>
        </template>
      </div>

      <div
        v-if="selectedFile && fileContent"
        class="max-h-48 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 dark:(border-neutral-700 bg-neutral-800/30) p-3"
      >
        <pre class="m0 text-xs font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre">{{ fileContent }}</pre>
      </div>

      <p
        v-if="selectedFile && fileContentError"
        class="m0 text-[13px] leading-5 text-red-500 dark:text-red-400"
      >
        {{ fileContentError }}
      </p>

      <p v-if="fileHint" class="m0 text-[13px] leading-5 text-[#888] dark:text-[#999]">
        {{ fileHint }}
      </p>
      <p v-else class="m0 text-[13px] leading-5 text-[#666] dark:text-[#aaa]">
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
          <div
            v-for="rec in uninstalledRecommendations"
            :key="rec.name"
            class="relative flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 bg-transparent"
          >
            <a
              :href="rec.url"
              target="_blank"
              rel="noopener noreferrer"
              class="absolute top-1 left-2 cursor-pointer"
            >
              <div class="size-4 i-ph-link-duotone" />
            </a>
            <div :class="rec.icon" class="text-2xl" />
            <span class="text-xs font-medium">{{ rec.name }}</span>
            <button
              class="btn-primary btn-xs mt-0.5"
              :disabled="loading"
              @click="emit('importUrl', rec.name, rec.url)"
            >
              Add
            </button>
          </div>
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

    <template #footer>
      <div class="p7 pt0 lt-sm:p-5 lt-sm:pt-0">
      <button
        v-if="activeTab === 'manual'"
        class="btn-primary block w-full"
        type="submit"
        form="add-form"
      >
        Add
      </button>
      <button
        v-else-if="activeTab === 'file'"
        class="btn-primary block w-full"
        type="button"
        :disabled="loading || !fileSourceName.trim() || !selectedFile"
        @click="handleFileUpload"
      >
        Upload
      </button>
      <p v-if="error" class="error-text m0 text-sm">
        {{ error }}
      </p>
      </div>
    </template>
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
