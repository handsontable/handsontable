/**
 * @jest-environment node
 */
import { nativeAdapter } from '../adapters/native';
import { DROPPED_FEATURES, DroppedFeatures } from '../capabilities';
import {
  MAX_FORMULA_LENGTH, MAX_SHEET_COLUMNS, MAX_TRANSLATED_FORMULA_CHARS, isLimitError,
} from '../limits';
import { parseSharedStrings } from '../adapters/native/parts/sharedStrings';
import { EMPTY_STYLES } from '../adapters/native/parts/styles';
import { parseWorksheet } from '../adapters/native/parts/worksheetReader';
import { writeZip } from '../adapters/native/zip/writer';
import { toArrayBuffer } from './helpers/fixtures';

/**
 * The compatibility cases below step outside the one OOXML dialect the fixtures prove (every
 * `.xlsx` beside them is written by ExcelJS): a chart sheet, a Strict Open XML package, a `<c>`
 * with no `r`, a self-closing `<si/>`, an empty `<v/>`, a zone-less `t="d"` value, an inline
 * string with a phonetic run. None of them is malformed, and each one used to lose data or refuse
 * the file. The input is synthesized so the byte under test is the one the assertion names.
 */

const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS = `xmlns="${MAIN_NS}"`;
const TRANSITIONAL_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const STRICT_REL = 'http://purl.oclc.org/ooxml/officeDocument/relationships';
const PACKAGE_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const WORKSHEET_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';
const CHARTSHEET_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml';
const XLSX_MAIN_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml';
const VBA_PROJECT_REL = 'http://schemas.microsoft.com/office/2006/relationships/vbaProject';
const encoder = new TextEncoder();

/**
 * Reads one worksheet part through the parser, the way `read.ts` does for each sheet.
 *
 * @param {string} xml The part text.
 * @param {object} [options] The parts of the read context the case needs.
 * @param {object} [options.styles] The parsed styles.
 * @param {object} [options.strings] The parsed shared strings.
 * @param {boolean} [options.date1904] Whether the workbook counts from 1904.
 * @param {object} [options.budget] The workbook budget the read charges.
 * @returns {{ sheet: object, dropped: DroppedFeatures }}
 */
function readSheet(xml, {
  styles = EMPTY_STYLES,
  strings = { strings: [], rich: [] },
  date1904 = false,
  budget = { declaredCells: 0 },
} = {}) {
  const dropped = new DroppedFeatures();
  const sheet = parseWorksheet(xml, {
    name: 'Sheet1',
    state: 'visible',
    styles,
    sharedStrings: strings,
    comments: new Map(),
    date1904,
    dropped,
    budget,
  });

  return { sheet, dropped };
}

/**
 * Wraps row markup in a worksheet part.
 *
 * @param {string} rows The `<row>` elements.
 * @returns {string}
 */
function worksheetXml(rows) {
  return `<worksheet ${NS}><sheetData>${rows}</sheetData></worksheet>`;
}

/**
 * Packs a minimal workbook whose sheet list, relationships and parts are all given, so a case can
 * declare a sheet of any kind under any relationship namespace.
 *
 * @param {Array<{ name: string, kind: string, part: string, xml: string }>} sheets The sheets in
 * workbook order. `kind` is the relationship type's tail (`worksheet`, `chartsheet`, …); `part` is
 * the archive path; `xml` is the part text, or `null` for a sheet whose part must be missing.
 * @param {object} [options] Package-level knobs.
 * @param {string} [options.relNs] The relationship namespace to write every office relationship
 * under.
 * @param {string[]} [options.sharedStrings] Shared strings to write, with their relationship.
 * @param {string|null} [options.mainContentType] The content type `[Content_Types].xml` declares
 * for the workbook part, or `null` to declare none.
 * @param {boolean} [options.withContentTypes] Whether to write `[Content_Types].xml` at all.
 * @param {string[]} [options.extraWorkbookRels] More `<Relationship>` elements for the workbook.
 * @param {Array<{ name: string, data: Uint8Array }>} [options.extraEntries] More archive entries.
 * @returns {Promise<ArrayBuffer>}
 */
async function packWorkbook(sheets, {
  relNs = TRANSITIONAL_REL,
  sharedStrings = null,
  mainContentType = XLSX_MAIN_TYPE,
  withContentTypes = true,
  extraWorkbookRels = [],
  extraEntries = [],
} = {}) {
  const workbookRels = sheets.map((sheet, i) => (
    `<Relationship Id="rId${i + 1}" Type="${relNs}/${sheet.kind}" Target="${sheet.part.replace(/^xl\//, '')}"/>`
  )).concat(extraWorkbookRels);
  const overrides = sheets
    .filter(sheet => sheet.xml !== null)
    .map((sheet) => {
      const contentType = sheet.kind === 'worksheet' ? WORKSHEET_TYPE : CHARTSHEET_TYPE;

      return `<Override PartName="/${sheet.part}" ContentType="${contentType}"/>`;
    });
  const entries = [];

  if (sharedStrings !== null) {
    workbookRels.push(`<Relationship Id="rIdSst" Type="${relNs}/sharedStrings" Target="sharedStrings.xml"/>`);
    overrides.push('<Override PartName="/xl/sharedStrings.xml" '
      + 'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>');
    entries.push({
      name: 'xl/sharedStrings.xml',
      data: encoder.encode(`<sst ${NS}>${sharedStrings.map(text => `<si><t>${text}</t></si>`).join('')}</sst>`),
    });
  }

  if (mainContentType !== null) {
    overrides.unshift(`<Override PartName="/xl/workbook.xml" ContentType="${mainContentType}"/>`);
  }

  if (withContentTypes) {
    entries.push({
      name: '[Content_Types].xml',
      data: encoder.encode('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + `${overrides.join('')}</Types>`),
    });
  }
  entries.push({
    name: '_rels/.rels',
    data: encoder.encode(`<Relationships xmlns="${PACKAGE_REL}">`
      + `<Relationship Id="rId1" Type="${relNs}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
  });
  entries.push({
    name: 'xl/workbook.xml',
    data: encoder.encode(`<workbook ${NS} xmlns:r="${relNs}"><sheets>${
      sheets.map((sheet, i) => `<sheet name="${sheet.name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
    }</sheets></workbook>`),
  });
  entries.push({
    name: 'xl/_rels/workbook.xml.rels',
    data: encoder.encode(`<Relationships xmlns="${PACKAGE_REL}">${workbookRels.join('')}</Relationships>`),
  });
  sheets.filter(sheet => sheet.xml !== null).forEach((sheet) => {
    entries.push({ name: sheet.part, data: encoder.encode(sheet.xml) });
  });
  entries.push(...extraEntries);

  return toArrayBuffer(await writeZip(entries, true));
}

/**
 * A one-cell worksheet part holding a number.
 *
 * @param {number} value The value of `A1`.
 * @returns {string}
 */
function oneCellSheet(value) {
  return worksheetXml(`<row r="1"><c r="A1"><v>${value}</v></c></row>`);
}

/**
 * Reads a packed workbook through the native adapter.
 *
 * @param {ArrayBuffer} buffer The archive.
 * @returns {Promise<{ snapshot: object, dropped: DroppedFeatures }>}
 */
async function readWorkbook(buffer) {
  const dropped = new DroppedFeatures();
  const snapshot = await nativeAdapter.read(buffer, undefined, dropped);

  return { snapshot, dropped };
}

describe('native reader compatibility: sheets that are not worksheets', () => {
  it('should skip a chart sheet, record it as dropped, and keep the worksheets around it in order', async() => {
    // A `<sheet>` whose relationship is a chartsheet resolved to no worksheet part, and the reader
    // refused the WHOLE workbook with `the sheet "Chart1" has no part` — a workbook with one chart
    // tab could not be imported at all.
    const buffer = await packWorkbook([
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(1) },
      { name: 'Chart1', kind: 'chartsheet', part: 'xl/chartsheets/sheet1.xml', xml: `<chartsheet ${NS}/>` },
      { name: 'Sheet2', kind: 'worksheet', part: 'xl/worksheets/sheet2.xml', xml: oneCellSheet(2) },
    ]);
    const { snapshot, dropped } = await readWorkbook(buffer);

    expect(snapshot.sheets.map(sheet => sheet.name)).toEqual(['Sheet1', 'Sheet2']);
    expect(snapshot.sheets[0].rows[0][0].value).toBe(1);
    expect(snapshot.sheets[1].rows[0][0].value).toBe(2);
    expect(dropped.list()).toEqual([DROPPED_FEATURES.chartSheets]);
    expect(dropped.count(DROPPED_FEATURES.chartSheets)).toBe(1);
  });

  it('should skip dialog and macro sheets under their own dropped names', async() => {
    const buffer = await packWorkbook([
      { name: 'Dialog1', kind: 'dialogsheet', part: 'xl/dialogsheets/sheet1.xml', xml: `<dialogsheet ${NS}/>` },
      { name: 'Macro1', kind: 'xlMacrosheet', part: 'xl/macrosheets/sheet1.xml', xml: `<macrosheet ${NS}/>` },
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(1) },
    ]);
    const { snapshot, dropped } = await readWorkbook(buffer);

    expect(snapshot.sheets.map(sheet => sheet.name)).toEqual(['Sheet1']);
    expect(dropped.list()).toEqual([DROPPED_FEATURES.dialogSheets, DROPPED_FEATURES.macroSheets]);
  });

  it('should still refuse a worksheet whose relationship names a part the archive does not hold', async() => {
    const buffer = await packWorkbook([
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(1) },
      { name: 'Gone', kind: 'worksheet', part: 'xl/worksheets/sheet2.xml', xml: null },
    ]);

    await expect(readWorkbook(buffer)).rejects.toThrow('the sheet "Gone" has no part');
  });
});

describe('native reader compatibility: Strict Open XML relationships', () => {
  it('should resolve the workbook, its sheets and its shared strings through the strict namespace', async() => {
    // Excel's "Strict Open XML Spreadsheet" writes every office relationship type under
    // `http://purl.oclc.org/ooxml/officeDocument/relationships/`; the reader compared against the
    // transitional URIs only, so such a package had no workbook part at all.
    const buffer = await packWorkbook([
      {
        name: 'Sheet1',
        kind: 'worksheet',
        part: 'xl/worksheets/sheet1.xml',
        xml: worksheetXml('<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>2</v></c></row>'),
      },
    ], { relNs: STRICT_REL, sharedStrings: ['strict'] });
    const { snapshot, dropped } = await readWorkbook(buffer);

    expect(snapshot.sheets.map(sheet => sheet.name)).toEqual(['Sheet1']);
    expect(snapshot.sheets[0].rows[0].map(cell => cell.value)).toEqual(['strict', 2]);
    expect(dropped.list()).toEqual([]);
  });
});

describe('native reader compatibility: the formula length cap', () => {
  it('should drop a formula longer than the cap, keep its cached value and record formula:tooLong', () => {
    // Excel writes `_xlfn.`, `_xlws.` and `_xlpm.` prefixes into `<f>` that its own 8192-character
    // limit does not count, so a formula at that limit is longer in the file. The cap used to refuse
    // the whole workbook over one such cell; now only that formula is dropped.
    const text = 'A'.repeat(MAX_FORMULA_LENGTH + 1);
    const xml = worksheetXml(`<row r="2"><c r="A2"><v>1</v></c><c r="B2"><f>${text}</f><v>42</v></c>`
      + '<c r="C2"><f>A2+1</f><v>2</v></c></row>');
    const { sheet, dropped } = readSheet(xml);

    expect(MAX_FORMULA_LENGTH).toBe(32768);
    expect(sheet.rows[1][1]).toEqual(expect.objectContaining({ value: 42, formula: null }));
    expect(sheet.rows[1][2].formula).toEqual({ text: 'A2+1', result: 2 });
    expect(dropped.list()).toEqual([DROPPED_FEATURES.formulaTooLong]);
    expect(DROPPED_FEATURES.formulaTooLong).toBe('formula:tooLong');
  });

  it('should keep a formula past Excel\'s 8192-character UI limit, as the prefixes make one', () => {
    const text = `_xlfn.LET(_xlpm.x,1,${'_xlpm.x+'.repeat(1200)}_xlpm.x)`;
    const { sheet, dropped } = readSheet(worksheetXml(`<row r="1"><c r="A1"><f>${text}</f><v>1</v></c></row>`));

    expect(text.length).toBeGreaterThan(8192);
    expect(sheet.rows[0][0].formula).toEqual({ text, result: 1 });
    expect(dropped.list()).toEqual([]);
  });

  it('should drop a long formula split across text and CDATA pieces, whatever follows the crossing piece', () => {
    const half = 'A'.repeat(MAX_FORMULA_LENGTH / 2);
    const xml = worksheetXml(`<row r="1"><c r="A1"><f>${half}<![CDATA[${half}]]>B<![CDATA[${half}]]></f>`
      + '<v>5</v></c></row>');
    const { sheet, dropped } = readSheet(xml);

    expect(sheet.rows[0][0]).toEqual(expect.objectContaining({ value: 5, formula: null }));
    expect(dropped.count(DROPPED_FEATURES.formulaTooLong)).toBe(1);
  });

  it('should read the rest of the workbook when one formula is too long', async() => {
    const text = 'A'.repeat(MAX_FORMULA_LENGTH + 1);
    const buffer = await packWorkbook([{
      name: 'Sheet1',
      kind: 'worksheet',
      part: 'xl/worksheets/sheet1.xml',
      xml: worksheetXml(`<row r="1"><c r="A1"><f>${text}</f><v>3</v></c><c r="B1"><v>4</v></c></row>`),
    }]);
    const { snapshot, dropped } = await readWorkbook(buffer);

    expect(snapshot.sheets[0].rows[0].map(cell => cell.value)).toEqual([3, 4]);
    expect(snapshot.sheets[0].rows[0][0].formula).toBeNull();
    expect(dropped.list()).toEqual([DROPPED_FEATURES.formulaTooLong]);
  });

  it('should drop a too-long formula on a cell without r too', () => {
    const text = 'A'.repeat(MAX_FORMULA_LENGTH + 1);
    const { sheet, dropped } = readSheet(worksheetXml(`<row r="3"><c r="B3"/><c><f>${text}</f><v>8</v></c></row>`));

    expect(sheet.rows[2][2]).toEqual(expect.objectContaining({ value: 8, formula: null }));
    expect(dropped.list()).toEqual([DROPPED_FEATURES.formulaTooLong]);
  });

  it('should not register a too-long shared-formula master, so its slaves keep their cached values', () => {
    const text = 'A'.repeat(MAX_FORMULA_LENGTH + 1);
    const xml = worksheetXml(`<row r="1"><c r="A1"><f t="shared" ref="A1:A3" si="0">${text}</f><v>1</v></c></row>`
      + '<row r="2"><c r="A2"><f t="shared" si="0"/><v>2</v></c></row>'
      + '<row r="3"><c r="A3"><f t="shared" si="0"/><v>3</v></c></row>');
    const { sheet, dropped } = readSheet(xml);

    expect(sheet.rows.map(row => [row[0].value, row[0].formula])).toEqual([[1, null], [2, null], [3, null]]);
    expect(dropped.count(DROPPED_FEATURES.formulaTooLong)).toBe(1);
  });

  it('should accept a formula of exactly the cap', () => {
    const text = '1'.repeat(MAX_FORMULA_LENGTH);
    const { sheet, dropped } = readSheet(worksheetXml(`<row r="1"><c r="A1"><f>${text}</f></c></row>`));

    expect(sheet.rows[0][0].formula.text).toHaveLength(MAX_FORMULA_LENGTH);
    expect(dropped.list()).toEqual([]);
  });
});

describe('native reader compatibility: the shared-formula translation budget', () => {
  /**
   * A master at `A1` and `slaves` shared-formula slaves below it.
   *
   * @param {string} master The master's formula text.
   * @param {number} slaves How many slave cells follow.
   * @returns {string}
   */
  function sharedColumn(master, slaves) {
    let rows = `<row r="1"><c r="A1"><f t="shared" ref="A1:A${slaves + 1}" si="0">${master}</f></c></row>`;

    for (let r = 2; r <= slaves + 1; r++) {
      rows += `<row r="${r}"><c r="A${r}"><f t="shared" si="0"/></c></row>`;
    }

    return worksheetXml(rows);
  }

  it('should charge the master\'s length for every slave it translates, across the workbook', () => {
    // Each slave runs the reference regex over the master's whole text, so 5 million slaves of a
    // 32 768-character master were 160 billion characters of synchronous work nothing bounded.
    const budget = { declaredCells: 0 };

    readSheet(sharedColumn('B1+C1', 4), { budget });
    readSheet(sharedColumn('B1*2', 2), { budget });

    expect(budget.translatedFormulaChars).toBe((5 * 4) + (4 * 2));
  });

  it('should refuse the workbook as a limit once the translations cross the budget', () => {
    const budget = { declaredCells: 0, translatedFormulaChars: MAX_TRANSLATED_FORMULA_CHARS - 9 };
    let caught;

    try {
      readSheet(sharedColumn('B1+C1', 2), { budget });
    } catch (error) {
      caught = error;
    }

    expect(caught.message).toBe(`The workbook's shared formulas translate to more than ${MAX_TRANSLATED_FORMULA_CHARS} `
      + 'characters, above the limit this reader accepts.');
    expect(isLimitError(caught)).toBe(true);
  });

  it('should translate right up to the budget', () => {
    const budget = { declaredCells: 0, translatedFormulaChars: MAX_TRANSLATED_FORMULA_CHARS - 10 };
    const { sheet } = readSheet(sharedColumn('B1+C1', 2), { budget });

    expect(sheet.rows[2][0].formula).toEqual({ text: 'B3+C3' });
    expect(budget.translatedFormulaChars).toBe(MAX_TRANSLATED_FORMULA_CHARS);
  });
});

describe('native reader compatibility: the date1904 temporal-format test', () => {
  it('should classify a format of 40 000 opening brackets in bounded time', () => {
    // `/\[[^\]]*\]/g` re-scans from every `[` when no `]` ever closes it, quadratic on a run of
    // them, and it ran once per numeric cell of a 1904 workbook: 40 000 brackets cost ~550 ms per
    // cell. The pattern now refuses to cross a `[`, so the same run is scanned once.
    const numFmt = `${'['.repeat(40000)}d`;
    const styles = { cellXfs: [{ numFmt, style: null, locked: null }], dxfs: [] };
    const xml = worksheetXml('<row r="1"><c r="A1" s="0"><v>1</v></c></row>');
    const started = performance.now();
    const { sheet } = readSheet(xml, { styles, date1904: true });
    const elapsed = performance.now() - started;

    // Still temporal: the `d` survives the strip, so the 1904 shift of 1462 days applies.
    expect(sheet.rows[0][0].value).toBe(1463);
    expect(elapsed).toBeLessThan(200);
  });

  it('should still strip a well-formed bracket section and a quoted section before testing', () => {
    const styles = {
      cellXfs: [
        { numFmt: '[$-409]0.00', style: null, locked: null },
        { numFmt: '"day" 0', style: null, locked: null },
        { numFmt: '[h]:mm', style: null, locked: null },
      ],
      dxfs: [],
    };
    const xml = worksheetXml(
      '<row r="1"><c r="A1" s="0"><v>1</v></c><c r="B1" s="1"><v>1</v></c><c r="C1" s="2"><v>1</v></c></row>'
    );
    const { sheet } = readSheet(xml, { styles, date1904: true });

    expect(sheet.rows[0].map(cell => cell.value)).toEqual([1, 1, 1463]);
  });
});

describe('native reader compatibility: implicit cell and row placement', () => {
  it('should place a <c> without r in the column after the previous cell of its row', () => {
    // ECMA-376 makes `r` optional on both `<row>` and `<c>`; a cell without one goes in the column
    // after the previous cell (the first one in column A). The reader dropped such cells.
    const xml = worksheetXml(
      '<row r="2"><c r="B2"><v>1</v></c><c><v>2</v></c></row>'
      + '<row r="4"><c><v>3</v></c><c r="D4"><v>4</v></c><c><v>5</v></c></row>'
    );
    const { sheet } = readSheet(xml);

    // Row 4 sets the sheet width at five, and a row that carries a cell is padded to it.
    expect(sheet.rows[1].map(cell => cell && cell.value)).toEqual([null, 1, 2, null, null]);
    expect(sheet.rows[3].map(cell => cell && cell.value)).toEqual([3, null, null, 4, 5]);
  });

  it('should place a <row> without r after the previous row, the first one at row 1', () => {
    const xml = worksheetXml(
      '<row><c><v>1</v></c></row>'
      + '<row r="5" ht="30" customHeight="1"><c><v>2</v></c></row>'
      + '<row hidden="1"><c><v>3</v></c><c><v>4</v></c></row>'
    );
    const { sheet } = readSheet(xml);

    expect(sheet.rows[0].map(cell => cell && cell.value)).toEqual([1, null]);
    expect(sheet.rows[4].map(cell => cell && cell.value)).toEqual([2, null]);
    expect(sheet.rows[5].map(cell => cell && cell.value)).toEqual([3, 4]);
    expect(sheet.rowHeights[4]).toBe(30);
    expect(sheet.hiddenRows).toEqual([5]);
  });

  it('should keep the column cap on implicitly placed cells', () => {
    const xml = worksheetXml(`<row r="1">${'<c/>'.repeat(MAX_SHEET_COLUMNS + 1)}</row>`);

    expect(() => readSheet(xml)).toThrow(`above the ${MAX_SHEET_COLUMNS}-column limit`);
  });

  it('should ignore a <c> outside any <row>, as before', () => {
    const { sheet } = readSheet(`<worksheet ${NS}><sheetData><c><v>1</v></c></sheetData></worksheet>`);

    expect(sheet.rows).toEqual([]);
  });

  it('should ignore a <c> without r after a </row>, rather than landing it in the closed row', () => {
    // The current row was never cleared on \`</row>\`, so a stray cell between rows was written into
    // the row before it, over whatever that row held in the next column.
    const xml = worksheetXml('<row r="1"><c><v>1</v></c></row><c><v>2</v></c>'
      + '<row><c><v>3</v></c></row>');
    const { sheet } = readSheet(xml);

    expect(sheet.rows.map(row => row.map(cell => cell && cell.value))).toEqual([[1], [3]]);
  });
});

describe('native reader compatibility: numeric layout attributes', () => {
  // `Number()` accepts fractions, exponents, hex and the empty string, and the reader used to take
  // its answer as a row index, a column span, a pane split or a size. `<row r="2.5">` then indexed
  // `rows[1.5]` (`undefined`), so the next cell without `r` died as a `TypeError`; the others
  // reached the plugins as `hiddenRows: [0.5]`, `fixedRowsTop: 0.5`, `colWidths: [Infinity]`.
  const NOT_A_POSITIVE_INTEGER = ['2.5', '-1', '0', '1e308', 'NaN', '', '0x10', ' 3', 'Infinity'];

  /**
   * Wraps one `<col>` element (or several) in a worksheet part with a single cell.
   *
   * @param {string} cols The `<col>` elements.
   * @returns {string}
   */
  function colsXml(cols) {
    return `<worksheet ${NS}><cols>${cols}</cols><sheetData><row r="1"><c><v>1</v></c></row>`
      + '</sheetData></worksheet>';
  }

  /**
   * Wraps one `<pane>` in a worksheet part with a single cell.
   *
   * @param {string} attrs The pane's split attributes.
   * @returns {string}
   */
  function paneXml(attrs) {
    return `<worksheet ${NS}><sheetViews><sheetView workbookViewId="0"><pane ${attrs} state="frozen"/>`
      + '</sheetView></sheetViews><sheetData><row r="1"><c><v>1</v></c></row></sheetData></worksheet>';
  }

  it.each(NOT_A_POSITIVE_INTEGER)('should place a <row r="%s"> implicitly, after the previous row', (r) => {
    const xml = worksheetXml(
      `<row r="3"><c><v>0</v></c></row><row r="${r}" ht="20" hidden="1"><c><v>1</v></c></row>`
    );
    const { sheet } = readSheet(xml);

    expect(sheet.rows.map(row => row.map(cell => cell && cell.value))).toEqual([[], [], [0], [1]]);
    expect(sheet.hiddenRows).toEqual([3]);
    expect(sheet.rowHeights).toEqual([null, null, null, 20]);
  });

  it('should read the cell after a <row r="2.5"> without throwing', () => {
    const { sheet } = readSheet(worksheetXml('<row r="2.5"><c><v>1</v></c></row>'));

    expect(sheet.rows).toHaveLength(1);
    expect(sheet.rows[0][0].value).toBe(1);
  });

  it.each(NOT_A_POSITIVE_INTEGER)('should ignore a <col> whose min is "%s"', (min) => {
    const { sheet } = readSheet(colsXml(`<col min="${min}" max="4" width="30" hidden="1"/>`));

    // The one cell in column A still pads the widths to the sheet's width.
    expect(sheet.colWidths).toEqual([null]);
    expect(sheet.hiddenCols).toEqual([]);
  });

  it.each(NOT_A_POSITIVE_INTEGER)('should ignore a <col> whose max is "%s"', (max) => {
    const { sheet } = readSheet(colsXml(`<col min="1" max="${max}" width="30" hidden="1"/>`));

    expect(sheet.colWidths).toEqual([null]);
    expect(sheet.hiddenCols).toEqual([]);
  });

  it('should ignore a <col> whose min is past its max, and read a valid one beside it', () => {
    const { sheet } = readSheet(colsXml(
      '<col min="3" max="2" width="30" hidden="1"/><col min="1" max="1" width="9"/>'
    ));

    expect(sheet.colWidths).toEqual([9]);
    expect(sheet.hiddenCols).toEqual([]);
  });

  it.each(['-350', '0', '255.5', '1e308', '7e15', 'NaN', '', '0x10', 'Infinity'])(
    'should ignore a <col> width of "%s" and keep the rest of the element', (width) => {
      const { sheet } = readSheet(colsXml(`<col min="1" max="2" width="${width}" hidden="1"/>`));

      expect(sheet.colWidths).toEqual([null, null]);
      expect(sheet.hiddenCols).toEqual([0, 1]);
    });

  it.each([['2.5', 2.5], ['255', 255], ['1e1', 10]])('should keep a <col> width of "%s"', (width, expected) => {
    const { sheet } = readSheet(colsXml(`<col min="1" max="1" width="${width}"/>`));

    expect(sheet.colWidths).toEqual([expected]);
  });

  it.each(['-1', '409.6', '1.33e308', 'NaN', '', '0x10', 'Infinity'])(
    'should ignore a <row> height of "%s" and keep the rest of the row', (ht) => {
      const { sheet } = readSheet(worksheetXml(`<row r="1" ht="${ht}" hidden="1"><c><v>1</v></c></row>`));

      expect(sheet.rowHeights).toEqual([null]);
      expect(sheet.hiddenRows).toEqual([0]);
      expect(sheet.rows[0][0].value).toBe(1);
    });

  it.each([['0', 0], ['2.5', 2.5], ['409.5', 409.5]])('should keep a <row> height of "%s"', (ht, expected) => {
    const { sheet } = readSheet(worksheetXml(`<row r="1" ht="${ht}"><c><v>1</v></c></row>`));

    expect(sheet.rowHeights).toEqual([expected]);
  });

  it.each(['2.5', '-1', '1e308', 'NaN', '', '0x10', 'Infinity'])(
    'should read a pane split of "%s" as no split on that axis', (split) => {
      expect(readSheet(paneXml(`xSplit="${split}" ySplit="2"`)).sheet.freeze).toEqual({ rows: 2, cols: 0 });
      expect(readSheet(paneXml(`xSplit="3" ySplit="${split}"`)).sheet.freeze).toEqual({ rows: 0, cols: 3 });
      expect(readSheet(paneXml(`xSplit="${split}" ySplit="${split}"`)).sheet.freeze).toBeNull();
    });
});

describe('native reader compatibility: a self-closing <si/>', () => {
  it('should keep the index of every shared string after a self-closing <si/>', () => {
    // The tokenizer fires no close event for a self-closed element, so `<si/>` never reached the
    // collector's close handler and every later index pointed one entry early.
    const xml = `<sst ${NS}><si><t>a</t></si><si/><si><t>c</t></si></sst>`;

    expect(parseSharedStrings(xml)).toEqual({ strings: ['a', '', 'c'], rich: [false, false, false] });
  });
});

describe('native reader compatibility: an empty <v>', () => {
  it('should read an empty <v/> or <v></v> as an empty cell, not as shared string 0 or the number 0', () => {
    const strings = { strings: ['zero'], rich: [false] };
    const xml = worksheetXml(
      '<row r="1"><c r="A1" t="s"><v/></c><c r="B1"><v></v></c><c r="C1" t="b"><v/></c>'
      + '<c r="D1" t="e"><v></v></c><c r="E1" t="d"><v/></c><c r="F1"><v>7</v></c></row>'
    );
    const { sheet } = readSheet(xml, { strings });

    expect(sheet.rows[0].map(cell => cell && cell.value)).toEqual([null, null, null, null, null, 7]);
  });

  it('should keep an empty cached string result of a formula as the empty string', () => {
    // `<c t="str"><f>""</f><v></v></c>` is how Excel stores a formula that evaluates to "".
    const xml = worksheetXml('<row r="1"><c r="A1" t="str"><f>""</f><v></v></c></row>');
    const { sheet } = readSheet(xml);

    expect(sheet.rows[0][0].formula).toEqual({ text: '""', result: '' });
  });
});

describe('native reader compatibility: ISO date cells', () => {
  it('should read an offset-less ISO date-time as UTC, so the serial does not depend on the zone', () => {
    // `Date.parse('2024-01-15T12:00:00')` is local time, so the serial moved with the machine's
    // zone; a date-only value was already UTC. The next case proves it on a non-UTC host.
    const xml = worksheetXml(
      '<row r="1"><c r="A1" t="d"><v>2024-01-15T12:00:00</v></c><c r="B1" t="d"><v>2024-01-15T12:00:00Z</v></c>'
      + '<c r="C1" t="d"><v>2024-01-15T12:00:00+02:00</v></c><c r="D1" t="d"><v>2024-01-15</v></c>'
      + '<c r="E1" t="d"><v>2024-01-15T12:00:00.500</v></c></row>'
    );
    const { sheet } = readSheet(xml);
    const [a, b, c, d, e] = sheet.rows[0].map(cell => cell.value);

    expect(a).toBe(45306.5);
    expect(b).toBe(45306.5);
    expect(c).toBeCloseTo(45306.5 - (2 / 24), 9);
    expect(d).toBe(45306);
    expect(e).toBeCloseTo(45306.5 + (0.5 / 86400), 9);
  });

  it('should read an offset-less ISO date-time as UTC on a host whose zone is not UTC', () => {
    // CI runs in UTC, where the local and the UTC reading agree, so the case above passes there
    // with or without the fix. Jest's sandbox does not apply a runtime \`process.env.TZ\` change to
    // \`Date\`, so a New York host is simulated instead: \`Date.parse\` reads a zone-less date-time
    // five hours later, exactly as it does under \`TZ=America/New_York\` in January.
    const parse = Date.parse;
    const spy = jest.spyOn(Date, 'parse').mockImplementation(text => (
      /T[^Z+-]*$/.test(text) ? parse(`${text}Z`) + (5 * 3600000) : parse(text)
    ));

    try {
      const xml = worksheetXml('<row r="1"><c r="A1" t="d"><v>2024-01-15T12:00:00</v></c>'
        + '<c r="B1" t="d"><v>2024-01-15T12:00:00.500</v></c><c r="C1" t="d"><v>2024-01-15</v></c></row>');
      const { sheet } = readSheet(xml);
      const [a, b, c] = sheet.rows[0].map(cell => cell.value);

      expect(spy).toHaveBeenCalled();
      expect(a).toBe(45306.5);
      expect(b).toBeCloseTo(45306.5 + (0.5 / 86400), 9);
      expect(c).toBe(45306);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('native reader compatibility: inline strings', () => {
  it('should skip a phonetic run inside <is> and record its formatting runs as richText', () => {
    // The shared-string reader skips `<rPh>` and reports `<r>` runs; the inline-string path did
    // neither, so the reading aid leaked into the value and the lost formatting went unreported.
    const xml = worksheetXml(
      '<row r="1"><c r="A1" t="inlineStr"><is><r><rPr><b/></rPr><t>漢</t></r>'
      + '<rPh sb="0" eb="1"><t>かん</t></rPh></is></c>'
      + '<c r="B1" t="inlineStr"><is><t>plain</t></is></c></row>'
    );
    const { sheet, dropped } = readSheet(xml);

    expect(sheet.rows[0].map(cell => cell.value)).toEqual(['漢', 'plain']);
    expect(dropped.list()).toEqual([DROPPED_FEATURES.richText]);
    expect(dropped.count(DROPPED_FEATURES.richText)).toBe(1);
  });

  it('should decode the _xHHHH_ escapes of an inline string exactly once', () => {
    const xml = worksheetXml(
      '<row r="1"><c r="A1" t="inlineStr"><is><t>a_x005F_x0041_b</t></is></c>'
      + '<c r="B1" t="inlineStr"><is><t>tab_x0009_end</t></is></c></row>'
    );
    const { sheet } = readSheet(xml);

    expect(sheet.rows[0].map(cell => cell.value)).toEqual(['a_x0041_b', 'tab\tend']);
  });
});

describe('native reader compatibility: the main part\'s content type', () => {
  const oneSheet = () => [
    { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(7) },
  ];

  it.each([
    ['.xlsx', XLSX_MAIN_TYPE],
    ['.xlsm', 'application/vnd.ms-excel.sheet.macroEnabled.main+xml'],
    ['.xltx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml'],
    ['.xltm', 'application/vnd.ms-excel.template.macroEnabled.main+xml'],
    ['.xltm, in another case', 'Application/VND.ms-excel.Template.MacroEnabled.Main+XML'],
    ['.xlam', 'application/vnd.ms-excel.addin.macroEnabled.main+xml'],
  ])('should read a workbook whose main part is declared as %s', async(_, mainContentType) => {
    const { snapshot } = await readWorkbook(await packWorkbook(oneSheet(), { mainContentType }));

    expect(snapshot.sheets[0].rows[0][0].value).toBe(7);
  });

  it('should keep reading a package that declares no type for the main part, or no content types at all', async() => {
    const undeclared = await readWorkbook(await packWorkbook(oneSheet(), { mainContentType: null }));
    const bare = await readWorkbook(await packWorkbook(oneSheet(), { withContentTypes: false }));

    expect(undeclared.snapshot.sheets[0].rows[0][0].value).toBe(7);
    expect(bare.snapshot.sheets[0].rows[0][0].value).toBe(7);
  });

  it('should refuse a main part declared with any other content type, naming the type', async() => {
    // Acceptance used to be "a ZIP with a workbook part at the expected path"; the main part's
    // declared type was never read, so a Word document renamed into the layout was tokenized as a
    // workbook.
    const buffer = await packWorkbook(oneSheet(), {
      mainContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
    });

    await expect(readWorkbook(buffer)).rejects.toThrow('The workbook could not be parsed by the native engine: '
      + 'the main part "xl/workbook.xml" is declared as '
      + '"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml", '
      + 'which is not a spreadsheet workbook.');
  });

  it('should refuse an Excel Binary Workbook declared by its content type', async() => {
    // An `.xlsb` is a ZIP with the same package layout and a binary main part: nothing in it is
    // XML, so it used to read as a workbook with zero sheets and no diagnostic.
    const buffer = await packWorkbook(oneSheet(), {
      mainContentType: 'application/vnd.ms-excel.sheet.binary.macroEnabled.main',
    });

    await expect(readWorkbook(buffer)).rejects.toThrow('The workbook could not be parsed by the native engine: '
      + 'the file is an Excel Binary Workbook (.xlsb), which the built-in engine does not read. Save it as .xlsx.');
  });

  it('should refuse an Excel Binary Workbook by its main part\'s .bin name when no type is declared', async() => {
    const buffer = toArrayBuffer(await writeZip([
      {
        name: '_rels/.rels',
        data: encoder.encode(`<Relationships xmlns="${PACKAGE_REL}">`
          + `<Relationship Id="rId1" Type="${TRANSITIONAL_REL}/officeDocument" Target="xl/workbook.bin"/>`
          + '</Relationships>'),
      },
      { name: 'xl/workbook.bin', data: new Uint8Array([0x83, 0x01, 0x00, 0x80, 0x01, 0x00]) },
    ], true));

    await expect(readWorkbook(buffer)).rejects.toThrow('The workbook could not be parsed by the native engine: '
      + 'the file is an Excel Binary Workbook (.xlsb), which the built-in engine does not read. Save it as .xlsx.');
  });

  it('should name a Compound File through the whole read, not only through the ZIP reader', async() => {
    const cfb = new Uint8Array(4096);

    cfb.set([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);

    await expect(readWorkbook(cfb.buffer)).rejects.toThrow('The workbook could not be parsed by the native '
      + 'engine: the file is a legacy Excel 97-2003 workbook (.xls) or a password-protected workbook, '
      + 'which the built-in engine does not read. Save it as an unprotected .xlsx.');
  });
});

describe('native reader compatibility: a VBA project', () => {
  const MACRO_MAIN_TYPE = 'application/vnd.ms-excel.sheet.macroEnabled.main+xml';
  const vbaEntry = { name: 'xl/vbaProject.bin', data: new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xFF, 0x00]) };
  const oneSheet = () => [
    { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(3) },
  ];

  it('should read an .xlsm and record its VBA project as dropped', async() => {
    // The macros are not something the model can carry, and an `.xlsm` read silently as if it had
    // none; the project is reported instead, and the part itself is never opened.
    const buffer = await packWorkbook(oneSheet(), {
      mainContentType: MACRO_MAIN_TYPE,
      extraWorkbookRels: [`<Relationship Id="rIdVba" Type="${VBA_PROJECT_REL}" Target="vbaProject.bin"/>`],
      extraEntries: [vbaEntry],
    });
    const { snapshot, dropped } = await readWorkbook(buffer);

    expect(snapshot.sheets[0].rows[0][0].value).toBe(3);
    expect(dropped.list()).toEqual([DROPPED_FEATURES.vbaProject]);
    expect(dropped.count(DROPPED_FEATURES.vbaProject)).toBe(1);
  });

  it('should record a VBA project from the relationship alone, and from the entry alone', async() => {
    const byRel = await readWorkbook(await packWorkbook(oneSheet(), {
      mainContentType: MACRO_MAIN_TYPE,
      extraWorkbookRels: [`<Relationship Id="rIdVba" Type="${VBA_PROJECT_REL}" Target="vbaProject.bin"/>`],
    }));
    const byEntry = await readWorkbook(await packWorkbook(oneSheet(), { extraEntries: [vbaEntry] }));

    expect(byRel.dropped.list()).toEqual([DROPPED_FEATURES.vbaProject]);
    expect(byEntry.dropped.list()).toEqual([DROPPED_FEATURES.vbaProject]);
  });

  it('should read an .xlam add-in like an .xlsm, recording its VBA project as dropped', async() => {
    const buffer = await packWorkbook(oneSheet(), {
      mainContentType: 'application/vnd.ms-excel.addin.macroEnabled.main+xml',
      extraWorkbookRels: [`<Relationship Id="rIdVba" Type="${VBA_PROJECT_REL}" Target="vbaProject.bin"/>`],
      extraEntries: [vbaEntry],
    });
    const { snapshot, dropped } = await readWorkbook(buffer);

    expect(snapshot.sheets[0].rows[0][0].value).toBe(3);
    expect(dropped.list()).toEqual([DROPPED_FEATURES.vbaProject]);
  });

  it('should record nothing for a workbook without a VBA project', async() => {
    const { dropped } = await readWorkbook(await packWorkbook(oneSheet()));

    expect(dropped.list()).toEqual([]);
  });
});
