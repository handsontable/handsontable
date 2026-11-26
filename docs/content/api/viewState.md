---
title: ViewState
metaTitle: ViewState API reference | Handsontable DataGrid for JavaScript
permalink: /api/view-state
canonicalUrl: /api/view-state
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Save and restore the view state](@/guides/getting-started/view-state/view-state.md) guide for examples and configuration details.

## Members

### LICENSE

::: ask-about-api LICENSE|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L42

:::

_ViewState.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L31

:::

_ViewState.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L36

:::

_ViewState.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L48

:::

_ViewState.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`. The plugin
has no setting, so none does.


## Methods

### disablePlugin

::: ask-about-api disablePlugin|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L68

:::

_viewState.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L60

:::

_viewState.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getViewState

::: ask-about-api getViewState|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L94

:::

_viewState.getViewState() ⇒ object_

Returns the grid's view state as a plain, JSON-serializable object: the column and row order,
the sort, the filters, the hidden and trimmed rows, the hidden columns, the collapsed nested
rows, the manual column widths and row heights, the frozen rows and columns, the pagination
page and page size, the selection, and the scroll position.

A part that needs a plugin is included only while that plugin is enabled. On a grid that
loads its rows through [`dataProvider`](@/api/options.md#dataprovider), the sort, the filters,
and the page are left out, because the server owns them, and so are the row order, the hidden,
trimmed and collapsed rows, the row heights, and the selection: they address rows by their position in
the page the grid has loaded, and a state saved on one page would land on other records on another.

Pass the object to [ViewState#setViewState](@/api/viewState.md#setviewstate) to restore the view, on this grid or another one.

```js
const viewState = hot.getPlugin('viewState').getViewState();

localStorage.setItem('my-view', JSON.stringify(viewState));
```

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes View state.

**Since**: 19.0.0  

**Returns**: `object` - The view state. Its `version` property identifies the shape.  

### isEnabled

::: ask-about-api isEnabled|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L55

:::

_viewState.isEnabled() ⇒ boolean_

Checks if the plugin is enabled. It always is: the plugin has no setting, and keeps no state.



### setViewState

::: ask-about-api setViewState|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L187

:::

_viewState.setViewState(state, [options]) ⇒ object_

Restores a view state that [ViewState#getViewState](@/api/viewState.md#getviewstate) returned.

Only the parts the object carries are restored, so you can also pass a partial object, for
example `{ version: 1, sort: { columns: [{ column: 2, sortOrder: 'desc' }] } }`. Every other
part of the view stays as it is.

An index that names a record or a column is physical, so a state keeps addressing the same data
whatever the row and column order: the row and column order, the sort, the filters, the hidden and
trimmed rows, the hidden columns, and the manual sizes. The selection, the scroll position, and the
frozen counts are visual: they describe what the user sees, and are read against the row and column
order in force after the restore.

The sort, the filters, the hidden columns, and the column widths can also name a column by the
property its data is bound to, for example `{ column: 'amount', sortOrder: 'desc' }` or
`hiddenColumns: ['address.city']`. A property no column has is reported as `invalid`, and a property
of a column the grid does not show (a trimming map removed it, or it lies past `maxCols`) as
`outOfRange`, the same answer as for the column's index. `columnWidths` keeps a width for every
column, so there only a trimmed column named by property on a grid without a `columns` option is
`outOfRange`. The check reads the column order the grid has now, so a sort column that the same
state's `columnOrder` brings in under `maxCols` is `outOfRange` too. A property that two columns share names the
last of them. A string is always read as a property, so `'2'` from a URL is not the index `2`.
`getViewState()` always reports physical indexes.
The sort columns are physical too, unlike the visual ones that `getSortConfig()` of the sorting
plugins reports: convert those with [Core#toPhysicalColumn](@/api/core.md#tophysicalcolumn) before you pass them here.

Every part is checked against the grid before anything changes, and a part that cannot be applied
is reported in the returned `skipped` list, never thrown on. Each entry is
`{ part, reason, path, message }`: `path` points into the state (`filters[2].conditions[0].args`),
and `message` says what to change, so a caller can correct the state and retry. The reasons are:
the plugin the part needs is disabled (`pluginDisabled`), the frozen rows would run next to
Pagination (`pluginConflict`), the grid loads its rows through `dataProvider`
(`externalDataSource`), a stored row or column order no longer matches the number of rows or
columns (`sizeMismatch`), the selection does not fit the grid (`outOfRange`), or the value is
wrong (`invalid`): for example a row order that does not name every row exactly once, a column
property no column has, one column named twice in `sort` or `columnWidths`, more than one sort column
without `MultiColumnSorting`, a filter condition that is not registered on the page or cannot take
its arguments, or a key that is not a part of the view state at all. A hidden or trimmed index, a
sort column, a size, or a scroll position past the end of the grid is `outOfRange`, and so is a
column in `sort`, `filters`, or `hiddenColumns`, by index or by property, that the grid does not show. With another `version`, every part is skipped as
`unsupportedVersion`, next to the `error`.

A filter condition the column does not offer ([Filters#getAvailableConditions](@/api/filters.md#getavailableconditions)) is reported as
`invalid` too, but it does not skip the `filters` part: that column's filter is left out and the
other columns' filters are restored, so `filters` can be in `applied` and in `skipped` at once. The
part is skipped only when no column is left.

A value that is not an object, such as the `null` that `JSON.parse(localStorage.getItem('my-view'))`
gives on a first visit, an object with another `version`, and (with `atomic`) a state with a
rejected part are not applied at all. The result carries an `error` then, and an empty `applied`.

Restoring the filters moves a selected cell to the first row of its column, as any filtering
does, and restoring the page drops a selection the new page does not show. Include `selection`
in the state to control the selection either way.

By default the restore is not recorded by the [`UndoRedo`](@/api/undoRedo.md) plugin, and the undo
steps recorded before it stay available, so an undo after a restore reverts an earlier action,
which may then apply to the restored view. Pass `{ undo: 'record' }` to record the restore as one
undo step instead: a single undo then reverts every restored part, and a redo applies them again.
Nothing is recorded while the UndoRedo plugin is disabled.
Every restore also returns `previous`, the view its parts had before, in the same shape: pass it
to `setViewState()` to revert without UndoRedo.

Pass `{ atomic: true }` to apply nothing when any part is rejected by the checks made before the
restore starts. A step a listener vetoes (a `beforeFilter` that returns `false`, say) and a selection
the grid cannot show are only found while applying, and are reported after the rest was applied. So is
a selection or scroll position in a state that also changes the number of rows (`filters`, `trimmedRows`,
`collapsedRows`): it is measured against the rows that state leaves, so a view saved on the full grid
restores over a filtered one. To
check a state without applying it, use [ViewState#validateViewState](@/api/viewState.md#validateviewstate).

```js
const stored = localStorage.getItem('my-view');

if (stored !== null) {
  const { applied, skipped, previous } = hot.getPlugin('viewState')
    .setViewState(JSON.parse(stored), { undo: 'record' });
}
```

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes View state.

**Since**: 19.0.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| state | `object` |  | The view state to restore. |
| [options] | `object` |  | `optional` The restore options. |
| [options.undo] | `'record'` <br/> `'skip'` | <code>&#x27;skip&#x27;</code> | `optional` Whether the restore is one undo step (`'record'`) or none. |
| [options.atomic] | `boolean` | <code>false</code> | `optional` When `true`, nothing is applied if any part is rejected. |


**Returns**: `object` - An object with an `applied` array of the parts that were restored, a `skipped` array of
`{ part, reason, path, message }` for the parts that were not, the `previous` view of the restored parts,
and an `error` when the whole state was rejected.  

### validateViewState

::: ask-about-api validateViewState|ViewState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/viewState/viewState.ts#L212

:::

_viewState.validateViewState(state) ⇒ object_

Checks a view state against the grid, without applying anything. The answer is the one
[ViewState#setViewState](@/api/viewState.md#setviewstate) acts on: which parts it would apply, and for each part it would skip,
the `{ part, reason, path, message }` entry that says why. Use it to give a stored or generated
state a second chance before it reaches the grid. It takes the same input, column properties
included, and resolves them the same way.

```js
const { valid, skipped } = hot.getPlugin('viewState').validateViewState(generatedState);

if (!valid) {
  // send `skipped` back to the author of the state, and ask for a corrected one
}
```

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes View state.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| state | `object` | The view state to check. |


**Returns**: `object` - An object with `valid` (whether the whole state can be applied), `applicable` (the parts
`setViewState()` would apply), `skipped` (the parts it would not, as `{ part, reason, path, message }`), and an
`error` when the whole state would be rejected.  
