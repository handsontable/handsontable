---
title: Checkbox cell type
metaTitle: Checkbox cell type - Guide - Handsontable Documentation
permalink: /checkbox-cell-type
canonicalUrl: /checkbox-cell-type
---

# Checkbox cell type

[[toc]]

## Overview
Data in these cells will be rendered as a checkbox and can be easily changed by checking/unchecking the checkbox.

Checking the box can be performed using a mouse, or by pressing <kbd>**Space**</kbd> or <kbd>**Enter**</kbd>.

Unchecking the box can be performed using a mouse, or by pressing <kbd>**Space**</kbd>, <kbd>**Enter**</kbd>, <kbd>**Delete**</kbd> or <kbd>**Backspace**</kbd>.

You can change the state of multiple cells at once by selecting the cells you want to change and pressing <kbd>**Space**</kbd>.

## Checkbox true/false values

This is the default usage scenario where column data has a `true` or `false` value, and we only want to display checkboxes.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no' }
  ],
  colHeaders: ['Car model', 'Year of manufacture', 'Available'],
  height: 'auto',
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
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Checkbox template

If you want to use values other than `true` and `false`, you have to provide this information using [`checkedTemplate`](@/api/options.md#checkedtemplate) and [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate). Handsontable will then update your data using the appropriate template.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no' }
  ],
  colHeaders: ['Car model', 'Year of manufacture', 'Comes in black'],
  height: 'auto',
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
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Checkbox labels

To add a label to the checkbox, use the [`label`](@/api/options.md#label) option. You can declare where the label will be injected with this option - either before or after the checkbox element. You can also declare from which data source the label text will be updated.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    { car: 'Mercedes A 160', year: 2017, available: true, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, available: false, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, available: true, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, available: false, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, available: false, comesInBlack: 'no' }
  ],
  colHeaders: ['Car model', 'Accepted', 'Comes in black'],
  height: 'auto',
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
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Related keyboard shortcuts

| Windows                  | macOS                    | Action                        |  Excel  | Sheets  |
| ------------------------ | ------------------------ | ----------------------------- | :-----: | :-----: |
| <kbd>**Space**</kbd>     | <kbd>**Space**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Enter**</kbd>     | <kbd>**Enter**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Delete**</kbd>    | <kbd>**Delete**</kbd>    | Uncheck the checkbox          | &cross; | &check; |
| <kbd>**Backspace**</kbd> | <kbd>**Backspace**</kbd> | Uncheck the checkbox          | &cross; | &check; |

## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type.md)

### Related API reference

- Configuration options:
  - [`checkedTemplate`](@/api/options.md#checkedtemplate)
  - [`label`](@/api/options.md#label)
  - [`type`](@/api/options.md#type)
  - [`uncheckedTemplate`](@/api/options.md#uncheckedtemplate)
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
