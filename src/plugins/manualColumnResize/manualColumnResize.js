import { BasePlugin } from '../base';
import { addClass, closest, hasClass, removeClass, outerHeight, isDetached } from '../../helpers/dom/element';
import EventManager from '../../eventManager';
import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';

// Developer note! Whenever you make a change in this file, make an analogous change in manualRowResize.js

export const PLUGIN_KEY = 'manualColumnResize';
export const PLUGIN_PRIORITY = 130;
const PERSISTENT_STATE_KEY = 'manualColumnWidths';
const privatePool = new WeakMap();

/**
 * @plugin ManualColumnResize
 * @class ManualColumnResize
 *
 * @description
 * This plugin allows to change columns width. To make columns width persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired width of the column.
 * - guide - the helper guide that shows the desired width as a vertical guide.
 */
export class ManualColumnResize extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);

    const { rootDocument } = this.hot;

    this.currentTH = null;
    this.currentCol = null;
    this.selectedCols = [];
    this.currentWidth = null;
    this.newSize = null;
    this.startY = null;
    this.startWidth = null;
    this.startOffset = null;
    this.handle = rootDocument.createElement('DIV');
    this.guide = rootDocument.createElement('DIV');
    this.eventManager = new EventManager(this);
    this.pressed = null;
    this.dblclick = 0;
    this.autoresizeTimeout = null;

    /**
     * PhysicalIndexToValueMap to keep and track widths for physical column indexes.
     *
     * @private
     * @type {PhysicalIndexToValueMap}
     */
    this.columnWidthsMap = void 0;
    /**
     * Private pool to save configuration from updateSettings.
     */
    privatePool.set(this, {
      config: void 0,
    });

    addClass(this.handle, 'manualColumnResizer');
    addClass(this.guide, 'manualColumnResizerGuide');
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ManualColumnResize#enablePlugin} method is called.
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

    this.columnWidthsMap = new IndexToValueMap();
    this.columnWidthsMap.addLocalHook('init', () => this.onMapInit());
    this.hot.columnIndexMapper.registerMap(this.pluginName, this.columnWidthsMap);

    this.addHook('modifyColWidth', (width, col) => this.onModifyColWidth(width, col));
    this.addHook('beforeStretchingColumnWidth',
      (stretchedWidth, column) => this.onBeforeStretchingColumnWidth(stretchedWidth, column));
    this.addHook('beforeColumnResize',
      (newSize, column, isDoubleClick) => this.onBeforeColumnResize(newSize, column, isDoubleClick));

    this.bindEvents();

    super.enablePlugin();
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
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    const priv = privatePool.get(this);

    priv.config = this.columnWidthsMap.getValues();
    this.hot.columnIndexMapper.unregisterMap(this.pluginName);
    super.disablePlugin();
  }

  /**
   * Saves the current sizes using the persistentState plugin (the {@link Options#persistentState} option has to be enabled).
   *
   * @fires Hooks#persistentStateSave
   */
  saveManualColumnWidths() {
    this.hot.runHooks('persistentStateSave', PERSISTENT_STATE_KEY, this.columnWidthsMap.getValues());
  }

  /**
   * Loads the previously saved sizes using the persistentState plugin (the {@link Options#persistentState} option has to be enabled).
   *
   * @returns {Array}
   * @fires Hooks#persistentStateLoad
   */
  loadManualColumnWidths() {
    const storedState = {};

    this.hot.runHooks('persistentStateLoad', PERSISTENT_STATE_KEY, storedState);

    return storedState.value;
  }

  /**
   * Sets the new width for specified column index.
   *
   * @param {number} column Visual column index.
   * @param {number} width Column width (no less than 20px).
   * @returns {number} Returns new width.
   */
  setManualSize(column, width) {
    const newWidth = Math.max(width, 20);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.columnWidthsMap.setValueAtIndex(physicalColumn, newWidth);

    return newWidth;
  }

  /**
   * Clears the cache for the specified column index.
   *
   * @param {number} column Visual column index.
   */
  clearManualSize(column) {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.columnWidthsMap.setValueAtIndex(physicalColumn, null);
  }

  /**
   * Callback to call on map's `init` local hook.
   *
   * @private
   */
  onMapInit() {
    const priv = privatePool.get(this);

    const initialSetting = this.hot.getSettings()[PLUGIN_KEY];
    const loadedManualColumnWidths = this.loadManualColumnWidths();

    if (typeof loadedManualColumnWidths !== 'undefined') {
      this.hot.batchExecution(() => {
        loadedManualColumnWidths.forEach((width, physicalIndex) => {
          this.columnWidthsMap.setValueAtIndex(physicalIndex, width);
        });
      }, true);

    } else if (Array.isArray(initialSetting)) {
      this.hot.batchExecution(() => {
        initialSetting.forEach((width, physicalIndex) => {
          this.columnWidthsMap.setValueAtIndex(physicalIndex, width);
        });
      }, true);

      priv.config = initialSetting;

    } else if (initialSetting === true && Array.isArray(priv.config)) {
      this.hot.batchExecution(() => {
        priv.config.forEach((width, physicalIndex) => {
          this.columnWidthsMap.setValueAtIndex(physicalIndex, width);
        });
      }, true);
    }
  }

  /**
   * Set the resize handle position.
   *
   * @private
   * @param {HTMLCellElement} TH TH HTML element.
   */
  setupHandlePosition(TH) {
    if (!TH.parentNode) {
      return;
    }

    this.currentTH = TH;

    const { view: { wt } } = this.hot;
    const cellCoords = wt.wtTable.getCoords(this.currentTH);
    const col = cellCoords.col;

    // Ignore column headers.
    if (col < 0) {
      return;
    }

    const headerHeight = outerHeight(this.currentTH);
    const box = this.currentTH.getBoundingClientRect();
    // Read "fixedColumnsLeft" through the Walkontable as in that context, the fixed columns
    // are modified (reduced by the number of hidden columns) by TableView module.
    const fixedColumn = col < wt.getSetting('fixedColumnsLeft');
    let relativeHeaderPosition;

    if (fixedColumn) {
      relativeHeaderPosition = wt
        .wtOverlays
        .topLeftCornerOverlay
        .getRelativeCellPosition(this.currentTH, cellCoords.row, cellCoords.col);
    }

    // If the TH is not a child of the top-left overlay, recalculate using
    // the top overlay - as this overlay contains the rest of the headers.
    if (!relativeHeaderPosition) {
      relativeHeaderPosition = wt
        .wtOverlays
        .topOverlay
        .getRelativeCellPosition(this.currentTH, cellCoords.row, cellCoords.col);
    }

    this.currentCol = this.hot.columnIndexMapper.getVisualFromRenderableIndex(col);
    this.selectedCols = [];

    const isFullColumnSelected = this.hot.selection.isSelectedByCorner() ||
      this.hot.selection.isSelectedByColumnHeader();

    if (this.hot.selection.isSelected() && isFullColumnSelected) {
      const selectionRanges = this.hot.getSelectedRange();

      arrayEach(selectionRanges, (selectionRange) => {
        const fromColumn = selectionRange.getTopLeftCorner().col;
        const toColumn = selectionRange.getBottomRightCorner().col;

        // Add every selected column for resize action.
        rangeEach(fromColumn, toColumn, (columnIndex) => {
          if (!this.selectedCols.includes(columnIndex)) {
            this.selectedCols.push(columnIndex);
          }
        });
      });
    }

    // Resizing element beyond the current selection (also when there is no selection).
    if (!this.selectedCols.includes(this.currentCol)) {
      this.selectedCols = [this.currentCol];
    }

    this.startOffset = relativeHeaderPosition.left - 6;
    this.startWidth = parseInt(box.width, 10);

    this.handle.style.top = `${relativeHeaderPosition.top}px`;
    this.handle.style.left = `${this.startOffset + this.startWidth}px`;

    this.handle.style.height = `${headerHeight}px`;
    this.hot.rootElement.appendChild(this.handle);
  }

  /**
   * Refresh the resize handle position.
   *
   * @private
   */
  refreshHandlePosition() {
    this.handle.style.left = `${this.startOffset + this.currentWidth}px`;
  }

  /**
   * Sets the resize guide position.
   *
   * @private
   */
  setupGuidePosition() {
    const handleHeight = parseInt(outerHeight(this.handle), 10);
    const handleBottomPosition = parseInt(this.handle.style.top, 10) + handleHeight;
    const maximumVisibleElementHeight = parseInt(this.hot.view.maximumVisibleElementHeight(0), 10);

    addClass(this.handle, 'active');
    addClass(this.guide, 'active');

    this.guide.style.top = `${handleBottomPosition}px`;
    this.guide.style.left = this.handle.style.left;
    this.guide.style.height = `${maximumVisibleElementHeight - handleHeight}px`;
    this.hot.rootElement.appendChild(this.guide);
  }

  /**
   * Refresh the resize guide position.
   *
   * @private
   */
  refreshGuidePosition() {
    this.guide.style.left = this.handle.style.left;
  }

  /**
   * Hides both the resize handle and resize guide.
   *
   * @private
   */
  hideHandleAndGuide() {
    removeClass(this.handle, 'active');
    removeClass(this.guide, 'active');
  }

  /**
   * Checks if provided element is considered a column header.
   *
   * @private
   * @param {HTMLElement} element HTML element.
   * @returns {boolean}
   */
  checkIfColumnHeader(element) {
    return !!closest(element, ['THEAD'], this.hot.rootElement);
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
   * 'mouseover' event callback - set the handle position.
   *
   * @private
   * @param {MouseEvent} event The mouse event.
   */
  onMouseOver(event) {
    // Workaround for #6926 - if the `event.target` is temporarily detached, we can skip this callback and wait for
    // the next `onmouseover`.
    if (isDetached(event.target)) {
      return;
    }

    if (this.checkIfColumnHeader(event.target)) {
      const th = this.getClosestTHParent(event.target);

      if (!th) {
        return;
      }

      const colspan = th.getAttribute('colspan');

      if (th && (colspan === null || colspan === '1')) {
        if (!this.pressed) {
          this.setupHandlePosition(th);
        }
      }
    }
  }

  /**
   * Auto-size row after doubleclick - callback.
   *
   * @private
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  afterMouseDownTimeout() {
    const render = () => {
      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all
      this.hot.view.adjustElementsSize(true);
    };
    const resize = (column, forceRender) => {
      const hookNewSize = this.hot.runHooks('beforeColumnResize', this.newSize, column, true);

      if (hookNewSize !== void 0) {
        this.newSize = hookNewSize;
      }

      if (this.hot.getSettings().stretchH === 'all') {
        this.clearManualSize(column);
      } else {
        this.setManualSize(column, this.newSize); // double click sets by auto row size plugin
      }

      this.saveManualColumnWidths();

      this.hot.runHooks('afterColumnResize', this.newSize, column, true);

      if (forceRender) {
        render();
      }
    };

    if (this.dblclick >= 2) {
      const selectedColsLength = this.selectedCols.length;

      if (selectedColsLength > 1) {
        arrayEach(this.selectedCols, (selectedCol) => {
          resize(selectedCol);
        });
        render();
      } else {
        arrayEach(this.selectedCols, (selectedCol) => {
          resize(selectedCol, true);
        });
      }
    }
    this.dblclick = 0;
    this.autoresizeTimeout = null;
  }

  /**
   * 'mousedown' event callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event.
   */
  onMouseDown(event) {
    if (hasClass(event.target, 'manualColumnResizer')) {
      this.setupHandlePosition(this.currentTH);
      this.setupGuidePosition();
      this.pressed = true;

      if (this.autoresizeTimeout === null) {
        this.autoresizeTimeout = setTimeout(() => this.afterMouseDownTimeout(), 500);

        this.hot._registerTimeout(this.autoresizeTimeout);
      }
      this.dblclick += 1;

      this.startX = event.pageX;
      this.newSize = this.startWidth;
    }
  }

  /**
   * 'mousemove' event callback - refresh the handle and guide positions, cache the new column width.
   *
   * @private
   * @param {MouseEvent} event The mouse event.
   */
  onMouseMove(event) {
    if (this.pressed) {
      this.currentWidth = this.startWidth + (event.pageX - this.startX);

      arrayEach(this.selectedCols, (selectedCol) => {
        this.newSize = this.setManualSize(selectedCol, this.currentWidth);
      });

      this.refreshHandlePosition();
      this.refreshGuidePosition();
    }
  }

  /**
   * 'mouseup' event callback - apply the column resizing.
   *
   * @private
   *
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  onMouseUp() {
    const render = () => {
      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all
      this.hot.view.adjustElementsSize(true);
    };
    const resize = (column, forceRender) => {
      this.hot.runHooks('beforeColumnResize', this.newSize, column, false);

      if (forceRender) {
        render();
      }

      this.saveManualColumnWidths();

      this.hot.runHooks('afterColumnResize', this.newSize, column, false);
    };

    if (this.pressed) {
      this.hideHandleAndGuide();
      this.pressed = false;

      if (this.newSize !== this.startWidth) {
        const selectedColsLength = this.selectedCols.length;

        if (selectedColsLength > 1) {
          arrayEach(this.selectedCols, (selectedCol) => {
            resize(selectedCol);
          });
          render();
        } else {
          arrayEach(this.selectedCols, (selectedCol) => {
            resize(selectedCol, true);
          });
        }
      }

      this.setupHandlePosition(this.currentTH);
    }
  }

  /**
   * Binds the mouse events.
   *
   * @private
   */
  bindEvents() {
    const { rootWindow, rootElement } = this.hot;

    this.eventManager.addEventListener(rootElement, 'mouseover', e => this.onMouseOver(e));
    this.eventManager.addEventListener(rootElement, 'mousedown', e => this.onMouseDown(e));
    this.eventManager.addEventListener(rootWindow, 'mousemove', e => this.onMouseMove(e));
    this.eventManager.addEventListener(rootWindow, 'mouseup', () => this.onMouseUp());
  }

  /**
   * Modifies the provided column width, based on the plugin settings.
   *
   * @private
   * @param {number} width Column width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  onModifyColWidth(width, column) {
    let newWidth = width;

    if (this.enabled) {
      const physicalColumn = this.hot.toPhysicalColumn(column);
      const columnWidth = this.columnWidthsMap.getValueAtIndex(physicalColumn);

      if (this.hot.getSettings()[PLUGIN_KEY] && columnWidth) {
        newWidth = columnWidth;
      }
    }

    return newWidth;
  }

  /**
   * Modifies the provided column stretched width. This hook decides if specified column should be stretched or not.
   *
   * @private
   * @param {number} stretchedWidth Stretched width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  onBeforeStretchingColumnWidth(stretchedWidth, column) {
    let width = this.columnWidthsMap.getValueAtIndex(column);

    if (width === null) {
      width = stretchedWidth;
    }

    return width;
  }

  /**
   * `beforeColumnResize` hook callback.
   *
   * @private
   */
  onBeforeColumnResize() {
    // clear the header height cache information
    this.hot.view.wt.wtViewport.resetHasOversizedColumnHeadersMarked();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
