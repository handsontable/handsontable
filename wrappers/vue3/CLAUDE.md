# Vue 3 Wrapper (@handsontable/vue3)

## Critical Rules

- **No business logic** in wrappers - belongs in `handsontable/src/`
- **Build core first**: `pnpm --filter handsontable run build` - wrappers consume `handsontable/tmp/`
- Cross-platform scripts: Use Node.js `.mjs` helpers

## Architecture

- SFC components: `HotTable.vue`, `HotColumn.vue`
- `defineComponent` with `propFactory('HotTable')`
- Deep watchers (`watch` with `deep: true`) detect prop changes -> `updateSettings()`
- `prepareSettings()` transforms Vue props -> Handsontable settings
- `provide()` exposes settings to HotColumn children
- Data syncs by reference (no deep copying)

## Key Files

- `src/HotTable.vue`, `src/HotColumn.vue`, `src/helpers.ts`, `src/types.ts`

## Build & Test

- Build: Rollup 4
- Test: `pnpm --filter @handsontable/vue3 run test` (Jest + @vue/test-utils)

For detailed guidance: use skill `vue-wrapper-dev`
