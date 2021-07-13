---
title: Dropdown cell type
metaTitle: Dropdown cell type - Guide - Handsontable Documentation
permalink: /9.0/dropdown-cell-type
canonicalUrl: /dropdown-cell-type
---

# Dropdown cell type
[[toc]]

## Overview
The dropdown cell type is based on an autocomplete cell type and can also be searchable.

## Usage
This example shows the usage of the dropdown feature. Dropdown is based on [Autocomplete](@/guides/cell-types/autocomplete-cell-type.md) cell type. All options used by `autocomplete` cell type apply to `dropdown` as well.

Internally, cell `{type: 'dropdown'}` is equivalent to cell `{type: 'autocomplete', strict: true, filter: false}`. Therefore you can think of `dropdown` as a searchable `<select>`.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {},
    { type: 'numeric' },
    {
      type: 'dropdown',
      source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
    },
    {
      type: 'dropdown',
      source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
    }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
