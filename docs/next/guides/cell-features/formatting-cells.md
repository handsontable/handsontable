---
title: Formatting cells
permalink: /next/formatting-cells
canonicalUrl: /formatting-cells
---

# Formatting cells

[[toc]]

## Overview

Handsontable utilizes the HTML `table` structure so customization is based either on referencing to the already existing tags, such as TR/TD, or by applying your own CSS classes to HTML elements.

A cell can be formatted either using a `CSS` attribute or with a style applied directly from the `Settings` object.

## Apply custom class styles

In this example we first add a custom class `custom-class` to the cell in the top left corner.

::: example #example1 --css 1 --js 2
```css
.custom-class {
  color: #fff;
  background-color: #37bc6c;
}
```
```javascript
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
 data: Handsontable.helper.createSpreadsheetData(5, 5),
 rowHeaders: true,
 colHeaders: true,
 stretchH: 'all',
 licenseKey: 'non-commercial-and-evaluation', 
 //todo lack of setting css class
});
```
:::

## Set styles with JavaScript

You can pass the styles in the `Settings` object by referencing the target cells.

::: example #example2
```javascript
const container = document.querySelector('#example2');

const hot1 = new Handsontable(container, {
 data: Handsontable.helper.createSpreadsheetData(5, 5),
 rowHeaders: true,
 colHeaders: true,
 stretchH: 'all',
 licenseKey: 'non-commercial-and-evaluation'
 //todo lack of setting borders
});
```
:::

## Custom cell borders

To enable the custom borders feature, set the `customBorders` option. This can either be set as `true` or initialized as an array with a pre-defined setup.

To initialize Handsontable with predefined custom borders, provide the cell coordinates and border styles in form of an array:

- with row/col pairs: `{row: 2, col: 2, left: { /*...*/ }}`
- or with range details: `{range: {from: {row: 1, col: 1}, to:{row: 3, col: 4}}, left: { /*...*/ }}`

::: example #example3
```js
const container = document.getElementById('example3');

const hot = Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 6),
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
  customBorders: [
    {
      range: {
        from: {
          row: 1,
          col: 1
        },
        to: {
          row: 3,
          col: 4
        }
      },
      top: {
        width: 2,
        color: '#5292F7'
      },
      left: {
        width: 2,
        color: 'orange'
      },
      bottom: {
        width: 2,
        color: 'red'
      },
      right: {
        width: 2,
        color: 'magenta'
      }
    },
    {
      row: 2,
      col: 2,
      left: {
        width: 2,
        color: 'red'
      },
      right: {
        width: 1,
        color: 'green'
      }
    }
  ]
});
```
:::
