---
name: handsontable-plugin-dev
path: handsontable/src/plugins/**
description: Use when creating a new Handsontable plugin, modifying an existing plugin's behavior, adding hooks or options to a plugin, or working with the plugin lifecycle (enablePlugin, disablePlugin, updatePlugin). Covers the full plugin contract, conflict registration, settings validation, and IndexMapper integration.
---

## Plugin File Structure

```
src/plugins/{pluginName}/
├── index.ts              # Re-exports PLUGIN_KEY, PLUGIN_PRIORITY, ClassName
├── {pluginName}.ts       # Main class extending BasePlugin
├── AGENTS.md             # Plugin knowledge file — REQUIRED (see below)
├── CLAUDE.md             # symlink -> AGENTS.md, never a copy
├── types.ts              # (optional) exported plugin-local types
├── __tests__/            # *.unit.js unit tests (new E2E is Playwright, in tests/e2e/)
└── {submodules}/         # Additional files (UI classes, strategies, etc.)
```

Every plugin directory has all of these. `AGENTS.md` is not optional — see
[Knowledge file (required)](#knowledge-file-required).

## Required Static Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `PLUGIN_KEY` | Unique camelCase identifier | `'pagination'` |
| `PLUGIN_PRIORITY` | **Enable** order, ascending — a duplicate **throws** at registration | `900` |
| `SETTING_KEYS` | Options triggering `updatePlugin` | `[PLUGIN_KEY]` (the default), `true` (always), `false` (never) |
| `PLUGIN_DEPS` | Required plugins/types | `['plugin:AutoRowSize']` |
| `DEFAULT_SETTINGS` | Defaults for `this.getSetting()` | `{ pageSize: 10 }` |
| `SETTINGS_VALIDATORS` | Validate settings (object map or single fn) | `{ pageSize: v => v > 0 }` |

`PLUGIN_PRIORITY` orders `enablePlugin()` and nothing else — it orders hook callbacks only transitively.
**Pick a free number from the priority table in `src/plugins/base/AGENTS.md`** and add your row to it; that
table also records which orderings are load-bearing.

`SETTING_KEYS` defaults to `[this.PLUGIN_KEY]`, so declare it only when you need something else. Listing an
option the plugin does *not* own has three consequences that have all shipped as bugs — see
`src/plugins/manualResize/AGENTS.md`.

## Lifecycle Methods (in order)

```js
isEnabled()      // return !!this.hot.getSettings()[PLUGIN_KEY]
enablePlugin()   // init state, create IndexMaps, register hooks. Call super.enablePlugin() AT THE END.
updatePlugin()   // this.disablePlugin(); this.enablePlugin(); super.updatePlugin();
disablePlugin()  // Call super.disablePlugin() FIRST (clears hooks/EventManager). Then clean up.
destroy()        // Null out all fields. Call super.destroy() AT THE END.
```

## Key Patterns (from Pagination gold standard)

**Private fields** - Use `#` prefix for all internal state. No `@private` JSDoc.

**Hook callbacks** (**required for new code**) - Pass `#on*` handlers to `addHook` as arrow function class fields, not as inline wrappers or `.bind(this)`:

```ts
// ✅ Correct — arrow field, passed directly
#onAfterLoadData = (sourceData: unknown[], initialLoad: boolean, source = '') => {
  // ...
};

enablePlugin() {
  this.addHook('afterLoadData', this.#onAfterLoadData);  // direct reference
  super.enablePlugin();
}

// ⚠️ Avoid in new code — inline wrapper around a regular method
enablePlugin() {
  this.addHook('afterLoadData',
    (data, init, src) => this.#onAfterLoadData(data, init, src));
  super.enablePlugin();
}

// ❌ Wrong — .bind(this) builds a new function per call
this.addHook('afterLoadData', this.#onAfterLoadData.bind(this));  // never do this
```

Why: an arrow field is a named, greppable reference you can remove individually with `removeHooks(name)`, and `.bind(this)` returns a **new** function each call, so the reference you registered is not one you can ever remove.

**Two things this rule is often given a wrong reason for.** The plugin's own `addHook` stores whatever reference it was handed in `#hooks` and `removeHooks` removes that same reference — so an inline wrapper registered through `this.addHook` **is** cleaned up by `disablePlugin()`. Identity only bites on `this.hot.addHook` + a separately built `this.hot.removeHook` argument. And about **27 inline-wrapper sites already exist** across 11 plugins; they work, and two of them hold listeners deliberately left bound past `disablePlugin()`. Use the arrow field for new code; **do not bulk-rewrite the existing sites.**

If the hook with a priority argument:
```ts
this.addHook('init', this.#onInit, -1);  // priority as 3rd arg — still use direct ref
```

**Hook registration** - `this.addHook()` auto-cleans on `disablePlugin()`. `this.hot.addHook()` does NOT.
Register new hook names at module level:
```js
import Hooks from '../../core/hooks';
Hooks.getSingleton().register('beforeMyAction');
```

**Settings** - Read via `this.getSetting('key')` (supports dot notation). Defaults come from `DEFAULT_SETTINGS`.

**Conflict registration** - At module level, before the class:
```js
import { registerConflict } from '../base/conflictRegistry';
registerConflict(PLUGIN_KEY, ['nestedRows', 'mergeCells']);
```
Check in `enablePlugin()` with `this.isHardConflictBlocked()`.

**IndexMapper** - Create maps in `enablePlugin()`, unregister in `disablePlugin()`:
```js
this.#map = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding', false);
// 'hiding' = HidingMap (not rendered, stays in DataMap)
// 'trimming' = TrimmingMap (removed from DataMap entirely)
```

**UI separation** - Extract UI into its own class with dependency injection (no direct `hot` reference).

**Strategy pattern** - Use for swappable logic (e.g., `autoPageSize` vs `fixedPageSize`).

**Batch rendering** - When making multiple data/render changes, wrap them to avoid redundant render cycles:
```js
this.hot.batch(() => {
  // multiple operations here - only one render at the end
});
// Or for render-only batching:
this.hot.suspendRender();
// ... operations ...
this.hot.resumeRender();
```

## Decoupling Rules

- No direct cross-plugin imports. Use hooks or `hot.getPlugin('{Name}')`.
- No circular dependencies between plugins.
- Conflict ownership: the plugin introducing the incompatibility owns the blocking logic.
- **DataProvider built-in errors** - The DataProvider plugin surfaces request failures through `getPlugin('notification')` when `notification` is enabled (error toasts). **Fetch** failures include a primary **Refetch** action and `duration: 0` so the user can retry `fetchData()` from the toast. It does not use Dialog for that path. Dialog is still used elsewhere (for example Loading plugin, ExportFile overlay). Prefer hooks (`afterDataProviderFetchError`, `afterRowsMutationError`) for fully custom error UI when Notification is off.

## Registration Checklist

1. Plugin's `index.ts`: `export { PLUGIN_KEY, PLUGIN_PRIORITY, ClassName } from './pluginName';`
2. Wire into `src/plugins/index.ts`.
3. Add default option (disabled) in `src/dataMap/metaManager/metaSchema.ts`.
4. If the plugin introduces new hook signatures or settings, add them to `src/core/settings.ts` (`GridSettings`) — `npm run build:types` then regenerates the public `.d.ts` files directly into `tmp/`.
5. **Write `AGENTS.md` and symlink `CLAUDE.md` to it** (see the next section):
   ```bash
   cd handsontable/src/plugins/myPlugin && ln -s AGENTS.md CLAUDE.md
   ```
   The target must be the **relative** `AGENTS.md`, so the link resolves in a git worktree too. Git stores
   it as mode `120000`; if `git status` shows a regular file, you copied instead of linking.
6. **Add your `PLUGIN_PRIORITY` row to the table in `src/plugins/base/AGENTS.md`.** That table is the only
   record of which numbers are taken and which orderings are load-bearing, and nothing enforces it — so it
   drifts silently unless you update it in the same change.

## Focus Management

If your plugin provides UI elements (buttons, inputs, navigation bars), you must integrate with the focus manager (`src/focusManager/`).

- **Register a focus scope** with a unique name for your plugin's UI region.
- **Implement focus entry logic** - when the scope is activated, focus the first or last focusable element depending on the navigation direction (Tab = first, Shift+Tab = last).
- The focus manager listens to Tab/Shift+Tab keyboard events and blocks or allows them to ensure the correct UI module is focused during normal focus navigation.
- **Scopes switch automatically** based on which element the user clicks or focuses. The Core switches the active scope and sets the listen mode so the user can interact with either the grid or another module (e.g., pagination bar).
- See the Pagination plugin for a reference implementation (`#registerFocusScope` / `#unregisterFocusScope`).

## Important Gotchas

- **Merged cells - read from meta, not DOM**: When working with merged cells, read `colspan`/`rowspan` from `hot.getCellMeta(row, col)` (set by MergeCells via `afterGetCellMeta`), not from DOM element attributes. The meta is authoritative and always available regardless of viewport state.

## Knowledge file (required)

**Every plugin directory carries an `AGENTS.md`, with `CLAUDE.md` symlinked to it.** All of them do — a new
plugin without one is incomplete, the same way a plugin without a barrel export is incomplete. `AGENTS.md`
is the single source; the symlink is what makes Claude Code and Cursor read the same file. Edit `AGENTS.md`,
never `CLAUDE.md`.

It answers **"what must I never get wrong here, and where do I look next"** — not "how does this work",
which the source and its JSDoc already say. So write down what a reader cannot recover by reading the code:
the reason a guard exists, the ordering that is load-bearing, the shortcut that looks right and is wrong.

Sections a new file must carry (10 of the pre-existing files predate this and are missing `## Where to look
next` or `## Testing` — that is a known gap, not a licence to skip them, and not an invitation to go fix
those 10 in an unrelated change):

1. `# {PluginName} plugin — {one-line focus}`, then one or two sentences naming the files this covers and
   saying **"Read this before touching X."**
2. **What it owns and what it does not.** Most plugin bugs are ownership confusion, so name the boundary.
3. **The traps — each with the reason it exists.** "Do not reorder these two calls" is a rule someone will
   undo; "do not reorder them, because Formulas syncs the data source in that hook and selecting first made
   `afterSelection` read the stale value" is one they will keep. Cite the issue or DEV id where you have it.
4. `## Where to look next` — sibling plugins, the `.ai/` reference, and **`../base/AGENTS.md`** for the
   plugin contract plus this skill for the workflow.
5. `## Testing` — the targeted commands, and anything non-obvious about the suite (a `__tests__/` split, a
   spec that fails for an unrelated reason, a case that needs a real device).

**Length follows the plugin, not a template.** `stretchColumns/AGENTS.md` is three bullets and says
everything that plugin needs (it predates the section rules above, so it has no `## Testing`);
`base/AGENTS.md` is long because it holds the contract for all 42 plugins. Short and true beats long and
padded — read one of each before writing yours.

**Where a fact belongs.** A trap you hit while changing an existing plugin goes in **that plugin's**
`AGENTS.md`, not in `handsontable/AGENTS.md`. Keep the monorepo file for rules that genuinely span plugins;
when a rule is core-wide but has one worked example, state the rule there and put the example in the plugin
file with a pointer back. Two copies of the same fact drift.

## Testing Requirements

- **New E2E tests are Playwright** in `tests/e2e/` (skill `handsontable-playwright-e2e`) — for a plugin's UI, interaction, rendering. Do not add new legacy `*.spec.js`; the presence gate blocks them. Editing an existing `*.spec.js` (async `it()` callbacks) is fine.
- Unit tests (`__tests__/*.unit.js`): test strategies and helpers in isolation.
- Test `updateSettings()`, `enablePlugin()`/`disablePlugin()` toggling.
- Test interactions with other plugins (sorting, filters, hidden rows).

**Gold standard:** `src/plugins/pagination/pagination.ts`. **Base class:** `src/plugins/base/base.ts`.
**Plugin contract, lifecycle detail, hard conflicts and the `PLUGIN_PRIORITY` table:**
`src/plugins/base/AGENTS.md`. Per-plugin knowledge: that plugin's own `AGENTS.md`.
See `handsontable/.ai/ARCHITECTURE.md` and `handsontable/.ai/CONVENTIONS.md` for deeper context.
