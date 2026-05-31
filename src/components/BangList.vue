<script setup lang="ts">
import { computed, watch } from "vue";
import { useVirtualList } from "@vueuse/core";
import type { CustomBang } from "../custom-bang";

const props = defineProps<{
  customBangs: CustomBang[];
  selectedBangTags: Set<string>;
}>();

const emit = defineEmits<{
  select: [index: number];
  toggleEnabled: [index: number];
  edit: [index: number];
}>();

const items = computed(() => props.customBangs);

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  items,
  { itemHeight: 52, overscan: 10 },
);

watch(items, () => {
  scrollTo(0);
});
</script>

<template>
  <div v-bind="containerProps" class="h-120">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.data.t + '-' + item.index"
        class="mb1 grid grid-cols-[minmax(0,1fr)_auto] items-center px-3.5 py-2.5 cursor-pointer transition duration-150"
        :class="[
          item.data.enabled === false
            ? 'bg-[#f1f1f1] text-[#777] op-65 hover:op-85 dark:bg-[#111]'
            : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[#f3f3f3] dark:(bg-[#171717] text-[#f1f1f1] hover:bg-[#1d1d1d])',
          selectedBangTags.has(item.data.t)
            ? 'bg-neutral-200 text-neutral-950 ring-1 ring-neutral-300 hover:bg-neutral-200 dark:(bg-neutral-700 text-neutral-50 ring-neutral-600 hover:bg-neutral-700)'
            : '',
        ]" role="option" tabindex="0" :aria-selected="selectedBangTags.has(item.data.t)"
        :title="selectedBangTags.has(item.data.t) ? 'Selected' : 'Select'" @click="$emit('select', item.index)"
        @keydown.enter.prevent="$emit('select', item.index)" @keydown.space.prevent="$emit('select', item.index)">
        <div class="flex items-baseline gap-2.5 min-w-0">
          <strong class="min-w-0 truncate">{{ item.data.s }}</strong>
          <span class="flex-none text-[13px]" :class="item.data.enabled === false
            ? 'text-[#888] dark:text-[#666]'
            : 'text-[#666] dark:text-[#aaa]'
            ">!{{ item.data.t }}</span>
        </div>
        <div class="flex gap-1.5">
          <button class="btn-secondary btn-sm bg-transparent"
            :class="item.data.enabled === false
              ? 'text-red-400 hover:bg-red-100 hover:text-red-600 dark:(text-red-400 hover:bg-red-900/30 hover:text-red-300)'
              : 'text-green-600 hover:bg-green-100 hover:text-green-700 dark:(text-green-400 hover:bg-green-900/30 hover:text-green-300)'" type="button"
            @click.stop="$emit('toggleEnabled', item.index)"
            :aria-label="item.data.enabled === false ? 'Enable' : 'Disable'">
            <span class="hidden lt-sm:inline-block lt-sm:text-base"
              :class="item.data.enabled === false ? 'i-ph-toggle-left-duotone' : 'i-ph-toggle-right-duotone'"
              aria-hidden="true" />
            <span class="lt-sm:hidden">{{ item.data.enabled === false ? 'Disabled' : 'Enabled' }}</span>
          </button>
          <button
            class="btn-secondary btn-sm bg-transparent text-neutral-400 hover:bg-neutral-200/50 hover:text-neutral-950 dark:(text-neutral-500 hover:text-neutral-50 hover:bg-neutral-700/50)"
            type="button" @click.stop="$emit('edit', item.index)" aria-label="Edit">
            <span class="hidden lt-sm:inline-block i-ph-pencil-simple-bold lt-sm:text-base" aria-hidden="true" />
            <span class="lt-sm:hidden">Edit</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
