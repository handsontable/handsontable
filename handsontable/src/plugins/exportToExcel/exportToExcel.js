import { BasePlugin } from '../base';
import { DataCollector } from './dataCollector';
import { XlsxGenerator } from './xlsxGenerator';
import { Hooks } from '../../core/hooks';
import { extend, clone } from '../../helpers/object';
import { substitute } from '../../helpers/string';

Hooks.getSingleton().register('beforeExportToExcel');
Hooks.getSingleton().register('afterExportToExcel');

export const PLUGIN_KEY = 'exportToExcel';
export const PLUGIN_PRIORITY = 245;

/**
 * Default export options.
 *
 * @type {object}
 */
const DEFAULT_OPTIONS = {
  filename: 'Handsontable [YYYY]-[MM]-[DD]',
  sheetName: 'Sheet1',
  columnHeaders: false,
  rowHeaders: false,
  exportHiddenColumns: true,
  exportHiddenRows: true,
  range: [],
};

/**
 * @plugin ExportToExcel
 * @class ExportToExcel
 *
 * @description
 * The `ExportToExcel` plugin exports table content – including data, styling, merged cells,
 * column widths, frozen panes, and data validations – to an `.xlsx` file
 * (Office Open XML SpreadsheetML format).
 *
 * The plugin is always enabled and exposes its functionality through the API.
 * You do not need to set any configuration option to use it.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 * });
 *
 * const exportPlugin = hot.getPlugin('exportToExcel');
 *
 * // download as .xlsx file
 * exportPlugin.downloadFile({ filename: 'MyFile' });
 *
 * // export as a Blob
 * const blob = exportPlugin.exportAsBlob({ columnHeaders: true });
 *
 * // export with options
 * exportPlugin.downloadFile({
 *   filename: 'Report',
 *   sheetName: 'Data',
 *   columnHeaders: true,
 *   rowHeaders: true,
 *   exportHiddenRows: false,
 *   exportHiddenColumns: false,
 *   range: [0, 0, 9, 4],
 * });
 *
 * // add "Export to Excel" to the context menu
 * const hot = new Handsontable(container, {
 *   contextMenu: {
 *     items: {
 *       exportToExcel: {
 *         name: 'Export to Excel',
 *         callback() {
 *           hot.getPlugin('exportToExcel').downloadFile();
 *         },
 *       },
 *     },
 *   },
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
 * const exportPlugin = hot.getPlugin('exportToExcel');
 *
 * // download as .xlsx file
 * exportPlugin.downloadFile({ filename: 'MyFile' });
 *
 * // export as a Blob
 * const blob = exportPlugin.exportAsBlob({ columnHeaders: true });
 * ```
 * :::
 */
export class ExportToExcel extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Checks if the plugin is enabled in the Handsontable settings. This method is executed in
   * {@link Hooks#beforeInit} hook and if it returns `true` then the
   * {@link ExportToExcel#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Export the table data as a downloadable `.xlsx` file.
   *
   * Fires the `beforeExportToExcel` hook before the export starts. Return `false` from the
   * hook callback to cancel the export.
   *
   * Fires the `afterExportToExcel` hook after the export completes with the generated `Blob`.
   *
   * @param {object} [options] Export options.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name without extension. Supports `[YYYY]`, `[MM]`, `[DD]` placeholders.
   * @param {string} [options.sheetName='Sheet1'] The name of the worksheet in the exported file.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenRows=true] Include hidden rows.
   * @param {boolean} [options.exportHiddenColumns=true] Include hidden columns.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startCol, endRow, endCol]` (visual indexes).
   *
   * @fires Hooks#beforeExportToExcel
   * @fires Hooks#afterExportToExcel
   */
  downloadFile(options = {}) {
    const mergedOptions = this.#mergeOptions(options);
    const hookResult = this.hot.runHooks('beforeExportToExcel', mergedOptions);

    if (hookResult === false) {
      return;
    }

    const blob = this.#generateBlob(mergedOptions);
    const { rootDocument, rootWindow } = this.hot;
    const URL = rootWindow.URL || rootWindow.webkitURL;
    const filename = `${mergedOptions.filename}.xlsx`;

    const a = rootDocument.createElement('a');

    if (a.download !== undefined) {
      const url = URL.createObjectURL(blob);

      a.style.display = 'none';
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      rootDocument.body.appendChild(a);
      a.dispatchEvent(new MouseEvent('click'));
      rootDocument.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    }

    this.hot.runHooks('afterExportToExcel', blob, mergedOptions);
  }

  /**
   * Export the table data as a `Blob` object containing the `.xlsx` file.
   *
   * @param {object} [options] Export options. See {@link ExportToExcel#downloadFile} for details.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name without extension.
   * @param {string} [options.sheetName='Sheet1'] The name of the worksheet.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenRows=true] Include hidden rows.
   * @param {boolean} [options.exportHiddenColumns=true] Include hidden columns.
   * @param {number[]} [options.range=[]] Cell range to export.
   * @returns {Blob}
   */
  exportAsBlob(options = {}) {
    const mergedOptions = this.#mergeOptions(options);

    return this.#generateBlob(mergedOptions);
  }

  /**
   * Export the table data as a `Uint8Array` containing the raw `.xlsx` bytes.
   *
   * @param {object} [options] Export options. See {@link ExportToExcel#downloadFile} for details.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name without extension.
   * @param {string} [options.sheetName='Sheet1'] The name of the worksheet.
   * @param {boolean} [options.columnHeaders=false] Include column headers.
   * @param {boolean} [options.rowHeaders=false] Include row headers.
   * @param {boolean} [options.exportHiddenRows=true] Include hidden rows.
   * @param {boolean} [options.exportHiddenColumns=true] Include hidden columns.
   * @param {number[]} [options.range=[]] Cell range to export.
   * @returns {Uint8Array}
   */
  exportAsUint8Array(options = {}) {
    const mergedOptions = this.#mergeOptions(options);
    const collector = new DataCollector(this.hot, mergedOptions);
    const data = collector.collect();
    const generator = new XlsxGenerator(data, mergedOptions);

    return generator.generate();
  }

  /**
   * Generate a Blob from the collected data.
   *
   * @param {object} options Merged export options.
   * @returns {Blob}
   */
  #generateBlob(options) {
    const collector = new DataCollector(this.hot, options);
    const data = collector.collect();
    const generator = new XlsxGenerator(data, options);
    const bytes = generator.generate();

    return new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Merge user options with defaults and resolve date placeholders.
   *
   * @param {object} options User-provided options.
   * @returns {object}
   */
  #mergeOptions(options) {
    const merged = extend(clone(DEFAULT_OPTIONS), options);
    const date = new Date();

    merged.filename = substitute(merged.filename, {
      YYYY: date.getFullYear(),
      MM: (`${date.getMonth() + 1}`).padStart(2, '0'),
      DD: (`${date.getDate()}`).padStart(2, '0'),
    });

    return merged;
  }

}
