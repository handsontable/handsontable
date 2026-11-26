---
title: ClipboardData
metaTitle: ClipboardData API reference | Handsontable DataGrid for JavaScript
permalink: /api/clipboard-data
canonicalUrl: /api/clipboard-data
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the clipboard data store as an empty object.


## Members

### types

::: ask-about-api types|ClipboardData

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/clipboardData.ts#L16

:::

_clipboardData.types_

The MIME types that hold a value, like `DataTransfer#types`.


## Methods

### getData

::: ask-about-api getData|ClipboardData

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/clipboardData.ts#L26

:::

_clipboardData.getData()_

Returns the clipboard data stored under the given MIME type key, or `undefined` if absent.



### setData

::: ask-about-api setData|ClipboardData

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/copyPaste/clipboardData.ts#L21

:::

_clipboardData.setData()_

Stores a value in the clipboard data under the given MIME type key.


