import { BasePlugin } from '../base';
import { addClass, closest, hasClass, removeClass, outerWidth, isDetached } from '../../helpers/dom/element';
import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';

// Developer note! Whenever you make a change in this file, make an analogous change in manualColumnResize.js

export const PLUGIN_KEY = 'manualRowResize';
export const PLUGIN_PRIORITY = 30;
const PERSISTENT_STATE_KEY = 'manualRowHeights';

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin ManualRowResize
 * @class ManualRowResize
 *
 * @description
 * This plugin allows to change rows height. To make rows height persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired height of the row.
 * - guide - the helper guide that shows the desired height as a horizontal guide.
 */
export class ManualRowResize extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * @type {HTMLTableCellElement}
   */
  #currentTH = null;
  /**
   * @type {number}
   */
  #currentRow = null;
  /**
   * @type {number[]}
   */
  #selectedRows = [];
  /**
   * @type {number}
   */
  #currentHeight = null;
  /**
   * @type {number}
   */
  #newSize = null;
  /**
   * @type {number}
   */
  #startY = null;
  /**
   * @type {number}
   */
  #startHeight = null;
  /**
   * @type {number}
   */
  #startOffset = null;
  /**
   * @type {HTMLElement}
   */
  #handle = this.hot.rootDocument.createElement('DIV');
  /**
   * @type {HTMLElement}
   */
  #guide = this.hot.rootDocument.createElement('DIV');
  /**
   * @type {boolean}
   */
  #pressed = false;
  /**
   * @type {boolean}
   */
  #isTriggeredByRMB = false;
  /**
   * @type {number}
   */
  #dblclick = 0;
  /**
   * @type {number}
   */
  #autoresizeTimeout = null;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical row indexes.
   *
   * @type {PhysicalIndexToValueMap}
   */
  #rowHeightsMap;
  /**
   * Private pool to save configuration from updateSettings.
   *
   * @type {object}
   */
  #config;

  constructor(hotInstance) {
    super(hotInstance);

    addClass(this.#handle, 'manualRowResizer');
    addClass(this.#guide, 'manualRowResizerGuide');
  }

  /**
   * @private
   * @returns {string}
   */
  get inlineDir() {
    return this.hot.isRtl() ? 'right' : 'left';
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualRowResize#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#rowHeightsMap = new IndexToValueMap();
    this.#rowHeightsMap.addLocalHook('init', () => this.#onMapInit());
    this.hot.rowIndexMapper.registerMap(this.pluginName, this.#rowHeightsMap);

    this.addHook('modifyRowHeight', (height, row) => this.#onModifyRowHeight(height, row));

    this.bindEvents();

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`manualRowResize`](@/api/options.md#manualrowresize)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#config = this.#rowHeightsMap.getValues();

    this.hot.rowIndexMapper.unregisterMap(this.pluginName);
    super.disablePlugin();
  }

  /**
   * Saves the current sizes using the persistentState plugin (the {@link Options#persistentState} option has to be
   * enabled).
   *
   * @fires Hooks#persistentStateSave
   */
  saveManualRowHeights() {
    this.hot.runHooks('persistentStateSave', PERSISTENT_STATE_KEY, this.#rowHeightsMap.getValues());
  }

  /**
   * Loads the previously saved sizes using the persistentState plugin (the {@link Options#persistentState} option
   * has be enabled).
   *
   * @returns {Array}
   * @fires Hooks#persistentStateLoad
   */
  loadManualRowHeights() {
    const storedState = {};

    this.hot.runHooks('persistentStateLoad', PERSISTENT_STATE_KEY, storedState);

    return storedState.value;
  }

  /**
   * Sets the new height for specified row index.
   *
   * @param {number} row Visual row index.
   * @param {number} height Row height.
   * @returns {number} Returns new height.
   */
  setManualSize(row, height) {
    const physicalRow = this.hot.toPhysicalRow(row);
    const newHeight = Math.max(height, this.hot.view.getDefaultRowHeight());

    this.#rowHeightsMap.setValueAtIndex(physicalRow, newHeight);

    return newHeight;
  }

  /**
   * Returns the last desired row height set manually with the resize handle.
   *
   * @returns {number} The last desired row height.
   */
  getLastDesiredRowHeight() {
    return this.#currentHeight;
  }

  /**
   * Sets the resize handle position.
   *
   * @private
   * @param {HTMLCellElement} TH TH HTML element.
   */
  setupHandlePosition(TH) {
    this.#currentTH = TH;

    const { view } = this.hot;
    const { _wt: wt } = view;
    const cellCoords = wt.wtTable.getCoords(this.#currentTH);
    const row = cellCoords.row;

    // Ignore row headers.
    if (row < 0) {
      return;
    }

    const headerWidth = outerWidth(this.#currentTH);
    const box = this.#currentTH.getBoundingClientRect();
    // Read "fixedRowsTop" and "fixedRowsBottom" through the Walkontable as in that context, the fixed
    // rows are modified (reduced by the number of hidden rows) by TableView module.
    const fixedRowTop = row < wt.getSetting('fixedRowsTop');
    const fixedRowBottom = row >= view.countNotHiddenRowIndexes(0, 1) - wt.getSetting('fixedRowsBottom');
    let relativeHeaderPosition;

    if (fixedRowTop) {
      relativeHeaderPosition = wt
        .wtOverlays
        .topInlineStartCornerOverlay
        .getRelativeCellPosition(this.#currentTH, cellCoords.row, cellCoords.col);

    } else if (fixedRowBottom) {
      relativeHeaderPosition = wt
        .wtOverlays
        .bottomInlineStartCornerOverlay
        .getRelativeCellPosition(this.#currentTH, cellCoords.row, cellCoords.col);
    }

    // If the TH is not a child of the top-left/bottom-left overlay, recalculate using
    // the left overlay - as this overlay contains the rest of the headers.
    if (!relativeHeaderPosition) {
      relativeHeaderPosition = wt
        .wtOverlays
        .inlineStartOverlay
        .getRelativeCellPosition(this.#currentTH, cellCoords.row, cellCoords.col);
    }

    this.#currentRow = this.hot.rowIndexMapper.getVisualFromRenderableIndex(row);
    this.#selectedRows = [];

    const isFullRowSelected = this.hot.selection.isSelectedByCorner() || this.hot.selection.isSelectedByRowHeader();

    if (this.hot.selection.isSelected() && isFullRowSelected) {
      const selectionRanges = this.hot.getSelectedRange();

      arrayEach(selectionRanges, (selectionRange) => {
        const fromRow = selectionRange.getTopStartCorner().row;
        const toRow = selectionRange.getBottomStartCorner().row;

        // Add every selected row for resize action.
        rangeEach(fromRow, toRow, (rowIndex) => {
          if (!this.#selectedRows.includes(rowIndex)) {
            this.#selectedRows.push(rowIndex);
          }
        });
      });
    }

    // Resizing element beyond the current selection (also when there is no selection).
    if (!this.#selectedRows.includes(this.#currentRow)) {
      this.#selectedRows = [this.#currentRow];
    }

    this.#startOffset = relativeHeaderPosition.top - 6;
    this.#startHeight = parseInt(box.height, 10);

    this.#handle.style.top = `${this.#startOffset + this.#startHeight}px`;
    this.#handle.style[this.inlineDir] = `${relativeHeaderPosition.start}px`;

    this.#handle.style.width = `${headerWidth}px`;
    this.hot.rootElement.appendChild(this.#handle);
  }

  /**
   * Refresh the resize handle position.
   *
   * @private
   */
  refreshHandlePosition() {
    this.#handle.style.top = `${this.#startOffset + this.#currentHeight}px`;
  }

  /**
   * Sets the resize guide position.
   *
   * @private
   */
  setupGuidePosition() {
    const handleWidth = parseInt(outerWidth(this.#handle), 10);
    const handleEndPosition = parseInt(this.#handle.style[this.inlineDir], 10) + handleWidth;
    const maximumVisibleElementWidth = parseInt(this.hot.view.maximumVisibleElementWidth(0), 10);

    addClass(this.#handle, 'active');
    addClass(this.#guide, 'active');

    this.#guide.style.top = this.#handle.style.top;
    this.#guide.style[this.inlineDir] = `${handleEndPosition}px`;
    this.#guide.style.width = `${maximumVisibleElementWidth - handleWidth}px`;
    this.hot.rootElement.appendChild(this.#guide);
  }

  /**
   * Refresh the resize guide position.
   *
   * @private
   */
  refreshGuidePosition() {
    this.#guide.style.top = this.#handle.style.top;
  }

  /**
   * Hides both the resize handle and resize guide.
   *
   * @private
   */
  hideHandleAndGuide() {
    removeClass(this.#handle, 'active');
    removeClass(this.#guide, 'active');
  }

  /**
   * Checks if provided element is considered as a row header.
   *
   * @private
   * @param {HTMLElement} element HTML element.
   * @returns {boolean}
   */
  checkIfRowHeader(element) {
    const tbody = closest(element, ['TBODY'], this.hot.rootElement);
    const {
      inlineStartOverlay,
      topInlineStartCornerOverlay,
      bottomInlineStartCornerOverlay,
    } = this.hot.view._wt.wtOverlays;

    return [
      inlineStartOverlay.clone.wtTable.TBODY,
      topInlineStartCornerOverlay.clone.wtTable.TBODY,
      bottomInlineStartCornerOverlay.clone.wtTable.TBODY,
    ].includes(tbody);
  }

  /**
   * Gets the TH element from the provided element.
   *
   * @private
   * @param {HTMLElement} element HTML element.
   * @returns {HTMLElement}
   */
  getClosestTHParent(element) {
    if (element.tagName !== 'TABLE') {
      if (element.tagName === 'TH') {
        return element;
      }

      return this.getClosestTHParent(element.parentNode);

    }

    return null;
  }

  /**
   * Returns the actual height for the provided row index.
   *
   * @private
   * @param {number} row Visual row index.
   * @returns {number} Actual row height.
   */
  getActualRowHeight(row) {
    // TODO: this should utilize `this.hot.getRowHeight` after it's fixed and working properly.
    const walkontableHeight = this.hot.view._wt.wtTable.getRowHeight(row);

    if (walkontableHeight !== undefined && this.#newSize < walkontableHeight) {
      return walkontableHeight;
    }

    return this.#newSize;
  }

  /**
   * 'mouseover' event callback - set the handle position.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseOver(event) {
    // Workaround for #6926 - if the `event.target` is temporarily detached, we can skip this callback and wait for
    // the next `onmouseover`.
    if (isDetached(event.target)) {
      return;
    }

    // A "mouseover" action is triggered right after executing "contextmenu" event. It should be ignored.
    if (this.#isTriggeredByRMB === true) {
      return;
    }

    if (this.checkIfRowHeader(event.target)) {
      const th = this.getClosestTHParent(event.target);

      if (th) {
        if (!this.#pressed) {
          this.setupHandlePosition(th);
        }
      }
    }
  }

  /**
   * Auto-size row after doubleclick - callback.
   *
   * @private
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   */
  afterMouseDownTimeout() {
    const render = () => {
      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all
      this.hot.view.adjustElementsSize();
    };
    const resize = (row, forceRender) => {
      const hookNewSize = this.hot.runHooks('beforeRowResize', this.getActualRowHeight(row), row, true);

      if (hookNewSize !== undefined) {
        this.#newSize = hookNewSize;
      }

      this.setManualSize(row, this.#newSize); // double click sets auto row size

      this.hot.runHooks('afterRowResize', this.getActualRowHeight(row), row, true);

      if (forceRender) {
        render();
      }
    };

    if (this.#dblclick >= 2) {
      const selectedRowsLength = this.#selectedRows.length;

      if (selectedRowsLength > 1) {
        arrayEach(this.#selectedRows, (selectedRow) => {
          resize(selectedRow);
        });
        render();
      } else {
        arrayEach(this.#selectedRows, (selectedRow) => {
          resize(selectedRow, true);
        });
      }
    }
    this.#dblclick = 0;
    this.#autoresizeTimeout = null;
  }

  /**
   * 'mousedown' event callback.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseDown(event) {
    if (hasClass(event.target, 'manualRowResizer')) {
      this.setupHandlePosition(this.#currentTH);
      this.setupGuidePosition();
      this.#pressed = true;

      if (this.#autoresizeTimeout === null) {
        this.#autoresizeTimeout = setTimeout(() => this.afterMouseDownTimeout(), 500);

        this.hot._registerTimeout(this.#autoresizeTimeout);
      }

      this.#dblclick += 1;
      this.#startY = event.pageY;
      this.#newSize = this.#startHeight;
    }
  }

  /**
   * 'mousemove' event callback - refresh the handle and guide positions, cache the new row height.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseMove(event) {
    if (this.#pressed) {
      this.#currentHeight = this.#startHeight + (event.pageY - this.#startY);

      arrayEach(this.#selectedRows, (selectedRow) => {
        this.#newSize = this.setManualSize(selectedRow, this.#currentHeight);
      });

      this.refreshHandlePosition();
      this.refreshGuidePosition();
    }
  }

  /**
   * 'mouseup' event callback - apply the row resizing.
   *
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   */
  #onMouseUp() {
    const render = () => {
      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all
      this.hot.view.adjustElementsSize();
    };
    const runHooks = (row, forceRender) => {
      this.hot.runHooks('beforeRowResize', this.getActualRowHeight(row), row, false);

      if (forceRender) {
        render();
      }

      this.saveManualRowHeights();

      this.hot.runHooks('afterRowResize', this.getActualRowHeight(row), row, false);
    };

    if (this.#pressed) {
      this.hideHandleAndGuide();
      this.#pressed = false;

      if (this.#newSize !== this.#startHeight) {
        const selectedRowsLength = this.#selectedRows.length;

        if (selectedRowsLength > 1) {
          arrayEach(this.#selectedRows, (selectedRow) => {
            runHooks(selectedRow);
          });
          render();
        } else {
          arrayEach(this.#selectedRows, (selectedRow) => {
            runHooks(selectedRow, true);
          });
        }
      }

      this.setupHandlePosition(this.#currentTH);
    }
  }

  /**
   * Callback for "contextmenu" event triggered on element showing move handle. It removes handle and guide elements.
   */
  #onContextMenu() {
    this.hideHandleAndGuide();
    this.hot.rootElement.removeChild(this.#handle);
    this.hot.rootElement.removeChild(this.#guide);

    this.#pressed = false;
    this.#isTriggeredByRMB = true;

    // There is thrown "mouseover" event right after opening a context menu. This flag inform that handle
    // shouldn't be drawn just after removing it.
    this.hot._registerImmediate(() => {
      this.#isTriggeredByRMB = false;
    });
  }

  /**
   * Binds the mouse events.
   *
   * @private
   */
  bindEvents() {
    const { rootElement, rootWindow } = this.hot;

    this.eventManager.addEventListener(rootElement, 'mouseover', e => this.#onMouseOver(e));
    this.eventManager.addEventListener(rootElement, 'mousedown', e => this.#onMouseDown(e));
    this.eventManager.addEventListener(rootWindow, 'mousemove', e => this.#onMouseMove(e));
    this.eventManager.addEventListener(rootWindow, 'mouseup', () => this.#onMouseUp());
    this.eventManager.addEventListener(this.#handle, 'contextmenu', () => this.#onContextMenu());
  }

  /**
   * Modifies the provided row height, based on the plugin settings.
   *
   * @param {number} height Row height.
   * @param {number} row Visual row index.
   * @returns {number}
   */
  #onModifyRowHeight(height, row) {
    let newHeight = height;

    if (this.enabled) {
      const physicalRow = this.hot.toPhysicalRow(row);
      const rowHeight = this.#rowHeightsMap.getValueAtIndex(physicalRow);

      if (this.hot.getSettings()[PLUGIN_KEY] && rowHeight) {
        newHeight = rowHeight;
      }
    }

    return newHeight;
  }

  /**
   * Callback to call on map's `init` local hook.
   */
  #onMapInit() {
    const initialSetting = this.hot.getSettings()[PLUGIN_KEY];
    const loadedManualRowHeights = this.loadManualRowHeights();

    this.hot.batchExecution(() => {
      if (typeof loadedManualRowHeights !== 'undefined') {
        loadedManualRowHeights.forEach((height, index) => {
          this.#rowHeightsMap.setValueAtIndex(index, height);
        });

      } else if (Array.isArray(initialSetting)) {

        initialSetting.forEach((height, index) => {
          this.#rowHeightsMap.setValueAtIndex(index, height);
        });

        this.#config = initialSetting;

      } else if (initialSetting === true && Array.isArray(this.#config)) {
        this.#config.forEach((height, index) => {
          this.#rowHeightsMap.setValueAtIndex(index, height);
        });
      }
    }, true);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
