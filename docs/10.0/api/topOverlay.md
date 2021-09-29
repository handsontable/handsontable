---
title: TopOverlay
metaTitle: TopOverlay - API Reference - Handsontable Documentation
permalink: /10.0/api/top-overlay
canonicalUrl: /api/top-overlay
hotPlugin: false
editLink: false
---

# TopOverlay

[[toc]]
## Members

### TopOverlay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L37

:::

_topOverlay.[TopOverlay](@/api/topOverlay.md)_



### cachedFixedRowsTop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L32

:::

_topOverlay.cachedFixedRowsTop : number_

Cached value which holds the previous value of the `fixedRowsTop` option.
It is used as a comparison value that can be used to detect changes in this value.


## Methods

### adjustElementsSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L184

:::

_topOverlay.adjustElementsSize([force])_

Adjust overlay root element, childs and master table element sizes (width, height).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` When `true`, it adjusts the DOM nodes sizes for that overlay. |



### adjustHeaderBordersPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L344

:::

_topOverlay.adjustHeaderBordersPosition(position, [skipInnerBorderAdjusting]) ⇒ boolean_

Adds css classes to hide the header border's header (cell-selection border hiding issue).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| position | `number` |  | Header Y position if trimming container is window or scroll top if not. |
| [skipInnerBorderAdjusting] | `boolean` | <code>false</code> | `optional` If `true` the inner border adjusting will be skipped. |



### adjustRootChildrenSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L231

:::

_topOverlay.adjustRootChildrenSize()_

Adjust overlay root childs size.



### adjustRootElementSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L196

:::

_topOverlay.adjustRootElementSize()_

Adjust overlay root element size (width and height).



### applyToDOM
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L246

:::

_topOverlay.applyToDOM()_

Adjust the overlay dimensions and position.



### createTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L50

:::

_topOverlay.createTable(...args) ⇒ [Table](@/api/table.md)_

Factory method to create a subclass of `Table` that is relevant to this overlay.

**See**: [Table#constructor](@/api/table.md##constructor)  

| Param | Type | Description |
| --- | --- | --- |
| ...args | `*` | Parameters that will be forwarded to the `Table` constructor. |



### getScrollPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L333

:::

_topOverlay.getScrollPosition() ⇒ number_

Gets the main overlay's vertical scroll position.


**Returns**: `number` - Main table's vertical scroll position.  

### getTableParentOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L318

:::

_topOverlay.getTableParentOffset() ⇒ number_

Gets table parent top position.



### onScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L153

:::

_topOverlay.onScroll()_

Triggers onScroll hook callback.



### resetFixedPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L68

:::

_topOverlay.resetFixedPosition() ⇒ boolean_

Updates the top overlay position.



### scrollTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L285

:::

_topOverlay.scrollTo(sourceRow, [bottomEdge]) ⇒ boolean_

Scrolls vertically to a row.


| Param | Type | Description |
| --- | --- | --- |
| sourceRow | `number` | Row index which you want to scroll to. |
| [bottomEdge] | `boolean` | `optional` If `true`, scrolls according to the bottom edge (top edge is by default). |



### setScrollPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L134

:::

_topOverlay.setScrollPosition(pos) ⇒ boolean_

Sets the main overlay's vertical scroll position.


| Param | Type | Description |
| --- | --- | --- |
| pos | `number` | The scroll position. |



### shouldBeRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L59

:::

_topOverlay.shouldBeRendered() ⇒ boolean_

Checks if overlay should be fully rendered.



### sumCellSizes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L164

:::

_topOverlay.sumCellSizes(from, to) ⇒ number_

Calculates total sum cells height.


| Param | Type | Description |
| --- | --- | --- |
| from | `number` | Row index which calculates started from. |
| to | `number` | Row index where calculation is finished. |


**Returns**: `number` - Height sum.  

### syncOverlayOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/top.js#L269

:::

_topOverlay.syncOverlayOffset()_

Synchronize calculated left position to an element.


