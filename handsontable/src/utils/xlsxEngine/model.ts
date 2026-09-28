/**
 * A primitive cell value shared by every engine.
 */
export type CellValue = string | number | boolean | null;

/**
 * A formula cell. `text` carries the formula without the leading `=`; `result` is the cached value
 * and is optional so the two shapes the export produces (`{ formula }` and `{ formula, result }`)
 * round-trip unchanged.
 */
export interface CellFormula {
  text: string;
  result?: CellValue;
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
 * Sheet protection. `options` carries the engine-neutral permission flags the export sets today.
 */
export interface SheetProtectionSnapshot {
  enabled: boolean;
  password: string | null;
  options: Record<string, boolean>;
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
