---
title: MergedCellsCollection
metaTitle: MergedCellsCollection API reference – JavaScript Data Grid | Handsontable
permalink: /api/merged-cells-collection
canonicalUrl: /api/merged-cells-collection
searchCategory: API Reference
hotPlugin: false
editLink: false
id: h8q4m1zr
react:
  id: m2w9k6vb
angular:
  id: g3t8p4xc
---

[[toc]]

## Description

Defines a container object for the merged cells.



## Description

Initializes the cells collection with references to the MergeCells plugin and the Handsontable instance.


## Members

### mergedCells

::: ask-about-api mergedCells|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L520

:::

_mergedCellsCollection.mergedCells : Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Array of merged cells.



### mergedCellsMatrix

::: ask-about-api mergedCellsMatrix|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L525

:::

_mergedCellsCollection.mergedCellsMatrix : Array_

Matrix of cells (row, col) that points to the instances of the MergedCellCoords objects.


## Methods

### add

::: ask-about-api add|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L175

:::

_mergedCellsCollection.add(mergedCellInfo, [auto]) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Add a merged cell to the container.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mergedCellInfo | `object` |  | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called internally by the plugin (usually in batch). |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns the new merged cell on success and `false` on failure.  

### capturePhysicalSpans

::: ask-about-api capturePhysicalSpans|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L412

:::

_mergedCellsCollection.capturePhysicalSpans(axis) ⇒ Map&lt;[MergedCellCoords](@/api/mergedCellCoords.md), Array&lt;number&gt;&gt;_

Capture the physical indexes covered by every merged cell along an axis.

Used by the manual row/column move and column freeze integrations to translate
merges through a reorder: the captured spans pin each merge to the underlying
data so the merge can be repositioned (and split, if a non-contiguous run
results) after the visual sequence changes.


| Param | Type | Description |
| --- | --- | --- |
| axis | `'column'` <br/> `'row'` | Which axis the upcoming reorder targets. |


**Returns**: `Map<[MergedCellCoords](@/api/mergedCellCoords.md), Array<number>>` - Map of merge -> physical indexes along the axis.  

### clear

::: ask-about-api clear|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L215

:::

_mergedCellsCollection.clear()_

Clear all the merged cells.



### detectContiguousRuns

::: ask-about-api detectContiguousRuns|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L432

:::

_MergedCellsCollection.detectContiguousRuns(sortedAscending) ⇒ Array&lt;{start: number, length: number}&gt;_

Group an ascending list of integers into contiguous runs.


| Param | Type | Description |
| --- | --- | --- |
| sortedAscending | `Array<number>` | Already-sorted ascending visual indexes. |



### filterOverlappingMergeCells

::: ask-about-api filterOverlappingMergeCells|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L111

:::

_mergedCellsCollection.filterOverlappingMergeCells(mergedCellsInfo) ⇒ Array&lt;{row: number, col: number, rowspan: number, colspan: number}&gt;_

Filters merge cells objects provided by users from overlapping cells.


| Param | Type | Description |
| --- | --- | --- |
| mergedCellsInfo | `Object` | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |



### get

::: ask-about-api get|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L76

:::

_mergedCellsCollection.get(row, column) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Get a merged cell from the container, based on the provided arguments. You can provide either the "starting coordinates"
of a merged cell, or any coordinates from the body of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns a wanted merged cell on success and `false` on failure.  

### getBottomMostRowIndex

::: ask-about-api getBottomMostRowIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L350

:::

_mergedCellsCollection.getBottomMostRowIndex(range, visualRowIndex) ⇒ number_

Gets the bottom-most visual row index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualRowIndex | `number` | The visual row index to start the search from. |



### getByRange

::: ask-about-api getByRange|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L87

:::

_mergedCellsCollection.getByRange(range) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | false_

Get the first-found merged cell containing the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search merged cells for. |



### getEndMostColumnIndex

::: ask-about-api getEndMostColumnIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L316

:::

_mergedCellsCollection.getEndMostColumnIndex(range, visualColumnIndex) ⇒ number_

Gets the end-most visual column index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualColumnIndex | `number` | The visual column index to start the search from. |



### getFirstRenderableCoords

::: ask-about-api getFirstRenderableCoords|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L284

:::

_mergedCellsCollection.getFirstRenderableCoords(row, column) ⇒ [CellCoords](@/api/cellCoords.md)_

Get the first renderable coords of the merged cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) - A `CellCoords` object with the coordinates to the first renderable cell within the
                       merged cell.  

### getStartMostColumnIndex

::: ask-about-api getStartMostColumnIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L299

:::

_mergedCellsCollection.getStartMostColumnIndex(range, visualColumnIndex) ⇒ number_

Gets the start-most visual column index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualColumnIndex | `number` | The visual column index to start the search from. |



### getTopMostRowIndex

::: ask-about-api getTopMostRowIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L333

:::

_mergedCellsCollection.getTopMostRowIndex(range, visualRowIndex) ⇒ number_

Gets the top-most visual row index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualRowIndex | `number` | The visual row index to start the search from. |



### getWithinRange

::: ask-about-api getWithinRange|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L152

:::

_mergedCellsCollection.getWithinRange(range, [countPartials]) ⇒ Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Get a merged cell contained in the provided range.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| range | `CellRange` |  | The range to search merged cells in. |
| [countPartials] | `boolean` | <code>false</code> | `optional` If set to `true`, all the merged cells overlapping the range will be taken into calculation. |


**Returns**: <code>Array<[MergedCellCoords](@/api/mergedCellCoords.md)></code> - Array of found merged cells.  

### IS_OVERLAPPING_WARNING

::: ask-about-api IS_OVERLAPPING_WARNING|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L64

:::

_MergedCellsCollection.IS\_OVERLAPPING\_WARNING(mergedCell) ⇒ string_

Get a warning message for when the declared merged cell data overlaps already existing merged cells.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |



### isFirstRenderableMergedCell

::: ask-about-api isFirstRenderableMergedCell|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L257

:::

_mergedCellsCollection.isFirstRenderableMergedCell(row, column) ⇒ boolean_

Check whether the provided row/col coordinates direct to a first not hidden cell within merge area.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### isOverlapping

::: ask-about-api isOverlapping|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L236

:::

_mergedCellsCollection.isOverlapping(mergedCell) ⇒ boolean_

Check if the provided merged cell overlaps with the others already added.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `MergedCellCoords` | The merged cell to check against all others in the container. |


**Returns**: `boolean` - `true` if the provided merged cell overlaps with the others, `false` otherwise.  

### remove

::: ask-about-api remove|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L203

:::

_mergedCellsCollection.remove(row, column) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Remove a merged cell from the container. You can provide either the "starting coordinates"
of a merged cell, or any coordinates from the body of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns the removed merged cell on success and `false` on failure.  

### shiftCollections

::: ask-about-api shiftCollections|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L367

:::

_mergedCellsCollection.shiftCollections(direction, index, count)_

Shift the merged cell in the direction and by an offset defined in the arguments.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | `right`, `left`, `up` or `down`. |
| index | `number` | Index where the change, which caused the shifting took place. |
| count | `number` | Number of rows/columns added/removed in the preceding action. |



### translateAfterAxisMove

::: ask-about-api translateAfterAxisMove|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L468

:::

_mergedCellsCollection.translateAfterAxisMove(axis, snapshot)_

Translate the merged cells collection after a manual row/column reorder, splitting
merges whose physical indexes are no longer contiguous in the new visual order.

Note: single-cell fragments (`colspan === 1 && rowspan === 1`) are dropped because
they no longer represent a merge. The user-facing behavior (auto-split + silent drop
of singletons) is documented in `docs/content/guides/cell-features/merge-cells/merge-cells.md`
under "Behavior during row/column reorder and column freeze".


| Param | Type | Description |
| --- | --- | --- |
| axis | `'column'` <br/> `'row'` | Axis that was reordered. |
| snapshot | `Map<MergedCellCoords, Array<number>>` | Snapshot taken before the reorder. |


