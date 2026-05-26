<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Bang } from "../custom-bang";

const props = defineProps<{
  allBangs: Bang[];
  mode?: "replace" | "new-tab";
  autofocus?: boolean;
}>();

const testQuery = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const searchEngines = [
  { name: "Google", key: "google", u: "https://www.google.com/search?q={{{s}}}" },
  { name: "DuckDuckGo", key: "ddg", u: "https://duckduckgo.com/?q={{{s}}}" },
  { name: "Bing", key: "bing", u: "https://www.bing.com/search?q={{{s}}}" },
  { name: "Kagi", key: "kagi", u: "https://kagi.com/search?q={{{s}}}" },
  { name: "Brave", key: "brave", u: "https://search.brave.com/search?q={{{s}}}" },
] as const;
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
        <select v-model="fallbackEngine" class="input w-auto flex-none" @change="onFallbackEngineChange">
          <option v-for="engine in searchEngines" :key="engine.key" :value="engine.key">
            {{ engine.name }}
          </option>
          <option value="other">Other…</option>
        </select>
        <div class="relative flex-1">
          <input ref="inputRef" v-model="testQuery" type="text" class="input w-full pr-10" placeholder="e.g. !gh vuejs/core"
            spellcheck="false" autocomplete="off" />
          <button class="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost" type="submit"
            :title="testMatch.url ? 'Open in new tab' : 'Enter a bang query first'" :disabled="!testMatch.url">
            <span class="i-ph-magnifying-glass-duotone text-xl " aria-hidden="true"></span>
          </button>
        </div>
      </form>
      <input v-if="showCustomInput" v-model="customEngineUrl" type="text" class="input w-full mt-3"
        placeholder="https://example.com/search?q={{{s}}}" spellcheck="false" @input="onCustomEngineUrlChange" />
    </div>
    <code v-if="testQuery.trim()"
      class="mt-4 block text-sm break-all text-neutral-300 dark:text-neutral-700">{{ decodedUrl }}</code>
  </section>
</template>
