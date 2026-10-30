import { throwWithCause } from '../../helpers/errors';
import { escapeHtml } from '../../helpers/string';
import { DROPPED_FEATURES, type DroppedFeatures } from '../../utils/xlsxEngine/capabilities';
import type { CellSnapshot, MergeSnapshot, SheetSnapshot, WorkbookSnapshot } from '../../utils/xlsxEngine/model';
import { parseMultiRangeRef, parseRangeRef } from '../../utils/xlsxEngine/cellRef';
import { rebaseImportedFormula } from '../../utils/xlsxEngine/formulaRefs';
import { stripFunctionPrefixes } from '../../utils/xlsxEngine/functionPrefixes';
import { unwrapArrayFormula } from '../../utils/xlsxEngine/dynamicArrays';
import { MAX_TRANSLATED_FORMULA_CHARS, MIN_CELL_META_BUDGET, throwLimitExceeded } from '../../utils/xlsxEngine/limits';
import {
  MAX_COLUMN_WIDTH_UNITS as MAX_EXCEL_COLUMN_WIDTH,
  MAX_ROW_HEIGHT_POINTS as MAX_EXCEL_ROW_HEIGHT_POINTS,
} from '../../utils/xlsxEngine/units';
import {
  excelWidthToPx,
  cellDisplayValue,
  inferCellType,
  isValueOutsideFormat,
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
  /**
   * The sheets the Formulas plugin's engine holds, lower-cased. A live formula that names any other
   * sheet cannot resolve in the grid (HyperFormula shows `#REF!`), so its cached value is imported
   * instead. Absent means the engine holds none.
   */
  formulaSheetNames?: ReadonlySet<string>;
  /**
   * The name the Formulas plugin's engine gives the grid's own sheet - the sheet the import
   * replaces. A qualifier spelled like it that also names ANOTHER sheet of the workbook means that
   * sheet, not the grid's, so it is treated as a sheet the engine does not hold. Absent means no
   * name is special.
   */
  formulaSheetName?: string;
  /**
   * The names the Formulas plugin's engine defines (named expressions), lower-cased. A live formula
   * that uses a name the WORKBOOK defines and the engine does not shows `#NAME?` in the grid, so its
   * cached value is imported instead. Absent means the engine defines none.
   */
  formulaNamedExpressions?: ReadonlySet<string>;
  /**
   * Whether the Formulas plugin's engine takes a workbook-scoped named expression of this name and
   * expression (`=` included) - `isItPossibleToAddNamedExpression` of HyperFormula. With it, the
   * workbook's defined names the engine does not define yet are handed over in
   * `ImportResult.namedExpressions`, so the formulas using them import live. Absent means no name is
   * handed over, and those formulas import their cached values.
   */
  canAddNamedExpression?: (name: string, expression: string) => boolean;
  /**
   * Whether the Formulas plugin's engine already defines this workbook-scoped name with this
   * expression (`=` included), both compared in the engine's own normalized form. A workbook name the
   * engine defines DIFFERENTLY - a re-import of a file whose name changed - is treated as unresolved:
   * the formulas using it import their cached values instead of reading the old definition. Absent
   * means a name the engine defines is trusted as it is.
   */
  definesNamedExpression?: (name: string, expression: string) => boolean;
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
 * The name the export gives its dropdown helper sheet: `_HotValidation`, or `_HotValidation<n>` when
 * the name was taken. The export writes it `hidden` (not `veryHidden`, which Numbers discards along
 * with every validation pointing at it), so an index has to skip it by name.
 */
const EXPORT_HELPER_SHEET_NAME = /^_HotValidation\d*$/;

/**
 * Whether a sheet is skipped by a numeric `sheet` selector: a very hidden sheet, or the export's own
 * hidden dropdown helper.
 */
function isHelperSheet(sheet: SheetSnapshot): boolean {
  return sheet.state === 'veryHidden' || (sheet.state === 'hidden' && EXPORT_HELPER_SHEET_NAME.test(sheet.name));
}

/**
 * Selects the sheet to import. A number indexes the sheets that are not very hidden and are not the
 * export's hidden `_HotValidation` helper (helper sheets never get picked by accident); a string
 * matches any sheet by name.
 *
 * A workbook with no worksheet at all is refused with its own sentence, which also says when the
 * read skipped chart sheets (`dropped` holds `chartSheets`): listing no available sheet explained
 * nothing.
 */
export function selectSheet(
  workbook: WorkbookSnapshot, selector: string | number, dropped?: DroppedFeatures
): SheetSnapshot {
  if (workbook.sheets.length === 0) {
    const chartsOnly = dropped?.list().includes(DROPPED_FEATURES.chartSheets) === true;

    throwWithCause(`The workbook has no worksheets.${
      chartsOnly ? ' It holds only chart sheets, which the import skips.' : ''}`);
  }

  const names = workbook.sheets.map(sheet => sheet.name).join(', ');
  const sheet = typeof selector === 'number'
    ? workbook.sheets.filter(candidate => !isHelperSheet(candidate))[selector]
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
    case 'intl-datetime':
      return { type: 'intl-datetime', dateTimeFormat: inferred.dateTimeFormat };
    case 'time':
      return { type: 'time', timeFormat: inferred.timeFormat };
    default:
      return { type: inferred.type };
  }
}

/**
 * Consecutive rows of one column (`start` to `end`, inclusive) whose cells wear the same imported
 * class names, joined with a space.
 */
interface ClassNameRun {
  start: number;
  end: number;
  value: string;
}

/**
 * Consecutive rows of one column (`start` to `end`, inclusive) whose cells derived the SAME meta
 * object. Every cell of one number format shares one cached meta, and so does every slot one list
 * validation covers, so a column is a handful of runs however many rows it has. Keying the meta
 * per cell instead cost one `Map` entry per covered slot: one list validation over `A1:E1000000`
 * in a 2 kB file put five million entries in the map (+1.2 GB, 11 s in `mapWorkbook`).
 */
interface MetaRun {
  start: number;
  end: number;
  meta: ImportColumn;
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
   * Per-cell meta, before it is lifted to `columns` or `cellsMeta`, kept per column as runs of
   * consecutive rows that share one meta object. See `MetaRun`.
   */
  metaRuns: Map<number, MetaRun[]>;
  /**
   * How many visited cells hold a value or a formula: the data the per-cell meta budget is measured
   * against (`MIN_CELL_META_BUDGET`).
   */
  dataCells: number;
  /**
   * Cell formulas read from the workbook.
   */
  formulas: NonNullable<ImportResult['formulas']>;
  /**
   * Cell comments read from the workbook.
   */
  comments: NonNullable<ImportResult['comments']>;
  /**
   * The workbook's defined names handed to the Formulas engine.
   */
  namedExpressions: NonNullable<ImportResult['namedExpressions']>;
  /**
   * The cells that must be marked `readOnly`, per column as runs of consecutive rows (`[start, end]`,
   * inclusive). Under sheet protection every blank is locked, so one entry per cell cost one object
   * per slot of the window: a protected sheet with cells in `A1:E1` and `A1000000:E1000000` grew the
   * heap by 1.3 GB.
   */
  readOnly: Map<number, Array<[number, number]>>;
  /**
   * Whether any visited cell carried a style, so `cellStyles` can be reported once as dropped.
   */
  sawStyle: boolean;
  /**
   * Class names collected when `importStyles` is on, per column as runs of consecutive rows that
   * wear the same classes. One `"row:col"` entry per styled cell let a 101 KB file of 305 x 16 384
   * cells with two fills alternating by row allocate 2.2 GB before the per-cell meta budget saw it.
   */
  classNames: Map<number, ClassNameRun[]>;
  /**
   * Class-name runs charged so far against the per-cell meta budget: every run past a column's
   * first, because a column with more than one run is expanded per cell. See `chargeStyleEntry`.
   */
  chargedClassRuns: number;
  /**
   * Generated style rules, keyed by class name, deduplicated across cells.
   */
  styles: Map<string, string>;
  /**
   * `customBorders` entries collected when `importStyles` is on and the plugin is enabled, one per
   * bordered cell, each charged against the per-cell meta budget before it is pushed.
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
    scope.dropped.record(DROPPED_FEATURES.dataValidationUnresolvedList);
  }

  scope.listMetaByFormula.set(key, meta);

  return meta;
}

/**
 * Resolves the meta of one cell: dropdown from its list validation, else the inferred type's meta,
 * shared with every other cell of the same number format.
 */
function resolveCellMeta(cell: CellSnapshot, inferredMeta: InferredMeta, scope: CollectContext): ImportColumn | null {
  const { meta } = inferredMeta;

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
 * Escapes a plain text value the grid would otherwise reinterpret.
 *
 * TWO shapes need it, and they are exactly the values the Formulas plugin's own
 * `unescapeFormulaExpression` would change (`plugins/formulas/utils.ts`; the predicates are
 * mirrored here rather than imported, because a plugin never imports another plugin).
 *
 * A cell holding the TEXT `=HYPERLINK("http://…")` is inert in Excel - it is a string, not a
 * formula - but the grid hands every `=`-leading string to HyperFormula, so importing it verbatim
 * turned the file's text into a formula the file never had.
 *
 * A cell whose text is `'=1+1` is the other half: the leading apostrophe is the FILE's own
 * character, and `isEscapedFormulaExpression` (an apostrophe followed by `=`) reads it as the
 * grid's escape marker and strips it. Escaping it keeps the file's apostrophe in the data. A value
 * starting with an apostrophe that is NOT followed by `=` is left alone, because the grid leaves it
 * alone too - the marker is `'=`, not a bare `'`.
 *
 * Only applied when the plugin is enabled: without it an apostrophe would be part of the value.
 */
function escapeTextFormula(value: unknown, formulasEnabled: boolean): unknown {
  if (!formulasEnabled || typeof value !== 'string') {
    return value;
  }

  return value.startsWith('=') || value.startsWith('\'=') ? `'${value}` : value;
}

/**
 * Matches the start of a prefix Excel stores in a formula (`_xlfn.`, `_xlws.`, `_xlpm.`), the cheap
 * test that decides whether `stripFunctionPrefixes` has to walk the formula at all.
 */
const STORED_PREFIX_HINT = /_xl/i;

/**
 * Charges one formula's walks against the pass's budget, refusing the workbook once the sum crosses
 * `MAX_TRANSLATED_FORMULA_CHARS` - the same budget the native reader charges a shared formula's
 * translation. Charged before the walks, so the refusal lands before the work it bounds: the import
 * runs `REFERENCE_REGEX` over every formula's whole text, and nothing else bounds the product of the
 * cell count and the formula length. Each formula is charged once, whatever walks it needs.
 */
function chargeFormulaWalk(length: number, scope: CollectContext): void {
  scope.walkedFormulaChars += length;

  if (scope.walkedFormulaChars > MAX_TRANSLATED_FORMULA_CHARS) {
    throwLimitExceeded('The workbook\'s formulas rewrite to more than '
      + `${MAX_TRANSLATED_FORMULA_CHARS} characters, above the limit this reader accepts.`);
  }
}

/**
 * A formula as `readFormulaText` hands it over.
 */
interface ReadFormula {
  /**
   * What the file holds, minus the stored prefixes: the text `ImportResult.formulas` records.
   */
  recorded: string;
  /**
   * The text the engine receives: `recorded` with a bare `TRUE`/`FALSE` rewritten to a call.
   */
  live: string;
}

/**
 * Matches a bare boolean literal's spelling: the only formulas `rewriteBareBooleans` walks.
 */
const BOOLEAN_HINT = /true|false/i;

/**
 * Rewrites a bare `TRUE`/`FALSE` (any case) to `TRUE()`/`FALSE()`. HyperFormula reads a bare boolean
 * literal as an unknown name (`=IF(TRUE,1,2)` is `#NAME?`), while Excel stores it that way.
 *
 * A string literal and a quoted sheet name are left alone, and so is a token followed by `(` (already
 * a call) or `!` (a sheet named `TRUE`), preceded by `!` (a name on a sheet), `.` or a name character
 * (the tail of a longer name), or sitting in a structured reference (`Table[TRUE]`, `[@TRUE]`).
 * Linear: one pass of `FORMULA_IDENTIFIER_REGEX`. `readFormulaText` has already charged the formula.
 *
 * @param {string} formula The formula, without its `=`.
 * @returns {string}
 */
function rewriteBareBooleans(formula: string): string {
  if (!BOOLEAN_HINT.test(formula)) {
    return formula;
  }

  let out = '';
  let last = 0;

  for (const match of formula.matchAll(FORMULA_IDENTIFIER_REGEX)) {
    const [token] = match;
    const start = match.index ?? 0;
    const lowered = token.toLowerCase();

    if (lowered === 'true' || lowered === 'false') {
      const prev = start > 0 ? formula[start - 1] : '';
      const next = formula[start + token.length];

      if (next !== '(' && next !== '!' && next !== ']' && !/[!.[@$\p{L}\p{N}_]/u.test(prev)) {
        out += `${formula.slice(last, start)}${token.toUpperCase()}()`;
        last = start + token.length;
      }
    }
  }

  return last === 0 ? formula : out + formula.slice(last);
}

/**
 * The formula as the grid takes it: the `_xlfn.`/`_xlws.`/`_xlpm.` prefixes Excel stores in front of
 * post-2007 functions and `LET`/`LAMBDA` parameters removed, so HyperFormula does not read them as
 * unknown names (`#NAME?`). Every engine hands the stored text over verbatim, so the mapper strips
 * it for both. `live`, the text for the engine, also has a bare `TRUE`/`FALSE` rewritten to a call
 * (`rewriteBareBooleans`); `recorded` keeps what the file holds.
 *
 * A formula any walk will run over is charged against the budget ONCE, before the first walk: the
 * prefix strip, the boolean rewrite (a formula that spells `true` or `false` in any case), and - with
 * live formulas on - the reference walk of `rebaseImportedFormula` (a non-zero window origin, or a
 * `!` to check) and the defined-name scan (a workbook that defines a name the engine lacks). Each
 * walk is linear in the formula's length, so one charge per formula is what the budget's figures in
 * `limits.ts` were measured against.
 */
function readFormulaText(text: string, scope: CollectContext): ReadFormula {
  const { shift } = scope;
  const stripping = STORED_PREFIX_HINT.test(text);
  const rewriting = shift !== null && BOOLEAN_HINT.test(text);
  const walking = shift !== null && (
    shift.rowDelta !== 0 || shift.colDelta !== 0 || text.includes('!') || scope.unresolvedNames.size > 0
  );

  if (stripping || rewriting || walking) {
    chargeFormulaWalk(text.length, scope);
  }

  const recorded = stripping ? stripFunctionPrefixes(text) : text;

  return { recorded, live: rewriting ? rewriteBareBooleans(recorded) : recorded };
}

/**
 * Whether the Formulas plugin's engine holds a sheet of this name. A formula naming a sheet it does
 * not hold shows `#REF!` in the grid, and so does every formula that depends on it, while the file
 * carries the value it evaluated to.
 */
function isSheetKnown(name: string, scope: CollectContext): boolean {
  const lowered = name.toLowerCase();

  // The import replaces the grid's own sheet with the imported one, so a qualifier spelled like the
  // grid's sheet that the workbook also uses for another sheet points at that sheet's cells, which
  // the engine never receives. The imported sheet's own name never reaches here: it is rewritten as
  // an unqualified reference first.
  if (lowered === scope.ownSheetName && scope.workbookSheetNames.has(lowered)) {
    return false;
  }

  return scope.context.formulaSheetNames?.has(lowered) === true;
}

/**
 * An identifier in a formula: a name, a function name or a cell reference. A string literal and a
 * quoted sheet name (`'Sales Data'!A1`) are matched whole so their words are never read as names.
 * Linear: one greedy run per match, no backtracking.
 */
const FORMULA_IDENTIFIER_REGEX = /"(?:[^"]|"")*"|'(?:[^']|'')*'|[\p{L}_\\][\p{L}\p{N}_.]*/gu;

/**
 * Whether a formula uses a name the workbook defines and the Formulas engine does not. HyperFormula
 * shows `#NAME?` for it, while the file carries the value it evaluated to. A string literal names
 * nothing; a name followed by `(` is a function, and one followed by `!` a sheet. `readFormulaText`
 * has already charged the formula; a workbook that defines no name unknown to the engine costs
 * nothing.
 */
function usesUnresolvedName(formula: string, scope: CollectContext): boolean {
  const { unresolvedNames } = scope;

  if (unresolvedNames.size === 0) {
    return false;
  }

  for (const name of namesIn(formula)) {
    if (unresolvedNames.has(name)) {
      return true;
    }
  }

  return false;
}

/**
 * The identifiers of a formula that can be names, lower-cased: neither a string literal, a quoted
 * sheet name, a function (followed by `(`) nor a sheet (followed by `!`).
 *
 * @param {string} formula The formula, without its `=`.
 * @returns {Generator<string>}
 */
function* namesIn(formula: string): Generator<string> {
  for (const match of formula.matchAll(FORMULA_IDENTIFIER_REGEX)) {
    const [token] = match;
    const next = formula[(match.index ?? 0) + token.length];
    const isQuoted = token[0] === '"' || token[0] === '\'';

    if (!isQuoted && next !== '(' && next !== '!') {
      yield token.toLowerCase();
    }
  }
}

/**
 * The names a workbook defines that the Formulas engine does not, lower-cased.
 */
function unresolvedDefinedNames(workbook: WorkbookSnapshot, context: MapperContext): Set<string> {
  const known = context.formulaNamedExpressions;
  const names = new Set<string>();

  (workbook.definedNames ?? []).forEach(({ name }) => {
    const lowered = name.toLowerCase();

    if (!known?.has(lowered)) {
      names.add(lowered);
    }
  });

  return names;
}

/**
 * Hands the workbook's defined names to the Formulas engine as workbook-scoped named expressions,
 * and takes every name handed over out of `scope.unresolvedNames`, so the formulas using it import
 * live. Runs only with live formulas on and `MapperContext.canAddNamedExpression` given.
 *
 * A name scoped to another sheet is ignored: the imported sheet's formulas never see it in Excel
 * either. A name scoped to the imported sheet is handed over at workbook scope (the grid holds that
 * one sheet), ahead of a workbook-scoped name spelled like it, which is what Excel resolves on that
 * sheet. A name the engine already defines is left as the engine has it; when its definition is
 * not this file's (`MapperContext.definesNamedExpression`), the name is added to
 * `scope.unresolvedNames`, so the formulas over it import their cached values instead of reading the
 * engine's old definition, and `definedNames:unsupported` is recorded.
 *
 * A definition is read like a cell formula: its stored prefixes stripped and the walk charged by
 * `readFormulaText`, then moved into grid coordinates by `rebaseImportedFormula`, with a reference
 * to the imported sheet written against the engine's name for the grid's sheet
 * (`MapperContext.formulaSheetName`): HyperFormula reads an unqualified reference in a named
 * expression as relative and refuses it. A definition that points into the dropped header band,
 * names a sheet the engine does not hold, is refused by the engine (a relative reference such as
 * `Data!A1`), or uses a name left out itself (followed through any chain of names) is left out, and
 * `definedNames:unsupported` is recorded once; the formulas using it import their cached values.
 *
 * @param {CollectContext} scope The pass context.
 * @returns {Array<{ name: string, formula: string }>} The names to add, each formula without its `=`.
 */
function collectNamedExpressions(scope: CollectContext): NonNullable<ImportResult['namedExpressions']> {
  const { shift, context, sheet, unresolvedNames } = scope;
  const canAdd = context.canAddNamedExpression;

  if (shift === null || canAdd === undefined) {
    return [];
  }

  const own = sheet.name.toLowerCase();
  const definitions = (scope.workbook.definedNames ?? [])
    .filter(({ sheetName }) => sheetName === null || sheetName.toLowerCase() === own);
  // Sheet-scoped first, so it wins over a workbook-scoped name spelled like it. The sort is stable.
  const ordered = definitions.slice().sort((a, b) => Number(a.sheetName === null) - Number(b.sheetName === null));
  const added = new Map<string, { name: string; formula: string }>();
  const seen = new Set<string>();
  let unsupported = false;

  ordered.forEach(({ name, formula }) => {
    const lowered = name.toLowerCase();
    const defined = context.formulaNamedExpressions?.has(lowered) === true;

    if (seen.has(lowered) || (defined && context.definesNamedExpression === undefined)) {
      return;
    }

    seen.add(lowered);

    const rebased = rebaseImportedFormula(readFormulaText(formula, scope).live, shift.rowDelta, shift.colDelta, {
      self: sheet.name,
      selfAs: context.formulaSheetName,
      isKnown: candidate => isSheetKnown(candidate, scope),
    });
    const expression = rebased.formula === null || rebased.unknownSheet ? null : `=${rebased.formula}`;

    if (defined) {
      // The engine keeps its own definition. When it is not this file's, the formulas over the name
      // would read the old one, so the name is treated as one the engine does not define.
      if (expression === null || context.definesNamedExpression?.(name, expression) !== true) {
        unresolvedNames.add(lowered);
        unsupported = true;
      }

      return;
    }

    if (expression === null || !canAdd(name, expression)) {
      unsupported = true;

      return;
    }

    added.set(lowered, { name, formula: rebased.formula as string });
  });

  // A name over a name left out shows `#NAME?` like the left-out one. The uses are read once per
  // definition (already charged above), and every name leaves `added` at most once.
  const dependents = new Map<string, string[]>();
  const leftOut: string[] = [];

  added.forEach(({ formula }, lowered) => {
    for (const used of namesIn(formula)) {
      if (added.has(used)) {
        const users = dependents.get(used);

        if (users) {
          users.push(lowered);
        } else {
          dependents.set(used, [lowered]);
        }
      } else if (unresolvedNames.has(used)) {
        leftOut.push(lowered);
      }
    }
  });

  while (leftOut.length > 0) {
    const lowered = leftOut.pop() as string;

    if (added.delete(lowered)) {
      unsupported = true;
      leftOut.push(...(dependents.get(lowered) ?? []));
    }
  }

  added.forEach((_, lowered) => unresolvedNames.delete(lowered));

  if (unsupported) {
    scope.dropped.record(DROPPED_FEATURES.definedNamesUnsupported);
  }

  return [...added.values()];
}

/**
 * The window rectangle one live array master spills over, inclusive, in window coordinates.
 */
interface LiveArrayRect {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * The live array rectangles of a pass, and a forward sweep over them that answers, for each cell in
 * row-major order, whether a rectangle covers it.
 */
interface LiveArraySweep {
  /**
   * The rectangles still reaching the current row or below.
   */
  active: LiveArrayRect[];
  /**
   * The rectangles recorded on the current row, joined to `active` when the sweep moves on.
   */
  noted: LiveArrayRect[];
  /**
   * The rectangles that cover the current row, ordered by start column.
   */
  spans: LiveArrayRect[];
  /**
   * The first entry of `spans` the current row's column walk has not reached yet.
   */
  cursor: number;
  /**
   * The last column any span reached so far on the current row covers, or `-1`.
   */
  maxEndCol: number;
}

/**
 * Moves the live-array sweep to a new window row: drops the rectangles that ended above it, joins
 * the ones recorded on the previous row and orders the row's spans by start column. Every rectangle
 * looked at is charged against the formula budget, so the sweep is bounded by the same limit as the
 * formula walks: W single-column arrays over N rows cost W x N, refused past
 * `MAX_TRANSLATED_FORMULA_CHARS`.
 *
 * @param {number} row The window row the walk enters.
 * @param {CollectContext} scope The pass context.
 */
function beginLiveArrayRow(row: number, scope: CollectContext): void {
  const sweep = scope.liveArrays;

  sweep.cursor = 0;
  sweep.maxEndCol = -1;

  if (sweep.active.length === 0 && sweep.noted.length === 0) {
    sweep.spans = [];

    return;
  }

  const candidates = sweep.active.concat(sweep.noted);

  chargeFormulaWalk(candidates.length, scope);
  sweep.noted = [];
  sweep.active = candidates.filter(rect => rect.endRow >= row);
  // Every rectangle starts on its master's row, which the walk has already passed, so all of the
  // active ones cover this row.
  sweep.spans = sweep.active.slice().sort((a, b) => a.startCol - b.startCol);
}

/**
 * Records the rectangle a live array master spills over, so `pushCellValue` imports its cells empty.
 *
 * `row`/`col` are the master's window coordinates. Excel writes the master as the top-left corner of
 * its `ref`, and the window is walked row by row, left to right, so every cell the array covers is
 * visited AFTER its master: recording the rectangle when the master is visited is early enough. A
 * `ref` that does not start at the master is not trusted to empty anything. The rectangle is clipped
 * to the window and stored once, whatever its size; the rows it covers are charged one by one as the
 * sweep crosses them (`beginLiveArrayRow`).
 *
 * @param {string} ref The array's A1 range, in the file's 1-based sheet coordinates.
 * @param {number} row The master's window row.
 * @param {number} col The master's window column.
 * @param {CollectContext} scope The pass context.
 */
function recordLiveArray(ref: string, row: number, col: number, scope: CollectContext): void {
  const range = parseRangeRef(ref);
  const { window, liveArrays } = scope;

  if (range === null || range.startRow - 1 - window.firstRow !== row || range.startCol - 1 - window.firstCol !== col) {
    return;
  }

  const rect: LiveArrayRect = {
    startRow: row,
    startCol: col,
    endRow: Math.min(range.endRow - 1, window.lastRow) - window.firstRow,
    endCol: Math.min(range.endCol - 1, window.lastCol) - window.firstCol,
  };

  chargeFormulaWalk(1, scope);
  liveArrays.noted.push(rect);
  // The rest of the master's own row lies right of `col`, so the rectangle covers every column the
  // walk still visits on this row up to its end.
  liveArrays.maxEndCol = Math.max(liveArrays.maxEndCol, rect.endCol);
}

/**
 * Whether a live array recorded by `recordLiveArray` spills over this cell of the current row. The
 * columns of a row are asked in ascending order, so the cursor only moves forward over the row's
 * spans, and each cell costs O(1) amortized: the cell is covered when the furthest end of every
 * span started at or before it reaches it.
 *
 * @param {number} col The cell's window column.
 * @param {CollectContext} scope The pass context.
 * @returns {boolean}
 */
function isCoveredByLiveArray(col: number, scope: CollectContext): boolean {
  const sweep = scope.liveArrays;

  while (sweep.cursor < sweep.spans.length && sweep.spans[sweep.cursor].startCol <= col) {
    sweep.maxEndCol = Math.max(sweep.maxEndCol, sweep.spans[sweep.cursor].endCol);
    sweep.cursor += 1;
  }

  return col <= sweep.maxEndCol;
}

/**
 * Pushes one cell's value onto the data row, writing a live formula string when the formulas
 * plugin is enabled and recording the cached formula otherwise.
 *
 * The export shifts every reference forward by the header row and the row-header column it
 * prepends, so the sheet's `C2` is the grid's `B1`; this shifts it back by the window origin. A
 * reference the shift would push above row 1 or left of column A pointed into that header band,
 * which the import drops - the formula then cannot be expressed in grid coordinates at all, so the
 * cached value is imported instead and the formula is reported. A reference qualified with the
 * imported sheet's own name is a reference into this sheet: its qualifier is dropped and it shifts
 * like an unqualified one (`rebaseImportedFormula`).
 */
function pushCellValue(
  pass: CellPass, cell: CellSnapshot, inferred: InferredType | null,
  row: number, col: number, scope: CollectContext
): void {
  const { shift, dropped } = scope;
  const read = cell.formula ? readFormulaText(cell.formula.text, scope) : null;
  const formula = read === null ? null : read.recorded;
  const rebased = read !== null && shift !== null
    ? rebaseImportedFormula(read.live, shift.rowDelta, shift.colDelta, {
      self: scope.sheet.name,
      isKnown: name => isSheetKnown(name, scope),
    })
    : null;
  const otherSheet = rebased !== null && rebased.unknownSheet;
  const unknownName = rebased !== null && !otherSheet && usesUnresolvedName(read?.live ?? '', scope);
  const live = rebased !== null && !otherSheet && !unknownName ? rebased.formula : null;

  if (live !== null) {
    const array = cell.formula?.array;

    // A legacy CSE array (`{=A1:A2*2}`) is an ordinary formula to HyperFormula unless it is
    // wrapped; a dynamic array spills on its own.
    // A master the file already wraps in `ARRAYFORMULA(...)` is not wrapped twice.
    const wrap = array !== undefined && !array.dynamic && unwrapArrayFormula(live) === null;

    pass.data[pass.data.length - 1].push(wrap ? `=ARRAYFORMULA(${live})` : `=${live}`);

    if (array) {
      recordLiveArray(array.ref, row, col, scope);
    }

    return;
  }

  if (cell.formula === null && isCoveredByLiveArray(col, scope)) {
    pass.data[pass.data.length - 1].push(null);

    return;
  }

  pass.data[pass.data.length - 1].push(
    escapeTextFormula(toGridValue(cell, inferred), scope.context.formulasEnabled)
  );

  if (formula !== null) {
    pass.formulas.push({ row, col, formula });

    if (shift === null && cell.formula?.result === undefined) {
      // Not imported live, and the file carries no cached value (openpyxl writes none): the cell
      // imports empty, which the warning has to explain.
      dropped.record(DROPPED_FEATURES.formulaNoCachedValue);
    } else if (otherSheet) {
      dropped.record(DROPPED_FEATURES.formulaOtherSheet);
    } else if (unknownName) {
      dropped.record(DROPPED_FEATURES.formulaDefinedName);
    } else if (shift) {
      dropped.record(DROPPED_FEATURES.formulaOutOfRange);
    }
  }
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

  if (classes.length > 0 && recordClassName(pass.classNames, row, col, classes.join(' '))) {
    pass.chargedClassRuns = chargeStyleEntry(pass.chargedClassRuns, pass.dataCells);
  }

  const border = borderEntry(style.border, row, col);

  if (border) {
    if (context.customBordersEnabled) {
      chargeStyleEntry(pass.borders.length, pass.dataCells);
      pass.borders.push(border);
    } else {
      pass.droppedBorders = true;
    }
  }
}

/**
 * Adds one cell's class names to its column's runs, and answers whether that started a run in a
 * column that already had one. Such a column cannot be lifted to `columns`, so each of its runs
 * costs at least one `cellsMeta` entry later. The window is walked row by row, so a column's rows
 * arrive in ascending order.
 *
 * The charge this answer drives is an early pre-check, not the bound: a column's first run is not
 * charged, so it runs up to one entry per column short. The bound is exact where the entries are
 * allocated (`cellMetaEntries`), which charges every one of them (review round 12).
 */
function recordClassName(runs: Map<number, ClassNameRun[]>, row: number, col: number, value: string): boolean {
  const columnRuns = runs.get(col);
  const last = columnRuns?.[columnRuns.length - 1];

  if (last && last.value === value && last.end === row - 1) {
    last.end = row;

    return false;
  }

  if (columnRuns) {
    columnRuns.push({ start: row, end: row, value });

    return true;
  }

  runs.set(col, [{ start: row, end: row, value }]);

  return false;
}

/**
 * The per-cell meta budget: the larger of `MIN_CELL_META_BUDGET` and the cells that hold a value or
 * a formula, so a sheet of real data is never refused for the settings its own cells carry.
 */
function cellMetaBudget(dataCells: number): number {
  return Math.max(MIN_CELL_META_BUDGET, dataCells);
}

/**
 * Refuses the sheet because its per-cell settings expand past `budget`.
 */
function refuseCellMeta(budget: number, dataCells: number): never {
  return throwLimitExceeded(`The sheet's cell settings expand to more than ${budget} cells, above the limit `
    + `this reader accepts for a sheet with ${dataCells} cells of data.`);
}

/**
 * Charges one style entry (a class-name run that will expand per cell, or a `customBorders` entry)
 * against the per-cell meta budget at COLLECTION, before the entry is allocated, and answers the new
 * count. The budget is measured against the data cells seen so far, because the window is walked
 * once: a 103 KB file of 5 M bordered empty cells pushed 5 M `customBorders` entries (2.7 GB) with
 * nothing to stop it, and a file of fills alternating by row was refused only after placement had
 * copied every class name. Class-name runs and borders are counted apart, so a bordered, banded
 * sheet of real data is not charged twice for one cell.
 */
function chargeStyleEntry(charged: number, dataCells: number): number {
  const budget = cellMetaBudget(dataCells);

  if (charged >= budget) {
    refuseCellMeta(budget, dataCells);
  }

  return charged + 1;
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
   * The names the workbook defines and the Formulas engine does not, lower-cased.
   */
  unresolvedNames: Set<string>;
  /**
   * The inferred type and its meta object per distinct number format and value kind, so a sheet
   * with a handful of formats parses each once rather than once per cell, and every cell of a
   * homogeneous column shares one meta object that `columnMetaAgrees` settles by reference.
   */
  inferredByFormat: Map<string, InferredMeta>;
  /**
   * Characters of formula text walked so far in this pass, each formula charged once for its prefix
   * strip, reference walk and defined-name scan, against `MAX_TRANSLATED_FORMULA_CHARS`.
   */
  walkedFormulaChars: number;
  /**
   * The engine's name for the grid's own sheet, lower-cased, or `null` when none is known.
   */
  ownSheetName: string | null;
  /**
   * Every sheet name of the workbook, lower-cased.
   */
  workbookSheetNames: ReadonlySet<string>;
  /**
   * The window, in sheet coordinates, that a live array's `ref` is converted into and clipped to.
   */
  window: SheetWindow;
  /**
   * The rectangles LIVE array formulas spill over, and the sweep that looks a cell up in them.
   * HyperFormula fills those cells itself, so they import empty: a cached value left in one makes the
   * spill collide with it (`#SPILL!`).
   */
  liveArrays: LiveArraySweep;
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
 * which is everything `inferCellType` reads. An unsupported format is reported here, once per
 * distinct key, rather than once per cell.
 */
function inferForCell(cell: CellSnapshot, scope: CollectContext): InferredMeta {
  const value = cellDisplayValue(cell);
  // An elapsed-time format infers differently past the duration it can show, and a date format
  // past the range of Excel dates, so that is part of the key too.
  const key = `${cell.numFmt ?? ''}\u0000${typeof value}\u0000${isValueOutsideFormat(cell.numFmt, value)}`;
  const cached = scope.inferredByFormat.get(key);

  if (cached) {
    return cached;
  }

  const inferred = inferCellType(cell);
  const entry: InferredMeta = { inferred, meta: inferred ? toMeta(inferred) : null };

  // Reported on the cache miss only: `recordUnsupported` bounds and copies the whole format string,
  // so once per cell cost one walk of a file-sized string per cell for a name it records once.
  // A time or date-time cell carries one too, for a fraction of a second the grid value cannot hold.
  if (inferred && 'unsupportedNumFmt' in inferred && inferred.unsupportedNumFmt) {
    scope.dropped.recordUnsupported('numFmt', inferred.unsupportedNumFmt);
  }

  scope.inferredByFormat.set(key, entry);

  return entry;
}

/**
 * Adds one cell's meta to its column's runs. The window is walked row by row, so a column's rows
 * arrive in ascending order and a cell either extends the column's last run or starts a new one.
 */
function recordMeta(metaRuns: Map<number, MetaRun[]>, row: number, col: number, meta: ImportColumn): void {
  const runs = metaRuns.get(col);
  const last = runs?.[runs.length - 1];

  if (last && last.meta === meta && last.end === row - 1) {
    last.end = row;
  } else if (runs) {
    runs.push({ start: row, end: row, meta });
  } else {
    metaRuns.set(col, [{ start: row, end: row, meta }]);
  }
}

/**
 * Marks one cell read-only, extending its column's last run when the row follows it. The window is
 * walked row by row, so a column's rows arrive in ascending order.
 */
function recordReadOnly(readOnly: Map<number, Array<[number, number]>>, row: number, col: number): void {
  const runs = readOnly.get(col);
  const last = runs?.[runs.length - 1];

  if (last && last[1] === row - 1) {
    last[1] = row;
  } else if (runs) {
    runs.push([row, row]);
  } else {
    readOnly.set(col, [[row, row]]);
  }
}

/**
 * Collects one cell into the pass, in the window's own 0-based coordinates.
 */
function collectCell(pass: CellPass, cell: CellSnapshot, row: number, col: number, scope: CollectContext): void {
  const { sheet, options, context } = scope;
  const inferredMeta = options.inferCellTypes ? inferForCell(cell, scope) : null;
  const inferred = inferredMeta?.inferred ?? null;
  const meta = inferredMeta ? resolveCellMeta(cell, inferredMeta, scope) : null;

  if (meta) {
    recordMeta(pass.metaRuns, row, col, meta);
  }

  if (cell.value !== null || cell.formula !== null) {
    pass.dataCells += 1;
  }

  pushCellValue(pass, cell, inferred, row, col, scope);

  if (cell.comment !== null) {
    if (context.commentsEnabled) {
      pass.comments.push({ row, col, value: cell.comment });
    } else {
      pass.droppedComments = true;
    }
  }

  const readOnly = sheet.protection?.enabled === true && cell.locked !== false;

  if (readOnly) {
    recordReadOnly(pass.readOnly, row, col);
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
    metaRuns: new Map(),
    dataCells: 0,
    formulas: [],
    comments: [],
    namedExpressions: [],
    readOnly: new Map(),
    sawStyle: false,
    classNames: new Map(),
    chargedClassRuns: 0,
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
    unresolvedNames: options.importFormulas && context.formulasEnabled
      ? unresolvedDefinedNames(workbook, context)
      : new Set(),
    inferredByFormat: new Map(),
    // The reader's shared-formula translation already spent part of the same budget.
    walkedFormulaChars: workbook.translatedFormulaChars ?? 0,
    ownSheetName: context.formulaSheetName?.toLowerCase() ?? null,
    workbookSheetNames: new Set(workbook.sheets.map(candidate => candidate.name.toLowerCase())),
    window,
    liveArrays: { active: [], noted: [], spans: [], cursor: 0, maxEndCol: -1 },
  };

  pass.namedExpressions = collectNamedExpressions(scope);

  for (let row = window.firstRow; row <= window.lastRow; row++) {
    pass.data.push([]);
    beginLiveArrayRow(row - window.firstRow, scope);

    for (let col = window.firstCol; col <= window.lastCol; col++) {
      const cell = sheet.rows[row]?.[col] ?? null;

      if (cell === null) {
        pass.data[pass.data.length - 1].push(null);

        // OOXML treats a cell with no explicit `<protection>` as locked, and an empty cell has
        // none, so under sheet protection a blank imports read-only like its filled neighbours.
        if (sheet.protection?.enabled === true) {
          recordReadOnly(pass.readOnly, row - window.firstRow, col - window.firstCol);
        }
      } else {
        collectCell(pass, cell, row - window.firstRow, col - window.firstCol, scope);
      }
    }
  }

  return pass;
}

/**
 * One `cellsMeta` entry, as the result carries it.
 */
type CellMetaEntry = NonNullable<ImportResult['cellsMeta']>[number];

/**
 * Answers the function that returns the `cellsMeta` entry for one cell, appending a fresh one the
 * first time that cell is seen. The `"row:col"` index is what keeps this constant-time: the
 * `readOnly` and `className` merges both fold into entries the column pass already produced, and
 * scanning the growing array for each of them made placing the meta quadratic in the number of
 * styled or locked cells.
 *
 * Every new entry is charged against the sheet's budget BEFORE it is allocated: the sheet is refused
 * once `cellsMeta` would hold more entries than the larger of `MIN_CELL_META_BUDGET` and the cells
 * that hold a value or a formula. The type outliers, the `readOnly` cells and the `className` cells
 * all go through here, and a cell that carries several of them is one entry, charged once. Those
 * cells need not hold any data: two list validations with different formulas that split
 * `A1:E1000000` in half expanded 2.5 million empty cells from a 2 kB file.
 */
function cellMetaEntries(
  cellsMeta: CellMetaEntry[], dataCells: number
): (row: number, col: number) => CellMetaEntry {
  const index = new Map<string, CellMetaEntry>();
  const budget = cellMetaBudget(dataCells);

  return (row: number, col: number): CellMetaEntry => {
    const key = `${row}:${col}`;
    const existing = index.get(key);

    if (existing) {
      return existing;
    }

    if (cellsMeta.length >= budget) {
      refuseCellMeta(budget, dataCells);
    }

    const entry: CellMetaEntry = { row, col, meta: {} };

    cellsMeta.push(entry);
    index.set(key, entry);

    return entry;
  };
}

/**
 * The meta most cells of a column derived, with the runs that disagree with it. Reference-equal
 * runs (every cell of one number format shares one meta object, every cell of one list formula
 * one dropdown meta) are counted without serializing; a structurally equal object that is not the
 * same reference still counts as the same meta. A run counts as many cells as it spans.
 */
function dominantMeta(runs: MetaRun[]): { meta: ImportColumn; outliers: MetaRun[] } {
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
  const resolved = runs.map((run): MetaRun => {
    const same = resolve(run.meta);

    counts.set(same, (counts.get(same) ?? 0) + (run.end - run.start + 1));

    return { ...run, meta: same };
  });
  let dominant = resolved[0].meta;

  counts.forEach((count, meta) => {
    if (count > (counts.get(dominant) ?? 0)) {
      dominant = meta;
    }
  });

  return { meta: dominant, outliers: resolved.filter(run => run.meta !== dominant) };
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
  const entryAt = cellMetaEntries(cellsMeta, pass.dataCells);

  if (includeTypes) {
    for (let c = 0; c < colCount; c++) {
      const runs = pass.metaRuns.get(c) ?? [];

      if (runs.length === 0) {
        continue;
      }

      const { meta, outliers } = dominantMeta(runs);

      // The dominant meta object itself, not a copy: every column of one number format or one list
      // formula then shares it, which is what keeps a wide sheet from allocating one per column.
      columns[c] = meta;
      outliers.forEach(({ start, end, meta: outlier }) => {
        for (let row = start; row <= end; row++) {
          entryAt(row, c).meta = withResetKeys(outlier, meta);
        }
      });
    }
  }

  placeReadOnly(pass.readOnly, rowCount, colCount, (col) => {
    columns[col] = { ...columns[col], readOnly: true };
  }, (row, col, value) => {
    entryAt(row, col).meta.readOnly = value;
  });

  placeColumnWide(
    pass.classNames, rowCount, colCount,
    (col, value) => {
      columns[col] = { ...columns[col], className: value };
    },
    (row, col, value) => {
      entryAt(row, col).meta.className = value;
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
 * Places the read-only runs. A column that is locked on more than half of its rows becomes
 * `readOnly` as a whole, and only its unlocked rows get a `readOnly: false` cell entry; any other
 * column gets a `readOnly: true` entry per locked row. Before, one unlocked cell on a protected
 * sheet sent every OTHER cell of its column through `cellsMeta`.
 */
function placeReadOnly(
  readOnly: Map<number, Array<[number, number]>>, rowCount: number, colCount: number,
  onColumn: (col: number) => void, onCell: (row: number, col: number, value: boolean) => void
): void {
  readOnly.forEach((runs, col) => {
    if (col >= colCount || rowCount === 0) {
      return;
    }

    const locked = runs.reduce((sum, [start, end]) => sum + (end - start + 1), 0);

    if (locked * 2 <= rowCount) {
      runs.forEach(([start, end]) => {
        for (let row = start; row <= end; row++) {
          onCell(row, col, true);
        }
      });

      return;
    }

    onColumn(col);

    let next = 0;

    runs.forEach(([start, end]) => {
      for (let row = next; row < start; row++) {
        onCell(row, col, false);
      }

      next = end + 1;
    });

    for (let row = next; row < rowCount; row++) {
      onCell(row, col, false);
    }
  });
}

/**
 * Places the class-name runs: at the column level when one run covers every row of the column, and
 * per cell otherwise. Each cell placed per cell goes through `entryAt`, which charges the budget.
 */
function placeColumnWide(
  runs: Map<number, ClassNameRun[]>, rowCount: number, colCount: number,
  onColumn: (col: number, value: string) => void, onCell: (row: number, col: number, value: string) => void
): void {
  runs.forEach((columnRuns, col) => {
    const [first] = columnRuns;
    const uniform = rowCount > 0 && col < colCount && columnRuns.length === 1
      && first.start === 0 && first.end === rowCount - 1;

    if (uniform) {
      onColumn(col, first.value);

      return;
    }

    columnRuns.forEach(({ start, end, value }) => {
      for (let row = start; row <= end; row++) {
        onCell(row, col, value);
      }
    });
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
 * Converts a file-supplied column width or row height to pixels, or `undefined` when the file's
 * value is not a finite, positive size inside Excel's own limit. This is the plugin's half of the
 * bound, independent of the engine: `-350`, `7e+300` and `Infinity` reached `updateSettings` as
 * column widths before it.
 */
function toLayoutPixels(size: unknown, max: number, toPx: (value: number) => number): number | undefined {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > max) {
    return undefined;
  }

  const pixels = toPx(size);

  return pixels > 0 ? pixels : undefined;
}

/**
 * Turns a file-supplied freeze count into the whole, non-negative number of rows or columns to fix
 * in the window: floored, shifted by the window origin and clamped to the window. Anything that is
 * not a number, and `NaN`, freezes nothing.
 */
function toFreezeCount(value: unknown, shift: number, count: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(value) - shift, count));
}

/**
 * Shifts file-supplied hidden indexes into the window, dropping each one that is not a whole
 * number or falls outside the window ON ITS OWN. `HiddenRows`/`HiddenColumns` reject the whole list
 * when one entry is invalid, so a single `0.5` used to unhide every row the file legitimately hid.
 */
function toHiddenIndexes(indexes: unknown[], shift: number, count: number): number[] {
  return indexes
    .filter((index): index is number => Number.isInteger(index))
    .map(index => index - shift)
    .filter(index => index >= 0 && index < count);
}

/**
 * Shifts and crops the sheet layout into the window's coordinates.
 */
function mapLayout(sheet: SheetSnapshot, window: SheetWindow): Partial<ImportResult> {
  const rowShift = window.firstRow;
  const colShift = window.firstCol;
  const rowCount = window.lastRow - window.firstRow + 1;
  const colCount = window.lastCol - window.firstCol + 1;

  const mergeCells = sheet.merges
    .map(merge => cropMerge(merge, rowShift, colShift, rowCount, colCount))
    .filter((merge): merge is MergeSnapshot => merge !== null);
  const hiddenRows = toHiddenIndexes(sheet.hiddenRows, rowShift, rowCount);
  const hiddenColumns = toHiddenIndexes(sheet.hiddenCols, colShift, colCount);
  const colWidths = Array.from({ length: colCount }, (_, c) => (
    toLayoutPixels(sheet.colWidths[c + colShift], MAX_EXCEL_COLUMN_WIDTH, excelWidthToPx)
  ));
  const rowHeights = Array.from({ length: rowCount }, (_, r) => (
    toLayoutPixels(sheet.rowHeights[r + rowShift], MAX_EXCEL_ROW_HEIGHT_POINTS, pointsToPx)
  ));
  // Clamped to the window like every other layout value: a freeze reaching past a short `range`
  // would otherwise ask the grid to freeze more rows than it has.
  const fixedRowsTop = sheet.freeze ? toFreezeCount(sheet.freeze.rows, rowShift, rowCount) : 0;
  const fixedColumnsStart = sheet.freeze ? toFreezeCount(sheet.freeze.cols, colShift, colCount) : 0;

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
      dropped.record(DROPPED_FEATURES.conditionalFormattingUnparsedRef);
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
 * Whether a cell of the promoted header band, inside the window's columns, carries a note. The band
 * becomes `colHeaders` or `nestedHeaders`, and a column header cannot hold a note, so it is lost
 * whether or not the Comments plugin is on. Bounded like `mapNestedHeaders`: the band's height
 * (already clamped to the sheet) times the window's width.
 */
function hasHeaderBandComment(sheet: SheetSnapshot, window: SheetWindow, options: ResolvedImportOptions): boolean {
  if (options.colHeaders !== 'firstRow') {
    return false;
  }

  for (let row = window.firstRow - options.headerRows; row < window.firstRow; row++) {
    const cells = sheet.rows[row] ?? [];

    for (let col = window.firstCol; col <= window.lastCol; col++) {
      if ((cells[col]?.comment ?? null) !== null) {
        return true;
      }
    }
  }

  return false;
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
  const sheet = selectSheet(workbook, requestedOptions.sheet, dropped);
  const options = clampToSheet(sheet, requestedOptions);
  const window = computeWindow(sheet, options);
  const colCount = Math.max(window.lastCol - window.firstCol + 1, 0);
  const pass = collectCells(sheet, workbook, window, options, context, dropped);

  if (options.importStyles) {
    if (pass.droppedBorders) {
      dropped.record(DROPPED_FEATURES.cellStylesBorders);
    }
  } else if (pass.sawStyle) {
    dropped.record(DROPPED_FEATURES.cellStyles);
  }

  if (pass.droppedComments) {
    dropped.record(DROPPED_FEATURES.comments);
  }

  if (hasHeaderBandComment(sheet, window, options)) {
    dropped.record(DROPPED_FEATURES.commentHeader);
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
    namedExpressions: pass.namedExpressions.length > 0 ? pass.namedExpressions : undefined,
    conditionalFormatting: mapConditionalFormatting(sheet, window, dropped),
    styles: pass.styles.size > 0 ? Object.fromEntries(pass.styles) : undefined,
    customBorders: pass.borders.length > 0 ? pass.borders : undefined,
    sheetNames: workbook.sheets.map(candidate => candidate.name),
    dropped: dropped.list(),
  };

  return stripUndefined(result);
}
