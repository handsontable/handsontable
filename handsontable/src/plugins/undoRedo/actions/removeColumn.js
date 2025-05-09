import { BaseAction } from './_base';
import { getCellMetas } from '../utils';
import { rangeEach } from '../../../helpers/number';
import { arrayMap, arrayEach } from '../../../helpers/array';

/**
 * Action that tracks changes in column removal.
 *
 * @class RemoveColumnAction
 * @private
 */
export class RemoveColumnAction extends BaseAction {
  /**
   * @param {number} index The visual column index.
   */
  index;
  /**
   * @param {number[]} indexes The physical column indexes.
   */
  indexes;
  /**
   * @param {Array} data The removed data.
   */
  data;
  /**
   * @param {number} amount The number of removed columns.
   */
  amount;
  /**
   * @param {Array} headers The header values.
   */
  headers;
  /**
   * @param {number[]} columnPositions The column position.
   */
  columnPositions;
  /**
   * @param {number[]} rowPositions The row position.
   */
  rowPositions;
  /**
   * @param {number} fixedColumnsStart Number of fixed columns on the left. Remove column action change it sometimes.
   */
  fixedColumnsStart;
  /**
   * @param {Array} removedCellMetas List of removed cell metas.
   */
  removedCellMetas;

  constructor({
    index,
    indexes,
    data,
    amount,
    headers,
    columnPositions,
    rowPositions,
    fixedColumnsStart,
    removedCellMetas
  }) {
    super('remove_col');
    this.index = index;
    this.indexes = indexes;
    this.data = data;
    this.amount = amount;
    this.headers = headers;
    this.columnPositions = columnPositions.slice(0);
    this.rowPositions = rowPositions.slice(0);
    this.fixedColumnsStart = fixedColumnsStart;
    this.removedCellMetas = removedCellMetas;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeRemoveCol', (index, amount, logicColumns, source) => {
      const wrappedAction = () => {
        const originalData = hot.getSourceDataArray();
        const columnIndex = (hot.countCols() + index) % hot.countCols();
        const lastColumnIndex = columnIndex + amount - 1;
        const removedData = [];
        const headers = [];
        const indexes = [];

        rangeEach(originalData.length - 1, (i) => {
          const column = [];
          const origRow = originalData[i];

          rangeEach(columnIndex, lastColumnIndex, (j) => {
            column.push(origRow[hot.toPhysicalColumn(j)]);
          });

          removedData.push(column);
        });

        rangeEach(amount - 1, (i) => {
          indexes.push(hot.toPhysicalColumn(columnIndex + i));
        });

        if (Array.isArray(hot.getSettings().colHeaders)) {
          rangeEach(amount - 1, (i) => {
            headers.push(hot.getSettings().colHeaders[hot.toPhysicalColumn(columnIndex + i)] || null);
          });
        }

        return new RemoveColumnAction({
          index: columnIndex,
          indexes,
          data: removedData,
          amount,
          headers,
          columnPositions: hot.columnIndexMapper.getIndexesSequence(),
          rowPositions: hot.rowIndexMapper.getIndexesSequence(),
          fixedColumnsStart: hot.getSettings().fixedColumnsStart,
          removedCellMetas: getCellMetas(hot, 0, hot.countRows(), columnIndex, lastColumnIndex),
        });
      };

      undoRedoPlugin.done(wrappedAction, source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const settings = hot.getSettings();

    // Changing by the reference as `updateSettings` doesn't work the best.
    settings.fixedColumnsStart = this.fixedColumnsStart;

    const ascendingIndexes = this.indexes.slice(0).sort();
    const sortByIndexes = (elem, j, arr) => arr[this.indexes.indexOf(ascendingIndexes[j])];

    const removedDataLength = this.data.length;
    const sortedData = [];

    for (let rowIndex = 0; rowIndex < removedDataLength; rowIndex++) {
      sortedData.push(arrayMap(this.data[rowIndex], sortByIndexes));
    }

    const sortedHeaders = arrayMap(this.headers, sortByIndexes);
    const changes = [];

    // The indexes sequence have to be applied twice.
    //  * First for proper index translation. The alter method accepts a visual index
    //    and we are able to retrieve the correct index indicating where to add a new row based
    //    only on the previous order state of the columns;
    //  * The alter method shifts the indexes (a side-effect), so we need to reapply the indexes sequence
    //    the same as it was in the previous state;
    hot.columnIndexMapper.setIndexesSequence(this.columnPositions);
    hot.alter('insert_col_start', hot.toVisualColumn(this.indexes[0]), this.indexes.length, 'UndoRedo.undo');

    hot.batchExecution(() => {
      // Restore row sequence in a case when all columns are removed. the original
      // row sequence is lost in that case.
      hot.rowIndexMapper.setIndexesSequence(this.rowPositions);
      hot.columnIndexMapper.setIndexesSequence(this.columnPositions);
    }, true);

    arrayEach(hot.getSourceDataArray(), (rowData, rowIndex) => {
      arrayEach(ascendingIndexes, (changedIndex, contiquesIndex) => {
        rowData[changedIndex] = sortedData[rowIndex][contiquesIndex];

        changes.push([rowIndex, changedIndex, rowData[changedIndex]]);
      });
    });

    if (typeof this.headers !== 'undefined') {
      arrayEach(sortedHeaders, (headerData, columnIndex) => {
        hot.getSettings().colHeaders[ascendingIndexes[columnIndex]] = headerData;
      });
    }

    this.removedCellMetas.forEach(([rowIndex, columnIndex, cellMeta]) => {
      hot.setCellMetaObject(rowIndex, columnIndex, cellMeta);
    });

    hot.addHookOnce('afterViewRender', undoneCallback);
    hot.setSourceDataAtCell(changes, null, null, 'UndoRedo.undo');
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    hot.addHookOnce('afterRemoveCol', redoneCallback);
    hot.alter('remove_col', this.index, this.amount, 'UndoRedo.redo');
  }
}
