import BasePlugin from 'handsontable/plugins/_base';
import {arrayEach} from 'handsontable/helpers/array';
import {rangeEach} from 'handsontable/helpers/number';
import {registerPlugin} from 'handsontable/plugins';
import RowsMapper from './rowsMapper';

/**
 * @plugin TrimRows
 * @pro
 *
 * @description
 * Plugin allowing hiding of certain rows.
 *
 * @example
 *
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   trimRows: [1, 2, 5]
 * });
 * // Access to trimRows plugin instance:
 * var trimRowsPlugin = hot.getPlugin('trimRows');
 *
 * // Hide row programmatically:
 * trimRowsPlugin.trimRow(1);
 * // Show rows
 * trimRowsPlugin.trimRow(1, 2, 9);
 * // or
 * trimRowsPlugin.trimRows([1, 2, 9]);
 * hot.render();
 * ...
 * // Show row programmatically:
 * trimRowsPlugin.untrimRow(1);
 * // Hide rows
 * trimRowsPlugin.untrimRow(1, 2, 9);
 * // or
 * trimRowsPlugin.untrimRows([1, 2, 9]);
 * hot.render();
 * ...
 * ```
 */
class TrimRows extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * List of trimmed row indexes.
     *
     * @type {Array}
     */
    this.trimmedRows = [];
    /**
     * List of last removed row indexes.
     *
     * @type {Array}
     */
    this.removedRows = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().trimRows;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    let settings = this.hot.getSettings().trimRows;

    if (Array.isArray(settings)) {
      this.trimmedRows = settings;
    }
    this.rowsMapper.createMap(this.hot.countSourceRows());

    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('unmodifyRow', (row, source) => this.onUnmodifyRow(row, source));
    this.addHook('beforeCreateRow', (index, amount, source) => this.onBeforeCreateRow(index, amount, source));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('beforeRemoveRow', (index, amount) => this.onBeforeRemoveRow(index, amount));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));
    this.addHook('afterLoadData', (firstRun) => this.onAfterLoadData(firstRun));

    super.enablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
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
   * Disable the plugin.
   */
  disablePlugin() {
    this.trimmedRows = [];
    this.removedRows.length = 0;
    this.rowsMapper.clearMap();
    super.disablePlugin();
  }

  /**
   * Trim the rows provided in the array.
   *
   * @param {Array} rows Array of physical row indexes.
   */
  trimRows(rows) {
    arrayEach(rows, (row) => {
      row = parseInt(row, 10);

      if (!this.isTrimmed(row)) {
        this.trimmedRows.push(row);
      }
    });

    this.hot.runHooks('skipLengthCache', 100);
    this.rowsMapper.createMap(this.hot.countSourceRows());
    this.hot.runHooks('afterTrimRow', rows);
  }

  /**
   * Trim the row provided as physical row index (counting from 0).
   *
   * @param {Number} row Physical row index.
   */
  trimRow(...row) {
    this.trimRows(row);
  }

  /**
   * Untrim the rows provided in the array.
   *
   * @param {Array} rows Array of physical row indexes.
   */
  untrimRows(rows) {
    arrayEach(rows, (row) => {
      row = parseInt(row, 10);

      if (this.isTrimmed(row)) {
        this.trimmedRows.splice(this.trimmedRows.indexOf(row), 1);
      }
    });

    this.hot.runHooks('skipLengthCache', 100);
    this.rowsMapper.createMap(this.hot.countSourceRows());
    this.hot.runHooks('afterUntrimRow', rows);
  }

  /**
   * Untrim the row provided as row index (counting from 0).
   *
   * @param {Number} row Physical row index.
   */
  untrimRow(...row) {
    this.untrimRows(row);
  }

  /**
   * Check if given physical row is hidden.
   *
   * @returns {Boolean}
   */
  isTrimmed(row) {
    return this.trimmedRows.indexOf(row) > -1;
  }

  /**
   * Untrim all trimmed rows.
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
    if (source !== this.pluginName) {
      row = this.rowsMapper.getValueByIndex(row);
    }

    return row;
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
    if (source !== this.pluginName) {
      row = this.rowsMapper.getIndexByValue(row);
    }

    return row;
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
   * @param {Number} index Visual row index.
   * @param {Number} amount Defines how many rows removed.
   */
  onAfterRemoveRow(index, amount) {
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
   * Destroy plugin.
   */
  destroy() {
    this.rowsMapper.destroy();
    super.destroy();
  }
}

registerPlugin('trimRows', TrimRows);

export default TrimRows;
