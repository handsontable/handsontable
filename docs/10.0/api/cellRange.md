---
title: CellRange
metaTitle: CellRange - API Reference - Handsontable Documentation
permalink: /10.0/api/cell-range
canonicalUrl: /api/cell-range
hotPlugin: false
editLink: false
---

# CellRange

[[toc]]
## Members

### from
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L25

:::

_cellRange.from : [CellCoords](@/api/cellCoords.md)_

Usually the same as highlight, but in Excel there is distinction - one can change
highlight within a selection.



### highlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L18

:::

_cellRange.highlight : [CellCoords](@/api/cellCoords.md)_

Used to draw bold border around a cell where selection was started and to edit the cell
when you press Enter. The highlight cannot point to headers (negative values) so its
coordinates object is normalized while assigning.



### to
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L31

:::

_cellRange.to : [CellCoords](@/api/cellCoords.md)_

End selection.


## Methods

### clone
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L661

:::

_cellRange.clone() ⇒ [CellRange](@/api/cellRange.md)_

Clones the range coordinates.



### expand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L238

:::

_cellRange.expand(cellCoords) ⇒ boolean_

Adds a cell to a range (only if exceeds corners of the range). Returns information if range was expanded.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | The cell coordinates. |



### expandByRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L259

:::

_cellRange.expandByRange(expandingRange) ⇒ boolean_

Expand the current object by the range passed in the first argument.


| Param | Type | Description |
| --- | --- | --- |
| expandingRange | [`CellRange`](#cellrange) | Object extending the range. |



### flipDirectionHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L384

:::

_cellRange.flipDirectionHorizontally()_

Flip the direction horizontally. (e.g. `NW-SE` changes to `NE-SW`).



### flipDirectionVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L360

:::

_cellRange.flipDirectionVertically()_

Flip the direction vertically. (e.g. `NW-SE` changes to `SW-NE`).



### forAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L641

:::

_cellRange.forAll(callback)_

Runs a callback function against all cells in the range. You can break the iteration by returning
`false` in the callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The callback function. |



### getAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L613

:::

_cellRange.getAll() ⇒ Array_

Get all selected cell coords defined by this range.



### getBordersSharedWith
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L552

:::

_cellRange.getBordersSharedWith(range) ⇒ Array_


| Param | Type | Description |
| --- | --- | --- |
| range | [`CellRange`](#cellrange) | The cells range to compare with. |



### getBottomLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L441

:::

_cellRange.getBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner of this range. If the corner contains header coordinates
(negative values), the corner coordinates will be normalized to 0.



### getBottomRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L421

:::

_cellRange.getBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner of this range. If the corner contains header coordinates
(negative values), the corner coordinates will be normalized to 0.



### getDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L300

:::

_cellRange.getDirection() ⇒ string_

Gets the direction of the selection.


**Returns**: `string` - Returns one of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.  

### getHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L113

:::

_cellRange.getHeight() ⇒ number_

Returns selected range height (in number of rows excluding rows' headers).



### getHorizontalDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L353

:::

_cellRange.getHorizontalDirection() ⇒ string_

Gets the horizontal direction of the range.


**Returns**: `string` - Returns one of the values: `W-E` (west->east), `E-W` (east->west).  

### getInner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L592

:::

_cellRange.getInner() ⇒ Array_

Get inner selected cell coords defined by this range.



### getOppositeCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L512

:::

_cellRange.getOppositeCorner(coords, [expandedRange]) ⇒ [CellCoords](@/api/cellCoords.md)_

Gets coordinates of the corner which is opposite to the matched. When the passed coordinates matched to the
bottom-right corner of this range then the coordinates for top-left will be returned.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Cell coordinates to check. |
| [expandedRange] | [`CellRange`](#cellrange) | `optional` The cells range to compare with. |



### getOuterBottomLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L480

:::

_cellRange.getOuterBottomLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom left corner of this range. If the corner contains header coordinates
(negative values), then the left coordinate will be pointed to that header.



### getOuterBottomRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L460

:::

_cellRange.getOuterBottomRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the bottom right corner of this range.



### getOuterHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L95

:::

_cellRange.getOuterHeight() ⇒ number_

Returns selected range height (in number of rows including rows' headers).



### getOuterTopLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L451

:::

_cellRange.getOuterTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left corner of this range. If the corner contains header coordinates
(negative values), then the top and left coordinates will be pointed to that header.



### getOuterTopRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L470

:::

_cellRange.getOuterTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner of this range. If the corner contains header coordinates
(negative values), then the top coordinate will be pointed to that header.



### getOuterWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L104

:::

_cellRange.getOuterWidth() ⇒ number_

Returns selected range width (in number of columns including columns' headers).



### getTopLeftCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L411

:::

_cellRange.getTopLeftCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top left corner of this range. If the corner contains header coordinates
(negative values), the corner coordinates will be normalized to 0.



### getTopRightCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L431

:::

_cellRange.getTopRightCorner() ⇒ [CellCoords](@/api/cellCoords.md)_

Gets the top right corner of this range. If the corner contains header coordinates
(negative values), the corner coordinates will be normalized to 0.



### getVerticalDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L344

:::

_cellRange.getVerticalDirection() ⇒ string_

Gets the vertical direction of the range.


**Returns**: `string` - Returns one of the values: `N-S` (north->south), `S-N` (south->north).  

### getWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L125

:::

_cellRange.getWidth() ⇒ number_

Returns selected range width (in number of columns excluding columns' headers).



### includes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L138

:::

_cellRange.includes(cellCoords) ⇒ boolean_

Checks if given cell coordinates are within `from` and `to` cell coordinates of this range.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | `CellCoords` | The cell coordinates to check. |



### includesRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L152

:::

_cellRange.includesRange(cellRange) ⇒ boolean_

Checks if given range is within of this range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### isCorner
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L491

:::

_cellRange.isCorner(coords, [expandedRange]) ⇒ boolean_

Checks if coordinates match to one of the 4th corners of this range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Cell coordinates to check. |
| [expandedRange] | [`CellRange`](#cellrange) | `optional` The cells range to compare with. |



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L163

:::

_cellRange.isEqual(cellRange) ⇒ boolean_

Checks if given range is equal to this range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L199

:::

_cellRange.isNorthWestOf(cellRange) ⇒ boolean_

Checks if tested coordinates are positioned in north-west from this cell range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### isOverlappingHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L211

:::

_cellRange.isOverlappingHorizontally(cellRange) ⇒ boolean_

Returns `true` if the provided range is overlapping the current range horizontally (e.g. The current range's last
column is 5 and the provided range's first column is 3).


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### isOverlappingVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L225

:::

_cellRange.isOverlappingVertically(cellRange) ⇒ boolean_

Returns `true` if the provided range is overlapping the current range vertically (e.g. The current range's last
 row is 5 and the provided range's first row is 3).


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### isSingle
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L85

:::

_cellRange.isSingle() ⇒ boolean_

Checks if this cell range is restricted to one cell.



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L188

:::

_cellRange.isSouthEastOf(cellRange) ⇒ boolean_

Checks if tested coordinates are positioned in south-east from this cell range.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L76

:::

_cellRange.isValid(wot) ⇒ boolean_

Checks if given coordinates are valid in context of a given Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | The Walkontable instance. |



### overlaps
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L177

:::

_cellRange.overlaps(cellRange) ⇒ boolean_

Checks if tested range overlaps with the range. Range A is considered to to be overlapping with range B
if intersection of A and B or B and A is not empty.


| Param | Type | Description |
| --- | --- | --- |
| cellRange | [`CellRange`](#cellrange) | The cells range to check. |



### setDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L320

:::

_cellRange.setDirection(direction)_

Sets the direction of the selection.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`. |



### setFrom
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L52

:::

_cellRange.setFrom(coords) ⇒ [CellRange](@/api/cellRange.md)_

Set the new coordinates where selection starts from.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setHighlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L40

:::

_cellRange.setHighlight(coords) ⇒ [CellRange](@/api/cellRange.md)_

Set the new coordinates for highlighting selection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### setTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L64

:::

_cellRange.setTo(coords) ⇒ [CellRange](@/api/cellRange.md)_

Set new coordinates where selection ends from.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Coordinates to use. |



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/range.js#L671

:::

_cellRange.toObject() ⇒ object_

Convert CellRange to literal object.


**Returns**: `object` - Returns a literal object with `from` and `to` properties which each of that object
                 contains `row` and `col` keys.  
