---
title: DataMap
metaTitle: DataMap - JavaScript Data Grid | Handsontable
permalink: /api/data-map
canonicalUrl: /api/data-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: pt2wrekc
description: Options, members, and methods of Handsontable's DataMap API.
react:
  id: a2342zyo
  metaTitle: DataMap - React Data Grid | Handsontable
angular:
  id: q7j2s0yz
  metaTitle: DataMap - Angular Data Grid | Handsontable
---

# DataMap

[[toc]]

## Description

Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names.



## Members

### colToPropCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L103

:::

_dataMap.colToPropCache : Array_

Cached array of properties to columns.



### dataSource
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L91

:::

_dataMap.dataSource : \*_

Reference to the original dataset.



### DESTINATION_CLIPBOARD_GENERATOR
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L61

:::

_DataMap.DESTINATION\_CLIPBOARD\_GENERATOR : number_



### DESTINATION_RENDERER
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L54

:::

_DataMap.DESTINATION\_RENDERER : number_



### duckSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L97

:::

_dataMap.duckSchema : object_

Generated schema based on the first row from the source data.



### propToColCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L109

:::

_dataMap.propToColCache : Map_

Cached map of properties to columns.


## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L914

:::

_dataMap.clear()_

Clears the data array.



### colToProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L228

:::

_dataMap.colToProp(column) ⇒ string | number_

Returns property name that corresponds with the given column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `string` <br/> `number` | Visual column index or another passed argument. |


**Returns**: `string` | `number` - Column property, physical column index or passed argument.  

### countCachedColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L971

:::

_dataMap.countCachedColumns() ⇒ number_

Count the number of columns cached in the `colToProp` cache.


**Returns**: `number` - Amount of cached columns.  

### countFirstRowKeys
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L184

:::

_dataMap.countFirstRowKeys() ⇒ number_

Get the amount of physical columns in the first data row.


**Returns**: `number` - Amount of physical columns in the first data row.  

### createCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L419

:::

_dataMap.createCol([index], [amount], [options]) ⇒ number_

Creates column at the right of the data array.

**Emits**: [`Hooks#event:afterCreateCol`](@/api/hooks.md#aftercreatecol)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Visual index of the column before which the new column will be inserted. |
| [amount] | `number` | <code>1</code> | `optional` An amount of columns to add. |
| [options] | `object` |  | `optional` Additional options for created columns. |
| [options.source] | `string` |  | `optional` Source of method call. |
| [options.mode] | `'start'` <br/> `'end'` |  | `optional` Sets where the column is inserted: at the start (left in [LTR](@/api/options.md#layoutdirection), right in [RTL](@/api/options.md#layoutdirection)) or at the end (right in LTR, left in LTR) the passed index. |


**Returns**: `number` - Returns number of created columns.  

### createDuckSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L297

:::

_dataMap.createDuckSchema() ⇒ Array | object_

Creates the duck schema based on the current dataset.



### createMap
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L129

:::

_dataMap.createMap()_

Generates cache for property to and from column addressation.



### createRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L319

:::

_dataMap.createRow([index], [amount], [options]) ⇒ number_

Creates row at the bottom of the data array.

**Emits**: [`Hooks#event:afterCreateRow`](@/api/hooks.md#aftercreaterow)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Physical index of the row before which the new row will be inserted. |
| [amount] | `number` | <code>1</code> | `optional` An amount of rows to add. |
| [options] | `object` |  | `optional` Additional options for created rows. |
| [options.source] | `string` |  | `optional` Source of method call. |
| [options.mode] | `'above'` <br/> `'below'` |  | `optional` Sets where the row is inserted: above or below the passed index. |


**Returns**: `number` - Returns number of created rows.  

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L1046

:::

_dataMap.destroy()_

Destroy instance.



### filterData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L706

:::

_dataMap.filterData(index, amount, physicalRows)_

Filter unwanted data elements from the data source.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of the element to remove. |
| amount | `number` | Number of rows to add/remove. |
| physicalRows | `number` | Physical row indexes. |



### get
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L726

:::

_dataMap.get(row, prop) ⇒ \*_

Returns single value from the data array.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `number` | The column property. |



### getAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L948

:::

_dataMap.getAll() ⇒ Array_

Returns the data array.



### getCopyable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L786

:::

_dataMap.getCopyable(row, prop) ⇒ string_

Returns single value from the data array (intended for clipboard copy to an external application).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| prop | `number` | The column property. |



### getCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L1039

:::

_dataMap.getCopyableText([start], [end]) ⇒ string_

Return data as copyable text (tab separated columns intended for clipboard copy to an external application).


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |



### getLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L927

:::

_dataMap.getLength() ⇒ number_

Get data length.



### getRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L983

:::

_dataMap.getRange([start], [end], destination) ⇒ Array_

Returns data range as array.


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |
| destination | `number` | Destination of datamap.get. |



### getSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L278

:::

_dataMap.getSchema() ⇒ object_

Returns data's schema.



### getText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L1028

:::

_dataMap.getText([start], [end]) ⇒ string_

Return data as text (tab separated columns).


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |



### propToCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L256

:::

_dataMap.propToCol(prop) ⇒ string | number_

Translates property into visual column index.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Column property which may be also a physical column index. |


**Returns**: `string` | `number` - Visual column index or passed argument.  

### recursiveDuckColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L196

:::

_dataMap.recursiveDuckColumns(schema, lastCol, parent) ⇒ number_

Generates columns' translation cache.


| Param | Type | Description |
| --- | --- | --- |
| schema | `object` | An object to generate schema from. |
| lastCol | `number` | The column index. |
| parent | `number` | The property cache for recursive calls. |



### refreshDuckSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L304

:::

_dataMap.refreshDuckSchema()_

Refresh the data schema.



### removeCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L561

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L508

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L801

:::

_dataMap.set(row, prop, value)_

Saves single value to the data array.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `number` | The column property. |
| value | `string` | The value to set. |



### spliceCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L633

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L684

:::

_dataMap.spliceData(index, deleteCount, elements)_

Add/remove row(s) to/from the data source.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Physical index of the element to add/remove. |
| deleteCount | `number` | Number of rows to remove. |
| elements | `Array<object>` | Row elements to be added. |



### spliceRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L660

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L893

:::

_dataMap.visualColumnsToPhysical(index, amount) ⇒ Array_


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual column index. |
| amount | `number` | An amount of rows to translate. |



### visualRowsToPhysical
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/dataMap/dataMap.js#L869

:::

_dataMap.visualRowsToPhysical(index, amount) ⇒ number_

This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
The trick is, the physical row id (stored in settings.data) is not necessary the same
as the visual (displayed) row id (e.g. When sorting is applied).


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual row index. |
| amount | `number` | An amount of rows to translate. |


