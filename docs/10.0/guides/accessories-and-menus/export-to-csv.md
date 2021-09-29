---
title: Export to CSV
metaTitle: Export to CSV - Guide - Handsontable Documentation
permalink: /10.0/export-to-csv
canonicalUrl: /export-to-csv
tags:
  - export to file
  - save file
---

# Export to CSV

[[toc]]

## Overview

The plugin allows you to export data from Handsontable into a `CSV` file.

## Available methods

The plugin exposes the following methods to export data.

* [**downloadFile(format, options)**](@/api/exportFile.md#downloadfile) - allows you to generate a downloadable file, directly in your browser.
* [**exportAsBlob(format, options)**](@/api/exportFile.md#exportasblob) - allows you to export a JavaScript Blob object.
* [**exportAsString(format, options)**](@/api/exportFile.md#exportasstring) - allows you to export data as a string.

All of them accept the same arguments:

### format `String`

This is required to prepare a predefined settings object. We currently allow for only `'csv'` to be used.

### options `Object`

This is an optional argument. It contains a set of supported options and extends the predefined `CSV` configuration. For the complete list of options that you can use, see [available options](#available-options-in-the-export-configuration).

## Available options in the export configuration

Below you can find all supported options:

### bom `Boolean`

Allows you to export data with a BOM signature.

**Please note:** This property will prepend content with the UTF-16BE BOM signature (_FE FF_). The browser will convert the signature to the UTF-8 value (_EF BB BF_) automatically.

You can use this property in all of the [available methods](#available-methods).

Default value: `true`

### columnDelimiter `String`

Allows you to define the columns delimiter.

You can use this property in all of the [available methods](#available-methods).

Default value: `','`

### columnHeaders `Boolean`

When set to `true`, includes column headers in the exported data.

You can use this property in all of the [available methods](#available-methods).

The `columnHeaders` option doesn't support the [`NestedHeaders` plugin](@/api/nestedHeaders.md).

Default value: `false`

### exportHiddenColumns `Boolean`

Allows you to export data from hidden columns.

You can use this property in all of the [available methods](#available-methods).

Default value: `false`

### exportHiddenRows `Boolean`

Allows you to export data from hidden rows.

You can use this property in all of the [available methods](#available-methods).

Default value: `false`

### fileExtension `String`

Allows you to define the file extension.

You can use this property in the **downloadFile** method.

Default value: `'csv'`

### filename `String`

Allows you to define the file name.

You can use predefined placeholders, which will be replaced by the date.

You can use this property in the **downloadFile** method.

Default value: `'Handsontable [YYYY]-[MM]-[DD]'`

### mimeType `String`

Allows you to define the MIME type.

You can use this property in the **downloadFile** and **exportAsBlob** methods.

Default value: `'text/csv'`

### range `Array`

Allows you to define a range of dataset to export. It's represented by an array of numeric, visual indexes `[startRow, startColumn, endRow, endColumn]`.

You can use this property in all of the [available methods](#available-methods).

Default value: `'text/csv'`

### rowDelimiter `String`

Allows you to define rows delimiter.

You can use this property in all of the [available methods](#available-methods).

Default value: `'\r\n'`

### rowHeaders `Boolean`

Allows you to export data with their row header.

You can use this property in all of the [available methods](#available-methods).

Default value: `false`

## Live examples

### Export to file

::: example #example1 --html 1 --js 2
```html
<div id="example1"></div>

<div class="controls">
  <button id="export-file">Download CSV</button>
</div>
```
```js
const container = document.querySelector('#example1');
const button = document.querySelector('#export-file');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(7, 7),
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: { rows: [1, 3, 5], indicators: true },
  hiddenColumns: { columns: [1, 3, 5], indicators: true },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

const exportPlugin = hot.getPlugin('exportFile');

button.addEventListener('click', () => {
  exportPlugin.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    columnHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    rowHeaders: true
  });
});
```
:::

### Export as a JavaScript Blob object

Open a console in browser developer tools to see the result for the below example.

::: example #example2 --html 1 --js 2
```html
<div id="example2"></div>

<div class="controls">
  <button id="export-blob">Export as a Blob</button>
</div>
```
```js
const container = document.querySelector('#example2');
const button = document.querySelector('#export-blob');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(7, 7),
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: { rows: [1, 3, 5], indicators: true },
  hiddenColumns: { columns: [1, 3, 5], indicators: true },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

const exportPlugin = hot.getPlugin('exportFile');

button.addEventListener('click', () => {
  const exportedBlob = exportPlugin.exportAsBlob('csv', {
    bom: false,
    columnDelimiter: ',',
    columnHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    rowHeaders: true
  });

  console.log(exportedBlob);
});
```
:::

### Export as a string

Open a console in browser developer tools to see the result for the below example.

::: example #example3 --html 1 --js 2
```html
<div id="example3"></div>

<div class="controls">
  <button id="export-string">Export as a string</button>
</div>
```
```js
const container = document.querySelector('#example3');
const button = document.querySelector('#export-string');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(7, 7),
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: { rows: [1, 3, 5], indicators: true },
  hiddenColumns: { columns: [1, 3, 5], indicators: true },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

const exportPlugin = hot.getPlugin('exportFile');

button.addEventListener('click', () => {
  const exportedString = exportPlugin.exportAsString('csv', {
    bom: false,
    columnDelimiter: ',',
    columnHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    rowDelimiter: '\r\n',
    rowHeaders: true
  });

  console.log(exportedString);
});
```
:::
