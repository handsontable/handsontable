---
title: Dropdown
permalink: /8.2/dropdown
canonicalUrl: /dropdown
---

# {{ $frontmatter.title }}

This example shows the usage of the Dropdown feature. Dropdown is based on [Autocomplete](autocomplete.md) cell type. All options used by `autocomplete` cell type apply to `dropdown` as well.

Internally, cell `{type: 'dropdown'}` is equivalent to cell `{type: 'autocomplete', strict: true, filter: false}`. Therefore you can think of `dropdown` as a searchable `<select>`.

::: example #example1
```js
var
    container = document.getElementById('example1'),
    hot;

  hot = new Handsontable(container, {
    data: [
      ['Tesla', 2017, 'black', 'black'],
      ['Nissan', 2018, 'blue', 'blue'],
      ['Chrysler', 2019, 'yellow', 'black'],
      ['Volvo', 2020, 'white', 'gray']
    ],
    colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
    columns: [
      {},
      {type: 'numeric'},
      {
        type: 'dropdown',
        source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
      },
      {
        type: 'dropdown',
        source: ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white']
      }
    ]
  });
```
:::
