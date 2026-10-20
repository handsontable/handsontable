---
type: reference
title: XLSX engines
metaTitle: XLSX engines | Handsontable DataGrid for JavaScript
description: The built-in XLSX engine and ExcelJS behind the ImportFile and ExportFile plugins - how they compare, when to choose ExcelJS, bundle size, moving from 18.1, known differences, limits, and security bounds.
permalink: /xlsx-engine
canonicalUrl: /xlsx-engine
tags:
  - xlsx
  - excel
  - import from file
  - export to file
react:
  metaTitle: XLSX engines | Handsontable DataGrid for React
angular:
  metaTitle: XLSX engines | Handsontable DataGrid for Angular
vue:
  metaTitle: XLSX engines | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: new
addedIn: "19.0.0"
---

Handsontable DataGrid reads and writes `.xlsx` files through an engine. The built-in engine needs no library. [ExcelJS](https://github.com/exceljs/exceljs) is the alternative you can inject. Both [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) and [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) use the engine you configure.

[[toc]]

## Compare the engines

The table covers both directions: **read** is what an import takes from the file, and **write** is what an export puts into it.

| Feature | Built-in read | Built-in write | ExcelJS read | ExcelJS write |
|---|---|---|---|---|
| Values, number formats, formulas | Yes | Yes | Yes | Yes |
| Merged cells, widths, heights, hidden rows and columns, frozen panes | Yes | Yes | Yes | Yes |
| Bold, italic, underline, font color, fill, alignment, borders | Yes | Yes | Yes | Yes |
| Comments | Yes, threaded comments included | Yes | Yes, except a comment stored as plain text, which is skipped and reported as `comment:unreadable` | Yes |
| List validation (dropdown sources) | Yes | Yes | Yes | Yes |
| Conditional formatting | All rule kinds except `colorScale`, `dataBar`, `iconSet`, and rules Excel stores only in an `x14` extension | `cellIs`, `expression`, `containsText`, `top10`, `aboveAverage`, `timePeriod` | All kinds | `cellIs`, `expression`, `containsText`, `top10`, `aboveAverage`, `timePeriod`, `colorScale`, `dataBar`, `iconSet`; any other kind, such as `duplicateValues`, is left out with no report |
| Numeric `compression` level | - | Platform default, reported as `compressionLevel` for any level but 6 | - | Honored |
| Defined names | Ranges and constants | - | Ranges only | - |
| Chart, dialog, and macro sheets, VBA projects | Skipped and reported | - | Skipped, not reported | - |

What each engine reports when it drops something: [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md).

## When to choose ExcelJS

Use the built-in engine unless you need one of these:

- A numeric `compression` level. The built-in engine replaces the number with the platform's DEFLATE level; `compression: false` still stores the file uncompressed on both engines.
- An export with `colorScale`, `dataBar`, or `iconSet` conditional formatting rules. The built-in engine leaves them out and reports them.
- An import that returns `colorScale`, `dataBar`, or `iconSet` rules on `result.conditionalFormatting`.
- Output closest to what your 18.1 configuration wrote, while you compare files. ExcelJS keeps its own file layout, but the 19.0 export fixes apply to both engines. See [Moving from 18.1](#moving-from-181).

ExcelJS adds about 258 kB (gzipped) to your bundle, reads some files differently (see [Known differences](#known-differences)), and is not safe for files from untrusted sources (see [Security](#security)).

## Choose the engine

You set the engine in two places:

- **For the grid:** pass ExcelJS as `engines: { xlsx: ExcelJS }` in the `importFile` or `exportFile` settings. Every import or export of that grid uses it.
- **For one call:** pass ExcelJS as the `engine` option of an import or export method. It overrides the grid's engine for that call only.

An `engine` of `null`, or no `engine` key, means no override: the call uses the grid's engine, or the built-in one when `engines` names none.

```javascript
import ExcelJS from 'exceljs';

// every export of this grid uses ExcelJS
const hot = new Handsontable(container, {
  exportFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
});

// this import alone uses ExcelJS
await hot.getPlugin('importFile').importFromBlob('xlsx', file, { engine: ExcelJS });
```

ExcelJS 4.4 or later is recommended, but the version is not checked: the plugins look for a `Workbook` constructor and nothing else.

## Bundle size

The built-in engine ships inside the `ExportFile` and `ImportFile` plugins. Measured gzipped, the `ExportFile` module is about 51 kB and the `ImportFile` module about 53 kB, each with the engine included. The engine code the two share is bundled once. To leave the engine out, do not register either plugin. See [Modules](@/guides/tools-and-building/modules/modules.md).

ExcelJS is a separate dependency. Its 4.4.0 browser build (`exceljs.min.js`) is about 948 kB minified and about 258 kB gzipped, on top of the plugins.

## Moving from 18.1

In 18.1, an XLSX export required ExcelJS: you passed it as `exportFile: { engines: { xlsx: ExcelJS } }`, and without it the plugin refused the format. Since 19.0, the built-in engine writes the format with no engine configured.

- **To keep ExcelJS,** change nothing. `engines: { xlsx: ExcelJS }` still selects it.
- **To switch to the built-in engine,** remove the `engines` entry and the `exceljs` dependency. Check the files you export against [Known differences](#known-differences) and the [comparison table](#compare-the-engines).

Without an engine, `supportsExportFormat('xlsx')` now returns `true`, and the context menu shows **To Excel**. The full list of changes is in the [migration guide](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md#xlsx-export-no-longer-needs-exceljs).

## Known differences

### ExcelJS on import

The ExcelJS engine reads these files differently, whatever wrote them:

- A boolean attribute spelled `"true"` or `"false"`, as LibreOffice writes them (SheetJS writes `date1904="true"`), reads as the attribute's default. A protected sheet with no password imports unprotected, an unlocked cell imports locked, a right-to-left sheet reports `layoutDirection: 'ltr'`, and a workbook in the 1904 date system shifts every date back by 1,462 days.
- A `t="d"` date cell, as SheetJS writes with `cellDates`, is read as the number before its first non-digit (`2024-01-15` reads as `2024`), so it imports as a wrong date with no entry in `dropped`.
- A number format with an escaped percent sign, such as `0.0\%`, reads as a percentage, so `12.5` shows as `1250.0%`.
- A cell that uses one of Excel's built-in currency or accounting formats (ids 5-8 and 41-44) imports with no number format.
- A workbook that openpyxl saved with a cell comment is refused, because ExcelJS looks for comments under `xl/comments<N>.xml` only.

### ExcelJS on export

- ExcelJS writes a carriage return in a text cell unescaped, and it reads back as a line feed.
- ExcelJS writes too many rows for one sheet with no warning. The built-in engine refuses them with a message that names the sheet. See [Limits](#limits).
- ExcelJS writes nothing and reports nothing for a conditional formatting rule kind it does not know, such as `duplicateValues`.

### Built-in engine

- The built-in engine stores a carriage return in a text cell as `_x000D_`, as Excel does. Excel and the import read it back. openpyxl and pandas with its default engine show the literal text; in pandas, read with `engine='calamine'`.

### Both engines

Both engines write a sheet synchronously. A very large grid blocks the tab for as long as the sheet takes to serialize, so export it from an interaction the user started, not from a timer.

## Limits

| Bound | Value | On breach |
|---|---|---|
| File size (import) | 128 MiB | Refused before parsing. |
| Sheet dimensions | 1,048,576 rows by 16,384 columns | The import refuses the sheet. The built-in export refuses with a message that names the sheet; ExcelJS refuses too many columns but writes too many rows without a warning. |
| Cells per sheet (import) | 5,000,000 | Refused before the grid copy of the sheet is built: while reading on the built-in engine, right after its own parse on ExcelJS. A declared size is not taken at face value: a few rows under a declared `A1:XFD1048576` import as those few rows. |
| Cells per workbook (import) | 10,000,000 | Same. |
| Sheets per workbook (import) | 2,048 | Refused, on both engines. |
| Inflated archive size (built-in import) | 256 MiB in total | Reading stops. A file the built-in export wrote inflates to about 40-65 bytes per cell, and the budget charges text at two bytes per character, so this cap leaves room for about 2-3 million such cells; long text cells use more of it. |
| Per-cell settings (import) | 1,000,000 cells, or the number of data cells when that is higher | Refused while reading. Only a file with little data under its settings reaches it, such as two list validations with different lists split over a million empty rows. |
| XML nesting depth (built-in import) | 256 elements | Refused. A file written by a spreadsheet application nests about 20 levels deep. |
| Formula length (built-in import) | 32,768 characters | `formula:tooLong`; the cell keeps its cached value. |
| Defined names (built-in import) | 65,536 | `definedNames:truncated`; a formula over a later name can show `#NAME?`. |
| Text per cell (export) | 32,767 characters | `cellText:truncated`; the text is cut. |
| Column width | 260 width units (about 1,820 pixels) | Clamped on export, reported as `columnWidth:clamped`; skipped on import. |
| Row height | 409.5 points (546 pixels) | Clamped on export, reported as `rowHeight:clamped`; skipped on import. |
| Number format length | 255 characters | `numFmt:<pattern>`, cut to the first 63 characters; the cells import with no number format. |

Both engines read every sheet even when you import one, so the workbook-wide caps apply to the whole file. The caps are security bounds, not a comfort promise: a sheet near the 5,000,000-cell cap takes tens of seconds and several gigabytes of memory. Keep imports well below it, or split the workbook.

## Security

The workbook is untrusted input, and the plugins treat it that way.

- **Column headers are escaped.** The grid renders `colHeaders` as HTML, so every header the import promotes is HTML-escaped. `R&D` is stored as `R&amp;D`; set [`textExtractor: true`](@/api/options.md#textextractor) to re-export it as text. On a page that enforces Trusted Types, an import whose promoted headers contain `&`, `<`, `>`, `"`, or `'` rejects unless the [`sanitizer`](@/api/options.md#sanitizer) option returns a `TrustedHTML`, so configure it before you import headers.
- **Cell values are rendered as text.** They need no escaping and keep whatever the file wrote.
- **A text value that starts with `=` stays text.** With the Formulas plugin on, the import writes it with the plugin's apostrophe escape, so the file's text cannot become a live formula; a cell the file declares as a formula is imported as one. With the Formulas plugin off, nothing escapes such text, and an export with `exportFormulas: true` writes every `=`-leading text as a live formula. Keep `exportFormulas` off for a grid that holds imported data and has no Formulas plugin.
- **A text value that starts with `'=` keeps its apostrophe.** With the Formulas plugin on, it is escaped once more, so the data holds `''=x`, and the cell shows the doubled apostrophe.
- **Colors are validated before they reach a stylesheet.** A font or fill color that is not plain hex is skipped. A border color that is not plain hex falls back to black, and a border style other than thin, medium, or thick becomes 1 px.
- **Layout values are bounded.** A column width or row height that is not a positive number, or is above the limits in the table above, is skipped. A frozen pane count is rounded down, and a hidden index that is not a whole number is skipped on its own.
- **Only spreadsheet workbooks are read.** The built-in engine reads `.xlsx`, `.xlsm`, `.xltx`, `.xltm`, and `.xlam` files; a macro-enabled file imports like an `.xlsx` file and its macros are never run. An `.xlsb`, an `.xls`, an `.ods` saved under an Excel name, a password-protected workbook, and an archive with truncated or mis-nested XML are refused with a message that names the fault. Hyperlink targets, external links, and embedded objects are not read.
- **Oversized input is refused** at the limits in the table above. ExcelJS runs its own parse, after which the plugin enforces the sheet, row, column, and cell caps; the inflate caps apply to the built-in engine only. ExcelJS 4.4.0 can also be made to change `Object.prototype` by a crafted workbook, such as one with a defined name whose reference names a sheet `__proto__`. Read files from untrusted sources with the built-in engine.
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
- Not applied, and reported as `numFmt:<pattern>`: scientific notation, fractions, more than 100 fraction digits or more than 21 integer zeros, a condition section such as `[>=1000]0.0,"K";0`, a trailing-comma scale such as `#,##0,`, and a format above 255 characters. A format whose negative section is not a plain minus sign, or whose zero section shows text or nothing (such as `#,##0;-#,##0;"-"`), keeps its positive formatting and is reported too, because the grid shows negative numbers with a minus sign and zero with the first section. A number outside Excel's date range under a date format stays `numeric` and is reported, and a time format that shows fractions of a second imports as a whole-second time and is reported. Only the first section and its unquoted tokens are read; quoted text inside a date format, such as `"of"`, is not shown.
- The displayed text comes from the browser's `Intl.DateTimeFormat`, so it can differ between browsers (Safari writes `Mar 14, 2024 at 13:45` where Chrome writes `Mar 14, 2024, 13:45`). An `intl-datetime` value that falls into a daylight saving gap in the viewer's time zone shows one hour later. The stored value is the same everywhere.

### Export

- A `numericFormat` is translated to an Excel format with `Intl.NumberFormat`. A currency symbol is written in quotes, such as `"USD"#,##0.00` or `#,##0.00"zł"`; only a lone `$` is written as it is. A symbol several currencies share is written as an Excel locale token that names the currency's home locale, such as `[$kr-414]` for the Norwegian krone or `[$$-C09]` for the Australian dollar, so it imports back as the same currency. `minimumIntegerDigits` becomes leading zeros.
- A `dateFormat` is translated in the order and with the separators the cell's [`locale`](@/api/options.md#locale) renders: `{ year: 'numeric', month: '2-digit', day: '2-digit' }` is `mm/dd/yyyy` under `en-US` and `dd.mm.yyyy` under `de-DE`. A `timeFormat` is always written in `h:mm:ss` order. A format that sets no `hour12` takes its clock from the locale, and the file always states a clock, so set `hour12` yourself to pin it across a round trip.
- A date before 1900, and a date that does not exist such as `2023-02-29`, are written as text.
- With `exportFormulas`, a formula whose result is an error such as `#DIV/0!` is stored with an Excel error result under its English code, even when a HyperFormula `language` translates what the grid shows. An error Excel has no code for, such as `#CYCLE!`, is cached as text. Without `exportFormulas`, an error is stored as the text the grid shows. An array formula is written as one plain formula in its first cell, with the spilled cells as values. A formula that uses HyperFormula's `ARRAYFORMULA` keeps that name, which Excel does not know, so it shows `#NAME?` in Excel. Named expressions are not exported, so `=SUM(Sales)` shows `#NAME?` in the file.
- With `exportFormulas`, a same-sheet reference is shifted by the header rows and the row-header column, but not by the start of `range`: with a `range` that does not start at row 0 and column 0, references point at the wrong cells. A formula that names another sheet in the same export, such as `=Rates!A1`, is written as typed, so it points as many rows up as that sheet has header rows, and one column left when that sheet has row headers.

## Concurrent imports

When you start a new import before the previous one finishes, the last one wins. The earlier call is not applied: its promise rejects with `a newer import started before this one finished`, and `afterImport` does not fire for it, even when its file finishes reading first. An import with `apply: false` neither cancels another import nor is cancelled by one, and a call refused before it reads the file, such as one with an invalid option, cancels nothing either.

## Test environments

To run either engine under Jest or Vitest, see [Testing](@/guides/tools-and-building/testing/testing.md#test-import-and-export-in-jest-or-vitest).

## Related articles

**Related guides**

<div class="boxes-list">

- [Import and export overview](@/guides/import-and-export/import-and-export/import-and-export.md)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md)

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
