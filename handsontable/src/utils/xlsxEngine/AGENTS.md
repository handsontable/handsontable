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
- **`locked: null` means locked** (OOXML default). Only `<protection locked="0"/>` yields `false`.
- **Theme and indexed colors are not resolved** (parity with ExcelJS): a font or fill with no `rgb`
  attribute resolves to nothing. Resolving them is a documented follow-up.
- **The numeric DEFLATE level is ignored** – `CompressionStream` has none. `false` stores.
- **The built-in numFmt table follows ECMA-376, not ExcelJS**: id 22 is `m/d/yy h:mm` (ExcelJS has
  `m/d/yy "h":mm`), ids 39/40 differ from ExcelJS by a space. No fixture uses them; a parity
  assertion on those ids would.
- **Jest has no Web streams of its own**: `test/cryptoSetup.js` installs `CompressionStream` and
  `DecompressionStream` from `node:stream/web` into the sandbox (Jest 27's node environment copies a
  fixed allow-list of globals). Remove that and every adapter test fails with `ReferenceError`.
- **A sheet password is hashed exactly as ExcelJS hashes it** (`parts/protection.ts`: SHA-512 spin
  hash, 100000 rounds, UTF-16LE password, 16-byte salt) so Excel prompts for it on unprotect. It
  is a UI gate, not encryption. Today's export always passes an empty password; the hash path is
  parity for a snapshot built elsewhere. On read the hash is unrecoverable: `sheetProtection:password`
  is recorded and `password` stays `null`, as before.
- **Column and validation spans are budgeted as a whole, and measured before they are walked.**
  `<dimension ref="A1:A1048576"/>` is one column by a million rows, which is under `MAX_SHEET_CELLS`
  and so passes every per-sheet cap, and a `sqref` may repeat one whole-column range any number of
  times. Measured on the unbudgeted reader: 2.6 kB of XML cost ~6 s of synchronous CPU, linear in
  repeats. `chargeSpan` in `parts/worksheetReader.ts` measures each span first, so a hostile file is
  refused after a few multiplications rather than five million array writes. Never move that charge
  after the walk.
- **The native reader reports `cellStyles` on fewer workbooks than ExcelJS, on purpose.** ExcelJS
  resolves a cell's default font and fill into a style object whenever the cell carries any format
  index; the native reader sees a cell whose xf points only at the bootstrap defaults as having no
  style. `importFile/mapper.ts` records the dropped feature merely on SEEING a non-null style, so
  the two engines legitimately produce different `result.dropped` lists. The import guide says so.
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
