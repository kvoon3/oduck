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
  preflights: [
    {
      getCSS: () => `
        @font-face {
          font-family: "Inter Fallback";
          size-adjust: 107%;
          ascent-override: 90%;
          src: local("Arial");
        }
      `,
    },
    {
      getCSS: () => `
        *, ::before, ::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          height: 100%;
          width: 100%;
        }
        body {
          font-family: Inter, "Inter Fallback", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          font-synthesis: none;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.5;
          font-weight: 400;
          font-size: 16px;
          color: #1a1a1a;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 600;
          line-height: 1.2;
        }
        a { color: #444; }
        a:hover { color: #888; }
        button { font: inherit; border: none; background: none; cursor: pointer; }
        input, textarea { font: inherit; }
        @media (prefers-color-scheme: dark) {
          body { color: #ddd; }
          #app { background-color: #131313; }
          a { color: #a9a9a9; }
          a:hover { color: #888; }
        }
        .custom-bang-status.is-error { color: #b00020; }
        .open-custom-bang-form-button[hidden],
        .cancel-edit-custom-bang-button[hidden],
        .custom-bang-modal[hidden] { display: none; }
        @media (prefers-color-scheme: dark) {
          .custom-bang-status.is-error { color: #ff8a9a; }
        }
      `,
    },
  ],
  shortcuts: {
    'btn-base': 'rounded text-sm px-2.5 py-1.5',
    'border': 'border border-solid border-[#ddd] dark:border-[#3d3d3d]',
  },
})
