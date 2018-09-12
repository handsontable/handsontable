import BasePlugin from 'handsontable/plugins/_base';
import { registerPlugin } from 'handsontable/plugins';
import DataProvider from './dataProvider';
import typeFactory, { EXPORT_TYPES } from './typeFactory';

/**
 * @plugin ExportFile
 * @pro
 *
 * @description
 * The plugin enables exporting table data to file. It allows to export data as a string, blob or a downloadable file in
 * CSV format.
 *
 * See [the export file demo](https://docs.handsontable.com/demo-export-file.html) for examples.
 *
 * @example
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
 */
class ExportFile extends BasePlugin {
  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ExportFile#enablePlugin} method is called.
   *
   * @returns {Boolean}
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
   * @param {String} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
  */
  exportAsString(format, options = {}) {
    return this._createTypeFormatter(format, options).export();
  }

  /**
   * Exports table data as a blob object.
   *
   * @param {String} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
  */
  exportAsBlob(format, options = {}) {
    return this._createBlob(this._createTypeFormatter(format, options));
  }

  /**
   * Exports table data as a downloadable file.
   *
   * @param {String} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
   */
  downloadFile(format, options = {}) {
    const formatter = this._createTypeFormatter(format, options);
    const blob = this._createBlob(formatter);
    const URL = (window.URL || window.webkitURL);

    const a = document.createElement('a');
    const name = `${formatter.options.filename}.${formatter.options.fileExtension}`;

    if (a.download !== void 0) {
      const url = URL.createObjectURL(blob);

      a.style.display = 'none';
      a.setAttribute('href', url);
      a.setAttribute('download', name);
      document.body.appendChild(a);
      a.dispatchEvent(new MouseEvent('click'));
      document.body.removeChild(a);

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
   * @param {String} format Export format type eq. `'csv'`.
   * @param {ExportOptions} options Export options.
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
   * @param {BaseType} typeFormatter
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

registerPlugin('exportFile', ExportFile);

export default ExportFile;
