---
id: 2anhuqf7
title: Column freezing
metaTitle: Column freezing - JavaScript Data Grid | Handsontable
description: Lock (freeze) the position of specified columns, keeping them visible while scrolling to another area of the grid.
permalink: /column-freezing
canonicalUrl: /column-freezing
tags:
  - fixing columns
  - snapping columns
  - pinning columns
  - fixedColumns
react:
  id: otumcpty
  metaTitle: Column freezing - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column freezing

Lock the position of specified columns, keeping them visible when scrolling.

[[toc]]

## Overview

Column freezing locks specific columns of a grid in place, keeping them visible while scrolling to
another area of the grid. We refer to frozen columns as _fixed_.

You can freeze columns during initialization and by the user.

## Freeze columns at initialization

To freeze columns at initialization, use the [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) option. Then, configure the container of your grid with the following CSS attributes: `width` and
`overflow: hidden`.

If your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is `ltr`, columns get frozen from the left side of the table. If your layout direction is `rtl`, columns get frozen from the right side of the table.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/javascript/example1.js)
@[code](@/content/guides/columns/column-freezing/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/react/example1.jsx)
@[code](@/content/guides/columns/column-freezing/react/example1.tsx)

:::

:::

## User-triggered freeze

To enable manual column freezing, set [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) to `true`. This lets you freeze and unfreeze columns by using the grid's [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

Mind that when you unfreeze a frozen column, it doesn't go back to the original position.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/javascript/example2.js)
@[code](@/content/guides/columns/column-freezing/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/react/example2.jsx)
@[code](@/content/guides/columns/column-freezing/react/example2.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart)
  - [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze)
- Plugins:
  - [`ManualColumnFreeze`](@/api/manualColumnFreeze.md)
