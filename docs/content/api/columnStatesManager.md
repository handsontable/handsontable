---
title: ColumnStatesManager
metaTitle: ColumnStatesManager API reference | Handsontable DataGrid for JavaScript
permalink: /api/column-states-manager
canonicalUrl: /api/column-states-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the column states manager with the Handsontable instance and registers the sorting states index map under the given map name.


## Members

### headerAction

::: ask-about-api headerAction|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L183

:::

_columnStatesManager.headerAction : boolean_

Determines whether click on the header perform sorting.



### indicator

::: ask-about-api indicator|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L178

:::

_columnStatesManager.indicator : boolean_

Determines whether indicator should be visible (for sorted columns).



### sortEmptyCells

::: ask-about-api sortEmptyCells|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L173

:::

_columnStatesManager.sortEmptyCells : boolean_

Determines whether we should sort empty cells.


## Methods

### destroy

::: ask-about-api destroy|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L162

:::

_columnStatesManager.destroy()_

Destroy the state manager.



### getAllColumnsProperties

::: ask-about-api getAllColumnsProperties|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L65

:::

_columnStatesManager.getAllColumnsProperties() ⇒ object_

Get all column properties which affect the sorting result.



### getColumnSortState

::: ask-about-api getColumnSortState|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L138

:::

_columnStatesManager.getColumnSortState(column) ⇒ object | undefined_

Get sort state for particular column. Object contains `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getIndexOfColumnInSortQueue

::: ask-about-api getIndexOfColumnInSortQueue|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L89

:::

_columnStatesManager.getIndexOfColumnInSortQueue(column) ⇒ number_

Get order of particular column in the states queue.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getNumberOfSortedColumns

::: ask-about-api getNumberOfSortedColumns|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L97

:::

_columnStatesManager.getNumberOfSortedColumns() ⇒ number_

Get number of sorted columns.



### getSortOrderOfColumn

::: ask-about-api getSortOrderOfColumn|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L81

:::

_columnStatesManager.getSortOrderOfColumn(searchedColumn) ⇒ string | undefined_

Get sort order of column.


| Param | Type | Description |
| --- | --- | --- |
| searchedColumn | `number` | Visual column index. |


**Returns**: `string` | `undefined` - Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).  

### getSortStates

::: ask-about-api getSortStates|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L121

:::

_columnStatesManager.getSortStates() ⇒ Array&lt;object&gt;_

Queue of sort states containing sorted columns and their orders (Array of objects containing `column` and `sortOrder` properties).

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.



### isColumnSorted

::: ask-about-api isColumnSorted|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L112

:::

_columnStatesManager.isColumnSorted(column) ⇒ boolean_

Get if particular column is sorted.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isListOfSortedColumnsEmpty

::: ask-about-api isListOfSortedColumnsEmpty|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L104

:::

_columnStatesManager.isListOfSortedColumnsEmpty() ⇒ boolean_

Get if list of sorted columns is empty.



### resetAllColumnsProperties

::: ask-about-api resetAllColumnsProperties|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L55

:::

_columnStatesManager.resetAllColumnsProperties()_

Puts every column property which affects the sorting result back to its default value, dropping a
`compareFunctionFactory` set by an earlier configuration object.



### setSortStates

::: ask-about-api setSortStates|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L151

:::

_columnStatesManager.setSortStates(sortStates)_

Set all column states.


| Param | Type | Description |
| --- | --- | --- |
| sortStates | `Array` | Sort states. |



### updateAllColumnsProperties

::: ask-about-api updateAllColumnsProperties|ColumnStatesManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSorting/columnStatesManager.ts#L42

:::

_columnStatesManager.updateAllColumnsProperties(allSortSettings)_

Update column properties which affect the sorting result.

**Note**: All column properties can be overwritten by [Options#columns](@/api/options.md#columns) option.


| Param | Type | Description |
| --- | --- | --- |
| allSortSettings | `object` | Column sorting plugin's configuration object. |


