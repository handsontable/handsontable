---
title: CellRange
metaTitle: CellRange - JavaScript Data Grid | Handsontable
permalink: /api/cell-range
canonicalUrl: /api/cell-range
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 9za1u3q7
description: Options, members, and methods of Handsontable's CellRange API.
react:
  id: mpqwzjpm
  metaTitle: CellRange - React Data Grid | Handsontable
angular:
  id: m1f8o6qr
  metaTitle: CellRange - Angular Data Grid | Handsontable
---

[[toc]]

## Description

The `CellRange` class holds a set of cell coordinates ([`CellCoords`](@/api/cellCoords.md) instances)
that form a [selection range](@/guides/cell-features/selection/selection.md#select-ranges).

A single `CellRange` instance represents a single unit of selection
that contains either a single cell or multiple adjacent cells.

To import the `CellRange` class:

```js
import Handsontable, { CellRange } from '/handsontable';

// or, using modules
import Handsontable, { CellRange } from '/handsontable/base';
```


## Methods

### clone

::: ask-about-api clone|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L842

:::

_cellRange.clone() ⇒ [CellRange](@/api/cellRange.md)_

Clones your `CellRange` instance.



### containsHeaders

::: ask-about-api containsHeaders|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L197

:::

_cellRange.containsHeaders() ⇒ boolean_

Checks if your range overlaps headers range (negative coordinates).



### expand

::: ask-about-api expand|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L347

:::

_cellRange.expand(cellCoords, [changeDirection]) ⇒ boolean_

Adds a cell to your range, at `cellCoords` coordinates.

The `cellCoords` coordinates must exceed a corner of your range.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cellCoords | `CellCoords` |  | A new cell's coordinates. |
| [changeDirection] | `boolean` | <code>true</code> | `optional` If `true`, the direction of your range is changed to the direction of the `cellCoords` coordinates. |



### expandByRange

::: ask-about-api expandByRange|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L378

:::

_cellRange.expandByRange(expandingRange, [changeDirection]) ⇒ boolean_

Expand your range with another range (`expandingRange`).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| expandingRange | [`CellRange`](#cellrange) |  | A new range. |
| [changeDirection] | `boolean` | <code>true</code> | `optional` If `true`, the direction of your range is changed to the direction of the `expandingRange` range. |



### flipDirectionHorizontally

::: ask-about-api flipDirectionHorizontally|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L506

:::

_cellRange.flipDirectionHorizontally()_

Flips the direction of your range horizontally (e.g., `NW-SE` changes to `NE-SW`).



### flipDirectionVertically

::: ask-about-api flipDirectionVertically|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L485

:::

_cellRange.flipDirectionVertically()_

Flips the direction of your range vertically (e.g., `NW-SE` changes to `SW-NE`).



### forAll

::: ask-about-api forAll|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L819

:::

_cellRange.forAll(callback)_

Runs a callback function on all cells within your range.

You can break the iteration by returning `false` in the callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | A callback function. |



### getAll

::: ask-about-api getAll|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L789

:::

_cellRange.getAll() ⇒ Array&lt;[CellCoords](@/api/cellCoords.md)&gt;_

Gets the coordinates of all cells of your range.



### getBordersSharedWith

::: ask-about-api getBordersSharedWith|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L730

:::

_cellRange.getBordersSharedWith(range) ⇒ Array&lt;('top'\|'right'\|'bottom'\|'left')&gt;_

Indicates which borders (top, right, bottom, left) are shared between
your `CellRange`instance and another `range` that's within your range.


| Param | Type | Description |
| --- | --- | --- |
| range | [`CellRange`](#cellrange) | A range to compare with. |



### getBottomEndCorner

::: ask-about-api getBottomEndCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L553

:::

_cellRange.getBottomEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomLeftCorner

::: ask-about-api getBottomLeftCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L606

:::

_cellRange.getBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomRightCorner

::: ask-about-api getBottomRightCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L564

:::

_cellRange.getBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomStartCorner

::: ask-about-api getBottomStartCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L595

:::

_cellRange.getBottomStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getCellsCount

::: ask-about-api getCellsCount|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L244

:::

_cellRange.getCellsCount() ⇒ number_

Returns the number of cells within your range (excluding column and row headers).



### getDirection

::: ask-about-api getDirection|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L410

:::

_cellRange.getDirection() ⇒ string_

Gets the direction of the selection.


**Returns**: `string` - Returns one of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.  

### getHeight

::: ask-about-api getHeight|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L218

:::

_cellRange.getHeight() ⇒ number_

Returns the height of your range (as a number of rows, excluding row headers).



### getHorizontalDirection

::: ask-about-api getHorizontalDirection|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L470

:::

_cellRange.getHorizontalDirection() ⇒ string_

Gets the horizontal direction of the selection.


**Returns**: `string` - Returns one of the values: `W-E` (west->east), `E-W` (east->west).  

### getInlineDirection

::: ask-about-api getInlineDirection|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L480

:::

_cellRange.getInlineDirection() ⇒ string_

Gets the inline (horizontal) direction of the selection.


**Returns**: `string` - Returns one of the values: `start-end`, `end-start`.  

### getInner

::: ask-about-api getInner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L765

:::

_cellRange.getInner() ⇒ Array&lt;[CellCoords](@/api/cellCoords.md)&gt;_

Gets the coordinates of the inner cells of your range.



### getOppositeCorner

::: ask-about-api getOppositeCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L709

:::

_cellRange.getOppositeCorner(coords) ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the coordinates of a range corner opposite to the provided `coords`.

For example: if the `coords` coordinates match the bottom-right corner of your range,
the coordinates of the top-left corner of your range are returned.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to check. |



### getOuterBottomEndCorner

::: ask-about-api getOuterBottomEndCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L637

:::

_cellRange.getOuterBottomEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterBottomLeftCorner

::: ask-about-api getOuterBottomLeftCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L690

:::

_cellRange.getOuterBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterBottomRightCorner

::: ask-about-api getOuterBottomRightCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L648

:::

_cellRange.getOuterBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterBottomStartCorner

::: ask-about-api getOuterBottomStartCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L679

:::

_cellRange.getOuterBottomStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterHeight

::: ask-about-api getOuterHeight|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L204

:::

_cellRange.getOuterHeight() ⇒ number_

Returns the height of your range (as a number of rows, including row headers).



### getOuterTopEndCorner

::: ask-about-api getOuterTopEndCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L658

:::

_cellRange.getOuterTopEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterTopLeftCorner

::: ask-about-api getOuterTopLeftCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L627

:::

_cellRange.getOuterTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterTopRightCorner

::: ask-about-api getOuterTopRightCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L669

:::

_cellRange.getOuterTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterTopStartCorner

::: ask-about-api getOuterTopStartCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L616

:::

_cellRange.getOuterTopStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left (in LTR) or top right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterWidth

::: ask-about-api getOuterWidth|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L211

:::

_cellRange.getOuterWidth() ⇒ number_

Returns the width of your range (as a number of columns, including column headers).



### getTopEndCorner

::: ask-about-api getTopEndCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L574

:::

_cellRange.getTopEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopLeftCorner

::: ask-about-api getTopLeftCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L543

:::

_cellRange.getTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top-left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopRightCorner

::: ask-about-api getTopRightCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L585

:::

_cellRange.getTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopStartCorner

::: ask-about-api getTopStartCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L532

:::

_cellRange.getTopStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top-left (in LTR) or top-right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getVerticalDirection

::: ask-about-api getVerticalDirection|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L460

:::

_cellRange.getVerticalDirection() ⇒ string_

Gets the vertical direction of the selection.


**Returns**: `string` - Returns one of the values: `N-S` (north->south), `S-N` (south->north).  

### getWidth

::: ask-about-api getWidth|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L231

:::

_cellRange.getWidth() ⇒ number_

Returns the width of your range (as a number of columns, excluding column headers).



### includes

::: ask-about-api includes|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L253

:::

_cellRange.includes(cellCoords) ⇒ boolean_

Checks if another set of coordinates (`cellCoords`)
is within the `from` and `to` coordinates of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | Coordinates to check. |



### includesRange

::: ask-about-api includesRange|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L268

:::

_cellRange.includesRange(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is within your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isCorner

::: ask-about-api isCorner|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L698

:::

_cellRange.isCorner(coords) ⇒ boolean_

Checks if a set of coordinates (`coords`) matches one of the 4 corners of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to check. |



### isEqual

::: ask-about-api isEqual|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L276

:::

_cellRange.isEqual(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is equal to your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isHeader

::: ask-about-api isHeader|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L187

:::

_cellRange.isHeader() ⇒ boolean_

Checks if your range covers only headers range (negative coordinates, without any cells).



### isNorthWestOf

::: ask-about-api isNorthWestOf|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L313

:::

_cellRange.isNorthWestOf(cellCoords) ⇒ boolean_

Checks if coordinates point is north-west of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellRange`](#cellrange) | Coordinates to check. |



### isOverlappingHorizontally

::: ask-about-api isOverlappingHorizontally|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L324

:::

_cellRange.isOverlappingHorizontally(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range horizontally.

For example: returns `true` if the last column of your range is `5`
and the first column of the `cellRange` range is `3`.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isOverlappingVertically

::: ask-about-api isOverlappingVertically|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L335

:::

_cellRange.isOverlappingVertically(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range vertically.

For example: returns `true` if the last row of your range is `5`
and the first row of the `cellRange` range is `3`.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isSingle

::: ask-about-api isSingle|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L160

:::

_cellRange.isSingle() ⇒ boolean_

Checks if your range is just a single cell or header.



### isSingleCell

::: ask-about-api isSingleCell|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L167

:::

_cellRange.isSingleCell() ⇒ boolean_

Checks if your range is just a single cell.



### isSingleHeader

::: ask-about-api isSingleHeader|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L177

:::

_cellRange.isSingleHeader() ⇒ boolean_

Checks if your range is just a single header.



### isSouthEastOf

::: ask-about-api isSouthEastOf|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L305

:::

_cellRange.isSouthEastOf(cellCoords) ⇒ boolean_

Checks if coordinates point is south-east of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | Coordinates to check. |



### isValid

::: ask-about-api isValid|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L153

:::

_cellRange.isValid(tableParams) ⇒ boolean_

Checks if the coordinates in your `CellRange` instance are valid
in the context of given table parameters.

See the [`isValid()`](@/api/cellCoords.md#isvalid) method of the [`CellCoords`](@/api/cellCoords.md) class.


| Param | Type | Description |
| --- | --- | --- |
| tableParams | `object` | An object with a defined table size. |
| tableParams.countRows | `number` | The total number of rows. |
| tableParams.countCols | `number` | The total number of columns. |
| tableParams.countRowHeaders | `number` | A number of row headers. |
| tableParams.countColHeaders | `number` | A number of column headers. |



### normalize

::: ask-about-api normalize|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L135

:::

_cellRange.normalize() ⇒ [CellRange](@/api/cellRange.md)_

Normalizes the coordinates in your `CellRange` instance to the nearest valid position.

Coordinates that point to headers (negative values) are normalized to `0`.



### overlaps

::: ask-about-api overlaps|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L297

:::

_cellRange.overlaps(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range.

Range A overlaps range B if the intersection of A and B (or B and A) is not empty.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### setDirection

::: ask-about-api setDirection|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L426

:::

_cellRange.setDirection(direction)_

Sets the direction of the selection.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`. |



### setFrom

::: ask-about-api setFrom|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L116

:::

_cellRange.setFrom(coords) ⇒ [CellRange](@/api/cellRange.md)_

Sets the `coords` coordinates as the start of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setHighlight

::: ask-about-api setHighlight|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L107

:::

_cellRange.setHighlight(coords) ⇒ [CellRange](@/api/cellRange.md)_

Highlights cell selection at the `coords` coordinates.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setTo

::: ask-about-api setTo|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L125

:::

_cellRange.setTo(coords) ⇒ [CellRange](@/api/cellRange.md)_

Sets the `coords` coordinates as the end of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### toObject

::: ask-about-api toObject|CellRange

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/3rdparty/walkontable/src/cell/range.js#L856

:::

_cellRange.toObject() ⇒ Object_

Converts your `CellRange` instance into an object literal with the following properties:

- `from`
   - `row`
   - `col`
- `to`
   - `row`
   - `col`


**Returns**: `Object` - An object literal with `from` and `to` properties.  
