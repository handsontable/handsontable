# xlsxEngine — the engine-neutral xlsx layer and its two adapters

`WorkbookSnapshot` (`model.ts`) is the whole contract between the plugins and a file. `exportFile`
fills it through `SheetBuilder`; `importFile` reads it. Nothing outside `adapters/` touches OOXML
or an engine object.

Anything both adapters need is declared once on this layer, never twice under two names:
`limits.ts` (the caps and their refusals), `compression.ts`, `sheetNames.ts`, `cellRef.ts`,
`units.ts`, `dates.ts` (`MS_PER_DAY`, `EXCEL_EPOCH_UTC`, `EXCEL_EPOCH_OFFSET` — which the two
adapters and both plugins' date conversions import), `numFmtCode.ts` (number-format
classification — `stripFormatDecorations`, `isTemporalFormatCode` — shared by the import's
inference and the native reader's `date1904` shift), `functionPrefixes.ts` (the
`_xlfn.`/`_xlws.`/`_xlpm.` strip on import in `importFile/mapper.ts`, the add on write in both
writers) and `writeLimits.ts` (the write-side clamps). **`MS_PER_DAY` and `EXCEL_EPOCH_UTC` are
declared in `dates.ts`, NOT in `helpers/dateTime.ts`.** `dates.ts` imports nothing, so
`plugins/formulas/utils.ts` imports them from there and pulls in no engine code. `index.ts` spreads
`helpers/dateTime.ts` onto `Handsontable.helper`, so declaring them there would have made them public
API, which they were not in 18.1; `helpers/__tests__/dateTime.unit.js` pins their absence. A
constant that lands in one adapter and is then copied into the other is the drift these modules
exist to prevent.

## Engines

| Kind | Selected when | Adapter | Notes |
|---|---|---|---|
| `native` | nothing injected (`importFile: true`, `exportFile: true`, or an `engines` map without the format) | `adapters/native/` | built in, no dependency |
| `exceljs` | `engines: { xlsx: ExcelJS }` duck-types to a `Workbook` constructor | `adapters/exceljs.ts` | legacy path, kept forever |

`detect.ts` decides. `undefined` and `null` → native (a configured `engines: { xlsx: null }` reads
as "no engine", the same as an absent key, so the predicate, the export call and the import call
agree); any other value must duck-type or it throws `Invalid xlsx engine module.` (public error
text – the first sentence is asserted).

**The native adapter is imported EAGERLY, on purpose.** `detect.ts` imports `nativeAdapter`
statically. Measured against the merge base (49a370181a) with the same toolchain: `handsontable.min.js`
and `handsontable.full.min.js` both grow by 73 380 B minified (+4.6% base, +3.4% full), about
+25.5 KB gzipped. ESM apps pay it only when they register `ExportFile` or `ImportFile`: 86-94 KB
minified across esbuild, Rollup, Vite and webpack, while an app registering neither pays a few dozen
bytes (the engine is tree-shaken, and the `sideEffects` list does not block that). An app that
injects ExcelJS still pays for the built-in engine, because the import is static. A lazy `import()`
seam was considered and rejected: the single-file UMD bundles have no chunk seam to split it into,
so it would save nothing there. The cheaper ESM cut is a follow-up: `nativeAdapter` is one object
with `read` and `write`, so an export-only app carries the reader (42.5 KB minified, 13.6 KB gzip)
and an import-only app the writer (30.1 KB, 9.2 KB gzip). Letting each plugin import only its half
would let bundlers drop the other with no chunk seam.

**A per-call `engine` override resolves as `override ?? configured` in BOTH plugins**, through
`resolveEngineOverride()` in `detect.ts` — so `null` and `undefined` both mean "no override" and
neither downgrades a grid that configured ExcelJS to the built-in engine. The helper exists because
the two plugins drifted: `exportFile` spread the caller's options over `{ engine: <configured> }`,
so a per-call `engine: null` silently switched engines, while `importFile` threw
`no engine is configured for "<format>" files` for a non-empty `engines` map that did not name the
format — against this table, against its own `supportsImportFormat` (which answered `true` for
exactly that shape) and against `exportFile`. The table's row IS the contract; both plugins now
follow it. An entry that is present, non-nullish and does not duck-type still throws, in both
directions.

## Traps in the native adapter

- **Part child order is schema-fixed.** `<worksheet>`: dimension, sheetViews, sheetFormatPr, cols,
  sheetData, sheetProtection, mergeCells, conditionalFormatting*, dataValidations, pageMargins,
  legacyDrawing. `<styleSheet>`: numFmts, fonts, fills, borders, cellStyleXfs, cellXfs, cellStyles,
  dxfs. A wrong order opens with Excel's "repair" dialog. The unit tests pin both orders
  ("should write the worksheet children in CT_Worksheet order", "should write the styleSheet
  children in CT_Stylesheet order"), but only opening a native export in Excel proves the file is
  accepted – do that, and open it in LibreOffice, after touching a writer.
- **`styles.xml` needs its bootstrap rows**: font 0, fills `none` + `gray125`, border 0, cellXf 0,
  `cellStyles` Normal, `dxfs count="0"`. `StyleTable` writes them unconditionally.
- **Style dedup is order-insensitive, and the sorted key is the SLOW path.** `KeyedList`
  (`parts/styles.ts`) keys every font, fill, border, xf and dxf on `stableStringify` (keys sorted at
  every depth, undeclared properties included), so `{ horizontal, vertical }` and
  `{ vertical, horizontal }` are one `<xf>`. It runs once per styled cell, and `stableStringify`
  costs about 6x `JSON.stringify` (2M font+fill+xf adds: 1.5 s against 5.5 s), so `add` first
  looks the item up by its plain `JSON.stringify` spelling and only computes the sorted key for a
  spelling it has not met. Keep that alias in front: replacing it with a fixed field list would
  drop undeclared properties from the key and merge two different styles.
- **Source files that feed a regex or string must stay 7-bit ASCII.** `xml/escapes.ts` held raw
  U+FFFE/U+FFFF in its character classes; the non-minified bundles keep such bytes, and a page
  served without a UTF-8 charset decodes them as `¿`, `ï`, `¾`, which the exporter then stripped
  from ordinary text. Write the `\uFFFE`/`\uFFFF` escapes. `nativeXml.unit.js` asserts the
  file's bytes are ASCII, because ESLint's selectors cover identifiers and tagged templates only.
  The Edit tool of an agent session decodes a typed `\uFFFE` into the raw character, so verify
  the bytes after editing such a line.
- **A comment is four parts or nothing**: `comments{N}.xml`, `vmlDrawing{N}.vml`, both rels in the
  sheet's `.rels`, `<legacyDrawing r:id>`. Without the VML Excel shows no note.
- **Shared formulas are translated per slave** with `translateSharedFormula` (relative components
  move, `$` components stay) – not `shiftFormulaReferences`, which moves `$` too on purpose. The
  copy rule moves a QUALIFIED reference too (`=Data!B2` filled down is `=Data!B3`, as in Excel and
  ExcelJS's `slideFormula`), so `translateSharedFormula` calls `mapFormulaReferences(…, { qualified:
  true })` (`formulaRefs.ts`), which re-walks only the reference part with `QUALIFIED_PART_REGEX`;
  `shiftFormulaReferences` keeps skipping qualified references.
- **Covered merge cells lose their content on write** and read back `null`; the master keeps it.
- **The worksheet reader is a CLASS, and its traps below name private methods.** `parseWorksheet` is
  a one-line wrapper over `WorksheetParser` in `parts/worksheetReader.ts`: the tokenizer is
  forward-only, so a `<c>`, a `<cfRule>` and a `<dataValidation>` are each assembled across their
  open event, their children's text and their close event, and the half-built state is the class's
  `#` fields. `#chargeSpan`, `#ensureRow`, `#cellAt`, `#finishCfRule` and
  `#finishConditionalFormatting` are private methods of it, not free functions — grep them with the
  `#`. `assertSheetFits` and `parseWorksheet` are the module's own exports; `assertSheetRectangle`
  is a module-local function of the same file, called by `assertSheetFits`, by the parser's own
  `<dimension>` handler (`#openDimension`) and by `#finalize`. The parser itself charges the
  workbook budget through `#settleWorkbookCharge`, not `assertSheetFits` — the single-step form has
  no production caller in the native adapter, only tests.
- **Merge members are MATERIALIZED on read, to match ExcelJS.** The native writer used to emit no
  `<c>` element for a covered cell that carried no style; it now writes every covered member, but
  files from other producers still leave covered cells out, which is why the reader keeps the pass.
  Without it the reader's `<c>`-derived width alone left the row a cell short and `importFile/mapper.ts` — which takes the used width from the widest row — then
  dropped the merge entirely from the native engine's own export/import round trip. The merge pass
  in `parts/worksheetReader.ts` pads every row of a merge's row range up to the merge's last column
  (a covered cell becomes `createCoveredCellSnapshot()` – its own style and lock, no value – or `null`) and grows `width` to it (`#materializeMerges`). The clamp bound is the dimension's
  column count when one is declared (`Math.max(this.#width, this.#declaredColumns, 1)`), so a merge
  reaching past what the file declares stays clamped rather than widening the sheet on a hostile
  file's say-so. With NO `<dimension>` (openpyxl write-only, ExcelJS streaming), the merge may widen
  the sheet up to `MAX_SHEET_COLUMNS`, because clamping to the widest row cropped a merge whose
  covered cells carry no `<c>`. The validation pass clamps BOTH axes to what the sheet uses (its rows
  and its widest row), never to `<dimension>`: a sparse sheet under a wide dimension had every slot
  of a validation's rectangle walked and then kept by the mapper (a GB-class heap from a 2 kB file),
  and the ExcelJS adapter reads a validation only on the cells it walks, so an empty dropdown column
  with no cell is lost on both engines alike. A merge past the last `<row>` GROWS the sheet's
  rows to the merge's last row, as ExcelJS does (Google Sheets writes no `<row>` for an empty row
  and no `<dimension>`, so clamping cut such a merge short and left the grid a row short); the
  growth is bounded by the span charge below and the sheet caps. Every `<mergeCell>` is charged one span
  unit when it is collected (`#openMergeCell`). A merge that clamps to nothing is DROPPED from
  `sheet.merges`. The area charge (`#chargeSpan`) stays **before** the walk (see the span-budget
  trap below), and the padding costs nothing new because that span was already charged. `#finalize`
  re-checks the rectangle with the grown width, so a whole-sheet merge is still refused.
- **`locked: null` means locked** (OOXML default). Only `<protection locked="0"/>` yields `false`.
- **Theme and indexed colors are not resolved**: a font or fill with no `rgb` attribute resolves to
  nothing (`argbOf()` accepts 6/8-hex `rgb` only). This is **not** full parity with ExcelJS, despite
  what an earlier version of this file said. The FONT half agrees, because the
  model tracks an argb color and nothing else. The FILL half does not: `CellStyleSnapshot['fill']`
  declares `fgColor: { argb: string }`, so the native reader drops a theme fill entirely while the
  ExcelJS adapter passes ExcelJS's own object through and leaks `{ theme: N }` into that field.
  Native is the side that honors the contract, so the difference is pinned in
  `enginesParity.unit.js` rather than "fixed" by widening the model. Resolving the theme palette is
  still the documented follow-up that would close it on both sides.
- **A solid fill writes `<fgColor>` only.** The writer used to add a companion
  `<bgColor indexed="64"/>`, which its own reader ignored while ExcelJS's surfaced it as
  `bgColor: { indexed: 64 }` — so the same fill read differently depending on who wrote the bytes.
  ExcelJS's writer emits none either, and such files open in Excel and LibreOffice.
- **`objects` and `scenarios` are inverted permissions like every other**, not plain booleans. The
  writer emits `objects="1"` / `scenarios="1"` only when the caller explicitly asked for `false`,
  and `PROTECTION_INVERTED_OPTIONS` covers both on read — exactly what ExcelJS does. Writing them
  unconditionally (which the writer used to do) made ExcelJS read native bytes back as
  `objects: false, scenarios: false` on a sheet nobody had locked down.
- **A non-finite number never reaches `<v>`.** `NaN`, `Infinity` and `-Infinity` are all
  `typeof 'number'`, and `<v>NaN</v>` is not a legal cell value — Excel opens such a file with the
  "repair" dialog. `exportFile/types/xlsx.ts` coerces them to their text form at the value
  coercion (`#getCellValue`) and at the cached formula result (`toPrimitiveResult`), so neither
  engine ever sees one from an export. The native writer guards again in `valueCellXml`
  (`parts/worksheetWriter.ts`, `stringCellText`): such a value is added to the shared-string table
  and written as a string cell. A cached formula result is demoted the same way and typed `str` in
  `formulaCellXml`, the sibling `writeCell` dispatches to — `writeCell` itself now only picks
  between the two. Nothing is recorded in `dropped` — it is a representation, not a lost feature.
  **ExcelJS's writer has no such guard** and still emits `<v>NaN</v>`; the two readers then disagree
  about it (native reports an empty cell, ExcelJS hands the non-finite number back), which
  `enginesParity.unit.js` pins with both values rather than normalizing.
- **Element matching is prefix-INSENSITIVE in the main parts and prefix-SENSITIVE in VML.** Excel
  and Google Sheets bind the main namespace as the default one, but nothing requires it: a
  generator may write `<x:worksheet xmlns:x="…"><x:c>`, and the readers used to switch on the raw
  element name, so such a file read back as an empty sheet — silently. Every reader of a main
  OOXML part (worksheet, workbook, styles, sharedStrings, comments, `.rels`) now runs its element
  names through a per-part `createLocalName()` from `xml/tokenizer.ts`. Three rules hold it
  together. It strips **only the prefix the part's ROOT element carries** — which is in the main
  namespace by definition — so a file written the usual way is normalized not at all; stripping
  every prefix instead made `x14:conditionalFormatting` inside an `<extLst>` read as a second,
  empty conditional-formatting block on ExcelJS-written bytes, which the four-way parity test
  caught. **Attribute names keep their prefix** — `r:id` is a different attribute from `id` and is
  what resolves a sheet to its part, so the normalizer is never applied to an attribute key. The
  workbook's sheet id is resolved by namespace, not by the literal `r:`:
  `createRelationshipIdReader` (`parts/package.ts`) tracks the in-scope `xmlns:*` bindings to the
  transitional or strict relationships namespace and falls back to `r:id`. The `<extLst>` list
  validations (`<x14:dataValidation>`, below) do not break the root-prefix rule: the worksheet
  reader matches them explicitly, by the name after any prefix, only while `#extDepth > 0`. And
  **VML is the other side**: the tokenizer delivers names with their prefix because `x:ClientData`
  and friends are matched WITH it. Today only the VML *writer* exists (`parts/comments.ts`), so
  nothing reads one — if a VML reader is ever added, it must not normalize.
- **The numeric DEFLATE level is ignored** – `CompressionStream` has none. `false` stores.
- **The write is SYNCHRONOUS per sheet, and nothing caps its size.** `writeWorkbook` loops over the
  snapshot's sheets and calls `worksheetXml` for each one; the only `await` in that loop is
  `hashSheetPassword`, which an unprotected sheet skips. `worksheetXml` builds the whole part as one
  string through `XmlWriter` and `TextEncoder` then copies it into a `Uint8Array`, so a large sheet
  holds the UTF-16 string and its UTF-8 copy at once and the main thread does not yield between
  rows or between sheets. **The writer's buffer is BOUNDED and the cell path is ONE string per
  `<c>`.** `XmlWriter` joins its pending parts into a chunk every `XML_WRITER_FLUSH_THRESHOLD`
  (4096) pushes — the flush runs BEFORE the append, which is what lets `close()` collapse an
  empty element by looking at the pending parts alone, so keep that order — and `writeCell`
  (`parts/worksheetWriter.ts`) hands `raw()` one template-built string per cell instead of
  `open`/`leaf`/`close` (three array entries per cell). Measured on 100k×20: 2.65 s, +897 MB RSS,
  1.23 GB peak before; 1.3 s, +312 MB, 649 MB peak after, byte-identical output (pinned by the
  "byte-identically to the pinned part" test in `nativeParts.unit.js`). `escapeXmlText`/
  `escapeXmlAttr` return their input untouched when a pre-test finds nothing to escape, which is
  every number. Only the DEFLATE (`zip/writer.ts`) and the password hash yield at all. The read
  side has explicit budgets for exactly this cost (`MAX_SHEET_CELLS`, `#chargeSpan`); the write side
  has NONE, deliberately — the caller asked for this data — and it is no worse than the ExcelJS
  path, whose non-streaming writer is synchronous per sheet too. The export guide says so in its
  engines section. If a yield is ever added, it belongs between sheets in `write.ts`, not inside
  `worksheetXml`, where the part's own child order is the constraint.
- **The built-in numFmt table follows ECMA-376, not ExcelJS**, and exactly ONE id disagrees: id 22
  is `m/d/yy h:mm` where ExcelJS's `lib/xlsx/defaultnumformats.js` has `m/d/yy "h":mm`. The quoted
  `h` is a literal letter, so a date-time read through ExcelJS imported as a date and lost its time of
  day; the ExcelJS adapter maps that one spelling back (`readNumFmt`, `EXCELJS_BUILT_IN_22`), and
  `enginesParity.unit.js` asserts all four legs agree. Ids 39 and 40 carry the identical string in
  both tables — an earlier version of this file claimed they differ "by a space" and that was wrong;
  they assert four-way equality. **The currency ids 5–8 and accounting ids 41–44 resolve on READ
  ONLY** too, to their en-US codes in `LOCALE_NUM_FMTS`: Excel renders them in the install's
  currency, so the writer never reuses them, but `numFmt: null` imported such a column as bare
  numbers. ExcelJS's table lacks them, so those cells read with no format through the ExcelJS engine. **The locale ids 27–36 and 50–58 resolve on READ ONLY**, from
  `LOCALE_NUM_FMTS` in `parts/styles.ts`, to ASCII stand-ins (`yyyy/m/d`, `m/d/yy` for 30, `h:mm`
  and `h:mm:ss` for 32/33) chosen from the ja-JP column — Excel renders them from the install's
  locale, so no single code is right, but `numFmt: null` left such cells as bare serials that
  neither the import's inference nor the `date1904` shift treated as dates. `builtInNumFmtId()`
  never answers with a locale id: a snapshot asking for `yyyy/m/d` gets a custom id, not slot 27,
  which Excel would draw as a Japanese era date.
- **A number-format code is VERBATIM in both directions.** A backslash in a format code is Excel's
  own literal escape (`\ ` a literal space, `\%` a literal percent sign that does NOT scale by
  100), and the ExcelJS adapter hands codes through untouched, so any transform in the native
  adapter makes the two engines disagree on the same file. The reader used to strip every `\x`
  (`0.0\%` became `0.0%`, so 12.5 displayed as 1250.0%; `0\d` became `0d`, typed as a date) and
  the writer escaped every unquoted space as `\ ` (a user's `0.0\ %` became `0.0\\ %`, a literal
  backslash in Excel, and an accounting code's `* ` fill became `*\ `) — each existed only to undo
  the other. **Both WRITERS and the native reader keep a code verbatim; ExcelJS 4.4.0's READER does
  not**: `numfmt-xform.js` runs `formatCode.replace(/[\\](.)/g, '$1')` on every `<numFmt>`, so the
  ExcelJS adapter hands `0.0\%` over as `0.0%`, and the same file types a column differently per
  engine. The raw code is gone from ExcelJS's model, and re-escaping cannot know which characters
  had a backslash, so this is pinned in `enginesParity.unit.js` ("pins the one number-format
  code…") rather than fixed. The XML attribute escaper still handles `"`, `&` and `<`. The import's
  inference is unaffected: `stripFormatDecorations` in `numFmtCode.ts` already drops `\x` pairs, so `0.0\%`
  infers numeric without the percent style and `0.0\ %` (a literal space, then a real `%`) still
  infers percent — pinned in `inference.unit.js`.
- **Jest has no Web streams of its own**: `test/cryptoSetup.js` installs `CompressionStream` and
  `DecompressionStream` from `node:stream/web` into the sandbox (Jest 27's node environment copies a
  fixed allow-list of globals). The engine needs `TextEncoder` and `TextDecoder` too, and reaches
  them BEFORE the streams, so a single stream check let jsdom end in a bare
  `ReferenceError: TextEncoder is not defined`. Both adapter entry points therefore check all four
  globals (`CompressionStream`, `DecompressionStream`, `TextEncoder`, `TextDecoder`) up front, and
  the message names the missing ones and how to supply them (assign them from `node:stream/web` and
  `node:util`, as `test/cryptoSetup.js` does, or inject ExcelJS through `engines`). jsdom and
  Vitest's jsdom environment lack them, which is why both guides carry a Requirements note with the
  snippet. The guard throws SYNCHRONOUSLY; inside the async zip writer that surfaces as a
  rejection.
- **A sheet password is hashed exactly as ExcelJS hashes it** (`parts/protection.ts`: SHA-512 spin
  hash, 100000 rounds, UTF-16LE password, 16-byte salt) so Excel prompts for it on unprotect. The
  100000 awaited digests cost about 0.95 s in an idle Node 22 (measured) and 24–34 s inside a
  loaded full Jest run, which is why `nativeWrite.unit.js` lowers the spin count through a spy;
  they take seconds in a browser. It needs
  `crypto.subtle`, which browsers expose in a secure context only: `hashSheetPassword` refuses up
  front with a message naming "https or localhost" rather than the bare `TypeError` a plain-http
  page raised on `undefined.digest`. The salt is drawn in the body, AFTER that check (as a
  parameter default it ran first, and a host with no `crypto` threw a bare `ReferenceError`). It
  is a UI gate, not encryption. The export never SETS a sheet password — `exportFile` calls
  `SheetBuilder#protect('')` and the builder stores `''` as `null` (`builder.ts`), which `write.ts`
  never hashes — so the hash path is unreachable from `exportFile` and exists as parity for a
  snapshot built elsewhere. On read the hash is unrecoverable: `sheetProtection:password` is
  recorded and `password` stays `null`, as before.
- **Column, validation and merge spans are budgeted as a whole, and measured before they are walked.**
  `<dimension ref="A1:A1048576"/>` is one column by a million rows, which is under `MAX_SHEET_CELLS`
  and so passes every per-sheet cap, and a `sqref` may repeat one whole-column range any number of
  times; a `<mergeCell ref="A1:XFD1048576"/>` is the third span kind and costs the same full-sheet
  walk per occurrence. Measured on the unbudgeted reader: 2.6 kB of XML cost ~6 s of synchronous CPU,
  linear in repeats. `#chargeSpan` in `parts/worksheetReader.ts` measures each span first, so a
  hostile file is refused after a few multiplications rather than five million array writes. Never
  move that charge after the walk. Merges are also charged one unit each when collected, so a tiny
  sheet cannot carry unbounded far-away merges. Empty slots covered by a list validation share ONE
  validation-only cell per `<dataValidation>` (`#validationOnlyCells`); a later validation replaces
  that cell in its slot, never mutates it.
- **The SHEET LIST and the INFLATED BYTES are budgeted too, and a part is inflated once per read.**
  The span budget above bounds one sheet; until DEV-3011 nothing bounded how many sheets a workbook
  could ask for, and a `<sheet>` element charged **nothing**. Each one costs a full inflate plus a
  tokenize of the part it names, they are a few dozen bytes each, they compress about 20:1, and N of
  them may all name the SAME part — so a 104 kB archive declaring 20 000 sheets inflated 39 GB over
  32 s and **resolved**, with `budget.declaredCells` still at 0 (a sheet with no `<row>` and no
  `<col>` charged `0 * 1 + 0`). Four guards now hold that down, and each one alone is insufficient.
  `MAX_WORKBOOK_SHEETS` (2048, `limits.ts`) is refused inside `parseWorkbook`'s own tokenize
  (`parts/package.ts`), so the count is rejected while `xl/workbook.xml` is still being read and
  **before any sheet part is inflated** — never in `read.ts`, which already holds the list.
  `MAX_INFLATED_TOTAL_BYTES` (256 MB, twice `MAX_INPUT_BYTES`) is charged in `zip/reader.ts` for
  every entry the read reads — that is what closes the 408 kB archive holding one 400 MB part, which
  was inside every per-entry cap and cost 1.9 GB of RSS. The per-entry cap stays 512 MB and is
  checked FIRST, on the declared size, so both caps stay reachable and each keeps its own message.
  And every sheet charge (`sheetBudgetUnits`, through `#settleWorkbookCharge` or `assertSheetFits`)
  has a floor of one unit per sheet, so `declaredCells` advances on an empty sheet. `MAX_INFLATED_ENTRY_BYTES` alone was never a bound on a workbook: `openPackage` holds
  `styles.xml`, `sharedStrings.xml` and a sheet as simultaneous strings.
- **CHARGE WHAT WAS PRODUCED, NEVER WHAT WAS DECLARED — and the declaration is still what bounds the
  work.** The total budget used to be charged on the size the central directory claims, which broke
  in both directions at once. A STORED entry returns `compressedSize` bytes and was charged its
  `uncompressedSize`, so a record declaring one byte beside a 32 MB stored region was billed one
  byte for 32 MB of output; 128 such records over ONE region (a 33.6 MB file) then killed the Node
  process in `NewStringFromUtf8`, and 512 over a 2 MB region cost 1.3 GB of RSS from a 2.3 MB file.
  In the other direction a declaration lying HIGH refused a file the reader could have read
  perfectly (300 MB claimed over 101 real bytes). Three rules hold it down now, and each closes a
  different half. (1) A stored entry whose two sizes disagree is REFUSED — that is malformed by the
  spec, and `zip/writer.ts` never writes one. (2) The charge is the byte count the entry really
  produced (`data.byteLength` stored, the inflate's own output length for DEFLATE), while the
  DEFLATE ceiling is `min(declared, MAX_INFLATED_ENTRY_BYTES, remaining budget)` — so the budget is
  enforced as the output streams, with the overshoot bounded by the write slice (next bullet but
  one), not after the entry exists. **THE CEILING AND ITS REFUSAL ARE CHOSEN TOGETHER**:
  `inflateCeiling()` (`zip/reader.ts`) returns the smallest of the three *and* the sentence that
  belongs to it, and `drain()` raises that sentence instead of wording one of its own. A ceiling of
  `remaining budget + 1` with the stream wording the refusal was the earlier shape, and it only
  reached the budget's message on a one-byte overshoot: a part declaring 400 MB that really inflated
  far past the remaining total was refused with `MAX_INFLATED_TOTAL_BYTES + 1`, a number that is no
  cap of this reader's and that named no entry. Every refusal on this path now names the entry.
  (3) ALIASES ARE DEDUPLICATED BY REGION AND THE CACHE IS BUDGETED. `text()` memoizes on
  `method:localOffset:compressedSize:uncompressedSize:crc`, not on the entry NAME, because N central
  records may name one local record and a name-keyed memo then held one decoded copy per name; and
  the decoded string is charged against the same total (UTF-16 code units × 2, the worst case), so
  the memo can never hold more than the archive was allowed to cost however the bytes were obtained.
  **BOTH DECLARED SIZES ARE IN THE KEY**, because the memo is consulted BEFORE `entryText()` runs
  the per-entry cap and the stored-size agreement check, which both read `uncompressedSize`. Keyed
  on the region alone, a directory listing one honest record and one liar over the same bytes served
  the liar from the cache when the honest one was read first, so a refusal was skippable by read
  order. Records that agree on all five fields still share one decode, which is the whole point.
  **AN ENTRY IS CHARGED ONCE: `max(produced bytes, 2 × decoded code units)`, never the two
  summed.** The bytes are charged first, by `entryText()`, while the part is produced (before a
  stored part is decoded; as a DEFLATE part streams, through the ceiling), and `text()` then charges
  only the string's EXCESS over them, before the memo retains it — so "charged for what was
  produced, before it is retained" still holds. Nothing holds both at once: a DEFLATE part is
  decoded chunk by chunk (next bullet) and never exists as one byte buffer, and a stored part's bytes
  are a view over the input the caller already holds. The earlier sum billed an ASCII part 3× its
  size for memory worth 2× at most (V8 actually stores an ASCII string in one byte per character —
  measured, 100 MB of ASCII decoded cost +100.0 MB — but one non-Latin-1 character makes it two, and
  the file chooses that, so the worst case stays the charge). Measured on the engine's OWN export
  (20 columns, every third a unique `row R col C` string, the rest integers, DEFLATE): 100 000 rows
  are 12.4 MB zipped and 86.1 MB of XML; 120 000 rows are 104.1 MB of XML, which the sum charged
  312.4 MB and refused, and which now costs 208 MB and reads in 1.3 s at a 578 MB process peak RSS;
  150 000 rows (131.2 MB of XML, charged 262.4 MB) read in 1.6 s at 667 MB peak. The reviewer's
  100 000 × 20 file (127.9 MB of XML, refused at 383.6 MB) now costs about 255.7 MB against the
  268.4 MB (256 MiB) budget — inside it with some 12 MB to spare (decimal MB throughout this
  paragraph). **So the budget, not the cell caps, is what bounds a re-import of this
  engine's own output**: at about 44 bytes of XML per cell the 256 MB total admits roughly 3 M cells,
  below `MAX_SHEET_CELLS` (5 M) and `MAX_WORKBOOK_CELLS` (10 M); reaching those would take raising
  `MAX_INFLATED_TOTAL_BYTES`, which is a limit decision, not an accounting one.
  `nativeReadHardening.unit.js` pins the charge with a 2000-row export whose sheet part is padded
  to 100 MB (the 120 000-row build took 81 s cold). `readWorkbook` still calls `release()` in a
  `finally`, and N sheets pointing at one part still cost one inflate. A part tokenized again for
  another sheet is charged `2 × length` through `ZipArchive#chargeReread` (`partToTokenize` in
  `read.ts`), so N sheets over one part cost what N copies would.
- **Every entry's CRC-32 is checked against its central record**: stored entries directly,
  deflated ones chunk by chunk through `inflateRawText`'s `observe` hook (`zip/streams.ts`). A
  mismatch is refused by name. The CRC is part of the memo key.
- **The end record is the EARLIEST plausible signature** (`findEndRecord`, `zip/reader.ts`): its
  comment must reach the end of the file and its directory must look valid
  (`isPlausibleEndRecord`). A `PK\x05\x06` inside the archive comment used to win the backwards
  scan.
- **A text part is decoded AS IT INFLATES, and never materialized as bytes.** `pump()` in
  `zip/streams.ts` held the chunk list and the joined copy at once and `text()` then added the
  decoded string, so a 200 MB part cost 1.15 GB of RSS — the 256 MB budget really cost 3–5× that.
  Every part this reader inflates is XML, so `inflateRawText()` decodes each chunk through ONE
  `TextDecoder` in `{ stream: true }` mode (which is what keeps a multi-byte character split across
  a chunk boundary correct) and returns the text plus the byte count the budget is charged. The
  byte-collecting `inflateRaw()` has NO production caller left — the writer uses `deflateRaw` — and
  stays only for the round-trip tests. A BOM is still stripped, because the decoder sees the
  stream's first bytes first.
- **The INPUT is written to the transform in `STREAM_WRITE_CHUNK_BYTES` (16 KB) slices, one in
  flight at a time — and Jest cannot see why.** `drain()` used to hand the whole compressed entry
  to one `writer.write()`. The cap runs between OUTPUT chunks, but Chrome, Firefox and WebKit
  inflate one written chunk entirely inside one `transform()` call and enqueue every output buffer
  before the read loop reads the first, so the cancel came after the whole entry was in memory:
  measured in headless Chrome, a 65 KB deflate-raw entry of 64 MB of zeros cost +64.1 MB of heap
  after the first 64 KB read; with 16 KB sliced writes the queue stays bounded. `writeSliced()`
  (`zip/streams.ts`) awaits each slice's write before queuing the next, so the queue holds one
  slice's output at most and the overshoot past `maxBytes` is bounded by slice × DEFLATE's 1032:1
  ceiling ≈ 16 MB, whatever the entry declares. A cancel from the read loop rejects the pending
  write, which the existing `.catch` absorbs. **Node's `DecompressionStream` honors its writable
  high-water mark**, so under Jest the unsliced code never showed the problem and never will;
  `nativeStreams.unit.js` pins the SHAPE of the writes instead (a spy on
  `WritableStreamDefaultWriter.prototype.write`: every chunk ≤ the slice, count = ⌈len ∕ slice⌉),
  which is what bounds the browser's queue. The input is not copied before it is written:
  `asBufferSource()` copies only a view over a `SharedArrayBuffer` (which nothing here makes),
  because that is the one backing the writer's `BufferSource` type excludes — the reader's slice and
  the writer's `TextEncoder` buffer go in as they are, and a transform never mutates or detaches
  its input.
- **An ENCRYPTED entry is refused by name, from the central directory.** General-purpose flag bit 0
  (ZipCrypto) or bit 6 (strong encryption) means the region is ciphertext; the reader used to skip
  the flag word, so such an entry reached the inflater and failed as corrupt data or, stored, read
  back as ciphertext. `readCentralDirectory` reads offset +8 and refuses beside the method check.
- **The reader takes an entry's sizes from the CENTRAL record and the data's start from the LOCAL
  record's own lengths**, and `nativeReadHardening.unit.js` pins both with hand-crafted archives
  (`craftStoredArchive`): a local header carrying bit 3 with zeroed sizes and a data descriptor after
  the data, and a local `extra` field the central record does not repeat. `writeZip` produces
  neither shape, so a fixture cannot cover them.
- **`writeZip` refuses what the classic format cannot declare** instead of wrapping it: more than
  `MAX_ENTRY_COUNT` (65535) entries, or any size or offset above `MAX_FIELD_VALUE` (`0xFFFFFFFE`,
  since `0xFFFFFFFF` is the ZIP64 marker) — both in `zip/layout.ts`. `ByteWriter#u32` truncates
  with `>>> 0`, so a 65536th entry wrapped the count to zero and an entry past 4 GB wrote a header
  describing some other region. The count guard is tested with 65536 empty entries (71 ms); the
  size guard is not, because it needs a 4 GB input.
- **A limit refusal is recognized by a FLAG on the error, not by its wording.** `read.ts` re-throws
  a cap's own message instead of wrapping it in `The workbook could not be parsed by the native
  engine: …`, and it used to decide that with `/limit this reader accepts/` against the message.
  Every cap in the native adapter now throws through `throwLimitExceeded()` (`limits.ts`), which
  tags `error.cause.limit`, and `isLimitError()` is what `read.ts` asks — on the `openPackage` path
  as well as the per-sheet one, because the sheet count and the inflate total are both refused
  before the first sheet. A new cap that reaches for `throwWithCause` directly still refuses the
  file, but its message is wrapped and it stops reading as this reader's own contract. The three
  per-sheet sentences are owned by `throwRowLimit`/`throwColumnLimit`/`throwCellLimit`
  (`limits.ts`) and BOTH adapters raise them through those helpers, so the two engines cannot word
  the same refusal differently; the ExcelJS adapter's workbook-cells refusal is still a plain
  `throwWithCause`, which is why `isLimitError()` answers `false` for that one (nothing asks it on
  that path — `read.ts` is the native reader's).
- **A sheet's `r:id` is checked against a FLOOR of part names first, and only then against
  `[Content_Types].xml`.** A relationship target is the file's own text and may name ANY part of the
  package: `Target="/[Content_Types].xml"` normalizes back inside the archive, was tokenized as a
  worksheet and yielded an empty sheet with no diagnostic. `read.ts` asks `isWorksheetPart()`, which
  runs in this order. (1) **The floor, unconditionally**: the parts this read already resolved
  (`opened.packageParts`), the fixed `NEVER_WORKSHEET_PARTS` names (`[Content_Types].xml`,
  `xl/workbook.xml`, `xl/styles.xml`, `xl/sharedStrings.xml`) and anything that is a `.rels` part
  (`isRelationshipPart()`) are refused whatever the file says about them. (2) **The declared type**,
  through `contentTypeOf()` (`parts/package.ts`) — an `<Override>` for the part, else the
  `<Default>` for its extension — compared case-insensitively against `CONTENT_TYPES.worksheet`
  (OPC compares a media type's type and subtype that way, and `…spreadsheetml.Worksheet+xml` was
  refused over one capital). A part the package types as nothing at all passes, which is how a
  package carrying no `[Content_Types].xml` still reads. **The floor is why the order matters**: it
  used to be a FALLBACK, run only where the package declared nothing, and the declaration is the
  attacker's text too — a single `<Default Extension="xml" ContentType="…worksheet+xml"/>` types
  EVERY `.xml` part of the package as a worksheet, so a sheet could point back at the workbook, the
  styles or the shared strings and read as an empty sheet again. `packageParts` alone was never a
  floor either: it holds only what this read happened to resolve, so a workbook declaring no
  shared-strings relationship left `xl/sharedStrings.xml` out of it. Reading `<Default>` at all was
  itself the fix for `.rels`, typed by `<Default Extension="rels">` and by nothing else. Part paths
  are compared FOLDED (`foldPartName`, `zip/reader.ts`: A–Z only, ECMA-376 Part 2 6.2.2.3) in the
  floor, `packageParts`, the `<Override>` map and the archive itself. A part typed only by the
  generic `<Default Extension="xml" ContentType="application/xml">` (or `text/xml`,
  `GENERIC_XML_CONTENT_TYPES`) is treated as undeclared: OPC requires no per-sheet `<Override>`, the
  relationship already says worksheet, and the floor still applies. Only a SPECIFIC non-worksheet
  type refuses the part.
- **A part that IS typed as a worksheet but does not hold one reads back as an empty sheet, with no
  diagnostic.** The worksheet reader matches elements by local name and simply finds none it knows,
  so a package that types its `<sst>` or its `<Relationships>` document as a worksheet resolves to a
  sheet with zero rows rather than being refused. Deliberate residue, not an oversight: refusing it
  needs "no `<sheetData>` was seen" carried out of `parseWorksheet` and into a new public dropped
  name plus a guide row, and a legitimately empty sheet (which does carry `<sheetData/>`) must keep
  reading. Nothing is unsafe about it — no `TypeError` escapes, no budget is bypassed, and the
  attacker already owns every byte of the file.
- **A file-driven dropped-feature name is BOUNDED, in two directions.** `recordUnsupported(group,
  value)` (`capabilities.ts`) is the one door a workbook's own text reaches `ImportResult.dropped`
  and the console warning through — a `<cfRule type>`, a `<dataValidation type>`, a `numFmt`
  pattern. The value is trimmed to `MAX_UNSUPPORTED_VALUE_LENGTH` (64) characters with an ellipsis
  and every control character replaced by U+FFFD, and one read may add at most
  `MAX_UNSUPPORTED_NAMES` (32) DISTINCT file-driven names before the rest count into
  `<group>:other`. Without both, one rule carrying ten megabytes of type text produced a ten-megabyte
  map key, result entry and warning argument, and N rules with N types produced N of each — the only
  file-driven quantity in this engine with no cap. The declared names (`record()`) are counted
  separately, so they never eat into the file's budget. **A number-format code over
  `MAX_NUM_FMT_CODE_LENGTH` (255, `limits.ts`) is dropped on read** (`#openNumFmt`,
  `parts/styles.ts`) and recorded once per `<numFmt>` as `numFmt:<prefix>`; its cells resolve as
  General. A 1 MB code on 20 000 cells used to cost 139 s of per-cell inference.
- **`<sheetProtection>` is read through an ALLOW-LIST, not a shape test.** Both readers keep only the
  names `SHEET_PROTECTION_OPTION_NAMES` (`model.ts`) declares. Copying every boolean-shaped attribute
  put `constructor`, `toString` and `hasOwnProperty` on the snapshot as own properties, so a consumer
  calling `options.hasOwnProperty(…)` threw; `__proto__` was always inert. `SheetProtectionOptions` is
  the typed shape both adapters and `SheetBuilder#protect` now take. **`<sheetProtection>` without
  `sheet="1"`/`"true"` reads as `protection: null` and records nothing** (`#openProtection`; the
  ExcelJS adapter reads it only when `sheetProtection.sheet === true`). Apache POI writes
  `<sheetProtection formatCells="0"/>` on an open sheet, and reading it as protected imported every
  cell read-only. **The two adapters disagree on `sheet="true"`, LibreOffice's spelling:** the native
  reader reads it as protected, while ExcelJS 4.4 maps only `"1"` to `true`, so its model holds
  `undefined` there - the same as a bare `<sheetProtection/>` - and the adapter cannot tell them apart.
  The ExcelJS engine therefore imports a LibreOffice-protected sheet WITHOUT a password unprotected.
  A password-protected one carries `algorithmName`/`hashValue`, which ExcelJS keeps, so the adapter
  reads `sheet === true || algorithmName || hashValue` as protected and both engines agree there.
  It also misses LibreOffice's `rightToLeft="true"`, `locked="false"` and `date1904="true"`. Pinned with both values
  in `enginesParity.unit.js` ("the LibreOffice attribute dialect"), and named in the import guide's
  engine notes.
- **A duplicate ZIP entry name is refused.** The central directory is read into a `Map`, so the LAST
  record won while several other ZIP readers resolve the FIRST — a crafted archive holding two
  `sheet1.xml` entries then read differently here than in whatever inspected the file upstream. Excel
  never writes one, so `zip/reader.ts` refuses it as a limit. Names are compared folded, so
  `xl/a.xml` and `XL/A.xml` are one name declared twice.
- **`&#xD800;`–`&#xDFFF;` is left as written**, like every other invalid code point in
  `decodeXmlEntities`. `String.fromCodePoint` accepts a surrogate and hands back an unpaired code unit
  that travels through the whole import, and `TextEncoder` replaces it with U+FFFD on the way out.
  **The `_xD800_`–`_xDFFF_` OOXML escape follows the same rule for a LONE surrogate**:
  `decodeOoxmlEscapes` (`xml/escapes.ts`) leaves a lone high, a lone low, or a reversed low+high
  escape as written, and decodes `_xD7FF_` and `_xE000_` as before. **A high escape directly
  followed by a low one (`_xD83D__xDE00_`) is decoded into the astral character** (U+1F600), because
  ExcelJS's reader decodes every `_xHHHH_` and the two engines otherwise read the same cell
  differently — unlike `&#xD83D;&#xDE00;`, which the tokenizer still leaves literal. One regex
  matches an escape plus an optional low-surrogate escape, so a pair is decided as one unit. It
  carries its own range constants, because the tokenizer's `isDecodableCodePoint` is not exported.
- **`decodeXmlEntities` is an `indexOf('&')` loop, not a callback `replace`** (`xml/tokenizer.ts`):
  6M `&amp;` cost about +1 GB RSS before, +73 MB after. **XML end-of-line handling**
  (`normalizeLineEndings`) runs on raw text, attributes and CDATA BEFORE references are decoded, so
  `&#13;` survives as `\r`.
- **`decodeAddress` refuses row or column zero rather than returning a negative index.** `A0`
  matches the A1 shape, and `Number('0') - 1` handed `#ensureRow(-1)` through the upper-bound check
  to `rows[-1]` — `undefined` — which surfaced as `Cannot read properties of undefined (reading
  'length')`, an internal `TypeError` in place of a refusal. A reference that does not match at all
  (`1A`, an empty `r`) is still ignored silently; only a well-shaped `A0` is refused, on the cell
  path AND on the comment-anchor path, where the worksheet is well formed and a note in
  `comments{N}.xml` took the whole import down. `#ensureRow` keeps one `rowIndex < 0 ||
  !Number.isInteger(rowIndex)` guard as belt and braces; no file reaches it, because every caller
  hands a whole, non-negative index.
- **`<dimension>` is a cap check and an up-front budget charge, never an allocation.** The row
  count follows the last `<row>` or `<c>`, as ExcelJS's `rowCount` does. Pre-allocating the declared
  rows made three rows under `A1:B5000` a 5000-row grid, and turned a 1.7 kB archive (a
  million-row dimension, no rows, one list validation) into +646 MB of cell snapshots.
  `#openDimension` runs `assertSheetRectangle` and settles the declared rectangle against the
  workbook budget (`#settleWorkbookCharge`). `#finalize` re-settles at the real extent, which
  replaces the declared charge rather than adding to it. `#reserveSlot` also refuses as soon as
  rows × width outgrows the room the budget had left when the sheet started (`#workbookRoom`), so
  `MAX_WORKBOOK_CELLS` refuses before the cells exist. A single `<row r="1048576"/>` still
  allocates a million empty row arrays.
- **The native reader reports `cellStyles` on fewer workbooks than ExcelJS, on purpose.** ExcelJS
  resolves a cell's default font and fill into a style object whenever the cell carries any format
  index; the native reader sees a cell whose xf points only at the bootstrap defaults as having no
  style. `importFile/mapper.ts` records the dropped feature merely on SEEING a non-null style, so
  the two engines legitimately produce different `result.dropped` lists. The import guide says so.
- **A self-closing `<cfRule/>` needs its own finish call.** The XML tokenizer fires no close event
  for a self-closed element, and `top10`, `aboveAverage` and `duplicateValues` need no `<formula>`
  child, so both engines' writers emit them self-closing — the rule was read as if it were not in
  the file at all, on ExcelJS-written bytes too. `#finishCfRule`/`#finishConditionalFormatting` in
  `parts/worksheetReader.ts` run from the open handler as well as the close handler. Any new
  element whose state is assembled across open and close needs the same treatment. **A
  self-closing `<si/>` is the same trap on the shared-string side**: `collectRichTextRuns`
  (`xml/richText.ts`) closes a self-closed container from its open handler with the empty text,
  because an unreported empty entry shifted every later shared-string index one entry early —
  `<si><t>a</t></si><si/><si><t>c</t></si>` must read `['a', '', 'c']`. The collector's return
  type is `Required<XmlHandlers>` for the worksheet reader's sake (next bullet).
- **A table keyed by file text is a `Map` or an own-property check, never a bare object index.**
  `decodeXmlEntities` indexed a plain object, so `&constructor;` (and `&toString;`, `&valueOf;`, …)
  decoded to the source text of `Object`'s methods. `NAMED_ENTITIES` is a `Map` now; pinned by
  `nativeXml.unit.js` ("Object.prototype member"). The same trap in the import's currency lookup
  bricked the grid — see `plugins/importFile/AGENTS.md`.
- **A `<sheet>` that is not a worksheet is SKIPPED and recorded, never refused.** A chart, dialog
  or macro sheet's relationship carries its own type (`REL_TYPES.chartsheet`, `dialogsheet`,
  `macrosheet`, `intlMacrosheet`), so the worksheet lookup found nothing and `read.ts` refused the
  WHOLE workbook with `the sheet "Chart1" has no part`. `NON_WORKSHEET_SHEET_TYPES` in `read.ts`
  maps those types to `DROPPED_FEATURES.chartSheets` / `dialogSheets` / `macroSheets`
  (`capabilities.ts`); the entry is dropped and the sheets around it keep their order. A `<sheet>`
  whose relationship is missing, is of any OTHER type, or names a part the archive does not hold
  is still refused as before. The three names need a row each in the import guide's dropped table.
- **What the bytes ARE is decided before a byte of the main part is tokenized.** Acceptance used to
  be "a ZIP with a part at the officeDocument target (or `xl/workbook.xml`)", so an `.xlsb` — the
  same package layout with BIFF12 records in place of XML — tokenized to nothing and read back as a
  workbook with ZERO sheets and no diagnostic, and a legacy `.xls` or a password-protected workbook
  was refused with the true but useless "no ZIP end-of-central-directory record". Three checks, in
  read order. (1) `readZip` refuses the OLE Compound File signature (`D0 CF 11 E0 A1 B1 1A E1` at
  offset 0) BEFORE the EOCD scan, naming both things it can be — an encrypted `.xlsx` is stored in a
  Compound File too. (2) `openPackage` parses `[Content_Types].xml` BEFORE the workbook part (so the
  sheet-count test counts three inflates, not two) and `assertSpreadsheetMainPart()` (`read.ts`)
  checks the main part's declared type against `SPREADSHEET_MAIN_CONTENT_TYPES` (`parts/package.ts`:
  `.xlsx`, `.xlsm`, `.xltx`, `.xltm` and `.xlam` main types, compared lower-cased; an `.xlam`
  add-in reads like an `.xlsm`, its VBA project recorded as `vbaProject`). The `.xlsb` main type, or a
  main-part path ending `.bin`, gets its own "Save it as .xlsx." refusal; any OTHER declared type is
  refused naming it. **A package that declares no type for the main part, or no
  `[Content_Types].xml` at all, still reads** — deliberately, as it always has — and so does one
  whose only word on it is the generic `<Default Extension="xml" ContentType="application/xml"/>`
  (`GENERIC_XML_CONTENT_TYPES`), which every package carries and which names no kind. A
  `<Default Extension="xml">` carrying a SPECIFIC non-workbook type (the worksheet type, say) does
  type the main part and is refused; the hardening tests that type every `.xml` part as a worksheet
  therefore carry an `<Override>` for the main part. Both refusals here (`.xlsb`, and the Compound
  File one from `readZip`) start lower-case, because `read.ts` wraps every non-limit `openPackage`
  failure as `The workbook could not be parsed by the native engine: <message>`. (3) A VBA
  project — a workbook relationship of type `REL_TYPES.vbaProject` (Microsoft's own namespace, untouched by `normalizeRelType()`) or an
  `xl/vbaProject.bin` entry — records `DROPPED_FEATURES.vbaProject` once per read; the part is
  detected from the package index alone and is NEVER inflated — keep it that way. `vbaProject` needs
  a row in the import guide's dropped table.
- **Relationship types are normalized to the transitional namespace on read.** Excel's "Strict
  Open XML Spreadsheet" writes every office relationship under
  `http://purl.oclc.org/ooxml/officeDocument/relationships/<same tail>`, and comparing against
  the transitional `REL_TYPES` alone left such a package with no workbook part. `parseRels`
  (`parts/package.ts`) runs each `Type` through `normalizeRelType()`, so every lookup — root,
  workbook, sheet, styles, shared strings, comments — compares against `REL_TYPES` as it did.
  Content types and element names need nothing: strict keeps the same media types, and element
  matching is by local name. The writer still emits transitional types.
- **`<f>` text is capped at `MAX_FORMULA_LENGTH` (32768) AS IT IS COLLECTED, and a longer one is
  DROPPED, never refused.** `#appendFormulaText` in `parts/worksheetReader.ts` discards the text on
  the piece that would cross the cap, sets `CellState.formulaTooLong` and ignores every later piece
  of that `<f>` (memory stays bounded); `#finishCell` then records
  `DROPPED_FEATURES.formulaTooLong` (`formula:tooLong`) and keeps the cached `<v>` as a plain value.
  A too-long shared MASTER is never registered, so its slaves keep their cached values too. The cap
  used to be 8192 as a whole-workbook refusal, which refused real Excel files: Excel's 8192 limit
  counts the formula bar, while the file carries `_xlfn.`/`_xlws.`/`_xlpm.` prefixes on top
  (`_xlpm.` on every `LET`/`LAMBDA` parameter reference). The cap exists because
  `REFERENCE_REGEX` in `formulaRefs.ts` runs over the text in `translateSharedFormula` and the
  import's `shiftFormulaReferences`. **Neither sheet-qualifier branch of that regex may restart
  inside a run**: the bare name starts only where a run of name characters starts
  (`(?<![\p{L}\p{N}_.])`), the quoted one only at an apostrophe that does not follow another, and
  the quoted body is also bounded at `MAX_QUALIFIER_LENGTH` (255) units. Tried from every position,
  a branch re-scanned the run once per character: unbounded, 80 000 letters cost 3.2 s and 32 768
  apostrophes 470 ms (quadratic); bounded at 255 but unanchored it was still 255 steps per
  character — 6.4 µs per character on Cyrillic or CJK. Both timings are pinned in
  `formulaRefs.unit.js`, beside real quoted names (`'My Rates'!`, `'O''Brien'!`, a 31-character
  one). Re-measured after the fix on 32 768-character formulas: a dense run of references
  (`A1+A1+…`, `A:A+…`, `A1:B2,…`) is the worst case at 0.28–0.32 µs per character (up to 0.84 µs
  on slower machines), because every
  few characters are rewritten; a run of letters of any script, apostrophes or digits costs
  0.01–0.05 µs. **Shared-formula translation is budgeted across the workbook**: every slave
  re-translates its master's whole text, so `#chargeTranslation` charges the master's length per
  slave into `WorkbookBudget.translatedFormulaChars` BEFORE translating and refuses through
  `throwLimitExceeded` past `MAX_TRANSLATED_FORMULA_CHARS` (32 Mi). Without it 5 M slaves × 32 K
  characters was unbounded CPU. The dense-reference worst case measured 0.28–0.32 µs per character
  (developer machine) and 0.58–0.84 µs (reviewer's machine), so the budget admits about 10–28 s of
  regex work, on a master that is nothing but references. Only the value is pinned
  (`nativeReadCompat.unit.js`, "should keep the budget at 32 Mi characters"); the per-character
  figures stay in the `limits.ts` comment, because a wall-clock bound on them flaked under parallel
  Jest workers (2.96 µs measured in a loaded folder run). If the regex gains an alternative, re-measure every shape above before trusting
  that number. The import's own walks are budgeted too, against the same
  `MAX_TRANSLATED_FORMULA_CHARS` (`CollectContext.walkedFormulaChars` in `importFile/mapper.ts`),
  charged ONCE per formula for the prefix strip, the reference shift (with its sheet-qualifier
  check) and the defined-name scan together — see `plugins/importFile/AGENTS.md`. The field is optional on
  `WorkbookBudget` (absent reads as zero) because tests pass `{ declaredCells: 0 }`. Validation and
  conditional-formatting formulae are not capped: nothing runs that regex over them.
- **The `date1904` shift asks `isTemporalFormatCode` (`numFmtCode.ts`), the import's own
  classification**, so a serial is shifted exactly when the import will show it as a date or time
  (`#numberValue`). The old reader-local letter test shifted `0.0\h` and `CHF #,##0` by 1462 days
  while the import typed them numeric. An ELAPSED-time format (`[h]:mm`, `classifyTemporalFormat`
  `'time'`) is a duration, not a date, so it is NOT shifted: the 1904 epoch moves dates, never
  durations. The ExcelJS adapter reads `workbook.properties.date1904` and corrects elapsed-time cells
  the same way, so both engines agree (pinned as a parity case). Whatever replaces it must stay linear on a run of 40 000
  unclosed `[` (the old `\[[^\]]*\]` cost ~550 ms per cell there), as pinned in
  `nativeReadCompat.unit.js`.
- **`r` is OPTIONAL on `<row>` and `<c>`, and the reader places them implicitly.** ECMA-376: a
  `<row>` without `r` is the row after the previous one (the first is row 1), a `<c>` without `r`
  is the column after the previous cell of its row (the first is column A). The reader used to
  drop both silently. `#lastRow`, `#currentRow` and `#nextCol` in `parts/worksheetReader.ts`
  carry the position; `#resolveRowIndex`/`#resolveCellAddress` answer it, and both still go through
  `#ensureRow`/`#cellAt`, so every cap applies to an implicit address exactly as to an explicit
  one. A `<row r>` that is not a positive whole number is treated as ABSENT, so the row is placed
  implicitly (next bullet); a `<c r>` that does not parse is still ignored. A `<c>` without `r`
  outside any `<row>` has no row to land in and is ignored too — including one AFTER a `</row>`:
  `#currentRow` is cleared on row close (and a self-closing `<row/>` never sets it), while
  `#lastRow` keeps the index an implicit `<row>` counts from. Before, a stray cell between rows
  landed in the row above.
- **A numeric layout attribute is read by its XML Schema lexical form, never by `Number()`.**
  `Number()` takes `''` as 0, `'0x10'` as 16, `' 3'` as 3 and `'1e308'` as a finite number, and the
  reader used its answer as an index or a span: `<row r="2.5">` made `rows[1.5]` (`undefined`), so
  the next `<c>` without `r` died as `Cannot read properties of undefined`, and the rest reached
  the plugins as `hiddenRows: [0.5, 1]` (which HiddenRows rejects whole, un-hiding a real hidden
  row), `fixedRowsTop: 0.5` and `colWidths: [Infinity, -350, 7e15]`. `xml/numbers.ts` holds the two
  parsers: `parseUnsignedIntAttr` (`xsd:unsignedInt`: digits and an optional `+`, at most 15) and
  `parseFiniteDoubleAttr` (a finite `xsd:double`, no hex, no `INF`/`NaN`, no whitespace). The rules,
  all pinned in `nativeReadCompat.unit.js`: a `<row r>` that is not a positive whole number reads
  as absent (implicit placement — it used to drop the row for `0`/`-1`/`NaN`/`''`); a `<col>` whose
  `min` or `max` is not a positive whole number, or whose `min` is past its `max`, is ignored
  whole; `<col width>` outside (0, 260] (`MAX_COLUMN_WIDTH_UNITS`, `units.ts`) and `<row ht>`
  outside [0, 409.5] points (`MAX_ROW_HEIGHT_POINTS`) are ignored alone, the rest of the element
  kept. **The width cap is 260, not 255**: Excel's UI caps a column at 255 characters, but the stored
  width adds 5 px of cell padding (ECMA-376 18.3.1.13), so a 255-character Calibri 11 column is
  written `width="255.7109375"`, and an exported 1800 px column (about 257 units) has to survive a
  re-import. `importFile/mapper.ts` imports the same two constants for its second layer. A
  `<pane xSplit>`/`ySplit` is an `xsd:double` (Google Sheets writes `xSplit="3.0"`), so it is read
  with `parseFiniteDoubleAttr` and rounded DOWN; one that is negative, non-finite or past the
  sheet's own limit on its axis reads as no split there (`paneSplit`). Reading it as an
  `unsignedInt` cost every Google file its frozen panes.
  `cfRuleFromXml` (`parts/conditionalFormatting.ts`) follows the same rule: a `priority` that is
  not a whole number is dropped (a re-export used to write `priority="NaN"`), and a `top10` `rank`
  that is not a positive whole number reads as `DEFAULT_TOP10_RANK`. So are `numFmtId`, `fontId`,
  `fillId` and `borderId` in `<xf>`, a `<numFmt numFmtId>` (skipped when invalid), a cell's `s` (0
  when invalid), and a CF `dxfId`.
  This is the FIRST of two layers: `importFile/mapper.ts#mapLayout` bounds the same values again (`toLayoutPixels`, `toFreezeCount`, `toHiddenIndexes`), so an ExcelJS-read file cannot push them past either — see `plugins/importFile/AGENTS.md`.
- **An empty `<v/>` or `<v></v>` is an EMPTY cell, except for the two string kinds.** `Number('')`
  is `0`, so it used to read as shared string 0 or as the number 0. `#decodeValue` answers `null`
  first — except for `t="str"` and `t="inlineStr"`, whose value IS the empty string
  (`<c t="str"><f>""</f><v></v></c>` is how Excel stores a formula evaluating to `""`).
- **A zone-less `t="d"` date-time is read as UTC.** `Date.parse('2024-01-15T12:00:00')` is local
  time, so the serial moved with the machine's zone; a date-only value was already UTC.
  `dateSerial` appends `Z` when the text holds a `T` and no `Z`/offset (`ZONED_DATE_TIME`), so
  `2024-01-15T12:00:00` is 45306.5 everywhere. CI runs in UTC, where the unfixed code passes too,
  and Jest's sandbox ignores a runtime `process.env.TZ` change (measured), so
  `nativeReadCompat.unit.js` simulates a New York host by spying on `Date.parse` (a zone-less
  date-time reads five hours later) — that case fails on the unfixed code in any host zone.
  A `t="d"` value that is NOT ISO 8601 (no `YYYY-MM-DD` start, such as `1/15/2024`) is refused
  rather than handed to `Date.parse`, whose reading of other shapes is host-dependent: the cell
  reads as empty.
- **An inline string (`<is>`) is read by the SAME collector as a shared string.** The worksheet
  reader forwards `is`/`r`/`rPh`/`t` (already-normalized names, `INLINE_STRING_ELEMENTS`) to a
  `collectRichTextRuns('is', …)` instance while the open `<c>` is typed `inlineStr`, so a phonetic
  `<rPh>` is skipped and an `<r>` run is recorded as `richText` on both paths — the inline path
  used to leak the reading aid into the value and report nothing. The collector hands back text
  with `_xHHHH_` already decoded, so `#decodeValue` must NOT decode `inlineStr` again
  (`_x005F_x0041_` would collapse to `A`; `str` is still decoded there). A `<c t="inlineStr">`
  with no `<is>` at all now reads as an empty cell rather than as `''`.
- **`enginesParity.unit.js` is the parity checklist.** Every capability flag that `CAPABILITIES`
  (`capabilities.ts`) sets on both engines is proven there or in a test it names;
  `compressionLevel`, the one flag the engines disagree on, is not a parity case. The shape is FOUR-WAY: a snapshot is built twice (two independent
  objects), written by both engines, and each engine's bytes are then read by BOTH readers —
  `nn`/`ne`/`en`/`ee`. `nn` and `ee` alone would only prove each engine agrees with itself; the
  cross legs are what catch a writer emitting something only its own reader understands. Four
  normalizations exist and no fifth may be added: a real divergence is asserted explicitly with
  both actual values instead. **The four normalizations and the list of pinned divergences live in
  ONE place, the header of `__tests__/helpers/snapshotNormalize.js`**, with each normalization's
  reason and the no-fifth rule. The header names the file that pins each divergence
  (`enginesParity.unit.js`), not the individual test; keep it and the suite in step rather than
  repeating the list here. `enginesParity.unit.js` and `nativeRead.unit.js` both import from it, so
  the invariant is reviewable by reading one file. They were hand-copied into the two suites before
  that helper existed and had already drifted textually. `expectFourWayParity(buildFn,
  expectNative)` requires a callback asserting the feature on the native leg before the legs are
  compared, and also asserts that leg is non-empty. Agreement is not survival: with
  `SheetBuilder#freeze` writing `null` and `setRtl` writing `false` the old suite still passed.
  `cfShape` compares `formulae`, `text`, `rank` and the rule's differential style too.
- **`nativeRead.unit.js` ends with a parity test against the ExcelJS adapter on six fixtures**, and
  it applies the same four normalizations, through the same shared helper: conditional-formatting
  rules compared by `ref` only, cell values rounded to nine decimals (ExcelJS loses ulps
  round-tripping a time serial through a `Date`), the default-font/fill case above, and the JSON
  round trip. Border and alignment are
  compared unnormalized. If that test fails, the OOXML is the arbiter — read the fixture's raw XML
  before changing a reader, and never widen a normalization to make it pass.
- **`<dimension>` bounds the caps, the budget and the merge column clamp** (not the validation
  clamp, which follows the used width);
  without it the caps run incrementally per row and cell. `<col max="16384">` widens `colWidths`
  but never the cell product.
- **List validations are also read from `<extLst>`** (`<x14:dataValidation>`, `<xm:f>`,
  `<xm:sqref>`, `EXT_VALIDATION_ELEMENTS`, matched by the name after any prefix while
  `#extDepth > 0`). Excel 2010+ stores a list whose source is on another sheet ONLY there; ignoring
  the extension lost the dropdown with nothing recorded.
- **Formula text is `ST_Formula`, not `ST_Xstring`.** `<f>`, a CF `<formula>` and a DV
  `<formula1>` go through `XmlWriter#formulaLeaf` / `escapeXmlMarkup` (markup escaped, XML-illegal
  characters DROPPED, since a formula has no escape for them), never `escapeXmlText`: no reader
  decodes `_xHHHH_` there, so `"_x0041_"` came out as `"_x005F_x0041_"`. A cached string result in
  `<v>` still uses `escapeXmlText`, because the native reader decodes `str`. Both writers run
  `addFunctionPrefixes` (`functionPrefixes.ts`) over a cell formula, so `IFS(` is stored as
  `_xlfn.IFS(`; neither adapter's reader strips it, `importFile/mapper.ts` does
  (`stripFunctionPrefixes`). `NETWORKDAYS.INTL`, `WORKDAY.INTL`, `ISO.CEILING` and `ECMA.CEILING`
  are NOT in the add list: Excel for the web re-saves them bare, and LibreOffice shows `#NAME?` for
  the prefixed form. The strip still removes a prefix on them, because Google Sheets writes one.
- **The `_xHHHH_` lookalike escape is a LOOKAHEAD.** `escapeXmlText` rewrites the underscore of
  every `_(?=x[0-9A-Fa-f]{4}_)` as `_x005F_` (`OOXML_ESCAPE_LOOKALIKE`, `xml/escapes.ts`). A
  pattern that consumed the trailing underscore escaped only the first of `_x0041_x0042_`, which
  read back as `_x0041B`.
- **VML id blocks are allocated across the WORKBOOK.** `write.ts` hands each `vmlDrawingXml` its
  first block (`nextVmlBlock`, advanced by `vmlBlockCount(n) = floor(n / 1024) + 1`,
  `parts/comments.ts`); shape ids run from `1024 * block + 1`. Every drawing used block 1 /
  `_x0000_s1025`, and duplicate shape ids across sheets are Excel's "repaired drawing" trigger.
- **Both writers clamp to what Excel stores, through `writeLimits.ts`, and report it**: a string
  past 32 767 code units (`MAX_CELL_TEXT_LENGTH`) is cut, never splitting a surrogate pair
  (`cellText:truncated`); a width past `MAX_COLUMN_WIDTH_UNITS` (`columnWidth:clamped`); a height
  past `MAX_ROW_HEIGHT_POINTS` (`rowHeight:clamped`). The native reader discards a wider or taller
  value, so an unclamped 1820+ px column came back at the default width. A single-cell merge is
  skipped silently by both writers.
- **A sheet name with a control character** (C0, DEL, U+FFFE/U+FFFF: `CONTROL_SHEET_NAME_CHARS`,
  `sheetNames.ts`) is stripped by the export's sanitizer (`stripIllegalSheetNameChars`) BEFORE
  de-duplication and refused by the native writer (`write.ts`). `workbook.xml` (attribute: dropped)
  and `docProps/app.xml` (element text: `_x0001_`) disagreed, and two such names collapsed into one
  `name`. ExcelJS accepts it, which is pinned.
- **ExcelJS adapter read notes.** A list validation's `allowBlank` defaults to `false` (the OOXML
  default; ExcelJS omits the key). Protection is read only when `sheetProtection.sheet === true`
  (the `<sheetProtection>` allow-list bullet above). `read()` refuses more than `MAX_WORKBOOK_SHEETS` worksheets right after `load`, through
  `throwLimitExceeded` with the native reader's sentence — ExcelJS has parsed every sheet by then,
  so this bounds the copy into the snapshot, not the parse. ExcelJS neither writes nor reads a
  `containsText` rule's `text` attribute, pinned in `enginesParity.unit.js`.
- **Adapter tests run under `@jest-environment node`** (jsdom has no streams; the node environment gets them from `test/cryptoSetup.js`). ExcelJS stays a
  devDependency as the oracle: native write → ExcelJS read (`nativeWrite.unit.js`), ExcelJS
  fixtures → native read (`nativeRead.unit.js`, incl. a snapshot parity check on the unstyled
  fixtures). Regenerate fixtures with `node src/utils/xlsxEngine/__tests__/fixtures/generate.mjs`.
- **An Excel 365 threaded comment is read as its thread, not as its legacy note.** Excel writes the
  thread to `xl/threadedComments/threadedComment{N}.xml` (authors in `xl/persons/person.xml`) and a
  fallback `<comment>` in `comments{N}.xml` whose text is `[Threaded comment]`, a fixed English
  notice, `Comment:`, the comment, and one `Reply:` block per reply, every entry line indented by
  four spaces. Read verbatim, the notice became the cell comment. Both readers pass every note
  through `noteToComment()` (`threadedComments.ts`), which keeps the entries (joined with `\n`) and
  records `DROPPED_FEATURES.threadedComments` ONCE per read, since authors and timestamps are lost.
  Never strip it in one adapter only. Only the English notice is recognized; a note that merely
  starts with `[Threaded comment]` (no `\nComment:\n`) is kept as written. `threadedComments` has a
  row in the import guide's dropped table.
- **ExcelJS 4.4 reads a note's text from its `<r>` runs ONLY.** A note stored as a bare
  `<text><t>…</t></text>` (valid OOXML, and what some writers emit) loads with `texts: []`, which the
  adapter used to import as an EMPTY comment with nothing reported. It now skips the note and records
  `DROPPED_FEATURES.commentUnreadable` (`comment:unreadable`); the native reader reads both shapes.
  Not fixed on the ExcelJS side: recovering the text means unzipping the comments part outside
  ExcelJS. Pinned in `nativeRead.unit.js` ("plain-text note").
- **A carriage return is written as `_x000D_` in element text and as `&#xD;` in an attribute.** A raw
  `\r` is legal XML, but every conforming parser's end-of-line handling (XML 1.0 section 2.11) turns
  `\r\n` and a lone `\r` into `\n` before a reader sees it, so `a\r\nb` came back as `a\nb` from both
  readers; Excel stores it as `_x000D_`. `escapeXmlText` (`xml/escapes.ts`, `TEXT_ESCAPED_CHARS`)
  escapes it with the illegal characters; tab and line feed stay raw. `escapeXmlAttr` writes
  `\t`/`\n`/`\r` as `&#x9;`/`&#xA;`/`&#xD;`, because attribute-value normalization turns the raw
  characters into spaces and no reader decodes `_xHHHH_` in an attribute. Formula text
  (`escapeXmlMarkup`, `ST_Formula`) keeps `\r` raw: `_x000D_` would be literal formula text there.
- **A covered merge cell keeps its own style and lock, never its value.** Both readers build it with
  `createCoveredCellSnapshot()` (`model.ts`); reading it as `null` lost a covered cell's `locked="0"`,
  and `importFile/mapper.ts` imports a blank on a protected sheet as read-only, which showed once
  the user unmerged.
- **Both writers write EVERY covered member of a kept merge, with the formatting one rule gives it**
  (`coveredCellFormatting.ts`). The native writer used to leave out the `<c>` of every covered cell
  with no style of its own, a `null` slot included. Apple's parser (Quick Look, Numbers) then placed
  the next cell of that row one column early - a vertical merge in the header corner shifted the
  whole second header row - and LibreOffice drew a block without the edges it takes from covered
  cells. LibreOffice, SheetJS and both readers here fill the gap in, so no round trip could see it;
  the XML-level tests in `nativeParts.unit.js` pin it. The same holds for an EMPTY master (a `null`
  slot at the merge's top-left): both writers write `<c r="A2"/>` for it, or Apple's parser shifted
  that row. The rule: an UNFORMATTED covered cell takes the
  master's whole formatting (what ExcelJS's `mergeCells` copies); a FORMATTED one (a style, a lock
  or a number format - every covered cell of a `numeric` column is one) keeps its own and takes the
  master's fill and border on top of it, the border merged SIDE BY SIDE with the master's side
  winning: a box drawn around the whole range puts its right edge on the last covered cell itself,
  and taking the master's border wholesale lost it. The ExcelJS adapter applies it through `mergeKeepingOwnFormatting`
  after `mergeCellsWithoutStyle`, because `mergeCells` would overwrite the covered cell's lock.
- **`horizontal="general"` reads as no alignment, and so does a `vertical="bottom"` beside it**
  (`readAlignment`, `parts/styles.ts`). LibreOffice writes that pair on every `xf`, so a plain
  LibreOffice file carried a style on every cell. A `bottom` on its own is kept: the export writes
  exactly that for an `htBottom` cell, and dropping it lost the class on a round trip.
- **A text inflate stops at the string's charge, not only at the bytes'.** `inflateRawText` takes a
  `textLimit` (two bytes per UTF-16 unit against what the archive budget still allows) and the reader
  refuses through `chargeInflated`, the charge `text()` would make at the end. Charged only at the
  end, a hostile part grew its text to the whole budget first; Firefox peaked near +1 GB. The same
  files are refused, only sooner. A stream failure names its entry (`STREAM_FAILURE_PREFIX`) and
  never ends at the colon: Node's `DecompressionStream` rejects with an empty message and the
  reason in `code`.
- **Repeated sheet targets are charged with the FIRST read, before tokenizing.** `readSheets` counts
  the `<sheet>`s resolving to each folded part name up front (`TokenizeLedger.planned`), and
  `partToTokenize` charges all planned repeats when the part is first read. Charged one at a time,
  64 sheets over one 6 MB part were refused only after about 20 full parses. The memo already
  prevented re-inflating; parsing was the cost.

## Testing

`npm run test:unit -- --testPathPattern='xlsxEngine'`

Shared test helpers live in `__tests__/helpers/`: `snapshotNormalize.js` (the four cross-engine
normalizations, their reasons, the rule that no fifth may be added, and the one list of pinned
divergences) and `fixtures.js` (`loadFixture`, `toArrayBuffer` and `rewriteArchive`). Import from them rather than hand-copying either — both were
duplicated across `nativeRead`, `nativeWrite`, `enginesParity` and `importFile.unit.js`, and the
normalizers had already drifted textually before the helper existed.

**Coverage limit: every `.xlsx` fixture in `__tests__/fixtures/` is written by ExcelJS**, through
`fixtures/generate.mjs` (`node src/utils/xlsxEngine/__tests__/fixtures/generate.mjs` regenerates
them). No fixture produced by Excel, LibreOffice or Google Sheets is in the suite, so a
fixture-based test proves the native reader against ONE writer's OOXML dialect. The tests that
deliberately step outside it synthesize their input instead — the namespace-prefixed variant and the
`x14:`/`<extLst>` case in `nativeRead.unit.js`, every `repack()` case in
`nativeReadHardening.unit.js` and `nativeZip.unit.js`, and every case in `nativeReadCompat.unit.js`,
whose `packWorkbook()` builds a whole package from scratch (any sheet kind, any relationship
namespace) and whose `readSheet()` drives `parseWorksheet` on one hand-written part — the valid
shapes ExcelJS never writes (a chart sheet, a strict package, a `<c>` with no `r`, an empty `<v/>`,
a `<si/>`, a zone-less `t="d"`, an `<is>` with an `<rPh>`) live there. A reader change that could
depend on the writer's dialect needs one of those, not another ExcelJS fixture.
`__tests__/helpers/fixtures.js#rewriteArchive` rewrites the parts of any archive and packs it again,
which is how `enginesParity.unit.js` builds a LibreOffice-dialect file.

**A regeneration is NOT byte-identical**, so never diff the `.xlsx` files themselves. `generate.mjs`
pins `workbook.created`/`workbook.modified` to the epoch, but JSZip stamps every entry with the
current DOS time and `lossy.xlsx`'s `ws.protect('secret')` draws a random salt. Compare a
regeneration by unzipping both and diffing the parts, ignoring `docProps/core.xml` and `lossy`'s
`<sheetProtection>` hash and salt.
