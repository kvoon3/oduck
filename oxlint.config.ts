import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    perf: "deny",
    suspicious: "deny",
  },
  ignorePatterns: ["src/bang.ts"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      files: ["src/main.ts", "src/search.ts", "src/custom.ts"],
      rules: {
        "import/no-unassigned-import": "off",
      },
    },
  ],
  plugins: ["oxc", "typescript", "unicorn", "import", "vue"],
});
