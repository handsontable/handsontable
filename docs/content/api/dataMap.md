---
title: DataMap
metaTitle: DataMap | Handsontable DataGrid for JavaScript
permalink: /api/data-map
canonicalUrl: /api/data-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: pt2wrekc
description: Options, members, and methods of Handsontable DataGrid's DataMap API.
react:
  id: a2342zyo
  metaTitle: DataMap | Handsontable DataGrid for React
angular:
  id: q7j2s0yz
  metaTitle: DataMap | Handsontable DataGrid for Angular
---

[[toc]]

## Description

Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names.



## Members

### DESTINATION_CLIPBOARD_GENERATOR

::: ask-about-api DESTINATION_CLIPBOARD_GENERATOR|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L205

:::

_DataMap.DESTINATION\_CLIPBOARD\_GENERATOR : number_



### DESTINATION_RENDERER

::: ask-about-api DESTINATION_RENDERER|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L200

:::

_DataMap.DESTINATION\_RENDERER : number_


## Methods

### clear

::: ask-about-api clear|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L957

:::

_dataMap.clear()_

Clears the data array.



### countCachedColumns

::: ask-about-api countCachedColumns|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L1001

:::

_dataMap.countCachedColumns() ⇒ number_

Count the number of columns cached in the `colToProp` cache.


**Returns**: `number` - Amount of cached columns.  

### countFirstRowKeys

::: ask-about-api countFirstRowKeys|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L228

:::

_dataMap.countFirstRowKeys() ⇒ number_

Get the amount of physical columns in the first data row.


**Returns**: `number` - Amount of physical columns in the first data row.  

### createCol

::: ask-about-api createCol|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L446

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
| [options.fillsMinimumSize] | `boolean` |  | `optional` Whether the columns are appended to satisfy `minCols`/`minSpareCols`. Only such columns are given back when one of those options is lowered. |


**Returns**: `number` - Returns number of created columns.  

### createDuckSchema

::: ask-about-api createDuckSchema|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L331

:::

_dataMap.createDuckSchema() ⇒ Array | object_

Creates the duck schema based on the current dataset.



### createMap

::: ask-about-api createMap|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L210

:::

_dataMap.createMap()_

Generates cache for property to and from column addressation.



### createRow

::: ask-about-api createRow|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L351

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
| [options.fillsMinimumSize] | `boolean` |  | `optional` Whether the rows are appended to satisfy `minRows`/`minSpareRows`. Only such rows are given back when one of those options is lowered. |


**Returns**: `number` - Returns number of created rows.  

### destroy

::: ask-about-api destroy|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L1061

:::

_dataMap.destroy()_

Destroy instance.



### filterData

::: ask-about-api filterData|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L665

:::

_dataMap.filterData(index, amount, physicalRows)_

Filter unwanted data elements from the data source.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual index of the element to remove. |
| amount | `number` | Number of rows to add/remove. |
| physicalRows | `number` | Physical row indexes. |



### get

::: ask-about-api get|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L694

:::

_dataMap.get(row, prop, [options]) ⇒ \*_

Returns single value from the data array.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| prop | `number` <br/> `string` <br/> `function` <br/> `null` |  | The column property, a `columns[].data` accessor   function, or `null` when the caller's column index named no column (see `colToProp()`). |
| [options] | `object` |  | `optional` Read options. |
| [options.skipValueGetter] | `boolean` | <code>false</code> | `optional` When `true`, returns the stored value without the   column's `valueGetter` (the `modifyRowData` and `modifyData` hooks still apply). Bulk validation   reads cells this way, because an edit validates the stored value too. |



### getAll

::: ask-about-api getAll|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L983

:::

_dataMap.getAll() ⇒ Array_

Returns the data array.



### getCopyable

::: ask-about-api getCopyable|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L828

:::

_dataMap.getCopyable(row, prop) ⇒ \*_

Returns single value from the data array (intended for clipboard copy to an external application).

The value is returned as it is stored, so it can be of any type. `Core#getCopyableData()`
converts it to a string; the clipboard and Autofill consume it raw.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `number` <br/> `string` <br/> `function` | The column property, or a `columns[].data` accessor function. |



### getCopyableText

::: ask-about-api getCopyableText|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L1056

:::

_dataMap.getCopyableText([start], [end]) ⇒ string_

Return data as copyable text (tab separated columns intended for clipboard copy to an external application).


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |



### getLength

::: ask-about-api getLength|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L968

:::

_dataMap.getLength() ⇒ number_

Get data length.



### getRange

::: ask-about-api getRange|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L1011

:::

_dataMap.getRange([start], [end], destination) ⇒ Array_

Returns data range as array.


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |
| destination | `number` | Destination of datamap.get. |



### getSchema

::: ask-about-api getSchema|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L317

:::

_dataMap.getSchema() ⇒ object_

Returns data's schema.



### getText

::: ask-about-api getText|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L1047

:::

_dataMap.getText([start], [end]) ⇒ string_

Return data as text (tab separated columns).


| Param | Type | Description |
| --- | --- | --- |
| [start] | `object` | `optional` Start selection position. Visual indexes. |
| [end] | `object` | `optional` End selection position. Visual indexes. |



### isTrailingFillerColumn

::: ask-about-api isTrailingFillerColumn|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L590

:::

_dataMap.isTrailingFillerColumn(physicalColumn) ⇒ boolean_

Checks whether a column is one of the filler columns at the end of the data set, that is, one `minCols` or
`minSpareCols` appended with no other column after it.


| Param | Type | Description |
| --- | --- | --- |
| physicalColumn | `number` <br/> `null` | The physical column index. |



### isTrailingFillerRow

::: ask-about-api isTrailingFillerRow|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L581

:::

_dataMap.isTrailingFillerRow(physicalRow) ⇒ boolean_

Checks whether a row is one of the filler rows at the end of the data set, that is, one `minRows` or
`minSpareRows` appended with no other row after it.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` <br/> `null` | The physical row index. |



### propToCol

::: ask-about-api propToCol|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L291

:::

_dataMap.propToCol(prop) ⇒ string | number | function | null_

Translates property into visual column index.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` <br/> `function` <br/> `null` | Column property, a physical column index, a   `columns[].data` accessor function, or `null`. |


**Returns**: `string` | `number` | `function` | `null` - Visual column index, `null` when the argument names no
  visible column, or the passed argument when it is a property this data set does not use.  

### recursiveDuckColumns

::: ask-about-api recursiveDuckColumns|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L242

:::

_dataMap.recursiveDuckColumns(schema, lastCol, parent) ⇒ number_

Generates columns' translation cache. A plain object is walked, and every primitive leaf
(`null`, `undefined`, a number, a string, a boolean) gets a column, whatever its default
value. An array, a function, any other object (a `Date`, a `Map`) and the `__children` key get
none. `deepObjectSize()` still counts an array, a function and such an object as a column, so
the count can exceed the number of properties registered here.


| Param | Type | Description |
| --- | --- | --- |
| schema | `object` | An object to generate schema from. |
| lastCol | `number` | The column index. |
| parent | `number` | The property cache for recursive calls. |



### refreshDuckSchema

::: ask-about-api refreshDuckSchema|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L336

:::

_dataMap.refreshDuckSchema()_

Refresh the data schema.



### removeCol

::: ask-about-api removeCol|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L542

:::

_dataMap.removeCol([index], [amount], [source]) ⇒ boolean_

Removes column from the data array.

**Emits**: [`Hooks#event:beforeRemoveCol`](@/api/hooks.md#beforeremovecol), [`Hooks#event:afterRemoveCol`](@/api/hooks.md#afterremovecol)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Visual index of the column to be removed. If not provided, the last column will be removed. |
| [amount] | `number` | <code>1</code> | `optional` Amount of the columns to be removed. If not provided, one column will be removed. |
| [source] | `string` |  | `optional` Source of method call. |


**Returns**: `boolean` - Returns `false` when action was canceled, otherwise `true`.  

### removeRow

::: ask-about-api removeRow|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L503

:::

_dataMap.removeRow([index], [amount], [source]) ⇒ boolean_

Removes row from the data array.

**Emits**: [`Hooks#event:beforeRemoveRow`](@/api/hooks.md#beforeremoverow), [`Hooks#event:afterRemoveRow`](@/api/hooks.md#afterremoverow)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | `number` |  | `optional` Visual index of the row to be removed. If not provided, the last row will be removed. |
| [amount] | `number` | <code>1</code> | `optional` Amount of the rows to be removed. If not provided, one row will be removed. |
| [source] | `string` |  | `optional` Source of method call. |


**Returns**: `boolean` - Returns `false` when action was canceled, otherwise `true`.  

### set

::: ask-about-api set|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L847

:::

_dataMap.set(row, prop, value)_

Saves single value to the data array.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `number` <br/> `string` <br/> `function` <br/> `null` | The column property, a `columns[].data` accessor   function, or `null` when the caller's column index named no column (see `colToProp()`). |
| value | `string` | The value to set. |



### setAtPhysicalRow

::: ask-about-api setAtPhysicalRow|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L861

:::

_dataMap.setAtPhysicalRow(physicalRow, prop, value, row)_

Saves single value to the data array, at a physical row. A change that waited for its validator is
written this way, to the record it was made on, which a trimming map may have taken out of the visual
space meanwhile.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |
| prop | `number` <br/> `string` <br/> `function` <br/> `null` | The column property, a `columns[].data` accessor   function, or `null` when the caller's column index named no column (see `colToProp()`). |
| value | `string` | The value to set. |
| row | `number` <br/> `null` | The visual row index the `modifyData` hook receives (`null` for a row the visual   space does not hold). |



### spliceCol

::: ask-about-api spliceCol|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L601

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

::: ask-about-api spliceData|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L644

:::

_dataMap.spliceData(index, deleteCount, elements)_

Add/remove row(s) to/from the data source.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Physical index of the element to add/remove. |
| deleteCount | `number` | Number of rows to remove. |
| elements | `Array<object>` | Row elements to be added. |



### spliceRow

::: ask-about-api spliceRow|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L623

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

::: ask-about-api visualColumnsToPhysical|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L942

:::

_dataMap.visualColumnsToPhysical(index, amount) ⇒ Array_


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual column index. |
| amount | `number` | An amount of rows to translate. |



### visualRowsToPhysical

::: ask-about-api visualRowsToPhysical|DataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/dataMap.ts#L923

:::

_dataMap.visualRowsToPhysical(index, amount) ⇒ number_

This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
The trick is, the physical row id (stored in settings.data) is not necessary the same
as the visual (displayed) row id (e.g. When sorting is applied).


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Visual row index. |
| amount | `number` | An amount of rows to translate. |


