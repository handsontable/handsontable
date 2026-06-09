---
name: react-wrapper-dev
path: wrappers/react-wrapper/**
description: Use when developing or modifying the @handsontable/react-wrapper package - React components, hooks, settings mapping, and selection state preservation during updateSettings
---

# React Wrapper Development

## Package location

`wrappers/react-wrapper/`

## Components

- **HotTable** - the public component users import. Renders a container div and bootstraps Handsontable.
- **HotTableInner** - a `forwardRef` wrapper that handles the actual instance lifecycle.
- **HotColumn** - declarative column configuration as a child of HotTable.
- **HotEditor** - renders a custom editor component inside a React portal.

## Architecture

A `useRef()` hook holds the live Handsontable instance. It is exposed to parent components through `useImperativeHandle()`, so consumers can call `hotInstance.current` to access the grid API directly.

`SettingsMapper.getSettings()` converts React props into a plain Handsontable settings object. Every prop change triggers `updateSettings()` on the instance.

**Critical rule:** When calling `updateSettings()`, you must preserve and restore the current selection. Before the call, snapshot the selection with `selection.exportSelection()`. After the call, restore it with `selection.importSelection()`. Forgetting this causes the selection to reset on every prop change.

## Custom hooks and portals

- `useHotEditor()` - a hook for building component-based cell editors. It gives the editor component access to the editor lifecycle (open, close, getValue, setValue).
- React portals are used to render React components inside Handsontable cells (for renderers and editors). A React context propagates the Handsontable instance to these portals.

## Build and test

- **Build system:** Rollup 4 producing CommonJS, ES module, UMD, and minified outputs.
- **Tests:** Jest with React Testing Library.
- **Run tests:** `npm run test --prefix wrappers/react-wrapper`
- **Important:** Build core first with `npm run build --prefix handsontable`. Wrappers consume `handsontable/tmp/`, not `dist/`.

## Key files

| File | Purpose |
|---|---|
| `src/hotTable.tsx` | Public HotTable component |
| `src/hotTableInner.tsx` | Inner component with instance lifecycle |
| `src/settingsMapper.ts` | Converts React props to Handsontable settings |
| `src/hotColumn.tsx` | Declarative column config component |
| `src/hotEditor.tsx` | Custom editor portal component |

## React StrictMode gotcha

React StrictMode causes a double mount (mount -> unmount -> mount). This means Handsontable gets initialized twice. The wrapper must correctly destroy the instance on unmount and create a fresh one on the second mount. If cleanup is incomplete, the second mount can fail or leak memory. Always verify that `destroy()` is called on unmount and that no stale references persist.

## Rules

- No business logic in wrappers. Data transformation, validation, and grid behavior belong in `handsontable/src/`.
- Cross-platform npm scripts: use Node.js `.mjs` helpers instead of bash-only constructs (see `scripts/prepare-types.mjs` as reference).
