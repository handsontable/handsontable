---
name: react-wrapper-dev
path: wrappers/react-wrapper/**
description: Use when developing or modifying the @handsontable/react-wrapper package - React components, hooks, settings mapping, selection preservation during updateSettings, and the wrapper's TypeScript prop types and generated .d.ts. Use this whenever a task touches HotTableProps/HotColumnProps typing or IDE autocomplete for <HotTable>/<HotColumn> props, the declaration build, or a report that React/TypeScript users get no prop suggestions - even if the wrapper is not named explicitly.
---

# React Wrapper Development

Package: `wrappers/react-wrapper/` (see its `AGENTS.md`).

## Components

- **HotTable**: public component; renders a container div and bootstraps Handsontable.
- **HotTableInner**: `forwardRef` wrapper handling the instance lifecycle.
- **HotColumn**: declarative column config as a child of HotTable.
- **HotEditor**: renders a custom editor component in a React portal.

## Architecture

A `useRef()` holds the live instance, exposed via `useImperativeHandle()` (`hotInstance.current`). `SettingsMapper.getSettings()` converts props to a settings object; every prop change triggers `updateSettings()`.

**Critical rule:** around `updateSettings()`, snapshot with `selection.exportSelection()` before and restore with `selection.importSelection()` after, or the selection resets on every prop change.

`useHotEditor()` builds component-based cell editors with access to the editor lifecycle (open, close, getValue, setValue). React portals render components inside cells (renderers, editors); a React context propagates the instance to them.

## Build and test

- Rollup 4 builds CommonJS, ES module, UMD, and minified outputs. Tests: Jest with React Testing Library.
- Tests: `npm run test --prefix wrappers/react-wrapper`
- Build core first with `npm run build --prefix handsontable`; wrappers consume `handsontable/tmp/`, not `dist/`.

## Key files

| File | Purpose |
|---|---|
| `src/hotTable.tsx` | Public HotTable component |
| `src/hotTableInner.tsx` | Inner component with instance lifecycle |
| `src/settingsMapper.ts` | Converts React props to Handsontable settings |
| `src/hotColumn.tsx` | Declarative column config component |
| `src/hotEditor.tsx` | Custom editor portal component |

## TypeScript prop types and the declaration build (read before touching `src/types.tsx`)

`scripts/prepare-types.mjs` generates the published `.d.ts` with this package's own `typescript` devDep (currently `3.8.2`) and swallows `tsc` errors, so a mangled declaration still reports "prepared successfully."

- **Define modern type helpers in core and import them.** TS 3.8 cannot emit 4.1+ syntax such as key-remapping (`{ [K in keyof T as ...]: ... }`); it produces `{ [K in keyof T]: ; }`. Keep helpers in `handsontable/src` and import via `handsontable/base` (`RemoveIndexSignature` lives in `handsontable/src/settings.ts`).
- **Verify the emitted declaration after any type change in `src/`.** `npm pack` core and wrapper, install both into a throwaway project, and `tsc --noEmit` a file that uses the props.
- **Strip the index signature before `Omit`/`Pick` on a settings type.** `GridSettings`/`ColumnSettings` carry `[key: string]: any`; wrap the input in `RemoveIndexSignature<T>` first (as `ReplaceRenderersEditors` does), or `keyof` widens to `string`, every option name is dropped, and `<HotTable>`/`<HotColumn>` autocomplete breaks. Build column props from `RemoveIndexSignature<GridSettings>` and override `data` with `ColumnSettings['data']`, in the wrapper: tightening core `ColumnSettings` breaks loose column configs (`columns: [{ validator: (v: string) => … }]`) in every framework. (Interface `extends` keeps the options but cannot override `renderer`/`editor`/`data`.) Then re-add `& { [key: string]: any }` to the prop type so undeclared cell-type/plugin options (`correctFormat`, `datePickerConfig`, …) stay assignable; named options keep their real types (like `React.CSSProperties`).
- **Lint with the root lint command.** The package has no `lint` script or local `.eslintrc`; the root lint supplies the TS/JSX-aware parser.

## React StrictMode

StrictMode double-mounts (mount, unmount, mount), so Handsontable initializes twice. Verify `destroy()` runs on unmount and no stale references persist, or the second mount fails or leaks.

## Rules

- Keep business logic (data transformation, validation, grid behavior) in `handsontable/src/`.
- Use Node.js `.mjs` helpers for npm scripts (reference: `scripts/prepare-types.mjs`).
