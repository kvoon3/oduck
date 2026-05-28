<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import type { CustomBangSource } from "../custom-bang";

const props = defineProps<{
  filter: null | boolean;
  originFilter: null | string;
  allCount: number;
  enabledCount: number;
  disabledCount: number;
  manualCount: number;
  sources: CustomBangSource[];
  sourceCounts: { name: string; count: number }[];
}>();

const emit = defineEmits<{
  setFilter: [filter: null | boolean];
  setOriginFilter: [origin: null | string];
}>();

const rootRef = useTemplateRef<HTMLElement>("rootRef");
const buttonRef = useTemplateRef<HTMLButtonElement>("buttonRef");
const open = shallowRef(false);

function toggleOpen() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

onClickOutside(rootRef, () => {
  close();
});

function selectFilter(value: null | boolean) {
  emit("setFilter", value);
}

function selectOriginFilter(value: null | string) {
  emit("setOriginFilter", value);
}

const sourceFilters = computed(() => [
  { label: "Manual", value: "manual", count: props.manualCount },
  ...props.sourceCounts.map((s) => ({ label: s.name, value: s.name, count: s.count })),
]);

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
  <div
    ref="rootRef"
    class="filter-popup-root relative inline-flex"
    @mouseenter="open = true"
    @mouseleave="close"
  >
    <button
      ref="buttonRef"
      type="button"
      class="btn h-9 w-9 flex items-center justify-center rounded-md bg-transparent p-0 text-neutral-700 transition duration-150 hover:bg-neutral-200/70 focus-visible:(outline-none ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(text-neutral-200 hover:bg-neutral-800)"
      :aria-label="`Filter bangs (${filter === null && originFilter === null ? 'all' : 'filtered'})`"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span
        class="text-[18px]"
        :class="filter !== null || originFilter !== null ? 'i-ph-funnel-bold' : 'i-ph-funnel-duotone'"
        aria-hidden="true"
      />
    </button>

    <Transition name="filter-menu">
      <div
        v-if="open"
        class="absolute left-0 top-full z-20 mt-1 origin-top-left rounded-md border bg-[#f5f5f5] shadow-lg shadow-black/10 w-max dark:bg-[#191919] dark:shadow-black/30"
      >
        <div class="flex gap-1.5 p-3 pb-1.5">
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
        <div v-if="sourceFilters.length > 0" class="flex flex-wrap gap-1.5 p-3 pt-0.5">
          <button
            v-for="opt in sourceFilters"
            :key="opt.value"
            type="button"
            class="btn rounded-md px-3 py-1.5 text-sm font-medium transition duration-150"
            :class="originFilter === opt.value
              ? 'bg-neutral-300 text-neutral-950 dark:bg-neutral-600 dark:text-neutral-50'
              : 'text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-400 dark:hover:bg-neutral-800'"
            @click="selectOriginFilter(originFilter === opt.value ? null : opt.value)"
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

.filter-popup-root::after {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 0.25rem;
  content: "";
}
</style>
