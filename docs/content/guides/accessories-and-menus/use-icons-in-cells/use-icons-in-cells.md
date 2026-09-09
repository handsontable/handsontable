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
menuTag: updated
---

Render an icon from the [icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md) inside a cell, and wire up an icon-only control so it stays accessible to screen reader users.

[[toc]]

## Prerequisites

- A grid with a [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md).
- The [`@handsontable/spreadsheet-icons`](https://github.com/handsontable/spreadsheet-icons) package, or any inline SVG icon of your own.
- For the [third-party icon set](#use-a-third-party-icon-set) section, a [Lucide](https://lucide.dev) package.

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

## Use a third-party icon set

An icon library reaches the cell in one of two ways, and which one you get depends on the framework:

- **A DOM scan.** You write a placeholder element, and the library replaces it with an `<svg>`. [Lucide](https://lucide.dev)'s vanilla package uses `<i data-lucide="flag"></i>` plus a `createIcons()` call.
- **A component.** The icon is a component you render directly, such as `<Flag />`. This needs a renderer that returns framework markup rather than DOM nodes.

::: only-for javascript

Install the vanilla package, then call `createIcons()` after you insert the placeholder:

```bash
npm install lucide
```

Pass `root` so the scan covers only the cell. Without it, Lucide walks the whole document once per rendered cell.

::: example #example2 --html 1 --js 2 --ts 3
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/javascript/example2.html)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/javascript/example2.ts)
:::

:::

::: only-for react

Install the React package, then pass a renderer component to the column:

```bash
npm install lucide-react
```

The component receives the cell's value and coordinates, so the icon goes in as JSX and no `createIcons()` scan runs at all.

::: example #example2 :react --js 1 --ts 2
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/react/example2.tsx)
:::

:::

::: only-for angular

Install the Angular package, then pass a renderer component to the column:

```bash
npm install @lucide/angular
```

The component extends [`HotCellRendererComponent`](@/guides/cell-functions/cell-renderer/cell-renderer.md) and receives the cell's value and coordinates as inputs, so the icon goes in the template and no `createIcons()` scan runs at all. Each Lucide icon is its own standalone component applied as an attribute on an `<svg>` element, so import the icons you use and list them in the component's `imports`.

::: example #example2 :angular --ts 1 --html 2
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/angular/example2.html)
:::

:::

::: only-for vue

Install the vanilla package, then call `createIcons()` after you insert the placeholder:

```bash
npm install lucide
```

The Vue wrapper renders cells through a renderer function rather than a component, so a Vue icon component such as `<Flag />` cannot render inside a cell. Use the DOM scan instead, and pass `root` so it covers only the cell -- without it, Lucide walks the whole document once per rendered cell.

::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/use-icons-in-cells/vue/example2.vue)

:::

:::

The accessibility rule does not change with the icon source: the `aria-label` stays on the button, never on the icon.

## Result

You have a cell that renders an icon based on its data, with a click handler that updates the grid, and an accessible name that a screen reader announces correctly in both icon states.

## Related

<div class="boxes-list">

- [Icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Themes](@/guides/styling/themes/themes.md)

</div>
