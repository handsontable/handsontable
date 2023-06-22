---
title: CellCoords
metaTitle: CellCoords - JavaScript Data Grid | Handsontable
permalink: /api/cell-coords
canonicalUrl: /api/cell-coords
searchCategory: API Reference
hotPlugin: false
editLink: false
id: qthfdrss
description: Options, members, and methods of Handsontable's CellCoord API.
react:
  id: ufhe1gsm
  metaTitle: CellCoords - React Data Grid | Handsontable
---

# CellCoords

[[toc]]

## Description

The `CellCoords` class holds the coordinates (`row`, `col`) of a single cell.

It also contains methods for validating the coordinates
and retrieving them as an object.

To import the `CellCoords` class:

```js
import Handsontable, { CellCoords } from '/handsontable';

// or, using modules
import Handsontable, { CellCoords } from '/handsontable/base';
```


## Members

### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L31

:::

_cellCoords.col : number_

A visual column index.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L25

:::

_cellCoords.row : number_

A visual row index.


## Methods

### clone
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L156

:::

_cellCoords.clone() ⇒ [CellCoords](@/api/cellCoords.md)_

Clones your `CellCoords` instance.



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L81

:::

_cellCoords.isEqual(cellCoords) ⇒ boolean_

Checks if another set of coordinates (`cellCoords`)
is equal to the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isNorthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L132

:::

_cellCoords.isNorthEastOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is north-east of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L108

:::

_cellCoords.isNorthWestOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is north-west of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L96

:::

_cellCoords.isSouthEastOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is south-east of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isSouthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L120

:::

_cellCoords.isSouthWestOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is south-west of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L61

:::

_cellCoords.isValid(wot) ⇒ boolean_

Checks if the coordinates in your `CellCoords` instance are valid
in the context of a given Walkontable instance.

The `row` index:
- Can't be negative.
- Can't be higher than the total number of rows in the Walkontable instance.

The `col` index:
- Can't be negative.
- Can't be higher than the total number of columns in the Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | A Walkontable instance. |


**Returns**: `boolean` - `true`: The coordinates are valid.  

### normalize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L144

:::

_cellCoords.normalize() ⇒ [CellCoords](@/api/cellCoords.md)_

Normalizes the coordinates in your `CellCoords` instance to the nearest valid position.

Coordinates that point to headers (negative values) are normalized to `0`.



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/129776acd62743434bedb81bb4b3b375b3906f2d/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L165

:::

_cellCoords.toObject() ⇒ Object_

Converts your `CellCoords` instance into an object literal with `row` and `col` properties.


**Returns**: `Object` - An object literal with `row` and `col` properties.  
