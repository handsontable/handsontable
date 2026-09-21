/**
 * @jest-environment node
 */
import Encryptor from 'exceljs/lib/utils/encryptor';
import {
  contentTypesXml, rootRelsXml, workbookRelsXml, workbookXml, sheetRelsXml, coreXml, appXml,
  parseRels, parseWorkbook, resolvePartPath, REL_TYPES,
} from '../adapters/native/parts/package';
import { SharedStringTable, parseSharedStrings } from '../adapters/native/parts/sharedStrings';
import { commentsXml, vmlDrawingXml, parseComments } from '../adapters/native/parts/comments';
import { dataValidationsXml } from '../adapters/native/parts/dataValidation';
import {
  conditionalFormattingXml, cfRuleFromXml, maxRulePriority,
} from '../adapters/native/parts/conditionalFormatting';
import { StyleTable, parseStyles, EMPTY_STYLES } from '../adapters/native/parts/styles';
import { hashSheetPassword, SHEET_PASSWORD_SPIN_COUNT } from '../adapters/native/parts/protection';
import { worksheetXml } from '../adapters/native/parts/worksheetWriter';
import { parseWorksheet, assertSheetFits } from '../adapters/native/parts/worksheetReader';
import { DroppedFeatures } from '../capabilities';
import { SheetBuilder } from '../builder';
import { MAX_SHEET_CELLS } from '../limits';

const sheets = [
  { index: 1, name: 'Data', state: 'visible', hasComments: true },
  { index: 2, name: '_HotValidation', state: 'veryHidden', hasComments: false },
];

describe('package parts', () => {
  it('should declare every part in [Content_Types].xml, the vml default only when a sheet has comments', () => {
    const xml = contentTypesXml(sheets, true);

    expect(xml).toContain(
      '<Default Extension="rels" '
      + 'ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    );
    expect(xml).toContain(
      '<Default Extension="vml" '
      + 'ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/>',
    );
    expect(xml).toContain(
      '<Override PartName="/xl/workbook.xml" '
      + 'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    );
    expect(xml).toContain('<Override PartName="/xl/worksheets/sheet2.xml"');
    expect(xml).toContain(
      '<Override PartName="/xl/comments1.xml" '
      + 'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml"/>',
    );
    expect(xml).not.toContain('/xl/comments2.xml');
    expect(xml).toContain('<Override PartName="/xl/sharedStrings.xml"');
    expect(xml).toContain('<Override PartName="/xl/styles.xml"');
    expect(xml).toContain('/docProps/core.xml');
    expect(xml).toContain('/docProps/app.xml');

    expect(contentTypesXml([{ ...sheets[0], hasComments: false }], false)).not.toMatch(/vml|sharedStrings/);
  });

  it('should relate the root to the workbook and both docProps parts', () => {
    const rels = parseRels(rootRelsXml());

    expect(rels).toEqual([
      { id: 'rId1', type: REL_TYPES.officeDocument, target: 'xl/workbook.xml' },
      { id: 'rId2', type: REL_TYPES.coreProperties, target: 'docProps/core.xml' },
      { id: 'rId3', type: REL_TYPES.extendedProperties, target: 'docProps/app.xml' },
    ]);
  });

  it('should relate the workbook to styles, shared strings and every sheet, and hand the sheet ids back', () => {
    const { xml, sheetRelIds } = workbookRelsXml(sheets, true);
    const rels = parseRels(xml);

    expect(rels.map(r => r.type)).toEqual([
      REL_TYPES.styles, REL_TYPES.sharedStrings, REL_TYPES.worksheet, REL_TYPES.worksheet,
    ]);
    expect(rels.map(r => r.target)).toEqual([
      'styles.xml', 'sharedStrings.xml', 'worksheets/sheet1.xml', 'worksheets/sheet2.xml',
    ]);
    expect(sheetRelIds).toEqual(['rId3', 'rId4']);
    expect(workbookRelsXml(sheets, false).sheetRelIds).toEqual(['rId2', 'rId3']);
  });

  it('should write and read back the sheet list with states, and the full-calc flag', () => {
    const xml = workbookXml(sheets, ['rId3', 'rId4'], true);

    expect(xml).toContain('<sheet name="Data" sheetId="1" r:id="rId3"/>');
    expect(xml).toContain('<sheet name="_HotValidation" sheetId="2" state="veryHidden" r:id="rId4"/>');
    expect(xml).toContain('<calcPr calcId="171027" fullCalcOnLoad="1"/>');
    expect(xml.indexOf('<bookViews>')).toBeLessThan(xml.indexOf('<sheets>'));
    expect(xml.indexOf('<sheets>')).toBeLessThan(xml.indexOf('<calcPr'));
    expect(workbookXml(sheets, ['rId3', 'rId4'], false)).toContain('<calcPr calcId="171027"/>');

    expect(parseWorkbook(xml)).toEqual({
      sheets: [
        { name: 'Data', relId: 'rId3', state: 'visible' },
        { name: '_HotValidation', relId: 'rId4', state: 'veryHidden' },
      ],
      date1904: false,
    });
    expect(parseWorkbook('<workbook><workbookPr date1904="1"/><sheets/></workbook>').date1904).toBe(true);
  });

  it('should escape a sheet name with markup characters', () => {
    expect(workbookXml([{ index: 1, name: 'A & B', state: 'visible', hasComments: false }], ['rId2'], false))
      .toContain('name="A &amp; B"');
  });

  it('should relate a sheet to its comments and legacy drawing', () => {
    expect(parseRels(sheetRelsXml(3))).toEqual([
      { id: 'rId1', type: REL_TYPES.comments, target: '../comments3.xml' },
      { id: 'rId2', type: REL_TYPES.vmlDrawing, target: '../drawings/vmlDrawing3.vml' },
    ]);
  });

  it('should resolve relative and absolute relationship targets against the source part', () => {
    expect(resolvePartPath('xl/worksheets/sheet1.xml', '../comments1.xml')).toBe('xl/comments1.xml');
    expect(resolvePartPath('xl/workbook.xml', 'worksheets/sheet1.xml')).toBe('xl/worksheets/sheet1.xml');
    expect(resolvePartPath('xl/workbook.xml', '/xl/styles.xml')).toBe('xl/styles.xml');
    // The root `.rels` resolves against the package root, so the reader passes an empty base part.
    expect(resolvePartPath('', 'xl/workbook.xml')).toBe('xl/workbook.xml');
  });

  it('should name the author and list the sheets in docProps', () => {
    const core = coreXml('Handsontable', new Date('2026-01-02T03:04:05.678Z'));

    expect(core).toContain('<dc:creator>Handsontable</dc:creator>');
    expect(core).toContain('<cp:lastModifiedBy>Handsontable</cp:lastModifiedBy>');
    expect(core).toContain('<dcterms:created xsi:type="dcterms:W3CDTF">2026-01-02T03:04:05Z</dcterms:created>');
    expect(appXml(['Data', 'Other'])).toContain(
      '<vt:vector size="2" baseType="lpstr">'
      + '<vt:lpstr>Data</vt:lpstr><vt:lpstr>Other</vt:lpstr></vt:vector>',
    );
  });
});

describe('shared strings', () => {
  it('should dedupe strings, count every reference and preserve edge whitespace', () => {
    const table = new SharedStringTable();

    expect(table.add('a')).toBe(0);
    expect(table.add(' b ')).toBe(1);
    expect(table.add('a')).toBe(0);
    expect(table.count).toBe(3);
    expect(table.uniqueCount).toBe(2);

    const xml = table.toXml();

    expect(xml).toContain(
      '<sst '
      + 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="2">',
    );
    expect(xml).toContain('<si><t>a</t></si><si><t xml:space="preserve"> b </t></si>');
  });

  it('should parse plain and rich entries, joining runs and flagging the rich ones', () => {
    const xml = '<sst xmlns="x" count="3" uniqueCount="3">'
      + '<si><t>plain</t></si>'
      + '<si><r><rPr><b/></rPr><t>bold</t></r><r><t xml:space="preserve"> plain</t></r></si>'
      + '<si><t>a_x000D_b</t><phoneticPr fontId="1"/></si>'
      + '</sst>';

    expect(parseSharedStrings(xml)).toEqual({
      strings: ['plain', 'bold plain', 'a\rb'],
      rich: [false, true, false],
    });
  });

  it('should ignore phonetic runs (rPh) so Japanese furigana does not leak into the value', () => {
    const xml = '<sst><si><t>漢字</t><rPh sb="0" eb="2"><t>かんじ</t></rPh></si></sst>';

    expect(parseSharedStrings(xml).strings).toEqual(['漢字']);
  });
});

describe('comments', () => {
  const comments = [
    { ref: 'B2', row: 1, col: 1, text: 'first note' },
    { ref: 'D5', row: 4, col: 3, text: ' spaced <note> ' },
  ];

  it('should write one comment per cell under a single author', () => {
    const xml = commentsXml(comments, 'Handsontable');

    expect(xml).toContain('<authors><author>Handsontable</author></authors>');
    expect(xml).toContain('<comment ref="B2" authorId="0"><text><r><t>first note</t></r></text></comment>');
    expect(xml).toContain(
      '<comment ref="D5" authorId="0"><text><r>'
      + '<t xml:space="preserve"> spaced &lt;note&gt; </t></r></text></comment>',
    );
  });

  it('should write the VML shape Excel needs to show the note, one per comment, 0-based anchors', () => {
    const vml = vmlDrawingXml(comments);

    expect(vml).toContain('<v:shapetype id="_x0000_t202"');
    expect(vml).toContain('<v:shape id="_x0000_s1025" type="#_x0000_t202"');
    expect(vml).toContain('<v:shape id="_x0000_s1026"');
    expect(vml).toContain('<x:ClientData ObjectType="Note">');
    expect(vml).toContain('<x:Row>1</x:Row><x:Column>1</x:Column>');
    expect(vml).toContain('<x:Row>4</x:Row><x:Column>3</x:Column>');
    expect(vml).toContain('<x:Anchor>2, 6, 0, 14, 4, 2, 4, 16</x:Anchor>');
  });

  it('should parse comments back, joining runs and skipping phonetic runs', () => {
    const parsed = parseComments(commentsXml(comments, 'x'));

    expect(Array.from(parsed.entries())).toEqual([['B2', 'first note'], ['D5', ' spaced <note> ']]);

    const excelLike = '<comments><authors><author>A</author></authors><commentList>'
      + '<comment ref="A1" authorId="0"><text><r><rPr><b/></rPr><t>Author:</t>'
      + '</r><r><t xml:space="preserve">\nbody_x000D_</t></r></text></comment>'
      + '</commentList></comments>';

    expect(parseComments(excelLike).get('A1')).toBe('Author:\nbody\r');
  });
});

describe('dataValidationsXml', () => {
  it('should return an empty string when no cell carries a validation', () => {
    expect(dataValidationsXml([])).toBe('');
  });

  it('should coalesce identical validations into vertical runs on one sqref and keep others apart', () => {
    const list = { type: 'list', formulae: ['\'_HotValidation\'!$A$1:$A$3'], allowBlank: true };
    const inline = { type: 'list', formulae: ['"a,b"'], allowBlank: false };
    const xml = dataValidationsXml([
      { row: 1, col: 0, validation: list },
      { row: 2, col: 0, validation: list },
      { row: 3, col: 0, validation: list },
      { row: 5, col: 0, validation: list },
      { row: 1, col: 2, validation: list },
      { row: 1, col: 1, validation: inline },
    ]);

    expect(xml).toContain('<dataValidations count="2">');
    expect(xml).toContain(
      '<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="A2:A4 A6 C2">'
      + '<formula1>&apos;_HotValidation&apos;!$A$1:$A$3</formula1></dataValidation>',
    );
    expect(xml).toContain(
      '<dataValidation type="list" showErrorMessage="1" sqref="B2">'
      + '<formula1>&quot;a,b&quot;</formula1></dataValidation>',
    );
  });
});

describe('conditional formatting', () => {
  it('should write cellIs, expression and the containsText family with dxf styles and running priorities', () => {
    const styles = new StyleTable();
    const dropped = new DroppedFeatures();
    const rules = [
      { type: 'cellIs', operator: 'greaterThan', formulae: [100], style: { font: { bold: true } } },
      { type: 'expression', formulae: ['MOD(ROW(),2)=0'], priority: 7 },
      { type: 'containsText', operator: 'containsText', text: 'urgent' },
      { type: 'containsText', operator: 'containsBlanks' },
    ];
    const xml = conditionalFormattingXml('B2:D9', rules, styles, { next: 1 }, dropped);

    expect(xml).toContain('<conditionalFormatting sqref="B2:D9">');
    expect(xml).toContain(
      '<cfRule type="cellIs" dxfId="0" priority="1" operator="greaterThan">'
      + '<formula>100</formula></cfRule>',
    );
    expect(xml).toContain('<cfRule type="expression" priority="7"><formula>MOD(ROW(),2)=0</formula></cfRule>');
    expect(xml).toContain(
      '<cfRule type="containsText" priority="2" operator="containsText" text="urgent">'
      + '<formula>NOT(ISERROR(SEARCH(&quot;urgent&quot;,B2)))</formula></cfRule>',
    );
    expect(xml).toContain(
      '<cfRule type="containsBlanks" priority="3" operator="containsBlanks">'
      + '<formula>LEN(TRIM(B2))=0</formula></cfRule>',
    );
    expect(dropped.list()).toEqual([]);
  });

  it('should write top10, aboveAverage and timePeriod rules with their own attributes', () => {
    const styles = new StyleTable();
    const dropped = new DroppedFeatures();
    const xml = conditionalFormattingXml('B2:B9', [
      { type: 'top10', rank: 5, percent: true, style: { font: { bold: true } } },
      { type: 'top10' },
      { type: 'top10', rank: 3, bottom: true },
      { type: 'aboveAverage', aboveAverage: false },
      { type: 'aboveAverage' },
      { type: 'timePeriod', timePeriod: 'today', formulae: ['FLOOR(B2,1)=TODAY()'] },
    ], styles, { next: 1 }, dropped);

    expect(xml).toContain('<cfRule type="top10" dxfId="0" priority="1" rank="5" percent="1"/>');
    // No rank given falls back to Excel's own default of 10; percent and bottom are omitted when off.
    expect(xml).toContain('<cfRule type="top10" priority="2" rank="10"/>');
    expect(xml).toContain('<cfRule type="top10" priority="3" rank="3" bottom="1"/>');
    // `aboveAverage="0"` is how "below average" is written; the default is omitted.
    expect(xml).toContain('<cfRule type="aboveAverage" priority="4" aboveAverage="0"/>');
    expect(xml).toContain('<cfRule type="aboveAverage" priority="5"/>');
    expect(xml).toContain(
      '<cfRule type="timePeriod" priority="6" timePeriod="today">'
      + '<formula>FLOOR(B2,1)=TODAY()</formula></cfRule>',
    );
    expect(dropped.list()).toEqual([]);
  });

  it('should drop a timePeriod rule that names no period or carries no formula', () => {
    const dropped = new DroppedFeatures();

    expect(conditionalFormattingXml('A1:A3', [
      { type: 'timePeriod', timePeriod: 'today' },
      { type: 'timePeriod', formulae: ['TRUE()'] },
    ], new StyleTable(), { next: 1 }, dropped)).toBe('');
    expect(dropped.list()).toEqual(['conditionalFormatting:timePeriod']);
  });

  it('should drop the rule kinds the PoC does not write and skip the block when nothing is left', () => {
    const dropped = new DroppedFeatures();
    const xml = conditionalFormattingXml('A1:A3', [
      { type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }] },
      { type: 'iconSet' },
      'not a rule',
    ], new StyleTable(), { next: 1 }, dropped);

    expect(xml).toBe('');
    expect(dropped.list()).toEqual([
      'conditionalFormatting:dataBar', 'conditionalFormatting:iconSet', 'conditionalFormatting:invalid',
    ]);
  });

  it('should continue priorities above the highest one any rule declares', () => {
    expect(maxRulePriority([{ rules: [{ priority: 4 }, {}] }, { rules: [{ priority: 9 }] }])).toBe(9);
    expect(maxRulePriority([{ rules: [{}] }])).toBe(0);
  });

  it('should rebuild ExcelJS-shaped rule objects from cfRule attributes', () => {
    const dxfs = [{ font: { bold: true } }];

    expect(cfRuleFromXml({ type: 'cellIs', operator: 'greaterThan', priority: '1', dxfId: '0' }, ['2'], dxfs))
      .toEqual({
        type: 'cellIs', operator: 'greaterThan', priority: 1, formulae: ['2'], style: { font: { bold: true } },
      });
    expect(cfRuleFromXml({ type: 'containsBlanks', priority: '2' }, ['LEN(TRIM(A1))=0'], dxfs))
      .toEqual({ type: 'containsText', operator: 'containsBlanks', priority: 2, formulae: ['LEN(TRIM(A1))=0'] });
    expect(cfRuleFromXml({ type: 'containsText', operator: 'containsText', text: 'x', priority: '3' }, [], dxfs))
      .toEqual({ type: 'containsText', operator: 'containsText', text: 'x', priority: 3 });
    expect(cfRuleFromXml({ type: 'top10', rank: '5', percent: '1', priority: '4' }, [], dxfs))
      .toEqual({ type: 'top10', rank: 5, percent: true, bottom: false, priority: 4 });
    expect(cfRuleFromXml({ type: 'aboveAverage', aboveAverage: '0', priority: '5' }, [], dxfs))
      .toEqual({ type: 'aboveAverage', aboveAverage: false, priority: 5 });
    expect(cfRuleFromXml({ type: 'duplicateValues', priority: '6', dxfId: '9' }, [], dxfs))
      .toEqual({ type: 'duplicateValues', priority: 6 });
  });
});

describe('hashSheetPassword', () => {
  it('should produce the hash ExcelJS produces for the same salt and spin count', async() => {
    const salt = new Uint8Array(16).map((_v, i) => i * 7);
    const saltBase64 = Buffer.from(salt).toString('base64');
    // 100 spins keep the test fast; production uses SHEET_PASSWORD_SPIN_COUNT and Excel accepts any count.
    const hash = await hashSheetPassword('secret', salt, 100);

    expect(hash).toEqual({
      algorithmName: 'SHA-512',
      saltValue: saltBase64,
      spinCount: 100,
      hashValue: Encryptor.convertPasswordToHash('secret', 'SHA512', saltBase64, 100),
    });
  });

  it('should hash non-ASCII passwords as UTF-16LE, the way Excel does', async() => {
    const salt = new Uint8Array(16);
    const hash = await hashSheetPassword('zażółć', salt, 10);

    expect(hash.hashValue).toBe(
      Encryptor.convertPasswordToHash('zażółć', 'SHA512', Buffer.from(salt).toString('base64'), 10),
    );
  });

  it('should default to 100000 spins and a fresh 16-byte salt per call', async() => {
    const a = await hashSheetPassword('x', undefined, 1);
    const b = await hashSheetPassword('x', undefined, 1);

    expect(SHEET_PASSWORD_SPIN_COUNT).toBe(100000);
    expect(a.saltValue).not.toBe(b.saltValue);
    expect(Buffer.from(a.saltValue, 'base64').byteLength).toBe(16);
  });
});

/**
 * Builds a sheet through the 1-based builder the export uses and serializes it.
 * @param build
 * @param passwordHash
 */
function writeSheet(build, passwordHash = null) {
  const builder = new SheetBuilder('Sheet1');

  build(builder);

  const styles = new StyleTable();
  const strings = new SharedStringTable();
  const dropped = new DroppedFeatures();
  const result = worksheetXml(builder.toSnapshot(), styles, strings, dropped, passwordHash);

  return { ...result, styles, strings, dropped };
}

describe('worksheetXml', () => {
  it('should write values by type, formulas with and without results, and an empty sheet', () => {
    const { xml, strings, wroteFormula } = writeSheet((b) => {
      b.cell(1, 1).value = 'text';
      b.cell(1, 2).value = 42;
      b.cell(1, 3).value = true;
      b.cell(2, 1).formula = { text: 'SUM(B1:B1)' };
      b.cell(2, 2).formula = { text: 'B1*2', result: 84 };
      b.cell(2, 3).formula = { text: 'A1&"!"', result: 'text!' };
      b.cell(2, 4).formula = { text: 'B1>0', result: true };
    });

    expect(xml).toContain('<dimension ref="A1:D2"/>');
    expect(xml).toContain('<c r="A1" t="s"><v>0</v></c>');
    expect(xml).toContain('<c r="B1"><v>42</v></c>');
    expect(xml).toContain('<c r="C1" t="b"><v>1</v></c>');
    expect(xml).toContain('<c r="A2"><f>SUM(B1:B1)</f></c>');
    expect(xml).toContain('<c r="B2"><f>B1*2</f><v>84</v></c>');
    // The writer escapes quotes inside element text too; Excel reads `&quot;` back as `"`.
    expect(xml).toContain('<c r="C2" t="str"><f>A1&amp;&quot;!&quot;</f><v>text!</v></c>');
    expect(xml).toContain('<c r="D2" t="b"><f>B1&gt;0</f><v>1</v></c>');
    expect(strings.count).toBe(1);
    expect(wroteFormula).toBe(true);

    const empty = writeSheet(() => {});

    expect(empty.xml).toContain('<dimension ref="A1"/>');
    expect(empty.xml).toContain('<sheetData/>');
    expect(empty.wroteFormula).toBe(false);
  });

  it('should write the style index, number format and a styled empty cell', () => {
    const { xml } = writeSheet((b) => {
      b.cell(1, 1).value = 45292;
      b.cell(1, 1).numFmt = 'mm-dd-yy';
      b.cell(1, 2).style = { alignment: null, font: { bold: true }, fill: null, border: null };
    });

    expect(xml).toContain('<c r="A1" s="1"><v>45292</v></c>');
    expect(xml).toContain('<c r="B1" s="2"/>');
  });

  it('should write layout: widths, hidden columns, heights, hidden rows, freeze, rtl, merges', () => {
    const { xml } = writeSheet((b) => {
      b.cell(1, 1).value = 'a';
      b.cell(1, 2).value = 'b';
      b.setColWidth(1, 5);
      b.setColWidth(2, 12.5);
      b.hideCol(2);
      b.hideCol(4);
      b.setRowHeight(2, 30);
      b.hideRow(3);
      b.freeze(1, 2);
      b.setRtl(true);
      b.merge(1, 1, 1, 2);
    });

    expect(xml).toContain(
      '<sheetView workbookViewId="0" rightToLeft="1">'
      + '<pane xSplit="1" ySplit="2" topLeftCell="B3" activePane="bottomRight" state="frozen"/>'
      + '<selection pane="bottomRight"/></sheetView>',
    );
    expect(xml).toContain(
      '<cols><col min="1" max="1" width="5" customWidth="1"/>'
      + '<col min="2" max="2" width="12.5" customWidth="1" hidden="1"/><col min="4" max="4" hidden="1"/></cols>',
    );
    expect(xml).toContain('<row r="2" ht="30" customHeight="1"/>');
    expect(xml).toContain('<row r="3" hidden="1"/>');
    expect(xml).toContain('<mergeCells count="1"><mergeCell ref="A1:B1"/></mergeCells>');
    expect(xml.indexOf('<sheetData')).toBeLessThan(xml.indexOf('<mergeCells'));
  });

  it('should keep the master value and drop a covered cell value inside a merge', () => {
    const { xml } = writeSheet((b) => {
      b.cell(1, 1).value = 'master';
      b.cell(1, 2).value = 'covered';
      b.merge(1, 1, 1, 2);
    });

    expect(xml).toContain('<c r="A1" t="s"><v>0</v></c>');
    expect(xml).not.toContain('<c r="B1" t="s">');
  });

  it('should skip an overlapping merge and report it', () => {
    const { xml, dropped } = writeSheet((b) => {
      b.cell(1, 1).value = 'x';
      b.merge(1, 1, 2, 2);
      b.merge(2, 2, 3, 3);
    });

    expect(xml).toContain('<mergeCells count="1"><mergeCell ref="A1:B2"/></mergeCells>');
    expect(dropped.list()).toEqual(['merge:overlap']);
  });

  it('should write protection with inverted allow flags and per-cell locks', () => {
    const { xml, dropped } = writeSheet((b) => {
      b.cell(1, 1).value = 'x';
      b.cell(1, 1).locked = false;
      b.cell(1, 2).value = 'y';
      b.cell(1, 2).locked = true;
      b.protect('', {
        selectLockedCells: true, selectUnlockedCells: true, formatColumns: true, sort: true, autoFilter: true,
      });
    });

    expect(xml).toContain(
      '<sheetProtection sheet="1" formatColumns="0" '
      + 'sort="0" autoFilter="0" objects="1" scenarios="1"/>',
    );
    expect(xml).toContain('<c r="A1" s="1" t="s">');
    expect(xml).toContain('<c r="B1" t="s">');
    expect(dropped.list()).toEqual([]);
  });

  it('should write the password hash attributes the caller computed', () => {
    const hash = { algorithmName: 'SHA-512', hashValue: 'AAA=', saltValue: 'BBB=', spinCount: 100000 };
    const { xml } = writeSheet((b) => {
      b.cell(1, 1).value = 'x';
      b.protect('secret', {});
    }, hash);

    expect(xml).toContain(
      '<sheetProtection sheet="1" objects="1" scenarios="1" '
      + 'algorithmName="SHA-512" hashValue="AAA=" saltValue="BBB=" spinCount="100000"/>',
    );
  });

  it('should write list validations, conditional formatting and the comments hook in schema order', () => {
    const { xml, comments } = writeSheet((b) => {
      b.cell(2, 1).value = 'Open';
      b.cell(2, 1).validation = { type: 'list', formulae: ['"Open,Closed"'], allowBlank: true };
      b.cell(2, 1).comment = 'note here';
      b.addConditionalFormatting('A2:A2', [{ type: 'cellIs', operator: 'equal', formulae: ['"Open"'] }]);
    });

    expect(xml).toContain('<conditionalFormatting sqref="A2:A2">');
    expect(xml).toContain('<dataValidations count="1">');
    expect(xml).toContain('<legacyDrawing r:id="rId2"/>');
    expect(xml.indexOf('<conditionalFormatting')).toBeLessThan(xml.indexOf('<dataValidations'));
    expect(xml.indexOf('<dataValidations')).toBeLessThan(xml.indexOf('<pageMargins'));
    expect(xml.indexOf('<pageMargins')).toBeLessThan(xml.indexOf('<legacyDrawing'));
    expect(comments).toEqual([{ ref: 'A2', row: 1, col: 0, text: 'note here' }]);
  });

  it('should not write a legacyDrawing when no cell has a comment', () => {
    expect(writeSheet((b) => { b.cell(1, 1).value = 1; }).xml).not.toContain('legacyDrawing');
  });
});

/**
 * Parses one sheet with the given optional parts.
 * @param xml
 * @param root0
 * @param root0.styles
 * @param root0.strings
 * @param root0.comments
 * @param root0.date1904
 */
function readSheet(xml, {
  styles = EMPTY_STYLES, strings = { strings: [], rich: [] }, comments = new Map(), date1904 = false,
} = {}) {
  const dropped = new DroppedFeatures();
  const budget = { declaredCells: 0 };
  const sheet = parseWorksheet(xml, {
    name: 'Sheet1', state: 'visible', styles, sharedStrings: strings, comments, date1904, dropped, budget,
  });

  return { sheet, dropped, budget };
}

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';

describe('parseWorksheet', () => {
  it('should read values by type, shared strings, inline strings, errors and formulas', () => {
    const strings = { strings: ['plain', 'rich'], rich: [false, true] };
    const xml = `<worksheet ${NS}><dimension ref="A1:G2"/><sheetData>`
      + '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>4200.5</v></c><c r="C1" t="b"><v>1</v></c>'
      + '<c r="D1" t="e"><v>#N/A</v></c><c r="E1" t="inlineStr"><is><t xml:space="preserve"> in </t></is></c>'
      + '<c r="F1" t="str"><f>A1&amp;"!"</f><v>plain!</v></c><c r="G1"><f>SUM(B1)</f></c></row>'
      + '<row r="2"><c r="A2" t="s"><v>1</v></c></row>'
      + '</sheetData></worksheet>';
    const { sheet, dropped } = readSheet(xml, { strings });
    const row = sheet.rows[0];

    expect(row.map(c => c && c.value)).toEqual(['plain', 4200.5, true, '#N/A', ' in ', null, null]);
    expect(row[5].formula).toEqual({ text: 'A1&"!"', result: 'plain!' });
    expect(row[6].formula).toEqual({ text: 'SUM(B1)' });
    expect(sheet.rows[1][0].value).toBe('rich');
    expect(sheet.rows[1].length).toBe(7);
    expect(dropped.list()).toEqual(['richText']);
  });

  it('should translate shared formulas for every slave from the master text', () => {
    const xml = `<worksheet ${NS}><sheetData>`
      + '<row r="1"><c r="A1"><v>2</v></c><c r="C1"><f t="shared" ref="C1:C2" si="0">A1*2</f><v>4</v></c></row>'
      + '<row r="2"><c r="A2"><v>3</v></c><c r="C2"><f t="shared" si="0"/><v>6</v></c></row>'
      + '</sheetData></worksheet>';
    const { sheet } = readSheet(xml);

    expect(sheet.rows[0][2].formula).toEqual({ text: 'A1*2', result: 4 });
    expect(sheet.rows[1][2].formula).toEqual({ text: 'A2*2', result: 6 });
    expect(sheet.rows[1][2].value).toBeNull();
  });

  it('should resolve the style index into numFmt, style and locked, and drop an all-default cell', () => {
    const styles = parseStyles('<styleSheet><fonts><font/><font><b/></font></fonts><cellXfs>'
      + '<xf numFmtId="0" fontId="0"/>'
      + '<xf numFmtId="14" fontId="1"><protection locked="0"/></xf></cellXfs></styleSheet>');
    const xml = `<worksheet ${NS}><sheetData><row r="1"><c r="A1" s="1"><v>45292</v></c>`
      + '<c r="B1" s="0"/><c r="C1" s="1"/></row></sheetData></worksheet>';
    const { sheet } = readSheet(xml, { styles });

    expect(sheet.rows[0][0]).toEqual({
      value: 45292,
      formula: null,
      numFmt: 'mm-dd-yy',
      style: { alignment: null, font: { bold: true }, fill: null, border: null },
      validation: null,
      locked: false,
      comment: null,
    });
    expect(sheet.rows[0][1]).toBeNull();
    expect(sheet.rows[0][2].value).toBeNull();
    expect(sheet.rows[0][2].numFmt).toBe('mm-dd-yy');
  });

  it('should read layout: widths past the last cell, hidden, heights, merges, freeze, rtl, state', () => {
    const xml = `<worksheet ${NS}><dimension ref="A1:D5"/>`
      + '<sheetViews><sheetView rightToLeft="1" workbookViewId="0">'
      + '<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>'
      + '</sheetView></sheetViews>'
      + '<cols><col min="1" max="1" width="5" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/>'
      + '<col min="3" max="3" hidden="1"/><col min="6" max="6" width="15" customWidth="1"/>'
      + '<col min="7" max="7" hidden="1"/></cols>'
      + '<sheetData><row r="1"><c r="A1"><v>1</v></c><c r="B1"><v>2</v></c>'
      + '</row><row r="2" ht="30" customHeight="1"><c r="A2"><v>3</v></c></row>'
      + '<row r="3"><c r="C3"><v>9</v></c><c r="D3"><v>8</v></c></row>'
      + '<row r="4" hidden="1"><c r="A4"><v>4</v></c><c r="D4"><v>7</v></c></row></sheetData>'
      + '<mergeCells count="2"><mergeCell ref="A1:B1"/><mergeCell ref="C3:D4"/></mergeCells></worksheet>';
    const { sheet } = readSheet(xml);

    expect(sheet.colWidths).toEqual([5, 20, null, null, null, 15, null]);
    expect(sheet.hiddenCols).toEqual([2, 6]);
    expect(sheet.rowHeights).toEqual([null, 30, null, null, null]);
    expect(sheet.hiddenRows).toEqual([3]);
    expect(sheet.merges).toEqual([
      { row: 0, col: 0, rowspan: 1, colspan: 2 }, { row: 2, col: 2, rowspan: 2, colspan: 2 },
    ]);
    expect(sheet.rows[0][1]).toBeNull();
    expect(sheet.rows[3][3]).toBeNull();
    expect(sheet.rows[2][2].value).toBe(9);
    expect(sheet.freeze).toEqual({ rows: 1, cols: 1 });
    expect(sheet.rtl).toBe(true);
    // Rows declared by the dimension but never written stay [] and are not padded.
    expect(sheet.rows[4]).toEqual([]);
    expect(sheet.rows.length).toBe(5);
  });

  it('should read list validations onto their cells, drop other kinds, and clamp a whole-column sqref', () => {
    const xml = `<worksheet ${NS}><dimension ref="A1:B3"/><sheetData>`
      + '<row r="1"><c r="A1" t="str"><v>x</v></c></row></sheetData>'
      + '<dataValidations count="2">'
      + '<dataValidation type="list" allowBlank="1" sqref="A1:A1048576 B2">'
      + '<formula1>"a,b,c"</formula1></dataValidation>'
      + '<dataValidation type="whole" operator="between" sqref="B1">'
      + '<formula1>1</formula1><formula2>10</formula2></dataValidation></dataValidations></worksheet>';
    const { sheet, dropped } = readSheet(xml);

    expect(sheet.rows[0][0].validation).toEqual({ type: 'list', formulae: ['"a,b,c"'], allowBlank: true });
    expect(sheet.rows[1][1].validation).toEqual({ type: 'list', formulae: ['"a,b,c"'], allowBlank: true });
    expect(sheet.rows[2][0].validation).toEqual({ type: 'list', formulae: ['"a,b,c"'], allowBlank: true });
    expect(sheet.rows.length).toBe(3);
    expect(dropped.list()).toEqual(['dataValidation:whole']);
  });

  it('should read conditional formatting into ExcelJS-shaped rules with their dxf style', () => {
    const styles = parseStyles('<styleSheet><dxfs><dxf><font><b/></font></dxf></dxfs></styleSheet>');
    const xml = `<worksheet ${NS}><sheetData/>`
      + '<conditionalFormatting sqref="A1:A3">'
      + '<cfRule type="cellIs" dxfId="0" priority="1" operator="greaterThan">'
      + '<formula>2</formula></cfRule></conditionalFormatting></worksheet>';
    const { sheet } = readSheet(xml, { styles });

    expect(sheet.conditionalFormatting).toEqual([{
      ref: 'A1:A3',
      rules: [{
        type: 'cellIs', operator: 'greaterThan', priority: 1, formulae: ['2'], style: { font: { bold: true } },
      }],
    }]);
  });

  it('should attach comments by address and record features the model has no room for', () => {
    const xml = `<worksheet ${NS}><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData>`
      + '<autoFilter ref="A1:A1"/><hyperlinks><hyperlink ref="A1" r:id="rId9"/></hyperlinks><drawing r:id="rId3"/>'
      + '<tableParts count="1"><tablePart r:id="rId4"/></tableParts><legacyDrawing r:id="rId2"/></worksheet>';
    const { sheet, dropped } = readSheet(xml, { comments: new Map([['A1', 'a comment'], ['Z9', 'empty cell note']]) });

    expect(sheet.rows[0][0].comment).toBe('a comment');
    expect(sheet.rows[8][25].comment).toBe('empty cell note');
    expect(dropped.list().sort()).toEqual(['autoFilter', 'hyperlink', 'images', 'tables']);
  });

  it('should read sheet protection, strip the hash and record the password', () => {
    const xml = `<worksheet ${NS}><sheetData/>`
      + '<sheetProtection algorithmName="SHA-512" hashValue="abc" saltValue="def" spinCount="100000"'
      + ' sheet="1" formatColumns="0" sort="0"/></worksheet>';
    const { sheet, dropped } = readSheet(xml);

    // `formatColumns="0"` / `sort="0"` mean ALLOWED in the file, so they read back as `true` – the
    // same inversion ExcelJS applies and the writer undoes, so a round trip keeps every permission.
    expect(sheet.protection).toEqual({
      enabled: true, password: null, options: { sheet: true, formatColumns: true, sort: true },
    });
    expect(dropped.list()).toEqual(['sheetProtection:password']);
  });

  it('should shift 1904-epoch serials on date-formatted cells only', () => {
    const styles = parseStyles('<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>');
    const xml = `<worksheet ${NS}><sheetData><row r="1"><c r="A1" s="1"><v>100</v></c>`
      + '<c r="B1"><v>100</v></c></row></sheetData></worksheet>';
    const { sheet } = readSheet(xml, { styles, date1904: true });

    expect(sheet.rows[0][0].value).toBe(1562);
    expect(sheet.rows[0][1].value).toBe(100);
  });

  it('should refuse a sheet the dimension declares above the caps before reading a row', () => {
    expect(() => readSheet(`<worksheet ${NS}><dimension ref="A1:A1048577"/><sheetData/></worksheet>`))
      .toThrow(/sheet "Sheet1" declares 1048577 rows, above the 1048576-row limit/);
    expect(() => readSheet(`<worksheet ${NS}><dimension ref="A1:XFE1"/><sheetData/></worksheet>`))
      .toThrow(/declares 16385 columns, above the 16384-column limit/);
    expect(() => readSheet(`<worksheet ${NS}><dimension ref="A1:ALM5000"/><sheetData/></worksheet>`))
      .toThrow(/declares 5000 × 1001 cells, above the 5000000-cell limit/);
  });

  it('should refuse a row past the cap when there is no dimension', () => {
    const xml = `<worksheet ${NS}><sheetData><row r="1048577">`
      + '<c r="A1048577"><v>1</v></c></row></sheetData></worksheet>';

    expect(() => readSheet(xml)).toThrow(/declares 1048577 rows/);
  });

  it('should count the column layout against the workbook budget without inflating the cell product', () => {
    const cols = '<cols><col min="16384" max="16384" width="12" customWidth="1"/></cols>';
    const xml = `<worksheet ${NS}><dimension ref="A1:A400"/>${cols}<sheetData>`
      + '<row r="1"><c r="A1" t="str"><v>r1</v></c></row></sheetData></worksheet>';
    const { sheet, budget } = readSheet(xml);

    expect(sheet.colWidths.length).toBe(16384);
    expect(sheet.colWidths[16383]).toBe(12);
    expect(sheet.rows.length).toBe(400);
    expect(sheet.rows[0].length).toBe(1);
    expect(budget.declaredCells).toBe((400 * 1) + 16384);
  });
});

describe('assertSheetFits', () => {
  it('should accumulate the workbook budget across sheets and refuse the one that overflows it', () => {
    const budget = { declaredCells: 0 };

    for (let i = 0; i < 10; i++) {
      assertSheetFits(`S${i}`, 1_000_000, 1, 0, budget);
    }

    expect(() => assertSheetFits('Last', 1, 1, 0, budget))
      .toThrow(/workbook declares 10000001 cells across its sheets, above the 10000000-cell limit/);
    expect(MAX_SHEET_CELLS).toBe(5_000_000);
  });
});
