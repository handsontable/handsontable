---
title: RowSelection
metaTitle: RowSelection API reference | Handsontable DataGrid for JavaScript
permalink: /api/row-selection
canonicalUrl: /api/row-selection
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Row selection](@/guides/rows/row-selection/row-selection.md) guide for examples and configuration details.

## Options

### rowSelection
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api rowSelection|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7266

:::

_rowSelection.rowSelection : boolean | object_

The `rowSelection` option configures the `RowSelection` plugin, which
lets the user select rows with checkboxes, including a "select all" checkbox.

The row selection is a state of its own. It is not the cell selection, and the plugin never
writes it into the data.

You can set the `rowSelection` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the `RowSelection` plugin                  |
| `true`    | Enable the `RowSelection` plugin with its defaults |
| An object | Enable the plugin and configure it                                          |

If you set the `rowSelection` option to an object, you can configure the following options:

| Option                   | Possible settings                                             | Default       |
| ------------------------ | ------------------------------------------------------------- | ------------- |
| `mode`                   | `'multiRow'` \| `'singleRow'`                                  | `'multiRow'`  |
| `checkboxes`             | A boolean, or a function `(rowData, physicalRow) => boolean`  | `true`        |
| `headerCheckbox`         | A boolean                                                     | `true`        |
| `selectAll`              | `'all'` \| `'filtered'` \| `'currentPage'`                     | `'all'`       |
| `enableClickSelection`   | `true` \| `false` \| `'enableSelection'` \| `'enableDeselection'` | `false`  |
| `isRowSelectable`        | A function `(rowData, physicalRow) => boolean`                | -             |
| `hideDisabledCheckboxes` | A boolean                                                     | `false`       |
| `checkboxLocation`       | `'rowHeader'` \| `'firstColumn'` \| `{ column }`                | `'rowHeader'` |
| `groupSelects`           | `'descendants'` \| `'self'` \| `'topLevel'`                    | `'descendants'` |

With the [`NestedRows`](@/api/nestedRows.md) plugin, `groupSelects` sets how the rows of the tree are
selected. With `'descendants'`, selecting a parent row selects every row under it, and a parent shows a
mixed state while only some of the rows under it are selected. With `'self'`, every row is selected on its
own. With `'topLevel'`, only the top-level rows can be selected. The `'singleRow'` mode and a bound
checkbox column (`checkboxLocation: { column }`) use `'self'` in place of `'descendants'`.

With `checkboxLocation: { column: 'selected' }`, the values of a checkbox column (its `data` property,
or its physical index) are the selection: selecting a row checks its cell, and checking a cell
selects its row.

Read more:
- [Row selection](@/guides/rows/row-selection/row-selection.md)
- [Server-side row selection](@/guides/getting-started/server-side-data-row-selection/server-side-data-row-selection.md)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// enable the `RowSelection` plugin with its defaults
rowSelection: true,

// "select all" acts on the filtered rows, and archived rows cannot be selected
rowSelection: {
  selectAll: 'filtered',
  isRowSelectable: (rowData) => rowData.status !== 'archived',
},
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L745

:::

_RowSelection.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L740

:::

_RowSelection.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L729

:::

_RowSelection.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L734

:::

_RowSelection.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L760

:::

_RowSelection.SETTINGS\_VALIDATORS_

Returns the validators the plugin settings are checked against.


## Methods

### deselectAll

::: ask-about-api deselectAll|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L952

:::

_rowSelection.deselectAll([scope]) ⇒ boolean_

Deselects every row in the scope.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [scope] | `string` | <code>&quot;all&quot;</code> | `optional` `'all'`, `'filtered'`, or `'currentPage'`. Defaults to `'all'`, so that a call clears the whole selection, rows filtered out included. |


**Returns**: `boolean` - `true` if the selection changed.  

### deselectRows

::: ask-about-api deselectRows|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L921

:::

_rowSelection.deselectRows(rows) ⇒ boolean_

Deselects the rows.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Visual row indexes. |


**Returns**: `boolean` - `true` if the selection changed.  

### destroy

::: ask-about-api destroy|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1188

:::

_rowSelection.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L866

:::

_rowSelection.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L786

:::

_rowSelection.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBoundColumn

::: ask-about-api getBoundColumn|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1071

:::

_rowSelection.getBoundColumn() ⇒ number | null_

Returns the visual index of the checkbox column whose values are the selection
(`checkboxLocation: { column }`), or `null` when the selection is not bound to a column.



### getHeaderCheckboxState

::: ask-about-api getHeaderCheckboxState|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1019

:::

_rowSelection.getHeaderCheckboxState() ⇒ Object_

Returns the state of the "select all" checkbox: `'checked'`, `'unchecked'`, `'mixed'`, or
`'disabled'` (no row in the scope can be selected), with the number of selected and selectable
rows in the scope.



### getSelectedCount

::: ask-about-api getSelectedCount|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1087

:::

_rowSelection.getSelectedCount() ⇒ number_

Returns the number of selected rows. With a server-backed grid (the
[`DataProvider`](@/api/dataProvider.md) plugin) and a "select all" scope other than
`'currentPage'`, it counts the rows matching the server query, including the rows on other pages.



### getSelectedPhysicalRows

::: ask-about-api getSelectedPhysicalRows|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L981

:::

_rowSelection.getSelectedPhysicalRows() ⇒ Array&lt;number&gt;_

Returns the physical indexes of the selected rows, including the rows the
[`Filters`](@/api/filters.md) plugin filtered out.



### getSelectedRows

::: ask-about-api getSelectedRows|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L965

:::

_rowSelection.getSelectedRows() ⇒ Array&lt;number&gt;_

Returns the visual indexes of the selected rows, in visual order. Selected rows the
[`Filters`](@/api/filters.md) plugin filtered out have no visual index and are not listed - use
[RowSelection#getSelectedPhysicalRows](@/api/rowSelection.md#getselectedphysicalrows) or [RowSelection#getSelectedRowsData](@/api/rowSelection.md#getselectedrowsdata) for them.



### getSelectedRowsData

::: ask-about-api getSelectedRowsData|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1010

:::

_rowSelection.getSelectedRowsData() ⇒ Array_

Returns the source data of the selected rows, in physical order, including the rows the
[`Filters`](@/api/filters.md) plugin filtered out. With a server-backed grid (the
[`DataProvider`](@/api/dataProvider.md) plugin), only the loaded rows have data: use
[RowSelection#getServerSelection](@/api/rowSelection.md#getserverselection) for the rest.



### getServerSelection

::: ask-about-api getServerSelection|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1102

:::

_rowSelection.getServerSelection() ⇒ Object | null_

Returns the selection of a server-backed grid (the [`DataProvider`](@/api/dataProvider.md)
plugin) in a form your server can apply to the rows it did not send: `selectAll: false` with the
ids of the selected rows, or `selectAll: true` with the ids of the rows deselected after "select
all". The ids come from the `dataProvider.rowId` option. Returns `null` without a server-backed grid.



### isEnabled

::: ask-about-api isEnabled|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L781

:::

_rowSelection.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [RowSelection#enablePlugin](@/api/rowSelection.md#enableplugin) method is called.



### isRowSelectable

::: ask-about-api isRowSelectable|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L903

:::

_rowSelection.isRowSelectable(row) ⇒ boolean_

Checks whether the row can be selected. A row cannot be selected when the `isRowSelectable`
function returns `false` for it or for a parent above it, when it is a nested row and
`groupSelects` is `'topLevel'`, when it is a parent with no selectable row under it
(`groupSelects: 'descendants'`), or when its cell in a bound checkbox column is read-only.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isRowSelected

::: ask-about-api isRowSelected|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L892

:::

_rowSelection.isRowSelected(row) ⇒ boolean_

Checks whether the row is selected.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### removeSelectedRows

::: ask-about-api removeSelectedRows|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1045

:::

_rowSelection.removeSelectedRows() ⇒ boolean_

Removes the selected rows from the grid, in one undo step. Only rows with a visual index are
removed: selected rows the [`Filters`](@/api/filters.md) plugin filtered out stay. With a
server-backed grid after a "select all", the rows on other pages cannot be removed from the
client, so nothing is removed and the method returns `false`.


**Returns**: `boolean` - `true` if any row was removed.  

### selectAll

::: ask-about-api selectAll|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L937

:::

_rowSelection.selectAll([scope]) ⇒ boolean_

Selects every selectable row in the scope.


| Param | Type | Description |
| --- | --- | --- |
| [scope] | `string` | `optional` `'all'`, `'filtered'`, or `'currentPage'`. Defaults to the `selectAll` setting. |


**Returns**: `boolean` - `true` if the selection changed.  

### selectRows

::: ask-about-api selectRows|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L913

:::

_rowSelection.selectRows(rows) ⇒ boolean_

Selects the rows. Rows that cannot be selected are skipped. In the `'singleRow'` mode, only the
last row of the list is selected, and every other row is deselected.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<number>` | Visual row indexes. |


**Returns**: `boolean` - `true` if the selection changed.  

### setServerSelection

::: ask-about-api setServerSelection|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1113

:::

_rowSelection.setServerSelection(selection) ⇒ boolean_

Replaces the selection of a server-backed grid (the [`DataProvider`](@/api/dataProvider.md)
plugin), for example to restore one you saved with [RowSelection#getServerSelection](@/api/rowSelection.md#getserverselection).


| Param | Type | Description |
| --- | --- | --- |
| selection | `object` | The selection. |
| selection.selectAll | `boolean` | Whether every row is selected, except `toggledRowIds`. |
| selection.toggledRowIds | `Array` | The row ids that differ from `selectAll`. |


**Returns**: `boolean` - `true` if the selection was applied.  

### toggleAll

::: ask-about-api toggleAll|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L1035

:::

_rowSelection.toggleAll() ⇒ boolean_

Toggles every selectable row in the scope, the way a click on the "select all" checkbox does:
a checked checkbox deselects them, an unchecked or mixed one selects them.


**Returns**: `boolean` - `true` if the selection changed.  

### toggleRow

::: ask-about-api toggleRow|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L929

:::

_rowSelection.toggleRow(row) ⇒ boolean_

Toggles the selection of the row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `boolean` - `true` if the selection changed.  

### updatePlugin

::: ask-about-api updatePlugin|RowSelection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/rowSelection/rowSelection.ts#L842

:::

_rowSelection.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`rowSelection`](@/api/options.md#rowselection)


