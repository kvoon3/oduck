<script setup lang="ts">
import type { CustomBang } from "../custom-bang";

defineProps<{
  customBangs: CustomBang[];
}>();

const emit = defineEmits<{
  add: [];
  import: [];
  export: [];
  toggle: [index: number];
  edit: [index: number];
  remove: [index: number];
}>();
</script>

<template>
  <section class="mt-10">
    <div class="flex items-center justify-between gap-4 lt-sm:(flex-col items-start)">
      <h2 class="text-[22px]">Your Bangs</h2>
      <div class="flex gap-2 flex-wrap justify-end lt-sm:(w-full justify-stretch)">
        <button class="btn-primary lt-sm:flex-1" type="button" @click="$emit('add')">
          Add Bang
        </button>
        <button class="btn-secondary lt-sm:flex-1" type="button" @click="$emit('import')">
          Import
        </button>
        <button class="btn-secondary lt-sm:flex-1" type="button" @click="$emit('export')">
          Export
        </button>
      </div>
    </div>

    <div class="mt-4.5">
      <p v-if="customBangs.length === 0"
        class="p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa])">
        No custom bangs yet.
      </p>
      <div v-else>
        <div v-for="(bang, index) in customBangs" :key="bang.t + '-' + index"
          class="mb2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 border rounded-md cursor-pointer transition duration-150 lt-sm:grid-cols-1"
          :class="bang.enabled === false
            ? 'bg-[#f1f1f1] text-[#777] op-65 hover:op-85 dark:(bg-[#111] text-[#777])'
            : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[#f3f3f3] dark:(bg-[#171717] text-[#f1f1f1] hover:bg-[#1d1d1d])'
            " role="button" tabindex="0" :aria-pressed="bang.enabled !== false"
          :title="bang.enabled === false ? 'Disabled' : 'Enabled'" @click="$emit('toggle', index)"
          @keydown.enter.prevent="$emit('toggle', index)" @keydown.space.prevent="$emit('toggle', index)">
          <div class="flex items-baseline gap-2.5 min-w-0">
            <strong class="min-w-0 truncate">{{ bang.s }}</strong>
            <span class="flex-none text-[13px]" :class="bang.enabled === false
              ? 'text-[#888] dark:text-[#666]'
              : 'text-[#666] dark:text-[#aaa]'
              ">!{{ bang.t }}</span>
          </div>
          <div class="flex gap-1.5 lt-sm:w-full">
            <button class="btn-secondary btn-sm flex-1" type="button" @click.stop="$emit('edit', index)">
              Edit
            </button>
            <button class="btn-danger btn-sm flex-1" type="button" @click.stop="$emit('remove', index)">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
