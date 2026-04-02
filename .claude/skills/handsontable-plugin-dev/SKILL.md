---
name: handsontable-plugin-dev
description: Use when creating a new Handsontable plugin, modifying an existing plugin's behavior, adding hooks or options to a plugin, or working with the plugin lifecycle (enablePlugin, disablePlugin, updatePlugin). Covers the full plugin contract, conflict registration, settings validation, and IndexMapper integration.
---

## Plugin File Structure

```
src/plugins/{pluginName}/
├── index.js              # Re-exports PLUGIN_KEY, PLUGIN_PRIORITY, ClassName
├── {pluginName}.js       # Main class extending BasePlugin
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

**Private fields** -- Use `#` prefix for all internal state. No `@private` JSDoc.

**Hook callbacks** -- Arrow function class fields so `removeLocalHook` works:
```js
#onIndexCacheUpdate = () => {
  if (!this.#internalCall && this.hot?.view) {
    this.#recompute();
  }
};
```

**Hook registration** -- `this.addHook()` auto-cleans on `disablePlugin()`. `this.hot.addHook()` does NOT.
Register new hook names at module level:
```js
import Hooks from '../../core/hooks';
Hooks.getSingleton().register('beforeMyAction');
```

**Settings** -- Read via `this.getSetting('key')` (supports dot notation). Defaults come from `DEFAULT_SETTINGS`.

**Conflict registration** -- At module level, before the class:
```js
import { registerConflict } from '../base/conflictRegistry';
registerConflict(PLUGIN_KEY, ['nestedRows', 'mergeCells']);
```
Check in `enablePlugin()` with `this.isHardConflictBlocked()`.

**IndexMapper** -- Create maps in `enablePlugin()`, unregister in `disablePlugin()`:
```js
this.#map = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding', false);
// 'hiding' = HidingMap (not rendered, stays in DataMap)
// 'trimming' = TrimmingMap (removed from DataMap entirely)
```

**UI separation** -- Extract UI into its own class with dependency injection (no direct `hot` reference).

**Strategy pattern** -- Use for swappable logic (e.g., `autoPageSize` vs `fixedPageSize`).

## Decoupling Rules

- No direct cross-plugin imports. Use hooks or `hot.getPlugin('{Name}')`.
- No circular dependencies between plugins.
- Conflict ownership: the plugin introducing the incompatibility owns the blocking logic.

## Registration Checklist

1. Plugin's `index.js`: `export { PLUGIN_KEY, PLUGIN_PRIORITY, ClassName } from './pluginName';`
2. Wire into `src/plugins/index.js`.
3. Add default option (disabled) in `src/dataMap/metaManager/metaSchema.js`.
4. Add TypeScript definitions in `types/`.

## Testing Requirements

- E2E tests (`__tests__/*.spec.js`): all `it()` callbacks must be `async`.
- Unit tests (`__tests__/*.unit.js`): test strategies and helpers in isolation.
- Test `updateSettings()`, `enablePlugin()`/`disablePlugin()` toggling.
- Test interactions with other plugins (sorting, filters, hidden rows).

**Gold standard:** `src/plugins/pagination/pagination.js`. **Base class:** `src/plugins/base/base.js`.
See `.ai/ARCHITECTURE.md` and `.ai/CONVENTIONS.md` for deeper context.
