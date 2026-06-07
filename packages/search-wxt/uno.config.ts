import baseConfig from "../../uno.config";

export default {
  ...baseConfig,
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|html)($|\?)/,
        "src/**/*.ts",
        "../ui/src/**/*.{vue,ts}",
      ],
      exclude: [],
    },
  },
};
