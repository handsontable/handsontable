---
title: SweepColumns
metaTitle: SweepColumns API reference | Handsontable DataGrid for JavaScript
permalink: /api/sweep-columns
canonicalUrl: /api/sweep-columns
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Methods

### flushGhostTable

::: ask-about-api flushGhostTable|sweepColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L1431

:::

_sweepColumns~flushGhostTable() ⇒ boolean_

Writes the measured widths and, for a re-measure, tells whether any of them changed the width of a
column on screen. Measuring an on-screen column whose width stays (the hook fires for every font the
page loads, an icon font too) is not a reason to draw.



### loop

::: ask-about-api loop|sweepColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L1452

:::

_sweepColumns~loop(fromIdleTask)_

Runs one chunk of the sweep.


| Param | Type | Description |
| --- | --- | --- |
| fromIdleTask | `boolean` | `true` when an idle task runs the chunk, `false` for the chunk run by the caller of the sweep. |



### processChunk

::: ask-about-api processChunk|sweepColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L1363

:::

_sweepColumns~processChunk(columnsBudget, cellsBudget) ⇒ boolean_

Sweeps up to `columnsBudget` columns, sampling at most `cellsBudget` cells. A column whose
remaining row range exceeds the cells budget is left mid-sweep (its samples accumulate in
`columnSamples`) and is continued by the next call. Returns `true` when every column has
been processed.

The row and column bounds are clamped to the grid on every call: an `updateData()` between two
idle tasks (a wrapper re-render) can shrink the data, and sampling a column the grid no longer
has left the ghost table with a column it never built.


| Param | Type | Description |
| --- | --- | --- |
| columnsBudget | `number` | The maximum number of columns to process in this chunk. |
| cellsBudget | `number` | The maximum number of cells to sample in this chunk. |


