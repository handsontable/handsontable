---
title: Checkbox cell type
permalink: /next/checkbox-cell-type
canonicalUrl: /checkbox-cell-type
---

# Checkbox cell type

[[toc]]

Data in such cells will be rendered as checkbox and can be easily changed by checking/unchecking the checkbox.

Checking and unchecking can be performed using mouse or by pressing <kbd>SPACE</kbd>. You can change the state of multiple cells at once. Simply select cells you want to change and press <kbd>SPACE</kbd>.

## Checkbox true/false values

This is default usage scenario when columns data have `true` or `false` value and we want to display only checkboxes.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
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
const container = document.querySelector('#example2');

const hot2 = new Handsontable(container, {
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
const container = document.querySelector('#example3');

const hot3 = new Handsontable(container, {
  data: [
    {car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes'},
    {car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes'},
    {car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no'},
    {car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes'},
    {car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no'}
  ],
  colHeaders: ['Car model', 'Accepted', 'Comes in black'],
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
      licenseKey: 'non-commercial-and-evaluation',
      label: {
        position: 'before',
        value: 'In black? '
      },
    },
  ]
});
```
:::
