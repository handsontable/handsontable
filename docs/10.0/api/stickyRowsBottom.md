---
title: StickyRowsBottom
metaTitle: StickyRowsBottom - API Reference - Handsontable Documentation
permalink: /10.0/api/sticky-rows-bottom
canonicalUrl: /api/sticky-rows-bottom
hotPlugin: false
editLink: false
---

# StickyRowsBottom

[[toc]]
## Methods

### getFirstRenderedRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table/mixin/stickyRowsBottom.js#L19

:::

_stickyRowsBottom.getFirstRenderedRow() ⇒ number_

Get the source index of the first rendered row. If no rows are rendered, returns an error code: -1.



### getFirstVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table/mixin/stickyRowsBottom.js#L41

:::

_stickyRowsBottom.getFirstVisibleRow() ⇒ number_

Get the source index of the first row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
Assumes that all rendered rows are fully visible.



### getLastRenderedRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table/mixin/stickyRowsBottom.js#L50

:::

_stickyRowsBottom.getLastRenderedRow() ⇒ number_

Get the source index of the last rendered row. If no rows are rendered, returns an error code: -1.



### getLastVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table/mixin/stickyRowsBottom.js#L60

:::

_stickyRowsBottom.getLastVisibleRow() ⇒ number_

Get the source index of the last row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
Assumes that all rendered rows are fully visible.



### getRenderedRowsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table/mixin/stickyRowsBottom.js#L69

:::

_stickyRowsBottom.getRenderedRowsCount() ⇒ number_

Get the number of rendered rows.



### getVisibleRowsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/table/mixin/stickyRowsBottom.js#L81

:::

_stickyRowsBottom.getVisibleRowsCount() ⇒ number_

Get the number of fully visible rows in the viewport.
Assumes that all rendered rows are fully visible.


