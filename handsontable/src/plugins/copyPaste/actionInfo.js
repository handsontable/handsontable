import { normalizeRanges } from './copyableRanges';
import { isDefined } from '../../helpers/mixed';
import { warn } from '../../helpers/console';
import {
  getDataByCoords,
  getDataWithHeadersByConfig,
  getHTMLByCoords,
  getHTMLFromConfig,
  htmlToGridSettings,
} from '../../utils/parseTable';
import { parse } from '../../3rdparty/SheetClip';

const META_HEAD = [
  '<meta name="generator" content="Handsontable"/>',
  '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
].join('');

/**
 * Creates an object containing information about performed action: copy, cut (performing also copying) or paste action.
 *
 * @private
 */
export class ActionInfo {
  /**
   * Cell ranges related to instance of Handsontable (used only while copying data).
   *
   * @type {CellRange[]}
   */
  #copyableRanges;
  /**
   * Handsontable instance (used only while copying data).
   *
   * @type {Core}
   */
  #instance;
  /**
   * Sanitized data of "text/html" type inside the clipboard.
   *
   * @type {string}
   */
  #html;
  /**
   * Copied data stored as array of arrays.
   *
   * @type {string[][]}
   */
  #data;
  /**
   * @param {object} config Configuration object for the action.
   * @param {'copy'|'paste'} config.type Type of the action - copying (and cutting) or pasting the data.
   * @param {string} config.html Sanitized data of "text/html" type inside the clipboard.
   * @param {Core} [config.instance] Handsontable instance (used only while copying data).
   * @param {CellRange[]} [config.copyableRanges] Cell ranges related to instance of Handsontable (used only while copying data).
   */
  constructor({ type, html, instance, copyableRanges }) {
    if (type === 'copy') {
      this.#instance = instance;
      this.#copyableRanges = copyableRanges;

      const { rows, columns } = normalizeRanges(this.#copyableRanges);

      this.#html = [META_HEAD, getHTMLByCoords(this.#instance, { rows, columns })].join('');
      this.#data = getDataByCoords(this.#instance, { rows, columns });

    } else {
      this.#html = html;

      if (this.isTable()) {
        this.#data = getDataWithHeadersByConfig(this.getGridSettings());

      } else {
        this.#data = parse(this.#html);
      }
    }
  }

  /**
   * Checks whether copied data is an array.
   *
   * @returns {boolean}
   */
  isTable() {
    return isDefined(this.#html) && /(<table)|(<TABLE)/g.test(this.#html);
  }

  /**
   * Checks whether copied data is a Handsontable.
   *
   * @returns {boolean}
   */
  isHandsontable() {
    return this.isTable() && this.#html.includes(META_HEAD);
  }

  /**
   * Gets sanitized data of "text/html" type inside the clipboard.
   *
   * @returns {string}
   */
  getHTML() {
    return this.#html;
  }

  /**
   * Gets copied data stored as array of arrays.
   *
   * @returns {string[][]}
   */
  getData() {
    return this.#data;
  }

  /**
   * Gets grid settings for copied data.
   *
   * @returns {object} Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells` keys and
   * the corresponding values.
   */
  getGridSettings() {
    return htmlToGridSettings(this.#html);
  }

  /**
   * Overwrite stored data basing on handled configuration.
   *
   * @private
   * @param {object} config Configuration.
   */
  overWriteInfo(config) {
    this.#html = [this.isHandsontable() ? META_HEAD : '', getHTMLFromConfig(config)].join('');
    this.#data = getDataWithHeadersByConfig(config);
  }

  /**
   * Removes rows/columns from the copied/pasted dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {object} removedElements Configuration object describing removed rows/columns.
   * @param {number[]} [removedElements.rows] List of row indexes which should be excluded when creating copy/cut/paste data.
   * @param {number[]} [removedElements.columns] List of column indexes which should be excluded when creating copy/cut/paste data.
   */
  remove(removedElements) {
    const rows = removedElements.rows || [];
    const columns = removedElements.columns || [];
    const gridSettings = this.getGridSettings();
    const { mergeCells: mergedCells, nestedHeaders, colHeaders } = gridSettings;

    if (Array.isArray(nestedHeaders) && columns.length > 0) {
      warn('It\'s not possible to modify copied dataset containing nested headers.');

      return;
    }

    if (Array.isArray(colHeaders) && columns.length > 0) {
      gridSettings.colHeaders = colHeaders.filter(columnIndex => columns.includes(columnIndex) === false);
    }

    gridSettings.mergedCells = mergedCells?.reduce((filteredNestedCells, mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, rowspan, colspan } = mergeArea;
      const removedRows = rows.filter(row => row >= mergeStartRow && row < mergeStartRow + rowspan);
      const removedColumns =
        columns.filter(column => column >= mergeStartColumn && column < mergeStartColumn + colspan);
      const removedRowsLength = removedRows.length;
      const removedColumnsLength = removedColumns.length;

      if (removedRowsLength === rowspan || rowspan - removedRowsLength === 1) {
        delete mergeArea.rowspan;

      } else if (removedRowsLength > 0) {
        mergeArea.rowspan = rowspan - removedRowsLength;
      }

      if (removedColumnsLength === colspan || colspan - removedColumnsLength === 1) {
        delete mergeArea.colspan;

      } else if (removedColumnsLength > 0) {
        mergeArea.colspan = colspan - removedColumnsLength;
      }

      if (Number.isInteger(mergeArea.rowspan) || Number.isInteger(mergeArea.colspan)) {
        return filteredNestedCells.concat(mergeArea);
      }

      return filteredNestedCells;
    }, []);

    if (gridSettings?.mergedCells?.length === 0) {
      delete gridSettings.mergedCells;
    }

    const config = {
      ...gridSettings,
      excludedRows: rows || [],
      excludedColumns: columns || [],
    };

    this.overWriteInfo(config);
  }

  /**
   * Insert values at row index.
   *
   * Note: Used index refers to processed data, not to the instance of Handsontable.
   *
   * @param {number} rowIndex An index of the row at which the new values will be inserted or removed.
   * @param {string[]} values List of values.
   */
  insertAtRow(rowIndex, values) {
    const gridSettings = this.getGridSettings();
    const { mergeCells: mergedCells, data } = gridSettings;

    if (Array.isArray(data) === false) {
      return;
    }

    const numberOfRows = data.length;
    const numberOfColumns = data[0].length;

    if (rowIndex > numberOfRows) {
      warn('to high row index');

      return;
    }

    if (numberOfColumns !== values.length) {
      warn('wrong row data');

      return;
    }

    data.splice(rowIndex, 0, values);

    mergedCells?.forEach((mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, rowspan, colspan } = mergeArea;

      if (rowIndex > mergeStartRow && rowIndex < mergeStartRow + rowspan) {
        mergeArea.rowspan += 1;

        for (let i = 0; i < colspan; i += 1) {
          data[rowIndex][mergeStartColumn + i] = null;
        }
      }
    });

    this.overWriteInfo(gridSettings);
  }

  /**
   * Insert values at column index.
   *
   * Note: Used index refers to processed data, not to the instance of Handsontable.
   *
   * @param {number} columnIndex An index of the column at which the new values will be inserted or removed.
   * @param {string[]} values List of values.
   */
  insertAtColumn(columnIndex, values) {
    const gridSettings = this.getGridSettings();
    const { nestedHeaders, mergeCells: mergedCells, data, colHeaders } = gridSettings;

    if (Array.isArray(nestedHeaders)) {
      warn('It\'s not possible to modify copied dataset containing nested headers.');

      return;
    }

    if (Array.isArray(data) === false) {
      return;
    }

    const headerLevels = isDefined(colHeaders) ? 1 : 0;
    const numberOfRows = data.length + headerLevels;
    const numberOfColumns = data[0].length;

    if (columnIndex > numberOfColumns) {
      warn('to high column index');

      return;
    }

    if (values.length !== numberOfRows) {
      warn('wrong column data');

      return;
    }

    if (headerLevels > 0) {
      colHeaders.splice(columnIndex, 0, values[0]);
    }

    data.forEach((rowData, rowIndex) => {
      rowData.splice(columnIndex, 0, ...values.slice(headerLevels)[rowIndex]);
    });

    mergedCells?.forEach((mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, colspan, rowspan } = mergeArea;

      if (columnIndex > mergeStartColumn && columnIndex < mergeStartColumn + colspan) {
        mergeArea.colspan += 1;

        for (let i = 0; i < rowspan; i += 1) {
          data[mergeStartRow + i][columnIndex] = null;
        }
      }
    });

    this.overWriteInfo(gridSettings);
  }

  /**
   * Change headers or cells in the copied/pasted dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {object[]} changes Configuration object describing changed cells.
   * @param {number} changes.row Row index of cell which should be changed.
   * @param {number} changes.column Column index of cell which should be changed.
   * @param {string} changes.value Value for particular indexes.
   */
  change(changes) {
    const config = this.getGridSettings();
    const { data, nestedHeaders, colHeaders } = config;

    changes.forEach((singleChange) => {
      const { row, column, value } = singleChange;

      if (row < 0) {
        if (Array.isArray(nestedHeaders)) {
          const headerRelative = row + nestedHeaders.length;

          if (Array.isArray(nestedHeaders[headerRelative]) && isDefined(nestedHeaders[headerRelative][column])) {
            nestedHeaders[headerRelative][column] = value;
          }

        } else if (Array.isArray(colHeaders)) {
          const headerRelative = row + colHeaders.length;

          if (Array.isArray(colHeaders[headerRelative]) && isDefined(colHeaders[headerRelative][column])) {
            colHeaders[headerRelative][column] = value;
          }
        }
      } else if (row >= 0 && Array.isArray(data) && Array.isArray(data[row]) && isDefined(data[row][column])) {
        data[row][column] = value;
      }
    });

    this.overWriteInfo(config);
  }
}
