---
title: Formatting cells
metaTitle: Formatting cells - Guide - Handsontable Documentation
permalink: /next/formatting-cells
canonicalUrl: /formatting-cells
---

# Formatting cells

[[toc]]

## Overview

Handsontable utilizes the HTML `table` structure so customization is based either on referencing to the already existing elements, such as `TR`/`TD`, or by applying your own CSS classes to HTML elements.

A cell can be formatted either using a `CSS` class or with a style applied directly to the DOM element.

## Apply custom CSS class styles

In this example, we add a custom class `custom-cell` to the cell in the top left corner and add a `custom-table` CSS class that highlights the table headers.

::: example #example1 --css 1 --js 2
```css
td.custom-cell {
  color: #fff;
  background-color: #37bc6c;
}
.custom-table thead th:nth-child(even),
.custom-table tbody tr:nth-child(odd) th {
  background-color: #d7f1e1;
}
```
```javascript
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  className: 'custom-table',
  cell: [
    {
      row: 0,
      col: 0,
      className: 'custom-cell',
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```
:::

## Apply inline styles

You can apply inline styles directly to the DOM element using its `style` attribute. You can use the `renderer` option to do that.

::: example #example2
```javascript
const container = document.querySelector('#example2');

Handsontable
  .renderers
  .registerRenderer('customStylesRenderer', (hotInstance, TD, ...rest) => {
    Handsontable.renderers.getRenderer('text')(hotInstance, TD, ...rest);

    TD.style.fontWeight = 'bold';
    TD.style.color = 'green';
    TD.style.background = '#d7f1e1';
  });

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  cell: [
    {
      row: 0,
      col: 0,
      renderer: 'customStylesRenderer',
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Custom cell borders

To enable the custom borders feature, set the `customBorders` option. This can either be set as `true` or initialized as an array with a pre-defined setup.

To initialize Handsontable with predefined custom borders, provide the cell coordinates and border styles in form of an array:

- with row/col pairs: `{ row: 2, col: 2, start: { /*...*/ } }`
- or with range details: `{ range: { from: { row: 1, col: 1 }, to: { row: 3, col: 4 } }, start: { /*...*/ } }`

Depending on the form of the cell coordinates you picked, you can use the following options to change the border styles:

::: warning
The `left` and `right` properties are renamed to `start` and `end` in Handsontable 12.0.0. The change allows defining border styles using the same API for both [layout direction](@/guides/internationalization/layout-direction.md) modes. The properties `left` and `right` only work in the left-to-right mode and they cannot be mixed with `start` and `end`.
:::

For the list of available settings and methods, visit the [API reference](@/api/custom-borders.md).

::: example #example3
```js
const container = document.getElementById('example3');

const hot = Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 6),
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 'auto',
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
      bottom: {
        width: 2,
        color: 'red'
      },
      start: {
        width: 2,
        color: 'orange'
      },
      end: {
        width: 2,
        color: 'magenta'
      }
    },
    {
      row: 2,
      col: 2,
      start: {
        width: 2,
        color: 'red'
      },
      end: {
        width: 1,
        color: 'green'
      }
    }
  ]
});
```
:::
