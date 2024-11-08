---
id: l5a447bl
title: Numeric cell type
metaTitle: Numeric cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter numbers correctly by using the numeric cell type.
permalink: /numeric-cell-type
canonicalUrl: /numeric-cell-type
react:
  id: e6zmmawj
  metaTitle: Numeric cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Numeric cell type

Display, format, sort, and filter numbers correctly by using the numeric cell type.

[[toc]]

## Overview

The default cell type in Handsontable is text. The data of a text cell is processed as a `string`
type that corresponds to the value of the text editor's internal `<textarea>` element. However,
there are many cases where you need cell values to be treated as a `number` type. The numeric cell
type allows you to format displayed numbers nicely and sort them correctly.

## Numeric cell type demo

In the following demo, columns **Year**, **Price ($)**, and **Price (€)** use the numeric cell type.
Click on the column names to sort them.

::: only-for javascript

::: example #example1 :hot-numbro --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-numbro --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/numeric-cell-type/react/example1.tsx)

:::

:::

## Use the numeric cell type

To use the numeric cell type, set the [`type`](@/api/options.md#type) option to `'numeric'`:

::: only-for javascript

```js
// set the numeric cell type for each cell of the entire grid
type: 'numeric',

// set the numeric cell type for each cell of a single column
columns: [
  {
    type: 'numeric',
  },
]

// set the numeric cell type for a single cell
cell: [
  {
    row: 0,
    col: 0,
    type: 'numeric',
  }
],
```

:::

::: only-for react

```jsx
// set the numeric cell type for each cell of the entire grid
type={'numeric'},

// set the numeric cell type for each cell of a single column
columns={[{
  type: 'numeric',
}]}

// set the numeric cell type for a single cell
cell={[{
  row: 0,
  col: 0,
  type: 'numeric',
}]}
```

:::

Mind that Handsontable doesn't parse strings to numbers. In your data source, make sure to store
numeric cell values as numbers, not as strings.

All positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are
representable in the `Number` type, i.e., as a safe integer. Any calculations that are performed on
bigger numbers won't be calculated precisely, due to JavaScript's limitations.

## Format numbers

To format the look of numeric values in [cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md),
use the [`numericFormat`](@/api/options.md#numericformat) option.

In the following demo, columns **Price in Japan** and **Price in Turkey** use two different
[`numericFormat`](@/api/options.md#numericformat) configurations.

::: only-for javascript

::: example #example3 :hot-numbro --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example3.js)
@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react-numbro --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/react/example3.jsx)
@[code](@/content/guides/cell-types/numeric-cell-type/react/example3.tsx)

:::

:::

Mind that the [`numericFormat`](@/api/options.md#numericformat) option doesn't change the way
numbers are presented or parsed by the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md). When
you edit a numeric cell:

- Regardless of the [`numericFormat`](@/api/options.md#numericformat) configuration, the number
  that's being edited displays its decimal separator as a period (`.`), and has no thousands
  separator or currency symbol.<br>For example, during editing `$7,000.02`, the number displays as
  `7000.02`.
- You can enter a decimal separator either with a period (`.`), or with a comma (`,`).
- You can't enter a thousands separator. After you finish editing the cell, the thousands
  separator is added automatically, based on your [`numericFormat`](@/api/options.md#numericformat)
  configuration.

## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

### Related API reference

- Configuration options:
  - [`numericFormat`](@/api/options.md#numericformat)
  - [`type`](@/api/options.md#type)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getDataType()`](@/api/core.md#getdatatype)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)
