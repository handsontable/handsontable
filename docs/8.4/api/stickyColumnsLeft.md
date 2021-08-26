---
title: StickyColumnsLeft
metaTitle: StickyColumnsLeft - API Reference - Handsontable Documentation
permalink: /8.4/api/sticky-columns-left
canonicalUrl: /api/sticky-columns-left
hotPlugin: false
editLink: false
---

# StickyColumnsLeft

[[toc]]
## Methods

### getFirstRenderedColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyColumnsLeft.js#L19

:::

_stickyColumnsLeft.getFirstRenderedColumn() ⇒ number_

Get the source index of the first rendered column. If no columns are rendered, returns an error code: -1.



### getFirstVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyColumnsLeft.js#L35

:::

_stickyColumnsLeft.getFirstVisibleColumn() ⇒ number_

Get the source index of the first column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
Assumes that all rendered columns are fully visible.



### getLastRenderedColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyColumnsLeft.js#L44

:::

_stickyColumnsLeft.getLastRenderedColumn() ⇒ number_

Get the source index of the last rendered column. If no columns are rendered, returns an error code: -1.



### getLastVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyColumnsLeft.js#L54

:::

_stickyColumnsLeft.getLastVisibleColumn() ⇒ number_

Get the source index of the last column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
Assumes that all rendered columns are fully visible.



### getRenderedColumnsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyColumnsLeft.js#L63

:::

_stickyColumnsLeft.getRenderedColumnsCount() ⇒ number_

Get the number of rendered columns.



### getVisibleColumnsCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/3rdparty/walkontable/src/table/mixin/stickyColumnsLeft.js#L75

:::

_stickyColumnsLeft.getVisibleColumnsCount() ⇒ number_

Get the number of fully visible columns in the viewport.
Assumes that all rendered columns are fully visible.


