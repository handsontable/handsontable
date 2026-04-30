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
type: tutorial
---

In this tutorial, you will let users drop or pick a CSV or Excel (`.xlsx`) file, parse it in the browser, and preview column headers before loading rows into Handsontable. You will learn how to use PapaParse and SheetJS to handle both formats, and how to update `colHeaders` and `columns` from the detected header row.

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

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/import-export/import-csv-excel/react/example1.css)
@[code](@/content/recipes/import-export/import-csv-excel/react/example1.jsx)
@[code](@/content/recipes/import-export/import-csv-excel/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3 --deps papaparse xlsx

@[code](@/content/recipes/import-export/import-csv-excel/angular/example1.ts)
@[code](@/content/recipes/import-export/import-csv-excel/angular/example1.html)
@[code](@/content/recipes/import-export/import-csv-excel/angular/example1.css)

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

Use `accept` on the file input and check `file.name` to route `.csv` and `.xlsx` to the right parser. Reject everything else with a short message.

### The file input and drop zone (HTML)

```html
<div class="import-dropzone" id="import-dropzone" tabindex="0" role="button">
  <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or use the file picker.</p>
  <label class="import-file-label">
    <span>Choose file</span>
    <input id="import-file" type="file"
      accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" />
  </label>
</div>
```

**What's happening:**
- The `accept` attribute restricts the system file picker to `.csv` and `.xlsx`. This is a hint to the browser only -- you must validate the extension in JavaScript as well.
- The real `<input>` is visually hidden (positioned off-screen with `opacity: 0`) and activated via the wrapping `<label>`. Clicking **Choose file** triggers the file picker without requiring a separate button.
- The drop zone has `tabindex="0"` and `role="button"` so keyboard users can focus and activate it.

### Extension detection

```javascript
function extensionOf(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}
```

**What's happening:**
- Takes the file name and returns the lowercase extension (`"csv"`, `"xlsx"`, or `""` if there is none).
- `lastIndexOf('.')` handles names like `report.v2.csv` correctly by taking the final dot.
- The result is compared in `parseFile` and an error is thrown for anything that is not `.csv` or `.xlsx`.

### Wiring up file events

```javascript
fileInput?.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  handleFile(f);
  fileInput.value = ''; // reset so the same file can be re-selected
});

dropzone?.addEventListener('dragover', (ev) => {
  ev.preventDefault();
  dropzone.classList.add('import-dropzone--active');
});

dropzone?.addEventListener('dragleave', () => {
  dropzone.classList.remove('import-dropzone--active');
});

dropzone?.addEventListener('drop', (ev) => {
  ev.preventDefault();
  dropzone.classList.remove('import-dropzone--active');
  const f = ev.dataTransfer?.files?.[0];
  handleFile(f);
});
```

**What's happening:**
- Both code paths (file input `change` and drop zone `drop`) hand the `File` object to the same `handleFile` function.
- `ev.preventDefault()` on `dragover` is required -- without it the browser opens the file instead of passing it to the drop handler.
- Adding/removing `import-dropzone--active` gives visual feedback while a file is dragged over the zone.
- Resetting `fileInput.value = ''` after processing allows the user to import the same file a second time.

## Step 2: Parse CSV with PapaParse

### Lazy-load PapaParse from a CDN

```javascript
const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';
const scriptPromises = new Map();

function loadScript(src) {
  const cached = scriptPromises.get(src);
  if (cached) return cached;

  const p = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-cdn="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      if (existing.getAttribute('data-loaded') === '1') resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src; s.async = true; s.dataset.cdn = src;
    s.onload = () => { s.setAttribute('data-loaded', '1'); resolve(); };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

  scriptPromises.set(src, p);
  return p;
}

async function ensurePapa() {
  if (typeof window.Papa !== 'undefined') return window.Papa;
  await loadScript(CDN_PAPAPARSE);
  if (typeof window.Papa === 'undefined') throw new Error('PapaParse did not register on window.');
  return window.Papa;
}
```

**What's happening:**
1. `loadScript` injects a `<script>` tag and returns a `Promise` that resolves on load and rejects on error.
2. A `Map` keyed by URL caches the promise so the script is only injected once even if `loadScript` is called multiple times concurrently.
3. It checks for a pre-existing `<script data-cdn="...">` element -- this handles the case where the tag was already added (e.g., in the docs preview runner).
4. `ensurePapa` first checks `window.Papa` (already available when using a bundler or a CDN `<script>` tag in your own HTML), and only loads the CDN script when it is absent.

**Why lazy-load?**
- Avoids loading a parser the user might never need.
- Works with any host page whether or not a CDN tag was already added -- no duplicate downloads.

### Parse a CSV file

```javascript
async function parseCsvFile(file, PapaRef) {
  return new Promise((resolve, reject) => {
    PapaRef.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        try {
          resolve(processPapaResults(results));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}
```

**What's happening:**
- `header: true` tells PapaParse to treat the first row as column names and return each subsequent row as a plain object keyed by those names. `results.meta.fields` contains the ordered list of column names.
- `skipEmptyLines: 'greedy'` drops rows that are entirely whitespace -- handy for files with trailing newlines.
- `transformHeader: (h) => h.trim()` removes accidental leading/trailing spaces from column names.
- After parsing, empty or missing cell values are normalized to `null` so Handsontable displays a blank cell rather than the string `"undefined"` or `"null"`.
- `dynamicTyping: true` lets PapaParse return native numbers and booleans where possible.
- Numeric and boolean values are preserved as-is; string values are trimmed, and empty strings are normalized to `null`.

### Parse a CSV text string (for the sample textarea)

```javascript
function parseCsvText(text, PapaRef) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('The file is empty.');

  const parsed = PapaRef.parse(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  return processPapaResults(parsed);
}
```

**What's happening:**
- Works identically to `parseCsvFile` but accepts a raw CSV string instead of a `File` object.
- PapaParse's synchronous `parse(string, opts)` overload is used here (no `complete` callback needed).
- Used when the user clicks **Parse sample CSV** to process the pre-filled textarea value without picking a file.

## Step 3: Parse Excel with SheetJS

### Lazy-load SheetJS

The `ensureXlsx` function follows the same lazy-load pattern as `ensurePapa`:

```javascript
async function ensureXlsx() {
  if (typeof window.XLSX !== 'undefined') return window.XLSX;
  await loadScript(CDN_XLSX);
  if (typeof window.XLSX === 'undefined') throw new Error('SheetJS did not register on window.');
  return window.XLSX;
}
```

### Parse an Excel file

```javascript
function parseXlsxArrayBuffer(buf, XLSXRef) {
  let workbook;
  try {
    workbook = XLSXRef.read(buf, { type: 'array' });
  } catch {
    throw new Error('Could not read the Excel workbook. The file may be corrupted.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no sheets.');

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSXRef.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });
  if (!matrix.length) throw new Error('The sheet is empty.');

  const rawHeader = matrix[0].map((cell) => String(cell ?? '').trim());
  if (rawHeader.length === 0 || rawHeader.every((h) => h === '')) {
    throw new Error('No header row found in the Excel sheet.');
  }

  const keys = rawHeader.map((h, i) => (h === '' ? `Column ${i + 1}` : h));

  const rows = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const allEmpty = !line || line.every((c) => String(c ?? '').trim() === '');
    if (allEmpty) continue;

    const obj = {};
    for (let c = 0; c < keys.length; c++) {
      const raw = line[c];
      if (raw === null || raw === undefined) {
        obj[keys[c]] = null;
      } else if (typeof raw === 'number' || typeof raw === 'boolean') {
        obj[keys[c]] = raw;
      } else {
        const s = String(raw).trim();
        obj[keys[c]] = s === '' ? null : s;
      }
    }
    rows.push(obj);
  }

  if (rows.length === 0) throw new Error('No data rows after the header.');
  return { headers: keys, rows };
}
```

**What's happening:**
1. `file.arrayBuffer()` reads the binary content; `XLSX.read(buf, { type: 'array' })` parses the workbook. The call is wrapped in a `try/catch` to surface corrupted file errors.
2. `workbook.SheetNames[0]` picks the first sheet. Multi-sheet workbooks are supported -- extend this if you need a sheet picker.
3. `sheet_to_json(sheet, { header: 1 })` returns a two-dimensional array (matrix) instead of objects, so row 0 is the raw header line and rows 1+ are data.
4. `defval: null` marks missing cells explicitly, while `raw: true` keeps native SheetJS value types.
5. Empty header cells get a fallback name (`Column 1`, `Column 2`, ...) to avoid unnamed keys.
6. Rows that are entirely empty (all cells blank) are skipped -- common in Excel files with trailing blank rows.
7. Native numbers and booleans are preserved, strings are trimmed, and blank cells become `null` for consistency with the CSV parser.

### Route to the right parser

```javascript
async function parseFile(file) {
  const ext = extensionOf(file.name);
  if (ext === 'csv') {
    const PapaRef = await ensurePapa();
    return parseCsvFile(file, PapaRef);
  }
  if (ext === 'xlsx') {
    const XLSXRef = await ensureXlsx();
    const buf = await file.arrayBuffer();
    return parseXlsxArrayBuffer(buf, XLSXRef);
  }
  throw new Error('Unsupported file type. Use a .csv or .xlsx file.');
}
```

**What's happening:**
- `extensionOf` extracts the lowercase extension. Only `.csv` and `.xlsx` are handled; anything else throws immediately before any network request is made.
- The library is loaded on demand: PapaParse for CSV, SheetJS for Excel. If only CSV files are imported, SheetJS is never downloaded.
- Both parsers return the same shape: `{ headers: string[], rows: object[] }` -- the rest of the code does not need to know which parser ran.

## Step 4: Preview headers, then load the grid

### Keep parsed data in a pending buffer

```javascript
let pending = null;

function setPending(payload) {
  pending = payload;
  clearError(errEl);
  if (headerListEl && previewEl) {
    renderHeaderPreview(headerListEl, payload.headers);
    previewEl.hidden = false;
  }
}
```

**What's happening:**
- `pending` holds the last successfully parsed `{ headers, rows }` object until the user confirms or a new file is loaded.
- `setPending` clears any previous error, renders the header list, and shows the preview panel -- but does not touch the grid yet. The user must click **Load into grid** to commit.
- A two-step confirm flow prevents accidental overwrites and gives the user a chance to check that the detected headers match expectations before loading potentially thousands of rows.

### Render the header preview

```javascript
function renderHeaderPreview(listEl, headers) {
  listEl.innerHTML = '';
  for (const h of headers) {
    const li = document.createElement('li');
    li.textContent = h;
    listEl.appendChild(li);
  }
}
```

**What's happening:**
- Clears the list before re-populating so stale headers from a previous import are not shown.
- Uses `textContent` (not `innerHTML`) to prevent XSS when column names contain HTML characters.

### Build column definitions from header names

```javascript
function columnsFromHeaders(headers) {
  return headers.map((data) => {
    const values = pending.rows
      .map((row) => row[data])
      .filter((v) => v !== null);

    if (values.length > 0 && values.every((v) => typeof v === 'number')) {
      return { data, type: 'numeric' };
    }
    if (values.length > 0 && values.every((v) => typeof v === 'boolean')) {
      return { data, type: 'checkbox' };
    }
    return { data, type: 'text' };
  });
}
```

**What's happening:**
- Handsontable's `columns` option expects an array of column descriptors. Each descriptor's `data` property is the key used to read from the row objects.
- The helper infers `numeric` and `checkbox` columns when all non-empty values in that column are numbers or booleans. Mixed columns stay as `'text'`.

### Load the grid

```javascript
applyBtn?.addEventListener('click', () => {
  clearError(errEl);
  if (!pending) {
    showError(errEl, 'Nothing to load. Import a file first.');
    return;
  }
  const { headers, rows } = pending;
  hot.updateSettings({
    colHeaders: headers,
    columns: columnsFromHeaders(headers),
  });
  hot.loadData(rows);
  previewEl.hidden = true;
  pending = null;
});
```

**What's happening:**
1. Guard against clicking **Load into grid** when no file has been parsed yet.
2. `hot.updateSettings({ colHeaders, columns })` reconfigures the grid for the new column shape. This must happen before `loadData` so Handsontable knows which keys to read from the row objects.
3. `hot.loadData(rows)` replaces the grid's data source and triggers a full re-render.
4. After loading, the preview panel is hidden and `pending` is cleared so a stale payload is not accidentally loaded twice.

## Step 5: Handle errors

### Error display helpers

```javascript
function showError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function clearError(el) {
  if (!el) return;
  el.textContent = '';
  el.hidden = true;
}
```

**What's happening:**
- Both functions guard against a `null` element (the container may be absent in some environments).
- `hidden` is toggled so the error area takes no space when empty -- no flickering or layout shift.
- `textContent` is used to prevent XSS in error messages that might echo user-provided input.

### All error conditions covered

| Condition | Message |
|---|---|
| Extension is not `.csv` or `.xlsx` | `"Unsupported file type. Use a .csv or .xlsx file."` |
| File has zero bytes | `"The file is empty."` |
| CSV has parse errors | First error message from PapaParse |
| CSV has no header row | `"No header row found in the CSV."` |
| CSV has no data rows | `"No data rows after the header."` |
| Excel file is corrupted | `"Could not read the Excel workbook. The file may be corrupted."` |
| Excel workbook has no sheets | `"The workbook has no sheets."` |
| Excel sheet is empty | `"The sheet is empty."` |
| Excel header row is blank | `"No header row found in the Excel sheet."` |
| Excel has no data rows | `"No data rows after the header."` |
| **Load into grid** clicked with no file parsed | `"Nothing to load. Import a file first."` |

The `handleFile` async function is the single place where all parse errors are caught and forwarded to `showError`:

```javascript
async function handleFile(file) {
  clearError(errEl);
  if (!file) return;
  if (file.size === 0) {
    showError(errEl, 'The file is empty.');
    return;
  }
  try {
    const payload = await parseFile(file);
    setPending(payload);
  } catch (e) {
    pending = null;
    previewEl.hidden = true;
    showError(errEl, e instanceof Error ? e.message : String(e));
  }
}
```

**What's happening:**
- `file.size === 0` is checked before any async work to give an instant response for empty files.
- Any error thrown by the parsers bubbles up here and is shown to the user.
- On error, `pending` is cleared and the preview panel is hidden so the user cannot accidentally load stale data.
- Apply the same stale-state reset for the sample textarea parser, so failed sample parsing cannot leave old data queued for **Load into grid**.

## Try it quickly

Use the **Sample CSV** textarea in the example and click **Parse sample CSV**, or save the snippet as `sample.csv` and drop it on the zone.

## How it works - complete flow

1. **User picks or drops a file** -- the `change` or `drop` event fires and calls `handleFile`.
2. **File size check** -- zero-byte files are rejected immediately.
3. **Extension routing** -- `parseFile` reads the extension and loads the right parser library on demand.
4. **Parsing** -- CSV goes through PapaParse with `header: true`; Excel is read via SheetJS with `sheet_to_json` and row-0 as the header line.
5. **Normalization** -- empty cells become `null`, and native numbers/booleans are preserved for CSV and Excel.
6. **Header preview** -- `setPending` stores the result and shows the detected column names in a list.
7. **User confirms** -- clicking **Load into grid** calls `hot.updateSettings` followed by `hot.loadData`.
8. **Grid renders** -- Handsontable re-renders with the new columns and data.
9. **Errors at any step** -- caught by `handleFile` or the sample-parse path (plus the apply-button guard), then shown in the error panel while pending preview state is cleared.

## What you learned

- How to detect the file type by extension and route CSV files through PapaParse and Excel files through SheetJS with a single handler function.
- How to present a header preview before loading data, so users can confirm the detected columns match their expectations.
- How to call `hot.updateSettings({ colHeaders, columns })` followed by `hot.loadData(rows)` to replace both the column configuration and the data in one step.
- How to handle errors at each stage -- file size, parsing, and grid load -- and surface them in a dedicated error panel.

## Next steps

- Explore [Export to PDF](@/recipes/import-export/export-to-pdf/export-to-pdf.md) to add a complementary export flow alongside this import feature.
- Explore the [ExportFile plugin](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) for built-in Excel export.

## Related guides

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) - Export from Handsontable to `.xlsx` with the `ExportFile` plugin.

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
