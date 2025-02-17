import {
  addClass,
  removeClass,
} from '../../helpers/dom/element';
import { isNumeric, clamp } from '../../helpers/number';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isLeftClick, isRightClick, isTouchEvent } from '../../helpers/dom/event';
import { warn } from '../../helpers/console';
import {
  ACTIVE_HEADER_TYPE,
  HEADER_TYPE,
} from '../../selection';
import { BasePlugin } from '../base';
import StateManager from './stateManager';
import GhostTable from './utils/ghostTable';

export const PLUGIN_KEY = 'nestedHeaders';
export const PLUGIN_PRIORITY = 280;

/* eslint-disable jsdoc/require-description-complete-sentence */

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
 * You can also set custom class names to any of the headers by providing the `headerClassName` property.
 *
 * __Note__ that the plugin supports a *nested* structure, which means, any header cannot be wider than it's "parent". In
 * other words, headers cannot overlap each other.
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   nestedHeaders: [
 *     ['A', {label: 'B', colspan: 8, headerClassName: 'htRight'}, 'C'],
 *     ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *     ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *     ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ],
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   nestedHeaders={[
 *     ['A', {label: 'B', colspan: 8, headerClassName: 'htRight'}, 'C'],
 *     ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
 *     ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
 *     ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
 *  ]}
 * />
 * ```
 * :::
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
   * @type {StateManager}
   */
  #stateManager = new StateManager();
  /**
   * The instance of the ChangesObservable class that allows track the changes that happens in the
   * column indexes.
   *
   * @type {ChangesObservable}
   */
  #hidingIndexMapObserver = null;
  /**
   * Holds the coords that points to the place where the column selection starts.
   *
   * @type {number|null}
   */
  #focusInitialCoords = null;
  /**
   * Determines if there is performed the column selection.
   *
   * @type {boolean}
   */
  #isColumnsSelectionInProgress = false;
  /**
   * Keeps the last highlight position made by column selection. The coords are necessary to scroll
   * the viewport to the correct position when the nested header is clicked when the `navigableHeaders`
   * option is disabled.
   *
   * @type {CellCoords | null}
   */
  #recentlyHighlightCoords = null;
  /**
   * Custom helper for getting widths of the nested headers.
   *
   * @private
   * @type {GhostTable}
   */
  // @TODO This should be changed after refactor handsontable/utils/ghostTable.
  ghostTable = new GhostTable(this.hot, (row, column) => this.getHeaderSettings(row, column));
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

    this.addHook('init', () => this.#onInit());
    this.addHook('afterLoadData', (...args) => this.#onAfterLoadData(...args));
    this.addHook('beforeOnCellMouseDown', (...args) => this.#onBeforeOnCellMouseDown(...args));
    this.addHook('afterOnCellMouseDown', (...args) => this.#onAfterOnCellMouseDown(...args));
    this.addHook('beforeOnCellMouseOver', (...args) => this.#onBeforeOnCellMouseOver(...args));
    this.addHook('beforeOnCellMouseUp', (...args) => this.#onBeforeOnCellMouseUp(...args));
    this.addHook('beforeSelectionHighlightSet', (...args) => this.#onBeforeSelectionHighlightSet(...args));
    this.addHook('modifyTransformStart', (...args) => this.#onModifyTransformStart(...args));
    this.addHook('afterSelection', () => this.#updateFocusHighlightPosition());
    this.addHook('afterSelectionFocusSet', () => this.#updateFocusHighlightPosition());
    this.addHook('beforeViewportScrollHorizontally', (...args) => this.#onBeforeViewportScrollHorizontally(...args));
    this.addHook('afterGetColumnHeaderRenderers', array => this.#onAfterGetColumnHeaderRenderers(array));
    this.addHook('modifyColWidth', (...args) => this.#onModifyColWidth(...args));
    this.addHook('modifyColumnHeaderValue', (...args) => this.#onModifyColumnHeaderValue(...args));
    this.addHook('beforeHighlightingColumnHeader', (...args) => this.#onBeforeHighlightingColumnHeader(...args));
    this.addHook('beforeCopy', (...args) => this.#onBeforeCopy(...args));
    this.addHook('beforeSelectColumns', (...args) => this.#onBeforeSelectColumns(...args));
    this.addHook(
      'afterViewportColumnCalculatorOverride',
      (...args) => this.#onAfterViewportColumnCalculatorOverride(...args)
    );
    this.addHook('modifyFocusedElement', (...args) => this.#onModifyFocusedElement(...args));
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', () => this.#updateFocusHighlightPosition());
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', () => this.#updateFocusHighlightPosition());

    super.enablePlugin();
    this.updatePlugin(); // @TODO: Workaround for broken plugin initialization abstraction.
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`nestedHeaders`](@/api/options.md#nestedheaders)
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

          this.ghostTable.buildWidthsMap();
        });
    }

    this.ghostTable
      .setLayersCount(this.getLayersCount())
      .buildWidthsMap();

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

    const { _wt: wt } = this.hot.view;
    const headerLevels = wt.getSetting('columnHeaders').length;
    const mainHeaders = wt.wtTable.THEAD;
    const topHeaders = wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = wt.wtOverlays.topInlineStartCornerOverlay ?
      wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.THEAD : null;

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
    const fixedColumnsStart = this.hot.view._wt.getSetting('fixedColumnsStart');

    return (renderedColumnIndex, TH) => {
      const { columnIndexMapper, view } = this.hot;

      let visualColumnIndex = columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

      if (visualColumnIndex === null) {
        visualColumnIndex = renderedColumnIndex;
      }

      TH.removeAttribute('colspan');
      removeClass(TH, 'hiddenHeader');
      removeClass(TH, 'hiddenHeaderText');

      const {
        colspan,
        isHidden,
        isPlaceholder,
        headerClassNames,
      } = this.#stateManager.getHeaderSettings(headerLevel, visualColumnIndex) ?? { label: '' };

      if (isPlaceholder || isHidden) {
        addClass(TH, 'hiddenHeader');

      } else if (colspan > 1) {
        const { wtOverlays } = view._wt;
        const isTopInlineStartOverlay = wtOverlays.topInlineStartCornerOverlay?.clone.wtTable.THEAD.contains(TH);
        const isInlineStartOverlay = wtOverlays.inlineStartOverlay?.clone.wtTable.THEAD.contains(TH);
        const isTopOverlay = wtOverlays.topOverlay?.clone.wtTable.THEAD.contains(TH);

        if (isTopOverlay && visualColumnIndex < fixedColumnsStart) {
          addClass(TH, 'hiddenHeaderText');
        }

        // Check if there is a fixed column enabled, if so then reduce colspan to fixed column width.
        const correctedColspan = isTopInlineStartOverlay || isInlineStartOverlay ?
          Math.min(colspan, fixedColumnsStart - renderedColumnIndex) : colspan;

        if (correctedColspan > 1) {
          TH.setAttribute('colspan', correctedColspan);
        }
      }

      this.hot.view.appendColHeader(
        visualColumnIndex,
        TH,
        (...args) => this.getColumnHeaderValue(...args),
        headerLevel,
      );

      // Replace the higher-order `headerClassName`s with the one provided in the plugin config, if it was provided.
      if (!isPlaceholder && !isHidden) {
        const innerHeaderDiv = TH.querySelector('div.relative');

        if (innerHeaderDiv && headerClassNames && headerClassNames.length > 0) {
          removeClass(innerHeaderDiv, this.hot.getColumnMeta(visualColumnIndex).headerClassName);
          addClass(innerHeaderDiv, headerClassNames);
        }
      }
    };
  }

  /**
   * Returns the column header value for specified column and header level index.
   *
   * @private
   * @param {number} visualColumnIndex Visual column index.
   * @param {number} headerLevel The index of header level. The header level accepts positive (0 to N)
   *                             and negative (-1 to -N) values. For positive values, 0 points to the
   *                             top most header, and for negative direction, -1 points to the most bottom
   *                             header (the header closest to the cells).
   * @returns {string} Returns the column header value to update.
   */
  getColumnHeaderValue(visualColumnIndex, headerLevel) {
    const {
      isHidden,
      isPlaceholder,
    } = this.#stateManager.getHeaderSettings(headerLevel, visualColumnIndex) ?? {};

    if (isPlaceholder || isHidden) {
      return '';
    }

    return this.hot.getColHeader(visualColumnIndex, headerLevel);
  }

  /**
   * Updates the selection focus highlight position to point to the nested header root element (TH)
   * even when the logical coordinates point in-between the header.
   */
  #updateFocusHighlightPosition() {
    const selection = this.hot?.getSelectedRangeLast();

    if (!selection) {
      return;
    }

    const { highlight } = selection;
    const isNestedHeadersRange = highlight.isHeader() && highlight.col >= 0;

    if (isNestedHeadersRange) {
      const columnIndex = this.#stateManager.findLeftMostColumnIndex(highlight.row, highlight.col);
      const focusHighlight = this.hot.selection.highlight.getFocus();

      // Correct the highlight/focus selection to highlight the correct TH element
      focusHighlight.visualCellRange.highlight.col = columnIndex;
      focusHighlight.visualCellRange.from.col = columnIndex;
      focusHighlight.visualCellRange.to.col = columnIndex;
      focusHighlight.commit();
    }
  }

  /**
   * Allows to control to which column index the viewport will be scrolled. To ensure that the viewport
   * is scrolled to the correct column for the nested header the most left and the most right visual column
   * indexes are used.
   *
   * @param {number} visualColumn A visual column index to which the viewport will be scrolled.
   * @param {{ value: 'auto' | 'start' | 'end' }} snapping If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {number}
   */
  #onBeforeViewportScrollHorizontally(visualColumn, snapping) {
    const selection = this.hot.getSelectedRangeLast();

    if (!selection) {
      return visualColumn;
    }

    const { highlight } = selection;
    const { navigableHeaders } = this.hot.getSettings();
    const isSelectedByColumnHeader = this.hot.selection.isSelectedByColumnHeader();
    const highlightRow = navigableHeaders ? highlight.row : this.#recentlyHighlightCoords?.row;
    const highlightColumn = isSelectedByColumnHeader ? visualColumn : highlight.col;
    const isNestedHeadersRange = highlightRow < 0 && highlightColumn >= 0;

    this.#recentlyHighlightCoords = null;

    if (!isNestedHeadersRange) {
      return visualColumn;
    }

    const firstVisibleColumn = this.hot.getFirstFullyVisibleColumn();
    const lastVisibleColumn = this.hot.getLastFullyVisibleColumn();
    const viewportWidth = lastVisibleColumn - firstVisibleColumn + 1;
    const mostLeftColumnIndex = this.#stateManager.findLeftMostColumnIndex(highlightRow, highlightColumn);
    const mostRightColumnIndex = this.#stateManager.findRightMostColumnIndex(highlightRow, highlightColumn);
    const headerWidth = mostRightColumnIndex - mostLeftColumnIndex + 1;

    // scroll the viewport always to the left when the header is wider than the viewport
    if (mostLeftColumnIndex < firstVisibleColumn && mostRightColumnIndex > lastVisibleColumn) {
      return mostLeftColumnIndex;
    }

    if (isSelectedByColumnHeader) {
      let scrollColumnIndex = null;

      if (mostLeftColumnIndex >= firstVisibleColumn && mostRightColumnIndex > lastVisibleColumn) {
        if (headerWidth > viewportWidth) {
          snapping.value = 'start';
          scrollColumnIndex = mostLeftColumnIndex;
        } else {
          snapping.value = 'end';
          scrollColumnIndex = mostRightColumnIndex;
        }

      } else if (mostLeftColumnIndex < firstVisibleColumn && mostRightColumnIndex <= lastVisibleColumn) {
        if (headerWidth > viewportWidth) {
          snapping.value = 'end';
          scrollColumnIndex = mostRightColumnIndex;
        } else {
          snapping.value = 'start';
          scrollColumnIndex = mostLeftColumnIndex;
        }
      }

      return scrollColumnIndex;
    }

    return mostLeftColumnIndex <= firstVisibleColumn ? mostLeftColumnIndex : mostRightColumnIndex;
  }

  /**
   * Allows to control which header DOM element will be used to highlight.
   *
   * @param {number} visualColumn A visual column index of the highlighted row header.
   * @param {number} headerLevel A row header level that is currently highlighted.
   * @param {object} highlightMeta An object with meta data that describes the highlight state.
   * @returns {number}
   */
  #onBeforeHighlightingColumnHeader(visualColumn, headerLevel, highlightMeta) {
    const headerNodeData = this.#stateManager.getHeaderTreeNodeData(headerLevel, visualColumn);

    if (!headerNodeData) {
      return visualColumn;
    }

    const {
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
        // Prevents adding any CSS class names to the TH element
        return null;
      }
    }

    return visualColumn;
  }

  /**
   * Listens the `beforeCopy` hook that allows processing the copied column headers so that the
   * merged column headers do not propagate the value for each column but only once at the beginning
   * of the column.
   *
   * @private
   * @param {Array[]} data An array of arrays which contains data to copied.
   * @param {object[]} copyableRanges An array of objects with ranges of the visual indexes (`startRow`, `startCol`, `endRow`, `endCol`)
   *                                  which will copied.
   * @param {{ columnHeadersCount: number }} copiedHeadersCount An object with keys that holds information with
   *                                                            the number of copied headers.
   */
  #onBeforeCopy(data, copyableRanges, { columnHeadersCount }) {
    if (columnHeadersCount === 0) {
      return;
    }

    for (let rangeIndex = 0; rangeIndex < copyableRanges.length; rangeIndex++) {
      const { startRow, startCol, endRow, endCol } = copyableRanges[rangeIndex];
      const rowsCount = endRow - startRow + 1;
      const columnsCount = startCol - endCol + 1;

      // do not process dataset ranges and column headers where only one column is copied
      if (startRow >= 0 || columnsCount === 1) {
        break;
      }

      for (let column = startCol; column <= endCol; column++) {
        for (let row = startRow; row <= endRow; row++) {
          const zeroBasedColumnHeaderLevel = rowsCount + row;
          const zeroBasedColumnIndex = column - startCol;

          if (zeroBasedColumnIndex === 0) {
            continue; // eslint-disable-line no-continue
          }

          const isRoot = this.#stateManager.getHeaderTreeNodeData(row, column)?.isRoot;

          if (isRoot === false) {
            data[zeroBasedColumnHeaderLevel][zeroBasedColumnIndex] = '';
          }
        }
      }
    }
  }

  /**
   * Allows blocking the column selection that is controlled by the core Selection module.
   *
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {CellCoords} TD The table cell or header element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  #onBeforeOnCellMouseDown(event, coords, TD, controller) {
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
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   */
  #onAfterOnCellMouseDown(event, coords) {
    const headerNodeData = this._getHeaderTreeNodeDataByCoords(coords);

    if (!headerNodeData) {
      return;
    }

    this.#focusInitialCoords = coords.clone();
    this.#isColumnsSelectionInProgress = true;

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
        columnsToSelect.push(currentSelection.getTopEndCorner().col, columnIndex, coords.row);

      } else if (coords.col > currentSelection.from.col) {
        columnsToSelect.push(currentSelection.getTopStartCorner().col, columnIndex + origColspan - 1, coords.row);

      } else {
        columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, coords.row);
      }

    } else if (isLeftClick(event) || (isRightClick(event) && allowRightClickSelection) || isTouchEvent(event)) {
      columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, coords.row);
    }

    // The plugin takes control of how the columns are selected.
    selection.selectColumns(...columnsToSelect);
  }

  /**
   * Makes the header-selection properly select the nested headers.
   *
   * @param {MouseEvent} event Mouse event.
   * @param {CellCoords} coords Cell coords object containing the visual coordinates of the clicked cell.
   * @param {HTMLElement} TD The cell element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  #onBeforeOnCellMouseOver(event, coords, TD, controller) {
    if (!this.hot.view.isMouseDown() || controller.column) {
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
    const topStartCoords = selectedRange.getTopStartCorner();
    const bottomEndCoords = selectedRange.getBottomEndCorner();
    const { from } = selectedRange;

    // Block the Selection module in controlling how the columns and cells are selected.
    // From now on, the plugin is responsible for the selection.
    controller.column = true;
    controller.cell = true;

    const columnsToSelect = [];
    const headerLevel = clamp(coords.row, -Infinity, -1);

    if (coords.col < from.col) {
      columnsToSelect.push(bottomEndCoords.col, columnIndex, headerLevel);

    } else if (coords.col > from.col) {
      columnsToSelect.push(topStartCoords.col, columnIndex + origColspan - 1, headerLevel);

    } else {
      columnsToSelect.push(columnIndex, columnIndex + origColspan - 1, headerLevel);
    }

    this.hot.selection.selectColumns(...columnsToSelect);
  }

  /**
   * Switches internal flag about selection progress to `false`.
   */
  #onBeforeOnCellMouseUp() {
    this.#isColumnsSelectionInProgress = false;
  }

  /**
   * The hook checks and ensures that the focus position that depends on the selected columns
   * range is always positioned within the range.
   */
  #onBeforeSelectionHighlightSet() {
    const { navigableHeaders } = this.hot.getSettings();

    if (!this.hot.view.isMouseDown() || !this.#isColumnsSelectionInProgress || !navigableHeaders) {
      return;
    }

    const selectedRange = this.hot.getSelectedRangeLast();
    const columnStart = selectedRange.getTopStartCorner().col;
    const columnEnd = selectedRange.getBottomEndCorner().col;
    const {
      columnIndex,
      origColspan,
    } = this.#stateManager.getHeaderTreeNodeData(this.#focusInitialCoords.row, this.#focusInitialCoords.col);

    selectedRange.setHighlight(this.#focusInitialCoords);

    if (origColspan > selectedRange.getWidth() ||
        columnIndex < columnStart ||
        columnIndex + origColspan - 1 > columnEnd) {

      const headerLevel = this.#stateManager
        .findTopMostEntireHeaderLevel(
          clamp(columnStart, columnIndex, columnIndex + origColspan - 1),
          clamp(columnEnd, columnIndex, columnIndex + origColspan - 1),
        );

      selectedRange.highlight.row = headerLevel;
      selectedRange.highlight.col = selectedRange.from.col;
    }
  }

  /**
   * `modifyTransformStart` hook is called every time the keyboard navigation is used.
   *
   * @param {object} delta The transformation delta.
   */
  #onModifyTransformStart(delta) {
    const { highlight } = this.hot.getSelectedRangeLast();
    const nextCoords = this.hot._createCellCoords(highlight.row + delta.row, highlight.col + delta.col);
    const isNestedHeadersRange = nextCoords.isHeader() && nextCoords.col >= 0;

    if (!isNestedHeadersRange) {
      return;
    }

    const visualColumnIndexStart = this.#stateManager.findLeftMostColumnIndex(nextCoords.row, nextCoords.col);
    const visualColumnIndexEnd = this.#stateManager.findRightMostColumnIndex(nextCoords.row, nextCoords.col);

    if (delta.col < 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexStart - 1 : visualColumnIndexEnd;
      const notHiddenColumnIndex = this.hot.columnIndexMapper.getNearestNotHiddenIndex(nextColumn, -1);

      if (notHiddenColumnIndex === null) {
        // There are no visible columns anymore, so move the selection out of the table edge. This will
        // be processed by the selection Transformer class as a move selection to the previous row (if autoWrapRow is enabled).
        delta.col = -this.hot.view.countRenderableColumnsInRange(0, highlight.col);
      } else {
        delta.col = -Math.max(this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, highlight.col) - 1, 1);
      }

    } else if (delta.col > 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexEnd + 1 : visualColumnIndexStart;
      const notHiddenColumnIndex = this.hot.columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

      if (notHiddenColumnIndex === null) {
        // There are no visible columns anymore, so move the selection out of the table edge. This will
        // be processed by the selection Transformer class as a move selection to the next row (if autoWrapRow is enabled).
        delta.col = this.hot.view.countRenderableColumnsInRange(highlight.col, this.hot.countCols());
      } else {
        delta.col = Math.max(this.hot.view.countRenderableColumnsInRange(highlight.col, notHiddenColumnIndex) - 1, 1);
      }
    }
  }

  /**
   * The hook observes the column selection from the Selection API and modifies the column range to
   * ensure that the whole nested column will be covered.
   *
   * @param {CellCoords} from The coords object where the selection starts.
   * @param {CellCoords} to The coords object where the selection ends.
   * @param {CellCoords} highlight The coords object where the focus is.
   */
  #onBeforeSelectColumns(from, to, highlight) {
    const headerLevel = from.row;
    const startNodeData = this._getHeaderTreeNodeDataByCoords({
      row: headerLevel,
      col: from.col,
    });
    const endNodeData = this._getHeaderTreeNodeDataByCoords({
      row: headerLevel,
      col: to.col,
    });

    this.#recentlyHighlightCoords = highlight.clone();

    if (to.col < from.col) { // Column selection from right to left
      if (startNodeData) {
        from.col = startNodeData.columnIndex + startNodeData.origColspan - 1;
      }

      if (endNodeData) {
        to.col = endNodeData.columnIndex;
      }

    } else if (to.col >= from.col) { // Column selection from left to right or a single column selection
      if (startNodeData) {
        from.col = startNodeData.columnIndex;
      }

      if (endNodeData) {
        to.col = endNodeData.columnIndex + endNodeData.origColspan - 1;
      }
    }
  }

  /**
   * `afterGetColumnHeader` hook callback - prepares the header structure.
   *
   * @param {Array} renderersArray Array of renderers.
   */
  #onAfterGetColumnHeaderRenderers(renderersArray) {
    if (this.#stateManager.getLayersCount() > 0) {
      renderersArray.length = 0;

      for (let headerLayer = 0; headerLayer < this.#stateManager.getLayersCount(); headerLayer++) {
        renderersArray.push(this.headerRendererFactory(headerLayer));
      }
    }
  }

  /**
   * Make the renderer render the first nested column in its entirety.
   *
   * @param {object} calc Viewport column calculator.
   */
  #onAfterViewportColumnCalculatorOverride(calc) {
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
   * @param {number} width Width from hook.
   * @param {number} column Visual index of an column.
   * @returns {number}
   */
  #onModifyColWidth(width, column) {
    const cachedWidth = this.ghostTable.getWidth(column);

    return width > cachedWidth ? width : cachedWidth;
  }

  /**
   * Listens the `modifyColumnHeaderValue` hook that overwrites the column headers values based on
   * the internal state and settings of the plugin.
   *
   * @param {string} value The column header value.
   * @param {number} visualColumnIndex The visual column index.
   * @param {number} headerLevel The index of header level. The header level accepts positive (0 to N)
   *                             and negative (-1 to -N) values. For positive values, 0 points to the
   *                             top most header, and for negative direction, -1 points to the most bottom
   *                             header (the header closest to the cells).
   * @returns {string} Returns the column header value to update.
   */
  #onModifyColumnHeaderValue(value, visualColumnIndex, headerLevel) {
    const {
      label,
    } = this.#stateManager.getHeaderTreeNodeData(headerLevel, visualColumnIndex) ?? { label: '' };

    return label;
  }

  /**
   * `modifyFocusedElement` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {HTMLTableCellElement} The `TH` element to be focused.
   */
  #onModifyFocusedElement(row, column) {
    if (row < 0) {
      return this.hot.getCell(row, this.#stateManager.findLeftMostColumnIndex(row, column), true);
    }
  }

  /**
   * Updates the plugin state after HoT initialization.
   */
  #onInit() {
    // @TODO: Workaround for broken plugin initialization abstraction.
    this.updatePlugin();
  }

  /**
   * Updates the plugin state after new dataset load.
   *
   * @param {Array[]} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded
   *                              during the initialization.
   */
  #onAfterLoadData(sourceData, initialLoad) {
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
