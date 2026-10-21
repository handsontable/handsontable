---
name: vue-wrapper-dev
path: wrappers/vue3/**
description: Use when developing or modifying the @handsontable/vue3 wrapper package - Vue 3 SFC components, deep watchers, and provide/inject patterns for settings propagation
---

# Vue 3 Wrapper Development

Package: `wrappers/vue3/`. Wrapper rules, build, and test commands: `wrappers/vue3/AGENTS.md`.

## Architecture

- **`HotTable.vue`:** main SFC; creates the instance on mount, tears it down on unmount.
- **`HotColumn.vue`:** child for declarative per-column configuration.
- `defineComponent` with `propFactory('HotTable')` generates a prop per Handsontable option.
- Deep watchers (`watch` with `deep: true`) call `updateSettings()` on prop changes.
- `prepareSettings()` turns props into a plain settings object, dropping Vue-specific properties.
- `provide()` / `inject()`: HotTable provides settings and the instance so HotColumn children register their configs.
- **Data** is synced by reference, not deep-copied: mutations to the original array show in the grid. Keep the same array reference unless you intend a full reload.

Build: Rollup 4. Tests: Jest with `@vue/test-utils`; `npm run test --prefix wrappers/vue3` after `npm run build --prefix handsontable` (wrappers consume `handsontable/tmp/`, not `dist/`).

| File | Purpose |
|---|---|
| `src/HotTable.vue` | Main grid component |
| `src/HotColumn.vue` | Per-column configuration |
| `src/helpers.ts` | Settings preparation, utilities |
| `src/types.ts` | Type definitions |

## Rules

- All data transformation and validation lives in `handsontable/src/`.
- npm scripts use Node.js `.mjs` helpers.
