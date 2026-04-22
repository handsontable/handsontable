# React Wrapper (@handsontable/react-wrapper)

## Critical Rules

- **No business logic** in wrappers - data transformation, validation, cell manipulation belongs in `handsontable/src/`
- **Feature parity**: React wrapper must expose identical Handsontable functionality
- **Build core first**: `npm run build --prefix handsontable` - wrappers consume `handsontable/tmp/` not `dist/`
- **Preserve selection** during updateSettings: use `selection.exportSelection()` / `selection.importSelection()`
- Cross-platform scripts: Use Node.js `.mjs` helpers, never bash-only constructs

## Architecture

- `HotTable` (public) -> `HotTableInner` (forwardRef) -> Handsontable instance via `useRef()`
- `SettingsMapper.getSettings()` converts React props -> Handsontable settings
- `useImperativeHandle` exposes the instance
- React portals and context for component-based renderers/editors
- `useHotEditor()` hook for custom editors

## Key Files

- `src/hotTable.tsx`, `src/hotTableInner.tsx`, `src/settingsMapper.ts`
- `src/hotColumn.tsx`, `src/hotEditor.tsx`

## Build & Test

- Build: Rollup 4 (CommonJS, ES, UMD, minified)
- Test: `npm run test --prefix wrappers/react-wrapper` (Jest + React Testing Library)

## Common Pitfalls

| Pitfall | What to do instead |
|---|---|
| `arr.push(...largeArray)` with large arrays | Causes stack overflow with 10k+ elements. Use `forEach` loop instead. |

For detailed guidance: use skill `react-wrapper-dev`
