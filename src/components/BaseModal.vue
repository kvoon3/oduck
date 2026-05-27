<script setup lang="ts">
import { useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";

defineProps<{
  visible: boolean;
  title?: string;
  ariaLabelledby?: string;
  height?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const panelRef = useTemplateRef<HTMLElement>("panelRef");

onClickOutside(panelRef, () => {
  emit("close");
});
</script>

<template>
  <Transition name="modal">
    <div
      v-if="visible"
      class="fixed inset-0 z-10 flex items-center justify-center p-5 bg-[rgb(0_0_0_/_0.35)] overscroll-contain dark:bg-[rgb(0_0_0_/_0.6)]"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="ariaLabelledby ?? (title ? 'modal-title' : undefined)"
      @keydown.escape="$emit('close')"
    >
      <div
        ref="panelRef"
        class="modal-panel relative grid grid-rows-[min-content_1fr_min-content] w-[min(100%,32rem)] border rounded-lg bg-white shadow-[0_18px_55px_rgb(0_0_0_/_0.18)] dark:bg-[#131313]"
        :style="height ? { height } : undefined"
      >
        <button
          class="absolute top-3 right-3 size-6 flex items-center justify-center rounded text-lg leading-none text-[#999] hover:text-[#333] dark:(text-[#666] hover:text-[#ccc]) cursor-pointer border-none bg-transparent transition-colors"
          type="button"
          aria-label="Close"
          @click="$emit('close')"
        >
          ×
        </button>
        <slot name="header">
          <div v-if="title" class="p-7 pb-0 lt-sm:p-5 lt-sm:pb-0">
            <h3 id="modal-title" class="text-[18px]">{{ title }}</h3>
          </div>
        </slot>
        <div class="overflow-auto min-h-10">
          <slot />
        </div>
        <slot name="footer">
          <div />
        </slot>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 160ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(8px) scale(0.985);
}
</style>
