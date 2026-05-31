<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from "vue";
import { onClickOutside } from "@vueuse/core";

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

const props = defineProps<{
  modelValue: string;
  options: SelectOption[];
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const rootRef = useTemplateRef<HTMLElement>("rootRef");
const buttonRef = useTemplateRef<HTMLButtonElement>("buttonRef");
const optionRefs = ref<HTMLElement[]>([]);
const open = shallowRef(false);
const activeIndex = shallowRef(0);

const selectedOption = computed(() => {
  return props.options.find((option) => option.value === props.modelValue) ?? props.options[0] ?? null;
});

const selectedIndex = computed(() => {
  return Math.max(0, props.options.findIndex((option) => option.value === selectedOption.value?.value));
});

watch(open, async (isOpen) => {
  if (!isOpen) return;
  activeIndex.value = selectedIndex.value;
  await nextTick();
  optionRefs.value[activeIndex.value]?.focus();
});

function setOptionRef(element: Element | null, index: number) {
  if (element instanceof HTMLElement) {
    optionRefs.value[index] = element;
  }
}

function close() {
  open.value = false;
}

function selectOption(option: SelectOption) {
  if (option.value !== props.modelValue) {
    emit("update:modelValue", option.value);
    emit("change", option.value);
  }
  close();
  buttonRef.value?.focus();
}

function moveActive(delta: number) {
  if (props.options.length === 0) return;
  activeIndex.value = (activeIndex.value + delta + props.options.length) % props.options.length;
  optionRefs.value[activeIndex.value]?.focus();
}

function onButtonKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    open.value = true;
    activeIndex.value = event.key === "ArrowDown" ? selectedIndex.value : selectedIndex.value;
  }
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActive(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveActive(-1);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const option = props.options[activeIndex.value];
    if (option) selectOption(option);
  } else if (event.key === "Escape") {
    event.preventDefault();
    close();
    buttonRef.value?.focus();
  }
}

onClickOutside(rootRef, () => {
  close();
});
</script>

<template>
  <div ref="rootRef" class="select-popup-root relative flex-none" @mouseleave="close">
    <button ref="buttonRef" type="button"
      class="btn h-[38px] w-[38px] flex items-center justify-center rounded-md bg-transparent p-0 text-neutral-700 transition duration-150 hover:bg-neutral-200/70 focus-visible:(outline-none ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(text-neutral-200 hover:bg-neutral-800 focus-visible:ring-offset-[#101010])"
      :aria-label="ariaLabel" :aria-expanded="open" aria-haspopup="listbox" @click="open = !open"
      @keydown="onButtonKeydown">
      <span v-if="selectedOption?.icon" class="text-[18px]" :class="selectedOption.icon" aria-hidden="true"></span>
    </button>

    <Transition name="select-menu">
      <ul v-if="open"
        class="absolute left-0 top-full z-30 w-[220px] origin-top-left list-none border rounded-md bg-[#f5f5f5] p0 my1 mx0 shadow-lg shadow-black/10 dark:bg-[#191919] dark:shadow-black/30"
        role="listbox" :aria-label="ariaLabel" @keydown="onListKeydown">
        <li v-for="(option, index) in options" :key="option.value" :ref="(element) => setOptionRef(element, index)"
          class="flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-left text-sm outline-none transition duration-150"
          :class="option.value === modelValue ? 'bg-neutral-200 text-neutral-950 dark:bg-neutral-700 dark:text-neutral-50' : 'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-800'"
          role="option" :aria-selected="option.value === modelValue" tabindex="-1" @click="selectOption(option)"
          @mouseenter="activeIndex = index">
          <span v-if="option.icon" class="text-[16px] shrink-0" :class="option.icon" aria-hidden="true"></span>
          <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
          <span v-if="option.value === modelValue" class="i-ph-check-bold text-[14px] shrink-0"
            aria-hidden="true"></span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.select-menu-enter-active,
.select-menu-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.select-menu-enter-from,
.select-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.select-popup-root::after {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 0.25rem;
  content: "";
}
</style>
