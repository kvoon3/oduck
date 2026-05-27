<script setup lang="ts">
import { computed, watch } from "vue";
import { useVirtualList } from "@vueuse/core";
import type { CustomBang } from "../custom-bang";

const props = defineProps<{
  customBangs: CustomBang[];
}>();

const emit = defineEmits<{
  toggle: [index: number];
  edit: [index: number];
  remove: [index: number];
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
        :class="item.data.enabled === false
          ? 'bg-[#f1f1f1] text-[#777] op-65 hover:op-85 dark:bg-[#111]'
          : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[#f3f3f3] dark:(bg-[#171717] text-[#f1f1f1] hover:bg-[#1d1d1d])'
          " role="button" tabindex="0" :aria-pressed="item.data.enabled !== false"
        :title="item.data.enabled === false ? 'Disabled' : 'Enabled'" @click="$emit('toggle', item.index)"
        @keydown.enter.prevent="$emit('toggle', item.index)" @keydown.space.prevent="$emit('toggle', item.index)">
        <div class="flex items-baseline gap-2.5 min-w-0">
          <strong class="min-w-0 truncate">{{ item.data.s }}</strong>
          <span class="flex-none text-[13px]" :class="item.data.enabled === false
            ? 'text-[#888] dark:text-[#666]'
            : 'text-[#666] dark:text-[#aaa]'
            ">!{{ item.data.t }}</span>
        </div>
        <div class="flex gap-1.5">
          <button class="btn-secondary btn-sm bg-transparent text-neutral-400 hover:bg-neutral-200/50 hover:text-neutral-950 dark:(text-neutral-500 hover:text-neutral-50 hover:bg-neutral-700/50)" type="button" @click.stop="$emit('edit', item.index)" aria-label="Edit">
            <span class="hidden lt-sm:inline-block i-ph-pencil-simple-bold lt-sm:text-base" aria-hidden="true" />
            <span class="lt-sm:hidden">Edit</span>
          </button>
          <button class="btn-danger btn-sm bg-transparent text-neutral-400 hover:bg-neutral-200/50 hover:text-[#8a0018] dark:(text-neutral-500 hover:text-[#ff9aaa] hover:bg-neutral-700/50)" type="button" @click.stop="$emit('remove', item.index)" aria-label="Remove">
            <span class="hidden lt-sm:inline-block i-ph-trash-bold lt-sm:text-base" aria-hidden="true" />
            <span class="lt-sm:hidden">Remove</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
