// Types
export type {
  Bang,
  BangOrigin,
  CustomBang,
  CustomBangInput,
  CustomBangSource,
} from './types/custom-bang'
export type { SelectOption } from './types/select'

// Utils
export {
  parseQuery,
  stripBangMarker,
  type ParsedBangQuery,
} from './utils/bang-query'
export {
  parseSearchHistory,
  getSearchHistory,
  setSearchHistory,
  addSearchHistory,
  type SearchHistoryEntry,
} from './utils/search-history'
export {
  mergeBangs,
  parseCustomBangs,
  normalizeCustomBangSourceUrl,
  loadCustomBangsFromUrl,
} from './types/custom-bang'

// Composables
export { useBang, type BangMatch } from './composables/useBang'

// Data
export { bangs } from './bangs'

// Components
export { default as BaseModal } from './components/BaseModal.vue'
export { default as BaseSelect } from './components/BaseSelect.vue'
export { default as BangSearch } from './components/BangSearch.vue'
export { default as BangList } from './components/BangList.vue'
export { default as BangModal } from './components/BangModal.vue'
export { default as BangManagePanel } from './components/BangManagePanel.vue'
