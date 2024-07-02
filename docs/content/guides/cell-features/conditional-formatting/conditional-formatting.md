---
id: 4ca0c70r
title: Conditional formatting
metaTitle: Conditional formatting - JavaScript Data Grid | Handsontable
description: Format specified cells, based on dynamic conditions.
permalink: /conditional-formatting
canonicalUrl: /conditional-formatting
react:
  id: eyatgywe
  metaTitle: Conditional formatting - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Conditional formatting

Format specified cells, based on dynamic conditions.

[[toc]]

## Overview

Conditional formatting can be used to set the font, color, typeface, etc., for cell content and can also be used to format the style of a cell, all based on a predefined set of criteria.

## Example of conditional formatting

This demo shows how to use the cell type renderer feature to make some conditional formatting:

1. The first row is read-only and formatted as bold green text.
2. All cells in the Nissan column are formatted as italic text.
3. Empty cells are formatted with a silver background.
4. Negative numbers are formatted as red text.

::: only-for javascript

::: example #example1 --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/conditional-formatting/javascript/example1.css)
@[code](@/content/guides/cell-features/conditional-formatting/javascript/example1.js)
@[code](@/content/guides/cell-features/conditional-formatting/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/conditional-formatting/react/example1.css)
@[code](@/content/guides/cell-features/conditional-formatting/react/example1.jsx)
@[code](@/content/guides/cell-features/conditional-formatting/react/example1.tsx)

:::

:::

## Related articles

### Related guides

- [Formatting cells](@/guides/cell-features/formatting-cells/formatting-cells.md)

### Related API reference

- Configuration options:
  - [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
  - [`className`](@/api/options.md#classname)
  - [`commentedCellClassName`](@/api/options.md#commentedcellclassname)
  - [`currentColClassName`](@/api/options.md#currentcolclassname)
  - [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
  - [`currentRowClassName`](@/api/options.md#currentrowclassname)
  - [`customBorders`](@/api/options.md#customborders)
  - [`invalidCellClassName`](@/api/options.md#invalidcellclassname)
  - [`noWordWrapClassName`](@/api/options.md#nowordwrapclassname)
  - [`placeholder`](@/api/options.md#placeholder)
  - [`placeholderCellClassName`](@/api/options.md#placeholdercellclassname)
  - [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)
  - [`tableClassName`](@/api/options.md#tableclassname)
- Plugins:
  - [`CustomBorders`](@/api/customBorders.md)
