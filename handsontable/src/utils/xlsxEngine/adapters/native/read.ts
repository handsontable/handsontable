import { throwWithCause } from '../../../../helpers/errors';
import { localeLowerCase } from '../../../../helpers/string';
import type { DroppedFeatures } from '../../capabilities';
import { isLimitError, MAX_INPUT_BYTES, throwLimitExceeded } from '../../limits';
import { createWorkbookSnapshot, type WorkbookSnapshot } from '../../model';
import { parseComments } from './parts/comments';
import {
  CONTENT_TYPES, contentTypeOf, type ContentTypes, parseContentTypes, parseRels, parseWorkbook, resolvePartPath,
  REL_TYPES, type Relationship,
} from './parts/package';
import { parseSharedStrings, type ParsedSharedStrings } from './parts/sharedStrings';
import { EMPTY_STYLES, parseStyles, type ParsedStyles } from './parts/styles';
import { parseWorksheet, type WorkbookBudget } from './parts/worksheetReader';
import { readZip, type ZipArchive } from './zip/reader';

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
 * Indexes relationships by id, so a per-sheet lookup does not scan the whole list. A workbook
 * declaring N sheets and N relationships made that scan cost O(sheets x rels): 625 kB of XML spent
 * 15.6 s in it, while the same file with one relationship spent 2.2 s.
 *
 * It narrows what a duplicate id resolves to, on purpose: the FIRST relationship carrying an id
 * wins and `targetOf` then type-filters that one entry, where the scan it replaced filtered across
 * every relationship carrying the id. So a malformed workbook declaring `rId1` twice - styles
 * first, worksheet second - used to read the sheet and is now refused with "the sheet X has no
 * part". An id is unique per part by the OPC spec, so the file was already lying about which part
 * it names, and refusing it is the answer this reader gives every other ambiguous archive.
 */
function relsById(rels: Relationship[]): Map<string, Relationship> {
  const byId = new Map<string, Relationship>();

  rels.forEach((rel) => {
    if (!byId.has(rel.id)) {
      byId.set(rel.id, rel);
    }
  });

  return byId;
}

/**
 * Finds the target of the first relationship of a type, resolved against the source part.
 */
function targetOf(rels: Relationship[], type: string, sourcePart: string): string | null {
  const rel = rels.find(r => r.type === type);

  return rel ? resolvePartPath(sourcePart, rel.target) : null;
}

/**
 * The part `[Content_Types].xml` names, for a package that declares one.
 */
const CONTENT_TYPES_PART = '[Content_Types].xml';

/**
 * The part names this reader refuses to read as a worksheet whatever the package says about them.
 *
 * `openPackage` collects the parts one read really resolved, which is not a floor: a workbook that
 * declares no shared-strings relationship never puts `xl/sharedStrings.xml` into that set, so what
 * the set refuses was decided by the attacker's own relationship list. These four names are the
 * package's own plumbing under the conventional layout and are never a sheet.
 */
const NEVER_WORKSHEET_PARTS = new Set([
  CONTENT_TYPES_PART,
  'xl/workbook.xml',
  'xl/styles.xml',
  'xl/sharedStrings.xml',
]);

/**
 * Whether a part is a relationship part. `.rels` parts live under a `_rels/` directory and carry
 * that extension, and no package layout makes one a worksheet.
 */
function isRelationshipPart(partPath: string): boolean {
  return partPath.endsWith('.rels') || partPath.startsWith('_rels/') || partPath.includes('/_rels/');
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
  contentTypes: ContentTypes;
  packageParts: Set<string>;
}

/**
 * Whether a part a sheet's `r:id` resolved to may be read as a worksheet.
 *
 * A relationship target is the file's own text, so it may name ANY part of the package: `xl/../../
 * [Content_Types].xml` normalizes back inside the archive and was tokenized as a worksheet, which
 * yielded an empty sheet with no diagnostic.
 *
 * The package-part test is a FLOOR, not a fallback. It used to run only where the package declared
 * no type, and the declaration is the attacker's text too: one
 * `<Default Extension="xml" ContentType="…spreadsheetml.worksheet+xml"/>` types every `.xml` part
 * of the package as a worksheet, so a sheet could point at `xl/workbook.xml`, the shared strings or
 * the styles and read back as an empty sheet again. The plumbing is refused first, and a declared
 * type can only narrow what is left. A package that declares nothing types no part at all, so
 * there the floor is the whole check - which is how a package carrying no `[Content_Types].xml`
 * still reads, as before.
 *
 * The declared type is compared case-insensitively: OPC compares a media type's type and subtype
 * that way, and `…spreadsheetml.Worksheet+xml` was refused over one capital letter.
 */
function isWorksheetPart(opened: OpenedPackage, partPath: string): boolean {
  if (opened.packageParts.has(partPath) || NEVER_WORKSHEET_PARTS.has(partPath) || isRelationshipPart(partPath)) {
    return false;
  }

  const declared = contentTypeOf(opened.contentTypes, partPath);

  return declared === undefined || localeLowerCase(declared.trim()) === CONTENT_TYPES.worksheet;
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
  const packageParts = new Set([CONTENT_TYPES_PART, workbookPath]);

  [stylesPath, stringsPath].forEach((path) => {
    if (path !== null) {
      packageParts.add(path);
    }
  });

  return {
    archive,
    workbookPath,
    workbookRels,
    sheets,
    date1904,
    packageParts,
    contentTypes: archive.has(CONTENT_TYPES_PART)
      ? parseContentTypes(await archive.text(CONTENT_TYPES_PART))
      : { overrides: new Map<string, string>(), defaults: new Map<string, string>() },
    styles: stylesPath && archive.has(stylesPath) ? parseStyles(await archive.text(stylesPath)) : EMPTY_STYLES,
    sharedStrings: stringsPath && archive.has(stringsPath)
      ? parseSharedStrings(await archive.text(stringsPath))
      : { strings: [], rich: [] },
  };
}

/**
 * Reads every sheet the workbook declares, in order, into the snapshot. Sheets are read one at a
 * time so the cell caps can refuse a workbook before the next one is allocated.
 */
async function readSheets(
  opened: OpenedPackage,
  snapshot: WorkbookSnapshot,
  budget: WorkbookBudget,
  dropped: DroppedFeatures
): Promise<void> {
  const workbookRelsById = relsById(opened.workbookRels);

  for (const entry of opened.sheets) {
    const sheetRel = workbookRelsById.get(entry.relId);
    const sheetPath = targetOf(sheetRel ? [sheetRel] : [], REL_TYPES.worksheet, opened.workbookPath);

    if (sheetPath === null || !opened.archive.has(sheetPath)) {
      throwWithCause('The workbook could not be parsed by the native engine: '
        + `the sheet "${entry.name}" has no part.`);
    }

    if (!isWorksheetPart(opened, sheetPath)) {
      throwWithCause('The workbook could not be parsed by the native engine: '
        + `the sheet "${entry.name}" has no worksheet part.`);
    }

    // eslint-disable-next-line no-await-in-loop -- the per-sheet sequencing this function's JSDoc states.
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
      if (isLimitError(error)) {
        throw error;
      }

      throwWithCause(`The workbook could not be parsed by the native engine: ${(error as Error).message}`);
    }
  }
}

/**
 * Reads `.xlsx` bytes into a workbook snapshot. The byte cap runs before the archive is opened;
 * the sheet caps run inside the sheet reader before a row is allocated.
 */
export async function readWorkbook(buffer: ArrayBuffer, dropped: DroppedFeatures): Promise<WorkbookSnapshot> {
  if (buffer.byteLength > MAX_INPUT_BYTES) {
    throwLimitExceeded(`The workbook is ${buffer.byteLength} bytes, `
      + `above the ${MAX_INPUT_BYTES}-byte limit this reader accepts.`);
  }

  let opened: OpenedPackage;

  try {
    opened = await openPackage(buffer);
  } catch (error) {
    // A declared limit refused the file before any sheet was read (the sheet count, the total
    // inflated bytes): that refusal is the reader's own contract and is reported as it was raised.
    if (isLimitError(error)) {
      throw error;
    }

    throwWithCause(`The workbook could not be parsed by the native engine: ${(error as Error).message}`);
  }

  const snapshot = createWorkbookSnapshot();
  const budget: WorkbookBudget = { declaredCells: 0 };

  try {
    await readSheets(opened, snapshot, budget, dropped);
  } finally {
    // Every part is inflated at most once per read and held as a string until the read ends, so the
    // memo is dropped with the read rather than left on the archive.
    opened.archive.release();
  }

  return snapshot;
}
