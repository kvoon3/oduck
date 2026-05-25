import { defineConfig, presetMini, presetIcons, transformerVariantGroup } from 'unocss'

export default defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|html)($|\?)/,
        'src/**/*.ts',
      ],
    },
  },
  presets: [
    presetMini({
      dark: 'media',
      preflight: true,
    }),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  shortcuts: {
    // Buttons
    'btn': 'cursor-pointer',
    'btn-base': 'btn rounded text-sm px-2.5 py-1.5',
    'btn-active': 'active:bg-[#e5e5e5] dark:active:bg-[#333]',
    'btn-primary': 'btn-base bg-[#1a1a1a] text-white hover:bg-[#333] focus-visible:ring-2 focus-visible:ring-offset-1 dark:(bg-[#f1f1f1] text-[#111] hover:bg-[#d8d8d8])',
    'btn-secondary': 'btn-base border text-[#333] hover:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-offset-1 dark:(text-[#ddd] hover:bg-[#222])',
    'btn-danger': 'btn-base text-[#b00020] hover:bg-[#f8e8ec] focus-visible:ring-2 focus-visible:ring-offset-1 dark:(text-[#ff8a9a] hover:bg-[#2a171b])',
    'btn-icon': 'btn p-2 text-[#666] rounded transition-colors duration-200 flex items-center justify-center hover:bg-[#f0f0f0] active:bg-[#e5e5e5] focus-visible:ring-2 focus-visible:ring-offset-1 dark:(text-[#aaa] hover:bg-[#222] active:bg-[#333])',
    'btn-close': 'btn flex items-center justify-center w-8 h-8 rounded text-[#555] text-2xl leading-none hover:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-offset-1 dark:(text-[#ddd] hover:bg-[#222])',
    // Links
    'link': 'text-[#444] dark:text-[#a9a9a9]',
    'link-active': 'hover:text-[#888] dark:hover:text-[#888]',
    // Inputs
    'input': 'w-full min-w-0 border rounded bg-[#f5f5f5] px-3 py-2 text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-offset-1 dark:(bg-[#191919] text-white)',
    // Utilities
    'border': 'border border-solid border-[#ddd] dark:border-[#3d3d3d]',
    'error-text': 'text-[#b00020] dark:text-[#ff8a9a]',
    'overscroll-contain': '[overscroll-behavior:contain]',
  },
})
