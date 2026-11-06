import { isDefined, isEmpty, stringify } from '../../../helpers/mixed';
import { isObject } from '../../../helpers/object';
import { throwWithCause } from '../../../helpers/errors';
import { getChoiceLabel, isKeyValueEntry, isListableLabel } from '../../../utils/cellSource';
import type { SourceLabel } from '../../../utils/cellSource';
import ExportDataProvider from '../dataProvider';
import type { ArrayFormulaSize, EngineCellFacts } from '../dataProvider';
import BaseType from './_base';
import { warnRemovedColumnHeadersOption } from '../utils';
import { matchCheckboxTemplate } from '../../../utils/checkboxColumn';
import {
  buildSummaryFormula,
  normalizeFormula,
  normalizeNamedExpression,
  isFormulaValue,
  type ExportedEngineSheet,
  ArrayRangeClaims,
} from './xlsx/formula-utils';
import {
  getCssStyleFromElement,
  getAlignmentFromClassName,
  getAlignmentFromMeta,
  getBorderFromMeta,
  getFontFromMeta,
  getFillFromMeta,
  getDropdownValidation,
  cssColorToArgb,
  clearStyleCaches,
  ALIGNMENT_CLASS_NAMES,
  type CellMeta,
  type CssStyle,
} from './xlsx/cell-style';
import {
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  parseIsoDateTimeStringToSerial,
  intlDateFmtToExcelNumFmt,
  intlTimeFmtToExcelNumFmt,
  intlDateTimeFmtToExcelNumFmt,
} from './xlsx/date-utils';
import { intlNumFormatToExcelNumFmt } from './xlsx/numeric-utils';
import { detectXlsxEngine } from '../../../utils/xlsxEngine/detect';
import { DROPPED_FEATURES, DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import {
  appliesOperatorToRange, callsArrayFormulaAsOperand, callsDynamicArrayFunction, isMultiCellRangeDefinition,
  isWholeArrayFunctionCall,
  stripArrayFormulaCalls, unwrapArrayFormula,
} from '../../../utils/xlsxEngine/dynamicArrays';
import { SheetBuilder } from '../../../utils/xlsxEngine/builder';
import { colIndexToLetter, toRangeRef } from '../../../utils/xlsxEngine/cellRef';
import { DEFAULT_COMPRESSION_LEVEL } from '../../../utils/xlsxEngine/compression';
import { namesUsedIn } from '../../../utils/xlsxEngine/definedNames';
import type { XlsxEngineAdapter } from '../../../utils/xlsxEngine/adapters/types';
import { localeLowerCase } from '../../../helpers/string';
import {
  isReservedSheetName, SHEET_NAME_MAX_LENGTH, stripIllegalSheetNameChars,
} from '../../../utils/xlsxEngine/sheetNames';
import {
  PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT,
  POINTS_PER_PIXEL as PIXELS_TO_POINTS_RATIO,
} from '../../../utils/xlsxEngine/units';
import {
  createWorkbookSnapshot,
  type CellFormula,
  type CellFormulaArray,
  type CellSnapshot,
  type CellStyleSnapshot,
  type CellValidationSnapshot,
  type CellValue,
  type DefinedNameSnapshot,
  type SheetSnapshot,
  type WorkbookSnapshot,
} from '../../../utils/xlsxEngine/model';
import type { HotInstance } from '../../../core/types';
import type { CellProperties } from '../../../settings';
import { formatCellValue, type RendererWithValueFormatter } from '../../../renderers/renderCell';
import { getRenderer, hasRenderer } from '../../../renderers/registry';
import { normalizeClassNames } from '../../../helpers/dom/element';
import { getLicenseState, getXlsxEntitlement } from '../../../core/license';
import { EXPORT_FILE_CAPABILITY_IDS } from '../../../utils/xlsxEngine/licenseCapabilities';
import {
  formatMissingCapabilitiesWarning,
  scopeXlsxEntitlement,
  UNRESTRICTED_XLSX_ENTITLEMENT,
  type XlsxEntitlement,
} from '../../../utils/xlsxEngine/xlsxEntitlement';
import { warn } from '../../../helpers/console';
import { DEFAULT_COLUMN_WIDTH } from '../../../3rdparty/walkontable/src/constants';

/**
 * The name used when sanitization leaves nothing behind (a sheet named `"[*]"`, say).
 */
const FALLBACK_SHEET_NAME = 'Sheet';

/**
 * The base name of the hidden helper sheet carrying the dropdown source lists.
 */
const VALIDATION_SHEET_NAME = '_HotValidation';

/**
 * Turns a user-supplied sheet name into one the format accepts: illegal characters and control
 * characters removed (before the caller de-duplicates, so two names differing only by a control
 * character cannot collapse into one in `workbook.xml`), leading and trailing single quotes
 * stripped, the reserved `History` renamed, and an empty result replaced.
 * The reserved name is matched in any case: the ExcelJS engine rejects the exact `History` only, but
 * Excel reserves the name case-insensitively, the same way it compares names for duplicates.
 *
 * This is the only place the export enforces the rules, and it has to: the ExcelJS engine answers
 * each of them with a thrown `Error`, so a grid whose sheet name carries a colon — a date, `Q1: Sales`
 * — used to abandon the whole export rather than exporting under a slightly different name.
 */
function sanitizeSheetName(baseName: string): string {
  // Trim on BOTH sides of the quote strip. The ExcelJS engine tests the name it is handed, so
  // `" 'Q1' "` with the trim last still reaches it as `"'Q1'"` — quotes at the ends, and rejected.
  const stripped = stripIllegalSheetNameChars(baseName)
    .trim()
    .replace(/^'+/, '')
    .replace(/'+$/, '')
    .trim();

  if (stripped === '') {
    return FALLBACK_SHEET_NAME;
  }

  return isReservedSheetName(stripped) ? `${stripped}_` : stripped;
}

/**
 * Cuts a sanitized sheet name down to `maxLength`, dropping any single quote the cut left at the
 * end. An interior quote is legal, a trailing one is not — and the ExcelJS engine checks for it
 * before its own truncation, so it would reject a name only this cut had made end in one.
 */
function truncateSheetName(name: string, maxLength: number): string {
  const sliced = name.slice(0, maxLength).replace(/'+$/, '');

  return sliced === '' ? FALLBACK_SHEET_NAME : sliced;
}

/**
 * Narrows a pre-calculated display value to the primitives a cached formula result may carry.
 *
 * The ExcelJS engine throws `I could not understand type of value` for anything else, so an object
 * or an array left in a cell by a custom renderer would abandon the export from inside the summary
 * branch.
 */
function toPrimitiveResult(value: unknown): CellValue {
  // A non-finite number is not a legal `<v>` content. A ColumnSummary destination takes its cached
  // result straight from the displayed value, so a `sum` over a source holding `Infinity` reaches
  // this as `Infinity`, and a `custom` function can answer `NaN`. Both are cached as text instead.
  // A HyperFormula error reaches this as its display STRING (`#DIV/0!`), not as an object; the
  // formula branch of `#resolveCellValue` flags it from the engine's own value before this runs.
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : stringify(value);
  }

  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  return null;
}

/**
 * Lists the labels a dropdown or autocomplete cell offers, in `source` order - the text the
 * exported cells hold, so the Excel validation list has to hold the same text. A key/value entry
 * contributes its `value` half, labeled by the cell's `sourceLabel` when that half is an object.
 *
 * @param {Array} source The cell's `source` array.
 * @param {string|Function} [sourceLabel] The cell's `sourceLabel` option.
 * @returns {string[]}
 */
function getSourceLabels(source: unknown[], sourceLabel: SourceLabel | undefined): string[] {
  const labels: string[] = [];

  source.forEach((item) => {
    if (!isKeyValueEntry(item)) {
      labels.push(String(item));

      return;
    }

    const label = getChoiceLabel(item.value, sourceLabel);

    // The same entries the editor's list offers: one whose `sourceLabel` resolves to nothing would
    // be a blank Excel option the grid never shows, and a value picked from it matches no entry later.
    if (!isListableLabel(item, sourceLabel, label)) {
      return;
    }

    // A value that was not relabeled keeps the `String()` it was always written with.
    labels.push(label === item.value ? String(label) : stringify(label));
  });

  return labels;
}

/**
 * The labels a dropdown or autocomplete cell offers, together with the key the validation list
 * holding them is filed under.
 */
type SourceLabelsEntry = { labels: string[]; key: string };

/**
 * Resolves the {@link SourceLabelsEntry} of a cell's `source` array under its `sourceLabel`.
 */
type SourceLabelsResolver = (source: unknown[], sourceLabel: SourceLabel | undefined) => SourceLabelsEntry;

/**
 * Creates a memoized {@link getSourceLabels} for one worksheet export, keyed by the cell's `source`
 * array and its `sourceLabel`.
 *
 * The labels are needed twice per dropdown cell - once to build the validation list and once to
 * link the cell to it - and a column repeats the same `source` on every row. Recomputing them each
 * time costs one `sourceLabel` call per entry per cell per pass, which for a function `sourceLabel`
 * over a large column means millions of user calls per export. A fresh cache per worksheet keeps
 * the labels current with the `source` the export reads.
 *
 * @returns {Function} A function taking a cell's `source` array and `sourceLabel` option and
 *                     returning its labels and validation-list key.
 */
function createSourceLabelsResolver(): SourceLabelsResolver {
  const cache = new WeakMap<unknown[], Map<unknown, SourceLabelsEntry>>();

  return (source, sourceLabel) => {
    let bySourceLabel = cache.get(source);

    if (!bySourceLabel) {
      bySourceLabel = new Map();
      cache.set(source, bySourceLabel);
    }

    let entry = bySourceLabel.get(sourceLabel);

    if (!entry) {
      const labels = getSourceLabels(source, sourceLabel);

      entry = { labels, key: JSON.stringify(labels) };
      bySourceLabel.set(sourceLabel, entry);
    }

    return entry;
  };
}

/**
 * Resolves the Excel number format a cell's meta describes, independently of the value the cell
 * holds. A formula cell resolves the same format a value cell of that type would, so a column of
 * live formulas keeps the column's own format instead of reaching the file unformatted — which the
 * import then reads back as `text`.
 */
function resolveMetaNumFmt(meta: CellMeta): string | null {
  switch (meta.type) {
    case 'intl-datetime':
      return intlDateTimeFmtToExcelNumFmt(meta.dateTimeFormat, meta.locale);
    case 'date':
    case 'intl-date':
      return intlDateFmtToExcelNumFmt(meta.dateFormat, meta.locale);
    case 'time':
    case 'intl-time':
      return intlTimeFmtToExcelNumFmt(meta.timeFormat, meta.locale);
    case 'numeric':
      return intlNumFormatToExcelNumFmt(meta.numericFormat, meta.locale);
    default:
      return null;
  }
}

/**
 * The cell types whose value is a date, a time or a date-time: the ones `parseTemporalSerial` reads
 * and `toDisplayText` formats when `xlsx:number_formats` is missing.
 */
const TEMPORAL_CELL_TYPES = new Set(['date', 'intl-date', 'time', 'intl-time', 'intl-datetime']);

/**
 * Parses the value of a date, time or date-time cell to its Excel serial, or `null` when the cell is
 * not one of those types or its value does not parse.
 */
function parseTemporalSerial(value: unknown, meta: CellMeta): number | null {
  switch (meta.type) {
    case 'intl-datetime':
      return parseIsoDateTimeStringToSerial(value);
    case 'date':
    case 'intl-date':
      return parseIsoStringToSerial(value);
    case 'time':
    case 'intl-time':
      return parseTimeStringToSerial(value);
    default:
      return null;
  }
}

/**
 * The text the grid renders for a cell: its value after the cell's `valueFormatter` option or its
 * renderer's `valueFormatter` static, the same precedence the render path follows
 * (`formatCellValue()`).
 */
function toDisplayText(value: unknown, meta: CellMeta): string {
  const { renderer } = meta as { renderer?: unknown };
  // A renderer named by a string resolves through the registry, as `Core#getCellRenderer` does it.
  const resolved = typeof renderer === 'string' && hasRenderer(renderer) ? getRenderer(renderer) : renderer;
  const formatted = formatCellValue(
    value,
    meta as unknown as CellProperties,
    (typeof resolved === 'function' ? resolved : undefined) as unknown as RendererWithValueFormatter,
  );

  return stringify(formatted);
}

/**
 * The fill shape a header cell carries in the neutral cell model.
 */
type HeaderFill = NonNullable<NonNullable<CellSnapshot['style']>['fill']>;

/**
 * The border shape a header cell carries in the neutral cell model.
 */
type HeaderBorder = NonNullable<NonNullable<CellSnapshot['style']>['border']>;

/**
 * Descriptor for a merge cell, in data-array coordinate space.
 */
interface MergeDescriptor {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * Descriptor for a ColumnSummary destination, in data-array coordinate space.
 */
interface ColumnSummaryDescriptor {
  type: string;
  destRow: number;
  destCol: number;
  sourceCol: number;
  sourceRanges: [number, number][];
}

/**
 * One entry in the `conditionalFormatting` option array.
 */
interface ConditionalFormattingDescriptor {
  rows?: [number, number];
  cols?: [number, number];
  rules: unknown[];
}

/**
 * What the Formulas engine and the sheet layout tell about one exported cell.
 */
interface FormulaCellFacts {
  errorCode: string | null;
  arraySize: ArrayFormulaSize | null;
  computedValue: number | boolean | null;
  row: number;
  col: number;
}

/**
 * Where a sheet's array formulas go: the export's dropped-feature collector and the ranges the
 * sheet's earlier array formulas already cover.
 */
interface ArrayFormulaTarget {
  dropped: DroppedFeatures;
  arrayRanges: ArrayRangeClaims;
  /**
   * Whether the grid's Formulas engine computes an operator over a range element by element
   * (HyperFormula's `useArrayArithmetic`).
   */
  arrayArithmetic: boolean;
  /**
   * Whether a word of a formula is a name of the grid's engine defined over a multi-cell range, which
   * `appliesOperatorToRange` then counts as a range (`SUM(Sales*2)`). `null` when the engine has no
   * such name.
   */
  isRangeName: ((word: string) => boolean) | null;
}

/**
 * Records `formula:arrayExcluded`, once per export.
 *
 * @param {DroppedFeatures} dropped The export's dropped-feature collector.
 */
function recordArrayExcluded(dropped: DroppedFeatures): void {
  if (dropped.count(DROPPED_FEATURES.formulaArrayExcluded) === 0) {
    dropped.record(DROPPED_FEATURES.formulaArrayExcluded);
  }
}

/**
 * Decides whether a formula is written as an array formula, and as which kind.
 *
 * Every `ARRAYFORMULA(…)` call is stripped first (`stripArrayFormulaCalls`): Excel has no such
 * function, and the decisions below read the stripped text.
 *
 * 1. A formula that is one `ARRAYFORMULA(…)` call as a whole is HyperFormula's legacy (CSE) array,
 *    written as a CSE array over the spill, or over the cell itself when the engine reports no spill.
 *    The spill is the size the engine mapped (`ArrayFormulaSize#untrimmed`), not the trimmed one a
 *    dynamic array takes: Excel never resizes a CSE ref.
 * 2. A formula the engine spills (`SEQUENCE(3)`, `ARRAYFORMULA(A1:A3)*2` under array arithmetic) is a
 *    dynamic array over the spill.
 * 3. A call to a function Excel evaluates as a dynamic array (`IFS`, `SWITCH`) is a one-cell
 *    dynamic array, so Excel does not add the implicit-intersection `@`. So is a formula that is one
 *    whole call to a function that can return an array (`SEQUENCE(1)`, `INDIRECT("A1")`,
 *    `LET(x,1,x)`, `isWholeArrayFunctionCall`) and has no spill, as Excel Online saves it, whatever
 *    the engine computes or whether it knows the function.
 * 4. Under the engine's `useArrayArithmetic`, an operator applied to a multi-cell range
 *    (`SUM(A1:A3*B1:B3)`, `appliesOperatorToRange`) is a one-cell dynamic array too: the engine
 *    computes it over every cell, and Excel 365 would open a plain formula as
 *    `SUM(@A1:A3*@B1:B3)`. Without array arithmetic the engine intersects the range itself, as
 *    the `@` does, so the plain formula already matches.
 * 5. Otherwise, an `ARRAYFORMULA` call that is a whole function argument (`SUM(ARRAYFORMULA(x))`)
 *    evaluates its argument as an array, which a one-cell CSE array keeps. A call that is an operand
 *    (`ARRAYFORMULA(A1:A3)*2`, `callsArrayFormulaAsOperand`) is intersected by the engine without
 *    array arithmetic (A2*2 on row 2), as Excel's `@` does, so it is a plain formula: a one-cell CSE
 *    array would compute A1*2.
 *
 * A spill the export does not keep in shape (an excluded row or column, the `range` edge), an
 * array whose range overlaps an earlier array formula of the sheet, and an array over a merged cell
 * (`ArrayRangeClaims`; a one-cell dynamic array may sit on one) are written as plain formulas and
 * reported once per export as `formula:arrayExcluded`.
 *
 * @param {string} text The normalized formula, without the leading `=`.
 * @param {object} facts The cell's facts.
 * @param {object} target The export's dropped-feature collector and the sheet's claimed ranges.
 * @returns {{ text: string, array?: object }}
 */
function resolveArrayFormula(
  text: string, facts: FormulaCellFacts, target: ArrayFormulaTarget
): { text: string; array?: CellFormulaArray } {
  const { arraySize, row, col } = facts;
  const formulaText = stripArrayFormulaCalls(text);
  let dynamic: boolean;

  if (unwrapArrayFormula(text) !== null) {
    dynamic = false;

  } else if (arraySize !== null || callsDynamicArrayFunction(formulaText) || isWholeArrayFunctionCall(formulaText)
    || (target.arrayArithmetic && appliesOperatorToRange(formulaText, target.isRangeName ?? undefined))) {
    dynamic = true;

  } else if (formulaText !== text && !callsArrayFormulaAsOperand(text)) {
    dynamic = false;

  } else {
    return { text: formulaText };
  }

  // Excel never resizes a CSE ref, so a CSE array keeps the size the engine mapped. When that room
  // does not reach the file (`ARRAYFORMULA(FILTER(…))` reserving rows past the last one) and the
  // values do, the ref covers the values: Excel shows a legacy array's first cells, which hold them,
  // where a plain formula would open with an `@`.
  const untrimmed = dynamic ? undefined : arraySize?.untrimmed;
  const size = untrimmed && (untrimmed.exported || !arraySize?.exported) ? untrimmed : arraySize;

  if (size !== null && !size.exported) {
    recordArrayExcluded(target.dropped);

    return { text: formulaText };
  }

  const rows = size?.rows ?? 1;
  const cols = size?.cols ?? 1;

  if (!target.arrayRanges.claim({ top: row, left: col, bottom: row + rows - 1, right: col + cols - 1 }, dynamic)) {
    recordArrayExcluded(target.dropped);

    return { text: formulaText };
  }

  return { text: formulaText, array: { ref: toArrayRef(row, col, rows, cols), dynamic } };
}

/**
 * Builds the `ref` of an array formula: the single address for one cell (`C1`, Excel's own form),
 * the range otherwise (`A1:A3`). Coordinates are 1-based.
 *
 * @param {number} row The master's row.
 * @param {number} col The master's column.
 * @param {number} rows The spill height.
 * @param {number} cols The spill width.
 * @returns {string}
 */
function toArrayRef(row: number, col: number, rows: number, cols: number): string {
  if (rows === 1 && cols === 1) {
    return `${colIndexToLetter(col)}${row}`;
  }

  return toRangeRef(row, col, row + rows - 1, col + cols - 1);
}

/**
 * An entry in a nested-header layer returned by ExportDataProvider#getNestedColumnHeaders.
 */
interface NestedHeaderEntry {
  label: string | null;
  colspan: number;
  className?: string;
}

/**
 * Sheet-level context object passed through from `#populateWorksheet` to the
 * per-row and per-cell writing helpers.
 */
interface SheetContext {
  exportFormulas: boolean;
  arrayArithmetic: boolean;
  isRangeName: ((word: string) => boolean) | null;
  formulasSeparator: string;
  formulasDecimalSeparator: string;
  dataRowOffset: number;
  dataColOffset: number;
  excludedHiddenRows: Set<number> | null;
  excludedHiddenCols: Set<number> | null;
  summaryMap: Map<string, ColumnSummaryDescriptor>;
  sourceData: unknown[][] | null;
  engineCellFacts: (EngineCellFacts | null)[][] | null;
  /**
   * With `exportFormulas`, the names of the grid's Formulas engine (`definedNameKey`, workbook and
   * sheet scope), or `null` when it has none: a formula over one of them is recorded in `nameUses`.
   */
  engineNames: Set<string> | null;
  /**
   * The grid's engine sheet name, lower-cased: the scope a name of its formulas is read in first.
   */
  engineScope: string;
  /**
   * The name the export gives the grid's sheet, lower-cased: the scope Excel reads a name in first.
   */
  fileScope: string;
  engine: object | null;
  nameUses: DefinedNameUse[];
  dropped: DroppedFeatures;
  arrayRanges: ArrayRangeClaims;
  hasRowHeaders: boolean;
  headerFill: HeaderFill | null;
  headerBorder: HeaderBorder | null;
  hasReadOnlyCells: boolean;
  rootDocument: Document;
  rootWindow: Window;
  validationMap: Map<string, string>;
  sourceLabels: SourceLabelsResolver;
  cellsMeta: CellMeta[][];
  cellElements: Array<Array<HTMLElement | null>>;
  rowHeaders: Array<string | number | null>;
  rowsHeights: number[];
}

/**
 * One grid of the export bound to a Formulas engine: its data provider, the engine, where its
 * engine sheet landed in the file, and whether it was exported with `exportFormulas`. Every bound
 * grid is a sheet a name may point to; only a grid with `exportFormulas` makes its engine's names
 * part of the file.
 */
interface NamedExpressionSource {
  dataProvider: ExportDataProvider;
  engine: object;
  engineSheetName: string;
  separator: string;
  decimalSeparator: string;
  exportFormulas: boolean;
  sheet: ExportedEngineSheet;
}

/**
 * A cell written with a formula that uses defined names of its engine, and the value it is written
 * with instead when one of those names does not reach the file.
 */
interface DefinedNameUse {
  cell: CellSnapshot;
  engine: object;
  /**
   * The names the formula reads in its engine (`definedNameKey`).
   */
  names: string[];
  /**
   * The exported sheet the cell is on, lower-cased.
   */
  fileScope: string;
  fallback: { value: CellValue; numFmt: string | null; valueIsError?: true };
}

/**
 * What `#addDefinedNames` tells about one engine's names, each keyed by `definedNameKey` with its
 * ENGINE scope: `written` maps a name added to the file with that engine's definition to the key
 * of the file's name (its exported scope), and `uses` lists, for each of its names, the names of the
 * engine its definition reads.
 */
interface EngineDefinedNames {
  written: Map<string, string>;
  uses: Map<string, string[]>;
}

interface XlsxSheetConfig {
  instance: HotInstance;
  name?: string;
  [key: string]: unknown;
}

/**
 * The key of a defined name in one scope: the lower-cased scope (a sheet name, or `''` for the
 * workbook) and the lower-cased name, joined by a character neither can hold.
 *
 * @param {string|null} scope The sheet the name is scoped to, or `null` for the workbook.
 * @param {string} name The name.
 * @returns {string}
 */
function definedNameKey(scope: string | null, name: string): string {
  return `${scope === null ? '' : localeLowerCase(scope)}\u0000${localeLowerCase(name)}`;
}

/**
 * Splits a `definedNameKey` back into its lower-cased scope (`''` for the workbook) and name.
 *
 * @param {string} key The key.
 * @returns {{ scope: string, name: string }}
 */
function splitDefinedNameKey(key: string): { scope: string; name: string } {
  const separator = key.indexOf('\u0000');

  return { scope: key.slice(0, separator), name: key.slice(separator + 1) };
}

/**
 * Resolves a word of a formula to the key of the defined name it reads, the way Excel and
 * HyperFormula do: the name scoped to the formula's sheet first, then the workbook's. Answers
 * `null` when `keys` holds neither.
 *
 * @param {Set<string>} keys The keys of the names that may be read.
 * @param {string} scope The lower-cased sheet the formula is on, `''` for a workbook name's definition.
 * @param {string} word The lower-cased word.
 * @returns {string|null}
 */
function resolveDefinedName(keys: Set<string>, scope: string, word: string): string | null {
  const scoped = `${scope}\u0000${word}`;

  if (scope !== '' && keys.has(scoped)) {
    return scoped;
  }

  const workbookKey = `\u0000${word}`;

  return keys.has(workbookKey) ? workbookKey : null;
}

// Default width (in Excel column-width units) assigned to the frozen row-header column
// when row headers are exported. Chosen to comfortably fit typical row-index numbers.
const ROW_HEADER_DEFAULT_WIDTH = 5;

/**
 * Typed view of the options object used internally within the Xlsx exporter.
 */
interface XlsxOptions extends Record<string, unknown> {
  exportFormulas?: boolean;
  headerStyle?: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null;
  conditionalFormatting?: ConditionalFormattingDescriptor[];
  protection?: { password?: string } | null;
}

/**
 * The longest sheet password Excel accepts, in UTF-16 units.
 */
const MAX_PROTECTION_PASSWORD_LENGTH = 255;

/**
 * What `#populateWorksheet` read of a sheet that decides which gated features it had to write.
 */
interface SheetFeatureFacts {
  wouldProtect: boolean;
  hasHeaders: boolean;
  hasSummary: boolean;
  nestedColumnHeaders: NestedHeaderEntry[][] | null;
  hasRowHeaders: boolean;
  columnsWidths: number[];
  rowsHeights: number[];
  mergeCells: MergeDescriptor[];
  frozenRows: number;
  frozenColumns: number;
  hiddenRowIndices: number[];
  hiddenColIndices: number[];
}

/**
 * Whether a sheet has layout for `xlsx:layout` to write: a column width other than the default, a
 * row-header column (it always gets a width), an explicit row height, a hidden row or column, a
 * merge (a nested header group included), a frozen pane, or a right-to-left direction. A default-width grid with none of them has no layout.
 */
function hasLayout(facts: SheetFeatureFacts, isRtl: boolean): boolean {
  const nestedMerges = facts.nestedColumnHeaders !== null && (
    (facts.hasRowHeaders && facts.nestedColumnHeaders.length > 1)
    || facts.nestedColumnHeaders.some(layer => layer.some(header => header.colspan > 1))
  );

  return isRtl
    || nestedMerges
    || facts.mergeCells.length > 0
    || facts.frozenRows > 0
    || facts.frozenColumns > 0
    || facts.hiddenRowIndices.length > 0
    || facts.hiddenColIndices.length > 0
    // The row-header column always gets a width of its own.
    || facts.hasRowHeaders
    || facts.columnsWidths.some(width => isDefined(width) && width !== DEFAULT_COLUMN_WIDTH)
    || facts.rowsHeights.some(height => isDefined(height));
}

/**
 * Refuses a `protection` option the export cannot honor: anything but `undefined`, `null` or a plain
 * object, an object whose `password` is neither `undefined`, `null` nor a string, and a password
 * longer than Excel's 255 characters. A number would otherwise reach the engines, which disagree on
 * it: the built-in one hashes it as an empty password (a protected-looking sheet with no real
 * password), and ExcelJS throws a bare `TypeError`. The messages name the option, never its value,
 * because the value may be a password.
 *
 * @param {*} protection The `protection` export option.
 */
function assertProtectionOption(protection: unknown): void {
  if (protection === undefined || protection === null) {
    return;
  }

  if (!isObject(protection)) {
    throwWithCause('ExportFile: the "protection" option has to be an object or null.');
  }

  const { password } = protection as { password?: unknown };

  if (password !== undefined && password !== null && typeof password !== 'string') {
    throwWithCause('ExportFile: the "protection.password" option has to be a string.');
  }

  // Excel accepts a sheet password of at most 255 characters, counted in UTF-16 units, which is what
  // `length` counts.
  if (typeof password === 'string' && password.length > MAX_PROTECTION_PASSWORD_LENGTH) {
    throwWithCause(
      `ExportFile: the "protection.password" option has to be at most ${MAX_PROTECTION_PASSWORD_LENGTH} `
      + 'characters long.'
    );
  }
}

/**
 * @private
 */
class Xlsx extends BaseType {
  /**
   * What the license of the plugin's own instance unlocks of the XLSX engine. Resolved at the start
   * of every export; the instances named in the `sheets` option never override it.
   */
  #entitlement: XlsxEntitlement = UNRESTRICTED_XLSX_ENTITLEMENT;

  /**
   * The capability tokens whose feature this export had something to write, collected while the
   * sheets are populated. The missing-token warning names only the missing tokens found here, so a
   * plain grid exported on a restricted key says nothing.
   */
  #needed = new Set<string>();

  /**
   * Marks this formatter as binary (non-stringifiable).
   *
   * @returns {boolean}
   */
  static get BINARY() {
    return true;
  }

  /**
   * Returns true to indicate that XLSX data should be treated as binary output.
   */
  get binary() {
    return true;
  }

  /**
   * Default options for exporting XLSX format.
   *
   * @returns {object}
   */
  static get DEFAULT_OPTIONS(): {
    mimeType: string;
    fileExtension: string;
    bom: boolean;
    engine: object | null;
    compression: boolean | number | null;
    conditionalFormatting: ConditionalFormattingDescriptor[];
    exportFormulas: boolean;
    headerStyle: { backgroundColor: string; border: { style: string } } | null;
    protection: { password?: string } | null | undefined;
    } {
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx',
      bom: false,
      engine: null,
      // DEFLATE compression: null (the default) and true = level 6, a number 1–9 = that level,
      // false = stored. The default has always been DEFLATE: before the option was mapped
      // explicitly, an absent `zip` option left JSZip on its own DEFLATE default.
      compression: null,
      // Array of { rows?, cols?, rules } conditional formatting descriptors.
      conditionalFormatting: [],
      // When true, HyperFormula formula cells and ColumnSummary destinations are exported as live
      // Excel formulas. When false (default) the pre-calculated static values are exported.
      exportFormulas: false,
      // Style applied to column and row header cells. `backgroundColor` and `border.color` accept a
      // CSS hex, `rgb()`, `hsl()` or named color (see `cssColorToArgb`). `border` sets the border
      // style on all four sides; set to `null` to suppress it.
      // Set the whole option to `null` to export headers with no styling at all.
      headerStyle: { backgroundColor: '#F2F2F2', border: { style: 'thin' } },
      // Sheet protection of the read-only cells. `undefined` (the default) protects every sheet that
      // has a read-only cell, with no password. `{ password }` protects them with that password (the
      // file keeps only its salted SHA-512 hash); `null` never protects and leaves every cell unlocked.
      protection: undefined,
    };
  }

  /**
   * Builds an XLSX workbook and returns its binary buffer.
   *
   * When the `sheets` option is provided the workbook contains one worksheet per entry,
   * each driven by its own Handsontable instance. Otherwise a single worksheet named
   * `'Sheet1'` is produced from the primary ExportDataProvider.
   *
   * @returns {Promise<Uint8Array>}
   */
  async export(): Promise<Uint8Array> {
    // An invalid option is refused before any engine work, whatever the license unlocks.
    assertProtectionOption(this.options.protection);

    // A nullish `engine` (the option's own default, or a resolved `engines: { xlsx: null }`) is
    // read as the built-in engine by `detectXlsxEngine` itself, so nothing is mapped here.
    const detected = detectXlsxEngine(this.options.engine, 'exportFile');
    const { hot } = this.dataProvider;

    // Scoped to the export's own tokens, so the warning never names `xlsx:import`.
    this.#entitlement = scopeXlsxEntitlement(getXlsxEntitlement(hot), EXPORT_FILE_CAPABILITY_IDS);
    this.#needed = new Set();

    // Clear style caches for all documents involved in this export. In multi-sheet
    // mode each sheet may come from a different Handsontable instance living in a
    // different document (e.g. an iframe), so every distinct document must be cleared.
    const sheets = this.options.sheets as unknown as XlsxSheetConfig[] | null | undefined;
    const docsToClear = sheets && sheets.length > 0
      ? new Set(sheets.map(s => s.instance.rootDocument))
      : new Set([hot.rootDocument]);

    docsToClear.forEach(doc => clearStyleCaches(doc as Document));

    const workbook = createWorkbookSnapshot();

    workbook.compression = this.#getCompressionLevel();

    // Every name the workbook takes, lower-cased: the ExcelJS engine compares names
    // case-insensitively and throws on a duplicate. The `_HotValidation` helper sheets share the
    // set, so a data sheet carrying that name can never collide with one.
    const usedSheetNames = new Set<string>();
    const dropped = new DroppedFeatures();
    // Every grid exported with `exportFormulas` and a Formulas engine, so the engines' names are
    // written once, against every sheet of the file, after all of them are known.
    const namedSources: NamedExpressionSource[] = [];
    // The formula cells over an engine's names, checked once the names in the file are known.
    const nameUses: DefinedNameUse[] = [];

    if (sheets && sheets.length > 0) {
      // multi-sheet mode
      // `protection` applies to the whole workbook, so a per-sheet value is dropped below. Said once
      // per export, and never with the value, which may be a password.
      if (sheets.some(sheetConfig => Object.prototype.hasOwnProperty.call(sheetConfig, 'protection'))) {
        warn('ExportFile: the "protection" option applies to the whole workbook; '
          + 'the value set on a sheet entry was ignored.');
      }

      sheets.forEach((sheetConfig) => {
        const dp = new ExportDataProvider(sheetConfig.instance);
        // `protection` is a workbook-wide option: only the top-level value, checked by
        // `assertProtectionOption()` above, applies, so a per-sheet one is dropped before the merge.
        const { protection: _ignoredProtection, ...perSheetConfig } = sheetConfig;

        // A sheet entry bypasses `_mergeOptions()`, so the removed-option check runs here too.
        warnRemovedColumnHeadersOption(perSheetConfig);

        const sheetOptions = { ...this.options, ...perSheetConfig };

        dp.setOptions(sheetOptions);

        const name = this.#uniqueSheetName(sheetConfig.name || 'Sheet', usedSheetNames);

        this.#populateWorksheet(workbook, name, dp, sheetOptions, {
          usedSheetNames, dropped, namedSources, nameUses,
        });
      });
    } else {
      // single-sheet mode
      const name = this.#uniqueSheetName('Sheet1', usedSheetNames);

      this.#populateWorksheet(
        workbook, name, this.dataProvider, this.options, { usedSheetNames, dropped, namedSources, nameUses }
      );
    }

    // `missing` keeps the `XLSX_CAPABILITY_IDS` order, so the warning does too.
    const missing = this.#entitlement.missing.filter(id => this.#needed.has(id));

    // One warning per export, naming the tokens only, and only those whose feature the export
    // actually left out. An option the license overrode (`exportFormulas`, `conditionalFormatting`)
    // is covered by its token in the list.
    if (missing.length > 0 && getLicenseState(hot).channels.console) {
      warn(formatMissingCapabilitiesWarning('export', missing));
    }

    const writtenByEngine = this.#addDefinedNames(workbook, namedSources, dropped);

    this.#unlinkLeftOutNames(workbook, detected.adapter, writtenByEngine, nameUses, dropped);

    const bytes = await detected.adapter.write(workbook, detected.module, dropped);

    dropped.warn(detected.kind);

    return bytes;
  }

  /**
   * Records that the export had something to write for a capability token.
   *
   * @param {boolean} condition Whether it had.
   * @param {string} id The capability token.
   */
  #needIf(condition: boolean, id: string): void {
    if (condition) {
      this.#needed.add(id);
    }
  }

  /**
   * Records the sheet-level features the export had something to write for, whatever the license
   * unlocks: the header style, live formulas, layout, conditional formatting, and protection. The
   * per-cell ones (styles, number formats, validations, comments) are recorded while the cells are
   * written.
   *
   * @param {ExportDataProvider} dataProvider The sheet's data provider.
   * @param {object} options Merged options for this sheet.
   * @param {object} facts What `#populateWorksheet` already read of the sheet.
   */
  #recordSheetFeatures(dataProvider: ExportDataProvider, options: XlsxOptions, facts: SheetFeatureFacts): void {
    // The default header fill counts: only `headerStyle: null` writes headers with no style.
    this.#needIf(facts.hasHeaders && options.headerStyle !== null, 'xlsx:styles');
    this.#needIf(Boolean(options.conditionalFormatting?.length), 'xlsx:conditional_formatting');
    this.#needIf(facts.wouldProtect || isObject(options.protection), 'xlsx:protection');
    this.#needIf(hasLayout(facts, dataProvider.getLayoutDirection() === 'rtl'), 'xlsx:layout');

    // Read only when the token is missing: with it, the flag changes nothing, and the source data
    // would be read twice.
    if (options.exportFormulas && !this.#entitlement.formulas && !this.#needed.has('xlsx:formulas')) {
      this.#needIf(facts.hasSummary || dataProvider.getSourceData()
        .some(row => row.some(value => isFormulaValue(value))), 'xlsx:formulas');
    }
  }

  /**
   * Returns a sheet name the XLSX format accepts and the workbook does not already use, and records
   * it as used.
   *
   * The name is sanitized first, then truncated, then de-duplicated — in that order. Truncating
   * last would let two distinct 35-character names that differ only past character 31 collide
   * *after* the de-duplication had already passed them, which the ExcelJS engine answers by
   * throwing. The counter is made room for inside the 31 characters for the same reason. Comparison
   * is case-insensitive because the ExcelJS engine's own duplicate check is.
   */
  #uniqueSheetName(baseName: string, usedSheetNames: Set<string>): string {
    const sanitized = sanitizeSheetName(baseName);
    let name = truncateSheetName(sanitized, SHEET_NAME_MAX_LENGTH);
    let suffix = 1;

    while (usedSheetNames.has(name.toLowerCase())) {
      const counter = String(suffix);

      name = `${truncateSheetName(sanitized, SHEET_NAME_MAX_LENGTH - counter.length)}${counter}`;
      suffix += 1;
    }

    usedSheetNames.add(name.toLowerCase());

    return name;
  }

  /**
   * Populates a single worksheet snapshot from the given ExportDataProvider and pushes it into
   * the workbook snapshot, followed by its dropdown-source helper sheet.
   *
   * Extracts the data writing logic shared between single-sheet and multi-sheet exports.
   *
   * `usedSheetNames` is the workbook-wide set of lower-cased names already taken; it is passed
   * through so the dropdown-source helper sheet is named from the same set as the data sheets.
   *
   * @param {object} workbook The neutral workbook snapshot.
   * @param {string} name The worksheet name.
   * @param {ExportDataProvider} dataProvider ExportDataProvider configured for this sheet.
   * @param {object} options Merged options for this sheet.
   * @param {object} collectors The workbook-wide collectors: `usedSheetNames` (the lower-cased sheet
   *   names the workbook already uses), `dropped` (the export's dropped-feature collector, which the
   *   writer gets as well), `namedSources` (the grids whose engine names `#addDefinedNames`
   *   writes once every sheet is known) and `nameUses` (the formula cells over those names).
   * @returns {number} Number of data rows written.
   */
  #populateWorksheet(
    workbook: WorkbookSnapshot, name: string, dataProvider: ExportDataProvider, options: XlsxOptions,
    collectors: {
      usedSheetNames: Set<string>;
      dropped: DroppedFeatures;
      namedSources: NamedExpressionSource[];
      nameUses: DefinedNameUse[];
    }
  ): number {
    const { usedSheetNames, dropped, namedSources, nameUses } = collectors;
    const sheet = new SheetBuilder(name);
    const data = dataProvider.getData();
    const cellsMeta = dataProvider.getCellsMeta();
    const sourceLabels = createSourceLabelsResolver();
    // Without `xlsx:data_validation` there is no dropdown list to point at, so no helper sheet either.
    const { validationMap, sheet: validationSheet } = this.#entitlement.dataValidation
      ? this.#buildValidationSheet(usedSheetNames, cellsMeta, sourceLabels)
      : { validationMap: new Map<string, string>(), sheet: null };
    const cellElements = dataProvider.getCellElements();
    const columnHeaders = dataProvider.getColumnHeaders();
    const columnHeadersClassNames = dataProvider.getColumnHeadersClassNames();
    const rowHeaders = dataProvider.getRowHeaders();
    const columnsWidths = dataProvider.getColumnsWidths() as number[];
    const rowsHeights = dataProvider.getRowsHeights() as number[];
    const mergeCells = dataProvider.getMergeCells();
    const frozenRows = dataProvider.getFrozenRows();
    const frozenColumns = dataProvider.getFrozenColumns();
    const nestedColumnHeaders = dataProvider.getNestedColumnHeaders();
    const { layout } = this.#entitlement;
    const isRtl = layout && dataProvider.getLayoutDirection() === 'rtl';
    const exportFormulas = this.#entitlement.formulas && Boolean(options.exportFormulas);

    // Build a fast O(1) lookup: "dataRowIndex:dataColIndex" → summary descriptor.
    // Always built so the protection pre-scan can identify ColumnSummary destination
    // cells; the formula-writing path also uses this map when exportFormulas is true.
    const summaryMap = new Map();
    const columnSummaries = dataProvider.getColumnSummaries();

    columnSummaries.forEach((summaryRaw: object) => {
      const summary = summaryRaw as ColumnSummaryDescriptor;

      summaryMap.set(`${summary.destRow}:${summary.destCol}`, summary);
    });

    const sourceData = exportFormulas ? dataProvider.getSourceData() : null;
    // Read whenever the Formulas plugin is on (`null` otherwise), in one pass: a cell
    // whose value is an error exports as an Excel error whether or not its formula goes out with it,
    // and a computed number or boolean keeps its type, so a text column does not write a spilled `2`
    // as the text `"2"`. The array sizes are read with `exportFormulas` only.
    const engineCellFacts = dataProvider.getEngineCellFacts(exportFormulas);
    const formulasSeparator = exportFormulas ? dataProvider.getFormulasSeparator() : ',';
    const formulasDecimalSeparator = exportFormulas ? dataProvider.getFormulasDecimalSeparator() : '.';
    const hasColumnHeaders = columnHeaders.length > 0;
    const hasRowHeaders = rowHeaders.length > 0;
    const useNestedHeaders = nestedColumnHeaders !== null && hasColumnHeaders;

    let headerRowCount = 0;

    if (useNestedHeaders) {
      headerRowCount = nestedColumnHeaders.length;
    } else if (hasColumnHeaders) {
      headerRowCount = 1;
    }

    const dataRowOffset = headerRowCount + 1;
    const dataColOffset = hasRowHeaders ? 2 : 1;

    const excludedHiddenRows = exportFormulas ? dataProvider.getExcludedHiddenRows() : null;
    const excludedHiddenCols = exportFormulas ? dataProvider.getExcludedHiddenColumns() : null;

    const hiddenRowIndices = dataProvider.getHiddenRowDataIndices();
    const hiddenColIndices = dataProvider.getHiddenColumnDataIndices();

    const { rootDocument, rootWindow } = dataProvider.hot;

    if (layout) {
      this.#applyColumnWidths(sheet, columnsWidths, hasRowHeaders);
      this.#applyHiddenColumns(sheet, hiddenColIndices, hasRowHeaders);
      this.#applyWorksheetViews(sheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl);
    }

    // The header fill and border are styles: without `xlsx:styles` headers export as if
    // `headerStyle` were `null`.
    const headerStyle = this.#entitlement.styles ? options.headerStyle : null;
    const headerFill = this.#buildHeaderFill(headerStyle);
    const headerBorder = this.#buildHeaderBorder(headerStyle);

    if (useNestedHeaders) {
      this.#writeNestedColumnHeaders(
        sheet, nestedColumnHeaders, hasRowHeaders, dataColOffset, headerFill, headerBorder
      );

      // Header merges are layout, like data merges: without `xlsx:layout` each group label stays in
      // the group's first header cell and the other spanned cells stay empty.
      if (layout) {
        this.#applyNestedHeaderMerges(sheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
      }
    } else if (hasColumnHeaders) {
      this.#writeColumnHeaders(
        sheet, columnHeaders, columnHeadersClassNames, hasRowHeaders, dataColOffset, headerFill, headerBorder
      );
    }

    // Pre-scan: only write cell protection when the sheet actually contains cells
    // that should be locked in Excel. Two reasons to skip it entirely:
    //
    // 1. When ColumnSummary is active, its destination cells (and any adjacent label
    //    cells marked readOnly) are readOnly only to prevent in-grid editing. Locking
    //    those cells in Excel surprises users and adds no value, so protection is
    //    suppressed whenever ColumnSummary is present.
    //
    // 2. Setting protection on every cell — even { locked: false } — causes the ExcelJS engine to
    //    initialize font/fill/border to sentinel values, which adds noise to the file
    //    and breaks styling assertions in tests.
    const hasColumnSummary = summaryMap.size > 0;
    const { protection } = options;
    const wouldProtect = protection !== null && !hasColumnSummary &&
      cellsMeta.some((row: unknown[]) =>
        row.some((meta: unknown) => (meta as Record<string, unknown>)?.readOnly === true));
    const hasReadOnlyCells = this.#entitlement.protection && wouldProtect;

    this.#recordSheetFeatures(dataProvider, options, {
      wouldProtect,
      hasHeaders: hasColumnHeaders || hasRowHeaders,
      hasSummary: hasColumnSummary,
      nestedColumnHeaders: useNestedHeaders ? nestedColumnHeaders : null,
      hasRowHeaders,
      columnsWidths,
      rowsHeights,
      mergeCells,
      frozenRows,
      frozenColumns,
      hiddenRowIndices,
      hiddenColIndices,
    });

    // Registered with or without `exportFormulas`: a sheet written as values is still in the file,
    // so a name of another grid on the same engine may point at it.
    const binding = dataProvider.getFormulasBinding();
    const namedExpressions = exportFormulas && binding ? dataProvider.getNamedExpressions() : [];
    const engineNames = exportFormulas && binding
      ? new Set(namedExpressions.map(({ name: definedName, scope }) => definedNameKey(scope ?? null, definedName)))
      : null;
    const engineScope = binding ? localeLowerCase(binding.sheetName) : '';
    // The names over a multi-cell range, which an operator next to them applies to every cell.
    const rangeNames = new Set(namedExpressions
      .filter(({ formula }) => formula !== null && isMultiCellRangeDefinition(formula))
      .map(({ name: definedName, scope }) => definedNameKey(scope ?? null, definedName)));
    const isRangeName = engineNames !== null && rangeNames.size > 0
      ? (word: string) => {
        const key = resolveDefinedName(engineNames, engineScope, localeLowerCase(word));

        return key !== null && rangeNames.has(key);
      }
      : null;
    const engineConfig = (binding?.engine as { getConfig?: () => { useArrayArithmetic?: unknown } } | undefined)
      ?.getConfig?.();

    const context = {
      exportFormulas,
      arrayArithmetic: exportFormulas && engineConfig?.useArrayArithmetic === true,
      formulasSeparator,
      formulasDecimalSeparator,
      dataRowOffset,
      dataColOffset,
      excludedHiddenRows,
      excludedHiddenCols,
      summaryMap,
      sourceData,
      engineCellFacts,
      engineNames: engineNames !== null && engineNames.size > 0 ? engineNames : null,
      engine: binding?.engine ?? null,
      engineScope,
      isRangeName,
      fileScope: localeLowerCase(name),
      nameUses,
      dropped,
      // Without `xlsx:layout` no merge is written, so none can block an array.
      arrayRanges: new ArrayRangeClaims((layout ? mergeCells : []).map((merge: MergeDescriptor) => ({
        top: merge.row + dataRowOffset,
        left: merge.col + dataColOffset,
        bottom: merge.row + dataRowOffset + merge.rowspan - 1,
        right: merge.col + dataColOffset + merge.colspan - 1,
      }))),
      hasRowHeaders,
      headerFill,
      headerBorder,
      hasReadOnlyCells,
      rootDocument,
      rootWindow,
      validationMap,
      sourceLabels,
      cellsMeta,
      cellElements,
      rowHeaders,
      rowsHeights: layout ? rowsHeights : [],
    };

    this.#writeDataRows(sheet, data, context);

    if (binding) {
      namedSources.push({
        dataProvider,
        engine: binding.engine,
        engineSheetName: binding.sheetName,
        separator: formulasSeparator,
        decimalSeparator: formulasDecimalSeparator,
        exportFormulas,
        sheet: {
          exportedName: name,
          rowOffset: dataRowOffset - 1,
          colOffset: dataColOffset - 1,
          // The left-out rows and columns are read by `#addDefinedNames`, only for an engine
          // that has names.
        },
      });
    }

    if (layout) {
      this.#applyHiddenRows(sheet, hiddenRowIndices, dataRowOffset);
      this.#applyMerges(sheet, mergeCells, dataRowOffset, dataColOffset);
    }

    if (hasReadOnlyCells) {
      // Protect the worksheet so that locked cells become read-only in Excel. Without a
      // `protection.password` (or with an empty one) no password is set, and users can unprotect at
      // any time. The permissive options keep non-editing actions (select, sort, filter,
      // resize) available so the spreadsheet remains usable.
      sheet.protect(protection?.password ?? '', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatColumns: true,
        formatRows: true,
        sort: true,
        autoFilter: true,
      });
    }

    const { conditionalFormatting } = options;

    if (this.#entitlement.conditionalFormatting && conditionalFormatting && conditionalFormatting.length > 0) {
      this.#applyConditionalFormatting(
        sheet,
        conditionalFormatting,
        dataRowOffset,
        dataColOffset,
        data.length,
        data[0]?.length ?? 0
      );
    }

    workbook.sheets.push(sheet.toSnapshot());

    if (validationSheet) {
      workbook.sheets.push(validationSheet);
    }

    return data.length;
  }

  /**
   * Adds the named expressions of the exported grids' Formulas engines to the workbook as defined
   * names, each one ONCE. A workbook-scoped name is written with workbook scope, and a name scoped
   * to an engine sheet with the scope of the sheet the export writes for it; a name scoped to an
   * engine sheet the export does not write is skipped (no cell of the file can read it). Grids of a
   * multi-sheet export usually share one engine, so the names are read per engine, and each is
   * normalized against every engine sheet this export writes (`normalizeNamedExpression`): a
   * reference moves with the header band and the left-out rows and columns of the grid that sheet
   * belongs to, and names that grid's exported sheet. A name that cannot be expressed in the file
   * (a reference to an engine sheet the export does not write among others), or that repeats an
   * added name of the same scope with another definition, is left out and
   * `definedNames:unsupported` recorded once.
   *
   * Every grid bound to an engine is a sheet a name may point to, `exportFormulas` or not. An
   * engine's names are written only when at least one of its grids is exported with
   * `exportFormulas`, and they are read from that grid.
   *
   * @param {object} workbook The neutral workbook snapshot.
   * @param {object[]} sources The exported grids bound to a Formulas engine.
   * @param {DroppedFeatures} dropped The export's dropped-feature collector.
   * @returns {Map<object, object>} Per engine, `written`: each name added with that engine's own
   *   definition, mapped to the file's name, and `uses`: for each of its names, the workbook names
   *   of that engine its definition reads (`namesUsedIn`; HyperFormula reads no other scope there),
   *   all as `definedNameKey` keys.
   */
  #addDefinedNames(
    workbook: WorkbookSnapshot, sources: NamedExpressionSource[], dropped: DroppedFeatures
  ): Map<object, EngineDefinedNames> {
    const byEngine = new Map<object, {
      source: NamedExpressionSource | null;
      sheets: Map<string, ExportedEngineSheet>;
      providers: Map<string, ExportDataProvider>;
    }>();

    sources.forEach((source) => {
      const group = byEngine.get(source.engine) ?? { source: null, sheets: new Map(), providers: new Map() };
      const key = source.engineSheetName.toLowerCase();

      if (!group.sheets.has(key)) {
        group.sheets.set(key, source.sheet);
        group.providers.set(key, source.dataProvider);
      }

      if (group.source === null && source.exportFormulas) {
        group.source = source;
      }

      byEngine.set(source.engine, group);
    });

    const definedNames: DefinedNameSnapshot[] = [];
    const added = new Map<string, string>();
    const writtenByEngine = new Map<object, EngineDefinedNames>();
    const leaveOut = () => {
      if (dropped.count(DROPPED_FEATURES.definedNamesUnsupported) === 0) {
        dropped.record(DROPPED_FEATURES.definedNamesUnsupported);
      }
    };

    byEngine.forEach(({ source, sheets, providers }, engine) => {
      if (source === null) {
        return;
      }

      const written = new Map<string, string>();
      const uses = new Map<string, string[]>();
      const namedExpressions = source.dataProvider.getNamedExpressions();
      const engineKeys = new Set(namedExpressions.map(({ name, scope }) => definedNameKey(scope ?? null, name)));

      writtenByEngine.set(engine, { written, uses });

      if (namedExpressions.length > 0) {
        providers.forEach((dataProvider, key) => {
          const sheet = sheets.get(key) as ExportedEngineSheet;

          // A name is moved by the start of `range` too, unlike a cell formula: the rows and
          // columns outside it are left out, so a name that starts or ends there is refused.
          sheet.excludedRows = dataProvider.getExcludedHiddenRows(true);
          sheet.excludedCols = dataProvider.getExcludedHiddenColumns(true);
        });
      }

      namedExpressions.forEach(({ name, formula: definition, scope = null }) => {
        const scopeSheet = scope === null ? null : sheets.get(scope.toLowerCase());

        if (scopeSheet === undefined) {
          return;
        }

        const engineKey = definedNameKey(scope, name);

        if (definition !== null) {
          const engineScope = splitDefinedNameKey(engineKey).scope;

          // HyperFormula reads a name inside a definition from the workbook scope only, even in a
          // sheet-scoped definition. A word only the definition's own sheet scope holds still counts
          // as a use of the workbook name: that name is not written, so the definition does not
          // resolve (HyperFormula shows `#NAME?`, Excel would read the sheet's own name).
          uses.set(engineKey, [...namesUsedIn(definition)]
            .map(word => resolveDefinedName(engineKeys, '', word)
              ?? (engineKeys.has(definedNameKey(engineScope, word)) ? definedNameKey(null, word) : null))
            .filter((used): used is string => used !== null));
        }

        const formula = definition === null ? null : normalizeNamedExpression(
          definition, source.separator, sheets, source.decimalSeparator
        );
        const sheetName = scopeSheet === null ? null : scopeSheet.exportedName;
        const fileKey = definedNameKey(sheetName, name);

        if (formula === null || (added.has(fileKey) && added.get(fileKey) !== formula)) {
          leaveOut();

          return;
        }

        if (!added.has(fileKey)) {
          added.set(fileKey, formula);
          definedNames.push({ name, formula, sheetName });
        }

        written.set(engineKey, fileKey);
      });
    });

    if (definedNames.length > 0) {
      workbook.definedNames = definedNames;
    }

    return writtenByEngine;
  }

  /**
   * Settles which engine names the file resolves, leaves the others out of it, and writes every
   * formula cell over such a name with its engine's value, recording `formula:definedName` once.
   *
   * A name of an engine resolves in the file when `#addDefinedNames` added it with that engine's
   * definition, the writer keeps it (`XlsxEngineAdapter#selectDefinedNames`: not an invalid name,
   * not a shape the ExcelJS writer cannot hold), and every name of that engine its definition uses
   * resolves too, followed through any chain of names, as the import does. A name another engine's
   * spelling took the place of, or one over such a name, does not resolve for this engine: kept as
   * a formula, it read the other engine's definition, or showed `#NAME?` in Excel. A name inside a
   * definition is the workbook's in HyperFormula, so a sheet-scoped definition resolves only when the
   * file reads its names as the workbook's too: not when the file holds a name of the same spelling
   * in that sheet's scope, which Excel reads first.
   *
   * A name in the file that resolves for no engine (it uses a name the file does not hold) is taken
   * out of `workbook.definedNames`, and `definedNames:unsupported` is recorded once.
   *
   * @param {object} workbook The neutral workbook snapshot, its names added.
   * @param {object} adapter The adapter that writes the file.
   * @param {Map<object, object>} namesByEngine Per engine, what `#addDefinedNames` returned for it.
   * @param {object[]} nameUses The formula cells over engine names.
   * @param {DroppedFeatures} dropped The export's dropped-feature collector.
   */
  #unlinkLeftOutNames(
    workbook: WorkbookSnapshot,
    adapter: XlsxEngineAdapter,
    namesByEngine: Map<object, EngineDefinedNames>,
    nameUses: DefinedNameUse[],
    dropped: DroppedFeatures,
  ): void {
    const definedNames = workbook.definedNames ?? [];

    if (definedNames.length === 0 && nameUses.length === 0) {
      return;
    }

    const inFile = new Set(adapter.selectDefinedNames(workbook)
      .map(({ name, sheetName }) => definedNameKey(sheetName, name)));
    // The file's name a formula on the sheet `fileScope` reads for an engine name, the way Excel
    // reads it: the sheet's own name first, then the workbook's.
    const readInFile = (fileScope: string, engineKey: string) => {
      const scoped = `${fileScope}\u0000${splitDefinedNameKey(engineKey).name}`;

      return fileScope !== '' && inFile.has(scoped) ? scoped : `\u0000${splitDefinedNameKey(engineKey).name}`;
    };
    const resolvedByEngine = new Map<object, Set<string>>();

    namesByEngine.forEach(({ written, uses }, engine) => {
      const resolved = new Set([...written].filter(([, fileKey]) => inFile.has(fileKey)).map(([key]) => key));
      // A name over a name that does not resolve, or that the file reads as another definition,
      // does not resolve either. Every name leaves `resolved` at most once.
      const dependents = new Map<string, string[]>();
      const unresolved: string[] = [];

      resolved.forEach((name) => {
        const fileScope = splitDefinedNameKey(written.get(name) as string).scope;

        (uses.get(name) ?? []).forEach((used) => {
          if (resolved.has(used) && written.get(used) === readInFile(fileScope, used)) {
            const users = dependents.get(used);

            if (users) {
              users.push(name);
            } else {
              dependents.set(used, [name]);
            }
          } else {
            unresolved.push(name);
          }
        });
      });

      while (unresolved.length > 0) {
        const name = unresolved.pop() as string;

        if (resolved.delete(name)) {
          unresolved.push(...(dependents.get(name) ?? []));
        }
      }

      resolvedByEngine.set(engine, resolved);
    });

    const resolvedInFile = new Set<string>();

    resolvedByEngine.forEach((resolved, engine) => {
      const { written } = namesByEngine.get(engine) as EngineDefinedNames;

      resolved.forEach(name => resolvedInFile.add(written.get(name) as string));
    });

    const kept = definedNames.filter(({ name, sheetName }) => resolvedInFile.has(definedNameKey(sheetName, name)));

    if (kept.length < definedNames.length) {
      workbook.definedNames = kept.length > 0 ? kept : undefined;

      if (dropped.count(DROPPED_FEATURES.definedNamesUnsupported) === 0) {
        dropped.record(DROPPED_FEATURES.definedNamesUnsupported);
      }
    }

    nameUses.forEach(({ cell, engine, names, fileScope, fallback }) => {
      const resolved = resolvedByEngine.get(engine);
      const written = namesByEngine.get(engine)?.written;

      if (names.every(name => resolved?.has(name) === true && written?.get(name) === readInFile(fileScope, name))) {
        return;
      }

      cell.formula = null;
      cell.value = fallback.value;
      cell.numFmt = fallback.numFmt;

      if (fallback.valueIsError) {
        cell.valueIsError = true;
      }

      if (dropped.count(DROPPED_FEATURES.formulaDefinedName) === 0) {
        dropped.record(DROPPED_FEATURES.formulaDefinedName);
      }
    });
  }

  /**
   * Iterates the exported data rows and writes each to the sheet.
   *
   * Handles row heights, row-header cells, and per-cell content and styling.
   * Delegates per-cell writing to {@link Xlsx##writeRowCells}.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array[]} data 2D data array from ExportDataProvider.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeDataRows(sheet: SheetBuilder, data: unknown[][], context: SheetContext): void {
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const rowData = data[rowIndex];
      const excelRowNumber = rowIndex + context.dataRowOffset;

      if (isDefined(context.rowsHeights[rowIndex])) {
        sheet.setRowHeight(excelRowNumber, context.rowsHeights[rowIndex] * PIXELS_TO_POINTS_RATIO);
      }

      if (context.hasRowHeaders) {
        const rowHeaderCell = sheet.cell(excelRowNumber, 1);

        rowHeaderCell.value = context.rowHeaders[rowIndex] ?? null;
        this.#applyHeaderStyle(rowHeaderCell, null, context.headerFill, context.headerBorder);
      }

      this.#writeRowCells(sheet, excelRowNumber, rowData, rowIndex, context);
    }
  }

  /**
   * Writes all data cells in a single row to the sheet, at the 1-based Excel row number the
   * caller resolved for it.
   *
   * Resolves each cell's value and number format, then applies styling via
   * {@link Xlsx##writeCellStyling}.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} rowData Cell values for this row.
   * @param {number} rowIndex 0-based data-array row index.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeRowCells(
    sheet: SheetBuilder, excelRowNumber: number, rowData: unknown[], rowIndex: number, context: SheetContext
  ): void {
    for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
      const cellValue = rowData[colIndex];
      const cell = sheet.cell(excelRowNumber, colIndex + context.dataColOffset);
      const meta = context.cellsMeta[rowIndex][colIndex];
      const summary = context.summaryMap.get(`${rowIndex}:${colIndex}`);
      const sourceValue = context.sourceData?.[rowIndex][colIndex];
      const engineFacts = context.engineCellFacts?.[rowIndex][colIndex] ?? null;
      const facts: FormulaCellFacts = {
        errorCode: engineFacts?.errorCode ?? null,
        arraySize: engineFacts?.arraySize ?? null,
        computedValue: engineFacts?.computedValue ?? null,
        row: excelRowNumber,
        col: colIndex + context.dataColOffset,
      };
      const { value, formula, numFmt, valueIsError } = this.#resolveCellValue(
        cellValue, meta, sourceValue, facts, summary, context
      );

      cell.value = value;
      cell.formula = formula;
      this.#needIf(numFmt !== null, 'xlsx:number_formats');
      cell.numFmt = this.#entitlement.numberFormats ? numFmt : null;

      if (valueIsError) {
        cell.valueIsError = true;
      }

      if (formula !== null && summary === undefined && context.engineNames !== null && context.engine !== null) {
        this.#noteDefinedNameUse(cell, formula.text, { cellValue, meta, sourceValue, facts }, context);
      }

      // The computed CSS feeds the cell style only, so without `xlsx:styles` it is never read.
      const cssStyle = this.#entitlement.styles
        ? getCssStyleFromElement(
          context.cellElements[rowIndex][colIndex], meta.className, context.rootDocument, context.rootWindow
        )
        : null;

      this.#writeCellStyling(cell, meta, cssStyle, context);

      if (context.hasReadOnlyCells) {
        cell.locked = meta.readOnly === true;
      }
    }
  }

  /**
   * Records a formula cell that uses names of its engine in `context.nameUses`, with the value the
   * cell is written with when one of them does not reach the file: what the export writes without
   * `exportFormulas`.
   *
   * @param {object} cell The model cell, written with its formula.
   * @param {string} text The formula as written, without the leading `=`.
   * @param {object} source The cell's export inputs, as `#resolveCellValue` takes them.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #noteDefinedNameUse(
    cell: CellSnapshot,
    text: string,
    source: { cellValue: unknown; meta: CellMeta; sourceValue: unknown; facts: FormulaCellFacts },
    context: SheetContext,
  ): void {
    const engineNames = context.engineNames as Set<string>;
    const names = [...namesUsedIn(text)]
      .map(word => resolveDefinedName(engineNames, context.engineScope, word))
      .filter((name): name is string => name !== null);

    if (names.length === 0) {
      return;
    }

    const { value, numFmt, valueIsError } = this.#resolveCellValue(
      source.cellValue, source.meta, source.sourceValue, source.facts, undefined, { ...context, exportFormulas: false }
    );
    // A number the engine computed in a column the Formulas plugin does not convert (`intl-date`,
    // `intl-time`, `intl-datetime`) keeps the format the live formula would have had. Without
    // `xlsx:number_formats` it carries none, like every other cell.
    const fallbackNumFmt = this.#entitlement.numberFormats
      ? numFmt ?? (typeof value === 'number' && !valueIsError ? resolveMetaNumFmt(source.meta) : null)
      : null;

    context.nameUses.push({
      cell,
      engine: context.engine as object,
      names,
      fileScope: context.fileScope,
      fallback: { value, numFmt: fallbackNumFmt, valueIsError },
    });
  }

  /**
   * Applies all visual style properties from cell meta and computed CSS to a model cell.
   *
   * Handles alignment, borders, font, fill, dropdown validation, and cell comments.
   * Protection is handled by the caller because it depends on a sheet-level flag.
   *
   * @param {object} cell The model cell snapshot.
   * @param {object|undefined} meta Cell meta object.
   * @param {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
   *           fontColor: string|null, backgroundColor: string|null }|null} cssStyle
   *   Computed CSS style from `getCssStyleFromElement`, or `null`.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeCellStyling(
    cell: CellSnapshot, meta: CellMeta, cssStyle: CssStyle | null, context: SheetContext
  ): void {
    if (this.#entitlement.styles) {
      const alignment = getAlignmentFromMeta(meta);
      const border = getBorderFromMeta(meta);
      const font = getFontFromMeta(meta, cssStyle);
      const fill = getFillFromMeta(meta, cssStyle);

      if (alignment || border || font || fill) {
        cell.style = { alignment, border, font, fill };
      }
    } else if (!this.#needed.has('xlsx:styles')) {
      // Without the token the computed CSS is never read, so what the meta describes counts, and so
      // does any class other than an alignment one: a stylesheet may give it a font or a fill.
      this.#needIf(Boolean(
        getAlignmentFromMeta(meta) || getBorderFromMeta(meta) || getFontFromMeta(meta) || getFillFromMeta(meta)
        || normalizeClassNames(meta.className).some(name => !ALIGNMENT_CLASS_NAMES.has(name))
      ), 'xlsx:styles');
    }

    // The same test `getDropdownValidation` and `#buildValidationSheet` make: a function `source` and
    // an empty list write no validation.
    this.#needIf(
      (meta.type === 'dropdown' || meta.type === 'autocomplete')
        && Array.isArray(meta.source) && meta.source.length > 0,
      'xlsx:data_validation'
    );
    this.#needIf(Boolean(meta.comment?.value), 'xlsx:comments');

    const rangeRef = Array.isArray(meta.source)
      ? (context.validationMap.get(context.sourceLabels(meta.source, meta.sourceLabel).key) ?? null)
      : null;
    const dropdownValidation = getDropdownValidation(meta, rangeRef);

    if (dropdownValidation && this.#entitlement.dataValidation) {
      cell.validation = dropdownValidation;
    }

    if (meta.comment?.value && this.#entitlement.comments) {
      cell.comment = String(meta.comment.value);
    }
  }

  /**
   * Resolves the final model cell value, formula and optional number format for a data cell.
   *
   * Handles (in priority order):
   * 1. ColumnSummary formula destinations (when `exportFormulas` is `true`).
   * 2. HyperFormula formula cells (when `exportFormulas` is `true`) — written with the number
   *    format their column's meta describes and with the pre-calculated value cached as the
   *    formula's `result`. Without `xlsx:number_formats`, a date, time or date-time formula cell is
   *    written as the text the grid renders instead, with no formula.
   * 3. Cells whose engine value is an error with an OOXML code (any cell, a formula exported as
   *    its value included) — written as that code, flagged so both writers type it `t="e"`.
   * 4. Date, time and date-time cells (ISO 8601 string → serial number with its number format, or,
   *    without `xlsx:number_formats`, the text the grid renders).
   * 5. Checkbox cells (boolean from `checkedTemplate` comparison; an empty value stays empty).
   * 6. Multiselect cells (comma-separated string).
   * 7. Cells whose value the Formulas engine computed as a number or a boolean
   *    (`EngineCellFacts.computedValue`, `ExportDataProvider#getEngineCellFacts`) — written with that type.
   * 8. All other cells (numeric-aware or stringified).
   *
   * @param {*} cellValue Pre-calculated display value from `getData()`.
   * @param {object} meta Cell meta object.
   * @param {*} sourceValue Raw source value from `getSourceDataAtCell()` (may be a formula string).
   * @param {object} facts What the Formulas engine and the sheet layout tell about the cell: the
   *   OOXML error code of its value (`null` when it is not an error), the size of the array it
   *   spills (both from `ExportDataProvider#getEngineCellFacts`) and its 1-based sheet address.
   * @param {object|undefined} summary ColumnSummary descriptor, or `undefined` for non-summary cells.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   * @returns {{ value: *, formula: object|null, numFmt: string|null, valueIsError?: boolean }}
   */
  #resolveCellValue(
    cellValue: unknown,
    meta: CellMeta,
    sourceValue: unknown,
    facts: FormulaCellFacts,
    summary: ColumnSummaryDescriptor | undefined,
    context: SheetContext
  ): { value: CellValue; formula: CellFormula | null; numFmt: string | null; valueIsError?: true } {
    const {
      exportFormulas, formulasSeparator, formulasDecimalSeparator, dataRowOffset, dataColOffset,
      excludedHiddenRows, excludedHiddenCols,
    } = context;

    if (summary && exportFormulas) {
      const formula = buildSummaryFormula(summary, dataRowOffset, dataColOffset);
      const fallback = this.#getCellValue(cellValue, meta);

      return formula
        ? { value: null, formula: { text: formula.formula, result: toPrimitiveResult(cellValue) }, numFmt: null }
        : { value: fallback, formula: null, numFmt: null };
    }

    if (exportFormulas && isFormulaValue(sourceValue)) {
      if (!this.#entitlement.numberFormats && TEMPORAL_CELL_TYPES.has(meta.type as string)) {
        // A temporal formula opens as a bare serial without its number format (`=C2+30` as `45336`),
        // so without `xlsx:number_formats` it goes out as the text the grid shows, like a literal date.
        this.#needIf(resolveMetaNumFmt(meta) !== null, 'xlsx:number_formats');

        return { value: toDisplayText(cellValue, meta), formula: null, numFmt: null };
      }

      const { text, array } = resolveArrayFormula(normalizeFormula(
        sourceValue, formulasSeparator, dataRowOffset - 1, dataColOffset - 1,
        excludedHiddenRows ?? undefined, excludedHiddenCols ?? undefined, formulasDecimalSeparator
      ), facts, context);
      const { errorCode } = facts;
      // An error result is cached as its OOXML code, which the engine's language does not
      // translate, and flagged so both writers type it `t="e"`.
      const formula: CellFormula = errorCode === null
        ? { text, result: toPrimitiveResult(cellValue) }
        : { text, result: errorCode, resultIsError: true };

      if (array) {
        formula.array = array;
      }

      return { value: null, formula, numFmt: resolveMetaNumFmt(meta) };
    }

    if (facts.errorCode !== null) {
      // The code, not the displayed text: the engine's language translates the text, and a typed
      // `#N/A` reads the same as the text a formula such as `="#N/A"` answers.
      return { value: facts.errorCode, formula: null, numFmt: null, valueIsError: true };
    }

    const temporalSerial = parseTemporalSerial(cellValue, meta);

    if (temporalSerial !== null) {
      // A serial means nothing without its number format: without `xlsx:number_formats` the cell
      // goes out as the text the grid renders, so `2024-01-15` does not open as `45306`.
      const numFmt = resolveMetaNumFmt(meta);

      if (this.#entitlement.numberFormats) {
        return { value: temporalSerial, formula: null, numFmt };
      }

      this.#needIf(numFmt !== null, 'xlsx:number_formats');

      return { value: toDisplayText(cellValue, meta), formula: null, numFmt: null };
    }

    if (meta.type === 'checkbox') {
      return { value: this.#getCheckboxValue(cellValue, meta), formula: null, numFmt: null };
    }

    if (meta.type === 'multiselect') {
      return { value: this.#getMultiSelectExportValue(cellValue), formula: null, numFmt: null };
    }

    if (meta.type === 'numeric') {
      return { value: this.#getCellValue(cellValue, meta), formula: null, numFmt: resolveMetaNumFmt(meta) };
    }

    if (facts.computedValue !== null) {
      // A number or boolean the Formulas engine computed (a formula exported as its value, or a cell
      // an array spills) keeps its type: stringified, `=SUM()` over it reads 0 in a reader that does
      // not recalculate. A value the user typed into the column is data, and is not in the matrix.
      return { value: facts.computedValue, formula: null, numFmt: null };
    }

    return { value: this.#getCellValue(cellValue, meta), formula: null, numFmt: null };
  }

  /**
   * Converts a raw cell value to a neutral model `CellValue`.
   *
   * @param {*} value Raw cell value.
   * @param {object} meta Cell meta object.
   * @returns {null|number|string}
   */
  #getCellValue(value: unknown, meta: CellMeta): null | number | string {
    if (value === null || value === undefined) {
      return null;
    }

    if (meta.type === 'numeric') {
      // `NaN`, `Infinity` and `-Infinity` are all `typeof 'number'`, and none of them is a legal
      // `<v>` content: Excel refuses to open a file that carries one. They fall back to the same
      // text the not-a-number branch below produces, so the cell is written as a string cell.
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : stringify(value);
      }

      // The editor stores `''` for a numeric cell the user cleared, and `Number('')` is `0`, so the
      // grid showed an empty cell while the spreadsheet showed 0 (and `AVERAGE` and `COUNT` counted
      // it). A cleared cell exports as an empty one, the way a `null` one does.
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }

      const numericValue = Number(value);

      return Number.isFinite(numericValue) ? numericValue : stringify(value);
    }

    return stringify(value);
  }

  /**
   * Returns the boolean export value for a checkbox cell.
   *
   * A value matching `checkedTemplate` exports as `true` and one matching `uncheckedTemplate` as
   * `false`, matched the way the checkbox renderer matches them (`matchCheckboxTemplate`, so a case
   * variant such as `'TRUE'` counts). An empty value (`null`, `undefined` or `''`) that matches
   * neither template exports as an empty cell, the same as the checkbox renderer's "no value" state,
   * so a round trip does not turn it into an unchecked box. Any other value keeps exporting as
   * `false`. With `uncheckedTemplate: ''`, `null` reads the same as the template, so the renderer draws
   * it unchecked and the export writes `false`.
   *
   * @param {*} value Raw cell value.
   * @param {object} meta Cell meta object.
   * @returns {boolean|null}
   */
  #getCheckboxValue(value: unknown, meta: CellMeta): boolean | null {
    // The renderer's match (DEV-355): a loaded `'TRUE'` exports as checked, like it renders.
    const state = matchCheckboxTemplate(value, meta);

    if (state === 'checked') {
      return true;
    }

    if (state !== 'unchecked' && isEmpty(value)) {
      return null;
    }

    return false;
  }

  /**
   * Converts a multiselect cell value to a comma-separated display string.
   *
   * @param {*} value Raw multiselect cell value (expected to be an array).
   * @returns {string|null}
   */
  #getMultiSelectExportValue(value: unknown): string | null {
    if (!Array.isArray(value)) {
      return value === null || value === undefined ? null : stringify(value);
    }

    if (value.length === 0) {
      return null;
    }

    return value
      .map(item => (item !== null && typeof item === 'object'
        ? String((item as { value: unknown }).value)
        : String(item)))
      .join(', ');
  }

  /**
   * Builds a solid fill object from a `headerStyle` option value.
   *
   * Returns `null` when `headerStyle` is `null` / has no `backgroundColor`, so
   * callers can skip applying a fill entirely (no default engine fill sentinel is set).
   *
   * @param {object|null|undefined} headerStyle The `headerStyle` option value.
   * @returns {object|null}
   */
  #buildHeaderFill(
    headerStyle: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null | undefined
  ): HeaderFill | null {
    if (!headerStyle?.backgroundColor) {
      return null;
    }

    return {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: cssColorToArgb(headerStyle.backgroundColor) },
    };
  }

  /**
   * Builds a border object (all four sides) from a `headerStyle` option value.
   *
   * Returns `null` when `headerStyle` is `null` or has no `border` sub-option.
   *
   * @param {object|null|undefined} headerStyle The `headerStyle` option value.
   * @returns {object|null}
   */
  #buildHeaderBorder(
    headerStyle: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null | undefined
  ): HeaderBorder | null {
    if (!headerStyle?.border) {
      return null;
    }

    const { style = 'thin', color } = headerStyle.border;
    const side = color ? { style, color: { argb: cssColorToArgb(color) } } : { style };

    return { top: side, bottom: side, left: side, right: side };
  }

  /**
   * Applies the header fill, border and optional alignment to a header cell. Every header cell
   * (column, nested, row header, corner) goes through here, so the alignment is gated on
   * `xlsx:styles` in this one place; the fill and border already arrive `null` without the token.
   */
  #applyHeaderStyle(
    cell: CellSnapshot, alignment: CellStyleSnapshot['alignment'],
    fill: HeaderFill | null, border: HeaderBorder | null
  ): void {
    const headerAlignment = this.#entitlement.styles ? alignment : null;

    if (!headerAlignment && !fill && !border) {
      return;
    }

    cell.style = { alignment: headerAlignment ?? null, font: null, fill, border };
  }

  /**
   * Maps the `compression` option to the neutral level: `false` = stored, a number 1–9 = that
   * DEFLATE level, anything else (`true`, `null`, `undefined`) = DEFLATE level 6. Only an explicit
   * `false` turns compression off: the default has been DEFLATE since the option existed, and an
   * unset option must keep producing the same file size.
   *
   * The fallback level comes from `utils/xlsxEngine/compression.ts`, which the built-in engine
   * imports too: it tells a chosen level from an unset one by that same constant when deciding
   * whether to report `compressionLevel` as dropped.
   */
  #getCompressionLevel(): false | number {
    const { compression } = this.options;

    if (compression === false) {
      return false;
    }

    if (typeof compression === 'number' && compression >= 1 && compression <= 9) {
      return compression;
    }

    return DEFAULT_COMPRESSION_LEVEL;
  }

  /**
   * Applies conditional formatting rules to the sheet.
   *
   * Each descriptor in `cfRules` may specify a `rows` and/or `cols` range
   * (0-based, relative to the exported data — the same coordinate space as
   * `getDataAtCell`). Both are optional and default to the full data range.
   * The `rules` array is carried through to the engine unchanged.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} cfRules Array of `{ rows?, cols?, rules }` descriptors.
   * @param {number} dataRowOffset 1-based Excel row where data starts.
   * @param {number} dataColOffset 1-based Excel column where data starts.
   * @param {number} dataRows Total number of exported data rows.
   * @param {number} dataCols Total number of exported data columns.
   */
  #applyConditionalFormatting(
    sheet: SheetBuilder, cfRules: ConditionalFormattingDescriptor[],
    dataRowOffset: number, dataColOffset: number, dataRows: number, dataCols: number
  ): void {
    if (dataRows === 0 || dataCols === 0) {
      return;
    }

    cfRules.forEach(({ rows, cols, rules }) => {
      if (!rules || rules.length === 0) {
        return;
      }

      const startRow = (rows ? rows[0] : 0) + dataRowOffset;
      const endRow = (rows ? rows[1] : dataRows - 1) + dataRowOffset;
      const startCol = (cols ? cols[0] : 0) + dataColOffset;
      const endCol = (cols ? cols[1] : dataCols - 1) + dataColOffset;

      sheet.addConditionalFormatting(toRangeRef(startRow, startCol, endRow, endCol), rules);
    });
  }

  /**
   * Sets column widths on the sheet, converting pixel values to Excel
   * character-width units.
   *
   * @param {object} sheet The sheet builder.
   * @param {number[]} widths Column widths in pixels, in data-column order.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyColumnWidths(sheet: SheetBuilder, widths: number[], hasRowHeaders: boolean): void {
    if (hasRowHeaders) {
      sheet.setColWidth(1, ROW_HEADER_DEFAULT_WIDTH);
    }

    const offset = hasRowHeaders ? 1 : 0;

    for (let index = 0; index < widths.length; index++) {
      sheet.setColWidth(index + 1 + offset, Math.max(widths[index] / PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, 1));
    }
  }

  /**
   * Marks the specified Excel columns as hidden.
   *
   * @param {object} sheet The sheet builder.
   * @param {number[]} hiddenColIndices 0-based data-column indices to hide.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyHiddenColumns(sheet: SheetBuilder, hiddenColIndices: number[], hasRowHeaders: boolean): void {
    const offset = hasRowHeaders ? 1 : 0;

    hiddenColIndices.forEach((dataColIndex) => {
      sheet.hideCol(dataColIndex + 1 + offset);
    });
  }

  /**
   * Merges the ranges the MergeCells plugin describes, shifted by the header offsets.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} mergeCells The merge descriptors, in data coordinates.
   * @param {number} dataRowOffset 1-based Excel row number where data row 0 starts.
   * @param {number} dataColOffset 1-based Excel column number where data column 0 starts.
   */
  #applyMerges(
    sheet: SheetBuilder, mergeCells: MergeDescriptor[], dataRowOffset: number, dataColOffset: number
  ): void {
    mergeCells.forEach((merge) => {
      const startRow = merge.row + dataRowOffset;
      const startCol = merge.col + dataColOffset;

      sheet.merge(startRow, startCol, startRow + merge.rowspan - 1, startCol + merge.colspan - 1);
    });
  }

  /**
   * Marks the specified Excel rows as hidden.
   *
   * @param {object} sheet The sheet builder.
   * @param {number[]} hiddenRowIndices 0-based data-row indices to hide.
   * @param {number} dataRowOffset 1-based Excel row number where data row 0 starts.
   */
  #applyHiddenRows(sheet: SheetBuilder, hiddenRowIndices: number[], dataRowOffset: number): void {
    hiddenRowIndices.forEach((dataRowIndex) => {
      sheet.hideRow(dataRowIndex + dataRowOffset);
    });
  }

  /**
   * Configures the sheet view, combining frozen panes and RTL direction settings.
   *
   * @param {object} sheet The sheet builder.
   * @param {number} frozenRows Number of frozen data rows.
   * @param {number} frozenColumns Number of frozen data columns.
   * @param {number} headerRowCount Number of header rows prepended before data rows.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {boolean} isRtl Whether the table layout direction is right-to-left.
   */
  #applyWorksheetViews(
    sheet: SheetBuilder, frozenRows: number, frozenColumns: number,
    headerRowCount: number, hasRowHeaders: boolean, isRtl: boolean
  ): void {
    sheet.setRtl(isRtl);

    if (frozenRows > 0 || frozenColumns > 0) {
      sheet.freeze(frozenColumns + (hasRowHeaders ? 1 : 0), frozenRows + headerRowCount);
    }
  }

  /**
   * Writes the column-header row to the sheet, applying alignment derived from
   * each header's `className` where configured, and optional background fill and border.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} columnHeaders Header values.
   * @param {string[]} classNames Per-header className strings (same order as `columnHeaders`).
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended (leaves cell A1 empty).
   * @param {number} dataColOffset 1-based column number where data columns begin.
   * @param {object|null} headerFill Fill object for header cells, or `null` for no fill.
   * @param {object|null} headerBorder Border object for header cells, or `null` for no border.
   */
  #writeColumnHeaders(
    sheet: SheetBuilder, columnHeaders: Array<string | number | null>,
    classNames: string[], hasRowHeaders: boolean,
    dataColOffset: number, headerFill: HeaderFill | null, headerBorder: HeaderBorder | null
  ): void {
    if (hasRowHeaders) {
      const cornerCell = sheet.cell(1, 1);

      cornerCell.value = '';
      this.#applyHeaderStyle(cornerCell, null, headerFill, headerBorder);
    }

    for (let index = 0; index < columnHeaders.length; index++) {
      const cell = sheet.cell(1, index + dataColOffset);

      cell.value = columnHeaders[index] ?? null;
      this.#applyHeaderStyle(
        cell, getAlignmentFromClassName(classNames[index]),
        headerFill, headerBorder
      );
    }
  }

  /**
   * Writes multi-row nested column headers to the sheet, applying alignment derived
   * from each header's `className` where configured, and optional background fill and border.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array[]} nestedColumnHeaders Layers returned by ExportDataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   * @param {object|null} headerFill Fill object for header cells, or `null` for no fill.
   * @param {object|null} headerBorder Border object for header cells, or `null` for no border.
   */
  #writeNestedColumnHeaders(
    sheet: SheetBuilder, nestedColumnHeaders: NestedHeaderEntry[][], hasRowHeaders: boolean,
    dataColOffset: number, headerFill: HeaderFill | null, headerBorder: HeaderBorder | null
  ): void {
    for (let layerIndex = 0; layerIndex < nestedColumnHeaders.length; layerIndex++) {
      const layerHeaders = nestedColumnHeaders[layerIndex];
      const rowNumber = layerIndex + 1;

      if (hasRowHeaders && layerIndex === 0) {
        const cornerCell = sheet.cell(rowNumber, 1);

        cornerCell.value = '';
        this.#applyHeaderStyle(cornerCell, null, headerFill, headerBorder);
      }

      let colPos = dataColOffset;

      layerHeaders.forEach((header) => {
        const cell = sheet.cell(rowNumber, colPos);

        cell.value = header.label ?? null;
        this.#applyHeaderStyle(
          cell, getAlignmentFromClassName(header.className),
          headerFill, headerBorder
        );

        colPos += header.colspan;
      });
    }
  }

  /**
   * Merges spanning cells in nested header rows.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array[]} nestedColumnHeaders Layers returned by ExportDataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  #applyNestedHeaderMerges(
    sheet: SheetBuilder, nestedColumnHeaders: NestedHeaderEntry[][], hasRowHeaders: boolean,
    dataColOffset: number
  ): void {
    if (hasRowHeaders && nestedColumnHeaders.length > 1) {
      sheet.merge(1, 1, nestedColumnHeaders.length, 1);
    }

    for (let layerIndex = 0; layerIndex < nestedColumnHeaders.length; layerIndex++) {
      const layerHeaders = nestedColumnHeaders[layerIndex];
      const excelRow = layerIndex + 1;
      let colPos = dataColOffset;

      layerHeaders.forEach((header) => {
        if (header.colspan > 1) {
          sheet.merge(excelRow, colPos, excelRow, colPos + header.colspan - 1);
        }

        colPos += header.colspan;
      });
    }
  }

  /**
   * Creates a `hidden` sheet containing all unique dropdown/autocomplete source arrays found
   * in `cellsMeta`, the 2D cell-meta array of the sheet being exported, one array per column.
   * Returns a map from the JSON of the source's labels to an Excel range-reference string pointing at
   * that column, together with the sheet snapshot the caller pushes into the workbook after the
   * data sheet.
   *
   * The helper sheet's name goes through `#uniqueSheetName` against the same `usedSheetNames` set
   * every data sheet is named from, so a grid exported under the name `_HotValidation` can never
   * end up sharing its name with its own helper sheet — and two helper sheets in a multi-sheet
   * export cannot collide either. The data sheet is already recorded in that set by the time this
   * runs, even though it is pushed into the workbook only afterwards.
   *
   * If no dropdown or autocomplete cells with array sources are found, returns an
   * empty map and a `null` sheet.
   *
   * @private
   */
  #buildValidationSheet(
    usedSheetNames: Set<string>, cellsMeta: CellMeta[][],
    sourceLabels: SourceLabelsResolver,
  ): { validationMap: Map<string, string>; sheet: SheetSnapshot | null } {
    const sourceMap = new Map<string, string[]>();

    for (let rowIndex = 0; rowIndex < cellsMeta.length; rowIndex++) {
      for (let colIndex = 0; colIndex < cellsMeta[rowIndex].length; colIndex++) {
        const meta = cellsMeta[rowIndex][colIndex];
        const isDropdown = meta.type === 'dropdown' || meta.type === 'autocomplete';

        if (isDropdown && Array.isArray(meta.source) && meta.source.length > 0) {
          // Keyed by the labels, not the raw `source`: a `sourceLabel` function cannot be
          // serialized, and two columns listing the same labels need only one Excel range.
          const { labels, key } = sourceLabels(meta.source, meta.sourceLabel);

          if (!sourceMap.has(key)) {
            sourceMap.set(key, labels);
          }
        }
      }
    }

    if (sourceMap.size === 0) {
      return { validationMap: new Map(), sheet: null };
    }

    const sheetName = this.#uniqueSheetName(VALIDATION_SHEET_NAME, usedSheetNames);
    const builder = new SheetBuilder(sheetName);

    // `hidden`, not `veryHidden`: Numbers discards a very hidden sheet when it opens the file and
    // keeps no validation pointing at it, so every dropdown lost its list there. Excel lists a hidden
    // sheet under Unhide, which is the price; the import still skips it by index.
    builder.setState('hidden');

    const validationMap = new Map<string, string>();
    let colNumber = 1;

    sourceMap.forEach((source, key) => {
      for (let rowNumber = 0; rowNumber < source.length; rowNumber++) {
        builder.cell(rowNumber + 1, colNumber).value = source[rowNumber];
      }

      const colLetter = colIndexToLetter(colNumber);
      const escapedName = sheetName.replaceAll('\'', '\'\'');
      const rangeRef = `'${escapedName}'!$${colLetter}$1:$${colLetter}$${source.length}`;

      validationMap.set(key, rangeRef);
      colNumber += 1;
    });

    return { validationMap, sheet: builder.toSnapshot() };
  }
}

export default Xlsx;
