<script setup lang="ts">
import { nextTick, ref, shallowRef, watch } from "vue";
import type { CustomBangSource } from "../custom-bang";
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
  file: [];
  editSource: [index: number, sourceUrl: string];
  removeSource: [index: number];
  syncSource: [index: number];
  url: [sourceUrl: string];
}>();

const sourceUrl = ref("");
const editingSourceIndex = shallowRef<number | null>(null);
const editingSourceUrl = ref("");
const editingSourceTextarea = shallowRef<HTMLTextAreaElement | null>(null);

watch(
  () => props.visible,
  (visible) => {
    if (visible) return;
    sourceUrl.value = "";
    cancelEditSource();
  },
);

function handleSubmit() {
  const trimmed = sourceUrl.value.trim();
  if (trimmed) emit("url", trimmed);
}

async function editSource(index: number, url: string) {
  editingSourceIndex.value = index;
  editingSourceUrl.value = url;
  await nextTick();
  editingSourceTextarea.value?.focus();
}

function setEditingSourceTextarea(element: Element | null) {
  editingSourceTextarea.value = element instanceof HTMLTextAreaElement
    ? element
    : null;
}

function cancelEditSource() {
  editingSourceIndex.value = null;
  editingSourceUrl.value = "";
  editingSourceTextarea.value = null;
}

function saveSource(index: number) {
  const trimmed = editingSourceUrl.value.trim();
  if (!trimmed) return;

  emit("editSource", index, trimmed);
  cancelEditSource();
}
</script>

<template>
  <BaseModal :visible="visible" title="Import Bangs" @close="$emit('close')">
    <form class="grid gap-8 p-7 pt-0 lt-sm:p-5 lt-sm:pt-0" @submit.prevent="handleSubmit">
      <label class="w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf] mr2">
          Import from file:
        </span>
        <button class="btn-secondary btn-sm" type="button" :disabled="loading" @click="$emit('file')">
          Choose File
        </button>
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
          <button class="btn-primary py-2.5 shrink-0" type="submit" :disabled="loading || !sourceUrl.trim()">
            {{ loading ? "Syncing..." : "Add Source" }}
          </button>
        </div>

        <p class="m0 mt2 text-[13px] leading-5 text-[#666] dark:text-[#aaa]">
          GitHub file links and raw JSON URLs are saved as subscription sources.
        </p>
      </label>

      <div v-if="sources.length > 0" class="grid gap-2">
        <div class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Sources
        </div>
        <div
          v-for="(source, index) in sources"
          :key="source.url"
          class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-md bg-neutral-200/45 px-2.5 py-2 dark:bg-neutral-800/70 lt-sm:grid-cols-1"
        >
          <textarea
            v-if="editingSourceIndex === index"
            :ref="setEditingSourceTextarea"
            v-model="editingSourceUrl"
            class="input min-h-[4.75em] resize-none font-mono leading-5 py-1.5"
            rows="2"
            spellcheck="false"
            autocomplete="off"
            :disabled="loading || syncingSourceIndex !== null"
            @blur="cancelEditSource"
            @keydown.enter.stop.prevent="saveSource(index)"
            @keydown.escape.stop.prevent="cancelEditSource"
          />
          <button
            v-else
            class="min-w-0 cursor-text truncate border-none bg-transparent p-0 text-left font-mono text-[12px] text-[#555] outline-none focus-visible:(ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(text-[#bbb] focus-visible:ring-offset-[#101010])"
            type="button"
            :disabled="loading || syncingSourceIndex !== null || editingSourceIndex !== null"
            :title="source.url"
            @click="editSource(index, source.url)"
          >
            {{ source.url }}
          </button>
          <button
            class="btn-secondary btn-sm"
            type="button"
            :disabled="loading || syncingSourceIndex !== null || editingSourceIndex !== null"
            @click="$emit('syncSource', index)"
          >
            {{ syncingSourceIndex === index ? "Syncing..." : "Sync" }}
          </button>
          <button class="btn-danger btn-sm" type="button" :disabled="loading || syncingSourceIndex !== null || editingSourceIndex !== null" @click="$emit('removeSource', index)">
            Remove
          </button>
        </div>
      </div>

      <p v-if="error" class="error-text m-0 text-sm">
        {{ error }}
      </p>
    </form>
  </BaseModal>
</template>
