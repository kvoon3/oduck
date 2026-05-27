<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
  filter: null | boolean;
  allCount: number;
  enabledCount: number;
  disabledCount: number;
}>();

const emit = defineEmits<{
  setFilter: [filter: null | boolean];
}>();

const rootRef = useTemplateRef<HTMLElement>("rootRef");
const buttonRef = useTemplateRef<HTMLButtonElement>("buttonRef");
const open = shallowRef(false);

onClickOutside(rootRef, () => {
  open.value = false;
});

function toggleOpen() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function selectFilter(value: null | boolean) {
  emit("setFilter", value);
  close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    close();
    buttonRef.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      ref="buttonRef"
      type="button"
      class="btn h-9 w-9 flex items-center justify-center rounded-md bg-transparent p-0 text-neutral-700 transition duration-150 hover:bg-neutral-200/70 focus-visible:(outline-none ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(text-neutral-200 hover:bg-neutral-800)"
      :aria-label="`Filter bangs (${filter === null ? 'all' : filter ? 'enabled' : 'disabled'})`"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span
        class="text-[18px]"
        :class="filter !== null ? 'i-ph-funnel-bold' : 'i-ph-funnel-duotone'"
        aria-hidden="true"
      />
    </button>

    <Transition name="filter-menu">
      <div
        v-if="open"
        class="absolute left-0 top-full z-20 mt-2  origin-top-left rounded-md border bg-[#f5f5f5] shadow-lg shadow-black/10 dark:bg-[#191919] dark:shadow-black/30"
      >
        <div class="flex gap-1.5 p-3">
          <button
            v-for="opt in [
              { label: 'All', value: null, count: allCount },
              { label: 'Enabled', value: true, count: enabledCount },
              { label: 'Disabled', value: false, count: disabledCount },
            ]"
            :key="String(opt.value)"
            type="button"
            class="btn flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition duration-150"
            :class="filter === opt.value
              ? 'bg-neutral-300 text-neutral-950 dark:bg-neutral-600 dark:text-neutral-50'
              : 'text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-400 dark:hover:bg-neutral-800'"
            @click="selectFilter(opt.value)"
          >
            <span>{{ opt.label }}</span>
            <span class="ml1 text-xs opacity-50">({{ opt.count }})</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.filter-menu-enter-active,
.filter-menu-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.filter-menu-enter-from,
.filter-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
