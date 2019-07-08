import BasePlugin from './../_base';
import { registerPlugin } from './../../plugins';
import { arrayEach } from './../../helpers/array';
import freezeColumnItem from './contextMenuItem/freezeColumn';
import unfreezeColumnItem from './contextMenuItem/unfreezeColumn';

import './manualColumnFreeze.css';
import { IndexMap } from '../../translations';

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
 */
class ManualColumnFreeze extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Frozen indexes position.
     *
     * @private
     * @type {null|IndexMap}
     */
    this.frozenColumnsBasePositions = null;

    privatePool.set(this, {
      moveByFreeze: false,
      afterFirstUse: false,
    });
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
    this.addHook('beforeColumnMove', (rows, target) => this.onBeforeColumnMove(rows, target));

    this.frozenColumnsBasePositions = this.columnIndexMapper.registerMap('manualColumnFreeze', new IndexMap(-1));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    const priv = privatePool.get(this);

    priv.afterFirstUse = false;
    priv.moveByFreeze = false;

    this.columnIndexMapper.unregisterMap('manualColumnFreeze');

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

    // TODO: Previous work of the plugin. I haven't changed this `if`, but probably it should be removed.
    if (this.columnIndexMapper.getPhysicalIndex(column) !== column) {
      this.frozenColumnsBasePositions.setValueAtIndex(settings.fixedColumnsLeft, column);
    }

    this.columnIndexMapper.moveIndexes(column, settings.fixedColumnsLeft);

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

    this.columnIndexMapper.moveIndexes(column, returnCol);

    const frozenMap = this.frozenColumnsBasePositions.getValues();

    this.frozenColumnsBasePositions.setValues([...frozenMap.slice(0, column), ...frozenMap.slice(column + 1, returnCol), -1, ...frozenMap.slice(returnCol)]);
  }

  /**
   * Estimates the most fitting return position for unfrozen column.
   *
   * @private
   * @param {Number} column Visual column index.
   */
  getBestColumnReturnPosition(column) {
    const unfrozenColumnIndex = this.frozenColumnsBasePositions.getValueAtIndex(column);

    if (this.frozenColumnsBasePositions.getValueAtIndex(column) !== -1) {
      return this.getCalculatedPosition(unfrozenColumnIndex);
    }

    return this.getCalculatedPosition(this.columnIndexMapper.getPhysicalIndex(column));
  }

  /**
   * Get calculated return position for for unfrozen column basing on its physical index.
   *
   * @param {Number} unfrozenColumnIndex Physical column of the unfrozen column.
   * @returns {Number}
   */
  getCalculatedPosition(unfrozenColumnIndex) {
    const settings = this.hot.getSettings();
    let calculatedPosition = settings.fixedColumnsLeft;
    let nextIndexBeforeDestination = this.columnIndexMapper.getPhysicalIndex(calculatedPosition);

    // Moving unfrozen column towards to it's physical position, unless column index at next position is bigger than index of moved column.
    while (nextIndexBeforeDestination !== null && nextIndexBeforeDestination <= unfrozenColumnIndex) {
      calculatedPosition += 1;
      nextIndexBeforeDestination = this.columnIndexMapper.getPhysicalIndex(calculatedPosition);
    }

    return calculatedPosition - 1;
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
}

registerPlugin('manualColumnFreeze', ManualColumnFreeze);

export default ManualColumnFreeze;
