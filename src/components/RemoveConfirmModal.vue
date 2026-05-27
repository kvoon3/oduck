<script setup lang="ts">
import type { CustomBang } from "../custom-bang";
import BaseModal from "./BaseModal.vue";

defineProps<{
  visible: boolean;
  removingBang: CustomBang | null;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <BaseModal :visible="visible" title="Remove Bang" @close="$emit('close')">
    <div class="px-7 pb-4 lt-sm:px-5 lt-sm:pb-2">
    <p class="text-sm text-[#666] dark:text-[#aaa]">
      Are you sure you want to remove this bang?
    </p>
    <div class="mt-4 p-4 border rounded-md bg-[#fafafa] dark:bg-[#171717] text-sm">
      <div class="grid gap-2">
        <div class="flex gap-2">
          <span class="flex-none w-16 text-[#888] dark:text-[#666]">Name</span>
          <strong>{{ removingBang?.s }}</strong>
        </div>
        <div class="flex gap-2">
          <span class="flex-none w-16 text-[#888] dark:text-[#666]">Trigger</span>
          <code>!{{ removingBang?.t }}</code>
        </div>
        <div class="flex gap-2">
          <span class="flex-none w-16 text-[#888] dark:text-[#666]">URL</span>
          <code class="break-all">{{ removingBang?.u }}</code>
        </div>
        <div class="flex gap-2">
          <span class="flex-none w-16 text-[#888] dark:text-[#666]">Domain</span>
          <code>{{ removingBang?.d }}</code>
        </div>
        <div class="flex gap-2">
          <span class="flex-none w-16 text-[#888] dark:text-[#666]">Category</span>
          <span>{{ removingBang?.c }}</span>
        </div>
      </div>
    </div>
    </div>

    <template #footer>
      <div class="p-7 pt-0 lt-sm:p-5 lt-sm:pt-0">
      <div class="flex gap-2 justify-end">
        <button class="btn-secondary" type="button" @click="$emit('close')">
          Cancel
        </button>
        <button class="btn-danger" type="button" @click="$emit('confirm')">
          Remove
        </button>
      </div>
      </div>
    </template>
  </BaseModal>
</template>
