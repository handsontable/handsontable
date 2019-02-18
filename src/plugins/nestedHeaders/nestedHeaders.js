import {
  addClass,
  removeClass,
  fastInnerHTML,
  empty,
} from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import { registerPlugin } from '../../plugins';
import BasePlugin from '../_base';
import { CellCoords } from '../../3rdparty/walkontable/src';
import GhostTable from './utils/ghostTable';

import './nestedHeaders.css';

/**
 * @plugin NestedHeaders
 * @description
 * The plugin allows to create a nested header structure, using the HTML's colspan attribute.
 *
 * To make any header wider (covering multiple table columns), it's corresponding configuration array element should be
 * provided as an object with `label` and `colspan` properties. The `label` property defines the header's label,
 * while the `colspan` property defines a number of columns that the header should cover.
 *
 * __Note__ that the plugin supports a *nested* structure, which means, any header cannot be wider than it's "parent". In
 * other words, headers cannot overlap each other.
 * @example
 *
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   date: getData(),
 *   nestedHeaders: [
 *           ['A', {label: 'B', colspan: 8}, 'C'],
 *           ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *           ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *           ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ],
 * ```
 */
class NestedHeaders extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Nasted headers cached settings.
     *
     * @private
     * @type {Object}
     */
    this.settings = [];
    /**
     * Cached number of column header levels.
     *
     * @private
     * @type {Number}
     */
    this.columnHeaderLevelCount = 0;
    /**
     * Array of nested headers' colspans.
     *
     * @private
     * @type {Array}
     */
    this.colspanArray = [];
    /**
     * Custom helper for getting widths of the nested headers.
     * @TODO This should be changed after refactor handsontable/utils/ghostTable.
     *
     * @private
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
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().nestedHeaders;

    this.addHook('afterGetColumnHeaderRenderers', array => this.onAfterGetColumnHeaderRenderers(array));
    this.addHook('afterInit', () => this.onAfterInit());
    this.addHook('afterOnCellMouseDown', (event, coords) => this.onAfterOnCellMouseDown(event, coords));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations));
    this.addHook('afterViewportColumnCalculatorOverride', calc => this.onAfterViewportColumnCalculatorOverride(calc));
    this.addHook('modifyColWidth', (width, column) => this.onModifyColWidth(width, column));

    this.setupColspanArray();
    this.checkForFixedColumnsCollision();

    this.columnHeaderLevelCount = this.hot.view ? this.hot.view.wt.getSetting('columnHeaders').length : 0;

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
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
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
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

    const headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    const mainHeaders = this.hot.view.wt.wtTable.THEAD;
    const topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = this.hot.view.wt.wtOverlays.topLeftCornerOverlay ?
      this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    for (let i = 0; i < headerLevels; i++) {
      const masterLevel = mainHeaders.childNodes[i];

      if (!masterLevel) {
        break;
      }

      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

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
   *
   * @private
   */
  checkForFixedColumnsCollision() {
    const fixedColumnsLeft = this.hot.getSettings().fixedColumnsLeft;

    arrayEach(this.colspanArray, (value, i) => {
      if (this.getNestedParent(i, fixedColumnsLeft) !== fixedColumnsLeft) {
        warn(toSingleLine`You have declared a Nested Header overlapping the Fixed Columns section - it may lead to visual
          glitches. To prevent that kind of problems, split the nested headers between the fixed and non-fixed columns.`);
      }
    });
  }

  /**
   * Check if the configuration contains overlapping headers.
   *
   * @private
   */
  checkForOverlappingHeaders() {
    arrayEach(this.colspanArray, (level, i) => {
      arrayEach(this.colspanArray[i], (header, j) => {
        if (header.colspan > 1) {
          const row = this.levelToRowCoords(i);
          const childHeaders = this.getChildHeaders(row, j);

          if (childHeaders.length > 0) {
            let childColspanSum = 0;

            arrayEach(childHeaders, (col) => {
              childColspanSum += this.getColspan(row + 1, col);
            });

            if (childColspanSum > header.colspan) {
              warn(toSingleLine`Your Nested Headers plugin setup contains overlapping headers. This kind of configuration
                is currently not supported and might result in glitches.`);
            }

            return false;
          }
        }
      });
    });
  }

  /**
   * Create an internal array containing information of the headers with a colspan attribute.
   *
   * @private
   */
  setupColspanArray() {
    function checkIfExists(array, index) {
      if (!array[index]) {
        array[index] = [];
      }
    }

    objectEach(this.settings, (levelValues, level) => {
      objectEach(levelValues, (val, col, levelValue) => {
        checkIfExists(this.colspanArray, level);

        if (levelValue[col].colspan === void 0) {
          this.colspanArray[level].push({
            label: levelValue[col] || '',
            colspan: 1,
            hidden: false
          });

        } else {
          const colspan = levelValue[col].colspan || 1;

          this.colspanArray[level].push({
            label: levelValue[col].label || '',
            colspan,
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
   * @private
   * @param {Number} colspan The colspan value.
   * @param {Number} level Header level.
   */
  fillColspanArrayWithDummies(colspan, level) {
    rangeEach(0, colspan - 2, () => {
      this.colspanArray[level].push({
        label: '',
        colspan: 1,
        hidden: true,
      });
    });
  }

  /**
   * Generates the appropriate header renderer for a header row.
   *
   * @private
   * @param {Number} headerRow The header row.
   * @returns {Function}
   *
   * @fires Hooks#afterGetColHeader
   */
  headerRendererFactory(headerRow) {
    const _this = this;

    return function(index, TH) {
      const { rootDocument } = _this.hot;
      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');

      // header row is the index of header row counting from the top (=> positive values)
      if (_this.colspanArray[headerRow][index] && _this.colspanArray[headerRow][index].colspan) {
        const colspan = _this.colspanArray[headerRow][index].colspan;
        const fixedColumnsLeft = _this.hot.getSettings().fixedColumnsLeft || 0;
        const { leftOverlay, topLeftCornerOverlay } = _this.hot.view.wt.wtOverlays;
        const isInTopLeftCornerOverlay = topLeftCornerOverlay ? topLeftCornerOverlay.clone.wtTable.THEAD.contains(TH) : false;
        const isInLeftOverlay = leftOverlay ? leftOverlay.clone.wtTable.THEAD.contains(TH) : false;

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

      const divEl = rootDocument.createElement('DIV');
      addClass(divEl, 'relative');
      const spanEl = rootDocument.createElement('SPAN');
      addClass(spanEl, 'colHeader');

      fastInnerHTML(spanEl, _this.colspanArray[headerRow][index] ? _this.colspanArray[headerRow][index].label || '' : '');

      divEl.appendChild(spanEl);

      TH.appendChild(divEl);

      _this.hot.runHooks('afterGetColHeader', index, TH);
    };
  }

  /**
   * Returns the colspan for the provided coordinates.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {Number}
   */
  getColspan(row, column) {
    const header = this.colspanArray[this.rowCoordsToLevel(row)][column];

    return header ? header.colspan : 1;
  }

  /**
   * Translates the level value (header row index from the top) to the row value (negative index).
   *
   * @private
   * @param {Number} level Header level.
   * @returns {Number}
   */
  levelToRowCoords(level) {
    return level - this.columnHeaderLevelCount;
  }

  /**
   * Translates the row value (negative index) to the level value (header row index from the top).
   *
   * @private
   * @param {Number} row Row index.
   * @returns {Number}
   */
  rowCoordsToLevel(row) {
    return row + this.columnHeaderLevelCount;
  }

  /**
   * Returns the column index of the "parent" nested header.
   *
   * @private
   * @param {Number} level Header level.
   * @param {Number} column Column index.
   * @returns {*}
   */
  getNestedParent(level, column) {
    if (level < 0) {
      return false;
    }

    const colspan = this.colspanArray[level][column] ? this.colspanArray[level][column].colspan : 1;
    const hidden = this.colspanArray[level][column] ? this.colspanArray[level][column].hidden : false;

    if (colspan > 1 || (colspan === 1 && hidden === false)) {
      return column;

    }
    let parentCol = column - 1;

    do {
      if (this.colspanArray[level][parentCol].colspan > 1) {
        break;
      }

      parentCol -= 1;
    } while (column >= 0);

    return parentCol;
  }

  /**
   * Returns (physical) indexes of headers below the header with provided coordinates.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {Number[]}
   */
  getChildHeaders(row, column) {
    const level = this.rowCoordsToLevel(row);
    const childColspanLevel = this.colspanArray[level + 1];
    const nestedParentCol = this.getNestedParent(level, column);
    let colspan = this.colspanArray[level][column].colspan;
    const childHeaderRange = [];

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
   *
   * @private
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
   * Updates headers highlight in nested structure.
   *
   * @private
   */
  updateHeadersHighlight() {
    const selection = this.hot.getSelectedLast();

    if (selection === void 0) {
      return;
    }

    const { wtOverlays } = this.hot.view.wt;
    const selectionByHeader = this.hot.selection.isSelectedByColumnHeader();
    const from = Math.min(selection[1], selection[3]);
    const to = Math.max(selection[1], selection[3]);
    const levelLimit = selectionByHeader ? -1 : this.columnHeaderLevelCount - 1;

    const changes = [];
    const classNameModifier = className => (TH, modifier) => () => modifier(TH, className);
    const highlightHeader = classNameModifier('ht__highlight');
    const activeHeader = classNameModifier('ht__active_highlight');

    rangeEach(from, to, (column) => {
      for (let level = this.columnHeaderLevelCount - 1; level > -1; level--) {
        const visibleColumnIndex = this.getNestedParent(level, column);
        const topTH = wtOverlays.topOverlay ? wtOverlays.topOverlay.clone.wtTable.getColumnHeader(visibleColumnIndex, level) : void 0;
        const topLeftTH = wtOverlays.topLeftCornerOverlay ? wtOverlays.topLeftCornerOverlay.clone.wtTable.getColumnHeader(visibleColumnIndex, level) : void 0;
        const listTH = [topTH, topLeftTH];
        const colspanLen = this.getColspan(level - this.columnHeaderLevelCount, visibleColumnIndex);
        const isInSelection = visibleColumnIndex >= from && (visibleColumnIndex + colspanLen - 1) <= to;

        arrayEach(listTH, (TH) => {
          if (TH === void 0) {
            return false;
          }

          if ((!selectionByHeader && level < levelLimit) || (selectionByHeader && !isInSelection)) {
            changes.push(highlightHeader(TH, removeClass));

            if (selectionByHeader) {
              changes.push(activeHeader(TH, removeClass));
            }

          } else {
            changes.push(highlightHeader(TH, addClass));

            if (selectionByHeader) {
              changes.push(activeHeader(TH, addClass));
            }
          }
        });
      }
    });

    arrayEach(changes, fn => void fn());
    changes.length = 0;
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
      const startColumnNestedParent = this.getNestedParent(l, calc.startColumn);

      if (startColumnNestedParent < calc.startColumn) {
        newStartColumn = Math.min(newStartColumn, startColumnNestedParent);
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
   */
  onAfterOnCellMouseDown(event, coords) {
    if (coords.row < 0) {
      const colspan = this.getColspan(coords.row, coords.col);
      const lastColIndex = coords.col + colspan - 1;

      if (colspan > 1) {
        const lastRowIndex = this.hot.countRows() - 1;

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
    if (coords.row >= 0 || coords.col < 0 || !this.hot.view.isMouseDown()) {
      return;
    }

    const { from, to } = this.hot.getSelectedRangeLast();
    const colspan = this.getColspan(coords.row, coords.col);
    const lastColIndex = coords.col + colspan - 1;
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

      const columnRange = [];

      if (from.col === to.col) {
        if (lastColIndex <= from.col && coords.col < from.col) {
          columnRange.push(to.col, coords.col);
        } else {
          columnRange.push(coords.col < from.col ? coords.col : from.col, lastColIndex > to.col ? lastColIndex : to.col);
        }
      }
      if (from.col < to.col) {
        columnRange.push(coords.col < from.col ? coords.col : from.col, lastColIndex);

      }
      if (from.col > to.col) {
        columnRange.push(from.col, coords.col);
      }

      this.hot.selectColumns(...columnRange);
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
    const cachedWidth = this.ghostTable.widthsCache[column];

    return width > cachedWidth ? width : cachedWidth;
  }

  /**
   * Destroys the plugin instance.
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
