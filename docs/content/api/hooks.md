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

# Plugin: Hooks

[[toc]]
## Members

### afterAddChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3092

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1219

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3245

:::

_afterBeginEditing(row, column)_

Fired after the editor is opened and rendered.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index of the edited cell. |
| column | `number` | Visual column index of the edited cell. |



### afterCellMetaReset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L131

:::

_afterCellMetaReset_

Fired after resetting a cell's meta. This happens when the [Core#updateSettings](@/api/core.md#updatesettings) method is called.



### afterChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L138

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3345

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3369

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2282

:::

_afterColumnFreeze(column, freezePerformed)_

Fired by the [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin, right after freezing a column.

**Since**: 12.1.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual index of the frozen column. |
| freezePerformed | `boolean` | If `true`: the column got successfully frozen. If `false`: the column didn't get frozen. |



### afterColumnMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2312

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2405

:::

_afterColumnResize(newSize, column, isDoubleClick)_

Fired by [ManualColumnResize](@/api/manualColumnResize.md) plugin after rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](@/api/options.md#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new column width. |
| column | `number` | Visual index of the resized column. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |



### afterColumnSequenceChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L317

:::

_afterColumnSequenceChange([source])_

Fired after the order of columns has changed.
This hook is fired by changing column indexes of any type supported by the [IndexMapper](@/api/indexMapper.md).


| Param | Type | Description |
| --- | --- | --- |
| [source] | `'init'` <br/> `'remove'` <br/> `'insert'` <br/> `'move'` <br/> `'update'` | `optional` A string that indicates what caused the change to the order of columns. |



### afterColumnSort
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1964

:::

_afterColumnSort(currentSortConfig, destinationSortConfigs)_

Fired by [ColumnSorting](@/api/columnSorting.md) and [MultiColumnSorting](@/api/multiColumnSorting.md) plugins after sorting the column. This hook is fired when [Options#columnSorting](@/api/options.md#columnsorting)
or [Options#multiColumnSorting](@/api/options.md#multicolumnsorting) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| currentSortConfig | `Array` | Current sort configuration (for all sorted columns). |
| destinationSortConfigs | `Array` | Destination sort configuration (for all sorted columns). |



### afterColumnUnfreeze
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2343

:::

_afterColumnUnfreeze(column, unfreezePerformed)_

Fired by the [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin, right after unfreezing a column.

**Since**: 12.1.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual index of the unfrozen column. |
| unfreezePerformed | `boolean` | If `true`: the column got successfully unfrozen. If `false`: the column didn't get unfrozen. |



### afterContextMenuDefaultOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L190

:::

_afterContextMenuDefaultOptions(predefinedItems)_

Fired each time user opens [ContextMenu](@/api/contextMenu.md) and after setting up the Context Menu's default options. These options are a collection
which user can select by setting an array of keys or an array of objects in [Options#contextMenu](@/api/options.md#contextmenu) option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | `Array` | An array of objects containing information about the pre-defined Context Menu items. |



### afterContextMenuHide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L229

:::

_afterContextMenuHide(context)_

Fired by [ContextMenu](@/api/contextMenu.md) plugin after hiding the Context Menu. This hook is fired when [Options#contextMenu](@/api/options.md#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The Context Menu plugin instance. |



### afterContextMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L247

:::

_afterContextMenuShow(context)_

Fired by [ContextMenu](@/api/contextMenu.md) plugin after opening the Context Menu. This hook is fired when [Options#contextMenu](@/api/options.md#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The Context Menu plugin instance. |



### afterCopy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2170

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L256

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L326

:::

_afterCreateCol(index, amount, [source])_

Fired after created a new column.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created column in the data source. |
| amount | `number` | Number of newly created columns in the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterCreateRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L349

:::

_afterCreateRow(index, amount, [source])_

Fired after created a new row.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Represents the visual index of first newly created row in the data source array. |
| amount | `number` | Number of newly created rows in the data source array. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterCut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2070

:::

_afterCut(data, coords)_

Fired by [CopyPaste](@/api/copyPaste.md) plugin after data was cut out from the table. This hook is fired when
[Options#copyPaste](@/api/options.md#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays with the cut data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       which was cut out. |



### afterDeselect
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L360

:::

_afterDeselect_

Fired after all selected cells are deselected.



### afterDestroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L367

:::

_afterDestroy_

Fired after destroying the Handsontable instance.



### afterDetachChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3113

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3197

:::

_afterDialogFocus(focusSource)_

Fired by [Dialog](@/api/dialog.md) plugin when the focus is set. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| focusSource | `'tab_from_above'` <br/> `'tab_from_below'` <br/> `'click'` <br/> `'show'` | The source of the focus. |



### afterDialogHide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3143

:::

_afterDialogHide_

Fired by [Dialog](@/api/dialog.md) plugin after hiding the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### afterDialogShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3152

:::

_afterDialogShow_

Fired by [Dialog](@/api/dialog.md) plugin after showing the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### afterDocumentKeyDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L374

:::

_afterDocumentKeyDown(event)_

Hook fired after `keydown` event is handled.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | A native `keydown` event object. |



### afterDrawSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L382

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L209

:::

_afterDropdownMenuDefaultOptions(predefinedItems)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin after setting up the Dropdown Menu's default options. These options are a
collection which user can select by setting an array of keys or an array of objects in [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItems | `Array<object>` | An array of objects containing information about the pre-defined Context Menu items. |



### afterDropdownMenuHide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3072

:::

_afterDropdownMenuHide(instance)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin after hiding the Dropdown Menu. This hook is fired when [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| instance | `DropdownMenu` | The `DropdownMenu` instance. |



### afterDropdownMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3063

:::

_afterDropdownMenuShow(dropdownMenu)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin after opening the Dropdown Menu. This hook is fired when [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | `DropdownMenu` | The `DropdownMenu` instance. |



### afterFilter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2527

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2650

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L413

:::

_afterGetCellMeta(row, column, cellProperties)_

Fired after getting the cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| cellProperties | `object` | Object containing the cell properties. |



### afterGetColHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L423

:::

_afterGetColHeader(column, TH, [headerLevel])_

Fired after retrieving information about a column header and appending it to the table header.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| TH | `HTMLTableCellElement` |  | Header's TH element. |
| [headerLevel] | `number` | <code>0</code> | `optional` (Since 12.2.0) Header level index. Accepts positive (0 to n)                                 and negative (-1 to -n) values. For positive values, 0 points to the                                 topmost header. For negative values, -1 points to the bottom-most                                 header (the header closest to the cells). |



### afterGetColumnHeaderRenderers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2439

:::

_afterGetColumnHeaderRenderers(renderers)_

Fired after getting the column header renderers.


| Param | Type | Description |
| --- | --- | --- |
| renderers | `Array<function()>` | An array of the column header renderers. |



### afterGetRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L436

:::

_afterGetRowHeader(row, TH)_

Fired after retrieving information about a row header and appending it to the table header.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| TH | `HTMLTableCellElement` | Header's TH element. |



### afterGetRowHeaderRenderers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2447

:::

_afterGetRowHeaderRenderers(renderers)_

Fired after getting the row header renderers.


| Param | Type | Description |
| --- | --- | --- |
| renderers | `Array<function()>` | An array of the row header renderers. |



### afterHideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2974

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2928

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L445

:::

_afterInit_

Fired after the Handsontable instance is initiated.



### afterLanguageChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1194

:::

_afterLanguageChange(languageCode)_

Fired after successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | `string` | New language code. |



### afterListen
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3295

:::

_afterListen_

Fired after the table was switched into listening mode. This allows Handsontable to capture keyboard events and
respond in the right way.



### afterLoadData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L452

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3236

:::

_afterLoadingHide_

Fired by [Loading](@/api/loading.md) plugin after hiding the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled.

**Since**: 16.1.0  


### afterLoadingShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3217

:::

_afterLoadingShow_

Fired by [Loading](@/api/loading.md) plugin after showing the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled.

**Since**: 16.1.0  


### afterMergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3264

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2877

:::

_afterModifyTransformEnd(coords, rowTransformDir, colTransformDir)_

Fired after the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coords of the freshly selected cell. |
| rowTransformDir | `number` | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterModifyTransformFocus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2856

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2867

:::

_afterModifyTransformStart(coords, rowTransformDir, colTransformDir)_

Fired after the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coords of the freshly selected cell. |
| rowTransformDir | `number` | `-1` if trying to select a cell with a negative row index. `0` otherwise. |
| colTransformDir | `number` | `-1` if trying to select a cell with a negative column index. `0` otherwise. |



### afterMomentumScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L484

:::

_afterMomentumScroll_

Fired after a scroll event, which is identified as a momentum scroll (e.g. on an iPad).



### afterNamedExpressionAdded
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2669

:::

_afterNamedExpressionAdded(namedExpressionName, changes)_

Fired when a named expression is added to the Formulas' engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| namedExpressionName | `string` | The name of the added expression. |
| changes | `Array` | The values and location of applied changes. |



### afterNamedExpressionRemoved
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2679

:::

_afterNamedExpressionRemoved(namedExpressionName, changes)_

Fired when a named expression is removed from the Formulas' engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| namedExpressionName | `string` | The name of the removed expression. |
| changes | `Array` | The values and location of applied changes. |



### afterOnCellContextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L535

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L499

:::

_afterOnCellCornerDblClick(event)_

Fired after a `dblclick` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `dblclick` event object. |



### afterOnCellCornerMouseDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L491

:::

_afterOnCellCornerMouseDown(event)_

Fired after a `mousedown` event is triggered on the cell corner (the drag handle).


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mousedown` event object. |



### afterOnCellMouseDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L507

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L563

:::

_afterOnCellMouseOut(event, coords, TD)_

Fired after leaving a cell or row/column header with the mouse cursor.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | `mouseout` event object. |
| coords | `CellCoords` | Leaved cell's visual coordinate object. |
| TD | `HTMLTableCellElement` | Cell's TD (or TH) element. |



### afterOnCellMouseOver
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L549

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



### afterOnCellMouseUp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L521

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2586

:::

_afterPageChange(oldPage, newPage)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the page. This hook is fired when
[Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| oldPage | `number` | The old page number. |
| newPage | `number` | The new page number. |



### afterPageCounterVisibilityChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2630

:::

_afterPageCounterVisibilityChange(isVisible)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the visibility state of the page counter section.
This hook is fired when [Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | The visibility state of the page size section. |



### afterPageNavigationVisibilityChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2640

:::

_afterPageNavigationVisibilityChange(isVisible)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the visibility state of the page navigation section.
This hook is fired when [Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | The visibility state of the page size section. |



### afterPageSizeChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2609

:::

_afterPageSizeChange(oldPageSize, newPageSize)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the page size. This hook is fired when
[Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| oldPageSize | `number` <br/> `'auto'` | The old page size. |
| newPageSize | `number` <br/> `'auto'` | The new page size. |



### afterPageSizeVisibilityChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2620

:::

_afterPageSizeVisibilityChange(isVisible)_

Fired by [Pagination](@/api/pagination.md) plugin after changing the visibility state of the page size section.
This hook is fired when [Options#pagination](@/api/options.md#pagination) option is enabled.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| isVisible | `boolean` | The visibility state of the page size section. |



### afterPaste
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2260

:::

_afterPaste(data, coords)_

Fired by [CopyPaste](@/api/copyPaste.md) plugin after values are pasted into table. This hook is fired when
[Options#copyPaste](@/api/options.md#copypaste) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array<Array>` | An array of arrays with the pasted data. |
| coords | `Array<object>` | An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)                       that correspond to the previously selected area. |



### afterPluginsInitialized
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2903

:::

_afterPluginsInitialized_

Fired after initializing all the plugins.
This hook should be added before Handsontable is initialized.

**Example**  
```js
Handsontable.hooks.add('afterPluginsInitialized', myCallback);
```


### afterRedo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2803

:::

_afterRedo(action)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |



### afterRedoStackChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2813

:::

_afterRedoStackChange(undoneActionsBefore, undoneActionsAfter)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after changing redo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| undoneActionsBefore | `Array` | Stack of actions which could be redone before performing new action. |
| undoneActionsAfter | `Array` | Stack of actions which can be redone after performing new action. |



### afterRefreshDimensions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3311

:::

_afterRefreshDimensions(previousDimensions, currentDimensions, stateChanged)_

Fired after the window was resized or the size of the Handsontable root element was changed.


| Param | Type | Description |
| --- | --- | --- |
| previousDimensions | `Object` | Previous dimensions of the container. |
| currentDimensions | `Object` | Current dimensions of the container. |
| stateChanged | `boolean` | `true`, if the container was re-render, `false` otherwise. |



### afterRemoveCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1107

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L573

:::

_afterRemoveCol(index, amount, physicalColumns, [source])_

Fired after one or more columns are removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter column. |
| amount | `number` | An amount of removed columns. |
| physicalColumns | `Array<number>` | An array of physical columns removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterRemoveRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L585

:::

_afterRemoveRow(index, amount, physicalRows, [source])_

Fired after one or more rows are removed.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of starter row. |
| amount | `number` | An amount of removed rows. |
| physicalRows | `Array<number>` | An array of physical rows removed from the data source. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1601

:::

_afterRender(isForced)_

Fired after Handsontable's view-rendering engine updates the view.


| Param | Type | Description |
| --- | --- | --- |
| isForced | `boolean` | If set to `true`, the rendering gets triggered by a change of settings, a change of                           data, or a logic that needs a full Handsontable render cycle.                           If set to `false`, the rendering gets triggered by scrolling or moving the selection. |



### afterRenderer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L610

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2373

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2428

:::

_afterRowResize(newSize, row, isDoubleClick)_

Fired by [ManualRowResize](@/api/manualRowResize.md) plugin after rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](@/api/options.md#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new row height. |
| row | `number` | Visual index of the resized row. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |



### afterRowSequenceChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L623

:::

_afterRowSequenceChange([source])_

Fired after the order of rows has changed.
This hook is fired by changing row indexes of any type supported by the [IndexMapper](@/api/indexMapper.md).


| Param | Type | Description |
| --- | --- | --- |
| [source] | `'init'` <br/> `'remove'` <br/> `'insert'` <br/> `'move'` <br/> `'update'` | `optional` A string that indicates what caused the change to the order of rows. |



### afterScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L686

:::

_afterScroll_

Fired after the vertical or horizontal scroll event.

**Since**: 14.0.0  


### afterScrollHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L672

:::

_afterScrollHorizontally_

Fired after the horizontal scroll event.



### afterScrollVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L679

:::

_afterScrollVertically_

Fired after the vertical scroll event.



### afterSelectAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1085

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L959

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L694

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L762

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L823

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L835

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L849

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1021

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1096

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1118

:::

_afterSetDataAtCell(changes, [source])_

Fired after cell data was changed.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterSetDataAtRowProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1128

:::

_afterSetDataAtRowProp(changes, [source])_

Fired after cell data was changed.
Called only when [`setDataAtRowProp`](@/api/core.md#setdataatrowprop) was executed.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, prop, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### afterSetSourceDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1139

:::

_afterSetSourceDataAtCell(changes, [source])_

Fired after cell source data was changed.

**Since**: 8.0.0  

| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | An array of changes in format `[[row, column, oldValue, value], ...]`. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### afterSetTheme
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1149

:::

_afterSetTheme(themeName, firstRun)_

Fired after a theme is enabled, changed, or disabled.

**Since**: 15.0.0  

| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `boolean` <br/> `undefined` | The theme name. |
| firstRun | `boolean` | `true` if it's the initial setting of the theme, `false` otherwise. |



### afterSheetAdded
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2689

:::

_afterSheetAdded(addedSheetDisplayName)_

Fired when a new sheet is added to the Formulas' engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| addedSheetDisplayName | `string` | The name of the added sheet. |



### afterSheetRemoved
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2708

:::

_afterSheetRemoved(removedSheetDisplayName, changes)_

Fired when a sheet is removed from the Formulas' engine instance.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| removedSheetDisplayName | `string` | The removed sheet name. |
| changes | `Array` | The values and location of applied changes. |



### afterSheetRenamed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2698

:::

_afterSheetRenamed(oldDisplayName, newDisplayName)_

Fired when a sheet in the Formulas' engine instance is renamed.

**Since**: 9.0.0  

| Param | Type | Description |
| --- | --- | --- |
| oldDisplayName | `string` | The old name of the sheet. |
| newDisplayName | `string` | The new name of the sheet. |



### afterTrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3019

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2763

:::

_afterUndo(action)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |



### afterUndoStackChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2773

:::

_afterUndoStackChange(doneActionsBefore, doneActionsAfter)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin after changing undo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| doneActionsBefore | `Array` | Stack of actions which could be undone before performing new action. |
| doneActionsAfter | `Array` | Stack of actions which can be undone after performing new action. |



### afterUnhideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2997

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2951

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3303

:::

_afterUnlisten_

Fired after the table was switched off from the listening mode. This makes the Handsontable inert for any
keyboard events.



### afterUnmergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3285

:::

_afterUnmergeCells(cellRange, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin after unmerging the cells. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### afterUntrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3042

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L468

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1159

:::

_afterUpdateSettings(newSettings)_

Fired after calling the [`updateSettings`](@/api/core.md#updatesettings) method.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | `object` | New settings object. |



### afterValidate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1167

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2895

:::

_afterViewportColumnCalculatorOverride(calc)_

Fired inside the `viewportColumnCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | `object` | The row calculator. |



### afterViewportRowCalculatorOverride
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2887

:::

_afterViewportRowCalculatorOverride(calc)_

Fired inside the `viewportRowCalculatorOverride` method. Allows modifying the row calculator parameters.


| Param | Type | Description |
| --- | --- | --- |
| calc | `object` | The row calculator. |



### afterViewRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1573

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3081

:::

_beforeAddChild(parent, element, index)_

Fired by [NestedRows](@/api/nestedRows.md) plugin before adding a children to the `NestedRows` structure. This hook is fired when
[Options#nestedRows](@/api/options.md#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | The parent object. |
| element | `object` <br/> `undefined` | The element added as a child. If `undefined`, a blank child was added. |
| index | `number` <br/> `undefined` | The index within the parent where the new child was added. If `undefined`, the element was added as the last child. |



### beforeAutofill
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1203

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3124

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
the mouse double click or after pressing the Enter key. Returning `undefined` (or other value
than boolean) will result in default behavior, which disallows opening an editor for non-contiguous
selection (while pressing Ctrl/Cmd) and for multiple selected cells (while pressing SHIFT).
Returning `true` removes those restrictions.  

### beforeCellAlignment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1233

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1245

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1357

:::

_beforeChangeRender(changes, [source])_

Fired right before rendering the changes.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array<Array>` | Array in form of `[row, prop, oldValue, newValue]`. |
| [source] | `string` | `optional` String that identifies source of hook call                          ([list of all available sources](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)). |



### beforeColumnCollapse
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3333

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3357

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2271

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2292

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2393

:::

_beforeColumnResize(newSize, column, isDoubleClick) ⇒ number_

Fired by [ManualColumnResize](@/api/manualColumnResize.md) plugin before rendering the table with modified column sizes. This hook is
fired when [Options#manualColumnResize](@/api/options.md#manualcolumnresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new column width. |
| column | `number` | Visual index of the resized column. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |


**Returns**: `number` - Returns a new column size or `undefined`, if column size should be calculated automatically.  

### beforeColumnSort
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1951

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2332

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1628

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L404

:::

_beforeCompositionStart(event)_

Hook fired after `compositionstart` event is handled.

**Since**: 15.3.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | A native `composition` event object. |



### beforeContextMenuSetItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L199

:::

_beforeContextMenuSetItems(menuItems)_

Fired each time user opens [ContextMenu](@/api/contextMenu.md) plugin before setting up the Context Menu's items but after filtering these options by
user ([`contextMenu`](@/api/options.md#contextmenu) option). This hook can by helpful to determine if user use specified menu item or to set up
one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array<object>` | An array of objects containing information about to generated Context Menu items. |



### beforeContextMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L238

:::

_beforeContextMenuShow(context)_

Fired by [ContextMenu](@/api/contextMenu.md) plugin before opening the Context Menu. This hook is fired when [Options#contextMenu](@/api/options.md#contextmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The Context Menu instance. |



### beforeCopy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2081

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L268

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L337

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1992

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

### beforeDetachChild
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3103

:::

_beforeDetachChild(parent, element)_

Fired by [NestedRows](@/api/nestedRows.md) plugin before detaching a child from its parent. This hook is fired when
[Options#nestedRows](@/api/options.md#nestedrows) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| parent | `object` | An object representing the parent from which the element is to be detached. |
| element | `object` | The detached element. |



### beforeDialogHide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3161

:::

_beforeDialogHide_

Fired by [Dialog](@/api/dialog.md) plugin before hiding the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### beforeDialogShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3170

:::

_beforeDialogShow_

Fired by [Dialog](@/api/dialog.md) plugin before showing the dialog. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### beforeDrawBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1387

:::

_beforeDrawBorders(corners, borderClassName)_

Fired before drawing the borders.


| Param | Type | Description |
| --- | --- | --- |
| corners | `Array` | Array specifying the current selection borders. |
| borderClassName | `string` | Specifies the border class name. |



### beforeDropdownMenuSetItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L219

:::

_beforeDropdownMenuSetItems(menuItems)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin before setting up the Dropdown Menu's items but after filtering these options
by user ([`dropdownMenu`](@/api/options.md#dropdownmenu) option). This hook can by helpful to determine if user use specified menu item or to set
up one of the menu item to by always visible.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array<object>` | An array of objects containing information about to generated Dropdown Menu items. |



### beforeDropdownMenuShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3054

:::

_beforeDropdownMenuShow(dropdownMenu)_

Fired by [DropdownMenu](@/api/dropdownMenu.md) plugin before opening the dropdown menu. This hook is fired when [Options#dropdownMenu](@/api/options.md#dropdownmenu)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| dropdownMenu | `DropdownMenu` | The `DropdownMenu` instance. |



### beforeFilter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2465

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1396

:::

_beforeGetCellMeta(row, column, cellProperties)_

Fired before getting cell settings.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| cellProperties | `object` | Object containing the cell's properties. |



### beforeHeightChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1367

:::

_beforeHeightChange(height) ⇒ number | string_

Fired before the height of the table is changed.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| height | `number` <br/> `string` | Table height. |


**Returns**: `number` | `string` - Modified table height.  

### beforeHideColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2962

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2916

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1905

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1890

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1418

:::

_beforeInit_

Fired before the Handsontable instance is initiated.



### beforeInitWalkontable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1425

:::

_beforeInitWalkontable(walkontableConfig)_

Fired before the Walkontable instance is initiated.


| Param | Type | Description |
| --- | --- | --- |
| walkontableConfig | `object` | Walkontable configuration object. |



### beforeKeyDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1468

:::

_beforeKeyDown(event)_

Hook fired before `keydown` event is handled. It can be used to stop default key bindings.

__Note__: To prevent default behavior you need to call `false` in your `beforeKeyDown` handler.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | Original DOM event. |



### beforeLanguageChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1185

:::

_beforeLanguageChange(languageCode)_

Fired before successful change of language (when proper language code was set).

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| languageCode | `string` | New language code. |



### beforeLoadData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1433

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3226

:::

_beforeLoadingHide ⇒ boolean | undefined_

Fired by [Loading](@/api/loading.md) plugin before hiding the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled.

**Since**: 16.1.0  

**Returns**: `boolean` | `undefined` - If returns `false`, the action will be skipped.  

### beforeLoadingShow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3207

:::

_beforeLoadingShow ⇒ boolean | undefined_

Fired by [Loading](@/api/loading.md) plugin before showing the loading indicator. This hook is fired when [Options#loading](@/api/options.md#loading)
option is enabled. The callback can return `false` to prevent the loading indicator from being shown.

**Since**: 16.1.0  

**Returns**: `boolean` | `undefined` - If returns `false`, the action will be skipped.  

### beforeMergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3254

:::

_beforeMergeCells(cellRange, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin before cell merging. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeOnCellContextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1500

:::

_beforeOnCellContextMenu(event, coords, TD)_

Fired after the user clicked a cell, but before all the calculations related with it.

**Since**: 4.1.0  

| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `contextmenu` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |



### beforeOnCellMouseDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1478

:::

_beforeOnCellMouseDown(event, coords, TD, controller)_

Fired after the user clicked a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mousedown` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |
| controller | `object` | An object with properties `row`, `column` and `cell`. Each property contains                            a boolean value that allows or disallows changing the selection for that particular area. |



### beforeOnCellMouseOut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1523

:::

_beforeOnCellMouseOut(event, coords, TD)_

Fired after the user moved cursor out from a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseout` event object. |
| coords | `CellCoords` | CellCoords object containing the visual coordinates of the leaved cell. |
| TD | `HTMLTableCellElement` | TD element. |



### beforeOnCellMouseOver
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1511

:::

_beforeOnCellMouseOver(event, coords, TD, controller)_

Fired after the user moved cursor over a cell, but before all the calculations related with it.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseover` event object. |
| coords | `CellCoords` | CellCoords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |
| controller | `object` | An object with properties `row`, `column` and `cell`. Each property contains                            a boolean value that allows or disallows changing the selection for that particular area. |



### beforeOnCellMouseUp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1490

:::

_beforeOnCellMouseUp(event, coords, TD)_

Fired after the user clicked a cell.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The `mouseup` event object. |
| coords | `CellCoords` | Cell coords object containing the visual coordinates of the clicked cell. |
| TD | `HTMLTableCellElement` | TD element. |



### beforePageChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2574

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2597

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2182

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2783

:::

_beforeRedo(action) ⇒ \* | boolean_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before the redo action. Contains information about the action that is being redone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being redone. The `actionType`                        property of the object specifies the type of the action in a String format (e.g. `'remove_row'`). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeRedoStackChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2794

:::

_beforeRedoStackChange(undoneActions)_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before changing redo stack.

**Since**: 8.4.0  

| Param | Type | Description |
| --- | --- | --- |
| undoneActions | `Array` | Stack of actions which may be redone. |



### beforeRefreshDimensions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3321

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L395

:::

_beforeRemoveCellClassNames ⇒ Array&lt;string&gt; | undefined_

Fired inside the Walkontable's `refreshSelections` method. Can be used to remove additional class names from all cells in the table.

**Since**: 0.38.1  

**Returns**: `Array<string>` | `undefined` - Can return an `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.  

### beforeRemoveCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1406

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1533

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1546

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1587

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L597

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2353

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2416

:::

_beforeRowResize(newSize, row, isDoubleClick) ⇒ number | undefined_

Fired by [ManualRowResize](@/api/manualRowResize.md) plugin before rendering the table with modified row sizes. This hook is
fired when [Options#manualRowResize](@/api/options.md#manualrowresize) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| newSize | `number` | Calculated new row height. |
| row | `number` | Visual index of the resized row. |
| isDoubleClick | `boolean` | Flag that determines whether there was a double-click. |


**Returns**: `number` | `undefined` - Returns the new row size or `undefined` if row size should be calculated automatically.  

### beforeRowWrap
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1611

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1032

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L908

:::

_beforeSelectColumns(from, to, highlight)_

Fired before one or more columns are selected (e.g. During mouse header click or [Core#selectColumns](@/api/core.md#selectcolumns) API call).

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1658

:::

_beforeSelectionFocusSet(coords)_

Fired before setting focus selection.

**Since**: 14.3.0  

| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | CellCoords instance. |



### beforeSelectionHighlightSet
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1691

:::

_beforeSelectionHighlightSet_

Fired before applying selection coordinates to the renderable coordinates for Walkontable (rendering engine).
It occurs even when cell coordinates remain unchanged and activates during cell selection and drag selection.
The behavior of Shift+Tab differs from Arrow Left when there's no further movement possible.

**Since**: 14.0.0  


### beforeSelectRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L970

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1645

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1683

:::

_beforeSetRangeEnd(coords)_

Fired before setting range is ended.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | `CellCoords` instance. |



### beforeSetRangeStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1675

:::

_beforeSetRangeStart(coords)_

Fired before setting range is started.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | `CellCoords` instance. |



### beforeSetRangeStartOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1667

:::

_beforeSetRangeStartOnly(coords)_

Fired before setting range is started but not finished yet.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | `CellCoords` instance. |



### beforeStretchingColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2455

:::

_beforeStretchingColumnWidth(stretchedWidth, column) ⇒ number | undefined_

Fired before applying stretched column width to column.


| Param | Type | Description |
| --- | --- | --- |
| stretchedWidth | `number` | Calculated width. |
| column | `number` | Visual column index. |


**Returns**: `number` | `undefined` - Returns new width which will be applied to the column element.  

### beforeTouchScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1701

:::

_beforeTouchScroll_

Fired before the logic of handling a touch scroll, when user started scrolling on a touch-enabled device.



### beforeTrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3008

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2740

:::

_beforeUndo(action) ⇒ \* | boolean_

Fired by [UndoRedo](@/api/undoRedo.md) plugin before the undo action. Contains information about the action that is being undone.
This hook is fired when [Options#undo](@/api/options.md#undo) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action object. Contains information about the action being undone. The `actionType`                        property of the object specifies the type of the action in a String format. (e.g. `'remove_row'`). |


**Returns**: `*` | `boolean` - If false is returned the action is canceled.  

### beforeUndoStackChange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2751

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2985

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2939

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3275

:::

_beforeUnmergeCells(cellRange, [auto])_

Fired by [MergeCells](@/api/mergeCells.md) plugin before unmerging the cells. This hook is fired when [Options#mergeCells](@/api/options.md#mergecells)
option is enabled.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellRange | `CellRange` |  | Selection cell range. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called automatically by the plugin. |



### beforeUntrimRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3031

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1451

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1708

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1723

:::

_beforeValueRender(value, cellProperties)_

Fired before cell value is rendered into the DOM (through renderer function). This can be used to manipulate the
value which is passed to the renderer without modifying the renderer itself.


| Param | Type | Description |
| --- | --- | --- |
| value | `*` | Cell value to render. |
| cellProperties | `object` | An object containing the cell properties. |



### beforeViewportScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L663

:::

_beforeViewportScroll_

Fired before the vertical or horizontal viewport scroll. Triggered by the [`scrollViewportTo()`](@/api/core.md#scrollviewportto)
method or table internals.

**Since**: 14.0.0  


### beforeViewportScrollHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L648

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L632

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1559

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1377

:::

_beforeWidthChange(width) ⇒ number | string_

Fired before the width of the table is changed.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| width | `number` <br/> `string` | Table width. |


**Returns**: `number` | `string` - Modified table width.  

### construct
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1733

:::

_construct_

Fired after Handsontable instance is constructed (using `new` operator).



### dialogFocusNextElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3188

:::

_dialogFocusNextElement_

Fired by [Dialog](@/api/dialog.md) plugin before focusing the next element. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### dialogFocusPreviousElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3179

:::

_dialogFocusPreviousElement_

Fired by [Dialog](@/api/dialog.md) plugin before focusing the previous element. This hook is fired when [Options#dialog](@/api/options.md#dialog)
option is enabled.

**Since**: 16.1.0  


### init
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1740

:::

_init_

Fired after Handsontable instance is initiated but before table is rendered.



### modifyAutoColumnSizeSeed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L3381

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1974

:::

_modifyAutofillRange(startArea, entireArea)_

Fired by [Autofill](@/api/autofill.md) plugin after setting range of autofill. This hook is fired when [Options#fillHandle](@/api/options.md#fillhandle)
option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| startArea | `Array` | Array of visual coordinates of the starting point for the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |
| entireArea | `Array` | Array of visual coordinates of the entire area of the drag-down operation (`[startRow, startColumn, endRow, endColumn]`). |



### modifyColHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1747

:::

_modifyColHeader(column)_

Fired when a column header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column header index. |



### modifyColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2718

:::

_modifyColumnHeaderHeight_

Fired while retrieving the column header height.



### modifyColumnHeaderValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2725

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1755

:::

_modifyColWidth(width, column, [source])_

Fired when a column width is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | Current column width. |
| column | `number` | Visual column index. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### modifyCopyableRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1984

:::

_modifyCopyableRange(copyableRanges)_

Fired to allow modifying the copyable range with a callback function.


| Param | Type | Description |
| --- | --- | --- |
| copyableRanges | `Array<Array>` | Array of objects defining copyable cells. |



### modifyData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1818

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1765

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1776

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1878

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1849

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1867

:::

_modifyGetCoordsElement(row, column) ⇒ undefined | Array&lt;number&gt;_

Used to modify the returned cell coordinates of clicked cells (TD or TH elements).

**Since**: 14.6.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### modifyRowData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1841

:::

_modifyRowData(row)_

Fired when a data was retrieved or modified.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |



### modifyRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1788

:::

_modifyRowHeader(row)_

Fired when a row header index is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row header index. |



### modifyRowHeaderWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2823

:::

_modifyRowHeaderWidth(rowHeaderWidth)_

Fired while retrieving the row header width.


| Param | Type | Description |
| --- | --- | --- |
| rowHeaderWidth | `number` | Row header width. |



### modifyRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1796

:::

_modifyRowHeight(height, row, [source])_

Fired when a row height is about to be modified by a callback function.


| Param | Type | Description |
| --- | --- | --- |
| height | `number` | Row height. |
| row | `number` | Visual row index. |
| [source] | `string` | `optional` String that identifies source of hook call. |



### modifyRowHeightByOverlayName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1806

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1829

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2848

:::

_modifyTransformEnd(delta)_

Fired when the end of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### modifyTransformFocus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2831

:::

_modifyTransformFocus(delta)_

Fired when the focus of the selection is being modified (e.g. Moving the focus with the enter/tab keys).

**Since**: 14.3.0  

| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### modifyTransformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L2840

:::

_modifyTransformStart(delta)_

Fired when the start of the selection is being modified (e.g. Moving the selection with the arrow keys).


| Param | Type | Description |
| --- | --- | --- |
| delta | `CellCoords` | Cell coords object declaring the delta of the new selection relative to the previous one. |



### persistentStateLoad
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1920

:::

_persistentStateLoad(key, valuePlaceholder)_

Fired by [PersistentState](@/api/persistentState.md) plugin, after loading value, saved under given key, from browser local storage.

The `persistentStateLoad` hook is fired even when the [Options#persistentState](@/api/options.md#persistentstate) option is disabled.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key. |
| valuePlaceholder | `object` | Object containing the loaded value under `valuePlaceholder.value` (if no value have been saved, `value` key will be undefined). |



### persistentStateReset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1931

:::

_persistentStateReset([key])_

Fired by [PersistentState](@/api/persistentState.md) plugin after resetting data from local storage. If no key is given, all values associated with table will be cleared.
This hook is fired when [Options#persistentState](@/api/options.md#persistentstate) option is enabled.


| Param | Type | Description |
| --- | --- | --- |
| [key] | `string` | `optional` Key. |



### persistentStateSave
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/core/hooks/constants.js#L1940

:::

_persistentStateSave(key, value)_

Fired by [PersistentState](@/api/persistentState.md) plugin, after saving value under given key in browser local storage.

The `persistentStateSave` hook is fired even when the [Options#persistentState](@/api/options.md#persistentstate) option is disabled.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key. |
| value | `Mixed` | Value to save. |



