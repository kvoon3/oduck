<script setup lang="ts">
import { computed } from "vue";
import type { CustomBang, CustomBangSource } from "../custom-bang";

const props = defineProps<{
  sources: CustomBangSource[];
  customBangs: CustomBang[];
  loading: boolean;
  syncingSourceIndex: number | null;
}>();

const emit = defineEmits<{
  addRecommended: [name: string, url: string];
  syncSource: [index: number];
  removeSource: [index: number];
  toggleSourceEnabled: [index: number];
  addCustomSource: [];
}>();

const recommendedSources = [
  { name: "Kagi", icon: "i-simple-icons-kagi", url: "https://raw.githubusercontent.com/kagisearch/bangs/refs/heads/main/data/bangs.json" },
  { name: "Oduck", icon: "i-simple-icons-duckduckgo", url: "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/oduck.json" },
  { name: "DuckDuckGo", icon: "i-simple-icons-duckduckgo", url: "https://raw.githubusercontent.com/kvoon3/oduck/refs/heads/main/public/unduck.json" },
] as const;

interface SourceCard {
  name: string;
  icon: string;
  url: string;
  type: "installed" | "recommended";
  index?: number;
  enabled?: boolean;
}

const cards = computed<SourceCard[]>(() => {
  const result: SourceCard[] = [];

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
    const sourceBangs = props.customBangs.filter(b => b.origin === source.name);
    const allEnabled = sourceBangs.length > 0 && sourceBangs.every(b => b.enabled !== false);
    result.push({
      name: source.name,
      icon: rec?.icon ?? "i-carbon-link",
      url: source.url,
      type: "installed",
      index,
      enabled: allEnabled,
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
        class="relative flex flex-col items-center gap-1.5 rounded-lg border border-dashed p-4 transition-[opacity,background-color] duration-200"
        :class="[
          card.type === 'installed' && !card.enabled
            ? 'bg-transparent opacity-60 hover:opacity-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
            : 'bg-transparent opacity-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
        ]"
      >
        <button
          v-if="card.type === 'installed'"
          class="absolute top-2 right-2 size-5 flex items-center justify-center border-none cursor-pointer p-0 rounded opacity-40 hover:opacity-100 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/60 transition-all bg-neutral-100/60 dark:bg-neutral-800/40"
          :disabled="loading || syncingSourceIndex !== null"
          title="Remove"
          @click.stop="card.index !== undefined && emit('removeSource', card.index)"
        >
          <span class="i-ph-x-bold text-xs" />
        </button>

        <a
          :href="card.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="card.icon"
          class="text-2xl mt-1 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
          title="Open source link"
          @click.stop
        />
        <span class="text-xs font-medium">{{ card.name }}</span>

        <span
          class="text-[10px] px-1.5 py-0.5 rounded-full font-medium cursor-pointer select-none transition-colors"
          :class="card.type === 'installed'
            ? (card.enabled
                ? 'bg-green-50 text-green-600 dark:(bg-green-900/30 text-green-300) hover:bg-green-100 dark:hover:bg-green-900/40'
                : 'bg-neutral-200 text-neutral-600 dark:(bg-neutral-700 text-neutral-300) hover:bg-neutral-300 dark:hover:bg-neutral-600')
            : 'bg-blue-50 text-blue-600 dark:(bg-blue-900/30 text-blue-300)'"
          @click.stop="card.type === 'installed' && card.index !== undefined && emit('toggleSourceEnabled', card.index)"
        >
          {{ card.type === 'installed' ? (card.enabled ? "Enabled" : "Disabled") : "Recommended" }}
        </span>

        <div v-if="card.type === 'installed'" class="flex items-center gap-1 mt-1">
          <button
            class="size-6 flex items-center justify-center border-none cursor-pointer rounded p-0 opacity-60 hover:opacity-100 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-all bg-neutral-100/60 dark:bg-neutral-800/40 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            type="button"
            :disabled="loading || syncingSourceIndex !== null"
            title="Sync"
            @click="card.index !== undefined && emit('syncSource', card.index)"
          >
            <span
              :class="syncingSourceIndex === card.index ? 'i-ph-spinner animate-spin' : 'i-ph-arrows-clockwise-bold'"
              aria-hidden="true"
            />
          </button>
        </div>
        <div v-else class="flex items-center gap-1 mt-1">
          <button
            class="size-6 flex items-center justify-center border-none cursor-pointer rounded p-0 opacity-60 hover:opacity-100 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-all bg-neutral-100/60 dark:bg-neutral-800/40 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            :disabled="loading"
            title="Add"
            @click="emit('addRecommended', card.name, card.url)"
          >
            <span class="i-ph-plus-bold" aria-hidden="true" />
          </button>
        </div>
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
