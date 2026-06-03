<script setup lang="ts">
import { ref, watch } from "vue";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{
  visible: boolean;
  error: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  importUrl: [name: string, sourceUrl: string];
}>();

const sourceUrl = ref("");
const sourceName = ref("");

function reset() {
  sourceUrl.value = "";
  sourceName.value = "";
}

watch(
  () => props.visible,
  (v) => {
    if (v) reset();
  },
);

function handleSubmit() {
  const trimmedName = sourceName.value.trim();
  const trimmedUrl = sourceUrl.value.trim();
  if (trimmedName && trimmedUrl) emit("importUrl", trimmedName, trimmedUrl);
}
</script>

<template>
  <BaseModal :visible="visible" height="min(80vh,360px)" aria-labelledby="source-add-modal-title" @close="$emit('close')">
    <template #header>
      <div class="p-7 pb-0 lt-sm:p-5 lt-sm:pb-0">
        <h3 id="source-add-modal-title">Add Source</h3>
      </div>
    </template>

    <div class="overflow-auto min-h-0 px-7 pb-4 lt-sm:px-5 lt-sm:pb-2">
      <form class="grid gap-4 mt-6" @submit.prevent="handleSubmit">
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
          <input
            v-model="sourceUrl"
            class="input font-mono"
            placeholder="https://github.com/user/repo/blob/main/custom-bang.json"
            spellcheck="false"
            autocomplete="off"
            :disabled="loading"
          />
        </label>
      </form>
    </div>

    <template #footer>
      <div class="p7 pt0 lt-sm:p-5 lt-sm:pt-0">
        <button
          class="btn-primary block w-full"
          type="button"
          :disabled="loading || !sourceName.trim() || !sourceUrl.trim()"
          @click="handleSubmit"
        >
          {{ loading ? "Syncing..." : "Add Source" }}
        </button>
        <p v-if="error" class="error-text m0 text-sm">
          {{ error }}
        </p>
      </div>
    </template>
  </BaseModal>
</template>
