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
   * @param {number} index The visual row index.
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
    super();
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

    hot.alter('insert_row_above', this.index, this.data.length, 'UndoRedo.undo');

    this.removedCellMetas.forEach(([rowIndex, columnIndex, cellMeta]) => {
      hot.setCellMetaObject(rowIndex, columnIndex, cellMeta);
    });

    hot.addHookOnce('afterViewRender', undoneCallback);
    hot.setSourceDataAtCell(changes, null, null, 'UndoRedo.undo');
    hot.rowIndexMapper.setIndexesSequence(this.rowIndexesSequence);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    hot.addHookOnce('afterRemoveRow', redoneCallback);
    hot.alter('remove_row', this.index, this.data.length, 'UndoRedo.redo');
  }
}
