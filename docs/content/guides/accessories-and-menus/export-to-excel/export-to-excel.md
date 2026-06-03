---
type: how-to
id: b4qs2km7
title: Export to Excel
metaTitle: Export to Excel - JavaScript Data Grid | Handsontable
description: Export your grid data to an Excel (.xlsx) file, preserving cell types, styling, formulas, merged cells, and more. Requires ExcelJS as a peer dependency.
permalink: /export-to-excel
canonicalUrl: /export-to-excel
tags:
  - export to file
  - save file
  - xlsx
  - excel
react:
  id: lf2p8nx3
  metaTitle: Export to Excel - React Data Grid | Handsontable
angular:
  id: wm5j9ry1
  metaTitle: Export to Excel - Angular Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: new
---
Export your grid data to an Excel (`.xlsx`) file, preserving cell types, styling, formulas, merged cells, and more.

[[toc]]

## Overview

The `ExportFile` plugin supports XLSX export via [ExcelJS](https://github.com/exceljs/exceljs), which you must install as a peer dependency. XLSX export goes beyond CSV in several ways:

- Cell types (`numeric`, `date`, `time`, `checkbox`, `dropdown`) are written as native Excel types with matching number formats.
- Cell styling is read from the rendered DOM - font properties, background colors, alignment, and borders are all transferred to the workbook.
- Column headers and nested headers, merged cells, and frozen panes are preserved.
- [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md) and [ColumnSummary](@/guides/columns/column-summary/column-summary.md) destination cells can be exported as live Excel formulas.
- Multiple Handsontable instances can be exported into separate sheets of one workbook.

## Prerequisites

Install ExcelJS. The supported version range is **`^4.4.0`** (ExcelJS 4.x, version 4.4.0 or later).

```bash
npm install exceljs
```

Pass the ExcelJS constructor as `engines: { xlsx: ExcelJS }` in the `exportFile` plugin configuration:

::: only-for javascript

```js
import ExcelJS from 'exceljs';

const hot = new Handsontable(container, {
  exportFile: { engines: { xlsx: ExcelJS } },
});
```

:::

::: only-for react

```jsx
import ExcelJS from 'exceljs';

<HotTable
  exportFile={{ engines: { xlsx: ExcelJS } }}
/>
```

:::

::: only-for angular

```ts
import ExcelJS from 'exceljs';

readonly hotSettings: GridSettings = {
  exportFile: { engines: { xlsx: ExcelJS } },
};
```

:::

::: only-for vue

```js
import ExcelJS from 'exceljs';

const hotSettings = ref({
  exportFile: { engines: { xlsx: ExcelJS } },
});
```

:::

## Example

The table below is a Q1 sales report that demonstrates the main XLSX export features: nested column headers, numeric and checkbox cell types, a column summary total, merged cells, a custom border, a frozen first column, and a cell comment on Alice's row.

Click **Export XLSX** to download the file and open it in Microsoft Excel or any compatible spreadsheet application.

::: only-for javascript
::: example #example1 :hot-excel --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example1.html)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react-excel --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular-excel --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example1.html)

:::
:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-excel/vue/example1.vue)

:::

:::

## Available methods

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

::: only-for vue

::: tip

To use the Handsontable API, you need access to the Handsontable instance. Use a template ref on the `HotTable` component and read its `hotInstance` property.

For more information, see the [Referencing the Handsontable instance in Vue 3](@/guides/integrate-with-vue3/vue3-hot-reference/vue3-hot-reference.md) page.

:::

:::

The plugin exposes the following methods to export data.

- [`downloadFileAsync(format, options)`](@/api/exportFile.md#downloadfileasync) - generates a downloadable `.xlsx` file directly in the browser. Returns a `Promise` that resolves when the download starts.
- [`exportAsBlob(format, options)`](@/api/exportFile.md#exportasblob) - exports the data as a JavaScript `Blob`. Returns a `Promise` that resolves with the `Blob`.

Both methods take two parameters. The first, `format`, must be `'xlsx'`. The second, `options`, is an optional object that configures the exported workbook.

Both methods are asynchronous. Use `await` or `.then()` to handle the result:

::: only-for javascript

```js
const exportPlugin = hot.getPlugin('exportFile');

// Download a file.
await exportPlugin.downloadFileAsync('xlsx', { filename: 'my-report' });

// Get a Blob (e.g. to upload to a server).
const blob = await exportPlugin.exportAsBlob('xlsx', { filename: 'my-report' });
```

:::

::: only-for react

```jsx
const exportPlugin = hotRef.current?.hotInstance?.getPlugin('exportFile');

await exportPlugin?.downloadFileAsync('xlsx', { filename: 'my-report' });
```

:::

::: only-for vue

```js
const exportPlugin = hotRef.value?.hotInstance?.getPlugin('exportFile');

await exportPlugin?.downloadFileAsync('xlsx', { filename: 'my-report' });
```

:::

::: only-for angular

```ts
async exportFile(): Promise<void> {
  const exportPlugin = this.hotTable.hotInstance!.getPlugin('exportFile');

  await exportPlugin.downloadFileAsync('xlsx', { filename: 'my-report' });
}
```

:::

## Plugin configuration

Configure the plugin in Handsontable's settings under the `exportFile` key.

| Option    | Type     | Default | Description |
| --------- | -------- | ------- | ----------- |
| `engines` | `Object` | -       | A map of format keys to their engine constructors. Pass `{ xlsx: ExcelJS }` to enable XLSX export via [ExcelJS](https://github.com/exceljs/exceljs). |

## Export options

Pass these options as the second argument to `downloadFileAsync('xlsx', options)` or `exportAsBlob('xlsx', options)`.

| Option | Type / Default | Description |
| ------ | -------------- | ----------- |
| `filename` | `String`, default `'Handsontable [YYYY]-[MM]-[DD]'` | File name without extension. Placeholders `[YYYY]`, `[MM]`, and `[DD]` are replaced with the current date. |
| `colHeaders` | `Boolean`, default `false` | Include column headers in the exported file. Supports the [NestedHeaders](@/api/nestedHeaders.md) plugin. |
| `rowHeaders` | `Boolean`, default `false` | Include row headers as a frozen first column in the exported file. |
| `exportFormulas` | `Boolean`, default `false` | Export [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md) cells and [ColumnSummary](@/guides/columns/column-summary/column-summary.md) destination cells as live Excel formulas instead of their pre-calculated values. |
| `sheets` | `Array`, default `[]` | Multi-sheet configuration. Each entry is an object with an `instance` (a Handsontable object), a `name` (the sheet tab label), and any per-sheet options such as `colHeaders` or `rowHeaders`. When provided, the top-level `instance` is ignored and each sheet is exported separately. |
| `compression` | `Boolean` \| `Number` (1–9), default `false` | Enable DEFLATE compression. `true` uses level 6. A number 1–9 sets a specific level (1 = fastest, 9 = smallest). |
| `conditionalFormatting` | `Array`, default `[]` | Array of conditional formatting descriptors. Each descriptor accepts optional `rows` and `cols` ranges (zero-based Handsontable indexes) and a `rules` array of [ExcelJS conditional formatting rule objects](https://github.com/exceljs/exceljs#conditional-formatting). |
| `range` | `Array`, default `[]` | Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). When omitted, the entire grid is exported. |

### Multi-sheet export

Use the `sheets` option to export multiple Handsontable instances into a single workbook. Each entry specifies the `instance` to read from and a `name` for the sheet tab.

::: only-for javascript
::: example #example2 :hot-excel --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example2.html)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example2.ts)

:::
:::

::: only-for react
::: example #example2 :react-excel --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example2.tsx)

:::
:::

::: only-for angular
::: example #example2 :angular-excel --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example2.html)

:::
:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-excel/vue/example2.vue)

:::

:::

## Context menu

When the context menu is enabled, **Export to CSV** and **Export to Excel** items are automatically added to the grid's context menu. No extra configuration in `exportFile` is needed.

The **Export to Excel** item is only shown when an ExcelJS engine is configured via `engines: { xlsx: ExcelJS }`. The **Export to CSV** item is always available.

When you select a cell range before opening the context menu, the export covers only the selected range. When no selection is active, the entire grid is exported.

::: only-for javascript
::: example #example3 :hot-excel --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example3.html)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example3.js)
@[code](@/content/guides/accessories-and-menus/export-to-excel/javascript/example3.ts)

:::
:::

::: only-for react
::: example #example3 :react-excel --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example3.jsx)
@[code](@/content/guides/accessories-and-menus/export-to-excel/react/example3.tsx)

:::
:::

::: only-for angular
::: example #example3 :angular-excel --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example3.ts)
@[code](@/content/guides/accessories-and-menus/export-to-excel/angular/example3.html)

:::
:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/accessories-and-menus/export-to-excel/vue/example3.vue)

:::

:::

## Cell types and styling

The following Handsontable cell types are recognized and written to the `.xlsx` file with their native Excel equivalents.

| Handsontable type            | Excel behavior |
| ---------------------------- | -------------- |
| `numeric`                    | Number cell. The `numericFormat` option is translated to an Excel `numFmt` string using `Intl.NumberFormat`. |
| `date`                       | Date cell with an Excel date serial number. Reads ISO 8601 strings (`YYYY-MM-DD`). |
| `time`                       | Time cell with an Excel time serial number. Reads `HH:mm`, `HH:mm:ss`, and 12-hour (`h:mm AM/PM`) formats. |
| `checkbox`                   | Boolean cell (`TRUE` / `FALSE`). |
| `dropdown` / `autocomplete`  | Text cell. The validation list is not exported. |
| All others                   | Text cell. |

Cell styling is read from the rendered DOM at export time. The following properties are transferred to the workbook:

- **Font**: bold, italic, underline, strikethrough, color, size, and family.
- **Fill**: background color.
- **Alignment**: horizontal (`htLeft`, `htCenter`, `htRight`, `htJustify`) and vertical (`htTop`, `htMiddle`, `htBottom`).
- **Borders**: configurations set via the [`CustomBorders`](@/api/customBorders.md) plugin. Border widths map to Excel styles: 1 px → `thin`, 2 px → `medium`, 3+ px → `thick`.

Read-only cells (`readOnly: true`) receive a light-gray fill and gray font color in the exported file by default. Applying CSS classes to a read-only cell overrides these defaults.

## Related API reference

**Plugins**

<div class="boxes-list">

- [`ExportFile`](@/api/exportFile.md)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
