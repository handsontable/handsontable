---
title: ColumnStatesManager
metaTitle: ColumnStatesManager - Plugin - Handsontable Documentation
permalink: /10.0/api/column-states-manager
canonicalUrl: /api/column-states-manager
hotPlugin: true
editLink: false
---

# ColumnStatesManager

[[toc]]

## Description

Store and manages states of sorted columns.


## Members

### compareFunctionFactory
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L52

:::

_columnStatesManager.compareFunctionFactory_

Determines compare function factory. Method get as parameters `sortOder` and `columnMeta` and return compare function.



### headerAction
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L48

:::

_columnStatesManager.headerAction : boolean_

Determines whether click on the header perform sorting.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L24

:::

_columnStatesManager.hot : [Core](@/api/core.md)_

Handsontable instance.



### indicator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L42

:::

_columnStatesManager.indicator : boolean_

Determines whether indicator should be visible (for sorted columns).



### mapName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L58

:::

_columnStatesManager.mapName_

Name of map storing sorting states. Required for unique name (PR #7440 introduced it). It's needed as
both ColumnSorting and MultiColumnSorting plugins create state manager and as a consequence register maps.
Objects are destroyed in strange order as the updateSettings doesn't work well.



### sortEmptyCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L36

:::

_columnStatesManager.sortEmptyCells : boolean_

Determines whether we should sort empty cells.



### sortingStates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L30

:::

_columnStatesManager.sortingStates : [LinkedPhysicalIndexToValueMap](@/api/linkedPhysicalIndexToValueMap.md)_

Index map storing sorting states for every column. ColumnStatesManager write and read to/from this element.


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L206

:::

_columnStatesManager.destroy()_

Destroy the state manager.



### getAllColumnsProperties
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L87

:::

_columnStatesManager.getAllColumnsProperties() ⇒ object_

Get all column properties which affect the sorting result.



### getColumnSortState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L177

:::

_columnStatesManager.getColumnSortState(column) ⇒ object | undefined_

Get sort state for particular column. Object contains `column` and `sortOrder` properties.

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getIndexOfColumnInSortQueue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L117

:::

_columnStatesManager.getIndexOfColumnInSortQueue(column) ⇒ number_

Get order of particular column in the states queue.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getNumberOfSortedColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L128

:::

_columnStatesManager.getNumberOfSortedColumns() ⇒ number_

Get number of sorted columns.



### getSortOrderOfColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L107

:::

_columnStatesManager.getSortOrderOfColumn(searchedColumn) ⇒ string | undefined_

Get sort order of column.


| Param | Type | Description |
| --- | --- | --- |
| searchedColumn | `number` | Visual column index. |


**Returns**: `string` | `undefined` - Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).  

### getSortStates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L158

:::

_columnStatesManager.getSortStates() ⇒ Array&lt;object&gt;_

Queue of sort states containing sorted columns and their orders (Array of objects containing `column` and `sortOrder` properties).

**Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.



### isColumnSorted
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L147

:::

_columnStatesManager.isColumnSorted(column) ⇒ boolean_

Get if particular column is sorted.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isListOfSortedColumnsEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L137

:::

_columnStatesManager.isListOfSortedColumnsEmpty() ⇒ boolean_

Get if list of sorted columns is empty.



### setSortStates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L193

:::

_columnStatesManager.setSortStates(sortStates)_

Set all column states.


| Param | Type | Description |
| --- | --- | --- |
| sortStates | `Array` | Sort states. |



### updateAllColumnsProperties
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSorting/columnStatesManager.js#L70

:::

_columnStatesManager.updateAllColumnsProperties(allSortSettings)_

Update column properties which affect the sorting result.

**Note**: All column properties can be overwritten by [Options#columns](@/api/options.md#columns) option.


| Param | Type | Description |
| --- | --- | --- |
| allSortSettings | `object` | Column sorting plugin's configuration object. |


