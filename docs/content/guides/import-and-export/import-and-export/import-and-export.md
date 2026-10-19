---
type: explanation
title: Import and export
metaTitle: Import and export | Handsontable DataGrid for JavaScript
description: Move data between your grid and files - export to Excel and CSV, import Excel workbooks, and pick the XLSX engine that fits your app.
permalink: /import-and-export
canonicalUrl: /import-and-export
tags:
  - import from file
  - export to file
  - xlsx
  - csv
  - excel
react:
  metaTitle: Import and export | Handsontable DataGrid for React
angular:
  metaTitle: Import and export | Handsontable DataGrid for Angular
vue:
  metaTitle: Import and export | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: new
---

Handsontable DataGrid exports its data to Excel (`.xlsx`) and CSV files, and imports Excel workbooks. Two plugins do the work, with no library to install: `ExportFile` writes files, and `ImportFile` reads them. This page shows which guide covers your task.

[[toc]]

## Pick a guide

| Task | Format | Plugin | Guide |
|---|---|---|---|
| Download the grid as a workbook, with cell types, styling, and formulas | XLSX | `ExportFile` | [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) |
| Load a workbook the user picked into the grid | XLSX | `ImportFile` | [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) |
| Download the grid's values as text | CSV | `ExportFile` | [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md) |
| Load a CSV file | CSV | None; the recipe parses it with PapaParse | [Import from CSV or Excel](@/recipes/import-export/import-csv-excel/import-csv-excel.md) recipe |
| Download the grid as a PDF file | PDF | None; the recipe uses jsPDF | [Export to PDF](@/recipes/import-export/export-to-pdf/export-to-pdf.md) recipe |
| Copy and paste between the grid and other apps | Clipboard | `CopyPaste` | [Clipboard](@/guides/cell-features/clipboard/clipboard.md) |

## Turn the plugins on

Both plugins are part of `registerAllModules()`.

- The `ImportFile` plugin is on unless you set `importFile: false`.
- The `ExportFile` methods work whatever the `exportFile` value. Set `exportFile` to any value, for example `exportFile: true`, to add the **Export** item to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

## Engines

Excel files are read and written by an engine. The built-in engine needs no library, and you can inject [ExcelJS](https://github.com/exceljs/exceljs) instead. [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md) compares the two and covers bundle size, limits, and security.

## What a file cannot carry

A workbook can hold things the grid has no place for, such as pictures or pivot tables, and the grid can hold things an Excel file cannot store. Instead of failing, an import or export reports each one under a key, in a console warning and, for an import, on `result.dropped`. The [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md) explains every key.

## Related articles

**Related guides**

<div class="boxes-list">

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)
- [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md)

</div>

## Related API reference

**Plugins**

<div class="boxes-list">

- [ExportFile](@/api/exportFile.md)
- [ImportFile](@/api/importFile.md)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
