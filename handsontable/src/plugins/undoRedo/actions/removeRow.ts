import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';
import { getCellMetas } from '../utils';
import { deepClone } from '../../../helpers/object';

/**
 * Action that tracks changes in row removal.
 *
 * @class RemoveRowAction
 * @private
 */
export class RemoveRowAction extends BaseAction {
  /**
   * @param {number} index The physical row index.
   */
  index;
  /**
   * @param {Array} data The removed data.
   */
  data;
  /**
   * @param {number} fixedRowsBottom Number of fixed rows on the bottom. Remove row action change it sometimes.
   */
  fixedRowsBottom;
  /**
   * @param {number} fixedRowsTop Number of fixed rows on the top. Remove row action change it sometimes.
   */
  fixedRowsTop;
  /**
   * @param {Array} rowIndexesSequence Row index sequence taken from the row index mapper.
   */
  rowIndexesSequence;
  /**
   * @param {Array} removedCellMetas List of removed cell metas.
   */
  removedCellMetas;
  /**
   * @param {Array} removedMergedCells List of merged cell ranges fully contained within
   *   the removed rows. Stored as plain `{ row, col, rowspan, colspan }` objects in visual coords.
   */
  removedMergedCells;

  /**
   * Initializes the remove row action with the removed data, row index sequence, fixed-row counts, cell meta backup, and affected merged cells.
   */
  constructor({
    index,
    data,
    fixedRowsBottom,
    fixedRowsTop,
    rowIndexesSequence,
    removedCellMetas,
    removedMergedCells,
  }: {
    index: number, indexes?: number[], data: unknown[][], fixedRowsBottom: number, fixedRowsTop: number,
    rowIndexesSequence: number[], removedCellMetas: unknown[],
    removedMergedCells: Array<{ row: number, col: number, rowspan: number, colspan: number }>
  }) {
    super('remove_row');
    this.index = index;
    this.data = data;
    this.fixedRowsBottom = fixedRowsBottom;
    this.fixedRowsTop = fixedRowsTop;
    this.rowIndexesSequence = rowIndexesSequence;
    this.removedCellMetas = removedCellMetas;
    this.removedMergedCells = removedMergedCells;
  }

  /**
   * Registers the `beforeRemoveRow` hook listener that captures removed row data and records a RemoveRowAction.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeRemoveRow', (index: number, amount: number, logicRows: unknown, source: string) => {
      const wrappedAction = () => {
        const physicalRowIndex = hot.toPhysicalRow(index);
        const lastRowIndex = physicalRowIndex + amount - 1;
        const removedData = [];

        for (let i = 0; i < amount; i++) {
          const rowData = deepClone(hot.getSourceDataAtRow(physicalRowIndex + i));

          // `nestedRows` manages its `__children` tree restoration on undo
          // independently; writing `__children` back via `setSourceDataAtCell`
          // would clash with the plugin's internal state.
          if (rowData && typeof rowData === 'object' && !Array.isArray(rowData)) {
            delete (rowData as Record<string, unknown>).__children;
          }

          removedData.push(rowData);
        }

        return new RemoveRowAction({
          index: physicalRowIndex,
          data: removedData as unknown[][],
          fixedRowsBottom: hot.getSettings().fixedRowsBottom ?? 0,
          fixedRowsTop: hot.getSettings().fixedRowsTop ?? 0,
          rowIndexesSequence: hot.rowIndexMapper.getIndexesSequence(),
          removedCellMetas: getCellMetas(hot, physicalRowIndex, lastRowIndex, 0, hot.countCols() - 1),
          removedMergedCells: collectAffectedMergedCells(hot, index, amount),
        });
      };

      type UndoRedoPlugin = { done: (wrappedAction: () => RemoveRowAction, source: string) => void };

      (undoRedoPlugin as UndoRedoPlugin).done(wrappedAction, source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const settings = hot.getSettings();
    const changes: unknown[][] = [];

    // Changing by the reference as `updateSettings` doesn't work the best.
    settings.fixedRowsBottom = this.fixedRowsBottom;
    settings.fixedRowsTop = this.fixedRowsTop;

    // Prepare the change list to fill the source data.
    this.data.forEach((row, rowIndexDelta) => {
      const dataRow = row as unknown as Record<string, unknown>;

      Object.keys(dataRow).forEach((columnProp) => {
        const columnIndex = Number.parseInt(columnProp, 10);

        changes.push([this.index + rowIndexDelta, isNaN(columnIndex) ? columnProp : columnIndex, dataRow[columnProp]]);
      });
    });

    // The indexes sequence have to be applied twice.
    //  * First for proper index translation. The alter method accepts a visual index
    //    and we are able to retrieve the correct index indicating where to add a new row based
    //    only on the previous order state of the rows;
    //  * The alter method shifts the indexes (a side-effect), so we need to reapply the indexes sequence
    //    the same as it was in the previous state;
    hot.rowIndexMapper.setIndexesSequence(this.rowIndexesSequence);
    hot.alter('insert_row_above', hot.toVisualRow(this.index), this.data.length, 'UndoRedo.undo');
    hot.rowIndexMapper.setIndexesSequence(this.rowIndexesSequence);

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
    hot.addHookOnce('afterRemoveRow', redoneCallback);
    hot.alter('remove_row', hot.toVisualRow(this.index), this.data.length, 'UndoRedo.redo');
  }
}

/**
 * Collects merged cells that overlap the removed visual row range.
 * The plugin's own `shiftCollections` logic mutates surviving merges asymmetrically
 * (a partial top removal cannot be reversed on `afterCreateRow`), so on undo we
 * must restore every overlapping merge from its pre-removal state.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} visualRow First visual row being removed.
 * @param {number} amount Number of rows being removed.
 * @returns {Array} Array of `{ row, col, rowspan, colspan }` objects.
 */
function collectAffectedMergedCells(hot: HotInstance, visualRow: number, amount: number) {
  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return [];
  }

  const lastVisualRow = visualRow + amount - 1;
  const affected: Array<{ row: number; col: number; rowspan: number; colspan: number }> = [];

  type MergedCell = { row: number; col: number; rowspan: number; colspan: number };

  mergeCellsPlugin.mergedCellsCollection?.mergedCells.forEach(({ row, col, rowspan, colspan }: MergedCell) => {
    const mergeStart = row;
    const mergeEnd = row + rowspan - 1;

    if (mergeStart <= lastVisualRow && mergeEnd >= visualRow) {
      affected.push({ row, col, rowspan, colspan });
    }
  });

  return affected;
}

/**
 * Re-applies merged cells affected by row removal. Any leftover partial merge in
 * the captured area is unmerged first so the original range can be re-merged.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {Array} mergedCells Array of `{ row, col, rowspan, colspan }` objects.
 */
function restoreMergedCells(
  hot: HotInstance, mergedCells: Array<{ row: number; col: number; rowspan: number; colspan: number }>
) {
  if (!mergedCells || mergedCells.length === 0) {
    return;
  }

  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return;
  }

  type MergedCell = { row: number; col: number; rowspan: number; colspan: number };

  mergedCells.forEach(({ row, col, rowspan, colspan }: MergedCell) => {
    const endRow = row + rowspan - 1;
    const endCol = col + colspan - 1;
    const start = hot._createCellCoords(row, col);
    const end = hot._createCellCoords(endRow, endCol);
    const range = hot._createCellRange(start, start, end);

    mergeCellsPlugin.unmergeRange(range, true);
    mergeCellsPlugin.merge(row, col, endRow, endCol);
  });
}
