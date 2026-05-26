import { defineConfig, presetMini, presetIcons, presetWebFonts, transformerVariantGroup } from 'unocss'

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
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  shortcuts: {
    // Buttons
    'btn': 'cursor-pointer appearance-none border-none disabled:cursor-not-allowed',
    'btn-base': 'btn rounded-md text-sm font-medium px-3 py-1.75 transition duration-150 op-75 hover:op-100 disabled:op-40 focus-visible:(outline-none ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:focus-visible:ring-offset-[#101010]',
    'btn-sm': 'px-2.5 py-1 text-xs',
    'btn-surface': 'bg-neutral-200/50 text-neutral-950 dark:(bg-neutral-700/50 text-neutral-50)',
    'btn-primary': 'btn-base btn-surface',
    'btn-secondary': 'btn-base btn-surface',
    'btn-danger': 'btn-base bg-neutral-200/50 text-[#8a0018] dark:(bg-neutral-700/50 text-[#ff9aaa])',
    'btn-icon': 'btn flex items-center justify-center rounded-md bg-neutral-200/50 p-2 text-neutral-950 op-75 transition duration-150 hover:op-100 focus-visible:(outline-none ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(bg-neutral-700/50 text-neutral-50 focus-visible:ring-offset-[#101010])',
    'btn-close': 'btn flex items-center justify-center w-8 h-8 rounded-md bg-neutral-200/50 text-neutral-950 text-xl leading-none op-75 transition duration-150 hover:op-100 focus-visible:(outline-none ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(bg-neutral-700/50 text-neutral-50 focus-visible:ring-offset-[#101010])',
    // Links
    'link': 'border-0 border-b border-solid border-current pb-0.5 text-[#444] no-underline op-75 transition-opacity duration-150 dark:text-[#a9a9a9]',
    'link-active': 'hover:op-100',
    // Inputs
    'input': 'box-border w-full min-w-0 border rounded-md bg-[#f5f5f5] px-3 py-2 text-[#1a1a1a] outline-none transition duration-150 placeholder:text-[#777] focus-visible:(ring-2 ring-neutral-500/45 ring-offset-2 ring-offset-white) dark:(bg-[#191919] text-white placeholder:text-[#777] focus-visible:ring-offset-[#101010])',
    // Utilities
    'border': 'border border-solid border-[#ddd] dark:border-[#3d3d3d]',
    'error-text': 'text-[#b00020] dark:text-[#ff8a9a]',
    'overscroll-contain': '[overscroll-behavior:contain]',
  },
})
