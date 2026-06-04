<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Fuse from "fuse.js";
import type { Bang } from "../types/custom-bang";
import { useBang } from "../composables/useBang";
import { addSearchHistory, getSearchHistory, type SearchHistoryEntry } from "../utils/search-history";
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
const searchHistory = ref<SearchHistoryEntry[]>([]);

type Hint =
  | { type: "bang"; bang: Bang; key: string }
  | { type: "history"; history: SearchHistoryEntry; key: string };

const fuse = computed(() => {
  return new Fuse(props.allBangs, {
    keys: ["t", "s", "sc"],
    threshold: 0.3,
  });
});

const historyFuse = computed(() => {
  return new Fuse(searchHistory.value, {
    keys: ["query", "url"],
    threshold: 0.35,
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
  const bangHints = token
    ? fuse.value.search(token, { limit: 8 }).map((r): Hint => ({
        type: "bang",
        bang: r.item,
        key: `bang:${r.item.t}:${r.item.u}`,
      }))
    : [];

  if (bangHints.length > 0 || testMatch.value.bang) return bangHints;

  const query = testMatch.value.cleanQuery;
  if (!query) return [];

  return historyFuse.value.search(query, { limit: 8 }).map((r): Hint => ({
    type: "history",
    history: r.item,
    key: `history:${r.item.updatedAt}:${r.item.url}`,
  }));
});

watch([currentToken, () => testMatch.value.cleanQuery], () => {
  hintIndex.value = 0;
  hintsHidden.value = false;
});

const showHints = computed(() => !hintsHidden.value && hints.value.length > 0);

function selectHint(bang: Bang) {
  input.value = createQueryWithBang(bang);
  hintsHidden.value = true;
  hintIndex.value = 0;
}

function selectHistory(history: SearchHistoryEntry) {
  input.value = history.query;
  hintsHidden.value = true;
  hintIndex.value = 0;
}

function selectCurrentHint() {
  const hint = hints.value[hintIndex.value];
  if (!hint) return;

  if (hint.type === "bang") {
    selectHint(hint.bang);
  } else {
    selectHistory(hint.history);
  }
}

function resetInputAfterNavigation() {
  input.value = "";
  hintsHidden.value = true;
  hintIndex.value = 0;
}

function openUrl(url: string) {
  if (props.mode === "replace") {
    window.location.href = url;
  } else {
    window.open(url, "_blank");
  }

  resetInputAfterNavigation();
}

function submitHistory(history: SearchHistoryEntry) {
  searchHistory.value = addSearchHistory({
    query: history.query,
    url: history.url,
  });
  openUrl(history.url);
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
    selectCurrentHint();
  } else if (e.key === "Enter") {
    const hint = hints.value[hintIndex.value];
    if (!hint) return;

    if (hint.type === "history") {
      e.preventDefault();
      submitHistory(hint.history);
      return;
    }

    if (hint.bang.t !== currentToken.value) {
      e.preventDefault();
      selectHint(hint.bang);
    }
  } else if (e.key === "Escape") {
    e.stopPropagation();
    hintsHidden.value = true;
  }
}

function goTo() {
  const { bang, cleanQuery, url } = testMatch.value;
  if (!url) return;

  if (!bang && cleanQuery) {
    searchHistory.value = addSearchHistory({
      query: cleanQuery,
      url,
    });
  }

  openUrl(url);
}

onMounted(() => {
  searchHistory.value = getSearchHistory();

  if (props.autofocus) {
    inputRef.value?.focus();
  }
});
</script>

<template>
  <section class="mt-10 text-center">
    <div class="max-w-[560px] mx-auto">
      <form @submit.prevent="goTo">
        <div class="relative z-10 flex-1">
          <div class="absolute left-1 top-1/2 z-1 -translate-y-1/2">
            <BaseSelect v-model="fallbackEngine" :options="fallbackEngineOptions" aria-label="Fallback search engine"
              @change="onFallbackEngineChange" />
          </div>
          <input ref="inputRef" v-model="input" type="text" class="input w-full pl-12 pr-10"
            placeholder="!gh oduck" spellcheck="false" autocomplete="off" @keydown="onKeydown" />
          <button class="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost" type="submit"
            :title="testMatch.url ? 'Open in new tab' : 'Enter a bang query first'" :disabled="!testMatch.url">
            <span class="i-ph-magnifying-glass-duotone text-xl " aria-hidden="true"></span>
          </button>
          <ul v-if="showHints"
            class="pl0 absolute left-0 right-0 top-full mt-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md overflow-hidden z-10">
            <li v-for="(hint, i) in hints" :key="hint.key"
              class="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer"
              :class="i === hintIndex ? 'bg-neutral-200 dark:bg-neutral-800:50' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'"
              @mousedown.prevent="hint.type === 'bang' ? selectHint(hint.bang) : selectHistory(hint.history)" @mouseenter="hintIndex = i">
              <template v-if="hint.type === 'bang'">
                <span class="text-neutral-500 dark:text-neutral-400 text-xs w-12 text-right truncate shrink-0">{{ hint.bang.sc
                }}</span>
                <span class="text-neutral-800 dark:text-neutral-200">!{{ hint.bang.t }}</span>
                <span class="text-neutral-400:75 dark:text-neutral-600 text-xs truncate">{{ hint.bang.u }}</span>
              </template>
              <template v-else>
                <span class="text-neutral-500 dark:text-neutral-400 text-xs w-12 text-right truncate shrink-0">History</span>
                <span class="text-neutral-800 dark:text-neutral-200 truncate">{{ hint.history.query }}</span>
                <span class="text-neutral-400:75 dark:text-neutral-600 text-xs truncate">{{ hint.history.url }}</span>
              </template>
            </li>
          </ul>
        </div>
      </form>
      <input v-if="showCustomInput" v-model="customEngineUrl" type="text" class="input w-full mt-3"
        placeholder="https://example.com/search?q={{{s}}}" spellcheck="false" @input="onCustomEngineUrlChange" />
    </div>
  </section>
</template>
