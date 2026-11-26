---
title: CellPickController
metaTitle: CellPickController API reference | Handsontable DataGrid for JavaScript
permalink: /api/cell-pick-controller
canonicalUrl: /api/cell-pick-controller
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description


## Methods

### isHeaderPickActive

::: ask-about-api isHeaderPickActive|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L302

:::

_cellPickController.isHeaderPickActive() ⇒ boolean_

Whether a header pick drag is in progress (consulted by the `beforeColumnSort` guard).



### onBeforeMouseDown

::: ask-about-api onBeforeMouseDown|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L438

:::

_cellPickController.onBeforeMouseDown(event, coords, cellEl, eventController)_

`beforeOnCellMouseDown` hook listener.


| Param | Type | Description |
| --- | --- | --- |
| event | `MouseEvent` <br/> `undefined` | The mouse event. |
| coords | `GridCoords` | The visual cell coordinates. |
| cellEl | `HTMLTableCellElement` <br/> `undefined` | The clicked cell element. |
| eventController | `SelectionController` | Handsontable's selection suppressor. |



### onBeforeMouseOver

::: ask-about-api onBeforeMouseOver|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L446

:::

_cellPickController.onBeforeMouseOver(event, coords, cellEl, eventController)_

`beforeOnCellMouseOver` and `beforeOnCellMouseOverOutside` hook listener.


| Param | Type | Description |
| --- | --- | --- |
| event | `MouseEvent` <br/> `undefined` | The mouse event. |
| coords | `GridCoords` | The visual cell coordinates. |
| cellEl | `HTMLTableCellElement` <br/> `undefined` | The hovered cell element. |
| eventController | `SelectionController` | Handsontable's selection suppressor. |



### onDocMouseMove

::: ask-about-api onDocMouseMove|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L456

:::

_cellPickController.onDocMouseMove(event)_

Document `mousemove` listener driving drag auto-scroll and stuck-drag recovery.


| Param | Type | Description |
| --- | --- | --- |
| event | `MouseEvent` | The mouse event. |



### onDocMouseUp

::: ask-about-api onDocMouseUp|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L465

:::

_cellPickController.onDocMouseUp()_

Document `mouseup` listener finishing the active drag.



### onDocScroll

::: ask-about-api onDocScroll|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L459

:::

_cellPickController.onDocScroll()_

Document capture-phase `scroll` listener re-extending an active reference drag.



### onDocTouchEnd

::: ask-about-api onDocTouchEnd|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L472

:::

_cellPickController.onDocTouchEnd(event)_

Document `touchend`/`touchcancel` listener finishing a touch pick. On a touch device the press
reaches the grid from `touchend` (Walkontable defers it there), and Walkontable then cancels the
compatibility mouse events, so no `mouseup` ever finishes the pick.


| Param | Type | Description |
| --- | --- | --- |
| event | `TouchEvent` | The touch event. |



### onWindowBlur

::: ask-about-api onWindowBlur|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L462

:::

_cellPickController.onWindowBlur()_

Window `blur` listener finishing a drag interrupted by focus loss.



### reset

::: ask-about-api reset|CellPickController

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/cellPickController.ts#L310

:::

_cellPickController.reset()_

Cancels any active drag and disarms the click swallow. A drag cancelled while the button is still
held (Escape closed the edit mid-drag) stays claimed until the button is released: the grid saw
the press as its own, so every later `mouseover` would extend a native range selection from the
edited cell.


