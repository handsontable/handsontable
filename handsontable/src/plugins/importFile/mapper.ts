import { throwWithCause } from '../../helpers/errors';
import { escapeHtml } from '../../helpers/string';
import type { DroppedFeatures } from '../../utils/xlsxEngine/capabilities';
import type { CellSnapshot, MergeSnapshot, SheetSnapshot, WorkbookSnapshot } from '../../utils/xlsxEngine/model';
import { parseMultiRangeRef } from '../../utils/xlsxEngine/cellRef';
import { shiftFormulaReferences } from '../../utils/xlsxEngine/formulaRefs';
import {
  excelWidthToPx,
  inferCellType,
  pointsToPx,
  resolveListSource,
  serialToIsoDate,
  serialToIsoDateTime,
  serialToTimeString,
  type InferredType,
} from './inference';
import { alignmentClassNames, borderEntry, fontFillRule, type ImportedBorder, type StyleRule } from './styles';
import type {
  ImportColumn, ImportedConditionalFormatting, ImportedNestedHeader, ImportOptions, ImportResult,
} from './importFile';

/**
 * Plugin state the mapper needs from the target instance.
 */
export interface MapperContext {
  /**
   * Whether the `formulas` plugin is enabled, so formula cells can be written as `=...` strings.
   */
  formulasEnabled: boolean;
  /**
   * Whether cell comments should be collected into the result.
   */
  commentsEnabled: boolean;
  /**
   * Whether the `customBorders` plugin is enabled, so border styles can be collected into the result.
   */
  customBordersEnabled: boolean;
}

/**
 * `ImportOptions` with every default filled in.
 */
export interface ResolvedImportOptions {
  /**
   * Sheet to import, by 0-based index among the workbook's sheets or by name.
   */
  sheet: string | number;
  /**
   * `'firstRow'` promotes the first sheet row to column headers.
   */
  colHeaders: boolean | 'firstRow';
  /**
   * `true` drops the first sheet column and enables generated row headers.
   */
  rowHeaders: boolean;
  /**
   * How many rows the promoted header band spans. Above `1` it produces `nestedHeaders`.
   */
  headerRows: number;
  /**
   * Cell range to import in 0-based sheet coordinates, or `null` for the whole used range.
   */
  range: number[] | null;
  /**
   * Derive `numeric`, `date`, `time`, `checkbox` and `dropdown` cell types.
   */
  inferCellTypes: boolean;
  /**
   * Put formula strings into the data when the `formulas` plugin is enabled.
   */
  importFormulas: boolean;
  /**
   * Import merges, hidden rows and columns, frozen panes, column widths and row heights.
   */
  importLayout: boolean;
  /**
   * Apply the result to the grid.
   */
  apply: boolean;
  /**
   * Apply alignment, font, fill and borders from the workbook as generated class names, style
   * rules and `customBorders` entries.
   */
  importStyles: boolean;
}

/**
 * Everything the mapper produces; the plugin adds `engine`.
 */
export type MappedResult = Omit<ImportResult, 'engine'>;

/**
 * Fills the documented defaults into user options, and rejects a `headerRows` the mapper cannot
 * build a header band from. It is validated here rather than at the call site because this is the
 * one funnel both public entry points go through.
 */
export function resolveImportOptions(options: ImportOptions | undefined): ResolvedImportOptions {
  const headerRows = options?.headerRows ?? 1;

  if (!Number.isInteger(headerRows) || headerRows < 1) {
    throwWithCause(
      'The "headerRows" import option has to be an integer greater than or equal to 1. ' +
        `Received: ${JSON.stringify(options?.headerRows)}.`
    );
  }

  return {
    sheet: options?.sheet ?? 0,
    colHeaders: options?.colHeaders ?? false,
    rowHeaders: options?.rowHeaders ?? false,
    headerRows,
    range: options?.range ?? null,
    inferCellTypes: options?.inferCellTypes ?? true,
    importFormulas: options?.importFormulas ?? true,
    importLayout: options?.importLayout ?? true,
    apply: options?.apply ?? true,
    importStyles: options?.importStyles ?? false,
  };
}

/**
 * Selects the sheet to import. A number indexes the sheets that are not very hidden (helper sheets
 * never get picked by accident); a string matches any sheet by name.
 */
export function selectSheet(workbook: WorkbookSnapshot, selector: string | number): SheetSnapshot {
  const names = workbook.sheets.map(sheet => sheet.name).join(', ');
  const sheet = typeof selector === 'number'
    ? workbook.sheets.filter(candidate => candidate.state !== 'veryHidden')[selector]
    : workbook.sheets.find(candidate => candidate.name === selector);

  if (!sheet) {
    throwWithCause(`Sheet "${selector}" was not found in the workbook. Available sheets: ${names}.`);
  }

  return sheet;
}

/**
 * The rectangle of the sheet being imported, in 0-based sheet coordinates, after `range`,
 * header promotion and row-header removal.
 */
interface SheetWindow {
  /**
   * The first data row, in sheet coordinates.
   */
  firstRow: number;
  /**
   * The first data column, in sheet coordinates.
   */
  firstCol: number;
  /**
   * The last data row, in sheet coordinates.
   */
  lastRow: number;
  /**
   * The last data column, in sheet coordinates.
   */
  lastCol: number;
}

/**
 * Computes the sheet rectangle: the explicit `range` or the used range, minus the promoted header
 * band and the dropped row-header column. The band is `headerRows` tall, so a nested header of
 * several rows pushes the data start down by all of them, not by one.
 */
function computeWindow(sheet: SheetSnapshot, options: ResolvedImportOptions): SheetWindow {
  const usedCols = sheet.rows.reduce((max, row) => Math.max(max, row.length), 0);
  const [rangeStartRow, rangeStartCol, rangeEndRow, rangeEndCol] = options.range
    ?? [0, 0, sheet.rows.length - 1, usedCols - 1];

  return {
    firstRow: rangeStartRow + (options.colHeaders === 'firstRow' ? options.headerRows : 0),
    firstCol: rangeStartCol + (options.rowHeaders ? 1 : 0),
    lastRow: rangeEndRow,
    lastCol: rangeEndCol,
  };
}

/**
 * Converts one cell to the grid value, using the inferred type to turn serials into strings.
 */
function toGridValue(cell: CellSnapshot, inferred: InferredType | null): unknown {
  const value = cell.formula ? cell.formula.result ?? null : cell.value;

  if (typeof value !== 'number' || !inferred) {
    return value;
  }

  // The presence of an hour in the derived options is what separates a date-time format from a
  // date-only one; the value the grid stores stays the ISO string either way.
  if (inferred.type === 'date') {
    return inferred.dateFormat.hour === undefined ? serialToIsoDate(value) : serialToIsoDateTime(value);
  }

  if (inferred.type === 'time') {
    return serialToTimeString(value);
  }

  return value;
}

/**
 * Turns an inferred type into the column-level or cell-level meta object.
 */
function toMeta(inferred: InferredType): ImportColumn {
  switch (inferred.type) {
    case 'numeric':
      return inferred.numericFormat
        ? { type: 'numeric', numericFormat: inferred.numericFormat }
        : { type: 'numeric' };
    case 'date':
      return { type: 'date', dateFormat: inferred.dateFormat };
    case 'time':
      return { type: 'time', timeFormat: inferred.timeFormat };
    default:
      return { type: inferred.type };
  }
}

/**
 * Per-cell mapping state collected in one pass over the window.
 */
interface CellPass {
  /**
   * The data matrix, in the window's own 0-based coordinates.
   */
  data: unknown[][];
  /**
   * Per-cell meta keyed by `"row:col"`, before it is lifted to `columns` or `cellsMeta`.
   */
  metaByCell: Map<string, ImportColumn>;
  /**
   * Cell formulas read from the workbook.
   */
  formulas: NonNullable<ImportResult['formulas']>;
  /**
   * Cell comments read from the workbook.
   */
  comments: NonNullable<ImportResult['comments']>;
  /**
   * Coordinates of every cell that must be marked `readOnly`.
   */
  readOnly: Array<{ row: number; col: number }>;
  /**
   * Whether any visited cell carried a style, so `cellStyles` can be reported once as dropped.
   */
  sawStyle: boolean;
  /**
   * Class names collected per cell, keyed by `"row:col"`, when `importStyles` is on.
   */
  classNames: Map<string, string[]>;
  /**
   * Generated style rules, keyed by class name, deduplicated across cells.
   */
  styles: Map<string, string>;
  /**
   * `customBorders` entries collected when `importStyles` is on and the plugin is enabled.
   */
  borders: ImportedBorder[];
  /**
   * Whether a border was seen but dropped because the `customBorders` plugin is off.
   */
  droppedBorders: boolean;
  /**
   * Whether a comment was seen but dropped because the `comments` plugin is off.
   */
  droppedComments: boolean;
}

/**
 * Resolves the meta of one cell: dropdown from its list validation, else the inferred type. `sheet`
 * is the one the cell sits on, which is where an unqualified list range is read from.
 */
function resolveCellMeta(
  cell: CellSnapshot, inferred: InferredType | null, sheet: SheetSnapshot, workbook: WorkbookSnapshot,
  dropped: DroppedFeatures
): ImportColumn | null {
  if (inferred?.type === 'numeric' && inferred.unsupportedNumFmt) {
    dropped.record(`numFmt:${inferred.unsupportedNumFmt}`);
  }

  if (cell.validation) {
    const source = resolveListSource(cell.validation, workbook, sheet);

    if (source) {
      return { type: 'dropdown', source };
    }

    dropped.record('dataValidation:unresolvedList');
  }

  return inferred ? toMeta(inferred) : null;
}

/**
 * How far a sheet formula has to move to become a grid formula: the negated window origin. `null`
 * when live formulas are off, in which case every formula is recorded rather than written.
 */
interface FormulaShift {
  /**
   * Rows to add to every relative row reference.
   */
  rowDelta: number;
  /**
   * Columns to add to every relative column reference.
   */
  colDelta: number;
}

/**
 * Pushes one cell's value onto the data row, writing a live formula string when the formulas
 * plugin is enabled and recording the cached formula otherwise.
 *
 * The export shifts every reference forward by the header row and the row-header column it
 * prepends, so the sheet's `C2` is the grid's `B1`; this shifts it back by the window origin. A
 * reference the shift would push above row 1 or left of column A pointed into that header band,
 * which the import drops - the formula then cannot be expressed in grid coordinates at all, so the
 * cached value is imported instead and the formula is reported.
 */
function pushCellValue(
  pass: CellPass, cell: CellSnapshot, inferred: InferredType | null,
  shift: FormulaShift | null, row: number, col: number, dropped: DroppedFeatures
): void {
  const live = cell.formula && shift
    ? shiftFormulaReferences(cell.formula.text, shift.rowDelta, shift.colDelta)
    : null;

  if (live !== null) {
    pass.data[pass.data.length - 1].push(`=${live}`);

    return;
  }

  pass.data[pass.data.length - 1].push(toGridValue(cell, inferred));

  if (cell.formula) {
    pass.formulas.push({ row, col, formula: cell.formula.text });

    if (shift) {
      dropped.record('formula:outOfRange');
    }
  }
}

/**
 * Splits a `"row:col"` cell key back into the two indexes it carries.
 */
function parseCellKey(key: string): { row: number; col: number } {
  const separator = key.indexOf(':');

  return { row: Number(key.slice(0, separator)), col: Number(key.slice(separator + 1)) };
}

/**
 * Records one generated rule and answers the class name the cell must carry.
 *
 * `styleHash` is a djb2 hash, so two different declaration strings can in principle land on the same
 * name. When the name is already taken by DIFFERENT declarations a `-2`, `-3`, ... suffix is
 * appended until a free one is found, so a collision costs an extra class rather than silently
 * painting one cell with another cell's style. The suffixed shape is part of the class-name contract
 * `applier.ts#installImportedStyles` validates against.
 */
export function registerStyleRule(styles: Map<string, string>, rule: StyleRule): string {
  let { className } = rule;
  let suffix = 1;

  while (styles.has(className) && styles.get(className) !== rule.declarations) {
    suffix += 1;
    className = `${rule.className}-${suffix}`;
  }

  styles.set(className, rule.declarations);

  return className;
}

/**
 * Collects one cell's style into the pass: alignment and generated font/fill class names, the
 * declarations behind them, and a `customBorders` entry (or a dropped-borders flag when the
 * plugin is off). No-ops when `importStyles` is off or the cell has no style.
 */
function collectStyle(
  cell: CellSnapshot, row: number, col: number, readOnly: boolean,
  pass: CellPass, options: ResolvedImportOptions, context: MapperContext
): void {
  if (!options.importStyles || !cell.style) {
    return;
  }

  const { style } = cell;
  const classes = alignmentClassNames(style.alignment);
  const rule = fontFillRule(style, { readOnly });

  if (rule) {
    classes.push(registerStyleRule(pass.styles, rule));
  }

  if (classes.length > 0) {
    pass.classNames.set(`${row}:${col}`, classes);
  }

  const border = borderEntry(style.border, row, col);

  if (border) {
    if (context.customBordersEnabled) {
      pass.borders.push(border);
    } else {
      pass.droppedBorders = true;
    }
  }
}

/**
 * Everything one cell's collection needs beyond the cell itself, assembled once per sheet.
 */
interface CollectContext {
  /**
   * The sheet being imported, for the protection flag a cell's `locked` is read against.
   */
  sheet: SheetSnapshot;
  /**
   * The whole workbook, for resolving a list validation that points at another sheet.
   */
  workbook: WorkbookSnapshot;
  /**
   * The resolved import options.
   */
  options: ResolvedImportOptions;
  /**
   * What the target instance supports.
   */
  context: MapperContext;
  /**
   * How far a sheet formula has to move to become a grid formula, or `null` for cached values only.
   */
  shift: FormulaShift | null;
  /**
   * Where dropped features are recorded.
   */
  dropped: DroppedFeatures;
}

/**
 * Collects one cell into the pass, in the window's own 0-based coordinates.
 */
function collectCell(pass: CellPass, cell: CellSnapshot, row: number, col: number, scope: CollectContext): void {
  const { sheet, workbook, options, context, shift, dropped } = scope;
  const inferred = options.inferCellTypes ? inferCellType(cell) : null;
  const meta = options.inferCellTypes ? resolveCellMeta(cell, inferred, sheet, workbook, dropped) : null;

  if (meta) {
    pass.metaByCell.set(`${row}:${col}`, meta);
  }

  pushCellValue(pass, cell, inferred, shift, row, col, dropped);

  if (cell.comment !== null) {
    if (context.commentsEnabled) {
      pass.comments.push({ row, col, value: cell.comment });
    } else {
      pass.droppedComments = true;
    }
  }

  const readOnly = sheet.protection?.enabled === true && cell.locked !== false;

  if (readOnly) {
    pass.readOnly.push({ row, col });
  }

  pass.sawStyle = pass.sawStyle || cell.style !== null;
  collectStyle(cell, row, col, readOnly, pass, options, context);
}

/**
 * Walks the window once, producing the data matrix and every per-cell fact the result needs.
 *
 * A snapshot row may be shorter than the window, or empty altogether (an all-empty sheet row costs
 * no cells at all), so every read goes through `sheet.rows[row]?.[col] ?? null`.
 */
function collectCells(
  sheet: SheetSnapshot, workbook: WorkbookSnapshot, window: SheetWindow,
  options: ResolvedImportOptions, context: MapperContext, dropped: DroppedFeatures
): CellPass {
  const pass: CellPass = {
    data: [],
    metaByCell: new Map(),
    formulas: [],
    comments: [],
    readOnly: [],
    sawStyle: false,
    classNames: new Map(),
    styles: new Map(),
    borders: [],
    droppedBorders: false,
    droppedComments: false,
  };
  const scope: CollectContext = {
    sheet,
    workbook,
    options,
    context,
    shift: options.importFormulas && context.formulasEnabled
      ? { rowDelta: -window.firstRow, colDelta: -window.firstCol }
      : null,
    dropped,
  };

  for (let row = window.firstRow; row <= window.lastRow; row++) {
    pass.data.push([]);

    for (let col = window.firstCol; col <= window.lastCol; col++) {
      const cell = sheet.rows[row]?.[col] ?? null;

      if (cell === null) {
        pass.data[pass.data.length - 1].push(null);
      } else {
        collectCell(pass, cell, row - window.firstRow, col - window.firstCol, scope);
      }
    }
  }

  return pass;
}

/**
 * Buckets the per-cell meta by column in one pass, so placing it costs one walk over the map
 * instead of one walk per column. Each bucket keeps the map's insertion order, which is row-major,
 * so a column's entries come out with ascending row indexes.
 */
function groupMetaByColumn(metaByCell: Map<string, ImportColumn>): Map<number, Array<[number, ImportColumn]>> {
  const byColumn = new Map<number, Array<[number, ImportColumn]>>();

  metaByCell.forEach((meta, key) => {
    const { row, col } = parseCellKey(key);
    const entries = byColumn.get(col);

    if (entries) {
      entries.push([row, meta]);
    } else {
      byColumn.set(col, [[row, meta]]);
    }
  });

  return byColumn;
}

/**
 * One `cellsMeta` entry, as the result carries it.
 */
type CellMetaEntry = NonNullable<ImportResult['cellsMeta']>[number];

/**
 * Returns the `cellsMeta` entry for one cell, appending a fresh one the first time that cell is
 * seen. The `"row:col"` index is what keeps this constant-time: the `readOnly` and `className`
 * merges both fold into entries the column pass already produced, and scanning the growing array
 * for each of them made placing the meta quadratic in the number of styled or locked cells.
 */
function cellMetaEntryAt(
  cellsMeta: CellMetaEntry[], index: Map<string, CellMetaEntry>, row: number, col: number
): CellMetaEntry {
  const key = `${row}:${col}`;
  const existing = index.get(key);

  if (existing) {
    return existing;
  }

  const entry: CellMetaEntry = { row, col, meta: {} };

  cellsMeta.push(entry);
  index.set(key, entry);

  return entry;
}

/**
 * Whether every cell of one column derived the same meta, which is what lets it be lifted to
 * `columns`. The first entry is serialized once and compared against each of the others, so a column
 * that disagrees on its second cell costs two serializations rather than one per cell.
 */
function columnMetaAgrees(entries: Array<[number, ImportColumn]>): boolean {
  if (entries.length === 0) {
    return false;
  }

  const first = JSON.stringify(entries[0][1]);

  for (let index = 1; index < entries.length; index++) {
    if (JSON.stringify(entries[index][1]) !== first) {
      return false;
    }
  }

  return true;
}

/**
 * Lifts per-cell meta to `columns` where a whole column agrees, and leaves the rest as `cellsMeta`.
 * `columns` is included only when `includeTypes` is set, so `inferCellTypes: false` can still land
 * `readOnly` entries without producing column types.
 */
function placeMeta(
  pass: CellPass, colCount: number, includeTypes: boolean
): Pick<ImportResult, 'columns' | 'cellsMeta'> {
  const columns: ImportColumn[] = [];
  const cellsMeta: NonNullable<ImportResult['cellsMeta']> = [];
  const byCoords = new Map<string, CellMetaEntry>();
  const metaByColumn = groupMetaByColumn(pass.metaByCell);

  for (let c = 0; c < colCount; c++) {
    const entries = metaByColumn.get(c) ?? [];

    if (columnMetaAgrees(entries)) {
      columns.push(entries[0][1]);
    } else {
      columns.push({});
      entries.forEach(([row, meta]) => {
        cellMetaEntryAt(cellsMeta, byCoords, row, c).meta = { ...meta };
      });
    }
  }

  pass.readOnly.forEach(({ row, col }) => {
    cellMetaEntryAt(cellsMeta, byCoords, row, col).meta.readOnly = true;
  });

  pass.classNames.forEach((classes, key) => {
    const { row, col } = parseCellKey(key);

    cellMetaEntryAt(cellsMeta, byCoords, row, col).meta.className = classes.join(' ');
  });

  return {
    columns: includeTypes && columns.length > 0 ? columns : undefined,
    cellsMeta: cellsMeta.length > 0 ? cellsMeta : undefined,
  };
}

/**
 * Shifts one merge into window coordinates and clamps it to the window's bounds, shrinking its
 * span instead of dropping it whenever only part of it survives the header row/column removal or
 * a `range`. Returns `null` when the merge falls fully outside the window, or would clamp down to
 * a single cell (a 1x1 "merge" carries no information).
 */
function cropMerge(
  merge: MergeSnapshot, rowShift: number, colShift: number, rowCount: number, colCount: number
): MergeSnapshot | null {
  const startRow = Math.max(merge.row - rowShift, 0);
  const startCol = Math.max(merge.col - colShift, 0);
  const endRow = Math.min(merge.row - rowShift + merge.rowspan - 1, rowCount - 1);
  const endCol = Math.min(merge.col - colShift + merge.colspan - 1, colCount - 1);

  if (startRow > endRow || startCol > endCol) {
    return null;
  }

  const rowspan = endRow - startRow + 1;
  const colspan = endCol - startCol + 1;

  if (rowspan === 1 && colspan === 1) {
    return null;
  }

  return { row: startRow, col: startCol, rowspan, colspan };
}

/**
 * Shifts and crops the sheet layout into the window's coordinates.
 */
function mapLayout(sheet: SheetSnapshot, window: SheetWindow): Partial<ImportResult> {
  const rowShift = window.firstRow;
  const colShift = window.firstCol;
  const rowCount = window.lastRow - window.firstRow + 1;
  const colCount = window.lastCol - window.firstCol + 1;
  const inWindow = (row: number, col: number) => row >= 0 && row < rowCount && col >= 0 && col < colCount;

  const mergeCells = sheet.merges
    .map(merge => cropMerge(merge, rowShift, colShift, rowCount, colCount))
    .filter((merge): merge is MergeSnapshot => merge !== null);
  const hiddenRows = sheet.hiddenRows.map(row => row - rowShift).filter(row => inWindow(row, 0));
  const hiddenColumns = sheet.hiddenCols.map(col => col - colShift).filter(col => inWindow(0, col));
  const colWidths = Array.from({ length: colCount }, (_, c) => {
    const width = sheet.colWidths[c + colShift];

    return width === null || width === undefined ? undefined : excelWidthToPx(width);
  });
  const rowHeights = Array.from({ length: rowCount }, (_, r) => {
    const height = sheet.rowHeights[r + rowShift];

    return height === null || height === undefined ? undefined : pointsToPx(height);
  });
  const fixedRowsTop = sheet.freeze ? sheet.freeze.rows - rowShift : 0;
  const fixedColumnsStart = sheet.freeze ? sheet.freeze.cols - colShift : 0;

  return {
    mergeCells: mergeCells.length > 0 ? mergeCells : undefined,
    hiddenRows: hiddenRows.length > 0 ? hiddenRows : undefined,
    hiddenColumns: hiddenColumns.length > 0 ? hiddenColumns : undefined,
    colWidths: colWidths.some(width => width !== undefined) ? colWidths : undefined,
    rowHeights: rowHeights.some(height => height !== undefined) ? rowHeights : undefined,
    fixedRowsTop: fixedRowsTop > 0 ? fixedRowsTop : undefined,
    fixedColumnsStart: fixedColumnsStart > 0 ? fixedColumnsStart : undefined,
    // Always present under `importLayout`, both values: the plugin compares it against the target
    // grid, and a workbook that says "left to right" has to be able to disagree with an RTL grid.
    layoutDirection: sheet.rtl ? 'rtl' : 'ltr',
  };
}

/**
 * Converts the sheet's conditional formatting into grid coordinates.
 *
 * A `ref` is 1-based and inclusive, and may name several rectangles separated by spaces
 * (`"A1:B2 D1:E2"`); each becomes its own descriptor, and a bare cell reference is a 1x1 one. Each
 * range is shifted by the window origin and clamped to the window, so a rule reaching past the
 * imported rectangle still covers what is left of it, and a range lying wholly outside is skipped.
 *
 * It is produced regardless of `importLayout`: conditional formatting is a statement about cells,
 * not about the sheet's layout, and `importLayout` is documented as merges, hidden rows and columns,
 * frozen panes, widths and heights. It is also NOT reported under `dropped` - the rules reach the
 * caller on the result, which is the same treatment a formula gets when the grid cannot evaluate it.
 */
function mapConditionalFormatting(
  sheet: SheetSnapshot, window: SheetWindow
): ImportedConditionalFormatting[] | undefined {
  const rowCount = window.lastRow - window.firstRow + 1;
  const colCount = window.lastCol - window.firstCol + 1;
  const descriptors: ImportedConditionalFormatting[] = [];

  sheet.conditionalFormatting.forEach(({ ref, rules }) => {
    parseMultiRangeRef(ref).forEach((range) => {
      const startRow = Math.max(range.startRow - 1 - window.firstRow, 0);
      const startCol = Math.max(range.startCol - 1 - window.firstCol, 0);
      const endRow = Math.min(range.endRow - 1 - window.firstRow, rowCount - 1);
      const endCol = Math.min(range.endCol - 1 - window.firstCol, colCount - 1);

      if (startRow > endRow || startCol > endCol) {
        return;
      }

      descriptors.push({ rows: [startRow, endRow], cols: [startCol, endCol], rules });
    });
  });

  return descriptors.length > 0 ? descriptors : undefined;
}

/**
 * Reads the promoted header row as strings, escaped.
 *
 * Handsontable renders `colHeaders` as HTML, so an imported header is markup unless it is escaped:
 * a cell reading `<img src=x onerror=…>` in the workbook's first row would otherwise execute on
 * render. The values are data the file supplied, not display strings the application authored, so
 * they are escaped rather than sanitized — escaping keeps `5 < 10` whole, which stripping does not.
 * An application that deliberately wants HTML headers has to re-enable it itself, and owns the
 * `sanitizer` policy that goes with it.
 */
function mapHeaders(sheet: SheetSnapshot, window: SheetWindow, options: ResolvedImportOptions): string[] | undefined {
  if (options.colHeaders !== 'firstRow' || options.headerRows > 1) {
    return undefined;
  }

  const headerRow = sheet.rows[window.firstRow - 1] ?? [];
  const headers: string[] = [];

  for (let col = window.firstCol; col <= window.lastCol; col++) {
    const value = headerRow[col]?.value;

    headers.push(value === null || value === undefined ? '' : escapeHtml(String(value)));
  }

  return headers;
}

/**
 * Every merge that covers a cell of the header band, keyed by the `"row:col"` of each covered cell,
 * so one lookup answers both "is this header cell inside a merge" and "which merge". The map is
 * bounded by the band's height times the window's width, which is what keeps the header walk linear
 * instead of rescanning every merge per cell.
 */
function buildHeaderCoverage(
  sheet: SheetSnapshot, bandStart: number, bandEnd: number, window: SheetWindow
): Map<string, MergeSnapshot> {
  const coverage = new Map<string, MergeSnapshot>();

  sheet.merges.forEach((merge) => {
    const mergeEndRow = merge.row + merge.rowspan - 1;
    const mergeEndCol = merge.col + merge.colspan - 1;

    if (merge.row > bandEnd || mergeEndRow < bandStart
      || merge.col > window.lastCol || mergeEndCol < window.firstCol) {
      return;
    }

    for (let row = Math.max(merge.row, bandStart); row <= Math.min(mergeEndRow, bandEnd); row++) {
      for (let col = Math.max(merge.col, window.firstCol); col <= Math.min(mergeEndCol, window.lastCol); col++) {
        coverage.set(`${row}:${col}`, merge);
      }
    }
  });

  return coverage;
}

/**
 * Reads one header-band cell as the escaped string a `nestedHeaders` label has to be.
 *
 * A nested header `label` is written to the DOM as HTML and Handsontable does not sanitize it by
 * default (`metaSchema.ts`, `nestedHeaders`), so a workbook cell reading `<img src=x onerror=…>`
 * would execute on render. This escapes for exactly the reason `mapHeaders` does, and the same way:
 * escaping keeps `5 < 10` whole, which stripping does not.
 */
function headerLabelAt(sheet: SheetSnapshot, row: number, col: number): string {
  const value = sheet.rows[row]?.[col]?.value;

  return value === null || value === undefined ? '' : escapeHtml(String(value));
}

/**
 * Builds the `nestedHeaders` setting from the `headerRows` rows above the data window.
 *
 * One layer per band row, walked left to right. A cell inside a band merge consumes the whole merge
 * (clamped to the window's last column) and becomes a `{ label, colspan }` group; a cell outside any
 * merge is a plain string, and so is a merge that clamps down to a single column. The grid's
 * `nestedHeaders` has no vertical span of its own here, so a merge that reaches DOWN through several
 * band rows keeps its label on the row it starts at and leaves `''` on the rows below it - which is
 * exactly what the export wrote, since `#writeNestedColumnHeaders` puts the label in the top layer
 * only. A merge starting left of the window (a dropped row-header column, or a `range`) still takes
 * its label from its own origin cell: that cell holds the header text, even though it is outside the
 * imported rectangle.
 *
 * Returns `undefined` for a single-row band, which keeps `colHeaders` the answer for the common case.
 */
function mapNestedHeaders(
  sheet: SheetSnapshot, window: SheetWindow, options: ResolvedImportOptions
): ImportedNestedHeader[][] | undefined {
  if (options.colHeaders !== 'firstRow' || options.headerRows < 2) {
    return undefined;
  }

  const bandEnd = window.firstRow - 1;
  const bandStart = bandEnd - options.headerRows + 1;
  const coverage = buildHeaderCoverage(sheet, bandStart, bandEnd, window);
  const layers: ImportedNestedHeader[][] = [];

  for (let row = bandStart; row <= bandEnd; row++) {
    const layer: ImportedNestedHeader[] = [];
    let col = window.firstCol;

    while (col <= window.lastCol) {
      const merge = coverage.get(`${row}:${col}`);
      const lastCol = merge ? Math.min(merge.col + merge.colspan - 1, window.lastCol) : col;
      const colspan = lastCol - col + 1;
      const label = merge && merge.row !== row ? '' : headerLabelAt(sheet, row, merge ? merge.col : col);

      layer.push(colspan > 1 ? { label, colspan } : label);
      col = lastCol + 1;
    }

    layers.push(layer);
  }

  return layers;
}

/**
 * Removes every key whose value is `undefined`, so applying the result never overrides a setting
 * the file said nothing about.
 */
function stripUndefined<T extends object>(result: T): T {
  Object.keys(result).forEach((key) => {
    if (result[key as keyof T] === undefined) {
      delete result[key as keyof T];
    }
  });

  return result;
}

/**
 * Maps the selected sheet of a workbook snapshot to an import result.
 */
export function mapWorkbook(
  workbook: WorkbookSnapshot, options: ResolvedImportOptions, context: MapperContext, dropped: DroppedFeatures
): MappedResult {
  const sheet = selectSheet(workbook, options.sheet);
  const window = computeWindow(sheet, options);
  const colCount = Math.max(window.lastCol - window.firstCol + 1, 0);
  const pass = collectCells(sheet, workbook, window, options, context, dropped);

  if (options.importStyles) {
    if (pass.droppedBorders) {
      dropped.record('cellStyles:borders');
    }
  } else if (pass.sawStyle) {
    dropped.record('cellStyles');
  }

  if (pass.droppedComments) {
    dropped.record('comments');
  }

  const result: MappedResult = {
    data: pass.data,
    colHeaders: mapHeaders(sheet, window, options),
    nestedHeaders: mapNestedHeaders(sheet, window, options),
    rowHeaders: options.rowHeaders ? true : undefined,
    ...placeMeta(pass, colCount, options.inferCellTypes),
    ...(options.importLayout ? mapLayout(sheet, window) : {}),
    formulas: pass.formulas.length > 0 ? pass.formulas : undefined,
    comments: pass.comments.length > 0 ? pass.comments : undefined,
    conditionalFormatting: mapConditionalFormatting(sheet, window),
    styles: pass.styles.size > 0 ? Object.fromEntries(pass.styles) : undefined,
    customBorders: pass.borders.length > 0 ? pass.borders : undefined,
    sheetNames: workbook.sheets.map(candidate => candidate.name),
    dropped: dropped.list(),
  };

  return stripUndefined(result);
}
