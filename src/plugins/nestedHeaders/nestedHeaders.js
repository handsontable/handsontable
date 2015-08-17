import {
  addClass,
  removeClass,
  fastInnerHTML,
  empty
} from './../../helpers/dom/element.js';
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
 *   nestedHeaders: [
 *      ['a', 'b', {label: 'c', colspan: 4}, 'd'],
 *      ['e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
 *   ]
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
    this.columnHeaderLevelCount = 0;
    this.colspanArray = [];

    this.hot.nestedHeadersSettings = this.settings || [];

    this.setupColspanArray();

    this.bindHooks();
  }

  bindHooks() {
    this.hot.addHook('afterGetColumnHeaderRenderers', (array) => this.onAfterGetColumnHeaderRenderers(array));
    this.hot.addHook('afterInit', () => this.onAfterInit());
    this.hot.addHook('afterOnCellMouseOver', (event, coords, TD) => this.onAfterOnCellMouseOver(event, coords, TD));
    this.hot.addHook('afterViewportColumnCalculatorOverride', (calc) => this.onAfterViewportColumnCalculatorOverride(calc));
  }


  setupColspanArray() {

    function checkIfExists(array, index) {
      if (!array[index]) {
        array[index] = [];
      }
    }

    for (let level in this.settings) {
      if (this.settings.hasOwnProperty(level)) {

        for (let col in this.settings[level]) {
          if (this.settings[level].hasOwnProperty(col)) {

            checkIfExists(this.colspanArray, level);

            if (this.settings[level][col].colspan) {
              let colspan = this.settings[level][col].colspan;

              this.colspanArray[level].push({
                label: this.settings[level][col].label || '',
                colspan: colspan,
                hidden: false
              });

              this.fillColspanArrayWithDummies(colspan, level);

            } else {
              this.colspanArray[level].push({
                label: this.settings[level][col] || '',
                colspan: 1,
                hidden: false
              });
            }
          }
        }
      }
    }
  }

  fillColspanArrayWithDummies(colspan, level) {
    for (let i = 0; i < colspan - 1; i++) {
      this.colspanArray[level].push({
        label: '',
        colspan: 1,
        hidden: true
      });
    }
  }


  onAfterOnCellMouseOver(event, coords, TD) {
    if (coords.row < 0 && this.hot.view.isMouseDown()) {
      let currentColspan = this.colspanArray[this.rowCoordsToLevel(coords.row)][coords.col].colspan;
      let fromCoords = this.hot.view.wt.selections[1].cellRange ? this.hot.view.wt.selections[1].cellRange.from : null;
      let toCoords = this.hot.view.wt.selections[1].cellRange ? this.hot.view.wt.selections[1].cellRange.to : null;
      let highlightCoords = this.hot.view.wt.selections[1].cellRange ? this.hot.view.wt.selections[1].cellRange.highlight : null;
      let rowCount = this.hot.countRows();

      if (fromCoords === null || toCoords === null || highlightCoords === null) {
        return;
      }

      if (highlightCoords.col === toCoords.col && (toCoords.col !== fromCoords.col)) {
        this.hot.selection.setRangeStart(new WalkontableCellCoords(0, toCoords.col + this.getColspan(coords.row, toCoords.col) - 1));
        this.hot.selection.setRangeEnd(new WalkontableCellCoords(rowCount - 1, fromCoords.col));

      } else {
        this.hot.selection.setRangeEnd(new WalkontableCellCoords(rowCount - 1, coords.col + currentColspan - 1));
      }

    }
  }

  onAfterInit() {
    this.columnHeaderLevelCount = this.hot.view.wt.getSetting('columnHeaders').length;
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

      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');

      // header row is the index of header row counting from the top (=> positive values)
      if (_this.colspanArray[headerRow][index] && _this.colspanArray[headerRow][index].colspan) {
        let colspan = _this.colspanArray[headerRow][index].colspan;

        if (colspan > 1) {
          TH.setAttribute('colspan', colspan);
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

      Handsontable.hooks.run(_this.hot, 'afterGetColHeader', index, TH);
    };
  }

  /**
   * `afterGetColumnHeader` hook callback - prepares the header structure
   *
   * @param array
   */
  onAfterGetColumnHeaderRenderers(array) {
    if (array) {
      array.length = 0;

      for (let headersCount = this.colspanArray.length, i = headersCount - 1; i >= 0; i--) {
        array.push(this.headerRendererFactory(i));
      }

      array.reverse();
    }
  }

  /**
   * Get the colspan for the provided coordinates
   *
   * @param {Number} row
   * @param {Number} col
   * @returns {Number}
   */
  getColspan(row, col) {
    return this.colspanArray[this.rowCoordsToLevel(row)][col].colspan;
  }

  levelToRowCoords(level) {
    return level - this.columnHeaderLevelCount;
  }

  rowCoordsToLevel(row) {
    return row + this.columnHeaderLevelCount;
  }

  getNestedParent(level, col) {
    let colspan = this.colspanArray[level][col] ? this.colspanArray[level][col].colspan : 1;
    let hidden = this.colspanArray[level][col] ? this.colspanArray[level][col].hidden : false;

    if (colspan > 1 || (colspan === 1 && hidden === false)) {
      return col;

    } else {
      let parentCol = col - 1;

      do {
        if (this.colspanArray[level][parentCol].colspan > 1) {
          break;
        }

        parentCol--;
      } while (col >= 0);

      return parentCol;
    }
  }

  onAfterViewportColumnCalculatorOverride(calc) {
    let newStartColumn = calc.startColumn;

    for (var l = 0; l < this.columnHeaderLevelCount; l++) {
      let startColumnNestedParent = this.getNestedParent(l, calc.startColumn);

      if (startColumnNestedParent < calc.startColumn) {
        let earlierColumn = Math.min(newStartColumn, startColumnNestedParent);

        newStartColumn = earlierColumn;

      }
    }

    calc.startColumn = newStartColumn;
  }

  /**
   * Returns (physical) indexes of headers below the header with provided coordinates
   *
   * @param {Number} row
   * @param {Number} col
   * @param {Number} colspan
   * @returns {Array}
   */
  getChildHeaders(row, col) {
    let level = this.rowCoordsToLevel(row);
    let childColspanLevel = this.colspanArray[level + 1];
    let nestedParentCol = this.getNestedParent(level, col);
    let colspan = this.colspanArray[level][col].colspan;
    let childHeaderRange = [];

    if (!childColspanLevel) {
      return childHeaderRange;
    }

    for (let i = nestedParentCol; i < nestedParentCol + colspan; i++) {

      if (childColspanLevel[i] && childColspanLevel[i].colspan > 1) {
        colspan -= childColspanLevel[i].colspan - 1;
      }

      if (!childColspanLevel[i].hidden && childHeaderRange.indexOf(i) === -1) {
        childHeaderRange.push(i);
      }
    }

    return childHeaderRange;
  }

}

export {NestedHeaders};

registerPlugin('nestedHeaders', NestedHeaders);