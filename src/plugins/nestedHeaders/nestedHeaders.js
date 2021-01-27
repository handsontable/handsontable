import {
  addClass,
  removeClass,
  fastInnerHTML,
  empty,
} from '../../helpers/dom/element';
import { arrayEach } from '../../helpers/array';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import { BasePlugin } from '../base';
import StateManager from './stateManager';
import GhostTable from './utils/ghostTable';

import './nestedHeaders.css';

export const PLUGIN_KEY = 'nestedHeaders';
export const PLUGIN_PRIORITY = 280;

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
 *   data: getData(),
 *   nestedHeaders: [
 *     ['A', {label: 'B', colspan: 8}, 'C'],
 *     ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *     ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *     ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ],
 * ```
 */
export class NestedHeaders extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * @private
   * @type {StateManager}
   */
  #stateManager = new StateManager();
  /**
   * Custom helper for getting widths of the nested headers.
   *
   * @private
   * @type {GhostTable}
   */
  // @TODO This should be changed after refactor handsontable/utils/ghostTable.
  ghostTable = new GhostTable(this);

  /**
   * The flag which determines that the nested header settings contains overlapping headers
   * configuration.
   *
   * @type {boolean}
   */
  detectedOverlappedHeaders = false;

  /**
   * Check if plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    if (!Array.isArray(nestedHeaders) || !Array.isArray(nestedHeaders[0])) {
      warn(toSingleLine`Your Nested Headers plugin configuration is invalid. The settings has to be\x20
                        passed as an array of arrays e.q. [['A1', { label: 'A2', colspan: 2 }]]`);
    }

    this.addHook('init', () => this.onInit());
    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args));
    this.addHook('afterOnCellMouseDown', (event, coords) => this.onAfterOnCellMouseDown(event, coords));
    this.addHook('beforeOnCellMouseOver',
      (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations));
    this.addHook('afterGetColumnHeaderRenderers', array => this.onAfterGetColumnHeaderRenderers(array));
    this.addHook('modifyColWidth', (width, column) => this.onModifyColWidth(width, column));
    this.addHook('afterViewportColumnCalculatorOverride', calc => this.onAfterViewportColumnCalculatorOverride(calc));

    super.enablePlugin();
    this.updatePlugin(); // @TODO: Workaround for broken plugin initialization abstraction.
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    if (!this.hot.view) { // @TODO: Workaround for broken plugin initialization abstraction.
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    this.#stateManager.setColumnsLimit(this.hot.countCols());

    if (Array.isArray(nestedHeaders)) {
      this.detectedOverlappedHeaders = this.#stateManager.setState(nestedHeaders);
    }

    if (this.detectedOverlappedHeaders) {
      warn(toSingleLine`Your Nested Headers plugin setup contains overlapping headers. This kind of configuration\x20
                        is currently not supported.`);
    }

    this.ghostTable.buildWidthsMapper();
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.clearColspans();
    this.#stateManager.clear();
    this.ghostTable.clear();

    super.disablePlugin();
  }

  /**
   * Returns an instance of the internal state manager of the plugin.
   *
   * @private
   * @returns {StateManager}
   */
  getStateManager() {
    return this.#stateManager;
  }

  /**
   * Gets a total number of headers levels.
   *
   * @private
   * @returns {number}
   */
  getLayersCount() {
    return this.#stateManager.getLayersCount();
  }

  /**
   * Gets column settings for a specified header. The returned object contains
   * information about the header label, its colspan length, or if it is hidden
   * in the header renderers.
   *
   * @private
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} columnIndex A visual column index.
   * @returns {object}
   */
  getHeaderSettings(headerLevel, columnIndex) {
    return this.#stateManager.getHeaderSettings(headerLevel, columnIndex);
  }

  /**
   * Gets HTML elements for specified visual column index and header level from
   * all overlays except master.
   *
   * @private
   * @param {number} columnIndex A visual column index.
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @returns {HTMLElement[]}
   */
  getColumnHeaders(columnIndex, headerLevel) {
    const { wtOverlays } = this.hot.view.wt;
    const renderedColumnIndex = this.hot.columnIndexMapper.getRenderableFromVisualIndex(columnIndex);
    const headers = [];

    if (renderedColumnIndex !== null) {
      if (wtOverlays.topOverlay) {
        headers.push(wtOverlays.topOverlay.clone.wtTable.getColumnHeader(renderedColumnIndex, headerLevel));
      }
      if (wtOverlays.topLeftCornerOverlay) {
        headers.push(wtOverlays.topLeftCornerOverlay.clone.wtTable.getColumnHeader(renderedColumnIndex, headerLevel));
      }
    }

    return headers;
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

    const { wt } = this.hot.view;
    const headerLevels = wt.getSetting('columnHeaders').length;
    const mainHeaders = wt.wtTable.THEAD;
    const topHeaders = wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = wt.wtOverlays.topLeftCornerOverlay ?
      wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    for (let i = 0; i < headerLevels; i++) {
      const masterLevel = mainHeaders.childNodes[i];

      if (!masterLevel) {
        break;
      }

      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      for (let j = 0, masterNodes = masterLevel.childNodes.length; j < masterNodes; j++) {
        masterLevel.childNodes[j].removeAttribute('colspan');
        removeClass(masterLevel.childNodes[j], 'hiddenHeader');

        if (topLevel && topLevel.childNodes[j]) {
          topLevel.childNodes[j].removeAttribute('colspan');
          removeClass(topLevel.childNodes[j], 'hiddenHeader');
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          topLeftCornerLevel.childNodes[j].removeAttribute('colspan');
          removeClass(topLeftCornerLevel.childNodes[j], 'hiddenHeader');
        }
      }
    }
  }

  /**
   * Generates the appropriate header renderer for a header row.
   *
   * @private
   * @param {number} headerLevel The index of header level counting from the top (positive
   *                             values counting from 0 to N).
   * @returns {Function}
   * @fires Hooks#afterGetColHeader
   */
  headerRendererFactory(headerLevel) {
    const fixedColumnsLeft = this.hot.getSettings().fixedColumnsLeft || 0;

    return (renderedColumnIndex, TH) => {
      const { rootDocument, columnIndexMapper, view } = this.hot;

      let visualColumnsIndex = columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnsIndex === null) {
        visualColumnsIndex = renderedColumnIndex;
      }

      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');

      const { colspan, label, isHidden } = this.#stateManager.getHeaderSettings(headerLevel, visualColumnsIndex);

      if (isHidden === true) {
        addClass(TH, 'hiddenHeader');

      } else if (colspan > 1) {
        const isTopLeftOverlay = view.wt.wtOverlays.topLeftCornerOverlay?.clone.wtTable.THEAD.contains(TH);
        const isLeftOverlay = view.wt.wtOverlays.leftOverlay?.clone.wtTable.THEAD.contains(TH);

        // Check if there is a fixed column enabled, if so then reduce colspan to fixed column width.
        const correctedColspan = isTopLeftOverlay || isLeftOverlay ?
          Math.min(colspan, fixedColumnsLeft - visualColumnsIndex) : colspan;

        if (correctedColspan > 1) {
          TH.setAttribute('colspan', correctedColspan);
        }
      }

      const divEl = rootDocument.createElement('div');
      const spanEl = rootDocument.createElement('span');

      addClass(divEl, 'relative');
      addClass(spanEl, 'colHeader');
      fastInnerHTML(spanEl, label);

      divEl.appendChild(spanEl);

      empty(TH);
      TH.appendChild(divEl);

      this.hot.runHooks('afterGetColHeader', visualColumnsIndex, TH);
    };
  }

  /**
   * Updates headers highlight in nested structure.
   *
   * @private
   */
  updateHeadersHighlight() {
    const { hot } = this;
    const selection = hot.getSelectedRange();

    if (selection === void 0) {
      return;
    }

    const hotSettings = this.hot.getSettings();
    const classNameModifier = className => (TH, modifier) => () => (TH ? modifier(TH, className) : null);
    const highlightHeader = classNameModifier(hotSettings.currentHeaderClassName);
    const activeHeader = classNameModifier(hotSettings.activeHeaderClassName);

    const selectionByHeader = hot.selection.isSelectedByColumnHeader() || hot.selection.isSelectedByCorner();
    const layersCount = this.#stateManager.getLayersCount();
    const activeHeaderChanges = new Map();
    const highlightHeaderChanges = new Map();

    arrayEach(selection, (selectionLayer) => {
      const coordsFrom = selectionLayer.getTopLeftCorner();
      const coordsTo = selectionLayer.getTopRightCorner();

      // If the beginning of the selection (columnFrom) starts in-between colspaned
      // header shift the columnFrom to the header position where it starts.
      const columnFrom = this.#stateManager.findLeftMostColumnIndex(-1, coordsFrom.col);
      const columnTo = coordsTo.col;
      const columnSelectionWidth = columnTo - columnFrom + 1;

      let columnCursor = 0;

      for (let column = columnFrom; column <= columnTo; column++) {
        // Traverse header layers from bottom to top.
        for (let level = layersCount - 1; level > -1; level--) {
          const { colspan, isHidden } = this.#stateManager.getHeaderSettings(level, column);
          const isFirstLayer = level === layersCount - 1;
          const isOutOfRange = !isFirstLayer && (columnCursor + colspan) > columnSelectionWidth;

          const THs = this.getColumnHeaders(column, level);

          arrayEach(THs, (TH) => {
            if (isOutOfRange || isHidden) {
              // Reset CSS classes state (workaround for WoT issue which can not render that classes
              // for nested header structure properly).
              activeHeaderChanges.set(TH, activeHeader(TH, removeClass));
              highlightHeaderChanges.set(TH, highlightHeader(TH, removeClass));

            } else if (selectionByHeader) {
              activeHeaderChanges.set(TH, activeHeader(TH, addClass));
              highlightHeaderChanges.set(TH, highlightHeader(TH, addClass));

            } else if (isFirstLayer) {
              highlightHeaderChanges.set(TH, highlightHeader(TH, addClass));

            } else {
              highlightHeaderChanges.set(TH, highlightHeader(TH, removeClass));
            }
          });
        }

        columnCursor += 1;
      }
    });

    arrayEach(activeHeaderChanges, ([, classModifer]) => void classModifer());
    arrayEach(highlightHeaderChanges, ([, classModifer]) => void classModifer());

    activeHeaderChanges.clear();
    highlightHeaderChanges.clear();
  }

  /**
   * Select all nested headers of clicked cell.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Clicked cell coords.
   */
  onAfterOnCellMouseDown(event, coords) {
    if (coords.row < 0) {
      const { origColspan } = this.#stateManager.getHeaderSettings(coords.row, coords.col);

      if (origColspan > 1) {
        this.hot.selection.selectColumns(coords.col, coords.col + origColspan - 1);
      }
    }
  }

  /**
   * Make the header-selection properly select the nested headers.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Clicked cell coords.
   * @param {HTMLElement} TD The cell element.
   * @param {object} blockCalculations An object which allows or disallows changing the selection for the particular axies.
   */
  onBeforeOnCellMouseOver(event, coords, TD, blockCalculations) {
    if (coords.row >= 0 || coords.col < 0 || !this.hot.view.isMouseDown()) {
      return;
    }

    const { from, to } = this.hot.getSelectedRangeLast();
    const { origColspan } = this.#stateManager.getHeaderSettings(coords.row, coords.col);
    const lastColIndex = coords.col + origColspan - 1;
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

    if (origColspan > 1) {
      blockCalculations.column = true;
      blockCalculations.cell = true;

      const columnRange = [];

      if (from.col === to.col) {
        if (lastColIndex <= from.col && coords.col < from.col) {
          columnRange.push(to.col, coords.col);
        } else {
          columnRange.push(
            coords.col < from.col ? coords.col : from.col,
            lastColIndex > to.col ? lastColIndex : to.col
          );
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
   * `afterGetColumnHeader` hook callback - prepares the header structure.
   *
   * @private
   * @param {Array} renderersArray Array of renderers.
   */
  onAfterGetColumnHeaderRenderers(renderersArray) {
    if (renderersArray) {
      renderersArray.length = 0;

      for (let headerLayer = 0; headerLayer < this.#stateManager.getLayersCount(); headerLayer++) {
        renderersArray.push(this.headerRendererFactory(headerLayer));
      }
    }

    this.updateHeadersHighlight();
  }

  /**
   * Make the renderer render the first nested column in its entirety.
   *
   * @private
   * @param {object} calc Viewport column calculator.
   */
  onAfterViewportColumnCalculatorOverride(calc) {
    let newStartColumn = calc.startColumn;

    for (let headerLayer = 0; headerLayer < this.#stateManager.getLayersCount(); headerLayer++) {
      const startColumn = this.#stateManager.findLeftMostColumnIndex(headerLayer, calc.startColumn);
      const renderedStartColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(startColumn);

      if (renderedStartColumn < calc.startColumn) {
        newStartColumn = renderedStartColumn;
        break;
      }
    }

    calc.startColumn = newStartColumn;
  }

  /**
   * `modifyColWidth` hook callback - returns width from cache, when is greater than incoming from hook.
   *
   * @private
   * @param {number} width Width from hook.
   * @param {number} column Visual index of an column.
   * @returns {number}
   */
  onModifyColWidth(width, column) {
    const cachedWidth = this.ghostTable.widthsCache[column];

    return width > cachedWidth ? width : cachedWidth;
  }

  /**
   * Updates the plugin state after HoT initialization.
   *
   * @private
   */
  onInit() {
    // @TODO: Workaround for broken plugin initialization abstraction.
    this.updatePlugin();
  }

  /**
   * Updates the plugin state after new dataset load.
   *
   * @private
   * @param {Array[]} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded
   *                              during the initialization.
   */
  onAfterLoadData(sourceData, initialLoad) {
    if (!initialLoad) {
      this.updatePlugin();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#stateManager = null;

    super.destroy();
  }

}
