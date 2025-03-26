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
   * @param {Array} rowIndexMapperState The state of the row index mapper before the action was performed.
   */
  rowIndexMapperState;
  /**
   * @param {Array} columnIndexMapperState The state of the column index mapper before the action was performed.
   */
  columnIndexMapperState;
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
    data,
    fixedRowsBottom,
    fixedRowsTop,
    rowIndexMapperState,
    columnIndexMapperState,
    removedCellMetas,
    selectionState,
  }) {
    super('remove_row');
    this.index = index;
    this.data = data;
    this.fixedRowsBottom = fixedRowsBottom;
    this.fixedRowsTop = fixedRowsTop;
    this.rowIndexMapperState = rowIndexMapperState;
    this.columnIndexMapperState = columnIndexMapperState;
    this.removedCellMetas = removedCellMetas;
    this.selectionState = selectionState;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeRemoveRow', (index, amount, logicRows, source) => {
      const wrappedAction = () => {
        const physicalRowIndex = hot.toPhysicalRow(index);
        const removedData = deepClone(
          hot.getSourceData(
            physicalRowIndex, 0, physicalRowIndex + amount - 1, hot.countSourceCols() - 1
          )
        );

        return new RemoveRowAction({
          index: physicalRowIndex,
          data: removedData,
          fixedRowsBottom: hot.getSettings().fixedRowsBottom,
          fixedRowsTop: hot.getSettings().fixedRowsTop,
          rowIndexMapperState: hot.rowIndexMapper.exportIndexes(),
          columnIndexMapperState: hot.columnIndexMapper.exportIndexes(),
          selectionState: hot.selection.exportSelection(),
          removedCellMetas: getCellMetas(hot, index, index + amount - 1, 0, hot.countCols() - 1)
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
    settings.fixedRowsBottom = this.fixedRowsBottom;
    settings.fixedRowsTop = this.fixedRowsTop;

    hot.rowIndexMapper.importIndexes(this.rowIndexMapperState);
    hot.columnIndexMapper.importIndexes(this.columnIndexMapperState);
    hot._getDataSourceMap().insertRowsAt(this.index, this.data);
    hot.selection.importSelection(this.selectionState);

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
    hot.addHookOnce('afterRemoveRow', redoneCallback);
    hot.alter('remove_row', hot.toVisualRow(this.index), this.data.length, 'UndoRedo.redo');
  }
}
