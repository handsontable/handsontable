import Handsontable from './../../browser';
import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
import {arrayEach} from './../../helpers/array';

import {freezeColumnItem} from './contextMenuItem/freezeColumn';
import {unfreezeColumnItem} from './contextMenuItem/unfreezeColumn';

const privatePool = new WeakMap();
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

    privatePool.set(this, {
      moveByFreeze: false,
      afterFirstUse: false,
    });
    /**
     * Original column positions
     *
     * @type {Array}
     */
    this.frozenColumnsBasePositions = [];
    /**
     * Reference to the `ManualColumnMove` plugin.
     */
    this.manualColumnMovePlugin = void 0;
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

    this.addHook('afterContextMenuDefaultOptions', (options) => this.addContextMenuEntry(options));
    this.addHook('afterInit', () => this.onAfterInit());
    this.addHook('beforeColumnMove', (rows, target) => this.onBeforeColumnMove(rows, target));

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    let priv = privatePool.get(this);

    priv.afterFirstUse = false;
    priv.moveByFreeze = false;

    super.disablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Freeze the given column (add it to fixed columns).
   *
   * @param {Number} column Column index.
   */
  freezeColumn(column) {
    let priv = privatePool.get(this);
    let settings = this.hot.getSettings();

    if (!priv.afterFirstUse) {
      priv.afterFirstUse = true;
    }

    if (settings.fixedColumnsLeft === this.hot.countCols() || column <= settings.fixedColumnsLeft - 1) {
      return; // already fixed
    }

    priv.moveByFreeze = true;

    if (column !== this.getMovePlugin().columnsMapper.getValueByIndex(column)) {
      this.frozenColumnsBasePositions[settings.fixedColumnsLeft] = column;
    }

    this.getMovePlugin().moveColumn(column, settings.fixedColumnsLeft++);

  }

  /**
   * Unfreeze the given column (remove it from fixed columns and bring to it's previous position).
   *
   * @param {Number} column Column index.
   */
  unfreezeColumn(column) {
    let priv = privatePool.get(this);
    let settings = this.hot.getSettings();

    if (!priv.afterFirstUse) {
      priv.afterFirstUse = true;
    }

    if (settings.fixedColumnsLeft <= 0 || (column > settings.fixedColumnsLeft - 1)) {
      return; // not fixed
    }

    let returnCol = this.getBestColumnReturnPosition(column);

    priv.moveByFreeze = true;
    settings.fixedColumnsLeft--;

    this.getMovePlugin().moveColumn(column, returnCol + 1);
  }

  /**
   * Get the reference to the ManualColumnMove plugin.
   *
   * @private
   * @returns {Object}
   */
  getMovePlugin() {
    if (!this.manualColumnMovePlugin) {
      this.manualColumnMovePlugin = this.hot.getPlugin('manualColumnMove');
    }

    return this.manualColumnMovePlugin;
  }

  /**
   * Estimates the most fitting return position for unfrozen column.
   *
   * @private
   * @param {Number} column Column index.
   */
  getBestColumnReturnPosition(column) {
    let movePlugin = this.getMovePlugin();
    let settings = this.hot.getSettings();
    let i = settings.fixedColumnsLeft;
    let j = movePlugin.columnsMapper.getValueByIndex(i);
    let initialCol;

    if (this.frozenColumnsBasePositions[column] == null) {
      initialCol = movePlugin.columnsMapper.getValueByIndex(column);

      while (j < initialCol) {
        i++;
        j = movePlugin.columnsMapper.getValueByIndex(i);
      }

    } else {
      initialCol = this.frozenColumnsBasePositions[column];
      this.frozenColumnsBasePositions[column] = void 0;

      while (j <= initialCol) {
        i++;
        j = movePlugin.columnsMapper.getValueByIndex(i);
      }
      i = j;
    }

    return i - 1;
  }
  /**
   * Add the manualColumnFreeze context menu entries.
   *
   * @private
   * @param {Object} options Context menu options.
   */
  addContextMenuEntry(options) {
    options.items.push(
      Handsontable.plugins.ContextMenu.SEPARATOR,
      freezeColumnItem(this),
      unfreezeColumnItem(this)
    );
  }

  /**
   * Enabling `manualColumnMove` plugin on `afterInit` hook.
   *
   * @private
   */
  onAfterInit() {
    if (!this.getMovePlugin().isEnabled()) {
      this.getMovePlugin().enablePlugin();
    }
  }

  /**
   * Prevent moving the rows from/to fixed area.
   *
   * @private
   * @param {Array} rows
   * @param {Number} target
   */
  onBeforeColumnMove(rows, target) {
    let priv = privatePool.get(this);

    if (priv.afterFirstUse && !priv.moveByFreeze) {
      let frozenLen = this.hot.getSettings().fixedColumnsLeft;
      let disallowMoving = target < frozenLen;

      if (!disallowMoving) {
        arrayEach(rows, (value, index, array) => {
          if (value < frozenLen) {
            disallowMoving = true;
            return false;
          }
        });
      }

      if (disallowMoving) {
        return false;
      }
    }

    if (priv.moveByFreeze) {
      priv.moveByFreeze = false;
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }

}

export {ManualColumnFreeze};

registerPlugin('manualColumnFreeze', ManualColumnFreeze);
