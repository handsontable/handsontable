import Handsontable from './../../browser';
import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';

/**
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu.
 * You can turn it on by setting a `manualColumnFreeze` property to `true`.
 *
 * @plugin ManualColumnFreeze
 * @dependencies ManualColumnMove
 */
class ManualColumnFreeze extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    this.manualColumnMovePlugin = null;
    this.frozenColumnsBasePositions = [];
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualColumnFreeze;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.addHook('modifyCol', (col) => this.onModifyCol(col));
    this.addHook('afterContextMenuDefaultOptions', (defaultOptions) => this.addContextMenuEntry(defaultOptions));
    super.enablePlugin();
  }

  /**
   * Init settings.
   */
  init() {
    super.init();

    this.fixedColumnsCount = this.hot.getSettings().fixedColumnsLeft;
  }

  /**
   * Get the reference to the ManualColumnMove plugin.
   *
   * @returns {Object}
   */
  getManualColumnMovePlugin() {
    if (!this.manualColumnMovePlugin) {
      this.manualColumnMovePlugin = this.hot.getPlugin('manualColumnMove');
    }

    return this.manualColumnMovePlugin;
  }

  /**
   * 'modiftyCol' callback, prevent doubling the column translation.
   *
   * @private
   * @param {Number} column
   */
  onModifyCol(column) {
    // if another plugin is using manualColumnPositions to modify column order, do not double the translation
    if (this.getManualColumnMovePlugin().isEnabled()) {
      return column;
    }

    return this.getLogicalColumnIndex(column);
  }

  /**
   * Add the manualColumnFreeze context menu entries.
   *
   * @private
   * @param {Object} defaultOptions
   */
  addContextMenuEntry(defaultOptions) {
    let _this = this;

    defaultOptions.items.push(
      Handsontable.plugins.ContextMenu.SEPARATOR, {
        key: 'freeze_column',
        name: function() {
          let selectedColumn = _this.hot.getSelected()[1];

          if (selectedColumn > _this.fixedColumnsCount - 1) {
            return 'Freeze this column';
          } else {
            return 'Unfreeze this column';
          }
        },
        disabled: function() {
          let selection = _this.hot.getSelected();

          return selection[1] !== selection[3];
        },
        callback: function() {
          let selectedColumn = _this.hot.getSelected()[1];

          if (selectedColumn > _this.fixedColumnsCount - 1) {
            _this.freezeColumn(selectedColumn);
          } else {
            _this.unfreezeColumn(selectedColumn);
          }
        }
      });
  }

  /**
   * Freeze the given column (add it to fixed columns).
   *
   * @param {Number} column Column index.
   */
  freezeColumn(column) {
    if (column <= this.fixedColumnsCount - 1) {
      return; // already fixed
    }

    if (column !== this.getLogicalColumnIndex(column)) {
      this.frozenColumnsBasePositions[this.fixedColumnsCount] = column;
    }

    this.changeColumnPositions(column, this.fixedColumnsCount);
    this.addFixedColumn();

    this.hot.view.wt.wtOverlays.leftOverlay.refresh();
    this.hot.view.wt.wtOverlays.adjustElementsSize();
  }

  /**
   * Unfreeze the given column (remove it from fixed columns and bring to it's previous position).
   *
   * @param {Number} column Column index.
   */
  unfreezeColumn(column) {
    if (column > this.fixedColumnsCount - 1) {
      return; // not fixed
    }

    let returnCol = this.getBestColumnReturnPosition(column);
    this.changeColumnPositions(column, returnCol);
    this.removeFixedColumn();

    this.hot.view.wt.wtOverlays.leftOverlay.refresh();
    this.hot.view.wt.wtOverlays.adjustElementsSize();
  }

  /**
   * Increments the fixed columns count by one.
   */
  addFixedColumn() {
    this.hot.updateSettings({
      fixedColumnsLeft: this.fixedColumnsCount + 1
    });

    this.fixedColumnsCount++;
  }

  /**
   * Decrements the fixed columns count by one
   */
  removeFixedColumn() {
    this.hot.updateSettings({
      fixedColumnsLeft: this.fixedColumnsCount - 1
    });

    this.fixedColumnsCount--;
  }

  /**
   * Estimates the most fitting return position for unfrozen column.
   *
   * @param {Number} column Column index.
   */
  getBestColumnReturnPosition(column) {
    let i = this.fixedColumnsCount;
    let j = this.getLogicalColumnIndex(i);
    let initialCol;

    if (this.frozenColumnsBasePositions[column] == null) {
      initialCol = this.getLogicalColumnIndex(column);

      while (j < initialCol) {
        i++;
        j = this.getLogicalColumnIndex(i);
      }

    } else {
      initialCol = this.frozenColumnsBasePositions[column];
      this.frozenColumnsBasePositions[column] = void 0;

      while (j <= initialCol) {
        i++;
        j = this.getLogicalColumnIndex(i);
      }
      i = j;
    }

    return i - 1;
  }

  /**
   * Get the visible column index by the provided logical column.
   *
   * @param {Number} column Logical column index.
   */
  getVisibleColumnIndex(column) {
    return this.getManualColumnMovePlugin().getVisibleColumnIndex(column);
  }

  /**
   * Get the logical column index by the provided visible column.
   *
   * @param {Number} column Visible column index.
   */
  getLogicalColumnIndex(column) {
    return this.getManualColumnMovePlugin().getLogicalColumnIndex(column);
  }

  /**
   * Move the `sourceColumn` after the `destinationColumn`.
   *
   * @param {Number} sourceColumn Index of the source column.
   * @param {Number} destinationColumn Index of the destination column.
   */
  changeColumnPositions(sourceColumn, destinationColumn) {
    this.getManualColumnMovePlugin().changeColumnPositions(sourceColumn, destinationColumn);
  }
}

export {ManualColumnFreeze};

registerPlugin('manualColumnFreeze', ManualColumnFreeze);
