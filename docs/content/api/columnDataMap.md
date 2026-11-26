---
title: ColumnDataMap
metaTitle: ColumnDataMap API reference | Handsontable DataGrid for JavaScript
permalink: /api/column-data-map
canonicalUrl: /api/column-data-map
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Builds a column data map over two parallel arrays and a meta resolver.


## Members

### length

::: ask-about-api length|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L84

:::

_columnDataMap.length ⇒ number_

The number of entries the read produced.


## Methods

### empty

::: ask-about-api empty|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L75

:::

_ColumnDataMap.empty() ⇒ [ColumnDataMap](@/api/columnDataMap.md)_

Builds a read with no entries, for the callers that have no column to read.



### getMeta

::: ask-about-api getMeta|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L109

:::

_columnDataMap.getMeta(index) ⇒ object_

Gets the cell meta of the entry at the given position, stamped with the entry's coordinates on
every call. The object belongs to that entry alone, so it is safe to keep.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The entry position. |



### getRow

::: ask-about-api getRow|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L92

:::

_columnDataMap.getRow(index) ⇒ number_

Gets the physical row index of the entry at the given position.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The entry position. |



### getValue

::: ask-about-api getValue|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L100

:::

_columnDataMap.getValue(index) ⇒ \*_

Gets the value of the entry at the given position.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The entry position. |



### toArray

::: ask-about-api toArray|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L142

:::

_columnDataMap.toArray() ⇒ Array&lt;{row: number, meta: object, value: \*}&gt;_

Materializes the read as the array of `{ row, meta, value }` objects the column read produced
before it went columnar. One cell meta per entry, so the result is safe to keep – and every
entry stays alive for as long as the array does, which is why the filter scan never calls it.



### withMemoizedMeta

::: ask-about-api withMemoizedMeta|ColumnDataMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/columnDataMap.ts#L124

:::

_columnDataMap.withMemoizedMeta() ⇒ [ColumnDataMap](@/api/columnDataMap.md)_

Returns a read over the same entries whose cell meta is resolved at most once per entry.

Only for a read that is itself memoized, which owes its several passes the same meta object
per row. The cache holds one object per entry for as long as the returned instance lives. The
coordinate stamps are still rewritten on every [ColumnDataMap#getMeta](@/api/columnDataMap.md#getmeta) call.


