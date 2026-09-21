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
import { StyleTable } from '../adapters/native/parts/styles';
import { hashSheetPassword, SHEET_PASSWORD_SPIN_COUNT } from '../adapters/native/parts/protection';
import { DroppedFeatures } from '../capabilities';

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
