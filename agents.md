# Agent Notes

- Use `ni` for dependency installation, `nr` for package scripts, `nlx` for one-off package execution, and `nup` for dependency upgrades.
- The `packageManager` field in `package.json` is kept for `@antfu/ni`/Corepack package-manager detection. Do not remove it or replace `ni` commands with raw `pnpm`, `npm`, `yarn`, or `bun` commands in package scripts.
