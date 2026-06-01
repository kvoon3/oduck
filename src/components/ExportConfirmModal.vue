<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { CustomBang } from "../custom-bang";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{
  visible: boolean;
  bangs: CustomBang[];
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const PREVIEW_LINES = 60;

const showAll = ref(false);
const fullJson = ref("");
const lineCount = ref(0);

watch(
  () => [props.visible, props.bangs] as const,
  ([visible, bangs]) => {
    if (!visible || bangs.length === 0) {
      showAll.value = false;
      fullJson.value = "";
      lineCount.value = 0;
      return;
    }
    fullJson.value = JSON.stringify(bangs, null, 2);
    lineCount.value = fullJson.value.split("\n").length;
    showAll.value = lineCount.value <= PREVIEW_LINES;
  },
  { immediate: true },
);

const previewLines = computed(() => {
  if (showAll.value) return fullJson.value;
  const lines = fullJson.value.split("\n");
  return lines.slice(0, PREVIEW_LINES).join("\n");
});

function toggleShowAll() {
  showAll.value = !showAll.value;
}
</script>

<template>
  <BaseModal :visible="visible" title="Export Bangs" @close="$emit('close')">
    <div class="px-7 pb-4 lt-sm:px-5 lt-sm:pb-2">
      <p class="text-sm text-[#666] dark:text-[#aaa]">
        Exporting <strong>{{ bangs.length }}</strong>
        {{ bangs.length === 1 ? "bang" : "bangs" }}.
      </p>
      <pre
        class="mt-4 p-4 border rounded-md bg-[#fafafa] text-xs text-[#333] overflow-auto max-h-50 dark:(bg-[#171717] text-[#d4d4d4])"
      >{{ previewLines }}</pre>
      <p class="mt-2 text-xs text-[#888] dark:text-[#666]">
        {{ lineCount }} lines of JSON
        <template v-if="lineCount > PREVIEW_LINES">
          &mdash;
          <button
            type="button"
            class="btn bg-transparent border-none text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer underline underline-offset-2 decoration-dotted hover:text-neutral-950 dark:hover:text-neutral-200"
            @click="toggleShowAll"
          >
            {{ showAll ? "Collapse" : `Show all ${lineCount} lines` }}
          </button>
        </template>
      </p>
    </div>

    <template #footer>
      <div class="p-7 pt-0 lt-sm:p-5 lt-sm:pt-0">
        <div class="flex gap-2 justify-end">
          <button class="btn-secondary" type="button" @click="$emit('close')">
            Cancel
          </button>
          <button class="btn-primary" type="button" @click="$emit('confirm')">
            Download
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
