---
id: 51aacis1
title: Export to CSV
metaTitle: Export to CSV - JavaScript Data Grid | Handsontable
description: Export your grid's raw data to the CSV format, as a downloadable file, a blob, or a string. Customize your export using Handsontable's configuration options.
permalink: /export-to-csv
canonicalUrl: /export-to-csv
tags:
  - export to file
  - save file
react:
  id: sfxo3g54
  metaTitle: Export to CSV - React Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
---

# Export to CSV

Export your grid's raw data to the CSV format, as a downloadable file, a blob, or a string. Customize your export using Handsontable's configuration options.

[[toc]]

## Examples

Mind that CSV exports contain only raw data, and don't include formulas, styling, or formatting information.

### Export to file

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example1.html)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example1.tsx)

:::

:::


### Export as a JavaScript Blob object

Open a console in browser developer tools to see the result for the below example.

::: only-for javascript

::: example #example2 --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example2.html)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example2.tsx)

:::

:::

### Export as a string

Open a console in browser developer tools to see the result for the below example.

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example3.html)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example3.js)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example3.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example3.tsx)

:::

:::

## Available methods

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

The plugin exposes the following methods to export data.

- [`downloadFile(format, options)`](@/api/exportFile.md#downloadfile) - allows you to generate a downloadable file, directly in your browser.
- [`exportAsBlob(format, options)`](@/api/exportFile.md#exportasblob) - allows you to export a JavaScript Blob object.
- [`exportAsString(format, options)`](@/api/exportFile.md#exportasstring) - allows you to export data as a string.

All of them accept the same arguments:

### format `String`

This is required to prepare a predefined settings object. We currently allow for only `'csv'` to be used.

### options `Object`

This is an optional argument. It contains a set of supported options and extends the predefined CSV configuration. For the complete list of options that you can use, see [available options](#available-options-in-the-export-configuration).

## Available options in the export configuration

Below you can find all supported options:

### bom `Boolean`

Allows you to export data with a BOM signature.

Note that this property will prepend content with the UTF-16BE BOM signature (_FE FF_). The browser will convert the signature to the UTF-8 value (_EF BB BF_) automatically.

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

You can use this property in the `downloadFile()` method.

Default value: `'csv'`

### filename `String`

Allows you to define the file name.

You can use predefined placeholders, which will be replaced by the date.

You can use this property in the `downloadFile()` method.

Default value: `'Handsontable [YYYY]-[MM]-[DD]'`

### mimeType `String`

Allows you to define the MIME type.

You can use this property in the `downloadFile()` and `exportAsBlob()` methods.

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

## Related API reference

- Plugins:
  - [`ExportFile`](@/api/exportFile.md)
