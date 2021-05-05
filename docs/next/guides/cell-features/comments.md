---
title: Comments
permalink: /next/comments
canonicalUrl: /comments
tags:
  - notes
---

# Comments

[[toc]]

The _Comments_ plugin makes it possible to easily add, edit and remove comments in Handsontable.

## Enabling the plugin

To use the plugin, you'll need to set the `comments` property to `true`. It'll enable the plugin and add all the needed context menu items. For example:

```js
const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  comments: true
});
```

## Adding the comments via the Context Menu

After you've enabled the plugin, the [Context Menu](context-menu.md) gains a few new items:

* Add/Edit comment
* Delete comment
* Read only comment

I think all of them are pretty self-explanatory.

## Setting up pre-set comments

You can also pre-define comments for your table. As comments are stored in the table's/column's/cell's meta data object, you can declare it as any other property of that type.
For example:

```js
cell: [
  {row: 1, col: 1, comment: {value: 'Hello world!'}}
]
```

In this example we're adding a "Hello world!" comment to a cell at (1,1).

## API

You can add, remove and modify most of the comment-related information using the API. For More info, head to [our Comments documentation](comments.md).

## Example implementation

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
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
  licenseKey: 'non-commercial-and-evaluation',
  cell: [
    {row: 1, col: 1, comment: {value: 'Some comment'}},
    {row: 2, col: 2, comment: {value: 'More comments'}}
  ]
});
```
:::

## Make a comment read-only

This example makes the comment attached to a cell that contain the word "Tesla" read-only.

You can compare it with the comment inside a cell with "Honda" wording.

::: example #example
```js
const container = document.querySelector('#example');

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
  licenseKey: 'non-commercial-and-evaluation',
  cell: [
    {row: 0, col: 1, comment: {value: 'A read-only comment.', readOnly: true}},
    {row: 0, col: 3, comment: {value: 'You can edit this comment'}}
  ]
});
```
:::
