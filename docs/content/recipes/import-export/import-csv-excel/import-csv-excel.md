---
id: h7j2k9m4
title: Import from CSV or Excel
metaTitle: Import CSV or Excel - JavaScript Data Grid | Handsontable
description: Load CSV or XLSX files into Handsontable with PapaParse and SheetJS, preview headers, and handle errors in the browser.
permalink: /recipes/import-export/import-csv-excel
canonicalUrl: /recipes/import-export/import-csv-excel
tags:
  - recipes
  - import
  - csv
  - excel
  - xlsx
react:
  id: n5p8q3r6
  metaTitle: Import CSV or Excel - React Data Grid | Handsontable
angular:
  id: s9t2u7v0
  metaTitle: Import CSV or Excel - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Import and Export
---

Let users drop or pick a CSV or Excel (`.xlsx`) file, parse it in the browser, preview column headers, then load rows into Handsontable with `loadData` while updating `colHeaders` and `columns` from the detected header row.

[[toc]]

## Overview

This recipe shows a small UI with:

- A drag-and-drop zone and a hidden file input.
- File type detection by extension (`.csv` vs `.xlsx`) and routing to the right parser.
- [PapaParse](https://www.papaparse.com/) for CSV and [SheetJS](https://sheetjs.com/) (`xlsx`) for Excel workbooks.
- A header preview before you commit data to the grid.
- Clear error messages for wrong type, empty files, and malformed content.

**Difficulty:** Intermediate  
**Time:** ~20 minutes  
**Libraries:** `papaparse`, `xlsx` (npm in the docs build; CDN scripts at runtime for your own HTML pages)

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --html 4 --deps papaparse xlsx

@[code](@/content/recipes/import-export/import-csv-excel/javascript/example1.js)
@[code](@/content/recipes/import-export/import-csv-excel/javascript/example1.ts)
@[code](@/content/recipes/import-export/import-csv-excel/javascript/example1.css)
@[code](@/content/recipes/import-export/import-csv-excel/javascript/example1.html)

:::

:::

## CDN scripts (no bundler)

For a plain HTML page, load Handsontable plus the parsers from a CDN (pin versions to match what you test):

```html
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

The live example imports `papaparse` and `xlsx` as modules for the docs preview, and loads the same URLs when `window.Papa` / `window.XLSX` are missing so the pattern matches a script-tag setup.

## Step 1: Accept files and detect type

Use `accept` on the file input and check `file.name` so only `.csv` and `.xlsx` are handled. Reject anything else with a short message.

## Step 2: Parse CSV with PapaParse

Use `header: true` and `skipEmptyLines: 'greedy'`. Read `meta.fields` for column names and `data` as an array of row objects. Treat parse errors and empty results as failures you surface to the user.

## Step 3: Parse Excel with SheetJS

Read the file as an `ArrayBuffer`, call `XLSX.read`, take the first sheet, and use `sheet_to_json` with `header: 1` so row 0 is your header line. Skip blank rows below the header.

## Step 4: Preview headers, then load the grid

Keep the parsed `{ headers, rows }` in memory, render the header list in the UI, and on confirm call `hot.updateSettings({ colHeaders, columns })` followed by `hot.loadData(rows)` so the grid matches the new shape.

## Step 5: Handle errors

Show messages when:

- The extension is not `.csv` or `.xlsx`.
- The file has zero bytes.
- CSV parsing reports errors or no data rows.
- The workbook is missing sheets or has no data after the header.

## Try it quickly

Use the **Sample CSV** textarea in the example and click **Parse sample CSV**, or save the snippet as `sample.csv` and drop it on the zone.

## Related guides

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) - Export from Handsontable to `.xlsx` with the `ExportFile` plugin.

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
