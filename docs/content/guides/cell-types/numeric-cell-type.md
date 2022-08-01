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

To trigger the Numeric cell type, use the option `type: 'numeric'` in the [`columns`](@/api/options.md#columns) array or [`cells`](@/api/options.md#cells) function.

::: tip
Ensure your cell values are numbers and not strings, as Handsontable doesn't parse strings to numbers.
:::

You can input float-type values in the numeric editor using a dot or a comma as a decimal separator. For example, both `500000.5`, `500000,5` will be accepted. You are not able to use a thousands separator in the editor.

You can format the displayed values of the entered numbers using the [`numericFormat`](@/api/options.md#numericformat) option. Note that it ** does not influence the way you enter data**.

::: tip
All the positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are representable in the `Number` type, i.e., safe integer. Any calculations that are performed on bigger numbers won't be calculated precisely due to JavaScript limitations.
:::

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
import React, { Fragment, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotSettings = {
    data: [
      { car: 'Mercedes A 160', year: 2017, price_usd: 7000, price_eur: 7000 },
      { car: 'Citroen C4 Coupe', year: 2018, price_usd: 8330, price_eur: 8330 },
      { car: 'Audi A4 Avant', year: 2019, price_usd: 33900, price_eur: 33900 },
      { car: 'Opel Astra', year: 2020, price_usd: 5000, price_eur: 5000 },
      { car: 'BMW 320i Coupe', year: 2021, price_usd: 30500, price_eur: 30500 }
    ],
    colHeaders: ['Car', 'Year', 'Price ($)', 'Price (€)'],
    columnSorting: true,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    columns: [{
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
  };

  return (
    <Fragment>
      <HotTable settings={hotSettings}>
      </HotTable>
    </Fragment>
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

import 'handsontable/dist/handsontable.min.css';

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

const hotSettings = {
  data: [
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
  ],
  autoRowSize: false,
  autoColumnSize: false,
  colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
}

const App = () => {
  return (
    <HotTable settings={hotSettings}>
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

ReactDOM.render(<App />, document.getElementById('example3'));
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
