import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';
import { getCellMetas, collectAffectedMergedCells, restoreMergedCells } from '../utils';
import { deepClone, isPlainObject } from '../../../helpers/object';
import { isDataAccessorFn } from '../../../dataMap/dataSource';
import type { DataAccessorFn } from '../../../dataMap/dataSource';

/**
 * Recursively deletes function-valued keys from a cloned row. `deepClone` keeps functions by
 * reference at every depth, so a top-level-only sweep would still alias a nested closure of the
 * removed row onto the row the `dataSchema` creates on undo.
 *
 * @param {unknown} value The cloned value to sweep.
 */
function stripFunctionValues(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (typeof entry === 'function') {
        value[index] = null;
      } else {
        stripFunctionValues(entry);
      }
    });

  } else if (isPlainObject(value)) {
    Object.keys(value).forEach((key) => {
      if (typeof value[key] === 'function') {
        delete value[key];
      } else {
        stripFunctionValues(value[key]);
      }
    });
  }
}

/**
 * Snapshots one source row for later restoration. Function-valued keys are dropped (at every
 * depth) – a function is never a cell value, and writing it back would alias the removed row's
 * closure onto the row the `dataSchema` creates on undo. `__children` is dropped because
 * `nestedRows` restores its own tree.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} physicalRow Physical index of the row being removed.
 * @returns {unknown} A detached copy of the row.
 */
function captureRowData(hot: HotInstance, physicalRow: number): unknown {
  const rowData = deepClone(hot.getSourceDataAtRow(physicalRow));

  if (isPlainObject(rowData)) {
    delete rowData.__children;
    stripFunctionValues(rowData);
  }

  return rowData;
}

/**
 * Collects the `[physicalColumnIndex, accessor]` pair of every column whose `data` is an accessor
 * function. The set does not depend on the row, so it is scanned once per removal and reused for
 * every removed row. Returns an empty list when no column uses a function `data` accessor, so the
 * action shape stays unchanged for the common case.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {Array<[number, DataAccessorFn]>} `[physicalColumnIndex, accessor]` pairs.
 */
function collectAccessorColumns(hot: HotInstance): Array<[number, DataAccessorFn]> {
  const accessorColumns: Array<[number, DataAccessorFn]> = [];

  for (let visualColumn = 0; visualColumn < hot.countCols(); visualColumn++) {
    // `colToProp` is declared as `string | number | null` but hands back the `columns[].data`
    // accessor as-is, so read it as `unknown` and narrow it here. The loop is bounded by
    // `countCols()`, so every index resolves and the `null` case cannot arise.
    const prop: unknown = hot.colToProp(visualColumn);

    if (isDataAccessorFn(prop)) {
      accessorColumns.push([hot.toPhysicalColumn(visualColumn), prop]);
    }
  }

  return accessorColumns;
}

/**
 * Reads the values of every accessor-function column for one row.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} physicalRow Physical index of the row being removed.
 * @param {Array<[number, DataAccessorFn]>} accessorColumns The pairs collected by
 *   `collectAccessorColumns`.
 * @returns {Array<[number, unknown]>} `[physicalColumnIndex, value]` pairs.
 */
function captureAccessorValues(
  hot: HotInstance, physicalRow: number, accessorColumns: Array<[number, DataAccessorFn]>
): Array<[number, unknown]> {
  return accessorColumns.map(
    ([physicalColumn, prop]) => [physicalColumn, hot.getSourceDataAtCell(physicalRow, prop)]
  );
}

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
   * @param {Array} accessorValues Per removed row, the `[physicalColumnIndex, value]` pairs of every column whose
   *   `data` is an accessor function. Those values live behind the function and are invisible to the
   *   `data` snapshot, so they are captured and restored through the accessor.
   */
  accessorValues;
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
   * Initializes the remove row action with the removed data, captured accessor-column values, row index
   * sequence, fixed-row counts, cell meta backup, and affected merged cells.
   */
  constructor({
    index,
    data,
    accessorValues,
    fixedRowsBottom,
    fixedRowsTop,
    rowIndexesSequence,
    removedCellMetas,
    removedMergedCells,
  }: {
    index: number, indexes?: number[], data: unknown[][], accessorValues: Array<Array<[number, unknown]>>,
    fixedRowsBottom: number, fixedRowsTop: number,
    rowIndexesSequence: number[], removedCellMetas: unknown[],
    removedMergedCells: Array<{ row: number, col: number, rowspan: number, colspan: number }>
  }) {
    super('remove_row');
    this.index = index;
    this.data = data;
    this.accessorValues = accessorValues;
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
        const removedData: unknown[] = [];
        const removedAccessorValues: Array<Array<[number, unknown]>> = [];
        const accessorColumns = collectAccessorColumns(hot);

        for (let i = 0; i < amount; i++) {
          removedData.push(captureRowData(hot, physicalRowIndex + i));
          removedAccessorValues.push(captureAccessorValues(hot, physicalRowIndex + i, accessorColumns));
        }

        return new RemoveRowAction({
          index: physicalRowIndex,
          data: removedData as unknown[][],
          accessorValues: removedAccessorValues,
          fixedRowsBottom: hot.getSettings().fixedRowsBottom ?? 0,
          fixedRowsTop: hot.getSettings().fixedRowsTop ?? 0,
          rowIndexesSequence: hot.rowIndexMapper.getIndexesSequence(),
          removedCellMetas: getCellMetas(hot, physicalRowIndex, lastRowIndex, 0, hot.countCols() - 1),
          removedMergedCells: collectAffectedMergedCells(hot, 'row', index, amount),
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

    // Accessor-column values live behind a function and are invisible to `data`; restore them
    // through the accessor itself, the same way `dataSource.setAtCell` writes through it. The guard
    // also bails out when the column has no visual index left – a column trimmed since the removal
    // makes `toVisualColumn` return `null`, and `colToProp(null)` echoes `null` back, which is not
    // an accessor. A hidden column keeps its visual index, so it restores like any other. A column
    // trimmed at removal time is never captured either, because `captureAccessorValues` iterates
    // `countCols()`, which does not count trimmed columns.
    this.accessorValues.forEach((rowValues, rowIndexDelta) => {
      rowValues.forEach(([physicalColumn, value]) => {
        const prop: unknown = hot.colToProp(hot.toVisualColumn(physicalColumn));

        if (isDataAccessorFn(prop)) {
          changes.push([this.index + rowIndexDelta, prop, value]);
        }
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

    try {
      hot.setSourceDataAtCell(changes, undefined, undefined, 'UndoRedo.undo');
    } catch (error) {
      // The hook was armed before the write because `setSourceDataAtCell` renders internally. When
      // the write throws, the settle callback must not stay armed – it would fire on the next
      // render and push this half-undone action onto the redo stack.
      hot.removeHook('afterViewRender', undoneCallback);
      throw error;
    }
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
