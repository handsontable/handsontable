import BasePlugin from 'handsontable/plugins/_base';
import {addClass, removeClass} from 'handsontable/helpers/dom/element';
import {rangeEach} from 'handsontable/helpers/number';
import {arrayEach, arrayFilter} from 'handsontable/helpers/array';
import {registerPlugin, getPlugin} from 'handsontable/plugins';
import hideRowItem from './contextMenuItem/hideRow';
import showRowItem from './contextMenuItem/showRow';

import './hiddenRows.css';

/**
 * @plugin HiddenRows
 * @pro
 *
 * @description
 * Plugin allowing to hide certain rows.
 *
 * Possible plugin settings:
 *  * `copyPasteEnabled` as `Boolean` (default `true`)
 *  * `rows` as `Array`
 *  * `indicators` as `Boolean` (default `false`)
 *
 * @example
 *
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   hiddenRows: {
 *     copyPasteEnabled: true,
 *     indicators: true,
 *     rows: [1, 2, 5]
 *   }
 * });
 * // Access to hiddenRows plugin instance:
 * var hiddenRowsPlugin = hot.getPlugin('hiddenRows');
 *
 * // Show row programmatically:
 * hiddenRowsPlugin.showRow(1);
 * // Show rows
 * hiddenRowsPlugin.showRow(1, 2, 9);
 * // or
 * hiddenRowsPlugin.showRows([1, 2, 9]);
 * hot.render();
 * ...
 * // Hide row programmatically:
 * hiddenRowsPlugin.hideRow(1);
 * // Hide rows
 * hiddenRowsPlugin.hideRow(1, 2, 9);
 * // or
 * hiddenRowsPlugin.hideRows([1, 2, 9]);
 * hot.render();
 * ...
 * ```
 */
class HiddenRows extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Cached settings from Handsontable settings.
     *
     * @type {Object}
     */
    this.settings = {};
    /**
     * List of hidden rows indexes.
     *
     * @type {Array}
     */
    this.hiddenRows = [];
    /**
     * Last selected row index.
     *
     * @type {Number}
     * @default -1
     */
    this.lastSelectedRow = -1;
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().hiddenRows;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (this.hot.hasRowHeaders()) {
      this.addHook('afterGetRowHeader', (row, TH) => this.onAfterGetRowHeader(row, TH));
    } else {
      this.addHook('afterRenderer', (TD, row) => this.onAfterGetRowHeader(row, TD));
    }

    this.addHook('afterContextMenuDefaultOptions', (options) => this.onAfterContextMenuDefaultOptions(options));
    this.addHook('afterGetCellMeta', (row, col, cellProperties) => this.onAfterGetCellMeta(row, col, cellProperties));
    this.addHook('modifyRowHeight', (height, row) => this.onModifyRowHeight(height, row));
    this.addHook('beforeSetRangeStartOnly', (coords) => this.onBeforeSetRangeStartOnly(coords));
    this.addHook('beforeSetRangeStart', (coords) => this.onBeforeSetRangeStart(coords));
    this.addHook('beforeSetRangeEnd', (coords) => this.onBeforeSetRangeEnd(coords));
    this.addHook('hiddenRow', (row) => this.isHidden(row));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));

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

    this.onAfterPluginsInitialized();

    super.updatePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    this.settings = {};
    this.hiddenRows = [];
    this.lastSelectedRow = -1;

    super.disablePlugin();
    this.resetCellsMeta();
  }

  /**
   * Show the rows provided in the array.
   *
   * @param {Array} rows Array of row index.
   */
  showRows(rows) {
    arrayEach(rows, (row) => {
      row = parseInt(row, 10);
      row = this.getLogicalRowIndex(row);

      if (this.isHidden(row, true)) {
        this.hiddenRows.splice(this.hiddenRows.indexOf(row), 1);
      }
    });
  }

  /**
   * Show the row provided as row index (counting from 0).
   *
   * @param {Number} row Row index.
   */
  showRow(...row) {
    this.showRows(row);
  }

  /**
   * Hide the rows provided in the array.
   *
   * @param {Array} rows Array of row index.
   */
  hideRows(rows) {
    arrayEach(rows, (row) => {
      row = parseInt(row, 10);
      row = this.getLogicalRowIndex(row);

      if (!this.isHidden(row, true)) {
        this.hiddenRows.push(row);
      }
    });
  }

  /**
   * Hide the row provided as row index (counting from 0).
   *
   * @param {Number} row Row index.
   */
  hideRow(...row) {
    this.hideRows(row);
  }

  /**
   * Check if given row is hidden.
   *
   * @param {Number} row Column index.
   * @param {Boolean} isLogicIndex flag which determines type of index.
   * @returns {Boolean}
   */
  isHidden(row, isLogicIndex = false) {
    if (!isLogicIndex) {
      row = this.getLogicalRowIndex(row);
    }

    return this.hiddenRows.indexOf(row) > -1;
  }

  /**
   * Reset all rendered cells meta.
   *
   * @private
   */
  resetCellsMeta() {
    arrayEach(this.hot.getCellsMeta(), (meta) => {
      if (meta) {
        meta.skipRowOnPaste = false;
      }
    });
  }

  /**
   * Get the logical index of the provided row.
   *
   * @param {Number} row
   * @returns {Number}
   */
  getLogicalRowIndex(row) {
    return this.hot.runHooks('modifyRow', row);
  }

  /**
   * Set the copy-related cell meta.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {Object} cellProperties Cell meta object properties.
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    row = this.hot.runHooks('unmodifyRow', row);

    if (this.settings.copyPasteEnabled === false && this.isHidden(row)) {
      cellProperties.skipRowOnPaste = true;

    } else {
      cellProperties.skipRowOnPaste = false;
    }

    if (this.isHidden(row - 1)) {
      let firstSectionHidden = true;
      let i = row - 1;

      cellProperties.className = cellProperties.className || '';

      if (cellProperties.className.indexOf('afterHiddenRow') === -1) {
        cellProperties.className += ' afterHiddenRow';
      }

      do {
        if (!this.isHidden(i)) {
          firstSectionHidden = false;
          break;
        }
        i--;
      } while (i >= 0);

      if (firstSectionHidden && cellProperties.className.indexOf('firstVisibleRow') === -1) {
        cellProperties.className += ' firstVisibleRow';
      }
    } else if (cellProperties.className) {
      let classArr = cellProperties.className.split(' ');

      if (classArr.length) {
        let containAfterHiddenColumn = classArr.indexOf('afterHiddenRow');
        let containFirstVisible = classArr.indexOf('firstVisibleRow');

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
   * Add the needed classes to the headers.
   *
   * @private
   * @param {Number} row Row index.
   * @param {HTMLElement} th Table header element.
   */
  onAfterGetRowHeader(row, th) {
    let tr = th.parentNode;

    if (tr) {
      if (this.isHidden(row)) {
        addClass(tr, 'hide');
      } else {
        removeClass(tr, 'hide');
      }
    }

    let firstSectionHidden = true;
    let i = row - 1;

    do {
      if (!this.isHidden(i)) {
        firstSectionHidden = false;
        break;
      }
      i--;
    } while (i >= 0);

    if (firstSectionHidden) {
      addClass(th, 'firstVisibleRow');
    }

    if (this.settings.indicators && this.hot.hasRowHeaders()) {
      if (this.isHidden(row - 1)) {
        addClass(th, 'afterHiddenRow');
      }
      if (this.isHidden(row + 1)) {
        addClass(th, 'beforeHiddenRow');
      }
    }
  }

  /**
   * Add the additional row height for the hidden row indicators.
   *
   * @private
   * @param {Number} height Row height.
   * @param {Number} row Row index.
   * @returns {Number}
   */
  onModifyRowHeight(height, row) {
    if (this.isHidden(row)) {
      return 0.1;
    }

    return height;
  }

  /**
   * On modify copyable range listener.
   *
   * @private
   * @param {Array} ranges Array of selected copyable text.
   * @returns {Array} Returns modyfied range.
   */
  onModifyCopyableRange(ranges) {
    let newRanges = [];

    let pushRange = (startRow, endRow, startCol, endCol) => {
      newRanges.push({startRow, endRow, startCol, endCol});
    };

    arrayEach(ranges, (range) => {
      let isHidden = true;
      let rangeStart = 0;

      rangeEach(range.startRow, range.endRow, (row) => {
        if (this.isHidden(row)) {
          if (!isHidden) {
            pushRange(rangeStart, row - 1, range.startCol, range.endCol);
          }
          isHidden = true;
        } else {
          if (isHidden) {
            rangeStart = row;
          }
          if (row === range.endRow) {
            pushRange(rangeStart, row, range.startCol, range.endCol);
          }
          isHidden = false;
        }
      });
    });

    return newRanges;
  }

  /**
   * On before set range start listener, when selection was triggered by the cell.
   *
   * @private
   * @param {Object} coords Object with `row` and `col` properties.
   */
  onBeforeSetRangeStart(coords) {
    let actualSelection = this.hot.getSelected() || false;
    let lastPossibleIndex = this.hot.countRows() - 1;

    let getNextRow = (row) => {
      let direction = 0;

      if (actualSelection) {
        direction = row > actualSelection[0] ? 1 : -1;

        this.lastSelectedRow = actualSelection[0];
      }

      if (lastPossibleIndex < row || row < 0) {
        return this.lastSelectedRow;
      }

      if (this.isHidden(row)) {
        row = getNextRow(row + direction);
      }

      return row;
    };

    coords.row = getNextRow(coords.row);
  }

  /**
   * On before set range start listener, when selection was triggered by the headers.
   *
   * @private
   * @param {Object} coords Object with `row` and `col` properties.
   */
  onBeforeSetRangeStartOnly(coords) {
    if (coords.row > 0) {
      return;
    }

    coords.row = 0;

    let getNextRow = (row) => {

      if (this.isHidden(row)) {
        row = getNextRow(++row);
      }

      return row;
    };

    coords.row = getNextRow(coords.row);
  }

  /**
   * On before set range end listener.
   *
   * @private
   * @param {Object} coords Object with `row` and `col` properties.
   */
  onBeforeSetRangeEnd(coords) {
    let rowCount = this.hot.countRows();

    let getNextRow = (row) => {
      if (this.isHidden(row)) {
        if (this.lastSelectedRow > row || coords.row === rowCount - 1) {
          if (row > 0) {
            row = getNextRow(--row);

          } else {
            rangeEach(0, this.lastSelectedRow, (i) => {
              if (!this.isHidden(i)) {
                row = i;

                return false;
              }
            });
          }

        } else {
          row = getNextRow(++row);
        }
      }

      return row;
    };

    coords.row = getNextRow(coords.row);
    this.lastSelectedRow = coords.row;
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
        name: '---------',
      },
      hideRowItem(this),
      showRowItem(this)
    );
  }

  /**
   * Recalculate index of hidden rows after add row action
   *
   * @param {Number} index
   * @param {Number} amount
   */
  onAfterCreateRow(index, amount) {
    let tempHidden = [];

    arrayEach(this.hiddenRows, (col) => {
      if (col >= index) {
        col += amount;
      }
      tempHidden.push(col);
    });
    this.hiddenRows = tempHidden;
  }

  /**
   * Recalculate index of hidden rows after remove row action
   *
   * @param {Number} index
   * @param {Number} amount
   */
  onAfterRemoveRow(index, amount) {
    let tempHidden = [];

    arrayEach(this.hiddenRows, (col) => {
      if (col >= index) {
        col -= amount;
      }
      tempHidden.push(col);
    });
    this.hiddenRows = tempHidden;
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onAfterPluginsInitialized() {
    let settings = this.hot.getSettings().hiddenRows;

    if (typeof settings === 'object') {
      this.settings = settings;

      if (settings.copyPasteEnabled === void 0) {
        settings.copyPasteEnabled = true;
      }
      if (Array.isArray(settings.rows)) {
        this.hideRows(settings.rows);
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

registerPlugin('hiddenRows', HiddenRows);

export default HiddenRows;
