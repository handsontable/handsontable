# Architecture dimension

Check changes against these rules. They are also the design lens while implementing any core change.

## SOLID, as applied here

- **Single Responsibility:** one purpose per plugin; UI rendering separate from business logic.
- **Open/Closed:** extend through hooks and the plugin API; leave other plugins' internals untouched.
- **Liskov Substitution:** plugins honor the BasePlugin contract (`isEnabled`, `enablePlugin`, `disablePlugin`, `destroy`; statics `PLUGIN_KEY`, `PLUGIN_PRIORITY`, `SETTING_KEYS`).
- **Interface Segregation:** expose only what external consumers need; internal helpers stay private.
- **Dependency Inversion:** depend on hooks; use `hot.getPlugin('Name')` when direct API access is unavoidable.

## Law of Demeter

Replace deep chains like `this.hot.view.wt.wtTable` with the layer's own API. Reach Walkontable data through `TableView` or the public `Core` API.

## Plugin decoupling

- Plugins `import` nothing from another plugin's files; use hooks, or `hot.getPlugin('PluginName')` when an API is required.
- No circular dependencies between plugins.

## Conflict ownership

The plugin that introduces an incompatibility owns the blocking logic. Awareness checks like `if (dataProviderEnabled) return;` belong in the conflicting plugin, not in the affected one. Compatibility tests live with the owning plugin. Hard conflicts use `registerConflict()` from `src/plugins/base/conflictRegistry.ts` at module load time.

## Configuration compatibility

New options support the cascading model (`cell` -> `column` -> `global`) when applicable. For an intentionally table-level option (e.g., `data`, `colHeaders`), document that in JSDoc.

## Coordinate system correctness

Verify the coordinate type at every usage site:

- **Physical:** position in the source data array (data read/write).
- **Visual:** position in DataMap after trimming (display logic).
- **Renderable:** position in the DOM after hiding (DOM manipulation).

Translate with `hot.rowIndexMapper` / `hot.columnIndexMapper`. Mixing types is a common bug source, especially with `manualColumnMove` and filters.

## Breaking changes policy

- **Renamed CSS class:** the legacy class name stays in the DOM, with tests for the old name.
- **Renamed API (method, option, hook):** the legacy name keeps working, with no console warning.
- **Changed API behavior:** the deprecated API works until the next stable release and logs a one-time console warning.
- **Changed default setting value:** **strictly forbidden.**
- **Removed hook or option:** add it to the removed hooks list so an error shows at runtime.

## Convention over configuration

New features work with zero configuration for the common case.

**Red flags (fail the review):**
- A new option whose value is the same in all usages (it should be the default)
- A new directory that breaks the folder taxonomy without architectural justification
- Explicit wiring where auto-discovery or a lifecycle hook could handle it
- A workaround or duplicated logic caused by not following the naming/location convention
- Config options that encode what a file name, directory location, or type string already expresses

## References

- `src/plugins/pagination/` is the gold standard for plugin structure, lifecycle, settings validation, and conflict registration.
- `handsontable/.ai/ARCHITECTURE.md` for system architecture.
- `handsontable/.ai/CONCERNS.md` for known issues and technical debt.
- `src/plugins/base/base.ts` for the BasePlugin contract.
- `src/plugins/base/conflictRegistry.ts` for the conflict registration API.
