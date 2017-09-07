import BasePlugin from 'handsontable/plugins/_base';
import {addClass, removeClass} from 'handsontable/helpers/dom/element';
import {rangeEach} from 'handsontable/helpers/number';
import {arrayEach} from 'handsontable/helpers/array';
import {registerPlugin, getPlugin} from 'handsontable/plugins';
import {SEPARATOR} from 'handsontable/plugins/contextMenu/predefinedItems';
import hideColumnItem from './contextMenuItem/hideColumn';
import showColumnItem from './contextMenuItem/showColumn';

import './hiddenColumns.css';

/**
 * Plugin allowing to hide certain columns.
 *
 * @plugin HiddenColumns
 * @pro
 */
class HiddenColumns extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Cached plugin settings.
     *
     * @type {null|Object}
     */
    this.settings = {};
    /**
     * List of currently hidden columns
     *
     * @type {Boolean|Object}
     */
    this.hiddenColumns = [];
    /**
     * Last selected column index.
     *
     * @type {Number}
     * @default -1
     */
    this.lastSelectedColumn = -1;
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().hiddenColumns;
  }

  /**
   * Enable the plugin.
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

    this.addHook('afterContextMenuDefaultOptions', (options) => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('afterGetCellMeta', (row, col, cellProperties) => this.onAfterGetCellMeta(row, col, cellProperties));
    this.addHook('modifyColWidth', (width, col) => this.onModifyColWidth(width, col));
    this.addHook('beforeSetRangeStartOnly', (coords) => this.onBeforeSetRangeStart(coords));
    this.addHook('beforeSetRangeEnd', (coords) => this.onBeforeSetRangeEnd(coords));
    this.addHook('hiddenColumn', (column) => this.isHidden(column));
    this.addHook('beforeStretchingColumnWidth', (width, column) => this.onBeforeStretchingColumnWidth(width, column));
    this.addHook('afterCreateCol', (index, amount) => this.onAfterCreateCol(index, amount));
    this.addHook('afterRemoveCol', (index, amount) => this.onAfterRemoveCol(index, amount));

    // Dirty workaround - the section below runs only if the HOT instance is already prepared.
    if (this.hot.view) {
      this.onAfterPluginsInitialized();
    }

    super.enablePlugin();
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
   * Disable the plugin.
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
   * Show the provided columns.
   *
   * @param {Array} columns Array of column indexes.
   */
  showColumns(columns) {
    arrayEach(columns, (column) => {
      column = parseInt(column, 10);
      column = this.getLogicalColumnIndex(column);

      if (this.isHidden(column, true)) {
        this.hiddenColumns.splice(this.hiddenColumns.indexOf(column), 1);
      }
    });
  }

  /**
   * Show a single column.
   *
   * @param {Number} column Column index.
   */
  showColumn(...column) {
    this.showColumns(column);
  }

  /**
   * Hide the columns provided in the array.
   *
   * @param {Array} columns Array of column indexes.
   */
  hideColumns(columns) {
    arrayEach(columns, (column) => {
      column = parseInt(column, 10);
      column = this.getLogicalColumnIndex(column);

      if (!this.isHidden(column, true)) {
        this.hiddenColumns.push(column);
      }
    });
  }

  /**
   * Hide a single column.
   *
   * @param {Number} column Column index.
   */
  hideColumn(...column) {
    this.hideColumns(column);
  }

  /**
   * Check if the provided column is hidden.
   *
   * @param {Number} column Column index.
   * @param {Boolean} isLogicIndex flag which determines type of index.
   * @returns {Boolean}
   */
  isHidden(column, isLogicIndex = false) {
    if (!isLogicIndex) {
      column = this.getLogicalColumnIndex(column);
    }

    return this.hiddenColumns.indexOf(column) > -1;
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
   * Get the logical index of the provided column.
   *
   * @param {Number} column
   * @returns {Number}
   */
  getLogicalColumnIndex(column) {
    return this.hot.runHooks('modifyCol', column);
  }

  /**
   * Set width hidden columns on 0
   *
   * @param {Number} width Column width.
   * @param {Number} column Column index.
   * @returns {Number}
   */
  onBeforeStretchingColumnWidth(width, column) {
    if (this.isHidden(column)) {
      width = 0;
    }

    return width;
  }

  /**
   * Add the additional column width for the hidden column indicators.
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
   * Set the copy-related cell meta.
   *
   * @private
   * @param {Number} row
   * @param {Number} col
   * @param {Object} cellProperties
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    col = this.hot.runHooks('unmodifyCol', col);

    if (this.settings.copyPasteEnabled === false && this.isHidden(col)) {
      cellProperties.skipColumnOnPaste = true;
    }

    if (this.isHidden(col)) {
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

        i--;
      } while (i >= 0);

      if (firstSectionHidden && cellProperties.className.indexOf('firstVisibleColumn') === -1) {
        cellProperties.className += ' firstVisibleColumn';
      }
    } else if (cellProperties.className) {
      let classArr = cellProperties.className.split(' ');

      if (classArr.length) {
        let containAfterHiddenColumn = classArr.indexOf('afterHiddenColumn');
        let containFirstVisible = classArr.indexOf('firstVisibleColumn');

        if (containAfterHiddenColumn > -1) {
          classArr.splice(containAfterHiddenColumn, 1);
        }
        if (containFirstVisible > -1) {
          classArr.splice(containFirstVisible, 1);
        }

        cellProperties.className = classArr.join(' ');
      }
    }
  }

  /**
   * Modify the copyable range, accordingly to the provided config.
   *
   * @private
   * @param {Array} ranges
   * @returns {Array}
   */
  onModifyCopyableRange(ranges) {
    let newRanges = [];

    let pushRange = (startRow, endRow, startCol, endCol) => {
      newRanges.push({startRow, endRow, startCol, endCol});
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
   * Add the needed classes to the headers.
   *
   * @private
   * @param {Number} col
   * @param {HTMLElement} TH
   */
  onAfterGetColHeader(col, TH) {
    if (this.isHidden(col)) {
      return;
    }

    let firstSectionHidden = true;
    let i = col - 1;

    do {
      if (!this.isHidden(i)) {
        firstSectionHidden = false;
        break;
      }
      i--;
    } while (i >= 0);

    if (firstSectionHidden) {
      addClass(TH, 'firstVisibleColumn');
    }

    if (!this.settings.indicators) {
      return;
    }

    if (this.isHidden(col - 1)) {
      addClass(TH, 'afterHiddenColumn');
    }

    if (this.isHidden(col + 1) && col > -1) {
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

    let getNextColumn = (col) => {
      let logicalCol = this.getLogicalColumnIndex(col);

      if (this.isHidden(logicalCol, true)) {
        col = getNextColumn(++col);
      }

      return col;
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
    let columnCount = this.hot.countCols();

    let getNextColumn = (col) => {
      let logicalCol = this.getLogicalColumnIndex(col);

      if (this.isHidden(logicalCol, true)) {
        if (this.lastSelectedColumn > col || coords.col === columnCount - 1) {
          if (col > 0) {
            col = getNextColumn(--col);

          } else {
            rangeEach(0, this.lastSelectedColumn, (i) => {
              if (!this.isHidden(i)) {
                col = i;

                return false;
              }
            });
          }
        } else {
          col = getNextColumn(++col);
        }
      }

      return col;
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

  onAfterCreateCol(index, amount) {
    let tempHidden = [];

    arrayEach(this.hiddenColumns, (col) => {
      if (col >= index) {
        col += amount;
      }
      tempHidden.push(col);
    });
    this.hiddenColumns = tempHidden;
  }

  onAfterRemoveCol(index, amount) {
    let tempHidden = [];

    arrayEach(this.hiddenColumns, (col) => {
      if (col >= index) {
        col -= amount;
      }
      tempHidden.push(col);
    });
    this.hiddenColumns = tempHidden;
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onAfterPluginsInitialized() {
    let settings = this.hot.getSettings().hiddenColumns;

    if (typeof settings === 'object') {
      this.settings = settings;

      if (settings.copyPasteEnabled === void 0) {
        settings.copyPasteEnabled = true;
      }
      if (Array.isArray(settings.columns)) {
        this.hideColumns(settings.columns);
      }
      if (!settings.copyPasteEnabled) {
        this.addHook('modifyCopyableRange', (ranges) => this.onModifyCopyableRange(ranges));
      }
    }
  }

  /**
   * Destroy the plugin.
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
