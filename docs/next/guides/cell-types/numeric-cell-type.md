---
title: Numeric cell type
permalink: /next/numeric-cell-type
canonicalUrl: /numeric-cell-type
---

# Numeric cell type

[[toc]]

## Overview

By default, Handsontable treats all cell values as `string` type. This is because `<textarea>` returns a string as its value. In many cases you will prefer cell values to be treated as `number` type. This allows to format displayed numbers nicely and sort them correctly.

To trigger the Numeric cell type, use the option `type: 'numeric'` in `columns` array or `cells` function. Make sure your cell values are numbers and not strings as Handsontable will not parse strings to numbers. You can input float-typed values in the numeric editor only using a dot or a comma as a decimal separator. For example, both `500000.5`, `500000,5` will be accepted. You are not able to use thousands separator in the editor.

You can format the displayed values of the entered numbers. It can be done using the `numericFormat` option. Please keep in mind that it **have no influence on the way you enter data**.

Note that all the positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are representable in the `Number` type (safe integer). Any calculations that are performed on bigger numbers won't be calculated precisely due to JavaScript limitation.

## Basic example

::: example #example1
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
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car'
      // 1nd column is simple text, no special options here
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
