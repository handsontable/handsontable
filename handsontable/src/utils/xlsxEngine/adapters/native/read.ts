import { throwWithCause } from '../../../../helpers/errors';
import { localeLowerCase } from '../../../../helpers/string';
import { DROPPED_FEATURES, type DroppedFeatureName, type DroppedFeatures } from '../../capabilities';
import { isLimitError, MAX_INPUT_BYTES, throwLimitExceeded } from '../../limits';
import { createWorkbookSnapshot, type WorkbookSnapshot } from '../../model';
import { noteToComment } from '../../threadedComments';
import { parseComments } from './parts/comments';
import {
  BINARY_WORKBOOK_CONTENT_TYPE, CONTENT_TYPES, contentTypeOf, type ContentTypes, parseContentTypes, parseRels,
  parseWorkbook, resolvePartPath, REL_TYPES, type Relationship, SPREADSHEET_MAIN_CONTENT_TYPES,
  type WorkbookSheetEntry,
} from './parts/package';
import { parseSharedStrings, type ParsedSharedStrings } from './parts/sharedStrings';
import { EMPTY_STYLES, parseStyles, type ParsedStyles } from './parts/styles';
import { parseWorksheet, type WorkbookBudget } from './parts/worksheetReader';
import { foldPartName, readZip, type ZipArchive } from './zip/reader';

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
 * The part names this reader refuses to read as a worksheet whatever the package says about them,
 * FOLDED (`foldPartName`), because OPC compares part names case-insensitively and so does the archive.
 *
 * `openPackage` collects the parts one read really resolved, which is not a floor: a workbook that
 * declares no shared-strings relationship never puts `xl/sharedStrings.xml` into that set, so what
 * the set refuses was decided by the attacker's own relationship list. These four names are the
 * package's own plumbing under the conventional layout and are never a sheet.
 */
const NEVER_WORKSHEET_PARTS: ReadonlySet<string> = new Set([
  CONTENT_TYPES_PART,
  'xl/workbook.xml',
  'xl/styles.xml',
  'xl/sharedStrings.xml',
].map(foldPartName));

/**
 * Whether a FOLDED part path is a relationship part. `.rels` parts live under a `_rels/` directory
 * and carry that extension, and no package layout makes one a worksheet.
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
  definedNames: string[];
  styles: ParsedStyles;
  sharedStrings: ParsedSharedStrings;
  contentTypes: ContentTypes;
  /**
   * The parts this read resolved for another purpose, FOLDED.
   */
  packageParts: Set<string>;
  hasVbaProject: boolean;
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
 * that way, and `...spreadsheetml.Worksheet+xml` was refused over one capital letter. A part typed
 * only by the generic XML `<Default>` (`GENERIC_XML_CONTENT_TYPES`) is treated as undeclared: OPC
 * does not require an `<Override>` per sheet, the relationship that named the part already says it
 * is a worksheet, and such a package was refused as having "no worksheet part". The floor above
 * still applies to it.
 */
function isWorksheetPart(opened: OpenedPackage, partPath: string): boolean {
  const folded = foldPartName(partPath);

  if (opened.packageParts.has(folded) || NEVER_WORKSHEET_PARTS.has(folded) || isRelationshipPart(folded)) {
    return false;
  }

  const declared = contentTypeOf(opened.contentTypes, partPath);
  const normalized = declared === undefined ? undefined : localeLowerCase(declared.trim());

  return normalized === undefined || GENERIC_XML_CONTENT_TYPES.has(normalized)
    || normalized === CONTENT_TYPES.worksheet;
}

/**
 * The archive path a VBA project is stored under by every writer that stores one.
 */
const VBA_PROJECT_PART = 'xl/vbaProject.bin';

/**
 * The generic XML media types, lower-cased. A main part typed only by one of these — in practice
 * the `<Default Extension="xml" ContentType="application/xml"/>` every package declares — has no
 * kind declared at all, so it is treated like an undeclared one.
 */
const GENERIC_XML_CONTENT_TYPES: ReadonlySet<string> = new Set(['application/xml', 'text/xml']);

/**
 * Refuses a main part this reader cannot read, before a byte of it is tokenized.
 *
 * Acceptance used to be a ZIP with a workbook part at the officeDocument target, and the part's
 * declared type was never read: an `.xlsb` — the same package layout, BIFF12 records in place of
 * XML — tokenized to nothing and came back as a workbook with zero sheets, and any other OOXML
 * document moved into the layout read the same way. An `.xlsb` is named for what it is, by its
 * type or, where the package declares none, by its `.bin` main part. Any declared type outside
 * the five spreadsheet kinds is refused by name. A package that declares NO type for its main part
 * (or carries no `[Content_Types].xml` at all) still reads, as it always has — and so does one whose
 * only word on it is the generic XML `<Default>` every package carries for `.xml`, which says the
 * part is XML and nothing about which kind.
 */
function assertSpreadsheetMainPart(contentTypes: ContentTypes, workbookPath: string): void {
  const declared = contentTypeOf(contentTypes, workbookPath);
  const normalized = declared === undefined ? undefined : localeLowerCase(declared.trim());

  if (normalized === BINARY_WORKBOOK_CONTENT_TYPE || localeLowerCase(workbookPath).endsWith('.bin')) {
    throwWithCause('the file is an Excel Binary Workbook (.xlsb), which the built-in engine does not read. '
      + 'Save it as .xlsx.');
  }

  if (normalized !== undefined && !GENERIC_XML_CONTENT_TYPES.has(normalized)
    && !SPREADSHEET_MAIN_CONTENT_TYPES.has(normalized)) {
    throwWithCause(`the main part "${workbookPath}" is declared as "${declared}", `
      + 'which is not a spreadsheet workbook.');
  }
}

/**
 * Opens the archive and the workbook-level parts. Any failure here means the bytes are not a
 * workbook this reader understands.
 */
async function openPackage(buffer: ArrayBuffer, dropped: DroppedFeatures): Promise<OpenedPackage> {
  const archive = await readZip(buffer);
  const rootRels = archive.has('_rels/.rels') ? parseRels(await archive.text('_rels/.rels')) : [];
  const workbookPath = targetOf(rootRels, REL_TYPES.officeDocument, '') ?? 'xl/workbook.xml';
  const contentTypes: ContentTypes = archive.has(CONTENT_TYPES_PART)
    ? parseContentTypes(await archive.text(CONTENT_TYPES_PART))
    : { overrides: new Map<string, string>(), defaults: new Map<string, string>() };

  assertSpreadsheetMainPart(contentTypes, workbookPath);

  if (!archive.has(workbookPath)) {
    throwWithCause(`The archive has no workbook part at "${workbookPath}".`);
  }

  const { sheets, date1904, definedNames } = parseWorkbook(await archive.text(workbookPath));
  const workbookRels = await relsOf(archive, workbookPath);
  const stylesPath = targetOf(workbookRels, REL_TYPES.styles, workbookPath);
  const stringsPath = targetOf(workbookRels, REL_TYPES.sharedStrings, workbookPath);
  const packageParts = new Set([CONTENT_TYPES_PART, workbookPath].map(foldPartName));

  [stylesPath, stringsPath].forEach((path) => {
    if (path !== null) {
      packageParts.add(foldPartName(path));
    }
  });

  return {
    archive,
    workbookPath,
    workbookRels,
    sheets,
    date1904,
    definedNames,
    packageParts,
    contentTypes,
    // Detected from the package's own index only: the project is binary and is never inflated.
    hasVbaProject: workbookRels.some(rel => rel.type === REL_TYPES.vbaProject) || archive.has(VBA_PROJECT_PART),
    styles: stylesPath && archive.has(stylesPath)
      ? parseStyles(await archive.text(stylesPath), dropped)
      : EMPTY_STYLES,
    sharedStrings: stringsPath && archive.has(stringsPath)
      ? parseSharedStrings(await archive.text(stringsPath))
      : { strings: [], rich: [] },
  };
}

/**
 * The sheet kinds a `<sheet>` may resolve to besides a worksheet, by relationship type, each with
 * the name it is dropped under. The model holds worksheets and nothing else, so such a sheet is
 * skipped and recorded; the sheets around it keep their order. A `<sheet>` of any of these kinds
 * used to refuse the WHOLE workbook with `the sheet "Chart1" has no part`, because the lookup
 * asked for a worksheet relationship and found none.
 */
const NON_WORKSHEET_SHEET_TYPES = new Map<string, DroppedFeatureName>([
  [REL_TYPES.chartsheet, DROPPED_FEATURES.chartSheets],
  [REL_TYPES.dialogsheet, DROPPED_FEATURES.dialogSheets],
  [REL_TYPES.macrosheet, DROPPED_FEATURES.macroSheets],
  [REL_TYPES.intlMacrosheet, DROPPED_FEATURES.macroSheets],
]);

/**
 * How often one read tokenizes each part, keyed by the FOLDED part name: `planned` is how many
 * times the sheet list says a part will be read (filled before the first sheet), `paid` how many
 * reads the budget has been charged for, `used` how many have happened.
 */
interface TokenizeLedger {
  planned: Map<string, number>;
  paid: Map<string, number>;
  used: Map<string, number>;
}

/**
 * A part's text, for a sheet about to tokenize it, charging the archive budget for every read of
 * the same part past the first.
 *
 * The memo inflates a shared part once, but each `<sheet>` naming it is tokenized again, and an
 * empty sheet charges a single cell: 2048 sheets over one 40 MB cell-less part sat inside every
 * budget, 64 of them took 36.7 s, and the whole list extrapolated to about twenty minutes. A repeat
 * costs what a copy of the part would (two bytes per character, the decoded charge), so the total
 * tokenized across the read stays under the inflated-bytes budget however the sheets alias.
 *
 * The repeats the sheet list announces are charged together with the FIRST read, before the part
 * is tokenized at all. Charged one by one as they came, 64 sheets over one 6 MB part were refused
 * only after about twenty full parses (1.4 s, 160 MB of heap) that the refusal then threw away. A
 * read nobody planned for (a comments part two sheets share) is still charged when it happens.
 */
async function partToTokenize(archive: ZipArchive, partPath: string, ledger: TokenizeLedger): Promise<string> {
  const text = await archive.text(partPath);
  const key = foldPartName(partPath);
  const used = (ledger.used.get(key) ?? 0) + 1;
  const paid = ledger.paid.get(key) ?? 0;
  // The first read pays for itself through the inflate; every planned or extra read is charged.
  const payFor = paid === 0 ? Math.max(ledger.planned.get(key) ?? 1, 1) : Math.max(used - paid, 0);
  const repeats = paid === 0 ? payFor - 1 : payFor;

  if (repeats > 0) {
    archive.chargeReread(partPath, text.length * 2 * repeats);
  }

  ledger.used.set(key, used);
  ledger.paid.set(key, paid + payFor);

  return text;
}

/**
 * The worksheet part a sheet's relationship names, or `null` when it names none.
 */
function worksheetPathOf(opened: OpenedPackage, sheetRel: Relationship | undefined): string | null {
  return targetOf(sheetRel ? [sheetRel] : [], REL_TYPES.worksheet, opened.workbookPath);
}

/**
 * Reads one worksheet into the snapshot. The sheet's relationship is the one its `r:id` resolved
 * to, or `undefined` when the workbook declares none — which is refused here, as is a part the
 * archive does not hold.
 */
async function readSheet(
  opened: OpenedPackage,
  entry: WorkbookSheetEntry,
  sheetRel: Relationship | undefined,
  snapshot: WorkbookSnapshot,
  budget: WorkbookBudget,
  dropped: DroppedFeatures,
  ledger: TokenizeLedger
): Promise<void> {
  const sheetPath = worksheetPathOf(opened, sheetRel);

  if (sheetPath === null || !opened.archive.has(sheetPath)) {
    throwWithCause('The workbook could not be parsed by the native engine: '
      + `the sheet "${entry.name}" has no part.`);
  }

  if (!isWorksheetPart(opened, sheetPath)) {
    throwWithCause('The workbook could not be parsed by the native engine: '
      + `the sheet "${entry.name}" has no worksheet part.`);
  }

  // The sheet's rels and comments sit inside the same `try` as the sheet itself, so a malformed
  // companion part is reported with the same engine prefix as a malformed worksheet.
  try {
    const sheetRels = await relsOf(opened.archive, sheetPath);
    const commentsPath = targetOf(sheetRels, REL_TYPES.comments, sheetPath);
    const comments = commentsPath && opened.archive.has(commentsPath)
      ? parseComments(await partToTokenize(opened.archive, commentsPath, ledger))
      : new Map<string, string>();

    comments.forEach((text, ref) => {
      comments.set(ref, noteToComment(text, dropped));
    });
    const xml = await partToTokenize(opened.archive, sheetPath, ledger);

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

/**
 * Reads every sheet the workbook declares, in order, into the snapshot. Sheets are read one at a
 * time so the cell caps can refuse a workbook before the next one is allocated. A sheet that is
 * not a worksheet (a chart, dialog or macro sheet) is skipped and recorded as dropped.
 */
async function readSheets(
  opened: OpenedPackage,
  snapshot: WorkbookSnapshot,
  budget: WorkbookBudget,
  dropped: DroppedFeatures
): Promise<void> {
  const workbookRelsById = relsById(opened.workbookRels);
  const sheets = opened.sheets.map((entry) => {
    const sheetRel = workbookRelsById.get(entry.relId);
    const skippedAs = sheetRel === undefined ? undefined : NON_WORKSHEET_SHEET_TYPES.get(sheetRel.type);

    return { entry, sheetRel, skippedAs };
  });
  const ledger: TokenizeLedger = { planned: new Map(), paid: new Map(), used: new Map() };

  sheets.forEach(({ sheetRel, skippedAs }) => {
    const sheetPath = skippedAs === undefined ? worksheetPathOf(opened, sheetRel) : null;

    if (sheetPath !== null) {
      const key = foldPartName(sheetPath);

      ledger.planned.set(key, (ledger.planned.get(key) ?? 0) + 1);
    }
  });

  for (const { entry, sheetRel, skippedAs } of sheets) {
    if (skippedAs !== undefined) {
      dropped.record(skippedAs);
    } else {
      // eslint-disable-next-line no-await-in-loop -- the per-sheet sequencing this function's JSDoc states.
      await readSheet(opened, entry, sheetRel, snapshot, budget, dropped, ledger);
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
    opened = await openPackage(buffer, dropped);
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

  snapshot.definedNames = opened.definedNames;

  if (opened.hasVbaProject) {
    dropped.record(DROPPED_FEATURES.vbaProject);
  }

  try {
    await readSheets(opened, snapshot, budget, dropped);
  } finally {
    // Every part is inflated at most once per read and held as a string until the read ends, so the
    // memo is dropped with the read rather than left on the archive.
    opened.archive.release();
  }

  return snapshot;
}
