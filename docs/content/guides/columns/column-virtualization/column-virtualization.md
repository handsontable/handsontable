---
id: xv8sf6at
title: Column virtualization
metaTitle: Column virtualization - JavaScript Data Grid | Handsontable
description: Render hundreds of columns without freezing the browser, using column virtualization.
permalink: /column-virtualization
canonicalUrl: /column-virtualization
tags:
  - dom
  - render all columns
  - offset
react:
  id: 24n21dwi
  metaTitle: Column virtualization - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column virtualization

Render hundreds of columns without freezing the browser, using column virtualization.

[[toc]]

## Overview

To process a large number of columns in a browser Handsontable utilizes the virtualization process to display only the visible part of the grid with a small
offset for a better scrolling experience.

This feature is enabled by default and can be turned off by setting the [`renderAllColumns`](@/api/options.md#renderallcolumns) option to `true`.

## Configure the column virtualization

You can experiment with the [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) config option, which determines the number of
columns being displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, the virtualization
will be practically turned off.

To make the grid scrollable, set the constant width and height to same as the container holding Handsontable and height and set the `overflow` property to
`hidden` in the container's stylesheet. If the table contains enough rows or columns, it will be scrollable.

The scrolling performance depends mainly on four factors:

- Number of cells - number of rows multiplied by the number of columns
- Amount and complexity of custom renderers in cells
- Number of options enabled in the configuration
- Performance of your setup - physical machine and browser

The demo below presents a data grid displaying one million cells (1000 rows x 1000 columns).

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-virtualization/javascript/example1.js)
@[code](@/content/guides/columns/column-virtualization/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-virtualization/react/example1.jsx)
@[code](@/content/guides/columns/column-virtualization/react/example1.tsx)

:::

:::

## Known limitations

Using column virtualization has the following side effects:

- The browser's native search will work only for the visible part of the grid.
- Screen readers may announce the wrong total number of columns. Read more in the
  [Accessibility](@/guides/accessibility/accessibility/accessibility.md#disabling-dom-virtualization-for-improved-accessibility) guide.

## Related articles

### Related guides

- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)
- [Performance](@/guides/optimization/performance/performance.md)

### Related API reference

- Configuration options:
  - [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
  - [`renderAllColumns`](@/api/options.md#renderallcolumns)
