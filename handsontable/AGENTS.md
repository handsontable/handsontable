# Handsontable Core Package

This is the core data grid package. **TypeScript** - source files in `src/` are `.ts`. Type declarations are **auto-generated** by `tsc --emitDeclarationOnly` (`npm run build:types`, task defined in `scripts/tasks.json`) into `tmp/*.d.ts` — do not hand-edit them. The `types/` directory has been **deleted** — do not recreate it. Walkontable (`src/3rdparty/walkontable/src/`) is also TypeScript but excluded from the main `tsconfig.json` — it has its own separate build/test pipeline.

## Critical Rules

- Use `throwWithCause()` from `src/helpers/errors.ts`, never `throw new Error()`
- No barrel imports from `plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index` - import from specific submodule paths. Only exception: `src/registry.ts`
- No global `window`, `document`, `console` - use `this.hot.rootWindow`, `this.hot.rootDocument`, and helpers from `src/helpers/console.ts`
- Private fields use `#` prefix, not `@private` JSDoc
- **Required**: Plugin hook callbacks must be arrow function class fields — `#onAfterX = (arg1, arg2) => { ... }` — and passed directly: `this.addHook('afterX', this.#onAfterX)`. Never wrap in `(args) => this.#onX(args)` or use `.bind(this)`.
- Cognitive complexity: keep each function at 15 or below
- Optional chaining `?.` only when value is genuinely optional by design
- No hardcoded user-visible strings in source - add constants to `src/i18n/constants.ts` and update all language files in `src/i18n/languages/`
- No direct cross-plugin imports - use hooks for inter-plugin communication, or `hot.getPlugin('Name')` if API access is required
- Never use raw `setTimeout` - use `this.hot._registerTimeout(fn, delay)` instead; it auto-clears on `hot.destroy()`, preventing memory leaks
- DRY: reuse existing helpers and mixins; if code repeats, extract a generic helper rather than duplicating
- Method ordering: public methods first, then private listeners
- In text and comments, always write `Handsontable`, never `HOT` (a `hot` variable holding an instance is fine)

## Plugin Lifecycle

```
isEnabled()      → return !!this.hot.getSettings()[PLUGIN_KEY]
enablePlugin()   → init state, create IndexMaps, register hooks. super.enablePlugin() AT END.
updatePlugin()   → this.disablePlugin(); this.enablePlugin(); super.updatePlugin();
disablePlugin()  → super.disablePlugin() FIRST. Then clean up.
destroy()        → null out fields. super.destroy() AT END.
```

Gold standard: `src/plugins/pagination/pagination.ts`

## Three Coordinate Systems

| Type | Description | Use for |
|------|-------------|---------|
| Physical | Position in source data array | Data access, persistence |
| Visual | Position after trimming (DataMap) | User-facing display logic |
| Renderable | Position after hiding (DOM) | DOM operations |

Translate with `hot.rowIndexMapper` / `hot.columnIndexMapper`.
Gotcha: Filters `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual.

## Testing

| Type | Pattern | Framework | Run |
|------|---------|-----------|-----|
| Unit | `*.unit.js` | Jest (jsdom) | `npm run test:unit` |
| E2E | `*.spec.js` | Jasmine (Puppeteer) | `npm run test:e2e` |

- ALL `it()` callbacks in spec files MUST be `async`
- HOT API calls MUST be `await`-ed
- E2E helpers are globals (no imports): `handsontable()`, `selectCell()`, `getDataAtCell()`, `createSpreadsheetData()`
- Targeted unit: `npm run test:unit --testPathPattern=<regex>` or `npm run test:unit -- --testPathPattern=<regex>` (regex matched against file paths, e.g. `filters`, `ghostTable.unit`)
- Targeted e2e: `npm run test:e2e --testPathPattern=<regex>` or `npm run test:e2e -- --testPathPattern=<regex>` (e.g. `collapsibleColumns`, `textEditor`, `nestedHeaders/__tests__/hidingColumns`)
- E2E with theme: `npm run test:e2e --testPathPattern=<regex> --theme=horizon` (themes: `classic`, `main`, `horizon`; default: `main`)
- **Rebuild before E2E:** E2E runner loads `dist/handsontable.js` - rebuild after changing `src/`
- Verify no exceptions appear in the console during tests

## Common Pitfalls

- **`arr.push(...largeArray)`**: Causes stack overflow with 10k+ elements. Use `forEach` loop instead.
- **Merged cells**: Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, NOT from DOM element attributes. The meta is authoritative regardless of viewport state.
- **Filters visual/physical index**: `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual. Always convert when `manualColumnMove` is active.
- **Hook signature / TypeScript fixes**: When changing hook signatures, add both a runtime regression test and a TypeScript regression (`src/__tests__/core/settings.types.ts`).
- **Adding a new hook**: (1) Add the callback signature to `GridSettings` in `src/common.ts` (the `Events` type is derived automatically from hook-shaped entries). (2) Register the hook name in `src/core/hooks/index.ts`. The `addHook<K extends keyof Events>` overload then provides full IDE autocomplete.
- **Plugin public types**: Export new interfaces/types from the plugin `.ts` source file, then re-export via the plugin's barrel `index.ts` using `export type { ... }`. Do NOT add hand-crafted `.d.ts` stubs.
- **Two builds to test**: `handsontable.js` (base, no HyperFormula) and `handsontable.full.js` (includes HyperFormula). Test both when changing build-time behavior.
- **Validator corrections via `setDataAtCell`**: If a validator calls `setDataAtCell` to write a corrected value (e.g. `correctFormat`), the source string **must end with `'Validator'`** (e.g. `'myCustomValidator'`). Without this suffix, the correction is silently overwritten when the same batch contains columns with async validators (async autocomplete `source`). See `src/core.ts` `validateChanges()` and the `handsontable-validator-dev` skill.
- **Newer-than-TS-5.1 lib types in emitted `.d.ts`**: Published types must be consumable by TS 5.1 (Angular 16's max). If your code causes `tsc` to emit `ArrayIterator`, `WeakKey`, `IteratorObject`, or similar lib types added after TS 5.1, the `verify-emitted-types` CI job will fail. Two ways to fix: add an explicit annotation at the source (`IterableIterator<T>`, `WeakMap<object, any>`), or extend `scripts/downlevel-dts.mjs` with a new replacement row. The source file is still compiled by the modern dev TS — only the published `.d.ts` is downleveled.

## Key File Locations

| Area | Path (relative to `handsontable/`) |
|---|---|
| Core class | `src/core.ts` |
| Entry points | `src/index.ts` (full), `src/base.ts` (tree-shakeable) |
| Plugin base class | `src/plugins/base/base.ts` |
| Meta schema (defaults) | `src/dataMap/metaManager/metaSchema.ts` |
| Index translations | `src/translations/` |
| Walkontable engine | `src/3rdparty/walkontable/src/` (TypeScript, separate build pipeline) |
| Hooks system | `src/core/hooks/` |
| DataProvider plugin | `src/plugins/dataProvider/dataProvider.ts` |
| Error helpers | `src/helpers/errors.ts` |
| i18n constants | `src/i18n/constants.ts` |
| i18n language files | `src/i18n/languages/` |
| TypeScript declarations (auto-generated) | `tmp/*.d.ts` — generated by `build:types` |
| Central shared types hub | `src/common.ts` — `GridSettings`, `HotInstance`, `Events` |
| TypeScript config (source) | `tsconfig.json` |
| TypeScript config (emit declarations) | `tsconfig.build-types.json` |
| Build/test task definitions | `scripts/tasks.json` |
| Shortcut contexts | `src/shortcuts/contexts/` |

## Performance

- Never `arr.push(...largeArray)` with 10k+ elements — it overflows the stack. Use a `forEach` loop.
- Batch scroll updates with `requestAnimationFrame`. Target 60fps with 100k+ row datasets.
- Wrap multi-operation work in `batch()` / `batchRender()` / `suspendRender()` / `resumeRender()` to avoid redundant redraws.
- Performance must not degrade across releases (library size, render speed, memory).

## API Design

- Expose all necessary methods in the public API. Keep them discoverable and documented in guides.
- Every configuration option must fit the cascading configuration model (`cell` → `column` → `global`).
- The public API must give good code completion in IDEs and AI assistants.

## Lint

```
npm run lint
```

## Build

`npm run build`

| Output | Path |
|---|---|
| UMD / minified bundles | `dist/` |
| ES and CJS modules (used by wrappers) | `tmp/` |
| Compiled CSS | `styles/` |

Two build variants: `handsontable.js` (base, external deps) and `handsontable.full.js` (includes HyperFormula). The E2E runner loads `dist/handsontable.js` - rebuild after changing `src/`.

## Build and test scripts

All `npm run` entries are thin shims that delegate to `scripts/run.mjs`. Task commands and pipeline dependency graphs live in `scripts/tasks.json` - edit that file to add, remove, or modify any build/lint/test step. The dispatcher supports three modes:

```
node scripts/run.mjs <task>                     # run one task
node scripts/run.mjs --sequential <pipeline>    # run pipeline steps in order
node scripts/run.mjs --parallel <pipeline>      # run pipeline with DAG scheduler (used by build)
```

Extra args after `--` flow through to tasks with `"passthrough": true` in `tasks.json`. `--testPathPattern=` and `--theme=` are also propagated as env vars to all pipeline tasks so the dump step and Puppeteer compute the same run-ID filename.

## TypeScript

- Type check: `npm run test:types`
- `readonly #field` syntax IS valid TypeScript — do NOT convert `#field` to `private readonly field` to add `readonly`
- When removing `as T` casts (e.g. SonarCloud S4325), always rerun `npm run test:types` — some casts are load-bearing
- Prefer fixing function/method signatures or making them generic over adding `as T[]` casts at call sites

## For Deeper Guidance

Use these skills for detailed workflow instructions:
- Plugin development: `handsontable-plugin-dev`
- Editors/renderers/validators/cellTypes: `handsontable-editor-dev`, `handsontable-renderer-dev`, `handsontable-validator-dev`, `handsontable-celltype-dev`
- Testing: `handsontable-unit-testing`, `handsontable-e2e-testing`
- Coordinate systems: `coordinate-systems`
- Linting: `linting`
- i18n: `i18n-translations`
