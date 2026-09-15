# ExportFile plugin — CSV and XLSX export

The `exportFile` plugin writes grid content to a file. Read this before touching `exportFile.ts`,
`dataProvider.ts` (which collects the values), `typeFactory.ts`, `utils.ts` or anything under `types/`.

`types/_base.ts` is the shared exporter base, `types/csv.ts` and `types/xlsx.ts` the two formats.

## Export is a TEXT surface, and that is a strict rule

Grid content leaving the DOM goes through **`utils/textExtractor.ts`**, never through `sanitizer` and never
through `stripTags()`:

```js
extractText(hot, value, 'ExportFile.columnHeader')   // also 'ExportFile.rowHeader'
```

The two grid options are siblings with a hard split: `sanitizer` is the policy for HTML written *to the
screen* (HTML in, HTML out); `textExtractor` is the policy for content becoming *text* anywhere else — a
file, the clipboard, later a printer or an assistive label. `TextExtractorContext` carries
`| (string & {})`, so **a new surface needs no core change** — just a new context string.

Three traps make the shortcuts wrong, all measured on issue
[#4088](https://github.com/handsontable/handsontable/issues/4088) (DEV-2702):

1. **A sanitizer returns HTML source, and a file needs text.** Piping export values through `sanitizer`
   entity-encodes headers containing no markup at all — `R&D` lands as `R&amp;D` — while the allowlist style
   the `sanitizer` docs show first returns `<b>Bold</b>` unchanged and fixes nothing.
2. **`stripTags()` scans characters instead of parsing**, so it mangles `'Loaded 5 < 10 rows'` and leaves
   entities encoded. The built-in extraction parses into a `<template>` and reads `textContent` — inert, and
   it decodes entities.
3. **The built-in extraction runs the configured `sanitizer` first**, under the DOM surface the content
   belongs to, because a sanitizer may *delete* text rather than unwrap it: an allowlist filter drops
   `<script>alert()</script>` whole, and extracting from the raw setting would leak `alert()` into a file the
   screen never showed.

**Only strings are projected.** A numeric header must stay a number, and **cell *data* is never projected at
all** — a value such as `a<b` is data, not a display string, and parsing it as HTML would destroy it. The
current scope is headers only (column, row, and nested-header tree labels).

## The double-`requestAnimationFrame` before a blocking export

`requestAnimationFrame` fires at the **start** of a frame, before paint. A double-rAF lets the browser
complete one full paint cycle — so the progress dialog actually becomes visible — before the export blocks
the main thread. A single rAF shows nothing.

## XLSX specifics

Unit conversions, all constants at the top of `types/xlsx.ts`:

| From | To | Note |
|---|---|---|
| pixels | Excel column-width units | ≈ one character width of the "Normal" style font at the default size |
| CSS pixels | typographic points | `1 px = 0.75 pt` (72/96), for row heights |
| — | frozen row-header column width | a fixed default, chosen to fit typical row indexes |

Other rules:

- **`exportFormulas` is off by default.** On, HyperFormula formula cells and ColumnSummary destinations
  export as **live Excel formulas**; off, the pre-calculated static values go out.
- **The summary lookup map is always built**, even when `exportFormulas` is false, because the protection
  pre-scan needs it to identify ColumnSummary destination cells. It is an O(1)
  `"dataRow:dataCol" → descriptor` map.
- **`cell.protection` is written only when the sheet actually has cells to lock in Excel.** The pre-scan
  exists to skip it — writing it unconditionally bloats the file and changes Excel's behavior.
- **Clear the style caches for *every* document involved.** In multi-sheet mode each sheet may come from a
  different Handsontable instance in a different document (an iframe), so one document's cache is not
  enough.
- **`columnHeaders` is a deprecated alias** of `colHeaders` and is promoted on the per-sheet config **before**
  it is merged with the already-normalized top-level options, which carry `colHeaders` either way. Keep the
  alias working — see the breaking-changes policy.
- `compression: true` means DEFLATE level 6; a number 1–9 is that level; falsy is no compression.
- `headerStyle: null` exports headers with no styling; `headerStyle.border: null` suppresses only the border.

## Where to look next

- The other consumer of the same text contract: `../copyPaste/AGENTS.md`.
- The extraction implementation and its context list: `../../utils/textExtractor.ts`; the sanitizer
  resolver it calls first: `../../utils/sanitizer.ts`.
- Sources of exported values: `../formulas/AGENTS.md`, `../columnSummary/AGENTS.md`,
  `../nestedHeaders/AGENTS.md`.
- Menu entry: `contextMenuItem/`, wired via `../contextMenu/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='exportFile'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='exportFile'`

Unit coverage is deliberately fine-grained — `cell-style`, `date-utils`, `datetimeExport`, `formula-utils`,
`numeric-utils`, plus `types/`. A format change belongs in one of those, not only in the E2E spec.
