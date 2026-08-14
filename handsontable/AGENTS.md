# Handsontable Core Package

This is the core data grid package. **TypeScript** - source files in `src/` are `.ts`. Type declarations are **auto-generated** by `tsc --emitDeclarationOnly` (`npm run build:types`, task defined in `scripts/tasks.json`) into `tmp/*.d.ts` — do not hand-edit them. The `types/` directory has been **deleted** — do not recreate it. Walkontable (`src/3rdparty/walkontable/src/`) is also TypeScript and is now type-checked by the main `tsconfig.json` — it still has its own separate build (rspack) and test (Puppeteer) pipeline.

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
- Never call `String.prototype.toLocaleLowerCase`/`toLocaleUpperCase` directly — use `localeLowerCase()` from `helpers/string` (faster, locale-correct, crash-safe). Enforced by `no-restricted-syntax`. See `.ai/CONVENTIONS.md`.
- Never call a JavaScript method newer than `../browser-targets.js` (Chrome >= 110, Firefox >= 110, Safari >= 14.1). swc lowers syntax only and adds no core-js polyfills, so such a call throws `X is not a function` on a supported browser. Two gates catch this: `tsconfig.json` pins `lib` to `ES_TARGET` from `../browser-targets.js`, so an above-floor built-in is a type error in `.ts` files; `no-restricted-syntax` covers the same methods plus the 12 remaining `.js` files in `src/` (`allowJs` is off): `toSorted`/`toSpliced`/`toReversed`/`with` → `[...arr].sort()` / `[...arr].reverse()`; `at` → `arr[0]` / `arr[arr.length - 1]`; `findLast`/`findLastIndex` → reverse `for` loop; `Object.hasOwn` → `Object.prototype.hasOwnProperty.call()`; `structuredClone` → `deepClone()` from `helpers/object`. Verify any new method's floor against `core-js-compat`'s `data.json` before using it (`structuredClone` has no entry there — its floor comes from `compat/compat`; `Array#with` is Firefox 140, far above the rest of its ES2023 group).
- `Error` `cause` is ES2022 (Chrome 94 / Firefox 91 / Safari 15.0), above the declared floor, so `throwWithCause()` assigns `cause` after construction instead of passing the constructor options bag. Do not "simplify" it back to `new Error(msg, { cause })` — older engines ignore the second argument silently, which leaves `error.cause` undefined and breaks `error.cause?.handsontable === true` detection with no visible failure.

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
| E2E (legacy, frozen) | `*.spec.js` | Jasmine (Puppeteer) | `npm run test:e2e` |
| E2E (new) | `tests/e2e/*.spec.ts` | Playwright | `cd tests && npm test` |

**New E2E is Playwright** in `tests/e2e/` (skill: `handsontable-playwright-e2e`). The Jasmine `*.spec.js` suite is frozen — edit existing specs, but add no new ones, and migrate broken ones to Playwright. What to test in which framework, and when a test is even required, is machine-enforced by the presence gate; the decision rules are in `.ai/TESTING.md`.

- ALL `it()` callbacks in spec files MUST be `async`
- HOT API calls MUST be `await`-ed
- E2E helpers are globals (no imports): `handsontable()`, `selectCell()`, `getDataAtCell()`, `createSpreadsheetData()`
- Targeted unit: `npm run test:unit --testPathPattern=<regex>` or `npm run test:unit -- --testPathPattern=<regex>` (regex matched against file paths, e.g. `filters`, `ghostTable.unit`)
- Targeted e2e: `npm run test:e2e --testPathPattern=<regex>` or `npm run test:e2e -- --testPathPattern=<regex>` (e.g. `collapsibleColumns`, `textEditor`, `nestedHeaders/__tests__/hidingColumns`)
- E2E with theme: `npm run test:e2e --testPathPattern=<regex> --theme=horizon` (themes: `classic`, `main`, `horizon`; default: `main`)
- **Rebuild before E2E:** E2E runner loads `dist/handsontable.js` - rebuild after changing `src/`
- Verify no exceptions appear in the console during tests

## Common Pitfalls

- **Wrapper UI placement**: The root wrapper has `ht-slot-top`, `ht-grid` (grid + empty-data-state), `ht-slot-bottom`, `ht-overlay` (last). Add plugin UI to a user-orderable edge slot via `hot.getLayoutManager().register(key, element, { side: 'top'|'bottom', weight })` and `unregister(key, side)` on teardown — `register` owns the DOM placement, so do NOT `appendChild` into the slot elements yourself. `getLayoutManager()` throws on non-root instances, so guard slot calls with `isRootInstance(this.hot)`. Edge-slot order is user-overridable through the `layout` setting (`top`/`bottom`). The slot registry is data-driven from `LAYOUT_SLOTS` (`src/core/layout/constants.ts`) — `register`/`getSlot`/`applyConfig`/the manager constructor all derive from it, so adding a slot (e.g. `start`/`end`) means extending `LAYOUT_SLOTS` + wiring its element + CSS. `ht-grid` and `ht-overlay` are fixed internal elements (NOT slots, not orderable); a plugin needing the overlays layer (e.g. Dialog, Notification) appends into `hot.rootOverlaysElement` directly. `LayoutManager.destroy()` keeps its slot map (only clears contents) so a plugin's `disablePlugin` running after core destroy stays safe. See `src/core/layout/`.
- **`arr.push(...largeArray)`**: Causes stack overflow with 10k+ elements. Use `forEach` loop instead.
- **`getCellMeta` vs `getCellMetaTransient` — pick by whether the cell must stay materialized.** Both resolve the same effective configuration (full cascade + `cells` function + meta hooks). The difference: `hot.getCellMeta(row, col)` permanently stores one meta object per visited cell; `hot.getCellMetaTransient(row, col)` stores nothing (unstored cells get a throwaway object; cells that already carry stored meta return that stored object). Default to **`getCellMetaTransient` for every read-only use** — any loop over a row/column range or per-change read (copy, export, validation, sampling, fills, toggles, `valueSetter`/`valueGetter` accessors). Reserve `getCellMeta` for the render path and for reads whose result must survive on the stored object (e.g. validation writing `valid`). A loop of `getCellMeta` over a large range retains O(visited cells) memory that viewport eviction cannot sweep — this class of leak was the core of the OOM investigation. Never mutate what either method returns; persist with `setCellMeta`. Details: `src/dataMap/metaManager/AGENTS.md`.
- **Merged cells**: Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, NOT from DOM element attributes. The meta is authoritative regardless of viewport state.
- **Filters visual/physical index**: `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual. Always convert when `manualColumnMove` is active.
- **`afterClose` can fire without `afterOpen`** (`editorFactory`): `open()` sets `_opened = true` and calls `refreshDimensions()` before `afterOpen`, and `refreshDimensions()` calls `close()` when the edited cell is no longer rendered. Anything created in `afterOpen` (a third-party picker instance, for example) may therefore be missing in `afterClose` - guard every teardown access instead of assuming the object exists.
- **Hook signature / TypeScript fixes**: When changing hook signatures, add both a runtime regression test and a TypeScript regression (`src/__tests__/core/settings.types.ts`).
- **Adding a new hook**: (1) Add the callback signature to the `GridSettings` interface in `src/core/settings.ts` (the `Events` type is derived automatically from hook-shaped entries). (2) Register the hook name in the `REGISTERED_HOOKS` array in `src/core/hooks/constants.ts`. The `addHook<K extends keyof Events>` overload then provides full IDE autocomplete. Full reference: `handsontable/.ai/HOOKS.md`.
- **Plugin public types**: Export new interfaces/types from the plugin `.ts` source file, then re-export via the plugin's barrel `index.ts` using `export type { ... }`. Do NOT add hand-crafted `.d.ts` stubs.
- **Two builds to test**: `handsontable.js` (base, no HyperFormula) and `handsontable.full.js` (includes HyperFormula). Test both when changing build-time behavior.
- **Validator corrections via `setDataAtCell`**: If a validator calls `setDataAtCell` to write a corrected value (e.g. `correctFormat`), the source string **must end with `'Validator'`** (e.g. `'myCustomValidator'`). Without this suffix, the correction is silently overwritten when the same batch contains columns with async validators (async autocomplete `source`). See `src/core.ts` `validateChanges()` and the `handsontable-validator-dev` skill.
- **Newer-than-TS-5.1 lib types in emitted `.d.ts`**: Published types must be consumable by TS 5.1 (Angular 16's max). If your code causes `tsc` to emit `ArrayIterator`, `WeakKey`, `IteratorObject`, or similar lib types added after TS 5.1, the `verify-emitted-types` CI job will fail. Two ways to fix: add an explicit annotation at the source (`IterableIterator<T>`, `WeakMap<object, any>`), or extend `scripts/downlevel-dts.mjs` with a new replacement row. The source file is still compiled by the modern dev TS — only the published `.d.ts` is downleveled.
- **`toLocaleLowerCase(locale)` is a performance trap**: an explicit locale arg forces the ICU path (~45× slower) and throws on invalid tags. Use `localeLowerCase(value, locale)` from `helpers/string`. Only Turkish/Azeri/Lithuanian actually tailor lowercasing; the helper detects that and otherwise uses the fast `toLowerCase()`.
- **Anything `destroy()` must clean up belongs in the `Core` closure, not on the instance** — and its callback still needs a guard. `destroy()` runs `objectEach(instance, …)`, which nulls every non-function instance property, and then sets the closure `instance = null`; a handle parked on the instance is gone before the cleanup line could read it. Declare it next to `datamap`/`grid`/`selection` and release it at the *top* of `destroy()`, before that teardown (the hidden-init `visibilityObserver` is the reference case, DEV-2210). Any callback that outlives a task boundary — observer delivery, timeout, microtask — must open with `if (!instance || instance.isDestroyed || !instance.<field>) { return; }`, with `!instance` first: an `IntersectionObserver`/`ResizeObserver` entry carries the state from its snapshot, so a delivery can land after destroy, and in the legacy Puppeteer suite one uncaught `pageerror` aborts all ~9,600 specs.
- **jsdom reports every element as invisible**, so in every jsdom-based suite `rootElement.offsetParent === null` always holds and *every* grid built there takes core's hidden-init branch. Whatever that branch touches must exist on the observer stubs — and they are duplicated per package, with different surfaces: `handsontable/test/__mocks__/{intersectionObserverMock,resizeObserverMock}.js`, `wrappers/react-wrapper/test/__mocks__/`, `wrappers/vue3/test/__mocks__/` **plus** a second copy in `wrappers/vue3/test/_helpers.ts`, and `wrappers/angular-wrapper/projects/hot-table/setup-jest.ts`. Call a method one of them lacks and `destroy()` throws across that whole suite, not just the test you were writing. After touching init or destroy, run the full `test:unit` **and** all three wrapper suites — the wrapper jobs (`Integration / React`, `Integration / Vue 3`) fail on this independently of core.

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
| Public/shared types | Consumers: `import { GridSettings, HotInstance, Events } from 'handsontable'` (see `docs/content/guides/tools-and-building/typescript-types/typescript-types.md`). Declared in `src/core/settings.ts` + `src/core/types.ts`. |
| TypeScript config (source) | `tsconfig.json` |
| TypeScript config (emit declarations) | `tsconfig.build-types.json` |
| Build/test task definitions | `scripts/tasks.json` |
| Figma theme generator (codegen for `src/themes/static`) | `scripts/themes/figma/` — run `npm run generate:themes` |
| Shortcut contexts | `src/shortcuts/contexts/` |

## Performance

- Batch scroll updates with `requestAnimationFrame`. Target 60fps with 100k+ row datasets.
- Wrap multi-operation work in `batch()` / `batchRender()` / `suspendRender()` / `resumeRender()` to avoid redundant redraws.
- Performance must not degrade across releases (library size, render speed, memory).

## API Design

- Expose all necessary methods in the public API. Keep them discoverable and documented in guides.
- Every configuration option must fit the cascading configuration model (`cell` → `column` → `global`).
- The public API must give good code completion in IDEs and AI assistants.

## Lint

```
npm run lint                        # ESLint + Stylelint
npm run eslint --prefix handsontable
npm run stylelint --prefix handsontable
```

Common violations and their fixes (the rules behind them are in Critical Rules above; the full custom-rule catalog with test-file overrides is in `handsontable/.ai/CONVENTIONS.md`, and the rule implementations live in `.config/plugin/eslint/rules/`):

Source `.ts` files (`src/**/*.ts`, excluding walkontable and test/type files) and build scripts (`scripts/**/*.mjs`) now enforce `jsdoc/require-jsdoc` at `error` level for classes, methods, functions, and class fields. Test and type files (`*.unit.ts`, `*.spec.ts`, `*.types.ts`, `*.d.ts`) are exempt.

| Violation | Fix |
|---|---|
| `throw new Error('message')` | `import { throwWithCause } from 'helpers/errors'; throwWithCause('message', cause);` |
| `import { X } from '../plugins/index'` | `import { X } from '../plugins/specificPlugin/specificPlugin';` |
| `it('should ...', () => {` (in `*.spec.js`) | `it('should ...', async() => {` |
| `selectCell(0, 0);` (in `*.spec.js`) | `await selectCell(0, 0);` |
| `window.scrollTo(...)` | `this.hot.rootWindow.scrollTo(...)` |
| `document.querySelector(...)` | `this.hot.rootDocument.querySelector(...)` |
| `console.warn(...)` | `import { warn } from 'helpers/console'; warn(...);` |
| Missing JSDoc comment (`jsdoc/require-jsdoc`) on a class/method/field/function | Add a multiline block above it with a blank line before `/**` and after `*/` — `/**` on its own line, then ` * Description.`, then ` */`; no `@private` tag on `#`-fields; no `@param`/`@returns` in `.ts` files |

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
- Cross-file queries (who calls X, what imports Y, rename impact, blast radius): query the pre-built code-review-graph MCP before walking call chains with Grep+Read — workflow in `.ai/MCP.md` and, in Claude Code, the `code-graph` skill
- Plugin development: `handsontable-plugin-dev`
- Editors/renderers/validators/cellTypes: `handsontable-editor-dev`, `handsontable-renderer-dev`, `handsontable-validator-dev`, `handsontable-celltype-dev`
- Testing: `handsontable-unit-testing`, `handsontable-e2e-testing`
- Coordinate systems: `coordinate-systems`
- Linting: this file's Lint section + `handsontable/.ai/CONVENTIONS.md`
- i18n: `i18n-translations`
