---
id: jgrtvjxx
title: Row freezing
metaTitle: Row freezing - JavaScript Data Grid | Handsontable
description: Lock (freeze) the position of specified rows, keeping them visible while scrolling to another area of the grid. This feature is sometimes called "pinned rows".
permalink: /row-freezing
canonicalUrl: /row-freezing
tags:
  - fixing rows
  - pinning rows
  - fixedRows
react:
  id: y5wx1mrk
  metaTitle: Row freezing - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row freezing

Lock the position of specified rows, keeping them visible when scrolling.

[[toc]]

## Overview

Row freezing locks specific rows of a grid in place, keeping them visible while scrolling to another area of the grid.

This feature is sometimes called "pinned rows".

## Example

The following example specifies two fixed rows with `fixedRowsTop: 2`. Horizontal scroll bars are needed, so set a container `width` and `overflow: hidden` in CSS.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-freezing/javascript/example1.js)
@[code](@/content/guides/rows/row-freezing/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-freezing/react/example1.jsx)
@[code](@/content/guides/rows/row-freezing/react/example1.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom)
  - [`fixedRowsTop`](@/api/options.md#fixedrowstop)
