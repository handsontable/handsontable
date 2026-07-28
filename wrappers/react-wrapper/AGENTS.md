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
- **Test paradigm:** the presence gate covers `wrappers/**` — a wrapper source change must ship a matching test. The Jest suite here is **jsdom** (props, lifecycle, reactivity). Anything user-visible / real-browser goes to **Playwright E2E** in `tests/e2e/` — see the `handsontable-playwright-e2e` skill (React StrictMode / single-instance gotchas in its `references/wrappers.md`). Local gates + exact rules: `.ai/LOCAL-ENFORCEMENT.md`.

## Common Pitfalls

| Pitfall | What to do instead |
|---|---|
| `arr.push(...largeArray)` with large arrays | Causes stack overflow with 10k+ elements. Use `forEach` loop instead. |
| Adding a modern type helper (e.g. `as` key-remapping, TS 4.1+) in `src/types.tsx` | The `.d.ts` build uses this package's own `typescript@3.8.2`, which silently mangles it (and `prepare-types.mjs` swallows the error, shipping broken types). Define the helper in `handsontable/src` and import it via `handsontable/base`. |
| `Omit`/`Pick` on `GridSettings`/`ColumnSettings` for prop types | These carry a `[key: string]: any` index signature; `Omit`/`Pick` collapses `keyof` to `string` and drops every named option, killing `<HotTable>`/`<HotColumn>` prop autocomplete. Strip it first with `RemoveIndexSignature<T>` (from `handsontable/base`). For column props, derive from `RemoveIndexSignature<GridSettings>` (not core `ColumnSettings`, which is intentionally left loose) and override `data` with `ColumnSettings['data']`. **Then re-add `& { [key: string]: any }`** to the final prop type (`ReplaceRenderersEditors`) — cell-type/plugin options not declared on `GridSettings` (e.g. `correctFormat`, `datePickerConfig`) must stay assignable, and named options keep their real types anyway (the `React.CSSProperties` pattern). Dropping this hatch type-breaks existing configs. |
| Trusting a green `npm run build` for types, or `npx eslint src/*.tsx` | The type build hides `tsc` errors — inspect the emitted `types.d.ts` after any `src/` type change. This package has no lint script/config, so direct `npx eslint` misparses TS/JSX; use the monorepo lint. |

For detailed guidance: use skill `react-wrapper-dev`
