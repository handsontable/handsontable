---
title: Hooks
metaTitle: Hooks API reference - JavaScript Data Grid | Handsontable
permalink: /api/hooks
canonicalUrl: /api/hooks
searchCategory: API Reference
hotPlugin: false
editLink: false
id: js126u0h
description: A complete list of Handsontable's API hooks (callbacks) that let you run your code before or after specific data grid actions.
react:
  id: u5rih2o2
  metaTitle: Hooks API reference - React Data Grid | Handsontable
angular:
  id: b7n4p2qw
  metaTitle: Hooks API reference - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### afterAddChild

::: ask-about-api afterAddChild|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2883

:::

_afterAddChild(parent, element, index)_

Fired by [NestedRows](@/api/nestedRows.md) plugin after adding a children to the `NestedRows` structure. This hook is fired when
[Options#nestedRows](@/api/options.md#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | The parent object. |
| element | `object` <br/> `undefined` | The element added as a child. If `undefined`, a blank child was added. |
| index | `number` <br/> `undefined` | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### afterAutofill

::: ask-about-api afterAutofill|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1216

:::

_afterAutofill(fillData, sourceRange, targetRange, direction)_

Fired by [Autofill](@/api/autofill.md) plugin after populating the data in the autofill feature. This hook is fired when
[Options#fillHandle](@/api/options.md#fillhandle) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| fillData | `Array<Array>` | The data that was used to fill the `targetRange`. If `beforeAutofill` was used                            and returned `[[]]`, this will be the same object that was returned from `beforeAutofill`. |
| sourceRange | `CellRange` | The range values will be filled from. |
| targetRange | `CellRange` | The range new values will be filled into. |
| direction | `string` | Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`. |



### afterBeginEditing

::: ask-about-api afterBeginEditing|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3069

:::

_afterBeginEditing(row, column)_

Fired after the editor is opened and rendered.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the edited cell. |
| column | `number` | Visual column index of the edited cell. |



### afterCellMetaReset

::: ask-about-api afterCellMetaReset|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L148

:::

_afterCellMetaReset_

Fired after resetting a cell's meta. This happens when the [Core#updateSettings](@/api/core.md#updatesettings) method is called.



### afterChange

::: ask-about-api afterChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L153

:::

_afterChange(changes, [source])_

Fired after one or more cells has been changed. The changes are triggered in any situation when the
value is entered using an editor or changed using API (e.q [`setDataAtCell`](@/api/core.md#setdataatcell) method).

__Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.

**Example**  
::: only-for javascript
```js
new Handsontable(element, {
  afterChange: (changes) => {
    changes?.forEach(([row, prop, oldValue, newValue]) => {
      // Some logic...
    });
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  afterChange={(changes, source) => {
    changes?.forEach(([row, prop, oldValue, newValue]) => {
      // Some logic...
    });
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  afterChange: (changes, source) => {
    changes?.forEach(([row, prop, oldValue, newValue]) => {
      // Some logic...
    });
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`. `row` is a visual row index. |
| [source] | `string` | `optional` String that identifies source of hook call ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterColumnCollapse

::: ask-about-api afterColumnCollapse|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3149

:::

_afterColumnCollapse(currentCollapsedColumns, destinationCollapsedColumns, collapsePossible, successfullyCollapsed)_

Fired by [CollapsibleColumns](@/api/collapsibleColumns.md) plugin before columns collapse. This hook is fired when [Options#collapsibleColumns](@/api/options.md#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| collapsePossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |
| successfullyCollapsed | `boolean` | `true`, if the action affected any non-collapsible column, `false` otherwise. |



### afterColumnExpand

::: ask-about-api afterColumnExpand|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3169

:::

_afterColumnExpand(currentCollapsedColumns, destinationCollapsedColumns, expandPossible, successfullyExpanded)_

Fired by [CollapsibleColumns](@/api/collapsibleColumns.md) plugin before columns expand. This hook is fired when [Options#collapsibleColumns](@/api/options.md#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| expandPossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |
| successfullyExpanded | `boolean` | `true`, if the action affected any non-collapsible column, `false` otherwise. |



### afterColumnFreeze

::: ask-about-api afterColumnFreeze|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2143

:::

_afterColumnFreeze(column, freezePerformed)_

Fired by the [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin, right after freezing a column.

**Since**: 12.1.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual index of the frozen column. |
| freezePerformed | `boolean` | If `true`: the column got successfully frozen. If `false`: the column didn't get frozen. |



### afterColumnMove

::: ask-about-api afterColumnMove|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2169

:::

_afterColumnMove(movedColumns, finalIndex, dropIndex, movePossible, orderChanged)_

Fired by [ManualColumnMove](@/api/manualColumnMove.md) plugin after changing order of the visual indexes.
This hook is fired when [Options#manualColumnMove](@/api/options.md#manualcolumnmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns.                            Points to where the elements will be placed after the moving action.                            To check visualization of final index please take a look at                            [documentation](@/guides/columns/column-moving/column-moving.md). |
| dropIndex | `number` <br/> `undefined` | Visual column index, being a drop index for the moved columns.                                     Points to where we are going to drop the moved elements.                                     To check visualization of drop index please take a look at                                     [documentation](@/guides/columns/column-moving/column-moving.md).                                     It's `undefined` when `dragColumns` function wasn't called. |
| movePossible | `boolean` | Indicates if it was possible to move columns to the desired position. |
| orderChanged | `boolean` | Indicates if order of columns was changed by move. |



### afterColumnResize

::: ask-about-api afterColumnResize|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2250

:::

_afterColumnResize(newSize, column, isDoubleClick)_

Fired by [ManualColumnResize](@/api/manualColumnResize.md) plugin after rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](@/api/options.md#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new column width. |
| column | `number` | Visual index of the resized column. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |



### afterColumnSequenceCacheUpdate

::: ask-about-api afterColumnSequenceCacheUpdate|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L312

:::

_afterColumnSequenceCacheUpdate(indexesChangesState)_

Fired after the cache of the column sequence has been updated.

**Since**: 16.2.0  

| Param | Type | Description |
| --- | --- | --- |
| indexesChangesState | `object` | Object containing information about the changes to the column sequence. |
| indexesChangesState.indexesSequenceChanged | `boolean` | Indicates if the sequence of indexes has changed. |
| indexesChangesState.trimmedIndexesChanged | `boolean` | Indicates if the trimmed indexes have changed. |
| indexesChangesState.hiddenIndexesChanged | `boolean` | Indicates if the hidden indexes have changed. |



### afterColumnSequenceChange

::: ask-about-api afterColumnSequenceChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L322

:::

_afterColumnSequenceChange([source])_

Fired after the order of columns has changed.
This hook is fired by changing column indexes of any type supported by the [IndexMapper](@/api/indexMapper.md).


| Param | Type | Description |
| --- | --- | --- |
| [source] | `'init'` <br/> `'remove'` <br/> `'insert'` <br/> `'move'` <br/> `'update'` | `optional` A string that indicates what caused the change to the order of columns. |



### afterColumnSort

::: ask-about-api afterColumnSort|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1844

:::

_afterColumnSort(currentSortConfig, destinationSortConfigs)_

Fired by [ColumnSorting](@/api/columnSorting.md) and [MultiColumnSorting](@/api/multiColumnSorting.md) plugins after sorting the column. This hook is fired when [Options#columnSorting](@/api/options.md#columnsorting)
or [Options#multiColumnSorting](@/api/options.md#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | `Array` | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | `Array` | Destination sort configuration (for all sorted columns). |



### afterColumnUnfreeze

::: ask-about-api afterColumnUnfreeze|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2196

:::

_afterColumnUnfreeze(column, unfreezePerformed)_

Fired by the [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin, right after unfreezing a column.

**Since**: 12.1.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual index of the unfrozen column. |
| unfreezePerformed | `boolean` | If `true`: the column got successfully unfrozen. If `false`: the column didn't get unfrozen. |



### afterContextMenuDefaultOptions

::: ask-about-api afterContextMenuDefaultOptions|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L203

:::

_afterContextMenuDefaultOptions(predefinedItems)_

Fired each time user opens [ContextMenu](@/api/contextMenu.md) and after setting up the context menu's default options. These options are a collection
which user can select by setting an array of keys or an array of objects in [Options#contextMenu](@/api/options.md#contextmenu) option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | `Array` | An array of objects containing information about the pre-defined context menu items. |



### afterContextMenuHide

::: ask-about-api afterContextMenuHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L234

:::

_afterContextMenuHide(context)_

Fired by [ContextMenu](@/api/contextMenu.md) plugin after hiding the context menu. This hook is fired when [Options#contextMenu](@/api/options.md#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The [ContextMenu](@/api/contextMenu.md) plugin instance. |



### afterContextMenuShow

::: ask-about-api afterContextMenuShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L248

:::

_afterContextMenuShow(context)_

Fired by [ContextMenu](@/api/contextMenu.md) plugin after opening the context menu. This hook is fired when [Options#contextMenu](@/api/options.md#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The [ContextMenu](@/api/contextMenu.md) plugin instance. |



### afterCopy

::: ask-about-api afterCopy|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2039

:::

_afterCopy(data, coords, copiedHeadersCount)_

Fired by [CopyPaste](@/api/copyPaste.md) plugin after data are pasted into table. This hook is fired when [Options#copyPaste](@/api/options.md#copypaste)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains the copied data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                         which was copied. |
| copiedHeadersCount | `Object` | (Since 12.3.0) The number of copied column headers. |



### afterCopyLimit

::: ask-about-api afterCopyLimit|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L255

:::

_afterCopyLimit(selectedRows, selectedColumns, copyRowsLimit, copyColumnsLimit)_

Fired by [CopyPaste](@/api/copyPaste.md) plugin after reaching the copy limit while copying data. This hook is fired when
[Options#copyPaste](@/api/options.md#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| selectedRows | `number` | Count of selected copyable rows. |
| selectedColumns | `number` | Count of selected copyable columns. |
| copyRowsLimit | `number` | Current copy rows limit. |
| copyColumnsLimit | `number` | Current copy columns limit. |



### afterCreateCol

::: ask-about-api afterCreateCol|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L329

:::

_afterCreateCol(index, amount, [source])_

Fired after created a new column.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created column in the data source. |
| amount | `number` | Number of newly created columns in the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterCreateRow

::: ask-about-api afterCreateRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L348

:::

_afterCreateRow(index, amount, [source])_

Fired after created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created row in the data source array. |
| amount | `number` | Number of newly created rows in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterCut

::: ask-about-api afterCut|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1943

:::

_afterCut(data, coords)_

Fired by [CopyPaste](@/api/copyPaste.md) plugin after data was cut out from the table. This hook is fired when
[Options#copyPaste](@/api/options.md#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays with the cut data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which was cut out. |



### afterDataProviderFetch

::: ask-about-api afterDataProviderFetch|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L471

:::

_afterDataProviderFetch(result)_

Fired after the dataProvider has fetched and loaded data.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| result | `object` | Result object: `{ rows, totalRows, queryParameters, columnSortConfig, filtersConditionsStack }`. |



### afterDataProviderFetchAbort

::: ask-about-api afterDataProviderFetchAbort|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L486

:::

_afterDataProviderFetchAbort(queryParameters, reason)_

Fired after a dataProvider `fetchRows` request ends without loading data because it was aborted
(superseded by a newer fetch, `AbortSignal`, or plugin disable/destroy).

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| queryParameters | `object` | The query parameters that were used for the aborted request. |
| reason | `Error` <br/> `undefined` | Abort reason when available (e.g. `AbortError`). |



### afterDataProviderFetchError

::: ask-about-api afterDataProviderFetchError|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L478

:::

_afterDataProviderFetchError(error, queryParameters)_

Fired when the dataProvider fetch throws an error (e.g. network error).

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| error | `Error` | The thrown error. |
| queryParameters | `object` | The query parameters that were used for the request. |



### afterDeselect

::: ask-about-api afterDeselect|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L371

:::

_afterDeselect_

Fired after all selected cells are deselected.



### afterDestroy

::: ask-about-api afterDestroy|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L376

:::

_afterDestroy_

Fired after destroying the Handsontable instance.



### afterDetachChild

::: ask-about-api afterDetachChild|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2900

:::

_afterDetachChild(parent, element, finalElementPosition)_

Fired by [NestedRows](@/api/nestedRows.md) plugin after detaching a child from its parent. This hook is fired when
[Options#nestedRows](@/api/options.md#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | An object representing the parent from which the element was detached. |
| element | `object` | The detached element. |
| finalElementPosition | `number` | The final row index of the detached element. |



### afterDialogFocus

::: ask-about-api afterDialogFocus|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2968

:::

_afterDialogFocus(focusSource)_

Fired by [Dialog](@/api/dialog.md) plugin when the focus is set. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| focusSource | `'tab_from_above'` <br/> `'tab_from_below'` <br/> `'click'` <br/> `'show'` | The source of the focus. |



### afterDialogHide

::: ask-about-api afterDialogHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2926

:::

_afterDialogHide_

Fired by [Dialog](@/api/dialog.md) plugin after hiding the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### afterDialogShow

::: ask-about-api afterDialogShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2933

:::

_afterDialogShow_

Fired by [Dialog](@/api/dialog.md) plugin after showing the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### afterDocumentKeyDown

::: ask-about-api afterDocumentKeyDown|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L381

:::

_afterDocumentKeyDown(event)_

Hook fired after `keydown` event is handled.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | A native `keydown` event object. |



### afterDrawSelection

::: ask-about-api afterDrawSelection|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L387

:::

_afterDrawSelection(currentRow, currentColumn, cornersOfSelection, layerLevel) ⇒ string | undefined_

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

::: ask-about-api afterDropdownMenuDefaultOptions|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L218

:::

_afterDropdownMenuDefaultOptions(predefinedItems)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin after setting up the dropdown menu's default options. These options are a
collection which user can select by setting an array of keys or an array of objects in [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | `Array<object>` | An array of objects containing information about the pre-defined dropdown menu items. |



### afterDropdownMenuHide

::: ask-about-api afterDropdownMenuHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2867

:::

_afterDropdownMenuHide(instance)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin after hiding the dropdown menu. This hook is fired when [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| instance | `DropdownMenu` | The `DropdownMenu` instance. |



### afterDropdownMenuShow

::: ask-about-api afterDropdownMenuShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2860

:::

_afterDropdownMenuShow(dropdownMenu)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin after opening the dropdown menu. This hook is fired when [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | `DropdownMenu` | The `DropdownMenu` instance. |



### afterEmptyDataStateHide

::: ask-about-api afterEmptyDataStateHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3027

:::

_afterEmptyDataStateHide_

Fired by [EmptyDataState](@/api/emptyDataState.md) plugin after hiding the empty data state overlay. This hook is fired when [Options#emptyDataState](@/api/options.md#emptydatastate)
option is enabled.

**Since**: 16.2.0  


### afterEmptyDataStateShow

::: ask-about-api afterEmptyDataStateShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3013

:::

_afterEmptyDataStateShow_

Fired by [EmptyDataState](@/api/emptyDataState.md) plugin after showing the empty data state overlay. This hook is fired when [Options#emptyDataState](@/api/options.md#emptydatastate)
option is enabled.

**Since**: 16.2.0  


### afterFilter

::: ask-about-api afterFilter|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2414

:::

_afterFilter(conditionsStack)_

Fired by the [`Filters`](@/api/filters.md) plugin,
after a [column filter](@/guides/columns/column-filter/column-filter.md) gets applied.

[`afterFilter`](#afterfilter) takes one argument (`conditionsStack`), which is an array of objects.
Each object represents one of your [column filters](@/api/filters.md#addcondition),
and consists of the following properties:

| Property     | Possible values                                                         | Description                                                                                                              |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `column`     | Number                                                                  | A visual index of the column to which the filter was applied.                                                            |
| `conditions` | Array of objects                                                        | Each object represents one condition. For details, see [`addCondition()`](@/api/filters.md#addcondition).                |
| `operation`  | `'conjunction'` \| `'disjunction'` \| `'disjunctionWithExtraCondition'` | An operation to perform on your set of `conditions`. For details, see [`addCondition()`](@/api/filters.md#addcondition). |

An example of the format of the `conditionsStack` argument:

```js
[
  {
    column: 2,
    conditions: [
      {name: 'begins_with', args: [['S']]}
    ],
    operation: 'conjunction'
  },
  {
    column: 4,
    conditions: [
      {name: 'not_empty', args: []}
    ],
    operation: 'conjunction'
  },
]
```

Read more:
- [Guides: Column filter](@/guides/columns/column-filter/column-filter.md)
- [Hooks: `beforeFilter`](#beforefilter)
- [Options: `filters`](@/api/options.md#filters)
- [Plugins: `Filters`](@/api/filters.md)
– [Plugin methods: `addCondition()`](@/api/filters.md#addcondition)


| Param | Type | Description |
| --- | --- | --- |
| conditionsStack | `Array<object>` | An array of objects with your [column filters](@/api/filters.md#addcondition). |



### afterFormulasValuesUpdate

::: ask-about-api afterFormulasValuesUpdate|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2525

:::

_afterFormulasValuesUpdate(changes)_

Fired by the [Formulas](@/api/formulas.md) plugin, when any cell value changes.

Returns an array of objects that contains:
- The addresses (`sheet`, `row`, `col`) and new values (`newValue`) of the changed cells.
- The addresses and new values of any cells that had to be recalculated (because their formulas depend on the cells that changed).

This hook gets also fired on Handsontable's initialization, returning the addresses and values of all cells.

Read more:
- [Guides: Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [HyperFormula documentation: `valuesUpdated`](https://hyperformula.handsontable.com/api/interfaces/listeners.html#valuesupdated)

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | The addresses and new values of all the changed and recalculated cells. |



### afterGetCellMeta

::: ask-about-api afterGetCellMeta|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L412

:::

_afterGetCellMeta(row, column, cellProperties)_

Fired after getting the cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| cellProperties | `object` | Object containing the cell properties. |



### afterGetColHeader

::: ask-about-api afterGetColHeader|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L420

:::

_afterGetColHeader(column, TH, [headerLevel])_

Fired after retrieving information about a column header and appending it to the table header.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| TH | `HTMLTableCellElement` |  | Header's TH element. |
| [headerLevel] | `number` | <code>0</code> | `optional` (Since 12.2.0) Header level index. Accepts positive (0 to n)                                 and negative (-1 to -n) values. For positive values, 0 points to the                                 topmost header. For negative values, -1 points to the bottom-most                                 header (the header closest to the cells). |



### afterGetColumnHeaderRenderers

::: ask-about-api afterGetColumnHeaderRenderers|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2278

:::

_afterGetColumnHeaderRenderers(renderers)_

Fired after getting the column header renderers.

The `renderers` array initially contains one renderer function when [`colHeaders`](@/api/options.md#colheaders)
is enabled, or zero functions when it is disabled. Each function in the array renders one layer of
column headers above the grid. By pushing additional renderer functions to the array, you can display
more than one layer of column headers simultaneously.

Each renderer function receives the following arguments:

| Argument               | Type                    | Description                                |
| ---------------------- | ----------------------- | ------------------------------------------ |
| `renderedColumnIndex`  | `number`                | The renderable index of the column.        |
| `TH`                   | `HTMLTableCellElement`  | The `<th>` element to modify.              |

```js
new Handsontable(container, {
  colHeaders: true,
  afterGetColumnHeaderRenderers(renderers) {
    // Add a second layer of column headers above the default one.
    renderers.push((renderedColumnIndex, TH) => {
      TH.innerText = `Extra: ${renderedColumnIndex}`;
    });
  },
});
```

Read more:
- [Options: `colHeaders`](@/api/options.md#colheaders)
- [Guides: Column header](@/guides/columns/column-header/column-header.md)


| Param | Type | Description |
| --- | --- | --- |
| renderers | `Array<function()>` | An array of the column header renderers. |



### afterGetRowHeader

::: ask-about-api afterGetRowHeader|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L431

:::

_afterGetRowHeader(row, TH)_

Fired after retrieving information about a row header and appending it to the table header.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| TH | `HTMLTableCellElement` | Header's TH element. |



### afterGetRowHeaderRenderers

::: ask-about-api afterGetRowHeaderRenderers|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2312

:::

_afterGetRowHeaderRenderers(renderers)_

Fired after getting the row header renderers.

The `renderers` array initially contains one renderer function when [`rowHeaders`](@/api/options.md#rowheaders)
is enabled, or zero functions when it is disabled. Each function in the array renders one layer of
row headers to the left of the grid. By pushing additional renderer functions to the array, you can display
more than one layer of row headers simultaneously.

Each renderer function receives the following arguments:

| Argument              | Type                    | Description                             |
| --------------------- | ----------------------- | --------------------------------------- |
| `renderableRowIndex`  | `number`                | The renderable index of the row.        |
| `TH`                  | `HTMLTableCellElement`  | The `<th>` element to modify.           |

```js
new Handsontable(container, {
  rowHeaders: true,
  afterGetRowHeaderRenderers(renderers) {
    // Add a second layer of row headers next to the default one.
    renderers.push((renderableRowIndex, TH) => {
      TH.innerText = `Extra: ${renderableRowIndex}`;
    });
  },
});
```

Read more:
- [Options: `rowHeaders`](@/api/options.md#rowheaders)
- [Guides: Row header](@/guides/rows/row-header/row-header.md)


| Param | Type | Description |
| --- | --- | --- |
| renderers | `Array<function()>` | An array of the row header renderers. |



### afterHideColumns

::: ask-about-api afterHideColumns|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2787

:::

_afterHideColumns(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)_

Fired by [HiddenColumns](@/api/hiddenColumns.md) plugin after marking the columns as hidden. Fired only if the [Options#hiddenColumns](@/api/options.md#hiddencolumns) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any non-hidden columns, `false` otherwise. |



### afterHideRows

::: ask-about-api afterHideRows|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2749

:::

_afterHideRows(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)_

Fired by [HiddenRows](@/api/hiddenRows.md) plugin after marking the rows as hidden. Fired only if the [Options#hiddenRows](@/api/options.md#hiddenrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any non-hidden rows, `false` otherwise. |



### afterInit

::: ask-about-api afterInit|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L438

:::

_afterInit_

Fired after the Handsontable instance is initiated.



### afterLanguageChange

::: ask-about-api afterLanguageChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1195

:::

_afterLanguageChange(languageCode)_

Fired after successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | `string` | New language code. |



### afterListen

::: ask-about-api afterListen|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3109

:::

_afterListen_

Fired after the table was switched into listening mode. This allows Handsontable to capture keyboard events and
respond in the right way.



### afterLoadData

::: ask-about-api afterLoadData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L443

:::

_afterLoadData(sourceData, initialLoad, source)_

Fired after Handsontable's [`data`](@/api/options.md#data)
gets modified by the [`loadData()`](@/api/core.md#loaddata) method
or the [`updateSettings()`](@/api/core.md#updatesettings) method.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)


| Param | Type | Description |
| --- | --- | --- |
| sourceData | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data |
| initialLoad | `boolean` | A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`) |
| source | `string` | The source of the call |



### afterLoadingHide

::: ask-about-api afterLoadingHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2999

:::

_afterLoadingHide_

Fired by [Loading](@/api/loading.md) plugin after hiding the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled.

**Since**: 16.1.0  


### afterLoadingShow

::: ask-about-api afterLoadingShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2984

:::

_afterLoadingShow_

Fired by [Loading](@/api/loading.md) plugin after showing the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled.

**Since**: 16.1.0  


### afterMergeCells

::: ask-about-api afterMergeCells|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3084

:::

_afterMergeCells(cellRange, mergeParent, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin after cell merging. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| mergeParent | `object` |  | The parent collection of the provided cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterModifyTransformEnd

::: ask-about-api afterModifyTransformEnd|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2708

:::

_afterModifyTransformEnd(coords, rowTransformDir, colTransformDir)_

Fired after the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords of the freshly selected cell. |
| rowTransformDir | `number` | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterModifyTransformFocus

::: ask-about-api afterModifyTransformFocus|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2691

:::

_afterModifyTransformFocus(coords, rowTransformDir, colTransformDir)_

Fired after the focus of the selection is being modified (e.g. Moving the focus with the enter/tab keys).

**Since**: 14.3.0  

| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coords of the freshly focused cell. |
| rowTransformDir | `number` | `-1` if trying to focus a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to focus a cell with a negative column index. `0` otherwise. |



### afterModifyTransformStart

::: ask-about-api afterModifyTransformStart|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2700

:::

_afterModifyTransformStart(coords, rowTransformDir, colTransformDir)_

Fired after the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coords of the freshly selected cell. |
| rowTransformDir | `number` | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterMomentumScroll

::: ask-about-api afterMomentumScroll|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L529

:::

_afterMomentumScroll_

Fired after a scroll event, which is identified as a momentum scroll (e.g. on an iPad).



### afterNamedExpressionAdded

::: ask-about-api afterNamedExpressionAdded|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2542

:::

_afterNamedExpressionAdded(namedExpressionName, changes)_

Fired by the [Formulas](@/api/formulas.md) plugin when a named expression is added to the engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| namedExpressionName | `string` | The name of the added expression. |
| changes | `Array` | The values and location of applied changes. |



### afterNamedExpressionRemoved

::: ask-about-api afterNamedExpressionRemoved|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2550

:::

_afterNamedExpressionRemoved(namedExpressionName, changes)_

Fired by the [Formulas](@/api/formulas.md) plugin when a named expression is removed from the engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| namedExpressionName | `string` | The name of the removed expression. |
| changes | `Array` | The values and location of applied changes. |



### afterNotificationHide

::: ask-about-api afterNotificationHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3062

:::

_afterNotificationHide(id)_

Fired by [Notification](@/api/notification.md) plugin after a toast is hidden.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| id | `string` | Toast id. |



### afterNotificationShow

::: ask-about-api afterNotificationShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3044

:::

_afterNotificationShow(id, options)_

Fired by [Notification](@/api/notification.md) plugin after a toast is shown.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| id | `string` | Toast id. |
| options | `object` | Normalized toast options. |



### afterOnCellContextMenu

::: ask-about-api afterOnCellContextMenu|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L570

:::

_afterOnCellContextMenu(event, coords, TD)_

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

::: ask-about-api afterOnCellCornerDblClick|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L540

:::

_afterOnCellCornerDblClick(event)_

Fired after a `dblclick` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `dblclick` event object. |



### afterOnCellCornerMouseDown

::: ask-about-api afterOnCellCornerMouseDown|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L534

:::

_afterOnCellCornerMouseDown(event)_

Fired after a `mousedown` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mousedown` event object. |



### afterOnCellMouseDown

::: ask-about-api afterOnCellMouseDown|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L546

:::

_afterOnCellMouseDown(event, coords, TD)_

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

::: ask-about-api afterOnCellMouseOut|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L594

:::

_afterOnCellMouseOut(event, coords, TD)_

Fired after leaving a cell or row/column header with the mouse cursor.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseout` event object. |
| coords | `CellCoords` | Leaved cell's visual coordinate object. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseOver

::: ask-about-api afterOnCellMouseOver|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L582

:::

_afterOnCellMouseOver(event, coords, TD)_

Fired after hovering a cell or row/column header with the mouse cursor. In case the row/column header was
hovered, the index is negative.

For example, hovering over the row header of cell (0, 0) results with `afterOnCellMouseOver` called
with coords `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseover` event object. |
| coords | `CellCoords` | Hovered cell's visual coordinate object. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseOverOutside

::: ask-about-api afterOnCellMouseOverOutside|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L602

:::

_afterOnCellMouseOverOutside(event, coords, TD)_

Fired after the mouse cursor moves outside the visible viewport while a mouse button is held down
(e.g. during a drag-to-scroll operation). The event fires once per mousemove tick for as long as
the cursor remains outside the viewport.

**Since**: 17.2.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mousemove` event object. |
| coords | `CellCoords` | Visual coordinates of the nearest viewport-edge cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseUp

::: ask-about-api afterOnCellMouseUp|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L558

:::

_afterOnCellMouseUp(event, coords, TD)_

Fired after clicking on a cell or row/column header. In case the row/column header was clicked, the coordinate
indexes are negative.

For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseUp` called
with coordinates `{row: 0, col: -1}`.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseup` event object. |
| coords | `CellCoords` | Coordinates object containing the visual row and visual column indexes of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterPageChange

::: ask-about-api afterPageChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2469

:::

_afterPageChange(oldPage, newPage)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the page. This hook is fired when
[Options#pagination](@/api/options.md#pagination) option is enabled. When a complete [[Options#dataProvider]] configuration
handles paging, [DataProvider](@/api/dataProvider.md) loads the requested page via `fetchRows`. [Pagination](@/api/pagination.md) then aligns its
UI from [[Hooks#afterDataProviderFetch]].

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| oldPage | `number` | The old page number. |
| newPage | `number` | The new page number. |



### afterPageCounterVisibilityChange

::: ask-about-api afterPageCounterVisibilityChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2509

:::

_afterPageCounterVisibilityChange(isVisible)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the visibility state of the page counter section.
This hook is fired when [Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | The visibility state of the page size section. |



### afterPageNavigationVisibilityChange

::: ask-about-api afterPageNavigationVisibilityChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2517

:::

_afterPageNavigationVisibilityChange(isVisible)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the visibility state of the page navigation section.
This hook is fired when [Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | The visibility state of the page size section. |



### afterPageSizeChange

::: ask-about-api afterPageSizeChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2490

:::

_afterPageSizeChange(oldPageSize, newPageSize)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the page size. This hook is fired when
[Options#pagination](@/api/options.md#pagination) option is enabled. When a complete [[Options#dataProvider]] configuration
handles paging, [DataProvider](@/api/dataProvider.md) loads page 1 for the new size via `fetchRows`. [Pagination](@/api/pagination.md) then aligns
its UI from [[Hooks#afterDataProviderFetch]].

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| oldPageSize | `number` <br/> `'auto'` | The old page size. |
| newPageSize | `number` <br/> `'auto'` | The new page size. |



### afterPageSizeVisibilityChange

::: ask-about-api afterPageSizeVisibilityChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2501

:::

_afterPageSizeVisibilityChange(isVisible)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the visibility state of the page size section.
This hook is fired when [Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | The visibility state of the page size section. |



### afterPaste

::: ask-about-api afterPaste|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2125

:::

_afterPaste(data, coords)_

Fired by [CopyPaste](@/api/copyPaste.md) plugin after values are pasted into table. This hook is fired when
[Options#copyPaste](@/api/options.md#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays with the pasted data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |



### afterPluginsInitialized

::: ask-about-api afterPluginsInitialized|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2728

:::

_afterPluginsInitialized_

Fired after initializing all the plugins.
This hook should be added before Handsontable is initialized.

**Example**  
```js
Handsontable.hooks.add('afterPluginsInitialized', myCallback);
```


### afterRedo

::: ask-about-api afterRedo|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2650

:::

_afterRedo(action)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |



### afterRedoStackChange

::: ask-about-api afterRedoStackChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2658

:::

_afterRedoStackChange(undoneActionsBefore, undoneActionsAfter)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after changing redo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| undoneActionsBefore | `Array` | Stack of actions which could be redone before performing new action. |
| undoneActionsAfter | `Array` | Stack of actions which can be redone after performing new action. |



### afterRefreshDimensions

::: ask-about-api afterRefreshDimensions|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3121

:::

_afterRefreshDimensions(previousDimensions, currentDimensions, stateChanged)_

Fired after the window was resized or the size of the Handsontable root element was changed.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | `Object` | Previous dimensions of the container. |
| currentDimensions | `Object` | Current dimensions of the container. |
| stateChanged | `boolean` | `true`, if the container was re-render, `false` otherwise. |



### afterRemoveCellMeta

::: ask-about-api afterRemoveCellMeta|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1121

:::

_afterRemoveCellMeta(row, column, key, value)_

Fired after cell meta is removed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The removed meta key. |
| value | `*` | Value which was under removed key of cell meta. |



### afterRemoveCol

::: ask-about-api afterRemoveCol|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L613

:::

_afterRemoveCol(index, amount, physicalColumns, [source])_

Fired after one or more columns are removed.

When consecutive columns are removed, this hook is fired once with the `amount` reflecting
the total number of removed columns. When non-consecutive columns are removed (for example,
by selecting columns with Ctrl/Cmd held), this hook is fired separately for each removed
column, with `amount` equal to `1` each time. This is by design.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter column. |
| amount | `number` | An amount of removed columns. |
| physicalColumns | `Array<number>` | An array of physical columns removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterRemoveRow

::: ask-about-api afterRemoveRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L628

:::

_afterRemoveRow(index, amount, physicalRows, [source])_

Fired after one or more rows are removed.

When consecutive rows are removed, this hook is fired once with the `amount` reflecting
the total number of removed rows. When non-consecutive rows are removed (for example,
by selecting rows with Ctrl/Cmd held), this hook is fired separately for each removed
row, with `amount` equal to `1` each time. This is by design.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter row. |
| amount | `number` | An amount of removed rows. |
| physicalRows | `Array<number>` | An array of physical rows removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterRender

::: ask-about-api afterRender|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1572

:::

_afterRender(isForced)_

Fired after Handsontable's view-rendering engine updates the view.


| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | If set to `true`, the rendering gets triggered by a change of settings, a change of                           data, or a logic that needs a full Handsontable render cycle.                           If set to `false`, the rendering gets triggered by scrolling or moving the selection. |



### afterRenderer

::: ask-about-api afterRenderer|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L654

:::

_afterRenderer(TD, row, column, prop, value, cellProperties)_

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

::: ask-about-api afterRowMove|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2222

:::

_afterRowMove(movedRows, finalIndex, dropIndex, movePossible, orderChanged)_

Fired by [ManualRowMove](@/api/manualRowMove.md) plugin after changing the order of the visual indexes.
This hook is fired when [Options#manualRowMove](@/api/options.md#manualrowmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows.                            Points to where the elements will be placed after the moving action.                            To check visualization of final index please take a look at                            [documentation](@/guides/rows/row-moving/row-moving.md). |
| dropIndex | `number` <br/> `undefined` | Visual row index, being a drop index for the moved rows.                                     Points to where we are going to drop the moved elements.                                     To check visualization of drop index please take a look at                                     [documentation](@/guides/rows/row-moving/row-moving.md).                                     It's `undefined` when `dragRows` function wasn't called. |
| movePossible | `boolean` | Indicates if it was possible to move rows to the desired position. |
| orderChanged | `boolean` | Indicates if order of rows was changed by move. |



### afterRowResize

::: ask-about-api afterRowResize|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2269

:::

_afterRowResize(newSize, row, isDoubleClick)_

Fired by [ManualRowResize](@/api/manualRowResize.md) plugin after rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](@/api/options.md#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new row height. |
| row | `number` | Visual index of the resized row. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |



### afterRowSequenceCacheUpdate

::: ask-about-api afterRowSequenceCacheUpdate|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L665

:::

_afterRowSequenceCacheUpdate(indexesChangesState)_

Fired after the cache of the row sequence has been updated.

**Since**: 16.2.0  

| Param | Type | Description |
| --- | --- | --- |
| indexesChangesState | `object` | Object containing information about the changes to the row sequence. |
| indexesChangesState.indexesSequenceChanged | `boolean` | Indicates if the sequence of indexes has changed. |
| indexesChangesState.trimmedIndexesChanged | `boolean` | Indicates if the trimmed indexes have changed. |
| indexesChangesState.hiddenIndexesChanged | `boolean` | Indicates if the hidden indexes have changed. |



### afterRowSequenceChange

::: ask-about-api afterRowSequenceChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L675

:::

_afterRowSequenceChange([source])_

Fired after the order of rows has changed.
This hook is fired by changing row indexes of any type supported by the [IndexMapper](@/api/indexMapper.md).


| Param | Type | Description |
| --- | --- | --- |
| [source] | `'init'` <br/> `'remove'` <br/> `'insert'` <br/> `'move'` <br/> `'update'` | `optional` A string that indicates what caused the change to the order of rows. |



### afterRowsMutation

::: ask-about-api afterRowsMutation|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L512

:::

_afterRowsMutation(operation, payload)_

Fired after rows mutation (create, update, remove) succeeds on the server.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| operation | `string` | One of `'create'`, `'update'`, `'remove'`. |
| payload | `object` | Operation-specific payload. |



### afterRowsMutationError

::: ask-about-api afterRowsMutationError|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L520

:::

_afterRowsMutationError(operation, error, payload)_

Fired when rows mutation (create, update, remove) fails on the server.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| operation | `string` | One of `'create'`, `'update'`, `'remove'`. |
| error | `Error` | The thrown error. |
| payload | `object` | Operation-specific payload. |



### afterScroll

::: ask-about-api afterScroll|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L726

:::

_afterScroll_

Fired after the vertical or horizontal scroll event.

**Since**: 14.0.0  


### afterScrollHorizontally

::: ask-about-api afterScrollHorizontally|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L716

:::

_afterScrollHorizontally_

Fired after the horizontal scroll event.



### afterScrollVertically

::: ask-about-api afterScrollVertically|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L721

:::

_afterScrollVertically_

Fired after the vertical scroll event.



### afterSelectAll

::: ask-about-api afterSelectAll|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1103

:::

_afterSelectAll(from, to, [highlight])_

Fired after all cells are selected (e.g. during mouse corner click or [Core#selectAll](@/api/core.md#selectall) API call).

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| from | `CellCoords` | Selection start coords object. |
| to | `CellCoords` | Selection end coords object. |
| [highlight] | `CellCoords` | `optional` Selection cell focus coords object. |



### afterSelectColumns

::: ask-about-api afterSelectColumns|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L985

:::

_afterSelectColumns(from, to, highlight)_

Fired after one or more columns are selected (e.g. during mouse header click or [Core#selectColumns](@/api/core.md#selectcolumns) API call).

**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| from | `CellCoords` | Selection start coords object. |
| to | `CellCoords` | Selection end coords object. |
| highlight | `CellCoords` | Selection cell focus coords object. |



### afterSelection

::: ask-about-api afterSelection|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L732

:::

_afterSelection(row, column, row2, column2, preventScrolling, selectionLayerLevel)_

Fired after one or more cells are selected (e.g. during mouse move).

**Example**  
::: only-for javascript
```js
new Handsontable(element, {
  afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // If set to `false` (default): when cell selection is outside the viewport,
    // Handsontable scrolls the viewport to cell selection's end corner.
    // If set to `true`: when cell selection is outside the viewport,
    // Handsontable doesn't scroll to cell selection's end corner.
    preventScrolling.value = true;
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  afterSelection={(row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // If set to `false` (default): when cell selection is outside the viewport,
    // Handsontable scrolls the viewport to cell selection's end corner.
    // If set to `true`: when cell selection is outside the viewport,
    // Handsontable doesn't scroll to cell selection's end corner.
    preventScrolling.value = true;
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  afterSelection: (
    row,
    column,
    row2,
    column2,
    preventScrolling,
    selectionLayerLevel
  ) => {
    // If set to `false` (default): when cell selection is outside the viewport,
    // Handsontable scrolls the viewport to cell selection's end corner.
    // If set to `true`: when cell selection is outside the viewport,
    // Handsontable doesn't scroll to cell selection's end corner.
    preventScrolling.value = true;
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| column | `number` | Selection start visual column index. |
| row2 | `number` | Selection end visual row index. |
| column2 | `number` | Selection end visual column index. |
| preventScrolling | `object` | A reference to the observable object with the `value` property.                                  Property `preventScrolling.value` expects a boolean value that                                  Handsontable uses to control scroll behavior after selection. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionByProp

::: ask-about-api afterSelectionByProp|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L798

:::

_afterSelectionByProp(row, prop, row2, prop2, preventScrolling, selectionLayerLevel)_

Fired after one or more cells are selected.

The `prop` and `prop2` arguments represent the source object property name instead of the column number.

**Example**  
```js
::: only-for javascript
new Handsontable(element, {
  afterSelectionByProp: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // setting if prevent scrolling after selection
    preventScrolling.value = true;
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  afterSelectionByProp={(row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // setting if prevent scrolling after selection
    preventScrolling.value = true;
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  afterSelectionByProp: (
    row,
    column,
    row2,
    column2,
    preventScrolling,
    selectionLayerLevel
  ) => {
    // Setting if prevent scrolling after selection
    preventScrolling.value = true;
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| prop | `string` | Selection start data source object property name. |
| row2 | `number` | Selection end visual row index. |
| prop2 | `string` | Selection end data source object property name. |
| preventScrolling | `object` | A reference to the observable object with the `value` property.                                  Property `preventScrolling.value` expects a boolean value that                                  Handsontable uses to control scroll behavior after selection. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionEnd

::: ask-about-api afterSelectionEnd|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L857

:::

_afterSelectionEnd(row, column, row2, column2, selectionLayerLevel)_

Fired after one or more cells are selected (e.g. on mouse up).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| column | `number` | Selection start visual column index. |
| row2 | `number` | Selection end visual row index. |
| column2 | `number` | Selection end visual column index. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionEndByProp

::: ask-about-api afterSelectionEndByProp|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L867

:::

_afterSelectionEndByProp(row, prop, row2, prop2, selectionLayerLevel)_

Fired after one or more cells are selected (e.g. on mouse up).

The `prop` and `prop2` arguments represent the source object property name instead of the column number.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Selection start visual row index. |
| prop | `string` | Selection start data source object property index. |
| row2 | `number` | Selection end visual row index. |
| prop2 | `string` | Selection end data source object property index. |
| selectionLayerLevel | `number` | The number which indicates what selection layer is currently modified. |



### afterSelectionFocusSet

::: ask-about-api afterSelectionFocusSet|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L879

:::

_afterSelectionFocusSet(row, column, preventScrolling)_

Fired after the focus position within a selected range is changed.

**Since**: 14.3.0  
**Example**  
```js
::: only-for javascript
new Handsontable(element, {
  afterSelectionFocusSet: (row, column, preventScrolling) => {
    // If set to `false` (default): when focused cell selection is outside the viewport,
    // Handsontable scrolls the viewport to that cell.
    // If set to `true`: when focused cell selection is outside the viewport,
    // Handsontable doesn't scroll the viewport.
    preventScrolling.value = true;
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  afterSelectionFocusSet={(row, column, preventScrolling) => {
    // If set to `false` (default): when focused cell selection is outside the viewport,
    // Handsontable scrolls the viewport to that cell.
    // If set to `true`: when focused cell selection is outside the viewport,
    // Handsontable doesn't scroll the viewport.
    preventScrolling.value = true;
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  afterSelectionFocusSet: (row, column, preventScrolling) => {
    // If set to `false` (default): when focused cell selection is outside the viewport,
    // Handsontable scrolls the viewport to that cell.
    // If set to `true`: when focused cell selection is outside the viewport,
    // Handsontable doesn't scroll the viewport.
    preventScrolling.value = true;
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The focus visual row index position. |
| column | `number` | The focus visual column index position. |
| preventScrolling | `object` | A reference to the observable object with the `value` property.                                  Property `preventScrolling.value` expects a boolean value that                                  Handsontable uses to control scroll behavior after selection. |



### afterSelectRows

::: ask-about-api afterSelectRows|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1043

:::

_afterSelectRows(from, to, highlight)_

Fired after one or more rows are selected (e.g. during mouse header click or [Core#selectRows](@/api/core.md#selectrows) API call).

**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| from | `CellCoords` | Selection start coords object. |
| to | `CellCoords` | Selection end coords object. |
| highlight | `CellCoords` | Selection cell focus coords object. |



### afterSetCellMeta

::: ask-about-api afterSetCellMeta|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1112

:::

_afterSetCellMeta(row, column, key, value)_

Fired after cell meta is changed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The updated meta key. |
| value | `*` | The updated meta value. |



### afterSetDataAtCell

::: ask-about-api afterSetDataAtCell|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1130

:::

_afterSetDataAtCell(changes, [source])_

Fired after [`setDataAtCell`](@/api/core.md#setdataatcell) is called and changes are processed,
before they are validated and applied to the data source.
Use [`afterChange`](@/api/hooks.md#afterchange) if you need to react after the data has been written.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterSetDataAtRowProp

::: ask-about-api afterSetDataAtRowProp|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1140

:::

_afterSetDataAtRowProp(changes, [source])_

Fired after [`setDataAtRowProp`](@/api/core.md#setdataatrowprop) is called and changes are processed,
before they are validated and applied to the data source.
Use [`afterChange`](@/api/hooks.md#afterchange) if you need to react after the data has been written.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, prop, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterSetSourceDataAtCell

::: ask-about-api afterSetSourceDataAtCell|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1150

:::

_afterSetSourceDataAtCell(changes, [source])_

Fired after cell source data was changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### afterSetTheme

::: ask-about-api afterSetTheme|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1158

:::

_afterSetTheme(themeName, firstRun)_

Fired after a theme is enabled, changed, or disabled.

**Since**: 15.0.0  

| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `boolean` <br/> `undefined` | The theme name. |
| firstRun | `boolean` | `true` if it's the initial setting of the theme, `false` otherwise. |



### afterSheetAdded

::: ask-about-api afterSheetAdded|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2558

:::

_afterSheetAdded(addedSheetDisplayName)_

Fired by the [Formulas](@/api/formulas.md) plugin when a new sheet is added to the engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| addedSheetDisplayName | `string` | The name of the added sheet. |



### afterSheetRemoved

::: ask-about-api afterSheetRemoved|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2573

:::

_afterSheetRemoved(removedSheetDisplayName, changes)_

Fired by the [Formulas](@/api/formulas.md) plugin when a sheet is removed from the engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| removedSheetDisplayName | `string` | The removed sheet name. |
| changes | `Array` | The values and location of applied changes. |



### afterSheetRenamed

::: ask-about-api afterSheetRenamed|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2565

:::

_afterSheetRenamed(oldDisplayName, newDisplayName)_

Fired by the [Formulas](@/api/formulas.md) plugin when a sheet in the engine instance is renamed.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| oldDisplayName | `string` | The old name of the sheet. |
| newDisplayName | `string` | The new name of the sheet. |



### afterTrimRow

::: ask-about-api afterTrimRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2824

:::

_afterTrimRow(currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged) ⇒ undefined | boolean_

Fired by [TrimRows](@/api/trimRows.md) plugin after trimming rows. This hook is fired when [Options#trimRows](@/api/options.md#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any non-trimmed rows, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the trimming action will not be completed.  

### afterUndo

::: ask-about-api afterUndo|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2618

:::

_afterUndo(action)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |



### afterUndoStackChange

::: ask-about-api afterUndoStackChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2626

:::

_afterUndoStackChange(doneActionsBefore, doneActionsAfter)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after changing undo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| doneActionsBefore | `Array` | Stack of actions which could be undone before performing new action. |
| doneActionsAfter | `Array` | Stack of actions which can be undone after performing new action. |



### afterUnhideColumns

::: ask-about-api afterUnhideColumns|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2806

:::

_afterUnhideColumns(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)_

Fired by [HiddenColumns](@/api/hiddenColumns.md) plugin after marking the columns as not hidden. Fired only if the [Options#hiddenColumns](@/api/options.md#hiddencolumns) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any hidden columns, `false` otherwise. |



### afterUnhideRows

::: ask-about-api afterUnhideRows|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2768

:::

_afterUnhideRows(currentHideConfig, destinationHideConfig, actionPossible, stateChanged)_

Fired by [HiddenRows](@/api/hiddenRows.md) plugin after marking the rows as not hidden. Fired only if the [Options#hiddenRows](@/api/options.md#hiddenrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any hidden rows, `false` otherwise. |



### afterUnlisten

::: ask-about-api afterUnlisten|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3115

:::

_afterUnlisten_

Fired after the table was switched off from the listening mode. This makes the Handsontable inert for any
keyboard events.



### afterUnmergeCells

::: ask-about-api afterUnmergeCells|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3101

:::

_afterUnmergeCells(cellRange, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin after unmerging the cells. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterUntrimRow

::: ask-about-api afterUntrimRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2843

:::

_afterUntrimRow(currentTrimConfig, destinationTrimConfig, actionPossible, stateChanged) ⇒ undefined | boolean_

Fired by [TrimRows](@/api/trimRows.md) plugin after untrimming rows. This hook is fired when [Options#trimRows](@/api/options.md#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |
| stateChanged | `boolean` | `true`, if the action affected any trimmed rows, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the untrimming action will not be completed.  

### afterUpdateData

::: ask-about-api afterUpdateData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L457

:::

_afterUpdateData(sourceData, initialLoad, source)_

Fired after the [`updateData()`](@/api/core.md#updatedata) method
modifies Handsontable's [`data`](@/api/options.md#data).

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Since**: 11.1.0  

| Param | Type | Description |
| --- | --- | --- |
| sourceData | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data |
| initialLoad | `boolean` | A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`) |
| source | `string` | The source of the call |



### afterUpdateSettings

::: ask-about-api afterUpdateSettings|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1166

:::

_afterUpdateSettings(newSettings)_

Fired after calling the [`updateSettings`](@/api/core.md#updatesettings) method.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | `object` | New settings object. |



### afterValidate

::: ask-about-api afterValidate|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1172

:::

_afterValidate(isValid, value, row, prop, [source]) ⇒ undefined | boolean_

A plugin hook executed after validator function, only if validator function is defined.
Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.

__Returning false from the callback will mark the cell as invalid__.


| Param | Type | Description |
| --- | --- | --- |
| isValid | `boolean` | `true` if valid, `false` if not. |
| value | `*` | The value in question. |
| row | `number` | Visual row index. |
| prop | `string` <br/> `number` | Property name / visual column index. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `undefined` | `boolean` - If `false` the cell will be marked as invalid, `true` otherwise.  

### afterViewportColumnCalculatorOverride

::: ask-about-api afterViewportColumnCalculatorOverride|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2722

:::

_afterViewportColumnCalculatorOverride(calc)_

Fired inside the `viewportColumnCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | `object` | The row calculator. |



### afterViewportRowCalculatorOverride

::: ask-about-api afterViewportRowCalculatorOverride|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2716

:::

_afterViewportRowCalculatorOverride(calc)_

Fired inside the `viewportRowCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | `object` | The row calculator. |



### afterViewRender

::: ask-about-api afterViewRender|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1548

:::

_afterViewRender(isForced)_

Fired after Handsontable's view-rendering engine is rendered,
but before redrawing the selection borders and before scroll syncing.

__Note:__ In Handsontable 9.x and earlier, the `afterViewRender` hook was named `afterRender`.

**Since**: 10.0.0  

| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | If set to `true`, the rendering gets triggered by a change of settings, a change of                           data, or a logic that needs a full Handsontable render cycle.                           If set to `false`, the rendering gets triggered by scrolling or moving the selection. |



### beforeAddChild

::: ask-about-api beforeAddChild|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2874

:::

_beforeAddChild(parent, element, index)_

Fired by [NestedRows](@/api/nestedRows.md) plugin before adding a children to the `NestedRows` structure. This hook is fired when
[Options#nestedRows](@/api/options.md#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | The parent object. |
| element | `object` <br/> `undefined` | The element added as a child. If `undefined`, a blank child was added. |
| index | `number` <br/> `undefined` | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### beforeAlter

::: ask-about-api beforeAlter|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L357

:::

_beforeAlter(action, index, amount, [source], [keepEmptyRows]) ⇒ \* | boolean_

Fired before an alter action is applied (e.g. `insert_row_above`, `insert_row_below`, `remove_row`).
Return `false` to cancel the default alter behavior (e.g. so a plugin can handle it via server-side CRUD).

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| action | `string` | The alter action: `'insert_row_above'`, `'insert_row_below'`, `'remove_row'`,                        `'insert_col_start'`, `'insert_col_end'`, `'remove_col'`. |
| index | `number` <br/> `Array` | Visual row/column index, or for remove actions an array of `[[index, amount], ...]`. |
| amount | `number` | Number of rows/columns to insert or remove (default 1). |
| [source] | `string` | `optional` Source of the alter call (e.g. `'ContextMenu.rowAbove'`). |
| [keepEmptyRows] | `boolean` | `optional` Whether to keep empty rows (remove_row only). |


**Returns**: `*` | `boolean` - Return `false` to cancel the alter; the table will not be modified locally.  

### beforeAutofill

::: ask-about-api beforeAutofill|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1202

:::

_beforeAutofill(selectionData, sourceRange, targetRange, direction) ⇒ boolean | Array&lt;Array&gt;_

Fired by [Autofill](@/api/autofill.md) plugin before populating the data in the autofill feature. This hook is fired when
[Options#fillHandle](@/api/options.md#fillhandle) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| selectionData | `Array<Array>` | Data the autofill operation will start from. |
| sourceRange | `CellRange` | The range values will be filled from. |
| targetRange | `CellRange` | The range new values will be filled into. |
| direction | `string` | Declares the direction of the autofill. Possible values: `up`, `down`, `left`, `right`. |


**Returns**: `boolean` | `Array<Array>` - If false, the operation is cancelled. If array of arrays, the returned data
                             will be passed into [`populateFromArray`](@/api/core.md#populatefromarray) instead of the default autofill
                             algorithm's result.  

### beforeBeginEditing

::: ask-about-api beforeBeginEditing|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2909

:::

_beforeBeginEditing(row, column, initialValue, event, fullEditMode) ⇒ boolean | undefined_

Fired before the editor is opened and rendered.

**Since**: 14.2.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the edited cell. |
| column | `number` | Visual column index of the edited cell. |
| initialValue | `*` | The initial editor value. |
| event | `MouseEvent` <br/> `KeyboardEvent` | The event which was responsible for opening the editor. |
| fullEditMode | `boolean` | `true` if the editor is opened in full edit mode, `false` otherwise. Editor opened in full edit mode does not close after pressing Arrow keys. |


**Returns**: `boolean` | `undefined` - If the callback returns `false,` the editor won't be opened after
the mouse double click or after pressing the <kbd>**Enter**</kbd> key. Returning `undefined` (or other value
than boolean) will result in default behavior, which disallows opening an editor for non-contiguous
selection (while pressing <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>) and for multiple selected cells (while pressing <kbd>**Shift**</kbd>).
Returning `true` removes those restrictions.  

### beforeCellAlignment

::: ask-about-api beforeCellAlignment|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1228

:::

_beforeCellAlignment(stateBefore, range, type, alignmentClass)_

Fired before aligning the cell contents.


| Param | Type | Description |
| --- | --- | --- |
| stateBefore | `object` | An object with class names defining the cell alignment. |
| range | `Array<CellRange>` | An array of `CellRange` coordinates where the alignment will be applied. |
| type | `string` | Type of the alignment - either `horizontal` or `vertical`. |
| alignmentClass | `string` | String defining the alignment class added to the cell. Possible values: `htLeft` , `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, `htBottom`. |



### beforeChange

::: ask-about-api beforeChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1238

:::

_beforeChange(changes, [source]) ⇒ undefined | boolean_

Fired before one or more cells are changed.

Use this hook to silently alter the user's changes before Handsontable re-renders.

To ignore the user's changes, use a nullified array or return `false`.

**Example**  
::: only-for javascript
```js
// to alter a single change, overwrite the value with `changes[i][3]`
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0][3] = 10;
  }
});

// to ignore a single change, set `changes[i]` to `null`
// or remove `changes[i]` from the array, by using `changes.splice(i, 1)`
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0] = null;
  }
});

// to ignore all changes, return `false`
// or set the array's length to 0, by using `changes.length = 0`
new Handsontable(element, {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    return false;
  }
});
```
:::

::: only-for react
```jsx
// to alter a single change, overwrite the desired value with `changes[i][3]`
<HotTable
  beforeChange={(changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0][3] = 10;
  }}
/>

// to ignore a single change, set `changes[i]` to `null`
// or remove `changes[i]` from the array, by using changes.splice(i, 1).
<HotTable
  beforeChange={(changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0] = null;
  }}
/>

// to ignore all changes, return `false`
// or set the array's length to 0 (`changes.length = 0`)
<HotTable
  beforeChange={(changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    return false;
  }}
/>
```
:::

::: only-for angular
```ts
// To alter a single change, overwrite the desired value with `changes[i][3]`
settings1 = {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0][3] = 10;
  },
};

// To ignore a single change, set `changes[i]` to `null`
// or remove `changes[i]` from the array, by using changes.splice(i, 1).
settings2 = {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    changes[0] = null;
  },
};

// To ignore all changes, return `false`
// or set the array's length to 0 (`changes.length = 0`)
settings3 = {
  beforeChange: (changes, source) => {
    // [[row, prop, oldVal, newVal], ...]
    return false;
  },
};
```

```html
<hot-table [settings]="settings1"></hot-table>
<hot-table [settings]="settings2"></hot-table>
<hot-table [settings]="settings3"></hot-table>
```

:::

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`. `row` is a visual row index. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `undefined` | `boolean` - If `false` all changes were cancelled, `true` otherwise.  

### beforeChangeRender

::: ask-about-api beforeChangeRender|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1348

:::

_beforeChangeRender(changes, [source])_

Fired right before rendering the changes.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | Array in form of `[row, prop, oldValue, newValue]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### beforeColumnCollapse

::: ask-about-api beforeColumnCollapse|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3139

:::

_beforeColumnCollapse(currentCollapsedColumns, destinationCollapsedColumns, collapsePossible) ⇒ undefined | boolean_

Fired by [CollapsibleColumns](@/api/collapsibleColumns.md) plugin before columns collapse. This hook is fired when [Options#collapsibleColumns](@/api/options.md#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| collapsePossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the collapsing action will not be completed.  

### beforeColumnExpand

::: ask-about-api beforeColumnExpand|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3159

:::

_beforeColumnExpand(currentCollapsedColumns, destinationCollapsedColumns, expandPossible) ⇒ undefined | boolean_

Fired by [CollapsibleColumns](@/api/collapsibleColumns.md) plugin before columns expand. This hook is fired when [Options#collapsibleColumns](@/api/options.md#collapsiblecolumns) option is enabled.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| currentCollapsedColumns | `Array` | Current collapsible configuration - a list of collapsible physical column indexes. |
| destinationCollapsedColumns | `Array` | Destination collapsible configuration - a list of collapsible physical column indexes. |
| expandPossible | `boolean` | `true`, if all of the column indexes are withing the bounds of the collapsed sections, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the expanding action will not be completed.  

### beforeColumnFreeze

::: ask-about-api beforeColumnFreeze|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2134

:::

_beforeColumnFreeze(column, freezePerformed) ⇒ boolean | undefined_

Fired by the [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin, before freezing a column.

**Since**: 12.1.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual index of the column that is going to freeze. |
| freezePerformed | `boolean` | If `true`: the column is going to freeze. If `false`: the column is not going to freeze (which might happen if the column is already frozen). |


**Returns**: `boolean` | `undefined` - If `false`: the column is not going to freeze, and the `afterColumnFreeze` hook won't fire.  

### beforeColumnMove

::: ask-about-api beforeColumnMove|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2151

:::

_beforeColumnMove(movedColumns, finalIndex, dropIndex, movePossible) ⇒ undefined | boolean_

Fired by [ManualColumnMove](@/api/manualColumnMove.md) plugin before change order of the visual indexes. This hook is fired when
[Options#manualColumnMove](@/api/options.md#manualcolumnmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns.                            Points to where the elements will be placed after the moving action.                            To check visualization of final index please take a look at                            [documentation](@/guides/columns/column-moving/column-moving.md). |
| dropIndex | `number` <br/> `undefined` | Visual column index, being a drop index for the moved columns.                                     Points to where we are going to drop the moved elements. To check                                     visualization of drop index please take a look at                                     [documentation](@/guides/columns/column-moving/column-moving.md).                                     It's `undefined` when `dragColumns` function wasn't called. |
| movePossible | `boolean` | Indicates if it's possible to move rows to the desired position. |


**Returns**: `undefined` | `boolean` - If `false` the column will not be moved, `true` otherwise.  

### beforeColumnResize

::: ask-about-api beforeColumnResize|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2240

:::

_beforeColumnResize(newSize, column, isDoubleClick) ⇒ number | false | undefined_

Fired by [ManualColumnResize](@/api/manualColumnResize.md) plugin before rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](@/api/options.md#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new column width. |
| column | `number` | Visual index of the resized column. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |


**Returns**: `number` | `false` | `undefined` - Returns a new column size, `false` to cancel the resize, or `undefined` to keep the size set by the drag or auto-calculation.  

### beforeColumnSort

::: ask-about-api beforeColumnSort|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1833

:::

_beforeColumnSort(currentSortConfig, destinationSortConfigs) ⇒ boolean | undefined_

Fired by [ColumnSorting](@/api/columnSorting.md) and [MultiColumnSorting](@/api/multiColumnSorting.md) plugins before sorting the column. If you return `false` value inside callback for hook, then sorting
will be not applied by the Handsontable (useful for server-side sorting).

This hook is fired when [Options#columnSorting](@/api/options.md#columnsorting) or [Options#multiColumnSorting](@/api/options.md#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | `Array` | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | `Array` | Destination sort configuration (for all sorted columns). |


**Returns**: `boolean` | `undefined` - If `false` the column will not be sorted, `true` otherwise.  

### beforeColumnUnfreeze

::: ask-about-api beforeColumnUnfreeze|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2187

:::

_beforeColumnUnfreeze(column, unfreezePerformed) ⇒ boolean | undefined_

Fired by the [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin, before unfreezing a column.

**Since**: 12.1.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual index of the column that is going to unfreeze. |
| unfreezePerformed | `boolean` | If `true`: the column is going to unfreeze. If `false`: the column is not going to unfreeze (which might happen if the column is already unfrozen). |


**Returns**: `boolean` | `undefined` - If `false`: the column is not going to unfreeze, and the `afterColumnUnfreeze` hook won't fire.  

### beforeColumnWrap

::: ask-about-api beforeColumnWrap|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1595

:::

_beforeColumnWrap(isWrapEnabled, newCoords, isFlipped)_

When the focus position is moved to the next or previous column caused by the [Options#autoWrapCol](@/api/options.md#autowrapcol) option
the hook is triggered.

**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| isWrapEnabled | `boolean` | Tells whether the column wrapping is going to happen. There may be situations where the option does not work even though it is enabled. This is due to the priority of other options that may block the feature. For example, when the [Options#minSpareRows](@/api/options.md#minsparerows) is defined, the [Options#autoWrapCol](@/api/options.md#autowrapcol) option is not checked. Thus, column wrapping is off. |
| newCoords | `CellCoords` | The new focus position. It is an object with keys `row` and `col`, where a value of `-1` indicates a header. |
| isFlipped | `boolean` | `true` if the column index was flipped, `false` otherwise. Flipped index means that the user reached the last column and the focus is moved to the first column or vice versa. |



### beforeCompositionStart

::: ask-about-api beforeCompositionStart|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L405

:::

_beforeCompositionStart(event)_

Hook fired after `compositionstart` event is handled.

**Since**: 15.3.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | A native `composition` event object. |



### beforeContextMenuSetItems

::: ask-about-api beforeContextMenuSetItems|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L210

:::

_beforeContextMenuSetItems(menuItems)_

Fired each time user opens [ContextMenu](@/api/contextMenu.md) plugin before setting up the context menu's items but after filtering these options by
user ([`contextMenu`](@/api/options.md#contextmenu) option). This hook can by helpful to determine if user use specified menu item or to set up
one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array<object>` | An array of objects containing information about to generated context menu items. |



### beforeContextMenuShow

::: ask-about-api beforeContextMenuShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L241

:::

_beforeContextMenuShow(context)_

Fired by [ContextMenu](@/api/contextMenu.md) plugin before opening the context menu. This hook is fired when [Options#contextMenu](@/api/options.md#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The [ContextMenu](@/api/contextMenu.md) instance. |



### beforeCopy

::: ask-about-api beforeCopy|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1952

:::

_beforeCopy(data, coords, copiedHeadersCount) ⇒ \*_

Fired before values are copied to the clipboard.

**Example**  
::: only-for javascript
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
:::

::: only-for react
```jsx
// To disregard a single row, remove it from array using data.splice(i, 1).
...
<HotTable
  beforeCopy={(data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }}
/>
...

// To cancel copying, return false from the callback.
...
<HotTable
  beforeCopy={(data, coords) => {
    return false;
  }}
/>
...
```
:::

::: only-for angular
```ts
// To disregard a single row, remove it from the array using data.splice(i, 1).
settings1 = {
  beforeCopy: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  },
};

// To cancel copying, return false from the callback.
settings2 = {
  beforeCopy: (data, coords) => {
    return false;
  },
};
```

```html
<hot-table [settings]="settings1"></hot-table>
<hot-table [settings]="settings2"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains data to copied. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                         which will copied. |
| copiedHeadersCount | `Object` | (Since 12.3.0) The number of copied column headers. |


**Returns**: `*` - If returns `false` then copying is canceled.  

### beforeCreateCol

::: ask-about-api beforeCreateCol|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L265

:::

_beforeCreateCol(index, amount, [source]) ⇒ \*_

Fired before created a new column.

**Example**  
::: only-for javascript
```js
// Return `false` to cancel column inserting.
new Handsontable(element, {
  beforeCreateCol: function(data, coords) {
    return false;
  }
});
```
:::

::: only-for react
```jsx
// Return `false` to cancel column inserting.
<HotTable
  beforeCreateCol={(data, coords) => {
    return false;
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  beforeCreateCol: (data, coords) => {
    // Return `false` to cancel column inserting.
    return false;
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created column in the data source array. |
| amount | `number` | Number of newly created columns in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `*` - If `false` then creating columns is cancelled.  

### beforeCreateRow

::: ask-about-api beforeCreateRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L338

:::

_beforeCreateRow(index, amount, [source]) ⇒ \* | boolean_

Fired before created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created row in the data source array. |
| amount | `number` | Number of newly created rows in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeCut

::: ask-about-api beforeCut|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1867

:::

_beforeCut(data, coords) ⇒ \*_

Fired by [CopyPaste](@/api/copyPaste.md) plugin before copying the values to the clipboard and before clearing values of
the selected cells. This hook is fired when [Options#copyPaste](@/api/options.md#copypaste) option is enabled.

**Example**  
::: only-for javascript
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
:::

::: only-for react
```jsx
// To disregard a single row, remove it from the array using data.splice(i, 1).
<HotTable
  beforeCut={(data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }}
/>
// To cancel a cutting action, just return `false`.
<HotTable
  beforeCut={(data, coords) => {
    return false;
  }}
/>
```
:::

::: only-for angular
```ts
// To disregard a single row, remove it from the array using data.splice(i, 1).
settings1 = {
  beforeCut: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  },
};

// To cancel a cutting action, just return `false`.
settings2 = {
  beforeCut: (data, coords) => {
    return false;
  },
};
```

```html
<hot-table [settings]="settings1"></hot-table>
<hot-table [settings]="settings2"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains data to cut. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which will be cut out. |


**Returns**: `*` - If returns `false` then operation of the cutting out is canceled.  

### beforeDataProviderFetch

::: ask-about-api beforeDataProviderFetch|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1439

:::

_beforeDataProviderFetch(queryParameters) ⇒ \* | boolean_

Fired before the dataProvider fetches data. Return `false` to cancel the fetch.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| queryParameters | `object` | Current query parameters: `{ page, pageSize, sort, filters }`. May include `skipLoading` when the fetch was triggered internally (for example after column sort or CRUD); not sent to `fetchRows`. |


**Returns**: `*` | `boolean` - Return `false` to cancel the fetch; otherwise the fetch proceeds.  

### beforeDetachChild

::: ask-about-api beforeDetachChild|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2892

:::

_beforeDetachChild(parent, element)_

Fired by [NestedRows](@/api/nestedRows.md) plugin before detaching a child from its parent. This hook is fired when
[Options#nestedRows](@/api/options.md#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | An object representing the parent from which the element is to be detached. |
| element | `object` | The detached element. |



### beforeDialogHide

::: ask-about-api beforeDialogHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2940

:::

_beforeDialogHide_

Fired by [Dialog](@/api/dialog.md) plugin before hiding the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### beforeDialogShow

::: ask-about-api beforeDialogShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2947

:::

_beforeDialogShow_

Fired by [Dialog](@/api/dialog.md) plugin before showing the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### beforeDrawBorders

::: ask-about-api beforeDrawBorders|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1372

:::

_beforeDrawBorders(corners, borderClassName)_

Fired before drawing the borders.


| Param | Type | Description |
| --- | --- | --- |
| corners | `Array` | Array specifying the current selection borders. |
| borderClassName | `string` | Specifies the border class name. |



### beforeDropdownMenuSetItems

::: ask-about-api beforeDropdownMenuSetItems|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L226

:::

_beforeDropdownMenuSetItems(menuItems)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin before setting up the dropdown menu's items but after filtering these options
by user ([`dropdownMenu`](@/api/options.md#dropdownmenu) option). This hook can by helpful to determine if user use specified menu item or to set
up one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array<object>` | An array of objects containing information about to generated dropdown menu items. |



### beforeDropdownMenuShow

::: ask-about-api beforeDropdownMenuShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2853

:::

_beforeDropdownMenuShow(dropdownMenu)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin before opening the dropdown menu. This hook is fired when [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | `DropdownMenu` | The `DropdownMenu` instance. |



### beforeEmptyDataStateHide

::: ask-about-api beforeEmptyDataStateHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3020

:::

_beforeEmptyDataStateHide_

Fired by [EmptyDataState](@/api/emptyDataState.md) plugin before hiding the empty data state overlay. This hook is fired when [Options#emptyDataState](@/api/options.md#emptydatastate)
option is enabled.

**Since**: 16.2.0  


### beforeEmptyDataStateShow

::: ask-about-api beforeEmptyDataStateShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3006

:::

_beforeEmptyDataStateShow_

Fired by [EmptyDataState](@/api/emptyDataState.md) plugin before showing the empty data state overlay. This hook is fired when [Options#emptyDataState](@/api/options.md#emptydatastate)
option is enabled.

**Since**: 16.2.0  


### beforeFilter

::: ask-about-api beforeFilter|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2354

:::

_beforeFilter(conditionsStack, previousConditionsStack) ⇒ boolean_

Fired by the [`Filters`](@/api/filters.md) plugin,
before a [column filter](@/guides/columns/column-filter/column-filter.md) gets applied.

[`beforeFilter`](#beforefilter) takes two arguments: `conditionsStack` and `previousConditionsStack`, both are
arrays of objects.

Each object represents one of your [column filters](@/api/filters.md#addcondition),
and consists of the following properties:

| Property     | Possible values                                                         | Description                                                                                                              |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `column`     | Number                                                                  | A visual index of the column to which the filter will be applied.                                                        |
| `conditions` | Array of objects                                                        | Each object represents one condition. For details, see [`addCondition()`](@/api/filters.md#addcondition).                |
| `operation`  | `'conjunction'` \| `'disjunction'` \| `'disjunctionWithExtraCondition'` | An operation to perform on your set of `conditions`. For details, see [`addCondition()`](@/api/filters.md#addcondition). |

An example of the format of the `conditionsStack` argument:

```js
[
  {
    column: 2,
    conditions: [
      {name: 'begins_with', args: [['S']]}
    ],
    operation: 'conjunction'
  },
  {
    column: 4,
    conditions: [
      {name: 'not_empty', args: []}
    ],
    operation: 'conjunction'
  },
]
```

To perform server-side filtering (i.e., to not apply filtering to Handsontable's UI),
set [`beforeFilter`](#beforefilter) to return `false`:

```js
new Handsontable(document.getElementById('example'), {
  beforeFilter: (conditionsStack) => {
    return false;
  }
});
```

Read more:
- [Guides: Column filter](@/guides/columns/column-filter/column-filter.md)
- [Hooks: `afterFilter`](#afterfilter)
- [Options: `filters`](@/api/options.md#filters)
- [Plugins: `Filters`](@/api/filters.md)
– [Plugin methods: `addCondition()`](@/api/filters.md#addcondition)


| Param | Type | Description |
| --- | --- | --- |
| conditionsStack | `Array<object>` | An array of objects with your [column filters](@/api/filters.md#addcondition). |
| previousConditionsStack | `Array<object>` <br/> `null` | An array of objects with your previous [column filters](@/api/filters.md#addcondition). It can also be `null` if there was no previous filters applied or the conditions did not change between performing the `filter` action. |


**Returns**: `boolean` - To perform server-side filtering (i.e., to not apply filtering to Handsontable's UI), return `false`.  

### beforeGetCellMeta

::: ask-about-api beforeGetCellMeta|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1379

:::

_beforeGetCellMeta(row, column, cellProperties)_

Fired before getting cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| cellProperties | `object` | Object containing the cell's properties. |



### beforeHeightChange

::: ask-about-api beforeHeightChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1356

:::

_beforeHeightChange(height) ⇒ number | string_

Fired before the height of the table is changed.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| height | `number` <br/> `string` | Table height. |


**Returns**: `number` | `string` - Modified table height.  

### beforeHideColumns

::: ask-about-api beforeHideColumns|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2777

:::

_beforeHideColumns(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean_

Fired by [HiddenColumns](@/api/hiddenColumns.md) plugin before marking the columns as hidden. Fired only if the [Options#hiddenColumns](@/api/options.md#hiddencolumns) option is enabled.
Returning `false` in the callback will prevent the hiding action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the hiding action will not be completed.  

### beforeHideRows

::: ask-about-api beforeHideRows|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2739

:::

_beforeHideRows(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean_

Fired by [HiddenRows](@/api/hiddenRows.md) plugin before marking the rows as hidden. Fired only if the [Options#hiddenRows](@/api/options.md#hiddenrows) option is enabled.
Returning `false` in the callback will prevent the hiding action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the hiding action will not be completed.  

### beforeHighlightingColumnHeader

::: ask-about-api beforeHighlightingColumnHeader|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1820

:::

_beforeHighlightingColumnHeader(column, headerLevel, highlightMeta) ⇒ number | undefined_

Allows modify the visual column index that is used to retrieve the column header element (TH) before it's
highlighted (proper CSS class names are added). Modifying the visual column index allows building a custom
implementation of the nested headers feature or other features that require highlighting other DOM
elements than that the rendering engine, by default, would have highlighted.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| headerLevel | `number` | Row header level (0 = most distant to the table). |
| highlightMeta | `object` | An object that contains additional information about processed selection. |



### beforeHighlightingRowHeader

::: ask-about-api beforeHighlightingRowHeader|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1807

:::

_beforeHighlightingRowHeader(row, headerLevel, highlightMeta) ⇒ number | undefined_

Allows modify the visual row index that is used to retrieve the row header element (TH) before it's
highlighted (proper CSS class names are added). Modifying the visual row index allows building a custom
implementation of the nested headers feature or other features that require highlighting other DOM
elements than that the rendering engine, by default, would have highlighted.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| headerLevel | `number` | Column header level (0 = most distant to the table). |
| highlightMeta | `object` | An object that contains additional information about processed selection. |



### beforeInit

::: ask-about-api beforeInit|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1397

:::

_beforeInit_

Fired before the Handsontable instance is initiated.



### beforeInitWalkontable

::: ask-about-api beforeInitWalkontable|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1402

:::

_beforeInitWalkontable(walkontableConfig)_

Fired before the Walkontable instance is initiated.


| Param | Type | Description |
| --- | --- | --- |
| walkontableConfig | `object` | Walkontable configuration object. |



### beforeKeyDown

::: ask-about-api beforeKeyDown|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1448

:::

_beforeKeyDown(event)_

Hook fired before `keydown` event is handled. It can be used to stop default key bindings.

__Note__: To prevent default behavior you need to call `false` in your `beforeKeyDown` handler.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | Original DOM event. |



### beforeLanguageChange

::: ask-about-api beforeLanguageChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1188

:::

_beforeLanguageChange(languageCode)_

Fired before successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | `string` | New language code. |



### beforeLoadData

::: ask-about-api beforeLoadData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1408

:::

_beforeLoadData(sourceData, initialLoad, source) ⇒ Array_

Fired before Handsontable's [`data`](@/api/options.md#data)
gets modified by the [`loadData()`](@/api/core.md#loaddata) method
or the [`updateSettings()`](@/api/core.md#updatesettings) method.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| sourceData | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data |
| initialLoad | `boolean` | A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`) |
| source | `string` | The source of the call |


**Returns**: `Array` - The returned array will be used as Handsontable's new dataset.  

### beforeLoadingHide

::: ask-about-api beforeLoadingHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2991

:::

_beforeLoadingHide ⇒ boolean | undefined_

Fired by [Loading](@/api/loading.md) plugin before hiding the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled.

**Since**: 16.1.0  

**Returns**: `boolean` | `undefined` - If returns `false`, the action will be skipped.  

### beforeLoadingShow

::: ask-about-api beforeLoadingShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2976

:::

_beforeLoadingShow ⇒ boolean | undefined_

Fired by [Loading](@/api/loading.md) plugin before showing the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled. The callback can return `false` to prevent the loading indicator from being shown.

**Since**: 16.1.0  

**Returns**: `boolean` | `undefined` - If returns `false`, the action will be skipped.  

### beforeMergeCells

::: ask-about-api beforeMergeCells|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3076

:::

_beforeMergeCells(cellRange, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin before cell merging. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeNotificationHide

::: ask-about-api beforeNotificationHide|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3052

:::

_beforeNotificationHide(id) ⇒ boolean | undefined_

Fired by [Notification](@/api/notification.md) plugin before a toast is hidden. Return `false` to keep it visible.
Timed toasts keep their auto-dismiss countdown; if the hide was triggered because the countdown
reached zero, the countdown restarts from the configured duration.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| id | `string` | Toast id. |


**Returns**: `boolean` | `undefined` - If returns `false`, the toast stays visible.  

### beforeNotificationShow

::: ask-about-api beforeNotificationShow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3034

:::

_beforeNotificationShow(options) ⇒ boolean | undefined_

Fired by [Notification](@/api/notification.md) plugin before a toast is shown or enqueued. This hook is fired when [Options#notification](@/api/options.md#notification)
option is enabled. Return `false` to cancel [Notification#showMessage](@/api/notification.md#showmessage) (no id returned, nothing enqueued).
Queued toasts already passed this hook once when [Notification#showMessage](@/api/notification.md#showmessage) ran; it is not fired again when a slot opens.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Normalized toast options including `id`, `variant`, `message`, `duration`, `position`, `closable`, and `actions`. |


**Returns**: `boolean` | `undefined` - If returns `false`, the toast is not shown and not queued.  

### beforeOnCellContextMenu

::: ask-about-api beforeOnCellContextMenu|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1474

:::

_beforeOnCellContextMenu(event, coords, TD)_

Fired after the user clicked a cell, but before all the calculations related with it.

**Since**: 4.1.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `contextmenu` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### beforeOnCellMouseDown

::: ask-about-api beforeOnCellMouseDown|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1456

:::

_beforeOnCellMouseDown(event, coords, TD, controller)_

Fired after the user clicked a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mousedown` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |
| controller | `object` | An object with properties `row`, `column` and `cell`. Each property contains                            a boolean value that allows or disallows changing the selection for that particular area. |



### beforeOnCellMouseOut

::: ask-about-api beforeOnCellMouseOut|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1493

:::

_beforeOnCellMouseOut(event, coords, TD)_

Fired after the user moved cursor out from a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseout` event object. |
| coords | `CellCoords` | CellCoords object containing the visual coordinates of the leaved cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### beforeOnCellMouseOver

::: ask-about-api beforeOnCellMouseOver|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1483

:::

_beforeOnCellMouseOver(event, coords, TD, controller)_

Fired after the user moved cursor over a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseover` event object. |
| coords | `CellCoords` | CellCoords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |
| controller | `object` | An object with properties `row`, `column` and `cell`. Each property contains                            a boolean value that allows or disallows changing the selection for that particular area. |



### beforeOnCellMouseOverOutside

::: ask-about-api beforeOnCellMouseOverOutside|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1501

:::

_beforeOnCellMouseOverOutside(event, coords, TD, controller)_

Fired when the mouse cursor moves outside the visible viewport while a mouse button is held down
(e.g. during a drag-to-scroll operation), before selection changes are applied. Use the `controller`
object to suppress row, column, or cell selection changes for this tick.

**Since**: 17.2.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mousemove` event object. |
| coords | `CellCoords` | Visual coordinates of the nearest viewport-edge cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |
| controller | `object` | An object with properties `row`, `column` and `cell`. Each property contains                            a boolean value that allows or disallows changing the selection for that particular area. |



### beforeOnCellMouseUp

::: ask-about-api beforeOnCellMouseUp|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1466

:::

_beforeOnCellMouseUp(event, coords, TD)_

Fired after the user clicked a cell.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseup` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### beforePageChange

::: ask-about-api beforePageChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2459

:::

_beforePageChange(oldPage, newPage) ⇒ \* | boolean_

Fired by [Pagination](@/api/pagination.md) plugin before changing the page. This hook is fired when
[Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| oldPage | `number` | The old page number. |
| newPage | `number` | The new page number. |


**Returns**: `*` | `boolean` - If `false` is returned the action is canceled.  

### beforePageSizeChange

::: ask-about-api beforePageSizeChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2480

:::

_beforePageSizeChange(oldPageSize, newPageSize) ⇒ \* | boolean_

Fired by [Pagination](@/api/pagination.md) plugin before changing the page size. This hook is fired when
[Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| oldPageSize | `number` <br/> `'auto'` | The old page size. |
| newPageSize | `number` <br/> `'auto'` | The new page size. |


**Returns**: `*` | `boolean` - If `false` is returned the action is canceled.  

### beforePaste

::: ask-about-api beforePaste|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2049

:::

_beforePaste(data, coords) ⇒ \*_

Fired by [CopyPaste](@/api/copyPaste.md) plugin before values are pasted into table. This hook is fired when
[Options#copyPaste](@/api/options.md#copypaste) option is enabled.

**Example**  
```js
::: only-for javascript
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
:::

::: only-for react
```jsx
// To disregard a single row, remove it from array using data.splice(i, 1).
<HotTable
  beforePaste={(data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  }}
/>
// To cancel pasting, return false from the callback.
<HotTable
  beforePaste={(data, coords) => {
    return false;
  }}
/>
```
:::

::: only-for angular
```ts
// To disregard a single row, remove it from the array using data.splice(i, 1).
settings1 = {
  beforePaste: (data, coords) => {
    // data -> [[1, 2, 3], [4, 5, 6]]
    data.splice(0, 1);
    // data -> [[4, 5, 6]]
    // coords -> [{startRow: 0, startCol: 0, endRow: 1, endCol: 2}]
  },
};

// To cancel pasting, return false from the callback.
settings2 = {
  beforePaste: (data, coords) => {
    return false;
  },
};
```

```html
<hot-table [settings]="settings1"></hot-table>
<hot-table [settings]="settings2"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays which contains data to paste. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |


**Returns**: `*` - If returns `false` then pasting is canceled.  

### beforeRedo

::: ask-about-api beforeRedo|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2634

:::

_beforeRedo(action) ⇒ \* | boolean_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRedoStackChange

::: ask-about-api beforeRedoStackChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2643

:::

_beforeRedoStackChange(undoneActions)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before changing redo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| undoneActions | `Array` | Stack of actions which may be redone. |



### beforeRefreshDimensions

::: ask-about-api beforeRefreshDimensions|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3129

:::

_beforeRefreshDimensions(previousDimensions, currentDimensions, actionPossible) ⇒ undefined | boolean_

Cancellable hook, called after resizing a window or after detecting size change of the
Handsontable root element, but before redrawing a table.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | `Object` | Previous dimensions of the container. |
| currentDimensions | `Object` | Current dimensions of the container. |
| actionPossible | `boolean` | `true`, if current and previous dimensions are different, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the refresh action will not be completed.  

### beforeRemoveCellClassNames

::: ask-about-api beforeRemoveCellClassNames|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L398

:::

_beforeRemoveCellClassNames ⇒ Array&lt;string&gt; | undefined_

Fired inside the Walkontable's `refreshSelections` method. Can be used to remove additional class names from all cells in the table.

**Since**: 0.38.1  

**Returns**: `Array<string>` | `undefined` - Can return an `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.  

### beforeRemoveCellMeta

::: ask-about-api beforeRemoveCellMeta|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1387

:::

_beforeRemoveCellMeta(row, column, key, value) ⇒ \* | boolean_

Fired before cell meta is removed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The removed meta key. |
| value | `*` | Value which is under removed key of cell meta. |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRemoveCol

::: ask-about-api beforeRemoveCol|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1514

:::

_beforeRemoveCol(index, amount, physicalColumns, [source]) ⇒ \* | boolean_

Fired before one or more columns are about to be removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter column. |
| amount | `number` | Amount of columns to be removed. |
| physicalColumns | `Array<number>` | An array of physical columns removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRemoveRow

::: ask-about-api beforeRemoveRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1525

:::

_beforeRemoveRow(index, amount, physicalRows, [source]) ⇒ \* | boolean_

Fired when one or more rows are about to be removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter row. |
| amount | `number` | Amount of rows to be removed. |
| physicalRows | `Array<number>` | An array of physical rows removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRender

::: ask-about-api beforeRender|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1560

:::

_beforeRender(isForced)_

Fired before Handsontable's view-rendering engine updates the view.

The `beforeRender` event is fired right after the Handsontable
business logic is executed and right before the rendering engine starts calling
the Core logic, renderers, cell meta objects etc. to update the view.


| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | If set to `true`, the rendering gets triggered by a change of settings, a change of                           data, or a logic that needs a full Handsontable render cycle.                           If set to `false`, the rendering gets triggered by scrolling or moving the selection. |



### beforeRenderer

::: ask-about-api beforeRenderer|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L643

:::

_beforeRenderer(TD, row, column, prop, value, cellProperties)_

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

::: ask-about-api beforeRowMove|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2204

:::

_beforeRowMove(movedRows, finalIndex, dropIndex, movePossible) ⇒ \* | boolean_

Fired by [ManualRowMove](@/api/manualRowMove.md) plugin before changing the order of the visual indexes. This hook is fired when
[Options#manualRowMove](@/api/options.md#manualrowmove) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows.                            Points to where the elements will be placed after the moving action.                            To check visualization of final index please take a look at                            [documentation](@/guides/rows/row-moving/row-moving.md). |
| dropIndex | `number` <br/> `undefined` | Visual row index, being a drop index for the moved rows.                                     Points to where we are going to drop the moved elements.                                     To check visualization of drop index please take a look at                                     [documentation](@/guides/rows/row-moving/row-moving.md).                                     It's `undefined` when `dragRows` function wasn't called. |
| movePossible | `boolean` | Indicates if it's possible to move rows to the desired position. |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRowResize

::: ask-about-api beforeRowResize|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2259

:::

_beforeRowResize(newSize, row, isDoubleClick) ⇒ number | false | undefined_

Fired by [ManualRowResize](@/api/manualRowResize.md) plugin before rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](@/api/options.md#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new row height. |
| row | `number` | Visual index of the resized row. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |


**Returns**: `number` | `false` | `undefined` - Returns a new row size, `false` to cancel the resize, or `undefined` to keep the size set by the drag or auto-calculation.  

### beforeRowsMutation

::: ask-about-api beforeRowsMutation|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L504

:::

_beforeRowsMutation(operation, payload)_

Fired before rows mutation (create, update, remove) is sent to the server. Return `false` to cancel.

**Since**: 17.1.0  

| Param | Type | Description |
| --- | --- | --- |
| operation | `string` | One of `'create'`, `'update'`, `'remove'`. |
| payload | `object` | Operation-specific payload (`{ rowsCreate }`, `{ rows: [...] }`, or `{ rowsRemove: [...] }`). |



### beforeRowWrap

::: ask-about-api beforeRowWrap|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1580

:::

_beforeRowWrap(isWrapEnabled, newCoords, isFlipped)_

When the focus position is moved to the next or previous row caused by the [Options#autoWrapRow](@/api/options.md#autowraprow) option
the hook is triggered.

**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| isWrapEnabled | `boolean` | Tells whether the row wrapping is going to happen. There may be situations where the option does not work even though it is enabled. This is due to the priority of other options that may block the feature. For example, when the [Options#minSpareCols](@/api/options.md#minsparecols) is defined, the [Options#autoWrapRow](@/api/options.md#autowraprow) option is not checked. Thus, row wrapping is off. |
| newCoords | `CellCoords` | The new focus position. It is an object with keys `row` and `col`, where a value of `-1` indicates a header. |
| isFlipped | `boolean` | `true` if the row index was flipped, `false` otherwise. Flipped index means that the user reached the last row and the focus is moved to the first row or vice versa. |



### beforeSelectAll

::: ask-about-api beforeSelectAll|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1052

:::

_beforeSelectAll(from, to, [highlight])_

Fired before all cells are selected (e.g. during mouse corner click or [Core#selectAll](@/api/core.md#selectall) API call).

**Since**: 16.1.0  
**Example**  
::: only-for javascript
```js
new Handsontable(element, {
  beforeSelectAll: (from, to, highlight) => {
    // moves the focus to a new position
    if (highlight) {
      highlight.row = 3;
      highlight.col = 3;
    }
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  beforeSelectAll={(from, to, highlight) => {
    // moves the focus to a new position
    if (highlight) {
      highlight.row = 3;
      highlight.col = 3;
    }
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  beforeSelectAll: (from, to, highlight) => {
    // moves the focus to a new position
    if (highlight) {
      highlight.row = 3;
      highlight.col = 3;
    }
  },
};
```
:::

| Param | Type | Description |
| --- | --- | --- |
| from | `CellCoords` | Selection start coords object. |
| to | `CellCoords` | Selection end coords object. |
| [highlight] | `CellCoords` | `optional` Selection cell focus coords object. |



### beforeSelectColumns

::: ask-about-api beforeSelectColumns|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L936

:::

_beforeSelectColumns(from, to, highlight)_

Fired before one or more columns are selected (e.g. during mouse header click or [Core#selectColumns](@/api/core.md#selectcolumns) API call).

**Since**: 14.0.0  
**Example**  
::: only-for javascript
```js
new Handsontable(element, {
  beforeSelectColumns: (from, to, highlight) => {
    // Extend the column selection by one column left and one column right.
    from.col = Math.max(from.col - 1, 0);
    to.col = Math.min(to.col + 1, this.countCols() - 1);
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  beforeSelectColumns={(from, to, highlight) => {
    // Extend the column selection by one column left and one column right.
    from.col = Math.max(from.col - 1, 0);
    to.col = Math.min(to.col + 1, this.countCols() - 1);
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  beforeSelectColumns: (from, to, highlight) => {
    // Extend the column selection by one column left and one column right.
    from.col = Math.max(from.col - 1, 0);
    to.col = Math.min(to.col + 1, this.countCols() - 1);
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| from | `CellCoords` | Selection start coords object. |
| to | `CellCoords` | Selection end coords object. |
| highlight | `CellCoords` | Selection cell focus coords object. |



### beforeSelectionFocusSet

::: ask-about-api beforeSelectionFocusSet|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1621

:::

_beforeSelectionFocusSet(coords)_

Fired before setting focus selection.

**Since**: 14.3.0  

| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | CellCoords instance. |



### beforeSelectionHighlightSet

::: ask-about-api beforeSelectionHighlightSet|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1646

:::

_beforeSelectionHighlightSet_

Fired before applying selection coordinates to the renderable coordinates for Walkontable (rendering engine).
It occurs even when cell coordinates remain unchanged and activates during cell selection and drag selection.
The behavior of <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> differs from <kbd>**←**</kbd> when there's no further movement possible.

**Since**: 14.0.0  


### beforeSelectRows

::: ask-about-api beforeSelectRows|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L994

:::

_beforeSelectRows(from, to, highlight)_

Fired before one or more rows are selected (e.g. during mouse header click or [Core#selectRows](@/api/core.md#selectrows) API call).

**Since**: 14.0.0  
**Example**  
::: only-for javascript
```js
new Handsontable(element, {
  beforeSelectRows: (from, to, highlight) => {
    // Extend the row selection by one row up and one row bottom more.
    from.row = Math.max(from.row - 1, 0);
    to.row = Math.min(to.row + 1, this.countRows() - 1);
  }
})
```
:::

::: only-for react
```jsx
<HotTable
  beforeSelectRows={(from, to, highlight) => {
    // Extend the row selection by one row up and one row bottom more.
    from.row = Math.max(from.row - 1, 0);
    to.row = Math.min(to.row + 1, this.countRows() - 1);
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  beforeSelectRows: (from, to, highlight) => {
    // Extend the row selection by one row up and one row down.
    from.row = Math.max(from.row - 1, 0);
    to.row = Math.min(to.row + 1, this.countRows() - 1);
  },
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

| Param | Type | Description |
| --- | --- | --- |
| from | `CellCoords` | Selection start coords object. |
| to | `CellCoords` | Selection end coords object. |
| highlight | `CellCoords` | Selection cell focus coords object. |



### beforeSetCellMeta

::: ask-about-api beforeSetCellMeta|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1610

:::

_beforeSetCellMeta(row, column, key, value) ⇒ boolean | undefined_

Fired before cell meta is changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | The updated meta key. |
| value | `*` | The updated meta value. |


**Returns**: `boolean` | `undefined` - If false is returned the action is canceled.  

### beforeSetRangeEnd

::: ask-about-api beforeSetRangeEnd|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1640

:::

_beforeSetRangeEnd(coords)_

Fired before setting range is ended.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | `CellCoords` instance. |



### beforeSetRangeStart

::: ask-about-api beforeSetRangeStart|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1634

:::

_beforeSetRangeStart(coords)_

Fired before setting range is started.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | `CellCoords` instance. |



### beforeSetRangeStartOnly

::: ask-about-api beforeSetRangeStartOnly|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1628

:::

_beforeSetRangeStartOnly(coords)_

Fired before setting range is started but not finished yet.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | `CellCoords` instance. |



### beforeStretchingColumnWidth

::: ask-about-api beforeStretchingColumnWidth|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2346

:::

_beforeStretchingColumnWidth(stretchedWidth, column) ⇒ number | undefined_

Fired before applying stretched column width to column.


| Param | Type | Description |
| --- | --- | --- |
| stretchedWidth | `number` | Calculated width. |
| column | `number` | Visual column index. |


**Returns**: `number` | `undefined` - Returns new width which will be applied to the column element.  

### beforeTouchScroll

::: ask-about-api beforeTouchScroll|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1654

:::

_beforeTouchScroll_

Fired before the logic of handling a touch scroll, when user started scrolling on a touch-enabled device.



### beforeTrimRow

::: ask-about-api beforeTrimRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2815

:::

_beforeTrimRow(currentTrimConfig, destinationTrimConfig, actionPossible) ⇒ undefined | boolean_

Fired by [TrimRows](@/api/trimRows.md) plugin before trimming rows. This hook is fired when [Options#trimRows](@/api/options.md#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the trimming action will not be completed.  

### beforeUndo

::: ask-about-api beforeUndo|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2599

:::

_beforeUndo(action) ⇒ \* | boolean_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeUndoStackChange

::: ask-about-api beforeUndoStackChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2608

:::

_beforeUndoStackChange(doneActions, [source]) ⇒ \* | boolean_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before changing undo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| doneActions | `Array` | Stack of actions which may be undone. |
| [source] | `string` | `optional` String that identifies source of action                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |


**Returns**: `*` | `boolean` - If false is returned the action of changing undo stack is canceled.  

### beforeUnhideColumns

::: ask-about-api beforeUnhideColumns|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2796

:::

_beforeUnhideColumns(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean_

Fired by [HiddenColumns](@/api/hiddenColumns.md) plugin before marking the columns as not hidden. Fired only if the [Options#hiddenColumns](@/api/options.md#hiddencolumns) option is enabled.
Returning `false` in the callback will prevent the column revealing action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical column indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical column indexes. |
| actionPossible | `boolean` | `true`, if the provided column indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the hiding action will not be completed.  

### beforeUnhideRows

::: ask-about-api beforeUnhideRows|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2758

:::

_beforeUnhideRows(currentHideConfig, destinationHideConfig, actionPossible) ⇒ undefined | boolean_

Fired by [HiddenRows](@/api/hiddenRows.md) plugin before marking the rows as not hidden. Fired only if the [Options#hiddenRows](@/api/options.md#hiddenrows) option is enabled.
Returning `false` in the callback will prevent the row revealing action from completing.


| Param | Type | Description |
| --- | --- | --- |
| currentHideConfig | `Array` | Current hide configuration - a list of hidden physical row indexes. |
| destinationHideConfig | `Array` | Destination hide configuration - a list of hidden physical row indexes. |
| actionPossible | `boolean` | `true`, if provided row indexes are valid, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the revealing action will not be completed.  

### beforeUnmergeCells

::: ask-about-api beforeUnmergeCells|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3093

:::

_beforeUnmergeCells(cellRange, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin before unmerging the cells. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeUntrimRow

::: ask-about-api beforeUntrimRow|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2834

:::

_beforeUntrimRow(currentTrimConfig, destinationTrimConfig, actionPossible) ⇒ undefined | boolean_

Fired by [TrimRows](@/api/trimRows.md) plugin before untrimming rows. This hook is fired when [Options#trimRows](@/api/options.md#trimrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentTrimConfig | `Array` | Current trim configuration - a list of trimmed physical row indexes. |
| destinationTrimConfig | `Array` | Destination trim configuration - a list of trimmed physical row indexes. |
| actionPossible | `boolean` | `true`, if all of the row indexes are withing the bounds of the table, `false` otherwise. |


**Returns**: `undefined` | `boolean` - If the callback returns `false`, the untrimming action will not be completed.  

### beforeUpdateData

::: ask-about-api beforeUpdateData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1424

:::

_beforeUpdateData(sourceData, initialLoad, source) ⇒ Array_

Fired before the [`updateData()`](@/api/core.md#updatedata) method
modifies Handsontable's [`data`](@/api/options.md#data).

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Since**: 11.1.0  

| Param | Type | Description |
| --- | --- | --- |
| sourceData | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data |
| initialLoad | `boolean` | A flag that indicates whether the data was loaded at Handsontable's initialization (`true`) or later (`false`) |
| source | `string` | The source of the call |


**Returns**: `Array` - The returned array will be used as Handsontable's new dataset.  

### beforeValidate

::: ask-about-api beforeValidate|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1659

:::

_beforeValidate(value, row, prop, [source])_

Fired before cell validation, only if validator function is defined. This can be used to manipulate the value
of changed cell before it is applied to the validator function.

__Note:__ this will not affect values of changes. This will change value *ONLY* for validation.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | Value of the cell. |
| row | `number` | Visual row index. |
| prop | `string` <br/> `number` | Property name / column index. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### beforeValueRender

::: ask-about-api beforeValueRender|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1672

:::

_beforeValueRender(value, cellProperties)_

Fired before cell value is rendered into the DOM (through renderer function). This can be used to manipulate the
value which is passed to the renderer without modifying the renderer itself.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | Cell value to render. |
| cellProperties | `object` | An object containing the cell properties. |



### beforeViewportScroll

::: ask-about-api beforeViewportScroll|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L709

:::

_beforeViewportScroll_

Fired before the vertical or horizontal viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
method or table internals.

**Since**: 14.0.0  


### beforeViewportScrollHorizontally

::: ask-about-api beforeViewportScrollHorizontally|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L696

:::

_beforeViewportScrollHorizontally(visualColumn, [snapping]) ⇒ number | boolean_

Fired before the horizontal viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
method or table internals.

**Since**: 14.0.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| visualColumn | `number` |  | Visual column index. |
| [snapping] | `'auto'` <br/> `'start'` <br/> `'end'` | <code>&#x27;auto&#x27;</code> | `optional` If `'start'`, viewport is scrolled to show the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport. |


**Returns**: `number` | `boolean` - Returns modified column index (or the same as passed in the method argument) to which
the viewport will be scrolled. If the returned value is `false`, the scrolling will be canceled.  

### beforeViewportScrollVertically

::: ask-about-api beforeViewportScrollVertically|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L682

:::

_beforeViewportScrollVertically(visualRow, [snapping]) ⇒ number | boolean_

Fired before the vertical viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
method or table internals.

**Since**: 14.0.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| visualRow | `number` |  | Visual row index. |
| [snapping] | `'auto'` <br/> `'top'` <br/> `'bottom'` | <code>&#x27;auto&#x27;</code> | `optional` If `'top'`, viewport is scrolled to show the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on the bottom of the table. When `'auto'`, the viewport is scrolled only when the row is outside of the viewport. |


**Returns**: `number` | `boolean` - Returns modified row index (or the same as passed in the method argument) to which
the viewport will be scrolled. If the returned value is `false`, the scrolling will be canceled.  

### beforeViewRender

::: ask-about-api beforeViewRender|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1536

:::

_beforeViewRender(isForced, skipRender)_

Fired before Handsontable's view-rendering engine is rendered.

__Note:__ In Handsontable 9.x and earlier, the `beforeViewRender` hook was named `beforeRender`.

**Since**: 10.0.0  

| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | If set to `true`, the rendering gets triggered by a change of settings, a change of                           data, or a logic that needs a full Handsontable render cycle.                           If set to `false`, the rendering gets triggered by scrolling or moving the selection. |
| skipRender | `object` | Object with `skipRender` property, if it is set to `true ` the next rendering cycle will be skipped. |



### beforeWidthChange

::: ask-about-api beforeWidthChange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1364

:::

_beforeWidthChange(width) ⇒ number | string_

Fired before the width of the table is changed.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| width | `number` <br/> `string` | Table width. |


**Returns**: `number` | `string` - Modified table width.  

### construct

::: ask-about-api construct|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1680

:::

_construct_

Fired after Handsontable instance is constructed (using `new` operator).



### dialogFocusNextElement

::: ask-about-api dialogFocusNextElement|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2961

:::

_dialogFocusNextElement_

Fired by [Dialog](@/api/dialog.md) plugin before focusing the next element. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### dialogFocusPreviousElement

::: ask-about-api dialogFocusPreviousElement|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2954

:::

_dialogFocusPreviousElement_

Fired by [Dialog](@/api/dialog.md) plugin before focusing the previous element. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### hasExternalDataSource

::: ask-about-api hasExternalDataSource|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L495

:::

_hasExternalDataSource ⇒ boolean | void_

Queried to determine if the instance uses an external data source (complete [[Options#dataProvider]] configuration).
When the DataProvider plugin is enabled, it adds an instance handler in `enablePlugin()`. Callbacks may return
`true`, `false`, or `undefined`; the value propagates through the hook chain like other [[Hooks#run]] hooks.

**Since**: 17.1.0  


### init

::: ask-about-api init|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1685

:::

_init_

Fired after Handsontable instance is initiated but before table is rendered.



### modifyAutoColumnSizeSeed

::: ask-about-api modifyAutoColumnSizeSeed|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L3179

:::

_modifyAutoColumnSizeSeed(seed, cellProperties, cellValue)_

Fired by [AutoColumnSize](@/api/autoColumnSize.md) plugin within SampleGenerator utility.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| seed | `string` <br/> `undefined` | Seed ID, unique name to categorize samples. |
| cellProperties | `object` | Object containing the cell properties. |
| cellValue | `*` | Value of the cell. |



### modifyAutofillRange

::: ask-about-api modifyAutofillRange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1852

:::

_modifyAutofillRange(entireArea, startArea) ⇒ Array&lt;number&gt;_

Fired by [Autofill](@/api/autofill.md) plugin to allow modifying the autofill range. This hook is fired when [Options#fillHandle](@/api/options.md#fillhandle)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| entireArea | `Array<number>` | Visual coordinates of the entire area of the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |
| startArea | `Array<number>` | Visual coordinates of the starting point for the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |


**Returns**: `Array<number>` - The modified autofill range (`[startRow, startColumn, endRow, endColumn]`).  

### modifyColHeader

::: ask-about-api modifyColHeader|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1690

:::

_modifyColHeader(column)_

Fired when a column header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column header index. |



### modifyColumnHeaderHeight

::: ask-about-api modifyColumnHeaderHeight|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2581

:::

_modifyColumnHeaderHeight_

Fired while retrieving the column header height.



### modifyColumnHeaderValue

::: ask-about-api modifyColumnHeaderValue|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2586

:::

_modifyColumnHeaderValue(value, visualColumnIndex, [headerLevel]) ⇒ string_

Fired while retrieving a column header's value.

**Since**: 12.3.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `string` |  | A column header value. |
| visualColumnIndex | `number` |  | A visual column index. |
| [headerLevel] | `number` | <code>0</code> | `optional` Header level index. Accepts positive (`0` to `n`)                                 and negative (`-1` to `-n`) values. For positive values, `0` points to the                                 topmost header. For negative values, `-1` points to the bottom-most                                 header (the header closest to the cells). |


**Returns**: `string` - The column header value to be updated.  

### modifyColWidth

::: ask-about-api modifyColWidth|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1696

:::

_modifyColWidth(width, column, [source])_

Fired when a column width is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | Current column width. |
| column | `number` | Visual column index. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### modifyCopyableRange

::: ask-about-api modifyCopyableRange|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1861

:::

_modifyCopyableRange(copyableRanges)_

Fired to allow modifying the copyable range with a callback function.


| Param | Type | Description |
| --- | --- | --- |
| copyableRanges | `Array<Array>` | Array of objects defining copyable cells. |



### modifyData

::: ask-about-api modifyData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1747

:::

_modifyData(row, column, valueHolder, ioMode)_

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| valueHolder | `object` | Object which contains original value which can be modified by overwriting `.value` property. |
| ioMode | `string` | String which indicates for what operation hook is fired (`get` or `set`). |



### modifyFiltersMultiSelectValue

::: ask-about-api modifyFiltersMultiSelectValue|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1704

:::

_modifyFiltersMultiSelectValue(item, meta)_

Fired when rendering the list of values in the multiple-selection component of the Filters dropdown.
The hook allows modifying the displayed values in that component.

**Since**: 14.2.0  

| Param | Type | Description |
| --- | --- | --- |
| item | `object` | The item in the list of values. |
| meta | `object` | The cell properties object. |



### modifyFocusedElement

::: ask-about-api modifyFocusedElement|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1713

:::

_modifyFocusedElement(row, column, focusedElement)_

Fired when focusing a cell or a header element. Allows replacing the element to be focused by returning a
different HTML element.

**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |
| focusedElement | `HTMLElement` <br/> `undefined` | The element to be focused. `null` for focusedElement is intended when focused cell is hidden. |



### modifyFocusOnTabNavigation

::: ask-about-api modifyFocusOnTabNavigation|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1797

:::

_modifyFocusOnTabNavigation(tabActivationDir, visualCoords) ⇒ undefined | boolean_

Used to modify the cell coordinates when the table is activated (going into the listen mode).

**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| tabActivationDir | `'from_above'` <br/> `'from_below'` | The browsers Tab navigation direction. Depending on whether the user activated the table from the element above or below, another cell can be selected. |
| visualCoords | `CellCoords` | The coords that will be used to select a cell. |


**Returns**: `undefined` | `boolean` - If `false` is returned, the table will not be focused.  

### modifyGetCellCoords

::: ask-about-api modifyGetCellCoords|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1772

:::

_modifyGetCellCoords(row, column, topmost, source) ⇒ undefined | Array&lt;number&gt;_

Used to modify the cell coordinates when using the [`getCell`](@/api/core.md#getcell) method, opening editor, getting value from the editor
and saving values from the closed editor.

**Since**: 0.36.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| topmost | `boolean` | If set to `true`, it returns the TD element from the topmost overlay. For example,                          if the wanted cell is in the range of fixed rows, it will return a TD element                          from the `top` overlay. |
| source | `string` | String that identifies how this coords change will be processed. Possible values:                        `meta` the change will affect the cell meta and data; `render` the change will affect the                        DOM element that will be returned by the `getCell` method. |



### modifyGetCoordsElement

::: ask-about-api modifyGetCoordsElement|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1788

:::

_modifyGetCoordsElement(row, column) ⇒ undefined | Array&lt;number&gt;_

Used to modify the returned cell coordinates of clicked cells (TD or TH elements).

**Since**: 14.6.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### modifyRowData

::: ask-about-api modifyRowData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1766

:::

_modifyRowData(row)_

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |



### modifyRowHeader

::: ask-about-api modifyRowHeader|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1723

:::

_modifyRowHeader(row)_

Fired when a row header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row header index. |



### modifyRowHeaderWidth

::: ask-about-api modifyRowHeaderWidth|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2666

:::

_modifyRowHeaderWidth(rowHeaderWidth)_

Fired while retrieving the row header width.


| Param | Type | Description |
| --- | --- | --- |
| rowHeaderWidth | `number` | Row header width. |



### modifyRowHeight

::: ask-about-api modifyRowHeight|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1729

:::

_modifyRowHeight(height, row, [source])_

Fired when a row height is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| height | `number` | Row height. |
| row | `number` | Visual row index. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### modifyRowHeightByOverlayName

::: ask-about-api modifyRowHeightByOverlayName|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1737

:::

_modifyRowHeightByOverlayName(height, row, overlayName)_

Fired when a row height is about to be modified by a callback function. The hook allows to change the row height
for the specified overlay type.

**Since**: 14.5.0  

| Param | Type | Description |
| --- | --- | --- |
| height | `number` | Row height. |
| row | `number` | Visual row index. |
| overlayName | `'inline_start'` <br/> `'top'` <br/> `'top_inline_start_corner'` <br/> `'bottom'` <br/> `'bottom_inline_start_corner'` <br/> `'master'` | Overlay name. |



### modifySourceData

::: ask-about-api modifySourceData|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L1756

:::

_modifySourceData(row, column, valueHolder, ioMode)_

Fired when a data was retrieved or modified from the source data set.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| column | `number` | Physical column index or property name. |
| valueHolder | `object` | Object which contains original value which can be modified by overwriting `.value` property. |
| ioMode | `string` | String which indicates for what operation hook is fired (`get` or `set`). |



### modifyTransformEnd

::: ask-about-api modifyTransformEnd|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2685

:::

_modifyTransformEnd(delta)_

Fired when the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### modifyTransformFocus

::: ask-about-api modifyTransformFocus|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2672

:::

_modifyTransformFocus(delta)_

Fired when the focus of the selection is being modified (e.g. Moving the focus with the enter/tab keys).

**Since**: 14.3.0  

| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### modifyTransformStart

::: ask-about-api modifyTransformStart|Hooks

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/core/hooks/constants.ts#L2679

:::

_modifyTransformStart(delta)_

Fired when the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



