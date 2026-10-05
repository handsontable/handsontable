---
name: handsontable-plugin-dev
path: handsontable/src/plugins/**
description: Use when creating a new Handsontable plugin, modifying an existing plugin's behavior, adding hooks or options to a plugin, or working with the plugin lifecycle (enablePlugin, disablePlugin, updatePlugin). Covers the full plugin contract, conflict registration, settings validation, and IndexMapper integration.
---

## Plugin file structure

```
src/plugins/{pluginName}/
├── index.ts              # Re-exports PLUGIN_KEY, PLUGIN_PRIORITY, ClassName
├── {pluginName}.ts       # Main class extending BasePlugin
├── AGENTS.md             # Plugin knowledge file, REQUIRED (see below)
├── CLAUDE.md             # symlink -> AGENTS.md, never a copy
├── types.ts              # (optional) exported plugin-local types
├── __tests__/            # *.unit.js unit tests (new E2E is Playwright, in tests/e2e/)
└── {submodules}/         # UI classes, strategies, etc.
```

## Contract

Statics (`PLUGIN_KEY`, `PLUGIN_PRIORITY`, `SETTING_KEYS`, `PLUGIN_DEPS`, `DEFAULT_SETTINGS`, `SETTINGS_VALIDATORS`), lifecycle order, `onUpdateSettings`, hard conflicts, and the `PLUGIN_PRIORITY` table: `src/plugins/base/AGENTS.md`. Pick a free priority number from that table and add your row to it.

## Key patterns (gold standard: `src/plugins/pagination/pagination.ts`)

- **Private fields:** `#` prefix for all internal state, no `@private` JSDoc.
- **Hook callbacks (required for new code):** pass `#on*` handlers to `addHook` as arrow function class fields, directly: `this.addHook('afterLoadData', this.#onAfterLoadData)` (priority stays the 3rd arg). `.bind(this)` builds a new function per call, so the registered reference can never be removed. Existing inline-wrapper sites work; leave them as they are.
- **Hook registration:** `this.addHook()` auto-cleans on `disablePlugin()`; `this.hot.addHook()` does not. Register new hook names at module level: `Hooks.getSingleton().register('beforeMyAction');` (import `Hooks` from `'../../core/hooks'`).
- **Settings:** read via `this.getSetting('key')` (dot notation supported); defaults come from `DEFAULT_SETTINGS`.
- **Conflict registration** (module level, before the class), then check `this.isHardConflictBlocked()` in `enablePlugin()`:
  ```js
  import { registerConflict } from '../base/conflictRegistry';
  registerConflict(PLUGIN_KEY, ['nestedRows', 'mergeCells']);
  ```
- **IndexMapper:** create maps in `enablePlugin()`, unregister in `disablePlugin()`:
  ```js
  this.#map = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding', false);
  // 'hiding' = HidingMap (not rendered, stays in DataMap); 'trimming' = TrimmingMap (removed from DataMap)
  ```
- **UI:** extract it into its own class with dependency injection (no direct `hot` reference). Swappable logic uses a strategy (e.g. `autoPageSize` vs `fixedPageSize`).
- **Batch rendering:** wrap multiple data/render changes in `this.hot.batch(() => { ... })` for one render, but never around code that can run host code (`updateSettings`, `loadData`, another plugin's hooks). `Core#batch`/`batchRender` do not resume in a `finally`, so a listener that throws mid-batch leaves the grid render-suspended for good. For such code, call `this.hot.suspendRender()` and put `this.hot.resumeRender()` in a `finally`.
- **Sliced per-unit settings** (one plugin managing several units, e.g. sheets): treat each unit's settings as a partial slice, applying only the declared keys. Apply the slice and its data together in one guarded batch (`suspendRender()` + try/finally `resumeRender()`), and run the swap directly when `this.hot.view` does not exist yet (initial setup). Reference: `src/plugins/sheetsBar/sheetsBar.ts` (`#applySheet`). A plugin that also owns a layout slot (`handsontable/AGENTS.md` "Wrapper UI placement") registers its UI once in `enablePlugin()`; this method owns only the settings/data swap.

## Decoupling rules

- Cross-plugin access goes through hooks or `hot.getPlugin('{Name}')`, never imports; no circular dependencies between plugins.
- The plugin introducing the incompatibility owns the blocking logic.
- For custom error UI when Notification is off, use the hooks `afterDataProviderFetchError` and `afterRowsMutationError`. Built-in DataProvider toasts: `src/plugins/dataProvider/AGENTS.md`.

## Registration checklist

1. `index.ts`: `export { PLUGIN_KEY, PLUGIN_PRIORITY, ClassName } from './pluginName';`
2. Wire into `src/plugins/index.ts`.
3. Add the default option (disabled) in `src/dataMap/metaManager/metaSchema.ts`.
4. For new hook signatures or settings, add them to `src/core/settings.ts` (`GridSettings`); `npm run build:types` regenerates the public `.d.ts` files into `tmp/`.
5. **Write `AGENTS.md` and symlink `CLAUDE.md` to it** with the relative target, so the link resolves in a git worktree:
   ```bash
   cd handsontable/src/plugins/myPlugin && ln -s AGENTS.md CLAUDE.md
   ```
   Git stores it as mode `120000`; a regular file in `git status` means you copied.
6. **Add your `PLUGIN_PRIORITY` row to the table in `src/plugins/base/AGENTS.md`**, in the same change: nothing enforces it, so it drifts silently.

## Focus management

A plugin with UI (buttons, inputs, navigation bars) integrates with `src/focusManager/`. Reference: Pagination (`#registerFocusScope` / `#unregisterFocusScope`).

- Register a focus scope with a unique name for the plugin's UI region.
- On scope activation, focus the first element for Tab and the last for Shift+Tab.
- **Decide whether your scope COVERS the grid or REPLACES it.** Activating a scope switches the shortcut manager to the scope's `shortcutsContextName`, and only that context runs, so an empty one kills every grid shortcut while your UI is up (`emptyDataState` shipped that way; DEV-53). An overlay the user still thinks of as "the grid underneath" adds `fallbackShortcutsContextName: 'grid'` to `registerScope()` and inherits every grid shortcut, including ones added later (reference: `emptyDataState`). A **modal** scope leaves it unset: letting grid shortcuts through a modal is the bug. Register a shortcut in your own context only to OVERRIDE one, and record in your `AGENTS.md` why the grid's version does not fit.
- **UI painted OVER the grid body also adds `coversGridBody: true`.** Inheriting and covering are separate questions. Without the flag, a content-writing shortcut sees that the grid still draws cells and lets `Delete` reach data the user cannot touch (DEV-2917: `emptyDataState` covered a rendered grid during a DataProvider fetch and the dataset was wiped). The flag is read from every ENABLED scope, not only the active one.

## Gotchas

- **Merged cells:** read `colspan`/`rowspan` from `hot.getCellMeta(row, col)` (set by MergeCells via `afterGetCellMeta`), not from DOM attributes; the meta is available regardless of viewport state.

## Knowledge file (required)

Every plugin directory carries an `AGENTS.md` with `CLAUDE.md` symlinked to it; a new plugin without one is incomplete. Edit `AGENTS.md`, never `CLAUDE.md`.

It answers "what must I never get wrong here, and where do I look next": the reason a guard exists, the load-bearing ordering, the shortcut that looks right and is wrong. Required sections:

1. `# {PluginName} plugin – {one-line focus}`, then one or two sentences naming the files covered and saying "Read this before touching X." (10 pre-existing files lack `## Where to look next` or `## Testing`; new files carry both, and fixing those 10 belongs in its own change.)
2. **What it owns and what it does not.** Most plugin bugs are ownership confusion.
3. **The traps, each with the reason it exists** (and the issue or DEV id where you have one). "Do not reorder these calls, because Formulas syncs the data source in that hook and selecting first made `afterSelection` read the stale value" survives; the bare rule gets undone.
4. `## Where to look next`: sibling plugins, the `.ai/` reference, `../base/AGENTS.md` for the contract, and this skill for the workflow.
5. `## Testing`: targeted commands and anything non-obvious about the suite (a `__tests__/` split, a spec failing for an unrelated reason, a case needing a real device).

Length follows the plugin: `stretchColumns/AGENTS.md` (three bullets) and `base/AGENTS.md` (the contract for every plugin) are the two ends; read one of each before writing yours.

**Where a fact belongs.** A trap found while changing an existing plugin goes in **that plugin's** `AGENTS.md`. `handsontable/AGENTS.md` holds rules that span plugins; for a core-wide rule with one worked example, state the rule there and put the example in the plugin file with a pointer back.

## Testing requirements

- **New E2E tests are Playwright** in `tests/e2e/` (skill `handsontable-playwright-e2e`) for a plugin's UI, interaction, and rendering. The presence gate blocks new legacy `*.spec.js`; editing an existing one (async `it()` callbacks) is fine.
- Unit tests (`__tests__/*.unit.js`): strategies and helpers in isolation.
- Cover `updateSettings()`, `enablePlugin()`/`disablePlugin()` toggling, and interactions with other plugins (sorting, filters, hidden rows).

Base class: `src/plugins/base/base.ts`. Deeper context: `handsontable/.ai/ARCHITECTURE.md`, `handsontable/.ai/CONVENTIONS.md`.
