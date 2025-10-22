---
id: epmvqw9m
title: Formatting cells
metaTitle: Formatting cells - JavaScript Data Grid | Handsontable
description: Change the appearance of cells, using custom CSS classes, inline styles, or custom cell borders.
permalink: /formatting-cells
canonicalUrl: /formatting-cells
react:
  id: qywqgovy
  metaTitle: Formatting cells - React Data Grid | Handsontable
angular:
  id: 0eswjne7
  metaTitle: Formatting cells - Angular Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Formatting cells

Change the appearance of cells, using custom CSS classes, inline styles, or custom cell borders.

[[toc]]

## Overview

Handsontable uses the HTML `table` structure so customization is based either on referencing to the already existing elements, such as `TR`/`TD`, or by applying
your own CSS classes to HTML elements.

You can format a cell either using a `CSS` class or with a style applied directly to the DOM element.

## Apply custom CSS class styles

In this example, we add a custom class `custom-cell` to the cell in the top left corner and add a `custom-table` CSS class that highlights the table headers.

::: only-for javascript

::: example #example1 --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/formatting-cells/javascript/example1.css)
@[code](@/content/guides/cell-features/formatting-cells/javascript/example1.js)
@[code](@/content/guides/cell-features/formatting-cells/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/formatting-cells/react/example1.css)
@[code](@/content/guides/cell-features/formatting-cells/react/example1.jsx)
@[code](@/content/guides/cell-features/formatting-cells/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/formatting-cells/angular/example1.ts)
@[code](@/content/guides/cell-features/formatting-cells/angular/example1.html)

:::

:::

## Apply inline styles

You can apply inline styles directly to the DOM element using its `style` property. You can use the [`renderer`](@/api/options.md#renderer) option to do that.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/formatting-cells/javascript/example2.js)
@[code](@/content/guides/cell-features/formatting-cells/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/formatting-cells/react/example2.jsx)
@[code](@/content/guides/cell-features/formatting-cells/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/formatting-cells/angular/example2.ts)
@[code](@/content/guides/cell-features/formatting-cells/angular/example2.html)

:::

:::

## Custom cell borders

To enable the custom borders feature, set the [`customBorders`](@/api/options.md#customborders) option. This can either be set as `true` or initialized as an
array with a pre-defined setup. For the list of available settings and methods, visit the [API reference](@/api/customBorders.md).

In the names of the API properties, the words `start` and `end` refer to the starting and ending edges of the
[layout direction](@/guides/internationalization/layout-direction/layout-direction.md).

You can customize the border style using the `style` property in the border configuration. The available options are:

- `'solid'` (default) - A solid line border
- `'dashed'` - A dashed line border
- `'dotted'` - A dotted line border

The `style` property can be set for any border edge (`top`, `bottom`, `start`, `end`). When not specified, it defaults to `'solid'`.

The example below demonstrates different border styles applied to various cell ranges:


::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-features/formatting-cells/javascript/example3.js)
@[code](@/content/guides/cell-features/formatting-cells/javascript/example3.ts)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->


::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/formatting-cells/react/example3.jsx)
@[code](@/content/guides/cell-features/formatting-cells/react/example3.tsx)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->


::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/formatting-cells/angular/example3.ts)
@[code](@/content/guides/cell-features/formatting-cells/angular/example3.html)

:::

:::

## Related articles

### Related guides

- [Conditional formatting](@/guides/cell-features/conditional-formatting/conditional-formatting.md)

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
