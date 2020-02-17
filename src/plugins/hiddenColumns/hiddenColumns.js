import BasePlugin from '../_base';
import { addClass } from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach, arrayReduce } from '../../helpers/array';
import { registerPlugin } from '../../plugins';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import Hooks from '../../pluginHooks';
import hideColumnItem from './contextMenuItem/hideColumn';
import showColumnItem from './contextMenuItem/showColumn';

import { HiddenMap } from '../../translations';

import './hiddenColumns.css';

const PLUGIN_NAME = 'hiddenColumns';

Hooks.getSingleton().register('beforeHideColumns');
Hooks.getSingleton().register('afterHideColumns');
Hooks.getSingleton().register('beforeUnhideColumns');
Hooks.getSingleton().register('afterUnhideColumns');

/**
 * @plugin HiddenColumns
 *
 * @description
 * Plugin allows to hide certain columns. The hiding is achieved by rendering the columns with width set as 0px.
 * The plugin not modifies the source data and do not participate in data transformation (the shape of data returned
 * by `getData*` methods stays intact).
 *
 * Possible plugin settings:
 *  * `copyPasteEnabled` as `Boolean` (default `true`)
 *  * `columns` as `Array`
 *  * `indicators` as `Boolean` (default `false`).
 *
 * @example
 *
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   date: getData(),
 *   hiddenColumns: {
 *     copyPasteEnabled: true,
 *     indicators: true,
 *     columns: [1, 2, 5]
 *   }
 * });
 *
 * // access to hiddenColumns plugin instance:
 * const hiddenColumnsPlugin = hot.getPlugin('hiddenColumns');
 *
 * // show single row
 * hiddenColumnsPlugin.showColumn(1);
 *
 * // show multiple columns
 * hiddenColumnsPlugin.showColumn(1, 2, 9);
 *
 * // or as an array
 * hiddenColumnsPlugin.showColumns([1, 2, 9]);
 *
 * // hide single row
 * hiddenColumnsPlugin.hideColumn(1);
 *
 * // hide multiple columns
 * hiddenColumnsPlugin.hideColumn(1, 2, 9);
 *
 * // or as an array
 * hiddenColumnsPlugin.hideColumns([1, 2, 9]);
 *
 * // rerender the table to see all changes
 * hot.render();
 * ```
 */
class HiddenColumns extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Cached plugin settings.
     *
     * @private
     * @type {object}
     */
    this.settings = {};
    /**
     * List of currently hidden columns.
     *
     * @private
     * @type {null|PhysicalIndexToValueMap}
     */
    this.hiddenColumnsMap = null;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link HiddenColumns#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().hiddenColumns;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.hiddenColumnsMap = new HiddenMap();
    this.hiddenColumnsMap.addLocalHook('init', () => this.onMapInit());
    this.hot.columnIndexMapper.registerMap(PLUGIN_NAME, this.hiddenColumnsMap);

    this.addHook('afterContextMenuDefaultOptions', (...args) => this.onAfterContextMenuDefaultOptions(...args));
    this.addHook('afterGetCellMeta', (row, col, cellProperties) => this.onAfterGetCellMeta(row, col, cellProperties));
    this.addHook('afterGetColHeader', (...args) => this.onAfterGetColHeader(...args));

    super.enablePlugin();
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
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.columnIndexMapper.unregisterMap(PLUGIN_NAME);
    this.settings = {};

    super.disablePlugin();
    this.resetCellsMeta();
  }

  /**
   * Shows the provided columns.
   *
   * @param {number[]} columns Array of visual column indexes.
   */
  showColumns(columns) {
    const currentHideConfig = this.getHiddenColumns();
    const validColumns = this.isColumnDataValid(columns);
    let destinationHideConfig = currentHideConfig;

    if (validColumns) {
      destinationHideConfig = currentHideConfig.filter(column => !columns.includes(column));
    }

    const continueHiding = this.hot.runHooks('beforeUnhideColumns', currentHideConfig, destinationHideConfig, validColumns);

    if (continueHiding === false) {
      return;
    }

    if (validColumns) {
      destinationHideConfig = currentHideConfig.filter(hiddenColumn => columns.includes(hiddenColumn) === false);

      this.hot.executeBatchOperations(() => {
        arrayEach(columns, (visualColumn) => {
          this.hiddenColumnsMap.setValueAtIndex(this.hot.toPhysicalColumn(visualColumn), false);
        });
      });
    }

    this.hot.runHooks('afterUnhideColumns', currentHideConfig, destinationHideConfig, validColumns,
      validColumns && destinationHideConfig.length < currentHideConfig.length);
  }

  /**
   * Shows a single column.
   *
   * @param {...number} column Visual column index.
   */
  showColumn(...column) {
    this.showColumns(column);
  }

  /**
   * Hides the columns provided in the array.
   *
   * @param {number[]} columns Array of visual column indexes.
   */
  hideColumns(columns) {
    const currentHideConfig = this.getHiddenColumns();
    const validColumns = this.isColumnDataValid(columns);
    let destinationHideConfig = currentHideConfig;

    if (validColumns) {
      destinationHideConfig = Array.from(new Set(currentHideConfig.concat(columns)));
    }

    const continueHiding = this.hot.runHooks('beforeHideColumns', currentHideConfig, destinationHideConfig, validColumns);

    if (continueHiding === false) {
      return;
    }

    if (validColumns) {
      this.hot.executeBatchOperations(() => {
        arrayEach(columns, (visualColumn) => {
          this.hiddenColumnsMap.setValueAtIndex(this.hot.toPhysicalColumn(visualColumn), true);
        });
      });
    }

    this.hot.runHooks('afterHideColumns', currentHideConfig, destinationHideConfig, validColumns,
      validColumns && destinationHideConfig.length > currentHideConfig.length);
  }

  /**
   * Hides a single column.
   *
   * @param {...number} column Visual column index.
   */
  hideColumn(...column) {
    this.hideColumns(column);
  }

  /**
   * Returns an array of physical indexes of hidden columns.
   *
   * @returns {number[]}
   */
  getHiddenColumns() {
    return arrayReduce(this.hiddenColumnsMap.getValues(), (hiddenColumns, flag, index) => {
      if (flag) {
        hiddenColumns.push(index);
      }

      return hiddenColumns;
    }, []);
  }

  /**
   * Checks if the provided column is hidden.
   *
   * @param {number} column Column index.
   * @param {boolean} isPhysicalIndex Flag which determines type of index.
   * @returns {boolean}
   */
  isHidden(column, isPhysicalIndex = false) {
    let physicalColumn = column;

    if (!isPhysicalIndex) {
      physicalColumn = this.hot.toPhysicalColumn(column);
    }

    return this.hiddenColumnsMap.getValueAtIndex(physicalColumn);
  }

  /**
   * Check whether all of the provided column indexes are within the bounds of the table.
   *
   * @param {Array} columns Array of column indexes.
   */
  isColumnDataValid(columns) {
    return columns.every(column => Number.isInteger(column) && column >= 0 && column < this.hot.countCols());
  }

  /**
   * Reset all rendered cells meta.
   *
   * @private
   */
  resetCellsMeta() {
    arrayEach(this.hot.getCellsMeta(), (meta) => {
      if (meta) {
        meta.skipColumnOnPaste = false;
      }
    });
  }

  /**
   * Adds the additional column width for the hidden column indicators.
   *
   * @private
   * @param {number} width
   * @param {number} col
   * @returns {number}
   */
  onModifyColWidth(width, col) {
    if (this.isHidden(col)) {
      return 0.1;

    } else if (this.settings.indicators && (this.isHidden(col + 1) || this.isHidden(col - 1))) {

      // add additional space for hidden column indicator
      return width + (this.hot.hasColHeaders() ? 15 : 0);
    }
  }

  /**
   * Sets the copy-related cell meta.
   *
   * @private
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @param {object} cellProperties Object containing the cell properties.
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    if (this.settings.copyPasteEnabled === false && this.isHidden(col)) {
      cellProperties.skipColumnOnPaste = true;
    }

    if (this.isHidden(cellProperties.visualCol - 1)) {
      let firstSectionHidden = true;
      let i = cellProperties.visualCol - 1;

      cellProperties.className = cellProperties.className || '';

      if (cellProperties.className.indexOf('afterHiddenColumn') === -1) {
        cellProperties.className += ' afterHiddenColumn';
      }

      do {
        if (!this.isHidden(i)) {
          firstSectionHidden = false;
          break;
        }

        i -= 1;
      } while (i >= 0);

      if (firstSectionHidden && cellProperties.className.indexOf('firstVisibleColumn') === -1) {
        cellProperties.className += ' firstVisibleColumn';
      }
    } else if (cellProperties.className) {
      const classArr = cellProperties.className.split(' ');

      if (classArr.length) {
        const containAfterHiddenColumn = classArr.indexOf('afterHiddenColumn');

        if (containAfterHiddenColumn > -1) {
          classArr.splice(containAfterHiddenColumn, 1);
        }

        const containFirstVisible = classArr.indexOf('firstVisibleColumn');

        if (containFirstVisible > -1) {
          classArr.splice(containFirstVisible, 1);
        }

        cellProperties.className = classArr.join(' ');
      }
    }
  }

  /**
   * Modifies the copyable range, accordingly to the provided config.
   *
   * @private
   * @param {Array} ranges
   * @returns {Array}
   */
  onModifyCopyableRange(ranges) {
    const newRanges = [];

    const pushRange = (startRow, endRow, startCol, endCol) => {
      newRanges.push({ startRow, endRow, startCol, endCol });
    };

    arrayEach(ranges, (range) => {
      let isHidden = true;
      let rangeStart = 0;

      rangeEach(range.startCol, range.endCol, (col) => {
        if (this.isHidden(col)) {
          if (!isHidden) {
            pushRange(range.startRow, range.endRow, rangeStart, col - 1);
          }

          isHidden = true;

        } else {
          if (isHidden) {
            rangeStart = col;
          }

          if (col === range.endCol) {
            pushRange(range.startRow, range.endRow, rangeStart, col);
          }

          isHidden = false;
        }
      });
    });

    return newRanges;
  }

  /**
   * Adds the needed classes to the headers.
   *
   * @private
   * @param {number} column Visual column index.
   * @param {HTMLElement} TH Header's TH element.
   */
  onAfterGetColHeader(column, TH) {
    if (!this.settings.indicators) {
      return;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);
    const sequence = this.hot.columnIndexMapper.getIndexesSequence();
    const currentPosition = sequence.indexOf(physicalColumn);
    const classList = [];

    if (this.isHidden(sequence[currentPosition - 1], true)) {
      classList.push('afterHiddenColumn');
    }

    if (column > -1 && this.isHidden(sequence[currentPosition + 1], true)) {
      classList.push('beforeHiddenColumn');
    }

    addClass(TH, classList);
  }

  /**
   * Add Show-hide columns to context menu.
   *
   * @private
   * @param {object} options
   */
  onAfterContextMenuDefaultOptions(options) {
    options.items.push(
      {
        name: SEPARATOR
      },
      hideColumnItem(this),
      showColumnItem(this)
    );
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onMapInit() {
    const settings = this.hot.getSettings().hiddenColumns;

    if (typeof settings === 'object') {
      this.settings = settings;

      if (settings.copyPasteEnabled === void 0) {
        settings.copyPasteEnabled = true;
      }

      if (Array.isArray(settings.columns)) {
        this.hideColumns(settings.columns);
      }

      if (!settings.copyPasteEnabled) {
        this.addHook('modifyCopyableRange', ranges => this.onModifyCopyableRange(ranges));
      }
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.hot.columnIndexMapper.unregisterMap(PLUGIN_NAME);

    super.destroy();
  }
}

registerPlugin(PLUGIN_NAME, HiddenColumns);

export default HiddenColumns;
