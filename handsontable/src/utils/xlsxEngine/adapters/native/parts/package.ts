import type { SheetSnapshot } from '../../../model';
import { createLocalName, tokenizeXml } from '../xml/tokenizer';
import { XmlWriter } from '../xml/writer';

/**
 * What the package layer needs to know about one sheet.
 */
export interface PackageSheet {
  index: number;
  name: string;
  state: SheetSnapshot['state'];
  hasComments: boolean;
}

/**
 * One `<Relationship>` of a `.rels` part.
 */
export interface Relationship {
  id: string;
  type: string;
  target: string;
}

/**
 * One `<sheet>` of `xl/workbook.xml`.
 */
export interface WorkbookSheetEntry {
  name: string;
  relId: string;
  state: SheetSnapshot['state'];
}

const OFFICE_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';

export const REL_TYPES = {
  officeDocument: `${OFFICE_REL}/officeDocument`,
  worksheet: `${OFFICE_REL}/worksheet`,
  styles: `${OFFICE_REL}/styles`,
  sharedStrings: `${OFFICE_REL}/sharedStrings`,
  comments: `${OFFICE_REL}/comments`,
  vmlDrawing: `${OFFICE_REL}/vmlDrawing`,
  coreProperties: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
  extendedProperties: `${OFFICE_REL}/extended-properties`,
} as const;

export const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
export const R_NS = OFFICE_REL;

const CONTENT_TYPES = {
  workbook: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
  worksheet: 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml',
  styles: 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml',
  sharedStrings: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml',
  comments: 'application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml',
  vml: 'application/vnd.openxmlformats-officedocument.vmlDrawing',
  rels: 'application/vnd.openxmlformats-package.relationships+xml',
  xml: 'application/xml',
  core: 'application/vnd.openxmlformats-package.core-properties+xml',
  app: 'application/vnd.openxmlformats-officedocument.extended-properties+xml',
};

/**
 * Serializes `[Content_Types].xml`. The `vml` default is written only when some sheet carries
 * comments, and the shared-strings override only when the table is non-empty.
 */
export function contentTypesXml(sheets: PackageSheet[], hasSharedStrings: boolean): string {
  const w = new XmlWriter().open('Types', { xmlns: 'http://schemas.openxmlformats.org/package/2006/content-types' });

  w.leaf('Default', { Extension: 'rels', ContentType: CONTENT_TYPES.rels });
  w.leaf('Default', { Extension: 'xml', ContentType: CONTENT_TYPES.xml });

  if (sheets.some(s => s.hasComments)) {
    w.leaf('Default', { Extension: 'vml', ContentType: CONTENT_TYPES.vml });
  }

  w.leaf('Override', { PartName: '/xl/workbook.xml', ContentType: CONTENT_TYPES.workbook });
  sheets.forEach((sheet) => {
    w.leaf('Override', { PartName: `/xl/worksheets/sheet${sheet.index}.xml`, ContentType: CONTENT_TYPES.worksheet });
  });
  w.leaf('Override', { PartName: '/xl/styles.xml', ContentType: CONTENT_TYPES.styles });

  if (hasSharedStrings) {
    w.leaf('Override', { PartName: '/xl/sharedStrings.xml', ContentType: CONTENT_TYPES.sharedStrings });
  }

  sheets.filter(s => s.hasComments).forEach((sheet) => {
    w.leaf('Override', { PartName: `/xl/comments${sheet.index}.xml`, ContentType: CONTENT_TYPES.comments });
  });
  w.leaf('Override', { PartName: '/docProps/core.xml', ContentType: CONTENT_TYPES.core });
  w.leaf('Override', { PartName: '/docProps/app.xml', ContentType: CONTENT_TYPES.app });

  return w.close().toString();
}

/**
 * Serializes a `.rels` part from a relationship list.
 */
function relsXml(rels: Relationship[]): string {
  const w = new XmlWriter().open('Relationships', { xmlns: PACKAGE_REL });

  rels.forEach(rel => w.leaf('Relationship', { Id: rel.id, Type: rel.type, Target: rel.target }));

  return w.close().toString();
}

/**
 * Serializes `_rels/.rels`.
 */
export function rootRelsXml(): string {
  return relsXml([
    { id: 'rId1', type: REL_TYPES.officeDocument, target: 'xl/workbook.xml' },
    { id: 'rId2', type: REL_TYPES.coreProperties, target: 'docProps/core.xml' },
    { id: 'rId3', type: REL_TYPES.extendedProperties, target: 'docProps/app.xml' },
  ]);
}

/**
 * Serializes `xl/_rels/workbook.xml.rels` and returns the id each sheet was given, in sheet order.
 */
export function workbookRelsXml(
  sheets: PackageSheet[],
  hasSharedStrings: boolean,
): { xml: string; sheetRelIds: string[] } {
  const rels: Relationship[] = [{ id: 'rId1', type: REL_TYPES.styles, target: 'styles.xml' }];

  if (hasSharedStrings) {
    rels.push({ id: `rId${rels.length + 1}`, type: REL_TYPES.sharedStrings, target: 'sharedStrings.xml' });
  }

  const sheetRelIds = sheets.map((sheet) => {
    const id = `rId${rels.length + 1}`;

    rels.push({ id, type: REL_TYPES.worksheet, target: `worksheets/sheet${sheet.index}.xml` });

    return id;
  });

  return { xml: relsXml(rels), sheetRelIds };
}

/**
 * Serializes `xl/worksheets/_rels/sheetN.xml.rels` for a sheet that carries comments.
 */
export function sheetRelsXml(index: number): string {
  return relsXml([
    { id: 'rId1', type: REL_TYPES.comments, target: `../comments${index}.xml` },
    { id: 'rId2', type: REL_TYPES.vmlDrawing, target: `../drawings/vmlDrawing${index}.vml` },
  ]);
}

/**
 * Serializes `xl/workbook.xml`. Child order is schema-fixed: `workbookPr`, `bookViews`, `sheets`,
 * `calcPr`. `fullCalcOnLoad` asks LibreOffice and Google Sheets to compute formulas written
 * without a cached result; Excel recalculates on its own.
 */
export function workbookXml(sheets: PackageSheet[], sheetRelIds: string[], fullCalcOnLoad: boolean): string {
  const w = new XmlWriter().open('workbook', { xmlns: MAIN_NS, 'xmlns:r': R_NS });

  w.leaf('workbookPr', { defaultThemeVersion: '164011' });
  w.open('bookViews')
    .leaf('workbookView', {
      xWindow: 0, yWindow: 0, windowWidth: 12000, windowHeight: 24000,
    })
    .close();
  w.open('sheets');
  sheets.forEach((sheet, i) => {
    w.leaf('sheet', {
      name: sheet.name,
      sheetId: sheet.index,
      state: sheet.state === 'visible' ? undefined : sheet.state,
      'r:id': sheetRelIds[i],
    });
  });
  w.close();
  w.leaf('calcPr', { calcId: '171027', fullCalcOnLoad: fullCalcOnLoad ? '1' : undefined });

  return w.close().toString();
}

/**
 * Serializes `docProps/core.xml`, naming the author. Excel shows "Unknown" for a workbook that
 * names none.
 */
export function coreXml(author: string, now: Date): string {
  const stamp = now.toISOString().replace(/\.\d{3}/, '');
  const w = new XmlWriter().open('cp:coreProperties', {
    'xmlns:cp': 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
    'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    'xmlns:dcterms': 'http://purl.org/dc/terms/',
    'xmlns:dcmitype': 'http://purl.org/dc/dcmitype/',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
  });

  w.leaf('dc:creator', undefined, author);
  w.leaf('cp:lastModifiedBy', undefined, author);
  w.leaf('dcterms:created', { 'xsi:type': 'dcterms:W3CDTF' }, stamp);
  w.leaf('dcterms:modified', { 'xsi:type': 'dcterms:W3CDTF' }, stamp);

  return w.close().toString();
}

/**
 * Serializes `docProps/app.xml`.
 */
export function appXml(sheetNames: string[]): string {
  const w = new XmlWriter().open('Properties', {
    xmlns: 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties',
    'xmlns:vt': 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes',
  });

  w.leaf('Application', undefined, 'Handsontable');
  w.leaf('DocSecurity', undefined, '0');
  w.leaf('ScaleCrop', undefined, 'false');
  w.open('HeadingPairs').open('vt:vector', { size: 2, baseType: 'variant' });
  w.open('vt:variant').leaf('vt:lpstr', undefined, 'Worksheets').close();
  w.open('vt:variant').leaf('vt:i4', undefined, String(sheetNames.length)).close();
  w.close().close();
  w.open('TitlesOfParts').open('vt:vector', { size: sheetNames.length, baseType: 'lpstr' });
  sheetNames.forEach(name => w.leaf('vt:lpstr', undefined, name));
  w.close().close();
  w.leaf('LinksUpToDate', undefined, 'false');
  w.leaf('SharedDoc', undefined, 'false');
  w.leaf('HyperlinksChanged', undefined, 'false');
  w.leaf('AppVersion', undefined, '16.0300');

  return w.close().toString();
}

/**
 * Parses a `.rels` part.
 */
export function parseRels(xml: string): Relationship[] {
  const rels: Relationship[] = [];
  const localName = createLocalName();

  tokenizeXml(xml, {
    open(rawName, attrs) {
      if (localName(rawName) === 'Relationship') {
        rels.push({ id: attrs.Id ?? '', type: attrs.Type ?? '', target: attrs.Target ?? '' });
      }
    },
  });

  return rels;
}

/**
 * Resolves a relationship target against the part that declares it. Targets are relative to the
 * source part's directory unless they start with `/`.
 */
export function resolvePartPath(basePart: string, target: string): string {
  if (target.startsWith('/')) {
    return target.slice(1);
  }

  const segments = basePart.split('/').slice(0, -1);

  target.split('/').forEach((segment) => {
    if (segment === '..') {
      segments.pop();
    } else if (segment !== '.' && segment !== '') {
      segments.push(segment);
    }
  });

  return segments.join('/');
}

/**
 * Parses `xl/workbook.xml`: the sheet list in order, and the `date1904` flag.
 */
export function parseWorkbook(xml: string): { sheets: WorkbookSheetEntry[]; date1904: boolean } {
  const sheets: WorkbookSheetEntry[] = [];
  let date1904 = false;
  const localName = createLocalName();

  tokenizeXml(xml, {
    open(rawName, attrs) {
      const name = localName(rawName);

      if (name === 'sheet') {
        const state = attrs.state === 'hidden' || attrs.state === 'veryHidden' ? attrs.state : 'visible';

        sheets.push({ name: attrs.name ?? '', relId: attrs['r:id'] ?? '', state });
      } else if (name === 'workbookPr') {
        date1904 = attrs.date1904 === '1' || attrs.date1904 === 'true';
      }
    },
  });

  return { sheets, date1904 };
}
