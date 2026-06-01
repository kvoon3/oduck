<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  title: string;
  open?: boolean;
}>();

const isOpen = ref(props.open ?? false);
</script>

<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center gap-1.5 text-sm font-medium text-[#444] dark:text-[#cfcfcf] bg-transparent border-none cursor-pointer p-0 hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
      @click="isOpen = !isOpen"
    >
      <span
        class="i-ph-caret-right-duotone text-xs transition-transform duration-200"
        :class="isOpen ? 'rotate-90' : 'rotate-0'"
      />
      {{ title }}
    </button>
    <div v-show="isOpen" class="mt-2">
      <slot />
    </div>
  </div>
</template>
