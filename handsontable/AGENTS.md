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

- **Wrapper UI placement**: The root wrapper has `ht-slot-top`, `ht-grid` (grid + empty-data-state), `ht-slot-bottom`, `ht-overlay` (last). Add plugin UI to a user-orderable edge slot via `hot.getLayoutManager().register(key, element, { side: 'top'|'bottom', weight })` and `unregister(key, side)` on teardown — `register` owns the DOM placement, so do NOT `appendChild` into the slot elements yourself. `getLayoutManager()` throws on non-root instances, so guard slot calls with `isRootInstance(this.hot)`. Edge-slot order is user-overridable through the `layout` setting (`top`/`bottom`). The slot registry is data-driven from `LAYOUT_SLOTS` (`src/core/layout/constants.ts`) — `register`/`getSlot`/`applyConfig`/the manager constructor all derive from it, so adding a slot (e.g. `start`/`end`) means extending `LAYOUT_SLOTS` + wiring its element + CSS. `ht-grid` and `ht-overlay` are fixed internal elements (NOT slots, not orderable); a plugin needing the overlays layer (e.g. Dialog, Notification) appends into `hot.rootOverlaysElement` directly. `LayoutManager.destroy()` keeps its slot map (only clears contents) so a plugin's `disablePlugin` running after core destroy stays safe. See `src/core/layout/`.
- **`arr.push(...largeArray)`**: Causes stack overflow with 10k+ elements. Use `forEach` loop instead.
- **`getCellMeta` vs `getCellMetaTransient` — pick by whether the cell must stay materialized.** Both resolve the same effective configuration (full cascade + `cells` function + meta hooks). The difference: `hot.getCellMeta(row, col)` permanently stores one meta object per visited cell; `hot.getCellMetaTransient(row, col)` stores nothing (unstored cells get a throwaway object; cells that already carry stored meta return that stored object). Default to **`getCellMetaTransient` for every read-only use** — any loop over a row/column range or per-change read (copy, export, validation, sampling, fills, toggles, `valueSetter`/`valueGetter` accessors). Reserve `getCellMeta` for the render path and for reads whose result must survive on the stored object (e.g. validation writing `valid`). A loop of `getCellMeta` over a large range retains O(visited cells) memory that viewport eviction cannot sweep — this class of leak was the core of the OOM investigation. Never mutate what either method returns; persist with `setCellMeta`. Details: `src/dataMap/metaManager/AGENTS.md`.
- **Merged cells**: Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, NOT from DOM element attributes. The meta is authoritative regardless of viewport state.
- **Filters visual/physical index**: `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual. Always convert when `manualColumnMove` is active.
- **Hook signature / TypeScript fixes**: When changing hook signatures, add both a runtime regression test and a TypeScript regression (`src/__tests__/core/settings.types.ts`).
- **Adding a new hook**: (1) Add the callback signature to the `GridSettings` interface in `src/core/settings.ts` (the `Events` type is derived automatically from hook-shaped entries). (2) Register the hook name in the `REGISTERED_HOOKS` array in `src/core/hooks/constants.ts`. The `addHook<K extends keyof Events>` overload then provides full IDE autocomplete. Full reference: `handsontable/.ai/HOOKS.md`.
- **Plugin public types**: Export new interfaces/types from the plugin `.ts` source file, then re-export via the plugin's barrel `index.ts` using `export type { ... }`. Do NOT add hand-crafted `.d.ts` stubs.
- **Two builds to test**: `handsontable.js` (base, no HyperFormula) and `handsontable.full.js` (includes HyperFormula). Test both when changing build-time behavior.
- **License key validation is inlined and layered**: typed keys (`[TRIAL]`/`[FREE]`/`[SUB]`/`[PERP]`) are read by `src/utils/typedLicenseKey/` (envelope reader → lifecycle classifier → grants) — a port from the private `handsontable/license-key` repo; never add that package as a dependency. The obfuscated legacy 25-character block in `helpers/mixed.ts` is frozen — typed keys route out BEFORE it via a tag-prefix check, and legacy behavior (including exact console/DOM messages) must never change. The grants API is uniform across key families: legacy/missing/invalid keys resolve to unrestricted grants, so future feature gating can never take a feature away from an existing customer. The branding UI is a MODULE CATALOG (`src/utils/licenseBranding/`: `index.ts` = state routing (read once at init), `content.ts` = copy, `badge.ts` = corner badge + popover, `lockScreen.ts` = hard-stop lock) — a core util, NOT a plugin (plugins can be absent or disabled; license UI must not be). The corner badge + popover render for TRIAL and FREEMIUM keys ONLY (`POPOVER_CONTENT` in `content.ts` holds exactly `trial_active`, `trial_expired`, `freemium`). Every other state — missing, invalid, expired legacy, non-commercial, running subscription, perpetual — shows NO badge; its console message and any bottom bar still come from `initLicenseNotification`/`_injectProductInfo` (the legacy console/bar messaging stays untouched, and `_classifyLegacyKey` in `mixed.ts` mirrors the frozen checks read-only). The corner badge is click-through (`pointer-events: none`) so the corner header keeps its native select-all — hover is detected by delegation (`is-corner-hover` class), and the glyph itself is pure CSS - an `::after` inside the corner header cell, gated by BOTH `ht-license-badge-on` (on the root element) and `ht-license-badge-corner` (a class JS stamps on THIS grid's own corner-clone table, resolved via the Walkontable overlay); the glyph CSS keys off that marker, NEVER the structural `.ht_clone_top_inline_start_corner` class, which also matches a nested grid's corner clone and would paint a stray badge there. So it can never overflow or drift out of the corner; never rebuild it as a measured overlay (the overlay version broke visual tests with misaligned badges) - JS measurement exists only to anchor the popover. The popover is a PURELY VISUAL floating element: no focus scope, no shortcuts, badge/link/close all `tabindex="-1"`, visibility is pointer-only, close is mouse-click only (the info is duplicated in the console + bottom bar). The hard stops render the CORE-OWNED lock screen (`lockScreen.ts`) — NEVER the Dialog plugin (a shared surface an app legitimately uses: any `show` would replace the lock, any hide would look like a dismissal, and `dialog: true` setups would never tear it down); the lock instead REUSES the confirm-dialog CSS by wearing its class names (`ht-dialog ht-dialog--confirm handsontable ...` — the stylesheet always ships in full, so styling is inherited without importing the plugin) and copies its width sizing (pin `style.width` to the table workspace width on `afterViewRender`, or the `.ht-dialog` box spans the whole root wrapper, not the grid). The lock DOES use the focus manager (modal scope) + shortcut manager (Tab trap, Escape when closable). The trial lock is non-closable; the subscription lock is closable and mode-gated: ONLY payload mode `internal` gets it, `saas`/unknown modes stay console-only — no lock, no bar, no badge. The license key is read ONCE at init (like the console message and the bottom bar) — `updateSettings({licenseKey})` does NOT re-brand; applying a new key needs a fresh instance. Expiry compares against the build's release date, read BARE as `process.env.HOT_RELEASE_DATE` (in `licenseNotification.ts` and `licenseBranding/index.ts`) — the bundler (rspack DefinePlugin for `dist/`, SWC `inlineEnvVars` for `tmp/`) replaces it with a string literal, so NEVER wrap it in a `typeof process` guard: the guard is not inlined, compiles to `false` in browser bundles, blanks the date, and silently disables expired-key detection (an 18.0.0 regression). The badge reads its corner clone through the Walkontable API (`hot.view._wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.TABLE/THEAD`), NEVER a CSS `querySelector` on the root subtree (a nested grid — handsontable cell type — has its own corner clone earlier in document order that a selector would wrongly match). `extractTypedKeyData` strips ALL whitespace (repairs email-wrapped keys) and memoizes on the normalized key (read twice per init); a missing/empty tier fails open to top tier, a missing mode defaults to '' (NOT 'internal' — the blocking lock is opt-in on explicit `internal` only), a non-finite grace falls back to the default; a key granting Handsontable plus an unknown future product still reads (append-only priority). User-facing sentences repeated across surfaces (bar, popover, lock) live once as constants in `mixed.ts` (e.g. `LICENSE_EXPIRED_TITLE`) — edit the constant, not each surface. The state-keyed tables (console/DOM notifications in `mixed.ts`, badge/lock content in `content.ts`) are typed `Partial<Record<LicenseStateKey, …>>`, NOT `Record<string, …>` — a typoed or unknown state key is then a compile error instead of a silently dropped entry. Test fixtures: real CLI-generated keys in `src/utils/typedLicenseKey/__tests__/fixtures.js` plus a test-only key builder (`buildTestKey.js`) that must never be imported from `src/`.
- **Validator corrections via `setDataAtCell`**: If a validator calls `setDataAtCell` to write a corrected value (e.g. `correctFormat`), the source string **must end with `'Validator'`** (e.g. `'myCustomValidator'`). Without this suffix, the correction is silently overwritten when the same batch contains columns with async validators (async autocomplete `source`). See `src/core.ts` `validateChanges()` and the `handsontable-validator-dev` skill.
- **Newer-than-TS-5.1 lib types in emitted `.d.ts`**: Published types must be consumable by TS 5.1 (Angular 16's max). If your code causes `tsc` to emit `ArrayIterator`, `WeakKey`, `IteratorObject`, or similar lib types added after TS 5.1, the `verify-emitted-types` CI job will fail. Two ways to fix: add an explicit annotation at the source (`IterableIterator<T>`, `WeakMap<object, any>`), or extend `scripts/downlevel-dts.mjs` with a new replacement row. The source file is still compiled by the modern dev TS — only the published `.d.ts` is downleveled.
- **`toLocaleLowerCase(locale)` is a performance trap**: an explicit locale arg forces the ICU path (~45× slower) and throws on invalid tags. Use `localeLowerCase(value, locale)` from `helpers/string`. Only Turkish/Azeri/Lithuanian actually tailor lowercasing; the helper detects that and otherwise uses the fast `toLowerCase()`.

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
