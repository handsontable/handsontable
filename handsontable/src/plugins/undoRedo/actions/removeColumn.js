import { BaseAction } from './_base';
import { getCellMetas } from '../utils';
import { rangeEach } from '../../../helpers/number';
import { deepClone } from '../../../helpers/object';

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
   * @param {Array} rowIndexMapperState The state of the row index mapper before the action was performed.
   */
  rowIndexMapperState;
  /**
   * @param {Array} columnIndexMapperState The state of the column index mapper before the action was performed.
   */
  columnIndexMapperState;
  /**
   * @param {number} fixedColumnsStart Number of fixed columns on the left. Remove column action change it sometimes.
   */
  fixedColumnsStart;
  /**
   * @param {Array} removedCellMetas List of removed cell metas.
   */
  removedCellMetas;
  /**
   * @param {CellRange[]} selectionState The dump of the selection range taken before the action.
   */
  selectionState;

  constructor({
    index,
    indexes,
    data,
    amount,
    headers,
    rowIndexMapperState,
    columnIndexMapperState,
    fixedColumnsStart,
    removedCellMetas,
    selectionState,
  }) {
    super('remove_col');
    this.index = index;
    this.indexes = indexes;
    this.data = data;
    this.amount = amount;
    this.headers = headers;
    this.rowIndexMapperState = rowIndexMapperState;
    this.columnIndexMapperState = columnIndexMapperState;
    this.fixedColumnsStart = fixedColumnsStart;
    this.removedCellMetas = removedCellMetas;
    this.selectionState = selectionState;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeRemoveCol', (index, amount, logicColumns, source) => {
      const wrappedAction = () => {
        const physicalColumnIndex = hot.toPhysicalColumn(index);
        const colHeaders = hot.getSettings().colHeaders;
        const headers = [];
        const removedData = deepClone(
          hot.getSourceData(
            0, physicalColumnIndex, hot.countSourceRows() - 1, physicalColumnIndex + amount - 1
          )
        );

        if (Array.isArray(colHeaders)) {
          rangeEach(amount - 1, (i) => {
            headers.push(colHeaders[physicalColumnIndex + i] ?? null);
          });
        }

        return new RemoveColumnAction({
          index: physicalColumnIndex,
          data: removedData,
          amount,
          headers,
          rowIndexMapperState: hot.rowIndexMapper.exportIndexes(),
          columnIndexMapperState: hot.columnIndexMapper.exportIndexes(),
          selectionState: hot.selection.exportSelection(),
          fixedColumnsStart: hot.getSettings().fixedColumnsStart,
          removedCellMetas: getCellMetas(hot, 0, hot.countRows(), index, index + amount - 1),
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

    hot.rowIndexMapper.importIndexes(this.rowIndexMapperState);
    hot.columnIndexMapper.importIndexes(this.columnIndexMapperState);
    hot._getDataSourceMap().insertColumnsAt(this.index, this.data);
    hot.selection.importSelection(this.selectionState);

    if (this.headers.length > 0) {
      const colHeaders = hot.getSettings().colHeaders;

      hot.getSettings().colHeaders = [
        ...colHeaders.slice(0, this.index),
        ...this.headers,
        ...colHeaders.slice(this.index)
      ];
    }

    this.removedCellMetas.forEach(([rowIndex, columnIndex, cellMeta]) => {
      hot.setCellMetaObject(rowIndex, columnIndex, cellMeta);
    });

    hot.addHookOnce('afterViewRender', undoneCallback);
    hot.render();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    hot.addHookOnce('afterRemoveCol', redoneCallback);
    hot.alter('remove_col', hot.toVisualColumn(this.index), this.amount, 'UndoRedo.redo');
  }
}
