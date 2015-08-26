import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
export {ManualColumnFreeze};

/**
 * This plugin allows to manually "freeze" and "unfreeze" a column using the Context Menu
 *
 * @class ManualColumnFreeze
 * @plugin ManualColumnFreeze
 */
class ManualColumnFreeze extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    if(this.isEnabled()) {
      this.bindHooks();
    }
  }

  isEnabled() {
    return !!this.hot.getSettings().manualColumnFreeze;
  }

  init() {
    super.init();

    // update plugin usages count for manualColumnPositions
    if (typeof this.hot.manualColumnPositionsPluginUsages !== 'undefined') {
      this.hot.manualColumnPositionsPluginUsages.push('manualColumnFreeze');
    } else {
      this.hot.manualColumnPositionsPluginUsages = ['manualColumnFreeze'];
    }

    this.fixedColumnsCount = this.hot.getSettings().fixedColumnsLeft;
  }

  bindHooks() {
    this.addHook('modifyCol', (col) => this.onModifyCol(col));
    this.addHook('afterContextMenuDefaultOptions', (defaultOptions) => this.addContextMenuEntry(defaultOptions));
  }

  /**
   * 'modiftyCol' callback, prevent doubling the column translation
   *
   * @param {Number} col
   */
  onModifyCol(col) {
    // if another plugin is using manualColumnPositions to modify column order, do not double the translation
    if (this.hot.manualColumnPositionsPluginUsages.length > 1) {
      return col;
    }
    return this.getModifiedColumnIndex(col);
  }

  getModifiedColumnIndex(col) {
    return this.hot.manualColumnPositions[col];
  }

  /**
   * Add the manualColumnFreeze context menu entries
   *
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
   * Freeze the given column (add it to fixed columns)
   *
   * @param {Number} col
   */
  freezeColumn(col) {
    if (col <= this.fixedColumnsCount - 1) {
      return; // already fixed
    }

    let modifiedColumn = this.getModifiedColumnIndex(col) || col;
    this.checkPositionData(modifiedColumn);
    this.modifyColumnOrder(modifiedColumn, col, null, 'freeze');

    this.addFixedColumn();

    this.hot.view.wt.wtOverlays.leftOverlay.refresh();
    this.hot.view.wt.wtOverlays.adjustElementsSize();
  }

  /**
   * Unfreeze the given column (remove it from fixed columns and bring to it's previous position)
   *
   * @param {Number} col
   */
  unfreezeColumn(col) {
    if (col > this.fixedColumnsCount - 1) {
      return; // not fixed
    }

    let returnCol = this.getBestColumnReturnPosition(col);

    let modifiedColumn = this.getModifiedColumnIndex(col) || col;
    this.checkPositionData(modifiedColumn);
    this.modifyColumnOrder(modifiedColumn, col, returnCol, 'unfreeze');
    this.removeFixedColumn();

    this.hot.view.wt.wtOverlays.leftOverlay.refresh();
    this.hot.view.wt.wtOverlays.adjustElementsSize();
  }

  /**
   * Increments the fixed columns count by one
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
   * Checks whether 'manualColumnPositions' array needs creating and/or initializing
   *
   * @param {Number} [col]
   */
  checkPositionData(col) {
    if (!this.hot.manualColumnPositions || this.hot.manualColumnPositions.length === 0) {
      if (!this.hot.manualColumnPositions) {
        this.hot.manualColumnPositions = [];
      }
    }
    if (col) {
      if (!this.hot.manualColumnPositions[col]) {
        this.createPositionData(col + 1);
      }
    } else {
      this.createPositionData(this.hot.countCols());
    }
  }

  /**
   * Fills the 'manualColumnPositions' array with consecutive column indexes
   *
   * @param {Number} len
   */
  createPositionData(len) {
    if (this.hot.manualColumnPositions.length < len) {
      for (let i = this.hot.manualColumnPositions.length; i < len; i++) {
        this.hot.manualColumnPositions[i] = i;
      }
    }
  }

  /**
   * Updates the column order array used by modifyCol callback
   *
   * @param {Number} col
   * @param {Number} actualCol column index of the currently selected cell
   * @param {Number|null} returnCol suggested return slot for the unfreezed column (can be null)
   * @param {String} action 'freeze' or 'unfreeze'
   */
  modifyColumnOrder(col, actualCol, returnCol, action) {
    if (returnCol == null) {
      returnCol = col;
    }

    if (action === 'freeze') {
      this.hot.manualColumnPositions.splice(this.fixedColumnsCount, 0, this.hot.manualColumnPositions.splice(actualCol, 1)[0]);
    } else if (action === 'unfreeze') {
      this.hot.manualColumnPositions.splice(returnCol, 0, this.hot.manualColumnPositions.splice(actualCol, 1)[0]);
    }
  }

  /**
   * Estimates the most fitting return position for unfreezed column
   *
   * @param {Number} col
   */
  getBestColumnReturnPosition(col) {
    let i = this.fixedColumnsCount,
      j = this.getModifiedColumnIndex(i),
      initialCol = this.getModifiedColumnIndex(col);
    while (j < initialCol) {
      i++;
      j = this.getModifiedColumnIndex(i);
    }
    return i - 1;
  }

}

registerPlugin('manualColumnFreeze', ManualColumnFreeze);