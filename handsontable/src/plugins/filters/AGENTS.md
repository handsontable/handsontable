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

## "Filter by value" list scope

- **A column's own conditions must never narrow down its own value list.** The list is built from the rows that survive the conditions of the columns **before** this one in the stack — that is exactly what `ConditionUpdateObserver`'s `filteredRowsFactory` (the curried `visibleDataFactory`) returns, and it deliberately excludes the edited column's own conditions. A column with no conditions of its own falls back to `ValueComponent.reset()`, which reads `getDataAtCol()` (the currently visible rows) — correct there, because nothing of its own is trimming them.
- **Never rebuild the list from `getDataAtCol()` for a column that has conditions.** That reads post-filter visible rows, so the column's own condition hides its own values and the user cannot check them back on (issue #12226).
- **A data change refreshes the list, never the selection.** `#onAfterChange` → `updateValueComponentCondition()` only asks `ConditionUpdateObserver` to recompute the column's state; it passes no value set. The list then picks up newly typed values (it is built from the rows surviving the *other* columns' conditions), while the checked set stays the user's own, narrowed to the values that still exist. Do not reintroduce a "here are the current values, treat them as selected" argument: that is what added a typed value to the condition behind the user's back, and — once every listed value ended up checked — made `ValueComponent.getState()` report `CONDITION_NONE`, so the next OK silently dropped the whole filter (issue #6471). It also read the column through `getDataAtCol()`, violating the rule above. The edited column and the dependent column now go through one identical path.
- **The list for a condition-only column is rebuilt on menu open, never stored.** `ValueComponent.reset()` reads it through `Filters._getValueListDataAtColumn()`, which picks the source: a column in the condition stack gets the rows surviving the conditions *before* it, a column outside the stack gets `getDataAtCol()`. Do not move that work into the component state map — `ValueComponent.getState()` returns an `itemsSnapshot` on *every* OK click (including `CONDITION_NONE`), `saveState()` writes it for the confirmed column, and nothing ever clears it. A `setState()` that restored a `CONDITION_NONE` snapshot would freeze that column's list at whatever it held when the menu was last confirmed, so it would stop following the other columns' filters. Only a `CONDITION_BY_VALUE` state's snapshot is safe to restore, because `updateState()` rewrites it on every condition change.

## Data-map row correlation (the memoization trap)

- **Never correlate rows between two reads through the coordinate stamps on cell meta** (`meta.visualRow`, `meta.visualCol`, `meta.row`, `meta.col`). Stored cell-meta objects are shared, and EVERY meta read anywhere re-stamps those fields — `getCellMeta`, `getCellMetaTransient`, and `getCellMetaUncached` all write them on each call. A single unrelated read (for example, the `locale` lookup `getCellMetaTransient(0, column)` in `ValueComponent`, which translates visual→physical on a filtered grid) silently changes the stamps on rows you are still holding. This surfaced as lost `by_value` checkbox entries the moment `ConditionUpdateObserver` started memoizing column reads (DEV-2088): the cached rows' stamps were overwritten between the memo write and the memo hit.
- **Correlate through the entry's own `row` property instead.** `getDataMapAtColumn` returns `{row, meta, value}` objects where `row` is the immutable physical row index. `Filters.filter()`, `DataFilter`, `ConditionUpdateObserver`'s `visibleDataFactory`, and `ValueComponent` all match rows via `entry.row` — keep any new consumer on that property.
- **`getDataMapAtColumn` stamps `visualRow`/`visualCol` with PHYSICAL indexes** (a historical quirk — it passes physical coordinates as the visual options). Do not "fix" this by passing true visual indexes, and do not read those stamps expecting visual coordinates.
- **`ConditionUpdateObserver` memoizes full-column data maps** per state update / per `flush()` batch (`#withColumnDataCache`/`#getColumnData`). The memo is only sound because source data cannot change inside one update and rows correlate via `entry.row`. If you add a code path that mutates source data during an update cascade, it must not run inside an active memo scope. Subset reads (`physicalRows` argument) intentionally bypass the memo.
- **Batch, don't loop, the update cascade.** `#onAfterChange` dedups changed columns per batch, and `importConditions` wraps its loop in `conditionUpdateObserver.groupChanges()`/`flush()` — the same pattern as the action-bar submit. Any new code path that adds/removes several conditions programmatically must group the same way, or every condition pays a full-dataset component update (this was a 55 s freeze for a 1,000-cell paste before DEV-2088).

## Condition inputs and date/time parsing

- Date and time conditions parse BOTH the cell value and the user input with `parseToLocalDate()`/`parseToLocalTime()` (`helpers/dateTime.ts`), which accept **only strict ISO strings** (`YYYY-MM-DD` / `HH:mm[:ss]`) and return `null` otherwise — a `null` makes the condition reject every row. Never feed these parsers locale-formatted text.
- A condition descriptor's `inputType` (`'date'` / `'time'`) controls the native input type rendered in the menu: `ConditionComponent` applies it via `InputUI.setType()` on condition select and on saved-state restore. A condition with inputs that expects ISO date/time values MUST declare `inputType`, or users get a free-text field whose locale-formatted input never matches.
- `InputUI` syncs its value on `keyup`, `input`, AND `change`. A value picked from the native date/time calendar fires no `keyup` — do not remove the `input`/`change` hooks.

## Where to look next

- Coordinate translation rules and `IndexMapper` usage: `coordinate-systems` skill and `handsontable/.ai/ARCHITECTURE.md`.
- Plugin contract, hooks, settings validation, IndexMapper integration: `handsontable-plugin-dev` skill.
