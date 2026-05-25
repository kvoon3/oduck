<script setup lang="ts">
defineProps<{
  visible: boolean;
  ariaLabelledby?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit("close");
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="visible"
      class="fixed inset-0 z-10 flex items-center justify-center p-5 bg-[rgb(0_0_0_/_0.35)] overscroll-contain dark:bg-[rgb(0_0_0_/_0.6)]"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="ariaLabelledby"
      @click="onOverlayClick"
      @keydown.escape="$emit('close')"
    >
      <div class="modal-panel w-[min(100%,32rem)] p-7 border rounded-lg bg-white shadow-[0_18px_55px_rgb(0_0_0_/_0.18)] lt-sm:p-5 dark:bg-[#131313]">
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
