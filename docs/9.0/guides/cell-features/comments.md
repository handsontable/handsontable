---
title: Comments
metaTitle: Comments - Guide - Handsontable Documentation
permalink: /9.0/comments
canonicalUrl: /comments
tags:
  - notes
---

# Comments

[[toc]]

## Overview

This feature makes it possible to add, edit and remove comments in Handsontable easily.

## Enabling the plugin

Set the `comments` property to `true` to enable the feature and add all the needed context menu items. For example:

```js
const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  comments: true
});
```

## Adding the comments via the Context Menu

After you've enabled the plugin, the [Context Menu](@/guides/accessories-and-menus/context-menu.md) gains a few new items:

* Add/Edit comment
* Delete comment
* Read-only comment

## Setting up pre-set comments

You can also pre-define comments for your table. Comments are stored in the table's/column's/cell's metadata object and can be declared as any value of that type. For example:

```js
cell: [
  { row: 1, col: 1, comment: { value: 'Hello world!' } }
]
```

In this example, the comment "Hello world!" is added to the cell at `(1,1)`.

## Basic example

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16]
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: true,
  cell: [
    { row: 1, col: 1, comment: { value: 'Some comment' } },
    { row: 2, col: 2, comment: { value: 'More comments' } }
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Make a comment read-only

By default, all comments are editable. To change this, set the `readOnly` parameter to `true` when adding a comment. This example makes the "Tesla" comment attached to a cell read-only, whereas the "Honda" comment attached to another cell is editable.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Toyota', 'Honda', 'Ford'],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: true,
  cell: [
    { row: 0, col: 1, comment: { value: 'A read-only comment.', readOnly: true } },
    { row: 0, col: 3, comment: { value: 'You can edit this comment' } }
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Set a comment box's size

To set the width and height of a comment box, use the `style` parameter.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: true,
  cell: [
    { row: 1, col: 1, comment: { value: 'Some comment' } },
    // add the `style` parameter
    { row: 2, col: 2, comment: { value: 'Comment 200x50 px', style: { width: 200, height: 50 } } }
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Set a delay for displaying comments

To display comments after a pre-configured time delay, use the `displayDelay` parameter.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Toyota', 'Honda', 'Ford'],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  comments: { 
    // on mouseover, wait 2 seconds before the comment box displays
    displayDelay: 2000,
  },
  cell: [
    { row: 1, col: 1, comment: { value: 'Some comment' } },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
