import { normalizeRanges } from './copyableRanges';
import { isDefined } from '../../helpers/mixed';
import { toSingleLine } from '../../helpers/templateLiteralTag';
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
 * Creates an object containing information about performed action: copy, cut (performing also copying) or paste.
 *
 * @private
 */
export class ActionInfo {
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
      const { rows, columns } = normalizeRanges(copyableRanges);

      this.#html = [META_HEAD, getHTMLByCoords(instance, { rows, columns })].join('');
      this.#data = getDataByCoords(instance, { rows, columns });

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
   * Adjust information about merged cells after removing some elements.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable.
   *
   * @private
   * @param {object} gridSettings Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {object} removedElements Configuration object describing removed rows/columns.
   * @param {number[]} [removedElements.rows] List of row indexes which should be excluded when creating copy/cut/paste data.
   * @param {number[]} [removedElements.columns] List of column indexes which should be excluded when creating copy/cut/paste data.
   */
  adjustMergedCells(gridSettings, removedElements) {
    const rows = removedElements.rows || [];
    const columns = removedElements.columns || [];
    const mergedCells = gridSettings.mergeCells;

    if (isDefined(mergedCells) === false) {
      return;
    }

    gridSettings.mergeCells = mergedCells.reduce((filteredNestedCells, mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, rowspan, colspan } = mergeArea;
      const removedMergedRows = rows.filter(row => row >= mergeStartRow && row < mergeStartRow + rowspan);
      const removedMergedColumns =
        columns.filter(column => column >= mergeStartColumn && column < mergeStartColumn + colspan);
      const removedMergedRowsLength = removedMergedRows.length;
      const removedMergedColumnsLength = removedMergedColumns.length;

      if (removedMergedRowsLength === rowspan || rowspan - removedMergedRowsLength === 1) {
        delete mergeArea.rowspan;

      } else if (removedMergedRowsLength > 0) {
        mergeArea.rowspan = rowspan - removedMergedRowsLength;
      }

      if (removedMergedColumnsLength === colspan || colspan - removedMergedColumnsLength === 1) {
        delete mergeArea.colspan;

      } else if (removedMergedColumnsLength > 0) {
        mergeArea.colspan = colspan - removedMergedColumnsLength;
      }

      if (Number.isInteger(mergeArea.rowspan) || Number.isInteger(mergeArea.colspan)) {
        return filteredNestedCells.concat(mergeArea);
      }

      return filteredNestedCells;
    }, []);

    gridSettings.mergeCells.forEach((mergeArea) => {
      const shiftedRows = rows.filter(row => row < mergeArea.row);
      const shiftedColumns = columns.filter(column => column < mergeArea.col);
      const shifterRowsLength = shiftedRows.length;
      const shifterColumnsLength = shiftedColumns.length;

      mergeArea.row = mergeArea.row - shifterRowsLength;
      mergeArea.col = mergeArea.col - shifterColumnsLength;
    });

    if (gridSettings.mergeCells.length === 0) {
      delete gridSettings.mergeCells;
    }
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
    const { nestedHeaders, colHeaders } = gridSettings;

    if (Array.isArray(nestedHeaders) && columns.length > 0) {
      warn('It\'s not possible to modify copied dataset containing nested headers.');

      return;
    }

    if (Array.isArray(colHeaders) && columns.length > 0) {
      gridSettings.colHeaders = colHeaders.filter(columnIndex => columns.includes(columnIndex) === false);
    }

    this.adjustMergedCells(gridSettings, removedElements);

    const config = {
      ...gridSettings,
      excludedRows: rows || [],
      excludedColumns: columns || [],
    };

    this.overWriteInfo(config);
  }

  /**
   * Get warning message when there is some problem with row insertion or undefined otherwise.
   *
   * @private
   * @param {number} rowIndex An index of the row at which the new values will be inserted or removed.
   * @param {string[]} values List of values.
   * @returns {undefined|string}
   */
  getRowInsertionWarn(rowIndex, values) {
    const data = this.getGridSettings().data;

    if (Array.isArray(data) === false) {
      return 'There is no possibility to expand an empty dataset.';
    }

    const numberOfRows = data.length;
    const numberOfColumns = data[0].length;

    if (rowIndex > numberOfRows) {
      return 'Please provide an valid row index for row data insertion.';
    }

    if (numberOfColumns !== values.length) {
      return toSingleLine`Please provide proper number of elements (corresponding to size of the dataset in other\x20
        rows) for inserted rows.`;
    }
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
    const rowInsertionWarn = this.getRowInsertionWarn(rowIndex, values);

    if (isDefined(rowInsertionWarn)) {
      warn(rowInsertionWarn);

      return;
    }

    data.splice(rowIndex, 0, values);

    mergedCells?.forEach((mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, rowspan, colspan } = mergeArea;

      if (rowIndex > mergeStartRow && rowIndex < mergeStartRow + rowspan) {
        mergeArea.rowspan += 1;

        for (let i = 0; i < colspan; i += 1) {
          data[rowIndex][mergeStartColumn + i] = '';
        }
      }
    });

    this.overWriteInfo(gridSettings);
  }

  /**
   * Get warning message when there is some problem with row insertion or undefined otherwise.
   *
   * @private
   * @param {number} columnIndex An index of the column at which the new values will be inserted or removed.
   * @param {string[]} values List of values.
   * @returns {undefined|string}
   */
  getColumnInsertionWarn(columnIndex, values) {
    const { nestedHeaders, data, colHeaders } = this.getGridSettings();
    const headerLevels = isDefined(colHeaders) ? 1 : 0;

    if (Array.isArray(nestedHeaders)) {
      return 'It\'s not possible to modify copied dataset containing nested headers.';
    }

    if (Array.isArray(data) === false) {
      return;
    }

    const numberOfRows = data.length + headerLevels;
    const numberOfColumns = data[0].length;

    if (columnIndex > numberOfColumns) {
      return 'Please provide an valid column index for column data insertion.';
    }

    if (values.length !== numberOfRows) {

      return toSingleLine`Please provide proper number of elements (corresponding to size of the dataset in other\x20
        columns, including headers) for inserted columns.`;
    }
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
    const { mergeCells: mergedCells, data, colHeaders } = gridSettings;
    const headerLevels = isDefined(colHeaders) ? 1 : 0;
    const columnInsertionWarn = this.getColumnInsertionWarn(columnIndex, values);

    if (isDefined(columnInsertionWarn)) {
      warn(columnInsertionWarn);

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
          data[mergeStartRow + i][columnIndex] = '';
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
