import { throwWithCause } from '../../../helpers/errors';
import { DROPPED_FEATURES, type DroppedFeatures } from '../capabilities';
import {
  createCellSnapshot,
  createCoveredCellSnapshot,
  createSheetSnapshot,
  createWorkbookSnapshot,
  isProtectionOptionName,
  type CellFormula,
  type CellSnapshot,
  type CellStyleSnapshot,
  type CellValue,
  type MergeSnapshot,
  type SheetProtectionOptions,
  type SheetSnapshot,
  type WorkbookSnapshot,
} from '../model';
import { parseRangeRef } from '../cellRef';
import { EXCEL_EPOCH_OFFSET, MS_PER_DAY } from '../dates';
import { isWritableConditionalRule } from '../conditionalRules';
import { coveredCellFormatting, type CellFormatting } from '../coveredCellFormatting';
import { addFunctionPrefixes } from '../functionPrefixes';
import { classifyTemporalFormat } from '../numFmtCode';
import {
  MAX_INPUT_BYTES, MAX_SHEET_CELLS, MAX_SHEET_COLUMNS, MAX_SHEET_ROWS, MAX_WORKBOOK_CELLS, MAX_WORKBOOK_SHEETS,
  throwCellLimit, throwColumnLimit, throwLimitExceeded, throwRowLimit,
} from '../limits';
import { noteToComment } from '../threadedComments';
import { clampCellText, clampColumnWidth, clampRowHeight } from '../writeLimits';
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
  /**
   * The cached result of a formula cell, `undefined` for any other cell.
   */
  result?: unknown;
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
  /**
   * Merges like `mergeCells` but leaves every covered cell its own style. Optional because the
   * engine is the caller's module: ExcelJS 4 has it, a duck-typed stand-in need not.
   */
  mergeCellsWithoutStyle?(startRow: number, startCol: number, endRow: number, endCol: number): void;
  addConditionalFormatting(descriptor: { ref: string; rules: unknown[] }): void;
  protect(password: string, options?: SheetProtectionOptions): void | Promise<void>;
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
  /**
   * The workbook properties ExcelJS reads from `<workbookPr>`. `date1904` is set when the file
   * counts dates from 1904 (ExcelJS 4.4 recognizes only the `"1"` spelling).
   */
  properties?: { date1904?: boolean };
  /**
   * The names the workbook defines, as `{ name, ranges }` entries.
   */
  definedNames?: { model?: Array<{ name?: string }> };
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
 *
 * The formula gets the `_xlfn.` prefix Excel stores in front of a post-2007 function, exactly as
 * the native writer does: ExcelJS writes the text it is handed verbatim, and a bare `IFS(` shows
 * `#NAME?` in Excel until the cell is entered again. A string past Excel's cell limit is cut the
 * same way the native writer cuts it.
 */
function writeCell(target: ExcelJsCell, cell: CellSnapshot, dropped: DroppedFeatures): void {
  if (cell.formula) {
    const formula = addFunctionPrefixes(cell.formula.text);

    target.value = 'result' in cell.formula ? { formula, result: cell.formula.result } : { formula };
  } else {
    target.value = typeof cell.value === 'string' ? clampCellText(cell.value, dropped) : cell.value;
  }

  writeCellFormatting(target, cell);

  if (cell.validation) {
    target.dataValidation = cell.validation;
  }

  if (cell.comment !== null) {
    target.note = cell.comment;
  }
}

/**
 * Copies a cell's number format, style and lock onto an ExcelJS cell. Only set fields are
 * assigned, so ExcelJS never initializes its style sentinels for an unformatted cell.
 */
function writeCellFormatting(target: ExcelJsCell, formatting: CellFormatting): void {
  if (formatting.numFmt) {
    target.numFmt = formatting.numFmt;
  }

  if (formatting.style?.alignment) {
    target.alignment = formatting.style.alignment;
  }

  if (formatting.style?.border) {
    target.border = formatting.style.border;
  }

  if (formatting.style?.font) {
    target.font = formatting.style.font;
  }

  if (formatting.style?.fill) {
    target.fill = formatting.style.fill;
  }

  if (formatting.locked !== null) {
    target.protection = { locked: formatting.locked };
  }
}

/**
 * Writes the rows of one sheet, committing each row the way the export always did. Answers whether
 * any cell carried a formula, which is what decides the workbook's `fullCalcOnLoad` flag.
 */
function writeRows(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, dropped: DroppedFeatures): boolean {
  let wroteFormula = false;

  sheet.rows.forEach((cells, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 1);
    const height = sheet.rowHeights[rowIndex];

    if (height !== null && height !== undefined) {
      row.height = clampRowHeight(height, dropped);
    }

    cells.forEach((cell, colIndex) => {
      if (cell !== null) {
        wroteFormula = wroteFormula || cell.formula !== null;
        writeCell(row.getCell(colIndex + 1), cell, dropped);
      }
    });

    row.commit();
  });

  return wroteFormula;
}

/**
 * Writes the layout that must exist before the cells: column widths, hidden columns and the
 * sheet view carrying freeze panes and RTL. A width past what Excel stores is written at Excel's
 * maximum, the same clamp the native writer applies.
 */
function writeColumnLayout(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, dropped: DroppedFeatures): void {
  sheet.colWidths.forEach((width, colIndex) => {
    if (width !== null && width !== undefined) {
      worksheet.getColumn(colIndex + 1).width = clampColumnWidth(width, dropped);
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
 * Whether any cell a merge covers (every member but the master) carries formatting of its own in
 * the snapshot: a style, a lock or a number format.
 */
function coversOwnFormatting(sheet: SheetSnapshot, merge: MergeSnapshot): boolean {
  for (let row = merge.row; row < merge.row + merge.rowspan; row++) {
    for (let col = merge.col; col < merge.col + merge.colspan; col++) {
      const cell = sheet.rows[row]?.[col] ?? null;
      const isFormatted = cell !== null && (cell.style !== null || cell.locked !== null || cell.numFmt !== null);

      if ((row !== merge.row || col !== merge.col) && isFormatted) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Merges a range whose covered cells carry formatting of their own. `mergeCellsWithoutStyle` leaves
 * every covered cell as it is, and each one is then given the formatting `coveredCellFormatting`
 * resolves - the rule the native writer applies - so its own lock survives and the master's border
 * and fill still reach the block's edges.
 */
function mergeKeepingOwnFormatting(
  worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, merge: MergeSnapshot,
): void {
  const { row, col, rowspan, colspan } = merge;
  const master = sheet.rows[row]?.[col] ?? null;

  (worksheet.mergeCellsWithoutStyle as NonNullable<ExcelJsWorksheet['mergeCellsWithoutStyle']>)(
    row + 1, col + 1, row + rowspan, col + colspan,
  );

  for (let r = row; r < row + rowspan; r++) {
    for (let c = col; c < col + colspan; c++) {
      if (r !== row || c !== col) {
        writeCellFormatting(worksheet.getCell(r + 1, c + 1), coveredCellFormatting(master, sheet.rows[r]?.[c]));
      }
    }
  }
}

/**
 * Makes ExcelJS write the `<c>` of a merge master that holds nothing: no value, no formula and no
 * formatting (a `null` slot included). ExcelJS skips such a cell, and Apple's parser (Quick Look,
 * Numbers) then places the cells after it one column early, so the merge is not drawn and the row
 * shifts left. An empty alignment is the smallest style that gives the cell a style index of its
 * own: it changes nothing a reader shows, and ExcelJS then writes `<c r="A2" s="1"/>`. The native
 * writer writes the same master as `<c r="A2"/>`.
 */
function markEmptyMaster(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot, row: number, col: number): void {
  const master = sheet.rows[row]?.[col];
  const isEmpty = !master || (
    master.value === null && master.formula === null
    && master.numFmt === null && master.style === null && master.locked === null
  );

  if (isEmpty) {
    worksheet.getCell(row + 1, col + 1).alignment = {};
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
 * range cannot abandon a whole export. A single-cell merge is skipped silently, as the native
 * writer skips it: it merges nothing.
 *
 * `mergeCells` copies the master's style over every covered cell, protection included, so an
 * unlocked covered cell was written locked and imported read-only once unmerged. A merge whose
 * covered cells carry formatting of their own is therefore merged through
 * `mergeKeepingOwnFormatting`, which applies `coveredCellFormatting` - the native writer's rule - to
 * each covered cell. Every other merge keeps the copy, which is what that rule gives an unformatted
 * covered cell anyway.
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
    if (rowspan <= 1 && colspan <= 1) {
      return;
    }

    try {
      markEmptyMaster(worksheet, sheet, row, col);

      if (worksheet.mergeCellsWithoutStyle && coversOwnFormatting(sheet, { row, col, rowspan, colspan })) {
        mergeKeepingOwnFormatting(worksheet, sheet, { row, col, rowspan, colspan });
      } else {
        worksheet.mergeCells(row + 1, col + 1, row + rowspan, col + colspan);
      }
    } catch {
      // ExcelJS throws `Cannot merge already merged cells` on an overlap. One malformed merge must
      // not abandon the whole export, so the range is skipped and reported instead.
      dropped.record(DROPPED_FEATURES.mergeOverlap);
    }
  });

  sheet.conditionalFormatting.forEach((descriptor) => {
    const rules = Array.isArray(descriptor.rules)
      ? descriptor.rules.filter(rule => isWritableConditionalRule(rule, dropped))
      : [];

    if (rules.length > 0) {
      worksheet.addConditionalFormatting({ ...descriptor, rules });
    }
  });
  worksheet.state = sheet.state;
}

/**
 * Converts the `Date` ExcelJS materializes for a date-formatted cell back into its serial number,
 * rounded to 9 decimal places (well under a millisecond). The division left float noise the native
 * reader never has: a `[mm]:ss` cell holding 0.075 read back as `0.0750000000007276`.
 */
function dateToSerial(date: Date): number {
  return Math.round(((date.getTime() / MS_PER_DAY) + EXCEL_EPOCH_OFFSET) * 1e9) / 1e9;
}

/**
 * Days between the 1904 and the 1900 date systems' day zero.
 */
const DATE_1904_OFFSET = 1462;

/**
 * Whether ExcelJS handed a value over as a `Date` (by brand, so a `Date` from another realm counts).
 */
function isDateValue(value: unknown): boolean {
  return Object.prototype.toString.call(value) === '[object Date]';
}

/**
 * Takes the 1904 shift back off every time-formatted cell of a 1904 workbook. ExcelJS builds a
 * `Date` on the 1904 epoch for any date-like format, and `dateToSerial` turns it into a 1900
 * serial - right for a date, wrong for a time: a time of day or an elapsed `[h]:mm` value is a
 * fraction of a day or a duration, the same number in either system, so a 12:00 duration read as
 * 1462.5. Only a value ExcelJS really turned into a `Date` is corrected (ExcelJS leaves `[s]` a
 * number), which is why the worksheet is consulted again. Mirrors the native reader, which never
 * shifts a time.
 */
function unshiftTimes1904(worksheet: ExcelJsWorksheet, sheet: SheetSnapshot): void {
  sheet.rows.forEach((cells, rowIndex) => {
    cells.forEach((cell, colIndex) => {
      if (!cell?.numFmt || classifyTemporalFormat(cell.numFmt) !== 'time') {
        return;
      }

      const raw = worksheet.findRow(rowIndex + 1)?.getCell(colIndex + 1).value;

      if (typeof cell.value === 'number' && isDateValue(raw)) {
        cell.value = Math.round((cell.value - DATE_1904_OFFSET) * 1e9) / 1e9;
      }

      const result = (raw as { result?: unknown } | null | undefined)?.result;

      if (cell.formula && typeof cell.formula.result === 'number' && isDateValue(result)) {
        cell.formula.result = Math.round((cell.formula.result - DATE_1904_OFFSET) * 1e9) / 1e9;
      }
    });
  });
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
 *
 * `cellResult` is `source.result`, the cached result ExcelJS keeps on the cell. The value object
 * carries `result` only when it is truthy (`FormulaValue#value` in ExcelJS 4.4), so a formula that
 * evaluates to `0`, `FALSE` or `""` read back with no result at all, and imported empty without the
 * Formulas plugin; `cell.result` still answers for it.
 */
function readValue(
  raw: ExcelCellValue, cellFormula?: string, cellResult?: unknown,
): { value: CellValue; formula: CellFormula | null } {
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

    const result = raw.result === undefined ? cellResult : raw.result;
    const formula: CellFormula = result === undefined
      ? { text }
      : { text, result: readValue(result as ExcelCellValue).value };

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
    dropped.record(DROPPED_FEATURES.hyperlink);
  }

  // A hyperlink's own text may itself be a rich-text run list, in which case the runs are nested one
  // level down and the top-level `in` test above does not see them.
  if ('richText' in raw || hasNestedRichText(raw)) {
    dropped.record(DROPPED_FEATURES.richText);
  }
}

/**
 * The style an ExcelJS cell carries, or `null` when it carries none.
 */
function readStyle(source: ExcelJsCell): CellStyleSnapshot | null {
  const style: CellStyleSnapshot = {
    alignment: hasKeys(source.alignment) ? source.alignment as CellStyleSnapshot['alignment'] : null,
    font: hasKeys(source.font) ? source.font as CellStyleSnapshot['font'] : null,
    fill: hasKeys(source.fill) ? source.fill as CellStyleSnapshot['fill'] : null,
    border: hasKeys(source.border) ? source.border as CellStyleSnapshot['border'] : null,
  };

  return style.alignment || style.font || style.fill || style.border ? style : null;
}

/**
 * The lock an ExcelJS cell declares, or `null` when it declares none.
 */
function readLocked(source: ExcelJsCell): boolean | null {
  return typeof source.protection?.locked === 'boolean' ? source.protection.locked : null;
}

/**
 * The code ExcelJS answers for built-in number format 22. ECMA-376 defines id 22 as `m/d/yy h:mm`;
 * ExcelJS's table quotes the `h`, which turns it into a literal letter, so the inference read the
 * rest as a date and the time of day was lost from the data (a re-export lost it too).
 */
const EXCELJS_BUILT_IN_22 = 'm/d/yy "h":mm';

/**
 * Reads a cell's number format, with ExcelJS's spelling of built-in id 22 mapped back to the one
 * ECMA-376 defines and the native reader reads.
 */
function readNumFmt(source: ExcelJsCell): string | null {
  const numFmt = source.numFmt ?? null;

  return numFmt === EXCELJS_BUILT_IN_22 ? 'm/d/yy h:mm' : numFmt;
}

/**
 * The names an ExcelJS workbook defines, Excel's own `_xlnm.` names left out. ExcelJS keeps only
 * the names whose value is a range, which is what a formula over a named range uses.
 */
function readDefinedNames(workbook: ExcelJsWorkbook): string[] {
  const model = workbook.definedNames?.model;
  const names = new Set<string>();

  (Array.isArray(model) ? model : []).forEach(({ name }) => {
    if (typeof name === 'string' && name !== '' && !name.startsWith('_xlnm.')) {
      names.add(name);
    }
  });

  return [...names];
}

/**
 * Reads one ExcelJS cell into a snapshot, recording validations the model cannot hold.
 */
function readCell(source: ExcelJsCell, dropped: DroppedFeatures): CellSnapshot {
  const cell = createCellSnapshot();
  const { value, formula } = readValue(source.value, source.formula, source.result);

  recordLossyValue(source.value, dropped);

  cell.value = value;
  cell.formula = formula;
  cell.numFmt = readNumFmt(source);
  cell.style = readStyle(source);

  if (source.dataValidation?.type === 'list') {
    cell.validation = {
      type: 'list',
      formulae: source.dataValidation.formulae ?? [],
      // OOXML defaults `allowBlank` to false, and ExcelJS leaves the key out when the attribute is.
      allowBlank: source.dataValidation.allowBlank ?? false,
    };
  } else if (source.dataValidation?.type) {
    dropped.recordUnsupported('dataValidation', source.dataValidation.type);
  }

  cell.locked = readLocked(source);

  if (typeof source.note === 'string') {
    cell.comment = noteToComment(source.note, dropped);
  } else if (source.note?.texts?.length === 0) {
    // ExcelJS reads a note's text from its `<r>` runs only, so a plain `<text><t>` note arrives
    // with no runs at all. Importing it as an empty comment would hide that the text was lost.
    dropped.record(DROPPED_FEATURES.commentUnreadable);
  } else if (source.note?.texts) {
    cell.comment = noteToComment(source.note.texts.map(part => part.text).join(''), dropped);
  }

  return cell;
}

/**
 * Records the sheet-level features the neutral model has no room for, so a caller can tell the user
 * what an imported sheet silently lost: embedded images, defined tables and an auto-filter range.
 */
function recordUnmodelledSheetFeatures(worksheet: ExcelJsWorksheet, dropped: DroppedFeatures): void {
  if ((worksheet.getImages?.() ?? []).length > 0) {
    dropped.record(DROPPED_FEATURES.images);
  }

  if (Object.keys(worksheet.tables ?? {}).length > 0) {
    dropped.record(DROPPED_FEATURES.tables);
  }

  if (worksheet.autoFilter) {
    dropped.record(DROPPED_FEATURES.autoFilter);
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

  // ECMA-376 defaults `sheet` to false, and ExcelJS reads only `sheet="1"` as `true`: a
  // `<sheetProtection formatCells="0"/>` (the shape Apache POI writes) records permissions for a
  // sheet nobody protected, and reading it as protected made every imported cell read-only.
  // LibreOffice writes `sheet="true"`, which ExcelJS reads as not protected; for a sheet with a
  // password it still keeps the hash attributes, and a password hash only exists on a protected
  // sheet, so the hash counts as protection too. A LibreOffice sheet protected WITHOUT a password
  // carries nothing ExcelJS keeps, and still reads as unprotected on this engine.
  const isProtected = sheetProtection?.sheet === true
    || typeof sheetProtection?.algorithmName === 'string'
    || typeof sheetProtection?.hashValue === 'string';

  if (sheetProtection && isProtected) {
    const {
      password, hashValue, algorithmName, saltValue, spinCount, ...options
    } = sheetProtection as {
      password?: string; hashValue?: string; algorithmName?: string; saltValue?: string; spinCount?: number;
    } & Record<string, unknown>;

    if (typeof hashValue === 'string' || typeof algorithmName === 'string') {
      dropped.record(DROPPED_FEATURES.sheetProtectionPassword);
    }

    sheet.protection = {
      enabled: true,
      password: typeof password === 'string' && password !== '' ? password : null,
      // Only the names the model declares are kept: ExcelJS hands back whatever the file carried,
      // and an unknown attribute would otherwise live in the snapshot for the import's lifetime.
      options: Object.fromEntries(
        Object.entries(options)
          .filter(([key, optionValue]) => typeof optionValue === 'boolean' && isProtectionOptionName(key)),
      ) as SheetProtectionOptions,
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
    throwRowLimit(name, rowCount);
  }

  if (layoutColCount > MAX_SHEET_COLUMNS) {
    throwColumnLimit(name, layoutColCount);
  }

  // The product is measured against the CELL column count, never the layout one. Excel writes a
  // single `<col min="1" max="16384"/>` for any sheet-wide width or style, and `Column.fromModel`
  // expands it into 16384 `Column` objects — so a 400-row, one-column workbook would otherwise be
  // refused as "400 × 16384 cells". A column declaration costs one object, not one per row.
  if (rowCount * cellColCount > MAX_SHEET_CELLS) {
    throwCellLimit(name, rowCount, cellColCount);
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

    if (isEmpty) {
      cells[colNumber - 1] = null;
    } else if (cell.type === mergeType) {
      // A covered cell's `value` getter answers with the MASTER's value, so only its own style
      // and lock are read, the way the native reader reads it. ExcelJS's loader merges without
      // copying the master's style (`mergeCellsWithoutStyle`), so these are the cell's own.
      cells[colNumber - 1] = createCoveredCellSnapshot(readStyle(cell), readLocked(cell));
    } else {
      cells[colNumber - 1] = readCell(cell, dropped);
    }
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

    // The same cap, and the same sentence, as the native reader's. ExcelJS has already parsed every
    // sheet by now, so this bounds what the adapter copies into the snapshot, not the parse.
    if (workbook.worksheets.length > MAX_WORKBOOK_SHEETS) {
      throwLimitExceeded(`The workbook declares more than ${MAX_WORKBOOK_SHEETS} sheets, `
        + 'above the limit this reader accepts.');
    }

    const mergeType = module.ValueType?.Merge ?? 1;
    const snapshot = createWorkbookSnapshot();
    const budget: WorkbookBudget = { declaredCells: 0 };

    const isDate1904 = workbook.properties?.date1904 === true;

    workbook.worksheets.forEach((worksheet) => {
      const sheet = readSheet(worksheet, dropped, mergeType, budget);

      if (isDate1904) {
        unshiftTimes1904(worksheet, sheet);
      }

      snapshot.sheets.push(sheet);
    });

    snapshot.definedNames = readDefinedNames(workbook);

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

      writeColumnLayout(worksheet, sheet, dropped);
      wroteFormula = writeRows(worksheet, sheet, dropped) || wroteFormula;
      // eslint-disable-next-line no-await-in-loop -- one sheet at a time: `protect()` hashes the password.
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
