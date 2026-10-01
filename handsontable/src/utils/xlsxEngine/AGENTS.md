# xlsxEngine — the engine-neutral xlsx layer and its two adapters

`WorkbookSnapshot` (`model.ts`) is the whole contract between the plugins and a file. `exportFile`
fills it through `SheetBuilder`; `importFile` reads it. Nothing outside `adapters/` touches OOXML
or an engine object.

Anything both adapters need is declared once on this layer, never twice under two names:
`limits.ts` (the caps and their refusals), `compression.ts`, `sheetNames.ts`, `cellRef.ts`,
`units.ts` and `dates.ts` (`MS_PER_DAY`, `EXCEL_EPOCH_UTC`, `EXCEL_EPOCH_OFFSET` — which the two
adapters and both plugins' date conversions import). `MS_PER_DAY` and `EXCEL_EPOCH_UTC` are declared
in `helpers/dateTime.ts` and re-exported by `dates.ts`, so the Formulas plugin reads them from
`helpers` without depending on this layer. A constant that lands in one adapter and is
then copied into the other is the drift these modules exist to prevent.

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
statically, which adds about 49.5 KB to the minified bundle. A lazy `import()` seam was considered
and rejected: the single-file UMD bundles have no chunk seam to split it into, so it would save
nothing there.

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
  dxfs. A wrong order opens with Excel's "repair" dialog and no test catches it – open a native
  export in Excel and LibreOffice after touching a writer.
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
  move, `$` components stay) – not `shiftFormulaReferences`, which moves `$` too on purpose.
- **Covered merge cells lose their content on write** and read back `null`; the master keeps it.
- **The worksheet reader is a CLASS, and its traps below name private methods.** `parseWorksheet` is
  a one-line wrapper over `WorksheetParser` in `parts/worksheetReader.ts`: the tokenizer is
  forward-only, so a `<c>`, a `<cfRule>` and a `<dataValidation>` are each assembled across their
  open event, their children's text and their close event, and the half-built state is the class's
  `#` fields. `#chargeSpan`, `#ensureRow`, `#cellAt`, `#finishCfRule` and
  `#finishConditionalFormatting` are private methods of it, not free functions — grep them with the
  `#`. `assertSheetFits` and `parseWorksheet` are the module's own exports; `assertSheetRectangle`
  is a module-local function of the same file, called by `assertSheetFits` and by the parser's own
  `<dimension>` handler.
- **Merge members are MATERIALIZED on read, to match ExcelJS.** The writer emits no `<c>` element
  for a covered cell that carries no style, so the reader's `<c>`-derived width alone left the row
  a cell short and `importFile/mapper.ts` — which takes the used width from the widest row — then
  dropped the merge entirely from the native engine's own export/import round trip. The merge pass
  in `parts/worksheetReader.ts` pads every row of a merge's row range with `null` up to the merge's
  last column and grows `width` to it. Three rules hold that together: the clamp bound is the
  **dimension** (`Math.max(this.#width, this.#declaredColumns, 1)`, the same bound the validation
  pass uses), so a merge reaching past what the file declares stays clamped rather than widening the
  sheet on a hostile file's say-so; the `#chargeSpan` stays **before** the walk (see the span-budget trap
  below), and the padding costs nothing new because that span was already charged; and
  `assertSheetFits` runs afterwards with the grown width, so a whole-sheet merge is still refused.
- **`locked: null` means locked** (OOXML default). Only `<protection locked="0"/>` yields `false`.
- **Theme and indexed colors are not resolved**: a font or fill with no `rgb` attribute resolves to
  nothing (`argbOf()` accepts 6/8-hex `rgb` only). This is **not** full parity with ExcelJS, despite
  what an earlier version of this file and the parity matrix said. The FONT half agrees, because the
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
  what resolves a sheet to its part, so the normalizer is never applied to an attribute key. And
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
  is `m/d/yy h:mm` where ExcelJS's `lib/xlsx/defaultnumformats.js` has `m/d/yy "h":mm`. Ids 39 and
  40 carry the identical string in both tables — an earlier version of this file claimed they
  differ "by a space" and that was wrong. All three are now pinned by `enginesParity.unit.js`: id
  22 asserts the divergence on the one leg that shows it (native bytes read by ExcelJS), 39 and 40
  assert four-way equality. **The locale ids 27–36 and 50–58 resolve on READ ONLY**, from
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
  the other. The XML attribute escaper still handles `"`, `&` and `<`. The import's inference is
  unaffected: `stripDecorations` in `importFile/inference.ts` already drops `\x` pairs, so `0.0\%`
  infers numeric without the percent style and `0.0\ %` (a literal space, then a real `%`) still
  infers percent — pinned in `inference.unit.js`.
- **Jest has no Web streams of its own**: `test/cryptoSetup.js` installs `CompressionStream` and
  `DecompressionStream` from `node:stream/web` into the sandbox (Jest 27's node environment copies a
  fixed allow-list of globals). Remove that and every adapter test fails through
  `assertStreamAvailable` in `zip/streams.ts`, which names the missing global and the two ways out
  (a browser or Node 18+, or ExcelJS through `engines`) instead of the bare `ReferenceError` the
  engine used to raise. jsdom and Vitest's jsdom environment have neither global either, which is
  why both guides carry a Requirements note. The guard is at the two entry points and throws
  SYNCHRONOUSLY; inside the async zip writer that surfaces as a rejection.
- **A sheet password is hashed exactly as ExcelJS hashes it** (`parts/protection.ts`: SHA-512 spin
  hash, 100000 rounds, UTF-16LE password, 16-byte salt) so Excel prompts for it on unprotect. The
  100000 awaited digests cost about 0.9 s in Node (measured) and seconds in a browser. It needs
  `crypto.subtle`, which browsers expose in a secure context only: `hashSheetPassword` refuses up
  front with a message naming "https or localhost" rather than the bare `TypeError` a plain-http
  page raised on `undefined.digest`. It
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
  move that charge after the walk.
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
  And `assertSheetFits` charges a floor of one unit per sheet, so `declaredCells` advances on an
  empty sheet. `MAX_INFLATED_ENTRY_BYTES` alone was never a bound on a workbook: `openPackage` holds
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
  `method:localOffset:compressedSize:uncompressedSize`, not on the entry NAME, because N central
  records may name one local record and a name-keyed memo then held one decoded copy per name; and
  the decoded string is charged against the same total (UTF-16 code units × 2, the worst case), so
  the memo can never hold more than the archive was allowed to cost however the bytes were obtained.
  **BOTH DECLARED SIZES ARE IN THE KEY**, because the memo is consulted BEFORE `entryText()` runs
  the per-entry cap and the stored-size agreement check, which both read `uncompressedSize`. Keyed
  on the region alone, a directory listing one honest record and one liar over the same bytes served
  the liar from the cache when the honest one was read first, so a refusal was skippable by read
  order. Records that agree on all four fields still share one decode, which is the whole point.
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
  `nativeReadHardening.unit.js` pins the 120 000-row round trip. `readWorkbook` still calls
  `release()` in a `finally`, and N sheets pointing at one part still cost one read.
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
  itself the fix for `.rels`, typed by `<Default Extension="rels">` and by nothing else. The
  consequence to know: a package that DOES declare content types must carry the worksheet override
  (or a worksheet `<Default>`) for each sheet part, which every writer emits and the OPC spec
  requires.
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
  separately, so they never eat into the file's budget.
- **`<sheetProtection>` is read through an ALLOW-LIST, not a shape test.** Both readers keep only the
  names `SHEET_PROTECTION_OPTION_NAMES` (`model.ts`) declares. Copying every boolean-shaped attribute
  put `constructor`, `toString` and `hasOwnProperty` on the snapshot as own properties, so a consumer
  calling `options.hasOwnProperty(…)` threw; `__proto__` was always inert. `SheetProtectionOptions` is
  the typed shape both adapters and `SheetBuilder#protect` now take.
- **A duplicate ZIP entry name is refused.** The central directory is read into a `Map`, so the LAST
  record won while several other ZIP readers resolve the FIRST — a crafted archive holding two
  `sheet1.xml` entries then read differently here than in whatever inspected the file upstream. Excel
  never writes one, so `zip/reader.ts` refuses it as a limit.
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
- **`decodeAddress` refuses row or column zero rather than returning a negative index.** `A0`
  matches the A1 shape, and `Number('0') - 1` handed `#ensureRow(-1)` through the upper-bound check
  to `rows[-1]` — `undefined` — which surfaced as `Cannot read properties of undefined (reading
  'length')`, an internal `TypeError` in place of a refusal. A reference that does not match at all
  (`1A`, an empty `r`) is still ignored silently; only a well-shaped `A0` is refused, on the cell
  path AND on the comment-anchor path, where the worksheet is well formed and a note in
  `comments{N}.xml` took the whole import down. `#ensureRow` keeps one `rowIndex < 0 ||
  !Number.isInteger(rowIndex)` guard as belt and braces; no file reaches it, because every caller
  hands a whole, non-negative index.
- **`<dimension>` pre-allocation is DELIBERATELY still eager.** `<dimension ref="A1:A1048576"/>` is
  32 bytes that materialize a million row arrays (238 MB of RSS, measured), and it is left that way:
  `#rows` IS the snapshot's own array (the constructor aliases it: `this.#rows = this.#sheet.rows;`),
  the declared tail rows are part of what the reader returns (ExcelJS reports the same `rowCount`
  from the same declaration), and `sheet.rowHeights` is padded to `#rows.length` regardless — so
  allocating them lazily would defer the cost, not remove it, while `#rows.length` is the sheet's
  row count at six more sites (the `#cellAt` cell-product cap, the merge clamp, the validation
  clamp, `assertSheetFits`, the padding pass and `rowHeights`). `MAX_WORKBOOK_CELLS` is what bounds
  the total across sheets.
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
  (`A1+A1+…`, `A:A+…`, `A1:B2,…`) is the worst case at 0.28–0.29 µs per character, because every
  few characters are rewritten; a run of letters of any script, apostrophes or digits costs
  0.01–0.05 µs. **Shared-formula translation is budgeted across the workbook**: every slave
  re-translates its master's whole text, so `#chargeTranslation` charges the master's length per
  slave into `WorkbookBudget.translatedFormulaChars` BEFORE translating and refuses through
  `throwLimitExceeded` past `MAX_TRANSLATED_FORMULA_CHARS` (64 Mi). Without it 5 M slaves × 32 K
  characters was unbounded CPU; the worst case the budget admits is about 20 s of regex work, on a
  master that is nothing but references. If the regex gains an alternative, re-measure every
  shape above before trusting that number. The field is optional on
  `WorkbookBudget` (absent reads as zero) because tests pass `{ declaredCells: 0 }`. Validation and
  conditional-formatting formulae are not capped: nothing runs that regex over them.
- **`isTemporalFormat` must not cross a `[` inside a bracket section.** `\[[^\]]*\]` re-scanned
  to the end from every `[` of a run no `]` closes — quadratic, and it ran once per numeric cell
  of a `date1904` workbook (40 000 brackets: ~550 ms per cell). The pattern is `\[[^[\]]*\]`; a
  well-formed section reads the same because it never holds a `[`.
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
  re-import. `importFile/mapper.ts` imports the same two constants for its second layer; a
  `<pane xSplit>`/`ySplit` that is not a non-negative whole number reads as no split on that axis.
  `cfRuleFromXml` (`parts/conditionalFormatting.ts`) follows the same rule: a `priority` that is
  not a whole number is dropped (a re-export used to write `priority="NaN"`), and a `top10` `rank`
  that is not a positive whole number reads as `DEFAULT_TOP10_RANK`.
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
- **An inline string (`<is>`) is read by the SAME collector as a shared string.** The worksheet
  reader forwards `is`/`r`/`rPh`/`t` (already-normalized names, `INLINE_STRING_ELEMENTS`) to a
  `collectRichTextRuns('is', …)` instance while the open `<c>` is typed `inlineStr`, so a phonetic
  `<rPh>` is skipped and an `<r>` run is recorded as `richText` on both paths — the inline path
  used to leak the reading aid into the value and report nothing. The collector hands back text
  with `_xHHHH_` already decoded, so `#decodeValue` must NOT decode `inlineStr` again
  (`_x005F_x0041_` would collapse to `A`; `str` is still decoded there). A `<c t="inlineStr">`
  with no `<is>` at all now reads as an empty cell rather than as `''`.
- **`enginesParity.unit.js` is the parity checklist.** Every capability in the matrix is proven
  there or in a test it names. The shape is FOUR-WAY: a snapshot is built twice (two independent
  objects), written by both engines, and each engine's bytes are then read by BOTH readers —
  `nn`/`ne`/`en`/`ee`. `nn` and `ee` alone would only prove each engine agrees with itself; the
  cross legs are what catch a writer emitting something only its own reader understands. Exactly
  three normalizations exist and no fourth may be added: a real divergence is asserted explicitly
  with both actual values instead (id 22, the theme fill, the CF rule-kind subset, the two
  sheet-name rows, the `lossy.xlsx` dropped ORDER). **The three live in ONE place —
  `__tests__/helpers/snapshotNormalize.js`** — with each one's reason and the no-fourth rule in that
  file's header comment; `enginesParity.unit.js` and `nativeRead.unit.js` both import from it, so
  the invariant is reviewable by reading one file. They were hand-copied into the two suites before
  that helper existed and had already drifted textually. `expectFourWayParity` also asserts the
  native leg is non-empty, so the four-way comparison cannot pass on four snapshots that all lost
  the feature under test.
- **`nativeRead.unit.js` ends with a parity test against the ExcelJS adapter on six fixtures**, and
  it normalizes exactly three known differences, through the same shared helper: conditional-formatting
  rules compared by `ref` only, numbers rounded to nine decimals (ExcelJS loses ulps round-tripping a
  time serial through a `Date`), and the default-font/fill case above. Border and alignment are
  compared unnormalized. If that test fails, the OOXML is the arbiter — read the fixture's raw XML
  before changing a reader, and never widen a normalization to make it pass.
- **`<dimension>` is the pre-allocation cap check**; without it the caps run incrementally per
  row and cell. `<col max="16384">` widens `colWidths` but never the cell product.
- **Adapter tests run under `@jest-environment node`** (jsdom has no streams; the node environment gets them from `test/cryptoSetup.js`). ExcelJS stays a
  devDependency as the oracle: native write → ExcelJS read (`nativeWrite.unit.js`), ExcelJS
  fixtures → native read (`nativeRead.unit.js`, incl. a snapshot parity check on the unstyled
  fixtures). Regenerate fixtures with `node src/utils/xlsxEngine/__tests__/fixtures/generate.mjs`.

## Testing

`npm run test:unit -- --testPathPattern='xlsxEngine'`

Shared test helpers live in `__tests__/helpers/`: `snapshotNormalize.js` (the three cross-engine
normalizations, their reasons, and the rule that no fourth may be added) and `fixtures.js`
(`loadFixture` and `toArrayBuffer`). Import from them rather than hand-copying either — both were
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
depend on the writer's dialect needs one of those, not another ExcelJS fixture. `generate.mjs` pins
`workbook.created`/`workbook.modified` to the epoch and reads no clock or random number otherwise,
so a regeneration that changes a byte changed a case; the committed fixtures predate that pin and
are deliberately not rewritten for it.
