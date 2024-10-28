import { BasePlugin } from '../base';
import DataProvider from './dataProvider';
import typeFactory, { EXPORT_TYPES } from './typeFactory';

export const PLUGIN_KEY = 'exportFile';
export const PLUGIN_PRIORITY = 240;

/**
 * @plugin ExportFile
 * @class ExportFile
 *
 * @description
 * The `ExportFile` plugin lets you export table data as a string, blob, or downloadable CSV file.
 *
 * See [the export file demo](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md) for examples.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData()
 * });
 *
 * // access to exportFile plugin instance
 * const exportPlugin = hot.getPlugin('exportFile');
 *
 * // export as a string
 * exportPlugin.exportAsString('csv');
 *
 * // export as a blob object
 * exportPlugin.exportAsBlob('csv');
 *
 * // export to downloadable file (named: MyFile.csv)
 * exportPlugin.downloadFile('csv', {filename: 'MyFile'});
 *
 * // export as a string (with specified data range):
 * exportPlugin.exportAsString('csv', {
 *   exportHiddenRows: true,     // default false
 *   exportHiddenColumns: true,  // default false
 *   columnHeaders: true,        // default false
 *   rowHeaders: true,           // default false
 *   columnDelimiter: ';',       // default ','
 *   range: [1, 1, 6, 6]         // [startRow, endRow, startColumn, endColumn]
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * ...
 *
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 * />
 *
 * const hot = hotRef.current.hotInstance;
 * // access to exportFile plugin instance
 * const exportPlugin = hot.getPlugin('exportFile');
 *
 * // export as a string
 * exportPlugin.exportAsString('csv');
 *
 * // export as a blob object
 * exportPlugin.exportAsBlob('csv');
 *
 * // export to downloadable file (named: MyFile.csv)
 * exportPlugin.downloadFile('csv', {filename: 'MyFile'});
 *
 * // export as a string (with specified data range):
 * exportPlugin.exportAsString('csv', {
 *   exportHiddenRows: true,     // default false
 *   exportHiddenColumns: true,  // default false
 *   columnHeaders: true,        // default false
 *   rowHeaders: true,           // default false
 *   columnDelimiter: ';',       // default ','
 *   range: [1, 1, 6, 6]         // [startRow, endRow, startColumn, endColumn]
 * });
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
   * @typedef ExportOptions
   * @memberof ExportFile
   * @type {object}
   * @property {boolean} [exportHiddenRows=false] Include hidden rows in the exported file.
   * @property {boolean} [exportHiddenColumns=false] Include hidden columns in the exported file.
   * @property {boolean} [columnHeaders=false] Include column headers in the exported file.
   * @property {boolean} [rowHeaders=false] Include row headers in the exported file.
   * @property {string} [columnDelimiter=','] Column delimiter.
   * @property {string} [range=[]] Cell range that will be exported to file.
   */

  /**
   * Exports table data as a string.
   *
   * @param {string} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
   * @returns {string}
   */
  exportAsString(format, options = {}) {
    return this._createTypeFormatter(format, options).export();
  }

  /**
   * Exports table data as a blob object.
   *
   * @param {string} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
   * @returns {Blob}
   */
  exportAsBlob(format, options = {}) {
    return this._createBlob(this._createTypeFormatter(format, options));
  }

  /**
   * Exports table data as a downloadable file.
   *
   * @param {string} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
   */
  downloadFile(format, options = {}) {
    const { rootDocument, rootWindow } = this.hot;
    const formatter = this._createTypeFormatter(format, options);
    const blob = this._createBlob(formatter);
    const URL = (rootWindow.URL || rootWindow.webkitURL);

    const a = rootDocument.createElement('a');
    const name = `${formatter.options.filename}.${formatter.options.fileExtension}`;

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
  }

  /**
   * Creates and returns class formatter for specified export type.
   *
   * @private
   * @param {string} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
   * @returns {BaseType}
   */
  _createTypeFormatter(format, options = {}) {
    if (!EXPORT_TYPES[format]) {
      throw new Error(`Export format type "${format}" is not supported.`);
    }

    return typeFactory(format, new DataProvider(this.hot), options);
  }

  /**
   * Creates blob object based on provided type formatter class.
   *
   * @private
   * @param {BaseType} typeFormatter The instance of the specyfic formatter/exporter.
   * @returns {Blob}
   */
  _createBlob(typeFormatter) {
    let formatter = null;

    if (typeof Blob !== 'undefined') {
      formatter = new Blob([typeFormatter.export()], {
        type: `${typeFormatter.options.mimeType};charset=${typeFormatter.options.encoding}`,
      });
    }

    return formatter;
  }
}
