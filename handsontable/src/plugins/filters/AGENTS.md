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

## Condition inputs and date/time parsing

- Date and time conditions parse BOTH the cell value and the user input with `parseToLocalDate()`/`parseToLocalTime()` (`helpers/dateTime.ts`), which accept **only strict ISO strings** (`YYYY-MM-DD` / `HH:mm[:ss]`) and return `null` otherwise — a `null` makes the condition reject every row. Never feed these parsers locale-formatted text.
- A condition descriptor's `inputType` (`'date'` / `'time'`) controls the native input type rendered in the menu: `ConditionComponent` applies it via `InputUI.setType()` on condition select and on saved-state restore. A condition with inputs that expects ISO date/time values MUST declare `inputType`, or users get a free-text field whose locale-formatted input never matches.
- `InputUI` syncs its value on `keyup`, `input`, AND `change`. A value picked from the native date/time calendar fires no `keyup` — do not remove the `input`/`change` hooks.

## Where to look next

- Coordinate translation rules and `IndexMapper` usage: `coordinate-systems` skill and `handsontable/.ai/ARCHITECTURE.md`.
- Plugin contract, hooks, settings validation, IndexMapper integration: `handsontable-plugin-dev` skill.
