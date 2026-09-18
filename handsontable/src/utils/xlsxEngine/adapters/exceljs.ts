import { throwWithCause } from '../../../helpers/errors';
import type { DroppedFeatures } from '../capabilities';
import {
  createCellSnapshot,
  createSheetSnapshot,
  createWorkbookSnapshot,
  type CellFormula,
  type CellSnapshot,
  type CellStyleSnapshot,
  type CellValue,
  type SheetSnapshot,
  type WorkbookSnapshot,
} from '../model';
import { parseRangeRef } from '../cellRef';
import { MAX_INPUT_BYTES, MAX_SHEET_CELLS, MAX_SHEET_COLUMNS, MAX_SHEET_ROWS, MAX_WORKBOOK_CELLS } from '../limits';
import type { XlsxEngineAdapter } from './types';

/**
 * A cell value ExcelJS accepts.
 */
export type ExcelCellValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | { formula: string; result?: string | number | boolean | null }
  | { sharedFormula: string; result?: string | number | boolean | null }
  | { richText: Array<{ text: string }> }
  | { text: string | { richText: Array<{ text: string }> }; hyperlink: string }
  | { error: string };

/**
 * The ExcelJS cell surface the adapter uses.
 */
export interface ExcelJsCell {
  value: ExcelCellValue;
  type: number;
  formula: string | undefined;
  numFmt: string | undefined;
  alignment: object | undefined;
  border: object | undefined;
  font: object | undefined;
  fill: object | undefined;
  protection: { locked?: boolean } | undefined;
  dataValidation: { type?: string; formulae?: string[]; allowBlank?: boolean } | undefined;
  note: string | { texts: Array<{ text: string }> } | undefined;
  isMerged: boolean;
  /**
   * The 1-based row and column of the cell, and the top-left cell of the merge it belongs to
   * (itself when it is not merged, or is the master).
   */
  row: number;
  col: number;
  master: ExcelJsCell;
}

/**
 * The ExcelJS row surface the adapter uses.
 */
export interface ExcelJsRow {
  getCell(colNumber: number): ExcelJsCell;
  eachCell(options: { includeEmpty: boolean }, callback: (cell: ExcelJsCell, colNumber: number) => void): void;
  height: number | undefined;
  hidden: boolean | undefined;
  cellCount: number;
  /**
   * Hands the row to the worksheet's row sink. On the in-memory `Workbook` this adapter drives it
   * is a documented no-op (`Worksheet#_commitRow`), and the call is kept only because ExcelJS's
   * streaming `WorkbookWriter` implements the same surface by flushing the row to the output
   * stream — dropping it would make this writer unusable against that surface later.
   */
  commit(): void;
}

/**
 * The ExcelJS column surface the adapter uses.
 */
export interface ExcelJsColumn {
  width: number | undefined;
  hidden: boolean | undefined;
}

/**
 * The ExcelJS sheet view the adapter reads and writes.
 */
export interface ExcelJsView {
  rightToLeft?: boolean;
  state?: string;
  xSplit?: number;
  ySplit?: number;
}

/**
 * The ExcelJS worksheet surface the adapter uses.
 */
export interface ExcelJsWorksheet {
  name: string;
  getRow(rowNumber: number): ExcelJsRow;
  /**
   * Returns the row at `rowNumber` only when it already exists. Unlike `getRow`, it never
   * materializes one, which is what keeps a sparse sheet sparse while it is being read.
   */
  findRow(rowNumber: number): ExcelJsRow | undefined;
  getColumn(colNumber: number): ExcelJsColumn;
  getCell(rowNumber: number, colNumber: number): ExcelJsCell;
  mergeCells(startRow: number, startCol: number, endRow: number, endCol: number): void;
  addConditionalFormatting(descriptor: { ref: string; rules: unknown[] }): void;
  protect(password: string, options?: Record<string, boolean>): void | Promise<void>;
  sheetProtection: Record<string, unknown> | undefined;
  conditionalFormattings: Array<{ ref: string; rules: unknown[] }>;
  rowCount: number;
  columnCount: number;
  /**
   * The declared columns. Present only once a width, a hidden flag or a header was set on one, so
   * it reaches past `columnCount` exactly when a trailing column carries layout but no cell.
   */
  columns?: ExcelJsColumn[];
  /**
   * The sheet's images, which the neutral model has no room for.
   */
  getImages?(): unknown[];
  /**
   * The sheet's defined tables, keyed by name.
   */
  tables?: Record<string, unknown>;
  /**
   * The sheet's auto-filter range, or a falsy value when none is set.
   */
  autoFilter?: unknown;
  state: string;
  views: ExcelJsView[];
}

/**
 * The ExcelJS workbook surface the adapter uses.
 */
export interface ExcelJsWorkbook {
  addWorksheet(name: string): ExcelJsWorksheet;
  worksheets: ExcelJsWorksheet[];
  /**
   * The document author written into the workbook's core properties.
   */
  creator?: string;
  /**
   * The last-modified-by author written into the workbook's core properties.
   */
  lastModifiedBy?: string;
  /**
   * The workbook calculation properties. `fullCalcOnLoad` asks the consuming application to
   * recalculate every formula when the file is opened.
   */
  calcProperties?: { fullCalcOnLoad?: boolean };
  xlsx: {
    writeBuffer(options?: object): Promise<Uint8Array>;
    load(buffer: ArrayBuffer): Promise<unknown>;
  };
}

/**
 * The ExcelJS module shape: a `Workbook` constructor and the `ValueType` enum.
 */
export interface ExcelJsModule {
  Workbook: new () => ExcelJsWorkbook;
  ValueType?: Record<string, number>;
}

/**
 * Duck-types an injected value as the ExcelJS module. This is the guard `xlsx.ts` used to inline.
 */
export function isExcelJsModule(value: unknown): value is ExcelJsModule {
  return typeof value === 'object' && value !== null
    && typeof (value as { Workbook?: unknown }).Workbook === 'function';
}

/**
 * Translates the neutral compression setting into ExcelJS `writeBuffer` options.
 *
 * `false` has to name `'STORE'` explicitly. Omitting the `zip` options entirely leaves JSZip on its
 * own default, which is `DEFLATE` — so "no compression" used to compress anyway, and the option
 * could not be turned off at all.
 */
function toWriteOptions(compression: WorkbookSnapshot['compression']): object {
  if (compression === false) {
    return { zip: { compression: 'STORE' } };
  }

  return {
    zip: {
      compression: 'DEFLATE',
      compressionOptions: { level: compression },
    },
  };
}

/**
 * Copies one cell snapshot onto an ExcelJS cell. Only set fields are assigned, so ExcelJS never
 * initializes its style sentinels for cells the snapshot left untouched.
 */
function writeCell(target: ExcelJsCell, cell: CellSnapshot): void {
  if (cell.formula) {
    target.value = 'result' in cell.formula
      ? { formula: cell.formula.text, result: cell.formula.result }
      : { formula: cell.formula.text };
  } else {
    target.value = cell.value;
  }

  if (cell.numFmt) {
    target.numFmt = cell.numFmt;
  }

  if (cell.style?.alignment) {
    target.alignment = cell.style.alignment;
  }

  if (cell.style?.border) {
    target.border = cell.style.border;
  }

  if (cell.style?.font) {
    target.font = cell.style.font;
  }

  if (cell.style?.fill) {
    target.fill = cell.style.fill;
  }

  if (cell.validation) {
    target.dataValidation = cell.validation;
  }

  if (cell.comment !== null) {
    target.note = cell.comment;
  }

  if (cell.locked !== null) {
    target.protection = { locked: cell.locked };
  }
}

/**
 * Writes the rows of one sheet, committing each row the way the export always did. Answers whether
 * any cell carried a formula, which is what decides the workbook's `fullCalcOnLoad` flag.
 */
function writeRows(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot): boolean {
  let wroteFormula = false;

  sheet.rows.forEach((cells, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 1);
    const height = sheet.rowHeights[rowIndex];

    if (height !== null && height !== undefined) {
      row.height = height;
    }

    cells.forEach((cell, colIndex) => {
      if (cell !== null) {
        wroteFormula = wroteFormula || cell.formula !== null;
        writeCell(row.getCell(colIndex + 1), cell);
      }
    });

    row.commit();
  });

  return wroteFormula;
}

/**
 * Writes the layout that must exist before the cells: column widths, hidden columns and the
 * sheet view carrying freeze panes and RTL.
 */
function writeColumnLayout(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot): void {
  sheet.colWidths.forEach((width, colIndex) => {
    if (width !== null && width !== undefined) {
      worksheet.getColumn(colIndex + 1).width = width;
    }
  });
  sheet.hiddenCols.forEach((colIndex) => {
    worksheet.getColumn(colIndex + 1).hidden = true;
  });

  if (sheet.freeze || sheet.rtl) {
    const view: ExcelJsView = {};

    if (sheet.rtl) {
      view.rightToLeft = true;
    }

    if (sheet.freeze) {
      view.state = 'frozen';
      view.xSplit = sheet.freeze.cols;
      view.ySplit = sheet.freeze.rows;
    }

    worksheet.views = [view];
  }
}

/**
 * Writes the layout that must come after the cells: hidden rows, protection, merges,
 * conditional formatting and the sheet state.
 *
 * The merges are the load-bearing part of that ordering. An ExcelJS cell that already belongs
 * to a merged range forwards every `value` assignment to the range's master cell, so merging
 * before the rows are written makes the last cell of each range overwrite the master's value.
 *
 * An overlapping merge is recorded as `merge:overlap` and skipped rather than thrown, so one bad
 * range cannot abandon a whole export.
 */
async function writeSheetFeatures(
  worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, dropped: DroppedFeatures
): Promise<void> {
  sheet.hiddenRows.forEach((rowIndex) => {
    worksheet.getRow(rowIndex + 1).hidden = true;
  });

  if (sheet.protection?.enabled) {
    // `protect()` returns a Promise: the password hash is computed inside it, so a caller that
    // does not await it can serialize the sheet before the protection is recorded.
    await worksheet.protect(sheet.protection.password ?? '', sheet.protection.options);
  }

  sheet.merges.forEach(({ row, col, rowspan, colspan }) => {
    try {
      worksheet.mergeCells(row + 1, col + 1, row + rowspan, col + colspan);
    } catch {
      // ExcelJS throws `Cannot merge already merged cells` on an overlap. One malformed merge must
      // not abandon the whole export, so the range is skipped and reported instead.
      dropped.record('merge:overlap');
    }
  });

  sheet.conditionalFormatting.forEach(descriptor => worksheet.addConditionalFormatting(descriptor));
  worksheet.state = sheet.state;
}

const MS_PER_DAY = 86400000;
const UNIX_EPOCH_SERIAL = 25569;

/**
 * Converts the `Date` ExcelJS materializes for a date-formatted cell back into its serial number.
 */
function dateToSerial(date: Date): number {
  return (date.getTime() / MS_PER_DAY) + UNIX_EPOCH_SERIAL;
}

/**
 * Reads the display text of a hyperlink cell. ExcelJS allows the text of one to be a rich-text run
 * list rather than a plain string, and the model has no room for the runs — but it does have room
 * for the text they spell, so the runs are joined rather than dropped.
 */
function hyperlinkText(text: unknown): CellValue {
  if (typeof text === 'string') {
    return text;
  }

  const { richText } = (text ?? {}) as { richText?: Array<{ text?: string }> };

  return Array.isArray(richText) ? richText.map(part => part.text ?? '').join('') : null;
}

/**
 * Flattens the ExcelJS value union into the model's primitive value and optional formula.
 *
 * `cellFormula` is `source.formula`, ExcelJS's own translated-expression getter. It must win over
 * `raw.formula`/`raw.sharedFormula`: for a shared-formula slave cell, `raw.sharedFormula` is the
 * *master cell's address* (e.g. `"C1"`), not an expression, while `cell.formula` is the expression
 * already translated for that slave's position (e.g. `"A2*2"`). `raw.formula` is kept only as a
 * fallback for a formula-shaped raw value with no translated getter available.
 */
function readValue(raw: ExcelCellValue, cellFormula?: string): { value: CellValue; formula: CellFormula | null } {
  if (raw === null || raw === undefined) {
    return { value: null, formula: null };
  }

  // `instanceof Date` is false for a `Date` built in another realm (an iframe, a worker), and a
  // workbook parsed there would then read its date cells back as `null`. The brand check answers
  // for every realm.
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    return { value: dateToSerial(raw as Date), formula: null };
  }

  if (typeof raw !== 'object') {
    return { value: raw, formula: null };
  }

  if ('formula' in raw || 'sharedFormula' in raw) {
    let text = '';

    if (typeof cellFormula === 'string' && cellFormula !== '') {
      text = cellFormula;
    } else if ('formula' in raw) {
      text = raw.formula;
    }

    const formula: CellFormula = raw.result === undefined ? { text } : { text, result: readValue(raw.result).value };

    return { value: null, formula };
  }

  if ('richText' in raw) {
    return { value: raw.richText.map(part => part.text).join(''), formula: null };
  }

  if ('hyperlink' in raw) {
    return { value: hyperlinkText(raw.text), formula: null };
  }

  if ('error' in raw) {
    return { value: raw.error, formula: null };
  }

  return { value: null, formula: null };
}

/**
 * Returns `true` when an ExcelJS style object carries at least one property.
 */
function hasKeys(value: object | undefined): value is object {
  return value !== undefined && Object.keys(value).length > 0;
}

/**
 * Whether a hyperlink cell's display text is itself a rich-text run list.
 */
function hasNestedRichText(raw: object): boolean {
  const { text } = raw as { text?: unknown };

  return typeof text === 'object' && text !== null && 'richText' in text;
}

/**
 * Records what a cell's raw value carried but the model's flat `CellValue` cannot: the target of a
 * hyperlink, and the per-run formatting of a rich-text string. Both keep their text, so the read is
 * lossy rather than empty, and both are reported so the caller can say so.
 */
function recordLossyValue(raw: ExcelCellValue, dropped: DroppedFeatures): void {
  if (typeof raw !== 'object' || raw === null) {
    return;
  }

  if ('hyperlink' in raw) {
    dropped.record('hyperlink');
  }

  // A hyperlink's own text may itself be a rich-text run list, in which case the runs are nested one
  // level down and the top-level `in` test above does not see them.
  if ('richText' in raw || hasNestedRichText(raw)) {
    dropped.record('richText');
  }
}

/**
 * Reads one ExcelJS cell into a snapshot, recording validations the model cannot hold.
 */
function readCell(source: ExcelJsCell, dropped: DroppedFeatures): CellSnapshot {
  const cell = createCellSnapshot();
  const { value, formula } = readValue(source.value, source.formula);

  recordLossyValue(source.value, dropped);

  cell.value = value;
  cell.formula = formula;
  cell.numFmt = source.numFmt ?? null;

  const style: CellStyleSnapshot = {
    alignment: hasKeys(source.alignment) ? source.alignment as CellStyleSnapshot['alignment'] : null,
    font: hasKeys(source.font) ? source.font as CellStyleSnapshot['font'] : null,
    fill: hasKeys(source.fill) ? source.fill as CellStyleSnapshot['fill'] : null,
    border: hasKeys(source.border) ? source.border as CellStyleSnapshot['border'] : null,
  };

  if (style.alignment || style.font || style.fill || style.border) {
    cell.style = style;
  }

  if (source.dataValidation?.type === 'list') {
    cell.validation = {
      type: 'list',
      formulae: source.dataValidation.formulae ?? [],
      allowBlank: source.dataValidation.allowBlank ?? true,
    };
  } else if (source.dataValidation?.type) {
    dropped.record(`dataValidation:${source.dataValidation.type}`);
  }

  if (typeof source.protection?.locked === 'boolean') {
    cell.locked = source.protection.locked;
  }

  if (typeof source.note === 'string') {
    cell.comment = source.note;
  } else if (source.note?.texts) {
    cell.comment = source.note.texts.map(part => part.text).join('');
  }

  return cell;
}

/**
 * Records the sheet-level features the neutral model has no room for, so a caller can tell the user
 * what an imported sheet silently lost: embedded images, defined tables and an auto-filter range.
 */
function recordUnmodelledSheetFeatures(worksheet: ExcelJsWorksheet, dropped: DroppedFeatures): void {
  if ((worksheet.getImages?.() ?? []).length > 0) {
    dropped.record('images');
  }

  if (Object.keys(worksheet.tables ?? {}).length > 0) {
    dropped.record('tables');
  }

  if (worksheet.autoFilter) {
    dropped.record('autoFilter');
  }
}

/**
 * The extent of one merge, grown cell by cell while the rows are read. 1-based, inclusive.
 */
interface MergeBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/**
 * Grows the merge that `cell` belongs to so it covers the cell. Merges are collected here, inside
 * the row pass, rather than read from `worksheet.model.merges`: `model` is a getter that
 * re-serializes the whole worksheet (every row, every cell) on each access, which is a second
 * O(cells) walk plus a full copy for a sheet near the cell cap.
 */
function trackMerge(cell: ExcelJsCell, merges: Map<string, MergeBounds>): void {
  const { master } = cell;
  const key = `${master.row}:${master.col}`;
  const bounds = merges.get(key);

  if (bounds) {
    // A well-formed file puts the master top-left; a hand-crafted one need not, so both corners grow.
    bounds.top = Math.min(bounds.top, cell.row);
    bounds.left = Math.min(bounds.left, cell.col);
    bounds.bottom = Math.max(bounds.bottom, cell.row);
    bounds.right = Math.max(bounds.right, cell.col);
  } else {
    merges.set(key, {
      top: Math.min(master.row, cell.row),
      left: Math.min(master.col, cell.col),
      bottom: Math.max(master.row, cell.row),
      right: Math.max(master.col, cell.col),
    });
  }
}

/**
 * Reads the sheet view (freeze panes and RTL), protection and conditional formatting that apply to
 * the sheet as a whole, rather than to one cell, and turns the merge bounds collected by the row
 * pass into 0-based merge snapshots.
 *
 * Sheet protection is `worksheet.sheetProtection`, which the reader sets straight from the XML. A
 * protected sheet's password is kept in the file as a salted hash, never as the password: the hash
 * is reported as `sheetProtection:password` and deliberately not modelled, so a re-export cannot
 * pretend to carry a password it was never given.
 */
function readSheetLayout(
  worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, merges: Map<string, MergeBounds>, dropped: DroppedFeatures
): void {
  merges.forEach((bounds) => {
    sheet.merges.push({
      row: bounds.top - 1,
      col: bounds.left - 1,
      rowspan: bounds.bottom - bounds.top + 1,
      colspan: bounds.right - bounds.left + 1,
    });
  });

  const view = worksheet.views?.[0];

  if (view) {
    sheet.rtl = view.rightToLeft === true;

    if (view.state === 'frozen' && ((view.xSplit ?? 0) > 0 || (view.ySplit ?? 0) > 0)) {
      sheet.freeze = { rows: view.ySplit ?? 0, cols: view.xSplit ?? 0 };
    }
  }

  const { sheetProtection } = worksheet;

  if (sheetProtection) {
    const {
      password, hashValue, algorithmName, saltValue, spinCount, ...options
    } = sheetProtection as {
      password?: string; hashValue?: string; algorithmName?: string; saltValue?: string; spinCount?: number;
    } & Record<string, unknown>;

    if (typeof hashValue === 'string' || typeof algorithmName === 'string') {
      dropped.record('sheetProtection:password');
    }

    sheet.protection = {
      enabled: true,
      password: typeof password === 'string' && password !== '' ? password : null,
      options: Object.fromEntries(
        Object.entries(options).filter(([, optionValue]) => typeof optionValue === 'boolean'),
      ) as Record<string, boolean>,
    };
  }

  sheet.conditionalFormatting = (worksheet.conditionalFormattings ?? []).map(({ ref, rules }) => ({ ref, rules }));
  recordUnmodelledSheetFeatures(worksheet, dropped);
}

/**
 * The cells the workbook has declared so far, summed across the sheets already checked, so the
 * per-sheet cap cannot be sidestepped by declaring many sheets that each sit inside it.
 */
interface WorkbookBudget {
  declaredCells: number;
}

/**
 * Refuses a sheet whose declared size cannot be materialized, before a single row of the SNAPSHOT
 * is allocated. A workbook is an untrusted input: a file may declare a cell at `XFD1048576` and
 * cost nothing to parse while the reader that believes it allocates a 17-billion-cell rectangle.
 * These caps run after the engine has parsed the file, so they bound this reader's copy, not the
 * engine's own; the byte cap in `read()` is what bounds the parse.
 */
function assertSheetFits(
  name: string, rowCount: number, cellColCount: number, layoutColCount: number, budget: WorkbookBudget
): void {
  if (rowCount > MAX_SHEET_ROWS) {
    throwWithCause(
      `The sheet "${name}" declares ${rowCount} rows, above the ${MAX_SHEET_ROWS}-row limit this reader accepts.`
    );
  }

  if (layoutColCount > MAX_SHEET_COLUMNS) {
    throwWithCause(
      `The sheet "${name}" declares ${layoutColCount} columns, ` +
      `above the ${MAX_SHEET_COLUMNS}-column limit this reader accepts.`
    );
  }

  // The product is measured against the CELL column count, never the layout one. Excel writes a
  // single `<col min="1" max="16384"/>` for any sheet-wide width or style, and `Column.fromModel`
  // expands it into 16384 `Column` objects — so a 400-row, one-column workbook would otherwise be
  // refused as "400 × 16384 cells". A column declaration costs one object, not one per row.
  if (rowCount * cellColCount > MAX_SHEET_CELLS) {
    throwWithCause(
      `The sheet "${name}" declares ${rowCount} × ${cellColCount} cells, ` +
      `above the ${MAX_SHEET_CELLS}-cell limit this reader accepts.`
    );
  }

  // A sheet of rows with no cells still costs one array per row, so it counts one column wide; and
  // its column layout (`readColumnLayout` allocates one width entry per declared column, up to
  // 16384 for a sheet-wide `<col>`) counts on top, so many zero-row sheets cannot slip under it.
  budget.declaredCells += (rowCount * Math.max(cellColCount, 1)) + layoutColCount;

  if (budget.declaredCells > MAX_WORKBOOK_CELLS) {
    throwWithCause(
      `The workbook declares ${budget.declaredCells} cells across its sheets, ` +
      `above the ${MAX_WORKBOOK_CELLS}-cell limit this reader accepts.`
    );
  }
}

/**
 * Reads one ExcelJS row into the sheet snapshot and answers how many cells it carried, so the
 * caller can keep the sheet's width. A row that exists only to carry a height or a hidden flag
 * contributes those and nothing else.
 */
function readRow(
  row: ExcelJsRow, rowNumber: number, sheet: SheetSnapshot, dropped: DroppedFeatures, mergeType: number,
  merges: Map<string, MergeBounds>
): number {
  const cells: Array<CellSnapshot | null> = [];

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const isEmpty = (cell.value === null || cell.value === undefined) && !cell.numFmt
      && !hasKeys(cell.font) && !hasKeys(cell.fill) && !hasKeys(cell.border) && !hasKeys(cell.alignment)
      && !cell.dataValidation && cell.note === undefined && cell.protection?.locked === undefined;

    if (cell.isMerged) {
      trackMerge(cell, merges);
    }

    cells[colNumber - 1] = isEmpty || cell.type === mergeType ? null : readCell(cell, dropped);
  });

  sheet.rows[rowNumber - 1] = cells;

  if (typeof row.height === 'number') {
    sheet.rowHeights[rowNumber - 1] = row.height;
  }

  if (row.hidden === true) {
    sheet.hiddenRows.push(rowNumber - 1);
  }

  return cells.length;
}

/**
 * Fills the indexes no row was read into, so `rows` and `rowHeights` are dense arrays of exactly
 * `rowCount` entries. A row that carried cells is padded with `null` up to the sheet's width; a row
 * that carried none stays an empty array rather than growing a full width of `null`s.
 */
function padRows(sheet: SheetSnapshot, rowCount: number, sheetWidth: number): void {
  for (let index = 0; index < rowCount; index++) {
    const cells = sheet.rows[index];

    if (cells === undefined) {
      sheet.rows[index] = [];
    } else if (cells.length > 0) {
      for (let colIndex = cells.length; colIndex < sheetWidth; colIndex++) {
        cells[colIndex] = null;
      }
    }

    sheet.rowHeights[index] = sheet.rowHeights[index] ?? null;
  }
}

/**
 * Reads the width and hidden flag of every column the sheet declares.
 */
function readColumnLayout(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, colCount: number): void {
  for (let colNumber = 1; colNumber <= colCount; colNumber++) {
    const column = worksheet.getColumn(colNumber);

    sheet.colWidths[colNumber - 1] = typeof column.width === 'number' ? column.width : null;

    if (column.hidden === true) {
      sheet.hiddenCols.push(colNumber - 1);
    }
  }
}

/**
 * Reads one ExcelJS worksheet into a sheet snapshot. `mergeType` is `ValueType.Merge`, resolved once
 * per workbook read: ExcelJS's `value` getter on a merge slave cell returns the master's value, so
 * the model has to identify a slave by its cell type rather than by an empty value.
 */
function readSheet(
  worksheet: ExcelJsWorksheet, dropped: DroppedFeatures, mergeType: number, budget: WorkbookBudget
): SheetSnapshot {
  const sheet = createSheetSnapshot(worksheet.name);
  const state = worksheet.state as SheetSnapshot['state'];

  sheet.state = state === 'hidden' || state === 'veryHidden' ? state : 'visible';

  const { rowCount } = worksheet;
  // Two different column counts, and mixing them up is expensive in both directions.
  // `columnCount` is the widest populated ROW — the width the cell matrix actually needs.
  // `columns.length` reaches further whenever a column carries only layout (a width, a hidden
  // flag), which is the only place such a column is recorded; it is also inflated by Excel's
  // sheet-wide `<col min="1" max="16384"/>`, so it must never size a per-row array.
  const cellColCount = worksheet.columnCount;
  const layoutColCount = Math.max(cellColCount, worksheet.columns?.length ?? 0);

  assertSheetFits(worksheet.name, rowCount, cellColCount, layoutColCount, budget);

  // A row's own `eachCell` only reaches that row's own last populated column, so a row shorter than
  // the sheet is padded up to `sheetWidth` — the widest of the cell column count and every row
  // actually seen. A row that exists but carries no cell at all stays `[]`.
  let sheetWidth = cellColCount;
  const merges = new Map<string, MergeBounds>();

  for (let rowNumber = 1; rowNumber <= rowCount; rowNumber++) {
    // `findRow` never materializes a missing row, unlike `getRow` (which `eachRow`'s `includeEmpty`
    // mode calls): a sheet whose only cells sit at row 1 and row 100000 stays two rows in memory.
    const row = worksheet.findRow(rowNumber);

    if (row !== undefined) {
      sheetWidth = Math.max(sheetWidth, readRow(row, rowNumber, sheet, dropped, mergeType, merges));
    }
  }

  padRows(sheet, rowCount, sheetWidth);
  readColumnLayout(worksheet, sheet, layoutColCount);
  readSheetLayout(worksheet, sheet, merges, dropped);

  return sheet;
}

/**
 * The author written into every exported workbook's core properties. Excel shows "Unknown" for a
 * workbook that names none.
 */
const WORKBOOK_AUTHOR = 'Handsontable';

/**
 * Adds one worksheet, turning ExcelJS's own name validation into the library's error shape.
 *
 * `exportFile/types/xlsx.ts` sanitizes every name before it reaches here, so this is the backstop
 * for a snapshot built by hand: ExcelJS throws a bare `Error` for an illegal character, a leading
 * or trailing quote, the reserved name `History`, an empty name and a duplicate.
 */
function addWorksheet(workbook: ExcelJsWorkbook, name: string): ExcelJsWorksheet {
  try {
    return workbook.addWorksheet(name);
  } catch (error) {
    return throwWithCause(`The sheet name "${name}" was rejected by ExcelJS: ${(error as Error).message}`);
  }
}

/**
 * The ExcelJS adapter.
 */
export const excelJsAdapter: XlsxEngineAdapter = {
  async read(buffer: ArrayBuffer, module: unknown, dropped: DroppedFeatures): Promise<WorkbookSnapshot> {
    if (!isExcelJsModule(module)) {
      throwWithCause('The ExcelJS adapter received a module without a `Workbook` constructor.');
    }

    // The one guard that runs before the engine parses anything: every cap below is measured on
    // the parsed workbook, and an archive inflates to far more than its own size.
    if (buffer.byteLength > MAX_INPUT_BYTES) {
      throwWithCause(
        `The workbook is ${buffer.byteLength} bytes, above the ${MAX_INPUT_BYTES}-byte limit this reader accepts.`
      );
    }

    const workbook = new module.Workbook();

    try {
      await workbook.xlsx.load(buffer);
    } catch (error) {
      throwWithCause(`The workbook could not be parsed by ExcelJS: ${(error as Error).message}`);
    }

    const mergeType = module.ValueType?.Merge ?? 1;
    const snapshot = createWorkbookSnapshot();
    const budget: WorkbookBudget = { declaredCells: 0 };

    workbook.worksheets.forEach((worksheet) => {
      snapshot.sheets.push(readSheet(worksheet, dropped, mergeType, budget));
    });

    return snapshot;
  },

  async write(snapshot: WorkbookSnapshot, module: unknown, dropped: DroppedFeatures): Promise<Uint8Array> {
    if (!isExcelJsModule(module)) {
      throwWithCause('The ExcelJS adapter received a module without a `Workbook` constructor.');
    }

    const workbook = new module.Workbook();

    workbook.creator = WORKBOOK_AUTHOR;
    workbook.lastModifiedBy = WORKBOOK_AUTHOR;

    let wroteFormula = false;

    for (const sheet of snapshot.sheets) {
      const worksheet = addWorksheet(workbook, sheet.name);

      writeColumnLayout(worksheet, sheet);
      wroteFormula = writeRows(worksheet, sheet) || wroteFormula;
      // eslint-disable-next-line no-await-in-loop
      await writeSheetFeatures(worksheet, sheet, dropped);
    }

    if (wroteFormula && workbook.calcProperties) {
      // A formula written without a cached result shows as blank until the application recalculates.
      // Excel recalculates on its own; LibreOffice and Google Sheets honor this flag instead.
      workbook.calcProperties.fullCalcOnLoad = true;
    }

    return workbook.xlsx.writeBuffer(toWriteOptions(snapshot.compression));
  },
};
