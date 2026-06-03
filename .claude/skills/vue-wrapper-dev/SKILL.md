---
name: vue-wrapper-dev
path: wrappers/vue3/**
description: Use when developing or modifying the @handsontable/vue3 wrapper package - Vue 3 SFC components, deep watchers, and provide/inject patterns for settings propagation
---

# Vue 3 Wrapper Development

## Package location

`wrappers/vue3/`

## Components

- **HotTable.vue** - the main Single-File Component. Creates the Handsontable instance on mount and tears it down on unmount.
- **HotColumn.vue** - child component for declarative per-column configuration.

## Architecture

Components use `defineComponent` with `propFactory('HotTable')` to auto-generate prop definitions matching every Handsontable option.

Deep watchers (`watch` with `deep: true`) monitor prop changes. When a change is detected, the watcher calls `updateSettings()` on the Handsontable instance with the new values.

`prepareSettings()` is a helper that transforms Vue component props into a plain Handsontable settings object, filtering out Vue-specific properties.

Parent-child communication uses Vue's `provide()` / `inject()` pattern. The HotTable component provides its settings and instance reference so HotColumn children can register their column configurations.

**Data handling:** Data is synced by reference, not deep-copied. Mutations to the original data array are reflected in the grid without extra work. Avoid replacing the data array reference unless you intend a full reload.

## Build and test

- **Build system:** Rollup 4.
- **Tests:** Jest with `@vue/test-utils`.
- **Run tests:** `npm run test --prefix wrappers/vue3`
- **Important:** Build core first with `npm run build --prefix handsontable`. Wrappers consume `handsontable/tmp/`, not `dist/`.

## Key files

| File | Purpose |
|---|---|
| `src/HotTable.vue` | Main grid component |
| `src/HotColumn.vue` | Per-column configuration component |
| `src/helpers.ts` | Settings preparation and utility functions |
| `src/types.ts` | TypeScript type definitions |

## Rules

- No business logic in wrappers. All data transformation and validation belongs in `handsontable/src/`.
- Cross-platform npm scripts: use Node.js `.mjs` helpers instead of bash-only constructs.
