---
title: DataMap
metaTitle: DataMap - API Reference - Handsontable Documentation
permalink: /10.0/api/data-map
canonicalUrl: /api/data-map
hotPlugin: false
editLink: false
---

# DataMap

[[toc]]

## Description

Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names.



## Members

### colToPropCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L84

:::

_dataMap.colToPropCache : Array_

Cached array of properties to columns.



### dataSource
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L72

:::

_dataMap.dataSource : \*_

Reference to the original dataset.



### DESTINATION_CLIPBOARD_GENERATOR
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L43

:::

_DataMap.DESTINATION\_CLIPBOARD\_GENERATOR : number_



### DESTINATION_RENDERER
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L36

:::

_DataMap.DESTINATION\_RENDERER : number_



### duckSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L78

:::

_dataMap.duckSchema : object_

Generated schema based on the first row from the source data.



### propToColCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L90

:::

_dataMap.propToColCache : Map_

Cached map of properties to columns.


## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L801

:::

_dataMap.clear()_

Clears the data array.



### colToProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L197

:::

_dataMap.colToProp(column) ⇒ string | number_

Returns property name that corresponds with the given column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `string` <br/> `number` | Visual column index or another passed argument. |


**Returns**: `string` | `number` - Column property, physical column index or passed argument.  

### countCachedColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L858

:::

_dataMap.countCachedColumns() ⇒ number_

Count the number of columns cached in the `colToProp` cache.


**Returns**: `number` - Amount of cached columns.  

### countFirstRowKeys
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L153

:::

_dataMap.countFirstRowKeys() ⇒ number_

Get the amount of physical columns in the first data row.


**Returns**: `number` - Amount of physical columns in the first data row.  

### createCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L340

:::

_dataMap.createCol([index], [amount], [source]) ⇒ number_

Creates column at the right of the data array.

**Emits**: [`Hooks#event:afterCreateCol`](@/api/hooks.md#aftercreatecol)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Visual index of the column before which the new column will be inserted. |
| [amount] | `number` | <code>1</code> | `optional` An amount of columns to add. |
| [source] | `string` |  | `optional` Source of method call. |


**Returns**: `number` - Returns number of created columns.  

### createMap
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L98

:::

_dataMap.createMap()_

Generates cache for property to and from column addressation.



### createRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L270

:::

_dataMap.createRow([index], [amount], [source]) ⇒ number_

Creates row at the bottom of the data array.

**Emits**: [`Hooks#event:afterCreateRow`](@/api/hooks.md#aftercreaterow)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Physical index of the row before which the new row will be inserted. |
| [amount] | `number` | <code>1</code> | `optional` An amount of rows to add. |
| [source] | `string` |  | `optional` Source of method call. |


**Returns**: `number` - Returns number of created rows.  

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L933

:::

_dataMap.destroy()_

Destroy instance.



### filterData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L596

:::

_dataMap.filterData(index, amount, physicalRows)_

Filter unwanted data elements from the data source.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of the element to remove. |
| amount | `number` | Number of rows to add/remove. |
| physicalRows | `number` | Physical row indexes. |



### get
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L616

:::

_dataMap.get(row, prop) ⇒ \*_

Returns single value from the data array.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `number` | The column property. |



### getAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L835

:::

_dataMap.getAll() ⇒ Array_

Returns the data array.



### getCopyable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L685

:::

_dataMap.getCopyable(row, prop) ⇒ string_

Returns single value from the data array (intended for clipboard copy to an external application).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| prop | `number` | The column property. |



### getCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L926

:::

_dataMap.getCopyableText([start], [end]) ⇒ string_

Return data as copyable text (tab separated columns intended for clipboard copy to an external application).


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |



### getLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L814

:::

_dataMap.getLength() ⇒ number_

Get data length.



### getRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L870

:::

_dataMap.getRange([start], [end], destination) ⇒ Array_

Returns data range as array.


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |
| destination | `number` | Destination of datamap.get. |



### getSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L247

:::

_dataMap.getSchema() ⇒ object_

Returns data's schema.



### getText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L915

:::

_dataMap.getText([start], [end]) ⇒ string_

Return data as text (tab separated columns).


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |



### propToCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L225

:::

_dataMap.propToCol(prop) ⇒ string | number_

Translates property into visual column index.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Column property which may be also a physical column index. |


**Returns**: `string` | `number` - Visual column index or passed argument.  

### recursiveDuckColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L165

:::

_dataMap.recursiveDuckColumns(schema, lastCol, parent) ⇒ number_

Generates columns' translation cache.


| Param | Type | Description |
| --- | --- | --- |
| schema | `object` | An object to generate schema from. |
| lastCol | `number` | The column index. |
| parent | `number` | The property cache for recursive calls. |



### removeCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L465

:::

_dataMap.removeCol([index], [amount], [source]) ⇒ boolean_

Removes column from the data array.

**Emits**: [`Hooks#event:beforeRemoveCol`](@/api/hooks.md#beforeremovecol), [`Hooks#event:afterRemoveCol`](@/api/hooks.md#afterremovecol)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Visual index of the column to be removed. If not provided, the last column will be removed. |
| [amount] | `number` | <code>1</code> | `optional` Amount of the columns to be removed. If not provided, one column will be removed. |
| [source] | `string` |  | `optional` Source of method call. |


**Returns**: `boolean` - Returns `false` when action was cancelled, otherwise `true`.  

### removeRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L415

:::

_dataMap.removeRow([index], [amount], [source]) ⇒ boolean_

Removes row from the data array.

**Emits**: [`Hooks#event:beforeRemoveRow`](@/api/hooks.md#beforeremoverow), [`Hooks#event:afterRemoveRow`](@/api/hooks.md#afterremoverow)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Visual index of the row to be removed. If not provided, the last row will be removed. |
| [amount] | `number` | <code>1</code> | `optional` Amount of the rows to be removed. If not provided, one row will be removed. |
| [source] | `string` |  | `optional` Source of method call. |


**Returns**: `boolean` - Returns `false` when action was cancelled, otherwise `true`.  

### set
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L700

:::

_dataMap.set(row, prop, value)_

Saves single value to the data array.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `number` | The column property. |
| value | `string` | The value to set. |



### spliceCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L530

:::

_dataMap.spliceCol(col, index, amount, [...elements]) ⇒ Array_

Add/Removes data from the column.


| Param | Type | Description |
| --- | --- | --- |
| col | `number` | Physical index of column in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `Array` | `optional` The new columns to add. |


**Returns**: `Array` - Returns removed portion of columns.  

### spliceData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L581

:::

_dataMap.spliceData(index, amount, ...elements)_

Add/remove row(s) to/from the data source.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Physical index of the element to add/remove. |
| amount | `number` | Number of rows to add/remove. |
| ...elements | `object` | Row elements to be added. |



### spliceRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L557

:::

_dataMap.spliceRow(row, index, amount, [...elements]) ⇒ Array_

Add/Removes data from the row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical index of row in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `Array` | `optional` The new rows to add. |


**Returns**: `Array` - Returns removed portion of rows.  

### visualColumnsToPhysical
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L780

:::

_dataMap.visualColumnsToPhysical(index, amount) ⇒ Array_


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual column index. |
| amount | `number` | An amount of rows to translate. |



### visualRowsToPhysical
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/dataMap.js#L756

:::

_dataMap.visualRowsToPhysical(index, amount) ⇒ number_

This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
The trick is, the physical row id (stored in settings.data) is not necessary the same
as the visual (displayed) row id (e.g. When sorting is applied).


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual row index. |
| amount | `number` | An amount of rows to translate. |


