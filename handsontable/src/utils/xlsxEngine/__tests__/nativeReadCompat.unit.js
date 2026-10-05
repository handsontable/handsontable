/**
 * @jest-environment node
 */
import { nativeAdapter } from '../adapters/native';
import { DROPPED_FEATURES, DroppedFeatures } from '../capabilities';
import {
  MAX_FORMULA_LENGTH, MAX_SHEET_CELLS, MAX_SHEET_COLUMNS, MAX_TRANSLATED_FORMULA_CHARS, MAX_WORKBOOK_CELLS,
  isLimitError,
} from '../limits';
import { mapFormulaReferences, REFERENCE_REGEX } from '../formulaRefs';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';
import { parseSharedStrings } from '../adapters/native/parts/sharedStrings';
import { EMPTY_STYLES, parseStyles } from '../adapters/native/parts/styles';
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
 * @param {string} [options.relPrefix] The prefix the workbook part binds the relationships
 * namespace to, which its `<sheet>` elements then carry their id attribute under.
 * @param {boolean} [options.sheetOverrides] Whether to type each sheet part with an `<Override>`;
 * without one only the generic `<Default Extension="xml">` covers it.
 * @param {Function} [options.relTargetOf] Maps a sheet's part path to the relationship target written
 * for it, so a case can make the two spellings differ.
 * @returns {Promise<ArrayBuffer>}
 */
async function packWorkbook(sheets, {
  relNs = TRANSITIONAL_REL,
  sharedStrings = null,
  mainContentType = XLSX_MAIN_TYPE,
  withContentTypes = true,
  extraWorkbookRels = [],
  extraEntries = [],
  relPrefix = 'r',
  sheetOverrides = true,
  relTargetOf = part => part.replace(/^xl\//, ''),
} = {}) {
  const workbookRels = sheets.map((sheet, i) => (
    `<Relationship Id="rId${i + 1}" Type="${relNs}/${sheet.kind}" Target="${relTargetOf(sheet.part)}"/>`
  )).concat(extraWorkbookRels);
  const overrides = sheets
    .filter(sheet => sheet.xml !== null && sheetOverrides)
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
    data: encoder.encode(`<workbook ${NS} xmlns:${relPrefix}="${relNs}"><sheets>${
      sheets.map((sheet, i) => `<sheet name="${sheet.name}" sheetId="${i + 1}" ${relPrefix}:id="rId${i + 1}"/>`)
        .join('')
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
    // `/\[[^\]]*\]/g` re-scanned from every `[` when no `]` ever closed it, quadratic on a run of
    // them, and it ran once per numeric cell of a 1904 workbook: 40 000 brackets cost ~550 ms per
    // cell. The shift now asks `isTemporalFormatCode`, which must stay linear on the same run.
    const numFmt = `${'['.repeat(40000)}d`;
    const styles = { cellXfs: [{ numFmt, style: null, locked: null }], dxfs: [] };
    const xml = worksheetXml('<row r="1"><c r="A1" s="0"><v>1</v></c></row>');
    const started = performance.now();
    const { sheet } = readSheet(xml, { styles, date1904: true });
    const elapsed = performance.now() - started;

    // The shift asks the import's own classifier, which reads a run of `[` no `]` closes as no date
    // code at all, so the serial is left as written - what the import then shows it as.
    expect(sheet.rows[0][0].value).toBe(1);
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

describe('native reader compatibility: the date1904 shift asks the import\'s own classifier', () => {
  it('should shift a date format and leave an escaped letter or a currency word alone', () => {
    // The reader's own letter test saw the `h` of `0.0\h` (a literal h) and the `h` of `CHF` and
    // shifted both values by 1462 days, while the import, classifying the same codes, kept them
    // numbers - so the cell showed 1467 where the file holds 5.
    const styles = {
      cellXfs: [
        { numFmt: '0.0\\h', style: null, locked: null },
        { numFmt: 'CHF #,##0', style: null, locked: null },
        { numFmt: 'yyyy-mm-dd', style: null, locked: null },
      ],
      dxfs: [],
    };
    const xml = worksheetXml(
      '<row r="1"><c r="A1" s="0"><v>5</v></c><c r="B1" s="1"><v>5</v></c><c r="C1" s="2"><v>5</v></c></row>'
    );
    const { sheet } = readSheet(xml, { styles, date1904: true });

    expect(sheet.rows[0].map(cell => cell.value)).toEqual([5, 5, 1467]);
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

  it.each(['-350', '0', '260.5', '1e308', '7e15', 'NaN', '', '0x10', 'Infinity'])(
    'should ignore a <col> width of "%s" and keep the rest of the element', (width) => {
      const { sheet } = readSheet(colsXml(`<col min="1" max="2" width="${width}" hidden="1"/>`));

      expect(sheet.colWidths).toEqual([null, null]);
      expect(sheet.hiddenCols).toEqual([0, 1]);
    });

  // A 255-character column, Excel's UI maximum, is stored with its 5 px of cell padding added
  // (ECMA-376 18.3.1.13): 255.7109375 at a 7 px maximum digit width, so the cap sits above 255.
  it.each([['2.5', 2.5], ['255', 255], ['255.7109375', 255.7109375], ['260', 260], ['1e1', 10]])(
    'should keep a <col> width of "%s"', (width, expected) => {
      const { sheet } = readSheet(colsXml(`<col min="1" max="1" width="${width}"/>`));

      expect(sheet.colWidths).toEqual([expected]);
    });

  it('should read back the width of an exported 1800 px column', async() => {
    const snapshot = createWorkbookSnapshot();
    const builder = new SheetBuilder('Sheet1');

    // The export divides a pixel width by 7 px per width unit, so 1800 px is ~257.14 units.
    builder.setColWidth(1, 1800 / 7);
    builder.cell(1, 1).value = 'wide';
    snapshot.sheets.push(builder.toSnapshot());

    const bytes = await nativeAdapter.write(snapshot, undefined, new DroppedFeatures());
    const { snapshot: read } = await readWorkbook(toArrayBuffer(bytes));

    expect(Math.round(read.sheets[0].colWidths[0] * 7)).toBe(1800);
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

describe('native reader compatibility: threaded comments', () => {
  const COMMENTS_REL = `${TRANSITIONAL_REL}/comments`;
  const THREADED_COMMENT_REL = 'http://schemas.microsoft.com/office/2017/10/relationships/threadedComment';
  // The fixed text Excel 365 writes into the legacy `<comment>` of a threaded comment, ahead of the
  // thread itself, for applications that cannot read `xl/threadedComments/`.
  const BOILERPLATE = '[Threaded comment]\n\nYour version of Excel allows you to read this threaded comment; '
    + 'however, any edits to it will get removed if the file is opened in a newer version of Excel. '
    + 'Learn more: https://go.microsoft.com/fwlink/?linkid=870924\n\nComment:\n    ';

  /**
   * Builds the legacy comments part Excel 365 writes next to a threaded comment: authors named
   * `tc={GUID}`, one `<comment>` per thread carrying the boilerplate, and the thread's replies.
   *
   * @param {Array<{ ref: string, text: string }>} comments The legacy comments, text unescaped.
   * @returns {string}
   */
  function excel365CommentsXml(comments) {
    const uid = '{2D3B9B5E-0B1A-4C2E-9F44-6A0C6C1E7A11}';
    const list = comments.map(({ ref, text }) => (
      `<comment ref="${ref}" authorId="0" shapeId="0" xr:uid="${uid}">`
      + `<text><t xml:space="preserve">${text}</t></text></comment>`
    )).join('');

    return [
      `<comments ${NS} xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="xr"`,
      ' xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision">',
      `<authors><author>tc=${uid}</author></authors><commentList>${list}</commentList></comments>`,
    ].join('');
  }

  it('should import a threaded comment as its text and replies, and record the flattened thread once', async() => {
    // Excel 365 stores a thread in `xl/threadedComments/` and writes a legacy note for older
    // readers whose text is the "[Threaded comment] Your version of Excel..." boilerplate followed by
    // the thread. Reading that note verbatim imported the boilerplate as the comment.
    const sheet = worksheetXml('<row r="1"><c r="A1"><v>1</v></c><c r="B1"><v>2</v></c><c r="C1"><v>3</v></c></row>');
    const rels = `<Relationships xmlns="${PACKAGE_REL}">`
      + `<Relationship Id="rId1" Type="${THREADED_COMMENT_REL}" Target="../threadedComments/threadedComment1.xml"/>`
      + `<Relationship Id="rId2" Type="${COMMENTS_REL}" Target="../comments1.xml"/></Relationships>`;
    const sheets = [{ name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: sheet }];
    const buffer = await packWorkbook(sheets, {
      extraEntries: [
        { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: encoder.encode(rels) },
        {
          name: 'xl/comments1.xml',
          data: encoder.encode(excel365CommentsXml([
            {
              ref: 'A1',
              text: `${BOILERPLATE}Is this total right?\nReply:\n    Yes, checked it.\nReply:\n    Thanks!`,
            },
            { ref: 'B1', text: `${BOILERPLATE}Second thread` },
            // A plain note that only starts like the boilerplate keeps its text.
            { ref: 'C1', text: '[Threaded comment] is what I call these' },
          ])),
        },
        { name: 'xl/threadedComments/threadedComment1.xml', data: encoder.encode('<ThreadedComments/>') },
        { name: 'xl/persons/person.xml', data: encoder.encode('<personList/>') },
      ],
    });
    const { snapshot, dropped } = await readWorkbook(buffer);
    const [a1, b1, c1] = snapshot.sheets[0].rows[0];

    expect(a1.comment).toBe('Is this total right?\nYes, checked it.\nThanks!');
    expect(b1.comment).toBe('Second thread');
    expect(c1.comment).toBe('[Threaded comment] is what I call these');
    expect(dropped.list()).toEqual([DROPPED_FEATURES.threadedComments]);
    expect(dropped.count(DROPPED_FEATURES.threadedComments)).toBe(1);
  });
});

describe('native reader compatibility: a malformed sheet companion part', () => {
  const COMMENTS_REL = `${TRANSITIONAL_REL}/comments`;
  const sheetWithRels = rels => ({
    sheets: [{ name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(1) }],
    rels: { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: encoder.encode(rels) },
  });

  it('should wrap a malformed comments part like every other parse failure', async() => {
    // The sheet's rels and comments were parsed before the per-sheet `try`, so their failure
    // surfaced as a bare "The XML part is malformed" with no engine prefix.
    const { sheets, rels } = sheetWithRels(`<Relationships xmlns="${PACKAGE_REL}">`
      + `<Relationship Id="rId1" Type="${COMMENTS_REL}" Target="../comments1.xml"/></Relationships>`);
    const buffer = await packWorkbook(sheets, {
      extraEntries: [rels, { name: 'xl/comments1.xml', data: encoder.encode(`<comments ${NS}><commentList><`) }],
    });

    await expect(readWorkbook(buffer)).rejects.toThrow(
      /^The workbook could not be parsed by the native engine: The XML part is malformed/
    );
  });

  it('should wrap a malformed sheet relationships part', async() => {
    const { sheets, rels } = sheetWithRels(`<Relationships xmlns="${PACKAGE_REL}"><`);
    const buffer = await packWorkbook(sheets, { extraEntries: [rels] });

    await expect(readWorkbook(buffer)).rejects.toThrow(
      /^The workbook could not be parsed by the native engine: The XML part is malformed/
    );
  });
});

describe('native reader compatibility: list validations', () => {
  it('should hand every cell of one <dataValidation> the same validation object', () => {
    const { sheet } = readSheet(`<worksheet ${NS}><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c><c r="B1"><v>2</v></c></row>'
      + '<row r="2"><c r="A2"><v>3</v></c><c r="B2"><v>4</v></c></row>'
      + '</sheetData><dataValidations count="1">'
      + '<dataValidation type="list" allowBlank="1" sqref="A1:B1 A2"><formula1>"a,b"</formula1></dataValidation>'
      + '</dataValidations></worksheet>');
    const [[a1, b1], [a2, b2]] = sheet.rows;

    expect(a1.validation).toEqual({ type: 'list', formulae: ['"a,b"'], allowBlank: true });
    // One allocation per validation, not per cell: a whole-column range covers every row read.
    expect(b1.validation).toBe(a1.validation);
    expect(a2.validation).toBe(a1.validation);
    expect(b2.validation).toBeNull();
  });
});

describe('native reader compatibility: merges outside the read extent', () => {
  /**
   * A one-cell sheet under `<dimension ref="A1:A1"/>` with `count` merges far below it, after
   * `<col>` spans that spend all but `MAX_SHEET_CELLS - 4 997 120` of the sheet's span budget.
   *
   * @param {number} count How many out-of-extent merges to declare.
   * @returns {string}
   */
  function farMerges(count) {
    const cols = '<col min="1" max="16384"/>'.repeat(305);
    let merges = '';

    for (let i = 0; i < count; i++) {
      merges += `<mergeCell ref="Z${1000 + (i * 2)}:Z${1001 + (i * 2)}"/>`;
    }

    return `<worksheet ${NS}><dimension ref="A1:A1"/><cols>${cols}</cols><sheetData>`
      + `<row r="1"><c r="A1"><v>1</v></c></row></sheetData><mergeCells>${merges}</mergeCells></worksheet>`;
  }

  it('should drop a merge that clamps to nothing rather than keep it on the snapshot', () => {
    // A merge wholly outside the sheet's extent was skipped by the materializing pass but left in
    // `sheet.merges`, uncharged, so a tiny sheet could carry any number of them.
    const { sheet } = readSheet(farMerges(40));

    expect(sheet.merges).toEqual([]);
    expect(sheet.rows.length).toBe(1);
  });

  it('should charge every <mergeCell> against the span budget as it is collected', () => {
    const left = MAX_SHEET_CELLS - (305 * 16384);

    expect(left).toBe(2880);
    expect(() => readSheet(farMerges(left))).not.toThrow();
    expect(() => readSheet(farMerges(left + 1))).toThrow(new RegExp(`covering more than ${MAX_SHEET_CELLS} cells`));
  });
});

describe('native reader compatibility: the row count follows the rows', () => {
  it('should size the sheet by its last <row>, using <dimension> for the cap check only', () => {
    // ExcelJS counts the rows it reads, so three rows under `A1:B5000` are three rows there and were
    // 5000 here — the import then built a 5000-row grid out of a three-row sheet.
    const { sheet } = readSheet(`<worksheet ${NS}><dimension ref="A1:B5000"/><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c></row><row r="2"><c r="B2"><v>2</v></c></row>'
      + '<row r="3"><c r="A3"><v>3</v></c></row></sheetData></worksheet>');

    expect(sheet.rows.length).toBe(3);
    expect(sheet.rowHeights.length).toBe(3);
    expect(sheet.rows[2][0].value).toBe(3);
  });

  it('should count a trailing empty <row> as a row, like a row with cells', () => {
    const { sheet } = readSheet(`<worksheet ${NS}><dimension ref="A1:A9"/><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c></row><row r="7"/></sheetData></worksheet>');

    expect(sheet.rows.length).toBe(7);
    expect(sheet.rows[6]).toEqual([]);
  });

  it('should still refuse a declared rectangle above the caps', () => {
    expect(() => readSheet(`<worksheet ${NS}><dimension ref="A1:A1048577"/><sheetData/></worksheet>`))
      .toThrow(/declares 1048577 rows, above the 1048576-row limit/);
  });
});

describe('native reader compatibility: list validations over cells that hold nothing', () => {
  const VALIDATION = '<dataValidations count="1"><dataValidation type="list" sqref="A1:E1000000">'
    + '<formula1>"a,b"</formula1></dataValidation></dataValidations>';

  it('should not materialize a declared rectangle that no row fills', () => {
    // A 1.7 kB archive: a million-row dimension, no `<row>`, one validation over the rectangle,
    // which allocated a cell snapshot per covered cell (+646 MB) and a million-row grid.
    const { sheet } = readSheet(`<worksheet ${NS}><dimension ref="A1:E1000000"/><sheetData/>${VALIDATION}</worksheet>`);

    expect(sheet.rows.length).toBe(0);
  });

  it('should share one cell object between the empty slots one validation covers', () => {
    const { sheet } = readSheet(`<worksheet ${NS}><dimension ref="A1:B3"/><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c></row><row r="2"/><row r="3"><c r="B3"><v>2</v></c></row>'
      + '</sheetData><dataValidations count="2">'
      + '<dataValidation type="list" sqref="A1:B3"><formula1>"a,b"</formula1></dataValidation>'
      + '<dataValidation type="list" sqref="B3"><formula1>"c"</formula1></dataValidation>'
      + '</dataValidations></worksheet>');
    const [[a1, b1], [a2, b2], [a3, b3]] = sheet.rows;

    expect(a1.value).toBe(1);
    expect(a1.validation).toEqual({ type: 'list', formulae: ['"a,b"'], allowBlank: false });
    expect(b1).toEqual({
      value: null, formula: null, numFmt: null, style: null, locked: null, comment: null, validation: a1.validation,
    });
    // One object for every slot that held nothing, rather than a snapshot per covered cell.
    expect(a2).toBe(b1);
    expect(b2).toBe(b1);
    expect(a3).toBe(b1);
    // A cell the sheet holds takes the validation itself; the later one wins its slot without
    // rewriting the object the earlier one shares.
    expect(b3.value).toBe(2);
    expect(b3.validation).toEqual({ type: 'list', formulae: ['"c"'], allowBlank: false });
    expect(b1.validation).toBe(a1.validation);
  });

  it('should clamp a validation to the columns the sheet uses, not to the declared dimension', () => {
    // A sparse sheet (A1 and A1000) under a matching five-column dimension: clamping to the
    // dimension's width walked and materialized every slot of the rectangle, and the mapper then
    // kept one meta entry per slot. The ExcelJS adapter reads a validation only on the cells it
    // walks, so neither engine widens a sheet for a validation.
    const { sheet } = readSheet(`<worksheet ${NS}><dimension ref="A1:E1000"/><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c></row><row r="1000"><c r="A1000"><v>2</v></c></row></sheetData>'
      + '<dataValidations count="1"><dataValidation type="list" sqref="A1:E1000">'
      + '<formula1>"a,b"</formula1></dataValidation></dataValidations></worksheet>');

    expect(sheet.rows.length).toBe(1000);
    expect(sheet.rows.every(row => row.length <= 1)).toBe(true);
    expect(sheet.rows[0][0].validation).toEqual({ type: 'list', formulae: ['"a,b"'], allowBlank: false });
    expect(sheet.rows[499][0].validation).toEqual({ type: 'list', formulae: ['"a,b"'], allowBlank: false });
  });
});

describe('native reader compatibility: the workbook cell budget is charged before the cells exist', () => {
  // Each part ends malformed, so a refusal raised only once the whole part was read would surface as
  // the tokenizer's own error instead of as the budget's.
  it('should refuse a sheet whose <dimension> crosses the workbook budget before reading a row', () => {
    const budget = { declaredCells: MAX_WORKBOOK_CELLS - 100 };
    const xml = `<worksheet ${NS}><dimension ref="A1:B100"/><sheetData><row r="1"><c r="A1"><v>1</v></c></row><`;

    expect(() => readSheet(xml, { budget })).toThrow(/^The workbook declares \d+ cells across its sheets/);
  });

  it('should refuse cells crossing the remaining workbook budget as they are read, with no dimension', () => {
    const budget = { declaredCells: MAX_WORKBOOK_CELLS - 50 };
    let rows = '';

    for (let r = 1; r <= 60; r++) {
      rows += `<row r="${r}"><c r="A${r}"><v>1</v></c></row>`;
    }

    expect(() => readSheet(`<worksheet ${NS}><sheetData>${rows}<`, { budget }))
      .toThrow(/^The workbook declares \d+ cells across its sheets/);
  });

  it('should charge a sheet once, for what it really holds, after the dimension charged it up front', () => {
    const budget = { declaredCells: 0 };

    readSheet(`<worksheet ${NS}><dimension ref="A1:B100"/><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c><c r="B1"><v>2</v></c></row>'
      + '<row r="2"><c r="A2"><v>3</v></c></row><row r="3"><c r="B3"><v>4</v></c></row>'
      + '</sheetData></worksheet>', { budget });

    // Three rows by two columns, plus the two-column layout: never the declared 100 x 2 on top.
    expect(budget.declaredCells).toBe((3 * 2) + 2);
  });
});

describe('native reader compatibility: the shared-formula translation budget, measured', () => {
  it('should keep the budget at 32 Mi characters, measured against this exact reference regex', () => {
    // The per-character cost that sizes this budget (0.28-0.32 us on a developer machine, 0.58-0.84 us
    // on a reviewer's, so about 10-28 s at 32 Mi) is a measurement of `REFERENCE_REGEX` and lives in
    // the `MAX_TRANSLATED_FORMULA_CHARS` comment in `limits.ts`. A wall-clock bound here flaked under
    // parallel Jest workers, so the guard is deterministic instead: the regex the figures were taken
    // with is pinned, and changing it (or the budget) fails here until the figures are re-measured
    // and this pin is updated with them.
    expect(MAX_TRANSLATED_FORMULA_CHARS).toBe(32 * 1024 * 1024);
    expect(REFERENCE_REGEX.flags).toBe('giu');
    expect(REFERENCE_REGEX.source).toBe(
      String.raw`(?<literal>"(?:[^"]|"")*")`
      + String.raw`|(?<qualifier>(?:(?<!')'(?:[^']|''){0,255}'|(?<![\p{L}\p{N}_.])[\p{L}\p{N}_.]+)!)`
      + String.raw`(?<qualified>\$?[A-Z]{1,3}\$?\d{1,7}(?![\d(])(?::\$?[A-Z]{1,3}\$?\d{1,7}(?![\d(]))?`
      + String.raw`|\$?[A-Z]{1,3}:\$?[A-Z]{1,3}(?![\p{L}\p{N}_(])|\$?\d{1,7}:\$?\d{1,7}(?![\d\p{L}]))`
      + String.raw`|(?<![\p{L}\p{N}_.$])(?<colAbs>\$?)(?<colLetters>[A-Z]{1,3})(?<rowAbs>\$?)`
      + String.raw`(?<rowDigits>\d{1,7})(?![\d(])`
      + String.raw`|(?<![\p{L}\p{N}_.$])(?<c1Abs>\$?)(?<c1>[A-Z]{1,3}):(?<c2Abs>\$?)(?<c2>[A-Z]{1,3})(?![\p{L}\p{N}_(])`
      + String.raw`|(?<![\p{L}\p{N}_.$:])(?<r1Abs>\$?)(?<r1>\d{1,7}):(?<r2Abs>\$?)(?<r2>\d{1,7})(?![\d\p{L}])`
    );
  });

  it('should map each reference of the worst-case master once, in a single pass', () => {
    // A dense run of references is the worst case the budget is sized for. The translation walks it
    // once: one map call per reference, never a re-scan per rewrite.
    const master = 'A1+'.repeat(10922);
    let calls = 0;

    mapFormulaReferences(master, (reference) => {
      calls += 1;

      return { row: reference.row, col: reference.col };
    }, { qualified: true });

    expect(calls).toBe(10922);
  });
});

describe('native reader compatibility: <sheetProtection> without sheet="1"', () => {
  it('should read the sheet as protected only when the sheet attribute says so', () => {
    // The schema defaults `sheet` to false: a file carrying only `<sheetProtection formatCells="0"/>`
    // (Apache POI writes those) is an OPEN sheet in Excel, and every cell imported read-only.
    const protectionOf = attrs => readSheet(`<worksheet ${NS}><sheetData/><sheetProtection ${attrs}/></worksheet>`)
      .sheet.protection;

    expect(protectionOf('formatCells="0"')).toBeNull();
    expect(protectionOf('sheet="0" formatCells="0" hashValue="x"')).toBeNull();
    expect(protectionOf('sheet="1" formatCells="0"')).toEqual({
      enabled: true, password: null, options: { sheet: true, formatCells: true },
    });
    expect(protectionOf('sheet="true"').enabled).toBe(true);
  });

  it('should record a password hash only on a sheet that is protected', () => {
    const droppedOf = attrs => readSheet(`<worksheet ${NS}><sheetData/><sheetProtection ${attrs}/></worksheet>`)
      .dropped.list();

    expect(droppedOf('sheet="0" hashValue="x"')).toEqual([]);
    expect(droppedOf('sheet="1" hashValue="x"')).toEqual(['sheetProtection:password']);
  });
});

describe('native reader compatibility: a merge with no <dimension> to bound it', () => {
  it('should widen the sheet to a merge whose covered cells carry no <c>', () => {
    // openpyxl's write-only mode and ExcelJS's streaming writer emit no `<dimension>`, and the clamp
    // fell back to the widest row, so `A1:C1` over a one-cell row read back one column wide.
    const { sheet } = readSheet(`<worksheet ${NS}><sheetData><row r="1"><c r="A1"/></row></sheetData>`
      + '<mergeCells count="1"><mergeCell ref="A1:C1"/></mergeCells></worksheet>');

    expect(sheet.rows[0]).toHaveLength(3);
    expect(sheet.merges).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 3 }]);
  });

  it('should still clamp such a merge to the rows that exist', () => {
    const { sheet } = readSheet(`<worksheet ${NS}><sheetData><row r="1"><c r="A1"><v>1</v></c></row>`
      + '</sheetData><mergeCells count="1"><mergeCell ref="A1:B9"/></mergeCells></worksheet>');

    expect(sheet.rows.length).toBe(1);
    expect(sheet.rows[0]).toHaveLength(2);
  });
});

describe('native reader compatibility: list validations stored in <extLst>', () => {
  const X14 = 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main';
  const XM = 'http://schemas.microsoft.com/office/excel/2006/main';

  /**
   * A three-row sheet whose only validation lives in the x14 extension.
   *
   * @param {string} validation The `<x14:dataValidation>` element.
   * @returns {string}
   */
  function withExtValidation(validation) {
    return `<worksheet ${NS} xmlns:x14="${X14}" xmlns:xm="${XM}"><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c></row><row r="2"><c r="A2"><v>2</v></c></row>'
      + '<row r="3"><c r="A3"><v>3</v></c></row></sheetData>'
      + '<extLst><ext uri="{CCE6A557-97BC-4b89-ADB6-D9C93CAAB3DF}">'
      + `<x14:dataValidations count="1">${validation}</x14:dataValidations></ext></extLst></worksheet>`;
  }

  it('should read an x14 list validation, whose source is on another sheet, onto its cells', () => {
    // Excel 2010+ stores a list whose source range is on another sheet ONLY here, and the reader
    // ignored the extension, so the dropdown was lost with nothing recorded.
    const { sheet, dropped } = readSheet(withExtValidation(
      '<x14:dataValidation type="list" allowBlank="1" showErrorMessage="1">'
      + '<x14:formula1><xm:f>Lists!$A$1:$A$3</xm:f></x14:formula1><xm:sqref>A1:A2</xm:sqref>'
      + '</x14:dataValidation>'
    ));

    expect(sheet.rows[0][0].validation).toEqual({ type: 'list', formulae: ['Lists!$A$1:$A$3'], allowBlank: true });
    expect(sheet.rows[1][0].validation).toBe(sheet.rows[0][0].validation);
    expect(sheet.rows[2][0].validation).toBeNull();
    expect(dropped.list()).toEqual([]);
  });

  it('should record an x14 validation of another kind the way a main one is recorded', () => {
    const { sheet, dropped } = readSheet(withExtValidation(
      '<x14:dataValidation type="whole" operator="between"><x14:formula1><xm:f>Lists!$B$1</xm:f></x14:formula1>'
      + '<x14:formula2><xm:f>10</xm:f></x14:formula2><xm:sqref>A1</xm:sqref></x14:dataValidation>'
    ));

    expect(sheet.rows[0][0].validation).toBeNull();
    expect(dropped.list()).toEqual(['dataValidation:whole']);
  });
});

describe('native reader compatibility: a cell style index read as written', () => {
  it('should resolve s only from its unsignedInt form', () => {
    // `Number()` read `s="0x1"` and `s="1e0"` as 1 and resolved the date format of xf 1; neither is
    // an index the schema allows, so both read as the default format.
    const styles = parseStyles('<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>');
    const { sheet } = readSheet(`<worksheet ${NS}><sheetData><row r="1">`
      + '<c r="A1" s="1"><v>1</v></c><c r="B1" s="0x1"><v>1</v></c><c r="C1" s="1e0"><v>1</v></c>'
      + '<c r="D1" s=""><v>1</v></c></row></sheetData></worksheet>', { styles });

    expect(sheet.rows[0].map(cell => cell.numFmt)).toEqual(['mm-dd-yy', null, null, null]);
  });
});

describe('native reader compatibility: package names and declarations', () => {
  it('should resolve a sheet whose relationship id sits under a prefix other than r', async() => {
    // Any prefix may name the relationships namespace; the id was read under the literal `r:id`
    // only, so `rel:id` left the sheet with no part and refused the whole read.
    const { snapshot } = await readWorkbook(await packWorkbook([
      { name: 'Data', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(7) },
    ], { relPrefix: 'rel' }));

    expect(snapshot.sheets.map(sheet => sheet.name)).toEqual(['Data']);
    expect(snapshot.sheets[0].rows[0][0].value).toBe(7);
  });

  it('should read a sheet typed only by the generic <Default Extension="xml">', async() => {
    // Nothing in OPC requires an `<Override>` per sheet, and a package whose sheets fall back to
    // `application/xml` was refused as having "no worksheet part".
    const { snapshot } = await readWorkbook(await packWorkbook([
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(5) },
    ], { sheetOverrides: false }));

    expect(snapshot.sheets[0].rows[0][0].value).toBe(5);
  });

  it('should still refuse a sheet pointed at the workbook part under the generic default', async() => {
    const buffer = await packWorkbook([
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(5) },
    ], { sheetOverrides: false, relTargetOf: () => 'workbook.xml' });

    await expect(readWorkbook(buffer)).rejects.toThrow(/the sheet "Sheet1" has no worksheet part/);
  });

  it('should match part names case-insensitively, as OPC does', async() => {
    // `xl/worksheets/Sheet1.xml` is the same part as `xl/worksheets/sheet1.xml` in OPC, and a
    // relationship naming it in the other case was refused as having no part.
    const { snapshot } = await readWorkbook(await packWorkbook([
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/Sheet1.xml', xml: oneCellSheet(3) },
    ], { relTargetOf: () => 'worksheets/sheet1.xml' }));

    expect(snapshot.sheets[0].rows[0][0].value).toBe(3);
  });

  it('should keep the package floor case-insensitive too', async() => {
    const buffer = await packWorkbook([
      { name: 'Sheet1', kind: 'worksheet', part: 'xl/worksheets/sheet1.xml', xml: oneCellSheet(5) },
    ], { relTargetOf: () => '/XL/Workbook.xml' });

    await expect(readWorkbook(buffer)).rejects.toThrow(/the sheet "Sheet1" has no worksheet part/);
  });
});
