---
title: Numeric cell type
metaTitle: Numeric cell type - Guide - Handsontable Documentation
permalink: /numeric-cell-type
canonicalUrl: /numeric-cell-type
---

# Numeric cell type

[[toc]]

## Overview

By default, Handsontable treats all cell values as `string` type. This is because the `<textarea>` returns a string as its value. There are many cases where you need cell values to be treated as a `number` type. The numeric cell type allows you to format displayed numbers nicely and sort them correctly.

## Usage

To use the `numeric` cell type, set the [`type`](@/api/options.md#type) option to `'numeric'`:

```js
// set the `numeric` cell type for each cell of the entire grid
type: `'numeric'`,

// set the `numeric` cell type for each cell of a single column
columns: [
  {
    type: 'numeric',
  },
]

// set the `numeric` cell type for a single cell
cell: [
  {
    row: 0,
    col: 0,
    type: 'numeric',
  }
],
```

### Edit numeric values

When editing values in a `numeric` cell:
- Make sure that your values are numbers (not strings), as Handsontable doesn't parse strings to numbers.
- As a decimal separator, use the dot (`50.5`). You can also use the comma (`50,5`), but not at Handosntable's [initialization](@/guides/getting-started/installation.md#initialize-handsontable).
- Don't use any thousands separators.

::: tip
All the positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are representable in the `Number` type, i.e., safe integer. Any calculations that are performed on bigger numbers won't be calculated precisely due to JavaScript limitations.
:::

### Display numeric values

To format the look of numeric values, use the [`numericFormat`](@/api/options.md#numericformat) option.

Note that the [`numericFormat`](@/api/options.md#numericformat) option doesn't change the way you [edit](#edit-numeric-values) numeric data.

## Basic example

::: example #example1 :hot-numbro
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
    { car: 'Citroen C4 Coupe', year: 2018, price_usd: 8330, price_eur: 8330 },
    { car: 'Audi A4 Avant', year: 2019, price_usd: 33900, price_eur: 33900 },
    { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
    { car: 'BMW 320i Coupe', year: 2021, price_usd: 30500, price_eur: 30500 }
  ],
  colHeaders: ['Car', 'Year', 'Price ($)', 'Price (€)'],
  columnSorting : true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car'
      // 1st column is simple text, no special options here
    },
    {
      data: 'year',
      type: 'numeric'
    },
    {
      data: 'price_usd',
      type: 'numeric',
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US' // this is the default culture, set up for USD
      },
      allowEmpty: false
    },
    {
      data: 'price_eur',
      type: 'numeric',
      numericFormat: {
        pattern: '0,0.00 $',
        culture: 'de-DE' // use this for EUR (German),
        // more cultures available on http://numbrojs.com/languages.html
      }
    }
  ]
});
```
:::

## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type.md)

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
