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
  resolveConflicts: [resolutions: Record<string, boolean>];
}>();

const sourceUrl = ref("");
const sourceName = ref("");

/** Per-item apply: tag → true=apply remote, false=keep local */
const selectedResolutions = ref<Record<string, boolean>>({});

watch(
  () => props.visible,
  (visible) => {
    sourceUrl.value = "";
    sourceName.value = "";
    if (visible && props.conflicts && props.conflicts.length > 0) {
      const map: Record<string, boolean> = {};
      for (const c of props.conflicts) {
        map[c.remote.t] = true;
      }
      selectedResolutions.value = map;
    } else {
      selectedResolutions.value = {};
    }
  },
  { immediate: true },
);

function handleSubmit() {
  const trimmedName = sourceName.value.trim();
  const trimmedUrl = sourceUrl.value.trim();
  if (trimmedName && trimmedUrl) emit("importUrl", trimmedName, trimmedUrl);
}

function toggleAll() {
  const allApplied = Object.values(selectedResolutions.value).every(Boolean);
  const next: Record<string, boolean> = {};
  for (const c of props.conflicts ?? []) {
    next[c.remote.t] = !allApplied;
  }
  selectedResolutions.value = next;
}

function confirmResolutions() {
  emit("resolveConflicts", selectedResolutions.value);
}

function toggleResolution(tag: string) {
  selectedResolutions.value = {
    ...selectedResolutions.value,
    [tag]: !selectedResolutions.value[tag],
  };
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :height="conflictMode ? 'min(85vh,520px)' : 'min(80vh,360px)'"
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
        Found {{ conflicts?.length ?? 0 }} conflicting bang(s). Click to toggle:
      </p>
      <div class="grid gap-2">
        <button
          v-for="(c, i) in conflicts"
          :key="i"
          type="button"
          class="flex items-center gap-1 text-left w-full cursor-pointer bg-transparent border-none rounded-md px-3 py-2 transition whitespace-nowrap overflow-x-auto hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30"
          :class="selectedResolutions[c.remote.t]
            ? 'opacity-100'
            : 'opacity-40'"
          @click="toggleResolution(c.remote.t)"
        >
          <span class="font-medium text-sm shrink-0">!{{ c.remote.t }}</span>
          <span class="text-neutral-400 shrink-0">:</span>
          <span class="text-xs">{{ c.local.d }}</span>
          <span class="text-neutral-400 shrink-0">→</span>
          <span class="text-xs">{{ c.remote.d }}</span>
        </button>
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

        <!-- Conflict mode: Apply All + Confirm -->
        <template v-else>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn-secondary"
              type="button"
              @click="toggleAll"
            >
              {{ Object.values(selectedResolutions).every(Boolean) ? 'Keep All' : 'Apply All' }}
            </button>
            <button
              class="btn-primary"
              type="button"
              :disabled="loading"
              @click="confirmResolutions"
            >
              {{ loading ? "Syncing..." : "Confirm" }}
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
