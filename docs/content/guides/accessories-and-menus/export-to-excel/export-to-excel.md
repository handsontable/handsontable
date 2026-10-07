---
type: how-to
title: Export to Excel
metaTitle: Export to Excel - JavaScript Data Grid | Handsontable
description: Export your grid data to an Excel (.xlsx) file, preserving cell types, styling, formulas, merged cells, and more. No extra library is needed.
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
category: Accessories and menus
menuTag: updated
addedIn: "17.1.0"
---
Export your grid data to an Excel (`.xlsx`) file, preserving cell types, styling, formulas, merged cells, and more.

[[toc]]

## Overview

The `ExportFile` plugin writes `.xlsx` files with a built-in engine - no extra library is needed. XLSX export goes beyond CSV in several ways:

- Cell types (`numeric`, `date`, `time`, `checkbox`, `dropdown`) are written as native Excel types with matching number formats.
- Cell styling is read from the rendered DOM - font properties, background colors, alignment, and borders are all transferred to the workbook.
- Column headers and nested headers, merged cells, and frozen panes are preserved.
- [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md) and [ColumnSummary](@/guides/columns/column-summary/column-summary.md) destination cells can be exported as live Excel formulas.
- Multiple Handsontable instances can be exported into separate sheets of one workbook.
- A grid that renders right to left, through [`layoutDirection`](@/api/options.md#layoutdirection) or a right-to-left page, exports a right-to-left sheet.

## Prerequisites

- Register the `ExportFile` plugin (it is part of `registerAllModules()`). No other library is needed.

::: only-for javascript

```js
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

```ts
readonly hotSettings: GridSettings = {
  exportFile: true,
  licenseKey: 'non-commercial-and-evaluation',
};
```

:::

::: only-for vue

```js
const hotSettings = ref({
  exportFile: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

### Requirements

The built-in engine needs four globals: `CompressionStream`, `DecompressionStream`, `TextEncoder`, and `TextDecoder`. Every browser Handsontable supports provides them. A test environment can lack them - a jsdom environment (in Jest or Vitest), or Jest 27's `node` environment. The export then rejects with a message that names the missing globals. Jest's `node` environment provides all four from Jest 28 on.

To run the built-in engine in such an environment, assign the four globals from Node.js before the test runs, for example in a Jest `setupFiles` module:

```javascript
const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

Object.assign(globalThis, { CompressionStream, DecompressionStream, TextEncoder, TextDecoder });
```

You can also inject ExcelJS through the `engines` option. On Jest 29 with `jest-environment-jsdom`, loading ExcelJS fails with `SyntaxError: Unexpected token 'export'`, because that environment resolves the `browser` export condition. Set `testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] }` in your Jest configuration to load it.

## Engines

XLSX export runs on the built-in engine. You can pass [ExcelJS](https://github.com/exceljs/exceljs) 4.4 or later through the `engines` option instead. The built-in engine ignores the numeric `compression` level (it always uses the platform's DEFLATE, or stores the entries for `false`), and writes only some conditional formatting rule kinds -- every other feature below matches between the two engines:

| Feature | Built-in | ExcelJS |
|---|---|---|
| Values, number formats, formulas | Yes | Yes |
| Merged cells, column widths, row heights | Yes | Yes |
| Hidden rows and columns, multiple sheets | Yes | Yes |
| Cell styling, `headerStyle` | Yes | Yes |
| Conditional formatting | Some rule kinds | Yes |
| List validation (dropdown sources) | Yes | Yes |

Both engines write a sheet synchronously. A very large grid blocks the tab for as long as the sheet takes to serialize, and a multi-sheet export pays that for each sheet in turn, so export a large grid from an interaction the user started rather than on a timer.

When an engine cannot write a feature the export requested, the plugin reports it in one console warning per export call, naming the engine and every dropped feature. Both engines report `merge:overlap` when two merged ranges overlap, and `cellText:truncated`, `columnWidth:clamped`, and `rowHeight:clamped` when a value is past what Excel stores. Both engines also check each conditional formatting rule before they write it. They skip the same malformed rules and report them under the same keys (see the table below), and they write the rest of the file. ExcelJS writes every rule kind that passes the check, and honors the numeric `compression` level, so it never reports `compressionLevel`. The built-in engine writes `cellIs`, `expression`, and the `containsText` family (`containsText`, `containsBlanks`, `notContainsBlanks`, `containsErrors`, `notContainsErrors`), plus `top10`, `aboveAverage`, and `timePeriod` conditional formatting rules -- it reports every other rule kind, such as `colorScale`, `dataBar`, `iconSet`, `duplicateValues`, and `uniqueValues`, as a dropped feature. The same mechanism serves the [import](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) direction, where cell styling is dropped on every file that carries it.

These are the keys the export can report:

| Key | What it means |
|---|---|
| `compressionLevel` | You set a numeric `compression` level and the built-in engine cannot honor it. The Compression Streams API the engine packs with has no level parameter, so the archive uses the platform default. Pass `compression: false` to store the entries instead. |
| `merge:overlap` | Two merged ranges overlap. The later one is skipped. |
| `cellText:truncated` | A text value is longer than 32,767 characters, the most an Excel cell holds. Both engines cut it to that length. |
| `columnWidth:clamped` | A column is wider than 260 width units (about 1,820 pixels), the widest column Excel stores. Both engines write it at that width. |
| `rowHeight:clamped` | A row is taller than 409.5 points (546 pixels), the tallest row Excel stores. Both engines write it at that height. |
| `conditionalFormatting:<type>` | A conditional formatting rule kind the built-in engine does not write, such as `colorScale`, `dataBar`, or `iconSet`. ExcelJS reports `colorScale`, `dataBar`, and `iconSet` too, but only for a rule it cannot write: one with no `cfvo` thresholds, or a `colorScale` with no `color`. The rest of the block is written. |
| `conditionalFormatting:other` | The bucket the rule kinds above count into once one export has already reported 32 distinct ones. See the note under this table. |
| `conditionalFormatting:invalid` | A `conditionalFormatting` entry that is not a rule object with a string `type`. Both engines skip it and write the rest of the block. |
| `conditionalFormatting:expression` | An `expression` rule with no `formulae` entry. The rule means nothing without one. Both engines skip it. |
| `conditionalFormatting:timePeriod` | A `timePeriod` rule with no `timePeriod` string, or with no `formulae` and a period other than `today`, `yesterday`, `tomorrow`, `last7Days`, `thisWeek`, `lastWeek`, `nextWeek`, `thisMonth`, `lastMonth`, or `nextMonth`. Both engines skip it. A rule with one of those periods and no `formulae` is written: both engines build the formula from the period and the block's top-left cell, as ExcelJS does. |

The one key that ends in a value you wrote -- `conditionalFormatting:<type>` -- is bounded, the same way the [import](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) direction bounds its own value-tailed keys. The rule kind is cut to 64 characters and its control characters are replaced, and after 32 distinct kinds in one export the rest are reported as `conditionalFormatting:other`. The counts stay complete either way.

Pass a different engine for one call only with the `engine` option, without changing the plugin-level `engines` configuration:

```javascript
await exportPlugin.downloadFileAsync('xlsx', {
  filename: 'Q1-Sales-Report',
  engine: ExcelJS,
});
```

`engines` is keyed by format, so a map that names no `xlsx` engine writes `.xlsx` with the built-in engine, the same way `exportFile: true` does. An `engine` of `null`, or no `engine` key at all, means no override: the call keeps the engine `engines` configured, or the built-in engine when `engines` names none for the format. The [import direction](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md#engines) resolves its own `engine` option the same way.

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

For more information, see the [Referencing the Handsontable instance in Vue 3](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md) page.

:::

:::

The plugin exposes the following methods to export data.

- [`downloadFileAsync(format, options)`](@/api/exportFile.md#downloadfileasync) - generates a downloadable `.xlsx` file directly in the browser. Returns a `Promise` that resolves when the download starts.
- [`exportAsBlobAsync(format, options)`](@/api/exportFile.md#exportasblobasync) - exports the data as a JavaScript `Blob`. Returns a `Promise` that resolves with the `Blob`. The synchronous [`exportAsBlob()`](@/api/exportFile.md#exportasblob) throws for `'xlsx'`, because an XLSX file cannot be built synchronously.

Both methods take two parameters. The first, `format`, must be `'xlsx'`. The second, `options`, is an optional object that configures the exported workbook.

Both methods are asynchronous. Use `await` or `.then()` to handle the result:

::: only-for javascript

```js
const exportPlugin = hot.getPlugin('exportFile');

// Download a file.
await exportPlugin.downloadFileAsync('xlsx', { filename: 'my-report' });

// Get a Blob (e.g. to upload to a server).
const blob = await exportPlugin.exportAsBlobAsync('xlsx', { filename: 'my-report' });
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
| `engines` | `Object` | -       | Optional map of format keys to engine modules. Pass `{ xlsx: ExcelJS }` to export through [ExcelJS](https://github.com/exceljs/exceljs) instead of the built-in engine. |

Set `exportFile` to `true`, or to an object with the options above, to show the **Export** item in the context menu. The plugin's API works whatever the value. `exportFile: false` does not turn the plugin off: the **Export** item stays in the context menu, and the export methods keep working. To keep the item out of the menu, leave `exportFile` unset.

## Export options

Pass these options as the second argument to `downloadFileAsync('xlsx', options)` or `exportAsBlobAsync('xlsx', options)`.

| Option | Type / Default | Description |
| ------ | -------------- | ----------- |
| `filename` | `String`, default `'Handsontable [YYYY]-[MM]-[DD]'` | File name without extension. Placeholders `[YYYY]`, `[MM]`, and `[DD]` are replaced with the current date. |
| `colHeaders` | `Boolean`, default `false` | Include column headers in the exported file. Supports the [NestedHeaders](@/api/nestedHeaders.md) plugin. |
| `rowHeaders` | `Boolean`, default `false` | Include row headers as a frozen first column in the exported file. |
| `exportFormulas` | `Boolean`, default `false` | Export [HyperFormula](@/guides/formulas/formula-calculation/formula-calculation.md) cells and [ColumnSummary](@/guides/columns/column-summary/column-summary.md) destination cells as live Excel formulas instead of their pre-calculated values. A number in a column of the default `text` type is written as a text cell, so a `SUM` over it calculates to `0` when the file opens. Give the columns that feed formulas `type: 'numeric'`. An array formula, such as `=TRANSPOSE(A1:B2)` or `=MMULT(A1:B2,A1:B2)`, is written as one plain formula in its first cell, and the cells it spills into are written as fixed values. A HyperFormula-only function, such as `ARRAYFORMULA`, is written by its name, and a spreadsheet application that lacks it shows `#NAME?`. |
| `sheets` | `Array`, default `[]` | Multi-sheet configuration. Each entry is an object with an `instance` (a Handsontable object), a `name` (the sheet tab label), and any per-sheet options such as `colHeaders` or `rowHeaders`. When provided, the top-level `instance` is ignored and each sheet is exported separately. |
| `compression` | `Boolean` \| `Number` (1–9), default DEFLATE level 6 | DEFLATE compression. Unset or `true` uses level 6. A number 1–9 sets a specific level (1 = fastest, 9 = smallest). `false` writes the workbook's entries stored, without compression. The built-in engine treats every level as the platform default. |
| `conditionalFormatting` | `Array`, default `[]` | Array of conditional formatting descriptors. Each descriptor accepts optional `rows` and `cols` ranges (zero-based Handsontable indexes) and a `rules` array of ExcelJS-compatible conditional formatting rule objects ([shape reference](https://github.com/exceljs/exceljs#conditional-formatting)). The built-in engine writes `cellIs`, `expression`, and the `containsText` family (`containsText`, `containsBlanks`, `notContainsBlanks`, `containsErrors`, `notContainsErrors`), plus `top10`, `aboveAverage`, and `timePeriod`; other kinds are reported under the dropped features. A `timePeriod` rule needs no `formulae`: both engines build the formula from the period. |
| `range` | `Array`, default `[]` | Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). When omitted, the entire grid is exported. |

### Multi-sheet export

Use the `sheets` option to export multiple Handsontable instances into a single workbook. Each entry specifies the `instance` to read from and a `name` for the sheet tab.

::: tip Behavior note

With `exportFormulas`, a formula reference that names another sheet, such as `=Rates!A1`, is written as typed. The referenced sheet is not shifted by the header row and row-header column the export prepends to it, so such a reference points one row up and one column left of the intended cell in the written file when that sheet is part of the same export and carries headers. Same-sheet references are shifted correctly. Cross-sheet formulas across exported sheets are a known limitation.

:::

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

When the context menu is enabled and the `exportFile` option is set, an **Export** item with the **To CSV** and **To Excel** sub-items is added to the grid's context menu. The option needs no further configuration. The item shows for `exportFile: false` too. Only an unset `exportFile` keeps it out of the menu.

**To CSV** is always available. **To Excel** uses the built-in engine unless you configure `engines: { xlsx: ExcelJS }`, and it is hidden only when `engines.xlsx` holds a value that is not a recognized engine.

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
| `numeric`                    | Number cell. The `numericFormat` option is translated to an Excel `numFmt` string using `Intl.NumberFormat`. A currency symbol longer than one character is written in quotes, such as `"USD"#,##0.00` or `#,##0.00"zł"`, and a one-character symbol such as `$`, `€`, `£`, or `¥` is written as it is. |
| `date`                       | Date cell with an Excel date serial number. Reads ISO 8601 strings (`YYYY-MM-DD`). The `dateFormat` option is translated to an Excel `numFmt` string, ordered and separated the way the cell's [`locale`](@/api/options.md#locale) renders it: `{ year: 'numeric', month: '2-digit', day: '2-digit' }` is written as `mm/dd/yyyy` under `en-US` and `dd.mm.yyyy` under `de-DE`, and `{ weekday: 'long' }` is written as `dddd`. |
| `time`                       | Time cell with an Excel time serial number. Reads `HH:mm`, `HH:mm:ss`, and 12-hour (`h:mm AM/PM`) formats. The `timeFormat` option is translated the same way, so `{ hour: '2-digit', minute: '2-digit', hour12: false }` is written as `hh:mm`. A `timeFormat` that sets no `hour12` takes its clock from the cell's [`locale`](@/api/options.md#locale), just as the grid does, so the same options under `en-US` are written as `hh:mm AM/PM`. |
| `checkbox`                   | Boolean cell (`TRUE` / `FALSE`). A cell with no value exports as an empty cell. |
| `dropdown` / `autocomplete`  | Text cell. An array `source` is exported as a list validation, on both engines. The lists are written to a hidden helper sheet named `_HotValidation`, which Excel lists under **Unhide**. Do not delete that sheet, or the dropdowns lose their lists. A function `source` is not exported. |
| All others                   | Text cell. |

Cell styling is read from the rendered DOM at export time. The following properties are transferred to the workbook:

- **Font**: bold, italic, underline, strikethrough, color, size, and family.
- **Fill**: background color.
- **Alignment**: horizontal (`htLeft`, `htCenter`, `htRight`, `htJustify`) and vertical (`htTop`, `htMiddle`, `htBottom`).
- **Borders**: configurations set via the [`CustomBorders`](@/api/customBorders.md) plugin. Border widths map to Excel styles: 1 px → `thin`, 2 px → `medium`, 3+ px → `thick`.

Column headers are written as the text the grid stores. A header that holds HTML entities, such as the `R&amp;D` an [import](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) stores for `R&D`, is written with the entities as they are. Set the grid's [`textExtractor`](@/api/options.md#textextractor) option to `true` to write the text the header shows instead.

Read-only cells (`readOnly: true`) receive a light-gray fill and gray font color in the exported file by default. Applying CSS classes to a read-only cell overrides these defaults.

::: tip Behavior note

A `timeFormat` or `dateTimeFormat` that sets no `hour12` is exported with the clock its [`locale`](@/api/options.md#locale) implies, because that is the clock the grid renders. Excel has no marker for an unspecified clock, so a file imported back always states `hour12`. Set `hour12` yourself to pin it across the round trip.

:::

::: tip Behavior note

On a rendered cell, the exported font color is the cell's own computed color, compared against a baseline probe - a cell wearing the same alignment classes and nothing else, mounted inside the same grid wrapper - and exported only when it differs. A color a rule sets on the cell, whatever selector it uses, or a color a custom renderer writes, is exported. A text color the cell only inherits, such as one from a CSS variable scoped to the grid container, is not, because the baseline shows the same color. A cell outside the viewport has no rendered element, so its color comes from the class-only probe instead; a color that only a rule scoped beyond `.handsontable td.<class>` sets is exported for rendered cells only.

:::

## Related API reference

**Plugins**

<div class="boxes-list">

- [`ExportFile`](@/api/exportFile.md)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
