---
title: Handsontable cell type
metaTitle: Handsontable cell type - Guide - Handsontable Documentation
permalink: /9.0/handsontable-cell-type
canonicalUrl: /handsontable-cell-type
---

# Handsontable cell type

## Overview

This page describes how to use Handsontable as a cell editor in Handsontable.

## Usage

**HOT-in-HOT opens by any of the following:**

* <kbd>F2</kbd> or <kbd>ENTER</kbd> key is pressed while the cell is selected
* The triangle icon is clicked
* The cell content is double clicked

While HOT-in-HOT is opened, the text field above the HOT-in-HOT remains focused at all times.

**Keyboard bindings while the HOT-in-HOT is opened:**

* <kbd>ESC</kbd> - close editor and cancel change.
* <kbd>ENTER</kbd> - close editor and apply change\*, move the selection in the main HOT downwards or according to the `enterMoves` setting.
* <kbd>TAB</kbd> - behaves as the <kbd>ENTER</kbd> key, but move the selection in the main HOT to the right or according to the `tabMoves` setting.
* <kbd>ARROW DOWN</kbd> - move the selection in HOT-in-HOT downwards. If the last row was selected, this has no effect.
* <kbd>ARROW UP</kbd> - move the selection in HOT-in-HOT upwards. If the first row was selected, deselect. If HOT-in-HOT was deselected, behave as the <kbd>ENTER</kbd> key but move the selection in the main HOT upwards.
* <kbd>ARROW RIGTH</kbd> - move the text cursor in the text field to the left. If the text cursor was at the start position, behave as the <kbd>ENTER</kbd> key but move the selection in the main HOT to the left.
* <kbd>ARROW LEFT</kbd> - move the text cursor in the text field to the right. If the text cursor was at the end position, behave as the TAB key.

## Basic example

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
