<script setup lang="ts">
import BaseModal from "./BaseModal.vue";

defineProps<{
  visible: boolean;
  count: number;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <BaseModal :visible="visible" @close="$emit('close')">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-[18px]">Clean All Bangs</h3>
      <button class="btn-close" type="button" aria-label="Close" @click="$emit('close')">
        ×
      </button>
    </div>
    <p class="mt-4 text-sm text-[#666] dark:text-[#aaa]">
      This will permanently remove all <strong>{{ count }}</strong> custom
      {{ count === 1 ? "bang" : "bangs" }} and all source subscriptions.
      This action cannot be undone.
    </p>
    <div class="flex gap-2 mt-6 justify-end">
      <button class="btn-secondary" type="button" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn-danger" type="button" @click="$emit('confirm')">
        Clean All
      </button>
    </div>
  </BaseModal>
</template>
