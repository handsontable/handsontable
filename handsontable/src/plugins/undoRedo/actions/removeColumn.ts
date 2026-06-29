import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';
import { getCellMetas, collectAffectedMergedCells, restoreMergedCells } from '../utils';
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
  /**
   * @param {Array} removedMergedCells List of merged cell ranges that overlap the removed
   *   columns. Stored as plain `{ row, col, rowspan, colspan }` objects in visual coords.
   */
  removedMergedCells;

  /**
   * Initializes the remove column action with the removed data, column indexes, headers, position sequences, cell meta backup, and affected merged cells.
   */
  constructor({
    index,
    indexes,
    data,
    amount,
    headers,
    columnPositions,
    rowPositions,
    fixedColumnsStart,
    removedCellMetas,
    removedMergedCells,
  }: {
    index: number, indexes: number[], data: unknown[][], amount: number, headers: unknown[],
    columnPositions: number[], rowPositions: number[], fixedColumnsStart: number, removedCellMetas: unknown[],
    removedMergedCells: Array<{ row: number, col: number, rowspan: number, colspan: number }>
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
    this.removedMergedCells = removedMergedCells;
  }

  /**
   * Registers the `beforeRemoveCol` hook listener that captures removed column data and records a RemoveColumnAction.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeRemoveCol', (index: number, amount: number, logicColumns: unknown, source: string) => {
      const wrappedAction = () => {
        const originalData = hot.getSourceDataArray();
        const columnIndex = (hot.countCols() + index) % hot.countCols();
        const lastColumnIndex = columnIndex + amount - 1;
        const removedData: unknown[][] = [];
        const headers: unknown[] = [];
        const indexes: number[] = [];

        const collectColumnData = (origRow: unknown[], colFrom: number, colTo: number): number[] => {
          const column: number[] = [];

          rangeEach(colFrom, colTo, (j) => {
            column.push(origRow[hot.toPhysicalColumn(j)] as number);
          });

          return column;
        };

        rangeEach(originalData.length - 1, (i: number) => {
          removedData.push(collectColumnData(originalData[i], columnIndex, lastColumnIndex));
        });

        rangeEach(amount - 1, (i: number) => {
          indexes.push(hot.toPhysicalColumn(columnIndex + i));
        });

        if (Array.isArray(hot.getSettings().colHeaders)) {
          const colHeadersArr = hot.getSettings().colHeaders as string[];

          rangeEach(amount - 1, (i: number) => {
            headers.push(colHeadersArr[hot.toPhysicalColumn(columnIndex + i)] || null);
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
          fixedColumnsStart: hot.getSettings().fixedColumnsStart ?? 0,
          removedCellMetas: getCellMetas(hot, 0, hot.countRows(), columnIndex, lastColumnIndex),
          removedMergedCells: collectAffectedMergedCells(hot, 'col', columnIndex, amount),
        });
      };

      (undoRedoPlugin as { done: (action: Function, source: string) => void }).done(wrappedAction, source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const settings = hot.getSettings();

    // Changing by the reference as `updateSettings` doesn't work the best.
    settings.fixedColumnsStart = this.fixedColumnsStart;

    const ascendingIndexes = this.indexes.slice(0).sort((a, b) => a - b);
    const sortByIndexes = (elem: unknown, j: number, arr: unknown[]) => arr[this.indexes.indexOf(ascendingIndexes[j])];

    const removedDataLength = this.data.length;
    const sortedData: unknown[] = [];

    for (let rowIndex = 0; rowIndex < removedDataLength; rowIndex++) {
      sortedData.push(arrayMap(this.data[rowIndex], sortByIndexes));
    }

    const sortedHeaders = arrayMap(this.headers, sortByIndexes);
    const changes: unknown[][] = [];

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
      const rowArr = rowData as unknown[];

      arrayEach(ascendingIndexes, (changedIndex, contiquesIndex) => {
        rowArr[changedIndex] = (sortedData[rowIndex] as unknown[])[contiquesIndex];

        changes.push([rowIndex, changedIndex, rowArr[changedIndex]]);
      });
    });

    if (typeof this.headers !== 'undefined') {
      arrayEach(sortedHeaders, (headerData, columnIndex) => {
        (hot.getSettings().colHeaders as string[])[ascendingIndexes[columnIndex]] = headerData as string;
      });
    }

    this.removedCellMetas.forEach((entry: unknown) => {
      const [rowIndex, columnIndex, cellMeta] = entry as [number, number, Record<string, unknown>];

      hot.setCellMetaObject(rowIndex, columnIndex, cellMeta);
    });

    restoreMergedCells(hot, this.removedMergedCells);

    hot.addHookOnce('afterViewRender', undoneCallback);
    hot.setSourceDataAtCell(changes, undefined, undefined, 'UndoRedo.undo');
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    hot.addHookOnce('afterRemoveCol', redoneCallback);
    hot.alter('remove_col', this.index, this.amount, 'UndoRedo.redo');
  }
}
