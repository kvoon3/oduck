<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, toRaw } from "vue";
import {
  type CustomBang,
  type CustomBangSource,
} from "./custom-bang";
import {
  BangModal,
  BangManagePanel,
  useBangProcessor,
  loadRawBangsFromUrl,
  parseCustomBangs,
  type CustomBangInput,
} from "@oduck/ui";
import BangAddModal from "./components/BangAddModal.vue";
import { BangSearch } from "@oduck/ui";
import BangSourceCards from "./components/BangSourceCards.vue";
import SourceAddModal from "./components/SourceAddModal.vue";
import SourceRemoveConfirmModal from "./components/SourceRemoveConfirmModal.vue";
import CleanConfirmModal from "./components/CleanConfirmModal.vue";
import ExportConfirmModal from "./components/ExportConfirmModal.vue";

const LS_CUSTOM_BANGS = "custom-bangs";
const LS_CUSTOM_BANG_SOURCES = "custom-bang-sources";

const { process: processBangs } = useBangProcessor();

const customBangs = ref<CustomBang[]>([]);
const sources = ref<CustomBangSource[]>([]);
const editingBang = ref<CustomBang | null>(null);
const editingIndex = ref<number | null>(null);
const modalVisible = ref(false);

const addModalVisible = shallowRef(false);
const sourceAddModalVisible = shallowRef(false);
const importLoading = shallowRef(false);
const importError = shallowRef("");
const syncingSourceIndex = shallowRef<number | null>(null);
const sourceRemoveIndex = shallowRef<number | null>(null);
const sourceRemoveVisible = shallowRef(false);
const selectedBangTags = shallowRef<Set<string>>(new Set());

const sourceConflicts = shallowRef<{ local: CustomBang; remote: CustomBang }[]>([]);
const pendingImport = shallowRef<{ sourceName: string; sourceUrl: string; rawBangs: CustomBangInput[]; existingIndex: number } | null>(null);

const importToast = shallowRef<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const cleanConfirmVisible = shallowRef(false);
const exportConfirmVisible = shallowRef(false);

const removingSource = computed<CustomBangSource | null>(() => {
  return sourceRemoveIndex.value !== null ? (sources.value[sourceRemoveIndex.value] ?? null) : null;
});
const selectedBangs = computed(() => customBangs.value.filter((bang) => selectedBangTags.value.has(bang.t)));
const selectedCount = computed(() => selectedBangs.value.length);
const selectedEnabledBangs = computed(() => selectedBangs.value.filter((bang) => bang.enabled !== false));
const cleanCount = computed(() => selectedCount.value || customBangs.value.length);
const allBangs = computed<CustomBang[]>(() => customBangs.value);
const resolutions = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const b of allBangs.value) map[b.t] = b.s;
  return map;
});

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
    const parsed = parseCustomBangs(JSON.parse(saved));
    for (const bang of parsed) {
      if (!bang.origin) bang.origin = "manual";
    }
    return parsed;
  } catch (error) {
    console.warn("Ignoring invalid saved custom bang config.", error);
    return [];
  }
}

function loadSourcesFromStorage(): CustomBangSource[] {
  const saved = localStorage.getItem(LS_CUSTOM_BANG_SOURCES);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    let nameIdx = 0;
    return parsed.flatMap((value): CustomBangSource[] => {
      if (typeof value === "string" && value.trim()) {
        return [{ name: `Source ${++nameIdx}`, url: value, tags: [] }];
      }

      if (!value || typeof value !== "object") return [];
      const source = value as Record<string, unknown>;
      if (typeof source.url !== "string" || !source.url.trim()) return [];

      const sourceName = typeof source.name === "string" && source.name.trim()
        ? source.name.trim()
        : `Source ${++nameIdx}`;

      return [{
        name: sourceName,
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

function findSourceIndexByName(name: string): number {
  return sources.value.findIndex((s) => s.name === name);
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

function toggleSelectedBang(tag: string) {
  const next = new Set(selectedBangTags.value);
  if (next.has(tag)) {
    next.delete(tag);
  } else {
    next.add(tag);
  }
  selectedBangTags.value = next;
}

function handleSelectBang(bang: CustomBang) {
  toggleSelectedBang(bang.t);
}

function handleToggleSelectAll(filteredBangs: CustomBang[], allSelected: boolean) {
  if (allSelected) {
    const next = new Set(selectedBangTags.value);
    for (const bang of filteredBangs) {
      next.delete(bang.t);
    }
    selectedBangTags.value = next;
  } else {
    const next = new Set(selectedBangTags.value);
    for (const bang of filteredBangs) {
      next.add(bang.t);
    }
    selectedBangTags.value = next;
  }
}

function toggleBangEnabled(bang: CustomBang) {
  const realIdx = customBangs.value.findIndex((b) => b.t === bang.t);
  if (realIdx === -1) return;
  handleToggle(realIdx, bang.enabled === false);
}

function handleEdit(bang: CustomBang) {
  openModal({ ...bang }, customBangs.value.findIndex((b) => b.t === bang.t));
}

function handleModalSubmit(bang: CustomBang) {
  if (editingIndex.value !== null) {
    const previousTag = customBangs.value[editingIndex.value]?.t;
    customBangs.value[editingIndex.value] = bang;
    if (previousTag && previousTag !== bang.t && selectedBangTags.value.has(previousTag)) {
      const nextSelectedTags = new Set(selectedBangTags.value);
      nextSelectedTags.delete(previousTag);
      nextSelectedTags.add(bang.t);
      selectedBangTags.value = nextSelectedTags;
    }
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
  customBangs.value.push({ ...bang, origin: "manual" });
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

function openExportConfirm() {
  exportConfirmVisible.value = true;
}

function closeExportConfirm() {
  exportConfirmVisible.value = false;
}

function confirmExport() {
  downloadJson("custom-bang.json", selectedEnabledBangs.value);
  closeExportConfirm();
}

function openCleanConfirm() {
  cleanConfirmVisible.value = true;
}

function closeCleanConfirm() {
  cleanConfirmVisible.value = false;
}

function confirmClean() {
  const selectedTags = new Set(selectedBangs.value.map((bang) => bang.t));
  if (selectedTags.size) {
    customBangs.value = customBangs.value.filter((bang) => !selectedTags.has(bang.t));
    for (const source of sources.value) {
      source.tags = source.tags.filter((tag) => !selectedTags.has(tag));
    }
    if (editingBang.value && selectedTags.has(editingBang.value.t)) {
      closeModal();
    }
    selectedBangTags.value = new Set();
  } else {
    customBangs.value = [];
    sources.value = [];
    closeModal();
  }
  saveToStorage();
  saveSourceUrls();
  closeCleanConfirm();
}

function handleEnableAll(targets?: CustomBang[]) {
  const items = targets ?? customBangs.value;
  for (const bang of items) {
    bang.enabled = true;
  }
  saveToStorage();
}

function handleDisableAll(targets?: CustomBang[]) {
  const items = targets ?? customBangs.value;
  for (const bang of items) {
    bang.enabled = false;
  }
  saveToStorage();
}

function handleAdd() {
  importError.value = "";
  addModalVisible.value = true;
}

function closeAddModal() {
  addModalVisible.value = false;
  importError.value = "";
}

function openSourceAddModal() {
  importError.value = "";
  sourceAddModalVisible.value = true;
}

function closeSourceAddModal() {
  sourceAddModalVisible.value = false;
  sourceConflicts.value = [];
  pendingImport.value = null;
  importError.value = "";
}

function showToast(type: 'loading' | 'success' | 'error', message: string) {
  if (toastTimer) clearTimeout(toastTimer);
  importToast.value = { type, message };
  if (type !== 'loading') {
    toastTimer = setTimeout(() => { importToast.value = null; }, 3000);
  }
}

function hideToast() {
  if (toastTimer) clearTimeout(toastTimer);
  importToast.value = null;
}

async function importFromFile(sourceName: string, file: File) {
  showToast('loading', `Importing ${sourceName}...`);
  try {
    const raw: CustomBangInput[] = JSON.parse(await file.text());
    const existingIndex = findSourceIndexByName(sourceName);
    const existingSourceTags = existingIndex >= 0 ? toRaw(sources.value[existingIndex].tags) : [];

    const result = await processBangs(
      raw,
      sourceName,
      toRaw(customBangs.value),
      existingSourceTags,
      false,
    );

    if (result.conflicts.length > 0) {
      pendingImport.value = { sourceName, sourceUrl: "", rawBangs: raw, existingIndex };
      sourceConflicts.value = result.conflicts;
      sourceAddModalVisible.value = true;
      hideToast();
      return;
    }

    if (existingIndex !== -1) {
      sources.value.splice(existingIndex, 1);
    }
    sources.value.push({ name: sourceName, url: "", tags: result.newTags });
    customBangs.value = result.merged;
    closeModal();
    addModalVisible.value = false;
    saveToStorage();
    saveSourceUrls();
    showToast('success', `Imported ${sourceName} (${result.merged.length} bangs)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to import custom bang config.";
    importError.value = msg;
    showToast('error', msg);
  }
}



function removeSourceBangs(source: CustomBangSource) {
  const removedTags = new Set(source.tags);
  customBangs.value = customBangs.value.filter((bang) => !removedTags.has(bang.t));
  selectedBangTags.value = new Set([...selectedBangTags.value].filter((tag) => !removedTags.has(tag)));
}

async function syncSourceAtIndex(index: number) {
  const source = sources.value[index];
  if (!source) return;

  importLoading.value = true;
  syncingSourceIndex.value = index;
  importError.value = "";
  showToast('loading', `Syncing ${source.name}...`);

  try {
    const raw = await loadRawBangsFromUrl(source.url);
    const result = await processBangs(
      raw,
      source.name,
      toRaw(customBangs.value),
      toRaw(source.tags),
      false,
    );
    customBangs.value = result.merged;
    source.tags = result.newTags;
    saveToStorage();
    saveSourceUrls();
    showToast('success', `Synced ${source.name} (${result.merged.length} bangs)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to sync custom bang source.";
    importError.value = msg;
    showToast('error', msg);
    addModalVisible.value = true;
  } finally {
    importLoading.value = false;
    syncingSourceIndex.value = null;
  }
}

async function importFromUrl(sourceName: string, sourceUrl: string) {
  importLoading.value = true;
  importError.value = "";
  showToast('loading', `Importing ${sourceName}...`);

  try {
    const trimmed = sourceUrl.trim();
    const existingIndex = findSourceIndexByName(sourceName);
    const raw = await loadRawBangsFromUrl(trimmed);

    const existingSourceTags = existingIndex >= 0 ? toRaw(sources.value[existingIndex].tags) : [];
    const result = await processBangs(
      raw,
      sourceName,
      toRaw(customBangs.value),
      existingSourceTags,
      false,
    );

    if (result.conflicts.length > 0) {
      pendingImport.value = { sourceName, sourceUrl: trimmed, rawBangs: raw, existingIndex };
      sourceConflicts.value = result.conflicts;
      sourceAddModalVisible.value = true;
      importLoading.value = false;
      hideToast();
      return;
    }

    if (existingIndex === -1) {
      sources.value.push({ name: sourceName, url: trimmed, tags: result.newTags });
    } else {
      sources.value[existingIndex].tags = result.newTags;
    }
    customBangs.value = result.merged;
    saveToStorage();
    saveSourceUrls();
    showToast('success', `Imported ${sourceName} (${result.newTags.length} bangs)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to import custom bang config.";
    importError.value = msg;
    showToast('error', msg);
  } finally {
    importLoading.value = false;
  }
}

async function handleResolveConflicts(conflictResolutions: Record<string, boolean>) {
  const pending = pendingImport.value;
  if (!pending) return;

  const { sourceName, rawBangs, existingIndex } = pending;
  const existingSourceTags = existingIndex >= 0 ? toRaw(sources.value[existingIndex].tags) : [];

  importLoading.value = true;
  try {
    const parsed = parseCustomBangs(rawBangs).map((b) => Object.assign({}, b, { origin: sourceName }));
    const existingBangs = toRaw(customBangs.value);
    const newTagsSet = new Set(parsed.map((b) => b.t));
    const previousTags = new Set(existingSourceTags);

    // Build merged array based on per-item resolutions
    // true = apply remote (replace), false = keep local
    const merged: CustomBang[] = [
      // Keep existing bangs:
      // 1. Not in new tags → keep
      // 2. In previous source tags → remove (will be replaced)
      // 3. In conflict tags:
      //    - resolution === false (keep local) → keep
      //    - resolution === true (apply remote) → remove
      ...existingBangs.filter((bang) => {
        if (!newTagsSet.has(bang.t)) return true;
        if (previousTags.has(bang.t)) return false;
        // It's a conflict
        return conflictResolutions[bang.t] !== true;
      }),
      // Add parsed bangs:
      // 1. Not a conflict (new tag) → add
      // 2. Conflict with resolution === true (apply remote) → add
      // 3. In previous source tags → add (replace old)
      ...parsed.filter((bang) => {
        if (previousTags.has(bang.t)) return true;
        if (!existingBangs.some((e) => e.t === bang.t)) return true;
        return conflictResolutions[bang.t] === true;
      }),
    ];

    const newTags = Array.from(newTagsSet);

    if (existingIndex === -1) {
      sources.value.push({ name: sourceName, url: pending.sourceUrl, tags: newTags });
    } else {
      sources.value[existingIndex].tags = newTags;
    }
    customBangs.value = merged;
    saveToStorage();
    saveSourceUrls();
    showToast('success', `Imported ${sourceName} (${newTags.length} bangs)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resolve conflicts.";
    showToast('error', msg);
  } finally {
    importLoading.value = false;
    sourceConflicts.value = [];
    pendingImport.value = null;
    sourceAddModalVisible.value = false;
  }
}

async function syncSource(index: number) {
  await syncSourceAtIndex(index);
}

function handleToggleSourceEnabled(index: number) {
  const source = sources.value[index];
  if (!source) return;

  const sourceBangs = customBangs.value.filter(b => b.origin === source.name);
  if (sourceBangs.length === 0) return;

  const allEnabled = sourceBangs.every(b => b.enabled !== false);

  for (const bang of sourceBangs) {
    bang.enabled = !allEnabled;
  }
  saveToStorage();
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
    if (cleanConfirmVisible.value) {
      closeCleanConfirm();
    } else if (sourceRemoveVisible.value) {
      closeSourceRemoveConfirm();
    } else if (exportConfirmVisible.value) {
      closeExportConfirm();
    } else if (sourceAddModalVisible.value) {
      closeSourceAddModal();
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
    <div class="overflow-auto">
      <div class="mx4">
        <div class="mxa max-w-200">
        <div class="text-center">
          <h1>Custom Bangs</h1>
          <p>
            Create your own <code>!bang</code> shortcuts.
          </p>
        </div>

        <BangSearch :all-bangs="allBangs" mode="new-tab" />

        <div class="flex items-center gap-3 my-8 peer/hide">
          <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          <a href="/search" title="Back to search"
            class="text-neutral-400 hover:text-neutral-600 dark:(text-neutral-500 hover:text-neutral-300) transition">
            <div class="i-ph-eye-closed-duotone text-lg" />
          </a>
          <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
        </div>

        <div class="relative">
          <!-- Loading overlay -->
          <div
            v-if="importLoading"
            class="absolute inset-0 z-10 backdrop-blur-sm bg-white/40 dark:bg-black/40 pointer-events-auto cursor-not-allowed"
          />

          <BangSourceCards
            :sources="sources"
            :custom-bangs="customBangs"
            :loading="importLoading"
            :syncing-source-index="syncingSourceIndex"
            class="peer-hover/hide:op-20 peer-hover/hide:blur-sm transition duration-500"
            @add-recommended="importFromUrl"
            @add-custom-source="openSourceAddModal"
            @sync-source="syncSource"
            @remove-source="requestRemoveSource"
            @toggle-source-enabled="handleToggleSourceEnabled"
          />

          <section class="peer-hover/hide:op-20 peer-hover/hide:blur-sm transition duration-500">
            <BangManagePanel
              v-model="selectedBangTags"
              :bangs="allBangs"
              :sources="sources"
              :resolutions="resolutions"
              show-actions
              @toggle-enabled="toggleBangEnabled"
              @edit="handleEdit"
              @select="handleSelectBang"
            >
            <template #actions="{ filteredBangs, allFilteredSelected, filteredEnabledCount, filteredTotalCount, totalCount }"
            >
              <section class="flex gap-2">
                <button class="btn-primary btn-square text-xl" type="button" title="Add" aria-label="Add" @click="handleAdd">
                  <span class="i-ph-plus-circle-duotone" aria-hidden="true" />
                </button>
                <button class="btn-secondary btn-square text-xl" type="button" title="Export" aria-label="Export"
                  :disabled="!selectedEnabledBangs.length" @click="openExportConfirm">
                  <span class="i-ph-export-duotone" aria-hidden="true" />
                </button>
                <button class="btn-secondary btn-square text-xl" type="button"
                  :title="allFilteredSelected ? 'Deselect all' : 'Select all'"
                  :aria-label="allFilteredSelected ? 'Deselect all' : 'Select all'"
                  :disabled="!filteredBangs.length"
                  @click="handleToggleSelectAll(filteredBangs, allFilteredSelected)"
                >
                  <span
                    :class="allFilteredSelected ? 'i-ph-check-square-duotone' : 'i-ph-check-square-offset-duotone'"
                    aria-hidden="true" />
                </button>
                <button class="btn-secondary btn-square text-xl" type="button"
                  :title="filteredEnabledCount === filteredTotalCount ? 'Disable all' : 'Enable all'"
                  :aria-label="filteredEnabledCount === filteredTotalCount ? 'Disable all' : 'Enable all'"
                  :disabled="!totalCount"
                  @click="filteredEnabledCount === filteredTotalCount ? handleDisableAll(filteredBangs) : handleEnableAll(filteredBangs)"
                >
                  <span
                    :class="filteredEnabledCount === filteredTotalCount ? 'i-ph-toggle-right-duotone' : 'i-ph-toggle-left-duotone'"
                    aria-hidden="true" />
                </button>
                <button class="btn-danger btn-square text-xl" type="button" title="Clean" aria-label="Clean"
                  :disabled="!totalCount" @click="openCleanConfirm">
                  <span class="i-ph-broom-duotone" aria-hidden="true" />
                </button>
              </section>
            </template>
          </BangManagePanel>
        </section>
        </div>

      <BangAddModal :visible="addModalVisible" :error="importError" :loading="importLoading"
        @close="closeAddModal" @add-bang="handleAddBangSubmit"
        @import-file="importFromFile" />

      <SourceAddModal
        :visible="sourceAddModalVisible"
        :error="importError"
        :loading="importLoading"
        :conflicts="sourceConflicts"
        @close="closeSourceAddModal"
        @import-url="importFromUrl"
        @resolve-conflicts="handleResolveConflicts"
      />

      <BangModal :visible="modalVisible" :editing-bang="editingBang" @submit="handleModalSubmit" @close="closeModal" />

      <SourceRemoveConfirmModal :visible="sourceRemoveVisible" :source="removingSource"
        @close="closeSourceRemoveConfirm" @confirm="confirmRemoveSource" />

      <CleanConfirmModal :visible="cleanConfirmVisible" :count="cleanCount" :selected-count="selectedCount"
        :bangs="selectedCount ? selectedBangs : customBangs"
        @close="closeCleanConfirm" @confirm="confirmClean" />

      <ExportConfirmModal :visible="exportConfirmVisible" :bangs="selectedEnabledBangs"
        @close="closeExportConfirm" @confirm="confirmExport" />
    </div>
    </div>
    </div>
    <oduck-footer />

    <!-- Floating import process panel -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="importToast"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium"
        :class="{
          'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900': importToast.type === 'loading',
          'bg-green-600 text-white': importToast.type === 'success',
          'bg-red-600 text-white': importToast.type === 'error',
        }"
      >
        <span
          v-if="importToast.type === 'loading'"
          class="i-svg-spinners-180-ring text-base"
          aria-hidden="true"
        />
        <span
          v-else-if="importToast.type === 'success'"
          class="i-ph-check-circle text-base"
          aria-hidden="true"
        />
        <span
          v-else-if="importToast.type === 'error'"
          class="i-ph-warning-circle text-base"
          aria-hidden="true"
        />
        {{ importToast.message }}
      </div>
    </transition>
  </div>
</template>
