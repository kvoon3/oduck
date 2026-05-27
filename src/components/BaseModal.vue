<script setup lang="ts">
import { useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";

defineProps<{
  visible: boolean;
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
      :aria-labelledby="ariaLabelledby"
      @keydown.escape="$emit('close')"
    >
      <div
        ref="panelRef"
        class="modal-panel w-[min(100%,32rem)] p-7 border rounded-lg bg-white shadow-[0_18px_55px_rgb(0_0_0_/_0.18)] lt-sm:p-5 dark:bg-[#131313]"
        :class="{ 'flex flex-col': height }"
        :style="height ? { height } : undefined"
      >
        <slot />
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
