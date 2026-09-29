import { throwWithCause } from '../../helpers/errors';
import { escapeHtml } from '../../helpers/string';
import type { DroppedFeatures } from '../../utils/xlsxEngine/capabilities';
import type { CellSnapshot, MergeSnapshot, SheetSnapshot, WorkbookSnapshot } from '../../utils/xlsxEngine/model';
import { parseMultiRangeRef, parseRangeRef } from '../../utils/xlsxEngine/cellRef';
import { shiftFormulaReferences } from '../../utils/xlsxEngine/formulaRefs';
import {
  excelWidthToPx,
  cellDisplayValue,
  inferCellType,
  pointsToPx,
  resolveListSource,
  toDisplayText,
  toGridValue,
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
 * Whether `range` is the documented `[startRow, startCol, endRow, endCol]` shape: four non-negative
 * integers, each start at or before its end. A short array used to destructure into `undefined`,
 * the row loop then never ran, and the import resolved with `data: []` - which the applier handed
 * to `loadData`, wiping the grid with no error.
 */
function isValidRange(range: unknown): range is [number, number, number, number] {
  return Array.isArray(range) && range.length === 4
    && range.every(bound => Number.isInteger(bound) && bound >= 0)
    && range[0] <= range[2] && range[1] <= range[3];
}

/**
 * Fills the documented defaults into user options, and rejects a `headerRows` or `range` the mapper
 * cannot build a window from. It is validated here rather than at the call site because this is the
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

  const range = options?.range ?? null;

  if (range !== null && !isValidRange(range)) {
    throwWithCause(
      'The "range" import option has to be four non-negative integers, [startRow, startCol, endRow, endCol], ' +
        `with each start at or before its end. Received: ${JSON.stringify(range)}.`
    );
  }

  return {
    sheet: options?.sheet ?? 0,
    colHeaders: options?.colHeaders ?? false,
    rowHeaders: options?.rowHeaders ?? false,
    headerRows,
    range,
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
    // Clamped to the sheet's extent: `range: [0, 0, 999, 999]` on a 3x3 sheet must not invent a
    // thousand empty rows, and a formula shift or a merge crop must never see a window larger than
    // the sheet.
    lastRow: Math.min(rangeEndRow, sheet.rows.length - 1),
    lastCol: Math.min(rangeEndCol, usedCols - 1),
  };
}

/**
 * Caps `headerRows` at the rows the range actually holds, so a header band can never be taller than
 * the sheet: `headerRows: 1e9` used to loop `mapNestedHeaders` a billion times. `range` is clamped
 * to the sheet's extent for the same reason `computeWindow` clamps the window.
 */
function clampToSheet(sheet: SheetSnapshot, options: ResolvedImportOptions): ResolvedImportOptions {
  const lastSheetRow = Math.max(sheet.rows.length - 1, 0);
  const lastSheetCol = Math.max(sheet.rows.reduce((max, row) => Math.max(max, row.length), 0) - 1, 0);
  const [rangeStartRow, rangeStartCol, rangeEndRow] = options.range ?? [0, 0, lastSheetRow, 0];

  // A start past the sheet is not a window at all: the collect loop would run zero times and the
  // applier would hand `data: []` to `loadData`, wiping the grid with no error - the same failure a
  // malformed `range` used to produce, reached through a well-formed one.
  if (options.range !== null && (rangeStartRow > lastSheetRow || rangeStartCol > lastSheetCol)) {
    throwWithCause(
      `The "range" import option starts outside the sheet "${sheet.name}", which holds ` +
      `${lastSheetRow + 1} rows and ${lastSheetCol + 1} columns. Received: ${JSON.stringify(options.range)}.`
    );
  }

  const rowsInRange = Math.min(rangeEndRow, lastSheetRow) - rangeStartRow + 1;

  return { ...options, headerRows: Math.max(Math.min(options.headerRows, rowsInRange), 1) };
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
 * Resolves a list validation into its dropdown meta, once per distinct formula within a pass. A
 * validated column repeats the same formula on every cell, and reading the range each time walks
 * it in full: a 100k-row dropdown column over a 1,000-row list used to cost 10^8 cell reads. The
 * cached meta object is shared by every cell that carries the formula, so `columnMetaAgrees` can
 * recognize the column by reference instead of serializing each entry. `null` is cached too, so an
 * unresolvable list is reported once per pass rather than once per cell.
 */
function resolveDropdownMeta(cell: CellSnapshot, scope: CollectContext): ImportColumn | null {
  const validation = cell.validation;

  if (!validation) {
    return null;
  }

  const key = validation.formulae.join('\u0000');

  if (scope.listMetaByFormula.has(key)) {
    return scope.listMetaByFormula.get(key) ?? null;
  }

  const source = resolveListSource(validation, scope.workbook, scope.sheet);
  const meta: ImportColumn | null = source ? { type: 'dropdown', source } : null;

  if (!meta) {
    scope.dropped.record('dataValidation:unresolvedList');
  }

  scope.listMetaByFormula.set(key, meta);

  return meta;
}

/**
 * Resolves the meta of one cell: dropdown from its list validation, else the inferred type's meta,
 * shared with every other cell of the same number format.
 */
function resolveCellMeta(cell: CellSnapshot, inferredMeta: InferredMeta, scope: CollectContext): ImportColumn | null {
  const { inferred, meta } = inferredMeta;

  if (inferred?.type === 'numeric' && inferred.unsupportedNumFmt) {
    scope.dropped.record(`numFmt:${inferred.unsupportedNumFmt}`);
  }

  if (cell.validation) {
    const dropdown = resolveDropdownMeta(cell, scope);

    if (dropdown) {
      return dropdown;
    }
  }

  return meta;
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
  /**
   * Dropdown meta already resolved in this pass, keyed by the list validation's formula. `null`
   * marks a formula that could not be resolved.
   */
  listMetaByFormula: Map<string, ImportColumn | null>;
  /**
   * The inferred type and its meta object per distinct number format and value kind, so a sheet
   * with a handful of formats parses each once rather than once per cell, and every cell of a
   * homogeneous column shares one meta object that `columnMetaAgrees` settles by reference.
   */
  inferredByFormat: Map<string, InferredMeta>;
}

/**
 * What one number format infers to, cached per pass.
 */
interface InferredMeta {
  inferred: InferredType | null;
  meta: ImportColumn | null;
}

/**
 * Infers a cell's type through the pass cache. The key is the number format plus the kind of value,
 * which is everything `inferCellType` reads.
 */
function inferForCell(cell: CellSnapshot, scope: CollectContext): InferredMeta {
  const key = `${cell.numFmt ?? ''}\u0000${typeof cellDisplayValue(cell)}`;
  const cached = scope.inferredByFormat.get(key);

  if (cached) {
    return cached;
  }

  const inferred = inferCellType(cell);
  const entry: InferredMeta = { inferred, meta: inferred ? toMeta(inferred) : null };

  scope.inferredByFormat.set(key, entry);

  return entry;
}

/**
 * Collects one cell into the pass, in the window's own 0-based coordinates.
 */
function collectCell(pass: CellPass, cell: CellSnapshot, row: number, col: number, scope: CollectContext): void {
  const { sheet, options, context, shift, dropped } = scope;
  const inferredMeta = options.inferCellTypes ? inferForCell(cell, scope) : null;
  const inferred = inferredMeta?.inferred ?? null;
  const meta = inferredMeta ? resolveCellMeta(cell, inferredMeta, scope) : null;

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
    listMetaByFormula: new Map(),
    inferredByFormat: new Map(),
  };

  for (let row = window.firstRow; row <= window.lastRow; row++) {
    pass.data.push([]);

    for (let col = window.firstCol; col <= window.lastCol; col++) {
      const cell = sheet.rows[row]?.[col] ?? null;

      if (cell === null) {
        pass.data[pass.data.length - 1].push(null);

        // OOXML treats a cell with no explicit `<protection>` as locked, and an empty cell has
        // none, so under sheet protection a blank imports read-only like its filled neighbours.
        if (sheet.protection?.enabled === true) {
          pass.readOnly.push({ row: row - window.firstRow, col: col - window.firstCol });
        }
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
 * The meta most cells of a column derived, with the entries that disagree with it. Reference-equal
 * entries (every cell of one number format shares one meta object, every cell of one list formula
 * one dropdown meta) are counted without serializing; a structurally equal object that is not the
 * same reference still counts as the same meta.
 */
function dominantMeta(
  entries: Array<[number, ImportColumn]>
): { meta: ImportColumn; outliers: Array<[number, ImportColumn]> } {
  const counts = new Map<ImportColumn, number>();
  const canonical = new Map<string, ImportColumn>();
  const resolve = (meta: ImportColumn): ImportColumn => {
    if (counts.has(meta)) {
      return meta;
    }

    const key = JSON.stringify(meta);
    const seen = canonical.get(key);

    if (seen) {
      return seen;
    }

    canonical.set(key, meta);

    return meta;
  };
  const resolved = entries.map(([row, meta]): [number, ImportColumn] => {
    const same = resolve(meta);

    counts.set(same, (counts.get(same) ?? 0) + 1);

    return [row, same];
  });
  let dominant = resolved[0][1];

  counts.forEach((count, meta) => {
    if (count > (counts.get(dominant) ?? 0)) {
      dominant = meta;
    }
  });

  return { meta: dominant, outliers: resolved.filter(([, meta]) => meta !== dominant) };
}

/**
 * Lifts per-cell facts to `columns` where a whole column agrees, and leaves the rest as `cellsMeta`.
 *
 * For each column the dominant inferred meta becomes the column's, and only the cells that differ
 * get a `cellsMeta` entry - one footer row or one stray `n/a` used to send every cell of the column
 * through `setCellMetaObject`, a million retained meta objects on a million-cell sheet. `readOnly`
 * and `className` follow the same `cell → column` cascade: a column whose every row is locked, or
 * whose every row wears the same classes, carries them once. `columns` is omitted altogether when
 * no column has anything to say, because passing an array pins the grid's column count.
 */
function placeMeta(
  pass: CellPass, rowCount: number, colCount: number, includeTypes: boolean
): Pick<ImportResult, 'columns' | 'cellsMeta'> {
  const columns: ImportColumn[] = Array.from({ length: colCount }, () => ({}));
  const cellsMeta: NonNullable<ImportResult['cellsMeta']> = [];
  const byCoords = new Map<string, CellMetaEntry>();
  const metaByColumn = groupMetaByColumn(pass.metaByCell);

  if (includeTypes) {
    for (let c = 0; c < colCount; c++) {
      const entries = metaByColumn.get(c) ?? [];

      if (entries.length === 0) {
        continue;
      }

      const { meta, outliers } = dominantMeta(entries);

      // The dominant meta object itself, not a copy: every column of one number format or one list
      // formula then shares it, which is what keeps a wide sheet from allocating one per column.
      columns[c] = meta;
      outliers.forEach(([row, outlier]) => {
        cellMetaEntryAt(cellsMeta, byCoords, row, c).meta = withResetKeys(outlier, meta);
      });
    }
  }

  placeColumnWide(
    pass.readOnly.map(({ row, col }): [number, number, true] => [row, col, true]), rowCount, colCount,
    (col, value) => {
      columns[col] = { ...columns[col], readOnly: value };
    },
    (row, col, value) => {
      cellMetaEntryAt(cellsMeta, byCoords, row, col).meta.readOnly = value;
    },
  );

  const classEntries: Array<[number, number, string]> = [];

  pass.classNames.forEach((classes, key) => {
    const { row, col } = parseCellKey(key);

    classEntries.push([row, col, classes.join(' ')]);
  });
  placeColumnWide(
    classEntries, rowCount, colCount,
    (col, value) => {
      columns[col] = { ...columns[col], className: value };
    },
    (row, col, value) => {
      cellMetaEntryAt(cellsMeta, byCoords, row, col).meta.className = value;
    },
  );

  return {
    columns: columns.some(column => Object.keys(column).length > 0) ? columns : undefined,
    cellsMeta: cellsMeta.length > 0 ? cellsMeta : undefined,
  };
}

/**
 * The outlier's meta, with every key the column meta sets and the outlier does not reset to an own
 * `undefined`. Column meta cascades to the cell first and `setCellMetaObject` merges key by key, so
 * without this a `date` outlier over a `numeric` column kept the column's `numericFormat` and a text
 * outlier over a dropdown column kept its `source` - inert for rendering, but `getCellMeta` reported
 * keys the cell never had.
 */
function withResetKeys(outlier: ImportColumn, columnMeta: ImportColumn): Record<string, unknown> {
  const reset: Record<string, unknown> = {};

  Object.keys(columnMeta).forEach((key) => {
    if (!(key in outlier)) {
      reset[key] = undefined;
    }
  });

  return { ...reset, ...outlier };
}

/**
 * Places one per-cell fact (`readOnly`, `className`) at the column level when every row of the
 * column carries the same value, and per cell otherwise.
 */
function placeColumnWide<T>(
  entries: Array<[number, number, T]>, rowCount: number, colCount: number,
  onColumn: (col: number, value: T) => void, onCell: (row: number, col: number, value: T) => void
): void {
  const byColumn = new Map<number, Array<[number, T]>>();

  entries.forEach(([row, col, value]) => {
    const list = byColumn.get(col);

    if (list) {
      list.push([row, value]);
    } else {
      byColumn.set(col, [[row, value]]);
    }
  });

  byColumn.forEach((list, col) => {
    const uniform = rowCount > 0 && list.length === rowCount && col < colCount
      && list.every(([, value]) => value === list[0][1]);

    if (uniform) {
      onColumn(col, list[0][1]);
    } else {
      list.forEach(([row, value]) => onCell(row, col, value));
    }
  });
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
  // Clamped to the window like every other layout value: a freeze reaching past a short `range`
  // would otherwise ask the grid to freeze more rows than it has.
  const fixedRowsTop = sheet.freeze ? Math.min(sheet.freeze.rows - rowShift, rowCount) : 0;
  const fixedColumnsStart = sheet.freeze ? Math.min(sheet.freeze.cols - colShift, colCount) : 0;

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
 * frozen panes, widths and heights. The rules themselves are NOT reported under `dropped` - they
 * reach the caller on the result, which is the same treatment a formula gets when the grid cannot
 * evaluate it. A `ref` part the parser cannot read is a loss, though, and is recorded as
 * `conditionalFormatting:unparsedRef` so it does not vanish silently.
 */
function mapConditionalFormatting(
  sheet: SheetSnapshot, window: SheetWindow, dropped: DroppedFeatures
): ImportedConditionalFormatting[] | undefined {
  const rowCount = window.lastRow - window.firstRow + 1;
  const colCount = window.lastCol - window.firstCol + 1;
  const descriptors: ImportedConditionalFormatting[] = [];

  sheet.conditionalFormatting.forEach(({ ref, rules }) => {
    const tokens = ref.split(/\s+/).filter(part => part !== '');
    const ranges = parseMultiRangeRef(ref);

    // Flag a token the parser refused, not a difference in counts: a parser that one day coalesces
    // duplicate rectangles must not read as a loss.
    if (tokens.some(token => parseRangeRef(token) === null)) {
      dropped.record('conditionalFormatting:unparsedRef');
    }

    ranges.forEach((range) => {
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
    const cell = headerRow[col];
    const text = cell ? toDisplayText(cell) : null;

    headers.push(text === null ? '' : escapeHtml(text));
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
  const cell = sheet.rows[row]?.[col];
  const text = cell ? toDisplayText(cell) : null;

  return text === null ? '' : escapeHtml(text);
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
  workbook: WorkbookSnapshot, requestedOptions: ResolvedImportOptions, context: MapperContext, dropped: DroppedFeatures
): MappedResult {
  const sheet = selectSheet(workbook, requestedOptions.sheet);
  const options = clampToSheet(sheet, requestedOptions);
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
    ...placeMeta(pass, pass.data.length, colCount, options.inferCellTypes),
    ...(options.importLayout ? mapLayout(sheet, window) : {}),
    formulas: pass.formulas.length > 0 ? pass.formulas : undefined,
    comments: pass.comments.length > 0 ? pass.comments : undefined,
    conditionalFormatting: mapConditionalFormatting(sheet, window, dropped),
    styles: pass.styles.size > 0 ? Object.fromEntries(pass.styles) : undefined,
    customBorders: pass.borders.length > 0 ? pass.borders : undefined,
    sheetNames: workbook.sheets.map(candidate => candidate.name),
    dropped: dropped.list(),
  };

  return stripUndefined(result);
}
