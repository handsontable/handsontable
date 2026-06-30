---
title: DataFilter
metaTitle: DataFilter API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/dataFilter.ts#L20

:::

_dataFilter.filter() ⇒ Array_

Filter data based on the conditions collection.



### filterByColumn

::: ask-about-api filterByColumn|DataFilter

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/dataFilter.ts#L37

:::

_dataFilter.filterByColumn(column, [dataSource]) ⇒ Array_

Filter data based on specified physical column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |
| [dataSource] | `Array` | `optional` Data source as array of objects with `value` and `meta` keys (e.g. `{value: 'foo', meta: {}}`). |


**Returns**: `Array` - Returns filtered data.  
