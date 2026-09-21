import { throwWithCause } from '../../../../helpers/errors';
import type { DroppedFeatures } from '../../capabilities';
import { MAX_INPUT_BYTES } from '../../limits';
import { createWorkbookSnapshot, type WorkbookSnapshot } from '../../model';
import { parseComments } from './parts/comments';
import { parseRels, parseWorkbook, resolvePartPath, REL_TYPES, type Relationship } from './parts/package';
import { parseSharedStrings, type ParsedSharedStrings } from './parts/sharedStrings';
import { EMPTY_STYLES, parseStyles, type ParsedStyles } from './parts/styles';
import { parseWorksheet, type WorkbookBudget } from './parts/worksheetReader';
import { readZip, type ZipArchive } from './zip/reader';

/**
 * Whether an error came from `throwWithCause`.
 */
function isHandsontableError(error: unknown): boolean {
  return typeof error === 'object' && error !== null
    && (error as { cause?: { handsontable?: boolean } }).cause?.handsontable === true;
}

/**
 * The `.rels` part that belongs to a part, or `[]` when it has none.
 */
async function relsOf(archive: ZipArchive, partPath: string): Promise<Relationship[]> {
  const slash = partPath.lastIndexOf('/');
  const dir = slash === -1 ? '' : partPath.slice(0, slash + 1);
  const file = partPath.slice(slash + 1);
  const relsPath = `${dir}_rels/${file}.rels`;

  return archive.has(relsPath) ? parseRels(await archive.text(relsPath)) : [];
}

/**
 * Finds the target of the first relationship of a type, resolved against the source part.
 */
function targetOf(rels: Relationship[], type: string, sourcePart: string): string | null {
  const rel = rels.find(r => r.type === type);

  return rel ? resolvePartPath(sourcePart, rel.target) : null;
}

/**
 * Everything the package layer resolves before any sheet is read.
 */
interface OpenedPackage {
  archive: ZipArchive;
  workbookPath: string;
  workbookRels: Relationship[];
  sheets: ReturnType<typeof parseWorkbook>['sheets'];
  date1904: boolean;
  styles: ParsedStyles;
  sharedStrings: ParsedSharedStrings;
}

/**
 * Opens the archive and the workbook-level parts. Any failure here means the bytes are not a
 * workbook this reader understands.
 */
async function openPackage(buffer: ArrayBuffer): Promise<OpenedPackage> {
  const archive = await readZip(buffer);
  const rootRels = archive.has('_rels/.rels') ? parseRels(await archive.text('_rels/.rels')) : [];
  const workbookPath = targetOf(rootRels, REL_TYPES.officeDocument, '') ?? 'xl/workbook.xml';

  if (!archive.has(workbookPath)) {
    throwWithCause(`The archive has no workbook part at "${workbookPath}".`);
  }

  const { sheets, date1904 } = parseWorkbook(await archive.text(workbookPath));
  const workbookRels = await relsOf(archive, workbookPath);
  const stylesPath = targetOf(workbookRels, REL_TYPES.styles, workbookPath);
  const stringsPath = targetOf(workbookRels, REL_TYPES.sharedStrings, workbookPath);

  return {
    archive,
    workbookPath,
    workbookRels,
    sheets,
    date1904,
    styles: stylesPath && archive.has(stylesPath) ? parseStyles(await archive.text(stylesPath)) : EMPTY_STYLES,
    sharedStrings: stringsPath && archive.has(stringsPath)
      ? parseSharedStrings(await archive.text(stringsPath))
      : { strings: [], rich: [] },
  };
}

/**
 * Reads `.xlsx` bytes into a workbook snapshot. The byte cap runs before the archive is opened;
 * the sheet caps run inside the sheet reader before a row is allocated.
 */
export async function readWorkbook(buffer: ArrayBuffer, dropped: DroppedFeatures): Promise<WorkbookSnapshot> {
  if (buffer.byteLength > MAX_INPUT_BYTES) {
    throwWithCause(`The workbook is ${buffer.byteLength} bytes, `
      + `above the ${MAX_INPUT_BYTES}-byte limit this reader accepts.`);
  }

  let opened: OpenedPackage;

  try {
    opened = await openPackage(buffer);
  } catch (error) {
    throwWithCause(`The workbook could not be parsed by the native engine: ${(error as Error).message}`);
  }

  const snapshot = createWorkbookSnapshot();
  const budget: WorkbookBudget = { declaredCells: 0 };

  for (const entry of opened.sheets) {
    const sheetRel = opened.workbookRels.filter(r => r.id === entry.relId);
    const sheetPath = targetOf(sheetRel, REL_TYPES.worksheet, opened.workbookPath);

    if (sheetPath === null || !opened.archive.has(sheetPath)) {
      throwWithCause(`The workbook could not be parsed by the native engine: the sheet "${entry.name}" has no part.`);
    }

    // Sheets are read one at a time so the cell caps can refuse a workbook before the next sheet
    // is allocated.
    // eslint-disable-next-line no-await-in-loop -- see the comment above.
    const sheetRels = await relsOf(opened.archive, sheetPath);
    const commentsPath = targetOf(sheetRels, REL_TYPES.comments, sheetPath);
    const comments = commentsPath && opened.archive.has(commentsPath)
      // eslint-disable-next-line no-await-in-loop -- same per-sheet sequencing as above.
      ? parseComments(await opened.archive.text(commentsPath))
      : new Map<string, string>();

    try {
      // eslint-disable-next-line no-await-in-loop -- same per-sheet sequencing as above.
      const xml = await opened.archive.text(sheetPath);

      snapshot.sheets.push(parseWorksheet(xml, {
        name: entry.name,
        state: entry.state,
        styles: opened.styles,
        sharedStrings: opened.sharedStrings,
        comments,
        date1904: opened.date1904,
        dropped,
        budget,
      }));
    } catch (error) {
      if (isHandsontableError(error) && /limit this reader accepts/.test((error as Error).message)) {
        throw error;
      }

      throwWithCause(`The workbook could not be parsed by the native engine: ${(error as Error).message}`);
    }
  }

  return snapshot;
}
