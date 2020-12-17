---
id: demo-bind-rows-headers
title: Bind rows with headers
sidebar_label: Bind rows with headers
slug: /demo-bind-rows-headers
---

*   [Overview](#overview)
*   [Quick setup](#setup)

* * *

### Overview

The _Bind rows with headers_ plugin allows, as it's name suggests, binding the table rows with their headers.  
If the plugin is enabled, the table row headers will "stick" to the rows. For example, if you move a row, the header content will move with it. Basically, if at the initialization row `0` has a header titled `"A"`, it will be attached to it, no matter what you do with the table.

### Quick setup

To enable the plugin, simply set the `bindRowsWithHeaders` property to `true`, when initializing Handsontable.  
Try moving the rows in the example below, to see what this plugin actually does.

Edit in jsFiddle Log to console

var generateDataObj = function(rows, columns) { var data = \[\]; var number = 0; if (!rows) { rows = 3; } if (!columns) { columns = 7; } for (var i = 0; i < rows; i++) { data\[i\] = \[\]; for (var j = 0; j < columns; j++) { data\[i\]\[j\] = number++; } } for (i = 0; i < 2; i++) { data.push(\[\]); } return data; }; var example1 = document.getElementById('example1'); var hot = new Handsontable(example1, { data: generateDataObj(), colHeaders: true, rowHeaders: true, contextMenu: true, manualRowMove: true, bindRowsWithHeaders: 'strict' });

