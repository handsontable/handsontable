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

```css
.custom-class {
  color: #fff;
  background-color: #37bc6c;
}
```

::: example #example
```javascript
var example = document.getElementById('example');
var hot = new Handsontable(example, {
 data: Handsontable.helper.createSpreadsheetData(5, 5),
 rowHeaders: true,
 colHeaders: true,
 stretchH: 'all',
 licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Set styles with JavaScript

You can pass the styles in the `Settings` object by referencing the target cells.

::: example #example1
```javascript
var example1 = document.getElementById('example1');
var hot1 = new Handsontable(example1, {
 data: Handsontable.helper.createSpreadsheetData(5, 5),
 rowHeaders: true,
 colHeaders: true,
 stretchH: 'all',
 licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom cell borders

To enable the custom borders feature, set the `customBorders` option. This can either be set as `true` or initialized as an array with a pre-defined setup.

To initialize Handsontable with predefined custom borders, provide the cell coordinates and border styles in form of an array:

- with row/col pairs: `{row: 2, col: 2, left: { /*...*/ }}`
- or with range details: `{range: {from: {row: 1, col: 1}, to:{row: 3, col: 4}}, left: { /*...*/ }}`

::: example #example2
```js
var container2 = document.getElementById('example2'),
  hot2;

hot2 = Handsontable(container2, {
  data: Handsontable.helper.createSpreadsheetData(5, 6),
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
