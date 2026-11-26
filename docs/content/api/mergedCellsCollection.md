---
title: MergedCellsCollection
metaTitle: MergedCellsCollection API reference | Handsontable DataGrid for JavaScript
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L756

:::

_mergedCellsCollection.mergedCells : Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Array of merged cells.



### mergedCellsMatrix

::: ask-about-api mergedCellsMatrix|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L761

:::

_mergedCellsCollection.mergedCellsMatrix : Array_

Matrix of cells (row, col) that points to the instances of the MergedCellCoords objects.


## Methods

### add

::: ask-about-api add|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L282

:::

_mergedCellsCollection.add(mergedCellInfo, [auto]) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Add a merged cell to the container.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mergedCellInfo | `object` |  | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called internally by the plugin (usually in batch). |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns the new merged cell on success and `false` on failure.  

### addOutsideMatrix

::: ask-about-api addOutsideMatrix|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L320

:::

_mergedCellsCollection.addOutsideMatrix(mergedCellInfo) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md)_

Adds a merged cell to the list without placing it in the lookup matrix. It is for a merge whose
rows are all trimmed: its coordinates are stale, another merge can be drawn there now, and the
matrix must not hold it (see `removeFromMatrix()`).


| Param | Type | Description |
| --- | --- | --- |
| mergedCellInfo | `object` | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) - The new merged cell.  

### canAdd

::: ask-about-api canAdd|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L310

:::

_mergedCellsCollection.canAdd(mergedCellInfo, [auto], [ignoredMergedCells]) ⇒ boolean_

Checks whether `add()` would accept a merged cell, and warns as `add()` does when it overlaps
another one. A merge runs it before it touches the cells, so a merge `add()` would refuse
writes no cell meta and leaves no undo step (DEV-159). Both methods decide through the same
private check, so a rule cannot reach one of them without the other.

`ignoredMergedCells` lists merges that the caller removes before it adds this one:
`mergeSelection()` unmerges the merges whose anchor lies inside the range first, and asks here
before it touches any of them.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mergedCellInfo | `object` |  | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |
| [auto] | `boolean` | <code>false</code> | `optional` `true` if called internally by the plugin (usually in batch). |
| [ignoredMergedCells] | `Array<MergedCellCoords>` | <code>[]</code> | `optional` Merged cells to treat as already removed. |


**Returns**: `boolean` - `true` if `add()` would add the merged cell.  

### capturePhysicalSpans

::: ask-about-api capturePhysicalSpans|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L561

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L359

:::

_mergedCellsCollection.clear()_

Clear all the merged cells.



### detectContiguousRuns

::: ask-about-api detectContiguousRuns|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L581

:::

_MergedCellsCollection.detectContiguousRuns(sortedAscending) ⇒ Array&lt;{start: number, length: number}&gt;_

Group an ascending list of integers into contiguous runs.


| Param | Type | Description |
| --- | --- | --- |
| sortedAscending | `Array<number>` | Already-sorted ascending visual indexes. |



### dropMerges

::: ask-about-api dropMerges|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L719

:::

_mergedCellsCollection.dropMerges(merges)_

Drops a batch of merges from both the `mergedCells` list and the lookup matrix, matching them by
identity rather than by coordinates. A merge that no longer covers any row has visual coordinates
that describe nothing, so [MergedCellsCollection#remove](@/api/mergedCellsCollection.md#remove)'s coordinate lookup cannot find it.


| Param | Type | Description |
| --- | --- | --- |
| merges | `Array<MergedCellCoords>` | The merges to drop. |



### filterOverlappingMergeCells

::: ask-about-api filterOverlappingMergeCells|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L211

:::

_mergedCellsCollection.filterOverlappingMergeCells(mergedCellsInfo) ⇒ Array&lt;{row: number, col: number, rowspan: number, colspan: number}&gt;_

Filters merge cells objects provided by users from overlapping cells. The cells the existing
merges occupy are read from the lookup matrix, not the list: a merge whose rows are all trimmed
is purged from the matrix and keeps stale coordinates in the list, so it occupies nothing on
screen (DEV-3135).


| Param | Type | Description |
| --- | --- | --- |
| mergedCellsInfo | `Object` | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |



### get

::: ask-about-api get|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L130

:::

_mergedCellsCollection.get(row, column) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Get a merged cell from the container, based on the provided arguments. You can provide either the "starting coordinates"
of a merged cell, or any coordinates from the body of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns a wanted merged cell on success and `false` on failure.  

### getBottomMostRowIndex <span class="tag-deprecated">Deprecated</span>

::: ask-about-api getBottomMostRowIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L496

:::

_mergedCellsCollection.getBottomMostRowIndex(range, visualRowIndex) ⇒ number_

::: warning
Since 19.0.0. The selection steps over merged cells itself now, so nothing in Handsontable
calls this method. It will be removed in 20.0.0. There is no replacement.
:::
Gets the bottom-most visual row index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualRowIndex | `number` | The visual row index to start the search from. |



### getByRange

::: ask-about-api getByRange|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L141

:::

_mergedCellsCollection.getByRange(range) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | false_

Get the first-found merged cell containing the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search merged cells for. |



### getByVisualColumn

::: ask-about-api getByVisualColumn|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L191

:::

_mergedCellsCollection.getByVisualColumn(column) ⇒ Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Get the merged cells that cover any cell of the provided visual column. The cost scales with
the total number of merged cells, not with the number of table rows. Merges purged from the
lookup matrix (fully hidden) are not returned.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: <code>Array<[MergedCellCoords](@/api/mergedCellCoords.md)></code> - Array of merged cells covering the column.  

### getByVisualRow

::: ask-about-api getByVisualRow|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L177

:::

_mergedCellsCollection.getByVisualRow(row) ⇒ Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Get the merged cells that cover any cell of the provided visual row. The cost scales with the
number of merged cells covering the row, not with the number of table columns. Merges purged
from the lookup matrix (fully hidden) are not returned.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: <code>Array<[MergedCellCoords](@/api/mergedCellCoords.md)></code> - Array of merged cells covering the row.  

### getEndMostColumnIndex <span class="tag-deprecated">Deprecated</span>

::: ask-about-api getEndMostColumnIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L472

:::

_mergedCellsCollection.getEndMostColumnIndex(range, visualColumnIndex) ⇒ number_

::: warning
Since 19.0.0. The selection steps over merged cells itself now, so nothing in Handsontable
calls this method. It will be removed in 20.0.0. There is no replacement.
:::
Gets the end-most visual column index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualColumnIndex | `number` | The visual column index to start the search from. |



### getFirstRenderableCoords

::: ask-about-api getFirstRenderableCoords|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L443

:::

_mergedCellsCollection.getFirstRenderableCoords(row, column) ⇒ [CellCoords](@/api/cellCoords.md)_

Get the first renderable coords of the merged cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) - A `CellCoords` object with the coordinates to the first renderable cell within the
                       merged cell.  

### getStartMostColumnIndex <span class="tag-deprecated">Deprecated</span>

::: ask-about-api getStartMostColumnIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L460

:::

_mergedCellsCollection.getStartMostColumnIndex(range, visualColumnIndex) ⇒ number_

::: warning
Since 19.0.0. The selection steps over merged cells itself now, so nothing in Handsontable
calls this method. It will be removed in 20.0.0. There is no replacement.
:::
Gets the start-most visual column index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualColumnIndex | `number` | The visual column index to start the search from. |



### getTopMostRowIndex <span class="tag-deprecated">Deprecated</span>

::: ask-about-api getTopMostRowIndex|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L484

:::

_mergedCellsCollection.getTopMostRowIndex(range, visualRowIndex) ⇒ number_

::: warning
Since 19.0.0. The selection steps over merged cells itself now, so nothing in Handsontable
calls this method. It will be removed in 20.0.0. There is no replacement.
:::
Gets the top-most visual row index that do not intersect with other merged cells within the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` | The range to search within. |
| visualRowIndex | `number` | The visual row index to start the search from. |



### getVisibleMergedCells

::: ask-about-api getVisibleMergedCells|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L167

:::

_mergedCellsCollection.getVisibleMergedCells() ⇒ Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Get the merged cells that are not trimmed away: every merge except the ones purged from the lookup
matrix because all of their rows are trimmed. A purged merge keeps stale visual coordinates in
the `mergedCells` list, which can point at rows that other records have moved into. A merge whose
rows are only hidden is returned, because hidden rows keep their visual index.


**Returns**: <code>Array<[MergedCellCoords](@/api/mergedCellCoords.md)></code> - The visible merged cells, in the order of the `mergedCells` list.  

### getWithinRange

::: ask-about-api getWithinRange|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L251

:::

_mergedCellsCollection.getWithinRange(range, [countPartials]) ⇒ Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;_

Get the merged cells contained in the provided range. Each merged cell is returned once, even
when it spans multiple cells of the range. The cost scales with the number of merged cells in
the collection, not with the area of the range.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| range | `CellRange` |  | The range to search merged cells in. |
| [countPartials] | `boolean` | <code>false</code> | `optional` If set to `true`, all the merged cells overlapping the range will be taken into calculation. |


**Returns**: <code>Array<[MergedCellCoords](@/api/mergedCellCoords.md)></code> - Array of found merged cells, ordered by their first covered cell in row-major order.  

### IS_OVERLAPPING_WARNING

::: ask-about-api IS_OVERLAPPING_WARNING|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L118

:::

_MergedCellsCollection.IS\_OVERLAPPING\_WARNING(mergedCell) ⇒ string_

Get a warning message for when the declared merged cell data overlaps already existing merged cells.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |



### isFirstRenderableMergedCell

::: ask-about-api isFirstRenderableMergedCell|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L422

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L386

:::

_mergedCellsCollection.isOverlapping(mergedCell, [ignoredMergedCells]) ⇒ boolean_

Check if the provided merged cell overlaps with the others already added. Like `getWithinRange()`,
it asks the lookup matrix which merges take up cells: a merge purged from the matrix because all of
its rows are trimmed keeps stale visual coordinates and covers no cell on screen.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mergedCell | `MergedCellCoords` |  | The merged cell to check against all others in the container. |
| [ignoredMergedCells] | `Array<MergedCellCoords>` | <code>[]</code> | `optional` Merged cells to leave out of the check. |


**Returns**: `boolean` - `true` if the provided merged cell overlaps with the others, `false` otherwise.  

### relocateInMatrix

::: ask-about-api relocateInMatrix|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L696

:::

_mergedCellsCollection.relocateInMatrix(relocations)_

Relocates a batch of merges in the coords->merge lookup matrix, applying each merge's new visual
top-left. Used after re-anchoring to the visible rows on a trimming/sort change. Incremental
alternative to a full rebuild — only the cells of the affected merges are touched. Runs in two
phases (remove all, then re-add all) so merges that swap visual positions don't clobber each
other's freshly written entries.


| Param | Type | Description |
| --- | --- | --- |
| relocations | `Array<object>` | The merges to move together with their new top-left visual `row`/`col` and, when rows inside them have been trimmed away, their new visual `rowspan`. |



### remove

::: ask-about-api remove|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L335

:::

_mergedCellsCollection.remove(row, column) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Remove a merged cell from the container. You can provide either the "starting coordinates"
of a merged cell, or any coordinates from the body of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns the removed merged cell on success and `false` on failure.  

### removeFromMatrix

::: ask-about-api removeFromMatrix|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L710

:::

_mergedCellsCollection.removeFromMatrix(merges)_

Removes a batch of merges from the coords->merge lookup matrix without touching the
`mergedCells` list. Used to purge merges whose whole visible span has been trimmed away, so their
stale entries cannot resolve to a phantom merge once a different row surfaces at the same visual
slot. The merges themselves are kept (their physical anchor lets them be re-added when visible).


| Param | Type | Description |
| --- | --- | --- |
| merges | `Array<MergedCellCoords>` | The merges to remove from the matrix. |



### restoreMerges

::: ask-about-api restoreMerges|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L732

:::

_mergedCellsCollection.restoreMerges()_

Puts existing merges back into the `mergedCells` list, keeping each object (and so everything the
plugin keys on it). The lookup matrix is left untouched: the caller places the merges there
itself, from their physical anchors.



### shiftCollections

::: ask-about-api shiftCollections|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L511

:::

_mergedCellsCollection.shiftCollections(direction, index, count, [canRemove])_

Shift the merged cell in the direction and by an offset defined in the arguments.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | `right`, `left`, `up` or `down`. |
| index | `number` | Index where the change, which caused the shifting took place. |
| count | `number` | Number of rows/columns added/removed in the preceding action. |
| [canRemove] | `function` | `optional` Decides whether a merge the shift wants to drop may really be dropped. A merge whose rows are partly trimmed occupies fewer visual rows than it owns, so removing all of its *visible* rows must not delete the trimmed ones with them. Such a merge is kept with its coordinates left as the shift found them; the caller re-derives them from the merge's physical rows right after. |



### translateAfterAxisMove

::: ask-about-api translateAfterAxisMove|MergedCellsCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/cellsCollection.ts#L630

:::

_mergedCellsCollection.translateAfterAxisMove(axis, snapshot, [retainedIndexes]) ⇒ Map&lt;[MergedCellCoords](@/api/mergedCellCoords.md), Array&lt;[MergedCellCoords](@/api/mergedCellCoords.md)&gt;&gt;_

Translate the merged cells collection after a manual row/column reorder, splitting
merges whose physical indexes are no longer contiguous in the new visual order.

Note: single-cell fragments (`colspan === 1 && rowspan === 1`) are dropped because
they no longer represent a merge. The user-facing behavior (auto-split + silent drop
of singletons) is documented in `docs/content/guides/cell-features/merge-cells/merge-cells.md`
under "Behavior during row/column reorder and column freeze". The one exception is a fragment
the caller lists in `retainedIndexes`: it shows one cell only because the rest of its rows are
trimmed, so it is a merge again as soon as they come back. Both the row and the column callers
pass it, since a merge trimmed to one visible row is already `rowspan: 1` before any column move.

Every merge is replaced by a new object, so the returned map tells the caller which merges came
out of which — the plugin uses it to carry each merge's physical anchor onto its replacements
instead of re-deriving one from the post-move visual coordinates.


| Param | Type | Description |
| --- | --- | --- |
| axis | `'column'` <br/> `'row'` | Axis that was reordered. |
| snapshot | `Map<MergedCellCoords, Array<number>>` | Snapshot taken before the reorder. |
| [retainedIndexes] | `Map<MergedCellCoords, Set<number>>` | `optional` Per merge, the physical indexes along `axis` whose single-cell fragment must survive the singleton drop. Keyed per merge because two merges in different columns can cover the same rows, and only one of them may be carrying trimmed rows. |


**Returns**: `Map<[MergedCellCoords](@/api/mergedCellCoords.md), Array<[MergedCellCoords](@/api/mergedCellCoords.md)>>` - Map of the merge before the reorder -> the
merges that replaced it. A merge the reorder dropped entirely maps to an empty array.  
