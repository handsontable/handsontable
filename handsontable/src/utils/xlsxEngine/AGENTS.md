# xlsxEngine — the engine-neutral xlsx layer and its two adapters

`WorkbookSnapshot` (`model.ts`) is the whole contract between the plugins and a file. `exportFile`
fills it through `SheetBuilder`; `importFile` reads it. Nothing outside `adapters/` touches OOXML
or an engine object.

## Engines

| Kind | Selected when | Adapter | Notes |
|---|---|---|---|
| `native` | nothing injected (`importFile: true`, `exportFile: true`, or an `engines` map without the format) | `adapters/native/` | built in, no dependency |
| `exceljs` | `engines: { xlsx: ExcelJS }` duck-types to a `Workbook` constructor | `adapters/exceljs.ts` | legacy path, kept forever |

`detect.ts` decides. `undefined` → native; any other value must duck-type or it throws
`Invalid xlsx engine module.` (public error text – the first sentence is asserted).

## Traps in the native adapter

- **Part child order is schema-fixed.** `<worksheet>`: dimension, sheetViews, sheetFormatPr, cols,
  sheetData, sheetProtection, mergeCells, conditionalFormatting*, dataValidations, pageMargins,
  legacyDrawing. `<styleSheet>`: numFmts, fonts, fills, borders, cellStyleXfs, cellXfs, cellStyles,
  dxfs. A wrong order opens with Excel's "repair" dialog and no test catches it – open a native
  export in Excel and LibreOffice after touching a writer.
- **`styles.xml` needs its bootstrap rows**: font 0, fills `none` + `gray125`, border 0, cellXf 0,
  `cellStyles` Normal, `dxfs count="0"`. `StyleTable` writes them unconditionally.
- **A comment is four parts or nothing**: `comments{N}.xml`, `vmlDrawing{N}.vml`, both rels in the
  sheet's `.rels`, `<legacyDrawing r:id>`. Without the VML Excel shows no note.
- **Shared formulas are translated per slave** with `translateSharedFormula` (relative components
  move, `$` components stay) – not `shiftFormulaReferences`, which moves `$` too on purpose.
- **Covered merge cells lose their content on write** and read back `null`; the master keeps it.
- **Merge members are MATERIALIZED on read, to match ExcelJS.** The writer emits no `<c>` element
  for a covered cell that carries no style, so the reader's `<c>`-derived width alone left the row
  a cell short and `importFile/mapper.ts` — which takes the used width from the widest row — then
  dropped the merge entirely from the native engine's own export/import round trip. The merge pass
  in `parts/worksheetReader.ts` pads every row of a merge's row range with `null` up to the merge's
  last column and grows `width` to it. Three rules hold that together: the clamp bound is the
  **dimension** (`Math.max(width, declaredCols, 1)`, the same bound the validation pass uses), so a
  merge reaching past what the file declares stays clamped rather than widening the sheet on a
  hostile file's say-so; the `chargeSpan` stays **before** the walk (see the span-budget trap
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
  engine ever sees one from an export. The native writer guards again in `writeCell`
  (`parts/worksheetWriter.ts`, `stringCellText`): such a value is added to the shared-string table
  and written as a string cell, and a cached formula result is demoted the same way and typed
  `str`. Nothing is recorded in `dropped` — it is a representation, not a lost feature. **ExcelJS's
  writer has no such guard** and still emits `<v>NaN</v>`; the two readers then disagree about it
  (native reports an empty cell, ExcelJS hands the non-finite number back), which
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
- **The built-in numFmt table follows ECMA-376, not ExcelJS**, and exactly ONE id disagrees: id 22
  is `m/d/yy h:mm` where ExcelJS's `lib/xlsx/defaultnumformats.js` has `m/d/yy "h":mm`. Ids 39 and
  40 carry the identical string in both tables — an earlier version of this file claimed they
  differ "by a space" and that was wrong. All three are now pinned by `enginesParity.unit.js`: id
  22 asserts the divergence on the one leg that shows it (native bytes read by ExcelJS), 39 and 40
  assert four-way equality.
- **Jest has no Web streams of its own**: `test/cryptoSetup.js` installs `CompressionStream` and
  `DecompressionStream` from `node:stream/web` into the sandbox (Jest 27's node environment copies a
  fixed allow-list of globals). Remove that and every adapter test fails through
  `assertStreamAvailable` in `zip/streams.ts`, which names the missing global and the two ways out
  (a browser or Node 18+, or ExcelJS through `engines`) instead of the bare `ReferenceError` the
  engine used to raise. jsdom and Vitest's jsdom environment have neither global either, which is
  why both guides carry a Requirements note. The guard is at the two entry points and throws
  SYNCHRONOUSLY; inside the async zip writer that surfaces as a rejection.
- **A sheet password is hashed exactly as ExcelJS hashes it** (`parts/protection.ts`: SHA-512 spin
  hash, 100000 rounds, UTF-16LE password, 16-byte salt) so Excel prompts for it on unprotect. It
  is a UI gate, not encryption. Today's export always passes an empty password; the hash path is
  parity for a snapshot built elsewhere. On read the hash is unrecoverable: `sheetProtection:password`
  is recorded and `password` stays `null`, as before.
- **Column, validation and merge spans are budgeted as a whole, and measured before they are walked.**
  `<dimension ref="A1:A1048576"/>` is one column by a million rows, which is under `MAX_SHEET_CELLS`
  and so passes every per-sheet cap, and a `sqref` may repeat one whole-column range any number of
  times; a `<mergeCell ref="A1:XFD1048576"/>` is the third span kind and costs the same full-sheet
  walk per occurrence. Measured on the unbudgeted reader: 2.6 kB of XML cost ~6 s of synchronous CPU,
  linear in repeats. `chargeSpan` in `parts/worksheetReader.ts` measures each span first, so a
  hostile file is refused after a few multiplications rather than five million array writes. Never
  move that charge after the walk.
- **The native reader reports `cellStyles` on fewer workbooks than ExcelJS, on purpose.** ExcelJS
  resolves a cell's default font and fill into a style object whenever the cell carries any format
  index; the native reader sees a cell whose xf points only at the bootstrap defaults as having no
  style. `importFile/mapper.ts` records the dropped feature merely on SEEING a non-null style, so
  the two engines legitimately produce different `result.dropped` lists. The import guide says so.
- **A self-closing `<cfRule/>` needs its own finish call.** The XML tokenizer fires no close event
  for a self-closed element, and `top10`, `aboveAverage` and `duplicateValues` need no `<formula>`
  child, so both engines' writers emit them self-closing — the rule was read as if it were not in
  the file at all, on ExcelJS-written bytes too. `finishCfRule`/`finishConditionalFormatting` in
  `parts/worksheetReader.ts` run from the open handler as well as the close handler. Any new
  element whose state is assembled across open and close needs the same treatment.
- **`enginesParity.unit.js` is the parity checklist.** Every capability in the matrix is proven
  there or in a test it names. The shape is FOUR-WAY: a snapshot is built twice (two independent
  objects), written by both engines, and each engine's bytes are then read by BOTH readers —
  `nn`/`ne`/`en`/`ee`. `nn` and `ee` alone would only prove each engine agrees with itself; the
  cross legs are what catch a writer emitting something only its own reader understands. Three
  normalizations are reused from `nativeRead.unit.js` and no fourth may be added: a real divergence
  is asserted explicitly with both actual values instead (id 22, the theme fill, the CF rule-kind
  subset, the two sheet-name rows, the `lossy.xlsx` dropped ORDER).
- **`nativeRead.unit.js` ends with a parity test against the ExcelJS adapter on six fixtures**, and
  it normalizes exactly three known differences: conditional-formatting rules compared by `ref`
  only, numbers rounded to nine decimals (ExcelJS loses ulps round-tripping a time serial through a
  `Date`), and the default-font/fill case above. Border and alignment are compared unnormalized. If
  that test fails, the OOXML is the arbiter — read the fixture's raw XML before changing a reader,
  and never widen a normalization to make it pass.
- **`<dimension>` is the pre-allocation cap check**; without it the caps run incrementally per
  row and cell. `<col max="16384">` widens `colWidths` but never the cell product.
- **Adapter tests run under `@jest-environment node`** (jsdom has no streams; the node environment gets them from `test/cryptoSetup.js`). ExcelJS stays a
  devDependency as the oracle: native write → ExcelJS read (`nativeWrite.unit.js`), ExcelJS
  fixtures → native read (`nativeRead.unit.js`, incl. a snapshot parity check on the unstyled
  fixtures). Regenerate fixtures with `node src/utils/xlsxEngine/__tests__/fixtures/generate.mjs`.

## Testing

`npm run test:unit -- --testPathPattern='xlsxEngine'`
