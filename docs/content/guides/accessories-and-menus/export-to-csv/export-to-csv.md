---
type: how-to
title: Export to CSV
metaTitle: Export to CSV | Handsontable DataGrid for JavaScript
description: Export your grid's values to a CSV file, a Blob, or a string, with options for headers, hidden rows and columns, delimiters, and value sanitization.
permalink: /export-to-csv
canonicalUrl: /export-to-csv
tags:
  - export to file
  - save file
react:
  metaTitle: Export to CSV | Handsontable DataGrid for React
angular:
  metaTitle: Export to CSV | Handsontable DataGrid for Angular
vue:
  metaTitle: Export to CSV | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: updated
---

Export your grid's values to the CSV format, as a downloadable file, a Blob, or a string. CSV holds values only: no formulas, styling, or number formatting, so a formula cell exports its computed result.

[[toc]]

## Prerequisites

- Register the `ExportFile` plugin (it is part of `registerAllModules()`). The export methods work without any `exportFile` setting; set `exportFile` to any value, for example `exportFile: true`, to add the **Export** item to the default [context menu](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md#context-menu); with a custom `contextMenu` item list, include `'export_file'`.
- The first two examples hide rows and columns `1`, `3`, and `5`, with indicators on, so you can see which export includes them.

## Steps

### 1. Download a file

`downloadFile('csv', options)` builds the file and starts the download. This example includes the hidden rows and columns.

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

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example1.html)

:::
:::

::: only-for vue
::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-csv/vue/example1.vue)

:::
:::

### 2. Export as a Blob or a string

`exportAsBlob('csv', options)` returns a `Blob`, for example to upload; `exportAsString('csv', options)` returns the text. This example leaves the hidden rows and columns out. Open the browser console to see the result.

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

::: only-for angular
::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example2.html)

:::
:::

::: only-for vue
::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-csv/vue/example2.vue)

:::
:::

### 3. Prevent CSV injection

A spreadsheet application reads a CSV cell that starts with `=`, `+`, `-`, or `@` as a formula ([OWASP: CSV injection](https://owasp.org/www-community/attacks/CSV_Injection)). Set the [`sanitizeValues`](#options) option when the data comes from users. This example shows the four modes.

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

::: only-for angular
::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example3.ts)
@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example3.html)

:::
:::

::: only-for vue
::: example #example3 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-csv/vue/example3.vue)

:::
:::

## Result

You can export the grid as a file, a Blob, or a string, choose what the file holds, and keep user-provided values from running as formulas.

## Options

Pass these options as the second argument of any export method.

| Option | Type, default | Description |
|---|---|---|
| `bom` | `boolean`, `true` | Prepend the UTF-8 byte order mark (`EF BB BF`). It is prepended to the string `exportAsString()` returns too. |
| `colHeaders` | `boolean`, `false` | Include the column headers. With [nested headers](@/api/nestedHeaders.md), every layer becomes one header line. Column headers are always quoted. See [Nested headers](#nested-headers). |
| `rowHeaders` | `boolean`, `false` | Include the row headers as the first column. |
| `exportHiddenColumns`, `exportHiddenRows` | `boolean`, `false` | Include hidden columns or rows. `'hide'`, which the XLSX export accepts, counts as `false` here. |
| `range` | `number[]`, whole grid | `[startRow, startColumn, endRow, endColumn]` in visual indexes. |
| `columnDelimiter` | `string`, `','` | Column delimiter. A value that holds it, a double quote, or a line break is quoted. |
| `rowDelimiter` | `string`, `'\r\n'` | Row delimiter. |
| `filename` | `string`, `'Handsontable [YYYY]-[MM]-[DD]'` | File name without the extension. The placeholders become the current date. Used by `downloadFile()` and `downloadFileAsync()`. |
| `fileExtension` | `string`, `'csv'` | File extension, used by the same two methods. |
| `mimeType` | `string`, `'text/csv'` | MIME type of the Blob. The Blob's type also carries `;charset=` and the `encoding` option, `text/csv;charset=utf-8` by default. |
| `encoding` | `string`, `'utf-8'` | Charset label of the Blob and the download. The content is always UTF-8. |
| `sanitizeValues` | `boolean \| RegExp \| Function`, `false` | `true` prefixes a value that starts with `=`, `+`, `-`, `@`, a tab, or a carriage return with `'`, following the [OWASP](https://owasp.org/www-community/attacks/CSV_Injection) rules. A `RegExp` prefixes the values it matches. A function receives the value and returns the replacement. Any of the three also quotes every non-empty cell. |

## Nested headers

With the [`nestedHeaders`](@/api/options.md#nestedheaders) option, `colHeaders: true` exports every header layer. Each layer becomes one header line, and a group label repeats across every column it spans, so a spreadsheet shows the group above each of its columns.

```javascript
const hot = new Handsontable(container, {
  data: [[1, 2, 3, 4]],
  colHeaders: true,
  nestedHeaders: [
    [{ label: '2024', colspan: 2 }, { label: '2025', colspan: 2 }],
    ['Q1', 'Q2', 'Q1', 'Q2'],
  ],
});

hot.getPlugin('exportFile').downloadFile('csv', { colHeaders: true });
// The file receives:
// "2024","2024","2025","2025"
// "Q1","Q2","Q1","Q2"
// 1,2,3,4
```

A group shrinks to the columns the export includes, so hidden columns follow `exportHiddenColumns`. A `range` that starts inside a group leaves that group's cells empty on the parent line, so every header line keeps the data's column count.

## Headers as plain text

A column header is also its display string. A header of `'<b>Total</b>'` renders as **Total**, but the export writes the value it was given, so the file receives the literal `<b>Total</b>`. Set the grid's [`textExtractor`](@/api/options.md#textextractor) option to `true` to export the displayed text instead:

```javascript
const hot = new Handsontable(container, {
  data: [[1, 2]],
  colHeaders: ['<b>Total</b>', 'Count'],
  textExtractor: true,
});

hot.getPlugin('exportFile').downloadFile('csv', { colHeaders: true });
// The file receives:
// "Total","Count"
// 1,2
```

`textExtractor` is a grid option, not an export option. It applies to column, row, and nested headers, in CSV and in Excel. Cell values are left alone: a value such as `a<b` reaches the file unchanged.

Extraction turns HTML entities back into characters, so a header stored as `&#61;SUM(A1)` reaches the file as `=SUM(A1)`, which a spreadsheet reads as a formula. Set [`sanitizeValues`](#options) when you export headers from untrusted sources. To extract headers differently per surface, pass `textExtractor` a function `(content, source)` instead of `true`; `source` is `'ExportFile.rowHeader'` for a row header and `'ExportFile.columnHeader'` for a column header in an export, and `'CopyPaste.columnHeader'` when headers are copied. Return `content` for any other `source`.

## Methods

Each export method takes the format first, `'csv'` or `'xlsx'`, and an options object second.

- [`downloadFile(format, options)`](@/api/exportFile.md#downloadfile) - starts a download. Synchronous, CSV only.
- [`downloadFileAsync(format, options)`](@/api/exportFile.md#downloadfileasync) - starts a download and returns a `Promise`. CSV and XLSX.
- [`exportAsBlob(format, options)`](@/api/exportFile.md#exportasblob) - returns a `Blob`. CSV only; it throws for `'xlsx'`.
- [`exportAsBlobAsync(format, options)`](@/api/exportFile.md#exportasblobasync) - returns a `Promise` of a `Blob`. CSV and XLSX.
- [`exportAsString(format, options)`](@/api/exportFile.md#exportasstring) - returns the text. CSV only.
- [`supportsExportFormat(format)`](@/api/exportFile.md#supportsexportformat) - `true` when the format can be written.

::: only-for react

Get the plugin from the `hotInstance` of your `HotTable` ref: `hotRef.current?.hotInstance?.getPlugin('exportFile')`. See [Instance methods](@/guides/getting-started/react-methods/react-methods.md).

:::

::: only-for vue

Get the plugin from the `hotInstance` of your `HotTable` template ref: `hotRef.value?.hotInstance?.getPlugin('exportFile')`. See [Referencing the Handsontable instance](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md).

:::

## Related articles

**Related guides**

<div class="boxes-list">

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)

</div>

**Related blog articles**

<div class="boxes-list gray">

- [Handsontable 15.3.0: CSV sanitization, accessibility updates, and 30+ fixes](https://handsontable.com/blog/handsontable-15.3.0-csv-sanitization-accessibility-updates-and-30-fixes)

</div>

## Related API reference

**Configuration options**

<div class="boxes-list">

- [exportFile](@/api/options.md#exportfile)

</div>

**Plugins**

<div class="boxes-list">

- [ExportFile](@/api/exportFile.md)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
