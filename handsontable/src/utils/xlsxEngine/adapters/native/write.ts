import { throwWithCause } from '../../../../helpers/errors';
import { DROPPED_FEATURES, type DroppedFeatures } from '../../capabilities';
import { DEFAULT_COMPRESSION_LEVEL } from '../../compression';
import type { WorkbookSnapshot } from '../../model';
import {
  CONTROL_SHEET_NAME_CHARS, ILLEGAL_SHEET_NAME_CHARS, isReservedSheetName, SHEET_NAME_MAX_LENGTH,
} from '../../sheetNames';
import { commentsXml, vmlBlockCount, vmlDrawingXml } from './parts/comments';
import {
  appXml, contentTypesXml, coreXml, rootRelsXml, sheetRelsXml, workbookRelsXml, workbookXml, type PackageSheet,
} from './parts/package';
import { hashSheetPassword } from './parts/protection';
import { SharedStringTable } from './parts/sharedStrings';
import { StyleTable } from './parts/styles';
import { worksheetXml } from './parts/worksheetWriter';
import { assertNativeEngineGlobals } from './zip/streams';
import { writeZip, type ZipEntryInput } from './zip/writer';

/**
 * The author written into every exported workbook's core properties, and the author every note
 * is attributed to.
 */
export const WORKBOOK_AUTHOR = 'Handsontable';

/**
 * The reason a sheet name breaks a rule Excel enforces on the name alone, or `null`.
 *
 * A control character is refused rather than written: `workbook.xml` carries the name in an
 * attribute, whose escaper drops the character, while `docProps/app.xml` writes it as `_x0001_`
 * element text. Two names differing only by a control character passed the duplicate check and
 * then landed as the SAME `name`, which Excel answers with its repair prompt.
 */
function sheetNameRuleBroken(name: string): string | null {
  if (name === '') {
    return 'the name is empty';
  }

  if (name.length > SHEET_NAME_MAX_LENGTH) {
    return `the name is longer than ${SHEET_NAME_MAX_LENGTH} characters`;
  }

  if (ILLEGAL_SHEET_NAME_CHARS.test(name)) {
    return 'the name carries an illegal character (* ? : / \\ [ ])';
  }

  if (CONTROL_SHEET_NAME_CHARS.test(name)) {
    return 'the name carries a control character';
  }

  if (name.startsWith('\'') || name.endsWith('\'')) {
    return 'the name starts or ends with an apostrophe';
  }

  return isReservedSheetName(name) ? 'the name is reserved' : null;
}

/**
 * Refuses a sheet name Excel refuses. The export sanitizes names before they get here, so this is
 * a backstop for a snapshot built by other code. The rules themselves live in
 * `utils/xlsxEngine/sheetNames.ts`, so the export's sanitizer and this backstop cannot drift.
 */
function assertSheetNames(names: string[]): void {
  const seen = new Set<string>();

  names.forEach((name) => {
    let reason = sheetNameRuleBroken(name);

    if (reason === null && seen.has(name.toLowerCase())) {
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
  assertNativeEngineGlobals();

  // `<sheets>` must hold at least one `<sheet>` (CT_Sheets); an empty one fails schema validation and
  // LibreOffice opens it by inventing a sheet. `exportFile` always passes one, so only a snapshot
  // built by other code reaches this - the case `assertSheetNames` is the backstop for too.
  if (snapshot.sheets.length === 0) {
    throwWithCause('The native engine cannot write a workbook with no sheets.');
  }

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
  // The next free VML id block. Blocks are allocated across the whole workbook, so the notes of two
  // sheets never share a shape id.
  let nextVmlBlock = 1;

  for (const [i, sheet] of snapshot.sheets.entries()) {
    const index = i + 1;
    const password = sheet.protection?.enabled ? sheet.protection.password : null;
    // The hash is the one async step of the sheet write, so it runs here and the sheet writer
    // stays synchronous. 100000 awaited SHA-512 digests take about 0.95 s per protected sheet in an
    // idle Node 22 (measured) and far longer on a loaded machine (24-34 s were measured inside a
    // full Jest run), and seconds in a browser, one sheet at a time; the hashes are
    // independent, but sequencing them keeps peak memory flat and the ordering deterministic.
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
        data: encoder.encode(vmlDrawingXml(result.comments, nextVmlBlock)),
      });
      nextVmlBlock += vmlBlockCount(result.comments.length);
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
