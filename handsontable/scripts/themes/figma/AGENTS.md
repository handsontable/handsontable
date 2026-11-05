# Figma theme generator

On-demand codegen that turns a Figma `tokens.json` export into Handsontable's
typed theme modules and CSS under `handsontable/src/themes/static/`. ESM-only
(`.mjs`), no runtime dependencies. Run `npm run generate:themes` from the
`handsontable/` package root.

**Never hand-edit `src/themes/static/`** — `index.mjs` wipes and regenerates the
whole directory on every run. The single source of truth is `tokens.json`
(gitignored, user-provided). The regenerated output is committed and shows up in
the PR diff.

**Figma first, in the same PR.** A new or changed theme token is added to the
Handsontable Design System in Figma first, while the PR is open, then exported
(`tokens.json`) and brought into the code with `npm run generate:themes`. Never
merge a token that is in the code but not in Figma, and never leave a "not in
Figma yet" note for later. Each run writes `static-manifest.json` (a SHA-256 per
generated file), and `src/themes/__tests__/staticThemesGenerated.unit.js` fails
when a static file no longer matches it, which is what a hand edit looks like.
The step-by-step workflow is in the `handsontable-css-dev` skill ("Adding a new
theme token") and in `.ai/CONVENTIONS.md`.

## Where to look

| You need | Read |
|---|---|
| Pipeline / data flow (process → JS → CSS) | `.ai/ARCHITECTURE.md` |
| File and directory layout | `.ai/STRUCTURE.md` |
| Runtime, scripts, output formatting | `.ai/STACK.md` |
| Naming, units, exception keys; adding a token / theme / icon | `.ai/CONVENTIONS.md` |
| Known footguns (silent drops, no input validation, silent icon-set fallback) | `.ai/CONCERNS.md` |
| Exporting tokens from Figma and running the generator | `README.md` |
