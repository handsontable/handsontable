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
├── types.ts              # (optional) exported plugin-local types
├── __tests__/            # Tests (*.spec.js for E2E, *.unit.js for unit)
└── {submodules}/         # Additional files (UI classes, strategies, etc.)
```

## Required Static Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `PLUGIN_KEY` | Unique camelCase identifier | `'pagination'` |
| `PLUGIN_PRIORITY` | Execution order (higher = later) | `900` |
| `SETTING_KEYS` | Options triggering `updatePlugin` | `['pagination']`, `true` (always), `false` (never) |
| `PLUGIN_DEPS` | Required plugins/types | `['plugin:AutoRowSize']` |
| `DEFAULT_SETTINGS` | Defaults for `this.getSetting()` | `{ pageSize: 10 }` |
| `SETTINGS_VALIDATORS` | Validate settings (object map or single fn) | `{ pageSize: v => v > 0 }` |

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

**Hook callbacks** (**required pattern**) - All `#on*` methods that are passed to `addHook` must be arrow function class fields, not regular methods. This is mandatory, not optional:

```ts
// ✅ Correct — arrow field, passed directly
#onAfterLoadData = (sourceData: unknown[], initialLoad: boolean, source = '') => {
  // ...
};

enablePlugin() {
  this.addHook('afterLoadData', this.#onAfterLoadData);  // direct reference
  super.enablePlugin();
}

// ❌ Wrong — regular method wrapped in an inline arrow
enablePlugin() {
  this.addHook('afterLoadData',
    (data, init, src) => this.#onAfterLoadData(data, init, src));  // never do this
  super.enablePlugin();
}

// ❌ Wrong — .bind(this)
this.addHook('afterLoadData', this.#onAfterLoadData.bind(this));  // never do this
```

Why: arrow fields capture `this` at construction time so `removeHook` can match the exact reference. Inline wrappers create new function instances on each `enablePlugin()` call, which means `removeHook` can never clean them up.

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

## Focus Management

If your plugin provides UI elements (buttons, inputs, navigation bars), you must integrate with the focus manager (`src/focusManager/`).

- **Register a focus scope** with a unique name for your plugin's UI region.
- **Implement focus entry logic** - when the scope is activated, focus the first or last focusable element depending on the navigation direction (Tab = first, Shift+Tab = last).
- The focus manager listens to Tab/Shift+Tab keyboard events and blocks or allows them to ensure the correct UI module is focused during normal focus navigation.
- **Scopes switch automatically** based on which element the user clicks or focuses. The Core switches the active scope and sets the listen mode so the user can interact with either the grid or another module (e.g., pagination bar).
- See the Pagination plugin for a reference implementation (`#registerFocusScope` / `#unregisterFocusScope`).

## Important Gotchas

- **Merged cells - read from meta, not DOM**: When working with merged cells, read `colspan`/`rowspan` from `hot.getCellMeta(row, col)` (set by MergeCells via `afterGetCellMeta`), not from DOM element attributes. The meta is authoritative and always available regardless of viewport state.

## Testing Requirements

- E2E tests (`__tests__/*.spec.js`): all `it()` callbacks must be `async`.
- Unit tests (`__tests__/*.unit.js`): test strategies and helpers in isolation.
- Test `updateSettings()`, `enablePlugin()`/`disablePlugin()` toggling.
- Test interactions with other plugins (sorting, filters, hidden rows).

**Gold standard:** `src/plugins/pagination/pagination.ts`. **Base class:** `src/plugins/base/base.ts`.
See `handsontable/.ai/ARCHITECTURE.md` and `handsontable/.ai/CONVENTIONS.md` for deeper context.
