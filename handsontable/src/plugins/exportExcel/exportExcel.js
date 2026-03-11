import { BasePlugin } from '../base';
import DataProvider from './dataProvider';
import Xlsx from './types/xlsx';

export const PLUGIN_KEY = 'exportExcel';
export const PLUGIN_PRIORITY = 241;

/**
 * @plugin ExportExcel
 * @class ExportExcel
 *
 * @description
 * The `ExportExcel` plugin lets you export table data as an XLSX blob or downloadable XLSX file.
 *
 * @example
 * ```js
 * const exportExcel = hot.getPlugin('exportExcel');
 *
 * exportExcel.downloadFile({
 *   filename: 'MyFile',
 *   columnHeaders: true,
 *   rowHeaders: true,
 *   formulas: true,
 * });
 * ```
 */
export class ExportExcel extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Checks if the plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Exports table data as a byte string.
   *
   * @param {object} options Export options.
   * @param {string} [options.mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] MIME type.
   * @param {string} [options.fileExtension='xlsx'] File extension.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean} [options.formulas=false] Export formulas instead of calculated values.
   * @param {string} [options.sheetName='Sheet1'] Sheet name.
   * @returns {string}
   */
  exportAsString(options = {}) {
    const bytes = this._createFormatter(options).export();
    let output = '';

    for (let i = 0; i < bytes.length; i += 1) {
      output += String.fromCharCode(bytes[i]);
    }

    return output;
  }

  /**
   * Exports table data as a blob object.
   *
   * @param {object} options Export options.
   * @param {string} [options.mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] MIME type.
   * @param {string} [options.fileExtension='xlsx'] File extension.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean} [options.formulas=false] Export formulas instead of calculated values.
   * @param {string} [options.sheetName='Sheet1'] Sheet name.
   * @returns {Blob}
   */
  exportAsBlob(options = {}) {
    return this._createBlob(this._createFormatter(options));
  }

  /**
   * Exports table data as a downloadable XLSX file.
   *
   * @param {object} options Export options.
   * @param {string} [options.mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] MIME type.
   * @param {string} [options.fileExtension='xlsx'] File extension.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]`.
   * @param {boolean} [options.formulas=false] Export formulas instead of calculated values.
   * @param {string} [options.sheetName='Sheet1'] Sheet name.
   */
  downloadFile(options = {}) {
    const { rootDocument, rootWindow } = this.hot;
    const formatter = this._createFormatter(options);
    const blob = this._createBlob(formatter);
    const URL = (rootWindow.URL || rootWindow.webkitURL);
    const link = rootDocument.createElement('a');
    const name = `${formatter.options.filename}.${formatter.options.fileExtension}`;

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);

      link.style.display = 'none';
      link.setAttribute('href', url);
      link.setAttribute('download', name);
      rootDocument.body.appendChild(link);
      link.dispatchEvent(new MouseEvent('click'));
      rootDocument.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } else if (rootWindow.navigator.msSaveOrOpenBlob) {
      rootWindow.navigator.msSaveOrOpenBlob(blob, name);
    }
  }

  /**
   * Creates and returns XLSX formatter.
   *
   * @private
   * @param {object} options Export options.
   * @returns {Xlsx}
   */
  _createFormatter(options = {}) {
    return new Xlsx(new DataProvider(this.hot), options);
  }

  /**
   * Creates a blob based on provided formatter.
   *
   * @private
   * @param {Xlsx} formatter XLSX formatter.
   * @returns {Blob}
   */
  _createBlob(formatter) {
    let blob = null;

    if (typeof Blob !== 'undefined') {
      blob = new Blob([formatter.export()], {
        type: formatter.options.mimeType,
      });
    }

    return blob;
  }
}
