---
id: demo-comments_
title: Comments
sidebar_label: Comments
slug: /demo-comments_
---

function getData() { return \[ \['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'\], \['2017', 10, 11, 12, 13, 15, 16\], \['2018', 10, 11, 12, 13, 15, 16\], \['2019', 10, 11, 12, 13, 15, 16\], \['2020', 10, 11, 12, 13, 15, 16\], \['2021', 10, 11, 12, 13, 15, 16\] \]; }

*   [Enabling the plugin](#enable)
*   [Adding the comments via the Context Menu](#context-menu)
*   [Setting up pre-set comments](#preset-comments)
*   [API](#api)
*   [Example implementation](#example)

The _Comments_ plugin makes it possible to easily add, edit and remove comments in Handsontable.

### Enabling the plugin

To use the plugin, you'll need to set the `comments` property to `true`. It'll enable the plugin and add all the needed context menu items. For example:

    let hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      comments: true
    });

### Adding the comments via the Context Menu

After you've enabled the plugin, the [Context Menu](https://handsontable.com/docs/8.2.0/./demo-context-menu.html) gains a few new items:

*   Add/Edit comment
*   Delete comment
*   Read only comment

I think all of them are pretty self-explanatory.

### Setting up pre-set comments

You can also pre-define comments for your table. As comments are stored in the table's/column's/cell's meta data object, you can declare it as any other property of that type.  
For example:

    cell: [
      {row: 1, col: 1, comment: {value: 'Hello world!'}}
    ]

In this example we're adding a "Hello world!" comment to a cell at (1,1).

### API

You can add, remove and modify most of the comment-related information using the API. For More info, head to [our Comments documentation](https://handsontable.com/docs/8.2.0/./Comments.html).

### Example implementation

Edit Log to console

var container = document.getElementById('example1'), hot1; hot1 = new Handsontable(container, { data: getData(), rowHeaders: true, colHeaders: true, contextMenu: true, comments: true, cell: \[ {row: 1, col: 1, comment: {value: 'Some comment'}}, {row: 2, col: 2, comment: {value: 'More comments'}} \] });

