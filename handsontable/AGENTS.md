# Handsontable Core Package

This is the core data grid package. **JavaScript only** - no TypeScript files in `src/`. Type definitions are hand-authored `.d.ts` files in `types/`.

## Critical Rules

- Use `throwWithCause()` from `src/helpers/errors.js`, never `throw new Error()`
- No barrel imports from `plugins/index`, `editors/index`, `renderers/index`, `validators/index`, `cellTypes/index`, `i18n/index` - import from specific submodule paths. Only exception: `src/registry.js`
- No global `window`, `document`, `console` - use `this.hot.rootWindow`, `this.hot.rootDocument`, and helpers from `src/helpers/console.js`
- Private fields use `#` prefix, not `@private` JSDoc
- Arrow function class fields for callbacks: `#onAfterX = () => { ... }` (not `.bind(this)`)
- Cognitive complexity: keep each function at 15 or below
- Optional chaining `?.` only when value is genuinely optional by design
- No hardcoded user-visible strings in source - add constants to `src/i18n/constants.js` and update all language files in `src/i18n/languages/`
- No direct cross-plugin imports - use hooks for inter-plugin communication, or `hot.getPlugin('Name')` if API access is required
- Never use raw `setTimeout` - use `this.hot._registerTimeout(fn, delay)` instead; it auto-clears on `hot.destroy()`, preventing memory leaks

## Plugin Lifecycle

```
isEnabled()      → return !!this.hot.getSettings()[PLUGIN_KEY]
enablePlugin()   → init state, create IndexMaps, register hooks. super.enablePlugin() AT END.
updatePlugin()   → this.disablePlugin(); this.enablePlugin(); super.updatePlugin();
disablePlugin()  → super.disablePlugin() FIRST. Then clean up.
destroy()        → null out fields. super.destroy() AT END.
```

Gold standard: `src/plugins/pagination/pagination.js`

## Three Coordinate Systems

| Type | Description | Use for |
|------|-------------|---------|
| Physical | Position in source data array | Data access, persistence |
| Visual | Position after trimming (DataMap) | User-facing display logic |
| Renderable | Position after hiding (DOM) | DOM operations |

Translate with `hot.rowIndexMapper` / `hot.columnIndexMapper`.
Gotcha: Filters `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual.

## DataProvider and Notification

For server-backed grids (`dataProvider` with `fetchRows` and CRUD callbacks), enable **`notification`** if you want built-in error toasts on failed fetches or mutations. **`dialog: true` alone does not** show those errors. Failed **fetch** toasts include a **Refetch** button that calls `fetchData()` again (`duration: 0` until dismissed or Refetch). Use **`afterDataProviderFetchError`** and **`afterRowsMutationError`** for custom UI when Notification is disabled. See `src/plugins/dataProvider/dataProvider.js` and AGENTS.md Gotchas.

## Testing

| Type | Pattern | Framework | Run |
|------|---------|-----------|-----|
| Unit | `*.unit.js` | Jest (jsdom) | `npm run test:unit` |
| E2E | `*.spec.js` | Jasmine (Puppeteer) | `npm run test:e2e` |

- ALL `it()` callbacks in spec files MUST be `async`
- HOT API calls MUST be `await`-ed
- E2E helpers are globals (no imports): `handsontable()`, `selectCell()`, `getDataAtCell()`, `createSpreadsheetData()`
- Targeted unit: `npm run test:unit --testPathPattern=<regex>` (regex matched against file paths, e.g. `filters`, `ghostTable.unit`)
- Targeted e2e: `npm run test:e2e --testPathPattern=<regex>` (e.g. `collapsibleColumns`, `textEditor`, `nestedHeaders/__tests__/hidingColumns`)
- E2E with theme: `npm run test:e2e --testPathPattern=<regex> --theme=horizon` (themes: `classic`, `main`, `horizon`; default: `main`)
- **Rebuild before E2E:** E2E runner loads `dist/handsontable.js` - rebuild after changing `src/`

## Common Pitfalls

- **`arr.push(...largeArray)`**: Causes stack overflow with 10k+ elements. Use `forEach` loop instead.
- **Merged cells**: Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, NOT from DOM element attributes. The meta is authoritative regardless of viewport state.
- **Filters visual/physical index**: `conditionCollection` uses physical indexes, `getDataAtCol()` uses visual. Always convert when `manualColumnMove` is active.
- **Hook signature / TypeScript fixes**: When changing hook signatures, add both a runtime regression test and a TypeScript regression (`src/__tests__/core/settings.types.ts`).
- **Two builds to test**: `handsontable.js` (base, no HyperFormula) and `handsontable.full.js` (includes HyperFormula). Test both when changing build-time behavior.

## Key File Locations

| Area | Path (relative to `handsontable/`) |
|---|---|
| Core class | `src/core.js` |
| Entry points | `src/index.js` (full), `src/base.js` (tree-shakeable) |
| Plugin base class | `src/plugins/base/base.js` |
| Meta schema (defaults) | `src/dataMap/metaManager/metaSchema.js` |
| Index translations | `src/translations/` |
| Walkontable engine | `src/3rdparty/walkontable/src/` |
| Hooks system | `src/core/hooks/` |
| DataProvider plugin | `src/plugins/dataProvider/dataProvider.js` |
| Error helpers | `src/helpers/errors.js` |
| i18n constants | `src/i18n/constants.js` |
| i18n language files | `src/i18n/languages/` |
| TypeScript definitions | `types/` |

## Context Menu vs Column Menu

| | Context menu | Column menu (dropdown menu) |
|---|---|---|
| **Plugin class / key** | `ContextMenu` / `'contextMenu'` | `DropdownMenu` / `'dropdownMenu'` |
| **Trigger** | Right-click (or `Ctrl+Shift+\` / `Shift+F10`) | Column header button (or `Shift+Alt+ArrowDown`) |
| **Scope** | Cells and headers across rows and columns | Column-specific operations only |
| **Hook prefix** | `beforeContextMenu*`, `afterContextMenu*` | `beforeDropdownMenu*`, `afterDropdownMenu*` |

`DropdownMenu` is built on the shared `Menu` class from `contextMenu` but configured and triggered independently.

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

## For Deeper Guidance

Use these skills for detailed workflow instructions:
- Plugin development: `handsontable-plugin-dev`
- Editors/renderers/validators/cellTypes: `handsontable-editor-dev`, `handsontable-renderer-dev`, `handsontable-validator-dev`, `handsontable-celltype-dev`
- Testing: `handsontable-unit-testing`, `handsontable-e2e-testing`
- Coordinate systems: `coordinate-systems`
- Linting: `linting`
- i18n: `i18n-translations`
