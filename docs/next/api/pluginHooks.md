---
title: Hooks
permalink: /next/api/hooks
canonicalUrl: /api/hooks
editLink: false
---

# Hooks

[[toc]]
## Members

### afterAddChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1745

:::

`afterAddChild(parent, element, index)`

Fired by [NestedRows](./nested-rows/) plugin after adding a children to the NestedRows structure. This hook is fired when
[Options#nestedRows](./options/#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | The parent object. |
| element | `object` <br/> `undefined` | The element added as a child. If `undefined`, a blank child was added. |
| index | `number` <br/> `undefined` | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### afterAutofill
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L656

:::

`afterAutofill(start, end, data)`

Fired by [Autofill](./autofill/) plugin after populating the data in the autofill feature. This hook is fired when
[Options#fillHandle](./options/#fillhandle) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| start | `CellCoords` | Object containing information about first filled cell: `{row: 2, col: 0}`. |
| end | `CellCoords` | Object containing information about last filled cell: `{row: 4, col: 1}`. |
| data | `Array<Array>` | 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`. |



### afterBeginEditing
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1776

:::

`afterBeginEditing(row, column)`

Fired after the editor is opened and rendered.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the edited cell. |
| column | `number` | Visual column index of the edited cell. |



### afterCellMetaReset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L56

:::

`afterCellMetaReset`

Fired after resetting a cell's meta. This happens when the [Core#updateSettings](./core/#updatesettings) method is called.



### afterChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L63

:::

`afterChange(changes, [source])`

Fired after one or more cells has been changed. The changes are triggered in any situation when the
value is entered using an editor or changed using API (e.q setDataAtCell).

__Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.

**Example**  
```js
new Handsontable(element, {
  afterChange: (changes) => {
    changes.forEach(([row, prop, oldValue, newValue]) => {
      // Some logic...
    });
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterChangesObserved
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L85

:::

`afterChangesObserved`

Fired by [ObserveChanges](./observe-changes/) plugin after detecting changes in the data source. This hook is fired when
[Options#observeChanges](./options/#observechanges) option is enabled.



### afterColumnCollapse
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1875

:::

`afterColumnCollapse(currentCollapsedColumns, destinationCollapsedColumns, collapsePossible, successfullyCollapsed)`

Fired by [CollapsibleColumns](./collapsible-columns/) plugin before columns collapse. This hook is fired when [Options#collapsibleColumns](./options/#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| collapsePossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |
| successfullyCollapsed | `boolean` | `true`, if the action affected any non-collapsible column, `false` otherwise. |



### afterColumnExpand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1899

:::

`afterColumnExpand(currentCollapsedColumns, destinationCollapsedColumns, expandPossible, successfullyExpanded)`

Fired by [CollapsibleColumns](./collapsible-columns/) plugin before columns expand. This hook is fired when [Options#collapsibleColumns](./options/#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| expandPossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |
| successfullyExpanded | `boolean` | `true`, if the action affected any non-collapsible column, `false` otherwise. |



### afterColumnMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1262

:::

`afterColumnMove(movedColumns, finalIndex, dropIndex, movePossible, orderChanged)`

Fired by [ManualColumnMove](./manual-column-move/) plugin after changing order of the visual indexes. This hook is fired when
[Options#manualColumnMove](./options/#manualcolumnmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | `number` <br/> `undefined` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragColumns` function wasn't called. |
| movePossible | `boolean` | Indicates if it was possible to move columns to the desired position. |
| orderChanged | `boolean` | Indicates if order of columns was changed by move. |



### afterColumnResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1313

:::

`afterColumnResize(newSize, column, isDoubleClick)`

Fired by [ManualColumnResize](./manual-column-resize/) plugin after rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](./options/#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new column width. |
| column | `number` | Visual index of the resized column. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |



### afterColumnSort
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1093

:::

`afterColumnSort(currentSortConfig, destinationSortConfigs)`

Fired by [ColumnSorting](./column-sorting/) and [MultiColumnSorting](./multi-column-sorting/) plugins after sorting the column. This hook is fired when [Options#columnSorting](./options/#columnsorting)
or [Options#multiColumnSorting](./options/#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | `Array` | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | `Array` | Destination sort configuration (for all sorted columns). |



### afterContextMenuDefaultOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L93

:::

`afterContextMenuDefaultOptions(predefinedItems)`

Fired each time user opens [ContextMenu](./context-menu/) and after setting up the Context Menu's default options. These options are a collection
which user can select by setting an array of keys or an array of objects in [Options#contextMenu](./options/#contextmenu) option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | `Array` | An array of objects containing information about the pre-defined Context Menu items. |



### afterContextMenuHide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L132

:::

`afterContextMenuHide(context)`

Fired by [ContextMenu](./context-menu/) plugin after hiding the Context Menu. This hook is fired when [Options#contextMenu](./options/#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The Context Menu plugin instance. |



### afterContextMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L150

:::

`afterContextMenuShow(context)`

Fired by [ContextMenu](./context-menu/) plugin after opening the Context Menu. This hook is fired when [Options#contextMenu](./options/#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The Context Menu plugin instance. |



### afterCopy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1197

:::

`afterCopy(data, coords)`

Fired by [CopyPaste](./copy-paste/) plugin after data are pasted into table. This hook is fired when [Options#copyPaste](./options/#copypaste)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains the copied data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                         which was copied. |



### afterCopyLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L159

:::

`afterCopyLimit(selectedRows, selectedColumns, copyRowsLimit, copyColumnsLimit)`

Fired by [CopyPaste](./copy-paste/) plugin after reaching the copy limit while copying data. This hook is fired when
[Options#copyPaste](./options/#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| selectedRows | `number` | Count of selected copyable rows. |
| selectedColumns | `number` | Count of selected copyable columns. |
| copyRowsLimit | `number` | Current copy rows limit. |
| copyColumnsLimit | `number` | Current copy columns limit. |



### afterCreateCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L192

:::

`afterCreateCol(index, amount, [source])`

Fired after created a new column.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created column in the data source. |
| amount | `number` | Number of newly created columns in the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterCreateRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L215

:::

`afterCreateRow(index, amount, [source])`

Fired after created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created row in the data source array. |
| amount | `number` | Number of newly created rows in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterCut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1151

:::

`afterCut(data, coords)`

Fired by [CopyPaste](./copy-paste/) plugin after data was cut out from the table. This hook is fired when
[Options#copyPaste](./options/#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains the cutted out data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which was cut out. |



### afterDeselect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L226

:::

`afterDeselect`

Fired after the current cell is deselected.



### afterDestroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L233

:::

`afterDestroy`

Fired after destroying the Handsontable instance.



### afterDetachChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1766

:::

`afterDetachChild(parent, element)`

Fired by [NestedRows](./nested-rows/) plugin after detaching a child from its parent. This hook is fired when
[Options#nestedRows](./options/#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | An object representing the parent from which the element was detached. |
| element | `object` | The detached element. |



### afterDocumentKeyDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L240

:::

`afterDocumentKeyDown(event)`

General hook which captures `keydown` events attached to the document body. These events are delegated to the
hooks system and consumed by Core and internal modules (e.g plugins, editors).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | A native `keydown` event object. |



### afterDrawSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L249

:::

`afterDrawSelection(currentRow, currentColumn, cornersOfSelection, layerLevel) ⇒ string | undefined`

Fired inside the Walkontable's selection `draw` method. Can be used to add additional class names to cells, depending on the current selection.

**Since**: 0.38.1  

| Param | Type | Description |
| --- | --- | --- |
| currentRow | `number` | Row index of the currently processed cell. |
| currentColumn | `number` | Column index of the currently cell. |
| cornersOfSelection | `Array<number>` | Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`. |
| layerLevel | `number` <br/> `undefined` | Number indicating which layer of selection is currently processed. |


**Returns**: `string` | `undefined` - Can return a `String`, which will act as an additional `className` to be added to the currently processed cell.  

### afterDropdownMenuDefaultOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L112

:::

`afterDropdownMenuDefaultOptions(predefinedItems)`

Fired by [DropdownMenu](./dropdown-menu/) plugin after setting up the Dropdown Menu's default options. These options are a
collection which user can select by setting an array of keys or an array of objects in [Options#dropdownMenu](./options/#dropdownmenu)
option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | `Array<object>` | An array of objects containing information about the pre-defined Context Menu items. |



### afterDropdownMenuHide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1725

:::

`afterDropdownMenuHide(instance)`

Fired by [DropdownMenu](./dropdown-menu/) plugin after hiding the Dropdown Menu. This hook is fired when [Options#dropdownMenu](./options/#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| instance | `DropdownMenu` | The DropdownMenu instance. |



### afterDropdownMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1716

:::

`afterDropdownMenuShow(dropdownMenu)`

Fired by [DropdownMenu](./dropdown-menu/) plugin after opening the Dropdown Menu. This hook is fired when [Options#dropdownMenu](./options/#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | `DropdownMenu` | The DropdownMenu instance. |



### afterFilter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1406

:::

`afterFilter(conditionsStack)`

Fired by [Filters](./filters/) plugin after applying [filtering](https://handsontable.com/docs/demo-filtering.html). This hook is fired when
[Options#filters](./options/#filters) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| conditionsStack | `Array<object>` | An array of objects with added conditions. ```js // Example format of the conditionsStack argument: [   {     column: 2,     conditions: [       {name: 'begins_with', args: [['S']]}     ],     operation: 'conjunction'   },   {     column: 4,     conditions: [       {name: 'not_empty', args: []}     ],     operation: 'conjunction'   }, ] ``` |



### afterGetCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L271

:::

`afterGetCellMeta(row, column, cellProperties)`

Fired after getting the cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| cellProperties | `object` | Object containing the cell properties. |



### afterGetColHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L281

:::

`afterGetColHeader(column, TH)`

Fired after retrieving information about a column header and appending it to the table header.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| TH | `HTMLTableCellElement` | Header's TH element. |



### afterGetColumnHeaderRenderers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1347

:::

`afterGetColumnHeaderRenderers(renderers)`

Fired after getting the column header renderers.


| Param | Type | Description |
| --- | --- | --- |
| renderers | `Array<function()>` | An array of the column header renderers. |



### afterGetRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L290

:::

`afterGetRowHeader(row, TH)`

Fired after retrieving information about a row header and appending it to the table header.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| TH | `HTMLTableCellElement` | Header's TH element. |



### afterGetRowHeaderRenderers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1355

:::

`afterGetRowHeaderRenderers(renderers)`

Fired after getting the row header renderers.


| Param | Type | Description |
| --- | --- | --- |
| renderers | `Array<function()>` | An array of the row header renderers. |



### afterHideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1627

:::

`afterHideColumns(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenColumns](./hidden-columns/) plugin after marking the columns as hidden. Fired only if the [Options#hiddenColumns](./options/#hiddencolumns) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any non-hidden columns, `false` otherwise. |



### afterHideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1581

:::

`afterHideRows(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenRows](./hidden-rows/) plugin after marking the rows as hidden. Fired only if the [Options#hiddenRows](./options/#hiddenrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any non-hidden rows, `false` otherwise. |



### afterInit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L299

:::

`afterInit`

Fired after the Handsontable instance is initiated.



### afterLanguageChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L635

:::

`afterLanguageChange(languageCode)`

Fired after successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | `string` | New language code. |



### afterListen
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1826

:::

`afterListen`

Fired after the table was switched into listening mode. This allows Handsontable to capture keyboard events and
respond in the right way.



### afterLoadData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L306

:::

`afterLoadData(sourceData, initialLoad)`

Fired after new data is loaded (by `loadData` or `updateSettings` method) into the data source array.


| Param | Type | Description |
| --- | --- | --- |
| sourceData | `Array` | Array of arrays or array of objects containing data. |
| initialLoad | `boolean` | Flag that determines whether the data has been loaded during the initialization. |



### afterMergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1795

:::

`afterMergeCells(cellRange, mergeParent, [auto])`

Fired by [MergeCells](./merge-cells/) plugin after cell merging. This hook is fired when [Options#mergeCells](./options/#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| mergeParent | `object` |  | The parent collection of the provided cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterModifyTransformEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1530

:::

`afterModifyTransformEnd(coords, rowTransformDir, colTransformDir)`

Fired after the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords of the freshly selected cell. |
| rowTransformDir | `number` | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterModifyTransformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1520

:::

`afterModifyTransformStart(coords, rowTransformDir, colTransformDir)`

Fired after the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coords of the freshly selected cell. |
| rowTransformDir | `number` | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterMomentumScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L315

:::

`afterMomentumScroll`

Fired after a scroll event, which is identified as a momentum scroll (e.g. On an iPad).



### afterOnCellContextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L366

:::

`afterOnCellContextMenu(event, coords, TD)`

Fired after clicking right mouse button on a cell or row/column header.

For example clicking on the row header of cell (0, 0) results with `afterOnCellContextMenu` called
with coordinates `{row: 0, col: -1}`.

**Since**: 4.1.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `contextmenu` event object. |
| coords | `CellCoords` | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellCornerDblClick
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L330

:::

`afterOnCellCornerDblClick(event)`

Fired after a `dblclick` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `dblclick` event object. |



### afterOnCellCornerMouseDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L322

:::

`afterOnCellCornerMouseDown(event)`

Fired after a `mousedown` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mousedown` event object. |



### afterOnCellMouseDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L338

:::

`afterOnCellMouseDown(event, coords, TD)`

Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
indexes are negative.

For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseDown` called
with coordinates `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mousedown` event object. |
| coords | `CellCoords` | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseOut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L394

:::

`afterOnCellMouseOut(event, coords, TD)`

Fired after leaving a cell or row/column header with the mouse cursor.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseout` event object. |
| coords | `CellCoords` | Leaved cell's visual coordinate object. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseOver
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L380

:::

`afterOnCellMouseOver(event, coords, TD)`

Fired after hovering a cell or row/column header with the mouse cursor. In case the row/column header was
hovered, the index is negative.

For example, hovering over the row header of cell (0, 0) results with `afterOnCellMouseOver` called
with coords `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseover` event object. |
| coords | `CellCoords` | Hovered cell's visual coordinate object. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseUp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L352

:::

`afterOnCellMouseUp(event, coords, TD)`

Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
indexes are negative.

For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseUp` called
with coordinates `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseup` event object. |
| coords | `CellCoords` | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterPaste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1238

:::

`afterPaste(data, coords)`

Fired by [CopyPaste](./copy-paste/) plugin after values are pasted into table. This hook is fired when
[Options#copyPaste](./options/#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains the pasted data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |



### afterPluginsInitialized
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1556

:::

`afterPluginsInitialized`

Fired after initializing all the plugins.
This hook should be added before Handsontable is initialized.

**Example**  
```js
Handsontable.hooks.add('afterPluginsInitialized', myCallback);
```


### afterRedo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1475

:::

`afterRedo(action)`

Fired by [UndoRedo](./undo-redo/) plugin after the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](./options/#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |



### afterRefreshDimensions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1842

:::

`afterRefreshDimensions(previousDimensions, currentDimensions, stateChanged)`

Fired after the window was resized.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | `object` | Previous dimensions of the container. |
| currentDimensions | `object` | Current dimensions of the container. |
| stateChanged | `boolean` | `true`, if the container was re-render, `false` otherwise. |



### afterRemoveCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L558

:::

`afterRemoveCellMeta(row, column, key, value)`

Fired after cell meta is removed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The removed meta key. |
| value | `*` | Value which was under removed key of cell meta. |



### afterRemoveCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L404

:::

`afterRemoveCol(index, amount, physicalColumns, [source])`

Fired after one or more columns are removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter column. |
| amount | `number` | An amount of removed columns. |
| physicalColumns | `Array<number>` | An array of physical columns removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterRemoveRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L415

:::

`afterRemoveRow(index, amount, physicalRows, [source])`

Fired after one or more rows are removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter row. |
| amount | `number` | An amount of removed rows. |
| physicalRows | `Array<number>` | An array of physical rows removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L426

:::

`afterRender(isForced)`

Fired after the Handsontable table is rendered.


| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | Is `true` if rendering was triggered by a change of settings or data; or `false` if                           rendering was triggered by scrolling or moving selection. |



### afterRenderer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L448

:::

`afterRenderer(TD, row, column, prop, value, cellProperties)`

Fired after finishing rendering the cell (after the renderer finishes).


| Param | Type | Description |
| --- | --- | --- |
| TD | `HTMLTableCellElement` | Currently rendered cell's TD element. |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| prop | `string` <br/> `number` | Column property name or a column index, if datasource is an array of arrays. |
| value | `*` | Value of the rendered cell. |
| cellProperties | `object` | Object containing the cell's properties. |



### afterRowMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1288

:::

`afterRowMove(movedRows, finalIndex, dropIndex, movePossible, orderChanged)`

Fired by [ManualRowMove](./manual-row-move/) plugin after changing the order of the visual indexes. This hook is fired when
[Options#manualRowMove](./options/#manualrowmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | `number` <br/> `undefined` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragRows` function wasn't called. |
| movePossible | `boolean` | Indicates if it was possible to move rows to the desired position. |
| orderChanged | `boolean` | Indicates if order of rows was changed by move. |



### afterRowResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1336

:::

`afterRowResize(newSize, row, isDoubleClick)`

Fired by [ManualRowResize](./manual-row-resize/) plugin after rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](./options/#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new row height. |
| row | `number` | Visual index of the resized row. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |



### afterScrollHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L461

:::

`afterScrollHorizontally`

Fired after the horizontal scroll event.



### afterScrollVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L468

:::

`afterScrollVertically`

Fired after the vertical scroll event.



### afterSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L475

:::

`afterSelection(row, column, row2, column2, preventScrolling, selectionLayerLevel)`

Fired after one or more cells are selected (e.g. During mouse move).

**Example**  
```js
new Handsontable(element, {
  afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // setting if prevent scrolling after selection
    preventScrolling.value = true;
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| column | `number` | Selection start visual column index. |
| row2 | `number` | Selection end visual row index. |
| column2 | `number` | Selection end visual column index. |
| preventScrolling | `object` | Object with `value` property where its value change will be observed. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionByProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L497

:::

`afterSelectionByProp(row, prop, row2, prop2, preventScrolling, selectionLayerLevel)`

Fired after one or more cells are selected.

The `prop` and `prop2` arguments represent the source object property name instead of the column number.

**Example**  
```js
new Handsontable(element, {
  afterSelectionByProp: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // setting if prevent scrolling after selection
    preventScrolling.value = true;
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| prop | `string` | Selection start data source object property name. |
| row2 | `number` | Selection end visual row index. |
| prop2 | `string` | Selection end data source object property name. |
| preventScrolling | `object` | Object with `value` property where its value change will be observed. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L521

:::

`afterSelectionEnd(row, column, row2, column2, selectionLayerLevel)`

Fired after one or more cells are selected (e.g. On mouse up).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| column | `number` | Selection start visual column index. |
| row2 | `number` | Selection end visual row index. |
| column2 | `number` | Selection end visual column index. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionEndByProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L533

:::

`afterSelectionEndByProp(row, prop, row2, prop2, selectionLayerLevel)`

Fired after one or more cells are selected (e.g. On mouse up).

The `prop` and `prop2` arguments represent the source object property name instead of the column number.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| prop | `string` | Selection start data source object property index. |
| row2 | `number` | Selection end visual row index. |
| prop2 | `string` | Selection end data source object property index. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSetCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L547

:::

`afterSetCellMeta(row, column, key, value)`

Fired after cell meta is changed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The updated meta key. |
| value | `*` | The updated meta value. |



### afterSetDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L569

:::

`afterSetDataAtCell(changes, [source])`

Fired after cell data was changed.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterSetDataAtRowProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L579

:::

`afterSetDataAtRowProp(changes, [source])`

Fired after cell data was changed.
Called only when `setDataAtRowProp` was executed.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, prop, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### afterSetSourceDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L590

:::

`afterSetSourceDataAtCell(changes, [source])`

Fired after cell source data was changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### afterTrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1672

:::

`afterTrimRow(currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged) ⇒ undefined | boolean`

Fired by [TrimRows](./trim-rows/) plugin after trimming rows. This hook is fired when [Options#trimRows](./options/#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any non-trimmed rows, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the trimming action will not be completed.  

### afterUndo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1454

:::

`afterUndo(action)`

Fired by [UndoRedo](./undo-redo/) plugin after the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](./options/#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |



### afterUnhideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1650

:::

`afterUnhideColumns(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenColumns](./hidden-columns/) plugin after marking the columns as not hidden. Fired only if the [Options#hiddenColumns](./options/#hiddencolumns) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any hidden columns, `false` otherwise. |



### afterUnhideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1604

:::

`afterUnhideRows(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)`

Fired by [HiddenRows](./hidden-rows/) plugin after marking the rows as not hidden. Fired only if the [Options#hiddenRows](./options/#hiddenrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any hidden rows, `false` otherwise. |



### afterUnlisten
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1834

:::

`afterUnlisten`

Fired after the table was switched off from the listening mode. This makes the Handsontable inert for any
keyboard events.



### afterUnmergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1816

:::

`afterUnmergeCells(cellRange, [auto])`

Fired by [MergeCells](./merge-cells/) plugin after unmerging the cells. This hook is fired when [Options#mergeCells](./options/#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterUntrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1695

:::

`afterUntrimRow(currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged) ⇒ undefined | boolean`

Fired by [TrimRows](./trim-rows/) plugin after untrimming rows. This hook is fired when [Options#trimRows](./options/#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any trimmed rows, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the untrimming action will not be completed.  

### afterUpdateSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L600

:::

`afterUpdateSettings(newSettings)`

Fired after calling the `updateSettings` method.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | `object` | New settings object. |



### afterValidate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L608

:::

`afterValidate(isValid, value, row, prop, [source]) ⇒ void | boolean`

A plugin hook executed after validator function, only if validator function is defined.
Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.

__Returning false from the callback will mark the cell as invalid__.


| Param | Type | Description |
| --- | --- | --- |
| isValid | `boolean` | `true` if valid, `false` if not. |
| value | `*` | The value in question. |
| row | `number` | Visual row index. |
| prop | `string` <br/> `number` | Property name / visual column index. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: `void` | `boolean` - If `false` the cell will be marked as invalid, `true` otherwise.  

### afterViewportColumnCalculatorOverride
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1548

:::

`afterViewportColumnCalculatorOverride(calc)`

Fired inside the `viewportColumnCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | `object` | The row calculator. |



### afterViewportRowCalculatorOverride
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1540

:::

`afterViewportRowCalculatorOverride(calc)`

Fired inside the `viewportRowCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | `object` | The row calculator. |



### beforeAddChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1734

:::

`beforeAddChild(parent, element, index)`

Fired by [NestedRows](./nested-rows/) plugin before adding a children to the NestedRows structure. This hook is fired when
[Options#nestedRows](./options/#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | The parent object. |
| element | `object` <br/> `undefined` | The element added as a child. If `undefined`, a blank child was added. |
| index | `number` <br/> `undefined` | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### beforeAutofill
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L644

:::

`beforeAutofill(start, end, data) ⇒ * | boolean`

Fired by [Autofill](./autofill/) plugin before populating the data in the autofill feature. This hook is fired when
[Options#fillHandle](./options/#fillhandle) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| start | `CellCoords` | Object containing information about first filled cell: `{row: 2, col: 0}`. |
| end | `CellCoords` | Object containing information about last filled cell: `{row: 4, col: 1}`. |
| data | `Array<Array>` | 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`. |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeAutofillInsidePopulate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1493

:::

`beforeAutofillInsidePopulate(index, direction, input, deltas)`

Fired from the `populateFromArray` method during the `autofill` process. Fired for each "autofilled" cell individually.


| Param | Type | Description |
| --- | --- | --- |
| index | `object` | Object containing `row` and `col` properties, defining the number of rows/columns from the initial cell of the autofill. |
| direction | `string` | Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`. |
| input | `Array<Array>` | Contains an array of rows with data being used in the autofill. |
| deltas | `Array` | The deltas array passed to the `populateFromArray` method. |



### beforeCellAlignment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L668

:::

`beforeCellAlignment(stateBefore, range, type, alignmentClass)`

Fired before aligning the cell contents.


| Param | Type | Description |
| --- | --- | --- |
| stateBefore | `object` | An object with class names defining the cell alignment. |
| range | `Array<CellRange>` | An array of CellRange coordinates where the alignment will be applied. |
| type | `string` | Type of the alignment - either `horizontal` or `vertical`. |
| alignmentClass | `string` | String defining the alignment class added to the cell. Possible values: * `htLeft` * `htCenter` * `htRight` * `htJustify` * `htTop` * `htMiddle` * `htBottom`. |



### beforeChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L687

:::

`beforeChange(changes, [source]) ⇒ void | boolean`

Fired before one or more cells is changed. Its main purpose is to alter changes silently after input and before
table rendering.

**Example**  
```js
// To disregard a single change, set changes[i] to null or remove it from array using changes.splice(i, 1).
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0] = null;
  }
});
// To alter a single change, overwrite the desired value to changes[i][3].
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0][3] = 10;
  }
});
// To cancel all edit, return false from the callback or set array length to 0 (changes.length = 0).
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    return false;
  }
});
```

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | 2D array containing information about each of the edited cells. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: `void` | `boolean` - If `false` all changes were cancelled, `true` otherwise.  

### beforeChangeRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L723

:::

`beforeChangeRender(changes, [source])`

Fired right before rendering the changes.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | Array in form of `[row, prop, oldValue, newValue]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### beforeColumnCollapse
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1863

:::

`beforeColumnCollapse(currentCollapsedColumns, destinationCollapsedColumns, collapsePossible) ⇒ undefined | boolean`

Fired by [CollapsibleColumns](./collapsible-columns/) plugin before columns collapse. This hook is fired when [Options#collapsibleColumns](./options/#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| collapsePossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the collapsing action will not be completed.  

### beforeColumnExpand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1887

:::

`beforeColumnExpand(currentCollapsedColumns, destinationCollapsedColumns, expandPossible) ⇒ undefined | boolean`

Fired by [CollapsibleColumns](./collapsible-columns/) plugin before columns expand. This hook is fired when [Options#collapsibleColumns](./options/#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| expandPossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the expanding action will not be completed.  

### beforeColumnMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1249

:::

`beforeColumnMove(movedColumns, finalIndex, dropIndex, movePossible) ⇒ void | boolean`

Fired by [ManualColumnMove](./manual-column-move/) plugin before change order of the visual indexes. This hook is fired when
[Options#manualColumnMove](./options/#manualcolumnmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | `number` <br/> `undefined` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragColumns` function wasn't called. |
| movePossible | `boolean` | Indicates if it's possible to move rows to the desired position. |


**Returns**: `void` | `boolean` - If `false` the column will not be moved, `true` otherwise.  

### beforeColumnResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1301

:::

`beforeColumnResize(newSize, column, isDoubleClick) ⇒ number`

Fired by [ManualColumnResize](./manual-column-resize/) plugin before rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](./options/#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new column width. |
| column | `number` | Visual index of the resized column. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |


**Returns**: `number` - Returns a new column size or `undefined`, if column size should be calculated automatically.  

### beforeColumnSort
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1080

:::

`beforeColumnSort(currentSortConfig, destinationSortConfigs) ⇒ boolean | void`

Fired by [ColumnSorting](./column-sorting/) and [MultiColumnSorting](./multi-column-sorting/) plugins before sorting the column. If you return `false` value inside callback for hook, then sorting
will be not applied by the Handsontable (useful for server-side sorting).

This hook is fired when [Options#columnSorting](./options/#columnsorting) or [Options#multiColumnSorting](./options/#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | `Array` | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | `Array` | Destination sort configuration (for all sorted columns). |


**Returns**: `boolean` | `void` - If `false` the column will not be sorted, `true` otherwise.  

### beforeContextMenuSetItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L102

:::

`beforeContextMenuSetItems(menuItems)`

Fired each time user opens [ContextMenu](./context-menu/) plugin before setting up the Context Menu's items but after filtering these options by
user (`contextMenu` option). This hook can by helpful to determine if user use specified menu item or to set up
one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array<object>` | An array of objects containing information about to generated Context Menu items. |



### beforeContextMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L141

:::

`beforeContextMenuShow(context)`

Fired by [ContextMenu](./context-menu/) plugin before opening the Context Menu. This hook is fired when [Options#contextMenu](./options/#context-menu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The Context Menu instance. |



### beforeCopy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1162

:::

`beforeCopy(data, coords) ⇒ *`

Fired before values are copied into clipboard.

**Example**  
```js
// To disregard a single row, remove it from array using data.splice(i, 1).
...
new Handsontable(document.getElementById('example'), {
  beforeCopy: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }
});
...

// To cancel copying, return false from the callback.
...
new Handsontable(document.getElementById('example'), {
  beforeCopy: (data, coords) => {
    return false;
  }
});
...
```

| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains data to copied. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                         which will copied. |


**Returns**: `*` - If returns `false` then copying is canceled.  

### beforeCreateCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L171

:::

`beforeCreateCol(index, amount, [source]) ⇒ *`

Fired before created a new column.

**Example**  
```js
// Return `false` to cancel column inserting.
new Handsontable(element, {
  beforeCreateCol: function(data, coords) {
    return false;
  }
});
```

| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created column in the data source array. |
| amount | `number` | Number of newly created columns in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](http://docs.handsontable.com/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: `*` - If `false` then creating columns is cancelled.  

### beforeCreateRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L203

:::

`beforeCreateRow(index, amount, [source]) ⇒ * | boolean`

Fired before created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created row in the data source array. |
| amount | `number` | Number of newly created rows in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeCut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1121

:::

`beforeCut(data, coords) ⇒ *`

Fired by [CopyPaste](./copy-paste/) plugin before copying the values into clipboard and before clearing values of
the selected cells. This hook is fired when [Options#copyPaste](./options/#copypaste) option is enabled.

**Example**  
```js
// To disregard a single row, remove it from the array using data.splice(i, 1).
new Handsontable(element, {
  beforeCut: function(data, coords) {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }
});
// To cancel a cutting action, just return `false`.
new Handsontable(element, {
  beforeCut: function(data, coords) {
    return false;
  }
});
```

| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains data to cut. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which will be cut out. |


**Returns**: `*` - If returns `false` then operation of the cutting out is canceled.  

### beforeDetachChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1756

:::

`beforeDetachChild(parent, element)`

Fired by [NestedRows](./nested-rows/) plugin before detaching a child from its parent. This hook is fired when
[Options#nestedRows](./options/#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | An object representing the parent from which the element is to be detached. |
| element | `object` | The detached element. |



### beforeDrawBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L733

:::

`beforeDrawBorders(corners, borderClassName)`

Fired before drawing the borders.


| Param | Type | Description |
| --- | --- | --- |
| corners | `Array` | Array specifying the current selection borders. |
| borderClassName | `string` | Specifies the border class name. |



### beforeDropdownMenuSetItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L122

:::

`beforeDropdownMenuSetItems(menuItems)`

Fired by [DropdownMenu](./dropdown-menu/) plugin before setting up the Dropdown Menu's items but after filtering these options
by user (`dropdownMenu` option). This hook can by helpful to determine if user use specified menu item or to set
up one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array<object>` | An array of objects containing information about to generated Dropdown Menu items. |



### beforeDropdownMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1707

:::

`beforeDropdownMenuShow(dropdownMenu)`

Fired by [DropdownMenu](./dropdown-menu/) plugin before opening the dropdown menu. This hook is fired when [Options#dropdownMenu](./options/#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | `DropdownMenu` | The DropdownMenu instance. |



### beforeFilter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1374

:::

`beforeFilter(conditionsStack) ⇒ boolean`

Fired by [Filters](./filters/) plugin before applying [filtering](https://handsontable.com/docs/demo-filtering.html). This hook is fired when
[Options#filters](./options/#filters) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| conditionsStack | `Array<object>` | An array of objects with added formulas. ```js // Example format of the conditionsStack argument: [   {     column: 2,     conditions: [       {name: 'begins_with', args: [['S']]}     ],     operation: 'conjunction'   },   {     column: 4,     conditions: [       {name: 'not_empty', args: []}     ],     operation: 'conjunction'   }, ] ``` |


**Returns**: `boolean` - If hook returns `false` value then filtering won't be applied on the UI side (server-side filtering).  

### beforeGetCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L742

:::

`beforeGetCellMeta(row, column, cellProperties)`

Fired before getting cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| cellProperties | `object` | Object containing the cell's properties. |



### beforeHideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1615

:::

`beforeHideColumns(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenColumns](./hidden-columns/) plugin before marking the columns as hidden. Fired only if the [Options#hiddenColumns](./options/#hiddencolumns) option is enabled.
Returning `false` in the callback will prevent the hiding action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the hiding action will not be completed.  

### beforeHideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1569

:::

`beforeHideRows(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenRows](./hidden-rows/) plugin before marking the rows as hidden. Fired only if the [Options#hiddenRows](./options/#hiddenrows) option is enabled.
Returning `false` in the callback will prevent the hiding action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the hiding action will not be completed.  

### beforeInit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L764

:::

`beforeInit`

Fired before the Handsontable instance is initiated.



### beforeInitWalkontable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L771

:::

`beforeInitWalkontable(walkontableConfig)`

Fired before the Walkontable instance is initiated.


| Param | Type | Description |
| --- | --- | --- |
| walkontableConfig | `object` | Walkontable configuration object. |



### beforeKeyDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L789

:::

`beforeKeyDown(event)`

Fired before keydown event is handled. It can be used to overwrite default key bindings.

__Note__: To prevent default behavior you need to call `event.stopImmediatePropagation()` in your `beforeKeyDown`
handler.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | Original DOM event. |



### beforeLanguageChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L626

:::

`beforeLanguageChange(languageCode)`

Fired before successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | `string` | New language code. |



### beforeLoadData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L779

:::

`beforeLoadData(sourceData, initialLoad)`

Fired before new data is loaded (by `loadData` or `updateSettings` method) into the data source array.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| sourceData | `Array` | Array of arrays or array of objects containing data. |
| initialLoad | `boolean` | Flag that determines whether the data has been loaded during the initialization. |



### beforeMergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1785

:::

`beforeMergeCells(cellRange, [auto])`

Fired by [MergeCells](./merge-cells/) plugin before cell merging. This hook is fired when [Options#mergeCells](./options/#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeOnCellContextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L822

:::

`beforeOnCellContextMenu(event, coords, TD)`

Fired after the user clicked a cell, but before all the calculations related with it.

**Since**: 4.1.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `contextmenu` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |



### beforeOnCellMouseDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L800

:::

`beforeOnCellMouseDown(event, coords, TD, controller)`

Fired after the user clicked a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mousedown` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |
| controller | `object` | An object with keys `row`, `column` and `cells` which contains boolean values. This                            object allows or disallows changing the selection for the particular axies. |



### beforeOnCellMouseOut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L845

:::

`beforeOnCellMouseOut(event, coords, TD)`

Fired after the user moved cursor out from a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseout` event object. |
| coords | `CellCoords` | CellCoords object containing the visual coordinates of the leaved cell. |
| TD | `HTMLTableCellElement` | TD element. |



### beforeOnCellMouseOver
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L833

:::

`beforeOnCellMouseOver(event, coords, TD, controller)`

Fired after the user moved cursor over a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseover` event object. |
| coords | `CellCoords` | CellCoords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |
| controller | `object` | An object with keys `row`, `column` and `cells` which contains boolean values. This                            object allows or disallows changing the selection for the particular axies. |



### beforeOnCellMouseUp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L812

:::

`beforeOnCellMouseUp(event, coords, TD)`

Fired after the user clicked a cell.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseup` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |



### beforePaste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1208

:::

`beforePaste(data, coords) ⇒ *`

Fired by [CopyPaste](./copy-paste/) plugin before values are pasted into table. This hook is fired when
[Options#copyPaste](./options/#copypaste) option is enabled.

**Example**  
```js
// To disregard a single row, remove it from array using data.splice(i, 1).
new Handsontable(example, {
  beforePaste: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }
});
// To cancel pasting, return false from the callback.
new Handsontable(example, {
  beforePaste: (data, coords) => {
    return false;
  }
});
```

| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains data to paste. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |


**Returns**: `*` - If returns `false` then pasting is canceled.  

### beforeRedo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1464

:::

`beforeRedo(action) ⇒ * | boolean`

Fired by [UndoRedo](./undo-redo/) plugin before the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](./options/#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRefreshDimensions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1852

:::

`beforeRefreshDimensions(previousDimensions, currentDimensions, actionPossible) ⇒ undefined | boolean`

Cancellable hook, called after resizing a window, but before redrawing a table.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | `object` | Previous dimensions of the container. |
| currentDimensions | `object` | Current dimensions of the container. |
| actionPossible | `boolean` | `true`, if current and previous dimensions are different, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the refresh action will not be completed.  

### beforeRemoveCellClassNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L262

:::

`beforeRemoveCellClassNames ⇒ Array<string> | undefined`

Fired inside the Walkontable's `refreshSelections` method. Can be used to remove additional class names from all cells in the table.

**Since**: 0.38.1  

**Returns**: `Array<string>` | `undefined` - Can return an `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.  

### beforeRemoveCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L752

:::

`beforeRemoveCellMeta(row, column, key, value) ⇒ * | boolean`

Fired before cell meta is removed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The removed meta key. |
| value | `*` | Value which is under removed key of cell meta. |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRemoveCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L855

:::

`beforeRemoveCol(index, amount, physicalColumns, [source]) ⇒ * | boolean`

Fired before one or more columns are about to be removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter column. |
| amount | `number` | Amount of columns to be removed. |
| physicalColumns | `Array<number>` | An array of physical columns removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRemoveRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L867

:::

`beforeRemoveRow(index, amount, physicalRows, [source]) ⇒ * | boolean`

Fired when one or more rows are about to be removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter row. |
| amount | `number` | Amount of rows to be removed. |
| physicalRows | `Array<number>` | An array of physical rows removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L879

:::

`beforeRender(isForced, skipRender)`

Fired before the Handsontable table is rendered.


| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | If `true` rendering was triggered by a change of settings or data; or `false` if                           rendering was triggered by scrolling or moving selection. |
| skipRender | `object` | Object with `skipRender` property, if it is set to `true ` the next rendering cycle will be skipped. |



### beforeRenderer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L435

:::

`beforeRenderer(TD, row, column, prop, value, cellProperties)`

Fired before starting rendering the cell.


| Param | Type | Description |
| --- | --- | --- |
| TD | `HTMLTableCellElement` | Currently rendered cell's TD element. |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| prop | `string` <br/> `number` | Column property name or a column index, if datasource is an array of arrays. |
| value | `*` | Value of the rendered cell. |
| cellProperties | `object` | Object containing the cell's properties. |



### beforeRowMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1275

:::

`beforeRowMove(movedRows, finalIndex, dropIndex, movePossible) ⇒ * | boolean`

Fired by [ManualRowMove](./manual-row-move/) plugin before changing the order of the visual indexes. This hook is fired when
[Options#manualRowMove](./options/#manualrowmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check visualization of final index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |
| dropIndex | `number` <br/> `undefined` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). It's `undefined` when `dragRows` function wasn't called. |
| movePossible | `boolean` | Indicates if it's possible to move rows to the desired position. |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRowResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1324

:::

`beforeRowResize(newSize, row, isDoubleClick) ⇒ number`

Fired by [ManualRowResize](./manual-row-resize/) plugin before rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](./options/#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new row height. |
| row | `number` | Visual index of the resized row. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |


**Returns**: `number` - Returns the new row size or `undefined` if row size should be calculated automatically.  

### beforeSetCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L889

:::

`beforeSetCellMeta(row, column, key, value) ⇒ * | boolean`

Fired before cell meta is changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The updated meta key. |
| value | `*` | The updated meta value. |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeSetRangeEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L918

:::

`beforeSetRangeEnd(coords)`

Fired before setting range is ended.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | CellCoords instance. |



### beforeSetRangeStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L910

:::

`beforeSetRangeStart(coords)`

Fired before setting range is started.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | CellCoords instance. |



### beforeSetRangeStartOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L902

:::

`beforeSetRangeStartOnly(coords)`

Fired before setting range is started but not finished yet.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | CellCoords instance. |



### beforeStretchingColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1363

:::

`beforeStretchingColumnWidth(stretchedWidth, column) ⇒ number`

Fired before applying stretched column width to column.


| Param | Type | Description |
| --- | --- | --- |
| stretchedWidth | `number` | Calculated width. |
| column | `number` | Visual column index. |


**Returns**: `number` - Returns new width which will be applied to the column element.  

### beforeTouchScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L926

:::

`beforeTouchScroll`

Fired before the logic of handling a touch scroll, when user started scrolling on a touch-enabled device.



### beforeTrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1661

:::

`beforeTrimRow(currentTrimConfig, destinationTrimConfig, actionPossible) ⇒ undefined | boolean`

Fired by [TrimRows](./trim-rows/) plugin before trimming rows. This hook is fired when [Options#trimRows](./options/#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the trimming action will not be completed.  

### beforeUndo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1443

:::

`beforeUndo(action) ⇒ * | boolean`

Fired by [UndoRedo](./undo-redo/) plugin before the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](./options/#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeUnhideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1638

:::

`beforeUnhideColumns(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenColumns](./hidden-columns/) plugin before marking the columns as not hidden. Fired only if the [Options#hiddenColumns](./options/#hiddencolumns) option is enabled.
Returning `false` in the callback will prevent the column revealing action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the hiding action will not be completed.  

### beforeUnhideRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1592

:::

`beforeUnhideRows(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean`

Fired by [HiddenRows](./hidden-rows/) plugin before marking the rows as not hidden. Fired only if the [Options#hiddenRows](./options/#hiddenrows) option is enabled.
Returning `false` in the callback will prevent the row revealing action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the revealing action will not be completed.  

### beforeUnmergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1806

:::

`beforeUnmergeCells(cellRange, [auto])`

Fired by [MergeCells](./merge-cells/) plugin before unmerging the cells. This hook is fired when [Options#mergeCells](./options/#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeUntrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1684

:::

`beforeUntrimRow(currentTrimConfig, destinationTrimConfig, actionPossible) ⇒ undefined | boolean`

Fired by [TrimRows](./trim-rows/) plugin before untrimming rows. This hook is fired when [Options#trimRows](./options/#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the untrimming action will not be completed.  

### beforeValidate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L933

:::

`beforeValidate(value, row, prop, [source])`

Fired before cell validation, only if validator function is defined. This can be used to manipulate the value
of changed cell before it is applied to the validator function.

__Note:__ this will not affect values of changes. This will change value *ONLY* for validation.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | Value of the cell. |
| row | `number` | Visual row index. |
| prop | `string` <br/> `number` | Property name / column index. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](https://handsontable.com/docs/tutorial-using-callbacks.html#page-source-definition)). |



### beforeValueRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L948

:::

`beforeValueRender(value, cellProperties)`

Fired before cell value is rendered into the DOM (through renderer function). This can be used to manipulate the
value which is passed to the renderer without modifying the renderer itself.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | Cell value to render. |
| cellProperties | `object` | An object containing the cell properties. |



### construct
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L958

:::

`construct`

Fired after Handsontable instance is constructed (using `new` operator).



### init
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L965

:::

`init`

Fired after Handsontable instance is initiated but before table is rendered.



### modifyAutoColumnSizeSeed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1911

:::

`modifyAutoColumnSizeSeed(seed, cellProperties, cellValue)`

Fired by [AutoColumnSize](./AutoColumnSize/) plugin within [SampleGenerator](./SampleGenerator/) utility.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| seed | `string` <br/> `undefined` | Seed ID, unique name to categorize samples. |
| cellProperties | `object` | Object containing the cell properties. |
| cellValue | `*` | Value of the cell. |



### modifyAutofillRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1103

:::

`modifyAutofillRange(startArea, entireArea)`

Fired by [Autofill](./autofill/) plugin after setting range of autofill. This hook is fired when [Options#fillHandle](./options/#fillhandle)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| startArea | `Array` | Array of visual coordinates of the starting point for the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |
| entireArea | `Array` | Array of visual coordinates of the entire area of the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |



### modifyColHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L972

:::

`modifyColHeader(column)`

Fired when a column header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column header index. |



### modifyColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1436

:::

`modifyColumnHeaderHeight`

Fired while retrieving the column header height.



### modifyColWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L980

:::

`modifyColWidth(width, column)`

Fired when a column width is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | Current column width. |
| column | `number` | Visual column index. |



### modifyCopyableRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1113

:::

`modifyCopyableRange(copyableRanges)`

Fired to allow modifying the copyable range with a callback function.


| Param | Type | Description |
| --- | --- | --- |
| copyableRanges | `Array<Array>` | Array of objects defining copyable cells. |



### modifyData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1006

:::

`modifyData(row, column, valueHolder, ioMode)`

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row height. |
| column | `number` | Physical column index. |
| valueHolder | `object` | Object which contains original value which can be modified by overwriting `.value` property. |
| ioMode | `string` | String which indicates for what operation hook is fired (`get` or `set`). |



### modifyGetCellCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1037

:::

`modifyGetCellCoords(row, column, topmost)`

Used to modify the cell coordinates when using the `getCell` method, opening editor, getting value from the editor
and saving values from the closed editor.

**Since**: 0.36.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| topmost | `boolean` | If set to `true`, it returns the TD element from the topmost overlay. For example,                          if the wanted cell is in the range of fixed rows, it will return a TD element                          from the `top` overlay. |



### modifyRowData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1029

:::

`modifyRowData(row)`

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |



### modifyRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L989

:::

`modifyRowHeader(row)`

Fired when a row header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row header index. |



### modifyRowHeaderWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1485

:::

`modifyRowHeaderWidth(rowHeaderWidth)`

Fired while retrieving the row header width.


| Param | Type | Description |
| --- | --- | --- |
| rowHeaderWidth | `number` | Row header width. |



### modifyRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L997

:::

`modifyRowHeight(height, row)`

Fired when a row height is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| height | `number` | Row height. |
| row | `number` | Visual row index. |



### modifySourceData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1017

:::

`modifySourceData(row, column, valueHolder, ioMode)`

Fired when a data was retrieved or modified from the source data set.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| column | `number` | Physical column index. |
| valueHolder | `object` | Object which contains original value which can be modified by overwriting `.value` property. |
| ioMode | `string` | String which indicates for what operation hook is fired (`get` or `set`). |



### modifyTransformEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1512

:::

`modifyTransformEnd(delta)`

Fired when the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### modifyTransformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1504

:::

`modifyTransformStart(delta)`

Fired when the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### persistentStateLoad
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1051

:::

`persistentStateLoad(key, valuePlaceholder)`

Fired by [PersistentState](./persistent-state/) plugin, after loading value, saved under given key, from browser local storage. This hook is fired when
[Options#persistentState](./options/#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key. |
| valuePlaceholder | `object` | Object containing the loaded value under `valuePlaceholder.value` (if no value have been saved, `value` key will be undefined). |



### persistentStateReset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1061

:::

`persistentStateReset([key])`

Fired by [PersistentState](./persistent-state/) plugin after resetting data from local storage. If no key is given, all values associated with table will be cleared.
This hook is fired when [Options#persistentState](./options/#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| [key] | `string` | `optional` Key. |



### persistentStateSave
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L1070

:::

`persistentStateSave(key, value)`

Fired by [PersistentState](./persistent-state/) plugin, after saving value under given key in browser local storage. This hook is fired when
[Options#persistentState](./options/#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key. |
| value | `Mixed` | Value to save. |


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2059

:::

`hooks.add(key, callback, [context]) ⇒ [Hooks](./hooks/)`

Adds a listener (globally or locally) to a specified hook name.
If the `context` parameter is provided, the hook will be added only to the instance it references.
Otherwise, the callback will be used everytime the hook fires on any Handsontable instance.
You can provide an array of callback functions as the `callback` argument, this way they will all be fired
once the hook is triggered.

**See**: [Core#addHook](./core/#addHook)  
**Example**  
```js
// single callback, added locally
Handsontable.hooks.add('beforeInit', myCallback, hotInstance);

// single callback, added globally
Handsontable.hooks.add('beforeInit', myCallback);

// multiple callbacks, added locally
Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback], hotInstance);

// multiple callbacks, added globally
Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback]);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | `string` |  | Hook name. |
| callback | `function` <br/> `Array` |  | Callback function or an array of functions. |
| [context] | `object` | <code>null</code> | `optional` The context for the hook callback to be added - a Handsontable instance or leave empty. |


**Returns**: [`Hooks`](#Hooks) - Instance of Hooks.  

### createEmptyBucket
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2004

:::

`hooks.createEmptyBucket() ⇒ object`

Returns a new object with empty handlers related to every registered hook name.

**Example**  
```js
Handsontable.hooks.createEmptyBucket();
// Results:
{
...
afterCreateCol: [],
afterCreateRow: [],
beforeInit: [],
...
}
```

**Returns**: `object` - The empty bucket object.  

### deregister
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2296

:::

`hooks.deregister(key)`

Deregisters a hook name (removes it from the list of known hook names).

**Example**  
```js
Handsontable.hooks.deregister('myHook');
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2263

:::

`hooks.destroy([context])`

Destroy all listeners connected to the context. If no context is provided, the global listeners will be destroyed.

**Example**  
```js
// destroy the global listeners
Handsontable.hooks.destroy();

// destroy the local listeners
Handsontable.hooks.destroy(hotInstance);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [context] | `object` | <code>null</code> | `optional` A Handsontable instance. |



### getBucket
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2019

:::

`hooks.getBucket([context]) ⇒ object`

Get hook bucket based on the context of the object or if argument is `undefined`, get the global hook bucket.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [context] | `object` | <code>null</code> | `optional` A Handsontable instance. |


**Returns**: `object` - Returns a global or Handsontable instance bucket.  

### getRegistered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2358

:::

`hooks.getRegistered() ⇒ Array`

Returns an array of registered hooks.

**Example**  
```js
Handsontable.hooks.getRegistered();

// Results:
[
...
  'beforeInit',
  'beforeRender',
  'beforeSetRangeEnd',
  'beforeDrawBorders',
  'beforeChange',
...
]
```

**Returns**: `Array` - An array of registered hooks.  

### has
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2163

:::

`hooks.has(key, [context]) ⇒ boolean`

Checks whether there are any registered listeners for the provided hook name.
If the `context` parameter is provided, it only checks for listeners assigned to the given Handsontable instance.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | `string` |  | Hook name. |
| [context] | `object` | <code>null</code> | `optional` A Handsontable instance. |


**Returns**: `boolean` - `true` for success, `false` otherwise.  

### isDeprecated
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2316

:::

`hooks.isDeprecated(hookName) ⇒ boolean`

Returns a boolean value depending on if a hook by such name has been removed or deprecated.

**Example**  
```js
Handsontable.hooks.isDeprecated('skipLengthCache');

// Results:
true
```

| Param | Type | Description |
| --- | --- | --- |
| hookName | `string` | The hook name to check. |


**Returns**: `boolean` - Returns `true` if the provided hook name was marked as deprecated or
removed from API, `false` otherwise.  

### isRegistered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2333

:::

`hooks.isRegistered(hookName) ⇒ boolean`

Returns a boolean depending on if a hook by such name has been registered.

**Example**  
```js
Handsontable.hooks.isRegistered('beforeInit');

// Results:
true
```

| Param | Type | Description |
| --- | --- | --- |
| hookName | `string` | The hook name to check. |


**Returns**: `boolean` - `true` for success, `false` otherwise.  

### once
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2117

:::

`hooks.once(key, callback, [context])`

Adds a listener to a specified hook. After the hook runs this listener will be automatically removed from the bucket.

**See**: [Core#addHookOnce](./core/#addHookOnce)  
**Example**  
```js
Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | `string` |  | Hook/Event name. |
| callback | `function` <br/> `Array` |  | Callback function. |
| [context] | `object` | <code>null</code> | `optional` A Handsontable instance. |



### register
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2280

:::

`hooks.register(key)`

Registers a hook name (adds it to the list of the known hook names). Used by plugins.
It is not necessary to call register, but if you use it, your plugin hook will be used returned by
the `getRegistered` method. (which itself is used in the demo https://handsontable.com/docs/tutorial-using-callbacks.html).

**Example**  
```js
Handsontable.hooks.register('myHook');
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |



### remove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2141

:::

`hooks.remove(key, callback, [context]) ⇒ boolean`

Removes a listener from a hook with a given name. If the `context` argument is provided, it removes a listener from a local hook assigned to the given Handsontable instance.

**See**: [Core#removeHook](./core/#removeHook)  
**Example**  
```js
Handsontable.hooks.remove('beforeInit', myCallback);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | `string` |  | Hook/Event name. |
| callback | `function` |  | Callback function (needs the be the function that was previously added to the hook). |
| [context] | `object` | <code>null</code> | `optional` Handsontable instance. |


**Returns**: `boolean` - Returns `true` if hook was removed, `false` otherwise.  

### run
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/pluginHooks.js#L2189

:::

`hooks.run(context, key, [p1], [p2], [p3], [p4], [p5], [p6]) ⇒ *`

Runs all local and global callbacks assigned to the hook identified by the `key` parameter.
It returns either a return value from the last called callback or the first parameter (`p1`) passed to the `run` function.

**See**: [Core#runHooks](./core/#runHooks)  
**Example**  
```js
Handsontable.hooks.run(hot, 'beforeInit');
```

| Param | Type | Description |
| --- | --- | --- |
| context | `object` | Handsontable instance. |
| key | `string` | Hook/Event name. |
| [p1] | `*` | `optional` Parameter to be passed as an argument to the callback function. |
| [p2] | `*` | `optional` Parameter to be passed as an argument to the callback function. |
| [p3] | `*` | `optional` Parameter to be passed as an argument to the callback function. |
| [p4] | `*` | `optional` Parameter to be passed as an argument to the callback function. |
| [p5] | `*` | `optional` Parameter to be passed as an argument to the callback function. |
| [p6] | `*` | `optional` Parameter to be passed as an argument to the callback function. |


**Returns**: `*` - Either a return value from the last called callback or `p1`.  

