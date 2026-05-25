<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  type CustomBang,
  parseCustomBangs,
} from "../custom-bang";
import BangModal from "./BangModal.vue";
import BaseModal from "./BaseModal.vue";

const LS_CUSTOM_BANGS = "custom-bangs";

const customBangs = ref<CustomBang[]>([]);
const editingBang = ref<CustomBang | null>(null);
const editingIndex = ref<number | null>(null);
const modalVisible = ref(false);
const statusMessage = ref("");
const statusError = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const testBang = ref<CustomBang | null>(null);
const testQuery = ref("");
const testModalVisible = ref(false);

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

function setStatus(msg: string, isError = false) {
  statusMessage.value = msg;
  statusError.value = isError;
}

function openModal(bang: CustomBang | null = null, index: number | null = null) {
  editingBang.value = bang;
  editingIndex.value = index;
  modalVisible.value = true;
  setStatus(bang ? `Editing !${bang.t}.` : "");
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
  setStatus(checked ? `Enabled !${bang.t}.` : `Disabled !${bang.t}.`);
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
  customBangs.value.splice(index, 1);
  if (editingIndex.value === index) {
    closeModal();
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    editingIndex.value -= 1;
  }
  saveToStorage();
  setStatus(`Removed !${bang.t}.`);
}

function handleModalSubmit(bang: CustomBang) {
  if (editingIndex.value !== null) {
    customBangs.value[editingIndex.value] = bang;
  } else if (customBangs.value.find((b) => b.t === bang.t)) {
    setStatus(`!${bang.t} already exists. Use Edit to change it.`, true);
    return;
  } else {
    customBangs.value.push(bang);
  }

  closeModal();
  saveToStorage();
  setStatus(`Saved !${bang.t}.`);
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
  setStatus("Exported custom-bang.json.");
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
    setStatus("Imported and saved locally.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Custom bang config is invalid.";
    setStatus(message, true);
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}

function handleEsc(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (testModalVisible.value) {
      closeTestModal();
    } else if (modalVisible.value) {
      closeModal();
    }
  }
}

function handleTest(index: number) {
  const bang = customBangs.value[index];
  if (!bang) return;
  testBang.value = bang;
  testQuery.value = "";
  testModalVisible.value = true;
}

function closeTestModal() {
  testModalVisible.value = false;
  testBang.value = null;
}

function doTestRedirect() {
  if (!testBang.value) return;
  const query = testQuery.value.trim();
  if (!query) return;
  const searchUrl = testBang.value.u.replace(
    "{{{s}}}",
    encodeURIComponent(query).replace(/%2F/g, "/"),
  );
  window.open(searchUrl, "_blank");
  closeTestModal();
}

onMounted(() => {
  customBangs.value = loadFromStorage();
  document.addEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="flex flex-col items-center min-h-screen pt-[12vh] px-5 pb-22">
    <div class="max-w-[46rem] w-full text-center">
      <h1>Custom Bangs</h1>
      <p>
        Create your own <code>!bang</code> shortcuts.
        <a href="/" class="link link-active">← Back to Od*ck</a>
      </p>
      <section class="mt-25 text-left">
        <div
          class="flex items-center justify-between gap-4 lt-sm:(flex-col items-start)"
        >
          <h2 class="text-[22px]">Your Bangs</h2>
          <div
            class="flex gap-2 flex-wrap justify-end lt-sm:(w-full justify-stretch)"
          >
            <button
              class="btn-primary lt-sm:flex-1"
              type="button"
              @click="openModal()"
            >
              Add Bang
            </button>
            <button
              class="btn-secondary lt-sm:flex-1"
              type="button"
              @click="handleImport"
            >
              Import
            </button>
            <button
              class="btn-secondary lt-sm:flex-1"
              type="button"
              @click="handleExport"
            >
              Export
            </button>
          </div>
        </div>

        <div class="mt-4.5">
          <p
            v-if="customBangs.length === 0"
            class="p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa])"
          >
            No custom bangs yet.
          </p>
          <ul v-else class="grid gap-1.5 list-none">
            <li
              v-for="(bang, index) in customBangs"
              :key="bang.t + '-' + index"
              class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 border rounded-md cursor-pointer transition duration-150 lt-sm:grid-cols-1"
              :class="
                bang.enabled === false
                  ? 'bg-[#f1f1f1] text-[#777] op-65 hover:op-85 dark:(bg-[#111] text-[#777])'
                  : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[#f3f3f3] dark:(bg-[#171717] text-[#f1f1f1] hover:bg-[#1d1d1d])'
              "
              role="button"
              tabindex="0"
              :aria-pressed="bang.enabled !== false"
              :title="bang.enabled === false ? 'Disabled' : 'Enabled'"
              @click="toggleBang(index)"
              @keydown.enter.prevent="toggleBang(index)"
              @keydown.space.prevent="toggleBang(index)"
            >
              <div class="flex items-baseline gap-2.5 min-w-0">
                <strong class="min-w-0 truncate">{{ bang.s }}</strong>
                <span
                  class="flex-none text-[13px]"
                  :class="
                    bang.enabled === false
                      ? 'text-[#888] dark:text-[#666]'
                      : 'text-[#666] dark:text-[#aaa]'
                  "
                  >!{{ bang.t }}</span
                >
              </div>
              <div class="flex gap-1.5 lt-sm:w-full">
                <button
                  class="btn-secondary btn-sm flex-1"
                  type="button"
                  @click.stop="handleTest(index)"
                >
                  Test
                </button>
                <button
                  class="btn-secondary btn-sm flex-1"
                  type="button"
                  @click.stop="handleEdit(index)"
                >
                  Edit
                </button>
                <button
                  class="btn-danger btn-sm flex-1"
                  type="button"
                  @click.stop="handleRemove(index)"
                >
                  Remove
                </button>
              </div>
            </li>
          </ul>
        </div>

        <input
          ref="fileInput"
          class="hidden"
          type="file"
          accept="application/json,.json"
          @change="onFileChange"
        />
        <p
          class="min-h-[21px] mt-2 text-sm"
          :class="
            statusError
              ? 'error-text'
              : 'text-[#555] dark:text-[#aaa]'
          "
          aria-live="polite"
        >
          {{ statusMessage }}
        </p>
      </section>
    </div>

    <BangModal
      :visible="modalVisible"
      :editing-bang="editingBang"
      @submit="handleModalSubmit"
      @close="closeModal"
    />

    <BaseModal :visible="testModalVisible" @close="closeTestModal">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-[18px]">Test !{{ testBang?.t }}</h3>
        <button
          class="btn-close"
          type="button"
          aria-label="Close"
          @click="closeTestModal"
        >
          ×
        </button>
      </div>

      <form
        class="grid gap-4 mt-6"
        @submit.prevent="doTestRedirect"
      >
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Search query
          </span>
          <div class="flex items-center gap-2">
            <input
              v-model="testQuery"
              class="input flex-1"
              placeholder="e.g. how to center a div"
              spellcheck="false"
              autocomplete="off"
              required
            />
            <button
              class="btn-icon"
              type="button"
              :title="testQuery.trim() ? 'Open in new tab' : 'Enter a query first'"
              :disabled="!testQuery.trim()"
              :class="testQuery.trim() ? 'text-[#1a1a1a] dark:text-[#f1f1f1]' : 'text-[#aaa] dark:text-[#555]'"
              @click="doTestRedirect"
            >
              <span class="i-ph-arrow-square-out-duotone text-xl" aria-hidden="true"></span>
            </button>
          </div>
        </label>
      </form>
    </BaseModal>

    <footer class="fixed bottom-4 left-0 right-0 text-center text-sm text-[#666] dark:text-[#999]">
      <a href="https://x.com/kvoon_" target="_blank" class="link link-active">kvoon3</a>
      •
      <a href="https://github.com/kvoon3/oduck" target="_blank" class="link link-active">github</a>
    </footer>
  </div>
</template>
