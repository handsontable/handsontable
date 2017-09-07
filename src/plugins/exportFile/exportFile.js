import BasePlugin from 'handsontable/plugins/_base';
import {objectEach, extend, clone} from 'handsontable/helpers/object';
import {registerPlugin} from 'handsontable/plugins';
import DataProvider from './dataProvider';
import typeFactory, {EXPORT_TYPES} from './typeFactory';

/**
 * @plugin ExportFile
 * @pro
 *
 * @example
 *
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   data: getData()
 * });
 * // Access to exportFile plugin instance:
 * var exportPlugin = hot.getPlugin('exportFile');
 *
 * // Export as a string:
 * exportPlugin.exportAsString('csv');
 *
 * // Export as a Blob object:
 * exportPlugin.exportAsBlob('csv');
 *
 * // Export to downloadable file (MyFile.csv):
 * exportPlugin.downloadFile('csv', {filename: 'MyFile'});
 *
 * // Export as a string (specified data range):
 * exportPlugin.exportAsString('csv', {
 *   exportHiddenRows: true,     // default false
 *   exportHiddenColumns: true,  // default false
 *   columnHeaders: true,        // default false
 *   rowHeaders: true,           // default false
 *   columnDelimiter: ';',       // default ','
 *   range: [1, 1, 6, 6]         // [startRow, endRow, startColumn, endColumn]
 * });
 * ...
 * ```
 */
class ExportFile extends BasePlugin {
  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Export table data as a string.
   *
   * @param {String} format Export format type eq. `'csv'`.
   * @param {Object} options see ExportFile.DEFAULT_OPTIONS for available export options.
  */
  exportAsString(format, options = {}) {
    return this._createTypeFormatter(format, options).export();
  }

  /**
   * Export table data as a blob object.
   *
   * @param {String} format Export format type eq. `'csv'`.
   * @param {Object} options see ExportFile.DEFAULT_OPTIONS for available export options.
  */
  exportAsBlob(format, options = {}) {
    return this._createBlob(this._createTypeFormatter(format, options));
  }

  /**
   * Export table data as a downloadable file.
   *
   * @param {String} format Export format type eq. `'csv'`.
   * @param {Object} options see ExportFile.DEFAULT_OPTIONS for available export options.
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

      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 100);

    } else if (navigator.msSaveOrOpenBlob) { // IE10+
      navigator.msSaveOrOpenBlob(blob, name);
    }
  }

  /**
   * Create and return class formatter for specified export type.
   *
   * @private
   * @param {String} format Export format type eq. `'csv'`.
   * @param {Object} options see ExportFile.DEFAULT_OPTIONS for available export options.
   */
  _createTypeFormatter(format, options = {}) {
    if (!EXPORT_TYPES[format]) {
      throw new Error(`Export format type "${format}" is not supported.`);
    }

    return typeFactory(format, new DataProvider(this.hot), options);
  }

  /**
   * Create blob object based on provided type formatter class.
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
