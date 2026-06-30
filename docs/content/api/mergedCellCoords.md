---
title: MergedCellCoords
metaTitle: MergedCellCoords API reference – JavaScript Data Grid | Handsontable
permalink: /api/merged-cell-coords
canonicalUrl: /api/merged-cell-coords
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

The `MergedCellCoords` class represents a single merged cell.



## Description

Initializes the merged cell coordinates with its top-left position, span dimensions, and factories for creating cell coordinate and range objects.


## Members

### removed

::: ask-about-api removed|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L297

:::

_mergedCellCoords.removed : boolean_

`true` only if the merged cell is bound to be removed.


## Methods

### containsNegativeValues

::: ask-about-api containsNegativeValues|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L110

:::

_MergedCellCoords.containsNegativeValues(mergedCell) ⇒ boolean_

Check whether the values provided for a merged cell contain any negative values.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |



### getLastColumn

::: ask-about-api getLastColumn|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L273

:::

_mergedCellCoords.getLastColumn() ⇒ number_

Get the rightmost column index of the merged cell.



### getLastRow

::: ask-about-api getLastRow|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L266

:::

_mergedCellCoords.getLastRow() ⇒ number_

Get the bottom row index of the merged cell.



### getRange

::: ask-about-api getRange|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L280

:::

_mergedCellCoords.getRange() ⇒ [CellRange](@/api/cellRange.md)_

Get the range coordinates of the merged cell.



### includes

::: ask-about-api includes|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L174

:::

_mergedCellCoords.includes(row, column) ⇒ boolean_

Returns `true` if the provided coordinates are inside the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The row index. |
| column | `number` | The column index. |



### includesHorizontally

::: ask-about-api includesHorizontally|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L182

:::

_mergedCellCoords.includesHorizontally(column) ⇒ boolean_

Returns `true` if the provided `column` property is within the column span of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The column index. |



### includesVertically

::: ask-about-api includesVertically|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L190

:::

_mergedCellCoords.includesVertically(row) ⇒ boolean_

Returns `true` if the provided `row` property is within the row span of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |



### IS_OUT_OF_BOUNDS_WARNING

::: ask-about-api IS_OUT_OF_BOUNDS_WARNING|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L80

:::

_MergedCellCoords.IS\_OUT\_OF\_BOUNDS\_WARNING(mergedCell) ⇒ string_

Get a warning message for when the declared merged cell data contains values exceeding the table limits.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |



### IS_SINGLE_CELL

::: ask-about-api IS_SINGLE_CELL|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L90

:::

_MergedCellCoords.IS\_SINGLE\_CELL(mergedCell) ⇒ string_

Get a warning message for when the declared merged cell data represents a single cell.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |



### isFarther

::: ask-about-api isFarther|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L247

:::

_mergedCellCoords.isFarther(mergedCell, direction) ⇒ boolean | null_

Check if the second provided merged cell is "farther" in the provided direction.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | [`MergedCellCoords`](#mergedcellcoords) | The merged cell to check. |
| direction | `string` | Drag direction. |


**Returns**: `boolean` | `null` - `true` if the second provided merged cell is "farther".  

### isOutOfBounds

::: ask-about-api isOutOfBounds|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L140

:::

_MergedCellCoords.isOutOfBounds(mergeCell, rowCount, columnCount) ⇒ boolean_

Check whether the provided merged cell object is to be declared out of bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| mergeCell | `object` | Object containing the `row`, `col`, `rowspan` and `colspan` properties. |
| rowCount | `number` | Number of rows in the table. |
| columnCount | `number` | Number of rows in the table. |



### NEGATIVE_VALUES_WARNING

::: ask-about-api NEGATIVE_VALUES_WARNING|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L69

:::

_MergedCellCoords.NEGATIVE\_VALUES\_WARNING(mergedCell) ⇒ string_

Get a warning message for when the declared merged cell data contains negative values.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |



### normalize

::: ask-about-api normalize|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L147

:::

_mergedCellCoords.normalize(hotInstance)_

Sanitize (prevent from going outside the boundaries) the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| hotInstance | `Core` | The Handsontable instance. |



### shift

::: ask-about-api shift|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L199

:::

_mergedCellCoords.shift(shiftVector, indexOfChange) ⇒ boolean_

Shift (and possibly resize, if needed) the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| shiftVector | `Array` | 2-element array containing the information on the shifting in the `x` and `y` axis. |
| indexOfChange | `number` | Index of the preceding change. |


**Returns**: `boolean` - Returns `false` if the whole merged cell was removed.  

### ZERO_SPAN_WARNING

::: ask-about-api ZERO_SPAN_WARNING|MergedCellCoords

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/mergeCells/cellCoords.ts#L100

:::

_MergedCellCoords.ZERO\_SPAN\_WARNING(mergedCell) ⇒ string_

Get a warning message for when the declared merged cell data contains "colspan" or "rowspan", that equals 0.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `Object` | Object containing information about the merged cells that was about to be added. |


