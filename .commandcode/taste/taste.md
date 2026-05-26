# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# unocss
- Use Phosphor Duotone icons (i-ph-*-duotone) for icon classes. Confidence: 0.65
- Use proper UnoCSS spacing scale utilities (p-2, px-3, py-1.5) instead of arbitrary px values (px-[10px], py-[7px]). Confidence: 0.65
- Inline utility classes directly in templates; only define shortcuts for truly reusable patterns (btn, btn-base, border, etc). Confidence: 0.70
- Avoid custom preflights in UnoCSS config; rely on the built-in preflight from the preset instead. Confidence: 0.70

# vue
- Use a shared modal component with proper transitions instead of ad-hoc per-component modals. Confidence: 0.55
- Keep reusable components minimal and free of page-specific headings/intro text; place those on the consuming page instead. Confidence: 0.65

# architecture
- Use web components for shared UI elements that need to work across both Vue and vanilla JS pages, avoiding duplicated HTML/code. Confidence: 0.60

# vue-cdn
- Vue CDN component options objects are plain JavaScript at runtime — avoid TypeScript-only syntax like `as` type assertions, type annotations, or TS-specific constructs in props/emits/setup options. Confidence: 0.75
- Prefer Vite-bundled Vue over Vue CDN `<script>` tags. Confidence: 0.60

