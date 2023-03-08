---
id: qiasr3y1
title: Column headers
metaTitle: Column headers - JavaScript Data Grid | Handsontable
description:
  Use the default column headers (A, B, C), or set them to custom values provided by an array or a
  function.
permalink: /column-headers
canonicalUrl: /column-headers
tags:
  - header
  - headers
  - column title
  - column label
  - column name
react:
  id: 5e0tnexi
  metaTitle: Column headers - React Data Grid | Handsontable
searchCategory: Guides
---

# Column headers

Use the default column headers (A, B, C), or set them to custom values provided by an array or a
function.

[[toc]]

## Overview

Describe what column headers do UI-wise:

- Look differently
- Display column names
- Click on the column name to sort
- Hover between column headers to resize
- Drag column headers to move columns
- You can display column menu

To copy column headers, see: [Copy].

## Column headers demo

## Enable column headers

## Configure column headers

## Add custom column names

https://handsontable.com/docs/react-data-grid/column-header/#header-labels-as-an-array

http://localhost:8083/docs/javascript-data-grid/api/options/#title

## Generate custom column names

https://handsontable.com/docs/react-data-grid/column-header/#header-labels-as-a-function

## Render HTML in column headers

https://examples.handsontable.com/demo/renderers_html.html#header

https://jsfiddle.net/handsoncode/0gfjkesd

## Add vertical column headers

https://jsfiddle.net/handsoncode/ejokx71y

## Add column header tooltips

https://jsfiddle.net/handsoncode/cqmbLnz4

## Automatically set column headers' height

https://www.ag-grid.com/javascript-data-grid/column-headers/#auto-header-height

## Style column headers

https://mui.com/x/react-data-grid/style/#styling-column-headers

http://localhost:8083/docs/javascript-data-grid/api/options/#activeheaderclassname

http://localhost:8083/docs/javascript-data-grid/api/options/#columnheaderheight

http://localhost:8083/docs/javascript-data-grid/api/options/#currentheaderclassname

## Use nested column headers

You can use multiple levels of nested column headers, to better reflect the structure of your data.

To learn more, see: [Column groups](@/guides/columns/column-groups.md).

## Control column headers programmatically

### Enable or disable column headers programmatically

https://examples.handsontable.com/demo/buttons.html

To enable or disable column headers programmatically, use the
[`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

```js
// enable column headers
handsontableInstance.updateSettings({
  colHeadesr: true,
});

// disable column headers
handsontableInstance.updateSettings({
  colHeaders: false,
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

// enable column headers
hotTableComponentRef.current.hotInstance.updateSettings({
  colHeaders: true,
});

// disable column headers
hotTableComponentRef.current.hotInstance.updateSettings({
  colHeaders: false,
});
```

### Get column header values

### Use column header hooks

:::

## Import the column headers module

You can reduce the size of your JavaScript bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules.md) that you need.

To use column headers, you only need the
[base module](@/guides/tools-and-building/modules.md#import-the-base-module).

```js
// import the base module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';
```

## API reference

| Options                                                                                                                                                                                                                                                                                                                                          | Handsontable hooks                                                                                                                                                                                                                                                                                                                                              | API methods                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)<br>[`colHeaders`](@/api/options.md#colheaders)<br>[`columnHeaderHeight`](@/api/options.md#columnheaderheight)<br>[`currentHeaderClassName`](@/api/options.md#currentheaderclassname)<br>[`nestedHeaders`](@/api/options.md#nestedheaders)<br>[`title`](@/api/options.md#title) | [`afterGetColHeader`](@/api/hooks.md#aftergetcolheader)<br>[`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)<br>[`beforeHighlightingColumnHeader`](@/api/hooks.md#beforehighlightingcolumnheader)<br>[`modifyColHeader`](@/api/hooks.md#modifycolheader)<br>[`modifyColumnHeaderHeight`](@/api/hooks.md#modifycolumnheaderheight) | [`hasColHeaders()`](@/api/core.md#hascolheaders)<br>[`getColHeader()`](@/api/core.md#getcolheader) |

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/labels/Headers) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's
  forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to
  get help
