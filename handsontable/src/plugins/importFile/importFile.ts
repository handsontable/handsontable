import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { isObject } from '../../helpers/object';
import {
  detectXlsxEngine, resolveEngineOverride, tryDetectXlsxEngine, type DetectedXlsxEngine,
} from '../../utils/xlsxEngine/detect';
import { DROPPED_FEATURES, DroppedFeatures, type XlsxEngineKind } from '../../utils/xlsxEngine/capabilities';
import { mapWorkbook, resolveImportOptions, type MappedResult } from './mapper';
import { applyImportResult, removeImportedStyles } from './applier';
import { hasCellType } from '../../cellTypes/registry';
import type { ImportedBorder } from './styles';
import type { HotInstance } from '../../core/types';

export const PLUGIN_KEY = 'importFile';
export const PLUGIN_PRIORITY = 245;

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
   * Sheet to import, by 0-based index among the workbook's sheets or by name. Defaults to `0`.
   */
  sheet?: string | number;
  /**
   * `'firstRow'` promotes the first sheet row to column headers. Defaults to `false`.
   */
  colHeaders?: boolean | 'firstRow';
  /**
   * `true` drops the first sheet column and enables generated row headers. Defaults to `false`.
   */
  rowHeaders?: boolean;
  /**
   * How many rows the header band spans when `colHeaders` is `'firstRow'`. `1` promotes the first
   * row to `colHeaders`; a value above `1` promotes that many rows to `nestedHeaders` instead and
   * starts the data after them. Has to be an integer of at least `1`. Ignored unless `colHeaders`
   * is `'firstRow'`. Defaults to `1`.
   */
  headerRows?: number;
  /**
   * Cell range to import in 0-based sheet coordinates: `[startRow, startColumn, endRow, endColumn]`.
   */
  range?: number[];
  /**
   * Derive `numeric`, `date`, `time`, `checkbox` and `dropdown` cell types from number formats and
   * list validations. Defaults to `true`.
   */
  inferCellTypes?: boolean;
  /**
   * Put formula strings into the data when the `formulas` plugin is enabled. Defaults to `true`.
   */
  importFormulas?: boolean;
  /**
   * Import merges, hidden rows and columns, frozen panes, column widths and row heights. Defaults to `true`.
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
   * Apply alignment, font, fill and borders from the workbook as generated class names
   * (`result.cellsMeta[].meta.className`), style rules (`result.styles`) and `customBorders`
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
   * number format. Handsontable 18 takes `dateFormat` as `Intl.DateTimeFormatOptions`
   * and rejects a pattern string, so the Excel pattern is inverted into options rather than copied.
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
   * Set when every cell of the column is locked under sheet protection. A column that only partly
   * agrees carries the flag per cell in `cellsMeta` instead.
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
   * Whether row headers were derived from the sheet's first column.
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
   * nothing about that row, so the grid keeps its own height there.
   */
  rowHeights?: Array<number | undefined>;
  /**
   * The sheet's layout direction. Present only when `importLayout` is on. It is never applied:
   * Handsontable resolves `layoutDirection` at construction, so a grid that has to follow a
   * right-to-left workbook must be constructed with `layoutDirection: 'rtl'`.
   */
  layoutDirection?: 'rtl' | 'ltr';
  /**
   * Cell formulas read from the workbook.
   */
  formulas?: Array<{ row: number; col: number; formula: string }>;
  /**
   * Cell comments read from the workbook.
   */
  comments?: Array<{ row: number; col: number; value: string }>;
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
   * The engine that produced this result.
   */
  engine: { kind: XlsxEngineKind; version: string | null };
  /**
   * Names of features the engine could not recover from the file.
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
      `The "${detected.kind}" xlsx engine cannot import "${format}" files. ` +
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
 * The workbook-scoped named expressions a Formulas engine defines, lower-cased. A formula using a
 * name the file defines and the engine does not shows `#NAME?`, so the mapper imports its cached
 * value.
 */
function engineNamedExpressions(engine: { listNamedExpressions?: () => string[] } | null | undefined): Set<string> {
  const names = typeof engine?.listNamedExpressions === 'function' ? engine.listNamedExpressions() : [];

  return new Set(names.map(name => name.toLowerCase()));
}

/**
 * Records `layoutDirection` as dropped when the workbook's sheet direction disagrees with the grid
 * the result is about to be applied to.
 *
 * Handsontable resolves `layoutDirection` once, while the instance is built, and `metaSchema.ts`
 * documents that a later `updateSettings` is ignored, so the applier cannot follow the workbook's
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
 * The `ImportFile` plugin loads a workbook file into the grid: data, column headers, cell types
 * derived from number formats, dropdown sources from list validations, formulas, merged cells,
 * hidden rows and columns, frozen panes, column widths and row heights.
 *
 * XLSX import works out of the box through the built-in engine. Pass an engine module through the
 * `engines` option to read through [ExcelJS](https://github.com/exceljs/exceljs) instead. The plugin
 * reports, in one console warning, anything the engine could not recover from the file.
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
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`.
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
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

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance and removes the stylesheet a
   * previous import installed, so `htImported-*` rules stop painting cells whose meta still carries
   * the class.
   */
  disablePlugin() {
    super.disablePlugin();
    removeImportedStyles(this.hot);
  }

  /**
   * Returns `true` when the format can be read: `xlsx`, through the built-in engine or the one
   * configured in `engines`. An engine of unknown shape reads nothing and answers `false`.
   */
  supportsImportFormat(format: string): boolean {
    const detected = tryDetectEngine(this.hot, undefined, format);

    return detected !== null && detected.capabilities.readFormats.includes(format);
  }

  /**
   * Reads a workbook from an `ArrayBuffer` (or a view onto one, such as a `Uint8Array`) and maps it
   * into an {@link ImportResult}. Applies the result to the grid unless `options.apply` is `false`
   * or a `beforeImport` hook returns `false`.
   *
   * When a newer import that applies its result starts on the same instance before this one
   * finishes, this one is not applied and the returned promise rejects: the import started last
   * wins. An `apply: false` import neither cancels another import nor is cancelled by one.
   */
  async importFromArrayBuffer(
    format: string, buffer: ArrayBuffer | ArrayBufferView, options: ImportOptions = {}
  ): Promise<ImportResult> {
    this.#assertEnabled();

    const detected = requireEngine(this.hot, format, options.engine);

    return this.#importBuffer(format, buffer, options, detected, this.#takeApplyTicket(options));
  }

  /**
   * Reads a workbook from a `Blob` (e.g. a `File` from an `<input type="file">`) and maps it into
   * an {@link ImportResult}. Applies the result to the grid unless `options.apply` is `false` or a
   * `beforeImport` hook returns `false`.
   *
   * When a newer import that applies its result starts on the same instance before this one
   * finishes, this one is not applied and the returned promise rejects: the import started last
   * wins. An `apply: false` import neither cancels another import nor is cancelled by one.
   */
  async importFromBlob(format: string, blob: Blob, options: ImportOptions = {}): Promise<ImportResult> {
    this.#assertEnabled();

    // Detected and ticketed before the first `await`, so a call refused for its format or engine
    // never cancels an import in flight, and the order of the tickets is the order of the calls.
    const detected = requireEngine(this.hot, format, options.engine);
    const ticket = this.#takeApplyTicket(options);
    const buffer = await blob.arrayBuffer();

    if (!this.hot) {
      throwWithCause('ImportFile: the Handsontable instance was destroyed while the file was being read.');
    }

    return this.#importBuffer(format, buffer, options, detected, ticket);
  }

  /**
   * Reads, maps and (unless `apply: false`) applies one workbook. `ticket` is `null` for an
   * `apply: false` call, which never touches the grid and so takes no part in the ordering.
   */
  async #importBuffer(
    format: string,
    buffer: ArrayBuffer | ArrayBufferView,
    options: ImportOptions,
    detected: DetectedXlsxEngine,
    ticket: number | null,
  ): Promise<ImportResult> {
    const resolved = resolveImportOptions(options);
    const dropped = new DroppedFeatures();
    const workbook = await detected.adapter.read(toArrayBuffer(buffer), detected.module, dropped);

    // The read is the one async boundary: `BasePlugin#destroy` deletes `hot`, so a grid torn down
    // while the file was being parsed has nothing left to apply the result to.
    this.#assertAlive();
    this.#assertLatest(ticket);

    const formulasPlugin = this.hot.getPlugin('formulas');
    const commentsPlugin = this.hot.getPlugin('comments');
    const customBordersPlugin = this.hot.getPlugin('customBorders');
    const formulasEnabled = formulasPlugin?.isEnabled() === true;
    const mapped = mapWorkbook(workbook, resolved, {
      formulasEnabled,
      commentsEnabled: commentsPlugin?.isEnabled() === true,
      customBordersEnabled: customBordersPlugin?.isEnabled() === true,
      formulaSheetNames: formulasEnabled ? engineSheetNames(formulasPlugin?.engine) : undefined,
      formulaNamedExpressions: formulasEnabled ? engineNamedExpressions(formulasPlugin?.engine) : undefined,
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

    dropped.warn(detected.kind);

    if (!resolved.apply) {
      return result;
    }

    // `updateSettings({ importFile: false })` during the read disables the plugin without deleting
    // `hot`, and a late apply would put the imported stylesheet back on a disabled plugin.
    this.#assertEnabled();
    this.#assertAlive();

    if (this.hot.runHooks<boolean | void>('beforeImport', result, format) === false) {
      return result;
    }

    // A `beforeImport` handler may destroy the grid, or start a newer import.
    this.#assertAlive();
    this.#assertLatest(ticket);

    applyImportResult(this.hot, result, { importLayout: resolved.importLayout });
    this.hot.runHooks('afterImport', result, format);

    return result;
  }

  /**
   * Rejects a public call on a disabled plugin (`importFile: false`), the way every other plugin's
   * public methods return early on `!this.enabled`. The methods return promises, so this throws a
   * Handsontable error inside them rather than resolving with nothing.
   */
  #assertEnabled(): void {
    if (!this.enabled) {
      throwWithCause('ImportFile: the plugin is disabled (`importFile: false`), so nothing can be imported.');
    }
  }

  /**
   * Takes the next apply ticket for an import that applies its result, or `null` for an
   * `apply: false` import. Must run before the call's first `await`.
   */
  #takeApplyTicket(options: ImportOptions): number | null {
    if (options.apply === false) {
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
    if (ticket !== null && ticket !== this.#latestApplyTicket) {
      throwWithCause('ImportFile: a newer import started before this one finished, so its result was not applied.');
    }
  }

  /**
   * Rejects a call whose grid was destroyed across an `await` or by a hook: `BasePlugin#destroy`
   * deletes `hot`, so continuing would surface as a raw `TypeError`.
   */
  #assertAlive(): void {
    if (!this.hot) {
      throwWithCause('ImportFile: the Handsontable instance was destroyed while the workbook was being read.');
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
