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
- **`normalizeFormula` no longer owns the formula walk.** Splitting a formula into string literals, sheet
  names and A1 references lives in `../../utils/xlsxEngine/formulaRefs.ts` (`mapFormulaReferences`), shared
  with the import direction, which shifts the same references the other way. `normalizeFormula` keeps the
  arithmetic — the header offsets and the excluded-hidden-index counts — and shifts **absolute** components
  too: prepending headers translates the whole coordinate space, so a `$A$1` pinned to a grid cell has to
  follow it, and `$` pins a reference against copy and fill rather than against the sheet moving. Both
  directions agree on this (`shiftFormulaReferences` shifts `$` components as well), so `$A$1` goes out as
  `$B$2` and comes back as `$A$1`. `formula-utils.unit.js` pins the export half; a change that starts
  skipping `$` here is a behavior change, not a cleanup.
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
- **The read-only sentinel colors are shared with the import, in `src/utils/xlsxEngine/readOnlyStyle.ts`.**
  `getFontFromMeta`/`getFillFromMeta` paint `READ_ONLY_TEXT_ARGB`/`READ_ONLY_FILL_ARGB` on a `readOnly` cell
  that has no color of its own, and `importFile/styles.ts` recognizes exactly those two values and drops them
  again so a round trip does not bake the grid's own dimming into a generated class. Change the value in the
  shared module or the two directions silently stop agreeing — never re-declare either constant locally.
- **`compression` unset, `null` or `true` means DEFLATE level 6; a number 1–9 is that level; only an explicit
  `false` means STORED — and STORED has to be named.** `toWriteOptions` in the ExcelJS adapter returns
  `{ zip: { compression: 'STORE' } }` for `false`. Passing no `zip` options at all leaves JSZip on its own
  default, which is DEFLATE, so `false` did nothing for its whole life — but the DEFAULT was always DEFLATE,
  and mapping `null` to STORE (as the first cut of #13551 did) made every default export several times
  larger. `#getCompressionLevel` therefore returns `6` for anything but `false` and a valid level;
  `xlsxValidationSheetName.unit.js` pins the `writeBuffer` options for unset, `false` and `3`, and
  `exceljsWrite.unit.js` pins STORE-vs-DEFLATE by SIZE (stored output larger than deflated on a repetitive
  sheet), which is the only assertion that can tell the two apart at the adapter.
- **Sheet names are sanitized by the export, not by the engine.** ExcelJS throws for an illegal character
  (`* ? : / \ [ ]`), a leading or trailing `'`, the reserved name `History`, an empty name and a duplicate
  (compared case-INsensitively), so a grid named `Q1: Sales` used to abandon the whole export. ExcelJS
  tests `History` in that exact case only (`lib/doc/worksheet.js`), but Excel reserves the name in any
  case, so the sanitizer renames `history` and `HISTORY` too — a Bugbot finding on #13551 that was right
  about the fix and wrong about the reason.
  `#uniqueSheetName` sanitizes, then truncates to 31, then de-duplicates — **in that order**. Truncating
  last lets two 35-character names that differ only past character 31 pass the duplicate check and then
  collide, which is why the counter's room is reserved inside the 31 characters. The `_HotValidation` helper
  sheets are named from the SAME `usedSheetNames` set, which is what keeps a data sheet called
  `_HotValidation` away from its own helper. `xlsxValidationSheetName.unit.js` pins every case.
- **Every exported workbook names `Handsontable` as its creator, and asks for a full recalculation when it
  wrote any formula.** `workbook.calcProperties.fullCalcOnLoad` is what makes LibreOffice and Google Sheets
  compute a formula written without a cached result; Excel recalculates on its own. ExcelJS's `calcPr`
  parser never reads the flag back, so it can only be asserted on the workbook that was serialized.
- **A ColumnSummary destination's cached result is narrowed to a primitive** (`toPrimitiveResult` in
  `types/xlsx.ts`). ExcelJS answers anything else with `I could not understand type of value`, and a custom
  renderer leaving an object or an array in the cell is all it takes.
- **An overlapping merge is dropped, not thrown.** The adapter catches ExcelJS's
  `Cannot merge already merged cells`, records `merge:overlap` and skips that range.
- **On a rendered cell the exported font color is the cell's OWN computed color, diffed against an
  alignment-only baseline probe mounted in the cell's `.ht-root-wrapper`.** The probe inherits everything the
  cell inherits (a container-scoped CSS variable included), so it differs from the cell only by what a rule
  or a renderer set on the cell itself — and that is what exports. Reading the probe's colour INSTEAD of
  the cell's (the first cut of #13551) dropped `#my-grid td.red`, `.htCore td.red`, `tr:nth-child(odd)`
  variations and renderer-written colours that 18.x exported; review round 4 caught it. The probe cache is
  keyed by document, then by mount element (nested `WeakMap`s), so `clearStyleCaches(doc)` still drops every
  wrapper's entries at the start of an export and a per-wrapper probe is built once per class list. A `null`-element
  cell (outside the viewport) still gets the class-only probe diff, so a colour only a scoped rule sets is
  exported for rendered cells only — the guide and the changelog say so. **Decision (review round 8):** this
  scroll-dependence is accepted; restoring determinism by probing rendered cells too would bring back the
  18.x regression, and renderer-written colours cannot be probed at all. The guarantee is scoped to
  class-based rules.
- **A date `numFmt` follows the cell's `locale`.** `buildDatePattern(options, locale)` orders the components
  and takes the separators from `Intl.DateTimeFormat#formatToParts`, the same call the date renderer makes,
  so a `de-DE` cell showing `15.01.2024` writes `dd.mm.yyyy` and the default `en-US` cell writes
  `mm/dd/yyyy`. No locale (or a malformed one, or a literal outside `-./, `) keeps the historic US
  `mm-dd-yyyy`. The import parser reads tokens and ignores separators, so every shape round-trips.
- **A date, time or date-time `numFmt` is DERIVED from the cell's own Intl options, and it is the exact
  inverse of the import's reader.** `intlDateFmtToExcelNumFmt` / `intlTimeFmtToExcelNumFmt` /
  `intlDateTimeFmtToExcelNumFmt` (`types/xlsx/date-utils.ts`) turn `dateFormat` / `timeFormat` /
  `dateTimeFormat` into an Excel pattern in Excel's US `m-d-y` and `h:mm:ss` order — month
  `'2-digit'`→`mm`, `'numeric'`→`m`, `'short'`→`mmm`, `'long'`→`mmmm`; day `'2-digit'`→`dd`,
  `'numeric'`→`d`; year `'numeric'`→`yyyy`, `'2-digit'`→`yy`; weekday `'short'`→`ddd`, `'long'`→`dddd`,
  written in front and separated with `, `; hour `'2-digit'`→`hh`, `'numeric'`→`h`; minute→`mm`; second
  `'2-digit'`→`ss`, `'numeric'`→`s`; a 12-hour clock appends ` AM/PM`. A month NAME switches the date
  separator to a space (`mmmm yyyy`), and a weekday with no month, day or year is written on its own
  (`dddd`), which the import's `applyDayOrWeekday` reads straight back as `weekday`. **An unspecified
  `hour12` is resolved from the cell's `locale`, not assumed to be 24-hour.** `Intl` defaults the clock
  from the locale and so does the grid — `timeRenderer` builds `new Intl.DateTimeFormat(locale,
  timeFormat)` — so a cell with `{ hour: '2-digit', minute: '2-digit' }` under the default `en-US`
  renders `09:30 AM` while the export used to write `hh:mm`, which the import read as `hour12: false`
  and the target grid rendered as `09:30`. `resolveHour12` asks `Intl.DateTimeFormat(locale,
  options).resolvedOptions().hour12` for exactly that, inside a `try`/`catch` because a malformed
  locale tag throws (treated as 24-hour). `intlTimeFmtToExcelNumFmt` and
  `intlDateTimeFmtToExcelNumFmt` therefore take the locale as an optional second parameter, which
  `types/xlsx.ts` threads from `meta.locale`; an explicit `hour12` still wins. A consequence for
  tests: an hour-carrying assertion with no `hour12` must name a locale, or it pins the machine's
  default. `getDateNumFmt()`/`getTimeNumFmt()`/`getDateTimeNumFmt()` are now
  the FALLBACK providers, used when the options are absent, are a legacy pattern string, or name no
  component of that half — so a cell with no format still exports `mm-dd-yy` / `h:mm:ss` /
  `mm-dd-yy h:mm:ss` byte for byte. The fixed `mm-dd-yy` was the whole defect: `importFile`'s
  `excelDateFmtToIntlOptions` reads `yy` as `year: '2-digit'`, so a source column showing `03/09/2025`
  came back as `11/02/23`. Two ambiguity rules are load-bearing and both are pinned by tests. An `m`
  run is a minute only next to an `h` or an `s` and a month everywhere else, so a time half carrying a
  minute with NEITHER neighbour falls back rather than emit an `mm` the import would read as a month;
  and `intlDateTimeFmtToExcelNumFmt` falls back unless BOTH halves are expressible, so a half-derived
  pattern never reaches the file. The import side gained the matching half: `applyDayOrWeekday` in
  `../importFile/inference.ts` reads three or more `d`s as `weekday`, not as a zero-padded day. One
  asymmetry survives on purpose — Excel has no "clock unspecified" marker, so an hour-carrying format
  that named no `hour12` comes back with `hour12: false` when the locale resolved to a 24-hour clock,
  and with `hour12: true` when it resolved to a 12-hour one. Either way the target renders what the
  source rendered, which is what the asymmetry costs and buys. The round trip is pinned in
  `../importFile/__tests__/inference.unit.js` ("date format round trip"), which imports the export
  helper: a TEST-only cross import, and the only one allowed across these two plugins.
- **A formula cell carries the number format its column meta describes, and caches the computed
  value.** `resolveMetaNumFmt` in `types/xlsx.ts` is the single meta→`numFmt` derivation, used by the
  `exportFormulas` formula branch and by every value branch, so a `numeric` column of live formulas
  exports with the same `numFmt` a static cell of that column would get. Without it the cell reached
  the file unformatted, `importFile`'s `inferCellType` — which prefers `numFmt` over the value —
  inferred `text`, and a column rendering `840.10` came back as `840.1`. The formula also carries
  `result: toPrimitiveResult(cellValue)`, the way the ColumnSummary branch already did, so Excel,
  LibreOffice and non-formula readers see the computed value.
- `headerStyle: null` exports headers with no styling; `headerStyle.border: null` suppresses only the border.
- **`types/xlsx.ts` builds a `WorkbookSnapshot` (`src/utils/xlsxEngine/model.ts`) through a 1-based
  `SheetBuilder` and hands it to the detected engine's `write`.** No ExcelJS call is allowed in this
  plugin any more; the ExcelJS-shaped interfaces live in `src/utils/xlsxEngine/adapters/exceljs.ts`. The
  `_HotValidation` sheet is pushed **after** the data sheet, and the adapter writes cell values row by
  row before it applies any merges — `worksheet.mergeCells()` forwards a merged slave's later value
  assignment to the master, so writing merges first would silently drop a slave cell's own write. Both
  orderings are load-bearing, and both are pinned by `exceljsWrite.unit.js`: it asserts
  `workbook.worksheets[1].state === 'veryHidden'` for the validation sheet, and "should write the rows
  before merging, so a merged range keeps its master value" is the row-before-merge regression test —
  run it before reordering `writeColumnLayout`/`writeRows`/`writeSheetFeatures` in `exceljs.ts`.

## Where to look next

- `../importFile/AGENTS.md` for the read direction — same adapters, same `_HotValidation` sheet, and the
  read-only/`locked` semantics.
- The other consumer of the same text contract: `../copyPaste/AGENTS.md`.
- The extraction implementation and its context list: `../../utils/textExtractor.ts`; the sanitizer
  resolver it calls first: `../../utils/sanitizer.ts`.
- `../../utils/xlsxEngine/` for the neutral workbook model, engine detection, capabilities and the
  ExcelJS adapter this plugin and `importFile` both call — neither plugin touches an engine object
  directly.
- Sources of exported values: `../formulas/AGENTS.md`, `../columnSummary/AGENTS.md`,
  `../nestedHeaders/AGENTS.md`.
- Menu entry: `contextMenuItem/`, wired via `../contextMenu/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='exportFile'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='exportFile'`

Unit coverage is deliberately fine-grained — `cell-style`, `date-utils`, `datetimeExport`, `formula-utils`,
`numeric-utils`, plus `types/`. A format change belongs in one of those, not only in the E2E spec.
