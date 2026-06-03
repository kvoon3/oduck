<script setup lang="ts">
import { watch, ref, computed, shallowRef } from "vue";
import type { CustomBang } from "../custom-bang";
import { parseCustomBangs } from "../custom-bang";
import { stripBangMarker } from "../bang-query";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{
  visible: boolean;
  error: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  addBang: [bang: CustomBang];
  importFile: [name: string, file: File];
}>();

const tabs = [
  { id: "manual" as const, label: "Manual" },
  { id: "file" as const, label: "File" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const activeTab = ref<TabId>("manual");

// Manual form
const tag = ref("");
const name = ref("");
const domain = ref("");
const searchUrl = ref("");
const aliasTarget = ref("");
const isAlias = ref(false);
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

function reset() {
  tag.value = "";
  name.value = "";
  domain.value = "";
  searchUrl.value = "";
  aliasTarget.value = "";
  isAlias.value = false;
  manualError.value = "";
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
  const cleanAliasTarget = aliasTarget.value
    .split(',')
    .map((s) => stripBangMarker(s.trim()).toLowerCase())
    .filter(Boolean);

  if (isAlias.value && cleanAliasTarget.length === 0) {
    manualError.value = "Alias target is required.";
    return;
  }

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
        a: isAlias.value ? cleanAliasTarget : undefined,
      },
    ])[0];

    if (!parsed) throw new Error("Custom bang is invalid.");

    emit("addBang", parsed);
  } catch (err) {
    manualError.value =
      err instanceof Error ? err.message : "Custom bang config is invalid.";
  }
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
      <label class="flex items-center gap-2.5 cursor-pointer select-none" @click.prevent="isAlias = !isAlias" @keydown.space.prevent="isAlias = !isAlias">
        <span
          class="size-5 flex-shrink-0 rounded-md flex items-center justify-center border-2 transition-all duration-150"
          :class="isAlias ? 'bg-neutral-800 border-neutral-800 dark:(bg-neutral-300 border-neutral-300)' : 'bg-neutral-200 border-neutral-300 dark:(bg-neutral-700 border-neutral-500)'"
          role="checkbox" :aria-checked="isAlias" tabindex="0"
        >
          <span
            class="i-ph-check-bold text-sm transition-all duration-100 text-white dark:text-neutral-900"
            :class="isAlias ? 'opacity-100 scale-100' : 'opacity-0 scale-75'"
          />
        </span>
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Alias (reference another bang)
        </span>
      </label>
      <template v-if="isAlias">
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Alias target
          </span>
          <input
            v-model="aliasTarget"
            class="input"
            placeholder="e.g. chatgpt, gpt"
            spellcheck="false"
            autocomplete="off"
            required
          />
        </label>
      </template>
      <template v-else>
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
      </template>
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
