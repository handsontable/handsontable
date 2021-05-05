---
title: Checkbox cell type
permalink: /next/checkbox-cell-type
canonicalUrl: /checkbox-cell-type
---

# Checkbox cell type

[[toc]]

## Overview

Data in such cells will be rendered as checkbox and can be easily changed by checking/unchecking the checkbox.

Checking and unchecking can be performed using mouse or by pressing <kbd>SPACE</kbd>. You can change the state of multiple cells at once. Simply select cells you want to change and press <kbd>SPACE</kbd>.

## Checkbox true/false values

This is default usage scenario when columns data have `true` or `false` value and we want to display only checkboxes.

::: example #example1
```js
var example1 = document.getElementById('example1'),
    hot1;

hot1 = new Handsontable(example1, {
  data: [
    {car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes'},
    {car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes'},
    {car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no'},
    {car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes'},
    {car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no'}
  ],
  colHeaders: ['Car model', 'Year of manufacture', 'Available'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car'
    },
    {
      data: 'year',
      type: 'numeric'
    },
    {
      data: 'available',
      type: 'checkbox'
    }
  ]
});
```
:::

## Checkbox template

If you want use other values than `true` and `false`, you have to provide this information using `checkedTemplate` and `uncheckedTemplate`. Handsontable will then update your data using appropriate template.

::: example #example2
```js
var example1 = document.getElementById('example2'),
    hot2;

hot2 = new Handsontable(example2, {
  data: [
    {car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes'},
    {car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes'},
    {car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no'},
    {car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes'},
    {car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no'}
  ],
  colHeaders: ['Car model', 'Year of manufacture', 'Comes in black'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car'
    },
    {
      data: 'year',
      type: 'numeric'
    },
    {
      data: 'comesInBlack',
      type: 'checkbox',
      checkedTemplate: 'yes',
      uncheckedTemplate: 'no'
    }
  ]
});
```
:::

## Checkbox labels

If you want to add label to the checkbox you can use `label` option. With this option you can declare where label will be injected (before or after checkbox element) and from what data source label text will be updated.

::: example #example3
```js
var example1 = document.getElementById('example3'),
    hot3;

hot3 = new Handsontable(example3, {
  data: [
    {car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes'},
    {car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes'},
    {car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no'},
    {car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes'},
    {car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no'}
  ],
  colHeaders: ['Car model', 'Accepted', 'Comes in black'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car'
    },
    {
      data: 'available',
      type: 'checkbox',
      label: {
        position: 'after',
        property: 'car' // Read value from row object
      },
    },
    {
      data: 'comesInBlack',
      type: 'checkbox',
      checkedTemplate: 'yes',
      uncheckedTemplate: 'no',
      label: {
        position: 'before',
        value: 'In black? '
      },
    },
  ]
});
```
:::
