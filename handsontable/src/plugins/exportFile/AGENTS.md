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

- **Column header lines come from `DataProvider#getColumnHeaderRows()`, never `getColumnHeaders()`
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
- **Every dropped-feature name the export can report is a row in the export guide's dropped-features
  table**, the same rule `importFile/AGENTS.md` states for the import direction: add to both or neither.
  The names themselves are declared once, in `DROPPED_FEATURES` (`utils/xlsxEngine/capabilities.ts`), and
  `DroppedFeatureName` narrows `DroppedFeatures#record()` to exactly those members — they are public
  output, so a typo at one site would otherwise produce a different key for the same condition with
  nothing to catch it. A name whose tail is the file's own value (an unsupported validation type, rule
  kind or number format) is built by `DroppedFeatures#recordUnsupported(group, value)` instead, which
  checks the group and leaves only the data-driven tail free; `record()` takes no template literal, so a
  hand-written `conditionalFormatting:unparsedRefs` no longer type-checks.
  The write direction owns `compressionLevel`, `merge:overlap`, the `conditionalFormatting:*`
  names, and `cellText:truncated`, `columnWidth:clamped` and `rowHeight:clamped` (the last three raised by
  BOTH engines); the read direction's are in the import guide.
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
- **The frozen pane counts EXPORTED indexes, not the raw `fixedColumnsStart`/`fixedRowsTop`.**
  `DataProvider#getFrozenColumns()`/`getFrozenRows()` count the visual indexes of the frozen band
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
  else. Checking `uncheckedTemplate` first is what keeps `uncheckedTemplate: ''` exporting `false`.
  Before this, an empty checkbox wrote `<c t="b"><v>0</v></c>` and re-imported as unchecked.
  Pinned by `xlsxCheckboxValue.unit.js`; the user-facing note is in section 30 of the 18.1 → 19.0
  migration guide, together with the frozen-pane change above.
- **The `_HotValidation` helper sheet is `hidden`, NOT `veryHidden`.** Apple Numbers discards a very
  hidden sheet on open together with every validation that points at it, so every dropdown of a
  native or ExcelJS export was lost there (18.1 wrote it `veryHidden` too). `hidden` keeps them in
  Numbers; the cost is that Excel lists the sheet under Unhide. Inlining short lists (255 characters)
  was the alternative and stays open. Named in the export guide's cell-type table and in section 30
  of the migration guide.
- **A currency symbol longer than one character is QUOTED in the `numFmt`** (`numeric-utils.ts`,
  shared by both engines): `"USD"#,##0.00`, `#,##0.00"zł"`. The raw `formatToParts` symbol used to go
  in unquoted (`#,##0.00USD`, `CHF#,##0.00`), which Excel for the web REPAIRS and LibreOffice and
  Numbers drop. A lone `$`, `€`, `£` or `¥` stays bare, because Excel accepts it. The import's
  `captureQuotedCurrency` (`importFile/numFmtCode.ts`) reads the quoted ISO code back, so the round
  trip keeps the currency. A symbol SEVERAL currencies share (`kr`, `kr.`, halfwidth `¥`) is written
  as a locale token `[$<symbol>-<LCID>]` with the CURRENCY's home LCID, never the column locale's
  (en-US JPY must not get 409, or yen and yuan read the same): `[$kr-414]` NOK, `[$kr-41D]` SEK,
  `[$kr.-406]` DKK, `[$kr.-40F]` ISK, `[$¥-411]` JPY, `[$¥-804]` CNY. The reader maps the LCID per
  symbol (`SHARED_SYMBOL_LCID_TO_CODE`), so an LCID never reassigns another symbol (`[$$-414]` stays USD).
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
