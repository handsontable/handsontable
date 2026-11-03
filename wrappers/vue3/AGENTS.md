# Vue 3 Wrapper (@handsontable/vue3)

## Critical Rules

- **No business logic** in wrappers - belongs in `handsontable/src/`
- **Feature parity**: Vue 3 wrapper must expose identical Handsontable functionality
- **Build core first**: `npm run build --prefix handsontable` - wrappers consume `handsontable/tmp/` not `dist/`
- Cross-platform scripts: Use Node.js `.mjs` helpers

## Architecture

- SFC components: `HotTable.vue`, `HotColumn.vue`
- `defineComponent` with `propFactory('HotTable')`. Its return type is the template contract: `vue-tsc` reads every prop's type from it (see the typed-props pitfall below)
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
| Giving `propSchema.id` a static or random default | The default is evaluated once per module load: server and browser draw different ids (`Hydration attribute mismatch` under Nuxt), and every `HotTable` without an `id` shares one. `HotTable.vue` leaves the prop empty and writes `$el.id` in `mounted()` (client only, not reactive data: that would re-render every table after mount), so SSR markup carries no auto id. A `watch` on `id` (`flush: 'post'`) puts the generated id back if an explicit `id` is cleared. Core does not read the Vue container's id: for a root instance it creates its own inner root element. |
| Passing `dataProvider` together with `sheetsBar` | A grid-level `dataProvider` is ignored while the sheets bar is on. Put `dataProvider` in each server sheet's `settings`, and keep every `sheets[i].data` reference, and each sheet's `dataProvider` object with its callbacks, referentially stable across re-renders: sheet settings are compared structurally and functions by identity, so a new data array or an inline callback rebuilds the workbook and drops each sheet's cached server state (rows, sort, filters, page). |
| Comparing `sheetsBar` with `simpleEqual()` like the other props | `prepareSettings()` compares `sheetsBar` key by key (`isEqualSetting()` in `helpers.ts`): the `sheets` array by reference, and an option written as an object literal (`animation: { switch: false }`) by the references of its own keys, with reactive proxies unwrapped through `toRaw()`. Stringifying it serialized every sheet's data and a formula engine on each reactive change (about 185 ms per cell edit with two 5,000 x 10 sheets and an engine), and dropped functions, so a new `sheets` array differing only by a callback never reached the grid. Comparing the whole object by reference instead would send it on every render, because templates write `:sheetsBar="{ sheets }"`, and each send runs the plugin's update round trip. The other props keep `simpleEqual()` against `getSettings()`. A change the app makes inside the same `sheetsBar` object or the same `sheets` array is not sent. For the `sheets` array this matches the React wrapper: the plugin does not watch the host's own edits of it, and its methods change the workbook. React does send an in-place change to the other `sheetsBar` keys (`activeSheet`, `position`) on its next render, because it re-sends `sheetsBar` every time. |
| Writing `:sheetsBar="{ sheets: [...] }"` or a sheet's `data` inline in a template | The sheets bar writes renames, added sheets and removals into the `sheets` array it was given, the way the grid writes into `data`. A `sheets` array written in the template is a new one on every re-render and is sent; the plugin keeps the workbook only while every sheet's `data` and every function in its `settings` are the same references, so an inline `data` literal or an inline callback rebuilds it and the user's tab changes, sort and filters are gone. Before the key-by-key compare this was hidden: the stringified array matched, so nothing was sent. Keep `sheets` in a `ref()`, `data()` or a constant and pass `:sheetsBar="{ sheets }"`. Pinned by the inline-literal tests in `test/sheetsBar.spec.ts`; the sheets bar guide has a Vue section on it. |
| Typing a prop from `GridSettings`, or leaving its index signature in | `propFactory()`'s return type maps each option to `{ type: PropType<...>, default }`, and `defineComponent()` infers the props from it, so `vue-tsc` checks a template's values. The `type` key exists only in the type: the runtime schema has none, so Vue neither validates nor casts a prop. A bare `<HotTable readOnly>` therefore type-checks and reaches the grid as `""`, which is falsy. `PropSchema` maps `RemoveIndexSignature<Settings>` (the same helper the React wrapper uses): the settings types carry a `[key: string]` index signature, and mapped over, it becomes an index signature of the props and types every prop as `any` again. With it, an unknown prop compiles in lenient templates and fails under `strictTemplates`. `HotTable` maps `Handsontable.SettingsUpdate`, not `GridSettings`: a hook prop set to `null` removes its callback (`prepareSettings()` forwards it to `updateSettings()`), so the type has to take `null`. `HotColumn` maps `ColumnSettings` without hooks (`OmitHooks`, as React's `HotColumn` does: hooks run from the grid-level settings only) and without `getValue` (core reads it from the table meta only); its `settings` prop also takes `GridSettings`, because a grid settings object has no `data` to clash with the column's. A column's `data` is a property name or a getter (`<HotColumn data=\"firstName\" />`), where the grid's `data` is an array of rows; `HotColumn` has no `id` prop. `propFactory()` builds the runtime props from `DefaultSettings` and the registered hooks, so an option with no default needs its own line there (`handsontable` for both components, `getValue` for `HotTable`); without it the attribute type-checks, falls through as a DOM attribute, and never reaches the settings. `PropSchema` leaves out `afterChangesObserved`, a hook core never registers. `test/propSchemaKeys.spec.ts` compares the option names of `SettingsUpdate` and `ColumnSettings` with the runtime props, so a new option that misses one goes red. `VueProps<T>` stays a map of `any` on purpose: it is public and `test/types/vue3.types.ts` asserts it. Pinned by the `$props` and `h()` assertions in that file. Vue inlines the props map into the emitted `HotTable.vue.d.ts` (about 460 KB) and `HotColumn.vue.d.ts` (about 130 KB) when measured; exporting the schema types does not change that. |
| Comparing `themeName` with `getSettings().themeName` | Core moves the name into `theme` at init and clears `themeName`, so `getSettings().themeName` is always `undefined` and an unchanged `themeName` prop looked changed on every reactive change. Each cell edit then took the `updateSettings()` branch of the `$props` watcher instead of `render()` (about 400 ms against 60 ms with two 5,000 x 10 sheets and formulas). `isEqualSetting()` compares the prop with `getSettings().theme` when it is a string. A `theme` object, a changed name, and the first mount still send it. A theme the app set with `hot.useTheme()` survives later reactive changes, since `useTheme()` leaves `theme` alone and the prop still matches it. React diffs against its previous props and is not affected. |
| A formula engine in reactive settings | Vue's deep `$props` watcher walks every object it reaches, reactive or not, the engine's internals included, on each change; only `markRaw()` stops it. With two 5,000 x 10 sheets one cell edit took about 780 ms without `markRaw()` on the engine and about 65 ms with it. The guide's Vue formulas example uses `markRaw()`. |
| Editing an away sorted sheet's `data` in place with `sheetsBar` and `formulas` | A sheet left sorted, or with moved rows or columns, comes back with the formulas the formula engine holds for it, as long as its `data` is the same array with the same length. A cell changed in place in that array while the sheet is away is not seen. To change it, pass a new `sheets` value, which rebuilds the workbook (sheets added with `addSheet()` are dropped). |

For detailed guidance: use skill `vue-wrapper-dev`
