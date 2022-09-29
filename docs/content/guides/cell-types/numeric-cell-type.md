---
title: Numeric cell type
metaTitle: Numeric cell type - JavaScript Data Grid | Handsontable
description: Use the numeric cell type to correctly display, format, sort, and filter numbers.
permalink: /numeric-cell-type
canonicalUrl: /numeric-cell-type
react:
  metaTitle: Numeric cell type - React Data Grid | Handsontable
searchCategory: Guides
---

# Numeric cell type

[[toc]]

## Overview

The default cell type in Handsontable is text. The data of a text cell is processed as a `string` type that corresponds to the value of the text editor's internal `<textarea>` element. However, there are many cases where you need cell values to be treated as a `number` type. The numeric cell type allows you to format displayed numbers nicely and sort them correctly.

## Usage

::: tip
Ensure your numeric cell values are stored as numbers and not strings in the data source, as Handsontable doesn't parse strings to numbers.
:::

To use the `numeric` cell type, set the [`type`](@/api/options.md#type) option to `'numeric'`:

::: only-for javascript
```js
// set the `numeric` cell type for each cell of the entire grid
type: 'numeric',

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
:::

::: only-for react
```jsx
// set the `numeric` cell type for each cell of the entire grid
type={'numeric'},

// set the `numeric` cell type for each cell of a single column
columns={[{
  type: 'numeric',
}]}

// set the `numeric` cell type for a single cell
cell={[{
  row: 0,
  col: 0,
  type: 'numeric',
}]}
```
:::

### Numeric values in the editor

In the cell editor of a `numeric` cell:
- The number is initially presented with a dot (`50.5`) as the decimal separator and without the thousands separator.
- A dot (`50.5`) or a comma (`50,5`) can be entered as the decimal separator.
- No character can be used as the thousands separator.

::: tip
All the positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are representable in the `Number` type, i.e., safe integer. Any calculations that are performed on bigger numbers won't be calculated precisely due to JavaScript limitations.
:::

### Numeric values in the renderer

To format the look of numeric values in cell renderers, use the [`numericFormat`](@/api/options.md#numericformat) option.

Note that the [`numericFormat`](@/api/options.md#numericformat) option doesn't change the way numbers are presented or parsed by the [cell editor](#numeric-values-in-the-editor).

## Basic example

::: only-for javascript
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
:::

::: only-for react
::: example #example1 :react-numbro
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
        { car: 'Citroen C4 Coupe', year: 2018, price_usd: 8330, price_eur: 8330 },
        { car: 'Audi A4 Avant', year: 2019, price_usd: 33900, price_eur: 33900 },
        { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
        { car: 'BMW 320i Coupe', year: 2021, price_usd: 30500, price_eur: 30500 }
      ]}
      colHeaders={['Car', 'Year', 'Price ($)', 'Price (€)']}
      columnSorting={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      columns={[{
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
      ]}
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


::: only-for react
## Formatting numbers

::: example #example3 :react-numbro
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

import numbro from 'numbro';
import languages from 'numbro/dist/languages.min.js';

// register the languages you need
numbro.registerLanguage(languages['ja-JP']);
numbro.registerLanguage(languages['tr-TR']);

// define formats
const formatJP = {
  pattern: '0,0.00 $',
  culture: 'ja-JP'
};

const formatTR = {
  pattern: '0,0.00 $',
  culture: 'tr-TR'
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        {
          productName: 'Product A',
          JP_price: 1.32,
          TR_price: 100.56
        },
        {
          productName: 'Product B',
          JP_price: 2.22,
          TR_price: 453.5
        },
        {
          productName: 'Product C',
          JP_price: 3.1,
          TR_price: 678.1
        }
      ]}
      autoRowSize={false}
      autoColumnSize={false}
      colHeaders={['Product name', 'Price in Japan', 'Price in Turkey']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      >
      <HotColumn data="productName" type="text" width="120" />
      <HotColumn
        data="JP_price"
        type="numeric"
        numericFormat={formatJP}
        width="120"
      />
      <HotColumn
        data="TR_price"
        type="numeric"
        numericFormat={formatTR}
        width="120"
      />
    </HotTable>
  )
}

ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
```
:::
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
