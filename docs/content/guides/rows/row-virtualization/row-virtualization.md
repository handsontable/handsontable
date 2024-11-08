---
id: vasj6t6t
title: Row virtualization
metaTitle: Row virtualization - JavaScript Data Grid | Handsontable
description: Render thousands of rows without freezing the browser, using row virtualization.
permalink: /row-virtualization
canonicalUrl: /row-virtualization
tags:
  - dom
  - render all rows
  - offset
react:
  id: kjsl63sh
  metaTitle: Row virtualization - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row virtualization

Render thousands of rows without freezing the browser, using row virtualization.

[[toc]]

## Overview

Virtualization allows Handsontable to process hundreds of thousands of records without causing the browser to hang. This feature draws only the visible part of the grid, displaying the minimum items physically rendered in the DOM. The elements outside the viewport are rendered when you scroll across the grid. Depending on your configuration, there might be a small offset of columns or rows rendered outside the viewport to make the scrolling performance smoother.

This feature is enabled by default and can be turned off by setting the [`renderAllRows`](@/api/options.md#renderallrows) option to `true`.

## Configuring row virtualization

You can experiment with the [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) configuration option, which determines the number of rows displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, then the virtualization will be practically turned off.

To make the grid scrollable, set the constant width and height to the same as the container holding Handsontable and set the `overflow` property to `hidden` in the container's stylesheet. If the table contains enough rows or columns, it will be scrollable.

The scrolling performance depends mainly on four factors:

- Number of cells - number of rows multiplied by the number of columns
- Amount and complexity of custom renderers in cells
- Number of options enabled in the configuration
- Performance of your setup - physical machine and a browser

The example below presents a data grid displaying 1 million cells (1000 rows x 1000 columns):

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-virtualization/javascript/example1.js)
@[code](@/content/guides/rows/row-virtualization/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-virtualization/react/example1.jsx)
@[code](@/content/guides/rows/row-virtualization/react/example1.tsx)

:::

:::

## Known limitations

Using row virtualization has the following side effects:

- The browser's native search will work only for the visible part of the grid.
- Screen readers may announce the wrong total number of rows. Read more in the
  [Accessibility](@/guides/accessibility/accessibility/accessibility.md#disabling-dom-virtualization-for-improved-accessibility) guide.

## Related articles

### Related guides

- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
- [Performance](@/guides/optimization/performance/performance.md)

### Related API reference

- Configuration options:
  - [`renderAllRows`](@/api/options.md#renderallrows)
  - [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)
