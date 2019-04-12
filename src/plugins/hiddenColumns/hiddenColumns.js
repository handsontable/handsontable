import BasePlugin from '../_base';
import { addClass } from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach } from '../../helpers/array';
import { registerPlugin } from '../../plugins';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import Hooks from '../../pluginHooks';
import hideColumnItem from './contextMenuItem/hideColumn';
import showColumnItem from './contextMenuItem/showColumn';

import './hiddenColumns.css';

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
 *  * `indicators` as `Boolean` (default `false`)
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
     * @type {Object}
     */
    this.settings = {};
    /**
     * List of currently hidden columns
     *
     * @private
     * @type {Number[]}
     */
    this.hiddenColumns = [];
    /**
     * Last selected column index.
     *
     * @private
     * @type {Number}
     * @default -1
     */
    this.lastSelectedColumn = -1;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link HiddenColumns#enablePlugin} method is called.
   *
   * @returns {Boolean}
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

    if (this.hot.hasColHeaders()) {
      this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    } else {
      this.addHook('afterRenderer', (TD, row, col) => this.onAfterGetColHeader(col, TD));
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('afterGetCellMeta', (row, col, cellProperties) => this.onAfterGetCellMeta(row, col, cellProperties));
    this.addHook('modifyColWidth', (width, col) => this.onModifyColWidth(width, col));
    this.addHook('beforeSetRangeStartOnly', coords => this.onBeforeSetRangeStart(coords));
    this.addHook('beforeSetRangeEnd', coords => this.onBeforeSetRangeEnd(coords));
    this.addHook('hiddenColumn', column => this.isHidden(column));
    this.addHook('beforeStretchingColumnWidth', (width, column) => this.onBeforeStretchingColumnWidth(width, column));
    this.addHook('afterCreateCol', (index, amount) => this.onAfterCreateCol(index, amount));
    this.addHook('afterRemoveCol', (index, amount) => this.onAfterRemoveCol(index, amount));
    this.addHook('init', () => this.onInit());

    // Dirty workaround - the section below runs only if the HOT instance is already prepared.
    if (this.hot.view) {
      this.onInit();
    }

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
    this.settings = {};
    this.hiddenColumns = [];
    this.lastSelectedColumn = -1;

    this.hot.render();
    super.disablePlugin();
    this.resetCellsMeta();
  }

  /**
   * Shows the provided columns.
   *
   * @param {Number[]} columns Array of column indexes.
   */
  showColumns(columns) {
    const currentHideConfig = this.hiddenColumns;
    const validColumns = this.isColumnDataValid(columns);
    let destinationHideConfig = currentHideConfig;

    if (validColumns) {
      destinationHideConfig = this.hiddenColumns.filter(hiddenColumn => columns.includes(hiddenColumn) === false);
    }

    const continueHiding = this.hot.runHooks('beforeUnhideColumns', currentHideConfig, destinationHideConfig, validColumns);

    if (continueHiding === false) {
      return;
    }

    if (validColumns) {
      this.hiddenColumns = destinationHideConfig;
    }

    this.hot.runHooks('afterUnhideColumns', currentHideConfig, destinationHideConfig, validColumns,
      validColumns && destinationHideConfig.length < currentHideConfig.length);
  }

  /**
   * Shows a single column.
   *
   * @param {...Number} column Visual column index.
   */
  showColumn(...column) {
    this.showColumns(column);
  }

  /**
   * Hides the columns provided in the array.
   *
   * @param {Number[]} columns Array of visual column indexes.
   */
  hideColumns(columns) {
    const currentHideConfig = this.hiddenColumns;
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
      this.hiddenColumns = destinationHideConfig;
    }

    this.hot.runHooks('afterHideColumns', currentHideConfig, destinationHideConfig, validColumns,
      validColumns && destinationHideConfig.length > currentHideConfig.length);
  }

  /**
   * Hides a single column.
   *
   * @param {...Number} column Visual column index.
   */
  hideColumn(...column) {
    this.hideColumns(column);
  }

  /**
   * Checks if the provided column is hidden.
   *
   * @param {Number} column Column index.
   * @param {Boolean} isPhysicalIndex flag which determines type of index.
   * @returns {Boolean}
   */
  isHidden(column, isPhysicalIndex = false) {
    let physicalColumn = column;

    if (!isPhysicalIndex) {
      physicalColumn = this.hot.toPhysicalColumn(column);
    }

    return this.hiddenColumns.includes(physicalColumn);
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

        if (meta.baseRenderer !== null) {
          meta.renderer = meta.baseRenderer;
          meta.baseRenderer = null;
        }
      }
    });
  }

  /**
   * Sets width hidden columns on 0
   *
   * @private
   * @param {Number} width Column width.
   * @param {Number} column Column index.
   * @returns {Number}
   */
  onBeforeStretchingColumnWidth(width, column) {
    let stretchedWidth = width;

    if (this.isHidden(column)) {
      stretchedWidth = 0;
    }

    return stretchedWidth;
  }

  /**
   * Adds the additional column width for the hidden column indicators.
   *
   * @private
   * @param {Number} width
   * @param {Number} col
   * @returns {Number}
   */
  onModifyColWidth(width, col) {
    if (this.isHidden(col)) {
      return 0.1;

    } else if (this.settings.indicators && (this.isHidden(col + 1) ||
               this.isHidden(col - 1))) {

      // add additional space for hidden column indicator
      return width + (this.hot.hasColHeaders() ? 15 : 0);
    }
  }

  /**
   * Sets the copy-related cell meta.
   *
   * @private
   * @param {Number} row
   * @param {Number} col
   * @param {Object} cellProperties
   *
   * @fires Hooks#unmodifyCol
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    const colIndex = this.hot.runHooks('unmodifyCol', col);

    if (this.settings.copyPasteEnabled === false && this.isHidden(col)) {
      cellProperties.skipColumnOnPaste = true;
    }

    if (this.isHidden(colIndex)) {
      if (cellProperties.renderer !== hiddenRenderer) {
        cellProperties.baseRenderer = cellProperties.renderer;
      }
      cellProperties.renderer = hiddenRenderer;

    } else if (cellProperties.baseRenderer !== null) { // We must pass undefined value too (for the purposes of inheritance cell/column settings).
      cellProperties.renderer = cellProperties.baseRenderer;
      cellProperties.baseRenderer = null;
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
   * @param {Number} column
   * @param {HTMLElement} TH
   */
  onAfterGetColHeader(column, TH) {
    if (this.isHidden(column)) {
      return;
    }

    let firstSectionHidden = true;
    let i = column - 1;

    do {
      if (!this.isHidden(i)) {
        firstSectionHidden = false;
        break;
      }
      i -= 1;
    } while (i >= 0);

    if (firstSectionHidden) {
      addClass(TH, 'firstVisibleColumn');
    }

    if (!this.settings.indicators) {
      return;
    }

    if (this.isHidden(column - 1)) {
      addClass(TH, 'afterHiddenColumn');
    }

    if (this.isHidden(column + 1) && column > -1) {
      addClass(TH, 'beforeHiddenColumn');
    }
  }

  /**
   * On before set range start listener.
   *
   * @private
   * @param {Object} coords Object with `row` and `col` properties.
   */
  onBeforeSetRangeStart(coords) {
    if (coords.col > 0) {
      return;
    }

    coords.col = 0;

    const getNextColumn = (col) => {
      let visualColumn = col;
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (this.isHidden(physicalColumn, true)) {
        visualColumn += 1;
        visualColumn = getNextColumn(visualColumn);
      }

      return visualColumn;
    };

    coords.col = getNextColumn(coords.col);
  }

  /**
   * On before set range end listener.
   *
   * @private
   * @param {Object} coords Object with `row` and `col` properties.
   */
  onBeforeSetRangeEnd(coords) {
    const columnCount = this.hot.countCols();

    const getNextColumn = (col) => {
      let visualColumn = col;
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (this.isHidden(physicalColumn, true)) {
        if (this.lastSelectedColumn > visualColumn || coords.col === columnCount - 1) {
          if (visualColumn > 0) {
            visualColumn -= 1;
            visualColumn = getNextColumn(visualColumn);

          } else {
            rangeEach(0, this.lastSelectedColumn, (i) => {
              if (!this.isHidden(i)) {
                visualColumn = i;

                return false;
              }
            });
          }
        } else {
          visualColumn += 1;
          visualColumn = getNextColumn(visualColumn);
        }
      }

      return visualColumn;
    };

    coords.col = getNextColumn(coords.col);
    this.lastSelectedColumn = coords.col;
  }

  /**
   * Add Show-hide columns to context menu.
   *
   * @private
   * @param {Object} options
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
   * `onAfterCreateCol` hook callback.
   *
   * @private
   */
  onAfterCreateCol(index, amount) {
    const tempHidden = [];

    arrayEach(this.hiddenColumns, (col) => {
      let visualColumn = col;

      if (visualColumn >= index) {
        visualColumn += amount;
      }
      tempHidden.push(visualColumn);
    });
    this.hiddenColumns = tempHidden;
  }

  /**
   * `onAfterRemoveCol` hook callback.
   *
   * @private
   */
  onAfterRemoveCol(index, amount) {
    const tempHidden = [];

    arrayEach(this.hiddenColumns, (col) => {
      let visualColumn = col;

      if (visualColumn >= index) {
        visualColumn -= amount;
      }
      tempHidden.push(visualColumn);
    });
    this.hiddenColumns = tempHidden;
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onInit() {
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
    super.destroy();
  }

}

function hiddenRenderer(hotInstance, td) {
  td.textContent = '';
}

registerPlugin('hiddenColumns', HiddenColumns);

export default HiddenColumns;
