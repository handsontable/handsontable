import {
  addClass,
  removeClass,
  fastInnerHTML,
  empty,
} from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach, arrayMap } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import { registerPlugin } from '../../plugins';
import BasePlugin from '../_base';
import { CellCoords } from '../../3rdparty/walkontable/src';
import GhostTable from './utils/ghostTable';
import { HiddenMap } from '../../translations';
import { ColumnStatesManager } from './columnStatesManager';

import './nestedHeaders.css';

const PLUGIN_NAME = 'nestedHeaders';

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
     * Array of nested headers' colspans.
     *
     * @private
     * @type {Array}
     */
    this.columnStatesManager = new ColumnStatesManager();
    /**
     * Custom helper for getting widths of the nested headers.
     * @TODO This should be changed after refactor handsontable/utils/ghostTable.
     *
     * @private
     * @type {GhostTable}
     */
    // this.ghostTable = new GhostTable(this);
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

    this.columnStatesManager.setState(this.hot.getSettings().nestedHeaders);

    this.addHook('afterGetColumnHeaderRenderers', array => this.onAfterGetColumnHeaderRenderers(array));
    this.addHook('afterInit', () => this.onAfterInit());
    this.addHook('afterOnCellMouseDown', (event, coords) => this.onAfterOnCellMouseDown(event, coords));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations));
    this.addHook('afterViewportColumnCalculatorOverride', calc => this.onAfterViewportColumnCalculatorOverride(calc));
    this.addHook('modifyColWidth', (width, column) => this.onModifyColWidth(width, column));

    this.columnHeaderLevelCount = this.hot.view ? this.hot.view.wt.getSetting('columnHeaders').length : 0;

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.clearColspans();

    this.columnHeaderLevelCount = 0;
    this.columnStatesManager.clear();
    // this.ghostTable.clear();

    super.disablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
    // this.ghostTable.buildWidthsMapper();
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

    return function(renderedColumnIndex, TH) {
      // let visualColumnsIndex = renderedColumnIndex;
      let visualColumnsIndex = _this.hot.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnsIndex === null) {
        visualColumnsIndex = renderedColumnIndex;
      }

      // console.log(renderedColumnIndex, visualColumnsIndex);
      return;

      const { rootDocument } = _this.hot;

      TH.removeAttribute('colspan');
      TH.removeAttribute('data-collapsible');
      removeClass(TH, 'hiddenHeader');

      const colspanDescriptor = _this.colspanArray[headerRow][visualColumnsIndex];

      // console.log(colspanDescriptor);

      // header row is the index of header row counting from the top (=> positive values)
      if (colspanDescriptor && colspanDescriptor.origColspan > 1) {
        const colspan = colspanDescriptor.colspan;
        const fixedColumnsLeft = _this.hot.getSettings().fixedColumnsLeft || 0;
        const { leftOverlay, topLeftCornerOverlay } = _this.hot.view.wt.wtOverlays;
        const isInTopLeftCornerOverlay = topLeftCornerOverlay ? topLeftCornerOverlay.clone.wtTable.THEAD.contains(TH) : false;
        const isInLeftOverlay = leftOverlay ? leftOverlay.clone.wtTable.THEAD.contains(TH) : false;

        TH.setAttribute('data-collapsible', '');

        if (!colspanDescriptor.isCollapsed && colspan > 1) {
          TH.setAttribute('colspan', isInTopLeftCornerOverlay || isInLeftOverlay ? Math.min(colspan, fixedColumnsLeft - visualColumnsIndex) : colspan);
        }

        if (isInTopLeftCornerOverlay || isInLeftOverlay && visualColumnsIndex !== fixedColumnsLeft - 1) {
          addClass(TH, 'overlayEdge');
        }
      }

      if (colspanDescriptor && colspanDescriptor.hidden) {
        addClass(TH, 'hiddenHeader');
      }

      empty(TH);

      const divEl = rootDocument.createElement('div');
      addClass(divEl, 'relative');
      const spanEl = rootDocument.createElement('span');
      addClass(spanEl, 'colHeader');

      fastInnerHTML(spanEl, colspanDescriptor ? colspanDescriptor.label || '' : '');

      divEl.appendChild(spanEl);

      TH.appendChild(divEl);

      _this.hot.runHooks('afterGetColHeader', visualColumnsIndex, TH);
    };
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

    return; // TODO

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
    // let newStartColumn = calc.startColumn;
    //
    // rangeEach(0, Math.max(this.columnHeaderLevelCount - 1, 0), (l) => {
    //   const startColumnNestedParent = this.getNestedParent(l, calc.startColumn);
    //
    //   if (startColumnNestedParent < calc.startColumn) {
    //     newStartColumn = Math.min(newStartColumn, startColumnNestedParent);
    //   }
    // });
    //
    // calc.startColumn = newStartColumn;
  }

  /**
   * Select all nested headers of clicked cell.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {Object} coords Clicked cell coords.
   */
  onAfterOnCellMouseDown(event, coords) {
    // if (coords.row < 0) {
    //   const colspan = this.getColspan(coords.row, coords.col);
    //   const lastColIndex = coords.col + colspan - 1;
    //
    //   if (colspan > 1) {
    //     const lastRowIndex = this.hot.countRows() - 1;
    //
    //     this.hot.selection.setRangeEnd(new CellCoords(lastRowIndex, lastColIndex));
    //   }
    // }
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
    // if (coords.row >= 0 || coords.col < 0 || !this.hot.view.isMouseDown()) {
    //   return;
    // }
    //
    // const { from, to } = this.hot.getSelectedRangeLast();
    // const colspan = this.getColspan(coords.row, coords.col);
    // const lastColIndex = coords.col + colspan - 1;
    // let changeDirection = false;
    //
    // if (from.col <= to.col) {
    //   if ((coords.col < from.col && lastColIndex === to.col) ||
    //       (coords.col < from.col && lastColIndex < from.col) ||
    //       (coords.col < from.col && lastColIndex >= from.col && lastColIndex < to.col)) {
    //     changeDirection = true;
    //   }
    // } else if ((coords.col < to.col && lastColIndex > from.col) ||
    //            (coords.col > from.col) ||
    //            (coords.col <= to.col && lastColIndex > from.col) ||
    //            (coords.col > to.col && lastColIndex > from.col)) {
    //   changeDirection = true;
    // }
    //
    // if (changeDirection) {
    //   [from.col, to.col] = [to.col, from.col];
    // }
    //
    // if (colspan > 1) {
    //   blockCalculations.column = true;
    //   blockCalculations.cell = true;
    //
    //   const columnRange = [];
    //
    //   if (from.col === to.col) {
    //     if (lastColIndex <= from.col && coords.col < from.col) {
    //       columnRange.push(to.col, coords.col);
    //     } else {
    //       columnRange.push(coords.col < from.col ? coords.col : from.col, lastColIndex > to.col ? lastColIndex : to.col);
    //     }
    //   }
    //   if (from.col < to.col) {
    //     columnRange.push(coords.col < from.col ? coords.col : from.col, lastColIndex);
    //
    //   }
    //   if (from.col > to.col) {
    //     columnRange.push(from.col, coords.col);
    //   }
    //
    //   this.hot.selectColumns(...columnRange);
    // }
  }

  /**
   * Cache column header count.
   *
   * @private
   */
  onAfterInit() {
    this.columnHeaderLevelCount = this.hot.view.wt.getSetting('columnHeaders').length;

    // this.ghostTable.buildWidthsMapper();
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

      for (let headersCount = this.columnStatesManager.getLayersCount(), i = headersCount - 1; i >= 0; i--) {
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
    // const cachedWidth = this.ghostTable.widthsCache[column];
    //
    // return width > cachedWidth ? width : cachedWidth;
    return width;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.columnHeaderLevelCount = null;
    this.columnStatesManager.destroy();
    this.columnStatesManager = null;

    super.destroy();
  }

}

registerPlugin('nestedHeaders', NestedHeaders);

export default NestedHeaders;
