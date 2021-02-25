---
title: Customizing borders
permalink: /8.3/customizing-borders
canonicalUrl: /customizing-borders
---

# {{ $frontmatter.title }}

To enable the custom borders feature, set the `customBorders` option. It could be set as `true` or initialized as an array with predefined setup.

To initialize Handsontable with predefined custom borders, provide cells coordinates and border styles in form of an array:

* with row/col pairs: `{row: 2, col: 2, left: { /*...*/ }}`
* or with range details: `{range: {from: {row: 1, col: 1}, to:{row: 3, col: 4}}, left: { /*...*/ }}`

**See full example below:**

Edit Log to console

::: example #example1
```js
var container = document.getElementById('example1'),
  hot;

hot = Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(20, 20),
  rowHeaders: true,
  fixedColumnsLeft: 2,
  fixedRowsTop: 2,
  colHeaders: true,
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
