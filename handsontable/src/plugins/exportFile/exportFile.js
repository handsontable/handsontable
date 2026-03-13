import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { isObject } from '../../helpers/object';
import DataProvider from './dataProvider';
import typeFactory, { EXPORT_TYPES } from './typeFactory';

export const PLUGIN_KEY = 'exportFile';
export const PLUGIN_PRIORITY = 240;

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
 *     engine: ExcelJS,
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
 * const blob = await exportPlugin.exportAsBlob('xlsx');
 * await exportPlugin.downloadFile('xlsx', { filename: 'MyFile' });
 *
 * // CSV with options
 * exportPlugin.exportAsString('csv', {
 *   exportHiddenRows: true,     // default false
 *   exportHiddenColumns: true,  // default false
 *   columnHeaders: true,        // default false
 *   rowHeaders: true,           // default false
 *   columnDelimiter: ';',       // default ','
 *   range: [1, 1, 6, 6]         // [startRow, startColumn, endRow, endColumn]
 * });
 *
 * // XLSX with options
 * await exportPlugin.downloadFile('xlsx', {
 *   filename: 'MyFile',
 *   columnHeaders: true,
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
 *   exportFile={{ engine: ExcelJS }}
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
 * await exportPlugin.downloadFile('xlsx', { filename: 'MyFile' });
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

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ExportFile#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

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
   * @param {boolean} [options.columnHeaders=false] Include column headers in the exported file.
   * @param {boolean} [options.rowHeaders=false] Include row headers in the exported file.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns in the exported file.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows in the exported file.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes).
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Controls the sanitization of cell values (CSV only).
   * @returns {string}
   */
  exportAsString(format, options = {}) {
    const formatter = this._createTypeFormatter(format, options);

    if (formatter.constructor.BINARY) {
      throwWithCause(`Export format type "${format}" cannot be exported as a string (binary format).`);
    }

    return formatter.export();
  }

  /**
   * Exports table data as a blob object.
   *
   * For text-based formats (e.g. `'csv'`), returns a `Blob` synchronously.
   * For binary formats (e.g. `'xlsx'`), returns a `Promise<Blob>`.
   *
   * @param {string} format Export format type eq. `'csv'` or `'xlsx'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type. Default depends on format.
   * @param {string} [options.fileExtension] File extension. Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {string} [options.encoding='utf-8'] Character encoding (text formats only).
   * @param {boolean} [options.bom] Include BOM signature (text formats only).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Sanitization (CSV only).
   * @returns {Blob|Promise<Blob>}
   */
  exportAsBlob(format, options = {}) {
    return this._createBlob(this._createTypeFormatter(format, options));
  }

  /**
   * Exports table data as a downloadable file.
   *
   * For text-based formats (e.g. `'csv'`), triggers the download synchronously.
   * For binary formats (e.g. `'xlsx'`), returns a `Promise` that resolves once
   * the download has been triggered.
   *
   * @param {string} format Export format type eg. `'csv'` or `'xlsx'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type. Default depends on format.
   * @param {string} [options.fileExtension] File extension. Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {string} [options.encoding='utf-8'] Character encoding (text formats only).
   * @param {boolean} [options.bom] Include BOM signature (text formats only).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV only).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV only).
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Sanitization (CSV only).
   * @returns {void|Promise<void>}
   */
  downloadFile(format, options = {}) {
    const { rootDocument, rootWindow } = this.hot;
    const formatter = this._createTypeFormatter(format, options);
    const blobOrPromise = this._createBlob(formatter);
    const name = `${formatter.options.filename}.${formatter.options.fileExtension}`;
    const URL = (rootWindow.URL || rootWindow.webkitURL);

    const triggerDownload = (blob) => {
      const a = rootDocument.createElement('a');

      if (a.download !== undefined) {
        const url = URL.createObjectURL(blob);

        a.style.display = 'none';
        a.setAttribute('href', url);
        a.setAttribute('download', name);
        rootDocument.body.appendChild(a);
        a.dispatchEvent(new MouseEvent('click'));
        rootDocument.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

      } else if (navigator.msSaveOrOpenBlob) { // IE10+
        navigator.msSaveOrOpenBlob(blob, name);
      }
    };

    if (blobOrPromise instanceof Promise) {
      return blobOrPromise.then(blob => triggerDownload(blob));
    }

    triggerDownload(blobOrPromise);
  }

  /**
   * Creates and returns a class formatter for the specified export type.
   *
   * The `engine` option from the plugin's global settings is merged as a default
   * so that per-call options can override it if needed.
   *
   * @private
   * @param {string} format Export format type eq. `'csv'` or `'xlsx'`.
   * @param {object} options Export options.
   * @returns {BaseType}
   */
  _createTypeFormatter(format, options = {}) {
    if (!EXPORT_TYPES[format]) {
      throwWithCause(`Export format type "${format}" is not supported.`);
    }

    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];
    const engineFromSettings = isObject(pluginSettings) ? pluginSettings.engine : undefined;
    const mergedOptions = engineFromSettings !== undefined
      ? { engine: engineFromSettings, ...options }
      : options;

    return typeFactory(format, new DataProvider(this.hot), mergedOptions);
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
  _createBlob(typeFormatter) {
    if (typeof Blob === 'undefined') {
      return null;
    }

    const exported = typeFormatter.export();

    if (exported instanceof Promise) {
      return exported.then(buffer => new Blob([buffer], {
        type: typeFormatter.options.mimeType,
      }));
    }

    return new Blob([exported], {
      type: `${typeFormatter.options.mimeType};charset=${typeFormatter.options.encoding}`,
    });
  }
}
