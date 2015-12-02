import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';

/**
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu.
 * You can turn it on by setting a `manualColumnFreeze` property to `true`.
 *
 * @plugin ManualColumnFreeze
 */
class ManualColumnFreeze extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);
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
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  init() {
    super.init();

    // update plugin usages count for manualColumnPositions
    if (typeof this.hot.manualColumnPositionsPluginUsages === 'undefined') {
      this.hot.manualColumnPositionsPluginUsages = ['manualColumnFreeze'];
    } else {
      this.hot.manualColumnPositionsPluginUsages.push('manualColumnFreeze');
    }

    this.fixedColumnsCount = this.hot.getSettings().fixedColumnsLeft;
  }

  /**
   * 'modiftyCol' callback, prevent doubling the column translation.
   *
   * @private
   * @param {Number} column
   */
  onModifyCol(column) {
    // if another plugin is using manualColumnPositions to modify column order, do not double the translation
    if (this.hot.manualColumnPositionsPluginUsages.length > 1) {
      return column;
    }

    return this.getModifiedColumnIndex(column);
  }

  getModifiedColumnIndex(column) {
    return this.hot.manualColumnPositions[column];
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

    let modifiedColumn = this.getModifiedColumnIndex(column) || column;

    this.checkPositionData(modifiedColumn);
    this.modifyColumnOrder(modifiedColumn, column, null, 'freeze');

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
    let modifiedColumn = this.getModifiedColumnIndex(column) || column;

    this.checkPositionData(modifiedColumn);
    this.modifyColumnOrder(modifiedColumn, column, returnCol, 'unfreeze');
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
   * Checks whether 'manualColumnPositions' array needs creating and/or initializing.
   *
   * @param {Number} [column] Column index.
   */
  checkPositionData(column) {
    if (!this.hot.manualColumnPositions || this.hot.manualColumnPositions.length === 0) {
      if (!this.hot.manualColumnPositions) {
        this.hot.manualColumnPositions = [];
      }
    }
    if (column) {
      if (!this.hot.manualColumnPositions[column]) {
        this.createPositionData(column + 1);
      }
    } else {
      this.createPositionData(this.hot.countCols());
    }
  }

  /**
   * Fills the 'manualColumnPositions' array with consecutive column indexes.
   *
   * @param {Number} length Length for the array.
   */
  createPositionData(length) {
    if (this.hot.manualColumnPositions.length < length) {
      for (let i = this.hot.manualColumnPositions.length; i < length; i++) {
        this.hot.manualColumnPositions[i] = i;
      }
    }
  }

  /**
   * Updates the column order array used by modifyCol callback.
   *
   * @param {Number} column Column index.
   * @param {Number} actualColumn Column index of the currently selected cell.
   * @param {Number|null} returnColumn suggested return slot for the unfrozen column (can be `null`).
   * @param {String} action 'freeze' or 'unfreeze'.
   */
  modifyColumnOrder(column, actualColumn, returnColumn, action) {
    if (returnColumn == null) {
      returnColumn = column;
    }

    if (action === 'freeze') {
      this.hot.manualColumnPositions.splice(this.fixedColumnsCount, 0, this.hot.manualColumnPositions.splice(actualColumn, 1)[0]);
    } else if (action === 'unfreeze') {
      this.hot.manualColumnPositions.splice(returnColumn, 0, this.hot.manualColumnPositions.splice(actualColumn, 1)[0]);
    }
  }

  /**
   * Estimates the most fitting return position for unfrozen column.
   *
   * @param {Number} column Column index.
   */
  getBestColumnReturnPosition(column) {
    let i = this.fixedColumnsCount;
    let j = this.getModifiedColumnIndex(i);
    let initialCol = this.getModifiedColumnIndex(column);

    while (j < initialCol) {
      i++;
      j = this.getModifiedColumnIndex(i);
    }

    return i - 1;
  }
}

export {ManualColumnFreeze};

registerPlugin('manualColumnFreeze', ManualColumnFreeze);
