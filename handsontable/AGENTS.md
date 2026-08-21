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
- **Undo/redo bypasses the Formulas plugin's change listeners**: `isBlockedSource()` in `src/plugins/formulas/formulas.ts` makes `#onAfterSetDataAtCell` and `#onAfterSetSourceDataAtCell` return early for `'UndoRedo.undo'` and `'UndoRedo.redo'`, because the engine reverts those changes through its own undo stack (`beforeUndo` calls `engine.undo()`). Anything else those listeners do must be handled separately on the `afterUndo`/`afterRedo` path — that is how dependent formula cells kept a stale `valid` flag after undo (#dev-2036). Gate such work on **whether the action wrote cell data**, not on `action.actionType`: undoing an edit writes through `setDataAtCell`, and undoing a row or column removal restores the data with `setSourceDataAtCell` (`undoRedo/actions/removeRow.ts`, `removeColumn.ts`) — both must be handled. Only actions that purely reorder or hide (`row_move`, `col_sort`, `filter`, `merge_cells`) write nothing and can be skipped. Two traps when reading those hooks: (1) **only `setDataAtCell` writes are validated by the Core** — `setSourceDataAtCell` runs `sourceDataValidator` (`dataMap/sourceDataValidator.ts`), a separate mechanism that never touches the `valid` flag — so only the former may be excluded from a validation pass, or the restored cells end up validated by nobody; (2) `afterSetDataAtCell` carries **visual** rows while `afterSetSourceDataAtCell` carries **physical** ones (`core.ts` `setSourceDataAtCell`), so never feed the latter to `getHfIndexFromVisualIndex()` — the address then points at another row as soon as rows are sorted or moved, and silently suppresses whichever cell it collides with. `prop` needs no such care: `propToCol()` returns a visual column on both paths.
- **`Formulas#validateDependentCells` treats HyperFormula indexes as visual indexes** (`src/plugins/formulas/formulas.ts`): it bounds-checks `row >= hot.countRows()` and then calls `getDataAtCell(row, col)` / `getCellMeta(row, col)` on the raw HF index, without `getVisualIndexFromHfIndex()`. HF is fed trimmed rows too, so with `trimRows` or Filters active the two diverge and the wrong cell is validated (or the dependent is skipped when the HF index runs past `countRows()`). Known defect, still open — do not assume `valid` lands on the right cell in a trimmed grid.
- **`arr.push(...largeArray)`**: Causes stack overflow with 10k+ elements. Use `forEach` loop instead.
- **Off-DOM measurement tables (probes/ghosts) must mimic the real grid DOM exactly.** Cell and header styling is scoped with child combinators to the grid's own tables — `table.htCore` and any table that is a **direct child of an `.htGhostTable` container** (the `$ghost-table` scope in `src/styles/base/_base.scss`, issue #4363). Consequences for any table built for `getComputedStyle`/`getBoundingClientRect` measurement: (1) it must land in one of those two scopes — give it the `htCore` class (what `stylesHandler`'s fixed-layout probe does) or put it directly inside an `.htGhostTable`-classed container. Core `GhostTable` satisfies both: `createTable()` copies `hot.table.className`, so its tables **do** carry `htCore` (only the NestedHeaders ghost is class-less and relies on the container scope alone). That is safe only because `.handsontable .htCore` sets `width: 0; table-layout: fixed` and the horizontal (content-width) mode overrides both inline — `table.style.tableLayout = 'auto'; table.style.width = 'auto'` in `createTable()`. A content-width probe that inherits `htCore` without that override measures 0. And (2) build real `tr` chains — a `<th>` appended straight into `<thead>` matches no scoped rule and measures unstyled. This bit three times in one PR: the `stylesHandler` box-sizing probe, the core GhostTable header row, and the NestedHeaders ghost table.
- **Rendering a cell outside `TableView`? Use `src/renderers/renderCell.ts`.** `renderCell()` owns the renderer contract (cell renderer → base renderer unless chained → reset `_isBaseRendererCalled`), and `formatCellValue()` owns the formatter precedence (cell-level `valueFormatter` option, then the renderer's `valueFormatter` static). `TableView.cellRenderer`, `GhostTable`, and the auto-size samplers all call these helpers — never restate either sequence inline; that drift caused the #11997 regression family (DEV-2126). Gotcha: cell **types** (`type: 'numeric'`) copy the formatter into the cell meta, so the static branch only fires for `renderer:`-configured columns and custom renderers.
- **`getCellMeta` vs `getCellMetaTransient` — pick by whether the cell must stay materialized.** Both resolve the same effective configuration (full cascade + `cells` function + meta hooks). The difference: `hot.getCellMeta(row, col)` permanently stores one meta object per visited cell; `hot.getCellMetaTransient(row, col)` stores nothing (unstored cells get a throwaway object; cells that already carry stored meta return that stored object). Default to **`getCellMetaTransient` for every read-only use** — any loop over a row/column range or per-change read (copy, export, validation, sampling, fills, toggles, `valueSetter`/`valueGetter` accessors). Reserve `getCellMeta` for the render path and for reads whose result must survive on the stored object (e.g. validation writing `valid`). A loop of `getCellMeta` over a large range retains O(visited cells) memory that viewport eviction cannot sweep — this class of leak was the core of the OOM investigation. Never mutate what either method returns; persist with `setCellMeta`. Details: `src/dataMap/metaManager/AGENTS.md`.
- **Merged cells**: Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, NOT from DOM element attributes. The meta is authoritative regardless of viewport state.
- **A drag-driven feature needs an explicit touch path — `mousemove` never fires on mobile.** No browser emits `mousemove` while a finger is down, and the mousedown a phone does synthesize is deferred to `touchend` (`3rdparty/walkontable/src/event.ts`) so a touch-drag scrolls natively instead of selecting. A feature that reads pointer positions from `mousemove` is therefore dead on mobile, silently — this is how DragToScroll shipped without mobile auto-scroll (#11658). Bind `touchmove` alongside, ending on **both** `touchend` and `touchcancel`, and narrow the event with `getFirstTouchPoint()`/`hasTouchList()` from `helpers/dom/event.ts` rather than `instanceof TouchEvent` (each frame has its own constructor, and desktop Safari has none). **On mobile the ONLY drag path is `multipleSelectionHandles`**: `border.ts` gates the desktop `selectionHandles` and `moveCells` bands behind `!isMobileBrowser()`, so `afterOnSelectionHandleMouseDown` / `afterOnSelectionEdgeMouseDown` never fire there and a plugin waiting on those hooks is never armed. Drive the mobile handles' state through `getPlugin('multipleSelectionHandles').isDragged()` — a document-level `touchstart` listener sees it already set, because that plugin listens on `rootElement` and bubbling settles the descendant first (ordering here comes from the DOM, not from `PLUGIN_PRIORITY`).
- **Resolve a drag position with `getCellCoordsFromMousePosition()`, not `elementFromPoint()`.** The helper clamps to the viewport and returns the nearest cell, so a pointer dragged *past* the edge still maps to a real cell — `elementFromPoint` returns nothing usable out there, which freezes the selection at the last rendered cell. And when de-duplicating per-tick selection updates, compare **coordinates, not the resolved `td`**: Walkontable reuses the same elements across scrolls, so the element under a stationary pointer is identical on every tick while the cell it represents changes.
- **Filters visual/physical index**: `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual. Always convert when `manualColumnMove` is active.
- **`afterClose` can fire without `afterOpen`** (`editorFactory`): `open()` sets `_opened = true` and calls `refreshDimensions()` before `afterOpen`, and `refreshDimensions()` calls `close()` when the edited cell is no longer rendered. Anything created in `afterOpen` (a third-party picker instance, for example) may therefore be missing in `afterClose` - guard every teardown access instead of assuming the object exists.
- **Hook signature / TypeScript fixes**: When changing hook signatures, add both a runtime regression test and a TypeScript regression (`src/__tests__/core/settings.types.ts`).
- **Adding a new hook**: (1) Add the callback signature to the `GridSettings` interface in `src/core/settings.ts` (the `Events` type is derived automatically from hook-shaped entries). (2) Register the hook name in the `REGISTERED_HOOKS` array in `src/core/hooks/constants.ts`. The `addHook<K extends keyof Events>` overload then provides full IDE autocomplete. Full reference: `handsontable/.ai/HOOKS.md`.
- **Plugin public types**: Export new interfaces/types from the plugin `.ts` source file, then re-export via the plugin's barrel `index.ts` using `export type { ... }`. Do NOT add hand-crafted `.d.ts` stubs.
- **Two builds to test**: `handsontable.js` (base, no HyperFormula) and `handsontable.full.js` (includes HyperFormula). Test both when changing build-time behavior.
- **License key validation is inlined and layered**: an entitlement key (plain-English prose followed by a `[<payload><checksum>]` block) is read by `src/utils/entitlementLicenseKey/` (`detectFormat.ts` = which format a key is in → `extractKeyData.ts` = block reader → `classify.ts` = window evaluation + silencing flags → `grants.ts` = capability tokens) — a port of `src/entitlement-key/` from the private `handsontable/license-key` repo; never add that package as a dependency, and keep the reader byte-compatible with it (a key the canonical validator rejects must not read here). The obfuscated legacy 25-character block in `helpers/mixed.ts` is frozen — an entitlement key routes out BEFORE it via the trailing-block shape test, and legacy CONSOLE behavior (including exact message text) must never change. **One legacy DOM behavior did change, by product decision (DEV-2562):** a missing or invalid key no longer renders a bottom bar — it renders the blocking modal instead (see below). Nothing else about the legacy path moved. **The checksum covers the bracket block only**: the prose may be rewrapped, rewritten or dropped and a genuine key still reads, but the block itself must be intact (its alphabet has no whitespace, so an email-wrapped block is invalid — do NOT 'repair' it by stripping whitespace INSIDE the brackets, that would accept keys the generator rejects; whitespace AROUND the whole key is a different thing and IS trimmed, by `_trimKey` at the head of both `_injectProductInfo` and `_getLicenseState`, because an untrimmed key reads as `invalid` and `invalid` now blocks — trim in one of the two and they desync). **No contract type in the payload**: which of `usage_until` / `release_until` is present decides how the license is measured, and the `trial` flag decides only how it is worded — never branch on a tier, mode or plan name, none of which exist in the key. Exactly one of the two dates per product, a real bare `YYYY-MM-DD`, or the key is invalid; `notice`/`grace` arrive IN the key (no behavioral constants in the library). Date rules that the specification's J-fixtures pin: `usage_until` is inclusive (valid until the UTC midnight that FOLLOWS it), the notice window is `notice > 0 && daysRemaining <= notice` with days counted UTC-midnight to UTC-midnight (60 at the window's open, 0 on the last licensed day), the hard stop is expiry + 1 day + `grace`, and `release_until` is compared to the build release date as TEXT (no clock, airgap-safe, fails OPEN when the build date is unavailable). Reading is STRICT about shape and LENIENT about vocabulary: an unknown product, capability token, flag or extra field is kept and ignored, never an error, or every token added on the issuing side would break builds already in the field. A key that grants another product but not `handsontable` is not a Handsontable license — it messages as invalid, and its grants stay unrestricted. The grants API is uniform across key families: legacy/missing/invalid keys resolve to unrestricted grants, so future capability gating can never take a feature away from an existing customer. The branding UI is a MODULE CATALOG (`src/utils/licenseBranding/`: `index.ts` = state routing (read once at init), `content.ts` = copy, `badge.ts` = corner badge + popover, `lockScreen.ts` = the blocking lock screen) — a core util, NOT a plugin (plugins can be absent or disabled; license UI must not be). The corner badge + popover render for TRIAL states ONLY (`POPOVER_CONTENT` in `content.ts` holds exactly `trial_valid`, `trial_notice`, `trial_soft_stop`). Every other state — expired legacy, non-commercial, a running or lapsed subscription, a perpetual license (and the two blocking states, which show the modal instead) — shows NO badge; its console message and any bottom bar still come from `initLicenseNotification`/`_injectProductInfo` (the legacy console/bar messaging stays untouched, and `_classifyLegacyKey` in `mixed.ts` mirrors the frozen checks read-only). The two silencing flags are per product and resolved once into `descriptor.channels`: `no-console-warns` closes the console, `no-ui-warns` closes the WHOLE front-end surface (badge, bar and lock) — that is what keeps license copy away from the end users of a customer's SaaS app, so never render a license surface without checking `channels.ui`. The corner badge is click-through (`pointer-events: none`) so the corner header keeps its native select-all — hover is detected by delegation (`is-corner-hover` class), and the glyph itself is pure CSS - an `::after` inside the corner header cell, gated by BOTH `ht-license-badge-on` (on the root element) and `ht-license-badge-corner` (a class JS stamps on THIS grid's own corner-clone table, resolved via the Walkontable overlay); the glyph CSS keys off that marker, NEVER the structural `.ht_clone_top_inline_start_corner` class, which also matches a nested grid's corner clone and would paint a stray badge there. So it can never overflow or drift out of the corner; never rebuild it as a measured overlay (the overlay version broke visual tests with misaligned badges) - JS measurement exists only to anchor the popover. The popover is a PURELY VISUAL floating element: no focus scope, no shortcuts, badge/link/close all `tabindex="-1"`, visibility is pointer-only, close is mouse-click only (the info is duplicated in the console + bottom bar). The hard stop renders the CORE-OWNED lock screen (`lockScreen.ts`) — NEVER the Dialog plugin (a shared surface an app legitimately uses: any `show` would replace the lock, any hide would look like a dismissal, and `dialog: true` setups would never tear it down); the lock instead REUSES the confirm-dialog CSS by wearing its class names (`ht-dialog ht-dialog--confirm handsontable ...` — the stylesheet always ships in full, so styling is inherited without importing the plugin) and copies its width sizing (pin `style.width` to the table workspace width on `afterViewRender`, or the `.ht-dialog` box spans the whole root wrapper, not the grid). The lock DOES use the focus manager (modal scope) + shortcut manager (Tab trap only - the lock is non-dismissable, so there is no Escape/close). THREE states render the lock, and `LOCK_CONTENT` in `content.ts` IS that routing — adding a state to that table is what makes it block: `trial_hard_stop`, `invalid`, and `missing`. The last two are the specification's §4.5 shape, whose message text was answered by the product owner as 'the sentences the bottom bar used to carry', so those two states now show the modal INSTEAD of a bar (`_rendersBlockingModal`/`_BLOCKING_MODAL_STATES` in `mixed.ts` withhold the bar in both emitters; the console message is untouched, and the two locks point at support@ rather than sales@ because both are install faults, and carry the bar's documentation link as a real anchor inside the description). A hard-stopped subscription (`usage_hard_stop`) still blocks nothing and shows nothing: it repeats its soft-stop console error and that is all (18.1 never blocks a paying customer). **Consequence for tests: a grid built with no `licenseKey` is now BLOCKED** — the lock deselects the cell and takes the keyboard, so every test grid must declare a key (the Jasmine helper injects `non-commercial-and-evaluation` already; jsdom unit tests that call `new Handsontable` directly must set it themselves, or selection-dependent assertions fail for no visible reason). The license key is read ONCE at init (like the console message and the bottom bar) — `updateSettings({licenseKey})` does NOT re-brand; applying a new key needs a fresh instance. Expiry compares against the build's release date, read BARE as `process.env.HOT_RELEASE_DATE` (in `licenseNotification.ts` and `licenseBranding/index.ts`) — the bundler (rspack DefinePlugin for `dist/`, SWC `inlineEnvVars` for `tmp/`) replaces it with a string literal, so NEVER wrap it in a `typeof process` guard: the guard is not inlined, compiles to `false` in browser bundles, blanks the date, and silently disables expired-key detection (an 18.0.0 regression). The badge reads its corner clone through the Walkontable API (`getOverlayByName`), NEVER a CSS `querySelector` on the root subtree (a nested grid — handsontable cell type — has its own corner clone earlier in document order that a selector would wrongly match). `extractEntitlementKeyData` memoizes on the key string (it is read twice per init). User-facing sentences repeated across surfaces (bar, popover, lock) live once as constants in `mixed.ts` (e.g. `_LICENSE_EXPIRED_TITLE`; every license symbol there is underscore-prefixed, because `index.ts` copies each non-underscore export of that module onto the public `Handsontable.helper`) — edit the constant, not each surface; every message is transcribed from the license specification, so reword it there first. Dates print as bare `YYYY-MM-DD`, with the `(UTC)` marker on console messages for `usage_until` and none on `release_until` (no clock takes part) or on the end-user-facing UI. The state-keyed tables (console/DOM notifications in `mixed.ts`, badge/lock content in `content.ts`) are typed `Partial<Record<LicenseStateKey, …>>`, NOT `Record<string, …>` — a typoed or unknown state key is then a compile error instead of a silently dropped entry. Test fixtures: real generator-produced keys in `src/utils/entitlementLicenseKey/__tests__/fixtures.js` (one per worked example of the specification) plus a test-only key builder (`buildTestKey.js`) for the shapes the generator refuses to produce; it must never be imported from `src/`.
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
