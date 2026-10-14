---
type: how-to
title: Export to Excel
metaTitle: Export to Excel - JavaScript Data Grid | Handsontable
description: Export your grid to an Excel (.xlsx) file with the built-in engine - cell types, styling, formulas, merged cells, comments, and frozen panes go with the data. No extra library is needed.
permalink: /export-to-excel
canonicalUrl: /export-to-excel
tags:
  - export to file
  - save file
  - xlsx
  - excel
react:
  metaTitle: Export to Excel - React Data Grid | Handsontable
angular:
  metaTitle: Export to Excel - Angular Data Grid | Handsontable
vue:
  metaTitle: Export to Excel - Vue Data Grid | Handsontable
searchCategory: Guides
category: Data management
menuTag: updated
addedIn: "17.1.0"
---

Export your grid to an Excel (`.xlsx`) file. The `ExportFile` plugin writes the file with its built-in engine: cell types, styling, formulas, merged cells, comments, and frozen panes go with the data.

[[toc]]

## Prerequisites

- Register the `ExportFile` plugin (it is part of `registerAllModules()`). No other library is needed.
- Set `exportFile: true` to add the **Export** item to the context menu. The export methods work whatever the value.

## Steps

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

The synchronous `exportAsBlob('xlsx')` throws, because an XLSX file is built asynchronously. Both methods also take `'csv'`; the [CSV guide](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md#methods) lists every export method.

## Result

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

## Export options

Pass these options as the second argument of `downloadFileAsync('xlsx', options)` or `exportAsBlobAsync('xlsx', options)`.

| Option | Type, default | Description |
|---|---|---|
| `filename` | `string`, `'Handsontable [YYYY]-[MM]-[DD]'` | File name without the extension. The placeholders become the current date. |
| `colHeaders` | `boolean`, `false` | Write the column headers, every layer of [nested headers](@/api/nestedHeaders.md) included. Headers are written as stored; set [`textExtractor`](@/api/options.md#textextractor) to write the displayed text. |
| `rowHeaders` | `boolean`, `false` | Write the row headers as the first column. The column is frozen only when the grid has `fixedRowsTop` or `fixedColumnsStart`. |
| `exportHiddenRows`, `exportHiddenColumns` | `boolean \| 'hide'`, `false` | `false` leaves hidden rows or columns out, `true` writes them visible, `'hide'` writes them hidden in the sheet. |
| `range` | `number[]`, whole grid | `[startRow, startColumn, endRow, endColumn]` in visual indexes. |
| `exportFormulas` | `boolean`, `false` | Write [Formulas](@/guides/formulas/formula-calculation/formula-calculation.md) cells and [ColumnSummary](@/guides/columns/column-summary/column-summary.md) destination cells as live Excel formulas instead of their values. Give the columns they read `type: 'numeric'`: a number in a `text` column is written as text and sums to `0`. Without the Formulas plugin, any text that starts with `=` becomes a live formula, so keep this off for a grid that holds text you did not write. Error cells, array formulas, and named expressions: see the [reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md#dates-times-and-number-formats). |
| `sheets` | `object[]`, none | Export several grids into one workbook: `[{ instance, name, ...options }]`. Only the listed grids are written, and each entry takes every option in this table. See [Multi-sheet export](#multi-sheet-export). |
| `headerStyle` | `object \| null`, `{ backgroundColor: '#F2F2F2', border: { style: 'thin' } }` | Fill and border of the header cells. An object replaces the whole default, so pass both keys to keep one; `null` writes unstyled headers. |
| `conditionalFormatting` | `object[]`, `[]` | `[{ rows: [first, last], cols: [first, last], rules }]`. `rows` and `cols` are offsets into the exported data, after `range` and hidden-row or hidden-column exclusion, and `rules` are ExcelJS-compatible rule objects ([shape](https://github.com/exceljs/exceljs#conditional-formatting)). The built-in engine writes `cellIs`, `expression`, `containsText`, `top10`, `aboveAverage`, and `timePeriod`; other kinds are reported as dropped. |
| `compression` | `boolean \| 1-9`, `true` | `false` stores the entries uncompressed. The built-in engine uses the platform's DEFLATE level and reports any other numeric level as `compressionLevel`. |
| `engine` | `object \| null`, none | Engine for this call only. See the [reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md#engines). |

## Multi-sheet export

Pass the `sheets` option to write several grids into one workbook, one per entry, each with its `instance` and the `name` of its tab. A sheet name is cut to 31 characters and stripped of the characters Excel forbids. With `exportFormulas`, a formula that names another sheet in the same export is written as typed and is not shifted by that sheet's header row and row-header column, so it points one row up and one column left of the intended cell; same-sheet references are shifted correctly.

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

When the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) is on and `exportFile` is set to any value, `false` included, an **Export** item with **To CSV** and **To Excel** appears in it. Only an unset `exportFile` keeps the item out. **To Excel** uses the built-in engine unless you configure `engines: { xlsx: ExcelJS }`.

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

## What is written

| Handsontable type | In the file |
|---|---|
| `numeric` | A number, with a number format built from `numericFormat`: currency symbols in quotes, `minimumIntegerDigits` as leading zeros. |
| `date`, `intl-date` | A date serial, with a format built from `dateFormat` and the cell's [`locale`](@/api/options.md#locale). A date before 1900 and a date that does not exist are written as text. |
| `time`, `intl-time` | A time serial. The clock follows `hour12`, or the locale when `hour12` is not set. |
| `intl-datetime` | A date-time serial, with a format built from `dateTimeFormat`. |
| `checkbox` | `TRUE` or `FALSE`. An empty value stays empty. |
| `dropdown`, `autocomplete` | Text, plus a list validation when `source` is an array. The lists live in a hidden `_HotValidation` sheet, which Excel lists under **Unhide**; do not delete it. A function `source` gets no list. |
| `multiselect` | The values joined with `, `. |
| Everything else | Text. A number in a `text` column is text too. |

Styling comes from the rendered cell: bold, italic, underline, font color, and background. Alignment comes from the `htLeft`, `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, and `htBottom` classes, and borders from the [`CustomBorders`](@/api/customBorders.md) plugin (1 px thin, 2 px medium, 3 px and up thick). Font size and family are not written. A font color is written only when it differs from what a plain cell in the same grid shows, so a color the cell inherits from its container is not.

Read-only cells get a gray fill and gray text, the sheet is protected without a password, and only read-only cells are locked - unless the grid has a `columnSummary`, which needs an unprotected sheet. The grid's `readOnlyStyling` option does not change the file.

Frozen panes: `fixedRowsTop` and `fixedColumnsStart` are written; `fixedRowsBottom` and `fixedColumnsEnd` are not. A right-to-left grid, through [`layoutDirection`](@/api/options.md#layoutdirection) or a right-to-left page, exports a right-to-left sheet. Comments are written from each cell's `comment` meta. `password` cells are written as text.

Details on number formats, dates, error cells, and what each engine writes: the [reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md).

## Related

- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [Excel import and export reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md) - engines, limits, dropped-feature keys, security, test environments
- [`ExportFile` plugin API](@/api/exportFile.md)

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
