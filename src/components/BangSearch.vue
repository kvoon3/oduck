<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Fuse from "fuse.js";
import type { Bang } from "../custom-bang";
import { useBang } from "../composables/useBang";
import BaseSelect, { type SelectOption } from "./BaseSelect.vue";

const props = defineProps<{
  allBangs: Bang[];
  mode?: "replace" | "new-tab";
  autofocus?: boolean;
  showUrlResult?: boolean;
}>();

const input = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const hintIndex = ref(0);
const hintsHidden = ref(false);

const fuse = computed(() => {
  return new Fuse(props.allBangs, {
    keys: ["t", "s", "sc"],
    threshold: 0.3,
  });
});

const searchEngines = [
  { name: "Google", key: "google", icon: "i-simple-icons-google", u: "https://www.google.com/search?q={{{s}}}" },
  { name: "DuckDuckGo", key: "ddg", icon: "i-simple-icons-duckduckgo", u: "https://duckduckgo.com/?q={{{s}}}" },
  { name: "Bing", key: "bing", icon: "i-simple-icons-microsoftbing", u: "https://www.bing.com/search?q={{{s}}}" },
  { name: "Kagi", key: "kagi", icon: "i-simple-icons-kagi", u: "https://kagi.com/search?q={{{s}}}" },
  { name: "Brave", key: "brave", icon: "i-simple-icons-brave", u: "https://search.brave.com/search?q={{{s}}}" },
] as const;

const fallbackEngineOptions = computed<SelectOption[]>(() => [
  ...searchEngines.map((engine) => ({
    label: engine.name,
    value: engine.key,
    icon: engine.icon,
  })),
  { label: "Other...", value: "other", icon: "i-ph-dots-three-outline-fill" },
]);

const fallbackEngine = ref<string>(localStorage.getItem("fallback-engine") ?? "google");
const customEngineUrl = ref(localStorage.getItem("fallback-engine-url") ?? "");
const showCustomInput = ref(fallbackEngine.value === "other");

function onFallbackEngineChange() {
  localStorage.setItem("fallback-engine", fallbackEngine.value);
  showCustomInput.value = fallbackEngine.value === "other";
  if (fallbackEngine.value !== "other") {
    customEngineUrl.value = "";
    localStorage.removeItem("fallback-engine-url");
  }
}

function onCustomEngineUrlChange() {
  localStorage.setItem("fallback-engine-url", customEngineUrl.value);
}

function resolveFallbackUrl(query: string): string {
  let templateUrl = "";

  if (fallbackEngine.value === "other") {
    templateUrl = customEngineUrl.value;
  } else {
    const engine = searchEngines.find((e) => e.key === fallbackEngine.value);
    templateUrl = engine?.u ?? "";
  }

  if (!templateUrl) return "";
  return templateUrl.replace("{{{s}}}", encodeURIComponent(query).replace(/%2F/g, "/"));
}

const {
  createQueryWithBang,
  currentToken,
  match: testMatch,
} = useBang({
  allBangs: () => props.allBangs,
  query: input,
  resolveFallbackUrl,
});

const hints = computed(() => {
  const token = currentToken.value;
  if (!token) return [];
  return fuse.value.search(token, { limit: 8 }).map((r) => r.item);
});

watch(currentToken, () => {
  hintIndex.value = 0;
  hintsHidden.value = false;
});

const showHints = computed(() => !hintsHidden.value && hints.value.length > 0 && currentToken.value !== "");

function selectHint(bang: Bang) {
  input.value = createQueryWithBang(bang);
  hintsHidden.value = true;
  hintIndex.value = 0;
}

function onKeydown(e: KeyboardEvent) {
  if (!showHints.value) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    hintIndex.value = (hintIndex.value + 1) % hints.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    hintIndex.value = (hintIndex.value - 1 + hints.value.length) % hints.value.length;
  } else if (e.key === "Tab") {
    e.preventDefault();
    selectHint(hints.value[hintIndex.value]);
  } else if (e.key === "Escape") {
    hintsHidden.value = true;
  }
}

function goTo() {
  if (!testMatch.value.url) return;
  if (props.mode === "replace") {
    window.location.href = testMatch.value.url;
  } else {
    window.open(testMatch.value.url, "_blank");
  }
}

onMounted(() => {
  if (props.autofocus) {
    inputRef.value?.focus();
  }
});
</script>

<template>
  <section class="mt-10 text-center">
    <div class="max-w-[560px] mx-auto">
      <form @submit.prevent="goTo">
        <div class="relative flex-1">
          <div class="absolute left-1 top-1/2 z-1 -translate-y-1/2">
            <BaseSelect v-model="fallbackEngine" :options="fallbackEngineOptions" aria-label="Fallback search engine"
              @change="onFallbackEngineChange" />
          </div>
          <input ref="inputRef" v-model="input" type="text" class="input w-full pl-12 pr-10"
            placeholder="e.g. !gh vuejs/core" spellcheck="false" autocomplete="off" @keydown="onKeydown" />
          <button class="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost" type="submit"
            :title="testMatch.url ? 'Open in new tab' : 'Enter a bang query first'" :disabled="!testMatch.url">
            <span class="i-ph-magnifying-glass-duotone text-xl " aria-hidden="true"></span>
          </button>
          <ul v-if="showHints"
            class="pl0 absolute left-0 right-0 top-full mt-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md overflow-hidden z-10">
            <li v-for="(bang, i) in hints" :key="bang.u"
              class="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer"
              :class="i === hintIndex ? 'bg-neutral-200 dark:bg-neutral-800:50' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'"
              @mousedown.prevent="selectHint(bang)" @mouseenter="hintIndex = i">
              <span class="text-neutral-500 dark:text-neutral-400 text-xs w-12 text-right truncate shrink-0">{{ bang.sc
              }}</span>
              <span class="text-neutral-800 dark:text-neutral-200">!{{ bang.t }}</span>
              <span class="text-neutral-400:75 dark:text-neutral-600 text-xs truncate">{{ bang.u }}</span>
            </li>
          </ul>
        </div>
      </form>
      <input v-if="showCustomInput" v-model="customEngineUrl" type="text" class="input w-full mt-3"
        placeholder="https://example.com/search?q={{{s}}}" spellcheck="false" @input="onCustomEngineUrlChange" />
    </div>
  </section>
</template>
