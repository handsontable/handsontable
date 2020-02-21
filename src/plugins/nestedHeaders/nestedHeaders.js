import {
  addClass,
  removeClass,
  fastInnerHTML,
  empty,
} from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach } from '../../helpers/array';
import { registerPlugin } from '../../plugins';
import BasePlugin from '../_base';
import { ColumnStatesManager } from './columnStatesManager';

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
     * Array of nested headers' colspans.
     *
     * @private
     * @type {Array}
     */
    this.columnStatesManager = new ColumnStatesManager();
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {boolean}
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

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.clearColspans();

    this.columnStatesManager.clear();

    super.disablePlugin();
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
   * @param {number} headerRow The header row.
   * @returns {Function}
   * @fires Hooks#afterGetColHeader
   */
  headerRendererFactory(headerRow) {
    const colspanMatrix = this.columnStatesManager.generateColspanMatrix();
    const defaultColspanDescriptor = { label: '', colspan: 1 };

    return (renderedColumnIndex, TH) => {
      // let visualColumnsIndex = renderedColumnIndex;
      let visualColumnsIndex = this.hot.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnsIndex === null) {
        visualColumnsIndex = renderedColumnIndex;
      }

      // console.log(headerRow, renderedColumnIndex, visualColumnsIndex, colspanMatrix[headerRow][visualColumnsIndex]);

      const { rootDocument } = this.hot;
      // header row is the index of header row counting from the top (positive values)
      const { colspan, label, hidden } = colspanMatrix[headerRow]?.[visualColumnsIndex] ?? defaultColspanDescriptor;

      TH.setAttribute('colspan', colspan);
      removeClass(TH, ['ht__highlight', 'ht__active_highlight']);

      if (hidden) {
        addClass(TH, 'hiddenHeader');
      }

      empty(TH);

      const divEl = rootDocument.createElement('div');
      const spanEl = rootDocument.createElement('span');

      addClass(divEl, 'relative');
      addClass(spanEl, 'colHeader');
      fastInnerHTML(spanEl, label);

      divEl.appendChild(spanEl);

      TH.appendChild(divEl);

      this.hot.runHooks('afterGetColHeader', visualColumnsIndex, TH);
    };
  }

  updateHeadersHighlight() {
    const { hot } = this;
    const selection = hot.getSelectedRangeLast();

    if (selection === void 0) {
      return;
    }

    const classNameModifier = className => (TH, modifier) => () => modifier(TH, className);
    const highlightHeader = classNameModifier('ht__highlight');
    const activeHeader = classNameModifier('ht__active_highlight');

    const { wtOverlays } = this.hot.view.wt;
    const selectionByHeader = hot.selection.isSelectedByColumnHeader();
    const layersCount = this.columnStatesManager.getLayersCount()
    const { col: columnFrom } = selection.getTopLeftCorner();
    const { col: columnTo } = selection.getTopRightCorner();
    const changes = [];

    for (let column = columnFrom; column <= columnTo; column++) {
      // Traverse header layers from bottom to top
      for (let level = layersCount - 1; level > -1; level--) {
        const THs = this.getColumnHeaders(column, level);
        const isFirstLayer = level === layersCount - 1;

        arrayEach(THs, (TH) => {
          if (selectionByHeader) {
            changes.push(activeHeader(TH, addClass));

          } else if (isFirstLayer) {
            changes.push(highlightHeader(TH, addClass));

          } else {
            changes.push(highlightHeader(TH, removeClass));
          }
        });
      }
    }

    arrayEach(changes, fn => void fn());
  }

  getColumnHeaders(visibleColumnIndex, level) {
    const { wtOverlays } = this.hot.view.wt;
    const headers = [];

    if (wtOverlays.topOverlay) {
      headers.push(wtOverlays.topOverlay.clone.wtTable.getColumnHeader(visibleColumnIndex, level));
    }
    if (wtOverlays.topLeftCornerOverlay) {
      headers.push(wtOverlays.topLeftCornerOverlay.clone.wtTable.getColumnHeader(visibleColumnIndex, level));
    }

    return headers;
  }

  /**
   * `afterGetColumnHeader` hook callback - prepares the header structure.
   *
   * @private
   * @param {array} renderersArray Array of renderers.
   */
  onAfterGetColumnHeaderRenderers(renderersArray) {
    if (renderersArray) {
      renderersArray.length = 0;

      for (let headerLayer = 0; headerLayer < this.columnStatesManager.getLayersCount(); headerLayer++) {
        renderersArray.push(this.headerRendererFactory(headerLayer));
      }
    }

    this.updateHeadersHighlight();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.columnStatesManager = null;

    super.destroy();
  }

}

registerPlugin('nestedHeaders', NestedHeaders);

export default NestedHeaders;
