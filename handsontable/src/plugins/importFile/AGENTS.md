# ImportFile plugin — XLSX import through swappable engines

The `importFile` plugin reads a workbook into the grid. Read this before touching `importFile.ts`,
`mapper.ts`, `inference.ts`, `applier.ts`, or anything under `../../utils/xlsxEngine/`.

## What it owns and what it does not

- Owns: option defaults (`mapper.ts#resolveImportOptions`), the snapshot → `ImportResult` mapping,
  type inference from number formats, and applying a result to the grid.
- Does not own: parsing. Every engine call lives in `src/utils/xlsxEngine/adapters/<engine>.ts`, shared
  with `exportFile`. Never import from `../exportFile`; the unit constants both directions share
  (`PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT`, `POINTS_PER_PIXEL`) live in `src/utils/xlsxEngine/units.ts` and are
  imported by `inference.ts` and by `../exportFile/types/xlsx.ts`, so there is one definition rather than
  two copies to keep in step.
- Registration is two places beyond the plugin directory itself: `src/plugins/types.ts` adds `ImportFile`
  to `PluginTypeMap` (so `hot.getPlugin('importFile')` is typed), and
  `src/__tests__/registry/registerAllPlugins.unit.js` pins the priority order every registered plugin
  must keep — this plugin sits at `245`.

## Traps

- **The adapter refuses a sheet before it allocates one.** `src/utils/xlsxEngine/limits.ts` caps a sheet at
  1,048,576 rows, 16,384 columns and 5,000,000 cells, and `readSheet` asserts all three from the DECLARED
  counts before the first row is read. A workbook is untrusted input: a file with one cell at `XFD1048576`
  costs a few kB and describes a 17-billion-cell rectangle. Both dimensions are checked on their own AND as
  a product, because each can sit inside its own limit while the rectangle cannot be held. **The two column
  counts are not interchangeable here.** The COLUMN cap (and `readColumnLayout`) takes
  `max(columnCount, columns.length)`, so a trailing layout-only column counts; the CELL cap takes
  `columnCount` alone, and so does the per-row `null` padding. Excel writes one
  `<col min="1" max="16384"/>` for any sheet-wide width or style and `Column.fromModel` expands it into
  16384 `Column` objects, so multiplying by the widened count refuses a 10 kB, 400-row, one-column file as
  "400 × 16384 cells" — and padding every row to it would be the blow-up the cap exists to prevent.
  **Two more caps came out of review round 4.** `MAX_INPUT_BYTES` (128 MiB) is checked on the buffer BEFORE
  `workbook.xlsx.load()` — every other cap is measured on the parsed workbook, so it bounds only this
  reader's snapshot, never ExcelJS's own allocation. `MAX_WORKBOOK_CELLS` (10M) is a running budget
  threaded through `readSheet` as `WorkbookBudget`, each sheet counted `rows × max(columns, 1)`, because a
  file may declare many sheets that each sit inside the per-sheet cap. And `parseRangeRef` is bounded
  (`{1,3}` letters, `{1,7}` digits, corners inside `MAX_SHEET_ROWS`/`MAX_SHEET_COLUMNS`, `null` past them)
  and knows the open forms `A:A` and `2:3`, which span the whole sheet on the open axis — so every consumer
  (`readRangeValues`, `mapConditionalFormatting`) MUST clamp to the extent it actually holds before looping.
  A list validation of `$A$1:$A$99999999999` used to parse and drive a 10^11-iteration read.
  `wide-columns.xlsx` is that file.
- **A snapshot row may be `[]`, and `rows[r][c]` is not safe to index blind.** The adapter walks rows with
  `worksheet.findRow()` rather than `eachRow({ includeEmpty: true })`, which calls `getRow()` and therefore
  MATERIALIZES every hole. A row with no `<row>` element and a row that exists only to carry a height or a
  hidden flag both come out as the empty array; only a row that carries cells is padded with `null` to the
  sheet's width. Every reader takes `sheet.rows[r]?.[c] ?? null` (the mapper, `mapHeaders`, and
  `inference.ts#readRangeValues` all do). `eachRow()` without `includeEmpty` is NOT the alternative it looks
  like: it filters on `Row#hasValues`, so it silently skips a height-only row and loses its height.
- **`worksheet.columnCount` is the widest populated ROW, so it misses a trailing layout-only column.** A
  width or a hidden flag set on a column past the last cell lives in `worksheet.columns` and nowhere else,
  which is why `readSheet` reads `max(columnCount, columns?.length ?? 0)`. `columnCount` is also a getter
  that scans every row per call — read it once, never in a loop condition.
- **Imported column headers are HTML-escaped, in `mapper.ts#mapHeaders`.** Handsontable renders `colHeaders`
  as HTML, so a promoted first row is markup: a cell reading `<img src=x onerror=…>` executes on render.
  `escapeHtml` (`helpers/string.ts`), not `stripTags` — stripping cuts everything from a `<` to the next
  `>`, so `5 < 10` would become `5 `. Cell VALUES are rendered as text and are deliberately left alone.
- **The lossy reads the adapter reports, and why each is only a report.** `hyperlink` (the text is kept, the
  URL is not — and a hyperlink's text may ITSELF be a rich-text run list, nested one level below the cell
  value, so both `hyperlinkText` and the `richText` report have to look there too), `richText` (the text is
  kept, the per-run formatting is not), `images`, `tables`,
  `autoFilter`, `sheetProtection:password` (the file carries a salted hash, never a password — it is
  deliberately NOT modelled, so a re-export cannot claim one; `readOnly` is still derived from the
  protection) and `merge:overlap` from the write direction. They are listed in the import guide's
  dropped-features table; add to both or neither.
- **A number index in `sheet` skips very-hidden sheets** (`selectSheet` in `mapper.ts`). The export writes
  its dropdown sources into a `veryHidden` `_HotValidation` sheet; picking it by index would import a list
  of options as data. By name it is still reachable.
- **An unqualified list range reads from the sheet the validation sits on.** Excel stores a Data Validation →
  List → range-on-this-sheet as a bare `$C$1:$C$10`; only a range on another sheet carries a `Sheet!`
  qualifier, and the export's own `_HotValidation` helper is the only shape the round-trip tests ever
  produced, which is how the bare form shipped as `dataValidation:unresolvedList` (Bugbot on #13551).
- **A conditional formatting `ref` part the parser cannot read is recorded as
  `conditionalFormatting:unparsedRef`.** The rules themselves stay out of `dropped` (they reach the caller
  on the result), but a rectangle that silently vanished was a loss nothing named. Listed in the guide's
  dropped-features table; add to both or neither.
  `resolveListSource` therefore takes the current `SheetSnapshot` as its third argument.
- **Only strings are promoted to headers; the row-header column is discarded.** Handsontable generates
  row headers, so the values in the dropped column are not data anyone can get back.
- **Never read `cell.value` for anything a user sees — go through `toDisplayText` / `toGridValue` in
  `inference.ts`.** A formula cell keeps its display text in `formula.result` with `value` left `null`,
  and a date cell's `value` is an Excel serial under a date format. The data path always knew this
  (`toGridValue`), but header promotion, nested-header labels and list-validation ranges read
  `cell.value` directly, so a `colHeaders: 'firstRow'` import turned a formula header into `''` and a
  date header into `44927`, and a dropdown pointing at formula cells lost those options (Bugbot round
  3 on #13551). `cellDisplayValue` is the one place the formula/value choice is made.
- **Capture the currency BEFORE classifying a number format as temporal.** `CHF#,##0.00`, `SEK#,##0` and
  `HK$#,##0` carry an `h` or an `s` that `classifyTemporal` reads as a format code, so the export's own
  output for those currencies came back as `time` columns with `1234.5` turned into `12:00:00`.
  `inferCellType` therefore classifies `captureCurrency(numFmt).rest`, and `captureCurrency` recognizes a
  bare ISO code or dollar composite (`BARE_CURRENCY_REGEX`, anchored to the `#`/`0` digits so `YYYY-MM-DD`
  is never a currency) on top of the symbol table.
- **A list validation is resolved once per formula per pass** (`resolveDropdownMeta`, cache on
  `CollectContext.listMetaByFormula`). A validated column repeats the same formula on every cell and
  `readRangeValues` walks the whole range each time, so a 100k-row dropdown over a 1,000-row list used to
  cost 10^8 cell reads. The cached meta object is shared by every cell that carries the formula, which is
  also what lets `columnMetaAgrees` settle a dropdown column by reference instead of `JSON.stringify`-ing a
  source list per cell. Do not clone the meta per cell.
- **Guard `this.hot` after every `await`.** The workbook read (and `blob.arrayBuffer()`) is the plugin's
  async boundary; `BasePlugin#destroy` deletes `hot`, so a grid torn down mid-read used to surface as a raw
  `Cannot read properties of undefined`. Both entry points now reject with a Handsontable error instead.
- **Never read `worksheet.model` in the ExcelJS adapter.** It is a getter that re-serializes the whole
  worksheet (every row, every cell) on each access. Merges are collected inside the row pass
  (`trackMerge`, keyed by the master cell) and sheet protection is `worksheet.sheetProtection`, which the
  reader sets straight from the XML.
- **Meta follows the `cell → column` cascade, dominant type first.** `placeMeta` lifts the meta MOST cells
  of a column share to `columns[c]` (the cached object itself, by reference) and emits `cellsMeta` only for
  the cells that differ; `readOnly` and `className` are lifted the same way when every row of the column
  agrees (`placeColumnWide`). One footer row or one stray `n/a` used to send a whole column through
  `setCellMetaObject` — a million retained meta objects on a million-cell sheet. `columns` is omitted
  when every entry is `{}`, because an array `columns` pins the grid's column count. A one-row sheet
  therefore lifts everything to the column level; that is the intended reading, not a bug.
- **Inference is memoized per `numFmt` + value kind on the pass** (`inferForCell`,
  `CollectContext.inferredByFormat`), so a million-cell sheet with three formats parses each once and
  every cell of one format shares one meta object. Do not call `inferCellType` per cell from the mapper.
- **A blank cell on a protected sheet is locked.** OOXML treats a cell with no `<protection>` as locked,
  and an empty cell has none; `collectCells`' `null` branch records `readOnly` under protection too.
- **Every option that sizes a loop is clamped to the sheet.** `resolveImportOptions` validates `range`
  (four non-negative integers, start ≤ end; a short array used to destructure to `undefined`, the row
  loop never ran, and `loadData([])` wiped the grid), `computeWindow` clamps `lastRow`/`lastCol` to the
  sheet extent, `clampToSheet` caps `headerRows` at the rows the range holds (`headerRows: 1e9` used to
  hang `mapNestedHeaders`), and `mapLayout` clamps frozen panes to the window like merges and hidden
  indexes already were.
- **The applier resets the layout a previous import left, and merges into options objects.** With
  `importLayout` on, every `RESETTABLE_LAYOUT_KEYS` entry the result omits and the grid currently has is
  cleared (`mergeCells`/`hiddenRows`/`hiddenColumns` keep their options object with an empty list,
  `fixedRowsTop`/`fixedColumnsStart` go to `0`, `customBorders` to `[]`, `colWidths`/`rowHeights` to an OWN
  `undefined` — `updateSettings` writes every own property it is handed, `hasOwnProperty`, not `isDefined`,
  so an explicit `undefined` restores the default where an absent key keeps the old value). `columns` is the
  exception and must NOT be reset with `undefined`: `updateSettings` writes the value but runs the
  column-meta cache reset and `initIndexMappers` only for a DEFINED `columns`, and `loadData` has already
  sized the grid from the old array — so the previous file's types and pinned width survived (Bugbot round
  6). One `{}` per imported column is sent instead, which takes both paths; it is sent only when the grid
  already has a `columns` setting, regardless of `importLayout`, and sized by `importedWidth` — the widest
  data row OR the headers/widths for a sheet with no data cells, because `columns: []` pins ZERO columns
  and a header-only import would lose its headers (Bugbot round 7). Width zero sends nothing. A list the
  result does carry is merged into an existing options object (`{ indicators: true }` on `hiddenRows`,
  `{ virtualized: true }` on `mergeCells`) rather than replacing it. `hiddenRows`/`hiddenColumns` are
  ALWAYS the object shape; only `mergeCells` may be a bare array.
- **The result is in sheet coordinates; the grid API takes visual ones.** `applyImportResult` runs every
  `cellsMeta` and comment coordinate through `toVisualRow`/`toVisualColumn`, because a `manualRowMove`
  array reorders rows inside `loadData`. Both return `null` for a trimmed index (`trimRows`,
  `trimColumns`) even though the type says `number`; such an entry is skipped, not written.
- **The generated stylesheet is mounted in `hot.rootWrapperElement`, not `document.head`**, the way the
  theme engine mounts its per-instance `<style>`: a rule in the outer head never reaches a grid inside a
  shadow root. `removeImportedStyles` queries the same element.
- **`applyImportResult` relies on `hot.batch` resuming in `finally`.** The callback runs host hooks
  (`beforeLoadData`, `afterUpdateSettings`) that can throw, and before #13551 the core helpers
  resumed only on the happy path, leaving the grid render-suspended for good. The fix lives in
  `core.ts` (`batch`, `batchRender`, `batchExecution`), pinned by `src/__tests__/core/core.unit.js`.
- **`locked` becomes `readOnly` only under sheet protection, and only unless the cell was explicitly
  unlocked.** `mapper.ts` marks a cell read-only when `sheet.protection?.enabled && cell.locked !== false`.
  Without `<sheetProtection>` Excel ignores per-cell lock flags, and every cell in a fresh workbook is
  locked by default, so honoring the flag unprotected would make every import read-only. ExcelJS never
  writes `<protection locked="1">` — the OOXML default — so a cell reads back as locked (and therefore
  `readOnly: true` under protection) unless the source workbook set `locked: false` on it explicitly.
- **Styling is applied only behind `importStyles: true`**, and it lands in `result.dropped` as `cellStyles`
  otherwise. There is no cell-meta home for inline style, so `mapper.ts` turns it into generated class names
  (`result.cellsMeta[].meta.className`) plus the declarations they need (`result.styles`), and borders into
  `result.customBorders`. `applier.ts#installImportedStyles` installs `result.styles` as one
  `<style data-hot-imported-styles="<hot.guid>">` element in `hot.rootDocument.head` — one per instance,
  `textContent` replaced (never appended) on every import — and `ImportFile#destroy()` removes it via
  `removeImportedStyles(this.hot)` before `super.destroy()`. `toSettings` passes `result.customBorders`
  straight through `updateSettings`. The exact selector `.handsontable tbody > tr > td.<class>` is
  load-bearing, and load-bearing in two directions at once. It has to keep matching the export's own
  class probe (`div.handsontable > table > tbody > tr > td.<class>`, no class on the `<table>` -
  `table.htCore` would never match it) so a re-export still recovers the fill. And it has to keep
  outranking the theme's own row-banding rule (`.handsontable :where(table.htCore > tbody, …) >
  tr.ht__row_even/odd > td`, present in main, horizon and classic alike): both selectors tie at two
  classes, and the extra `tbody`/`tr` type selectors here are what push the generated rule to
  `(0,2,3)` against the theme rule's `(0,2,2)`. The shorter `.handsontable td.<class>` used to lose
  that tiebreak and get its background silently painted over by the theme on every row; do not shrink
  the selector back down, and do not reach for `!important` instead — it would also outrank a user's
  own CSS with no way back.
- **Nothing read from the workbook reaches that stylesheet unvalidated, at two layers.** A workbook stores
  the raw `rgb` XML attribute and ExcelJS hands it back untouched, so an `rgb` value of
  `0000ff}*{background-image:url(https://attacker.example/x)}` used to produce a declaration that closes
  the generated rule and injects CSS of the file's own into the host page. `styles.ts#argbToCssHex` therefore returns
  `string | null` and answers `null` for anything that is not six or eight hex digits — `fontFillRule`
  then omits the `color`/`background-color` declaration and `borderEntry` falls back to `#000000`. And
  `applier.ts#installImportedStyles` re-checks whatever it is handed, whoever built it: the class name must
  match `htImported-<hash>` (plus the optional `-2`, `-3` collision suffix) and the declaration block must be
  `property:value` pairs drawn from letters, digits, `#`, space, comma, dot, parentheses and hyphen, so no
  value can carry a `}`. A failing rule is dropped and the rejected class names are named in one `warn()`.
  Keep both layers: the first is what makes the output correct, the second is what keeps a future
  declaration source (a second engine, a hook that mutates `result.styles`) from reopening the hole.
- **The generated class name carries a collision suffix, and the applier's pattern knows about it.**
  `styleHash` is a djb2 hash, so `mapper.ts#registerStyleRule` appends `-2`, `-3`, … when the hashed name is
  already taken by DIFFERENT declarations, rather than letting one cell inherit another's style. Widening
  the hash alphabet or changing the suffix shape means changing `IMPORTED_CLASS_PATTERN` in `applier.ts` in
  the same commit, or every suffixed rule is silently rejected at install time.
- **`installImportedStyles` is called on EVERY import, with `result.styles ?? {}`.** An empty (or fully
  rejected) rule set removes the element rather than leaving an empty one — that is what clears the previous
  import's rules when the next workbook carries no styling at all. Guarding the call behind
  `if (result.styles)` left the stale stylesheet in the document.
- **`result.customBorders` REPLACES the target's existing borders, and a workbook without borders leaves
  them alone.** `toSettings` passes the array straight to `updateSettings`, and `CustomBorders#updatePlugin`
  is disable → enable → `changeBorderSettings()`, so whatever the user had configured before the import is
  gone once the import carries any border at all. The other half follows from `stripUndefined`: a workbook
  with no borders produces no `customBorders` key, so `updateSettings` never sees one and the target keeps
  its own. Both are the chosen semantics (an import describes a whole sheet, not a patch) — they are
  documented in the guide's `## Styles` section, so change them in both places or not at all.
- **The read-only sentinel colors live in `../../utils/xlsxEngine/readOnlyStyle.ts`**, shared with the
  export. `READ_ONLY_FILL_ARGB`/`READ_ONLY_TEXT_ARGB` are what the export paints on a `readOnly` cell with
  no color of its own, and `fontFillRule` drops exactly those two values on a cell the import is about to
  mark `readOnly`. Never re-declare either constant in a plugin: the two directions must read one value or
  the round trip silently starts baking the grid's own dimming into a generated class.
- **Alignment maps PHYSICALLY, borders map LOGICALLY, and that asymmetry is deliberate.** Excel's
  `horizontal: 'left'` becomes `htLeft` (a physical-left class), while Excel's `border.left` becomes the
  `customBorders` plugin's `start` (a logical side that follows `layoutDirection`). It is symmetric with the
  export, which reads `htLeft` back as `left` and a `start` border back as `left`, so an LTR round trip
  closes. On a natively RTL workbook the two disagree: the borders follow the grid's direction while the
  alignment classes do not. Nothing depends on the disagreement today; a fix means routing the alignment
  through the same logical mapping in BOTH directions at once.
- **Formulas go into the data as `=…` strings only when the `formulas` plugin is enabled on the target.**
  Otherwise the cached value is imported and the formula lands in `result.formulas`.
- **Comments reach `result.comments` only when the `comments` plugin is enabled on the target.** A grid
  without `comments: true` gets no comments and no `result.comments` key; the mapper reports the loss as
  `comments` in `dropped` so the console warning names it. The first demo target grid shipped without the
  option and the comment vanished silently before the `dropped` entry existed.
- **A live formula is shifted back into grid coordinates, and one that cannot be is dropped.** The export
  prepends a header row and a row-header column and shifts every relative reference forward by them
  (`normalizeFormula` in `../exportFile/types/xlsx/formula-utils.ts`), so the grid's `=B1*0.2` is written
  as `C2*0.2`. The import drops both bands, so `mapper.ts` shifts every reference back by the window origin
  through `shiftFormulaReferences` (`../../utils/xlsxEngine/formulaRefs.ts`) — the one place either direction
  walks a formula. A reference that would land above row 1 or left of column A pointed into the removed
  header band: the formula cannot be expressed in grid coordinates at all, so the cached value is imported,
  the formula is recorded in `result.formulas`, and `formula:outOfRange` lands in `result.dropped`.
  **A qualified reference (`Rates!A1`, `'My Rates'!$A$1:$B$2`) is never shifted, in either direction**: the
  band exists on this sheet only, so the regex captures the whole `Sheet!ref[:ref]` as an untouched token
  and the mapper never sees it. Shifting it used to turn `=Data!A2` into `=Data!A1` under a `firstRow`
  header and drop `=Data!A1` outright (Bugbot on #13551). The cell alternative is case-insensitive (`i`
  flag: HyperFormula accepts `=sum(a1)` and the export hands the source string over as typed) and guarded
  on the left by `(?<![\p{L}\p{N}_.$])`, so a defined name (`TOTAL1` → `AL1`) or a structured reference
  (`TABLE1[Col]` → `BLE1`) never yields a reference. Whole-column (`A:A`) and whole-row (`2:2`) spans are
  their own alternatives, each end reaching the mapper with `null` on the open axis, so `=SUM(A:A)` follows
  a prepended row-header column to `SUM(B:B)` instead of passing through and summing the header column.
  The sheet-name alternatives are deliberately
  wide: `''` escapes an apostrophe inside a quoted name (`'O''Brien'!A1`) and a bare name is
  `[\p{L}\p{N}_.]+` under the `u` flag, because Excel leaves `Лист1` unquoted — an ASCII-only class
  shifted both (Bugbot round 2).
  **Absolute components shift like relative ones**, in both directions: a header band is a translation of the
  whole coordinate space, and `$` pins a reference against copy and fill, not against the sheet moving — so
  `$A$1` goes out as `$B$2` and comes back as `$A$1`, `$` markers preserved. The **function-argument
  separator** is left alone: the export normalizes to `,` for Excel and HyperFormula's default
  `functionArgSeparator` is also `,`, so no translation is needed on the way back. A target grid configured
  with a non-default separator would need one.
- **`dateFormat` and `timeFormat` are `Intl.DateTimeFormatOptions`, never pattern strings.** Handsontable 18
  types both that way (`src/core/settings.ts`), and the date and time renderers answer a string with
  `The dateFormat option as a string is not supported…` and render the raw value. `inference.ts`'s
  `excelDateFmtToIntlOptions` inverts the Excel pattern into options (`yyyy` → `year: 'numeric'`, a month
  `mm` → `month: '2-digit'`, an `mm` next to an `h` or an `s` → `minute: '2-digit'`, three or more `d`s →
  `weekday` rather than a zero-padded day, `AM/PM` → `hour12`). **The export DERIVES its pattern from the
  cell's own options and this reader is its exact inverse** — see `../exportFile/AGENTS.md` for the full
  mapping table, the two `m`-ambiguity rules and the one surviving asymmetry (`hour12` always comes
  back stated, because Excel has no "clock unspecified" marker — the export resolves an unspecified
  one from the cell's `locale` the way `Intl` does, so the clock the source rendered survives). The round trip is pinned in
  `__tests__/inference.unit.js` ("date format round trip"), the only place either plugin's tests import
  across the boundary; source must still never import from `../exportFile`.
  The *value* the grid stores is unchanged — still `YYYY-MM-DD`, `HH:mm:ss` or `YYYY-MM-DD HH:mm:ss` — and a
  date-time format stays a `date` cell whose `dateFormat` carries both halves. `mapper.ts` tells the two
  apart by `dateFormat.hour`, never by inspecting a format string.
- **The data reaches the grid BEFORE any layout setting.** `applier.ts` calls `hot.loadData()` first and
  `hot.updateSettings()` second, inside one `hot.batch`. Every layout setting is validated against the table
  that exists when it is applied: MergeCells rejects (and logs about) a merge reaching past the last row, and
  a target grid usually starts with a single empty row — so the previous order silently dropped every merge
  the workbook declared while `result.mergeCells` stayed correct. Do not fold the two into one
  `updateSettings({ ...settings, data })`: that routes through `updateData`, which keeps the previous
  import's cell states instead of resetting them. The `batch` suspends rendering, so the pair paints once.
- **`updateSettings` gets only the keys the workbook set.** `applier.ts#toSettings` omits `undefined`, so
  a setting the file says nothing about keeps the user's value. `hiddenRows`/`hiddenColumns` are wrapped in
  their plugin option shapes (`{ rows }` / `{ columns }`).
- **The dropped-feature warning fires once per call, from the plugin, not from the adapter.** The adapter
  only records (`DroppedFeatures.record`); `importFile.ts` calls `dropped.warn(detected.kind)` exactly once
  per `importFromArrayBuffer`/`importFromBlob` call. Keep it that way, or a multi-sheet read would warn per
  sheet.
- **Merges, hidden rows/columns, and frozen panes are cropped to the import window**, not dropped outright.
  A `range`, a promoted header row, or a dropped row-header column each shift the window; a merge that
  crosses it is cropped to what remains inside, and only dropped when nothing or a single cell remains.
- **A background-only imported class no longer leaks an ambient text-color declaration ahead of the
  fill — both of `getCssStyleFromElement`'s two paths (rendered element, off-viewport probe) now diff
  against the SAME alignment-only baseline.** `getFontFromMeta`'s `cssStyle.fontColor` input
  (`getCssStyleFromElement` in `../exportFile/types/xlsx/cell-style.ts`) used to read the rendered
  element's `style.color` directly whenever any non-alignment class was present, with no comparison
  against what an alignment-only cell would show — unlike `backgroundColor`, which has always gone
  through `detectExplicitBackgroundColor`'s "full classes" vs. "alignment classes only" probe diff. A
  workbook cell whose only style was a fill therefore exported (and re-imported) an extra `color`
  declaration for whatever the cell's default text color happened to be. The rendered-element path now
  takes `fontColor` from `getCssStyleFromProbe(element.ownerDocument, view, metaClasses).fontColor` -
  the same class-only probe the `null`-element path already used — so a fill-only class exports (and
  re-imports) `background-color:<hex>` alone, with no leading `color:`.
- **`layoutDirection` is init-only, so the import reports it instead of applying it.** `core.ts:545`
  resolves it from the merged user settings while the instance is built and `isRtl()` closes over the
  result; `metaSchema.ts` documents that a later `updateSettings` is ignored. `mapLayout` therefore puts
  `'rtl'`/`'ltr'` on `result.layoutDirection` under `importLayout`, `applier.ts#toSettings` deliberately
  keeps it out of the carried-keys list, and `importFile.ts#recordLayoutDirectionMismatch` records
  `layoutDirection` in `dropped` when the sheet and the target grid disagree - before `dropped.warn()`,
  so the plugin still warns exactly once per call. Adding it to `toSettings` would look like a fix and
  change nothing.
- **A merge inside the header band becomes a `nestedHeaders` colspan, and never a `mergeCells` entry.**
  `mapNestedHeaders` reads the band's merges for the group spans; `cropMerge` then drops those same
  merges for free, because shifting them by `window.firstRow` puts their last row above row 0. Do not add
  a second exclusion - `mapper.unit.js` pins both halves, including the one case that IS carried: a merge
  that starts in the band and reaches down into the data is cropped to its data part, as it always was. A
  merge that spans several band rows keeps its label on the row it starts at and leaves `''` below it,
  because `nestedHeaders` has no vertical span here and `#writeNestedColumnHeaders` in the export only
  ever wrote the label into the top layer. `applier.ts#toSettings` clears a stale `nestedHeaders`
  setting for you: importing a plain single header row (`result.colHeaders` present, no
  `result.nestedHeaders`) into a grid that still carries `nestedHeaders` from an earlier import adds
  `nestedHeaders: false` to the `updateSettings` payload, or `NestedHeaders` keeps owning the header
  band and the new `colHeaders` never renders.
- **Conditional formatting rules are the ENGINE's own objects and are passed through untouched.**
  `mapConditionalFormatting` converts only the `ref` - a 1-based, possibly multi-rectangle reference like
  `"A1:B2 D1:E2"` - into zero-based, inclusive, window-relative `rows`/`cols`, which is the export's
  `ConditionalFormattingDescriptor` shape, so a result round-trips through `exportFile`'s
  `conditionalFormatting` option. The rules themselves are ExcelJS-shaped today and a second engine will
  not read them; never normalize or validate them here, and never report them under `dropped` again - that
  entry was removed when the key was added. The ref parsing lives in
  `../../utils/xlsxEngine/cellRef.ts#parseMultiRangeRef`, beside the single-range parser both directions
  already share; do not grow a second A1 parser in the plugin.

## Deferred, with the reasoning

- **Lazy per-sheet snapshots (review round 4, R16).** `excelJsAdapter.read` snapshots every worksheet while
  `selectSheet` imports one; measured 2.7× time and 2.4× heap on a 3-sheet file, ~240 ms / ~200 MB of it the
  snapshot build. The fix needs the selector at read time and a `materialize(name)` hook on
  `WorkbookSnapshot`, because `resolveListSource` reaches other sheets. Decision on #13551: not for now, no ticket; revisit only if
  multi-sheet import cost is reported.
- **`MAX_SHEET_CELLS` stays at 5,000,000 (R18).** A file at the cap measured ~42 s frozen and 3.8 GB peak.
  The cap is a security bound on a declared rectangle, not a comfort promise; the guide's Security section
  says so. Lowering it would refuse legitimate files; a streaming read is the real fix and is out of scope.
- **Cross-sheet references in a multi-sheet EXPORT (R23).** `normalizeFormula` leaves `Rates!A1` unshifted.
  Right on import and for a sheet outside the export; wrong when `Rates` is also exported with headers,
  because that sheet's data moved too. The fix resolves the qualifier against the export's sheet list (after
  `sanitizeSheetName`) and shifts by THAT sheet's offsets. Decision on #13551: not for now, no ticket; documented as a
  limitation in the export guide's multi-sheet section.

## Where to look next

- `../exportFile/AGENTS.md` for the write direction and the `_HotValidation` sheet.
- `../../utils/xlsxEngine/` for the model, detection, capabilities and adapters. ExcelJS is the only
  engine; a second one adds its kind to `XlsxEngineKind`, its row to `CAPABILITIES`, its duck-typing to
  `detect.ts` and an adapter beside `adapters/exceljs.ts`. Nothing about any specific future engine is
  kept in the tree — a SheetJS evaluation was done under DEV-2135 and deliberately not shipped.
- `../base/AGENTS.md` for the plugin contract and the `PLUGIN_PRIORITY` table (this plugin is 245).

## Testing

- `npm run test:unit -- --testPathPattern='importFile|xlsxEngine'`
- Adapter tests parse real `.xlsx` fixtures under `src/utils/xlsxEngine/__tests__/fixtures/`; regenerate
  them with `node src/utils/xlsxEngine/__tests__/fixtures/generate.mjs` after changing a case, and commit.
  They run with `@jest-environment node` because ExcelJS parses through Node streams. Three things make
  that pragma work here: the `'jest-environment'` entry in the root `.eslintrc.js`'s `jsdoc/check-tag-names`
  → `definedTags` list (added in DEV-2135), without which the tag itself fails lint as unknown; and the
  `typeof window === 'undefined'` guards in `test/bootstrap.js` and `test/helpers/custom-matchers.js`,
  which keep the shared Jest setup from crashing on a spec file that has no `window`/`document`.
- End to end: `tests/e2e/xlsx-import.spec.ts` (export → import round trip in one page, no download).
