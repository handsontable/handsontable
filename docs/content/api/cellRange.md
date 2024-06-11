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
---

# CellRange

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L871

:::

_cellRange.clone() ⇒ [CellRange](@/api/cellRange.md)_

Clones your `CellRange` instance.



### containsHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L159

:::

_cellRange.containsHeaders() ⇒ boolean_

Checks if your range overlaps headers range (negative coordinates).



### expand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L338

:::

_cellRange.expand(cellCoords) ⇒ boolean_

Adds a cell to your range, at `cellCoords` coordinates.

The `cellCoords` coordinates must exceed a corner of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | A new cell's coordinates. |



### expandByRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L363

:::

_cellRange.expandByRange(expandingRange, [changeDirection]) ⇒ boolean_

Expand your range with another range (`expandingRange`).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| expandingRange | [`CellRange`](#cellrange) |  | A new range. |
| [changeDirection] | `boolean` | <code>true</code> | `optional` If `true`, the direction of your range is changed to the direction of the `expandingRange` range. |



### flipDirectionHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L490

:::

_cellRange.flipDirectionHorizontally()_

Flips the direction of your range horizontally (e.g., `NW-SE` changes to `NE-SW`).



### flipDirectionVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L466

:::

_cellRange.flipDirectionVertically()_

Flips the direction of your range vertically (e.g., `NW-SE` changes to `SW-NE`).



### forAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L851

:::

_cellRange.forAll(callback)_

Runs a callback function on all cells within your range.

You can break the iteration by returning `false` in the callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | A callback function. |



### getAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L822

:::

_cellRange.getAll() ⇒ Array&lt;[CellCoords](@/api/cellCoords.md)&gt;_

Gets the coordinates of all cells of your range.



### getBordersSharedWith
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L761

:::

_cellRange.getBordersSharedWith(range) ⇒ Array&lt;('top'\|'right'\|'bottom'\|'left')&gt;_

Indicates which borders (top, right, bottom, left) are shared between
your `CellRange`instance and another `range` that's within your range.


| Param | Type | Description |
| --- | --- | --- |
| range | [`CellRange`](#cellrange) | A range to compare with. |



### getBottomEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L545

:::

_cellRange.getBottomEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L611

:::

_cellRange.getBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L559

:::

_cellRange.getBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L597

:::

_cellRange.getBottomStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getCellsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L220

:::

_cellRange.getCellsCount() ⇒ number_

Returns the number of cells within your range (excluding column and row headers).



### getDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L406

:::

_cellRange.getDirection() ⇒ string_

Gets the direction of the selection.


**Returns**: `string` - Returns one of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.  

### getHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L186

:::

_cellRange.getHeight() ⇒ number_

Returns the height of your range (as a number of rows, excluding row headers).



### getHorizontalDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L459

:::

_cellRange.getHorizontalDirection() ⇒ string_

Gets the horizontal direction of the selection.


**Returns**: `string` - Returns one of the values: `W-E` (west->east), `E-W` (east->west).  

### getInner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L801

:::

_cellRange.getInner() ⇒ Array&lt;[CellCoords](@/api/cellCoords.md)&gt;_

Gets the coordinates of the inner cells of your range.



### getOppositeCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L735

:::

_cellRange.getOppositeCorner(coords) ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the coordinates of a range corner opposite to the provided `coords`.

For example: if the `coords` coordinates match the bottom-right corner of your range,
the coordinates of the top-left corner of your range are returned.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to check. |



### getOuterBottomEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L648

:::

_cellRange.getOuterBottomEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterBottomLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L711

:::

_cellRange.getOuterBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterBottomRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L661

:::

_cellRange.getOuterBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterBottomStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L698

:::

_cellRange.getOuterBottomStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L168

:::

_cellRange.getOuterHeight() ⇒ number_

Returns the height of your range (as a number of rows, including row headers).



### getOuterTopEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L673

:::

_cellRange.getOuterTopEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterTopLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L636

:::

_cellRange.getOuterTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterTopRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L686

:::

_cellRange.getOuterTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterTopStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L623

:::

_cellRange.getOuterTopStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left (in LTR) or top right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L177

:::

_cellRange.getOuterWidth() ⇒ number_

Returns the width of your range (as a number of columns, including column headers).



### getTopEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L571

:::

_cellRange.getTopEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L533

:::

_cellRange.getTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top-left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L585

:::

_cellRange.getTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L519

:::

_cellRange.getTopStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top-left (in LTR) or top-right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getVerticalDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L450

:::

_cellRange.getVerticalDirection() ⇒ string_

Gets the vertical direction of the selection.


**Returns**: `string` - Returns one of the values: `N-S` (north->south), `S-N` (south->north).  

### getWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L203

:::

_cellRange.getWidth() ⇒ number_

Returns the width of your range (as a number of columns, excluding column headers).



### includes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L231

:::

_cellRange.includes(cellCoords) ⇒ boolean_

Checks if another set of coordinates (`cellCoords`)
is within the `from` and `to` coordinates of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | Coordinates to check. |



### includesRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L245

:::

_cellRange.includesRange(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is within your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L721

:::

_cellRange.isCorner(coords) ⇒ boolean_

Checks if a set of coordinates (`coords`) matches one of the 4 corners of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to check. |



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L256

:::

_cellRange.isEqual(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is equal to your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L146

:::

_cellRange.isHeader() ⇒ boolean_

Checks if your range covers only headers range (negative coordinates, without any cells).



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L293

:::

_cellRange.isNorthWestOf(cellCoords) ⇒ boolean_

Checks if coordinates point is north-west of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellRange`](#cellrange) | Coordinates to check. |



### isOverlappingHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L307

:::

_cellRange.isOverlappingHorizontally(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range horizontally.

For example: returns `true` if the last column of your range is `5`
and the first column of the `cellRange` range is `3`.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isOverlappingVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L323

:::

_cellRange.isOverlappingVertically(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range vertically.

For example: returns `true` if the last row of your range is `5`
and the first row of the `cellRange` range is `3`.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isSingle
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L117

:::

_cellRange.isSingle() ⇒ boolean_

Checks if your range is just a single cell or header.



### isSingleCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L126

:::

_cellRange.isSingleCell() ⇒ boolean_

Checks if your range is just a single cell.



### isSingleHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L136

:::

_cellRange.isSingleHeader() ⇒ boolean_

Checks if your range is just a single header.



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L282

:::

_cellRange.isSouthEastOf(cellCoords) ⇒ boolean_

Checks if coordinates point is south-east of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | Coordinates to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L108

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



### overlaps
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L271

:::

_cellRange.overlaps(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range.

Range A overlaps range B if the intersection of A and B (or B and A) is not empty.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### setDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L426

:::

_cellRange.setDirection(direction)_

Sets the direction of the selection.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`. |



### setFrom
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L77

:::

_cellRange.setFrom(coords) ⇒ [CellRange](@/api/cellRange.md)_

Sets the `coords` coordinates as the start of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setHighlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L65

:::

_cellRange.setHighlight(coords) ⇒ [CellRange](@/api/cellRange.md)_

Highlights cell selection at the `coords` coordinates.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L89

:::

_cellRange.setTo(coords) ⇒ [CellRange](@/api/cellRange.md)_

Sets the `coords` coordinates as the end of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3b00830758c163b2129630aafac327849891bc9d/handsontable/src/3rdparty/walkontable/src/cell/range.js#L887

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
