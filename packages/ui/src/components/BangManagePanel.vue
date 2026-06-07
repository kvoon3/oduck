<script setup lang="ts">
import { ref, computed, shallowRef, watch } from "vue";
import Fuse from "fuse.js";
import { useDebounceFn } from "@vueuse/core";
import type { CustomBang, CustomBangSource } from "../types/custom-bang";
import BangList from "./BangList.vue";
import BangFilterPopup from "./BangFilterPopup.vue";

const props = defineProps<{
  bangs: CustomBang[];
  sources: CustomBangSource[];
  resolutions: Record<string, string>;
  modelValue?: Set<string>;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  toggleEnabled: [bang: CustomBang];
  edit: [bang: CustomBang];
  select: [bang: CustomBang];
  "update:modelValue": [tags: Set<string>];
}>();

const searchQuery = ref("");
const debouncedQuery = ref("");
const filter = shallowRef<null | boolean>(null);
const originFilter = shallowRef<null | string>(null);
const selectedBangTags = computed({
  get: () => props.modelValue ?? new Set(),
  set: (v) => emit("update:modelValue", v),
});

// Debounce search input (150ms feels responsive without excessive recomputation)
const debounceSearch = useDebounceFn((q: string) => {
  debouncedQuery.value = q;
}, 150);
watch(searchQuery, (q) => debounceSearch(q), { immediate: true });

const customBangsOnly = computed(() => props.bangs.filter((b) => b.origin !== undefined));

const enabledCount = computed(() => customBangsOnly.value.filter((b) => b.enabled !== false).length);
const totalCount = computed(() => customBangsOnly.value.length);
const manualCount = computed(() => customBangsOnly.value.filter((b) => (b.origin ?? "manual") === "manual").length);
const filteredEnabledCount = computed(() => filteredBangs.value.filter((b) => b.enabled !== false).length);
const filteredTotalCount = computed(() => filteredBangs.value.length);
const allFilteredSelected = computed(() =>
  filteredBangs.value.length > 0 &&
  filteredBangs.value.every((b) => selectedBangTags.value.has(b.t)),
);
const sourceCounts = computed(() =>
  props.sources.map((s) => ({
    name: s.name,
    count: customBangsOnly.value.filter((b) => b.origin === s.name).length,
  })),
);

// Step 1: filter by enabled/origin (cheap, O(n))
const filteredByMeta = computed(() => {
  let result = props.bangs;
  if (filter.value !== null) {
    result = result.filter((b) => b.enabled === filter.value);
  }
  if (originFilter.value !== null) {
    if (originFilter.value === "manual") {
      result = result.filter((b) => (b.origin ?? "manual") === "manual");
    } else {
      result = result.filter((b) => b.origin === originFilter.value);
    }
  }
  return result;
});

// Step 2: cache Fuse index on the meta-filtered list (expensive, but only when filteredByMeta changes)
const fuseRef = shallowRef<Fuse<CustomBang> | null>(null);
watch(filteredByMeta, (list) => {
  fuseRef.value = new Fuse(list, {
    keys: ["t", "s", "sc"],
    threshold: 0.3,
  });
}, { immediate: true });

// Step 3: apply debounced text search using cached Fuse (cheap, O(search_result_count))
const filteredBangs = computed(() => {
  const list = filteredByMeta.value;
  const query = debouncedQuery.value.trim();
  if (!query || !fuseRef.value) return list;
  return fuseRef.value.search(query).map((r) => r.item);
});

function handleFilterSet(value: null | boolean) {
  filter.value = value;
}

function handleOriginFilterSet(value: null | string) {
  originFilter.value = value;
}

function handleToggleEnabled(index: number) {
  const bang = filteredBangs.value[index];
  if (!bang || bang.origin === undefined) return;
  emit("toggleEnabled", bang);
}

function handleEdit(index: number) {
  const bang = filteredBangs.value[index];
  if (!bang || bang.origin === undefined) return;
  emit("edit", bang);
}

function handleSelect(index: number) {
  const bang = filteredBangs.value[index];
  if (!bang) return;
  emit("select", bang);
}
</script>

<template>
  <div>
    <section class="flex justify-between items-center gap-2">
      <div class="relative my-2 flex-1">
        <div class="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center z-1">
          <BangFilterPopup :filter="filter" :origin-filter="originFilter" :all-count="totalCount"
            :enabled-count="enabledCount" :disabled-count="totalCount - enabledCount" :manual-count="manualCount"
            :sources="sources" :source-counts="sourceCounts" @set-filter="handleFilterSet"
            @set-origin-filter="handleOriginFilterSet" />
        </div>
        <input v-model="searchQuery" class="input pl-11" type="text" placeholder="Search your bangs..." />
      </div>

      <slot name="actions" :filtered-bangs="filteredBangs" :filtered-enabled-count="filteredEnabledCount"
        :filtered-total-count="filteredTotalCount" :all-filtered-selected="allFilteredSelected"
        :total-count="totalCount" :enabled-count="enabledCount" :selected-tags="selectedBangTags" />
    </section>

    <p v-if="bangs.length === 0"
      class="mt-4.5 p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa] border-[#3d3d3d])">
      No custom bangs yet.
    </p>
    <template v-else>
      <p v-if="filteredBangs.length === 0"
        class="p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa] border-[#3d3d3d])">
        No bangs match this filter.
      </p>
      <BangList v-else :custom-bangs="filteredBangs" :resolutions="resolutions" :selected-bang-tags="selectedBangTags"
        :show-actions="showActions" @toggle-enabled="handleToggleEnabled" @edit="handleEdit" @select="handleSelect" />
      <p class="mt-2 text-right text-xs text-neutral-400 dark:text-neutral-500">
        {{ filteredBangs.length }} of {{ bangs.length }}
        {{ bangs.length === 1 ? "bang" : "bangs" }}
      </p>
    </template>
  </div>
</template>
