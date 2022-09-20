---
title: Handsontable cell type
metaTitle: Handsontable cell type - JavaScript Data Grid | Handsontable
description: Use the Handsontable cell type to collect user input with an interactive spreadsheet editor in a popup.
permalink: /handsontable-cell-type
canonicalUrl: /handsontable-cell-type
react:
  metaTitle: Handsontable cell type - React Data Grid | Handsontable
---

# Handsontable cell type

[[toc]]

## Overview

This page describes how to use Handsontable as a cell editor in Handsontable.

## Usage

**HOT-in-HOT opens by any of the following:**

* <kbd>**F2**</kbd> or <kbd>**Enter**</kbd> key is pressed while the cell is selected
* The triangle icon is clicked
* The cell content is double clicked

While HOT-in-HOT is opened, the text field above the HOT-in-HOT remains focused at all times.

**Keyboard bindings while the HOT-in-HOT is opened:**

* <kbd>**Escape**</kbd> - close editor and cancel change.
* <kbd>**Enter**</kbd> - close editor and apply change\*, move the selection in the main HOT downwards or according to the [`enterMoves`](@/api/options.md#enterMoves) setting.
* <kbd>**Tab**</kbd> - behaves as the <kbd>**Enter**</kbd> key, but move the selection in the main HOT to the right or to the left (depending on your [`layoutDirection`](@/api/options.md#layoutdirection) setting) or according to the [`tabMoves`](@/api/options.md#tabmoves)setting.
* <kbd>**Arrow Down**</kbd> - move the selection in HOT-in-HOT downwards. If the last row was selected, this has no effect.
* <kbd>**Arrow Up**</kbd> - move the selection in HOT-in-HOT upwards. If the first row was selected, deselect. If HOT-in-HOT was deselected, behave as the <kbd>**Enter**</kbd> key but move the selection in the main HOT upwards.
* <kbd>**Arrow Right**</kbd> - move the text cursor in the text field to the left. If the text cursor was at the start position, behave as the <kbd>**Enter**</kbd> key but move the selection in the main HOT to the left.
* <kbd>**Arrow Left**</kbd> - move the text cursor in the text field to the right. If the text cursor was at the end position, behave as the TAB key.

## Basic example

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');
const colorData = [['yellow'], ['red'], ['orange'], ['green'], ['blue'], ['gray'], ['black'], ['white']];
const manufacturerData = [
  { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
  { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
  { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
  { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
  { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
  { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
];

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        autoColumnSize: true,
        data: manufacturerData,
        getValue() {
          const selection = this.getSelectedLast();

          // Get the manufacturer name of the clicked row and ignore header
          // coordinates (negative values)
          return this.getSourceDataAtRow(Math.max(selection[0], 0)).name;
        },
      }
    },
    { type: 'numeric' },
    {
      type: 'handsontable',
      handsontable: {
        colHeaders: false,
        data: colorData
      }
    },
    {
      type: 'handsontable',
      handsontable: {
        colHeaders: false,
        data: colorData
      }
    }
  ]
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const colorData = [
    ['yellow'],
    ['red'],
    ['orange'],
    ['green'],
    ['blue'],
    ['gray'],
    ['black'],
    ['white']
  ];
  const manufacturerData = [
    { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
    { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
    { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
    { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
    { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
    { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
  ];

  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Tesla', 2017, 'black', 'black'],
        ['Nissan', 2018, 'blue', 'blue'],
        ['Chrysler', 2019, 'yellow', 'black'],
        ['Volvo', 2020, 'white', 'gray']
      ]}
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      columns={[{
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            autoColumnSize: true,
            data: manufacturerData,
            getValue() {
              const selection = this.getSelectedLast();

              // Get the manufacturer name of the clicked row and ignore header
              // coordinates (negative values)
              return this.getSourceDataAtRow(Math.max(selection[0], 0)).name;
            },
          }
        },
        { type: 'numeric' },
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: false,
            data: colorData
          }
        },
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: false,
            data: colorData
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


## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type.md)

### Related API reference

- Configuration options:
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
