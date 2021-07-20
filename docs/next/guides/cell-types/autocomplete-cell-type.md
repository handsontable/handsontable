---
title: Autocomplete cell type
metaTitle: Autocomplete cell type - Guide - Handsontable Documentation
permalink: /next/autocomplete-cell-type
canonicalUrl: /autocomplete-cell-type
---

# Autocomplete cell type

[[toc]]

## Overview
The `autocomplete` cell type enables the user to choose a suggested option while typing. Autocomplete can be configured in three different ways, lazy mode, strict mode, and strict mode using Ajax.

## Autocomplete lazy mode

This example uses the `autocomplete` feature in the default **lazy mode**. In this mode, the user can choose one of the suggested options while typing or enter a custom value that is not included in the suggestions.

In this mode, the mouse and keyboard bindings are identical to the [Handsontable cell type](@/guides/cell-types/handsontable-cell-type.md). The options are rendered from the `source` property, either an array or a function that returns an array.

::: example #example1
```js
const container = document.querySelector('#example1');
const colors = ['yellow', 'red', 'orange and another color', 'green',
  'blue', 'gray', 'black', 'white', 'purple', 'lime', 'olive', 'cyan'];

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {
      type: 'autocomplete',
      source: ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'],
      strict: false
    },
    { type: 'numeric' },
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      visibleRows: 4
    },
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      trimDropdown: false
    }
  ]
});
```
:::

## Autocomplete strict mode

This is the same example as above, the difference being that `autocomplete` now runs in **strict mode**. In this mode, the autocomplete cells will only accept values that are defined in the source array. The mouse and keyboard bindings are identical to the [Handsontable cell type](@/guides/cell-types/handsontable-cell-type.md) but with the differences below:

* If there is at least one option visible, there always is a selection in HOT-in-HOT
* When the first row is selected, pressing <kbd>ARROW UP</kbd> does not deselect HOT-in-HOT. Instead, it behaves as the <kbd>ENTER</kbd> key but moves the selection in the main HOT upwards

In strict mode, the **allowInvalid** option determines the behaviour in the case of manual user input:

* `allowInvalid: true` optional - allows manual input of a value that does not exist in the `source`, the field background is highlighted in red, and the selection advances to the next cell
* `allowInvalid: false` - does not allow manual input of a value that does not exist in the `source`, the <kbd>ENTER</kbd> key is ignored, and the editor field remains open

::: example #example2
```js
const container = document.querySelector('#example2');
const colors = ['yellow', 'red', 'orange', 'green', 'blue',
  'gray', 'black', 'white', 'purple', 'lime', 'olive', 'cyan'];
const cars = ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'];

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car<br>(allowInvalid true)', 'Year',
    'Chassis color<br>(allowInvalid false)', 'Bumper color<br>(allowInvalid true)'],
  columns: [
    {
      type: 'autocomplete',
      source: cars,
      strict: true
      // allowInvalid: true // true is default
    },
    {},
    {
      type: 'autocomplete',
      source: colors,
      strict: true,
      allowInvalid: false
    },
    {
      type: 'autocomplete',
      source: colors,
      strict: true,
      allowInvalid: true //true is default
    }
  ]
});
```
:::

## Autocomplete strict mode (Ajax)

Autocomplete can also be used with Ajax data sources. In the example below, suggestions for the "Car" column are loaded from the server. To load data from a remote *asynchronous* source, assign a function to the 'source' property. The function should perform the server-side request and call the callback function when the result is available.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      type: 'autocomplete',
      source(query, process) {
        fetch('/docs/next/scripts/json/autocomplete.json')
          .then(response => response.json())
          .then(response => process(response.data));
      },
      strict: true
    },
    {}, // Year is a default text column
    {}, // Chassis color is a default text column
    {} // Bumper color is a default text column
  ]
});
```
:::
