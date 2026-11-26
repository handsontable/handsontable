---
title: DataFilter
metaTitle: DataFilter API reference | Handsontable DataGrid for JavaScript
permalink: /api/data-filter
canonicalUrl: /api/data-filter
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the data filter with a condition collection that provides filtering logic and a factory function that supplies column source data.


## Methods

### filter

::: ask-about-api filter|DataFilter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/dataFilter.ts#L21

:::

_dataFilter.filter() ⇒ Array&lt;number&gt;_

Filter data based on the conditions collection.


**Returns**: `Array<number>` - The physical row indexes that matched every filtered column, in read order.  

### filterByColumn

::: ask-about-api filterByColumn|DataFilter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/dataFilter.ts#L41

:::

_dataFilter.filterByColumn(column, [dataSource]) ⇒ Array&lt;number&gt;_

Filter the rows of one column read, by physical column index.

Each condition call gets its own `{ row, meta, value }` object, with the cell meta of that row
alone. A condition is user code that may keep either past its own call, so neither the object
nor its meta is ever shared between rows.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |
| [dataSource] | `ColumnDataMap` | `optional` The column read to filter. |


**Returns**: `Array<number>` - The physical row indexes that matched.  
