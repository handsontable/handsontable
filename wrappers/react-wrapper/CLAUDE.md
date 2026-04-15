# React Wrapper (@handsontable/react-wrapper)

## Critical Rules

- **No business logic** in wrappers - data transformation, validation, cell manipulation belongs in `handsontable/src/`
- **Build core first**: `pnpm --filter handsontable run build` - wrappers consume `handsontable/tmp/` not `dist/`
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
- Test: `pnpm --filter @handsontable/react-wrapper run test` (Jest + React Testing Library)

For detailed guidance: use skill `react-wrapper-dev`
