---
title: Setting options
permalink: /next/setting-options
canonicalUrl: /setting-options
---

# {{ $frontmatter.title }}

[[toc]]

## Introduction to the `Settings` object

- krotko o settings object - jak mozna przekazywac opcje, gdzie jest znalezc
- wspomniec o core i plugins
- wspomniec i podlinkowac cascade config (u dolu strony)
- ta strona idealnie, gdyby pokazywala jak mozna zastosowac opcje do: cell, range of cells, row, row range (adjacent and non-adjacent), columns (adjacent and non-adjacent), entire grid. Idealnie gdyby pokazala tez jak to zrobic za pomoca funkcji.
- Praca z danymi jest najwazniejsza czescia grida. Powinna byc super jasne jak: zaladowac dane, aktualizowac dane, zapisac dane, odczytac dane. Powinno byc jasne jak praco

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
