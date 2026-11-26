---
title: MergedCellsWidths
metaTitle: MergedCellsWidths API reference | Handsontable DataGrid for JavaScript
permalink: /api/merged-cells-widths
canonicalUrl: /api/merged-cells-widths
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Creates the tracker for one grid.


## Methods

### clear

::: ask-about-api clear|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L304

:::

_mergedCellsWidths.clear()_

Forgets every demand and every measurement.



### clearColumn

::: ask-about-api clearColumn|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L318

:::

_mergedCellsWidths.clearColumn(physicalColumn)_

Forgets the demand and the measurements of one column.


| Param | Type | Description |
| --- | --- | --- |
| physicalColumn | `number` | The physical column index. |



### fit

::: ask-about-api fit|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L328

:::

_mergedCellsWidths.fit() ⇒ MergedCellsFitResult_

Fits the demands again when an input changed since the last fit.



### getWidth

::: ask-about-api getWidth|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L220

:::

_mergedCellsWidths.getWidth(physicalColumn) ⇒ number | undefined_

Returns the demand of a column.


| Param | Type | Description |
| --- | --- | --- |
| physicalColumn | `number` | The physical column index. |



### invalidateCell

::: ask-about-api invalidateCell|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L233

:::

_mergedCellsWidths.invalidateCell(visualRow, visualColumn)_

Records that the text of one merge's first cell may have changed.


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` | The visual row index. |
| visualColumn | `number` | The visual column index. |



### invalidateColumn

::: ask-about-api invalidateColumn|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L248

:::

_mergedCellsWidths.invalidateColumn(visualColumn)_

Records that the text of the merges starting in a column may have changed, or that the set of
merges covering it did.


| Param | Type | Description |
| --- | --- | --- |
| visualColumn | `number` | The visual column index. |



### markLayoutChanged

::: ask-about-api markLayoutChanged|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L298

:::

_mergedCellsWidths.markLayoutChanged()_

Records that the drawn merges may have changed without a text change: rows or columns hidden,
shown, or trimmed.



### markMergesChanged

::: ask-about-api markMergesChanged|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L261

:::

_mergedCellsWidths.markMergesChanged(visualColumn)_

Records that merges were added or removed in a column through a merge hook.


| Param | Type | Description |
| --- | --- | --- |
| visualColumn | `number` | The visual column index. |



### markRenumbered

::: ask-about-api markRenumbered|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L283

:::

_mergedCellsWidths.markRenumbered()_

Records that the physical row or column numbering may have changed. Like `markStale()`, and a
snapshot waiting for a fit is dropped, since its keys no longer name the same cells.



### markStale

::: ask-about-api markStale|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L277

:::

_mergedCellsWidths.markStale()_

Records that the texts may have changed anywhere. The next fit reads and measures every merge's
text again.



### markStylesChanged

::: ask-about-api markStylesChanged|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L290

:::

_mergedCellsWidths.markStylesChanged()_

Records that the styles may have changed: every group of merges is measured again from the kept
texts, without reading a cell.



### markWidthsChanged

::: ask-about-api markWidthsChanged|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L225

:::

_mergedCellsWidths.markWidthsChanged()_

Records that some column widths changed, so the demands that read them are fitted again.



### mayHaveMultiColumnMerges

::: ask-about-api mayHaveMultiColumnMerges|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L212

:::

_mergedCellsWidths.mayHaveMultiColumnMerges() ⇒ boolean_

Tells whether the grid may have a merge spanning several columns. It answers `false` only when
none can exist, so a caller can skip reading cell meta per change.



### snapshotMerges

::: ask-about-api snapshotMerges|MergedCellsWidths

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoColumnSize/mergedCellsWidths.ts#L269

:::

_mergedCellsWidths.snapshotMerges()_

Records the merges as they are now and asks for a fit, which reports the columns of every merge
that appeared or went away since. Call it right before a change that can add or remove merges with
no merge hook.


