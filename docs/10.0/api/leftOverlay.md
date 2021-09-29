---
title: LeftOverlay
metaTitle: LeftOverlay - API Reference - Handsontable Documentation
permalink: /10.0/api/left-overlay
canonicalUrl: /api/left-overlay
hotPlugin: false
editLink: false
---

# LeftOverlay

[[toc]]
## Members

### LeftOverlay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L29

:::

_leftOverlay.[LeftOverlay](@/api/leftOverlay.md)_


## Methods

### adjustElementsSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L158

:::

_leftOverlay.adjustElementsSize([force])_

Adjust overlay root element, childs and master table element sizes (width, height).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` When `true`, it adjusts the DOM nodes sizes for that overlay. |



### adjustHeaderBordersPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L308

:::

_leftOverlay.adjustHeaderBordersPosition(position) ⇒ boolean_

Adds css classes to hide the header border's header (cell-selection border hiding issue).


| Param | Type | Description |
| --- | --- | --- |
| position | `number` | Header X position if trimming container is window or scroll top if not. |



### adjustRootChildrenSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L201

:::

_leftOverlay.adjustRootChildrenSize()_

Adjust overlay root childs size.



### adjustRootElementSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L170

:::

_leftOverlay.adjustRootElementSize()_

Adjust overlay root element size (width and height).



### applyToDOM
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L216

:::

_leftOverlay.applyToDOM()_

Adjust the overlay dimensions and position.



### createTable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L41

:::

_leftOverlay.createTable(...args) ⇒ [Table](@/api/table.md)_

Factory method to create a subclass of `Table` that is relevant to this overlay.

**See**: [Table#constructor](@/api/table.md##constructor)  

| Param | Type | Description |
| --- | --- | --- |
| ...args | `*` | Parameters that will be forwarded to the `Table` constructor. |



### getScrollPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L298

:::

_leftOverlay.getScrollPosition() ⇒ number_

Gets the main overlay's horizontal scroll position.


**Returns**: `number` - Main table's vertical scroll position.  

### getTableParentOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L282

:::

_leftOverlay.getTableParentOffset() ⇒ number_

Gets table parent left position.



### onScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L129

:::

_leftOverlay.onScroll()_

Triggers onScroll hook callback.



### resetFixedPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L59

:::

_leftOverlay.resetFixedPosition() ⇒ boolean_

Updates the left overlay position.



### scrollTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L255

:::

_leftOverlay.scrollTo(sourceCol, [beyondRendered]) ⇒ boolean_

Scrolls horizontally to a column at the left edge of the viewport.


| Param | Type | Description |
| --- | --- | --- |
| sourceCol | `number` | Column index which you want to scroll to. |
| [beyondRendered] | `boolean` | `optional` If `true`, scrolls according to the bottom                                    edge (top edge is by default). |



### setScrollPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L110

:::

_leftOverlay.setScrollPosition(pos) ⇒ boolean_

Sets the main overlay's horizontal scroll position.


| Param | Type | Description |
| --- | --- | --- |
| pos | `number` | The scroll position. |



### shouldBeRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L50

:::

_leftOverlay.shouldBeRendered() ⇒ boolean_

Checks if overlay should be fully rendered.



### sumCellSizes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L140

:::

_leftOverlay.sumCellSizes(from, to) ⇒ number_

Calculates total sum cells width.


| Param | Type | Description |
| --- | --- | --- |
| from | `number` | Column index which calculates started from. |
| to | `number` | Column index where calculation is finished. |


**Returns**: `number` - Width sum.  

### syncOverlayOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlay/left.js#L238

:::

_leftOverlay.syncOverlayOffset()_

Synchronize calculated top position to an element.


