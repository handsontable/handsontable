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

::: example #example1 :hot-numbro

```js
import Handsontable from 'handsontable';
import numbro from 'numbro';
import deDE from 'numbro/languages/de-DE';
import 'handsontable/dist/handsontable.full.min.css';

// register the languages you need
numbro.registerLanguage(deDE);

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
    { car: 'Citroen C4 Coupe', year: 2018, price_usd: 8330, price_eur: 8330 },
    { car: 'Audi A4 Avant', year: 2019, price_usd: 33900, price_eur: 33900 },
    { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
    { car: 'BMW 320i Coupe', year: 2021, price_usd: 30500, price_eur: 30500 },
  ],
  colHeaders: ['Car', 'Year', 'Price ($)', 'Price (€)'],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car',
      // 1st column is simple text, no special options here
    },
    {
      data: 'year',
      type: 'numeric',
    },
    {
      data: 'price_usd',
      type: 'numeric',
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US', // this is the default culture, set up for USD
      },
      allowEmpty: false,
    },
    {
      data: 'price_eur',
      type: 'numeric',
      numericFormat: {
        pattern: '0,0.00 $',
        culture: 'de-DE', // use this for EUR (German),
        // more cultures available on http://numbrojs.com/languages.html
      },
    },
  ],
});
```

:::

:::

::: only-for react

::: example #example1 :react-numbro

```jsx
import { HotTable } from '@handsontable/react';
import numbro from 'numbro';
import deDE from 'numbro/languages/de-DE';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// register the languages you need
numbro.registerLanguage(deDE);

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
        { car: 'Citroen C4 Coupe', year: 2018, price_usd: 8330, price_eur: 8330 },
        { car: 'Audi A4 Avant', year: 2019, price_usd: 33900, price_eur: 33900 },
        { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
        { car: 'BMW 320i Coupe', year: 2021, price_usd: 30500, price_eur: 30500 },
      ]}
      colHeaders={['Car', 'Year', 'Price ($)', 'Price (€)']}
      columnSorting={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          data: 'car',
          // 1st column is simple text, no special options here
        },
        {
          data: 'year',
          type: 'numeric',
        },
        {
          data: 'price_usd',
          type: 'numeric',
          numericFormat: {
            pattern: '$0,0.00',
            culture: 'en-US', // this is the default culture, set up for USD
          },
          allowEmpty: false,
        },
        {
          data: 'price_eur',
          type: 'numeric',
          numericFormat: {
            pattern: '0,0.00 $',
            culture: 'de-DE', // use this for EUR (German),
            // more cultures available on http://numbrojs.com/languages.html
          },
        },
      ]}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```

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

To format the look of numeric values in [cell renderers](@/guides/cell-functions/cell-renderer.md),
use the [`numericFormat`](@/api/options.md#numericformat) option.

In the following demo, columns **Price in Japan** and **Price in Turkey** use two different
[`numericFormat`](@/api/options.md#numericformat) configurations.

::: only-for javascript

::: example #example3 :hot-numbro

```js
import Handsontable from 'handsontable';
import numbro from 'numbro';
import jaJP from 'numbro/languages/ja-JP';
import trTR from 'numbro/languages/tr-TR';
import 'handsontable/dist/handsontable.full.min.css';

// register the languages you need
numbro.registerLanguage(jaJP);
numbro.registerLanguage(trTR);

// define formats
const formatJP = {
  pattern: '0,0.00 $',
  culture: 'ja-JP',
};

const formatTR = {
  pattern: '0,0.00 $',
  culture: 'tr-TR',
};

const container = document.querySelector('#example3');
const hot = new Handsontable(container, {
  data: [
    {
      productName: 'Product A',
      JP_price: 1450.32,
      TR_price: 202.14,
    },
    {
      productName: 'Product B',
      JP_price: 2430.22,
      TR_price: 338.86,
    },
    {
      productName: 'Product C',
      JP_price: 3120.10,
      TR_price: 435.20,
    },
  ],
  columns: [
    {
      data: 'productName',
      type: 'text',
      width: '120',
    },
    {
      data: 'JP_price',
      type: 'numeric',
      width: '120',
      numericFormat: formatJP,
    },
    {
      data: 'TR_price',
      type: 'numeric',
      width: '120',
      numericFormat: formatTR,
    },
  ],
  autoRowSize: false,
  autoColumnSize: false,
  columnSorting: true,
  colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example3 :react-numbro

```jsx
import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import numbro from 'numbro';
import jaJP from 'numbro/languages/ja-JP';
import trTR from 'numbro/languages/tr-TR';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// register the languages you need
numbro.registerLanguage(jaJP);
numbro.registerLanguage(trTR);

// define formats
const formatJP = {
  pattern: '0,0.00 $',
  culture: 'ja-JP',
};

const formatTR = {
  pattern: '0,0.00 $',
  culture: 'tr-TR',
};

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        {
          productName: 'Product A',
          JP_price: 1450.32,
          TR_price: 202.14,
        },
        {
          productName: 'Product B',
          JP_price: 2430.22,
          TR_price: 338.86,
        },
        {
          productName: 'Product C',
          JP_price: 3120.10,
          TR_price: 435.20,
        },
      ]}
      autoRowSize={false}
      autoColumnSize={false}
      columnSorting={true}
      colHeaders={['Product name', 'Price in Japan', 'Price in Turkey']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="productName" type="text" width="120" />
      <HotColumn data="JP_price" type="numeric" numericFormat={formatJP} width="120" />
      <HotColumn data="TR_price" type="numeric" numericFormat={formatTR} width="120" />
    </HotTable>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```

:::

:::

Mind that the [`numericFormat`](@/api/options.md#numericformat) option doesn't change the way
numbers are presented or parsed by the [cell editor](@/guides/cell-functions/cell-editor.md). When
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
