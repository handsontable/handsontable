---
title: StickyRowsTop
metaTitle: StickyRowsTop - API Reference - Handsontable Documentation
permalink: /8.3/api/sticky-rows-top
canonicalUrl: /api/sticky-rows-top
hotPlugin: false
editLink: false
---

# StickyRowsTop

[[toc]]
## Methods

### getFirstRenderedRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyRowsTop.js#L19

:::

_stickyRowsTop.getFirstRenderedRow() ⇒ number_

Get the source index of the first rendered row. If no rows are rendered, returns an error code: -1.



### getFirstVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyRowsTop.js#L35

:::

_stickyRowsTop.getFirstVisibleRow() ⇒ number_

Get the source index of the first row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
Assumes that all rendered rows are fully visible.



### getLastRenderedRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyRowsTop.js#L44

:::

_stickyRowsTop.getLastRenderedRow() ⇒ number_

Get the source index of the last rendered row. If no rows are rendered, returns an error code: -1.



### getLastVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyRowsTop.js#L54

:::

_stickyRowsTop.getLastVisibleRow() ⇒ number_

Get the source index of the last row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
Assumes that all rendered rows are fully visible.



### getRenderedRowsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyRowsTop.js#L63

:::

_stickyRowsTop.getRenderedRowsCount() ⇒ number_

Get the number of rendered rows.



### getVisibleRowsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyRowsTop.js#L75

:::

_stickyRowsTop.getVisibleRowsCount() ⇒ number_

Get the number of fully visible rows in the viewport.
Assumes that all rendered rows are fully visible.


