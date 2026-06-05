<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { BangSearch, bangs, mergeBangs, parseCustomBangs, type CustomBang, type Bang } from "@oduck/ui";

const visible = ref(false);
const customBangs = ref<CustomBang[]>([]);

const allBangs = computed<Bang[]>(() => mergeBangs(customBangs.value, bangs));

const isDark = ref(false);

function updateTheme() {
  isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "e" && !visible.value) {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }
    e.preventDefault();
    visible.value = true;
  }

  if (e.key === "Escape" && visible.value) {
    visible.value = false;
  }
}

function onBackdropClick() {
  visible.value = false;
}

async function loadCustomBangs() {
  try {
    const saved = localStorage.getItem("custom-bangs");
    if (!saved) return;
    customBangs.value = parseCustomBangs(JSON.parse(saved));
  } catch {
    // ignore
  }
}

onMounted(() => {
  updateTheme();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateTheme);
  document.addEventListener("keydown", onKeydown, true);
  void loadCustomBangs();
});

onUnmounted(() => {
  window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", updateTheme);
  document.removeEventListener("keydown", onKeydown, true);
});
</script>

<template>
  <div v-if="visible" :class="['fixed inset-0 z-[2147483647] flex items-start justify-center pt-[15vh]', isDark ? 'dark' : '']"
    @click="onBackdropClick">
    <div class="w-[560px]" @click.stop>
      <BangSearch :all-bangs="allBangs" mode="new-tab" autofocus />
    </div>
  </div>
</template>
