---
title: Setting options
permalink: /8.3/setting-options
canonicalUrl: /setting-options
---

# {{ $frontmatter.title }}

[[toc]]

## Introduction to cell options

Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell` array passed to the Handsontable constructor. Example:
```js
var hot = new Handsontable(document.getElementById('example'), {
  cell: [
    {row: 0, col: 0, readOnly: true}
  ]
});
```
Or using cells function property to the Handsontable constructor. Example:
```js
var hot = new Handsontable(document.getElementById('example'), {
  cells: function (row, col, prop) {
    var cellProperties = {}
    if (row === 0 && col === 0) {
      cellProperties.readOnly = true;
    }
    return cellProperties;
  }
})
```
## How does the Cascading Configuration work?

Handsontable is using Cascading Configuration, which is a fast way to provide configuration options for the whole table, along with its columns and particular cells.

Consider the following example:
```js
var hot = new Handsontable(document.getElementById('example'), {
  readOnly: true,
  columns: [
    {readOnly: false},
    {},
    {}
  ],
  cells: function (row, col, prop) {
    var cellProperties = {}
    if (row === 0 && col === 0) {
      cellProperties.readOnly = true;
    }
    return cellProperties;
  }
});
```
The above notation will result in all TDs being read only, except for first column TDs which will be editable, except for the TD in top left corner which will still be read only.

## The cascading configuration model

The Cascading Configuration model is based on prototypal inheritance. It is much faster and memory efficient compared to the previous model that used jQuery extend. See it yourself: [http://jsperf.com/extending-settings](http://jsperf.com/extending-settings)

* **Constructor**

    Configuration options that are provided using first-level
    ```js
    new Handsontable(document.getElementById('example'), {
      option: 'value'
    });
    ```
    and `updateSettings` method.

* **Columns**

    Configuration options that are provided using second-level object
    ```js
    new Handsontable(document.getElementById('example'), {
      columns: {
        option: 'value'
      }
    });
    ```

* **Cells**

    Configuration options that are provided using second-level function
    ```js
    new Handsontable(document.getElementById('example'), {
      cells: function(row, col, prop) {
      }
    });
    ```
