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

  constructor({
    index,
    data,
    fixedRowsBottom,
    fixedRowsTop,
    rowIndexesSequence,
    removedCellMetas
  }) {
    super('remove_row');
    this.index = index;
    this.data = data;
    this.fixedRowsBottom = fixedRowsBottom;
    this.fixedRowsTop = fixedRowsTop;
    this.rowIndexesSequence = rowIndexesSequence;
    this.removedCellMetas = removedCellMetas;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeRemoveRow', (index, amount, logicRows, source) => {
      const wrappedAction = () => {
        const physicalRowIndex = hot.toPhysicalRow(index);
        const lastRowIndex = physicalRowIndex + amount - 1;
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
          rowIndexesSequence: hot.rowIndexMapper.getIndexesSequence(),
          removedCellMetas: getCellMetas(hot, physicalRowIndex, lastRowIndex, 0, hot.countCols() - 1)
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
    const changes = [];

    // Changing by the reference as `updateSettings` doesn't work the best.
    settings.fixedRowsBottom = this.fixedRowsBottom;
    settings.fixedRowsTop = this.fixedRowsTop;

    // Prepare the change list to fill the source data.
    this.data.forEach((dataRow, rowIndexDelta) => {
      Object.keys(dataRow).forEach((columnProp) => {
        const columnIndex = parseInt(columnProp, 10);

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
    hot.addHookOnce('afterRemoveRow', redoneCallback);
    hot.alter('remove_row', hot.toVisualRow(this.index), this.data.length, 'UndoRedo.redo');
  }
}
