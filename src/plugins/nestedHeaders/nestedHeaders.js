import * as dom from './../../dom.js';
import {registerPlugin, getPlugin} from './../../plugins.js';
import BasePlugin from './../_base.js';

/**
 * @class NestedHeaders
 * @plugin NestedHeaders
 *
 * @description
 * Allows creating a nested header structure, using the HTML's colspan attribute.
 *
 * @example
 *
 * ```js
 * ...
 * let hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   nestedHeaders: {
 *     colHeaders: [
 *       ['a', 'b', 'c', 'd', 'e'],
 *       function() {
 *         return ['f', 'g', 'h', 'i', 'j', 'k']
 *       }
 *     ],
 *     colspan: [
*        [1, 3, 1, 1],
 *       [1, 1, 2, 1, 1]
 *     ],
 *     overwriteHeaders: true
 *   }
 * ...
 * ```
 */
class NestedHeaders extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().nestedHeaders) {
      return;
    }

    this.settings = this.hot.getSettings().nestedHeaders;
    if (this.settings.overwriteHeaders === void 0) {
      this.settings.overwriteHeaders = true;
    }

    this.bindHooks();
  }

  bindHooks() {
    this.hot.addHook('afterGetColumnHeaderRenderers', (array) => this.onAfterGetColumnHeaderRenderers(array));
    this.hot.addHook('afterInit', () => this.onAfterInit());
    this.hot.addHook('afterOnCellMouseOver', (event, coords, TD) => this.onAfterOnCellMouseOver(event, coords, TD));
  }

  /**
   * Overwrite the header selections to match the nested headers
   *
   * @param {Object} event
   * @param {Object} coords
   * @param {HTMLElement} TD
   */
  onAfterOnCellMouseOver(event, coords, TD) {
    if (coords.row < 0 && this.hot.view.isMouseDown()) {
      let realColumnIndex = this.nestedColumnIndexToRealIndex(coords.row, coords.col);
      let currentColspan = parseInt(TD.getAttribute('colspan'), 10);
      let fromCoords = this.hot.view.wt.selections[1].cellRange.from;
      let toCoords = this.hot.view.wt.selections[1].cellRange.to;
      let highlightCoords = this.hot.view.wt.selections[1].cellRange.highlight;
      let rowCount = this.hot.countRows();

      if (currentColspan === '' || !currentColspan) {
        currentColspan = 1;
      }
      currentColspan -= 1;

      if (highlightCoords.col === toCoords.col && (toCoords.col !== fromCoords.col)) {
        this.hot.selection.setRangeStart(new WalkontableCellCoords(0, toCoords.col + this.getColspan(coords.row, toCoords.col) - 1));
        this.hot.selection.setRangeEnd(new WalkontableCellCoords(rowCount - 1, this.nestedColumnIndexToRealIndex(coords.row, fromCoords.col)));

      } else {
        this.hot.selection.setRangeEnd(new WalkontableCellCoords(rowCount - 1, realColumnIndex + currentColspan));
      }

    }
  }

  onAfterInit() {
    this.columnHeaderLevelCount = this.hot.view.wt.getSetting('columnHeaders').length;
  }

  /**
   * Checks wheter the provided nested header value is a function - if so, executes it
   *
   * @param {Array|Function} value
   * @returns {Array}
   */
  prepareHeaderValue(value) {
    if (typeof value === 'function') {
      return value();
    } else {
      return value;
    }
  }

  /**
   * Generates the appropriate header renederer for a header row
   *
   * @param {Integer} headerRow
   * @returns {Function}
   */
  headerRendererFactory(headerRow) {
    let _this = this;

    return function(index, TH) {
      let colspan = _this.settings.colspan && _this.settings.colspan[headerRow] ? _this.settings.colspan[headerRow][index] : 1;

      if (colspan && colspan > 1) {
        TH.setAttribute('colspan', colspan);
      }

      dom.empty(TH);

      let divEl = document.createElement('DIV');
      dom.addClass(divEl, 'relative');
      let spanEl = document.createElement('SPAN');
      dom.addClass(spanEl, 'colHeader');
      dom.fastInnerHTML(spanEl, _this.prepareHeaderValue(_this.settings.colHeaders[headerRow])[index] || '');

      divEl.appendChild(spanEl);
      TH.appendChild(divEl);

      Handsontable.hooks.run(_this.hot, 'afterGetColHeader', index, TH);
    };
  }

  /**
   * `afterGetColumnHeader` hook callback - prepares the header structure
   *
   * @param array
   */
  onAfterGetColumnHeaderRenderers(array) {
    let overwriteHeaders = this.settings.overwriteHeaders;

    if (array) {
      if (overwriteHeaders === true) {
        array.length = 0;
      }

      for (let headersCount = this.settings.colHeaders.length, i = headersCount - (!overwriteHeaders ? array.length : 0) - 1; i >= 0; i--) {
        array.push(this.headerRendererFactory(i));
      }

      array.reverse();
    }
  }

  /**
   * Get the colspan for the provided coordinates (physical, not 'nested')
   *
   * @param {Number} row
   * @param {Number} col
   * @returns {Number}
   */
  getColspan(row, col) {
    let currentLevel = this.settings.colspan[this.columnHeaderLevelCount + row] || [];

    return currentLevel[this.realColumnIndexToNestedIndex(row, col)] || 1;
  }

  /**
   * Convert the physical, low-level column index to the corresponding header-column index from the provided header level
   *
   * @param {Number} row
   * @param {Number} col
   * @returns {Number}
   */
  realColumnIndexToNestedIndex(row, col) {
    let nestedHeadersColspans = this.settings.colspan;
    let colspanSum = 0;
    let i = 0;

    while (i < col) {
      let currentLevel = nestedHeadersColspans[this.columnHeaderLevelCount + row];
      let colspan = currentLevel ? currentLevel[i] : null;
      if (colspan > 1) {
        colspanSum += colspan - 1;
      }

      if (i + colspanSum >= col) {
        return i;
      }

      i++;
    }
    return i;
  }

  /**
   * Convert header-column index from the provided header level to the the physical, low-level column index
   *
   * @param {Number} row
   * @param {Number} col
   * @returns {Number}
   */
  nestedColumnIndexToRealIndex(row, col) {
    let nestedHeadersColspans = this.settings.colspan;
    let colspanSum = 0;

    for (let i = 0; i < col; i++) {
      let currentLevel = nestedHeadersColspans[this.columnHeaderLevelCount + row];
      if (currentLevel && currentLevel[i] > 1) {
        colspanSum += currentLevel[i] - 1;
      }
    }

    return colspanSum + col;
  }

}

export {NestedHeaders};

registerPlugin('nestedHeaders', NestedHeaders);