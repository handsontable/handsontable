---
type: how-to
title: Conditional formatting
metaTitle: Conditional formatting - JavaScript Data Grid | Handsontable
description: Style cells dynamically based on their values, using CSS classes, custom renderers, or a color scale.
permalink: /conditional-formatting
canonicalUrl: /conditional-formatting
react:
  metaTitle: Conditional formatting - React Data Grid | Handsontable
angular:
  metaTitle: Conditional formatting - Angular Data Grid | Handsontable
vue:
  metaTitle: Conditional formatting - Vue Data Grid | Handsontable
tags:
  - conditional-formatting
  - cell-styling
  - className
  - renderer
searchCategory: Guides
category: Cell features
menuTag: updated
---
Style cells dynamically based on their values, so you can highlight outliers, flag errors, or visualize data ranges.

[[toc]]

## Overview

Conditional formatting changes a cell's appearance based on the data it holds. As values change, the formatting updates on the next render.

Choose an approach based on your goal:

- Use [`className`](@/api/options.md#classname) with the [`cells`](@/api/options.md#cells) callback when you want reusable CSS classes driven by cell values. This is the recommended default.
- Use the [`renderer`](@/api/options.md#renderer) option when you need inline styles or want to transform the displayed value.
- Combine a `renderer` with a computed background color when you want a color scale that reflects each value's magnitude.

For static styling that does not depend on cell values, see [Formatting cells](@/guides/cell-features/formatting-cells/formatting-cells.md).

## Prerequisites

- A Handsontable instance with data loaded.
- A stylesheet, if you format cells through custom CSS classes.
- Familiarity with the cascading configuration model, where cell settings override column settings, which override global settings. See [Setting options](@/guides/configuration/configuration-options/configuration-options.md).

## Highlight cells by value with a CSS class

Return a [`className`](@/api/options.md#classname) from the [`cells`](@/api/options.md#cells) callback to style cells by value. The callback runs for every cell, so you can inspect the value and assign a class conditionally.

This example uses the cascading model on two levels: the Company column sets a static `className` through its `columns` entry, while the [`cells`](@/api/options.md#cells) callback adds a `loss` class to negative quarters and a `strong-quarter` class to quarters above 10. The `loss` class pairs its red color with a leading marker, so the value stays readable without color.

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

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/conditional-formatting/angular/example1.ts)
@[code](@/content/guides/cell-features/conditional-formatting/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/conditional-formatting/vue/example1.vue)

:::

:::

## Format cells with a custom renderer

Use a [`renderer`](@/api/options.md#renderer) when a CSS class is not enough - for example, when you need to transform the displayed value or apply inline styles computed at render time.

This renderer formats each quarter as a currency amount and shows losses in an accounting format, `($1.3M)`. The parentheses convey a loss on their own, so the red color is a secondary signal.

::: only-for javascript

::: example #example2 --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/conditional-formatting/javascript/example2.css)
@[code](@/content/guides/cell-features/conditional-formatting/javascript/example2.js)
@[code](@/content/guides/cell-features/conditional-formatting/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/conditional-formatting/react/example2.css)
@[code](@/content/guides/cell-features/conditional-formatting/react/example2.jsx)
@[code](@/content/guides/cell-features/conditional-formatting/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/conditional-formatting/angular/example2.ts)
@[code](@/content/guides/cell-features/conditional-formatting/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/conditional-formatting/vue/example2.vue)

:::

:::

## Build a color scale

To visualize magnitude, compute a background color from each value and apply it in a [`renderer`](@/api/options.md#renderer). This example maps every quarter to a green-to-red scale based on the minimum and maximum across the data, producing a heatmap. The numeric value remains visible in each cell, so the color adds meaning rather than replacing it.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-features/conditional-formatting/javascript/example3.js)
@[code](@/content/guides/cell-features/conditional-formatting/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/conditional-formatting/react/example3.jsx)
@[code](@/content/guides/cell-features/conditional-formatting/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/conditional-formatting/angular/example3.ts)
@[code](@/content/guides/cell-features/conditional-formatting/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-features/conditional-formatting/vue/example3.vue)

:::

:::

## Make conditional formatting accessible

Color alone does not meet [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/#use-of-color). Readers with color vision deficiencies, or anyone viewing the grid in high-contrast mode, can miss a signal that relies only on color.

- Pair color with a second cue: a symbol, text label, or font weight. In the first example, the `loss` class adds a marker; in the second, losses appear in parentheses.
- In a color scale, keep the underlying value visible so the color stays supplementary.
- Verify that text keeps a contrast ratio of at least 4.5:1 against the cell background you apply.

## Result

Cells that match your conditions display the configured styles - classes, inline styles, or a color scale - and update automatically as the data changes.

## Related articles

**Related guides**

<div class="boxes-list">

- [Formatting cells](@/guides/cell-features/formatting-cells/formatting-cells.md)
- [Text alignment](@/guides/cell-features/text-alignment/text-alignment.md)
- [Setting options](@/guides/configuration/configuration-options/configuration-options.md)

</div>

**Configuration options**

<div class="boxes-list">

- [className](@/api/options.md#classname)
- [cells](@/api/options.md#cells)
- [renderer](@/api/options.md#renderer)

</div>
