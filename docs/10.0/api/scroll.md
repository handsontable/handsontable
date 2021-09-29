---
title: Scroll
metaTitle: Scroll - API Reference - Handsontable Documentation
permalink: /10.0/api/scroll
canonicalUrl: /api/scroll
hotPlugin: false
editLink: false
---

# Scroll

[[toc]]

## Description


## Methods

### getFirstVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L198

:::

_scroll.getFirstVisibleColumn() ⇒ number_

Get first visible column based on virtual dom and how table is visible in browser window viewport.



### getFirstVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L115

:::

_scroll.getFirstVisibleRow() ⇒ number_

Get first visible row based on virtual dom and how table is visible in browser window viewport.



### getLastVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L239

:::

_scroll.getLastVisibleColumn() ⇒ number_

Get last visible column based on virtual dom and how table is visible in browser window viewport.



### getLastVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L159

:::

_scroll.getLastVisibleRow() ⇒ number_

Get last visible row based on virtual dom and how table is visible in browser window viewport.



### scrollViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L30

:::

_scroll.scrollViewport(coords, [snapToTop], [snapToRight], [snapToBottom], [snapToLeft]) ⇒ boolean_

Scrolls viewport to a cell.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L48

:::

_scroll.scrollViewportHorizontally(column, [snapToRight], [snapToLeft]) ⇒ boolean_

Scrolls viewport to a column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L82

:::

_scroll.scrollViewportVertically(row, [snapToTop], [snapToBottom]) ⇒ boolean_

Scrolls viewport to a row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |



## Description


## Methods

### getFirstVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L198

:::

_scroll.getFirstVisibleColumn() ⇒ number_

Get first visible column based on virtual dom and how table is visible in browser window viewport.



### getFirstVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L115

:::

_scroll.getFirstVisibleRow() ⇒ number_

Get first visible row based on virtual dom and how table is visible in browser window viewport.



### getLastVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L239

:::

_scroll.getLastVisibleColumn() ⇒ number_

Get last visible column based on virtual dom and how table is visible in browser window viewport.



### getLastVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L159

:::

_scroll.getLastVisibleRow() ⇒ number_

Get last visible row based on virtual dom and how table is visible in browser window viewport.



### scrollViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L30

:::

_scroll.scrollViewport(coords, [snapToTop], [snapToRight], [snapToBottom], [snapToLeft]) ⇒ boolean_

Scrolls viewport to a cell.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L48

:::

_scroll.scrollViewportHorizontally(column, [snapToRight], [snapToLeft]) ⇒ boolean_

Scrolls viewport to a column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/scroll.js#L82

:::

_scroll.scrollViewportVertically(row, [snapToTop], [snapToBottom]) ⇒ boolean_

Scrolls viewport to a row.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |


