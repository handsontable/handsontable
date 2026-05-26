import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { isObject } from '../../helpers/object';
import { LOADING_CLASS_NAME } from '../../helpers/constants';
import { EXPORT_FILE_DIALOG_TITLE } from '../../i18n/constants';
import DataProvider from './dataProvider';
import typeFactory, { EXPORT_TYPES } from './typeFactory';
import exportItem from './contextMenuItem/exportItem';
import { buildExportDialogContent } from './utils';
import type { HotInstance } from '../../core/types';
import type BaseType from './types/_base';

export const PLUGIN_KEY = 'exportFile';

/**
 * Options for a single worksheet in a multi-sheet export (XLSX only).
 */
export interface SheetOptions {
  /** The Handsontable instance to export data from. */
  instance: HotInstance;
  /** Worksheet name. Defaults to `'Sheet'` when omitted. */
  name?: string;
  /** Include column headers. */
  colHeaders?: boolean;
  /**
   * @deprecated Use `colHeaders` instead.
   */
  columnHeaders?: boolean;
  /** Include row headers. */
  rowHeaders?: boolean;
  /** Controls how hidden columns are exported. */
  exportHiddenColumns?: boolean | 'hide';
  /** Controls how hidden rows are exported. */
  exportHiddenRows?: boolean | 'hide';
  /** Export cell formulas instead of computed values (XLSX only). */
  exportFormulas?: boolean;
  /** Cell range to export: `[startRow, startColumn, endRow, endColumn]`. */
  range?: number[];
}

/** Border style descriptor used in {@link HeaderStyle}. */
export interface HeaderStyleBorder {
  /** Border line style (e.g. `'thin'`, `'medium'`, `'thick'`). */
  style?: string;
  /** Border color in hex (e.g. `'#000000'`). */
  argb?: string;
}

/** Style applied to header cells in XLSX exports. */
export interface HeaderStyle {
  /** Background fill color in hex (e.g. `'#f2f2f2'`). */
  backgroundColor?: string;
  /** Font color in hex. */
  fontColor?: string;
  /** Border descriptor applied to all sides. */
  border?: HeaderStyleBorder;
}

/** A single conditional formatting rule within a {@link ConditionalFormattingDescriptor}. */
export interface ConditionalFormattingRule {
  /** Rule type (e.g. `'cellIs'`, `'colorScale'`, `'dataBar'`, `'iconSet'`). */
  type: string;
  /** Comparison operator for `cellIs` rules (e.g. `'greaterThan'`, `'between'`). */
  operator?: string;
  /** Formula values used by the rule. */
  formulae?: Array<string | number>;
  /** ExcelJS format descriptor (color, icon set, etc.) applied when the rule matches. */
  format?: Record<string, unknown>;
  /** Priority of the rule (lower number = higher priority). */
  priority?: number;
}

/** Descriptor for a conditional formatting region in an XLSX export. */
export interface ConditionalFormattingDescriptor {
  /** Row range `[startRow, endRow]` (visual indexes). Defaults to the full exported range. */
  rows?: [number, number];
  /** Column range `[startCol, endCol]` (visual indexes). Defaults to the full exported range. */
  cols?: [number, number];
  /** Conditional formatting rules to apply to the region. */
  rules: ConditionalFormattingRule[];
}

/**
 * Options accepted by {@link ExportFile#exportAsString},
 * {@link ExportFile#exportAsBlob}, {@link ExportFile#exportAsBlobAsync},
 * {@link ExportFile#downloadFile}, and {@link ExportFile#downloadFileAsync}.
 */
export interface ExportOptions {
  /** MIME type (e.g. `'text/csv'`). Default depends on format. */
  mimeType?: string;
  /** File extension (e.g. `'csv'`). Default depends on format. */
  fileExtension?: string;
  /** File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date. */
  filename?: string;
  /** Character encoding. Defaults to `'utf-8'`. */
  encoding?: string;
  /** Include BOM signature. Default depends on format. */
  bom?: boolean;
  /** Column delimiter (CSV only). Defaults to `','`. */
  columnDelimiter?: string;
  /** Row delimiter (CSV only). Defaults to `'\r\n'`. */
  rowDelimiter?: string;
  /** Include column headers. */
  colHeaders?: boolean;
  /**
   * @deprecated Use `colHeaders` instead.
   */
  columnHeaders?: boolean;
  /** Include row headers. */
  rowHeaders?: boolean;
  /** Controls how hidden columns are exported. */
  exportHiddenColumns?: boolean | 'hide';
  /** Controls how hidden rows are exported. */
  exportHiddenRows?: boolean | 'hide';
  /** Export cell formulas instead of computed values (XLSX only). */
  exportFormulas?: boolean;
  /** Cell range: `[startRow, startColumn, endRow, endColumn]`. */
  range?: number[];
  /** Sanitize cell values before export (CSV only). */
  sanitizeValues?: boolean | RegExp | ((val: string) => string);
  /** Apply DEFLATE compression. `true` uses level 6; a number 1–9 sets a specific level (XLSX only). */
  compression?: boolean | number;
  /** Conditional formatting rules to apply (XLSX only). */
  conditionalFormatting?: ConditionalFormattingDescriptor[];
  /** Multi-sheet configuration. Each entry defines one worksheet (XLSX only). */
  sheets?: SheetOptions[];
  /** Style for header cells (XLSX only). Pass `null` to disable. */
  headerStyle?: HeaderStyle | null;
  /** ExcelJS engine instance. Overrides the engine from plugin settings for this call. */
  engine?: object;
}

/** Plugin-level settings for the `exportFile` option in {@link GridSettings}. */
export interface ExportFileSettings {
  /** Map of export engines keyed by format name (e.g. `{ xlsx: ExcelJS }`). */
  engines?: Record<string, object>;
}

/** @deprecated Use {@link ExportFileSettings} instead. */
export type Settings = ExportFileSettings;
export const PLUGIN_PRIORITY = 240;

/**
 * Local type-guard narrowing `unknown` to `ExportFileSettings`.
 * `isObject` is intentionally non-narrowing in the public API, so we wrap it here.
 *
 * @param {unknown} v The value to check.
 * @returns {boolean}
 */
function isExportFileSettings(v: unknown): v is ExportFileSettings {
  return isObject(v);
}

/**
 * Type guard returning the user-provided `exportFile` settings when they are an object.
 *
 * @param {unknown} settings Raw value read from `hot.getSettings()[PLUGIN_KEY]`.
 * @returns {ExportFileSettings|undefined}
 */
function getPluginSettings(settings: unknown): ExportFileSettings | undefined {
  return isExportFileSettings(settings) ? settings : undefined;
}

/**
 * @plugin ExportFile
 * @class ExportFile
 *
 * @description
 * The `ExportFile` plugin lets you export table data as a string, blob, or downloadable file.
 *
 * Supported formats:
 * - **CSV** (`'csv'`) — synchronous, no additional setup required.
 * - **XLSX** (`'xlsx'`) — asynchronous (returns a `Promise`). Requires the
 *   [ExcelJS](https://github.com/exceljs/exceljs) library to be passed as the `engine` option
 *   in the plugin settings.
 *
 * See [the export file demo](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md) for examples.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * import ExcelJS from 'exceljs';
 *
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   exportFile: {
 *     engines: { xlsx: ExcelJS },
 *   },
 * });
 *
 * const exportPlugin = hot.getPlugin('exportFile');
 *
 * // CSV — synchronous
 * exportPlugin.exportAsString('csv');
 * exportPlugin.exportAsBlob('csv');
 * exportPlugin.downloadFile('csv', { filename: 'MyFile' });
 *
 * // XLSX — asynchronous
 * const blob = await exportPlugin.exportAsBlobAsync('xlsx');
 * await exportPlugin.downloadFileAsync('xlsx', { filename: 'MyFile' });
 *
 * // CSV with options
 * exportPlugin.exportAsString('csv', {
 *   exportHiddenRows: true,     // default false
 *   exportHiddenColumns: true,  // default false
 *   colHeaders: true,            // default false
 *   rowHeaders: true,           // default false
 *   columnDelimiter: ';',       // default ','
 *   range: [1, 1, 6, 6]         // [startRow, startColumn, endRow, endColumn]
 * });
 *
 * // XLSX with options
 * await exportPlugin.downloadFileAsync('xlsx', {
 *   filename: 'MyFile',
 *   colHeaders: true,
 *   rowHeaders: true,
 *   exportHiddenRows: false,
 *   exportHiddenColumns: false,
 *   range: [0, 0, 9, 4],
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * import ExcelJS from 'exceljs';
 *
 * const hotRef = useRef(null);
 *
 * ...
 *
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   exportFile={{ engines: { xlsx: ExcelJS } }}
 * />
 *
 * const hot = hotRef.current.hotInstance;
 * const exportPlugin = hot.getPlugin('exportFile');
 *
 * // CSV — synchronous
 * exportPlugin.exportAsString('csv');
 * exportPlugin.exportAsBlob('csv');
 * exportPlugin.downloadFile('csv', { filename: 'MyFile' });
 *
 * // XLSX — asynchronous
 * await exportPlugin.downloadFileAsync('xlsx', { filename: 'MyFile' });
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * import ExcelJS from 'exceljs';
 *
 * @Component({
 *   template: `<hot-table [settings]="settings"></hot-table>`,
 * })
 * export class AppComponent {
 *   settings = {
 *     data: getData(),
 *     exportFile: { engines: { xlsx: ExcelJS } },
 *   };
 *
 *   @ViewChild(HotTableComponent) hotTableComponent!: HotTableComponent;
 *
 *   async exportXlsx() {
 *     const hot = this.hotTableComponent.hotInstance;
 *     const exportPlugin = hot.getPlugin('exportFile');
 *
 *     // CSV — synchronous
 *     exportPlugin.exportAsString('csv');
 *     exportPlugin.downloadFile('csv', { filename: 'MyFile' });
 *
 *     // XLSX — asynchronous
 *     await exportPlugin.downloadFileAsync('xlsx', { filename: 'MyFile' });
 *   }
 * }
 * ```
 * :::
 */
export class ExportFile extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ExportFile#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return true;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions', this.#onAfterContextMenuDefaultOptions);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Add export options to the Context Menu.
   *
   * @param {object} options Contains default added options of the Context Menu.
   */
  #onAfterContextMenuDefaultOptions = (rawOptions: unknown) => {
    if (typeof rawOptions !== 'object' || rawOptions === null) {
      return;
    }

    const options = rawOptions as { items: unknown[] };

    options.items.push(
      { name: '---------' },
      exportItem(this),
    );
  };

  /**
   * Exports table data as a string.
   *
   * This method is only supported for text-based formats such as CSV.
   * Calling it with a binary format (e.g. `'xlsx'`) throws an error.
   *
   * @param {string} format Export format type eq. `'csv'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type (e.g. `'text/csv'` for CSV). Default depends on format.
   * @param {string} [options.fileExtension] File extension (e.g. `'csv'`). Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format (e.g. `true` for CSV).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.colHeaders=false] Include column headers in the exported file.
   * @param {boolean} [options.rowHeaders=false] Include row headers in the exported file.
   * @param {boolean|string} [options.exportHiddenColumns=false] Controls how hidden columns are handled. `true` exports them as normal visible columns. `false` omits them entirely. `'hide'` exports them and marks them as hidden in Excel (XLSX only).
   * @param {boolean|string} [options.exportHiddenRows=false] Controls how hidden rows are handled. `true` exports them as normal visible rows. `false` omits them entirely. `'hide'` exports them and marks them as hidden in Excel (XLSX only).
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes).
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Controls the sanitization of cell values (CSV only).
   * @returns {string}
   */
  exportAsString(format: string, options: Record<string, unknown> = {}): string {
    const formatter = this._createTypeFormatter(format, options);

    if (formatter.binary) {
      throwWithCause(`Export format type "${format}" cannot be exported as a string (binary format).`);
    }

    return formatter.export() as string;
  }

  /**
   * Exports table data as a blob object.
   *
   * This method is only supported for text-based formats such as CSV.
   * Calling it with a binary format (e.g. `'xlsx'`) throws an error — use
   * [[ExportFile#exportAsBlobAsync]] instead.
   *
   * @param {string} format Export format type e.g. `'csv'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type. Default depends on format.
   * @param {string} [options.fileExtension] File extension. Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format (e.g. `true` for CSV).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.colHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Sanitization (CSV only).
   * @returns {Blob}
   */
  exportAsBlob(format: string, options: Record<string, unknown> = {}): Blob {
    const formatter = this._createTypeFormatter(format, options);

    if (formatter.binary) {
      throwWithCause(
        `exportAsBlob() does not support binary formats such as "${format}". ` +
        'Use exportAsBlobAsync() instead.'
      );
    }

    return this._createBlob(formatter) as Blob;
  }

  /**
   * Exports table data as a blob object, asynchronously.
   *
   * Supports all export formats. For text-based formats (e.g. `'csv'`),
   * the `Promise` resolves immediately. For binary formats (e.g. `'xlsx'`),
   * the export runs asynchronously.
   *
   * @param {string} format Export format type e.g. `'csv'` or `'xlsx'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type. Default depends on format.
   * @param {string} [options.fileExtension] File extension. Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {string} [options.encoding='utf-8'] Character encoding (text formats only).
   * @param {boolean} [options.bom] Include BOM signature (text formats only).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.colHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Sanitization (CSV only).
   * @param {boolean} [options.exportFormulas=false] Export cell formulas instead of their computed values (XLSX only).
   * @param {boolean|number} [options.compression] Enable DEFLATE compression: `true` uses level 6; a number 1–9 sets a specific level. Omit or pass a falsy value to use no compression (XLSX only).
   * @param {ConditionalFormattingDescriptor[]} [options.conditionalFormatting=[]] Conditional formatting rules to apply to the exported file (XLSX only).
   * @param {SheetOptions[]} [options.sheets=[]] Configuration for multi-sheet export. Each entry defines one worksheet (XLSX only).
   * @returns {Promise<Blob>}
   * @since 17.1.0
   */
  async exportAsBlobAsync(format: string, options: Record<string, unknown> = {}): Promise<Blob> {
    return this._createBlob(this._createTypeFormatter(format, options));
  }

  /**
   * Triggers a synchronous file download for text-based export formats (e.g. `'csv'`).
   *
   * Calling this method with a binary format (e.g. `'xlsx'`) throws an error — use
   * [[ExportFile#downloadFileAsync]] instead.
   *
   * @param {string} format Export format type e.g. `'csv'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type. Default depends on format.
   * @param {string} [options.fileExtension] File extension. Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format.
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.colHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Sanitization (CSV only).
   * @returns {void}
   */
  downloadFile(format: string, options: Record<string, unknown> = {}): void {
    const formatter = this._createTypeFormatter(format, options);

    if (formatter.binary) {
      throwWithCause(
        `downloadFile() does not support binary formats such as "${format}". ` +
        'Use downloadFileAsync() instead.'
      );
    }

    const name = `${formatter.options.filename}.${formatter.options.fileExtension}`;

    this.#triggerDownload(this._createBlob(formatter) as Blob, name);
  }

  /**
   * Triggers an asynchronous file download. Supports all export formats.
   *
   * For text-based formats (e.g. `'csv'`), the download is triggered immediately
   * and the returned `Promise` resolves right away.
   * For binary formats (e.g. `'xlsx'`), the export runs asynchronously. When the
   * `dialog` plugin is enabled, a progress overlay is shown for the duration of the export.
   *
   * @param {string} format Export format type e.g. `'csv'` or `'xlsx'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type. Default depends on format.
   * @param {string} [options.fileExtension] File extension. Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {string} [options.encoding='utf-8'] Character encoding (text formats only).
   * @param {boolean} [options.bom] Include BOM signature (text formats only).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.colHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Sanitization (CSV only).
   * @param {boolean} [options.exportFormulas=false] Export cell formulas instead of their computed values (XLSX only).
   * @param {boolean|number} [options.compression] Enable DEFLATE compression: `true` uses level 6; a number 1–9 sets a specific level. Omit or pass a falsy value to use no compression (XLSX only).
   * @param {ConditionalFormattingDescriptor[]} [options.conditionalFormatting=[]] Conditional formatting rules to apply to the exported file (XLSX only).
   * @param {SheetOptions[]} [options.sheets=[]] Configuration for multi-sheet export. Each entry defines one worksheet (XLSX only).
   * @returns {Promise<void>}
   * @since 17.1.0
   */
  async downloadFileAsync(format: string, options: Record<string, unknown> = {}) {
    const formatter = this._createTypeFormatter(format, options);
    const dialogPlugin = this.hot.getPlugin('dialog');
    const hasDialog = dialogPlugin?.isEnabled();
    const { rootWindow } = this.hot;
    const name = `${formatter.options.filename}.${formatter.options.fileExtension}`;

    const runExport = async() => {
      const blob = await Promise.resolve(this._createBlob(formatter));

      this.#triggerDownload(blob, name);
    };

    if (hasDialog && formatter.binary) {
      dialogPlugin.show({
        content: buildExportDialogContent(this.hot.getTranslatedPhrase(EXPORT_FILE_DIALOG_TITLE)),
        customClassName: LOADING_CLASS_NAME,
        background: 'semi-transparent',
        closable: false,
        animation: false,
      });
      // rAF fires at the START of a frame, before paint. A double-rAF lets the
      // browser complete one full paint cycle (dialog becomes visible) before
      // the export blocks the main thread.
      await new Promise((resolve) => {
        rootWindow.requestAnimationFrame(() => {

          rootWindow.requestAnimationFrame(resolve);
        });
      });

      try {
        await runExport();
      } finally {
        dialogPlugin.hide();
      }

      return;
    }

    await runExport();
  }

  /**
   * Triggers a browser file download for the given blob.
   *
   * @param {Blob} blob The blob to download.
   * @param {string} name The filename (including extension).
   */
  #triggerDownload(blob: Blob, name: string) {
    const { rootDocument, rootWindow } = this.hot;
    const URL = rootWindow.URL || rootWindow.webkitURL;
    const url = URL.createObjectURL(blob);
    const a = rootDocument.createElement('a');

    a.style.display = 'none';
    a.setAttribute('href', url);
    a.setAttribute('download', name);
    rootDocument.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click'));
    rootDocument.body.removeChild(a);

    this.hot._registerTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Returns `true` when the plugin can produce an export in the given format.
   *
   * For text-based formats such as `'csv'`, no extra setup is required and the
   * method always returns `true`.
   * For binary formats such as `'xlsx'`, the method returns `true` only when the
   * corresponding engine has been provided in the plugin's `engines` map.
   *
   * @param {string} format Export format — `'csv'` or `'xlsx'`.
   * @returns {boolean}
   */
  supportsExportFormat(format: string) {
    if (!EXPORT_TYPES[format]) {
      return false;
    }

    if (format === 'xlsx') {
      const settings = getPluginSettings(this.hot.getSettings()[PLUGIN_KEY]);

      return settings !== undefined && isObject(settings.engines) && Boolean(settings.engines.xlsx);
    }

    return true;
  }

  /**
   * Creates and returns a class formatter for the specified export type.
   *
   * The engine for the requested format is looked up from the plugin's `engines`
   * map and merged as a default so that per-call options can override it if needed.
   *
   * @private
   * @param {string} format Export format type eq. `'csv'` or `'xlsx'`.
   * @param {object} options Export options.
   * @returns {BaseType}
   */
  _createTypeFormatter(format: string, options: Record<string, unknown> = {}): BaseType {
    if (!EXPORT_TYPES[format]) {
      throwWithCause(`Export format type "${format}" is not supported.`);
    }

    const pluginSettings = getPluginSettings(this.hot.getSettings()[PLUGIN_KEY]);
    const engines = pluginSettings && isObject(pluginSettings.engines) ? pluginSettings.engines : undefined;
    const engineFromSettings = engines?.[format];
    const mergedOptions = engineFromSettings !== undefined
      ? { engine: engineFromSettings, ...options }
      : options;
    const formatter = typeFactory(format, new DataProvider(this.hot), mergedOptions);

    if (formatter === null) {
      throwWithCause(`Export format type "${format}" is not supported.`);
    }

    return formatter;
  }

  /**
   * Creates a blob object from the provided type formatter.
   *
   * For synchronous formatters (e.g. CSV), returns a `Blob` directly.
   * For asynchronous formatters (e.g. XLSX), returns a `Promise<Blob>`.
   *
   * @private
   * @param {BaseType} typeFormatter The instance of the specific formatter/exporter.
   * @returns {Blob|Promise<Blob>}
   */
  _createBlob(typeFormatter: BaseType): Blob | Promise<Blob> {
    if (typeof Blob === 'undefined') {
      throwWithCause('Blob is not available in this environment.');
    }

    const exported = typeFormatter.export();
    const { mimeType, encoding } = typeFormatter.options as { mimeType?: string; encoding?: string };

    if (exported instanceof Promise) {
      return exported.then(buffer => new Blob([buffer as BlobPart], { type: mimeType }));
    }

    return new Blob([exported], { type: `${mimeType};charset=${encoding}` });
  }
}
