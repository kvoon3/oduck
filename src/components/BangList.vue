<script setup lang="ts">
import { computed } from "vue";
import type { CustomBang } from "../custom-bang";
import { useVirtualList } from "@vueuse/core";

const props = defineProps<{
  customBangs: CustomBang[];
}>();

const emit = defineEmits<{
  toggle: [index: number];
  edit: [index: number];
  remove: [index: number];
}>();

const items = computed(() => props.customBangs);

const { list, containerProps, wrapperProps } = useVirtualList(
  items,
  { itemHeight: 52, overscan: 10 },
);
</script>

<template>
  <div v-bind="containerProps" class="h-[55vh]">
    <div v-bind="wrapperProps">
      <div
        v-for="item in list"
        :key="item.data.t + '-' + item.index"
        class="mb2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 border rounded-md cursor-pointer transition duration-150 lt-sm:grid-cols-1"
        :class="item.data.enabled === false
          ? 'bg-[#f1f1f1] text-[#777] op-65 hover:op-85 dark:(bg-[#111] text-[#777])'
          : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[#f3f3f3] dark:(bg-[#171717] text-[#f1f1f1] hover:bg-[#1d1d1d])'
        "
        role="button" tabindex="0" :aria-pressed="item.data.enabled !== false"
        :title="item.data.enabled === false ? 'Disabled' : 'Enabled'"
        @click="$emit('toggle', item.index)"
        @keydown.enter.prevent="$emit('toggle', item.index)"
        @keydown.space.prevent="$emit('toggle', item.index)"
      >
        <div class="flex items-baseline gap-2.5 min-w-0">
          <strong class="min-w-0 truncate">{{ item.data.s }}</strong>
          <span
            class="flex-none text-[13px]"
            :class="item.data.enabled === false
              ? 'text-[#888] dark:text-[#666]'
              : 'text-[#666] dark:text-[#aaa]'
            "
          >!{{ item.data.t }}</span>
        </div>
        <div class="flex gap-1.5 lt-sm:w-full">
          <button class="btn-secondary btn-sm flex-1" type="button" @click.stop="$emit('edit', item.index)">
            Edit
          </button>
          <button class="btn-danger btn-sm flex-1" type="button" @click.stop="$emit('remove', item.index)">
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
