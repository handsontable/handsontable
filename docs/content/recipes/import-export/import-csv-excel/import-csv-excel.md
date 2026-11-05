---
title: Import from CSV or Excel
metaTitle: Import CSV or Excel | Handsontable DataGrid for JavaScript
description: Load CSV or XLSX files into Handsontable DataGrid with PapaParse and the built-in ImportFile plugin, preview headers, and handle errors in the browser.
permalink: /recipes/import-export/import-csv-excel
canonicalUrl: /recipes/import-export/import-csv-excel
tags:
  - recipes
  - import
  - csv
  - excel
  - xlsx
react:
  metaTitle: Import CSV or Excel | Handsontable DataGrid for React
angular:
  metaTitle: Import CSV or Excel | Handsontable DataGrid for Angular
vue:
  metaTitle: Import CSV or Excel | Handsontable DataGrid for Vue
searchCategory: Recipes
category: Import and Export
menuTag: updated
type: how-to
---

In this tutorial, you will let users drop or pick a CSV or Excel (`.xlsx`) file, parse it in the browser, and preview column headers before loading rows into Handsontable DataGrid. You will learn how to use PapaParse for CSV and the built-in `ImportFile` plugin for Excel, infer column types, and show clear errors.

[[toc]]

## Overview

This recipe shows a small UI with:

- A drag-and-drop zone and a hidden file input.
- File type detection by extension (`.csv` vs `.xlsx`) and routing to the right parser.
- [PapaParse](https://www.papaparse.com/) for CSV and the built-in [`ImportFile`](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) plugin for Excel workbooks.
- A header preview before you commit data to the grid.
- Clear error messages for wrong type, empty files, and malformed content.

**Difficulty:** Intermediate  
**Time:** ~20 minutes  
**Libraries:** `papaparse` (npm in the docs build; a CDN script at runtime for your own HTML pages). Excel needs none: the `ImportFile` plugin is part of Handsontable.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --html 4 --deps papaparse

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

::: example #example1 :angular --ts 1 --html 2 --css 3 --deps papaparse

@[code](@/content/recipes/import-export/import-csv-excel/angular/example1.ts)
@[code](@/content/recipes/import-export/import-csv-excel/angular/example1.html)
@[code](@/content/recipes/import-export/import-csv-excel/angular/example1.css)

:::

In Angular, call `markForCheck()` on an injected `ChangeDetectorRef` after you apply the parsed rows, as `handleFile` does. Angular 22 components are `OnPush` by default, and nothing marks the component dirty after the `await`. Without the call, the grid does not update until the next DOM event.

:::

::: only-for vue

::: example #example1 :vue3 --css 1

@[code](@/content/recipes/import-export/import-csv-excel/vue/example1.css)
@[code](@/content/recipes/import-export/import-csv-excel/vue/example1.vue)

:::

:::

## CDN scripts (no bundler)

For a plain HTML page, load Handsontable plus PapaParse from a CDN (pin the version to match what you test):

```html
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.7.0/papaparse.min.js"></script>
```

The JavaScript and React examples load the same URL on demand when `window.Papa` is missing, so the pattern matches a script-tag setup. The Angular and Vue examples import `papaparse` from npm instead.

## Step 1: Accept files and detect type

Use `accept` on the file input and check `file.name` to route `.csv` and `.xlsx` to the right parser. Reject everything else with a short message.

::: only-for javascript

### The file input and drop zone (HTML)

```html
<div class="import-dropzone" id="import-dropzone" tabindex="0" role="button">
  <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.</p>
  <div class="import-actions">
    <label class="import-file-label">
      <span>Choose file</span>
      <input id="import-file" type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" />
    </label>
    <button type="button" id="import-load-sample" class="import-sample-btn">Load sample data</button>
  </div>
</div>
```

**What's happening:**
- The `accept` attribute restricts the system file picker to `.csv` and `.xlsx`. This is a hint to the browser only -- you must validate the extension in JavaScript as well.
- The real `<input>` is visually hidden (a 1 px, absolutely positioned element with `opacity: 0`) and activated via the wrapping `<label>`. Clicking **Choose file** triggers the file picker without requiring a separate button.
- **Load sample data** parses a bundled CSV string so users can try the grid without having to upload a file first.
- The drop zone has `tabindex="0"` and `role="button"`, so keyboard users can focus it. It has no key handler; keyboard users open the file picker with **Choose file**.

:::

::: only-for react

### The file input and drop zone (JSX)

```tsx
<div
  className={`import-dropzone${dropzoneActive ? ' import-dropzone--active' : ''}`}
  tabIndex={0}
  role="button"
  aria-label="Drop a CSV or Excel file here"
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  <p>
    Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.
  </p>
  <div className="import-actions">
    <label className="import-file-label">
      <span>Choose file</span>
      <input
        type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        onChange={handleFileInputChange}
      />
    </label>
    <button type="button" className="import-sample-btn" onClick={handleLoadSample}>
      Load sample data
    </button>
  </div>
</div>
```

**What's happening:**
- The `accept` attribute restricts the system file picker to `.csv` and `.xlsx`. This is a hint to the browser only -- you must validate the extension in code as well.
- The real `<input>` is visually hidden (a 1 px, absolutely positioned element with `opacity: 0`) and activated via the wrapping `<label>`. Clicking **Choose file** triggers the file picker without requiring a separate button.
- **Load sample data** calls `handleLoadSample`, which parses a bundled CSV string so users can try the grid without having to upload a file first.
- The drop zone has `tabIndex={0}` and `role="button"`, so keyboard users can focus it. It has no key handler; keyboard users open the file picker with **Choose file**.
- The `import-dropzone--active` class follows the `dropzoneActive` state, which the drag handlers below set.

:::

::: only-for angular

### The file input and drop zone (template)

The drop zone is part of the component's inline `template`:

```html
<div
  class="import-dropzone"
  [class.import-dropzone--active]="isDragOver"
  tabindex="0"
  role="button"
  aria-label="Drop a CSV or Excel file here"
  (dragover)="onDragOver($event)"
  (dragleave)="onDragLeave()"
  (drop)="onDrop($event)"
>
  <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.</p>
  <div class="import-actions">
    <label class="import-file-label">
      <span>Choose file</span>
      <input
        type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        (change)="onFileChange($event)"
        #fileInput
      />
    </label>
    <button type="button" class="import-sample-btn" (click)="loadSampleData()">Load sample data</button>
  </div>
</div>
```

**What's happening:**
- The `accept` attribute restricts the system file picker to `.csv` and `.xlsx`. This is a hint to the browser only -- you must validate the extension in code as well.
- The real `<input>` is visually hidden (a 1 px, absolutely positioned element with `opacity: 0`) and activated via the wrapping `<label>`. Clicking **Choose file** triggers the file picker without requiring a separate button.
- **Load sample data** calls `loadSampleData()`, which parses a bundled CSV string so users can try the grid without having to upload a file first.
- The drop zone has `tabindex="0"` and `role="button"`, so keyboard users can focus it. It has no key handler; keyboard users open the file picker with **Choose file**.
- `[class.import-dropzone--active]` follows the `isDragOver` field, which the drag handlers below set.

:::

::: only-for vue

### The file input and drop zone (template)

The drop zone is part of the component's `<template>`:

```html
<div
  class="import-dropzone"
  :class="{ 'import-dropzone--active': isDragOver }"
  tabindex="0"
  role="button"
  aria-label="Drop a CSV or Excel file here"
  @dragover="onDragOver"
  @dragleave="isDragOver = false"
  @drop="onDrop"
>
  <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.</p>
  <div class="import-actions">
    <label class="import-file-label">
      <span>Choose file</span>
      <input
        type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        @change="onFileChange"
      />
    </label>
    <button type="button" class="import-sample-btn" @click="loadSampleData">Load sample data</button>
  </div>
</div>
```

**What's happening:**
- The `accept` attribute restricts the system file picker to `.csv` and `.xlsx`. This is a hint to the browser only -- you must validate the extension in code as well.
- The real `<input>` is visually hidden (a 1 px, absolutely positioned element with `opacity: 0`) and activated via the wrapping `<label>`. Clicking **Choose file** triggers the file picker without requiring a separate button.
- **Load sample data** calls `loadSampleData`, which parses a bundled CSV string so users can try the grid without having to upload a file first.
- The drop zone has `tabindex="0"` and `role="button"`, so keyboard users can focus it. It has no key handler; keyboard users open the file picker with **Choose file**.
- `:class` toggles `import-dropzone--active` from the `isDragOver` ref, which the drag handlers below set. `@dragleave` resets it inline.

:::

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

::: only-for javascript

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

:::

::: only-for react

### Wiring up file events

The handlers live inside the component, next to its state:

```tsx
const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);

const handleFileInputChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
  const f = ev.target.files?.[0];

  handleFile(f);
  ev.target.value = '';
};

const handleDragOver = (ev: React.DragEvent<HTMLDivElement>): void => {
  ev.preventDefault();
  setDropzoneActive(true);
};

const handleDragLeave = (): void => {
  setDropzoneActive(false);
};

const handleDrop = (ev: React.DragEvent<HTMLDivElement>): void => {
  ev.preventDefault();
  setDropzoneActive(false);
  const f = ev.dataTransfer?.files?.[0];

  handleFile(f);
};
```

**What's happening:**
- Both code paths (file input `onChange` and drop zone `onDrop`) hand the `File` object to the same `handleFile` function.
- `ev.preventDefault()` on `dragover` is required -- without it the browser opens the file instead of passing it to the drop handler.
- `setDropzoneActive` toggles the `import-dropzone--active` class, which gives visual feedback while a file is dragged over the zone.
- Resetting `ev.target.value = ''` after processing allows the user to import the same file a second time.

:::

::: only-for angular

### Wiring up file events

The template event bindings call these `AppComponent` methods:

```typescript
isDragOver = false;

onDragOver(event: DragEvent): void {
  event.preventDefault();
  this.isDragOver = true;
}

onDragLeave(): void {
  this.isDragOver = false;
}

onDrop(event: DragEvent): void {
  event.preventDefault();
  this.isDragOver = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    this.handleFile(file);
  }
}

onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    this.handleFile(file);
  }
  input.value = '';
}
```

**What's happening:**
- Both code paths (file input `change` and drop zone `drop`) hand the `File` object to the same `handleFile` method.
- `event.preventDefault()` on `dragover` is required -- without it the browser opens the file instead of passing it to the drop handler.
- Setting `isDragOver` toggles the `import-dropzone--active` class, which gives visual feedback while a file is dragged over the zone.
- Resetting `input.value = ''` after processing allows the user to import the same file a second time.

:::

::: only-for vue

### Wiring up file events

The template event bindings call these functions from `<script setup>`:

```typescript
const isDragOver = ref(false);

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = true;
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = false;
  handleFile(event.dataTransfer?.files?.[0]);
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;

  handleFile(input.files?.[0]);
  input.value = '';
}
```

**What's happening:**
- Both code paths (file input `change` and drop zone `drop`) hand the `File` object to the same `handleFile` function.
- `event.preventDefault()` on `dragover` is required -- without it the browser opens the file instead of passing it to the drop handler.
- Setting `isDragOver` toggles the `import-dropzone--active` class, which gives visual feedback while a file is dragged over the zone.
- Resetting `input.value = ''` after processing allows the user to import the same file a second time.

:::

::: only-for javascript react

## Step 2: Parse CSV with PapaParse

### Lazy-load PapaParse from a CDN

```javascript
const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.7.0/papaparse.min.js';
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
4. `ensurePapa` first checks `window.Papa` (set when your page loads PapaParse with a `<script>` tag), and only loads the CDN script when it is absent.

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

### Parse a CSV text string (for the bundled sample)

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
- Used when the user clicks **Load sample data** to parse a CSV string embedded in the script and feed it into the grid.

:::

::: only-for angular

## Step 2: Parse CSV with PapaParse

### Import PapaParse from npm

```typescript
import Papa from 'papaparse';
```

**What's happening:**
- The Angular example installs `papaparse` from npm and imports it at the top of `app.component.ts`, so the parser is part of the bundle and no script is loaded at runtime.
- The parse functions call `Papa` directly instead of receiving it as an argument.

### Parse a CSV file

```typescript
async function parseCsvFile(file: File): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        try {
          resolve(processPapaResults(results));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err: Error) => reject(err instanceof Error ? err : new Error(String(err))),
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

### Parse a CSV text string (for the bundled sample)

```typescript
function parseCsvText(text: string): ParsedPayload {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('The input is empty.');
  }
  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
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
- Used when the user clicks **Load sample data** to parse a CSV string embedded in the component and feed it into the grid.

:::

::: only-for vue

## Step 2: Parse CSV with PapaParse

### Import PapaParse from npm

```typescript
import Papa from 'papaparse';
```

**What's happening:**
- The Vue example installs `papaparse` from npm and imports it in `<script setup>`, so the parser is part of the bundle and no script is loaded at runtime.
- The parse functions call `Papa` directly instead of receiving it as an argument.

### Parse a CSV file

```typescript
function parseCsvFile(file: File): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        try {
          resolve(processPapaResults(results));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err: Error) => reject(err instanceof Error ? err : new Error(String(err))),
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

### Parse a CSV text string (for the bundled sample)

```typescript
function parseCsvText(text: string): ParsedPayload {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('The file is empty.');
  }
  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
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
- Used when the user clicks **Load sample data** to parse a CSV string embedded in the script and feed it into the grid.

:::

## Step 3: Parse Excel with the ImportFile plugin

### Read the workbook without a library

The built-in [`ImportFile`](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) plugin reads `.xlsx` files, so Excel needs no parser of its own. The plugin runs on a grid, so the parser creates a throwaway one in a hidden element and destroys it afterwards:

```javascript
async function parseXlsxFile(file) {
  const host = document.createElement('div');

  host.hidden = true;
  document.body.appendChild(host);

  const parser = new Handsontable(host, {
    data: [[]],
    importFile: true,
    // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  });

  try {
    const result = await parser.getPlugin('importFile').importFromBlob('xlsx', file, {
      colHeaders: 'firstRow',
      apply: false,
    });
    const headers = (result.colHeaders ?? []).map((cell, i) => {
      const text = String(cell ?? '').trim();

      return text === '' ? `Column ${i + 1}` : text;
    });

    if (headers.length === 0) {
      throw new Error('No header row found in the Excel sheet.');
    }

    const rows = [];

    for (const line of result.data) {
      const obj = {};
      let allEmpty = true;

      headers.forEach((key, c) => {
        obj[key] = normalizeCellValue(line[c]);
        allEmpty = allEmpty && obj[key] === null;
      });

      if (!allEmpty) {
        rows.push(obj);
      }
    }

    if (rows.length === 0) {
      throw new Error('No data rows after the header.');
    }

    return { headers, rows };
  } finally {
    parser.destroy();
    host.remove();
  }
}
```

**What's happening:**
1. `importFromBlob('xlsx', file, { colHeaders: 'firstRow', apply: false })` reads the first sheet and returns the mapped result without touching the grid: `result.colHeaders` holds the promoted header row and `result.data` the rows below it.
2. A refused file (an `.xls`, a password-protected workbook, a damaged archive) rejects with the plugin's own message, and `handleFile` shows it as it is. For an `.xls` or a password-protected file, the message says to save it as an unprotected `.xlsx`.
3. Empty header cells get a fallback name (`Column 1`, `Column 2`, ...), and rows that are entirely empty are skipped, so both parsers return the same `{ headers, rows }` shape.
4. `normalizeCellValue` keeps numbers and booleans, keeps the `YYYY-MM-DD` strings the plugin derives for date cells, trims other text, and turns blank cells into `null`.
5. The throwaway grid is destroyed in `finally`, so a rejected file does not leak it. To import straight into a visible grid, with cell types, merges, and formulas (formulas need the `Formulas` plugin), call the same method on that grid without `apply: false`.

::: only-for javascript react

### Route to the right parser

```javascript
async function parseFile(file) {
  const ext = extensionOf(file.name);
  if (ext === 'csv') {
    const PapaRef = await ensurePapa();
    return parseCsvFile(file, PapaRef);
  }
  if (ext === 'xlsx') {
    return parseXlsxFile(file);
  }
  throw new Error('Unsupported file type. Use a .csv or .xlsx file.');
}
```

**What's happening:**
- `extensionOf` extracts the lowercase extension. Only `.csv` and `.xlsx` are handled; anything else throws immediately before any network request is made.
- PapaParse is loaded on demand for CSV. Excel goes through the built-in plugin, so nothing is downloaded for it.
- Both parsers return the same shape: `{ headers: string[], rows: object[] }` -- the rest of the code does not need to know which parser ran.

:::

::: only-for angular

### Route to the right parser

```typescript
async function parseFile(file: File): Promise<ParsedPayload> {
  const ext = extensionOf(file.name);
  if (ext === 'csv') {
    return parseCsvFile(file);
  }
  if (ext === 'xlsx') {
    return parseXlsxFile(file);
  }
  throw new Error('Unsupported file type. Use a .csv or .xlsx file.');
}
```

**What's happening:**
- `extensionOf` extracts the lowercase extension. Only `.csv` and `.xlsx` are handled; anything else throws immediately.
- PapaParse is already bundled for CSV, and Excel goes through the built-in plugin, so nothing is downloaded at runtime.
- Both parsers return the same shape: `{ headers: string[], rows: object[] }` -- the rest of the code does not need to know which parser ran.

:::

::: only-for vue

### Route to the right parser

```typescript
function parseFile(file: File): Promise<ParsedPayload> {
  const ext = extensionOf(file.name);

  if (ext === 'csv') {
    return parseCsvFile(file);
  }

  if (ext === 'xlsx') {
    return parseXlsxFile(file);
  }

  return Promise.reject(new Error('Unsupported file type. Use a .csv or .xlsx file.'));
}
```

**What's happening:**
- `extensionOf` extracts the lowercase extension. Only `.csv` and `.xlsx` are handled; anything else returns a rejected promise immediately.
- PapaParse is already bundled for CSV, and Excel goes through the built-in plugin, so nothing is downloaded at runtime.
- Both parsers return the same shape: `{ headers: string[], rows: object[] }` -- the rest of the code does not need to know which parser ran.

:::

## Step 4: Load parsed data into the grid

### Build column definitions from header names

```javascript
function columnsFromHeaders(headers, rows) {
  return headers.map((data) => {
    const values = rows
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

::: only-for javascript

### Lazy-init the grid on the first load

```javascript
let hot = null;

function loadIntoGrid({ headers, rows }) {
  const columns = columnsFromHeaders(headers, rows);

  if (!hot) {
    emptyEl.hidden = true;
    gridContainer.hidden = false;
    hot = new Handsontable(gridContainer, {
      data: rows,
      columns,
      colHeaders: headers,
      rowHeaders: true,
      height: 'auto',
      width: '100%',
      // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
    });
    return;
  }

  hot.updateSettings({ colHeaders: headers, columns });
  hot.loadData(rows);
}
```

**What's happening:**
- `hot` is created on the first successful import only. Before that, the page shows an empty-state panel (`emptyEl`) and `gridContainer` (the `#example1` div) is kept `hidden` so users don't see a single blank cell.
- On the first call: hide the empty state, reveal the grid container, and instantiate Handsontable with the parsed data, columns, and headers.
- On subsequent calls: reuse the existing instance -- `updateSettings({ colHeaders, columns })` reconfigures the grid's column shape, then `loadData(rows)` replaces the data and triggers a full re-render. `updateSettings` must run before `loadData` so Handsontable knows which keys to read from the row objects.

:::

::: only-for react

### Keep the parsed data in state

```tsx
const [gridData, setGridData] = useState<Record<string, CellValue>[]>([]);
const [gridColHeaders, setGridColHeaders] = useState<string[]>([]);
const [gridColumns, setGridColumns] = useState<ColumnDef[]>([]);

const loadIntoGrid = ({ headers, rows }: ParsedPayload): void => {
  setErrorMessage('');
  setGridColHeaders(headers);
  setGridColumns(columnsFromHeaders(headers, rows));
  setGridData(rows);
};
```

Render the grid only once there is data:

```tsx
{gridData.length === 0 ? (
  <div className="import-empty">
    <p className="import-empty-title">No data loaded yet</p>
  </div>
) : (
  <HotTable
    // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
    data={gridData}
    columns={gridColumns}
    colHeaders={gridColHeaders}
    rowHeaders={true}
    height="auto"
    width="100%"
  />
)}
```

**What's happening:**
- `loadIntoGrid` stores the rows, the header names, and the inferred column definitions in state. React re-renders `HotTable` with the new props, so you don't call `updateSettings` or `loadData` yourself.
- Until the first import, `gridData` is empty and the component shows the empty-state panel instead of a grid with a single blank cell. The example's panel also holds an icon and a help text, left out here.
- The same function clears any previous error, so a successful import removes an old message.

:::

::: only-for angular

### Update the grid settings and data

```typescript
gridData: Record<string, unknown>[] = [];

gridSettings: GridSettings = {
  colHeaders: [],
  columns: [],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
};

private loadIntoGrid(payload: ParsedPayload): void {
  const { headers, rows } = payload;
  this.gridSettings = {
    ...this.gridSettings,
    colHeaders: headers,
    columns: this.columnsFromHeaders(headers, rows),
  };
  this.gridData = [...rows];
}
```

The template shows the grid only once there is data:

```html
@if (gridData.length === 0) {
  <div class="import-empty">
    <p class="import-empty-title">No data loaded yet</p>
  </div>
} @else {
  <hot-table [data]="gridData" [settings]="gridSettings"></hot-table>
}
```

**What's happening:**
- `loadIntoGrid` assigns a new `gridSettings` object with the header names and the inferred column definitions, and a new `gridData` array. The `<hot-table>` bindings pass both to the grid, so you don't call `updateSettings` or `loadData` yourself.
- In the example, `columnsFromHeaders` is a private method of `AppComponent` with the same logic as the function above.
- Until the first import, `gridData` is empty and `@if` shows the empty-state panel instead of a grid with a single blank cell. The example's panel also holds an icon and a help text, left out here.

:::

::: only-for vue

### Keep the parsed data in a ref

```typescript
const payload = shallowRef<ParsedPayload | null>(null);
const importCount = ref(0);

const hotSettings = computed<GridSettings>(() => ({
  data: payload.value?.rows ?? [],
  colHeaders: payload.value?.headers ?? [],
  columns: payload.value ? columnsFromHeaders(payload.value.headers, payload.value.rows) : [],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
}));

function loadIntoGrid(parsed: ParsedPayload): void {
  payload.value = parsed;
  importCount.value += 1;
}
```

The template shows the grid only once there is data, and remounts it on every import:

```html
<div v-if="!payload" class="import-empty">
  <p class="import-empty-title">No data loaded yet</p>
</div>
<HotTable v-else :key="importCount" :settings="hotSettings" />
```

**What's happening:**
- `loadIntoGrid` stores the parsed payload in a `shallowRef` and increments a counter that is bound to `:key` on `HotTable`. The `shallowRef` keeps Vue from wrapping every parsed row in a reactive proxy.
- `hotSettings` is a `computed` that builds the data, header names, and inferred column definitions from the payload.
- A new `key` makes Vue mount a fresh grid for every import. You need it because `HotTable` treats `data` as synchronized by reference: when you pass a new array, it updates `colHeaders` and `columns` but keeps the old rows.
- Until the first import, `payload` is `null` and `v-if` shows the empty-state panel instead of a grid with a single blank cell. The example's panel also holds an icon and a help text, left out here.
- The built-in engine reads the workbook asynchronously, so the result arrives in a later task. Vue picks up a ref that changes after an `await` without extra code.

:::

::: only-for javascript

### Load the bundled sample

```javascript
const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

sampleBtn?.addEventListener('click', async () => {
  clearError(errEl);
  try {
    const PapaRef = await ensurePapa();
    const payload = parseCsvText(SAMPLE_CSV, PapaRef);
    loadIntoGrid(payload);
  } catch (e) {
    showError(errEl, e instanceof Error ? e.message : String(e));
  }
});
```

**What's happening:**
- `SAMPLE_CSV` is a small CSV string embedded in the script -- enough to demonstrate the grid without forcing the user to upload anything.
- The handler ensures PapaParse is available, parses the sample synchronously, and hands the result straight to `loadIntoGrid` -- no preview step in between.
- File uploads use the same `loadIntoGrid` function (see `handleFile` in [Step 5](#handle-errors)), so both code paths converge on a single grid-population helper.

:::

::: only-for react

### Load the bundled sample

```tsx
const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

const handleLoadSample = async (): Promise<void> => {
  setErrorMessage('');

  try {
    const PapaRef = await ensurePapa();
    const payload = parseCsvText(SAMPLE_CSV, PapaRef);

    loadIntoGrid(payload);
  } catch (e) {
    handleError(e);
  }
};
```

**What's happening:**
- `SAMPLE_CSV` is a small CSV string defined at module level -- enough to demonstrate the grid without forcing the user to upload anything.
- The handler ensures PapaParse is available, parses the sample synchronously, and hands the result straight to `loadIntoGrid` -- no preview step in between.
- File uploads use the same `loadIntoGrid` function (see `handleFile` in [Step 5](#handle-errors)), so both code paths converge on a single grid-population helper.

:::

::: only-for angular

### Load the bundled sample

```typescript
private readonly SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

async loadSampleData(): Promise<void> {
  this.errorMessage = '';
  try {
    const payload = parseCsvText(this.SAMPLE_CSV);
    this.loadIntoGrid(payload);
  } catch (e) {
    this.errorMessage = e instanceof Error ? e.message : String(e);
  }
}
```

**What's happening:**
- `SAMPLE_CSV` is a small CSV string stored on the component -- enough to demonstrate the grid without forcing the user to upload anything.
- PapaParse is already imported, so the method parses the sample synchronously and hands the result straight to `loadIntoGrid` -- no preview step in between.
- File uploads use the same `loadIntoGrid` method (see `handleFile` in [Step 5](#handle-errors)), so both code paths converge on a single grid-population helper.

:::

::: only-for vue

### Load the bundled sample

```typescript
const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

function loadSampleData(): void {
  errorMessage.value = '';

  try {
    loadIntoGrid(parseCsvText(SAMPLE_CSV));
  } catch (e) {
    showError(e);
  }
}
```

**What's happening:**
- `SAMPLE_CSV` is a small CSV string embedded in the script -- enough to demonstrate the grid without forcing the user to upload anything.
- PapaParse is already imported, so the function parses the sample synchronously and hands the result straight to `loadIntoGrid` -- no preview step in between.
- File uploads use the same `loadIntoGrid` function (see `handleFile` in [Step 5](#handle-errors)), so both code paths converge on a single grid-population helper.

:::

## Step 5: Handle errors

::: only-for javascript

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

:::

::: only-for react

### Error state

```tsx
const [errorMessage, setErrorMessage] = useState<string>('');

const handleError = (e: unknown): void => {
  setErrorMessage(e instanceof Error ? e.message : String(e));
};
```

```tsx
{errorMessage && (
  <div className="import-msg import-msg--error">{errorMessage}</div>
)}
```

**What's happening:**
- The message lives in state, and the error panel renders only while it is non-empty -- no empty box and no layout shift.
- React escapes text inside `{errorMessage}`, so an error that echoes user-provided input cannot inject markup.

:::

::: only-for angular

### Error state

```typescript
errorMessage = '';
```

```html
@if (errorMessage) {
  <div class="import-msg import-msg--error">{{ errorMessage }}</div>
}
```

**What's happening:**
- The message is a component field, and `@if` renders the error panel only while it is non-empty -- no empty box and no layout shift.
- Angular escapes text in `{{ errorMessage }}`, so an error that echoes user-provided input cannot inject markup.

:::

::: only-for vue

### Error state

```typescript
const errorMessage = ref('');

function showError(e: unknown): void {
  errorMessage.value = e instanceof Error ? e.message : String(e);
}
```

```html
<div v-if="errorMessage" class="import-msg import-msg--error">{{ errorMessage }}</div>
```

**What's happening:**
- The message is a ref, and `v-if` renders the error panel only while it is non-empty -- no empty box and no layout shift.
- Vue escapes text in `{{ errorMessage }}`, so an error that echoes user-provided input cannot inject markup.

:::

### All error conditions covered

| Condition | Message |
|---|---|
| Extension is not `.csv` or `.xlsx` | `"Unsupported file type. Use a .csv or .xlsx file."` |
| File has zero bytes | `"The file is empty."` |
| CSV has parse errors | First error message from PapaParse |
| CSV has no header row | `"No header row found in the CSV."` |
| CSV has no data rows | `"No data rows after the header."` |
| Excel workbook refused (an `.xls`, a password-protected or damaged file, a workbook past the import limits) | The `ImportFile` plugin's own message |
| Excel sheet is empty | `"No header row found in the Excel sheet."` |
| Excel has no data rows | `"No data rows after the header."` |

::: only-for javascript

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
    loadIntoGrid(payload);
  } catch (e) {
    showError(errEl, e instanceof Error ? e.message : String(e));
  }
}
```

**What's happening:**
- `file.size === 0` is checked before any async work to give an instant response for empty files.
- Any error thrown by the parsers bubbles up here and is shown to the user.
- On success, the parsed `{ headers, rows }` payload goes straight to `loadIntoGrid` -- no intermediate state to reset on failure.
- The **Load sample data** handler uses the same try/catch shape, so sample-parse errors surface in the same error panel.

:::

::: only-for react

The `handleFile` function is the single place where all file parse errors are caught and forwarded to `handleError`:

```tsx
const handleFile = async (file: File | undefined): Promise<void> => {
  setErrorMessage('');

  if (!file) {
    return;
  }

  if (file.size === 0) {
    setErrorMessage('The file is empty.');

    return;
  }

  try {
    const payload = await parseFile(file);

    loadIntoGrid(payload);
  } catch (e) {
    handleError(e);
  }
};
```

**What's happening:**
- `file.size === 0` is checked before any async work to give an instant response for empty files.
- Any error thrown by the parsers bubbles up here and is shown to the user.
- On success, the parsed `{ headers, rows }` payload goes straight to `loadIntoGrid` -- no intermediate state to reset on failure.
- The **Load sample data** handler uses the same try/catch shape, so sample-parse errors surface in the same error panel.

:::

::: only-for angular

The `handleFile` method is the single place where all file parse errors are caught and written to `errorMessage`:

```typescript
private readonly cdr = inject(ChangeDetectorRef);

private async handleFile(file: File): Promise<void> {
  this.errorMessage = '';
  if (file.size === 0) {
    this.errorMessage = 'The file is empty.';
    return;
  }
  try {
    const payload = await parseFile(file);
    this.loadIntoGrid(payload);
  } catch (e) {
    this.errorMessage = e instanceof Error ? e.message : String(e);
  } finally {
    this.cdr.markForCheck();
  }
}
```

**What's happening:**
- `file.size === 0` is checked before any async work to give an instant response for empty files.
- Any error thrown by the parsers bubbles up here and is shown to the user.
- On success, the parsed `{ headers, rows }` payload goes straight to `loadIntoGrid` -- no intermediate state to reset on failure.
- `markForCheck()` in `finally` makes Angular render the new grid or the error after the `await`. Angular 22 components are `OnPush` by default, and nothing else marks the component dirty at that point.
- The **Load sample data** method uses the same try/catch shape, so sample-parse errors surface in the same error panel.

:::

::: only-for vue

The `handleFile` function is the single place where all file parse errors are caught and forwarded to `showError`:

```typescript
async function handleFile(file: File | undefined): Promise<void> {
  errorMessage.value = '';

  if (!file) {
    return;
  }

  if (file.size === 0) {
    errorMessage.value = 'The file is empty.';

    return;
  }

  try {
    loadIntoGrid(await parseFile(file));
  } catch (e) {
    showError(e);
  }
}
```

**What's happening:**
- `file.size === 0` is checked before any async work to give an instant response for empty files.
- Any error thrown by the parsers bubbles up here and is shown to the user.
- On success, the parsed `{ headers, rows }` payload goes straight to `loadIntoGrid` -- no intermediate state to reset on failure.
- The **Load sample data** function uses the same try/catch shape, so sample-parse errors surface in the same error panel.

:::

## Try it quickly

Click **Load sample data** in the example to populate the grid from the bundled CSV string, or save the snippet from [Step 4](#load-the-bundled-sample) as `sample.csv` and drop it on the zone.

## How it works - complete flow

1. **User picks or drops a file (or clicks Load sample data)** -- the `change`, `drop`, or sample button event fires and reaches `handleFile` / the sample handler.
2. **File size check** -- zero-byte files are rejected immediately (file path only).
3. **Extension routing** -- `parseFile` reads the extension, sends `.csv` to PapaParse, and sends `.xlsx` to the `ImportFile` plugin. The sample path always uses PapaParse via `parseCsvText`.
4. **Parsing** -- CSV goes through PapaParse with `header: true`; Excel goes through the built-in `ImportFile` plugin with `apply: false`, which returns the promoted header row and the rows below it.
5. **Normalization** -- empty cells become `null`, and native numbers/booleans are preserved for CSV and Excel.
6. **Grid population** -- `loadIntoGrid` replaces `colHeaders`, `columns`, and the data. The first load swaps the empty-state panel for the grid.
7. **Grid renders** -- Handsontable re-renders with the new columns and data.
8. **Errors at any step** -- caught by `handleFile` or the sample-parse handler and shown in the error panel.

## What you learned

- How to detect the file type by extension and route CSV files through PapaParse and Excel files through the built-in `ImportFile` plugin with a single handler function.
- How to ship a bundled CSV sample so users can demo the grid without uploading a file first.
- How to replace the column configuration and the data on every import, and how to keep the grid behind an empty-state panel until the first import.
- How to handle errors at each stage -- file size, parsing, and grid load -- and surface them in a dedicated error panel.

## Next steps

- Explore [Export to PDF](@/recipes/import-export/export-to-pdf/export-to-pdf.md) to add a complementary export flow alongside this import feature.
- Explore the [ExportFile plugin](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) for built-in Excel export.

## Related guides

- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) - Import straight into a grid, with cell types, merges, formulas, and comments from the file.
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md) - How the built-in engine and ExcelJS compare, and their limits.
- [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md) - Every key an import or export reports.
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) - Export from Handsontable to `.xlsx` with the `ExportFile` plugin.

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
