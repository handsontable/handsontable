---
type: how-to
title: How to use icons in cells
metaTitle: How to use icons in cells - JavaScript Data Grid | Handsontable
description: Render an icon from the Handsontable icon pack inside a custom cell renderer, and make an icon-only control accessible.
permalink: /use-icons-in-cells
canonicalUrl: /use-icons-in-cells
tags:
  - spreadsheet-icons
  - custom-renderer
  - accessibility
react:
  metaTitle: How to use icons in cells - React Data Grid | Handsontable
angular:
  metaTitle: How to use icons in cells - Angular Data Grid | Handsontable
vue:
  metaTitle: How to use icons in cells - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: new
---

Render an icon from the [icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md) inside a cell, and wire up an icon-only control so it stays accessible to screen reader users.

[[toc]]

## Prerequisites

- A grid with a [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md).
- The [`@handsontable/spreadsheet-icons`](https://github.com/handsontable/spreadsheet-icons) package, or any inline SVG icon of your own.

## Steps

1. Install the icon pack.

   ```bash
   npm install @handsontable/spreadsheet-icons
   ```

   You can also copy a single icon's SVG markup directly from the [icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md) page -- click any icon in the catalog to copy its name, then look up its markup in the downloaded package.

2. Render the icon inside a custom renderer.

   Build the icon markup once, then swap it into the cell based on the cell's value. This example renders a "flag" icon that toggles between a filled and an empty state.

3. Add an accessible name to the control, not the icon.

   The icon itself -- an inline `<svg>` -- has no accessible name. If you wrap it in a clickable element (a `<button>`, or a `<div>` with `role="button"`), set `aria-label` on that element instead, and update it whenever the icon's state changes.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/javascript/example1.html)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/javascript/example1.ts)
:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/angular/example1.html)
:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/vue/example1.vue)

:::

:::

Click a flag icon to toggle it. Each click updates both the underlying cell value (through `setDataAtCell()`) and the button's `aria-label`, so the accessible name always matches what the icon shows.

## Result

You have a cell that renders an icon based on its data, with a click handler that updates the grid, and an accessible name that a screen reader announces correctly in both icon states.

## Related

<div class="boxes-list">

- [Icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Themes](@/guides/styling/themes/themes.md)

</div>
