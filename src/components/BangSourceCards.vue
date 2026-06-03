<script setup lang="ts">
import { computed } from "vue";
import type { CustomBangSource } from "../custom-bang";

const props = defineProps<{
  sources: CustomBangSource[];
  loading: boolean;
  syncingSourceIndex: number | null;
}>();

const emit = defineEmits<{
  addRecommended: [name: string, url: string];
  syncSource: [index: number];
  removeSource: [index: number];
  addCustomSource: [];
}>();

const recommendedSources = [
  { name: "Kagi", icon: "i-simple-icons-kagi", url: "https://raw.githubusercontent.com/kagisearch/bangs/refs/heads/main/data/bangs.json" },
  { name: "Oduck", icon: "i-simple-icons-duckduckgo", url: "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/oduck.json" },
] as const;

interface SourceCard {
  name: string;
  icon: string;
  url: string;
  type: "installed" | "recommended";
  index?: number;
}

const cards = computed<SourceCard[]>(() => {
  const result: SourceCard[] = [];

  // Recommended first
  for (const rec of recommendedSources) {
    if (!props.sources.some(s => s.name === rec.name)) {
      result.push({
        name: rec.name,
        icon: rec.icon,
        url: rec.url,
        type: "recommended",
      });
    }
  }

  for (const [index, source] of props.sources.entries()) {
    const rec = recommendedSources.find(r => r.name === source.name);
    result.push({
      name: source.name,
      icon: rec?.icon ?? "i-carbon-link",
      url: source.url,
      type: "installed",
      index,
    });
  }

  return result;
});
</script>

<template>
  <div v-if="cards.length > 0" class="mb-6">
    <div class="text-sm font-medium text-[#444] dark:text-[#cfcfcf] mb-2">
      Sources
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div
        v-for="card in cards"
        :key="card.name"
        class="relative flex flex-col items-center gap-1.5 rounded-lg border border-dashed p-4 bg-transparent"
      >
        <div class="absolute top-1.5 left-2">
          <a
            :href="card.url"
            target="_blank"
            rel="noopener noreferrer"
            class="cursor-pointer"
          >
            <div class="size-4 i-ph-link-duotone" />
          </a>
        </div>

        <button
          v-if="card.type === 'installed'"
          class="absolute top-2 right-2 size-4 flex items-center justify-center bg-transparent border-none cursor-pointer p-0 opacity-50 hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-all"
          :disabled="loading || syncingSourceIndex !== null"
          title="Remove"
          @click="card.index !== undefined && emit('removeSource', card.index)"
        >
          <span class="i-ph-x-bold text-[10px]" />
        </button>

        <div :class="card.icon" class="text-2xl mt-1" />
        <span class="text-xs font-medium">{{ card.name }}</span>

        <span
          class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          :class="card.type === 'installed'
            ? 'bg-neutral-200 text-neutral-600 dark:(bg-neutral-700 text-neutral-300)'
            : 'bg-blue-50 text-blue-600 dark:(bg-blue-900/30 text-blue-300)'"
        >
          {{ card.type === "installed" ? "Installed" : "Recommended" }}
        </span>

        <button
          v-if="card.type === 'installed'"
          class="btn-primary btn-xs mt-0.5"
          type="button"
          :disabled="loading || syncingSourceIndex !== null"
          @click="card.index !== undefined && emit('syncSource', card.index)"
        >
          {{ syncingSourceIndex === card.index ? "Syncing..." : "Sync" }}
        </button>
        <button
          v-else
          class="btn-primary btn-xs mt-0.5"
          :disabled="loading"
          @click="emit('addRecommended', card.name, card.url)"
        >
          Add
        </button>
      </div>

      <!-- Add custom source -->
      <button
        class="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 bg-transparent cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
        :disabled="loading"
        @click="emit('addCustomSource')"
      >
        <div class="i-ph-plus-circle-duotone text-2xl text-neutral-400 dark:text-neutral-500" />
        <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Add Source</span>
      </button>
    </div>
  </div>
</template>
