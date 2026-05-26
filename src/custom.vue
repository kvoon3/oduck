<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { bangs } from "./bang";
import {
  type Bang,
  type CustomBang,
  parseCustomBangs,
} from "./custom-bang";
import BangModal from "./components/BangModal.vue";
import BangSearch from "./components/BangSearch.vue";
import BangList from "./components/BangList.vue";
import RemoveConfirmModal from "./components/RemoveConfirmModal.vue";

const LS_CUSTOM_BANGS = "custom-bangs";

const customBangs = ref<CustomBang[]>([]);
const editingBang = ref<CustomBang | null>(null);
const editingIndex = ref<number | null>(null);
const modalVisible = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);

const removeConfirmIndex = ref<number | null>(null);
const removeConfirmVisible = ref(false);
const removingBang = computed<CustomBang | null>(() => {
  return removeConfirmIndex.value !== null ? (customBangs.value[removeConfirmIndex.value] ?? null) : null;
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

function handleImport() {
  fileInput.value?.click();
}

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const parsed = parseCustomBangs(JSON.parse(await file.text()));
    customBangs.value = parsed;
    closeModal();
    saveToStorage();
  } catch (error) {
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}

function handleEsc(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (removeConfirmVisible.value) {
      closeRemoveConfirm();
    } else if (modalVisible.value) {
      closeModal();
    }
  }
}

onMounted(() => {
  customBangs.value = loadFromStorage();
  document.addEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="flex flex-col items-center min-h-screen pt-[12vh] px-5 pb-22">
    <div class="max-w-[46rem] w-full">
      <div class="text-center">
        <h1>Custom Bangs</h1>
        <p>
          Create your own <code>!bang</code> shortcuts.
          <a href="/" class="link link-active">← Back to Od*ck</a>
        </p>
      </div>

      <BangSearch :all-bangs="allBangs" />

      <BangList :custom-bangs="customBangs" @add="openModal()" @import="handleImport" @export="handleExport"
        @toggle="toggleBang" @edit="handleEdit" @remove="handleRemove" />

      <input ref="fileInput" class="hidden" type="file" accept="application/json,.json" @change="onFileChange" />
    </div>

    <BangModal :visible="modalVisible" :editing-bang="editingBang" @submit="handleModalSubmit" @close="closeModal" />

    <RemoveConfirmModal :visible="removeConfirmVisible" :removing-bang="removingBang" @close="closeRemoveConfirm"
      @confirm="confirmRemove" />

    <footer class="fixed bottom-4 left-0 right-0 text-center text-sm text-[#666] dark:text-[#999]">
      <a href="https://x.com/kvoon_" target="_blank" class="link link-active">kvoon3</a>
      •
      <a href="https://github.com/kvoon3/oduck" target="_blank" class="link link-active">github</a>
    </footer>
  </div>
</template>
