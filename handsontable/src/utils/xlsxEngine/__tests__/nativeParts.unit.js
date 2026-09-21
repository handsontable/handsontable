/**
 * @jest-environment node
 */
import {
  contentTypesXml, rootRelsXml, workbookRelsXml, workbookXml, sheetRelsXml, coreXml, appXml,
  parseRels, parseWorkbook, resolvePartPath, REL_TYPES,
} from '../adapters/native/parts/package';
import { SharedStringTable, parseSharedStrings } from '../adapters/native/parts/sharedStrings';

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
