<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from "vue";
import { bangs } from "./bang";
import {
  type Bang,
  type CustomBang,
  type CustomBangSource,
  DEFAULT_CUSTOM_BANG_SOURCE_URL,
  loadCustomBangsFromUrl,
  normalizeCustomBangSourceUrl,
  parseCustomBangs,
} from "./custom-bang";
import BangModal from "./components/BangModal.vue";
import BangAddModal from "./components/BangAddModal.vue";
import BangSearch from "./components/BangSearch.vue";
import BangList from "./components/BangList.vue";
import RemoveConfirmModal from "./components/RemoveConfirmModal.vue";
import SourceRemoveConfirmModal from "./components/SourceRemoveConfirmModal.vue";

const LS_CUSTOM_BANGS = "custom-bangs";
const LS_CUSTOM_BANG_SOURCES = "custom-bang-sources";

const customBangs = ref<CustomBang[]>([]);
const sources = ref<CustomBangSource[]>([]);
const editingBang = ref<CustomBang | null>(null);
const editingIndex = ref<number | null>(null);
const modalVisible = ref(false);

const addModalVisible = shallowRef(false);
const importLoading = shallowRef(false);
const importError = shallowRef("");
const syncingSourceIndex = shallowRef<number | null>(null);
const sourceRemoveIndex = shallowRef<number | null>(null);
const sourceRemoveVisible = shallowRef(false);

const removeConfirmIndex = ref<number | null>(null);
const removeConfirmVisible = ref(false);
const removingBang = computed<CustomBang | null>(() => {
  return removeConfirmIndex.value !== null ? (customBangs.value[removeConfirmIndex.value] ?? null) : null;
});
const removingSource = computed<CustomBangSource | null>(() => {
  return sourceRemoveIndex.value !== null ? (sources.value[sourceRemoveIndex.value] ?? null) : null;
});
const allBangs = computed<Bang[]>(() => [...getActiveCustomBangs(), ...bangs]);

function getActiveCustomBangs(): Bang[] {
  return customBangs.value
    .filter((b) => b.enabled !== false)
    .map(({ enabled: _enabled, ...bang }) => bang);
}

function saveToStorage() {
  localStorage.setItem(LS_CUSTOM_BANGS, JSON.stringify(customBangs.value, null, 2));
}

function saveSourceUrls() {
  localStorage.setItem(LS_CUSTOM_BANG_SOURCES, JSON.stringify(sources.value, null, 2));
}

function loadFromStorage(): CustomBang[] {
  const saved = localStorage.getItem(LS_CUSTOM_BANGS);
  if (!saved) return [];
  try {
    return parseCustomBangs(JSON.parse(saved));
  } catch (error) {
    console.warn("Ignoring invalid saved custom bang config.", error);
    return [];
  }
}

function loadSourcesFromStorage(): CustomBangSource[] {
  const saved = localStorage.getItem(LS_CUSTOM_BANG_SOURCES);
  if (!saved) {
    return [{ url: DEFAULT_CUSTOM_BANG_SOURCE_URL, tags: [] }];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): CustomBangSource[] => {
      if (typeof value === "string" && value.trim()) {
        return [{ url: value, tags: [] }];
      }

      if (!value || typeof value !== "object") return [];
      const source = value as Record<string, unknown>;
      if (typeof source.url !== "string" || !source.url.trim()) return [];

      return [{
        url: source.url,
        tags: Array.isArray(source.tags)
          ? source.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
      }];
    });
  } catch (error) {
    console.warn("Ignoring invalid custom bang sources config.", error);
    return [];
  }
}

function dedupeBangs(preferredBangs: CustomBang[], fallbackBangs: CustomBang[] = []): CustomBang[] {
  const seen = new Set<string>();
  const result: CustomBang[] = [];

  for (const bang of [...preferredBangs, ...fallbackBangs]) {
    if (seen.has(bang.t)) continue;
    seen.add(bang.t);
    result.push(bang);
  }

  return result;
}

function getSourceKey(sourceUrl: string): string {
  return normalizeCustomBangSourceUrl(sourceUrl.trim());
}

function findSourceIndex(sourceUrl: string): number {
  const trimmed = sourceUrl.trim();
  const nextSourceKey = getSourceKey(trimmed);
  return sources.value.findIndex((source) => getSourceKey(source.url) === nextSourceKey);
}

function openModal(bang: CustomBang | null = null, index: number | null = null) {
  editingBang.value = bang;
  editingIndex.value = index;
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  editingBang.value = null;
  editingIndex.value = null;
}

function handleToggle(index: number, checked: boolean) {
  const bang = customBangs.value[index];
  if (!bang) return;
  bang.enabled = checked;
  saveToStorage();
}

function toggleBang(index: number) {
  const bang = customBangs.value[index];
  if (!bang) return;
  handleToggle(index, bang.enabled === false);
}

function handleEdit(index: number) {
  const bang = customBangs.value[index];
  if (!bang) return;
  openModal({ ...bang }, index);
}

function handleRemove(index: number) {
  const bang = customBangs.value[index];
  if (!bang) return;
  removeConfirmIndex.value = index;
  removeConfirmVisible.value = true;
}

function confirmRemove() {
  const index = removeConfirmIndex.value;
  if (index === null) return;
  const bang = customBangs.value[index];
  if (!bang) return;
  customBangs.value.splice(index, 1);
  if (editingIndex.value === index) {
    closeModal();
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    editingIndex.value -= 1;
  }
  saveToStorage();
  closeRemoveConfirm();
}

function closeRemoveConfirm() {
  removeConfirmVisible.value = false;
  removeConfirmIndex.value = null;
}

function handleModalSubmit(bang: CustomBang) {
  if (editingIndex.value !== null) {
    customBangs.value[editingIndex.value] = bang;
  } else if (customBangs.value.find((b) => b.t === bang.t)) {
    return;
  } else {
    customBangs.value.push(bang);
  }

  closeModal();
  saveToStorage();
}

function handleAddBangSubmit(bang: CustomBang) {
  if (customBangs.value.find((b) => b.t === bang.t)) {
    importError.value = "A bang with this shortcut already exists.";
    return;
  }
  customBangs.value.push(bang);
  addModalVisible.value = false;
  saveToStorage();
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleExport() {
  downloadJson("custom-bang.json", customBangs.value);
}

function handleAdd() {
  importError.value = "";
  addModalVisible.value = true;
}

function closeAddModal() {
  if (importLoading.value) return;
  addModalVisible.value = false;
  importError.value = "";
}

async function handleAddFile(file: File) {
  try {
    applyImportedBangs(parseCustomBangs(JSON.parse(await file.text())));
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : "Failed to import custom bang config.";
  }
}

function applyImportedBangs(parsed: CustomBang[]) {
  customBangs.value = dedupeBangs(parsed);
  sources.value = [];
  closeModal();
  addModalVisible.value = false;
  saveToStorage();
  saveSourceUrls();
}

function replaceSourceBangs(source: CustomBangSource, nextBangs: CustomBang[]) {
  const previousTags = new Set(source.tags);
  customBangs.value = dedupeBangs([
    ...customBangs.value.filter((bang) => !previousTags.has(bang.t)),
    ...nextBangs,
  ]);
  source.tags = nextBangs.map((bang) => bang.t);
  saveToStorage();
  saveSourceUrls();
}

function removeSourceBangs(source: CustomBangSource) {
  const removedTags = new Set(source.tags);
  customBangs.value = customBangs.value.filter((bang) => !removedTags.has(bang.t));
}

async function syncSourceAtIndex(index: number) {
  const source = sources.value[index];
  if (!source) return;

  syncingSourceIndex.value = index;
  importError.value = "";

  try {
    replaceSourceBangs(source, await loadCustomBangsFromUrl(source.url));
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : "Failed to sync custom bang source.";
    addModalVisible.value = true;
  } finally {
    syncingSourceIndex.value = null;
  }
}

async function importFromUrl(sourceUrl: string) {
  importLoading.value = true;
  importError.value = "";

  try {
    const trimmed = sourceUrl.trim();
    const existingIndex = findSourceIndex(trimmed);
    const nextBangs = await loadCustomBangsFromUrl(trimmed);

    if (existingIndex === -1) {
      sources.value.push({ url: trimmed, tags: [] });
      replaceSourceBangs(sources.value[sources.value.length - 1]!, nextBangs);
    } else {
      replaceSourceBangs(sources.value[existingIndex]!, nextBangs);
    }
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : "Failed to import custom bang config.";
  } finally {
    importLoading.value = false;
  }
}

async function syncSource(index: number) {
  await syncSourceAtIndex(index);
}

async function editSource(index: number, sourceUrl: string) {
  const source = sources.value[index];
  if (!source) return;

  const trimmed = sourceUrl.trim();
  const duplicateIndex = findSourceIndex(trimmed);
  if (duplicateIndex !== -1 && duplicateIndex !== index) {
    importError.value = "This source already exists.";
    return;
  }

  syncingSourceIndex.value = index;
  importError.value = "";

  try {
    const nextBangs = await loadCustomBangsFromUrl(trimmed);
    source.url = trimmed;
    replaceSourceBangs(source, nextBangs);
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : "Failed to update custom bang source.";
  } finally {
    syncingSourceIndex.value = null;
  }
}

function requestRemoveSource(index: number) {
  if (!sources.value[index]) return;
  sourceRemoveIndex.value = index;
  sourceRemoveVisible.value = true;
}

function closeSourceRemoveConfirm() {
  sourceRemoveIndex.value = null;
  sourceRemoveVisible.value = false;
}

function confirmRemoveSource() {
  const index = sourceRemoveIndex.value;
  if (index === null) return;
  const source = sources.value[index];
  if (!source) return;

  removeSourceBangs(source);
  sources.value.splice(index, 1);
  saveToStorage();
  saveSourceUrls();
  closeSourceRemoveConfirm();
}

function handleEsc(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (sourceRemoveVisible.value) {
      closeSourceRemoveConfirm();
    } else if (removeConfirmVisible.value) {
      closeRemoveConfirm();
    } else if (addModalVisible.value) {
      closeAddModal();
    } else if (modalVisible.value) {
      closeModal();
    }
  }
}

onMounted(() => {
  customBangs.value = loadFromStorage();
  sources.value = loadSourcesFromStorage();
  document.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="grid grid-rows-[min-content_1fr_min-content] h-dvh">
    <oduck-header />
    <div class="overflow-auto mx4">
      <div class="mxa max-w-200">
        <div class="text-center">
          <h1>Custom Bangs</h1>
          <p>
            Create your own <code>!bang</code> shortcuts.
          </p>
        </div>

        <BangSearch :all-bangs="allBangs" mode="new-tab" />

        <section class="mt-10">
          <div class="flex items-center justify-between gap-4 lt-sm:(flex-col items-start)">
            <h2 class="text-[22px]">Your Bangs</h2>
            <div class="flex gap-2 flex-wrap justify-end lt-sm:(w-full justify-stretch)">
              <button class="btn-primary lt-sm:flex-1" type="button" @click="handleAdd">
               Add
              </button>
              <button class="btn-secondary lt-sm:flex-1" type="button" @click="handleExport">
                Export
              </button>
            </div>
          </div>

          <p v-if="customBangs.length === 0"
            class="mt-4.5 p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa])">
            No custom bangs yet.
          </p>
          <BangList v-else :custom-bangs="customBangs" @toggle="toggleBang" @edit="handleEdit" @remove="handleRemove" />
        </section>

      </div>
      <BangAddModal :visible="addModalVisible" :error="importError" :loading="importLoading" :sources="sources"
        :syncing-source-index="syncingSourceIndex" @close="closeAddModal" @add-bang="handleAddBangSubmit"
        @import-file="handleAddFile" @edit-source="editSource" @remove-source="requestRemoveSource"
        @sync-source="syncSource" @import-url="importFromUrl" />

      <BangModal :visible="modalVisible" :editing-bang="editingBang" @submit="handleModalSubmit" @close="closeModal" />

      <RemoveConfirmModal :visible="removeConfirmVisible" :removing-bang="removingBang" @close="closeRemoveConfirm"
        @confirm="confirmRemove" />

      <SourceRemoveConfirmModal :visible="sourceRemoveVisible" :source="removingSource" @close="closeSourceRemoveConfirm"
        @confirm="confirmRemoveSource" />
    </div>
    <oduck-footer />
  </div>
</template>
