/**
 * A primitive cell value shared by every engine.
 */
export type CellValue = string | number | boolean | null;

/**
 * The error values a cell can hold in OOXML (`ST_CellType` `e`, ECMA-376 18.18.11). A cached
 * formula result is written as an error only when it is one of these: anything else in a `t="e"`
 * cell is a file Excel repairs, and readers such as Apache POI refuse the code.
 */
export const OOXML_ERROR_CODES: ReadonlySet<string> = new Set([
  '#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A',
]);

/**
 * Whether a value is one of the {@link OOXML_ERROR_CODES}.
 */
export function isOoxmlErrorCode(value: unknown): value is string {
  return typeof value === 'string' && OOXML_ERROR_CODES.has(value);
}

/**
 * A formula cell. `text` carries the formula without the leading `=`; `result` is the cached value
 * and is optional so the two shapes the export produces (`{ formula }` and `{ formula, result }`)
 * round-trip unchanged.
 *
 * `resultIsError` says the cached result is an ERROR value, not text: `result` then holds the
 * OOXML error code (`#DIV/0!`) and both writers type the cell `t="e"`. It is set by the export from
 * the Formulas engine's own cell value, never from the text, because a formula may answer the text
 * `#N/A` (`="#N/A"`), which is a string. A flagged result that is not one of the
 * {@link OOXML_ERROR_CODES} is written as text. The readers do not set it: they hand an error result
 * back as its code text, as before.
 */
export interface CellFormula {
  text: string;
  result?: CellValue;
  resultIsError?: boolean;
}

/**
 * Visual style of a cell. The shapes are exactly what `exportFile/types/xlsx/cell-style.ts` builds.
 */
export interface CellStyleSnapshot {
  alignment: { horizontal?: string; vertical?: string } | null;
  font: { bold?: boolean; italic?: boolean; underline?: boolean; color?: { argb: string } } | null;
  fill: { type: 'pattern'; pattern: 'solid'; fgColor: { argb: string } } | null;
  border: Partial<Record<'top' | 'right' | 'bottom' | 'left', { style: string; color?: { argb: string } }>> | null;
}

/**
 * List data validation, the only kind the grid produces (dropdown and autocomplete cells).
 */
export interface CellValidationSnapshot {
  type: 'list';
  formulae: string[];
  allowBlank: boolean;
}

/**
 * One cell of a sheet.
 */
export interface CellSnapshot {
  value: CellValue;
  formula: CellFormula | null;
  numFmt: string | null;
  style: CellStyleSnapshot | null;
  validation: CellValidationSnapshot | null;
  locked: boolean | null;
  comment: string | null;
}

/**
 * A merged area in 0-based sheet coordinates.
 */
export interface MergeSnapshot {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * The permissions a protected sheet may grant, every one of them optional and absent by default.
 * `true` means the action stays ALLOWED on a protected sheet, which is the sense ExcelJS's
 * `worksheet.protect()` uses — OOXML stores most of them inverted, and each adapter's writer and
 * reader is what flips them.
 *
 * The set is closed on purpose: a reader takes these names out of a file and nothing else, so an
 * unknown or hostile `<sheetProtection>` attribute cannot ride along in the snapshot.
 */
const SHEET_PROTECTION_OPTION_NAMES = [
  'sheet', 'objects', 'scenarios', 'selectLockedCells', 'selectUnlockedCells', 'formatCells',
  'formatColumns', 'formatRows', 'insertColumns', 'insertRows', 'insertHyperlinks', 'deleteColumns',
  'deleteRows', 'sort', 'autoFilter', 'pivotTables',
] as const;

/**
 * One permission name.
 */
export type SheetProtectionOptionName = typeof SHEET_PROTECTION_OPTION_NAMES[number];

/**
 * The permissions themselves, keyed by name.
 */
export type SheetProtectionOptions = { [K in SheetProtectionOptionName]?: boolean };

/**
 * The names above as a set, for the membership test below.
 */
const PROTECTION_OPTION_NAME_SET = new Set<string>(SHEET_PROTECTION_OPTION_NAMES);

/**
 * Whether an attribute name a file carries is one of the permissions the model declares. This is
 * the allow-list both readers filter `<sheetProtection>` through.
 */
export function isProtectionOptionName(name: string): name is SheetProtectionOptionName {
  return PROTECTION_OPTION_NAME_SET.has(name);
}

/**
 * Sheet protection. `options` carries the engine-neutral permission flags the export sets today.
 */
export interface SheetProtectionSnapshot {
  enabled: boolean;
  password: string | null;
  options: SheetProtectionOptions;
}

/**
 * One worksheet.
 *
 * `rows` has one entry per row up to the sheet's last used row, and `rows[r][c]` is `null` for an
 * empty cell — never a hole. A row that carries no cell at all is the empty array, so a sparse
 * sheet costs nothing per empty row: `rows[r]` may therefore be shorter than the sheet is wide
 * (`[]` in the limit), and every reader must take `rows[r]?.[c] ?? null` rather than indexing into
 * it blind. Rows that do carry cells are padded with `null` to the sheet's width.
 */
export interface SheetSnapshot {
  name: string;
  state: 'visible' | 'hidden' | 'veryHidden';
  rtl: boolean;
  rows: Array<Array<CellSnapshot | null>>;
  colWidths: Array<number | null>;
  rowHeights: Array<number | null>;
  hiddenCols: number[];
  hiddenRows: number[];
  merges: MergeSnapshot[];
  freeze: { rows: number; cols: number } | null;
  protection: SheetProtectionSnapshot | null;
  conditionalFormatting: Array<{ ref: string; rules: unknown[] }>;
}

/**
 * A whole workbook, the unit every adapter reads and writes.
 */
export interface WorkbookSnapshot {
  sheets: SheetSnapshot[];
  compression: false | number;
  /**
   * The names the workbook defines (`<definedNames>`), read on import only and never written. A
   * formula that uses one cannot resolve unless the Formulas engine defines it too. Excel's own
   * `_xlnm.` names (print areas, the filter database) are left out.
   */
  definedNames?: string[];
  /**
   * The formula characters the native reader's shared-formula translation ran over, read on import
   * only. The import mapper starts its own formula-walk count from it, so one import spends
   * `MAX_TRANSLATED_FORMULA_CHARS` once, not once in the reader and again in the mapper.
   */
  translatedFormulaChars?: number;
}

/**
 * Creates an empty workbook snapshot.
 */
export function createWorkbookSnapshot(): WorkbookSnapshot {
  return { sheets: [], compression: false };
}

/**
 * Creates an empty, visible sheet snapshot.
 */
export function createSheetSnapshot(name: string): SheetSnapshot {
  return {
    name,
    state: 'visible',
    rtl: false,
    rows: [],
    colWidths: [],
    rowHeights: [],
    hiddenCols: [],
    hiddenRows: [],
    merges: [],
    freeze: null,
    protection: null,
    conditionalFormatting: [],
  };
}

/**
 * Creates an empty cell snapshot.
 */
export function createCellSnapshot(): CellSnapshot {
  return {
    value: null,
    formula: null,
    numFmt: null,
    style: null,
    validation: null,
    locked: null,
    comment: null,
  };
}

/**
 * The snapshot of a cell a merge COVERS: its own style and lock, and nothing else. Both readers
 * build it through here so they agree. The value belongs to the merge's master; the number format
 * formats no value, and kept it would sway the column's type inference. The lock is the reason
 * this exists: a covered cell read as `null` imported read-only under sheet protection whatever its
 * own `locked="0"` said, which showed once the user unmerged. Returns `null` when the cell carries
 * neither, which is what a covered cell with no formatting reads as.
 *
 * @param {CellStyleSnapshot|null} style The covered cell's own style.
 * @param {boolean|null} locked The covered cell's own lock.
 * @returns {CellSnapshot|null}
 */
export function createCoveredCellSnapshot(
  style: CellStyleSnapshot | null,
  locked: boolean | null,
): CellSnapshot | null {
  if (style === null && locked === null) {
    return null;
  }

  const cell = createCellSnapshot();

  cell.style = style;
  cell.locked = locked;

  return cell;
}
