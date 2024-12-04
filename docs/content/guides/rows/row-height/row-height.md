---
id: fehmrn1j
title: Row heights
metaTitle: Row heights - JavaScript Data Grid | Handsontable
description: Configure row heights, using a number, an array or a function. Let your users manually change row heights using Handsontable's interface.
permalink: /row-height
canonicalUrl: /row-height
tags:
  - resizing rows
  - wrap content
  - overflow
  - crop content
  - row size
  - height
  - max-height
  - min-height
  - row dimensions
  - manual resize
react:
  id: 87ulwfs2
  metaTitle: Row heights - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row heights

Configure row heights, using a number, an array or a function. Let your users manually change row heights using Handsontable's interface.

[[toc]]

## Overview

The default (and minimum) row height is calculated based on the used theme's padding and border values (in the classic theme it's 23 px - 22 px + 1 px of the row's bottom border). Unless configured otherwise, Handsontable assumes that your cell contents fit in this default row height.

If your cell contents require heights greater than default (because you use multiline text, or [custom renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md), or custom styles), use one of the following configurations to avoid potential layout problems:
  - Configure your row heights in advance: set the [`rowHeights`](@/api/options.md#rowheights) option to a [number](#set-row-heights-to-a-number), or an [array](#set-row-heights-with-an-array), or a [function](#set-row-heights-with-a-function). This requires you to know the heights beforehand, but results in the best runtime performance.
  - Set the [`manualRowResize`](@/api/options.md#manualrowresize) option to an array, to configure initial row heights and let your users [adjust the row heights manually](#adjust-row-heights-manually).
  - Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin, by setting `autoRowSize: true`. This tells Handsontable to measure the actual row heights in the DOM. It impacts runtime performance but is accurate.

## Set row heights to a number

We set the same height of `40px` for all rows across the entire grid in this example.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example1.js)
@[code](@/content/guides/rows/row-height/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example1.jsx)
@[code](@/content/guides/rows/row-height/react/example1.tsx)

:::

:::

## Set row heights with an array

In this example, the height is only set for the first rows. Each additional row would be automatically adjusted to the content.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example2.js)
@[code](@/content/guides/rows/row-height/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example2.jsx)
@[code](@/content/guides/rows/row-height/react/example2.tsx)

:::

:::

## Set row heights with a function

The row height can be set using a function. In this example, the size of all rows is set using a function that takes a row `index` (1, 2 ...) and multiplies it by `20px` for each consecutive row.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example3.js)
@[code](@/content/guides/rows/row-height/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example3.jsx)
@[code](@/content/guides/rows/row-height/react/example3.tsx)

:::

:::

## Adjust row heights manually

Set the option [`manualRowResize`](@/api/options.md#manualrowresize) to `true` to allow users to manually resize the row height by dragging the handle between the adjacent row headers. Don't forget to enable row headers by setting [`rowHeaders`](@/api/options.md#rowheaders) to `true`.

You can adjust the size of one or multiple rows simultaneously, even if the selected rows are not placed next to each other.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/rows/row-height/javascript/example4.js)
@[code](@/content/guides/rows/row-height/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-height/react/example4.jsx)
@[code](@/content/guides/rows/row-height/react/example4.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`autoRowSize`](@/api/options.md#autorowsize)
  - [`manualRowResize`](@/api/options.md#manualrowresize)
  - [`rowHeights`](@/api/options.md#rowheights)
- Core methods:
  - [`getRowHeight()`](@/api/core.md#getrowheight)
- Hooks:
  - [`afterRowResize`](@/api/hooks.md#afterrowresize)
  - [`beforeRowResize`](@/api/hooks.md#beforerowresize)
  - [`modifyRowHeight`](@/api/hooks.md#modifyrowheight)
- Plugins:
  - [`AutoRowSize`](@/api/autoRowSize.md)
  - [`ManualRowResize`](@/api/manualRowResize.md)
