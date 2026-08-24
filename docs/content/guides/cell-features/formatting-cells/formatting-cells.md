---
type: how-to
title: Formatting cells
metaTitle: Formatting cells - JavaScript Data Grid | Handsontable
description: Change the appearance of cells, using custom CSS classes, inline styles, or custom cell borders.
permalink: /formatting-cells
canonicalUrl: /formatting-cells
react:
  metaTitle: Formatting cells - React Data Grid | Handsontable
angular:
  metaTitle: Formatting cells - Angular Data Grid | Handsontable
vue:
  metaTitle: Formatting cells - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: updated
---
Change the appearance of cells, using custom CSS classes, inline styles, or custom cell borders.

[[toc]]

## Overview

Handsontable renders an HTML `table`, so you can style existing `tr` and `td` elements or attach your own classes.

Choose an approach based on your goal:

- Use [`className`](@/api/options.md#classname) when you want reusable static styles.
- Use [`renderer`](@/api/options.md#renderer) when you need to apply inline styles to specific cells at render time.
- Use [`customBorders`](@/api/options.md#customborders) when you need custom border widths, colors, or styles for selected ranges.

## Prerequisites

- A Handsontable instance with data loaded.
- A stylesheet, if you format cells through custom CSS classes.

## Apply custom CSS class styles

In this example, you add a custom class `custom-cell` to the cell in the top-left corner and a `custom-table` CSS class that highlights the table headers.

To add a CSS class to a cell, column, or row, use the [`className`](@/api/options.md#classname) option. Set it in the grid configuration, in a `columns` entry, or per cell through the [`cells`](@/api/options.md#cells) callback. The class you provide is added to the cell's `<td>` element, where your CSS rules can target it.

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

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/formatting-cells/vue/example1.vue)

:::

:::

### Give your rule enough specificity

A theme styles cells through rules such as `.ht-theme-main .htCore td`, which is more specific than a single class selector. A rule like `.custom-cell { font-size: 24px; }` therefore loses to the theme, and the cell keeps the theme's font size.

To win, include the theme class and the element in your selector:

```css
.ht-theme-main .htCore td.custom-cell {
  font-size: 24px;
}
```

Adding `!important` to your original rule works too, but the selector above keeps the cascade readable.

[`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) measure each cell with its class applied, so a class that changes a cell's font size, padding, or borders is reflected in the calculated row heights and column widths.

## Apply inline styles

Apply inline styles directly to a cell's DOM element through the `style` property. Use the [`renderer`](@/api/options.md#renderer) option to run this logic on each render.

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

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/formatting-cells/vue/example2.vue)

:::

:::

## Custom cell borders

To enable custom borders, set [`customBorders`](@/api/options.md#customborders). You can set it to `true` or pass an array with predefined border configuration. For all settings and methods, see the [API reference](@/api/customBorders.md).

In API property names, `start` and `end` refer to the starting and ending edges of the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md).

You can customize the border style using the `style` property in the border configuration. The available options are:

- `'solid'` (default) - A solid line border
- `'dashed'` - A dashed line border
- `'dotted'` - A dotted line border

The `style` property can be set for any border edge (`top`, `bottom`, `start`, `end`). When not specified, it defaults to `'solid'`.

The following example shows different border styles on selected cell ranges.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-features/formatting-cells/javascript/example3.js)
@[code](@/content/guides/cell-features/formatting-cells/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/formatting-cells/react/example3.jsx)
@[code](@/content/guides/cell-features/formatting-cells/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/formatting-cells/angular/example3.ts)
@[code](@/content/guides/cell-features/formatting-cells/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-features/formatting-cells/vue/example3.vue)

:::

:::

### Apply borders progressively for large configurations

Building a very large [`customBorders`](@/api/options.md#customborders) configuration before the first render can delay the initial paint. To render the grid first and apply the borders in background batches, set [`customBordersProgressive`](@/api/options.md#custombordersprogressive) to `true`:

```js
const hot = new Handsontable(container, {
  data,
  customBorders: largeBorderConfig,
  customBordersProgressive: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

Pass an object to control how many border entries are applied per batch:

```js
customBordersProgressive: { chunkSize: 5000 },
```

With progressive application enabled, the borders fill in after the grid becomes interactive, so [`getBorders()`](@/api/customBorders.md#getborders) and the cells' border metadata are complete only once the [`afterCustomBordersUpdate`](@/api/hooks.md#aftercustombordersupdate) hook fires:

```js
const hot = new Handsontable(container, {
  data,
  customBorders: largeBorderConfig,
  customBordersProgressive: true,
  licenseKey: 'non-commercial-and-evaluation',
  afterCustomBordersUpdate() {
    // every custom border is now applied
  },
});
```

## Result

The grid renders your configured classes, inline styles, and border definitions. Formatting stays consistent after each render.

## Related articles

**Related guides**

<div class="boxes-list">

- [Conditional formatting](@/guides/cell-features/conditional-formatting/conditional-formatting.md)

</div>

**Configuration options**

<div class="boxes-list">

- [activeHeaderClassName](@/api/options.md#activeheaderclassname)
- [className](@/api/options.md#classname)
- [commentedCellClassName](@/api/options.md#commentedcellclassname)
- [currentColClassName](@/api/options.md#currentcolclassname)
- [currentHeaderClassName](@/api/options.md#currentheaderclassname)
- [currentRowClassName](@/api/options.md#currentrowclassname)
- [customBorders](@/api/options.md#customborders)
- [customBordersProgressive](@/api/options.md#custombordersprogressive)
- [invalidCellClassName](@/api/options.md#invalidcellclassname)
- [noWordWrapClassName](@/api/options.md#nowordwrapclassname)
- [placeholder](@/api/options.md#placeholder)
- [placeholderCellClassName](@/api/options.md#placeholdercellclassname)
- [readOnlyCellClassName](@/api/options.md#readonlycellclassname)
- [tableClassName](@/api/options.md#tableclassname)

</div>

**Plugins**

<div class="boxes-list">

- [CustomBorders](@/api/customBorders.md)

</div>
