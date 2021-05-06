---
title: Setting options
permalink: /next/setting-options
canonicalUrl: /setting-options
---

# Setting options

[[toc]]

## Overview

## Available options

Opisać core i plugins i wrzucić linki do reference do obu

Najlepiej jakby to było dostępne też dla wrapperów

## The cascading configuration

### Entire grid

Contructor

### Single cell

Address by row / col order; A1, B2; ID column and row

### Single range of cells

### Multiple ranges of cells

### Single column

Address by col order; or ID

### Single range of columns

### Multiple ranges of columns

### Single row

Address by order or ID (from column 1)

### Single range of rows

### Multiple ranges of rows



## Introduction to cell options

Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell` array passed to the `Handsontable` constructor.

```js
var hot = new Handsontable(document.getElementById('example'), {
  cell: [
    {row: 0, col: 0, readOnly: true}
  ]
});
```

Alternatively, use cells function property to the `Handsontable` constructor.

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

## The cascading configuration

Handsontable utilizes cascading configuration, which is a fast way to provide configuration options for the entire grid, along with its columns and particular cells.

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

The above notation will result in all TDs being read only, except for first column TDs which will be editable, except for the TD in top left corner which will still be read-only.

## The cascading configuration model

The cascading configuration model is based on prototypal inheritance.

### Constructor

Configuration options that are provided using first-level and `updateSettings` method.

```js
new Handsontable(document.getElementById('example'), {
  option: 'value'
});
```
  

### Columns

Configuration options that are provided using second-level object.

```js
new Handsontable(document.getElementById('example'), {
  columns: {
    option: 'value'
  }
});
```

### Cells

Configuration options that are provided using second-level function.

```js
new Handsontable(document.getElementById('example'), {
  cells: function(row, col, prop) {
  }
});
```
