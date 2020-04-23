import BasePlugin from '../_base';
import { registerPlugin } from '../../plugins';
import { TrimmingMap } from '../../translations';
import { arrayEach } from '../../helpers/array';

/**
 * @plugin TrimRows
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
     * Map of skipped rows by the plugin.
     *
     * @private
     * @type {null|TrimmingMap}
     */
    this.trimmedRowsMap = null;
  }
  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {boolean}
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

    this.trimmedRowsMap = this.hot.rowIndexMapper.registerMap('trimRows', new TrimmingMap());
    this.trimmedRowsMap.addLocalHook('init', () => this.onMapInit());

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    const trimmedRows = this.hot.getSettings().trimRows;

    if (Array.isArray(trimmedRows)) {
      this.hot.executeBatchOperations(() => {
        this.trimmedRowsMap.clear();

        arrayEach(trimmedRows, (physicalRow) => {
          this.trimmedRowsMap.setValueAtIndex(physicalRow, true);
        });
      });
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.unregisterMap('trimRows');

    super.disablePlugin();
  }

  /**
   * Get list of trimmed rows.
   *
   * @returns {Array} Physical rows.
   */
  getTrimmedRows() {
    return this.trimmedRowsMap.getTrimmedIndexes();
  }

  /**
   * Trims the rows provided in the array.
   *
   * @param {number[]} rows Array of physical row indexes.
   * @fires Hooks#beforeTrimRow
   * @fires Hooks#afterTrimRow
   */
  trimRows(rows) {
    const currentTrimConfig = this.getTrimmedRows();

    const isValidConfig = this.isValidConfig(rows);
    let destinationTrimConfig = currentTrimConfig;

    if (isValidConfig) {
      destinationTrimConfig = Array.from(new Set(currentTrimConfig.concat(rows)));
    }

    const allowTrimRow = this.hot.runHooks('beforeTrimRow', currentTrimConfig, destinationTrimConfig, isValidConfig);

    if (allowTrimRow === false) {
      return;
    }

    if (isValidConfig) {
      this.hot.executeBatchOperations(() => {
        arrayEach(rows, (physicalRow) => {
          this.trimmedRowsMap.setValueAtIndex(physicalRow, true);
        });
      });
    }

    this.hot.runHooks('afterTrimRow', currentTrimConfig, destinationTrimConfig, isValidConfig,
      isValidConfig && destinationTrimConfig.length > currentTrimConfig.length);
  }

  /**
   * Trims the row provided as physical row index (counting from 0).
   *
   * @param {...number} row Physical row index.
   */
  trimRow(...row) {
    this.trimRows(row);
  }

  /**
   * Untrims the rows provided in the array.
   *
   * @param {number[]} rows Array of physical row indexes.
   * @fires Hooks#beforeUntrimRow
   * @fires Hooks#afterUntrimRow
   */
  untrimRows(rows) {
    const currentTrimConfig = this.getTrimmedRows();
    const isValidConfig = this.isValidConfig(rows);
    let destinationTrimConfig = currentTrimConfig;

    if (isValidConfig) {
      destinationTrimConfig = currentTrimConfig.filter(trimmedRow => rows.includes(trimmedRow) === false);
    }

    const allowUntrimRow = this.hot.runHooks('beforeUntrimRow', currentTrimConfig, destinationTrimConfig, isValidConfig);

    if (allowUntrimRow === false) {
      return;
    }

    if (isValidConfig) {
      this.hot.executeBatchOperations(() => {
        arrayEach(rows, (physicalRow) => {
          this.trimmedRowsMap.setValueAtIndex(physicalRow, false);
        });
      });
    }

    this.hot.runHooks('afterUntrimRow', currentTrimConfig, destinationTrimConfig, isValidConfig,
      isValidConfig && destinationTrimConfig.length < currentTrimConfig.length);
  }

  /**
   * Untrims the row provided as row index (counting from 0).
   *
   * @param {...number} row Physical row index.
   */
  untrimRow(...row) {
    this.untrimRows(row);
  }

  /**
   * Checks if given row is hidden.
   *
   * @param {number} physicalRow Physical row index.
   * @returns {boolean}
   */
  isTrimmed(physicalRow) {
    return this.trimmedRowsMap.getValueAtIndex(physicalRow) || false;
  }

  /**
   * Untrims all trimmed rows.
   */
  untrimAll() {
    this.untrimRows(this.getTrimmedRows());
  }

  /**
   * Get if trim config is valid. Check whether all of the provided row indexes are within source data.
   *
   * @param {Array} trimmedRows List of physical row indexes.
   * @returns {boolean}
   */
  isValidConfig(trimmedRows) {
    const sourceRows = this.hot.countSourceRows();

    return trimmedRows.every(trimmedRow => (Number.isInteger(trimmedRow) && trimmedRow >= 0 && trimmedRow < sourceRows));
  }

  /**
   * On map initialized hook callback.
   *
   * @private
   */
  onMapInit() {
    const trimmedRows = this.hot.getSettings().trimRows;

    if (Array.isArray(trimmedRows)) {
      this.hot.executeBatchOperations(() => {
        arrayEach(trimmedRows, (physicalRow) => {
          this.trimmedRowsMap.setValueAtIndex(physicalRow, true);
        });
      });
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.hot.rowIndexMapper.unregisterMap('trimRows');

    super.destroy();
  }
}

registerPlugin('trimRows', TrimRows);

export default TrimRows;
