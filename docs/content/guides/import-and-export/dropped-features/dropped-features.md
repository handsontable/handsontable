---
type: reference
title: Dropped features reference
metaTitle: Dropped features reference | Handsontable DataGrid for JavaScript
description: Every key the ImportFile and ExportFile plugins report when an XLSX file carries something the grid or the file cannot hold, and which engine reports it.
permalink: /dropped-features
canonicalUrl: /dropped-features
tags:
  - xlsx
  - excel
  - import from file
  - export to file
  - dropped features
react:
  metaTitle: Dropped features reference | Handsontable DataGrid for React
angular:
  metaTitle: Dropped features reference | Handsontable DataGrid for Angular
vue:
  metaTitle: Dropped features reference | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: new
addedIn: "19.0.0"
---

An XLSX import or export can meet something the other side cannot hold. The plugin then reports it under a key instead of failing. This page lists every key, what it means, and which [engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md) reports it.

[[toc]]

## How keys are reported

- **Import:** one console warning per call names the engine and every key that applied. The same keys come back on `result.dropped`, as a list of names. The counts are not reported.
- **Export:** one console warning per call names the engine and every key that applied.

In the **Reported by** column, **Both** means the built-in engine and ExcelJS report the key. A key reported by one engine only says so.

Four groups of keys end in a value: `cellType:` in the inferred type name, and `conditionalFormatting:`, `dataValidation:`, and `numFmt:` in a value from the file. The value is cut to 64 characters, and its control characters are replaced. After 32 distinct values across those groups in one import, the rest are reported as `<group>:other`.

## Dropped on import

| Key | Reported by | What it means |
|---|---|---|
| `cellStyles` | Both | The workbook carries cell styling, and `importStyles` is off. Recorded only then: with `importStyles: true`, styling the grid cannot carry (theme fills, gradients, font size and name, wrapped or rotated text) is lost with no entry. The built-in engine does not count the default alignment LibreOffice writes on every cell, or the workbook's default font, as styling. |
| `cellStyles:borders` | Both | `importStyles` is on, the workbook carries borders, and the `CustomBorders` plugin is not enabled on the grid. |
| `comments` | Both | The workbook carries cell comments, and the `Comments` plugin is not enabled. Set `comments: true` to import them. |
| `comment:header` | Both | A comment on a row the import promotes to column headers. A header cannot hold a comment. |
| `threadedComments` | Both | The workbook carries Excel 365 threaded comments. Each thread imports as one cell comment holding the comment and its replies, one per line, without authors or dates. |
| `comment:unreadable` | ExcelJS | A comment stored as plain text, which ExcelJS reads as empty. The built-in engine reads it. |
| `mergeCells`, `hiddenRows`, `hiddenColumns` | Both | The workbook carries the feature, and the plugin of that name is not registered. Recorded only when the result is applied. |
| `cellType:<name>` | Both | A column or cell got a type that is not registered, such as `intl-datetime` when you register modules one by one. The cells import as `text`. Recorded only when the result is applied. |
| `dataValidation:<type>` | Both | A non-list data validation, which has no grid equivalent. |
| `dataValidation:unresolvedList` | Both | A list validation whose source cannot be read: a formula such as `INDIRECT()`, a defined name, or a range on a sheet the workbook does not hold. An inline list, and a range on the same or another sheet, become a `dropdown` column. |
| `numFmt:<pattern>` | Both | A number format with no `Intl.NumberFormat` equivalent, one the import does not apply, or one longer than 255 characters. The ExcelJS engine also records it for a cell whose value it cannot read as a date under that format; the cell imports empty. See [number formats](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#dates-times-and-number-formats). |
| `formula:noCachedValue` | Both | A formula imported as a value (the Formulas plugin is off, or `importFormulas` is `false`) with no cached result in the file. The cell imports empty; the formula is listed in `result.formulas`. openpyxl writes every formula this way. |
| `formula:outOfRange` | Both | A formula whose reference would land before the imported window's origin or past the sheet maximum. Its cached value is imported instead. A reference past the window's end stays live and points at an empty cell. |
| `formula:otherSheet` | Both | A formula referencing a sheet the Formulas plugin's engine does not hold, another workbook, or a range of sheets. Its cached value is imported, and the formula is listed in `result.formulas`. A reference to the imported sheet's own name is read as a reference to the grid. |
| `formula:definedName` | Both | A formula using a workbook name the Formulas plugin's engine does not define. Its cached value is imported. Add the name to a pre-built HyperFormula instance before the import to keep it live. The ExcelJS engine reports only names over a range; a constant name stays live and shows `#NAME?`. |
| `formula:tooLong` | Built-in | A formula longer than 32,768 characters. The cell keeps its cached value. |
| `formula:dataTable` | Built-in | An Excel what-if data table. Its cells keep their cached values; nothing recalculates. The ExcelJS engine does not report it. |
| `definedNames:truncated` | Built-in | The workbook defines more than 65,536 names. A formula over a later name can show `#NAME?`. |
| `cellValue:date` | Built-in | A `t="d"` date cell whose value is not an ISO 8601 date. The cell imports empty. |
| `cellValue:sharedString` | Built-in | A text cell pointing at a shared string the workbook does not hold. The cell imports empty. |
| `conditionalFormatting:<kind>` | Built-in | A `colorScale`, `dataBar`, or `iconSet` rule, or a rule Excel stores only in its 2010 extension (the 3 Triangles, 3 Stars, and 5 Boxes icon sets, or a rule whose formula refers to another sheet). The engine leaves it out of `result.conditionalFormatting`. The ExcelJS engine reads `colorScale`, `dataBar`, and `iconSet` rules complete. |
| `conditionalFormatting:unparsedRef` | Both | A conditional formatting range the plugin could not parse. The rule's other ranges are still returned on `result.conditionalFormatting`. |
| `layoutDirection` | Both | The sheet's direction disagrees with the grid's. Recorded only when the result is applied. The grid resolves [`layoutDirection`](@/api/options.md#layoutdirection) at initialization, so construct it with `layoutDirection: 'rtl'` for a right-to-left workbook. The direction is on `result.layoutDirection` either way. |
| `sheetProtection:password` | Both | The sheet is protected with a password. The file carries only a hash, so no password is recovered. `readOnly` cells are still derived from the protection. |
| `images` | Both | The sheet carries a picture, a shape, a chart, or an Excel 365 in-cell picture. The grid has no home for them. The ExcelJS engine reports pictures only. |
| `tables` | Both | The sheet defines Excel tables. Their values are imported; the definitions are not. |
| `autoFilter` | Both | The sheet carries an auto-filter range. Configure the [Filters](@/guides/columns/column-filter/column-filter.md) plugin instead. |
| `hyperlink` | Both | A cell is a hyperlink. Its text is imported; the URL is not. |
| `richText` | Both | A cell mixes formatting inside one string. The text is imported; the per-run formatting is not. |
| `chartSheets`, `dialogSheets`, `macroSheets` | Built-in | The workbook holds such a sheet. It is skipped, and a numeric `sheet` option counts worksheets only. The ExcelJS engine skips it with no entry. |
| `vbaProject` | Built-in | The workbook carries macros (an `.xlsm` file). The data is imported; the macros are never read or run. |

Pivot tables, outline groups, sparklines, and scenarios are lost with no entry on either engine.

## Dropped on export

| Key | Reported by | What it means |
|---|---|---|
| `compressionLevel` | Built-in | You set a numeric `compression` level other than 6, which the built-in engine cannot honor. The Compression Streams API has no level parameter. Pass `compression: false` to store the entries instead. |
| `merge:overlap` | Both | Two merged ranges overlap. The later one is skipped. |
| `cellText:truncated` | Both | A text value longer than 32,767 characters was cut. |
| `columnWidth:clamped`, `rowHeight:clamped` | Both | A column or row wider or taller than Excel stores was written at the limit. |
| `conditionalFormatting:<type>` | Built-in; ExcelJS for some rules | A rule kind the built-in engine does not write, such as `colorScale`, `dataBar`, or `iconSet`. ExcelJS reports those three only for a rule it cannot write, such as one with no `cfvo` thresholds. For a rule kind it does not know, such as `duplicateValues` or `uniqueValues`, ExcelJS writes an empty block and reports nothing. The names `containsBlanks`, `notContainsBlanks`, `containsErrors`, and `notContainsErrors` are `operator` values of a `containsText` rule, not kinds of their own. |
| `conditionalFormatting:invalid` | Both | An entry that is not a rule object with a string `type`. The rule is skipped. |
| `conditionalFormatting:expression` | Both | An `expression` rule with no `formulae`. The rule is skipped. |
| `conditionalFormatting:timePeriod` | Both | A `timePeriod` rule with no `timePeriod` string, or with no `formulae` and a period other than `today`, `yesterday`, `tomorrow`, `last7Days`, `thisWeek`, `lastWeek`, `nextWeek`, `thisMonth`, `lastMonth`, or `nextMonth`. The rule is skipped. For the periods listed, both engines build the formula themselves. |
| `conditionalFormatting:other` | Both | The bucket for rule kinds past 32 distinct ones in one export. |

## Related articles

**Related guides**

<div class="boxes-list">

- [Import and export overview](@/guides/import-and-export/import-and-export/import-and-export.md)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)

</div>

## Related API reference

**Plugins**

<div class="boxes-list">

- [ImportFile](@/api/importFile.md)
- [ExportFile](@/api/exportFile.md)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
