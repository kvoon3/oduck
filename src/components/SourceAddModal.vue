<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseModal from "./BaseModal.vue";
import type { CustomBang } from "../custom-bang";

const props = defineProps<{
  visible: boolean;
  error: string;
  loading: boolean;
  conflicts?: { local: CustomBang; remote: CustomBang }[];
}>();

const conflictMode = computed(() => (props.conflicts?.length ?? 0) > 0);

const emit = defineEmits<{
  close: [];
  importUrl: [name: string, sourceUrl: string];
  resolveConflicts: [resolution: "keep-local" | "keep-remote"];
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

function handleResolve(resolution: "keep-local" | "keep-remote") {
  emit("resolveConflicts", resolution);
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :height="conflictMode ? 'min(80vh,480px)' : 'min(80vh,360px)'"
    aria-labelledby="source-add-modal-title"
    @close="$emit('close')"
  >
    <template #header>
      <div class="p-7 pb-0 lt-sm:p-5 lt-sm:pb-0">
        <h3 id="source-add-modal-title">
          {{ conflictMode ? "Resolve Conflicts" : "Add Source" }}
        </h3>
      </div>
    </template>

    <!-- Normal import form -->
    <div
      v-if="!conflictMode"
      class="overflow-auto min-h-0 px-7 pb-4 lt-sm:px-5 lt-sm:pb-2"
    >
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

    <!-- Conflict resolution -->
    <div
      v-else
      class="overflow-auto min-h-0 px-7 pb-4 lt-sm:px-5 lt-sm:pb-2"
    >
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-4 mb-3">
        Found {{ conflicts?.length ?? 0 }} conflicting bang(s). Choose how to resolve:
      </p>
      <div class="grid gap-2">
        <div
          v-for="(c, i) in conflicts"
          :key="i"
          class="flex items-center gap-3 text-sm px-3 py-2 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium">!{{ c.remote.t }}</span>
              <span class="text-xs text-neutral-500">{{ c.remote.s }}</span>
            </div>
            <div class="text-xs text-neutral-400 mt-0.5 truncate">
              Local: {{ c.local.d }} ({{ c.local.origin || "manual" }})
              <span class="mx-1">→</span>
              Remote: {{ c.remote.d }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="p7 pt0 lt-sm:p-5 lt-sm:pt-0">
        <!-- Normal mode: single Add button -->
        <template v-if="!conflictMode">
          <button
            class="btn-primary block w-full"
            type="button"
            :disabled="loading || !sourceName.trim() || !sourceUrl.trim()"
            @click="handleSubmit"
          >
            {{ loading ? "Syncing..." : "Add Source" }}
          </button>
        </template>

        <!-- Conflict mode: three action buttons -->
        <template v-else>
          <div class="grid grid-cols-3 gap-2">
            <button
              class="btn-secondary"
              type="button"
              @click="handleResolve('keep-local')"
            >
              Keep Local
            </button>
            <button
              class="btn-primary"
              type="button"
              @click="handleResolve('keep-remote')"
            >
              Keep Remote
            </button>
            <button
              class="btn-secondary"
              type="button"
              @click="$emit('close')"
            >
              Cancel
            </button>
          </div>
        </template>

        <p v-if="error" class="error-text m0 text-sm">
          {{ error }}
        </p>
      </div>
    </template>
  </BaseModal>
</template>
