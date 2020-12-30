---
id: demo-stretching
title: Stretching columns
sidebar_label: Stretching columns
slug: /demo-stretching
---

This page shows how to configure Handsontable column stretching:

*   [StretchH `last` column](#page-last)
*   [StretchH `all` columns](#page-stretch)
*   [StretchH `none` (default)](#page-none)

### StretchH `last` column

The following example creates a table with vertical scrollbar by specifying only the container height and `overflow: hidden` in CSS. The last column is stretched using `stretchH: 'last'` option.

Edit Log to console

var container1 = document.getElementById('example1'), hot1; hot1 = new Handsontable(container1, { data: Handsontable.helper.createSpreadsheetData(40, 6), colWidths: 47, rowHeaders: true, colHeaders: true, stretchH: 'last', contextMenu: true });

### StretchH `all` columns

If the table content is not as wide as the container width, the table will be stretched to the container width. The default horizontal stretch model is to stretch the last column only (by using `stretchH: 'last'` option).

Other possible stretch modes are `all` (stretches all columns equally, used in the below example) and `none` (not stretching).

Edit Log to console

var container2 = document.getElementById('example2'), hot2; hot3 = new Handsontable(container2, { data: Handsontable.helper.createSpreadsheetData(40, 6), colWidths: \[47, 47, 47, 47, 47, 47, 47\], // can also be a number or a function rowHeaders: true, colHeaders: true, stretchH: 'all', contextMenu: true });

### StretchH `none` (default)

Edit Log to console

var container3 = document.getElementById('example3'), hot3; hot3 = new Handsontable(container3, { data: Handsontable.helper.createSpreadsheetData(40, 6), colWidths: \[47, 47, 47, 47, 47, 47, 47\], // can also be a number or a function rowHeaders: true, colHeaders: true, stretchH: 'none', // actually you don't have to declare it because it is default contextMenu: true });

