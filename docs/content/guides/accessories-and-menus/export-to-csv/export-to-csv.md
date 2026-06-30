---
type: how-to
title: Export to CSV
metaTitle: Export to CSV - JavaScript Data Grid | Handsontable
description: Export your grid's raw data to the CSV format, as a downloadable file, a blob, or a string. Customize your export using Handsontable's configuration options.
permalink: /export-to-csv
canonicalUrl: /export-to-csv
tags:
  - export to file
  - save file
react:
  metaTitle: Export to CSV - React Data Grid | Handsontable
angular:
  metaTitle: Export to CSV - Angular Data Grid | Handsontable
vue:
  metaTitle: Export to CSV - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
---
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

### Prevent CSV Injection attack

"CSV Injection, also known as Formula Injection, occurs when websites embed untrusted input inside CSV files. When a spreadsheet program such as Microsoft Excel or LibreOffice Calc is used to open a CSV, any cells starting with = will be interpreted by the software as a formula." (from [OWASP website](https://owasp.org/www-community/attacks/CSV_Injection))

To prevent this attack, set the [`sanitizeValues` option](#sanitizevalues-boolean|regexp|function) when exporting your data in CSV format.

::: only-for javascript
::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example4.html)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example4.js)
@[code](@/content/guides/accessories-and-menus/export-to-csv/javascript/example4.ts)

:::
:::

::: only-for react
::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example4.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-csv/react/example4.tsx)

:::
:::


::: only-for angular
::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example4.ts)
@[code](@/content/guides/accessories-and-menus/export-to-csv/angular/example4.html)

:::
:::

::: only-for vue
::: example #example4 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-csv/vue/example4.vue)

:::
:::

## Result

After completing this guide, you can export grid data as a downloadable CSV file, a JavaScript Blob, or a string. You can customize delimiters, ranges, headers, and value sanitization through the export configuration.

## Available methods

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

:::: only-for vue

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md) page.

:::

::::

The plugin exposes the following methods to export data.

- [`downloadFile(format, options)`](@/api/exportFile.md#downloadfile) - generates a downloadable file directly in the browser. Synchronous; supports text-based formats only (e.g. CSV). For XLSX, use [`downloadFileAsync`](@/api/exportFile.md#downloadfileasync).
- [`downloadFileAsync(format, options)`](@/api/exportFile.md#downloadfileasync) - generates a downloadable file and returns a `Promise`. Supports all formats including XLSX.
- [`exportAsBlob(format, options)`](@/api/exportFile.md#exportasblob) - allows you to export a JavaScript Blob object.
- [`exportAsString(format, options)`](@/api/exportFile.md#exportasstring) - allows you to export data as a string. Supports text-based formats only (e.g. CSV).

Each method takes two parameters. The first, `format`, is required. The second, `options`, is an optional object that overrides or extends the default export configuration. The table below lists all supported options for CSV export.

## Available options in the export configuration

| Property               | Type / Default                          | Description |
| ---------------------- | --------------------------------------- | ----------- |
| `bom`                  | `Boolean`, default `true`               | Prepend output with BOM (UTF-8). Browser uses _EF BB BF_. |
| `colHeaders`           | `Boolean`, default `false`              | Include column headers. Does not support the [NestedHeaders](@/api/nestedHeaders.md) plugin. |
| `columnDelimiter`      | `String`, default `','`                | Column delimiter. |
| `exportHiddenColumns`  | `Boolean`, default `false`              | Include hidden columns. |
| `exportHiddenRows`    | `Boolean`, default `false`              | Include hidden rows. |
| `fileExtension`       | `String`, default `'csv'`               | File extension. Used by `downloadFile()`. |
| `filename`             | `String`, default `'Handsontable [YYYY]-[MM]-[DD]'` | File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date. Used by `downloadFile()`. |
| `mimeType`             | `String`, default `'text/csv'`          | MIME type. Used by `downloadFile()` and `exportAsBlob()`. |
| `range`                | `Array`, default `[]`                   | Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). |
| `rowDelimiter`         | `String`, default `'\r\n'`              | Row delimiter. |
| `rowHeaders`           | `Boolean`, default `false`              | Include row headers. |
| `sanitizeValues`       | `Boolean` \| `RegExp` \| `Function`, default `false` | Value sanitization. `true` = [OWASP CSV injection](https://owasp.org/www-community/attacks/CSV_Injection) rules; `RegExp` = escape matching values; `Function` = replace with return value. |

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 15.3.0: CSV sanitization, accessibility updates, and 30+ fixes](https://handsontable.com/blog/handsontable-15.3.0-csv-sanitization-accessibility-updates-and-30-fixes)

</div>

## Related API reference

**Plugins**

<div class="boxes-list">

- [ExportFile](@/api/exportFile.md)

</div>
