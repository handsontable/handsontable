---
id: chduupye
title: Text alignment
metaTitle: Text alignment - JavaScript Data Grid | Handsontable
description: "Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell)."
permalink: /text-alignment
canonicalUrl: /text-alignment
react:
  id: 959g5cbf
  metaTitle: Text alignment - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Text alignment

Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell).

[[toc]]

## Horizontal and vertical alignment

To initialize Handsontable with predefined horizontal and vertical alignment globally, provide the alignment details in the [`className`](@/api/options.md#classname) option, for example:

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

You can also configure cells individually by setting up the [`cells`](@/api/options.md#cells) option. See the code sample below for an example.

Available class names:

- Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`,
- Vertical: `htTop`, `htMiddle`, `htBottom`.

You can track alignment changes by using the [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta) hook.

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

## Related API reference

- Configuration options:
  - [`className`](@/api/options.md#classname)
- Hooks:
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeCellAlignment`](@/api/hooks.md#beforecellalignment)
