---
title: Overlays
metaTitle: Overlays - API Reference - Handsontable Documentation
permalink: /10.0/api/overlays
canonicalUrl: /api/overlays
hotPlugin: false
editLink: false
---

# Overlays

[[toc]]

## Description


## Methods

### adjustElementsSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L526

:::

_overlays.adjustElementsSize([force])_

Adjust overlays elements size and master table size.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` When `true`, it adjust the DOM nodes sizes for all overlays. |



### applyToDOM
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L565

:::

_overlays.applyToDOM()_



### deregisterListeners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L256

:::

_overlays.deregisterListeners()_

Deregister all previously registered listeners.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L469

:::

_overlays.destroy()_



### getParentOverlay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L587

:::

_overlays.getParentOverlay(element) ⇒ object | null_

Get the parent overlay of the provided element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | An element to process. |



### onCloneWheel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L291

:::

_overlays.onCloneWheel(event, preventDefault)_

Wheel listener for cloned overlays.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The mouse event object. |
| preventDefault | `boolean` | If `true`, the `preventDefault` will be called on event object. |



### onKeyDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L324

:::

_overlays.onKeyDown(event)_

Key down listener.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The keyboard event object. |



### onKeyUp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L331

:::

_overlays.onKeyUp()_

Key up listener.



### onTableScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L265

:::

_overlays.onTableScroll(event)_

Scroll listener.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The mouse event object. |



### prepareOverlays
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L101

:::

_overlays.prepareOverlays() ⇒ boolean_

Prepare overlays based on user settings.


**Returns**: `boolean` - Returns `true` if changes applied to overlay needs scroll synchronization.  

### refresh
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L494

:::

_overlays.refresh([fastDraw])_


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [fastDraw] | `boolean` | <code>false</code> | `optional` When `true`, try to refresh only the positions of borders without rerendering                                   the data. It will only work if Table.draw() does not force                                   rendering anyway. |



### refreshAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L157

:::

_overlays.refreshAll()_

Refresh and redraw table.



### registerListeners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L184

:::

_overlays.registerListeners()_

Register all necessary event listeners.



### scrollHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L379

:::

_overlays.scrollHorizontally(delta) ⇒ boolean_

Scrolls main scrollable element horizontally.


| Param | Type | Description |
| --- | --- | --- |
| delta | `number` | Relative value to scroll. |



### scrollVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L365

:::

_overlays.scrollVertically(delta) ⇒ boolean_

Scrolls main scrollable element horizontally.


| Param | Type | Description |
| --- | --- | --- |
| delta | `number` | Relative value to scroll. |



### syncOverlayTableClassNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L618

:::

_overlays.syncOverlayTableClassNames()_

Synchronize the class names between the main overlay table and the tables on the other overlays.



### syncScrollWithMaster
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L428

:::

_overlays.syncScrollWithMaster()_

Synchronize overlay scrollbars with the master scrollbar.



### updateMainScrollableElements
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L446

:::

_overlays.updateMainScrollableElements()_

Update the main scrollable elements for all the overlays.



## Description


## Methods

### adjustElementsSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L526

:::

_overlays.adjustElementsSize([force])_

Adjust overlays elements size and master table size.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` When `true`, it adjust the DOM nodes sizes for all overlays. |



### applyToDOM
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L565

:::

_overlays.applyToDOM()_



### deregisterListeners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L256

:::

_overlays.deregisterListeners()_

Deregister all previously registered listeners.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L469

:::

_overlays.destroy()_



### getParentOverlay
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L587

:::

_overlays.getParentOverlay(element) ⇒ object | null_

Get the parent overlay of the provided element.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | An element to process. |



### onCloneWheel
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L291

:::

_overlays.onCloneWheel(event, preventDefault)_

Wheel listener for cloned overlays.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The mouse event object. |
| preventDefault | `boolean` | If `true`, the `preventDefault` will be called on event object. |



### onKeyDown
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L324

:::

_overlays.onKeyDown(event)_

Key down listener.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The keyboard event object. |



### onKeyUp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L331

:::

_overlays.onKeyUp()_

Key up listener.



### onTableScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L265

:::

_overlays.onTableScroll(event)_

Scroll listener.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The mouse event object. |



### prepareOverlays
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L101

:::

_overlays.prepareOverlays() ⇒ boolean_

Prepare overlays based on user settings.


**Returns**: `boolean` - Returns `true` if changes applied to overlay needs scroll synchronization.  

### refresh
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L494

:::

_overlays.refresh([fastDraw])_


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [fastDraw] | `boolean` | <code>false</code> | `optional` When `true`, try to refresh only the positions of borders without rerendering                                   the data. It will only work if Table.draw() does not force                                   rendering anyway. |



### refreshAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L157

:::

_overlays.refreshAll()_

Refresh and redraw table.



### registerListeners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L184

:::

_overlays.registerListeners()_

Register all necessary event listeners.



### scrollHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L379

:::

_overlays.scrollHorizontally(delta) ⇒ boolean_

Scrolls main scrollable element horizontally.


| Param | Type | Description |
| --- | --- | --- |
| delta | `number` | Relative value to scroll. |



### scrollVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L365

:::

_overlays.scrollVertically(delta) ⇒ boolean_

Scrolls main scrollable element horizontally.


| Param | Type | Description |
| --- | --- | --- |
| delta | `number` | Relative value to scroll. |



### syncOverlayTableClassNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L618

:::

_overlays.syncOverlayTableClassNames()_

Synchronize the class names between the main overlay table and the tables on the other overlays.



### syncScrollWithMaster
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L428

:::

_overlays.syncScrollWithMaster()_

Synchronize overlay scrollbars with the master scrollbar.



### updateMainScrollableElements
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/overlays.js#L446

:::

_overlays.updateMainScrollableElements()_

Update the main scrollable elements for all the overlays.


