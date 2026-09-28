import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';
import {
  getCellMetas,
  collectAffectedMergedCells,
  restoreMergedCells,
  settleOnRemoveHook,
  type SettleCallback,
} from '../utils';
import { rangeEach } from '../../../helpers/number';
import { arrayMap, arrayEach } from '../../../helpers/array';
import { clipRemovalRange } from '../../../utils/removalRange';

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
        // A removal that takes no columns (e.g. `remove_col` on a grid with no visible columns)
        // changed nothing, so it must not stack an action - `UndoRedo.done()` drops a `null` result.
        // `beforeRemoveCol` reports the removed physical columns here, not in `amount` (which stays
        // the requested count), so the empty list is what marks the no-op.
        if (!Array.isArray(logicColumns) || logicColumns.length < 1) {
          return null;
        }

        // `beforeRemoveCol`'s `amount` stays the requested count, while `logicColumns` lists the
        // columns actually removed. A partial removal (more columns requested than exist) must record
        // the clamped count, or the recorded indexes/headers run out of range and `undo()` restores
        // `undefined`. `removeRow` needs no equivalent - `dataMap.removeRow` passes the clamped
        // `removedPhysicalIndexes.length` as `beforeRemoveRow`'s `amount`.
        const removedAmount = logicColumns.length;
        const originalData = hot.getSourceDataArray();
        const columnIndex = (hot.countCols() + index) % hot.countCols();
        const lastColumnIndex = columnIndex + removedAmount - 1;
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

        rangeEach(removedAmount - 1, (i: number) => {
          indexes.push(hot.toPhysicalColumn(columnIndex + i));
        });

        if (Array.isArray(hot.getSettings().colHeaders)) {
          const colHeadersArr = hot.getSettings().colHeaders as string[];

          rangeEach(removedAmount - 1, (i: number) => {
            headers.push(colHeadersArr[hot.toPhysicalColumn(columnIndex + i)] || null);
          });
        }

        return new RemoveColumnAction({
          index: columnIndex,
          indexes,
          data: removedData,
          amount: removedAmount,
          headers,
          columnPositions: hot.columnIndexMapper.getIndexesSequence(),
          rowPositions: hot.rowIndexMapper.getIndexesSequence(),
          fixedColumnsStart: hot.getSettings().fixedColumnsStart ?? 0,
          removedCellMetas: getCellMetas(hot, 0, hot.countRows(), columnIndex, lastColumnIndex),
          removedMergedCells: collectAffectedMergedCells(hot, 'col', columnIndex, removedAmount),
        });
      };

      type UndoRedoPlugin = { done: (wrappedAction: () => RemoveColumnAction | null, source: string) => void };

      (undoRedoPlugin as UndoRedoPlugin).done(wrappedAction, source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const settings = hot.getSettings();

    // Changing by the reference as `updateSettings` doesn't work the best.
    // Since 12.0.0, the "fixedColumnsLeft" is replaced with the "fixedColumnsStart" option.
    // However, keeping the old name still in effect. When both option names are used together,
    // the error is thrown. To prevent that, the engine needs to modify the original option key
    // to bypass the validation.
    (settings as unknown as { _fixedColumnsStart: number })._fixedColumnsStart = this.fixedColumnsStart;

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
   * Reports whether redoing the removal would remove any column.
   *
   * UndoRedo must call this before `beforeRedo`. Formulas always calls `engine.redo()` in `beforeRedo`,
   * so a redo whose removal names no column any more - the grid changed shape outside the stack since the
   * columns were removed - would otherwise step HyperFormula while Handsontable stays unchanged.
   *
   * @param {Core} hot The Handsontable instance.
   * @returns {boolean} `true` when redo can proceed.
   */
  canRedo(hot: HotInstance): boolean {
    return clipRemovalRange(this.index, this.amount, hot.countCols()) !== null;
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: SettleCallback) {
    settleOnRemoveHook(hot, 'afterRemoveCol', redoneCallback, { wasRedone: false }, () => {
      hot.alter('remove_col', this.index, this.amount, 'UndoRedo.redo');
    });
  }
}
