import BasePlugin from '../../plugins/_base';
import { rangeEach } from '../../helpers/number';
import { registerPlugin } from '../../plugins';
import BindStrategy from './bindStrategy';

/**
 * @plugin BindRowsWithHeaders
 *
 * @description
 * Plugin allows binding the table rows with their headers.
 *
 * If the plugin is enabled, the table row headers will "stick" to the rows, when they are hidden/moved. Basically, if
 * at the initialization row 0 has a header titled "A", it will have it no matter what you do with the table.
 *
 * @example
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   date: getData(),
 *   // enable plugin
 *   bindRowsWithHeaders: true
 * });
 * ```
 */
class BindRowsWithHeaders extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Strategy object for binding rows with headers.
     *
     * @private
     * @type {BindStrategy}
     */
    this.bindStrategy = new BindStrategy();
    /**
     * List of last removed row indexes.
     *
     * @private
     * @type {Array}
     */
    this.removedRows = [];
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link BindRowsWithHeaders#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().bindRowsWithHeaders;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    let bindStrategy = this.hot.getSettings().bindRowsWithHeaders;

    if (typeof bindStrategy !== 'string') {
      bindStrategy = BindStrategy.DEFAULT_STRATEGY;
    }
    this.bindStrategy.setStrategy(bindStrategy);
    this.bindStrategy.createMap(this.hot.countSourceRows());

    this.addHook('modifyRowHeader', row => this.onModifyRowHeader(row));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('beforeRemoveRow', (index, amount) => this.onBeforeRemoveRow(index, amount));
    this.addHook('afterRemoveRow', () => this.onAfterRemoveRow());
    this.addHook('afterLoadData', firstRun => this.onAfterLoadData(firstRun));

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.removedRows.length = 0;
    this.bindStrategy.clearMap();
    super.disablePlugin();
  }

  /**
   * On modify row header listener.
   *
   * @private
   * @param {Number} row Row index.
   * @returns {Number}
   *
   * @fires Hooks#modifyRow
   */
  onModifyRowHeader(row) {
    return this.bindStrategy.translate(this.hot.runHooks('modifyRow', row));
  }

  /**
   * On after create row listener.
   *
   * @private
   * @param {Number} index Row index.
   * @param {Number} amount Defines how many rows removed.
   */
  onAfterCreateRow(index, amount) {
    this.bindStrategy.createRow(index, amount);
  }

  /**
   * On before remove row listener.
   *
   * @private
   * @param {Number} index Row index.
   * @param {Number} amount Defines how many rows removed.
   *
   * @fires Hooks#modifyRow
   */
  onBeforeRemoveRow(index, amount) {
    this.removedRows.length = 0;

    if (index !== false) {
      // Collect physical row index.
      rangeEach(index, index + amount - 1, (removedIndex) => {
        this.removedRows.push(this.hot.runHooks('modifyRow', removedIndex));
      });
    }
  }

  /**
   * On after remove row listener.
   *
   * @private
   */
  onAfterRemoveRow() {
    this.bindStrategy.removeRow(this.removedRows);
  }

  /**
   * On after load data listener.
   *
   * @private
   * @param {Boolean} firstRun Indicates if hook was fired while Handsontable initialization.
   */
  onAfterLoadData(firstRun) {
    if (!firstRun) {
      this.bindStrategy.createMap(this.hot.countSourceRows());
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.bindStrategy.destroy();
    super.destroy();
  }
}

registerPlugin('bindRowsWithHeaders', BindRowsWithHeaders);

export default BindRowsWithHeaders;
