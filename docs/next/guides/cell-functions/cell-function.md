---
title: Cell function
metaTitle: Cell function - Guide - Handsontable Documentation
permalink: /next/cell-function
canonicalUrl: /cell-function
---

# Cell function

[[toc]]

## Overview

With every cell in the Handsontable there are 3 associated functions:

* [renderer](#renderer)
* [editor](#editor)
* [validator](#validator)

Each of those functions are responsible for a different cell behavior. You can define them separately or use a [cell type](#cell-type) to define all three at once.

## Renderer

Handsontable does not display the values stored in the data source directly. Instead, every time a value from data source needs to be displayed in a table cell, it is passed to the cell `renderer` function, together with the table cell object of type `HTMLTableCellElement` (DOM node), along with other useful information.

`Renderer` is expected to format the passed value and place it as a content of the cell object. `Renderer` can also alter the cell class list, i.e. it can add a `htInvalid` class to let the user know, that the displayed value is invalid.

## Editor

Cell editors are the most complex cell functions. We have prepared a separate page [custom cell editor](@/guides/cell-functions/cell-editor.md) explaining how cell edit works and how to write your own cell editor.

## Validator

Cell validator can be either a function or a regular expression. A cell is considered valid, when the validator function calls a `callback` (passed as one of the `validator` arguments) with `true` or the validation regex [test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test) method returns `true`. Because the validity of a value is determined only by the argument that is passed to `callback`, `validator` function can be synchronous or asynchronous.

Contrary to `renderer` and `editor` functions, the `validator` function doesn't have to be defined for each cell. If the `validator` function is not defined, then a cell value is always valid.

## Cell type

Manually defining those functions for cells or columns would be tedious, so to simplify the configuration, Handsontable introduced [cell types](@/guides/cell-types/cell-type.md).

## Cell functions getters

If, for some reason, you have to get the `renderer`, `editor` or `validator` function of specific cell you can use standard `getCellMeta(row, col)` method to get all properties of particular cell and then refer to cell functions like so:

```js
const container = document.querySelector('#container');

// get cell properties for cell [0, 0]
const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer; // get cell renderer
cellProperties.editor; // get cell editor
cellProperties.validator; // get cell validator
```

However, you have to remember that `getCellMeta()` return cell properties "as they are", which means that if you use cell type to set cell functions, instead of defining functions directly those cell functions will be `undefined`:

```js
const container = document.querySelector('#container');

const hot = new Handsontable(container, {
  columns: [{
    type: 'numeric'
  }]
});

// get cell properties for cell [0, 0]
const cellProperties = hot.getCellMeta(0, 0);

cellProperties.renderer; // undefined
cellProperties.editor; // undefined
cellProperties.validator; // undefined
cellProperties.type; // "numeric"
```

To get the actual cell function use appropriate _cell function getter_:

* `getCellRenderer(row, col)`
* `getCellEditor(row, col)`
* `getCellValidator(row, col)`

Those functions will always return an appropriate value, regardless of whether cell functions have been defined directly or using a cell type.
