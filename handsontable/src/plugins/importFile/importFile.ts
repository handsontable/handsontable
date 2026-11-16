import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { isObject } from '../../helpers/object';
import { IMPORT_FILE_CAPABILITY_IDS } from '../../utils/xlsxEngine/licenseCapabilities';
import { getLicenseState, getXlsxEntitlement } from '../../core/license';
import {
  formatMissingCapabilitiesWarning,
  scopeXlsxEntitlement,
} from '../../utils/xlsxEngine/xlsxEntitlement';
import { warn } from '../../helpers/console';
import {
  detectXlsxEngine, resolveEngineOverride, tryDetectXlsxEngine, type DetectedXlsxEngine,
} from '../../utils/xlsxEngine/detect';
import {
  DROPPED_FEATURES,
  DroppedFeatures,
  ENGINE_DISPLAY_NAMES,
  type XlsxEngineKind,
} from '../../utils/xlsxEngine/capabilities';
import {
  mapWorkbook, resolveImportOptions, type MapperContext, type MappedResult, type ResolvedImportOptions,
} from './mapper';
import {
  applyImportResult, installImportedStyles, removeImportedStyles, toNamedExpressionInput,
} from './applier';
import { hasCellType } from '../../cellTypes/registry';
import {
  convertToInferredTypes,
  inferColumnTypes,
  type ConvertedData,
  type InferColumnTypesOptions,
  type InferColumnTypesResult,
  type InferenceData,
} from '../../utils/columnTypeInference';
import type { ImportedBorder } from './styles';
import type { HotInstance } from '../../core/types';
import { LICENSE } from './feature.generated';
import { assertLicensedCall } from '../../utils/licenseNotification';
import { hasLicenseCapability } from '../../utils/licenseCapabilities';

export const PLUGIN_KEY = 'importFile';
export const PLUGIN_PRIORITY = 245;

/**
 * The source the DataProvider plugin passes to `loadData()` for a fetch.
 */
const DATA_PROVIDER_LOAD_SOURCE = 'dataProvider';

/**
 * Plugin-level settings for the `importFile` option in {@link GridSettings}.
 */
export interface ImportFileSettings {
  /**
   * Optional map of import engines keyed by format name (e.g. `{ xlsx: ExcelJS }`). Without it, or
   * with a map whose entry for the format is absent or `null`, the built-in engine reads `.xlsx`.
   * An entry that holds any other value must be a supported engine module.
   */
  engines?: Record<string, object | null | undefined>;
}

/**
 * Options accepted by {@link ImportFile#importFromArrayBuffer} and {@link ImportFile#importFromBlob}.
 */
export interface ImportOptions {
  /**
   * Sheet to import, by exact name or by 0-based index. The index counts the sheets that are not
   * very hidden and skips the `_HotValidation` sheet an export writes for its dropdown lists.
   * Defaults to `0`.
   */
  sheet?: string | number;
  /**
   * `'firstRow'` promotes the first row of the imported range (the sheet's first row without
   * `range`) to column headers. `true` behaves like `false`. Defaults to `false`.
   */
  colHeaders?: boolean | 'firstRow';
  /**
   * `true` drops the first sheet column and enables generated row headers. Defaults to `false`.
   */
  rowHeaders?: boolean;
  /**
   * How many rows the header band spans when `colHeaders` is `'firstRow'`. `1` promotes the first
   * row to `colHeaders`; a value above `1` promotes that many rows to `nestedHeaders` instead and
   * starts the data after them. Has to be an integer of at least `1`, and is validated on every
   * call; it is used only when `colHeaders` is `'firstRow'`. Defaults to `1`.
   */
  headerRows?: number;
  /**
   * Cell range to import in 0-based sheet coordinates: `[startRow, startColumn, endRow, endColumn]`.
   */
  range?: number[];
  /**
   * Derive `numeric`, `date`, `intl-datetime`, `time`, `checkbox` and `dropdown` cell types from
   * number formats, cell values and list validations. `false` turns dropdowns off too, and dates and
   * times then import as raw serials. Defaults to `true`.
   */
  inferCellTypes?: boolean;
  /**
   * Put formula strings into the data when the `formulas` plugin is enabled. Defaults to `true`.
   */
  importFormulas?: boolean;
  /**
   * Import merges, hidden rows and columns, frozen panes, column widths and row heights. Each of these, and
   * `customBorders`, that the grid has and the result does not carry is reset. Borders come from
   * `importStyles`, so with `importStyles` off an import clears the grid's custom borders. Defaults to `true`.
   */
  importLayout?: boolean;
  /**
   * Apply the result to the grid. `false` returns the result without touching the grid. Defaults to `true`.
   */
  apply?: boolean;
  /**
   * An xlsx engine module for this import only. `null`/absent uses the plugin's `engines` entry, or
   * the built-in engine.
   */
  engine?: object | null;
  /**
   * Apply alignment, font, fill and borders from the workbook as generated class names (on
   * `result.columns[].className` when every cell of a column shares them, otherwise on
   * `result.cellsMeta[].meta.className`), style rules (`result.styles`) and `customBorders`
   * entries (`result.customBorders`). Defaults to `false`.
   */
  importStyles?: boolean;
}

/**
 * One entry of a `nestedHeaders` layer: a plain label, or a label that groups several columns.
 */
export type ImportedNestedHeader = string | { label: string; colspan: number };

/**
 * A column definition derived from the imported cells.
 */
export interface ImportColumn {
  /**
   * The cell type derived for the column, e.g. `'numeric'`, `'date'`, `'intl-datetime'`, `'time'`,
   * `'checkbox'` or `'dropdown'`.
   */
  type?: string;
  /**
   * The `Intl.NumberFormat` options derived for the column, when the source cells carried a number
   * format that inverts into them.
   */
  numericFormat?: Intl.NumberFormatOptions;
  /**
   * The `Intl.DateTimeFormatOptions` derived for the column, when the source cells carried a date
   * number format. Handsontable takes `dateFormat` as `Intl.DateTimeFormatOptions` and rejects a
   * pattern string, so the Excel pattern is inverted into options rather than copied.
   */
  dateFormat?: Intl.DateTimeFormatOptions;
  /**
   * The `Intl.DateTimeFormatOptions` derived for the column, when the source cells carried a time
   * number format.
   */
  timeFormat?: Intl.DateTimeFormatOptions;
  /**
   * The `Intl.DateTimeFormatOptions` derived for an `intl-datetime` column, when the source cells
   * carried a date-time number format. The values are ISO `YYYY-MM-DD HH:mm:ss` strings.
   */
  dateTimeFormat?: Intl.DateTimeFormatOptions;
  /**
   * The dropdown source values, derived from a list data validation on the column.
   */
  source?: string[];
  /**
   * Set when more than half the rows of the column are locked under sheet protection. The unlocked
   * rows of such a column carry `readOnly: false` in `cellsMeta`. A column locked on half its rows
   * or fewer carries `readOnly: true` per locked cell in `cellsMeta` instead.
   */
  readOnly?: boolean;
  /**
   * The class names every cell of the column wears (alignment classes and the generated
   * `htImported-<hash>` classes) when `importStyles` is on and the whole column agrees.
   */
  className?: string;
}

/**
 * One conditional formatting range read from the workbook, in grid coordinates: 0-based and
 * inclusive on both ends. It is the shape `exportFile`'s `conditionalFormatting` option takes, so a
 * result can be handed straight back to an export.
 */
export interface ImportedConditionalFormatting {
  /**
   * The first and last grid row the rules cover.
   */
  rows: [number, number];
  /**
   * The first and last grid column the rules cover.
   */
  cols: [number, number];
  /**
   * The engine's own conditional formatting rule objects, passed through untouched.
   *
   * When one workbook `ref` covers several ranges, every descriptor produced from it shares this
   * same array instance. Mutating one descriptor's `rules` mutates every sibling descriptor's too.
   */
  rules: unknown[];
}

/**
 * What an import produced. Every optional key is present only when the workbook said something
 * about it, so applying the result never overrides a setting the file does not carry.
 */
export interface ImportResult {
  /**
   * The imported cell values, as rows of columns.
   */
  data: unknown[][];
  /**
   * Column headers, present only when `colHeaders: 'firstRow'` promoted the sheet's first row.
   */
  colHeaders?: string[];
  /**
   * Nested column headers, present only when `colHeaders: 'firstRow'` and `headerRows` above `1`
   * promoted several sheet rows. It is the `nestedHeaders` setting's own shape, so passing it to
   * `updateSettings` both configures and enables the `NestedHeaders` plugin. `colHeaders` is absent
   * whenever this is present - the two describe the same band.
   */
  nestedHeaders?: ImportedNestedHeader[][];
  /**
   * `true` when the `rowHeaders` import option dropped the sheet's first column. The column's
   * values are discarded; the grid generates its own row headers.
   */
  rowHeaders?: boolean;
  /**
   * Per-column definitions derived from the imported cells.
   */
  columns?: ImportColumn[];
  /**
   * Per-cell metadata that could not be folded into `columns`.
   */
  cellsMeta?: Array<{ row: number; col: number; meta: Record<string, unknown> }>;
  /**
   * Merged cell ranges read from the workbook.
   */
  mergeCells?: Array<{ row: number; col: number; rowspan: number; colspan: number }>;
  /**
   * Hidden row indexes read from the workbook.
   */
  hiddenRows?: number[];
  /**
   * Hidden column indexes read from the workbook.
   */
  hiddenColumns?: number[];
  /**
   * The number of frozen rows at the top of the sheet.
   */
  fixedRowsTop?: number;
  /**
   * The number of frozen columns at the start of the sheet.
   */
  fixedColumnsStart?: number;
  /**
   * Column widths read from the workbook, in pixels. An entry is `undefined` when the sheet says
   * nothing about that column, so the grid keeps its own width there.
   */
  colWidths?: Array<number | undefined>;
  /**
   * Row heights read from the workbook, in pixels. An entry is `undefined` when the sheet says
   * nothing about that row, so the grid keeps its own height there. The plugin applies them as
   * `minRowHeights`: a workbook stores the height its application measured on every row, and a row
   * shorter than the grid's default row height keeps the default.
   */
  rowHeights?: Array<number | undefined>;
  /**
   * The sheet's layout direction. Present only when `importLayout` is on. It is never applied:
   * Handsontable resolves `layoutDirection` at construction, so a grid that has to follow a
   * right-to-left workbook must be constructed with `layoutDirection: 'rtl'`.
   */
  layoutDirection?: 'rtl' | 'ltr';
  /**
   * Formulas that were not imported live, because the Formulas plugin is off, `importFormulas` is
   * `false`, the formula cannot resolve in the grid, or it is an array formula HyperFormula cannot
   * evaluate the way Excel did (`formula:arraySpill`). Their cells hold the cached value in `data`.
   * Live formulas are in `data` as `=` strings. Left out when the license does not unlock
   * `xlsx:formulas`: the formula cells then hold their cached values, and `dropped` lists
   * `license:xlsx:formulas`.
   */
  formulas?: Array<{ row: number; col: number; formula: string }>;
  /**
   * Cell comments read from the workbook, present only when the `Comments` plugin is enabled.
   * Otherwise `comments` is listed in `dropped`.
   */
  comments?: Array<{ row: number; col: number; value: string }>;
  /**
   * The workbook's defined names handed to the Formulas engine as workbook-scoped named
   * expressions, each `formula` without its leading `=` and in grid coordinates, a reference to the
   * imported sheet written against the grid's own sheet name (`Sheet1!$F$1:$F$3`). Present only when
   * the Formulas plugin is enabled, `importFormulas` is on, and at least one name was handed over.
   * The formulas using these names import live; applying the result adds them to the engine before
   * the data is loaded. Install them yourself with `addNamedExpression(name, '=' + formula)` when
   * `apply` is `false`.
   *
   * Names are handed over only when the engine exposes `isItPossibleToAddNamedExpression`, as
   * HyperFormula does. The ExcelJS engine hands over no names: ExcelJS loses their scope, so the
   * formulas over every name import their cached values with `formula:definedName`, even when the
   * engine already defines the name alike, and `definedNames:unsupported` is listed. A name the engine
   * already defines is not handed over, and the engine keeps its own definition: when that definition
   * differs from the file's (a re-import of a changed file), the formulas using the name import their
   * cached values with `formula:definedName`, and `definedNames:unsupported` is listed. A name
   * scoped to another sheet is ignored. A name the engine cannot take (a relative reference, a
   * reference into the dropped header band, a sheet the engine does not hold, or a name over such a
   * name) is listed as `definedNames:unsupported` in `dropped`, and the formulas using it import
   * their cached values with `formula:definedName`. The import is not an undoable step, and neither
   * is adding these names. The names live only in the engine: turning the Formulas plugin off and on
   * again builds a new engine without them, so add them back from this list.
   */
  namedExpressions?: Array<{ name: string; formula: string }>;
  /**
   * Conditional formatting read from the workbook, in grid coordinates. Nothing applies it - the
   * grid has no conditional formatting plugin - so it is handed back for the caller to use, for
   * instance by passing it to `exportFile`'s `conditionalFormatting` option on a re-export. The
   * `rules` are the engine's own rule objects and are not translated.
   */
  conditionalFormatting?: ImportedConditionalFormatting[];
  /**
   * Generated class name to CSS declarations, present when `importStyles` is `true` and at least
   * one cell carried a font or fill style. Install these yourself when `apply` is `false`.
   */
  styles?: Record<string, string>;
  /**
   * `customBorders` setting entries read from the workbook, present when `importStyles` is `true`
   * and the `customBorders` plugin is enabled.
   */
  customBorders?: ImportedBorder[];
  /**
   * The names of every sheet in the workbook, regardless of which one was imported.
   */
  sheetNames: string[];
  /**
   * The engine that produced this result. `version` is always `null`: neither engine reports one.
   */
  engine: { kind: XlsxEngineKind; version: string | null };
  /**
   * Names of the features the file carried and the grid did not take: what the engine could not
   * read, what the plugin could not apply (an unregistered cell type, a missing plugin, a layout
   * direction the grid does not follow), and a feature the license did not unlock, as
   * `license:xlsx:<token>`. A license entry is listed only for a feature the file carried, the import
   * was asked to bring over, and the license did not unlock: with `importStyles`, `importLayout` or
   * `importFormulas` off, `inferCellTypes` off (for data validation), or the `Comments` plugin off,
   * the license took nothing, and the entry the option drives (`cellStyles`, `comments`) is listed as
   * on any key.
   */
  dropped: string[];
}

/**
 * Narrows the raw `importFile` setting to the settings object, or `undefined` for `true`/absent.
 */
function getPluginSettings(settings: unknown): ImportFileSettings | undefined {
  return isObject(settings) ? settings as ImportFileSettings : undefined;
}

/**
 * The engine module configured for `format` under `engines`, keyed by format name the way the
 * option is documented and the way `exportFile` reads its own `engines`.
 */
function configuredEngine(hot: HotInstance, format: string): object | null | undefined {
  return getPluginSettings(hot.getSettings()[PLUGIN_KEY])?.engines?.[format];
}

/**
 * Detects the engine from the per-call override or the plugin settings for `format`. Returns
 * `null` instead of throwing when nothing usable was injected.
 */
function tryDetectEngine(
  hot: HotInstance,
  override: object | null | undefined,
  format: string,
): DetectedXlsxEngine | null {
  return tryDetectXlsxEngine(resolveEngineOverride(override, configuredEngine(hot, format)), PLUGIN_KEY);
}

/**
 * Detects the engine from the per-call override or the plugin settings and checks it can read the
 * given format. An `engines` map that names no engine for `format`, or names `null`, falls back to
 * the built-in engine – `detectXlsxEngine` reads both the same way – which is what
 * `supportsImportFormat` predicts and what `exportFile` does for the same configuration. Throws a
 * Handsontable error when the injected value does not duck-type to a known engine, or when the
 * detected engine cannot read the format.
 */
function requireEngine(hot: HotInstance, format: string, override: object | null | undefined): DetectedXlsxEngine {
  const injected = resolveEngineOverride(override, configuredEngine(hot, format));
  const detected = detectXlsxEngine(injected, PLUGIN_KEY);

  if (!detected.capabilities.readFormats.includes(format)) {
    throwWithCause(
      `The ${ENGINE_DISPLAY_NAMES[detected.kind]} xlsx engine cannot import "${format}" files. ` +
      `Supported formats: ${detected.capabilities.readFormats.join(', ')}.`
    );
  }

  return detected;
}

/**
 * The sheet names a Formulas engine holds, lower-cased. A formula naming any other sheet cannot
 * resolve in the grid, so the mapper imports its cached value.
 */
function engineSheetNames(engine: { getSheetNames?: () => string[] } | null | undefined): Set<string> {
  const names = typeof engine?.getSheetNames === 'function' ? engine.getSheetNames() : [];

  return new Set(names.map(name => name.toLowerCase()));
}

/**
 * Builds the mapper's sizing of an engine sheet (`MapperContext.sheetExtent`): the rows and columns
 * `getSheetDimensions` answers for the sheet of that name. `undefined` for an engine that cannot
 * tell, so the mapper sizes a span by the imported window alone.
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @returns {Function|undefined}
 */
function engineSheetExtent(engine: {
  getSheetId?: (sheetName: string) => number | undefined;
  getSheetDimensions?: (sheetId: number) => { width: number; height: number };
} | null | undefined): MapperContext['sheetExtent'] {
  if (typeof engine?.getSheetId !== 'function' || typeof engine.getSheetDimensions !== 'function') {
    return undefined;
  }

  return (sheetName) => {
    const sheetId = engine.getSheetId?.(sheetName);

    if (typeof sheetId !== 'number') {
      return undefined;
    }

    const { width, height } = engine.getSheetDimensions?.(sheetId) ?? { width: 0, height: 0 };

    return { rows: height, cols: width };
  };
}

/**
 * The named expressions a Formulas engine defines, lower-cased: the workbook-scoped ones and the
 * ones scoped to the grid's own sheet, which HyperFormula resolves first on that sheet. A formula
 * using a name the file defines and the engine does not shows `#NAME?`, so the mapper imports its
 * cached value; a name the engine defines is compared with the file's (`namedExpressionComparison`).
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @param {string|null|undefined} sheetName The engine's name for the grid's sheet.
 * @returns {Set<string>}
 */
function engineNamedExpressions(
  engine: NamedExpressionEngine | null | undefined, sheetName: string | null | undefined
): Set<string> {
  if (typeof engine?.listNamedExpressions !== 'function') {
    return new Set();
  }

  const sheetId = sheetIdOf(engine, sheetName);
  const scoped = sheetId === undefined ? [] : engine.listNamedExpressions(sheetId);

  return new Set([...engine.listNamedExpressions(), ...scoped].map(name => name.toLowerCase()));
}

/**
 * The engine's id of the grid's sheet, or `undefined` when it holds none of that name.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {string|null|undefined} sheetName The engine's name for the grid's sheet.
 * @returns {number|undefined}
 */
function sheetIdOf(engine: NamedExpressionEngine, sheetName: string | null | undefined): number | undefined {
  const sheetId = typeof sheetName === 'string' ? engine.getSheetId?.(sheetName) : undefined;

  return typeof sheetId === 'number' ? sheetId : undefined;
}

/**
 * The scope HyperFormula resolves a name in on the grid's sheet: the sheet's id when the engine
 * defines the name there (it shadows a workbook-scoped one), `undefined` (workbook scope) otherwise.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {string} name The name.
 * @param {number|undefined} sheetId The engine's id of the grid's sheet.
 * @returns {number|undefined}
 */
function resolvingScope(engine: NamedExpressionEngine, name: string, sheetId: number | undefined): number | undefined {
  if (sheetId === undefined || typeof engine.listNamedExpressions !== 'function') {
    return undefined;
  }

  const lowered = name.toLowerCase();

  return engine.listNamedExpressions(sheetId).some(listed => listed.toLowerCase() === lowered) ? sheetId : undefined;
}

/**
 * Whether a Formulas engine takes a workbook-scoped named expression, through HyperFormula's
 * `isItPossibleToAddNamedExpression`, or `undefined` when the engine has no such method, so no name
 * is handed over.
 */
function namedExpressionCheck(engine: NamedExpressionEngine | null | undefined): NamedExpressionPredicate | undefined {
  const check = engine?.isItPossibleToAddNamedExpression;

  if (typeof check !== 'function') {
    return undefined;
  }

  // `isItPossibleToAddNamedExpression` checks the name and refuses relative references only: a
  // definition that does not parse (`=A1:`) passes it and registers as a name that evaluates to an
  // error, so the formula is validated as well. Both parse the formula, and HyperFormula's parser
  // throws on a deeply nested one: a throw answers no, so the name is left out instead of the whole
  // import failing.
  return (name, expression) => {
    const input = toNamedExpressionInput(expression);

    // A string constant HyperFormula's parser refuses (`"a""b"`) is added as the text it spells.
    return (input !== expression || isValidFormula(engine, expression))
      && answersTrue(() => check.call(engine, name, input));
  };
}

/**
 * Whether a Formulas engine defines a name with this expression, in the scope HyperFormula resolves
 * it in on the grid's sheet (that sheet's own name first, else the workbook's), both read in the
 * engine's normalized form (`normalizeFormula` writes exactly what `getNamedExpressionFormula`
 * answers: canonical sheet case, upper-case functions), or `undefined` when the engine cannot answer,
 * so a name it defines is trusted as it is.
 *
 * A name the engine holds as a constant (`addNamedExpression('TaxRate', 0.07)`) stores no formula,
 * and the export writes it as a literal (`0.07`, `"text"`, `TRUE()`). Its value is compared instead
 * with what the file's expression evaluates to (`sameConstant`).
 *
 * @param {NamedExpressionEngine|null|undefined} engine The Formulas plugin's engine.
 * @param {string|null|undefined} sheetName The engine's name for the grid's sheet, which
 * `calculateFormula` evaluates the file's expression against.
 * @returns {NamedExpressionPredicate|undefined}
 */
function namedExpressionComparison(
  engine: NamedExpressionEngine | null | undefined,
  sheetName: string | null | undefined,
): NamedExpressionPredicate | undefined {
  if (typeof engine?.getNamedExpressionFormula !== 'function' || typeof engine.normalizeFormula !== 'function') {
    return undefined;
  }

  return (name, expression) => {
    const input = toNamedExpressionInput(expression);
    const text = input === expression ? undefined : input.slice(1);

    if (text === undefined && !isValidFormula(engine, expression)) {
      return false;
    }

    const sheetId = sheetIdOf(engine, sheetName);
    const scope = resolvingScope(engine, name, sheetId);
    const stored = engine.getNamedExpressionFormula?.(name, scope);

    if (stored === undefined) {
      return sameConstant(engine, { name, scope, expression, text }, sheetId);
    }

    return text === undefined && answersTrue(() => stored === engine.normalizeFormula?.(expression));
  };
}

/**
 * Whether a name the engine holds as a constant has the value the file's expression evaluates to.
 * The expression is evaluated by `calculateFormula`, which changes nothing in the engine; a string
 * constant HyperFormula's parser refuses (`"a""b"`) is compared as the text it spells. A value the
 * engine cannot compute (no sheet to evaluate against, an expression that throws) or a range never
 * matches, so the formulas over the name import their cached values.
 *
 * @param {NamedExpressionEngine} engine The Formulas plugin's engine.
 * @param {object} definition The name, the scope the engine resolves it in, the file's definition
 * (`=` included) and, for a string constant, the text it spells.
 * @param {number|undefined} sheetId The engine's id of the grid's sheet.
 * @returns {boolean}
 */
function sameConstant(
  engine: NamedExpressionEngine,
  { name, scope, expression, text }: { name: string; scope?: number; expression: string; text?: string },
  sheetId: number | undefined,
): boolean {
  if (typeof engine.getNamedExpressionValue !== 'function' || typeof engine.calculateFormula !== 'function'
    || sheetId === undefined) {
    return false;
  }

  let computed: unknown = text;

  if (text === undefined) {
    try {
      computed = engine.calculateFormula(expression, sheetId);
    } catch {
      return false;
    }
  }

  const held = engine.getNamedExpressionValue(name, scope);

  if (held === computed) {
    return true;
  }

  // An error value (`#N/A`) is a fresh `DetailedCellError` on every read; its code identifies it.
  return isCellError(held) && isCellError(computed) && held.value === computed.value;
}

/**
 * Whether a value is one of HyperFormula's error values, which carry their code in `value`.
 *
 * @param {*} value The value.
 * @returns {boolean}
 */
function isCellError(value: unknown): value is { value: string; type: string } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && typeof (value as { value?: unknown }).value === 'string'
    && typeof (value as { type?: unknown }).type === 'string';
}

/**
 * The part of a HyperFormula instance `functionRegistryCheck` asks.
 */
interface FunctionRegistryEngine {
  getRegisteredFunctionNames?: () => string[];
  getConfig?: () => { language?: unknown };
}

/**
 * Whether a Formulas engine registers a function, through HyperFormula's
 * `getRegisteredFunctionNames()` (the names in the engine's own language, custom functions
 * included), or `undefined` when the engine has no such method, so every function is trusted. The
 * list is read once, on the first question.
 *
 * The instance's list leaves out `OFFSET`, which HyperFormula parses into a reference rather than
 * calls, so its name in the engine's language is added (`protectedFunctionNames`): an `OFFSET`
 * array master read as calling an unregistered function kept its covered cells, and its spill
 * showed `#SPILL!`. The class's whole static list is not added: it holds every plugin registered on
 * the class, also the ones an engine built with `functionPlugins` leaves out.
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @returns {Function|undefined}
 */
function functionRegistryCheck(
  engine: FunctionRegistryEngine | null | undefined
): ((name: string) => boolean) | undefined {
  if (typeof engine?.getRegisteredFunctionNames !== 'function') {
    return undefined;
  }

  let names: Set<string> | null = null;

  return (name) => {
    if (names === null) {
      const registered = [...engine.getRegisteredFunctionNames?.() ?? [], ...protectedFunctionNames(engine)];

      names = new Set(registered.map(fn => fn.toUpperCase()));
    }

    return names.has(name);
  };
}

/**
 * The functions HyperFormula provides on every engine, whatever plugins it loads, that
 * `getRegisteredFunctionNames()` leaves out: `OFFSET`, parsed into a reference.
 */
const PROTECTED_FUNCTION_IDS: readonly string[] = ['OFFSET'];

/**
 * The names of `PROTECTED_FUNCTION_IDS` in the engine's language, translated by the engine's class
 * (`engine.constructor.getLanguage(language).getFunctionTranslation(id)`), or none when it cannot
 * answer.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @returns {string[]}
 */
function protectedFunctionNames(engine: FunctionRegistryEngine): string[] {
  const EngineClass = engine.constructor as {
    getLanguage?: (language: string) => { getFunctionTranslation?: (id: string) => unknown } | undefined;
  };

  try {
    const language = engine.getConfig?.()?.language;

    if (typeof EngineClass?.getLanguage !== 'function' || typeof language !== 'string') {
      return [];
    }

    const translations = EngineClass.getLanguage(language);

    return PROTECTED_FUNCTION_IDS
      .map(id => translations?.getFunctionTranslation?.(id))
      .filter((fn): fn is string => typeof fn === 'string');
  } catch {
    // An engine whose class cannot translate the names keeps the instance's list.
    return [];
  }
}

/**
 * Whether a Formulas engine reads an error code as an error, through the error table of its
 * language (`engine.constructor.getLanguage(language).errors`; `#CALC!` is in none of
 * HyperFormula's), or `undefined` when the engine cannot answer, so every code is trusted.
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @returns {Function|undefined}
 */
function errorCodeCheck(
  engine: { getConfig?: () => { language?: unknown } } | null | undefined
): ((code: string) => boolean) | undefined {
  const codes = engineErrorCodes(engine);

  return codes.size === 0 ? undefined : code => codes.has(code);
}

/**
 * The error codes of a Formulas engine's language, or none when its class cannot name them.
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @returns {Set<string>}
 */
function engineErrorCodes(engine: { getConfig?: () => { language?: unknown } } | null | undefined): Set<string> {
  const EngineClass = engine?.constructor as {
    getLanguage?: (language: string) => { errors?: Record<string, unknown> } | undefined;
  } | undefined;

  try {
    const language = engine?.getConfig?.()?.language;

    if (typeof EngineClass?.getLanguage !== 'function' || typeof language !== 'string') {
      return new Set();
    }

    const errors = Object.values(EngineClass.getLanguage(language)?.errors ?? {});

    return new Set(errors.filter((code): code is string => typeof code === 'string'));
  } catch {
    // An engine whose class cannot name its errors trusts every code.
    return new Set();
  }
}

/**
 * Whether a Formulas engine evaluates array arithmetic, read from HyperFormula's
 * `getConfig().useArrayArithmetic`, or `undefined` when the engine cannot answer (the mapper then
 * trusts it to spill a dynamic array).
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @returns {boolean|undefined}
 */
function engineArrayArithmetic(
  engine: { getConfig?: () => { useArrayArithmetic?: unknown } } | null | undefined
): boolean | undefined {
  if (typeof engine?.getConfig !== 'function') {
    return undefined;
  }

  const enabled = engine.getConfig()?.useArrayArithmetic;

  return typeof enabled === 'boolean' ? enabled : undefined;
}

/**
 * The part of a HyperFormula instance the live-array probe uses.
 */
interface ProbeEngine {
  getConfig(): object;
  getSheetId(sheetName: string): number | undefined;
  getCellValue(address: { sheet: number; row: number; col: number }): unknown;
  isCellPartOfArray(address: { sheet: number; row: number; col: number }): boolean;
  isItPossibleToAddNamedExpression(name: string, expression: unknown): boolean;
  addNamedExpression(name: string, expression: unknown): unknown;
  listNamedExpressions(): string[];
  getNamedExpressionFormula(name: string): string | undefined;
  getNamedExpressionValue(name: string): unknown;
  batch?(callback: () => void): unknown;
  suspendEvaluation?(): void;
  resumeEvaluation?(): void;
  destroy(): void;
}

/**
 * The static side of HyperFormula the probe builds its scratch engine with.
 */
interface ProbeEngineClass {
  buildFromSheets(sheets: Record<string, unknown[][]>, config: object): ProbeEngine;
}

/**
 * Builds the mapper's live-array probe (`MapperContext.probeLiveArrays`) on the Formulas plugin's
 * engine, or `undefined` when the engine is not a HyperFormula instance that can be copied.
 *
 * The scratch engine is built with the engine's own class (`engine.constructor.buildFromSheets`),
 * so `importFile` imports nothing from HyperFormula and the base bundle keeps it external, and with
 * the engine's own config (array arithmetic, language, custom functions registered on the class).
 * It holds one sheet, named like the engine's sheet for the grid so a reference qualified with it
 * resolves, and the workbook-scoped named expressions the engine defines plus the ones the import
 * adds. A reference to any other engine sheet does not resolve in it, nor does a name the engine
 * scopes to the grid's sheet, nor a name over another engine sheet (`=Rates!$A$1` is `#REF!` there)
 * (`definesName` answers which names it holds): the mapper settles a master reading any of them
 * only on `#SPILL!`, and otherwise leaves it as written.
 *
 * @param {object|null|undefined} engine The Formulas plugin's engine.
 * @param {string|null|undefined} sheetName The engine's name for the grid's sheet.
 * @returns {Function|undefined}
 */
function liveArrayProbe(engine: unknown, sheetName: string | null | undefined): MapperContext['probeLiveArrays'] {
  const source = engine as Partial<ProbeEngine> | null | undefined;
  const EngineClass = (source?.constructor ?? null) as Partial<ProbeEngineClass> | null;

  if (typeof source?.getConfig !== 'function' || typeof EngineClass?.buildFromSheets !== 'function') {
    return undefined;
  }

  const held = source as ProbeEngine;
  const build = EngineClass.buildFromSheets.bind(EngineClass);

  return (data, namedExpressions) => {
    const name = typeof sheetName === 'string' && sheetName !== '' ? sheetName : 'Sheet1';
    let scratch: ProbeEngine;

    try {
      scratch = build({ [name]: data }, held.getConfig());
    } catch {
      return null;
    }

    const add = (expressionName: string, expression: unknown) => {
      if (answersTrue(() => scratch.isItPossibleToAddNamedExpression(expressionName, expression))) {
        try {
          scratch.addNamedExpression(expressionName, expression);
        } catch {
          // A name the scratch engine refuses evaluates to `#NAME?` there; the master over it is
          // then an error and left as written.
        }
      }
    };

    let sheet: number;
    let defined: Set<string> | undefined;
    const addAll = () => {
      try {
        (typeof held.listNamedExpressions === 'function' ? held.listNamedExpressions() : []).forEach((heldName) => {
          add(heldName, held.getNamedExpressionFormula?.(heldName) ?? held.getNamedExpressionValue?.(heldName));
        });
      } catch {
        // The engine could not list its names; the masters over them are left as written.
      }

      namedExpressions.forEach(({ name: added, formula }) => add(added, toNamedExpressionInput(`=${formula}`)));
    };

    try {
      // Suspended: on a running engine every add re-evaluated the whole scratch sheet. Not a batch,
      // where HyperFormula 3.3 walks the batch's undo entry on every add (quadratic in the names).
      if (typeof scratch.suspendEvaluation === 'function' && typeof scratch.resumeEvaluation === 'function') {
        scratch.suspendEvaluation();

        try {
          addAll();
        } finally {
          scratch.resumeEvaluation();
        }
      } else if (typeof scratch.batch === 'function') {
        scratch.batch(addAll);
      } else {
        addAll();
      }

      sheet = scratch.getSheetId(name) as number;
    } catch {
      // A scratch engine that fails its setup answers nothing; it is not leaked.
      scratch.destroy();

      return null;
    }

    return {
      masterState: (row, col) => {
        const value = scratch.getCellValue({ sheet, row, col });

        if (!isCellError(value)) {
          return null;
        }

        return value.type;
      },
      isPartOfArray: (row, col) => answersTrue(() => scratch.isCellPartOfArray({ sheet, row, col })),
      spillsValueInto: (row, col) => answersTrue(() => scratch.isCellPartOfArray({ sheet, row, col })
        && (scratch.getCellValue({ sheet, row, col }) ?? null) !== null),
      definesName: (lowered) => {
        // Read once, on the first question; the scratch engine's names change no more. A name over a
        // sheet the scratch engine does not hold is `#REF!` there, so it counts as not defined: a
        // master over it reads outside the probe, like one that names the sheet itself.
        defined ??= new Set(scratch.listNamedExpressions()
          .filter((held) => {
            const value = scratch.getNamedExpressionValue(held);

            return !isCellError(value) || value.type !== 'REF';
          })
          .map(held => held.toLowerCase()));

        return defined.has(lowered);
      },
      destroy: () => scratch.destroy(),
    };
  };
}

/**
 * Whether a Formulas engine parses the formula. An engine without `validateFormula` is not asked.
 * HyperFormula 3.3's parser overflows the stack (`RangeError`) on about 100 levels of nesting; a
 * formula it throws on is not valid.
 *
 * @param {NamedExpressionEngine|null|undefined} engine The Formulas plugin's engine.
 * @param {string} formula The formula, `=` included.
 * @returns {boolean}
 */
function isValidFormula(engine: NamedExpressionEngine | null | undefined, formula: string): boolean {
  return typeof engine?.validateFormula !== 'function'
    || answersTrue(() => engine.validateFormula?.(formula));
}

/**
 * Whether a question to the Formulas engine answers `true`. A throw answers `false`.
 *
 * @param {Function} ask The question.
 * @returns {boolean}
 */
function answersTrue(ask: () => unknown): boolean {
  try {
    return ask() === true;
  } catch {
    return false;
  }
}

/**
 * The part of a Formulas engine the named-expression checks read.
 */
interface NamedExpressionEngine {
  isItPossibleToAddNamedExpression?: (name: string, expression: string) => boolean;
  listNamedExpressions?: (scope?: number) => string[];
  getNamedExpressionFormula?: (name: string, scope?: number) => string | undefined;
  normalizeFormula?: (formula: string) => string;
  validateFormula?: (formula: string) => boolean;
  getNamedExpressionValue?: (name: string, scope?: number) => unknown;
  calculateFormula?: (formula: string, sheetId: number) => unknown;
  getSheetId?: (sheetName: string) => number | undefined;
}

/**
 * A check on a name and its expression (`=` included).
 */
type NamedExpressionPredicate = (name: string, expression: string) => boolean;

/**
 * Records `layoutDirection` as dropped when the workbook's sheet direction disagrees with the grid
 * the result is about to be applied to.
 *
 * Handsontable resolves `layoutDirection` once, while the instance is built, and `metaSchema.ts`
 * documents that a later `updateSettings` throws, so the applier cannot follow the workbook's
 * direction. Recording the mismatch here keeps it inside the plugin's one warning per call; nothing
 * is recorded when the result is not applied. The full reasoning is in this plugin's `AGENTS.md`.
 */
function recordLayoutDirectionMismatch(
  hot: HotInstance, mapped: MappedResult, apply: boolean, dropped: DroppedFeatures
): void {
  if (!apply || mapped.layoutDirection === undefined) {
    return;
  }

  if (mapped.layoutDirection !== (hot.isRtl() ? 'rtl' : 'ltr')) {
    dropped.record(DROPPED_FEATURES.layoutDirection);
  }
}

/**
 * The cell meta keys only a specific cell type reads. A cell that falls back to `text` drops them,
 * so the grid holds no setting the type it ended up with cannot use.
 */
const TYPE_SPECIFIC_META_KEYS = [
  'source', 'numericFormat', 'dateFormat', 'timeFormat', 'dateTimeFormat', 'checkedTemplate', 'uncheckedTemplate',
] as const;

/**
 * Returns `meta`, or a `text` copy of it when its `type` is not registered in the cell type
 * registry. The mapper shares one meta object between every cell of a format, so the copy is made
 * once per object (`fallbacks`) and the shared object itself is never mutated.
 */
function withRegisteredType<T extends { type?: unknown }>(
  meta: T, fallbacks: Map<object, object>, dropped: DroppedFeatures,
): T {
  const { type } = meta;

  if (typeof type !== 'string' || hasCellType(type)) {
    return meta;
  }

  let fallback = fallbacks.get(meta);

  if (fallback === undefined) {
    const copy: Record<string, unknown> = { ...meta, type: 'text' };

    TYPE_SPECIFIC_META_KEYS.forEach((key) => {
      delete copy[key];
    });
    fallback = copy;
    fallbacks.set(meta, fallback);
    dropped.recordUnsupported('cellType', type);
  }

  return fallback as T;
}

/**
 * Replaces every inferred cell type the cell type registry does not know with `text`, and records
 * `cellType:<name>` for each. A bundle that registers modules one by one may lack a type the
 * inference derives (`dropdown`, `date`, ...); applying it used to throw from `getCellType` after
 * `loadData` had already replaced the data, which left the grid half imported and made every later
 * `updateSettings` call throw the same error. Runs only for a result about to be applied.
 */
function fallBackUnregisteredCellTypes(mapped: MappedResult, dropped: DroppedFeatures): void {
  const fallbacks = new Map<object, object>();
  const { columns, cellsMeta } = mapped;

  if (columns) {
    for (let index = 0; index < columns.length; index++) {
      columns[index] = withRegisteredType(columns[index], fallbacks, dropped);
    }
  }

  if (cellsMeta) {
    for (let index = 0; index < cellsMeta.length; index++) {
      const entry = cellsMeta[index];
      const meta = withRegisteredType(entry.meta, fallbacks, dropped);

      if (meta !== entry.meta) {
        cellsMeta[index] = { ...entry, meta };
      }
    }
  }
}

/**
 * The layout keys a result may carry whose plugin has to be registered for the setting to do
 * anything, keyed by the plugin name `getPlugin` takes.
 */
const LAYOUT_PLUGIN_FEATURES = [
  ['mergeCells', DROPPED_FEATURES.mergeCells],
  ['hiddenRows', DROPPED_FEATURES.hiddenRows],
  ['hiddenColumns', DROPPED_FEATURES.hiddenColumns],
] as const;

/**
 * Records `mergeCells`, `hiddenRows` or `hiddenColumns` as dropped when the result carries a
 * non-empty list for it and the plugin that applies it is not registered. The applier still writes
 * the setting, but nothing reads it, so the merge or the hidden row was lost without a word, while
 * a missing `Comments` or `CustomBorders` plugin was reported. Nothing is recorded for a result
 * that is not applied.
 */
function recordMissingLayoutPlugins(
  hot: HotInstance, mapped: MappedResult, apply: boolean, dropped: DroppedFeatures
): void {
  if (!apply) {
    return;
  }

  LAYOUT_PLUGIN_FEATURES.forEach(([key, feature]) => {
    const list = mapped[key];

    if (list !== undefined && list.length > 0 && hot.getPlugin(key) === undefined) {
      dropped.record(feature);
    }
  });
}

/**
 * Hands the engine a plain `ArrayBuffer`. A typed array or a `DataView` is copied out of its
 * backing buffer by `byteOffset` and `byteLength`, so a view onto part of a larger buffer reads
 * only its own bytes. The built-in reader takes an `ArrayBuffer` alone and used to report a view
 * as a damaged file; ExcelJS accepted both.
 */
function toArrayBuffer(buffer: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (!ArrayBuffer.isView(buffer)) {
    return buffer;
  }

  const { byteOffset, byteLength } = buffer;

  return buffer.buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
}

/**
 * @plugin ImportFile
 * @class ImportFile
 *
 * @description
 * The `ImportFile` plugin loads a workbook file into the grid: data, column headers (nested headers
 * with `headerRows`), cell types derived from number formats, dropdown sources from list
 * validations, formulas, comments, read-only cells from sheet protection, merged cells, hidden rows
 * and columns, frozen panes, column widths and row heights. Cell styling is applied with
 * `importStyles: true`; conditional formatting is returned on the result and never applied.
 *
 * XLSX import works out of the box through the built-in engine. Pass an engine module through the
 * `engines` option to read through [ExcelJS](https://github.com/exceljs/exceljs) instead. The plugin
 * reports, in one console warning per import, what the file carried and the grid did not take:
 * what the engine could not read, and what the plugin could not apply. An import that a newer
 * import replaced while its file was being read, or that the plugin was disabled during, prints no
 * warning.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(container, {
 *   importFile: true,
 * });
 *
 * const result = await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
 *   colHeaders: 'firstRow',
 * });
 * ```
 * :::
 */
export class ImportFile extends BasePlugin {
  /**
   * The ticket of the last applying import started on this instance. Each `apply: true` call takes
   * the next ticket before its first `await`, and a call whose ticket is no longer the latest when
   * its read ends is rejected instead of applied, so the import started last always wins.
   */
  #latestApplyTicket = 0;

  /**
   * The apply ticket `disablePlugin()` took last. An import whose ticket is lower was still reading
   * when the plugin was disabled, so it is not applied even after the plugin is enabled again.
   */
  #disabledAtTicket = 0;

  /**
   * The apply ticket the last `loadData()` took, when the grid loaded data other than an import's own
   * result (a sheet switch, a host reload). An import whose ticket is lower was still reading then, and
   * applying it would replace the data that was loaded in its place, on another sheet with a sheets bar.
   */
  #dataReplacedAtTicket = 0;

  /**
   * Whether this plugin is loading an import's result, or running its `beforeImport` listeners, so a
   * `loadData()` made then takes no ticket: the import's own, or one a listener makes to clear the grid
   * before the result lands.
   */
  #isApplying = false;

  /**
   * Whether this plugin is loading an import's result into the grid (`applyImportResult()`). Unlike
   * `#isApplying`, it is not set while the `beforeImport` listeners run: settings a listener changes are
   * the host's own.
   */
  #isApplyingResult = false;

  /**
   * The style rules the stylesheet holds now, by class name: the ones the last import installed, or the
   * ones `_restoreImportedStyles()` put back.
   */
  #installedStyles: Record<string, string> = {};

  /**
   * The settings payload the plugin is passing to `updateSettings()` while it applies an import's result, or
   * `null`. A payload a listener passes in the meantime is another object (`_isImportSettings()`).
   */
  #importSettings: Record<string, unknown> | null = null;

  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the ids of the license capability tokens this plugin gates.
   *
   * @private
   * @returns {string[]}
   */
  static get CAPABILITIES(): readonly string[] {
    return IMPORT_FILE_CAPABILITY_IDS;
  }

  /**
   * Returns the license token of the plugin, its display name, where it is checked, and the tokens it
   * requires.
   */
  static get LICENSE() {
    return LICENSE;
  }

  /**
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`.
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  /**
   * Tells whether the plugin is loading an import's result into the grid. The sheets bar does not take the
   * settings written then as grid-level values, and records the import's own payloads as the visible sheet's
   * settings (`_isImportSettings()`). It answers `false` while the `beforeImport` listeners run: a setting a
   * listener changes is the host's own.
   *
   * @private
   * @returns {boolean}
   */
  _isApplyingImport(): boolean {
    return this.#isApplyingResult;
  }

  /**
   * Tells whether a settings payload is one the plugin itself passes to `updateSettings()` while it applies
   * an import's result. The sheets bar records those as the visible sheet's own settings. A payload a
   * listener passes during the import, from `afterLoadData` or `afterUpdateSettings` for example, is the
   * host's own, so it answers `false` for it.
   *
   * @private
   * @param {object} settings The payload `updateSettings()` received.
   * @returns {boolean}
   */
  _isImportSettings(settings: Record<string, unknown>): boolean {
    return this.#importSettings !== null && settings === this.#importSettings;
  }

  /**
   * Returns a copy of the style rules the imported stylesheet holds, by class name. The sheets bar keeps
   * them per sheet: the cells of each sheet carry the classes of the file imported into that sheet, while
   * the grid has one stylesheet.
   *
   * @private
   * @returns {object}
   */
  _exportImportedStyles(): Record<string, string> {
    return { ...this.#installedStyles };
  }

  /**
   * Replaces the imported stylesheet with the given rules, by class name, the way an import installs
   * them. Empty rules remove the stylesheet. The sheets bar calls it when a sheet arrives, with the rules
   * that sheet kept (`_exportImportedStyles()`).
   *
   * @private
   * @param {object} styles The rules, by class name.
   */
  _restoreImportedStyles(styles: Record<string, string>): void {
    this.#installedStyles = installImportedStyles(this.hot, styles);
  }

  /**
   * Enabled unless the `importFile` option is `false`; the engine decides what it can import.
   */
  isEnabled(): boolean {
    return this.hot.getSettings()[PLUGIN_KEY] !== false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('beforeLoadData', this.#onBeforeLoadData);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance and removes the stylesheet a
   * previous import installed, so `htImported-*` rules stop painting cells whose meta still carries
   * the class. Every import still reading is made stale too: the enabled check at apply time sees
   * only the state at the end of the read, so `importFile: false` and then `true` during a read let
   * that read apply.
   */
  disablePlugin() {
    super.disablePlugin();
    removeImportedStyles(this.hot);
    this.#installedStyles = {};
    this.#latestApplyTicket += 1;
    this.#disabledAtTicket = this.#latestApplyTicket;
  }

  /**
   * Returns `true` when the format can be read: `xlsx`, through the built-in engine or the one
   * configured in `engines`. An engine of unknown shape reads nothing and answers `false`. `'xlsx'` also
   * answers `false` whenever an xlsx import would throw for the license: when the license key names
   * tiers and none of them includes `feat:import_file`, the plugin's own feature, or none includes
   * `xlsx:import`. A key that names no tier is not restricted.
   *
   * @param {string} format The import format, e.g. `'xlsx'`.
   * @returns {boolean}
   */
  supportsImportFormat(format: string): boolean {
    if (
      format === 'xlsx' &&
      (!hasLicenseCapability(this.hot, LICENSE.capability) || !getXlsxEntitlement(this.hot).import)
    ) {
      return false;
    }

    const detected = tryDetectEngine(this.hot, undefined, format);

    return detected !== null && detected.capabilities.readFormats.includes(format);
  }

  /**
   * Infers a cell type and format for every column of raw, untyped data: rows parsed from a CSV
   * file, pasted text split into cells, or values from an API. Works without an engine.
   *
   * Returns `{ columns, headerRow }`. Each column is `{ settings, confidence, inputFormat, title,
   * stats }`. `settings` holds the column options (`type`, `numericFormat`, `dateFormat`,
   * `dateTimeFormat`, `timeFormat`, `source`, and `data` for object rows) and can be passed to
   * `columns` as it is.
   * `confidence` is the share of values the type reads, `inputFormat` is how the raw values were
   * written, `title` is the header (see the `headerRow` option), and `stats` is set with the `stats`
   * option. A column that no type reads with at least `minConfidence` falls back to `'text'`.
   *
   * The result is deterministic: it reads `sampleSize` rows (the first ones, or with
   * `sampling: 'spread'` rows spaced evenly across the data) and settles an ambiguous column
   * (`1.234`, `12/03/2026`) with `options.locale`, which defaults to the grid's `locale`. The
   * `dateFormats` option lists date formats to read, and `booleanValues` lists words a checkbox
   * column reads as `true` and `false`.
   *
   * @example
   * ```js
   * const importFile = hot.getPlugin('importFile');
   * const result = importFile.inferColumnTypes(rows, { locale: 'de-DE', headerRow: 'auto' });
   *
   * hot.updateSettings({
   *   columns: result.columns.map(({ settings }) => settings),
   *   colHeaders: result.columns.map(({ title }) => title),
   *   data: importFile.convertToInferredTypes(rows, result),
   * });
   * ```
   * @throws {Error} When the license key names tiers and none of them includes Import from file.
   */
  inferColumnTypes(data: InferenceData, options: InferColumnTypesOptions | null = {}): InferColumnTypesResult {
    assertLicensedCall(this.hot, LICENSE);

    return inferColumnTypes(data, { ...options, locale: options?.locale || this.hot.getSettings().locale });
  }

  /**
   * Returns a copy of `data` with every value converted to what its column's inferred cell type
   * stores: a number for `numeric`, `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm:ss` for
   * `intl-datetime`, `HH:mm:ss` for `time`, and a boolean for `checkbox`. A `Date` converts to its
   * local date and time. A value the column cannot read, such as a `Total` row, is kept as it is, so the
   * cell type's validator marks it. When the result found a header row, that row is left out.
   * `data` itself is not changed.
   * @throws {Error} When the license key names tiers and none of them includes Import from file.
   */
  convertToInferredTypes<T extends InferenceData>(data: T, result: InferColumnTypesResult): ConvertedData<T> {
    assertLicensedCall(this.hot, LICENSE);

    return convertToInferredTypes(data, result);
  }

  /**
   * Reads a workbook from an `ArrayBuffer` (or a view onto one, such as a `Uint8Array`) and maps it
   * into an `ImportResult`. Applies the result to the grid unless `options.apply` is `false`
   * or a `beforeImport` hook returns `false`.
   *
   * When a newer import that applies its result starts on the same instance before this one
   * finishes, this one is not applied and the returned promise rejects: the import started last
   * wins. An `apply: false` import neither cancels another import nor is cancelled by one. Turning
   * the plugin off (`importFile: false`) while the file is being read rejects the import too, even
   * when the plugin is turned back on before the read ends. So does a {@link Core#loadData} call made
   * while the file is being read, for example a sheets bar switch: the result is not applied over
   * the data loaded in the meantime.
   *
   * @param {string} format The import format, e.g. `'xlsx'`.
   * @param {ArrayBuffer|ArrayBufferView} buffer The file's bytes.
   * @param {ImportOptions} [options] Import options.
   * @returns {Promise<ImportResult>}
   * @throws {Error} The returned promise rejects when the license key names tiers and none of them includes Import from file.
   */
  async importFromArrayBuffer(
    format: string, buffer: ArrayBuffer | ArrayBufferView, options: ImportOptions = {}
  ): Promise<ImportResult> {
    assertLicensedCall(this.hot, LICENSE);

    this.#assertEnabled();
    this.#assertLicensed(format);

    const detected = requireEngine(this.hot, format, options.engine);
    // Validated before the ticket is taken, so a call refused for an option never cancels an import
    // in flight.
    const resolved = resolveImportOptions(options);

    return this.#importBuffer(format, buffer, resolved, detected, this.#takeApplyTicket(resolved));
  }

  /**
   * Reads a workbook from a `Blob` (e.g. a `File` from an `<input type="file">`) and maps it into
   * an `ImportResult`. Applies the result to the grid unless `options.apply` is `false` or a
   * `beforeImport` hook returns `false`.
   *
   * When a newer import that applies its result starts on the same instance before this one
   * finishes, this one is not applied and the returned promise rejects: the import started last
   * wins. An `apply: false` import neither cancels another import nor is cancelled by one. Turning
   * the plugin off (`importFile: false`) while the file is being read rejects the import too, even
   * when the plugin is turned back on before the read ends. So does a {@link Core#loadData} call made
   * while the file is being read, for example a sheets bar switch: the result is not applied over
   * the data loaded in the meantime.
   *
   * @param {string} format The import format, e.g. `'xlsx'`.
   * @param {Blob} blob The file.
   * @param {ImportOptions} [options] Import options.
   * @returns {Promise<ImportResult>}
   * @throws {Error} The returned promise rejects when the license key names tiers and none of them includes Import from file.
   */
  async importFromBlob(format: string, blob: Blob, options: ImportOptions = {}): Promise<ImportResult> {
    assertLicensedCall(this.hot, LICENSE);

    this.#assertEnabled();
    this.#assertLicensed(format);

    // Detected, validated and ticketed before the first `await`, so a call refused for its format,
    // its engine or an option never cancels an import in flight, and the order of the tickets is the
    // order of the calls.
    const detected = requireEngine(this.hot, format, options.engine);
    const resolved = resolveImportOptions(options);
    const ticket = this.#takeApplyTicket(resolved);
    const buffer = await blob.arrayBuffer();

    if (!this.hot) {
      throwWithCause('ImportFile: the Handsontable instance was destroyed while the file was being read.');
    }

    return this.#importBuffer(format, buffer, resolved, detected, ticket);
  }

  /**
   * Reads, maps and (unless `apply: false`) applies one workbook. `ticket` is `null` for an
   * `apply: false` call, which never touches the grid and so takes no part in the ordering.
   */
  async #importBuffer(
    format: string,
    buffer: ArrayBuffer | ArrayBufferView,
    resolved: ResolvedImportOptions,
    detected: DetectedXlsxEngine,
    ticket: number | null,
  ): Promise<ImportResult> {
    const dropped = new DroppedFeatures();
    const workbook = await detected.adapter.read(toArrayBuffer(buffer), detected.module, dropped);

    // The read is the one async boundary: `BasePlugin#destroy` deletes `hot`, so a grid torn down
    // while the file was being parsed has nothing left to apply the result to.
    this.#assertAlive('while the workbook was being read');
    this.#assertLatest(ticket);

    const formulasPlugin = this.hot.getPlugin('formulas');
    const commentsPlugin = this.hot.getPlugin('comments');
    const customBordersPlugin = this.hot.getPlugin('customBorders');
    const formulasEnabled = formulasPlugin?.enabled === true;

    // The mapping reads named expression values from the engine, which it refuses while the Formulas plugin
    // holds its recalculation (`batchEvaluation`).
    if (formulasPlugin?.enabled) {
      formulasPlugin.flushEngineEvaluation();
    }

    // Scoped to the import's own tokens, so the warning and the `license:` entries never name an
    // export-only token (`xlsx:export`, `xlsx:number_formats`).
    const entitlement = scopeXlsxEntitlement(getXlsxEntitlement(this.hot), IMPORT_FILE_CAPABILITY_IDS);
    const mapped = mapWorkbook(workbook, resolved, {
      formulasEnabled,
      commentsEnabled: commentsPlugin?.enabled === true,
      customBordersEnabled: customBordersPlugin?.enabled === true,
      formulaSheetNames: formulasEnabled ? engineSheetNames(formulasPlugin?.engine) : undefined,
      formulaSheetName: formulasEnabled ? formulasPlugin?.sheetName ?? undefined : undefined,
      formulaNamedExpressions: formulasEnabled
        ? engineNamedExpressions(formulasPlugin?.engine, formulasPlugin?.sheetName)
        : undefined,
      canAddNamedExpression: formulasEnabled ? namedExpressionCheck(formulasPlugin?.engine) : undefined,
      definesNamedExpression: formulasEnabled
        ? namedExpressionComparison(formulasPlugin?.engine, formulasPlugin?.sheetName)
        : undefined,
      sheetExtent: formulasEnabled ? engineSheetExtent(formulasPlugin?.engine) : undefined,
      registersFunction: formulasEnabled ? functionRegistryCheck(formulasPlugin?.engine) : undefined,
      arrayArithmetic: formulasEnabled ? engineArrayArithmetic(formulasPlugin?.engine) : undefined,
      recognizesErrorCode: formulasEnabled ? errorCodeCheck(formulasPlugin?.engine) : undefined,
      probeLiveArrays: formulasEnabled
        ? liveArrayProbe(formulasPlugin?.engine, formulasPlugin?.sheetName)
        : undefined,
      entitlement,
    }, dropped);

    recordLayoutDirectionMismatch(this.hot, mapped, resolved.apply, dropped);
    recordMissingLayoutPlugins(this.hot, mapped, resolved.apply, dropped);

    if (resolved.apply) {
      fallBackUnregisteredCellTypes(mapped, dropped);
    }

    const result: ImportResult = {
      ...mapped,
      dropped: dropped.list(),
      engine: { kind: detected.kind, version: detected.version },
    };

    if (!resolved.apply) {
      this.#warnDropped(dropped, detected.kind);

      return result;
    }

    // `updateSettings({ importFile: false })` during the read disables the plugin without deleting
    // `hot`, and a late apply would put the imported stylesheet back on a disabled plugin.
    this.#assertEnabled();
    this.#assertAlive('before the import was applied');
    // Warned only once the guards passed, so an import they reject logs nothing about data that never
    // reached the grid (review round 12).
    this.#warnDropped(dropped, detected.kind);

    this.#isApplying = true;

    let canceled: boolean;

    try {
      canceled = this.hot.runHooks<boolean | void>('beforeImport', result, format) === false;
    } finally {
      this.#isApplying = false;
    }

    if (canceled) {
      return result;
    }

    // A `beforeImport` handler may destroy the grid, or start a newer import.
    this.#assertAlive('before the import was applied');
    this.#assertLatest(ticket);

    this.#isApplying = true;
    this.#isApplyingResult = true;

    try {
      applyImportResult(this.hot, result, {
        importLayout: resolved.importLayout && entitlement.layout,
        updateSettings: this.#applyImportSettings,
        onStylesInstalled: (styles) => {
          this.#installedStyles = styles;
        },
      });
    } finally {
      this.#isApplying = false;
      this.#isApplyingResult = false;
    }

    this.hot.runHooks('afterImport', result, format);

    return result;
  }

  /**
   * Passes one settings payload of an import's result to `updateSettings()`, marked as the plugin's own
   * (`_isImportSettings()`) for as long as the call runs.
   *
   * @param {object} settings The payload.
   */
  #applyImportSettings = (settings: Record<string, unknown>) => {
    this.#importSettings = settings;

    try {
      this.hot.updateSettings(settings);
    } finally {
      this.#importSettings = null;
    }
  };

  /**
   * Emits the warnings of one import call: the engine's dropped-features warning, and the
   * missing-capabilities warning, only when the import recorded a `license:<token>` entry (a feature
   * the file carried, the import was asked to bring over, and the license does not unlock) and the
   * console channel is on. The warning
   * names exactly those tokens, in the order the mapper recorded them (`XLSX_CAPABILITY_IDS` order).
   *
   * @param {DroppedFeatures} dropped The features recorded during the call.
   * @param {XlsxEngineKind} kind The engine that read the file.
   */
  #warnDropped(dropped: DroppedFeatures, kind: XlsxEngineKind): void {
    dropped.warn(kind);

    const tokens = dropped.licenseTokens();

    if (tokens.length > 0 && getLicenseState(this.hot).channels.console) {
      warn(formatMissingCapabilitiesWarning('import', tokens));
    }
  }

  /**
   * Rejects an xlsx import when the license key names tiers and none of them includes `xlsx:import`.
   * Runs right after `#assertEnabled()`, before any engine detection or file read.
   */
  #assertLicensed(format: string): void {
    if (format === 'xlsx' && !getXlsxEntitlement(this.hot).import) {
      throwWithCause('ImportFile: the license does not unlock "xlsx:import".');
    }
  }

  /**
   * Rejects a public call on a disabled plugin (`importFile: false`), the way every other plugin's
   * public methods return early on `!this.enabled`. The methods return promises, so this throws a
   * Handsontable error inside them rather than resolving with nothing.
   */
  #assertEnabled(): void {
    // A destroyed plugin is not `enabled` either; name the real cause rather than `importFile: false`.
    if (!this.hot) {
      throwWithCause('ImportFile: the Handsontable instance is destroyed, so nothing can be imported.');
    }

    if (!this.enabled) {
      throwWithCause('ImportFile: the plugin is disabled (`importFile: false`), so nothing can be imported.');
    }
  }

  /**
   * Takes the next apply ticket for an import that applies its result, or `null` for an
   * `apply: false` import. Must run before the call's first `await`.
   */
  #takeApplyTicket(options: ResolvedImportOptions): number | null {
    if (!options.apply) {
      return null;
    }

    this.#latestApplyTicket += 1;

    return this.#latestApplyTicket;
  }

  /**
   * Rejects an applying import when a newer applying import started on this instance after it, so
   * an older file that finishes last cannot overwrite the newer one. No hook fires for it.
   */
  #assertLatest(ticket: number | null): void {
    if (ticket === null || ticket === this.#latestApplyTicket) {
      return;
    }

    // A plugin still disabled names that cause, as it did before the disable took a ticket.
    this.#assertEnabled();

    if (ticket < this.#disabledAtTicket) {
      throwWithCause('ImportFile: the plugin was disabled while the file was being read, so its result was not '
        + 'applied.');
    }

    if (ticket < this.#dataReplacedAtTicket) {
      throwWithCause('ImportFile: the grid\'s data was replaced while the file was being read, so its result was '
        + 'not applied.');
    }

    throwWithCause('ImportFile: a newer import started before this one finished, so its result was not applied.');
  }

  /**
   * Takes an apply ticket when the grid loads data that is not an import's own result, so an import still
   * reading is not applied over it: a sheets bar switch loads another sheet's data, and the result would
   * land in that sheet. A DataProvider fetch takes none: it reloads the rows of the data the import was
   * started on, which the result replaces anyway.
   *
   * @param {Array} data The data being loaded.
   * @param {boolean} initialLoad Whether this is the grid's first load.
   * @param {string} [source] The source of the `loadData()` call.
   */
  #onBeforeLoadData = (data: unknown, initialLoad: boolean, source?: string) => {
    if (this.#isApplying || source === DATA_PROVIDER_LOAD_SOURCE) {
      return;
    }

    this.#latestApplyTicket += 1;
    this.#dataReplacedAtTicket = this.#latestApplyTicket;
  };

  /**
   * Rejects a call whose grid was destroyed across an `await` or by a hook: `BasePlugin#destroy`
   * deletes `hot`, so continuing would surface as a raw `TypeError`. `phase` names the step the
   * destroy happened in: during the read, or after it and before the result was applied (a
   * `beforeImport` handler).
   */
  #assertAlive(phase: 'while the workbook was being read' | 'before the import was applied'): void {
    if (!this.hot) {
      throwWithCause(`ImportFile: the Handsontable instance was destroyed ${phase}.`);
    }
  }

  /**
   * Removes the instance-owned stylesheet installed by a previous import before the base plugin
   * teardown runs.
   */
  destroy(): void {
    // `BasePlugin#destroy` deletes `hot`; a second direct `destroy()` must not throw inside core's
    // teardown loop and leave the plugins after this one undestroyed.
    if (!this.hot) {
      return;
    }

    removeImportedStyles(this.hot);
    super.destroy();
  }
}
