---
type: how-to
title: Export to Excel
metaTitle: Export to Excel | Handsontable DataGrid for JavaScript
description: Export your grid to an Excel (.xlsx) file - cell types, styling, merged cells, comments, and frozen panes go with the data, and formulas too with exportFormulas.
permalink: /export-to-excel
canonicalUrl: /export-to-excel
tags:
  - export to file
  - save file
  - xlsx
  - excel
react:
  metaTitle: Export to Excel | Handsontable DataGrid for React
angular:
  metaTitle: Export to Excel | Handsontable DataGrid for Angular
vue:
  metaTitle: Export to Excel | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: updated
addedIn: "17.1.0"
---

Export your grid to an Excel (`.xlsx`) file. The `ExportFile` plugin writes cell types, styling, merged cells, comments, and frozen panes with the data, and formulas too with `exportFormulas`. It uses the built-in XLSX engine unless you configure ExcelJS - see [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md).

[[toc]]

## Demo

Click **Export XLSX** to download the Q1 report: nested headers, a dropdown with its list, a currency column, a checkbox column, a column summary written as a live `SUM`, a merged total row, a custom border, a frozen first column, and a comment on Alice's notes.

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

## Prerequisites

- Register the `ExportFile` plugin (it is part of `registerAllModules()`). No other library is needed.
- Set `exportFile` to any value, for example `exportFile: true`, and turn on the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) to add the **Export** item to it. With a custom `contextMenu` item list, include `'export_file'`. The export methods work whatever the value, unset included.
- To run the export in Jest or Vitest, set up the test environment as [Testing](@/guides/tools-and-building/testing/testing.md#test-import-and-export-in-jest-or-vitest) describes.

## Example

### 1. Turn the plugin on

::: only-for javascript

```javascript
const hot = new Handsontable(container, {
  exportFile: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

::: only-for react

```jsx
<HotTable
  exportFile={true}
  licenseKey="non-commercial-and-evaluation"
/>
```

:::

::: only-for angular

```typescript
readonly hotSettings: GridSettings = {
  exportFile: true,
  licenseKey: 'non-commercial-and-evaluation',
};
```

:::

::: only-for vue

```javascript
const hotSettings = ref({
  exportFile: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

### 2. Download a file

```javascript
const exportPlugin = hot.getPlugin('exportFile');

await exportPlugin.downloadFileAsync('xlsx', { filename: 'Q1-sales', colHeaders: true, rowHeaders: true });
```

::: only-for react

`hot` is the `hotInstance` of your `HotTable` ref. See [Instance methods](@/guides/getting-started/react-methods/react-methods.md).

:::

::: only-for angular

`hot` is `this.hotTable.hotInstance` of your `HotTableComponent` view child.

:::

::: only-for vue

`hot` is the `hotInstance` of your `HotTable` template ref. See [Referencing the Handsontable instance](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md).

:::

### 3. Get a Blob instead

```javascript
const blob = await exportPlugin.exportAsBlobAsync('xlsx', { colHeaders: true }); // for example, to upload it
```

The synchronous `exportAsBlob('xlsx')` throws, because an XLSX file is built asynchronously. Both methods also take `'csv'`. [Methods](#methods) lists every export method.

### Context menu

When the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) is on and `exportFile` is set to any value, `false` included, an **Export** item with **To CSV** and **To Excel** appears in it. Only an unset `exportFile` keeps the item out. **To Excel** uses the grid's XLSX engine - see [Choose the engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#choose-the-engine).

The export covers the selected range, or the whole grid when a single cell is selected. It follows the grid's own column and row headers and leaves hidden rows and columns out.

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

### What is written

| Cell type | In the file |
|---|---|
| `numeric` | A number, with a number format built from `numericFormat`: currency symbols in quotes (a lone `$` as it is, and a symbol several currencies share as an Excel locale token such as `[$kr-414]`), `minimumIntegerDigits` as leading zeros. |
| `date`, `intl-date` | A date serial, with a format built from `dateFormat` and the cell's [`locale`](@/api/options.md#locale). A date before 1900, a date that does not exist, and a value that is not an ISO 8601 `YYYY-MM-DD` string are written as text. |
| `time`, `intl-time` | A time serial. The clock follows `hour12`, or the locale when `hour12` is not set. |
| `intl-datetime` | A date-time serial, with a format built from `dateTimeFormat`. |
| `checkbox` | `TRUE` or `FALSE`. An empty value stays empty. |
| `dropdown`, `autocomplete` | Text, plus a list validation when `source` is an array. The lists live in a hidden `_HotValidation` sheet, which Excel lists under **Unhide**; do not delete it. A function `source` gets no list. |
| `multiselect` | The values joined with `, `. |
| Everything else | Text. A number in a `text` column is text too. |

Bold, italic, and underline come from the rendered cell, or from the cell's custom class for a cell outside the rendered viewport. Font color and background are written only for a cell whose `className` holds a class other than the alignment classes. The font color is the rendered cell's own, written when it differs from what a plain cell in the same grid shows, so a color the cell inherits from its container is not. The background comes from the CSS rules that match the class on a `.handsontable td`, so a background a renderer sets inline, or one from a rule scoped to an element outside the grid (such as `#orders td.overdue`), is not written. Alignment comes from the `htLeft`, `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, and `htBottom` classes, and borders from the [`CustomBorders`](@/api/customBorders.md) plugin (1 px thin, 2 px medium, 3 px and up thick). Font size and family are not written.

Read-only cells get a gray fill unless their class sets a background, and gray text unless their class sets a font color. The sheet is protected without a password and only read-only cells are locked, unless the export includes a `columnSummary` destination cell: then the sheet is not protected, because those cells are read-only only to stop edits in the grid. The grid's `readOnlyStyling` option does not change the file.

Frozen panes: `fixedRowsTop` and `fixedColumnsStart` are written; `fixedRowsBottom` and `fixedColumnsEnd` are not. A right-to-left grid, through [`layoutDirection`](@/api/options.md#layoutdirection) or a right-to-left page, exports a right-to-left sheet. Comments are written from each cell's `comment` meta. `password` cells are written as text.

Details on number formats, dates, and error cells: [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#dates-times-and-number-formats).

### Dropped features

When the file cannot hold something the grid has, the export writes the rest and prints one console warning that names the engine and what it left out. Every key is explained in the [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md#dropped-on-export).

## Options

Pass these options as the second argument of `downloadFileAsync('xlsx', options)` or `exportAsBlobAsync('xlsx', options)`.

| Option | Type | Default | Description |
|---|---|---|---|
| `filename` | `string` | `'Handsontable [YYYY]-[MM]-[DD]'` | File name without the extension. The placeholders become the current date. |
| `colHeaders` | `boolean` | `false` | Write the column headers, every layer of [nested headers](@/api/nestedHeaders.md) included. Headers are written as stored; set [`textExtractor`](@/api/options.md#textextractor) to write the displayed text. |
| `rowHeaders` | `boolean` | `false` | Write the row headers as the first column. The column is frozen only when the export includes a row from `fixedRowsTop` or a column from `fixedColumnsStart`. |
| `exportHiddenRows`, `exportHiddenColumns` | `boolean \| 'hide'` | `false` | `false` leaves hidden rows or columns out, `true` writes them visible, `'hide'` writes them hidden in the sheet. |
| `range` | `number[]` | whole grid | `[startRow, startColumn, endRow, endColumn]` in visual indexes. |
| `exportFormulas` | `boolean` | `false` | Write [Formulas](@/guides/formulas/formula-calculation/formula-calculation.md) cells and [ColumnSummary](@/guides/columns/column-summary/column-summary.md) destination cells (every summary type except `custom`, which is written as its value) as live Excel formulas instead of their values. A `range` that does not start at row 0 and column 0 makes references point at the wrong cells. Give the columns they read `type: 'numeric'`: a number in a `text` column is written as text and sums to `0`. Without the Formulas plugin, any text that starts with `=` becomes a live formula, so keep this off for a grid that holds text you did not write. Error cells, array formulas, and named expressions: see [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#dates-times-and-number-formats). |
| `sheets` | `object[]` | - | Export several grids into one workbook: `[{ instance, name, ...options }]`. Only the listed grids are written, and each entry inherits the top-level options and can override `colHeaders`, `rowHeaders`, `exportHiddenRows`, `exportHiddenColumns`, `range`, `exportFormulas`, `headerStyle`, and `conditionalFormatting` (the `SheetOptions` type does not declare the last two yet). `filename`, `compression`, and `engine` apply to the whole workbook. See [Multi-sheet export](#multi-sheet-export). |
| `headerStyle` | `object \| null` | `{ backgroundColor: '#F2F2F2', border: { style: 'thin' } }` | Fill and border of the header cells. An object replaces the whole default, so pass both keys to keep one; `null` writes unstyled headers. Set a border color with `border: { color: '#RRGGBB' }` (the `HeaderStyleBorder` type does not declare `color` yet); `fontColor` and `border.argb` are not applied. `headerStyle` also styles the row headers and the corner cell. |
| `conditionalFormatting` | `object[]` | `[]` | `[{ rows: [first, last], cols: [first, last], rules }]`. `rows` and `cols` are offsets into the exported data, after `range` and hidden-row or hidden-column exclusion, and `rules` are ExcelJS-compatible rule objects ([shape](https://github.com/exceljs/exceljs#conditional-formatting)). Put a rule's formatting in its `style` key; a `format` key is ignored. Which rule kinds each engine writes: [Compare the engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#compare-the-engines). |
| `compression` | `boolean \| 1-9` | compressed | Unset or `true` compresses the entries with DEFLATE; `false` stores them uncompressed. A number from 1 to 9 sets the DEFLATE level on an engine that supports it: see [Compare the engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#compare-the-engines). |
| `engine` | `object \| null` | - | Engine for this call only. See [Choose the engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#choose-the-engine). |

### Multi-sheet export

Pass the `sheets` option to write several grids into one workbook, one per entry, each with its `instance` and the `name` of its tab. A sheet name is cut to 31 characters and stripped of the characters Excel forbids. With `exportFormulas`, a same-sheet reference is shifted by the header rows and the row-header column, but not by the start of `range`: with a `range` that does not start at row 0 and column 0, references point at the wrong cells. A formula that names another sheet in the same export is written as typed, so it points as many rows up as that sheet has header rows, and one column left when that sheet has row headers.

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

## Methods

Each export method takes the format first, `'csv'` or `'xlsx'`, and an options object second.

- [`downloadFileAsync(format, options)`](@/api/exportFile.md#downloadfileasync) - starts a download and returns a `Promise`. CSV and XLSX.
- [`exportAsBlobAsync(format, options)`](@/api/exportFile.md#exportasblobasync) - returns a `Promise` of a `Blob`. CSV and XLSX.
- [`downloadFile(format, options)`](@/api/exportFile.md#downloadfile), [`exportAsBlob(format, options)`](@/api/exportFile.md#exportasblob), and [`exportAsString(format, options)`](@/api/exportFile.md#exportasstring) - synchronous, CSV only. They throw for `'xlsx'`.
- [`supportsExportFormat(format)`](@/api/exportFile.md#supportsexportformat) - `true` when the format can be written.

## Hooks

The `ExportFile` plugin runs no hooks of its own. To act on the file before it reaches the user, get it with `exportAsBlobAsync()` instead of `downloadFileAsync()`.

## Related articles

**Related guides**

<div class="boxes-list">

- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)
- [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md)

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
