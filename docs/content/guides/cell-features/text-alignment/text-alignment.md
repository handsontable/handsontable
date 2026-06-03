---
type: how-to
id: chduupye
title: Text alignment
metaTitle: Text alignment - JavaScript Data Grid | Handsontable
description: "Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell)."
permalink: /text-alignment
canonicalUrl: /text-alignment
react:
  id: 959g5cbf
  metaTitle: Text alignment - React Data Grid | Handsontable
angular:
  id: h6sbjq1g
  metaTitle: Text alignment - Angular Data Grid | Handsontable
vue:
  id: bqfjy5q5
  metaTitle: Text alignment - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---
Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell).

[[toc]]

Apply text alignment to cells using CSS class names or the `className` configuration option.

## To align a cell

To set alignment for individual cells, configure them using the [`cells`](@/api/options.md#cells) option or the [`cell`](@/api/options.md#cell) array. Available class names:

- Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`
- Vertical: `htTop`, `htMiddle`, `htBottom`

You can track alignment changes by using the [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta) hook.

## To align a column

To apply alignment globally or per column, provide the alignment details in the [`className`](@/api/options.md#classname) option, for example:

::: only-for javascript

```js
className: 'htCenter'
```

:::

::: only-for react

```jsx
className="htCenter"
```

:::

::: only-for angular

```ts
settings = { className: "htCenter" };
```

:::

::: only-for vue

```js
const hotSettings = {
  className: 'htCenter',
};
```

:::

## Basic example

The following code sample configures the grid to use `htCenter` and configures individual cells to use different alignments.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/text-alignment/javascript/example1.js)
@[code](@/content/guides/cell-features/text-alignment/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/text-alignment/react/example1.jsx)
@[code](@/content/guides/cell-features/text-alignment/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/text-alignment/angular/example1.ts)
@[code](@/content/guides/cell-features/text-alignment/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/text-alignment/vue/example1.vue)

:::

:::

## Related API reference

**Configuration options**

<div class="boxes-list">

- [className](@/api/options.md#classname)

</div>

**Hooks**

<div class="boxes-list">

- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeCellAlignment](@/api/hooks.md#beforecellalignment)

</div>

## Result

Cells display the configured horizontal or vertical alignment. Global settings apply to all cells, and per-cell settings take precedence over the global defaults.
