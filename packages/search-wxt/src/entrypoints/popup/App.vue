<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { BangList, BangModal, bangs, type CustomBang, type Bang, mergeBangs, parseCustomBangs } from "@oduck/ui";

const customBangs = ref<CustomBang[]>([]);
const searchQuery = ref("");
const selectedTags = ref<Set<string>>(new Set());
const modalVisible = ref(false);
const editingBang = ref<CustomBang | null>(null);

const allBangs = computed<Bang[]>(() => mergeBangs(customBangs.value, bangs));

const filteredBangs = computed(() => {
  if (!searchQuery.value.trim()) return customBangs.value;
  const q = searchQuery.value.trim().toLowerCase();
  return customBangs.value.filter((b) =>
    b.t.toLowerCase().includes(q) ||
    b.s.toLowerCase().includes(q) ||
    (b.sc && b.sc.toLowerCase().includes(q))
  );
});

async function loadCustomBangs() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const res = await browser.tabs.sendMessage(tab.id, { type: "get-custom-bangs" });
      if (res?.customBangs) {
        customBangs.value = parseCustomBangs(JSON.parse(res.customBangs));
        return;
      }
    }
  } catch {
    // fall through
  }

  try {
    const result = await browser.storage.local.get("custom-bangs");
    const saved = result["custom-bangs"];
    if (saved) {
      customBangs.value = parseCustomBangs(typeof saved === "string" ? JSON.parse(saved) : saved);
    }
  } catch {
    // ignore
  }
}

function toggleEnabled(index: number) {
  const bang = filteredBangs.value[index];
  if (!bang) return;
  const realIdx = customBangs.value.findIndex((b) => b.t === bang.t);
  if (realIdx === -1) return;
  customBangs.value[realIdx].enabled = customBangs.value[realIdx].enabled === false ? undefined : false;
  saveToStorage();
}

function handleEdit(index: number) {
  const bang = filteredBangs.value[index];
  if (!bang) return;
  editingBang.value = { ...bang };
  modalVisible.value = true;
}

function handleModalSubmit(bang: CustomBang) {
  const existing = customBangs.value.findIndex((b) => b.t === bang.t);
  if (existing !== -1) {
    customBangs.value[existing] = bang;
  } else {
    customBangs.value.push(bang);
  }
  saveToStorage();
  modalVisible.value = false;
  editingBang.value = null;
}

function closeModal() {
  modalVisible.value = false;
  editingBang.value = null;
}

function saveToStorage() {
  void browser.storage.local.set({ "custom-bangs": JSON.stringify(customBangs.value, null, 2) });
}

async function openManager() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ? new URL(tab.url).origin + "/custom.html" : "https://oduck.io/custom.html";
    void browser.tabs.create({ url });
  } catch {
    void browser.tabs.create({ url: "https://oduck.io/custom.html" });
  }
}

const resolutions = computed(() => {
  const map: Record<string, string> = {};
  for (const b of allBangs.value) map[b.t] = b.s;
  return map;
});

const enabledCount = computed(() => customBangs.value.filter((b) => b.enabled !== false).length);

onMounted(() => {
  void loadCustomBangs();
});
</script>

<template>
  <div class="w-[420px] p-4 flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <span class="i-ph-duck-duotone text-xl text-neutral-600 dark:text-neutral-400" />
      <h1 class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Custom Bangs
      </h1>
      <span class="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
        {{ enabledCount }}/{{ customBangs.length }} enabled
      </span>
    </div>

    <input
      v-model="searchQuery"
      type="text"
      class="input w-full"
      placeholder="Search your bangs..."
    />

    <div class="max-h-80 overflow-auto border border-neutral-200 dark:border-neutral-700 rounded-md">
      <BangList
        v-if="filteredBangs.length"
        :custom-bangs="filteredBangs"
        :selected-bang-tags="selectedTags"
        :resolutions="resolutions"
        height="h-64"
        @toggle-enabled="toggleEnabled"
        @edit="handleEdit"
      />
      <p v-else class="p-4 text-center text-sm text-neutral-400">
        No bangs match this filter.
      </p>
    </div>

    <div class="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
      <button
        class="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
        @click="modalVisible = true"
      >
        + Add Bang
      </button>
      <button
        class="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
        @click="openManager"
      >
        Open Manager →
      </button>
    </div>
  </div>

  <BangModal
    :visible="modalVisible"
    :editing-bang="editingBang"
    @submit="handleModalSubmit"
    @close="closeModal"
  />
</template>
