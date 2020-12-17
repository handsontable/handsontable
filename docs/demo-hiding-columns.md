---
id: demo-hiding-columns
title: Hiding columns
sidebar_label: Hiding columns
slug: /demo-hiding-columns
---

*   [Overview](#overview)
*   [Setup](#setup)
*   [Additional options](#options)
*   [Example](#examples)
*   [API Examples](#api)

* * *

### Overview

The _Hidden Columns_ plugin allows hiding specific columns from the table. Columns being hidden **are included** in a `DataMap` (gets by the [getData](/docs/8.2.0/Core.html#getData) method), but they **aren't rendered**.

### Quick setup

The `hiddenColumns` parameter accepts an object. To provide the columns to hide, you need to specify the `columns` property for the object - it should be defined as an array of numbers, which represent the indexes of columns that need to be hidden.  
  
See [the examples section](#examples) for more details.

### Additional options

The plugin allows displaying hidden column indicators in the headers, to notify the user which columns have been hidden.  
To enable them, set the `indicators` property in the plugin's configuration object to `true`.  
  
**Important note**: if you want to use both `nestedHeaders` and `hiddenColumns` alongside `indicators` you need to enable `colHeaders` option. Otherwise, the `indicators` will not appear.  
  
See [the examples section](#examples) for more details.

You can change the selection area of copy/paste range by setting `copyPasteEnabled` property to `true` or `false`. By default this property is set to `true`. If set to `false`, then hidden columns are being skipped for copy/paste actions.

You can show/hide certain columns straight from the [Context menu](/docs/8.2.0/demo-context-menu.html) using the following keys: `hidden_columns_show` and `hidden_columns_hide`.  
  
See [the examples section](#examples) for more details.

### Example

Edit in jsFiddle Log to console

var example1 = document.getElementById('example1'); var hot = new Handsontable(example1, { data: Handsontable.helper.createSpreadsheetData(5,12), colHeaders: true, rowHeaders: true, contextMenu: true, hiddenColumns: { columns: \[3, 5, 9\], indicators: true } });

### API examples

You can access the plugin instance by calling

    var plugin = hot.getPlugin('hiddenColumns');

To hide a single column, call the `hideColumn` method of the plugin object:

    plugin.hideColumn(4);

To hide multiple columns, you can either pass them as arguments to the `hideColumn` method, or pass an array of indexes to the `hideColumns` method:

    plugin.hideColumn(0, 4, 6);
    // or
    plugin.hideColumns([0, 4, 6]);

To restore the hidden column(s), use the following methods:

    plugin.showColumn(4);

  

    plugin.showColumn(0, 4, 6);

  

    plugin.showColumns([0, 4, 6]);

To see the changes you made, call `hot.render();` to re-render the table.

