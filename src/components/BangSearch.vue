<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Fuse from "fuse.js";
import type { Bang } from "../custom-bang";
import BaseSelect, { type SelectOption } from "./BaseSelect.vue";

const props = defineProps<{
  allBangs: Bang[];
  mode?: "replace" | "new-tab";
  autofocus?: boolean;
  showUrlResult?: boolean;
}>();

const testQuery = ref("");
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

const testMatch = computed<{ bang: Bang | null; cleanQuery: string; url: string }>(() => {
  const q = testQuery.value.trim();
  if (!q) return { bang: null, cleanQuery: "", url: "" };

  const match = q.match(/!(\S+)/i);
  const bangToken = match?.[1]?.toLowerCase();
  const matchedBang = props.allBangs.find((b) => b.t === bangToken) ?? null;
  const cleanQuery = q.replace(/!\S+\s*/i, "").trim();

  if (!matchedBang) {
    let fallbackUrl = "";
    if (cleanQuery) {
      fallbackUrl = resolveFallbackUrl(cleanQuery);
    }
    return { bang: null, cleanQuery, url: fallbackUrl };
  }
  if (!cleanQuery) return { bang: matchedBang, cleanQuery: "", url: `https://${matchedBang.d}` };

  const url = matchedBang.u.replace(
    "{{{s}}}",
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  return { bang: matchedBang, cleanQuery, url };
});

function extractBangToken(query: string): string {
  const match = query.match(/!(\S*)/i);
  return match?.[1]?.toLowerCase() ?? "";
}

const currentToken = computed(() => extractBangToken(testQuery.value));

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
  const q = testQuery.value;
  const before = q.slice(0, q.indexOf("!"));
  const after = q.slice(q.indexOf("!") + 1 + extractBangToken(q).length).trimStart();
  testQuery.value = `${before}!${bang.t} ${after}`;
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

const decodedUrl = computed(() => {
  if (!testMatch.value.url) return "";
  try {
    return decodeURIComponent(testMatch.value.url);
  } catch {
    return testMatch.value.url;
  }
});

function doTestRedirect() {
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
      <form class="flex items-center gap-2" @submit.prevent="doTestRedirect">
        <BaseSelect v-model="fallbackEngine" :options="fallbackEngineOptions" aria-label="Fallback search engine"
          @change="onFallbackEngineChange" />
        <div class="relative flex-1">
          <input ref="inputRef" v-model="testQuery" type="text" class="input w-full pr-10"
            placeholder="e.g. !gh vuejs/core" spellcheck="false" autocomplete="off" @keydown="onKeydown" />
          <button class="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost" type="submit"
            :title="testMatch.url ? 'Open in new tab' : 'Enter a bang query first'" :disabled="!testMatch.url">
            <span class="i-ph-magnifying-glass-duotone text-xl " aria-hidden="true"></span>
          </button>
          <ul v-if="showHints"
            class="pl0 absolute left-0 right-0 top-full mt-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md overflow-hidden z-10">
            <li v-for="(bang, i) in hints" :key="bang.t"
              class="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer"
              :class="i === hintIndex ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'"
              @mousedown.prevent="selectHint(bang)" @mouseenter="hintIndex = i">
              <span class="text-neutral-500 dark:text-neutral-400 text-xs w-12 text-right truncate shrink-0">{{ bang.sc
              }}</span>
              <span class="text-neutral-800 dark:text-neutral-200">!{{ bang.t }}</span>
              <span class="text-neutral-500 dark:text-neutral-500 text-xs truncate ml-auto">{{ bang.s }}</span>
            </li>
          </ul>
        </div>
      </form>
      <input v-if="showCustomInput" v-model="customEngineUrl" type="text" class="input w-full mt-3"
        placeholder="https://example.com/search?q={{{s}}}" spellcheck="false" @input="onCustomEngineUrlChange" />
    </div>
    <code v-if="props.showUrlResult && testQuery.trim()"
      class="mt-4 block text-sm break-all text-neutral-300 dark:text-neutral-700">{{ decodedUrl }}</code>
  </section>
</template>
