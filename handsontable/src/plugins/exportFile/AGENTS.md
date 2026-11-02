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

## CSV specifics

- **Column header lines come from `ExportDataProvider#getColumnHeaderRows()`, never `getColumnHeaders()`
  alone.** With the NestedHeaders plugin on, that method expands `getNestedColumnHeaders()` through
  `expandNestedHeaderLayers()` (`utils.ts`), one line per layer, a group label repeated across its
  colspan. The bottom-layer-only CSV was a bug (DEV-3033): XLSX and `copyPaste`'s
  `copyColumnGroupHeaders` already wrote every layer.
- **The three nested-header outputs share the layers, not the shape.** XLSX writes a group as one
  merged cell; `copyPaste` writes the label once and leaves the other spanned cells empty
  (`a1\t\t\tb1` in `nestedHeaders/__tests__/integrations.spec.js`); CSV repeats the label in every
  spanned column, because a file with no merged cells otherwise loses the grouping in a spreadsheet.
  Do not align these shapes. What must stay in step is which layers and which labels reach each
  output: a missing layer, or a label that skips `modifyColumnHeaderValue` or `textExtractor` in one of
  them, is the regression to look for.
- **The parent-layer placeholder is deliberate.** A `range` that starts inside a group emits an empty
  label for those columns on the parent layer, the same as the XLSX export. Repeating the group label
  there would be friendlier to read but would split the two formats; change both or neither.
  "Inside" means past the group's first *visible* column when hidden columns are excluded: the
  HiddenColumns plugin moves the span root (`isRoot`) to that column, the grid draws the label from
  there, and a range starting on it writes the label. With `exportHiddenColumns: true` the root stays on
  the tree node's `columnIndex`, so the same range writes the empty placeholder. Both are pinned in
  `csv.spec.js`; a reviewer on #13638 read the first as a bug, and it is not.
- **`getNestedColumnHeaders()` does not check `colHeaders`.** XLSX checks `hasColumnHeaders`
  separately; `getColumnHeaderRows()` guards on `options.colHeaders` first. A new text format must do
  one or the other or it writes header lines the caller never asked for.

## Nested headers in the data provider (both formats)

- **Walk a span to its original end, not to `root + colspan`.** With HiddenColumns, the root's
  `getHeaderSettings().colspan` is already reduced by the hidden columns, which still occupy index
  positions inside the span. `_appendNestedHeaderWithoutHidden` takes the end from the header tree node
  (`columnIndex + origColspan`). Stopping at `root + colspan` broke only a column hidden *strictly
  inside* a span — hiding the first or last column happens to work — so a test with two-column groups
  never sees it; the regression cases use a four-column group.
- **Read a span root's label through `getColHeader(col, layer)`, never from the header state.**
  `_getNestedHeaderLabel` does it, so the `modifyColumnHeaderValue` hook applies to every exported
  layer, as it does to the rendered `<th>` and to the flat header row. The raw `label` on the tree
  node or on `getHeaderSettings()` skips the hook, and a header translated through it was exported
  untranslated on every line (review of #13638). Call it for a root column only, and keep the literal
  `''` for placeholder and continuation cells: for a column inside a span, `getColHeader()` resolves
  the covering node and returns the group label again, which would fill the parent cell a `range`
  starting inside a group leaves empty. Since this change the XLSX header text follows the hook too.
- **A runtime-disabled plugin is caught by the zero-layer guard, not by the `enabled` check.**
  `NestedHeaders#disablePlugin()` clears its state manager, so `getLayersCount()` returns `0` while the
  settings still carry `nestedHeaders` and `isEnabled()` still answers `true`. Without the
  `layersCount === 0` early return the export took the nested path and wrote no column headers at all.
  The `plugin.enabled` gate in front of it is defensive: every disable path clears the state, so
  `enabled` and `isEnabled()` never disagree while there are layers, and swapping it back to
  `isEnabled()` keeps both runtime-disable specs green. Keep the zero-layer guard whatever else changes.
  The same `isEnabled()` pattern still guards the formulas and mergeCells lookups in `dataProvider.ts`;
  check it before relying on a runtime-disabled plugin there.

## XLSX specifics

Unit conversions, all constants at the top of `types/xlsx.ts`:

| From | To | Note |
|---|---|---|
| pixels | Excel column-width units | ≈ one character width of the "Normal" style font at the default size |
| CSS pixels | typographic points | `1 px = 0.75 pt` (72/96), for row heights |
| — | frozen row-header column width | a fixed default, chosen to fit typical row indexes |

Other rules:

- **`_createTypeFormatter` resolves the engine as `options.engine ?? engines[format]`, never by spreading
  the options over a default.** It used to build `{ engine: <configured>, ...options }`, so a caller's
  `engine: null` or `engine: undefined` WON, and `types/xlsx.ts` then mapped that `null` to the built-in
  engine — a grid configured `exportFile: { engines: { xlsx: ExcelJS } }` silently wrote through the
  native engine on `downloadFileAsync('xlsx', { engine: null })`, against the `ExportOptions.engine`
  JSDoc. `null` and `undefined` mean "no override" on both sides now, through
  `resolveEngineOverride(override, configured)` in `../../utils/xlsxEngine/detect.ts`, which `importFile`
  uses too — change one plugin's resolution and you have re-opened the drift. A RESOLVED `null`/`undefined`
  is then read as the built-in engine by `detectXlsxEngine` itself, so `types/xlsx.ts` maps nothing.
- **The "To Excel" sub-item (`export_file:xlsx`) is hidden by `supportsExportFormat('xlsx')`, and that guard
  must stay.** Once the built-in engine landed, the predicate answers `true` for the default setup and for
  `engines: { xlsx: null }`, so the guard looks dead — it was removed once for that reason. It is not: an
  `engines.xlsx` that does not duck-type answers `false`, and without the guard the item still shows and
  every click fails with `Invalid xlsx engine module.` in the console only. Pinned by
  `__tests__/contextMenuItem.unit.js`, which also pins the 18.1 to 19.0 migration guide's
  `beforeContextMenuSetItems` recipe for removing only that sub-item.
- **`exportFile: false` does NOT turn the plugin off, and that is documented, not fixed.** The parent
  Export item's `hidden()` (`contextMenuItem/exportItem.ts`) tests `exportFile === undefined` only, and
  `isEnabled()` always returns `true`, so `false` shows the menu entry and every export method still
  works, exactly as in 18.1. Hiding on any falsy value would change released behavior, so the
  `false` row in the `exportFile` table of `metaSchema.ts` and the export guide say it instead: only
  an unset `exportFile` keeps the item out of the menu.
- **A configured `engines: { xlsx: null }` means the built-in engine, everywhere, and `detect.ts` is the one
  place that says so.** It is what `xlsx: useExcelJs ? ExcelJS : null` writes, and it used to get three
  answers: `supportsExportFormat('xlsx')` answered `false` (the predicate reached `detectXlsxEngine(null)`,
  which threw), the export SUCCEEDED (`types/xlsx.ts` mapped the resolved `null` to native, since `null` is
  the option's own default), and `importFile` threw `Invalid xlsx engine module.` `detectXlsxEngine` now
  reads a nullish value — `undefined` or `null` — as "no engine, so the built-in one", the same as an absent
  key, and nothing else maps `null` on the way there. The refusal that stays is an entry that is present,
  NON-nullish and does not duck-type (`{}`, `42`, `false`). Do not restore a `?? undefined` in
  `types/xlsx.ts` or a `null` branch in either plugin: the predicate, the export and the import all have to
  reach the same answer through the same code, and `exportFile.unit.js` ("export with a null engine entry")
  and `importFile.unit.js` pin it on both sides.
  The type is `engines?: Record<string, object | null>` in both plugins so the documented pattern compiles
  under `strictNullChecks`; `exportFile.types.ts` and `importFile.types.ts` pin `{ xlsx: null }`.
- **`exportFormulas` is off by default.** On, HyperFormula formula cells and ColumnSummary destinations
  export as **live Excel formulas**; off, the pre-calculated static values go out.
- **`ExportDataProvider#getSourceData()` reads the formula by PHYSICAL row** (review round 12).
  `_extractDataMatrix` walks visual indexes, and `getSourceDataAtCell` takes a physical row and a
  visual column, so the row is translated with `toPhysicalRow` and the column is passed as it is.
  Passing the visual row wrote another record's formula after a sort, a move, a trim or a filter,
  next to this record's cached value and `t="e"` flag (`getEngineCellFacts()` maps through the
  Formulas axis syncers, so it was right). The source formulas hold ENGINE row references (the
  Formulas plugin rewrites them on every reorder, and the engine keeps trimmed rows), so
  `getExcludedHiddenRows()` returns engine row indexes when the plugin is on: every row with no visual
  index (the syncer answers `-1`) plus the excluded hidden rows. Without the plugin it keeps the
  physical hidden rows. Pinned by `__tests__/xlsxFormulaRowOrder.unit.js`. `getExcludedHiddenColumns()`
  mirrors it through `columnAxisSyncer` (DEV-3648): the engine's column order follows the visual one,
  so with `manualColumnMove` the physical index of a hidden column named another engine column, and
  both cell formulas and names were written one column off. Pinned by the moved-and-hidden case in
  `xlsxNamedExpressions.unit.js`. Both take `withOutsideRange`: `true` adds every engine index outside
  the `range` option, which only the defined names use (a cell formula is documented as not moved by
  the start of `range`).
- **`normalizeFormula` no longer owns the formula walk.** Splitting a formula into string literals, sheet
  names and A1 references lives in `../../utils/xlsxEngine/formulaRefs.ts` (`mapFormulaReferences`), shared
  with the import direction, which shifts the same references the other way. `normalizeFormula` keeps the
  arithmetic — the header offsets and the excluded-hidden-index counts — and shifts **absolute** components
  too: prepending headers translates the whole coordinate space, so a `$A$1` pinned to a grid cell has to
  follow it, and `$` pins a reference against copy and fill rather than against the sheet moving. Both
  directions agree on this (`shiftFormulaReferences` shifts `$` components as well), so `$A$1` goes out as
  `$B$2` and comes back as `$A$1`. `formula-utils.unit.js` pins the export half; a change that starts
  skipping `$` here is a behavior change, not a cleanup.
- **HyperFormula's separators are locale text; OOXML's are not** (DEV-3648). The source formulas and the
  named-expression definitions hold what the user typed under the engine's `functionArgSeparator` and
  `decimalSeparator` (`=SUM(A1;1,5)` under `,`/`;`). `normalizeFormula` and `normalizeNamedExpression`
  first write the decimal separator of every number literal as `.` (`toDotDecimalSeparator`, number
  literals only: never inside a string literal, a quoted sheet name, a reference or a name), then map the
  references, then swap the argument separator for `,`. Swapping only the argument separator wrote
  `SUM(A1,1,5)`, which Excel sums as three arguments (8, not 2.5), and `Sheet1!$A$1*0,5`, which is
  invalid. The decimal step runs **before** the reference mapping, so the exponent of `1,e3` stays part
  of its number instead of reading as the reference `E3`. `getFormulasDecimalSeparator()` reads the
  separator the way `getFormulasSeparator()` reads the other one, so every `xlsx*.unit.js` mock carries both.
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
  sheet), which is the only assertion that can tell the two apart at the adapter. The native engine has no
  level: `false` stores, every other value deflates at the platform default; `nativeWrite.unit.js` pins
  STORE-vs-DEFLATE by size.
- **Sheet names are sanitized by the export, not by the engine.** ExcelJS throws for an illegal character
  (`* ? : / \ [ ]`), a leading or trailing `'`, the reserved name `History`, an empty name and a duplicate
  (compared case-INsensitively), so a grid named `Q1: Sales` used to abandon the whole export. ExcelJS
  tests `History` in that exact case only (`lib/doc/worksheet.js`), but Excel reserves the name in any
  case, so the sanitizer renames `history` and `HISTORY` too — a Bugbot finding on #13551 that was right
  about the fix and wrong about the reason.
  `#uniqueSheetName` sanitizes, then truncates to 31, then de-duplicates — **in that order**. Truncating
  last lets two 35-character names that differ only past character 31 pass the duplicate check and then
  collide, which is why the counter's room is reserved inside the 31 characters. Control characters are
  stripped as well, before the de-duplication, for the same ordering reason. The `_HotValidation` helper
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
- **Every dropped-feature name the export can report is a row in the "Dropped features on export" table
  of the XLSX engine page**
  (`docs/content/guides/accessories-and-menus/xlsx-engine/`), the same rule
  `importFile/AGENTS.md` states for the import direction's table on the same page: add to both or neither.
  The names themselves are declared once, in `DROPPED_FEATURES` (`utils/xlsxEngine/capabilities.ts`), and
  `DroppedFeatureName` narrows `DroppedFeatures#record()` to exactly those members — they are public
  output, so a typo at one site would otherwise produce a different key for the same condition with
  nothing to catch it. A name whose tail is the file's own value (an unsupported validation type, rule
  kind or number format) is built by `DroppedFeatures#recordUnsupported(group, value)` instead, which
  checks the group and leaves only the data-driven tail free; `record()` takes no template literal, so a
  hand-written `conditionalFormatting:unparsedRefs` no longer type-checks.
  The write direction owns `compressionLevel`, `merge:overlap`, the `conditionalFormatting:*`
  names, and `cellText:truncated`, `columnWidth:clamped` and `rowHeight:clamped` (the last three raised by
  BOTH engines); the read direction's are in the XLSX engine page's import table, never in this one.
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
  from the locale and so does the grid — `timeRenderer` formats with `getDateTimeFormat(locale,
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
- **A formula whose result is an error caches the OOXML CODE, flagged, never the displayed text.**
  `getData()` gives the Formulas plugin's display string, which cannot tell the error `#N/A` from
  the text `="#N/A"` answers, and which the engine's `language` translates (`#DZIEL/0!` under
  `plPL`). `ExportDataProvider#getEngineCellFacts()` therefore reads the engine's own value per cell and
  `toOoxmlErrorCode()` (`types/xlsx/formula-utils.ts`) maps the `DetailedCellError#type`, recognized
  by shape, to a code; the formula branch of `#resolveCellValue` then writes
  `{ result: code, resultIsError: true }`. `CYCLE`, `ERROR`, `LIC` and `SPILL` have no code (POI
  refuses `#SPILL!` in a `t="e"` cell) and keep the display text, typed `str`. Pinned by
  `xlsxFormulaErrorResult.unit.js`.
- **A cell whose VALUE is an error exports as an Excel error too, with or without `exportFormulas`**
  (DEV-3648). `getEngineCellFacts()` is read on every export (every entry is `null` without the Formulas
  plugin), and `#resolveCellValue` writes `{ value: code, valueIsError: true }` for any cell the formula
  branch did not take: a typed `#N/A`, and a formula exported as its value. The check runs BEFORE the
  type branches, so an error in a numeric column is not converted. Known gap: an error typed into a date
  column is not flagged as an error. Without the plugin a typed `#N/A` stays a string. Every
  ExportDataProvider mock of the `xlsx*.unit.js` suites therefore carries `getEngineCellFacts()`, and
  the ones used with `exportFormulas` also carry `getNamedExpressions()` and `getFormulasBinding()`; a
  new mock needs them too. Pinned by `xlsxPlainErrorValue.unit.js`.
- **A number or boolean the Formulas engine COMPUTED keeps its type in a text column** (DEV-3648,
  `EngineCellFacts.computedValue`, read on every export with the plugin on). The default `text` type
  stringifies a cell, so a spilled `2` went out as the shared string `"2"`; Excel and LibreOffice
  recalculate and never noticed, but Apple Numbers reads cached values and summed a spill as 1. The
  matrix holds the engine value only for a cell whose engine type is not `VALUE`/`EMPTY` (a formula, an
  array formula, a spilled `ARRAY` cell) and whose value is a finite number or a boolean;
  `#resolveCellValue` uses it in the default branch, after the typed branches (a `numeric`, date,
  checkbox column keeps its own handling; the order is pinned in `xlsxComputedValueType.unit.js` without
  `exportFormulas`). A value the user typed stays text: HyperFormula holds it as `VALUE`.
- **The engine is read in ONE pass per sheet** (`ExportDataProvider#getEngineCellFacts(withArraySizes)`):
  per cell it translates the address once, asks `getCellType` once and `getCellValue` once, and
  returns `EngineCellFacts { errorCode, computedValue, arraySize }`, or `null` for an `EMPTY` cell,
  a cell with nothing to report, and an address the syncers answer with `-1` (the engine throws on a
  negative index). Three separate passes (error codes, computed values, array sizes) read every cell
  up to three times on every export with the plugin on, `exportFormulas` or not. Do not add a second
  per-cell engine pass: add the fact to `EngineCellFacts`. `xlsxEngineCellFacts.unit.js` pins one
  read per cell by counting only the engine calls made while a wrapped `getEngineCellFacts` runs
  (an `active` flag set in a `try`/`finally`), and pins one `getEngineCellFacts` call per sheet. Its
  grid keeps clear of the `walkArraySize` fallback, which reads a master's neighbors a second time.
- **A HyperFormula array formula exports as an Excel dynamic array, never as a plain formula**
  (DEV-3648). Excel adds an `@` to a spilling function that is not flagged, so the master carries the
  dynamic flag (`cm="1"` on the native engine). `ExportDataProvider#getEngineCellFacts(true)` returns
  `ArrayFormulaSize { rows, cols, exported }` as `arraySize` per cell, `null` for a non-master.
  HyperFormula has no public spill-range API, so the size comes from the engine's INTERNAL
  `arrayMapping.getArrayByCorner()` (duck-typed; any unexpected shape answers `null`), with a walk over
  `ARRAY`-typed cells as the fallback. **The mapping is the room the engine RESERVED, not the result**:
  `=FILTER(A1:A6,A1:A6>3)` reserves 6 rows for 3 and pads `vertex.array.raw()` with HyperFormula's
  `EmptyValue` symbol. Sized from the reservation, a `FILTER` near the last row would be cut and written
  as a plain formula (Excel's `@`), and one with room would get a padded `ref`. `trimEmptyTail()` drops
  trailing all-symbol rows, then columns (the walk drops trailing all-`null` ones); an error result
  (`ErroredArray`, no `raw()`) keeps the reserved size. **Only a dynamic array takes the trimmed size.**
  The symbol also marks an EMPTY REFERENCED cell (`=ARRAYFORMULA(IF(A1:A4>2,B1:B4,B1:B4))` over empty
  B3:B4 maps 4 rows, 2 of them symbols), and Excel never resizes a CSE ref, so a CSE array
  (whole-formula `ARRAYFORMULA`) takes `ArrayFormulaSize#untrimmed`, which the data provider sets, with
  its own `exported`, only when the trim changed the size. A dynamic array whose real last values are
  empty is trimmed too; Excel recalculates it to the full size. A `SEQUENCE` reserves exactly its size,
  so `xlsxArrayFormula.unit.js` pins `FILTER`, `TRANSPOSE(FILTER)` and the no-mapping walk. The walk can
  over-count next to another array, so the xlsx type keeps per-sheet claims (`ArrayRangeClaims` in
  `types/xlsx/formula-utils.ts`) and writes an overlapping array as a plain formula. **The claims rely
  on row-major order** (masters are claimed row by row, left to right): an overlap is then always on the
  new range's first row, one-cell claims are never stored, and only multi-cell spills keep their cells
  in a `Set`. Never claim out of order, and never go back to comparing every pair: that is quadratic in
  the number of array formulas. The data provider decides `exported` (every spilled row and column lands
  right after the master in the matrix): a spill crossing a hidden row with `exportHiddenRows: false`, a
  trimmed or filtered row, or the `range` edge is written as a plain formula and `formula:arrayExcluded`
  is recorded once. Every `ARRAYFORMULA(…)` call is stripped (`stripArrayFormulaCalls`), but **only a
  whole-formula call (`unwrapArrayFormula(text) !== null`) makes the formula a legacy CSE array**
  (`ARRAYFORMULA(x)` as `{=x}`). Any other formula keeps its own treatment on the stripped text: a spill
  (`ARRAYFORMULA(A1:A3)*2` under array arithmetic, `FILTER(A1:A6, ARRAYFORMULA(A1:A6>3))`) is a dynamic
  array, range arithmetic a one-cell dynamic array. Left with no spill and no dynamic reason, a call
  that is a whole function argument (`SUM(ARRAYFORMULA(x))`) is a one-cell CSE array, since the call
  evaluates its argument as an array, and a call that is an operand (`ARRAYFORMULA(A1:A3)*2` without
  array arithmetic, `callsArrayFormulaAsOperand`) is a PLAIN formula: the engine intersects it (A2*2 on
  row 2) as Excel's `@` does, and a one-cell CSE array would compute A1*2. `IFS` and `SWITCH` as a
  one-cell dynamic array (`EXCEL_DYNAMIC_ARRAY_FUNCTIONS`). A 1 x 1 spill (`=SEQUENCE(1)`) is not
  flagged. A blocked spill (`#SPILL!`) exports as a one-cell array with the `#SPILL!` text. The ExcelJS
  engine writes every dynamic array as CSE and records `dynamicArrays` for a multi-cell spill only: a
  one-cell CSE array (`IFS`, `SWITCH`, range arithmetic) computes the same value in Excel, so nothing is
  lost. Four-way parity is pinned by
  `utils/xlsxEngine/__tests__/enginesParityArraysErrorsNames.unit.js`.
- **Range arithmetic is a one-cell dynamic array too, gated on the engine's `useArrayArithmetic`**
  (DEV-3648; `ArrayFormulaTarget.arrayArithmetic`, read from the bound engine's `getConfig()`; the
  Formulas plugin turns it on by default): an operator right next to a multi-cell range
  (`SUM(A1:A3*B1:B3)`, `SUM((A1:A3)*2)`, `SUM(A1:A3%)`; `appliesOperatorToRange` in
  `utils/xlsxEngine/dynamicArrays.ts`) is computed over every cell by the engine, while Excel 365 opens
  the plain formula as `SUM(@A1:A3*@B1:B3)` (2, not 20). With `useArrayArithmetic: false` the engine
  intersects the range itself and the plain formula matches, so it stays plain. Under the ExcelJS engine
  it goes out as the one-cell CSE array `{=SUM(A1:A3*B1:B3)}`, which Excel computes the same way, so
  `dynamicArrays` is not recorded. **Known gaps:** a function that takes a range where it expects one
  value (`SUM(ABS(A1:A3))`) has the same `@` problem and is not detected – that needs per-function
  knowledge, deliberately left out. A defined name used as an operand is not detected either (its size
  is unknown), and neither is a range with both corners sheet-qualified (`Sheet1!A1:Sheet1!A3`).
- **Named expressions export as defined names, with `exportFormulas` only** (DEV-3648).
  `getNamedExpressions()` lists the engine's workbook names, then each engine sheet's scoped names
  (`scope`: the engine sheet name, or `null`). A scoped name is written with `sheetName` set to the
  exported name of the grid bound to that engine sheet (the native writer turns it into `localSheetId`),
  and skipped silently when no grid of the export binds it; the ExcelJS writer cannot hold a scope, so
  `selectDefinedNames` leaves it out there and the cells over it unlink. **Every name is keyed by scope
  AND name** (`definedNameKey`): the dedupe of `#addDefinedNames`, its `written` map (engine key → file
  key) and `uses`, and the cells' `DefinedNameUse.names`. A word of a formula on engine sheet S resolves
  to S's scoped name first, then the workbook's (`resolveDefinedName`), and Excel does the same with the
  file's names on the exported sheet; `#unlinkLeftOutNames` keeps a cell live only when both sides land
  on the same file name (`readInFile`), so a left-out scoped `Rate` never falls back on the workbook
  `Rate` in Excel. **A name inside a scoped definition is the exception.** HyperFormula 3.3 reads it
  from the workbook scope (scoped `Total = Rate*2` reads the workbook `Rate`), while
  `resolveDefinedName` looks in the name's own scope first, and Excel's rule there is unconfirmed. So
  when a scoped definition uses a name the file holds in BOTH that sheet's scope and the workbook scope
  (`readAmbiguously` in `#unlinkLeftOutNames`), the scoped name does not resolve: it is left out
  (`definedNames:unsupported`), and the formulas over it are written as values (`formula:definedName`).
  Every engine sheet takes ONE scope in the file, the first exported sheet bound to it: when the
  `sheets` option lists the same Handsontable instance twice, its scoped names are written for the first
  sheet only, and the second sheet's formulas over them are written as values (`formula:definedName`),
  because that sheet holds no such name in the file. A name defined with a constant has no formula text,
  so its value is spelled as a literal (`toFormulaLiteral`: `"text"` with `""`, at most 255 characters,
  `TRUE()`/`FALSE()`, an error code). A text holding a character the native writer drops
  (`ILLEGAL_XML_CHAR`, shared from `utils/xlsxEngine/adapters/native/xml/escapes.ts`: C0 controls, DEL,
  U+FFFE, U+FFFF) or a carriage return is refused: the writer would strip the first silently, and the
  reader's end-of-line handling reads `"a\rb"` back as `"a\nb"` (pinned by a write-then-read test). The
  ExcelJS writer keeps no constant name at all. **Names are written ONCE per export, not per grid**:
  grids of a multi-sheet export usually share one engine, and normalizing every name against each grid's
  own sheet wrote a reference to another grid's sheet unshifted under the engine's sheet name.
  `#populateWorksheet` only registers each grid's binding (`getFormulasBinding()`: engine + engine sheet
  name) with its exported name and header offsets; `#addDefinedNames` groups them per engine, reads the
  left-out rows and columns of each sheet
  (`getExcludedHiddenRows(true)`/`getExcludedHiddenColumns(true)`) only for an engine that has names,
  and runs `normalizeNamedExpression` once per name against that map. **Every bound grid registers, with
  or without `exportFormulas`**: a sheet written as values is still in the file, and registering only
  the `exportFormulas` grids would drop a name pointing at it. An engine's names are written only when
  one of its grids has `exportFormulas`, read from that grid. The `xlsx*.unit.js` mocks therefore all
  carry `getFormulasBinding()`. Every qualified reference is moved by the grid its sheet belongs to and
  re-qualified with that grid's exported name (`mapFormulaReferences`' `requalify`, whose answer carries
  the per-sheet map and whose new name the walker quotes). A reference to an engine sheet the export
  does not write, an unqualified one, or one that STARTS or ENDS on a left-out row or column (a row or
  column outside `range` counts as left out for names) refuses the whole name
  (`definedNames:unsupported`, recorded once); a left-out index inside a range only shrinks it. Names of
  one scope are deduplicated case-insensitively: the first wins, a later one with another definition is
  left out and recorded. Pinned by `xlsxNamedExpressions.unit.js` and `formula-utils.unit.js`. **A
  formula over a name that does not reach the file is written as its value** (`formula:definedName`,
  `#unlinkLeftOutNames`). Live, it showed `#NAME?` in Excel, or worse, read ANOTHER engine's `Rate` (two
  engines, one file: grid B's `=SUM(Rate)` summed grid A's cells, 3 instead of 300). The cells are
  decided AFTER every sheet is populated, because the names in the file depend on every grid:
  `#writeRowCells` notes each formula cell whose words (`namesUsedIn`, outside quotes and brackets, not
  followed by `(` or `!`) include a name of its engine (`DefinedNameUse`, with the value the export
  writes without `exportFormulas` as its fallback); `#addDefinedNames` returns, per engine, the names
  written with that engine's definition; and the adapter's `selectDefinedNames` (pure, the same
  selection `write` makes: the shared validation, plus the ExcelJS single-range shape and cell budget)
  says which of them the writer keeps. A name of an engine resolves only when it is in both sets AND
  every name of that engine its definition uses resolves too (`#addDefinedNames` also returns each
  name's `uses`; `#unlinkLeftOutNames` walks the chain the way `importFile`'s `collectNamedExpressions`
  does). So `Total = Base*2` with `Base` left out does not resolve, and with two engines that both
  define `Total = Rate*2` but differ on `Rate`, the file's `Total` (same text, so the second engine's
  lands in `written`) still reads the FIRST engine's `Rate`: it does not resolve for the second. A noted
  cell with any unresolved name is rewritten in place, and a file name that resolves for no engine is
  taken out of `workbook.definedNames` (`definedNames:unsupported`). The fallback keeps the column's
  number format for a computed number (`intl-date`/`intl-time`/`intl-datetime` cells hold the engine's
  number, so the value branch alone wrote no format).
- `headerStyle: null` exports headers with no styling; `headerStyle.border: null` suppresses only the border.
- **The frozen pane counts EXPORTED indexes, not the raw `fixedColumnsStart`/`fixedRowsTop`.**
  `ExportDataProvider#getFrozenColumns()`/`getFrozenRows()` count the visual indexes of the frozen band
  (`0 … fixed - 1`) that fall inside the `range` option and are written to the file: a hidden index is
  skipped when `exportHiddenColumns`/`exportHiddenRows` is `false`, and kept for `true` and `'hide'`
  (it is still a column of the sheet). Returning the raw setting froze one column too many for every
  hidden column in the band, and froze columns that a `range` starting inside or after the band never
  exported. The header row and the row-header column are added later, in `#applyWorksheetViews`
  (`types/xlsx.ts`) — never add them in the data provider. Pinned by `dataProviderFrozenPanes.unit.js`
  and the "frozen panes with hidden indexes" block in `layout.spec.js`.
- **An empty checkbox exports as an empty cell.** `#getCheckboxValue` returns `true` for
  `checkedTemplate`, `false` for `uncheckedTemplate`, `null` for an empty value (`isEmpty`: `null`,
  `undefined`, `''`) that matches neither — the renderer's `noValue` state — and `false` for anything
  else. The templates are matched through `matchCheckboxTemplate` (`utils/checkboxColumn.ts`), the
  renderer's own matcher since DEV-355, so a case variant such as `'TRUE'` counts, and with
  `uncheckedTemplate: ''` a `null` reads the same as the template and exports `false`, as the renderer
  draws it unchecked. Never compare the templates with `===` here again: the export would stop
  following what the grid shows.
  Before this, an empty checkbox wrote `<c t="b"><v>0</v></c>` and re-imported as unchecked.
  Pinned by `xlsxCheckboxValue.unit.js`; the user-facing note is in section 38 of the 18.1 → 19.0
  migration guide, together with the frozen-pane change above.
- **The `_HotValidation` helper sheet is `hidden`, NOT `veryHidden`.** Apple Numbers discards a very
  hidden sheet on open together with every validation that points at it, so every dropdown of a
  native or ExcelJS export was lost there (18.1 wrote it `veryHidden` too). `hidden` keeps them in
  Numbers; the cost is that Excel lists the sheet under Unhide. Inlining short lists (255 characters)
  was the alternative and stays open. Named in the export guide's cell-type table and in section 38
  of the migration guide.
- **Every currency symbol except a lone `$` is QUOTED in the `numFmt`** (a lone `€`/`£` too: Numbers
  and Quick Look misread it bare, `#,##0.00€` showed 1235 for 1234.5 in Numbers) (`numeric-utils.ts`,
  shared by both engines): `"USD"#,##0.00`, `#,##0.00"zł"`. The raw `formatToParts` symbol used to go
  in unquoted (`#,##0.00USD`, `CHF#,##0.00`), which Excel for the web REPAIRS and LibreOffice and
  Numbers drop. Only a lone `$` stays bare (Excel's own form). The import's
  `captureQuotedCurrency` (`importFile/numFmtCode.ts`) reads the quoted ISO code back, so the round
  trip keeps the currency. A symbol SEVERAL currencies share (`kr`, `kr.`, halfwidth `¥`, fullwidth `￥`) is written
  as a locale token `[$<symbol>-<LCID>]` with the CURRENCY's home LCID, never the column locale's
  (en-US JPY must not get 409, or yen and yuan read the same): `[$kr-414]` NOK, `[$kr-41D]` SEK,
  `[$kr.-406]` DKK, `[$kr.-40F]` ISK, `[$¥-411]` JPY, `[$¥-804]` CNY, `[$￥-411]` JPY (ja-JP renders the
  fullwidth sign). The reader maps the LCID per
  symbol (`SHARED_SYMBOL_LCID_TO_CODE`), so an LCID never reassigns another symbol (`[$$-414]` stays USD).
  **The bare `$` is a shared symbol too** (review round 7): a dollar currency other than USD that
  `Intl` renders as `$` (en-AU AUD, en-CA/fr-CA CAD, en-NZ NZD, es-MX MXN, and the other entries of
  `SHARED_SYMBOL_CURRENCY_LCID`) is written `[$$-C09]`, `[$$-1009]`, … — Excel's own tokens — because a
  bare `$` reads back as USD. USD stays bare. This changed the string 18.1 wrote for those currencies.
  **Every other symbol is checked against the reader before it is written** (review round 12):
  `intlNumFormatToExcelNumFmt` runs `captureCurrency` on the code it built, and when that does not
  read back the same currency (`₪` ILS, `R` ZAR, `AU$` outside en-AU, `฿` THB, a bare `$` for a
  dollar currency with no LCID) it writes the quoted ISO code instead (`#,##0.00"ILS"`). Excel then
  shows the code, not the symbol, for those pairs only. Growing `CURRENCY_SYMBOL_TO_CODE` instead was
  rejected: the table is shared with the raw-value inference (`utils/columnTypeInference/`), where `R`
  would turn `R 100` into ZAR. `inference.unit.js` ("currency round trip") checks every
  `Intl.supportedValuesOf('currency')` code under 24 locales.
  **DKK keeps Excel's `[$kr.-406]`, period included**, although macOS Quick Look renders that token as
  `PLN` (`[$kr-406]` renders correctly there): Quick Look is the outlier, not Excel. Do not "fix" it
  without checking Numbers and Excel; the reader maps both spellings.
- **`minimumIntegerDigits: n` is written as n zeros** in the integer part (`00000`, `000.00`, `#,#00`),
  and the import sets it from a zero-padded code, so a ZIP-code column keeps its zeros both ways.
- **The exported sheet direction follows the RENDERED direction** (`hot.isRtl()`), not the raw
  `layoutDirection` setting, so a grid on a `dir="rtl"` page with the default `'inherit'` writes a
  right-to-left sheet. The import side already used `isRtl()`; the two disagreed before.
- **A `timePeriod` rule needs no `formulae`.** ExcelJS documents `{ type, priority, timePeriod, style }`
  and builds the formula itself; the native writer builds the same formula from the period and the
  block's top-left cell, and the shared screen (`conditionalRules.ts#isWritableConditionalRule`)
  rejects a rule without a `timePeriod` string, or without `formulae` whose period is not one of the
  ten ExcelJS builds a formula for (`today`, `yesterday`, `tomorrow`, `last7Days`, `thisWeek`,
  `lastWeek`, `nextWeek`, `thisMonth`, `lastMonth`, `nextMonth`). A `colorScale`/`dataBar`/`iconSet`
  rule without `cfvo` (a `colorScale` also without `color`) is screened out for BOTH engines
  (`conditionalFormatting:<kind>`), because ExcelJS throws `cfvo.forEach` on it.
- **Destroying the grid mid-export rejects with a message, not a raw `TypeError`**:
  `ExportFile: the Handsontable instance was destroyed while the file was being exported.` The
  download path checks the instance again after the engine resolves, the way the import guards its
  own apply.
- **`types/xlsx.ts` builds a `WorkbookSnapshot` (`src/utils/xlsxEngine/model.ts`) through a 1-based
  `SheetBuilder` and hands it to the detected engine's `write`.** No ExcelJS call is allowed in this
  plugin any more; the ExcelJS-shaped interfaces live in `src/utils/xlsxEngine/adapters/exceljs.ts`. The
  `_HotValidation` sheet is pushed **after** the data sheet, and the adapter writes cell values row by
  row before it applies any merges — `worksheet.mergeCells()` forwards a merged slave's later value
  assignment to the master, so writing merges first would silently drop a slave cell's own write. Both
  orderings are load-bearing, and both are pinned by `exceljsWrite.unit.js`: it asserts
  `workbook.worksheets[1].state === 'hidden'` for the validation sheet, and "should write the rows
  before merging, so a merged range keeps its master value" is the row-before-merge regression test —
  run it before reordering `writeColumnLayout`/`writeRows`/`writeSheetFeatures` in `exceljs.ts`.

## Column widths come from `_getColWidthFromSettings()`

`DataProvider#_getNaturalColWidth()` reads a column's configured width through `hot._getColWidthFromSettings(visualColumn)`, which takes a VISUAL index and reads the `colWidths` array and function by the physical one. Do not copy that translation or index `colWidths` yourself. A width that is not a finite number falls back to `defaultColumnWidth`. See `../autoColumnSize/AGENTS.md`, "Known concerns".

## A `loadData()` during the overlay wait rejects the download

`downloadFileAsync()` with the Dialog plugin reads the data only after the double `requestAnimationFrame`, so a
`loadData()` in between (a sheets bar switch) exported the data loaded in the meantime. The plugin counts loads on
`beforeLoadData` (`#dataLoads`) and `#assertDataKept()` rejects when the count moved. Rejecting rather than reading
the data before the wait keeps the reason the wait exists: the overlay paints before the export blocks the thread.
Only `loadData()` counts, not `updateData()`. Pinned by `__tests__/exportFile.unit.js`.

## Where to look next

- `../importFile/AGENTS.md` for the read direction — same adapters, same `_HotValidation` sheet, and the
  read-only/`locked` semantics.
- The other consumer of the same text contract: `../copyPaste/AGENTS.md`.
- The extraction implementation and its context list: `../../utils/textExtractor.ts`; the sanitizer
  resolver it calls first: `../../utils/sanitizer.ts`.
- `../../utils/xlsxEngine/` for the neutral workbook model, engine detection, capabilities and the
  ExcelJS adapter this plugin and `importFile` both call — neither plugin touches an engine object
  directly.
- `../../utils/xlsxEngine/AGENTS.md` for the engine contract and the native adapter's traps.
- Sources of exported values: `../formulas/AGENTS.md`, `../columnSummary/AGENTS.md`,
  `../nestedHeaders/AGENTS.md`.
- Menu entry: `contextMenuItem/`, wired via `../contextMenu/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='exportFile'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='exportFile'`

Unit coverage is deliberately fine-grained — `cell-style`, `date-utils`, `datetimeExport`, `formula-utils`,
`numeric-utils`, plus `types/`. A format change belongs in one of those, not only in the E2E spec.

## `fixedColumnsEnd` is not exported

`getFrozenColumns()` reads `fixedColumnsStart` only. A worksheet has one freeze pane, anchored at the top left, so
the end columns have no representation in XLSX and are left out on purpose. Nothing else in the export depends on
the frozen counts.
