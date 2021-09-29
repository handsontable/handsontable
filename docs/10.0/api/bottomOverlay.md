---
title: BottomOverlay
metaTitle: BottomOverlay - API Reference - Handsontable Documentation
permalink: /10.0/api/bottom-overlay
canonicalUrl: /api/bottom-overlay
hotPlugin: false
editLink: false
---

# BottomOverlay

[[toc]]
## Members

### BottomOverlay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L35

:::

_bottomOverlay.[BottomOverlay](@/api/bottomOverlay.md)_



### cachedFixedRowsBottom
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L30

:::

_bottomOverlay.cachedFixedRowsBottom : number_

Cached value which holds the previous value of the `fixedRowsBottom` option.
It is used as a comparison value that can be used to detect changes in that value.


## Methods

### adjustElementsSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L186

:::

_bottomOverlay.adjustElementsSize([force])_

Adjust overlay root element, childs and master table element sizes (width, height).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` When `true`, it adjusts the DOM nodes sizes for that overlay. |



### adjustHeaderBordersPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L335

:::

_bottomOverlay.adjustHeaderBordersPosition(position) ⇒ boolean_

Adds css classes to hide the header border's header (cell-selection border hiding issue).


| Param | Type | Description |
| --- | --- | --- |
| position | `number` | Header Y position if trimming container is window or scroll top if not. |



### adjustRootChildrenSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L233

:::

_bottomOverlay.adjustRootChildrenSize()_

Adjust overlay root childs size.



### adjustRootElementSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L198

:::

_bottomOverlay.adjustRootElementSize()_

Adjust overlay root element size (width and height).



### applyToDOM
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L244

:::

_bottomOverlay.applyToDOM()_

Adjust the overlay dimensions and position.



### createTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L48

:::

_bottomOverlay.createTable(...args) ⇒ [Table](@/api/table.md)_

Factory method to create a subclass of `Table` that is relevant to this overlay.

**See**: [Table#constructor](@/api/table.md##constructor)  

| Param | Type | Description |
| --- | --- | --- |
| ...args | `*` | Parameters that will be forwarded to the `Table` constructor. |



### getScrollPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L325

:::

_bottomOverlay.getScrollPosition() ⇒ number_

Gets the main overlay's vertical scroll position.


**Returns**: `number` - Main table's vertical scroll position.  

### getTableParentOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L312

:::

_bottomOverlay.getTableParentOffset() ⇒ number_

Gets table parent top position.



### onScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L154

:::

_bottomOverlay.onScroll()_

Triggers onScroll hook callback.



### repositionOverlay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L117

:::

_bottomOverlay.repositionOverlay()_

Updates the bottom overlay position.



### resetFixedPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L66

:::

_bottomOverlay.resetFixedPosition() ⇒ boolean_

Updates the top overlay position.



### scrollTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L283

:::

_bottomOverlay.scrollTo(sourceRow, [bottomEdge])_

Scrolls vertically to a row.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sourceRow | `number` |  | Row index which you want to scroll to. |
| [bottomEdge] | `boolean` | <code>false</code> | `optional` If `true`, scrolls according to the bottom edge (top edge is by default). |



### setScrollPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L135

:::

_bottomOverlay.setScrollPosition(pos) ⇒ boolean_

Sets the main overlay's vertical scroll position.


| Param | Type | Description |
| --- | --- | --- |
| pos | `number` | The scroll position. |



### shouldBeRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L57

:::

_bottomOverlay.shouldBeRendered() ⇒ boolean_

Checks if overlay should be fully rendered.



### sumCellSizes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L165

:::

_bottomOverlay.sumCellSizes(from, to) ⇒ number_

Calculates total sum cells height.


| Param | Type | Description |
| --- | --- | --- |
| from | `number` | Row index which calculates started from. |
| to | `number` | Row index where calculation is finished. |


**Returns**: `number` - Height sum.  

### syncOverlayOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/bottom.js#L268

:::

_bottomOverlay.syncOverlayOffset()_

Synchronize calculated left position to an element.


