# Vue 3 Wrapper (@handsontable/vue3)

## Critical Rules

- **No business logic** in wrappers - belongs in `handsontable/src/`
- **Feature parity**: Vue 3 wrapper must expose identical Handsontable functionality
- **Build core first**: `npm run build --prefix handsontable` - wrappers consume `handsontable/tmp/` not `dist/`
- Cross-platform scripts: Use Node.js `.mjs` helpers

## Architecture

- SFC components: `HotTable.vue`, `HotColumn.vue`
- `defineComponent` with `propFactory('HotTable')`
- Deep watchers (`watch` with `deep: true`) detect prop changes -> `updateSettings()`
- `prepareSettings()` transforms Vue props -> Handsontable settings
- `provide()` exposes settings to HotColumn children
- Data syncs by reference (no deep copying)

### Dynamic `HotColumn` ordering and updates

`HotColumn` children register their settings in `HotTable`'s `columnsCache` (a `Map` keyed by the column instance) via `provide`/`inject`. Do **not** order columns by `Map` insertion order - it is wrong for mid-list inserts and reorders. Instead:

- Each `HotColumn` renders an invisible comment anchor (`createCommentVNode`) instead of `null`. Handsontable appends its DOM to the container without clearing pre-existing nodes, so the anchors survive. `getColumnSettings()` orders columns by the anchors' `compareDocumentPosition`, which is correct for inserts, removals, and reorders, and works at any nesting depth (including a `HotColumn` inside a user wrapper component).
- Children call the injected `refreshColumns()` on `mounted`, `unmounted`, and a deep `$props` watch. `HotTable` also calls it from its `updated()` hook to catch reorders of keyed children (which fire no child lifecycle hook). Calls coalesce into one `$nextTick` flush that runs `updateSettings({ columns })` only when the settings-object array changed (compared by reference and order).

## Key Files

- `src/HotTable.vue`, `src/HotColumn.vue`, `src/helpers.ts`, `src/types.ts`

## Build & Test

- Build: Rollup 4. The last build step is `prepare:types` (`scripts/prepare-types.mjs`), which emits the
  published `.d.ts` with **`vue-tsc`** — not plain `tsc`. Plain `tsc` resolves the SFC imports through the
  `declare module '*.vue'` shim in `src/vue.d.ts` and emits an `index.d.ts` in which `HotTable` is `any`:
  declarations that silence TS7016 while checking nothing (DEV-2732).
- The declaration build runs on `vue-tsc` 3.x and TypeScript 5.x, with `skipLibCheck` off: `vue` 3.5's own
  `.d.ts` use `NoInfer` (TS 5.4) and `ToggleEvent` (TS 5.5 `lib.dom`), so TypeScript must stay at 5.5 or
  newer. Do not move to TypeScript 6 without migrating `moduleResolution: "node"` (deprecated there), and
  not to TypeScript 7 at all while `vue-tsc` needs the JavaScript compiler API. `vue-tsc` 1.x is gone
  because it pulled in the Vue 2 `vue-template-compiler`, which carries an unpatched XSS advisory.
- `vue-tsc` 3.x emits each SFC's default export as `declare const _default: typeof __VLS_export`, a
  separate const structurally identical to the named `HotTable`/`HotColumn` export. That is expected
  output, not a regression.
- **`strictNullChecks` must stay on in `tsconfig.json`.** `hotInstance` is `null` before `hotInit()` and
  after the grid is destroyed, so the published type must say `Handsontable | null` — otherwise
  `hotTableRef.value.hotInstance.getData()` compiles and throws. The flag also keeps the `.ts` and `.vue`
  sources honest about that `null`. On TypeScript 4.9 turning it off folded the emit down to
  `Handsontable`. TypeScript 5.9 reuses the written annotation instead, so the emit keeps `| null` even
  with the flag off, and `test/types` no longer goes red for that alone. What keeps the emit truthful now
  is the annotation itself: keep the nullable members annotated (`null as Handsontable | null`), never
  widened with `as unknown as`. `test/types` asserts the `| null` survives on the public `hotInstance`
  and `columnSettings`, so widening either goes red.
- Test: `npm run test --prefix wrappers/vue3` (Jest + @vue/test-utils)
- Type surface: `npm run test:types --prefix wrappers/vue3` (`test/types/*.types.ts`). It checks the
  **emitted** root declarations, so build first. Run it after any change to `src/index.ts`, `src/types.ts`,
  or the declaration pipeline.
- **Test paradigm:** the presence gate covers `wrappers/**` — a wrapper source change must ship a matching test. The Jest suite here is **jsdom** (props, deep-watch reactivity, lifecycle). Anything user-visible / real-browser goes to **Playwright E2E** in `tests/e2e/` — see the `handsontable-playwright-e2e` skill (Vue reactivity / deep-watch gotchas in its `references/wrappers.md`). Local gates + exact rules: `.ai/LOCAL-ENFORCEMENT.md`.

## Common Pitfalls

| Pitfall | What to do instead |
|---|---|
| `arr.push(...largeArray)` with large arrays | Causes stack overflow with 10k+ elements. Use `forEach` loop instead. |

For detailed guidance: use skill `vue-wrapper-dev`
