import { defineConfig } from 'tsdown'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'browser',
  dts: { vue: true },
  clean: true,
  plugins: [vue()],
  exports: {
    devExports: true,
  },
  deps: {
    neverBundle: ['vue', '@vueuse/core', 'fuse.js'],
  },
})
