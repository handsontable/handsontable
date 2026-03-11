---
id: f0g2q7eh
title: Export to Excel
metaTitle: Export to Excel - JavaScript Data Grid | Handsontable
description: Export your grid's data to XLSX as a downloadable file or as a Blob. Configure headers, hidden rows and columns, ranges, and formulas.
permalink: /export-to-excel
canonicalUrl: /export-to-excel
tags:
  - export to file
  - xlsx
react:
  id: 5k8umr21
  metaTitle: Export to Excel - React Data Grid | Handsontable
angular:
  id: b2dr6s9u
  metaTitle: Export to Excel - Angular Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
---

# Export to Excel

Export your grid data to XLSX as a downloadable file or as a Blob.

[[toc]]

## Example

### Export to file

::: only-for javascript
::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example1.html)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example1.html)

:::
:::

## Available methods

The plugin exposes the following methods to export XLSX data:

- `downloadFile(options)` - generate a downloadable XLSX file.
- `exportAsBlob(options)` - export a JavaScript Blob object.
- `exportAsString(options)` - export XLSX bytes as a string.

## Available options in the export configuration

| Property | Type / Default | Description |
| --- | --- | --- |
| `columnHeaders` | `Boolean`, default `false` | Include column headers. |
| `exportHiddenColumns` | `Boolean`, default `false` | Include hidden columns. |
| `exportHiddenRows` | `Boolean`, default `false` | Include hidden rows. |
| `fileExtension` | `String`, default `'xlsx'` | File extension. Used by `downloadFile()`. |
| `filename` | `String`, default `'Handsontable [YYYY]-[MM]-[DD]'` | File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date. |
| `formulas` | `Boolean`, default `false` | Export formulas from source data (values that start with `=`) as spreadsheet formulas. |
| `mimeType` | `String`, default `'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'` | MIME type. |
| `range` | `Array`, default `[]` | Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). |
| `rowHeaders` | `Boolean`, default `false` | Include row headers. |
| `sheetName` | `String`, default `'Sheet1'` | Output worksheet name. |

## Related API reference

- Plugins:
  - `ExportExcel` (`hot.getPlugin('exportExcel')`)
