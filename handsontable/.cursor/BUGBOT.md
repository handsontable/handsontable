# Handsontable core review notes

Apply these checks when changed files are in `/handsontable/**`.

---

## Language and code style

- **Core language boundary**: Core source is JavaScript. Do not add TypeScript files under `/handsontable/src/`.
- **Code style**:
  - Prefer arrow functions over bound method fields (e.g., prefer `this.#onX = () => { ... }` over `this.#onXBound = this.#handleX.bind(this)`).
  - Extract duplicated code blocks into shared methods — do not repeat logic across the same file or plugin.
  - Silent `catch` blocks must include a comment explaining why the error is swallowed.

## Plugin architecture

- **Plugin registration**: New plugins must be wired through `/handsontable/src/plugins/index.js` and exported from their own `index.js`.
- **Plugin decoupling**:
  - Plugins must not directly import or check for the presence of other plugins. Use hooks (event-driven communication) instead of direct cross-plugin calls. If access to another plugin's API is required, use the `hot.getPlugin('{PluginName}')` method.
  - No circular dependencies between plugins — dependency flow must be one-directional.
  - Do not re-implement another plugin's methods (e.g., `goToPage`, `setSort`). Instead, listen to that plugin's hooks and react accordingly.
  - _Why_: Direct cross-plugin imports prevent tree-shaking and create bundle bloat for users who don't use both features.
- **Conflict ownership**:
  - When a plugin is incompatible with another, the plugin that introduces the conflict must own the disabling/blocking logic.
  - Other plugins should not contain awareness checks like `if (dataProviderEnabled) return;` — that logic belongs in the conflicting plugin.
  - Compatibility tests belong with the plugin that owns the conflict, not the affected plugin.
  - _Why_: Spreading conflict checks across many plugins creates hidden coupling and makes removal/refactoring harder.

## Configuration and API

- **Default safety**:
  - New options should be disabled by default in `/handsontable/src/dataMap/metaManager/metaSchema.js`.
- **Cascading config compatibility**:
  - New configuration options should be designed to support Handsontable's cascading configuration model (`cell` → `column` → `global`) when applicable.
  - This is not a strict requirement — some options are intentionally designed to work only at the table level (e.g., `data`, `colHeaders`).
  - When an option supports only the table level, document this limitation explicitly in JSDoc.

## Documentation and types

- **API documentation**:
  - New public methods/options require JSDoc and matching type updates in `/handsontable/types/**`.
  - New hooks and configuration options must include a `@since` tag.
  - Do not add `@private` JSDoc tags — use the `#` prefix for private fields/methods instead. Exception: when `#` is avoided for performance reasons, `@private` JSDoc tag is acceptable.
- **Type definitions**:
  - Do not duplicate type definitions across plugins. Import types from their source plugin (e.g., filter condition types come from Filters, not redefined in DataProvider).
  - Avoid bare `object` in `.d.ts` files — use or import specific types.

## Testing

- **Test coverage**:
  - Behavior changes should include both `.unit.js` and/or `.spec.js` tests in plugin or feature `__tests__` directories.
  - Some `.spec.js` files may be added under `/handsontable/test/e2e/` directories.
