---
title: Anonymous
metaTitle: Anonymous API reference – JavaScript Data Grid | Handsontable
permalink: /api/anonymous
canonicalUrl: /api/anonymous
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Methods

### processChunk

::: ask-about-api processChunk|<anonymous>

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L420

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~processChunk(columnsBudget, cellsBudget) ⇒ boolean_

Sweeps up to `columnsBudget` columns, sampling at most `cellsBudget` cells. A column whose
remaining row range exceeds the cells budget is left mid-sweep (its samples accumulate in
`columnSamples`) and is continued by the next call. Returns `true` when every column has
been processed.


| Param | Type | Description |
| --- | --- | --- |
| columnsBudget | `number` | The maximum number of columns to process in this chunk. |
| cellsBudget | `number` | The maximum number of cells to sample in this chunk. |


