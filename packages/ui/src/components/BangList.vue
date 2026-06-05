<script setup lang="ts">
import { computed, watch } from "vue";
import { useVirtualList } from "@vueuse/core";
import type { CustomBang } from "../types/custom-bang";

const props = defineProps<{
  customBangs: CustomBang[];
  selectedBangTags: Set<string>;
  resolutions: Record<string, string>;
  height?: string;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  select: [index: number];
  toggleEnabled: [index: number];
  edit: [index: number];
}>();

const items = computed(() => props.customBangs.map((b) => {
  const aliasFirst = Array.isArray(b.a) ? b.a[0] : b.a;
  const displayName = aliasFirst ? (props.resolutions[aliasFirst] ?? b.s) : b.s;
  return { bang: b, displayName };
}));

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  items,
  { itemHeight: 40, overscan: 10 },
);

watch(items, () => {
  scrollTo(0);
});

function rowClasses(bang: CustomBang, selected: boolean) {
  if (selected) return 'bg-neutral-200 text-neutral-950 dark:(bg-neutral-700 text-neutral-50)';
  if (bang.enabled === false) return 'text-[#777] op-65 hover:op-85 dark:text-[#555]';
  return 'text-[#1a1a1a] hover:bg-[#f3f3f3] dark:text-[#d4d4d4] dark:hover:bg-[#1d1d1d]';
}
</script>

<template>
  <div v-bind="containerProps" :class="height ?? 'h-120'">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.data.bang.t + '-' + item.index"
        class="grid items-center px-3.5 py-1.5 cursor-pointer"
        :class="[
          showActions ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1',
          rowClasses(item.data.bang, selectedBangTags.has(item.data.bang.t)),
        ]" role="option" tabindex="0" :aria-selected="selectedBangTags.has(item.data.bang.t)"
        :title="selectedBangTags.has(item.data.bang.t) ? 'Selected' : 'Select'" @click="$emit('select', item.index)"
        @keydown.enter.prevent="$emit('select', item.index)" @keydown.space.prevent="$emit('select', item.index)">
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-xs text-neutral-500 dark:text-neutral-400 w-16 text-right truncate shrink-0">
            {{ item.data.bang.sc }}
          </span>
          <span class="font-medium text-sm w-16 truncate shrink-0">
            !{{ item.data.bang.t }}
          </span>
          <span class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {{ item.data.bang.d }}
          </span>
          <span
            class="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 truncate max-w-24"
            :class="item.data.bang.origin
              ? 'bg-blue-100 text-blue-600 dark:(bg-blue-900/30 text-blue-300)'
              : 'bg-neutral-200 text-neutral-500 dark:(bg-neutral-700 text-neutral-400)'"
          >
            {{ item.data.bang.origin || 'manual' }}
          </span>
        </div>
        <div v-if="showActions && item.data.bang.origin !== undefined" class="flex gap-1.5">
          <button class="btn-secondary btn-sm bg-transparent"
            :class="item.data.bang.enabled === false
              ? 'text-red-400 hover:bg-red-100 hover:text-red-600 dark:(text-red-400 hover:bg-red-900/30 hover:text-red-300)'
              : 'text-green-600 hover:bg-green-100 hover:text-green-700 dark:(text-green-400 hover:bg-green-900/30 hover:text-green-300)'" type="button"
            @click.stop="$emit('toggleEnabled', item.index)"
            :aria-label="item.data.bang.enabled === false ? 'Enable' : 'Disable'">
            <span class="hidden lt-sm:inline-block lt-sm:text-base"
              :class="item.data.bang.enabled === false ? 'i-ph-toggle-left-duotone' : 'i-ph-toggle-right-duotone'"
              aria-hidden="true" />
            <span class="lt-sm:hidden">{{ item.data.bang.enabled === false ? 'Disabled' : 'Enabled' }}</span>
          </button>
          <button
            class="btn-secondary btn-sm bg-transparent text-neutral-400 hover:bg-neutral-200/50 hover:text-neutral-950 dark:(text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700/50)"
            type="button" @click.stop="$emit('edit', item.index)" aria-label="Edit">
            <span class="hidden lt-sm:inline-block i-ph-pencil-simple-bold lt-sm:text-base" aria-hidden="true" />
            <span class="lt-sm:hidden">Edit</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
