<script setup lang="ts">
import { watch, ref, computed } from "vue";
import { stripBangMarker } from "../bang-query";
import { type CustomBang, parseCustomBangs } from "../custom-bang";
import BaseModal from "./BaseModal.vue";

const props = defineProps<{
  visible: boolean;
  editingBang: CustomBang | null;
}>();

const emit = defineEmits<{
  submit: [bang: CustomBang];
  close: [];
}>();

const tag = ref("");
const name = ref("");
const domain = ref("");
const searchUrl = ref("");
const aliasTarget = ref("");
const isAlias = ref(false);
const error = ref("");

function reset() {
  tag.value = "";
  name.value = "";
  domain.value = "";
  searchUrl.value = "";
  aliasTarget.value = "";
  isAlias.value = false;
  error.value = "";
}

function open() {
  if (props.editingBang) {
    tag.value = props.editingBang.t;
    name.value = props.editingBang.s;
    domain.value = props.editingBang.d;
    searchUrl.value = props.editingBang.u;
    aliasTarget.value = props.editingBang.a ?? "";
    isAlias.value = !!props.editingBang.a;
  } else {
    reset();
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) open();
  },
);

const title = computed(() =>
  props.editingBang ? "Edit Bang" : "Add Bang",
);

const submitLabel = computed(() =>
  props.editingBang ? "Update" : "Add",
);

const cleanDomain = computed(() => normalizeDomain(domain.value));

function normalizeDomain(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    return new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    ).hostname.toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .toLowerCase();
  }
}

function handleSubmit() {
  error.value = "";

  const cleanTag = stripBangMarker(tag.value);
  const cleanName = name.value.trim();
  const cleanUrl = searchUrl.value.trim();
  const cleanAliasTarget = stripBangMarker(aliasTarget.value).toLowerCase();

  if (isAlias.value && !cleanAliasTarget) {
    error.value = "Alias target is required.";
    return;
  }

  try {
    const parsed = parseCustomBangs([
      {
        c: "Custom",
        d: cleanDomain.value,
        enabled: true,
        r: 0,
        s: cleanName,
        sc: "Custom",
        t: cleanTag,
        u: cleanUrl,
        a: isAlias.value ? cleanAliasTarget : undefined,
      },
    ])[0];

    if (!parsed) throw new Error("Custom bang is invalid.");

    emit("submit", parsed);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Custom bang config is invalid.";
  }
}
</script>

<template>
  <BaseModal :visible="visible" :title="title" @close="$emit('close')">
    <form
      id="bang-form"
      class="grid gap-4 p-7 pt-0 lt-sm:p-5 lt-sm:pt-0"
      @submit.prevent="handleSubmit"
    >
      <label class="grid gap-1.5 w-full">
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Bang shortcut
        </span>
        <input
          v-model="tag"
          class="input"
          placeholder="e.g. chatgpt"
          spellcheck="false"
          autocomplete="off"
          required
        />
      </label>
      <label class="flex items-center gap-2.5 cursor-pointer select-none" @click.prevent="isAlias = !isAlias" @keydown.space.prevent="isAlias = !isAlias">
        <span
          class="size-5 flex-shrink-0 rounded-md flex items-center justify-center border-2 transition-all duration-150"
          :class="isAlias ? 'bg-neutral-800 border-neutral-800 dark:(bg-neutral-300 border-neutral-300)' : 'bg-neutral-200 border-neutral-300 dark:(bg-neutral-700 border-neutral-500)'"
          role="checkbox" :aria-checked="isAlias" tabindex="0"
        >
          <span
            class="i-ph-check-bold text-sm transition-all duration-100 text-white dark:text-neutral-900"
            :class="isAlias ? 'opacity-100 scale-100' : 'opacity-0 scale-75'"
          />
        </span>
        <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
          Alias (reference another bang)
        </span>
      </label>
      <template v-if="isAlias">
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Alias target
          </span>
          <input
            v-model="aliasTarget"
            class="input"
            placeholder="e.g. chatgpt"
            spellcheck="false"
            autocomplete="off"
            required
          />
        </label>
      </template>
      <template v-else>
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Name
          </span>
          <input
            v-model="name"
            class="input"
            placeholder="e.g. ChatGPT"
            spellcheck="false"
            autocomplete="off"
            :required="!isAlias"
          />
        </label>
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Domain
          </span>
          <input
            v-model="domain"
            class="input"
            placeholder="e.g. chatgpt.com"
            spellcheck="false"
            autocomplete="off"
            :required="!isAlias"
          />
        </label>
        <label class="grid gap-1.5 w-full">
          <span class="text-sm font-medium text-[#444] dark:text-[#cfcfcf]">
            Search URL
          </span>
          <input
            v-model="searchUrl"
            class="input font-mono"
            placeholder="e.g. https://example.com/search?q={{{s}}}"
            spellcheck="false"
            autocomplete="off"
            :required="!isAlias"
          />
        </label>
      </template>
      <p v-if="error" class="error-text">
        {{ error }}
      </p>
    </form>

    <template #footer>
      <div class="p-7 pt-0 lt-sm:p-5 lt-sm:pt-0">
      <button class="btn-primary py-2.5" type="submit" form="bang-form">
        {{ submitLabel }}
      </button>
      </div>
    </template>
  </BaseModal>
</template>
