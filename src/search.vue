<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { bangs } from "./bang";
import {
  type Bang,
  type CustomBang,
  parseCustomBangs,
} from "./custom-bang";
import BangSearch from "./components/BangSearch.vue";

const customBangs = ref<CustomBang[]>([]);

const allBangs = computed<Bang[]>(() => [
  ...customBangs.value
    .filter((b) => b.enabled !== false)
    .map(({ enabled: _enabled, ...bang }) => bang),
  ...bangs,
]);

function loadFromStorage(): CustomBang[] {
  const saved = localStorage.getItem("custom-bangs");
  if (!saved) return [];
  try {
    return parseCustomBangs(JSON.parse(saved));
  } catch {
    return [];
  }
}

onMounted(() => {
  customBangs.value = loadFromStorage();
});
</script>

<template>
  <div class="flex flex-col items-center min-h-screen pt-[12vh] px-5 pb-22">
    <div class="max-w-[46rem] w-full">
      <h1 class="text-center">Od*ck</h1>

      <BangSearch :all-bangs="allBangs" class="mt-10" />
    </div>

    <footer class="fixed bottom-4 left-0 right-0 text-center text-sm text-[#666] dark:text-[#999]">
      <a href="/" class="link link-active">← Oduck</a>
      •
      <a href="https://x.com/kvoon_" target="_blank" class="link link-active">kvoon3</a>
      •
      <a href="https://github.com/kvoon3/oduck" target="_blank" class="link link-active">github</a>
    </footer>
  </div>
</template>
