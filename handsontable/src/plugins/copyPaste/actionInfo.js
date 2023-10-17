import { normalizeRanges } from './copyableRanges';
import { isDefined } from '../../helpers/mixed';
import { deepClone } from '../../helpers/object';
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
   * @param {string} config.data Data of "text/plain" type inside the clipboard.
   * @param {string} config.html Sanitized data of "text/html" type inside the clipboard.
   * @param {Core} [config.instance] Handsontable instance (used only while copying data).
   * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} [config.copyableRanges] Cell
   * ranges related to instance of Handsontable (used only while copying data).
   */
  constructor({ type, data, html, instance, copyableRanges }) {
    if (type === 'copy') {
      const { rows, columns } = normalizeRanges(copyableRanges);

      this.#html = [META_HEAD, getHTMLByCoords(instance, { rows, columns })].join('');
      this.#data = getDataByCoords(instance, { rows, columns });

    } else {
      this.#html = html;

      if (this.isTable()) {
        this.#data = getDataWithHeadersByConfig(this.getGridSettings());

      } else {
        this.#data = parse(data);
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
    return this.isTable() && /<meta (.*?)content="Handsontable"/.test(this.#html);
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
    return deepClone(this.#data);
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
  overwriteInfo(config) {
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
  adjustAfterRemoval(gridSettings, removedElements) {
    const rows = Array.isArray(removedElements?.rows) ? removedElements.rows : [];
    const columns = Array.isArray(removedElements?.columns) ? removedElements.columns : [];
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

      if (removedMergedRowsLength === rowspan) {
        return filteredNestedCells;

      } else if (rowspan - removedMergedRowsLength === 1) {
        delete mergeArea.rowspan;

      } else if (removedMergedRowsLength > 0) {
        mergeArea.rowspan = rowspan - removedMergedRowsLength;
      }

      if (removedMergedColumnsLength === colspan) {
        return filteredNestedCells;

      } else if (colspan - removedMergedColumnsLength === 1) {
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
   * Remove rows/columns from the copied/pasted dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {object} removedElements Configuration object describing removed rows/columns.
   * @param {number[]} [removedElements.rows] List of row indexes which should be excluded when creating copy/cut/paste data.
   * @param {number[]} [removedElements.columns] List of column indexes which should be excluded when creating copy/cut/paste data.
   */
  remove(removedElements) {
    const rows = Array.isArray(removedElements?.rows) ? removedElements.rows : [];
    const columns = Array.isArray(removedElements?.columns) ? removedElements.columns : [];
    const gridSettings = this.getGridSettings();
    const { nestedHeaders, colHeaders } = gridSettings;

    if (Array.isArray(nestedHeaders) && columns.length > 0) {
      warn('It\'s not possible to modify copied dataset containing nested headers.');

      return;
    }

    if (Array.isArray(colHeaders) && columns.length > 0) {
      gridSettings.colHeaders = colHeaders.filter(columnIndex => columns.includes(columnIndex) === false);
    }

    this.adjustAfterRemoval(gridSettings, removedElements);

    const config = {
      ...gridSettings,
      excludedRows: rows,
      excludedColumns: columns,
    };

    this.overwriteInfo(config);
  }

  /**
   * Get warning message when there is some problem with row insertion or undefined otherwise.
   *
   * @private
   * @param {number} rowIndex An index of the row at which the new values will be inserted.
   * @param {string[]} values List of values.
   * @returns {undefined|string}
   */
  getRowInsertionWarn(rowIndex, values) {
    const gridSettings = this.getGridSettings();
    const data = gridSettings.data;
    const insertedElementsCount = values.length;

    if (Array.isArray(data) === false) {
      const { nestedHeaders, colHeaders } = gridSettings;

      if (rowIndex > 0) {
        return toSingleLine`Invalid row insertion done inside some \`CopyPaste\` hook. There is no possibility to\x20
      expand an empty dataset at position higher than zero.`;
      }

      if ((Array.isArray(nestedHeaders) && nestedHeaders[0].length !== insertedElementsCount) ||
        (Array.isArray(colHeaders) && colHeaders.length !== insertedElementsCount)) {
        return toSingleLine`Invalid row insertion done inside some \`CopyPaste\` hook. Please provide proper number\x20
        of elements (corresponding to size of the dataset in other rows) for inserted rows.`;
      }

      return;
    }

    const numberOfRows = data.length;
    const numberOfColumns = data[0].length;

    if (rowIndex > numberOfRows) {
      return toSingleLine`Invalid row insertion done inside some \`CopyPaste\` hook. Please provide an valid row\x20
      index (not too high) for row data insertion.`;
    }

    if (numberOfColumns !== insertedElementsCount) {
      return toSingleLine`Invalid row insertion done inside some \`CopyPaste\` hook. Please provide proper number of\x20
      elements (corresponding to size of the dataset in other rows) for inserted rows.`;
    }
  }

  /**
   * Adjust information about merged cells after row insertion.
   *
   * Note: Used index refers to processed data, not to the instance of Handsontable.
   *
   * @private
   * @param {object} gridSettings Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {number} rowIndex An index of the row at which the new values have been inserted.
   */
  adjustAfterRowInsertion(gridSettings, rowIndex) {
    const { mergeCells: mergedCells, data } = gridSettings;

    mergedCells?.forEach((mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, rowspan, colspan } = mergeArea;

      if (rowIndex > mergeStartRow && rowIndex < mergeStartRow + rowspan) {
        mergeArea.rowspan += 1;

        for (let i = 0; i < colspan; i += 1) {
          data[rowIndex][mergeStartColumn + i] = '';
        }
      }
    });

    mergedCells?.forEach((mergeArea) => {
      if (rowIndex <= mergeArea.row) {
        mergeArea.row += 1;
      }
    });
  }

  /**
   * Insert values at row index.
   *
   * Note: Used index refers to processed data, not to the instance of Handsontable.
   *
   * @param {number} rowIndex An index of the row at which the new values will be inserted.
   * @param {string[]} values List of values.
   */
  insertAtRow(rowIndex, values) {
    const gridSettings = this.getGridSettings();
    const data = gridSettings.data || [];
    const rowInsertionWarn = this.getRowInsertionWarn(rowIndex, values);

    if (isDefined(rowInsertionWarn)) {
      warn(rowInsertionWarn);

      return;
    }

    gridSettings.data = [...data.slice(0, rowIndex), values, ...data.slice(rowIndex)];

    this.adjustAfterRowInsertion(gridSettings, rowIndex);
    this.overwriteInfo(gridSettings);
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
      return toSingleLine`Invalid column insertion done inside some \`CopyPaste\` hook. It's not possible to modify\x20
      copied dataset containing nested headers`;
    }

    if (Array.isArray(data) === false) {
      return;
    }

    const numberOfRows = data.length + headerLevels;
    const numberOfColumns = data[0].length;

    if (columnIndex > numberOfColumns) {
      return toSingleLine`Invalid column insertion done inside some \`CopyPaste\` hook. Please provide an valid\x20
      column index (not too high) for column data insertion.`;
    }

    if (values.length !== numberOfRows) {
      return toSingleLine`Invalid column insertion done inside some \`CopyPaste\` hook. Please provide proper number\x20
      of elements (corresponding to size of the dataset in other columns, including headers) for inserted columns.`;
    }
  }

  /**
   * Adjust information about merged cells after column insertion.
   *
   * Note: Used index refers to processed data, not to the instance of Handsontable.
   *
   * @private
   * @param {object} gridSettings Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {number} columnIndex An index of the column at which the new values have been inserted.
   */
  adjustAfterColumnInsertion(gridSettings, columnIndex) {
    const { mergeCells: mergedCells, data } = gridSettings;

    mergedCells?.forEach((mergeArea) => {
      const { row: mergeStartRow, col: mergeStartColumn, colspan, rowspan } = mergeArea;

      if (columnIndex > mergeStartColumn && columnIndex < mergeStartColumn + colspan) {
        mergeArea.colspan += 1;

        for (let i = 0; i < rowspan; i += 1) {
          data[mergeStartRow + i][columnIndex] = '';
        }
      }
    });

    mergedCells?.forEach((mergeArea) => {
      if (columnIndex <= mergeArea.col) {
        mergeArea.col += 1;
      }
    });
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
    const { data, colHeaders } = gridSettings;
    const headerLevels = isDefined(colHeaders) ? 1 : 0;
    const columnInsertionWarn = this.getColumnInsertionWarn(columnIndex, values);

    if (isDefined(columnInsertionWarn)) {
      warn(columnInsertionWarn);

      return;
    }

    if (headerLevels > 0) {
      colHeaders.splice(columnIndex, 0, values[0]);
    }

    data?.forEach((rowData, rowIndex) => {
      rowData.splice(columnIndex, 0, values[rowIndex + headerLevels]);
    });

    this.adjustAfterColumnInsertion(gridSettings, columnIndex);
    this.overwriteInfo(gridSettings);
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
   * @param {boolean} isRtl Grid is rendered using the right-to-left layout direction.
   */
  change(changes, isRtl = false) {
    const config = this.getGridSettings();
    const { data, nestedHeaders, colHeaders } = config;

    changes.forEach((singleChange) => {
      const { row, column, value } = singleChange;

      if (row < 0) {
        if (Array.isArray(nestedHeaders)) {
          const rowRelative = row + nestedHeaders.length;
          const columnRelative = isRtl ? nestedHeaders.length - column - 1 : column;

          if (Array.isArray(nestedHeaders[rowRelative]) && isDefined(nestedHeaders[rowRelative][columnRelative])) {
            nestedHeaders[rowRelative][columnRelative] = value;
          }

        } else if (Array.isArray(colHeaders)) {
          const columnRelative = isRtl ? colHeaders.length - column - 1 : column;

          if (isDefined(colHeaders[columnRelative])) {
            colHeaders[columnRelative] = value;
          }
        }
      } else if (row >= 0 && Array.isArray(data) && Array.isArray(data[row]) && isDefined(data[row][column])) {
        const columnRelative = isRtl ? data[0].length - column - 1 : column;

        data[row][columnRelative] = value;
      }
    });

    this.overwriteInfo(config);
  }
}
