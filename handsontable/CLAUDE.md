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

## Merged Cells Gotcha

Read `colspan`/`rowspan` from `hot.getCellMeta(row, col)`, NOT from DOM element attributes. The meta (set by MergeCells via `afterGetCellMeta`) is authoritative and always available regardless of viewport state.

## Build

`npm run build`

Outputs: `dist/` (UMD), `tmp/` (ES/CJS, used by wrappers), `styles/` (CSS)

## For Deeper Guidance

Use these skills for detailed workflow instructions:
- Plugin development: `handsontable-plugin-dev`
- Editors/renderers/validators/cellTypes: `handsontable-editor-dev`, `handsontable-renderer-dev`, `handsontable-validator-dev`, `handsontable-celltype-dev`
- Testing: `handsontable-unit-testing`, `handsontable-e2e-testing`
- Coordinate systems: `coordinate-systems`
- Linting: `linting`
- i18n: `i18n-translations`
