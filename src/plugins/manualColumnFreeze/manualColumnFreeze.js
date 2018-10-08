import BasePlugin from './../_base';
import { registerPlugin } from './../../plugins';
import { arrayEach } from './../../helpers/array';
import freezeColumnItem from './contextMenuItem/freezeColumn';
import unfreezeColumnItem from './contextMenuItem/unfreezeColumn';

import './manualColumnFreeze.css';

const privatePool = new WeakMap();
/**
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu or using API.
 * You can turn it on by setting a {@link Options#manualColumnFreeze} property to `true`.
 *
 * @example
 * ```js
 * // Enables the plugin
 * manualColumnFreeze: true,
 * ```
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
     * @private
     * @type {Array}
     */
    this.frozenColumnsBasePositions = [];
    /**
     * Reference to the `ManualColumnMove` plugin.
     *
     * @private
     * @type {ManualColumnMove}
     */
    this.manualColumnMovePlugin = void 0;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ManualColumnFreeze#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualColumnFreeze;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.addContextMenuEntry(options));
    this.addHook('afterInit', () => this.onAfterInit());
    this.addHook('beforeColumnMove', (rows, target) => this.onBeforeColumnMove(rows, target));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    const priv = privatePool.get(this);

    priv.afterFirstUse = false;
    priv.moveByFreeze = false;

    super.disablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Freezes the given column (add it to fixed columns).
   *
   * @param {Number} column Visual column index.
   */
  freezeColumn(column) {
    const priv = privatePool.get(this);
    const settings = this.hot.getSettings();

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

    this.getMovePlugin().moveColumn(column, settings.fixedColumnsLeft);

    settings.fixedColumnsLeft += 1;
  }

  /**
   * Unfreezes the given column (remove it from fixed columns and bring to it's previous position).
   *
   * @param {Number} column Visual column index.
   */
  unfreezeColumn(column) {
    const priv = privatePool.get(this);
    const settings = this.hot.getSettings();

    if (!priv.afterFirstUse) {
      priv.afterFirstUse = true;
    }

    if (settings.fixedColumnsLeft <= 0 || (column > settings.fixedColumnsLeft - 1)) {
      return; // not fixed
    }

    const returnCol = this.getBestColumnReturnPosition(column);

    priv.moveByFreeze = true;
    settings.fixedColumnsLeft -= 1;

    this.getMovePlugin().moveColumn(column, returnCol + 1);
  }

  /**
   * Gets the reference to the ManualColumnMove plugin.
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
   * @param {Number} column Visual column index.
   */
  getBestColumnReturnPosition(column) {
    const movePlugin = this.getMovePlugin();
    const settings = this.hot.getSettings();
    let i = settings.fixedColumnsLeft;
    let j = movePlugin.columnsMapper.getValueByIndex(i);
    let initialCol;

    if (this.frozenColumnsBasePositions[column] === null || this.frozenColumnsBasePositions[column] === void 0) {
      initialCol = movePlugin.columnsMapper.getValueByIndex(column);

      while (j !== null && j <= initialCol) {
        i += 1;
        j = movePlugin.columnsMapper.getValueByIndex(i);
      }

    } else {
      initialCol = this.frozenColumnsBasePositions[column];
      this.frozenColumnsBasePositions[column] = void 0;

      while (j !== null && j <= initialCol) {
        i += 1;
        j = movePlugin.columnsMapper.getValueByIndex(i);
      }
      i = j;
    }

    return i - 1;
  }

  /**
   * Adds the manualColumnFreeze context menu entries.
   *
   * @private
   * @param {Object} options Context menu options.
   */
  addContextMenuEntry(options) {
    options.items.push(
      { name: '---------' },
      freezeColumnItem(this),
      unfreezeColumnItem(this)
    );
  }

  /**
   * Enables `manualColumnMove` plugin on `afterInit` hook.
   *
   * @private
   */
  onAfterInit() {
    if (!this.getMovePlugin().isEnabled()) {
      this.getMovePlugin().enablePlugin();
    }
  }

  /**
   * Prevents moving the rows from/to fixed area.
   *
   * @private
   * @param {Array} rows
   * @param {Number} target
   */
  onBeforeColumnMove(rows, target) {
    const priv = privatePool.get(this);

    if (priv.afterFirstUse && !priv.moveByFreeze) {
      const frozenLen = this.hot.getSettings().fixedColumnsLeft;
      let disallowMoving = target < frozenLen;

      if (!disallowMoving) {
        arrayEach(rows, (value) => {
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
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }

}

registerPlugin('manualColumnFreeze', ManualColumnFreeze);

export default ManualColumnFreeze;
