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
vue:
  id: m4s0kgub
  metaTitle: Export Handsontable to PDF - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Import and Export
type: how-to
---

In this tutorial, you will export grid data to a downloadable PDF using jsPDF and jspdf-autotable. You will learn how to read the current grid state with `getData()` and `getColHeader()`, build a multi-page PDF table with headers, and trigger a browser download.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --html 3 --deps jspdf jspdf-autotable

@[code](@/content/recipes/import-export/export-to-pdf/javascript/example1.js)
@[code](@/content/recipes/import-export/export-to-pdf/javascript/example1.ts)
@[code](@/content/recipes/import-export/export-to-pdf/javascript/example1.html)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2 --deps jspdf jspdf-autotable

@[code](@/content/recipes/import-export/export-to-pdf/react/example1.jsx)
@[code](@/content/recipes/import-export/export-to-pdf/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps jspdf jspdf-autotable

@[code](@/content/recipes/import-export/export-to-pdf/angular/example1.ts)
@[code](@/content/recipes/import-export/export-to-pdf/angular/example1.html)

:::

:::

[[toc]]

## Overview

This recipe shows how to export the current Handsontable data to a PDF file when the user clicks **Export to PDF**. The recommended approach is [jsPDF](https://github.com/parallax/jsPDF) with [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable), which builds a real PDF table from your data so text stays selectable and accessible.

**Difficulty:** Beginner
**Time:** ~20 minutes
**Libraries:** jsPDF, jspdf-autotable (via CDN or npm)

## What You'll Build

A button above a Handsontable grid that:
- Reads all rows and columns from the live grid (including any sorting the user applied)
- Builds a multi-page A4 PDF with column headers repeated on every page
- Alternates row background colors for readability
- Triggers a browser download when clicked

## Prerequisites

```bash
npm install jspdf jspdf-autotable
```

## Step 1: Import the libraries

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

registerAllModules();
```

**TypeScript:**

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

registerAllModules();
```

**What's happening:**
- `handsontable/base` is the tree-shakeable entry point -- it loads only what you register
- `registerAllModules()` registers every built-in plugin and cell type; scope this down if bundle size matters
- `jsPDF` is the PDF document constructor
- `autoTable` is the plugin function that draws a formatted table into the document

## Step 2: Set up Handsontable

```javascript
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data,
  colHeaders: ['SKU', 'Product', 'Qty', 'Unit price', 'Line total'],
  columnSorting: true,
  rowHeaders: true,
  height: 320,
  width: '100%',
  licenseKey: 'non-commercial-and-evaluation',
});
```

**TypeScript:** Use `document.querySelector('#example1')!` (non-null assertion) and type the options as `Handsontable.GridSettings`.

**Key points:**
- `colHeaders` defines the visible column labels -- you'll read these back in Step 4 to build the PDF header row
- `columnSorting: true` lets users reorder rows before exporting; `hot.getData()` always returns the current visual order
- `height: 320` constrains the on-screen grid; it has no effect on how many rows are written to the PDF

## Step 3: Read the grid data

```javascript
function exportGridToPdf() {
  const body = hot.getData();
  // ...
}
```

**What's happening:**
- `hot.getData()` returns a 2D array of all cell values in the current visual order
- If the user sorted column A descending, the rows in `body` match what they see on screen -- the export reflects the current view, not the original data order
- Each inner array is one row: `['SKU-1000', 'Product 1', 1, '9.99', '9.99']`

## Step 4: Build the column headers

```javascript
const colCount = hot.countCols();
const head = [
  Array.from({ length: colCount }, (_, col) => String(hot.getColHeader(col))),
];
```

**What's happening:**
- `hot.countCols()` returns the number of visible columns
- `hot.getColHeader(col)` returns the header label for each column index -- this matches the `colHeaders` array you set in Step 2
- The result is wrapped in an outer array because `autoTable` expects `head` to be an array of rows (you could pass multiple header rows for grouped headers)
- `String(...)` converts numeric auto-generated headers (e.g., `1`, `2`, `3`) to strings

**Why read headers from the grid instead of hardcoding them?**

Reading from `hot.getColHeader()` means the PDF header stays in sync with the grid automatically -- rename a column header in one place and the export picks it up without a separate update.

## Step 5: Create the PDF document

```javascript
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
```

**Options:**

| Option | Value | Effect |
|---|---|---|
| `orientation` | `'portrait'` | Page is taller than it is wide |
| `unit` | `'mm'` | All measurements (margins, padding) are in millimeters |
| `format` | `'a4'` | Standard A4 page (210 x 297 mm) |

**Alternatives:**

```javascript
// Landscape for wide tables
new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

// US Letter size
new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
```

## Step 6: Generate the table with autoTable

```javascript
autoTable(doc, {
  head,
  body,
  styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
  headStyles: {
    fillColor: [26, 66, 232],
    textColor: 255,
    fontStyle: 'bold',
  },
  alternateRowStyles: { fillColor: [245, 247, 250] },
  margin: { top: 14, left: 12, right: 12, bottom: 14 },
  showHead: 'everyPage',
});
```

**What each option does:**

- `head` -- the header row built in Step 4; rendered with `headStyles`
- `body` -- the 2D data array from Step 3; one inner array per row
- `styles` -- applied to every cell:
  - `fontSize: 8` -- 8 pt fits more columns on A4 without wrapping
  - `cellPadding: 1.5` -- 1.5 mm padding keeps rows compact
  - `overflow: 'linebreak'` -- long text wraps to the next line instead of being clipped
- `headStyles` -- overrides `styles` for header cells only:
  - `fillColor: [26, 66, 232]` -- RGB blue background
  - `textColor: 255` -- white text (shorthand for `[255, 255, 255]`)
  - `fontStyle: 'bold'` -- bold header text
- `alternateRowStyles` -- applies to every other body row; the light gray (`[245, 247, 250]`) makes long tables easier to read
- `margin` -- page margins in mm; gives breathing room around the table on all four sides
- `showHead: 'everyPage'` -- repeats the header row at the top of each new page when the table spans multiple pages

**Pagination:**

`autoTable` handles page breaks automatically. When `body` has more rows than fit on one page, it starts a new page and -- because `showHead: 'everyPage'` is set -- prints the header row again at the top.

## Step 7: Save the PDF file

```javascript
doc.save('export.pdf');
```

**What's happening:**
- `doc.save()` serializes the PDF and triggers a browser download
- Pass any filename you want; the `.pdf` extension is required for browsers to open it correctly
- This is a client-side download -- no server involved

**Alternative -- open in a new tab instead of downloading:**

```javascript
const blob = doc.output('blob');
const url = URL.createObjectURL(blob);

window.open(url, '_blank');
```

## Step 8: Wire the Export to PDF button

```javascript
document.querySelector('#exportPdfBtn').addEventListener('click', exportGridToPdf);
```

**TypeScript:** Use `document.querySelector('#exportPdfBtn')!` to satisfy the null check.

**What's happening:**
- `#exportPdfBtn` matches the button in the HTML file (see Step 9)
- Every click calls `exportGridToPdf()`, which always reads the current grid state -- sorts, filters, or edits made since the last export are included automatically

## Step 9: Add the button and style it

Add a toolbar above the grid container in your HTML:

```html
<div class="export-pdf-toolbar">
  <button type="button" id="exportPdfBtn" class="export-pdf-btn">Export to PDF</button>
</div>
<div id="example1"></div>
```

Style the button with CSS:

```css
.export-pdf-toolbar {
  margin-bottom: 12px;
}

.export-pdf-btn {
  background: #1a42e8;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
}

.export-pdf-btn:hover {
  background: #1536c4;
}
```

**What's happening:**
- The button sits in its own `div` so you can add more toolbar items later without changing the layout
- The button `id` must match the selector used in Step 8 (`#exportPdfBtn`)
- The grid container `id` must match the selector used in Step 2 (`#example1`)
- The hover color (`#1536c4`) is a slightly darker shade of the button background to give visual feedback

## How it works -- complete flow

1. **Page loads** -- Handsontable renders the grid with 85 rows of sample data
2. **User sorts (optional)** -- clicking a column header reorders rows; the export will reflect the new order
3. **User clicks Export to PDF** -- the click event calls `exportGridToPdf()`
4. **Read the grid** -- `hot.getData()` returns all rows in current visual order; `hot.getColHeader()` returns header labels
5. **Build the PDF** -- a new `jsPDF` document is created with A4 portrait settings
6. **Draw the table** -- `autoTable` lays out headers and body rows, wraps text, alternates row colors, and adds new pages as needed
7. **Download** -- `doc.save('export.pdf')` triggers a browser download of the finished PDF

## CDN scripts (no bundler)

If you load Handsontable from a CDN, add jsPDF and the AutoTable plugin after Handsontable:

```html
<script src="https://cdn.jsdelivr.net/npm/jspdf@3.0.4/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.7/dist/jspdf.plugin.autotable.min.js"></script>
```

Then use the global `jspdf.jsPDF` constructor and call `autoTable(doc, options)` the same way as in the example (the plugin registers `autoTable` on the UMD build).

## Alternative - html2canvas

You can capture the grid DOM with [html2canvas](https://github.com/niklasvh/html2canvas) and add the resulting image to a PDF with jsPDF. That path mirrors what users see on screen (merged cells, custom renderers, styling) but produces a raster snapshot -- file size grows with resolution, text is not selectable, and accessibility is weaker than a table built from data.

## What you learned

- How to read grid data with `hot.getData()` and column headers with `hot.getColHeader()` to pass them to jsPDF AutoTable.
- How AutoTable handles row wrapping, alternating row colors, and page breaks automatically so you can generate multi-page PDFs from a single call.
- How to use `doc.save('filename.pdf')` to trigger a browser download of the finished PDF.
- How to load jsPDF and AutoTable via CDN for environments without a bundler.

## Next steps

- Explore [Import from CSV or Excel](@/recipes/import-export/import-csv-excel/import-csv-excel.md) to add the complementary import flow alongside your export feature.
- Explore the [ExportFile plugin](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) for built-in Excel export support without a third-party library.
