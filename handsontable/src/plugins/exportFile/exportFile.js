import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
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
 *   range: [1, 1, 6, 6]         // [startRow, startColumn, endRow, endColumn]
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
 *   range: [1, 1, 6, 6]         // [startRow, startColumn, endRow, endColumn]
 * });
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * import { AfterViewInit, Component, ViewChild } from "@angular/core";
 * import {
 *   GridSettings,
 *   HotTableModule,
 *   HotTableComponent,
 * } from "@handsontable/angular-wrapper";
 *
 * `@Component`({
 *   selector: "app-example",
 *   standalone: true,
 *   imports: [HotTableModule],
 *   template: ` <div>
 *     <hot-table [settings]="gridSettings" />
 *   </div>`,
 * })
 * export class ExampleComponent implements AfterViewInit {
 *   `@ViewChild`(HotTableComponent, { static: false })
 *   readonly hotTable!: HotTableComponent;
 *
 *   readonly gridSettings = <GridSettings>{
 *     data: this.getData(),
 *   };
 *
 *   ngAfterViewInit(): void {
 *     // Access to plugin instance:
 *     const hot = this.hotTable.hotInstance;
 *     // Access to exportFile plugin instance
 *     const exportPlugin = hot.getPlugin("exportFile");
 *
 *     // Export as a string
 *     exportPlugin.exportAsString("csv");
 *
 *     // Export as a blob object
 *     exportPlugin.exportAsBlob("csv");
 *
 *     // Export to downloadable file (named: MyFile.csv)
 *     exportPlugin.downloadFile("csv", { filename: "MyFile" });
 *
 *     // Export as a string (with specified data range):
 *     exportPlugin.exportAsString("csv", {
 *       exportHiddenRows: true, // default false
 *       exportHiddenColumns: true, // default false
 *       columnHeaders: true, // default false
 *       rowHeaders: true, // default false
 *       columnDelimiter: ";", // default ','
 *       range: [1, 1, 6, 6], // [startRow, startColumn, endRow, endColumn]
 *     });
 *   }
 *
 *   private getData(): any[] {
 *     // get some data
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
   * @param {string} format Export format type eq. `'csv'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type (e.g. `'text/csv'` for CSV). Default depends on format.
   * @param {string} [options.fileExtension] File extension (e.g. `'csv'`). Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format (e.g. `true` for CSV).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV).
   * @param {boolean} [options.columnHeaders=false] Include column headers in the exported file.
   * @param {boolean} [options.rowHeaders=false] Include row headers in the exported file.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns in the exported file.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows in the exported file.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes).
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Controls the sanitization of cell values (e.g. CSV injection).
   * @returns {string}
   */
  exportAsString(format, options = {}) {
    return this._createTypeFormatter(format, options).export();
  }

  /**
   * Exports table data as a blob object.
   *
   * @param {string} format Export format type eq. `'csv'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type (e.g. `'text/csv'` for CSV). Default depends on format.
   * @param {string} [options.fileExtension] File extension (e.g. `'csv'`). Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format (e.g. `true` for CSV).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV).
   * @param {boolean} [options.columnHeaders=false] Include column headers in the exported file.
   * @param {boolean} [options.rowHeaders=false] Include row headers in the exported file.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns in the exported file.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows in the exported file.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes).
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Controls the sanitization of cell values (e.g. CSV injection).
   * @returns {Blob}
   */
  exportAsBlob(format, options = {}) {
    return this._createBlob(this._createTypeFormatter(format, options));
  }

  /**
   * Exports table data as a downloadable file.
   *
   * @param {string} format Export format type eg. `'csv'`.
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type (e.g. `'text/csv'` for CSV). Default depends on format.
   * @param {string} [options.fileExtension] File extension (e.g. `'csv'`). Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format (e.g. `true` for CSV).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV).
   * @param {boolean} [options.columnHeaders=false] Include column headers in the exported file.
   * @param {boolean} [options.rowHeaders=false] Include row headers in the exported file.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns in the exported file.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows in the exported file.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes).
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Controls the sanitization of cell values (e.g. CSV injection).
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
   * @param {object} options Export options.
   * @param {string} [options.mimeType] MIME type (e.g. `'text/csv'` for CSV). Default depends on format.
   * @param {string} [options.fileExtension] File extension (e.g. `'csv'`). Default depends on format.
   * @param {string} [options.filename='Handsontable [YYYY]-[MM]-[DD]'] File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date.
   * @param {string} [options.encoding='utf-8'] Character encoding.
   * @param {boolean} [options.bom] Include BOM signature. Default depends on format (e.g. `true` for CSV).
   * @param {string} [options.columnDelimiter=','] Column delimiter (CSV).
   * @param {string} [options.rowDelimiter='\r\n'] Row delimiter (CSV).
   * @param {boolean} [options.columnHeaders=false] Include column headers in the exported file.
   * @param {boolean} [options.rowHeaders=false] Include row headers in the exported file.
   * @param {boolean} [options.exportHiddenColumns=false] Include hidden columns in the exported file.
   * @param {boolean} [options.exportHiddenRows=false] Include hidden rows in the exported file.
   * @param {number[]} [options.range=[]] Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes).
   * @param {boolean|RegExp|Function} [options.sanitizeValues=false] Controls the sanitization of cell values (e.g. CSV injection).
   * @returns {BaseType}
   */
  _createTypeFormatter(format, options = {}) {
    if (!EXPORT_TYPES[format]) {
      throwWithCause(`Export format type "${format}" is not supported.`);
    }

    return typeFactory(format, new DataProvider(this.hot), options);
  }

  /**
   * Creates blob object based on provided type formatter class.
   *
   * @private
   * @param {BaseType} typeFormatter The instance of the specific formatter/exporter.
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
