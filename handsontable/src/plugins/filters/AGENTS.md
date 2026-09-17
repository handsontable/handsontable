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
- **`disablePlugin()` must tear down every instance it rebuilds behind an `if (!this.…)` guard, not just the collection.** Three fields form this family — `conditionCollection`, `conditionUpdateObserver`, and `#menuFocusNavigator` — and each is recreated in `enablePlugin()` only when the guard finds it empty. A disable that leaves any of them set strands it across the disable/enable cycle, because the guard then skips the rebuild while the components, collection and menu it referenced were all destroyed and recreated. The observer is the dangerous one: it holds its own reference to the collection (set at construction, plus the local hooks it subscribed to that instance), so a surviving observer bound to a `destroy()`-nulled collection drives `exportAllConditions()` into `filteringStates.getEntries()` on `null` → `Cannot read properties of null (reading 'getEntries')`. `#menuFocusNavigator` is the same family, one guard up (`filters.ts` `enablePlugin()`): its cached `focusableItems` keep pointing the Tab focus at detached component elements, so filter-menu keyboard navigation silently breaks — no crash. `disablePlugin()` therefore destroys+nulls the observer, destroys+nulls the collection, and sets `#menuFocusNavigator = undefined`, the way `destroy()` tears down the first two. This whole family is reachable whenever `updateSettings` carries the `filters` key (so `updatePlugin` runs disable+enable) — which the React and Angular wrappers do on every update, while the Vue 3 wrapper diffs each key against the current settings (`wrappers/vue3/src/helpers.ts`) and skips unchanged ones — followed by a data change (`afterUpdateData` on a second replace, or `afterChange` on a filtered cell) or a keyboard menu open. Do NOT "fix" the crash by null-guarding `exportAllConditions()` instead: that turns a loud crash into silent staleness (the value list stops refreshing) and hides the next occurrence. Coverage: `tests/e2e/filters-data-replace-cycle.spec.ts` (DEV-2889).
- Follow the standard plugin lifecycle: `super.enablePlugin()` last, `super.disablePlugin()` first. See the `handsontable-plugin-dev` skill.

## "Filter by value" list scope

- **A column's own conditions must never narrow down its own value list.** The list is built from the rows that survive the conditions of the columns **before** this one in the stack — that is exactly what `ConditionUpdateObserver`'s `filteredRowsFactory` (the curried `visibleDataFactory`) returns, and it deliberately excludes the edited column's own conditions. A column with no conditions of its own falls back to `ValueComponent.reset()`, which reads `getDataAtCol()` (the currently visible rows) — correct there, because nothing of its own is trimming them.
- **Never rebuild the list from `getDataAtCol()` for a column that has conditions.** That reads post-filter visible rows, so the column's own condition hides its own values and the user cannot check them back on (issue #12226).
- **A selected value the list cannot show must survive.** The list is scoped to the rows passing the *other* columns' conditions, so a selected value can have no checkbox to read. `MultipleSelectUI.getValue()` therefore returns the checked listed values **plus** the selected values missing from the list (`#getUnlistedValue()`, read from `options.value`, which `setValue` keeps whole). Without that union, confirming a narrowed menu rewrites the column's condition to whatever is on screen and silently drops the rest — permanently, since clearing the other column does not bring them back. **A value leaves the list for two different reasons and they must not be conflated:** another column's filter hides its rows (it has to survive), or it was edited out of the column entirely (it has to go). `ValueComponent.#pruneToExistingValues()` drops the second kind against the column's full value set, read through the `update` payload's `columnValuesFactory` — the same memo `filteredRowsFactory` already uses for this column, so it is a memo hit, not a second scan. Keeping a value that exists nowhere is worse than losing it: the list can never show it again, so `isSelectedAllValues()` can never be true, **Select all** can never release the column, the header keeps `htFiltersActive`, and `exportConditions()` publishes a value that matches no row. Only the column's own values go through `unifyColumnValues`/`toEmptyString`; the stored selection is compared as written, on purpose. `getDataMapAtColumn()` normalizes every cell value the same way, so a selection naming a blank as a raw `null` — which only the public `addCondition()` can produce, never the dropdown — already matched no row and checked no item, so dropping it removes dead weight rather than a filter. Do not "fix" the asymmetry by normalizing the selection too: that would keep a value the user can never see or untick, which is the exact thing this function exists to prevent.

Three invariants ride along. `isSelectedAllValues()` compares the item list against **the whole selection, unlisted values included** — ticking every value the list can show does *not* mean the column filters nothing, and answering `true` there makes `getState()` report `CONDITION_NONE`, which deletes the condition and the unlisted values with it. For the same reason `getState()` must not treat an **empty item list** as `CONDITION_NONE` on its own: `isSelectedAllValues()` already returns `true` for an empty list with an empty selection (`0 === 0`), and a separate emptiness test would fire while unlisted values are still excluding rows. Finally, every path that rewrites the selection wholesale must reset `options.value` **and** invalidate the `#unlistedValue` cache: `#onClearAllClick` (**Clear** means every value, so it also sets `#cleared`, which forces `CONDITION_BY_VALUE` — an empty list cannot otherwise say whether the column filters nothing or excludes everything), `#onSelectAllClick` (**Select all** releases the column, so the unlisted values go too — forgetting the cache here makes the reset inert), and the `searchMode: 'apply'` branch of `#onInput` (the search term owns the selection outright, so confirming must not silently widen it). **`#cleared` is restored in `ValueComponent.setState()`, never derived inside `MultipleSelectUI.setValue()`.** An empty `args[0]` on a restored `by_value` state is the record that the user emptied the box on purpose, and `setState()` runs only when a condition exists. `setValue()` is also called from `reset()`, which runs for a column carrying **no** condition — and that column's selection is empty whenever another column's filter leaves it with nothing to list. Deriving the flag there turns opening and confirming an untouched menu into a `by_value [[]]` condition that hides every row for good. `#cleared` also only decides anything while the selection is still empty (`isSelectedAllValues()` checks both), so ticking a box hands control back to the ordinary comparison. `ValueComponent` stores the **whole** condition in `state.args` (copied, not aliased — the collection returns live condition objects and `exportAllConditions()` only shallow-copies) because `itemsSnapshot` already carries the per-item checked flags, so narrowing `args` would only lose information.
- **A data change refreshes the list, never the selection.** `#onAfterChange` → `updateValueComponentCondition()` only asks `ConditionUpdateObserver` to recompute the column's state; it passes no value set. The list then picks up newly typed values (it is built from the rows surviving the *other* columns' conditions), while the checked set stays the user's own, narrowed to the values that still exist. Do not reintroduce a "here are the current values, treat them as selected" argument: that is what added a typed value to the condition behind the user's back, and — once every listed value ended up checked — made `ValueComponent.getState()` report `CONDITION_NONE`, so the next OK silently dropped the whole filter (issue #6471). It also read the column through `getDataAtCol()`, violating the rule above. The columns filtered *after* the edited one are refreshed as usual, so their lists follow the new data — their selections survive because of the unlisted-value rule above, not because the refresh is skipped. Do not "protect" them by skipping the refresh: that only freezes their `itemsSnapshot`, and a value that comes into scope then has no checkbox to tick until some condition changes.
- **The list for a condition-only column is rebuilt on menu open, never stored.** `ValueComponent.reset()` reads it through `Filters._getValueListDataAtColumn()`, which picks the source: a column in the condition stack gets the rows surviving the conditions *before* it, a column outside the stack gets `getDataAtCol()`. Do not move that work into the component state map — `ValueComponent.getState()` returns an `itemsSnapshot` on *every* OK click (including `CONDITION_NONE`), `saveState()` writes it for the confirmed column, and nothing ever clears it. A `setState()` that restored a `CONDITION_NONE` snapshot would freeze that column's list at whatever it held when the menu was last confirmed, so it would stop following the other columns' filters. Only a `CONDITION_BY_VALUE` state's snapshot is safe to restore, because `updateState()` rewrites it on every condition change.

- **`saveState()` REPLACES the column's state entry, so only `getState()` can decide what the state holds — `updateState()` must never be the sole writer of a key.** `BaseComponent.saveState()` calls `state.setValueAtIndex(physicalColumn, this.getState())`; it does not merge, and `getState()` receives no column index to work from. `Filters.#onActionBarSubmit()` runs the two in this order: `conditionUpdateObserver.flush()`, which invokes `updateState()`, and only afterwards `components.forEach(c => c.saveState(physicalIndex))`. So a key only `updateState()` writes is set and then immediately overwritten with `undefined` on every OK click, and the loss surfaces one menu opening later, in `setState()`. That is DEV-2666, where `state.locale` was dropped and the by-value search box fell back to the host's default locale — visible only where lowercasing is tailored, as with Turkish `İ`.
- **Anything the value list derives from the column is read at restore time, not carried in the component state.** The locale is the worked example: `#applyColumnLocale()` reads it from the open column's cell meta, and both restore paths (`reset()` and `setState()`'s `by_value` branch) call it. Storing it in the state map cannot work in either direction. Left to `updateState()` alone it is erased by `saveState()` on every OK, per the rule above; re-supplied from `getState()` it goes stale instead, because the select is `getState()`'s only source and `setState()` had just loaded the select from the stored value — a closed loop that pins the column to whatever locale it carried when the filter was first confirmed. Nothing breaks that loop later: `locale` is not one of the plugin's `SETTING_KEYS` (Filters inherits the default `[PLUGIN_KEY]`), so `updateSettings({ locale })` never reaches `updatePlugin()` and the state map survives it untouched. `setState()` is only ever reached from `restoreComponents()` via `#onAfterDropdownMenuShow`, which does **not** guarantee a selected column — it passes `getSelectedColumn()?.physicalIndex ?? -1`, and `DropdownMenu#open()` is public with no pre-selection enforced. The read falls through safely when there is none: `#applyColumnLocale()` no-ops, and `getValueAtIndex(-1)` returns `undefined`, so the `by_value` branch that needs the locale is never reached and the component resets instead. Coverage: `tests/e2e/filters-value-list-locale.spec.ts`, whose third case changes the locale under an applied filter.

- **The by-value list is a nested grid inside a menu cell, and it owns its focus ring.** The list keeps its cell selection while the menu is hidden, so a menu reopened from the keyboard (which keeps the list instance alive; a click rebuilds it) would show a `current` ring on an item while the focus sits on another component. `Filters#onAfterDropdownMenuHide` therefore calls `MultipleSelectUI#deselect()`, next to the Tab shortcut that already deselects on the way out. Until DEV-2792 nothing had to: the engine's selection pass scrubbed selection classes with a `querySelectorAll` over the whole menu table, which reached into the nested list and stripped its ring as a side effect on every menu redraw. The pass now touches only the elements it applied to, so a nested grid gets no accidental cleanup and must clear its own selection when it stops being the focused component. Test it with the menu opened by keyboard (`FiltersValueListPage#openMenuWithKeyboard`); a click-opened menu passes with or without the fix.
- **The nested list is one last-partial column in a 110px box.** `MultipleSelectUI` builds a one-column Handsontable (`height: 110`, `modifyColWidth` fills the box). That column is last-partial (equal to the viewport, not oversized). Mouse `singleScrollStrategy` must still skip the **whole** move for a non-oversized last-partial click — a per-axis skip would scroll the row, jump a below-fold checkbox (Eve, `data-row=4` on main/horizon), and miss the click. Do not "fix" the Playwright fold by targeting a different value or using `force: true`; the product skip is what keeps a real click on a virtualized checkbox from moving the list. Coverage: `tests/e2e/filters-value-list.spec.ts` plus `getMouseSingleScrollTarget` in `src/core/viewportScroll/__tests__/singleScroll.unit.js`.

## Rows and columns the filter is not allowed to touch (DEV-2524)

Two options carve pieces out of the filter's scope, on two different axes. Both are read live, never
captured when the plugin is enabled.

- **`filters: { filterFixedRows: false }` takes the rows pinned by `fixedRowsTop` /
  `fixedRowsBottom` out of the filter.** Default is `true` (they are filtered), which is what the
  plugin always did — flipping that default is a breaking change, and it deliberately disagrees with
  `columnSorting`'s `sortFixedRows`, which defaults to keeping pinned rows out because 18.0.0 shipped
  that behavior before the option existed.
- **The pinned set is resolved from the rows the grid SHOWS, not from the raw index sequence.** The
  two overlays freeze the first and last VISIBLE rows, so `#getPinnedRows()` walks
  `getIndexesSequence()` (which carries the sort permutation) and drops whatever ANOTHER trimming map
  removed — `trimRows`, a collapsed `nestedRows` parent. Reading the sequence alone names rows that
  are already invisible and misses the ones actually frozen, so on such a grid the option silently
  does nothing. This plugin's own map is excluded from that test on purpose: it is the thing being
  recomputed, and counting it would let the pinned set drift with every pass.
- **`slice(-0)` returns the WHOLE array**, and `push(...arr)` overflows the stack past ~10k elements.
  `getPinnedPhysicalRows()` therefore walks index ranges and adds rows one at a time. Both traps fail
  silently — the first pins every row so nothing ever filters, the second throws only on a large
  `fixedRowsBottom`. `pinnedRows.unit.ts` pins both, plus the overlap on a dataset shorter than the
  two counts (hence a `Set`).
- **`getDataMapAtColumn()` is the ONE exclusion point, and that is on purpose.** Dropping the pinned
  rows from its full read covers `DataFilter`, the `ConditionUpdateObserver` memo, and the
  has-conditions branch of `_getValueListDataAtColumn()` at once. Do **not** instead pass the wanted
  rows as its `physicalRows` argument: subset reads intentionally bypass the memo, so that would
  re-scan the column on every condition (the DEV-2088 55 s freeze). A caller that already passes
  `physicalRows` has chosen its rows and is left alone.
- **Resolving the set is memoized for one `filter()` call, and ONLY inside it.** Every filtered
  column asks again, plus the trimmed-state pass, so the memo earns its place there. It is written
  only while `#isFilterPassActive`, because nothing clears it otherwise: the value list resolves the
  same set on each menu opening, and with no condition applied there is no `filter()` to run — so a
  memo written from a list read would answer every later opening from the row order of the first
  one, across `fixedRows*` changes and row moves. `filter()` clears it on the way in AND in a
  `finally`, since the hooks it fires are host code that can throw.
- **"Is the exemption on" and "how many rows are pinned right now" are different questions.** The
  counts are zero both when the grid never opted in and when the last overlay was just cleared, so
  `#refilterForPinnedRows()` gates on `#isFixedRowExemptionActive()` (the option, and not under a
  data provider) rather than on the counts. Gating on the counts skips the pass that puts the
  no-longer-pinned rows back under the conditions, so setting `fixedRowsTop: 0` leaves a row on
  screen that nothing pins any more.
- **The exclusion means `filter()` has to put the pinned rows back.** They never reached the
  conditions, so they are absent from `rowIndexesToShow` and the trimmed-state pass marks them as
  "did not match". `filter()` forces them to `false` before `setValues()`.
- **The exemption goes stale on its own, so it is re-applied by hook.** It is written while
  filtering, and nothing re-runs that when the rows move underneath: `fixedRows*` changing, an insert
  or remove at either end, a row move, a sort. Left alone a frozen pane shows a row the filter should
  have hidden while the record that is really pinned stays trimmed. `#onAfterUpdateSettings` covers
  the options, `#onAfterRowSequenceChange` covers the rest, and `#refilterForPinnedRows()` returns
  early unless the grid opted in AND is actually filtering — so a grid that never set the option pays
  nothing. **Its guard is a re-entrancy flag, not a test on the change's source.** Writing
  `filtersRowsMap` does NOT fire `afterRowSequenceChange`: `indexMapper.ts` raises
  `indexesSequenceChange` from `indexesSequence`'s own `change` handler alone, and the trimming-map
  handler only sets `trimmedIndexesChanged`. So `filter()` cannot re-enter this path by itself — the
  flag is there for a consumer that sorts or moves rows from `beforeFilter`/`afterFilter`. Source is
  no help either: a sort reports `'update'`, the same value ordinary changes carry.
- **The exemption is POSITIONAL — the visual span, not the rows that get painted.** It covers visual
  rows `[0, fixedRowsTop-1]` and the last `fixedRowsBottom`, which is exactly the span
  `countNotHiddenFixedRowsTop()` measures; that span never stretches to make up for a hidden row
  inside it. So a row hidden by `HiddenRows` within the span is exempt although nothing renders it.
  That is deliberate, and it is the stable choice: un-hiding such a row needs no re-filter, because
  it was already exempt. Exempting only the painted rows would trim a row that is about to reappear
  inside the frozen pane, so it would need a `HiddenRows` hook to stay correct.
- **The deselect guard is no longer "did anything match".** `!rowIndexesToShow.length` used to mean
  "the grid is empty"; with pinned rows exempt, the visible rows are the matches **plus** the pinned
  ones, and deselecting on an empty match list would drop the selection while rows are on screen. A
  test for this must select a cell first and assert on the selection — reading the data alone passes
  either way.
- **Both branches of `_getValueListDataAtColumn()` must resolve pinned rows the SAME way** — through
  the physical set, with `toPhysicalRow()` on the visible-rows branch. Dropping by visual position
  there instead made the two disagree the moment another plugin trimmed a row, so a column's value
  list changed as soon as it got a condition of its own. The two branches still read different row
  SOURCES by design (visible rows versus the whole column, so a column's own filter cannot narrow its
  own list); that asymmetry is deliberate and is not the same thing.
- **`filterFixedRows` is inert under DataProvider.** Filtering happens server-side and the request
  carries no notion of a pinned row, so `#getPinnedRowCounts()` returns zeros rather than letting the
  local reads disagree with the server's own result.
- **`columns: [{ filters: false }]` turns the filter UI off for one column.** Read through
  `hot.getColumnMeta(visualColumn)`. Only `false` is honored; the effect is UI-only — `addCondition()`
  still filters such a column, mirroring `columnSorting`'s `headerAction: false`, which leaves
  `sort()` working. Hiding the UI does NOT clear an existing condition, so such a column keeps
  filtering with no way to see it in its own menu; `clearConditions()` is the way out.
- **That read MUST test `hasOwnProperty` first, and the legacy suite is what catches it.** Column meta
  inherits from grid meta through the prototype chain, so a plain `columnMeta.filters` also returns
  the **grid-level** value. On a grid built with `filters: false` whose plugin is then switched on by
  hand — `getPlugin('filters').enablePlugin()`, which `filters.spec.js` does — every column reads
  `false` and the whole filter menu renders blank. Whether the plugin runs at all is `BasePlugin`'s
  question (`isEnabled()`); this one answers only "did *this column* opt out", and only an own
  property is a per-column answer.
- **The ignored-object warning is raised by scanning every column, never from a visibility check.**
  A predicate is the wrong place for a side effect, and raising it there means a grid with no dropdown
  menu — or a column whose menu is never opened — is never warned, while the docs promise once per
  grid. It runs from `afterInit` (NOT from `enablePlugin()`, which is `afterPluginsInitialized`, where
  the column meta layer is not resolvable yet and every column reads as carrying nothing) and from
  `#onAfterUpdateSettings` when the payload carries `columns`.
- **The option's `@configScope` is `grid columns`, and it cannot be widened.** `getColumnMeta()` reads
  the COLUMN meta layer, which the `cells` function and the `cell` option never reach — they write on
  the cell layer below it. `optionLevels.unit.js` enforces that listing `cells` also lists `cell`, so
  claiming either one turns the suite red rather than silently shipping a scope the code does not
  honor.
- **`isHidden()` and `isHiddenInMenu()` are two different questions, and merging them regresses
  DataProvider.** `isHidden()` answers the `hide()`/`show()` flag only, and is what
  `restoreComponents()` tests; `isHiddenInMenu()` adds the `hiddenWhen` predicate and is read only by
  the menu item descriptor. Folding the predicate into `isHidden()` makes `restoreComponents()` skip
  the by-value component instead of resetting it — permanently under a data provider, which hides
  that component for the whole session, so `saveState()` then stores whatever the stale component
  returned.
- **Writing a test here: `updateSettings({ filters: ... })` CLEARS the conditions**, because the
  payload carries the plugin key so `updatePlugin()` runs disable+enable. `updateSettings({ columns })`
  clears them too, for a different reason: restating `columns` re-initializes the column index maps
  the conditions live in. Both are pre-existing Core behavior. To prove an option is read per filter,
  change `fixedRowsTop`/`fixedRowsBottom` instead — they are not in `SETTING_KEYS`, so conditions
  survive.
- **A sort cannot move the pinned set unless `columnSorting.sortFixedRows` is `true`.** Under its
  default the sorting plugin holds the frozen rows in place too, so a test that sorts to change which
  rows are pinned passes with the re-filter deleted. Two more shapes fail the same way and were caught
  by a negative control: removing a row whose replacement at the end matched the filter anyway, and
  asserting only on rows that were already hidden.

## Data-map row correlation (the memoization trap)

- **Never correlate rows between two reads through the coordinate stamps on cell meta** (`meta.visualRow`, `meta.visualCol`, `meta.row`, `meta.col`). Stored cell-meta objects are shared, and EVERY meta read anywhere re-stamps those fields — `getCellMeta`, `getCellMetaTransient`, and `getCellMetaUncached` all write them on each call. A single unrelated read (for example, the `locale` lookup `getCellMetaTransient(0, column)` in `ValueComponent`, which translates visual→physical on a filtered grid) silently changes the stamps on rows you are still holding. This surfaced as lost `by_value` checkbox entries the moment `ConditionUpdateObserver` started memoizing column reads (DEV-2088): the cached rows' stamps were overwritten between the memo write and the memo hit.
- **Correlate through the entry's own `row` property instead.** `getDataMapAtColumn` returns `{row, meta, value}` objects where `row` is the immutable physical row index. `Filters.filter()`, `DataFilter`, `ConditionUpdateObserver`'s `visibleDataFactory`, and `ValueComponent` all match rows via `entry.row` — keep any new consumer on that property.
- **`getDataMapAtColumn` stamps `visualRow`/`visualCol` with PHYSICAL indexes** (a historical quirk — it passes physical coordinates as the visual options). Do not "fix" this by passing true visual indexes, and do not read those stamps expecting visual coordinates.
- **`ConditionUpdateObserver` memoizes full-column data maps** per state update / per `flush()` batch (`#withColumnDataCache`/`#getColumnData`). The memo is only sound because source data cannot change inside one update and rows correlate via `entry.row`. If you add a code path that mutates source data during an update cascade, it must not run inside an active memo scope. Subset reads (`physicalRows` argument) intentionally bypass the memo.
- **Batch, don't loop, the update cascade.** `#onAfterChange` dedups changed columns per batch, and `importConditions` wraps its loop in `conditionUpdateObserver.groupChanges()`/`flush()` — the same pattern as the action-bar submit. Any new code path that adds/removes several conditions programmatically must group the same way, or every condition pays a full-dataset component update (this was a 55 s freeze for a 1,000-cell paste before DEV-2088).

## Filter-by-value display formatting

- **The list formats through `meta.valueFormatter` only.** `ValueComponent#onModifyDisplayedValue` calls the cell-meta formatter when it is present and otherwise shows the source value. Filter-by-value builds those labels from data-map meta and does not resolve the paint-path renderer, so do not route the list through `formatCellValue` (`renderCell.ts`). That helper also falls back to `renderer.valueFormatter`; wiring it into `ValueComponent` would couple Filters to the render layer and change the list for every renderer-only `valueFormatter`, which is wider than DEV-1021. For password (and similar display masking), the list needs `type: 'password'` — or another cell type that exports `valueFormatter` so `extendByMetaType` copies it onto cell meta (same pattern as numeric #10756). A column with only `renderer: 'password'` still paints hashes in the grid (`formatCellValue` falls back to `renderer.valueFormatter`) but shows source plaintext in the value list until a type/`valueFormatter` lands on cell meta. That renderer-only case is intentionally out of scope for the list. `modifyFiltersMultiSelectValue` remains the app-level escape hatch.
- **Skip formatters in `#onModifyDisplayedValue` when `item.value === ''`.** `intersectValues` / `toVisualValue` swap the empty bucket for the translated `(Blank cells)` label before the hook. Password `valueFormatter` hashes that label (thirteen `*` by default, or `####` when `hashLength` is 4); date/time formatters turn it into `#bad-value#`. The skip belongs in the handler, not the password formatter, so date/time keep the same path. The trigger still fires `modifyFiltersMultiSelectValue` (app handlers can still rewrite the blank label) and passes source `item.value` as a third argument the two-parameter public signature ignores. Do not match the translated label string (it follows `FILTERS_VALUES_BLANK_CELLS`). After `toEmptyString`, blanks are always `''`.

## Condition inputs and date/time parsing

- Date and time conditions parse BOTH the cell value and the user input with `parseToLocalDate()`/`parseToLocalTime()` (`helpers/dateTime.ts`), which accept **only strict ISO strings** (`YYYY-MM-DD` / `HH:mm[:ss]`) and return `null` otherwise — a `null` makes the condition reject every row. Never feed these parsers locale-formatted text.
- A condition descriptor's `inputType` (`'date'` / `'time'`) controls the native input type rendered in the menu: `ConditionComponent` applies it via `InputUI.setType()` on condition select and on saved-state restore. A condition with inputs that expects ISO date/time values MUST declare `inputType`, or users get a free-text field whose locale-formatted input never matches.
- `InputUI` syncs its value on `keyup`, `input`, AND `change`. A value picked from the native date/time calendar fires no `keyup` — do not remove the `input`/`change` hooks.

## Where to look next

- Coordinate translation rules and `IndexMapper` usage: `coordinate-systems` skill and `handsontable/.ai/ARCHITECTURE.md`.
- Plugin contract, hooks, settings validation, IndexMapper integration: `handsontable-plugin-dev` skill.
