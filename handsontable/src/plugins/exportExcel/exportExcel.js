import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { clone, extend } from '../../helpers/object';
import { substitute } from '../../helpers/string';
import DataProvider from '../exportFile/dataProvider';
import { createWorkbook } from './workbookBuilder';

export const PLUGIN_KEY = 'exportExcel';
export const PLUGIN_PRIORITY = 245;

const DEFAULT_OPTIONS = {
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileExtension: 'xlsx',
  filename: 'Handsontable [YYYY]-[MM]-[DD]',
  sheetName: 'Sheet1',
  columnHeaders: false,
  rowHeaders: false,
  exportHiddenColumns: false,
  exportHiddenRows: false,
  formulas: false,
  range: [],
};

/**
 * @plugin ExportExcel
 * @class ExportExcel
 *
 * @description
 * The `ExportExcel` plugin lets you export table data as an XLSX file.
 * The plugin expects the `exceljs` dependency to be injected through the `exportExcel` setting.
 *
 * @example
 * ```js
 * import ExcelJS from 'exceljs';
 *
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   exportExcel: {
 *     exceljs: ExcelJS,
 *   },
 * });
 *
 * const exportPlugin = hot.getPlugin('exportExcel');
 *
 * await exportPlugin.downloadFile({
 *   filename: 'report',
 *   columnHeaders: true,
 *   rowHeaders: true,
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
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ExportExcel#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Exports table data to an XLSX buffer.
   *
   * @param {object} options Export options.
   * @param {string} [options.mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] MIME type.
   * @param {string} [options.fileExtension='xlsx'] File extension.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name with date placeholders.
   * @param {string} [options.sheetName='Sheet1'] Worksheet name.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows.
   * @param {boolean} [options.formulas=false] Export formula-like values as formulas.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]`.
   * @returns {Promise<ArrayBuffer>}
   */
  async exportAsBuffer(options = {}) {
    const { workbook } = this._createWorkbook(options);

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Exports table data to an XLSX blob.
   *
   * @param {object} options Export options.
   * @returns {Promise<Blob>}
   */
  async exportAsBlob(options = {}) {
    const { workbook, options: mergedOptions } = this._createWorkbook(options);
    const buffer = await workbook.xlsx.writeBuffer();

    return this._createBlob(buffer, mergedOptions.mimeType);
  }

  /**
   * Exports table data as a downloadable XLSX file.
   *
   * @param {object} options Export options.
   * @returns {Promise<void>}
   */
  async downloadFile(options = {}) {
    const { rootDocument, rootWindow } = this.hot;
    const { workbook, options: mergedOptions } = this._createWorkbook(options);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = this._createBlob(buffer, mergedOptions.mimeType);
    const URL = (rootWindow.URL || rootWindow.webkitURL);
    const a = rootDocument.createElement('a');
    const name = `${mergedOptions.filename}.${mergedOptions.fileExtension}`;

    if (a.download !== undefined) {
      const url = URL.createObjectURL(blob);

      a.style.display = 'none';
      a.setAttribute('href', url);
      a.setAttribute('download', name);
      rootDocument.body.appendChild(a);
      a.dispatchEvent(new rootWindow.MouseEvent('click'));
      rootDocument.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

    } else if (rootWindow.navigator.msSaveOrOpenBlob) {
      rootWindow.navigator.msSaveOrOpenBlob(blob, name);
    }
  }

  /**
   * Create workbook from table data.
   *
   * @private
   * @param {object} options Export options.
   * @returns {{workbook: object, options: object}}
   */
  _createWorkbook(options = {}) {
    const exceljs = this._getExcelJSDependency();
    const mergedOptions = this._mergeOptions(options);
    const dataProvider = new DataProvider(this.hot);

    dataProvider.setOptions(mergedOptions);

    return {
      workbook: createWorkbook(exceljs, {
        sheetName: mergedOptions.sheetName,
        data: dataProvider.getData(),
        rowHeaders: dataProvider.getRowHeaders(),
        columnHeaders: dataProvider.getColumnHeaders(),
        formulas: mergedOptions.formulas,
      }),
      options: mergedOptions,
    };
  }

  /**
   * Merges options with defaults.
   *
   * @private
   * @param {object} options User options.
   * @returns {object}
   */
  _mergeOptions(options = {}) {
    const date = new Date();
    let mergedOptions = clone(DEFAULT_OPTIONS);

    mergedOptions = extend(mergedOptions, options);

    if (!Array.isArray(options.range) || options.range.length === 0) {
      const selectedRange = this.hot.getSelectedRangeLast();

      if (selectedRange) {
        const from = selectedRange.getTopStartCorner();
        const to = selectedRange.getBottomEndCorner();

        mergedOptions.range = [from.row, from.col, to.row, to.col];
      }
    }

    mergedOptions.filename = substitute(mergedOptions.filename, {
      YYYY: date.getFullYear(),
      MM: (`${date.getMonth() + 1}`).padStart(2, '0'),
      DD: (`${date.getDate()}`).padStart(2, '0'),
    });

    return mergedOptions;
  }

  /**
   * Returns ExcelJS dependency from plugin settings.
   *
   * @private
   * @returns {object}
   */
  _getExcelJSDependency() {
    const settings = this.hot.getSettings()[PLUGIN_KEY];
    const exceljs = settings?.exceljs;

    if (!exceljs || typeof exceljs.Workbook !== 'function') {
      throwWithCause('Missing required `exceljs` dependency in the `exportExcel` settings.');
    }

    return exceljs;
  }

  /**
   * Create blob from xlsx buffer.
   *
   * @private
   * @param {ArrayBuffer} buffer Workbook buffer.
   * @param {string} mimeType Blob MIME type.
   * @returns {Blob}
   */
  _createBlob(buffer, mimeType) {
    let formatter = null;

    if (typeof Blob !== 'undefined') {
      formatter = new Blob([buffer], {
        type: mimeType,
      });
    }

    return formatter;
  }
}
