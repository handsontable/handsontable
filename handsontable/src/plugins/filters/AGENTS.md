# Filters plugin — landmines

This subsystem mixes physical and visual column indexes across an API boundary. Get the boundary wrong and filters silently corrupt themselves after a column move. Read this before touching `filters.ts`, `conditionCollection.ts`, or the components under `component/`, `condition/`, and `menu/`.

## Index-coordinate contract (the core trap)

- **Public `Filters` methods take VISUAL column indexes.** `addCondition()`, `removeConditions()`, `clearConditions()`, and `getSelectedColumn()` accept visual indexes and convert internally with `this.hot.toPhysicalColumn()` before touching state. Keep that conversion — do not pass a visual index straight through.
- **`conditionCollection` stores PHYSICAL column indexes.** `filteringStates` (a `LinkedPhysicalIndexToValueMap`) is keyed by physical column. Every `conditionCollection` method (`addCondition`, `getConditions`, `removeConditions`, `hasConditions`, `getFilteredColumns`) expects a **physical** index. Never call it with a visual index — under active `manualColumnMove` the two diverge and the filter attaches to the wrong column with no error.
- **`getDataMapAtColumn(physicalColumn)` takes PHYSICAL, then converts back to visual** (`toVisualColumn`) for source-data access. Honor the parameter's stated space; do not feed it a visual index.
- When in doubt, convert at the public boundary and treat everything inside `conditionCollection` as physical.

## IndexMap lifecycle

- `conditionCollection` registers its own column map `'ConditionCollection.filteringStates'` on `this.hot.columnIndexMapper` in its constructor and **unregisters it in `destroy()`**. Do not register a second map under that name.
- The plugin registers a row `TrimmingMap` (`filtersRowsMap`) via `this.hot.rowIndexMapper.registerMap()` in `enablePlugin()` and unregisters it in `disablePlugin()`. Filtered-out rows are trimmed (removed from the DataMap), not hidden — account for that when reading row state.
- Follow the standard plugin lifecycle: `super.enablePlugin()` last, `super.disablePlugin()` first. See the `handsontable-plugin-dev` skill.

## Where to look next

- Coordinate translation rules and `IndexMapper` usage: `coordinate-systems` skill and `handsontable/.ai/ARCHITECTURE.md`.
- Plugin contract, hooks, settings validation, IndexMapper integration: `handsontable-plugin-dev` skill.
