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
that form a [selection range](@/guides/cell-features/selection.md#select-ranges).

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L851

:::

_cellRange.clone() ⇒ [CellRange](@/api/cellRange.md)_

Clones your `CellRange` instance.



### expand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L293

:::

_cellRange.expand(cellCoords) ⇒ boolean_

Adds a cell to your range, at `cellCoords` coordinates.

The `cellCoords` coordinates must exceed a corner of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | A new cell's coordinates. |



### expandByRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L316

:::

_cellRange.expandByRange(expandingRange) ⇒ boolean_

Expand your range with another range (`expandingRange`).


| Param | Type | Description |
| --- | --- | --- |
| expandingRange | [`CellRange`](#cellrange) | A new range. |



### flipDirectionHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L441

:::

_cellRange.flipDirectionHorizontally()_

Flips the direction of your range horizontally (e.g., `NW-SE` changes to `NE-SW`).



### flipDirectionVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L417

:::

_cellRange.flipDirectionVertically()_

Flips the direction of your range vertically (e.g., `NW-SE` changes to `SW-NE`).



### forAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L831

:::

_cellRange.forAll(callback)_

Runs a callback function on all cells within your range.

You can break the iteration by returning `false` in the callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | A callback function. |



### getAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L802

:::

_cellRange.getAll() ⇒ Array&lt;[CellCoords](@/api/cellCoords.md)&gt;_

Gets the coordinates of all cells of your range.



### getBordersSharedWith
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L741

:::

_cellRange.getBordersSharedWith(range) ⇒ Array&lt;('top'\|'right'\|'bottom'\|'left')&gt;_

Indicates which borders (top, right, bottom, left) are shared between
your `CellRange`instance and another `range` that's within your range.


| Param | Type | Description |
| --- | --- | --- |
| range | [`CellRange`](#cellrange) | A range to compare with. |



### getBottomEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L496

:::

_cellRange.getBottomEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L562

:::

_cellRange.getBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L510

:::

_cellRange.getBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getBottomStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L548

:::

_cellRange.getBottomStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getCellsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L175

:::

_cellRange.getCellsCount() ⇒ number_

Returns the number of cells within your range (excluding column and row headers).



### getDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L357

:::

_cellRange.getDirection() ⇒ string_

Gets the direction of the selection.


**Returns**: `string` - Returns one of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.  

### getHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L141

:::

_cellRange.getHeight() ⇒ number_

Returns the height of your range (as a number of rows, excluding row headers).



### getHorizontalDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L410

:::

_cellRange.getHorizontalDirection() ⇒ string_

Gets the horizontal direction of the selection.


**Returns**: `string` - Returns one of the values: `W-E` (west->east), `E-W` (east->west).  

### getInner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L781

:::

_cellRange.getInner() ⇒ Array&lt;[CellCoords](@/api/cellCoords.md)&gt;_

Gets the coordinates of the inner cells of your range.



### getOppositeCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L696

:::

_cellRange.getOppositeCorner(coords, [expandedRange]) ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the coordinates of a range corner opposite to the provided `coords`.

For example: if the `coords` coordinates match the bottom-right corner of your range,
the coordinates of the top-left corner of your range are returned.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to check. |
| [expandedRange] | [`CellRange`](#cellrange) | `optional` A range to compare with. |



### getOuterBottomEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L599

:::

_cellRange.getOuterBottomEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterBottomLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L662

:::

_cellRange.getOuterBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterBottomRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L612

:::

_cellRange.getOuterBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterBottomStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L649

:::

_cellRange.getOuterBottomStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L123

:::

_cellRange.getOuterHeight() ⇒ number_

Returns the height of your range (as a number of rows, including row headers).



### getOuterTopEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L624

:::

_cellRange.getOuterTopEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterTopLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L587

:::

_cellRange.getOuterTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterTopRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L637

:::

_cellRange.getOuterTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the top and left coordinates are pointed to that header.



### getOuterTopStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L574

:::

_cellRange.getOuterTopStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left (in LTR) or top right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the top and start coordinates are pointed to that header.



### getOuterWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L132

:::

_cellRange.getOuterWidth() ⇒ number_

Returns the width of your range (as a number of columns, including column headers).



### getTopEndCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L522

:::

_cellRange.getTopEndCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L484

:::

_cellRange.getTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top-left corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L536

:::

_cellRange.getTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner coordinates of your range,
both in the LTR and RTL layout direction.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getTopStartCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L470

:::

_cellRange.getTopStartCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top-left (in LTR) or top-right (in RTL) corner coordinates of your range.

If the corner contains header coordinates (negative values),
the corner coordinates are normalized to `0`.



### getVerticalDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L401

:::

_cellRange.getVerticalDirection() ⇒ string_

Gets the vertical direction of the selection.


**Returns**: `string` - Returns one of the values: `N-S` (north->south), `S-N` (south->north).  

### getWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L158

:::

_cellRange.getWidth() ⇒ number_

Returns the width of your range (as a number of columns, excluding column headers).



### includes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L186

:::

_cellRange.includes(cellCoords) ⇒ boolean_

Checks if another set of coordinates (`cellCoords`)
is within the `from` and `to` coordinates of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | Coordinates to check. |



### includesRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L200

:::

_cellRange.includesRange(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is within your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L673

:::

_cellRange.isCorner(coords, [expandedRange]) ⇒ boolean_

Checks if a set of coordinates (`coords`) matches one of the 4 corners of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to check. |
| [expandedRange] | [`CellRange`](#cellrange) | `optional` A range to compare with. |



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L211

:::

_cellRange.isEqual(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is equal to your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L248

:::

_cellRange.isNorthWestOf(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is north-west of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isOverlappingHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L262

:::

_cellRange.isOverlappingHorizontally(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range horizontally.

For example: returns `true` if the last column of your range is `5`
and the first column of the `cellRange` range is `3`.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isOverlappingVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L278

:::

_cellRange.isOverlappingVertically(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range vertically.

For example: returns `true` if the last row of your range is `5`
and the first row of the `cellRange` range is `3`.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isSingle
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L113

:::

_cellRange.isSingle() ⇒ boolean_

Checks if your range is just a single cell.



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L237

:::

_cellRange.isSouthEastOf(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) is south-east of your range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L104

:::

_cellRange.isValid(wot) ⇒ boolean_

Checks if the coordinates in your `CellRange` instance are valid
in the context of a given Walkontable instance.

See the [`isValid()`](@/api/cellCoords.md#isvalid) method of the [`CellCoords`](@/api/cellCoords.md) class.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | A Walkontable instance. |



### overlaps
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L226

:::

_cellRange.overlaps(cellRange) ⇒ boolean_

Checks if another range (`cellRange`) overlaps your range.

Range A overlaps range B if the intersection of A and B (or B and A) is not empty.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | A range to check. |



### setDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L377

:::

_cellRange.setDirection(direction)_

Sets the direction of the selection.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`. |



### setFrom
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L77

:::

_cellRange.setFrom(coords) ⇒ [CellRange](@/api/cellRange.md)_

Sets the `coords` coordinates as the start of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setHighlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L65

:::

_cellRange.setHighlight(coords) ⇒ [CellRange](@/api/cellRange.md)_

Highlights cell selection at the `coords` coordinates.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L89

:::

_cellRange.setTo(coords) ⇒ [CellRange](@/api/cellRange.md)_

Sets the `coords` coordinates as the end of your range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/696f1e0ace1190473725487bd2bede624223a270/handsontable/src/3rdparty/walkontable/src/cell/range.js#L867

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
