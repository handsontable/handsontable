# Figma theme generator

On-demand codegen that turns a Figma `tokens.json` export into Handsontable's
typed theme modules and CSS under `handsontable/src/themes/static/`. ESM-only
(`.mjs`), no runtime dependencies. Run `npm run generate:themes` from the
`handsontable/` package root.

**Never hand-edit `src/themes/static/`** — `index.mjs` wipes and regenerates the
whole directory on every run. The single source of truth is `tokens.json`
(gitignored, user-provided). The regenerated output is committed and shows up in
the PR diff.

## Where to look

| You need | Read |
|---|---|
| Pipeline / data flow (process → JS → CSS) | `.ai/ARCHITECTURE.md` |
| File and directory layout | `.ai/STRUCTURE.md` |
| Runtime, scripts, output formatting | `.ai/STACK.md` |
| Naming, units, exception keys; adding a token / theme / icon | `.ai/CONVENTIONS.md` |
| Known footguns (silent drops, hardcoded icon branch, no input validation) | `.ai/CONCERNS.md` |
| Exporting tokens from Figma and running the generator | `README.md` |
