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
  <div class="grid grid-rows-[min-content_1fr_min-content] h-dvh">
    <oduck-header />
    <div class="overflow-auto mx4">
      <div class="mxa max-w-[46rem] pt-[12vh] pb-22 px-5">
        <h1 class="text-center">Od*ck</h1>

        <BangSearch :all-bangs="allBangs" mode="replace" autofocus class="mt-10" />
      </div>
    </div>

    <oduck-footer />
  </div>
</template>
