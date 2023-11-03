import { isDefined } from '../../../helpers/mixed';
import { deepClone, isObject } from '../../../helpers/object';
import { toSingleLine } from '../../../helpers/templateLiteralTag';
import { warn } from '../../../helpers/console';
import {
  getDataWithHeadersByConfig,
  getHTMLFromConfig,
  htmlToGridSettings,
} from '../../../utils/parseTable';
import { arrayEach } from '../../../helpers/array';

export const META_HEAD = [
  '<meta name="generator" content="Handsontable"/>',
  '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
].join('');

/**
 * Creates an object containing information about performed action: copy, cut (performing also copying) or paste.
 *
 * @private
 */
export class ClipboardData {
  /**
   * Sanitized data of "text/html" type inside the clipboard.
   *
   * @type {string}
   */
  html;
  /**
   * Copied data stored as array of arrays.
   *
   * @type {string[][]}
   */
  data;

  constructor() {
    if (this.constructor === ClipboardData) {
      throw new Error('The `ClipboardData` is an abstract class and it can\'t be instantiated. Please use ' +
        '`CopyClipboardData` or `PasteClipboardData` classes instead.');
    }
  }

  /**
   * Gets copied data stored as array of arrays.
   *
   * @returns {string[][]}
   */
  getData() {
    return deepClone(this.data);
  }

  /**
   * Gets meta information about copied data.
   *
   * @returns {object} Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells` keys and
   * the corresponding values.
   */
  getMetaInfo() {
    return htmlToGridSettings(this.html);
  }

  /**
   * Sets meta information for certain property.
   *
   * @param {string} property Property for which the meta information will be changed.
   * @param {*} value New meta information value.
   */
  setMetaInfo(property, value) {
    const metaInfo = this.getMetaInfo();

    if (value === undefined) {
      delete metaInfo[property];

    } else {
      metaInfo[property] = value;
    }

    this.overwriteInfo(metaInfo);
  }

  /**
   * Overwrite stored data basing on handled configuration.
   *
   * @private
   * @param {object} config Configuration.
   */
  overwriteInfo(config) {
    this.html = [this.isSerializedHandsontable() ? META_HEAD : '', getHTMLFromConfig(config)].join('');
    this.data = getDataWithHeadersByConfig(config);
  }

  /**
   * Adjust information about merged cells after removing some columns.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable.
   *
   * @private
   * @param {object} metaInfo Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {number[]} removedColumns List of column indexes which should be excluded when creating copy/cut/paste data.
   */
  adjustAfterColumnsRemoval(metaInfo, removedColumns) {
    const mergedCells = metaInfo.mergeCells;

    if (isDefined(mergedCells) === false) {
      return;
    }

    metaInfo.mergeCells = mergedCells.reduce((filteredNestedCells, mergeArea) => {
      const { col: mergeStartColumn, colspan } = mergeArea;
      const removedMergedColumns =
        removedColumns.filter(column => column >= mergeStartColumn && column < mergeStartColumn + colspan);
      const removedMergedColumnsLength = removedMergedColumns.length;

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

    metaInfo.mergeCells.forEach((mergeArea) => {
      const shiftedColumns = removedColumns.filter(column => column < mergeArea.col);
      const shifterColumnsLength = shiftedColumns.length;

      mergeArea.col = mergeArea.col - shifterColumnsLength;
    });

    if (metaInfo.mergeCells.length === 0) {
      delete metaInfo.mergeCells;
    }
  }

  /**
   * Adjust information about merged cells after removing some rows.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable.
   *
   * @private
   * @param {object} metaInfo Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {number[]} removedRows List of row indexes which should be excluded when creating copy/cut/paste data.
   */
  adjustAfterRowRemoval(metaInfo, removedRows) {
    const mergedCells = metaInfo.mergeCells;

    if (isDefined(mergedCells) === false) {
      return;
    }

    metaInfo.mergeCells = mergedCells.reduce((filteredNestedCells, mergeArea) => {
      const { row: mergeStartRow, rowspan } = mergeArea;
      const removedMergedRows = removedRows.filter(row => row >= mergeStartRow && row < mergeStartRow + rowspan);
      const removedMergedRowsLength = removedMergedRows.length;

      if (removedMergedRowsLength === rowspan) {
        return filteredNestedCells;

      } else if (rowspan - removedMergedRowsLength === 1) {
        delete mergeArea.rowspan;

      } else if (removedMergedRowsLength > 0) {
        mergeArea.rowspan = rowspan - removedMergedRowsLength;
      }

      if (Number.isInteger(mergeArea.rowspan) || Number.isInteger(mergeArea.colspan)) {
        return filteredNestedCells.concat(mergeArea);
      }

      return filteredNestedCells;
    }, []);

    metaInfo.mergeCells.forEach((mergeArea) => {
      const shiftedRows = removedRows.filter(row => row < mergeArea.row);
      const shifterRowsLength = shiftedRows.length;

      mergeArea.row = mergeArea.row - shifterRowsLength;
    });

    if (metaInfo.mergeCells.length === 0) {
      delete metaInfo.mergeCells;
    }
  }

  /**
   * Remove rows from the serialized dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {number[]} rows List of row indexes which should be excluded when creating copy/cut/paste data.
   */
  removeRows(rows) {
    if (this.isSerializedTable() === false) {
      return;
    }

    const metaInfo = this.getMetaInfo();

    this.adjustAfterRowRemoval(metaInfo, rows);

    const config = {
      ...metaInfo,
      excludedRows: rows,
    };

    this.overwriteInfo(config);
  }

  /**
   * Remove columns from the serialized dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {number[]} columns List of column indexes which should be excluded when creating copy/cut/paste data.
   */
  removeColumns(columns) {
    if (this.isSerializedTable() === false) {
      return;
    }

    const metaInfo = this.getMetaInfo();
    const { nestedHeaders, colHeaders } = metaInfo;

    if (Array.isArray(nestedHeaders) && columns.length > 0) {
      warn('It\'s not possible to modify copied dataset containing nested headers.');

      return;
    }

    if (Array.isArray(colHeaders) && columns.length > 0) {
      metaInfo.colHeaders = colHeaders.filter(columnIndex => columns.includes(columnIndex) === false);
    }

    this.adjustAfterColumnsRemoval(metaInfo, columns);

    const config = {
      ...metaInfo,
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
    const metaInfo = this.getMetaInfo();
    const data = metaInfo.data;
    const insertedElementsCount = values.length;

    if (Array.isArray(data) === false) {
      const { nestedHeaders, colHeaders } = metaInfo;

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
   * @param {object} metaInfo Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {number} rowIndex An index of the row at which the new values have been inserted.
   */
  adjustAfterRowInsertion(metaInfo, rowIndex) {
    const { mergeCells: mergedCells, data } = metaInfo;

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
    if (this.isSerializedTable() === false) {
      return;
    }

    const metaInfo = this.getMetaInfo();
    const data = metaInfo.data || [];
    const rowInsertionWarn = this.getRowInsertionWarn(rowIndex, values);

    if (isDefined(rowInsertionWarn)) {
      warn(rowInsertionWarn);

      return;
    }

    metaInfo.data = [...data.slice(0, rowIndex), values, ...data.slice(rowIndex)];

    this.adjustAfterRowInsertion(metaInfo, rowIndex);
    this.overwriteInfo(metaInfo);
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
    const { nestedHeaders, data, colHeaders } = this.getMetaInfo();
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
   * @param {object} metaInfo Object containing `data`, `colHeaders`, `rowHeaders`, `nestedHeaders`, `mergeCells`
   * keys and the corresponding values, which will be changed by the reference.
   * @param {number} columnIndex An index of the column at which the new values have been inserted.
   */
  adjustAfterColumnInsertion(metaInfo, columnIndex) {
    const { mergeCells: mergedCells, data } = metaInfo;

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
    if (this.isSerializedTable() === false) {
      return;
    }

    const metaInfo = this.getMetaInfo();
    const { data, colHeaders } = metaInfo;
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

    this.adjustAfterColumnInsertion(metaInfo, columnIndex);
    this.overwriteInfo(metaInfo);
  }

  /**
   * Get internal column index for nested header with certain row and column indexes.
   *
   * @private
   * @param {number} row Row index related to level of the nested headers.
   * @param {number} column Column index for certain row.
   * @returns {*}
   */
  getNestedHeaderColumn(row, column) {
    const { nestedHeaders } = this.getMetaInfo();
    const rowRelative = row + nestedHeaders.length;
    const nestedHeadersForLevel = nestedHeaders[rowRelative];
    let indexInHeadersArray;
    let currentColumnIndex = 0;

    if (Array.isArray(nestedHeadersForLevel) === false) {
      return;
    }

    arrayEach(nestedHeadersForLevel, (nestedHeaderInfo, index) => {
      const isSimpleHeader = typeof nestedHeaderInfo === 'string';

      if (isSimpleHeader === true) {
        if (currentColumnIndex === column) {
          indexInHeadersArray = index;

          return false;
        }

        currentColumnIndex += 1;

      } else {
        const { colspan } = nestedHeaderInfo;

        if (column < currentColumnIndex + colspan) {
          indexInHeadersArray = index;

          return false;
        }

        currentColumnIndex += colspan;
      }
    });

    return indexInHeadersArray;
  }

  /**
   * Change headers or cells in the serialized dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {number} row Row index of cell which should be changed.
   * @param {number} column Column index of cell which should be changed.
   * @param {string} value Value for particular index.
   */
  setCellAt(row, column, value) {
    if (this.isSerializedTable() === false) {
      return;
    }

    const config = this.getMetaInfo();
    const { data, nestedHeaders, colHeaders } = config;

    if (row < 0) {
      if (Array.isArray(nestedHeaders)) {
        const rowRelative = row + nestedHeaders.length;
        const header = nestedHeaders[rowRelative][this.getNestedHeaderColumn(row, column)];

        if (isObject(header)) {
          header.label = value;

        } else {
          nestedHeaders[rowRelative][this.getNestedHeaderColumn(row, column)] = value;
        }

      } else if (Array.isArray(colHeaders)) {
        if (isDefined(colHeaders[column])) {
          colHeaders[column] = value;
        }
      }
    } else if (row >= 0 && Array.isArray(data) && Array.isArray(data[row]) && isDefined(data[row][column])) {
      data[row][column] = value;
    }

    this.overwriteInfo(config);
  }

  /**
   * Gets header or cell values from the serialized dataset.
   *
   * Note: Used indexes refers to processed data, not to the instance of Handsontable. Please keep in mind that headers
   * are handled separately from cells and they are recognised using negative indexes.
   *
   * @param {number} row Row index of cell which should be get.
   * @param {number} column Column index of cell which should be get.
   * @returns {undefined|string}
   */
  getCellAt(row, column) {
    if (this.isSerializedTable() === false) {
      return;
    }

    const config = this.getMetaInfo();
    const { data, nestedHeaders, colHeaders } = config;

    if (row < 0) {
      if (Array.isArray(nestedHeaders)) {
        const rowRelative = row + nestedHeaders.length;
        const header = nestedHeaders[rowRelative][this.getNestedHeaderColumn(row, column)];

        if (isObject(header)) {
          return header.label;
        }

        return header;

      } else if (Array.isArray(colHeaders)) {
        if (isDefined(colHeaders[column])) {
          return colHeaders[column];
        }
      }
    } else if (row >= 0 && Array.isArray(data) && Array.isArray(data[row]) && isDefined(data[row][column])) {
      return data[row][column];
    }
  }

  /**
   * Checks whether serialized data is an array.
   *
   * @private
   * @returns {boolean}
   */
  isSerializedTable() {
    return true;
  }

  /**
   * Checks whether serialized data is a Handsontable.
   *
   * @private
   * @returns {boolean}
   */
  isSerializedHandsontable() {
    return true;
  }

  /**
   * Gets source of the copied data.
   *
   * @returns {string}
   */
  getType() {
    return 'handsontable';
  }
}
