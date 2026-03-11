---
id: 1a2f7h9m
title: Export to Excel
metaTitle: Export to Excel - JavaScript Data Grid | Handsontable
description: Export your grid data to XLSX. Inject ExcelJS through Handsontable settings, then export as a downloadable file, a blob, or an ArrayBuffer.
permalink: /export-to-excel
canonicalUrl: /export-to-excel
tags:
  - export to file
  - excel export
react:
  id: 3r8w0n4q
  metaTitle: Export to Excel - React Data Grid | Handsontable
angular:
  id: 8k6d5c2p
  metaTitle: Export to Excel - Angular Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
---

# Export to Excel

Export your grid data to XLSX, as a downloadable file, a blob, or an `ArrayBuffer`.

The `ExportExcel` plugin doesn't bundle ExcelJS for you. Inject an ExcelJS-compatible dependency through the [`exportExcel` option](#inject-exceljs).

[[toc]]

## Inject ExcelJS

Pass your ExcelJS dependency in the `exportExcel` setting:

```js
const hot = new Handsontable(container, {
  // other options
  exportExcel: {
    exceljs: ExcelJS,
  },
});
```

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

The plugin exposes the following methods:

- [`downloadFile(options)`](@/api/exportExcel.md#downloadfile) - generate a downloadable XLSX file in your browser.
- [`exportAsBlob(options)`](@/api/exportExcel.md#exportasblob) - export as a JavaScript `Blob`.
- [`exportAsBuffer(options)`](@/api/exportExcel.md#exportasbuffer) - export as an `ArrayBuffer`.

## Available options in the export configuration

| Property               | Type / Default                                           | Description |
| ---------------------- | -------------------------------------------------------- | ----------- |
| `columnHeaders`        | `Boolean`, default `false`                               | Include column headers. |
| `exportHiddenColumns`  | `Boolean`, default `false`                               | Include hidden columns. |
| `exportHiddenRows`     | `Boolean`, default `false`                               | Include hidden rows. |
| `fileExtension`        | `String`, default `'xlsx'`                               | File extension. Used by `downloadFile()`. |
| `filename`             | `String`, default `'Handsontable [YYYY]-[MM]-[DD]'`      | File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date. Used by `downloadFile()`. |
| `formulas`             | `Boolean`, default `false`                               | Export strings that start with `=` as formulas. |
| `mimeType`             | `String`, default `'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'` | MIME type. Used by `downloadFile()` and `exportAsBlob()`. |
| `range`                | `Array`, default selected range or full data             | Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). |
| `rowHeaders`           | `Boolean`, default `false`                               | Include row headers. |
| `sheetName`            | `String`, default `'Sheet1'`                             | Worksheet name. |

## Related API reference

- Plugins:
  - [`ExportExcel`](@/api/exportExcel.md)

Microsoft and Excel are trademarks of the Microsoft group of companies.
