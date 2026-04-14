---
id: f7a3c82e
title: Export to PDF
metaTitle: Export Handsontable to PDF - JavaScript Data Grid | Handsontable
description: Export grid data to a downloadable PDF with jsPDF and jspdf-autotable, including headers and multi-page tables.
permalink: /recipes/import-export/export-to-pdf
canonicalUrl: /recipes/import-export/export-to-pdf
tags:
  - guides
  - tutorial
  - recipes
react:
  id: a8b4d93f
  metaTitle: Export Handsontable to PDF - React Data Grid | Handsontable
angular:
  id: b9c5e04a
  metaTitle: Export Handsontable to PDF - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Import and Export
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --deps jspdf jspdf-autotable

@[code](@/content/recipes/import-export/export-to-pdf/javascript/example1.js)
@[code](@/content/recipes/import-export/export-to-pdf/javascript/example1.ts)
@[code](@/content/recipes/import-export/export-to-pdf/javascript/example1.css)

:::

:::

[[toc]]

## Overview

This recipe shows how to export the current Handsontable data to a PDF file when the user clicks **Export to PDF**. The recommended approach is [jsPDF](https://github.com/parallax/jsPDF) with [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable), which builds a real PDF table from your data so text stays selectable and accessible.

**Difficulty:** Beginner
**Time:** ~20 minutes
**Libraries:** jsPDF, jspdf-autotable (via CDN or npm)

## CDN scripts (no bundler)

If you load Handsontable from a CDN, add jsPDF and the AutoTable plugin after Handsontable:

```html
<script src="https://cdn.jsdelivr.net/npm/jspdf@3.0.4/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.7/dist/jspdf.plugin.autotable.min.js"></script>
```

Then use the global `jspdf.jsPDF` constructor and call `autoTable(doc, options)` the same way as in the example below (the plugin registers `autoTable` on the UMD build).

## Recommended approach - jsPDF + jspdf-autotable

1. Read the grid as a 2D array with `hot.getData()`.
2. Build the header row from `hot.getColHeader(col)` for each visible column index (or use your own labels).
3. Create a `jsPDF` instance with the page size and orientation you need.
4. Call `autoTable(doc, { head, body, styles, headStyles, ... })`.
5. Trigger the download with `doc.save('export.pdf')`.

jspdf-autotable splits long `body` arrays across pages automatically and can repeat the header on each page when you set `showHead: 'everyPage'`.

## Alternative - html2canvas

You can capture the grid DOM with [html2canvas](https://github.com/niklasvh/html2canvas) and add the resulting image to a PDF with jsPDF. That path mirrors what users see on screen (merged cells, custom renderers, styling) but produces a raster snapshot: file size grows with resolution, text is not selectable, and accessibility is weaker than a table built from data.

## What the demo does

The live example below uses enough rows to span multiple PDF pages. Click **Export to PDF** to download `export.pdf` with column headers and paginated body rows.
