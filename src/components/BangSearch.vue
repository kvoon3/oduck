<script setup lang="ts">
import { ref, computed } from "vue";
import type { Bang } from "../custom-bang";

const props = defineProps<{
  allBangs: Bang[];
}>();

const testQuery = ref("");

const searchEngines = [
  { name: "Google", key: "google", u: "https://www.google.com/search?q={{{s}}}" },
  { name: "DuckDuckGo", key: "ddg", u: "https://duckduckgo.com/?q={{{s}}}" },
  { name: "Bing", key: "bing", u: "https://www.bing.com/search?q={{{s}}}" },
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

function doTestRedirect() {
  if (!testMatch.value.url) return;
  window.open(testMatch.value.url, "_blank");
}
</script>

<template>
  <section class="mt-10 text-center">
    <h2 class="text-[22px]">Try a bang</h2>
    <div class="max-w-[400px] mx-auto mt-4">
      <form class="flex items-center gap-2" @submit.prevent="doTestRedirect">
        <select
          v-model="fallbackEngine"
          class="input w-auto flex-none"
          @change="onFallbackEngineChange"
        >
          <option
            v-for="engine in searchEngines"
            :key="engine.key"
            :value="engine.key"
          >
            {{ engine.name }}
          </option>
          <option value="other">Other…</option>
        </select>
        <input
          v-model="testQuery"
          type="text"
          class="input flex-1"
          placeholder="e.g. !gh vuejs/core"
          spellcheck="false"
          autocomplete="off"
        />
        <button
          class="btn-icon"
          type="submit"
          :title="testMatch.url ? 'Open in new tab' : 'Enter a bang query first'"
          :disabled="!testMatch.url"
          :class="testMatch.url ? 'text-[#1a1a1a] dark:text-[#f1f1f1]' : 'text-[#aaa] dark:text-[#555]'"
        >
          <span class="i-ph-arrow-square-out-duotone text-xl" aria-hidden="true"></span>
        </button>
      </form>
      <input
        v-if="showCustomInput"
        v-model="customEngineUrl"
        type="text"
        class="input w-full mt-3"
        placeholder="https://kagi.com/search?q={{{s}}}"
        spellcheck="false"
        @input="onCustomEngineUrlChange"
      />
    </div>
    <code v-if="testQuery.trim()" class="mt-4 block text-sm break-all text-[#1a7a1a] dark:text-[#4ade80]">{{ testMatch.url }}</code>
  </section>
</template>
