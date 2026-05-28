<script setup lang="ts">
import BaseModal from "./BaseModal.vue";

defineProps<{
  visible: boolean;
  count: number;
  selectedCount: number;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <BaseModal :visible="visible" :title="selectedCount ? 'Delete Selected Bangs' : 'Clean All Bangs'" @close="$emit('close')">
    <div class="px-7 pb-4 lt-sm:px-5 lt-sm:pb-2">
      <p class="text-sm text-[#666] dark:text-[#aaa]">
        <template v-if="selectedCount">
          This will permanently remove <strong>{{ count }}</strong> selected
          {{ count === 1 ? "bang" : "bangs" }}. This action cannot be undone.
        </template>
        <template v-else>
          This will permanently remove all <strong>{{ count }}</strong> custom
          {{ count === 1 ? "bang" : "bangs" }} and all source subscriptions.
          This action cannot be undone.
        </template>
      </p>
    </div>

    <template #footer>
      <div class="p-7 pt-0 lt-sm:p-5 lt-sm:pt-0">
        <div class="flex gap-2 justify-end">
          <button class="btn-secondary" type="button" @click="$emit('close')">
            Cancel
          </button>
          <button class="btn-danger" type="button" @click="$emit('confirm')">
            {{ selectedCount ? "Delete Selected" : "Clean All" }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
