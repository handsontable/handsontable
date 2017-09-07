import {
  addClass,
  removeClass,
  hasClass,
  fastInnerHTML,
  empty,
} from 'handsontable/helpers/dom/element';
import {rangeEach} from 'handsontable/helpers/number';
import {arrayEach} from 'handsontable/helpers/array';
import {objectEach} from 'handsontable/helpers/object';
import {
  registerPlugin,
  getPlugin
} from 'handsontable/plugins';
import BasePlugin from 'handsontable/plugins/_base';
import {CellCoords} from 'handsontable/3rdparty/walkontable/src';
import GhostTable from './utils/ghostTable';

import './nestedHeaders.css';

/**
 * @plugin NestedHeaders
 * @pro
 *
 * @description
 * This plugin allows to create a nested header structure, using the HTML's colspan attribute.
 *
 * To make any header wider (covering multiple table columns), it's corresponding configuration array element should be provided as an object with `label` and `colspan` properties.
 * The `label` property defines the header's label, while the `colspan` property defines a number of columns that the header should cover.
 *
 * **Note** that the plugin supports a *nested* structure, which means, any header cannot be wider than it's "parent". In
 * other words, headers cannot overlap each other.
 * @example
 *
 * ```js
 * ...
 * let hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *  nestedHeaders: [
 *           ['A', {label: 'B', colspan: 8}, 'C'],
 *           ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *           ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *           ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ],
 * ...
 * ```
 */
class NestedHeaders extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Nasted headers cached settings.
     *
     * @type {Object}
     */
    this.settings = [];
    /**
     * Cached number of column header levels.
     *
     * @type {Number}
     */
    this.columnHeaderLevelCount = 0;
    /**
     * Array of nested headers' colspans.
     *
     * @type {Array}
     */
    this.colspanArray = [];
    /**
     * Custom helper for getting widths of the nested headers.
     * @TODO This should be changed after refactor handsontable/utils/ghostTable.
     *
     * @type {GhostTable}
     */
    this.ghostTable = new GhostTable(this);
  }

  /**
   * Check if plugin is enabled
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().nestedHeaders;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().nestedHeaders;

    this.addHook('afterGetColumnHeaderRenderers', (array) => this.onAfterGetColumnHeaderRenderers(array));
    this.addHook('afterInit', () => this.onAfterInit());
    this.addHook('afterOnCellMouseDown', (event, coords, TD) => this.onAfterOnCellMouseDown(event, coords, TD));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations));
    this.addHook('afterViewportColumnCalculatorOverride', (calc) => this.onAfterViewportColumnCalculatorOverride(calc));
    this.addHook('modifyColWidth', (width, column) => this.onModifyColWidth(width, column));

    this.setupColspanArray();
    this.checkForFixedColumnsCollision();

    this.columnHeaderLevelCount = this.hot.view ? this.hot.view.wt.getSetting('columnHeaders').length : 0;

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    this.clearColspans();

    this.settings = [];
    this.columnHeaderLevelCount = 0;
    this.colspanArray = [];

    this.ghostTable.clear();

    super.disablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
    this.ghostTable.buildWidthsMapper();
  }

  /**
   * Clear the colspans remaining after plugin usage.
   *
   * @private
   */
  clearColspans() {
    if (!this.hot.view) {
      return;
    }

    let headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    let mainHeaders = this.hot.view.wt.wtTable.THEAD;
    let topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    let topLeftCornerHeaders = this.hot.view.wt.wtOverlays.topLeftCornerOverlay ?
      this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    for (let i = 0; i < headerLevels; i++) {
      let masterLevel = mainHeaders.childNodes[i];

      if (!masterLevel) {
        break;
      }

      let topLevel = topHeaders.childNodes[i];
      let topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      for (let j = 0, masterNodes = masterLevel.childNodes.length; j < masterNodes; j++) {
        masterLevel.childNodes[j].removeAttribute('colspan');

        if (topLevel && topLevel.childNodes[j]) {
          topLevel.childNodes[j].removeAttribute('colspan');
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          topLeftCornerLevel.childNodes[j].removeAttribute('colspan');
        }
      }
    }
  }

  /**
   * Check if the nested headers overlap the fixed columns overlay, if so - display a warning.
   */
  checkForFixedColumnsCollision() {
    let fixedColumnsLeft = this.hot.getSettings().fixedColumnsLeft;

    arrayEach(this.colspanArray, (value, i) => {
      if (this.getNestedParent(i, fixedColumnsLeft) !== fixedColumnsLeft) {
        console.warn('You have declared a Nested Header overlapping the Fixed Columns section - it may lead to visual glitches. ' +
          'To prevent that kind of problems, split the nested headers between the fixed and non-fixed columns.');
      }
    });
  }

  /**
   * Check if the configuration contains overlapping headers.
   */
  checkForOverlappingHeaders() {
    arrayEach(this.colspanArray, (level, i) => {
      arrayEach(this.colspanArray[i], (header, j) => {
        if (header.colspan > 1) {
          let row = this.levelToRowCoords(i);
          let childHeaders = this.getChildHeaders(row, j);

          if (childHeaders.length > 0) {
            let childColspanSum = 0;

            arrayEach(childHeaders, (col, i) => {
              childColspanSum += this.getColspan(row + 1, col);
            });

            if (childColspanSum > header.colspan) {
              console.warn('Your Nested Headers plugin setup contains overlapping headers. This kind of configuration is ' +
                'currently not supported and might result in glitches.');
            }

            return false;
          }
        }
      });

    });
  }

  /**
   * Create an internal array containing information of the headers with a colspan attribute.
   */
  setupColspanArray() {
    function checkIfExists(array, index) {
      if (!array[index]) {
        array[index] = [];
      }
    }

    objectEach(this.settings, (levelValue, level) => {
      objectEach(levelValue, (val, col, levelValue) => {
        checkIfExists(this.colspanArray, level);

        if (levelValue[col].colspan === void 0) {
          this.colspanArray[level].push({
            label: levelValue[col] || '',
            colspan: 1,
            hidden: false
          });

        } else {
          let colspan = levelValue[col].colspan || 1;

          this.colspanArray[level].push({
            label: levelValue[col].label || '',
            colspan: colspan,
            hidden: false
          });

          this.fillColspanArrayWithDummies(colspan, level);
        }
      });
    });
  }

  /**
   * Fill the "colspan array" with default data for the dummy hidden headers.
   *
   * @param {Number} colspan The colspan value.
   * @param {Number} level Header level.
   */
  fillColspanArrayWithDummies(colspan, level) {
    rangeEach(0, colspan - 2, (i) => {
      this.colspanArray[level].push({
        label: '',
        colspan: 1,
        hidden: true,
      });
    });
  }

  /**
   * Generates the appropriate header renederer for a header row.
   *
   * @param {Number} headerRow The header row.
   * @returns {Function}
   */
  headerRendererFactory(headerRow) {
    let _this = this;

    return function(index, TH) {
      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');

      // header row is the index of header row counting from the top (=> positive values)
      if (_this.colspanArray[headerRow][index] && _this.colspanArray[headerRow][index].colspan) {
        let colspan = _this.colspanArray[headerRow][index].colspan;
        let fixedColumnsLeft = _this.hot.getSettings().fixedColumnsLeft || 0;
        let topLeftCornerOverlay = _this.hot.view.wt.wtOverlays.topLeftCornerOverlay;
        let leftOverlay = _this.hot.view.wt.wtOverlays.leftOverlay;
        let isInTopLeftCornerOverlay = topLeftCornerOverlay ? topLeftCornerOverlay.clone.wtTable.THEAD.contains(TH) : false;
        let isInLeftOverlay = leftOverlay ? leftOverlay.clone.wtTable.THEAD.contains(TH) : false;

        if (colspan > 1) {
          TH.setAttribute('colspan', isInTopLeftCornerOverlay || isInLeftOverlay ? Math.min(colspan, fixedColumnsLeft - index) : colspan);
        }

        if (isInTopLeftCornerOverlay || isInLeftOverlay && index === fixedColumnsLeft - 1) {
          addClass(TH, 'overlayEdge');
        }
      }

      if (_this.colspanArray[headerRow][index] && _this.colspanArray[headerRow][index].hidden) {
        addClass(TH, 'hiddenHeader');
      }

      empty(TH);

      let divEl = document.createElement('DIV');
      addClass(divEl, 'relative');
      let spanEl = document.createElement('SPAN');
      addClass(spanEl, 'colHeader');

      fastInnerHTML(spanEl, _this.colspanArray[headerRow][index] ? _this.colspanArray[headerRow][index].label || '' : '');

      divEl.appendChild(spanEl);

      TH.appendChild(divEl);

      _this.hot.runHooks('afterGetColHeader', index, TH);
    };
  }

  /**
   * Get the colspan for the provided coordinates.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {Number}
   */
  getColspan(row, column) {
    let header = this.colspanArray[this.rowCoordsToLevel(row)][column];

    return header ? header.colspan : 1;
  }

  /**
   * Translate the level value (header row index from the top) to the row value (negative index).
   *
   * @param {Number} level Header level.
   * @returns {Number}
   */
  levelToRowCoords(level) {
    return level - this.columnHeaderLevelCount;
  }

  /**
   * Translate the row value (negative index) to the level value (header row index from the top).
   *
   * @param {Number} row Row index.
   * @returns {Number}
   */
  rowCoordsToLevel(row) {
    return row + this.columnHeaderLevelCount;
  }

  /**
   * Get the column index of the "parent" nested header.
   *
   * @param {Number} level Header level.
   * @param {Number} column Column index.
   * @returns {*}
   */
  getNestedParent(level, column) {
    if (level < 0) {
      return false;
    }

    let colspan = this.colspanArray[level][column] ? this.colspanArray[level][column].colspan : 1;
    let hidden = this.colspanArray[level][column] ? this.colspanArray[level][column].hidden : false;

    if (colspan > 1 || (colspan === 1 && hidden === false)) {
      return column;

    }
    let parentCol = column - 1;

    do {
      if (this.colspanArray[level][parentCol].colspan > 1) {
        break;
      }

      parentCol--;
    } while (column >= 0);

    return parentCol;
  }

  /**
   * Returns (physical) indexes of headers below the header with provided coordinates.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @param {Number} colspan Colspan value.
   * @returns {Array}
   */
  getChildHeaders(row, column) {
    let level = this.rowCoordsToLevel(row);
    let childColspanLevel = this.colspanArray[level + 1];
    let nestedParentCol = this.getNestedParent(level, column);
    let colspan = this.colspanArray[level][column].colspan;
    let childHeaderRange = [];

    if (!childColspanLevel) {
      return childHeaderRange;
    }

    rangeEach(nestedParentCol, nestedParentCol + colspan - 1, (i) => {
      if (childColspanLevel[i] && childColspanLevel[i].colspan > 1) {
        colspan -= childColspanLevel[i].colspan - 1;
      }

      if (childColspanLevel[i] && !childColspanLevel[i].hidden && childHeaderRange.indexOf(i) === -1) {
        childHeaderRange.push(i);
      }
    });

    return childHeaderRange;
  }

  /**
   * Fill the remaining colspanArray entries for the undeclared column headers.
   */
  fillTheRemainingColspans() {
    objectEach(this.settings, (levelValue, level) => {
      rangeEach(this.colspanArray[level].length - 1, this.hot.countCols() - 1, (col) => {
        this.colspanArray[level].push({
          label: levelValue[col] || '',
          colspan: 1,
          hidden: false
        });

      }, true);
    });
  }

  /**
   * Update headers highlight in nested structure.
   *
   * @private
   */
  updateHeadersHighlight() {
    let selection = this.hot.getSelected();

    if (selection === void 0) {
      return;
    }
    const classHighlight = 'ht__highlight';

    let wtOverlays = this.hot.view.wt.wtOverlays;
    let selectionByHeader = this.hot.selection.selectedHeader.cols;
    let from = Math.min(selection[1], selection[3]);
    let to = Math.max(selection[1], selection[3]);
    let levelLimit = selectionByHeader ? -1 : this.columnHeaderLevelCount - 1;

    rangeEach(from, to, (column) => {
      for (let level = this.columnHeaderLevelCount - 1; level > -1; level--) {
        let visibleColumnIndex = this.getNestedParent(level, column);
        let topTH = wtOverlays.topOverlay ? wtOverlays.topOverlay.clone.wtTable.getColumnHeader(visibleColumnIndex, level) : void 0;
        let topLeftTH = wtOverlays.topLeftCornerOverlay ? wtOverlays.topLeftCornerOverlay.clone.wtTable.getColumnHeader(visibleColumnIndex, level) : void 0;
        let listTH = [topTH, topLeftTH];
        let colspanLen = this.getColspan(level - this.columnHeaderLevelCount, visibleColumnIndex);
        let isInSelection = visibleColumnIndex >= from && (visibleColumnIndex + colspanLen - 1) <= to;

        arrayEach(listTH, (TH, index, array) => {
          if (TH === void 0) {
            return false;
          }

          if ((!selectionByHeader && level < levelLimit) || (selectionByHeader && !isInSelection)) {
            if (hasClass(TH, classHighlight)) {
              removeClass(TH, classHighlight);
            }

          } else if (!hasClass(TH, classHighlight)) {
            addClass(TH, classHighlight);
          }
        });
      }
    });
  }

  /**
   * Make the renderer render the first nested column in its entirety.
   *
   * @private
   * @param {Object} calc Viewport column calculator.
   */
  onAfterViewportColumnCalculatorOverride(calc) {
    let newStartColumn = calc.startColumn;

    rangeEach(0, Math.max(this.columnHeaderLevelCount - 1, 0), (l) => {
      let startColumnNestedParent = this.getNestedParent(l, calc.startColumn);

      if (startColumnNestedParent < calc.startColumn) {
        let earlierColumn = Math.min(newStartColumn, startColumnNestedParent);

        newStartColumn = earlierColumn;

      }
    });

    calc.startColumn = newStartColumn;
  }

  /**
   * Select all nested headers of clicked cell.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {Object} coords Clicked cell coords.
   * @param {HTMLElement} TD
   */
  onAfterOnCellMouseDown(event, coords, TD) {
    if (coords.row < 0) {
      let colspan = this.getColspan(coords.row, coords.col);
      let lastColIndex = coords.col + colspan - 1;

      if (colspan > 1) {
        let lastRowIndex = this.hot.countRows() - 1;
        this.hot.selection.setRangeEnd(new CellCoords(lastRowIndex, lastColIndex));
      }
    }
  }

  /**
   * Make the header-selection properly select the nested headers.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {Object} coords Clicked cell coords.
   * @param {HTMLElement} TD
   */
  onBeforeOnCellMouseOver(event, coords, TD, blockCalculations) {
    if (coords.row < 0 && coords.col >= 0 && this.hot.view.isMouseDown()) {
      let {from, to} = this.hot.getSelectedRange();
      let colspan = this.getColspan(coords.row, coords.col);
      let lastColIndex = coords.col + colspan - 1;
      let changeDirection = false;

      if (from.col <= to.col) {
        if ((coords.col < from.col && lastColIndex === to.col) ||
            (coords.col < from.col && lastColIndex < from.col) ||
            (coords.col < from.col && lastColIndex >= from.col && lastColIndex < to.col)) {
          changeDirection = true;
        }
      } else if ((coords.col < to.col && lastColIndex > from.col) ||
                 (coords.col > from.col) ||
                 (coords.col <= to.col && lastColIndex > from.col) ||
                 (coords.col > to.col && lastColIndex > from.col)) {
        changeDirection = true;
      }

      if (changeDirection) {
        [from.col, to.col] = [to.col, from.col];
      }

      if (colspan > 1) {
        blockCalculations.column = true;
        blockCalculations.cell = true;

        this.hot.selection.setSelectedHeaders(false, true);

        if (from.col === to.col) {
          if (lastColIndex <= from.col && coords.col < from.col) {
            this.hot.selection.setRangeStartOnly(new CellCoords(from.row, to.col));
            this.hot.selection.setRangeEnd(new CellCoords(to.row, coords.col));
          } else {
            this.hot.selection.setRangeStartOnly(new CellCoords(from.row, coords.col < from.col ? coords.col : from.col));
            this.hot.selection.setRangeEnd(new CellCoords(to.row, lastColIndex > to.col ? lastColIndex : to.col));
          }
        }
        if (from.col < to.col) {
          this.hot.selection.setRangeStartOnly(new CellCoords(from.row, coords.col < from.col ? coords.col : from.col));
          this.hot.selection.setRangeEnd(new CellCoords(to.row, lastColIndex));

        }
        if (from.col > to.col) {
          this.hot.selection.setRangeStartOnly(new CellCoords(from.row, from.col));
          this.hot.selection.setRangeEnd(new CellCoords(to.row, coords.col));
        }
      }
    }
  }

  /**
   * Cache column header count.
   *
   * @private
   */
  onAfterInit() {
    this.columnHeaderLevelCount = this.hot.view.wt.getSetting('columnHeaders').length;

    this.fillTheRemainingColspans();

    this.checkForOverlappingHeaders();

    this.ghostTable.buildWidthsMapper();
  }

  /**
   * `afterGetColumnHeader` hook callback - prepares the header structure.
   *
   * @private
   * @param {Array} renderersArray Array of renderers.
   */
  onAfterGetColumnHeaderRenderers(renderersArray) {
    if (renderersArray) {
      renderersArray.length = 0;

      for (let headersCount = this.colspanArray.length, i = headersCount - 1; i >= 0; i--) {
        renderersArray.push(this.headerRendererFactory(i));
      }
      renderersArray.reverse();
    }

    this.updateHeadersHighlight();
  }

  /**
   * `modifyColWidth` hook callback - returns width from cache, when is greater than incoming from hook.
   *
   * @private
   * @param width Width from hook.
   * @param column Visual index of an column.
   * @returns {Number}
   */
  onModifyColWidth(width, column) {
    let cachedWidth = this.ghostTable.widthsCache[column];

    return width > cachedWidth ? width : cachedWidth;
  }

  /**
   * Destroy the plugin.
   */
  destroy() {
    this.settings = null;
    this.columnHeaderLevelCount = null;
    this.colspanArray = null;

    super.destroy();
  }

}

registerPlugin('nestedHeaders', NestedHeaders);

export default NestedHeaders;
