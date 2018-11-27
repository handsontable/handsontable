import BasePlugin from 'handsontable/plugins/_base';
import { arrayEach } from 'handsontable/helpers/array';
import { rangeEach } from 'handsontable/helpers/number';
import { registerPlugin } from 'handsontable/plugins';
import RowsMapper from './rowsMapper';

/**
 * @plugin TrimRows
 * @pro
 *
 * @description
 * The plugin allows to trim certain rows. The trimming is achieved by applying the transformation algorithm to the data
 * transformation. In this case, when the row is trimmed it is not accessible using `getData*` methods thus the trimmed
 * data is not visible to other plugins.
 *
 * @example
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   date: getData(),
 *   // hide selected rows on table initialization
 *   trimRows: [1, 2, 5]
 * });
 *
 * // access the trimRows plugin instance
 * const trimRowsPlugin = hot.getPlugin('trimRows');
 *
 * // hide single row
 * trimRowsPlugin.trimRow(1);
 *
 * // hide multiple rows
 * trimRowsPlugin.trimRow(1, 2, 9);
 *
 * // or as an array
 * trimRowsPlugin.trimRows([1, 2, 9]);
 *
 * // show single row
 * trimRowsPlugin.untrimRow(1);
 *
 * // show multiple rows
 * trimRowsPlugin.untrimRow(1, 2, 9);
 *
 * // or as an array
 * trimRowsPlugin.untrimRows([1, 2, 9]);
 *
 * // rerender table to see the changes
 * hot.render();
 * ```
 */
class TrimRows extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * List of trimmed row indexes.
     *
     * @private
     * @type {Array}
     */
    this.trimmedRows = [];
    /**
     * List of last removed row indexes.
     *
     * @private
     * @type {Array}
     */
    this.removedRows = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().trimRows;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    const settings = this.hot.getSettings().trimRows;

    if (Array.isArray(settings)) {
      this.trimmedRows = settings;
    }
    this.rowsMapper.createMap(this.hot.countSourceRows());

    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('unmodifyRow', (row, source) => this.onUnmodifyRow(row, source));
    this.addHook('beforeCreateRow', (index, amount, source) => this.onBeforeCreateRow(index, amount, source));
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
    const settings = this.hot.getSettings().trimRows;

    if (Array.isArray(settings)) {
      this.disablePlugin();
      this.enablePlugin();
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.trimmedRows = [];
    this.removedRows.length = 0;
    this.rowsMapper.clearMap();
    super.disablePlugin();
  }

  /**
   * Trims the rows provided in the array.
   *
   * @param {Number[]} rows Array of physical row indexes.
   * @fires Hooks#skipLengthCache
   * @fires Hooks#afterTrimRow
   */
  trimRows(rows) {
    arrayEach(rows, (row) => {
      const physicalRow = parseInt(row, 10);

      if (!this.isTrimmed(physicalRow)) {
        this.trimmedRows.push(physicalRow);
      }
    });

    this.hot.runHooks('skipLengthCache', 100);
    this.rowsMapper.createMap(this.hot.countSourceRows());
    this.hot.runHooks('afterTrimRow', rows);
  }

  /**
   * Trims the row provided as physical row index (counting from 0).
   *
   * @param {...Number} row Physical row index.
   */
  trimRow(...row) {
    this.trimRows(row);
  }

  /**
   * Untrims the rows provided in the array.
   *
   * @param {Number[]} rows Array of physical row indexes.
   * @fires Hooks#skipLengthCache
   * @fires Hooks#afterUntrimRow
   */
  untrimRows(rows) {
    arrayEach(rows, (row) => {
      const physicalRow = parseInt(row, 10);

      if (this.isTrimmed(physicalRow)) {
        this.trimmedRows.splice(this.trimmedRows.indexOf(physicalRow), 1);
      }
    });

    this.hot.runHooks('skipLengthCache', 100);
    this.rowsMapper.createMap(this.hot.countSourceRows());
    this.hot.runHooks('afterUntrimRow', rows);
  }

  /**
   * Untrims the row provided as row index (counting from 0).
   *
   * @param {...Number} row Physical row index.
   */
  untrimRow(...row) {
    this.untrimRows(row);
  }

  /**
   * Checks if given physical row is hidden.
   *
   * @returns {Boolean}
   */
  isTrimmed(row) {
    return this.trimmedRows.indexOf(row) > -1;
  }

  /**
   * Untrims all trimmed rows.
   */
  untrimAll() {
    this.untrimRows([].concat(this.trimmedRows));
  }

  /**
   * On modify row listener.
   *
   * @private
   * @param {Number} row Visual row index.
   * @param {String} source Source name.
   * @returns {Number|null}
   */
  onModifyRow(row, source) {
    let physicalRow = row;

    if (source !== this.pluginName) {
      physicalRow = this.rowsMapper.getValueByIndex(physicalRow);
    }

    return physicalRow;
  }

  /**
   * On unmodifyRow listener.
   *
   * @private
   * @param {Number} row Physical row index.
   * @param {String} source Source name.
   * @returns {Number|null}
   */
  onUnmodifyRow(row, source) {
    let visualRow = row;

    if (source !== this.pluginName) {
      visualRow = this.rowsMapper.getIndexByValue(visualRow);
    }

    return visualRow;
  }

  /**
   * `beforeCreateRow` hook callback.
   *
   * @private
   * @param {Number} index Index of the newly created row.
   * @param {Number} amount Amount of created rows.
   * @param {String} source Source of the change.
   */
  onBeforeCreateRow(index, amount, source) {
    return !(this.isEnabled() && this.trimmedRows.length > 0 && source === 'auto');
  }

  /**
   * On after create row listener.
   *
   * @private
   * @param {Number} index Visual row index.
   * @param {Number} amount Defines how many rows removed.
   */
  onAfterCreateRow(index, amount) {
    this.rowsMapper.shiftItems(index, amount);
  }

  /**
   * On before remove row listener.
   *
   * @private
   * @param {Number} index Visual row index.
   * @param {Number} amount Defines how many rows removed.
   *
   * @fires Hooks#modifyRow
   */
  onBeforeRemoveRow(index, amount) {
    this.removedRows.length = 0;

    if (index !== false) {
      // Collect physical row index.
      rangeEach(index, index + amount - 1, (removedIndex) => {
        this.removedRows.push(this.hot.runHooks('modifyRow', removedIndex, this.pluginName));
      });
    }
  }

  /**
   * On after remove row listener.
   *
   * @private
   */
  onAfterRemoveRow() {
    this.rowsMapper.unshiftItems(this.removedRows);
  }

  /**
   * On after load data listener.
   *
   * @private
   * @param {Boolean} firstRun Indicates if hook was fired while Handsontable initialization.
   */
  onAfterLoadData(firstRun) {
    if (!firstRun) {
      this.rowsMapper.createMap(this.hot.countSourceRows());
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.rowsMapper.destroy();
    super.destroy();
  }
}

registerPlugin('trimRows', TrimRows);

export default TrimRows;
