<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { bangs } from "../bang";
import {
  type Bang,
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

const fileInput = ref<HTMLInputElement | null>(null);
const tryBang = ref<CustomBang | null>(null);
const tryQuery = ref("");
const tryModalVisible = ref(false);

const testQuery = ref("");
const allBangs = computed<Bang[]>(() => [...getActiveCustomBangs(), ...bangs]);

const searchEngines = [
  { name: "Google", key: "google", u: "https://www.google.com/search?q={{{s}}}" },
  { name: "DuckDuckGo", key: "ddg", u: "https://duckduckgo.com/?q={{{s}}}" },
  { name: "Bing", key: "bing", u: "https://www.bing.com/search?q={{{s}}}" },
] as const;
const fallbackEngine = ref<string>(localStorage.getItem("fallback-engine") ?? "google");
const customEngineUrl = ref(localStorage.getItem("fallback-engine-url") ?? "");
const showCustomInput = ref(fallbackEngine.value === "other");

function onFallbackEngineChange() {
  localStorage.setItem("fallback-engine", fallbackEngine.value);
  showCustomInput.value = fallbackEngine.value === "other";
  if (fallbackEngine.value !== "other") {
    customEngineUrl.value = "";
    localStorage.removeItem("fallback-engine-url");
  }
}

function onCustomEngineUrlChange() {
  localStorage.setItem("fallback-engine-url", customEngineUrl.value);
}

function resolveFallbackUrl(query: string): string {
  let templateUrl = "";

  if (fallbackEngine.value === "other") {
    templateUrl = customEngineUrl.value;
  } else {
    const engine = searchEngines.find((e) => e.key === fallbackEngine.value);
    templateUrl = engine?.u ?? "";
  }

  if (!templateUrl) return "";
  return templateUrl.replace("{{{s}}}", encodeURIComponent(query).replace(/%2F/g, "/"));
}

function getActiveCustomBangs(): Bang[] {
  return customBangs.value
    .filter((b) => b.enabled !== false)
    .map(({ enabled: _enabled, ...bang }) => bang);
}

const testMatch = computed<{ bang: Bang | null; cleanQuery: string; url: string }>(() => {
  const q = testQuery.value.trim();
  if (!q) return { bang: null, cleanQuery: "", url: "" };

  const match = q.match(/!(\S+)/i);
  const bangToken = match?.[1]?.toLowerCase();
  const matchedBang = allBangs.value.find((b) => b.t === bangToken) ?? null;
  const cleanQuery = q.replace(/!\S+\s*/i, "").trim();

  if (!matchedBang) {
    let fallbackUrl = "";
    if (cleanQuery) {
      fallbackUrl = resolveFallbackUrl(cleanQuery);
    }
    return { bang: null, cleanQuery, url: fallbackUrl };
  }
  if (!cleanQuery) return { bang: matchedBang, cleanQuery: "", url: `https://${matchedBang.d}` };

  const url = matchedBang.u.replace(
    "{{{s}}}",
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  return { bang: matchedBang, cleanQuery, url };
});

function doTestRedirect() {
  if (!testMatch.value.url) return;
  window.open(testMatch.value.url, "_blank");
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
  customBangs.value.splice(index, 1);
  if (editingIndex.value === index) {
    closeModal();
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    editingIndex.value -= 1;
  }
  saveToStorage();
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
    if (tryModalVisible.value) {
      closeTryModal();
    } else if (modalVisible.value) {
      closeModal();
    }
  }
}

function handleTry(index: number) {
  const bang = customBangs.value[index];
  if (!bang) return;
  tryBang.value = bang;
  tryQuery.value = "";
  tryModalVisible.value = true;
}

function closeTryModal() {
  tryModalVisible.value = false;
  tryBang.value = null;
}

function doTryRedirect() {
  if (!tryBang.value) return;
  const query = tryQuery.value.trim();
  if (!query) return;
  const searchUrl = tryBang.value.u.replace(
    "{{{s}}}",
    encodeURIComponent(query).replace(/%2F/g, "/"),
  );
  window.open(searchUrl, "_blank");
  closeTryModal();
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
      <section class="mt-13">
        <h2 class="text-[22px]">Try a bang</h2>
        <form class="flex items-center gap-2 mt-4 justify-center" @submit.prevent="doTestRedirect">
          <input
            v-model="testQuery"
            type="text"
            class="input flex-1 max-w-[400px]"
            placeholder="e.g. !gh vuejs/core"
            spellcheck="false"
            autocomplete="off"
          />
          <button
            class="btn-icon"
            type="submit"
            :title="testMatch.url ? 'Open in new tab' : 'Enter a bang query first'"
            :disabled="!testMatch.url"
            :class="testMatch.url ? 'text-[#1a1a1a] dark:text-[#f1f1f1]' : 'text-[#aaa] dark:text-[#555]'"
          >
            <span class="i-ph-arrow-square-out-duotone text-xl" aria-hidden="true"></span>
          </button>
        </form>
        <div class="mt-4 p-3.5 border rounded-md bg-[#fafafa] dark:bg-[#171717] min-h-[48px] flex items-center justify-center">
          <template v-if="!testQuery.trim()">
            <span class="text-[#aaa] dark:text-[#555] text-sm">Enter a bang query to see where it redirects</span>
          </template>
          <template v-else-if="!testMatch.bang">
            <code class="text-sm break-all text-[#1a7a1a] dark:text-[#4ade80]">{{ testMatch.url }}</code>
          </template>
          <template v-else>
            <code class="text-sm break-all text-[#1a7a1a] dark:text-[#4ade80]">{{ testMatch.url }}</code>
          </template>
        </div>
      </section>
      <section class="mt-13">
        <h2 class="text-[22px]">Default Search Engine</h2>
        <p class="mt-2 text-sm text-[#666] dark:text-[#aaa]">
          Fallback when no bang or an unknown bang is typed.
        </p>
        <div class="mt-4 flex flex-col items-center gap-3">
          <select
            v-model="fallbackEngine"
            class="input max-w-[400px] w-full"
            @change="onFallbackEngineChange"
          >
            <option
              v-for="engine in searchEngines"
              :key="engine.key"
              :value="engine.key"
            >
              {{ engine.name }}
            </option>
            <option value="other">Other…</option>
          </select>
          <input
            v-if="showCustomInput"
            v-model="customEngineUrl"
            type="text"
            class="input max-w-[400px] w-full"
            placeholder="https://kagi.com/search?q={{{s}}}"
            spellcheck="false"
            @input="onCustomEngineUrlChange"
          />
        </div>
      </section>
      <section class="mt-25 text-left">
        <div class="flex items-center justify-between gap-4 lt-sm:(flex-col items-start)">
          <h2 class="text-[22px]">Your Bangs</h2>
          <div class="flex gap-2 flex-wrap justify-end lt-sm:(w-full justify-stretch)">
            <button class="btn-primary lt-sm:flex-1" type="button" @click="openModal()">
              Add Bang
            </button>
            <button class="btn-secondary lt-sm:flex-1" type="button" @click="handleImport">
              Import
            </button>
            <button class="btn-secondary lt-sm:flex-1" type="button" @click="handleExport">
              Export
            </button>
          </div>
        </div>

        <div class="mt-4.5">
          <p v-if="customBangs.length === 0"
            class="p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa])">
            No custom bangs yet.
          </p>
          <div v-else>
            <div v-for="(bang, index) in customBangs" :key="bang.t + '-' + index"
              class="mb2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 border rounded-md cursor-pointer transition duration-150 lt-sm:grid-cols-1"
              :class="bang.enabled === false
                ? 'bg-[#f1f1f1] text-[#777] op-65 hover:op-85 dark:(bg-[#111] text-[#777])'
                : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[#f3f3f3] dark:(bg-[#171717] text-[#f1f1f1] hover:bg-[#1d1d1d])'
                " role="button" tabindex="0" :aria-pressed="bang.enabled !== false"
              :title="bang.enabled === false ? 'Disabled' : 'Enabled'" @click="toggleBang(index)"
              @keydown.enter.prevent="toggleBang(index)" @keydown.space.prevent="toggleBang(index)">
              <div class="flex items-baseline gap-2.5 min-w-0">
                <strong class="min-w-0 truncate">{{ bang.s }}</strong>
                <span class="flex-none text-[13px]" :class="bang.enabled === false
                  ? 'text-[#888] dark:text-[#666]'
                  : 'text-[#666] dark:text-[#aaa]'
                  ">!{{ bang.t }}</span>
              </div>
              <div class="flex gap-1.5 lt-sm:w-full">
                <button class="btn-secondary btn-sm flex-1" type="button" @click.stop="handleTry(index)">
                  Try
                </button>
                <button class="btn-secondary btn-sm flex-1" type="button" @click.stop="handleEdit(index)">
                  Edit
                </button>
                <button class="btn-danger btn-sm flex-1" type="button" @click.stop="handleRemove(index)">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <input ref="fileInput" class="hidden" type="file" accept="application/json,.json" @change="onFileChange" />
      </section>
    </div>

    <BangModal :visible="modalVisible" :editing-bang="editingBang" @submit="handleModalSubmit" @close="closeModal" />

    <BaseModal :visible="tryModalVisible" @close="closeTryModal">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-[18px]">Try !{{ tryBang?.t }}</h3>
        <button class="btn-close" type="button" aria-label="Close" @click="closeTryModal">
          ×
        </button>
      </div>

      <form class="grid gap-4 mt-6" @submit.prevent="doTryRedirect">
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Search query
          </span>
          <div class="flex items-center gap-2">
            <input v-model="tryQuery" class="input flex-1" placeholder="e.g. how to center a div" spellcheck="false"
              autocomplete="off" required />
            <button class="btn-icon" type="button" :title="tryQuery.trim() ? 'Open in new tab' : 'Enter a query first'"
              :disabled="!tryQuery.trim()"
              :class="tryQuery.trim() ? 'text-[#1a1a1a] dark:text-[#f1f1f1]' : 'text-[#aaa] dark:text-[#555]'"
              @click="doTryRedirect">
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
