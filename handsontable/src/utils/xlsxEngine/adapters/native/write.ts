import { throwWithCause } from '../../../../helpers/errors';
import { DROPPED_FEATURES, type DroppedFeatures } from '../../capabilities';
import { DEFAULT_COMPRESSION_LEVEL } from '../../compression';
import type { WorkbookSnapshot } from '../../model';
import { ILLEGAL_SHEET_NAME_CHARS, isReservedSheetName, SHEET_NAME_MAX_LENGTH } from '../../sheetNames';
import { commentsXml, vmlDrawingXml } from './parts/comments';
import {
  appXml, contentTypesXml, coreXml, rootRelsXml, sheetRelsXml, workbookRelsXml, workbookXml, type PackageSheet,
} from './parts/package';
import { hashSheetPassword } from './parts/protection';
import { SharedStringTable } from './parts/sharedStrings';
import { StyleTable } from './parts/styles';
import { worksheetXml } from './parts/worksheetWriter';
import { writeZip, type ZipEntryInput } from './zip/writer';

/**
 * The author written into every exported workbook's core properties, and the author every note
 * is attributed to.
 */
export const WORKBOOK_AUTHOR = 'Handsontable';

/**
 * Refuses a sheet name Excel refuses. The export sanitizes names before they get here, so this is
 * a backstop for a snapshot built by other code. The rules themselves live in
 * `utils/xlsxEngine/sheetNames.ts`, so the export's sanitizer and this backstop cannot drift.
 */
function assertSheetNames(names: string[]): void {
  const seen = new Set<string>();

  names.forEach((name) => {
    let reason: string | null = null;

    if (name === '') {
      reason = 'the name is empty';
    } else if (name.length > SHEET_NAME_MAX_LENGTH) {
      reason = `the name is longer than ${SHEET_NAME_MAX_LENGTH} characters`;
    } else if (ILLEGAL_SHEET_NAME_CHARS.test(name)) {
      reason = 'the name carries an illegal character (* ? : / \\ [ ])';
    } else if (name.startsWith('\'') || name.endsWith('\'')) {
      reason = 'the name starts or ends with an apostrophe';
    } else if (isReservedSheetName(name)) {
      reason = 'the name is reserved';
    } else if (seen.has(name.toLowerCase())) {
      reason = 'the name is a duplicate';
    }

    if (reason !== null) {
      throwWithCause(`The sheet name "${name}" was rejected by the native engine: ${reason}.`);
    }

    seen.add(name.toLowerCase());
  });
}

/**
 * Serializes a workbook snapshot into `.xlsx` bytes.
 */
export async function writeWorkbook(snapshot: WorkbookSnapshot, dropped: DroppedFeatures): Promise<Uint8Array> {
  assertSheetNames(snapshot.sheets.map(sheet => sheet.name));

  // `CAPABILITIES.native.compressionLevel` is `false` because the Web `CompressionStream` has no
  // level parameter. Only a level the caller actually chose is worth reporting: `exportFile`
  // normalizes an unset, `null` or `true` compression to 6 before the snapshot exists, so
  // recording every number would warn on every default export.
  if (typeof snapshot.compression === 'number' && snapshot.compression !== DEFAULT_COMPRESSION_LEVEL) {
    dropped.record(DROPPED_FEATURES.compressionLevel);
  }

  const encoder = new TextEncoder();
  const styles = new StyleTable();
  const strings = new SharedStringTable();
  const entries: ZipEntryInput[] = [];
  const packageSheets: PackageSheet[] = [];
  let wroteFormula = false;

  for (const [i, sheet] of snapshot.sheets.entries()) {
    const index = i + 1;
    const password = sheet.protection?.enabled ? sheet.protection.password : null;
    // The hash is the one async step of the sheet write, so it runs here and the sheet writer
    // stays synchronous. 100000 SHA-512 rounds take roughly 100–300 ms per protected sheet, one
    // sheet at a time; the hashes are independent, but sequencing them keeps peak memory flat and
    // the ordering deterministic.
    // eslint-disable-next-line no-await-in-loop -- see the comment above.
    const passwordHash = password === null ? null : await hashSheetPassword(password);
    const result = worksheetXml(sheet, styles, strings, dropped, passwordHash);

    wroteFormula = wroteFormula || result.wroteFormula;
    packageSheets.push({ index, name: sheet.name, state: sheet.state, hasComments: result.comments.length > 0 });
    entries.push({ name: `xl/worksheets/sheet${index}.xml`, data: encoder.encode(result.xml) });

    if (result.comments.length > 0) {
      entries.push({ name: `xl/worksheets/_rels/sheet${index}.xml.rels`, data: encoder.encode(sheetRelsXml(index)) });
      entries.push({
        name: `xl/comments${index}.xml`,
        data: encoder.encode(commentsXml(result.comments, WORKBOOK_AUTHOR)),
      });
      entries.push({
        name: `xl/drawings/vmlDrawing${index}.vml`,
        data: encoder.encode(vmlDrawingXml(result.comments)),
      });
    }
  }

  const hasSharedStrings = strings.count > 0;
  const { xml: workbookRels, sheetRelIds } = workbookRelsXml(packageSheets, hasSharedStrings);

  entries.unshift(
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesXml(packageSheets, hasSharedStrings)) },
    { name: '_rels/.rels', data: encoder.encode(rootRelsXml()) },
    { name: 'docProps/core.xml', data: encoder.encode(coreXml(WORKBOOK_AUTHOR, new Date())) },
    { name: 'docProps/app.xml', data: encoder.encode(appXml(packageSheets.map(s => s.name))) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml(packageSheets, sheetRelIds, wroteFormula)) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRels) },
    { name: 'xl/styles.xml', data: encoder.encode(styles.toXml()) },
  );

  if (hasSharedStrings) {
    entries.push({ name: 'xl/sharedStrings.xml', data: encoder.encode(strings.toXml()) });
  }

  return writeZip(entries, snapshot.compression !== false);
}
