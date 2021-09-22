import {
  addClass,
  removeClass,
  fastInnerHTML,
  empty,
} from '../../helpers/dom/element';
import { isNumeric } from '../../helpers/number';
import { isLeftClick, isRightClick } from '../../helpers/dom/event';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import {
  ACTIVE_HEADER_TYPE,
  HEADER_TYPE,
} from '../../selection';
import { BasePlugin } from '../base';
import StateManager from './stateManager';
import GhostTable from './utils/ghostTable';

import './nestedHeaders.css';

export const PLUGIN_KEY = 'nestedHeaders';
export const PLUGIN_PRIORITY = 280;

/**
 * @plugin NestedHeaders
 * @class NestedHeaders
 *
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
   * The state manager for the nested headers.
   *
   * @private
   * @type {StateManager}
   */
  #stateManager = new StateManager();
  /**
   * The instance of the ChangesObservable class that allows track the changes that happens in the
   * column indexes.
   *
   * @private
   * @type {ChangesObservable}
   */
  #hidingIndexMapObserver = null;
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
    this.addHook('beforeOnCellMouseDown', (...args) => this.onBeforeOnCellMouseDown(...args));
    this.addHook('afterOnCellMouseDown', (...args) => this.onAfterOnCellMouseDown(...args));
    this.addHook('beforeOnCellMouseOver', (...args) => this.onBeforeOnCellMouseOver(...args));
    this.addHook('afterGetColumnHeaderRenderers', array => this.onAfterGetColumnHeaderRenderers(array));
    this.addHook('modifyColWidth', (...args) => this.onModifyColWidth(...args));
    this.addHook('beforeHighlightingColumnHeader', (...args) => this.onBeforeHighlightingColumnHeader(...args));
    this.addHook(
      'afterViewportColumnCalculatorOverride',
      (...args) => this.onAfterViewportColumnCalculatorOverride(...args)
    );

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

    this.#stateManager.setColumnsLimit(this.hot.countSourceCols());

    if (Array.isArray(nestedHeaders)) {
      this.detectedOverlappedHeaders = this.#stateManager.setState(nestedHeaders);
    }

    if (this.detectedOverlappedHeaders) {
      warn(toSingleLine`Your Nested Headers plugin setup contains overlapping headers. This kind of configuration\x20
                        is currently not supported.`);
    }

    if (this.enabled) {
      // This line covers the case when a developer uses the external hiding maps to manipulate
      // the columns' visibility. The tree state built from the settings - which is always built
      // as if all the columns are visible, needs to be modified to be in sync with a dataset.
      this.hot.columnIndexMapper
        .hidingMapsCollection
        .getMergedValues()
        .forEach((isColumnHidden, physicalColumnIndex) => {
          const actionName = isColumnHidden === true ? 'hide-column' : 'show-column';

          this.#stateManager.triggerColumnModification(actionName, physicalColumnIndex);
        });
    }

    if (!this.#hidingIndexMapObserver && this.enabled) {
      this.#hidingIndexMapObserver = this.hot.columnIndexMapper
        .createChangesObserver('hiding')
        .subscribe((changes) => {
          changes.forEach(({ op, index: columnIndex, newValue }) => {
            if (op === 'replace') {
              const actionName = newValue === true ? 'hide-column' : 'show-column';

              this.#stateManager.triggerColumnModification(actionName, columnIndex);
            }
          });
        });
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
    this.#hidingIndexMapObserver.unsubscribe();
    this.#hidingIndexMapObserver = null;
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
    const fixedColumnsLeft = this.hot.view.wt.getSetting('fixedColumnsLeft');

    return (renderedColumnIndex, TH) => {
      const { rootDocument, columnIndexMapper, view } = this.hot;

      let visualColumnsIndex = columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnsIndex === null) {
        visualColumnsIndex = renderedColumnIndex;
      }

      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');

      const {
        colspan,
        label,
        isHidden,
        isPlaceholder,
      } = this.#stateManager.getHeaderSettings(headerLevel, visualColumnsIndex) ?? { label: '' };

      if (isPlaceholder || isHidden) {
        addClass(TH, 'hiddenHeader');

      } else if (colspan > 1) {
        const isTopLeftOverlay = view.wt.wtOverlays.topLeftCornerOverlay?.clone.wtTable.THEAD.contains(TH);
        const isLeftOverlay = view.wt.wtOverlays.leftOverlay?.clone.wtTable.THEAD.contains(TH);

        // Check if there is a fixed column enabled, if so then reduce colspan to fixed column width.
        const correctedColspan = isTopLeftOverlay || isLeftOverlay ?
          Math.min(colspan, fixedColumnsLeft - renderedColumnIndex) : colspan;

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
   * Allows to control which header DOM element will be used to highlight.
   *
   * @private
   * @param {number} visualColumn A visual column index of the highlighted row header.
   * @param {number} headerLevel A row header level that is currently highlighted.
   * @param {object} highlightMeta An object with meta data that describes the highlight state.
   * @returns {number}
   */
  onBeforeHighlightingColumnHeader(visualColumn, headerLevel, highlightMeta) {
    const headerNodeData = this.#stateManager.getHeaderTreeNodeData(headerLevel, visualColumn);

    if (!headerNodeData) {
      return visualColumn;
    }

    const {
      classNames,
      columnCursor,
      selectionType,
      selectionWidth,
    } = highlightMeta;
    const {
      isRoot,
      colspan,
    } = this.#stateManager.getHeaderSettings(headerLevel, visualColumn);

    if (selectionType === HEADER_TYPE) {
      if (!isRoot) {
        return headerNodeData.columnIndex;
      }

    } else if (selectionType === ACTIVE_HEADER_TYPE) {
      if (colspan > selectionWidth - columnCursor || !isRoot) {
        // Reset the class names array so the generated TH element won't be modified.
        classNames.length = 0;
      }
    }

    return visualColumn;
  }

  /**
   * Allows to block the column selection that is controlled by the core Selection module.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {CellCoords} TD The table cell or header element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  onBeforeOnCellMouseDown(event, coords, TD, controller) {
    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (headerNodeData) {
      // Block the Selection module in controlling how the columns are selected. Pass the
      // responsibility of the column selection to this plugin (see "onAfterOnCellMouseDown" hook).
      controller.column = true;
    }
  }

  /**
   * Allows to control how the column selection based on the coordinates and the nested headers is made.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   */
  onAfterOnCellMouseDown(event, coords) {
    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (!headerNodeData) {
      return;
    }

    const { selection } = this.hot;
    const currentSelection = selection.isSelected() ? selection.getSelectedRange().current() : null;
    const columnsToSelect = [];
    const {
      columnIndex,
      origColspan,
    } = headerNodeData;

    // The Selection module doesn't allow it to extend its behavior easily. That's why here we need
    // to re-implement the "click" and "shift" behavior. As a workaround, the logic for the nested
    // headers must implement a similar logic as in the original Selection handler
    // (see src/selection/mouseEventHandler.js).
    const allowRightClickSelection = !selection.inInSelection(coords);

    if (event.shiftKey && currentSelection) {
      if (coords.col < currentSelection.from.col) {
        columnsToSelect.push(currentSelection.getTopRightCorner().col, columnIndex, coords.row);

      } else if (coords.col > currentSelection.from.col) {
        columnsToSelect.push(currentSelection.getTopLeftCorner().col, columnIndex + origColspan - 1, coords.row);

      } else {
        columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, coords.row);
      }

    } else if (isLeftClick(event) || (isRightClick(event) && allowRightClickSelection)) {
      columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, coords.row);
    }

    // The plugin takes control of the how the columns are selected.
    selection.selectColumns(...columnsToSelect);
  }

  /**
   * Makes the header-selection properly select the nested headers.
   *
   * @private
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {HTMLElement} TD The cell element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  onBeforeOnCellMouseOver(event, coords, TD, controller) {
    if (!this.hot.view.isMouseDown()) {
      return;
    }

    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (!headerNodeData) {
      return;
    }

    const {
      columnIndex,
      origColspan,
    } = headerNodeData;

    const selectedRange = this.hot.getSelectedRangeLast();
    const topLeftCoords = selectedRange.getTopLeftCorner();
    const bottomRightCoords = selectedRange.getBottomRightCorner();
    const { from } = selectedRange;

    // Block the Selection module in controlling how the columns and cells are selected.
    // From now on, the plugin is responsible for the selection.
    controller.column = true;
    controller.cell = true;

    const columnsToSelect = [];

    if (coords.col < from.col) {
      columnsToSelect.push(bottomRightCoords.col, columnIndex);

    } else if (coords.col > from.col) {
      columnsToSelect.push(topLeftCoords.col, columnIndex + origColspan - 1);

    } else {
      columnsToSelect.push(columnIndex, columnIndex + origColspan - 1);
    }

    this.hot.selectColumns(...columnsToSelect);
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
  }

  /**
   * Make the renderer render the first nested column in its entirety.
   *
   * @private
   * @param {object} calc Viewport column calculator.
   */
  onAfterViewportColumnCalculatorOverride(calc) {
    const headerLayersCount = this.#stateManager.getLayersCount();
    let newStartColumn = calc.startColumn;
    let nonRenderable = !!headerLayersCount;

    for (let headerLayer = 0; headerLayer < headerLayersCount; headerLayer++) {
      const startColumn = this.#stateManager.findLeftMostColumnIndex(headerLayer, calc.startColumn);
      const renderedStartColumn = this.hot.columnIndexMapper.getRenderableFromVisualIndex(startColumn);

      // If any of the headers for that column index is rendered, all of them should be rendered properly, see
      // comment below.
      if (startColumn >= 0) {
        nonRenderable = false;
      }

      // `renderedStartColumn` can be `null` if the leftmost columns are hidden. In that case -> ignore that header
      // level, as it should be handled by the "parent" header
      if (isNumeric(renderedStartColumn) && renderedStartColumn < calc.startColumn) {
        newStartColumn = renderedStartColumn;
        break;
      }
    }

    // If no headers for the provided column index are renderable, start rendering from the beginning of the upmost
    // header for that position.
    calc.startColumn =
      nonRenderable ?
        this.#stateManager.getHeaderTreeNodeData(0, newStartColumn).columnIndex :
        newStartColumn;
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

    if (this.#hidingIndexMapObserver !== null) {
      this.#hidingIndexMapObserver.unsubscribe();
      this.#hidingIndexMapObserver = null;
    }

    super.destroy();
  }

  /**
   * Gets the tree data that belongs to the column headers pointed by the passed coordinates.
   *
   * @private
   * @param {CellCoords} coords The CellCoords instance.
   * @returns {object|undefined}
   */
  _getHeaderTreeNodeDataByCoords(coords) {
    if (coords.row >= 0 || coords.col < 0) {
      return;
    }

    return this.#stateManager.getHeaderTreeNodeData(coords.row, coords.col);
  }
}
