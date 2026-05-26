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
    <oduck-header />
    <div class="max-w-[46rem] w-full">
      <h1 class="text-center">Od*ck</h1>

      <BangSearch :all-bangs="allBangs" mode="replace" autofocus class="mt-10" />
    </div>

    <oduck-footer />
  </div>
</template>
