---
title: SelectionRange
metaTitle: SelectionRange - API Reference - Handsontable Documentation
permalink: /10.0/api/selection-range
canonicalUrl: /api/selection-range
hotPlugin: false
editLink: false
---

# SelectionRange

[[toc]]

## Description

The SelectionRange class is a simple CellRanges collection designed for easy manipulation of the multiple
consecutive and non-consecutive selections.


## Members

### ranges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L17

:::

_selectionRange.ranges : Array&lt;[CellRange](@/api/cellRange.md)&gt;_

List of all CellRanges added to the class instance.


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L49

:::

_selectionRange.add(coords) ⇒ [SelectionRange](@/api/selectionRange.md)_

Add coordinates to the class instance. The new coordinates are added to the end of the range collection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L100

:::

_selectionRange.clear() ⇒ [SelectionRange](@/api/selectionRange.md)_

Clear collection.



### current
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L71

:::

_selectionRange.current() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Get last added coordinates from ranges, it returns a CellRange instance.



### includes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L91

:::

_selectionRange.includes(coords) ⇒ boolean_

Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
the coords object is within selection range.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L25

:::

_selectionRange.isEmpty() ⇒ boolean_

Check if selected range is empty.



### peekByIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L121

:::

_selectionRange.peekByIndex([offset]) ⇒ [CellRange](@/api/cellRange.md) | undefined_

Peek the coordinates based on the offset where that coordinate resides in the collection.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [offset] | `number` | <code>0</code> | `optional` An offset where the coordinate will be retrieved from. |



### pop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L60

:::

_selectionRange.pop() ⇒ [SelectionRange](@/api/selectionRange.md)_

Removes from the stack the last added coordinates.



### previous
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L80

:::

_selectionRange.previous() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Get previously added coordinates from ranges, it returns a CellRange instance.



### set
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L36

:::

_selectionRange.set(coords) ⇒ [SelectionRange](@/api/selectionRange.md)_

Set coordinates to the class instance. It clears all previously added coordinates and push `coords`
to the collection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The CellCoords instance with defined visual coordinates. |



### size
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/range.js#L111

:::

_selectionRange.size() ⇒ number_

Get count of added all coordinates added to the selection.


