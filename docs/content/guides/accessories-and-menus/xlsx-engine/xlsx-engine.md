---
type: reference
title: XLSX engine
metaTitle: XLSX engine - JavaScript Data Grid | Handsontable
description: The built-in XLSX engine behind the ImportFile and ExportFile plugins - when to use ExcelJS instead, limits, dropped-feature keys, security bounds, number formats, and test-environment setup.
permalink: /xlsx-engine
canonicalUrl: /xlsx-engine
tags:
  - xlsx
  - excel
  - import from file
  - export to file
react:
  metaTitle: XLSX engine - React Data Grid | Handsontable
angular:
  metaTitle: XLSX engine - Angular Data Grid | Handsontable
vue:
  metaTitle: XLSX engine - Vue Data Grid | Handsontable
searchCategory: Guides
category: Data management
menuTag: new
addedIn: "19.0.0"
---

Handsontable reads and writes `.xlsx` files with its own engine, shared by [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) and [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md). No library is needed. This page covers when to use ExcelJS instead, what the engine refuses, what it drops and under which key, and how to run it in a test runner.

[[toc]]

## Engines

Both plugins read and write `.xlsx` files with a built-in engine. To use [ExcelJS](https://github.com/exceljs/exceljs) instead, pass it as `engines: { xlsx: ExcelJS }` in the `importFile` or `exportFile` settings, or for one call only as the `engine` option of the import and export methods. An `engine` of `null`, or no `engine` key, means no override. ExcelJS 4.4 or later is recommended, but the version is not checked: the plugins look for a `Workbook` constructor and nothing else.

| Feature | Built-in read | Built-in write | ExcelJS read | ExcelJS write |
|---|---|---|---|---|
| Values, number formats, formulas | Yes | Yes | Yes | Yes |
| Merged cells, widths, heights, hidden rows and columns, frozen panes | Yes | Yes | Yes | Yes |
| Bold, italic, underline, font color, fill, alignment, borders | Yes | Yes | Yes | Yes |
| Comments | Yes, threaded comments included | Yes | Yes, except a comment stored as plain text, which reads empty | Yes |
| List validation (dropdown sources) | Yes | Yes | Yes | Yes |
| Conditional formatting | All rule kinds except `colorScale`, `dataBar`, and `iconSet` | `cellIs`, `expression`, `containsText`, `top10`, `aboveAverage`, `timePeriod` | All kinds | All kinds |
| Numeric `compression` level | - | Platform default, reported as `compressionLevel` for any level but 6 | - | Honored |
| Defined names | Ranges and constants | - | Ranges only | - |
| Chart, dialog, and macro sheets, VBA projects | Skipped and reported | - | Skipped, not reported | - |

The ExcelJS engine reads four things differently, whatever wrote the file:

- A boolean attribute spelled `"true"`, as LibreOffice and SheetJS write it, reads as false. A protected sheet with no password imports unprotected, a right-to-left sheet reports `layoutDirection: 'ltr'`, a workbook in the 1904 date system shifts every date back by 1,462 days, and a SheetJS `t="d"` date cell imports as a wrong date.
- A number format with an escaped percent sign, such as `0.0\%`, reads as a percentage, so `12.5` shows as `1250.0%`.
- A cell that uses one of Excel's built-in currency or accounting formats (ids 5-8 and 41-44) imports with no number format.
- A workbook that openpyxl saved with a cell comment is refused, because ExcelJS looks for comments under `xl/comments<N>.xml` only.

Both engines write a sheet synchronously. A very large grid blocks the tab for as long as the sheet takes to serialize, so export it from an interaction the user started, not from a timer.

## Limits

| Bound | Value | On breach |
|---|---|---|
| File size (import) | 128 MiB | Refused before parsing. |
| Sheet dimensions | 1,048,576 rows by 16,384 columns | The import refuses the sheet. The built-in export refuses with a message that names the sheet; ExcelJS refuses too many columns but writes too many rows without a warning. |
| Cells per sheet (import) | 5,000,000 | Refused while reading, before the cells are allocated. A declared size is not taken at face value: a few rows under a declared `A1:XFD1048576` import as those few rows. |
| Cells per workbook (import) | 10,000,000 | Same. |
| Sheets per workbook (import) | 2,048 | Refused, on both engines. |
| Inflated archive size (built-in import) | 256 MiB in total | Reading stops. A re-import of the built-in engine's own export tops out near 3,000,000 cells because of this. |
| Per-cell settings (import) | 1,000,000 cells, or the number of data cells when that is higher | Refused while reading. Only a file with little data under its settings reaches it, such as two list validations with different lists split over a million empty rows. |
| Formula length (import) | 32,768 characters | `formula:tooLong`; the cell keeps its cached value. |
| Defined names (built-in import) | 65,536 | `definedNames:truncated`; a formula over a later name can show `#NAME?`. |
| Text per cell (export) | 32,767 characters | `cellText:truncated`; the text is cut. |
| Column width | 260 width units (about 1,820 pixels) | Clamped on export, reported as `columnWidth:clamped`; skipped on import. |
| Row height | 409.5 points (546 pixels) | Clamped on export, reported as `rowHeight:clamped`; skipped on import. |
| Number format length | 255 characters | `numFmt:<pattern>`; the cells get the `numeric` type with no format. |

Both engines read every sheet even when you import one, so the workbook-wide caps apply to the whole file. The caps are security bounds, not a comfort promise: a sheet near the 5,000,000-cell cap takes tens of seconds and several gigabytes of memory. Keep imports well below it, or split the workbook.

## Dropped features on import

The import prints one console warning per call that names the engine and every key below that applied, and returns the same keys on `result.dropped` as a list of names. The counts are not reported.

| Key | What it means |
|---|---|
| `cellStyles` | The workbook carries cell styling and `importStyles` is off. Recorded only then: with `importStyles: true`, styling the grid cannot carry (theme fills, gradients, font size and name, wrapped or rotated text) is lost with no entry. The built-in engine does not count the default alignment LibreOffice writes on every cell, or the workbook's default font, as styling. |
| `cellStyles:borders` | The workbook carries borders and the `CustomBorders` plugin is not enabled on the grid. |
| `comments` | The workbook carries cell comments and the `Comments` plugin is not enabled. Set `comments: true` to import them. |
| `comment:header` | A comment on a row the import promotes to column headers. A header cannot hold a comment. |
| `threadedComments` | The workbook carries Excel 365 threaded comments. Each thread imports as one cell comment holding the comment and its replies, one per line, without authors or dates. |
| `comment:unreadable` | ExcelJS engine only: a comment stored as plain text, which ExcelJS reads as empty. The built-in engine reads it. |
| `mergeCells`, `hiddenRows`, `hiddenColumns` | The workbook carries the feature and the plugin of that name is not registered. |
| `cellType:<name>` | A column or cell got a type that is not registered, such as `intl-datetime` when you register modules one by one. The cells import as `text`. Recorded only when the result is applied. |
| `dataValidation:<type>` | A non-list data validation, which has no grid equivalent. |
| `dataValidation:unresolvedList` | A list validation whose source cannot be read: a formula such as `INDIRECT()`, a defined name, or a range on a sheet the workbook does not hold. An inline list, and a range on the same or another sheet, become a `dropdown` column. |
| `numFmt:<pattern>` | A number format with no `Intl.NumberFormat` equivalent, or one the import does not apply. See [number formats](#dates-times-and-number-formats). |
| `formula:noCachedValue` | A formula imported as a value (the Formulas plugin is off, or `importFormulas` is `false`) with no cached result in the file. The cell imports empty; the formula is listed in `result.formulas`. openpyxl writes every formula this way. |
| `formula:outOfRange` | A formula whose reference would land before the imported window's origin or past the sheet maximum. Its cached value is imported instead. A reference past the window's end stays live and points at an empty cell. |
| `formula:otherSheet` | A formula referencing a sheet the Formulas plugin's engine does not hold, another workbook, or a range of sheets. Its cached value is imported and the formula is listed in `result.formulas`. A reference to the imported sheet's own name is read as a reference to the grid. |
| `formula:definedName` | A formula using a workbook name the Formulas plugin's engine does not define. Its cached value is imported. Add the name to a pre-built HyperFormula instance before the import to keep it live. The ExcelJS engine reports only names over a range; a constant name stays live and shows `#NAME?`. |
| `formula:tooLong` | Built-in engine only: a formula longer than 32,768 characters. The cell keeps its cached value. |
| `formula:dataTable` | Built-in engine only: an Excel what-if data table. Its cells keep their cached values; nothing recalculates. The ExcelJS engine does not report it. |
| `definedNames:truncated` | Built-in engine only: the workbook defines more than 65,536 names. |
| `cellValue:date` | Built-in engine only: a `t="d"` date cell whose value is not an ISO 8601 date. The cell imports empty. |
| `cellValue:sharedString` | Built-in engine only: a text cell pointing at a shared string the workbook does not hold. The cell imports empty. |
| `conditionalFormatting:<kind>` | Built-in engine only: a `colorScale`, `dataBar`, or `iconSet` rule, which it leaves out of `result.conditionalFormatting`. The ExcelJS engine reads these rules complete. |
| `conditionalFormatting:unparsedRef` | A conditional formatting range the plugin could not parse. The rule's other ranges still apply. |
| `layoutDirection` | The sheet's direction disagrees with the grid's. The grid resolves [`layoutDirection`](@/api/options.md#layoutdirection) at initialization, so construct it with `layoutDirection: 'rtl'` for a right-to-left workbook. The direction is on `result.layoutDirection` either way. |
| `sheetProtection:password` | The sheet is protected with a password. The file carries only a hash, so no password is recovered. `readOnly` cells are still derived from the protection. |
| `images` | The sheet carries a picture, a shape, a chart, or an Excel 365 in-cell picture. The grid has no home for them. |
| `tables` | The sheet defines Excel tables. Their values are imported; the definitions are not. |
| `autoFilter` | The sheet carries an auto-filter range. Configure the [Filters](@/guides/columns/column-filter/column-filter.md) plugin instead. |
| `hyperlink` | A cell is a hyperlink. Its text is imported; the URL is not. |
| `richText` | A cell mixes formatting inside one string. The text is imported; the per-run formatting is not. |
| `chartSheets`, `dialogSheets`, `macroSheets` | Built-in engine only: the workbook holds such a sheet. It is skipped, and a numeric `sheet` option counts worksheets only. |
| `vbaProject` | Built-in engine only: the workbook carries macros (an `.xlsm` file). The data is imported; the macros are never read or run. |

Pivot tables, outline groups, sparklines, and scenarios are lost with no entry on either engine.

Four groups of keys end in a value from the file: `cellType:`, `conditionalFormatting:`, `dataValidation:`, and `numFmt:`. The value is cut to 64 characters, its control characters are replaced, and after 32 distinct values across those groups in one import the rest are reported as `<group>:other`.

## Dropped features on export

The export prints one console warning per call that names the engine and every key below that applied.

| Key | What it means |
|---|---|
| `compressionLevel` | You set a numeric `compression` level other than 6 and the built-in engine cannot honor it. The Compression Streams API has no level parameter. Pass `compression: false` to store the entries instead. |
| `merge:overlap` | Two merged ranges overlap. The later one is skipped. |
| `cellText:truncated` | A text value longer than 32,767 characters was cut, on both engines. |
| `columnWidth:clamped`, `rowHeight:clamped` | A column or row wider or taller than Excel stores was written at the limit, on both engines. |
| `conditionalFormatting:<type>` | A rule kind the built-in engine does not write, such as `colorScale`, `dataBar`, or `iconSet`. ExcelJS reports those three only for a rule it cannot write, such as one with no `cfvo` thresholds. The names `containsBlanks`, `notContainsBlanks`, `containsErrors`, and `notContainsErrors` are `operator` values of a `containsText` rule, not kinds of their own. |
| `conditionalFormatting:invalid` | An entry that is not a rule object with a string `type`. Both engines skip it. |
| `conditionalFormatting:expression` | An `expression` rule with no `formulae`. Both engines skip it. |
| `conditionalFormatting:timePeriod` | A `timePeriod` rule with no `timePeriod` string, or with no `formulae` and a period other than `today`, `yesterday`, `tomorrow`, `last7Days`, `thisWeek`, `lastWeek`, `nextWeek`, `thisMonth`, `lastMonth`, or `nextMonth`. Both engines skip it; for the periods listed, both build the formula themselves. |
| `conditionalFormatting:other` | The bucket for rule kinds past 32 distinct ones in one export. |

## Security

The workbook is untrusted input, and the plugins treat it that way.

- **Column headers are escaped.** The grid renders `colHeaders` as HTML, so every header the import promotes is HTML-escaped. `R&D` is stored as `R&amp;D`; set [`textExtractor: true`](@/api/options.md#textextractor) to re-export it as text. On a page that enforces Trusted Types, configure the [`sanitizer`](@/api/options.md#sanitizer) option before you import headers, or such an import rejects.
- **Cell values are rendered as text.** They need no escaping and keep whatever the file wrote.
- **A text value that starts with `=` stays text.** With the Formulas plugin on, the import writes it with the plugin's apostrophe escape, so the file's text cannot become a live formula; a cell the file declares as a formula is imported as one. With the Formulas plugin off, nothing escapes such text, and an export with `exportFormulas: true` writes every `=`-leading text as a live formula. Keep `exportFormulas` off for a grid that holds imported data and has no Formulas plugin.
- **A text value that starts with `'=` keeps its apostrophe.** With the Formulas plugin on, it is escaped once more, so the data holds `''=x`, and the cell shows the doubled apostrophe.
- **Colors are validated before they reach a stylesheet.** A font or fill color that is not plain hex is skipped. A border color that is not plain hex falls back to black, and a border style other than thin, medium, or thick becomes 1 px.
- **Layout values are bounded.** A column width or row height that is not a positive number, or is above the limits in the table above, is skipped. A frozen pane count is rounded down, and a hidden index that is not a whole number is skipped on its own.
- **Only spreadsheet workbooks are read.** The built-in engine reads `.xlsx`, `.xlsm`, `.xltx`, `.xltm`, and `.xlam` files; a macro-enabled file imports like an `.xlsx` file and its macros are never run. An `.xlsb`, an `.xls`, an `.ods` saved under an Excel name, a password-protected workbook, and an archive with truncated or mis-nested XML are refused with a message that says what to do. Hyperlink targets, external links, and embedded objects are not read.
- **Oversized input is refused** at the limits in the table above, before the cells are allocated. ExcelJS runs its own parse, after which the plugin enforces the sheet, row, column, and cell caps; the inflate caps apply to the built-in engine only. ExcelJS 4.4.0 can also be made to change `Object.prototype` by a crafted workbook, such as one with a sheet named `__proto__` and a defined name pointing at it. Read files from untrusted sources with the built-in engine.
- **A formula range is not bounded.** A 2 KB file can hold `SUM(A1:XFD1048576)`, which HyperFormula evaluates and which can crash the tab. Import files you do not trust with the Formulas plugin off, with `importFormulas: false`, or with `apply: false` first, and check `result.formulas` before you apply.
- **Per-cell settings are bounded** at the limit in the table above. The plugin applies a setting a whole column shares once, to the column, and gives a cell its own setting only where it differs.
- **References are bounded.** A list validation or conditional formatting range past the sheet limits is not read, and one over a whole column or row is clamped to the cells the sheet holds. A merged range is not clamped and counts against the cell caps.
- **`password` cells are exported in clear text.** Exclude them with `range`, or clear them before you export.

## Dates, times, and number formats

### Import

- A `date`, `intl-datetime`, or `time` cell type is derived from the cell's number format, with `Intl.DateTimeFormat` options in `dateFormat`, `dateTimeFormat`, or `timeFormat`. A format with both a date and a time part becomes `intl-datetime`, stored as `YYYY-MM-DD HH:mm:ss`.
- An elapsed-time format such as `[h]:mm` becomes a `time` cell when the value fits a clock (under 24 hours for `[h]`, under an hour for `[m]`, under a minute for `[s]`). A longer or negative duration stays `numeric` with the Excel serial, reported as `numFmt:<pattern>`.
- A `numeric` type carries `Intl.NumberFormat` options derived from the format. A quoted currency symbol is kept. Three capital letters next to the number read as a currency only when they form an ISO 4217 code; a unit such as `0" DAY"` imports as a plain number. A `$` in an Excel locale token, such as `[$$-C09]`, reads as that locale's currency, so an exported Australian dollar imports back as one. A zero-padded format such as `00000` keeps its leading zeros.
- A boolean cell, and a number under the format `"TRUE";"TRUE";"FALSE"`, become `checkbox` cells. `inferCellTypes: false` turns all of this off, dropdowns included: dates and times then import as raw serials.
- Not applied, and reported as `numFmt:<pattern>`: scientific notation, fractions, more than 100 fraction digits, a condition section such as `[>=1000]0.0,"K";0`, a trailing-comma scale such as `#,##0,`, and a format above 255 characters. A format whose negative section is not a plain minus sign keeps its positive formatting and is reported too, because negative numbers show with a minus sign. Only the first section and its unquoted tokens are read; quoted text inside a date format, such as `"of"`, is not shown.
- The displayed text comes from the browser's `Intl.DateTimeFormat`, so it can differ between browsers (Safari writes `Mar 14, 2024 at 13:45` where Chrome writes `Mar 14, 2024, 13:45`). An `intl-datetime` value that falls into a daylight saving gap in the viewer's time zone shows one hour later. The stored value is the same everywhere.

### Export

- A `numericFormat` is translated to an Excel format with `Intl.NumberFormat`. A currency symbol is written in quotes, such as `"USD"#,##0.00` or `#,##0.00"zł"`; only a lone `$` is written as it is. A symbol several currencies share is written as an Excel locale token that names the currency's home locale, such as `[$kr-414]` for the Norwegian krone or `[$$-C09]` for the Australian dollar, so it imports back as the same currency. `minimumIntegerDigits` becomes leading zeros.
- A `dateFormat` or `timeFormat` is translated in the order and with the separators the cell's [`locale`](@/api/options.md#locale) renders: `{ year: 'numeric', month: '2-digit', day: '2-digit' }` is `mm/dd/yyyy` under `en-US` and `dd.mm.yyyy` under `de-DE`. A format that sets no `hour12` takes its clock from the locale, and the file always states a clock, so set `hour12` yourself to pin it across a round trip.
- A date before 1900, and a date that does not exist such as `2023-02-29`, are written as text.
- A carriage return in a text cell is stored as `_x000D_`, as Excel does. Excel and the import read it back; openpyxl and pandas with its default engine show the literal text. In pandas, read with `engine='calamine'`.
- A formula error such as `#DIV/0!` is stored as an Excel error cell under its English code, even when a HyperFormula `language` translates what the grid shows. An error Excel has no code for, such as `#CYCLE!`, is stored as text. An array formula is written as one plain formula in its first cell, with the spilled cells as values. Named expressions are not exported, so `=SUM(Sales)` shows `#NAME?` in the file.
- With `exportFormulas` and the `sheets` option, a formula that names another sheet in the same export, such as `=Rates!A1`, is written as typed and is not shifted by that sheet's header row and row-header column, so it points one row up and one column left of the intended cell. Same-sheet references are shifted correctly.

## Concurrent imports

When you start a new import before the previous one finishes, the last one wins. The earlier call is not applied: its promise rejects with `a newer import started before this one finished`, and `afterImport` does not fire for it, even when its file finishes reading first. An import with `apply: false` neither cancels another import nor is cancelled by one, and a call refused before it reads the file, such as one with an invalid option, cancels nothing either.

## Test environments

The built-in engine needs four globals: `CompressionStream`, `DecompressionStream`, `TextEncoder`, and `TextDecoder`. Every browser Handsontable supports provides them. Jest's `jsdom` environment and Jest 27's `node` environment lack them, and the plugins then reject with a message that names the missing globals. Jest's `node` environment provides all four from Jest 28 on, and Vitest's `jsdom` and `happy-dom` environments provide them.

To run the engine under Jest's `jsdom` environment, assign the globals from Node.js in a `setupFiles` module:

```javascript
const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

Object.assign(globalThis, { CompressionStream, DecompressionStream, TextEncoder, TextDecoder });
```

In jsdom before 28.1 (Jest 30 ships 26.1), `Blob` has no `arrayBuffer()` method, so `importFromBlob()` fails with any engine. Call `importFromArrayBuffer()` with the file's `ArrayBuffer` instead, or add the method in the same module:

```javascript
if (typeof Blob.prototype.arrayBuffer !== 'function') {
  Blob.prototype.arrayBuffer = function arrayBuffer() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
```

A download also needs `URL.createObjectURL`, which jsdom lacks. Mock it together with `URL.revokeObjectURL`, because the plugin revokes the URL from a timer 100 ms after the download:

```javascript
URL.createObjectURL = jest.fn(() => 'blob:mock'); // vi.fn() in Vitest
URL.revokeObjectURL = jest.fn();
```

Keep the grids you export under jsdom or happy-dom to a few hundred rows and give the first export a longer timeout: jsdom computes styles slowly, so a first export of 2,000 rows can outlast the default 5-second timeout, and happy-dom can run out of memory at 20,000 rows. Real browsers export such grids in about a second.

To inject ExcelJS under Jest 29 with `jest-environment-jsdom`, set `testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] }`, or loading it fails with `SyntaxError: Unexpected token 'export'`.

## Related articles

**Related guides**

<div class="boxes-list">

- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)

</div>

## Related API reference

**Configuration options**

<div class="boxes-list">

- [importFile](@/api/options.md#importfile)
- [exportFile](@/api/options.md#exportfile)

</div>

**Plugins**

<div class="boxes-list">

- [ImportFile](@/api/importFile.md)
- [ExportFile](@/api/exportFile.md)

</div>

**Hooks**

<div class="boxes-list">

- [beforeImport](@/api/hooks.md#beforeimport)
- [afterImport](@/api/hooks.md#afterimport)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
