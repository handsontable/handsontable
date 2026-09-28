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
- `skipLibCheck` is on for the declaration build because this package pins `typescript@4.9.5` while `vue`
  resolves to 3.5.x, whose own `.d.ts` use `NoInfer` (TS 5.4) and `ToggleEvent` (TS 5.5 `lib.dom`). It is a
  stand-in for that version skew, not a fix — it suppresses diagnostics inside `.d.ts` only, so the `.ts`
  and `.vue` sources stay fully checked. Drop it if the package moves to TypeScript 5.
- **`strictNullChecks` must stay on in `tsconfig.json`.** It is what makes the emit truthful, not a style
  preference: with null checks off the checker folds `Handsontable | null` down to `Handsontable`, so the
  published type says `hotInstance` is never `null` when it is `null` before `hotInit()` and after the grid
  is destroyed — `hotTableRef.value.hotInstance.getData()` then compiles and throws. `test/types` asserts
  the `| null` survives, so turning the flag off goes red rather than shipping. Keep the nullable data
  members annotated (`null as Handsontable | null`), never widened with `as unknown as`.
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
