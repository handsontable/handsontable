import type { HotInstance } from '../../core/types';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import { BasePlugin } from '../base';
import {
  addClass,
  closest,
  eventTargetEl,
  hasClass,
  removeClass,
  outerHeight,
  outerWidth,
  isDetached
} from '../../helpers/dom/element';
import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { getElementScaleFactor, normalizeVisualDelta } from './utils';

// Developer note! Whenever you make a change in this file, make an analogous change in manualRowResize.js

export const PLUGIN_KEY = 'manualColumnResize';
export const PLUGIN_PRIORITY = 130;
const PERSISTENT_STATE_KEY = PLUGIN_KEY;

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin ManualColumnResize
 * @class ManualColumnResize
 *
 * @description
 * This plugin allows to change columns width.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired width of the column.
 * - guide - the helper guide that shows the desired width as a vertical guide.
 */
export class ManualColumnResize extends BasePlugin {
  /**
   * Stores the horizontal pointer position at the start of a column resize drag operation.
   */
  declare startX: number;

  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * @type {HTMLTableHeaderCellElement}
   */
  #currentTH: HTMLTableHeaderCellElement | null = null;
  /**
   * @type {number}
   */
  #currentCol: number | null = null;
  /**
   * @type {number[]}
   */
  #selectedCols: number[] = [];
  /**
   * @type {number}
   */
  #currentWidth: number | null = null;
  /**
   * @type {number}
   */
  #newSize: number | null = null;
  /**
   * @type {number}
   */
  #startY: number | null = null;
  /**
   * @type {number}
   */
  #startWidth: number | null = null;
  /**
   * @type {number}
   */
  #startOffset: number | null = null;
  /**
   * @type {number}
   */
  #horizontalScaleFactor = 1;
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
  #pressed: boolean | null = null;
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
  #autoresizeTimeout: ReturnType<typeof setTimeout> | null = null;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical column indexes.
   *
   * @type {PhysicalIndexToValueMap}
   */
  #columnWidthsMap!: IndexToValueMap;
  /**
   * Disposer function for the column widths map observer. Called on disable to clean up.
   *
   * @type {Function|null}
   */
  #disposeMapObserver: (() => void) | null = null;
  /**
   * Private pool to save configuration from updateSettings.
   *
   * @type {object}
   */
  #config!: unknown[];

  /**
   * Initializes the plugin and applies CSS classes to the resize handle and guide elements.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);

    addClass(this.#handle, 'manualColumnResizer');
    addClass(this.#guide, 'manualColumnResizerGuide');
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
   * hook and if it returns `true` then the {@link ManualColumnResize#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#columnWidthsMap = new IndexToValueMap();
    this.#columnWidthsMap.addLocalHook('init', () => this.#onMapInit());
    this.hot.columnIndexMapper.registerMap(this.pluginName!, this.#columnWidthsMap);

    this.#disposeMapObserver = this.hot.columnIndexMapper
      .observeMapChange(this.#columnWidthsMap, () => {
        this.hot.view?.invalidateColumnWidthCache();
      });

    this.addHook('modifyColWidth', this.#onModifyColWidth, 1);
    this.addHook('beforeStretchingColumnWidth', this.#onBeforeStretchingColumnWidth, 1);
    this.addHook('beforeColumnResize', this.#onBeforeColumnResize);

    this.bindEvents();

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`manualColumnResize`](@/api/options.md#manualcolumnresize)
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
    if (this.#disposeMapObserver) {
      this.#disposeMapObserver();
      this.#disposeMapObserver = null;
    }

    this.#config = this.#columnWidthsMap.getValues();
    this.hot.columnIndexMapper.unregisterMap(this.pluginName!);
    super.disablePlugin();
  }

  /**
   * Saves the current sizes using the persistentState plugin (the {@link Options#persistentState} option has to be enabled).
   *
   * @fires Hooks#persistentStateSave
   */
  saveManualColumnWidths(): void {
    this.hot.runHooks('persistentStateSave', PERSISTENT_STATE_KEY, this.#columnWidthsMap.getValues());
  }

  /**
   * Loads the previously saved sizes using the persistentState plugin (the {@link Options#persistentState} option has to be enabled).
   *
   * @returns {Array}
   * @fires Hooks#persistentStateLoad
   */
  loadManualColumnWidths(): Array<number | null> {
    const storedState: Record<string, unknown> = {};

    this.hot.runHooks('persistentStateLoad', PERSISTENT_STATE_KEY, storedState);

    return storedState.value as Array<number | null>;
  }

  /**
   * Sets the new width for specified column index.
   *
   * @param {number} column Visual column index.
   * @param {number} width Column width (no less than 20px).
   * @returns {number} Returns new width.
   */
  setManualSize(column: number, width: number): number {
    const newWidth = Math.max(width, 20);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.#columnWidthsMap.setValueAtIndex(physicalColumn, newWidth);

    return newWidth;
  }

  /**
   * Clears the cache for the specified column index.
   *
   * @param {number} column Visual column index.
   */
  clearManualSize(column: number): void {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.#columnWidthsMap.setValueAtIndex(physicalColumn, null);
  }

  /**
   * Callback to call on map's `init` local hook.
   *
   * @private
   */
  #onMapInit() {
    const initialSetting = this.hot.getSettings()[PLUGIN_KEY];

    if (Array.isArray(initialSetting)) {
      this.hot.batchExecution(() => {
        initialSetting.forEach((width, physicalIndex) => {
          this.#columnWidthsMap.setValueAtIndex(physicalIndex, width);
        });
      }, true);

      this.#config = initialSetting;

    } else if (initialSetting === true && Array.isArray(this.#config)) {
      this.hot.batchExecution(() => {
        this.#config.forEach((width: unknown, physicalIndex: number) => {
          this.#columnWidthsMap.setValueAtIndex(physicalIndex, width);
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
  setupHandlePosition(TH: HTMLTableHeaderCellElement) {
    if (!TH.parentNode || this.#dblclick > 1) {
      return;
    }

    this.#currentTH = TH;

    const { _wt: wt } = this.hot.view;
    const cellCoords = wt.wtTable.getCoords(this.#currentTH);

    if (!cellCoords) {
      return;
    }

    const col = cellCoords.col;

    // Ignore column headers.
    if (col === null || col < 0) {
      return;
    }

    const headerHeight = outerHeight(this.#currentTH);
    // Read "fixedColumnsStart" through the Walkontable as in that context, the fixed columns
    // are modified (reduced by the number of hidden columns) by TableView module.
    const fixedColumn = col < (wt.getSetting('fixedColumnsStart') as number);
    let relativeHeaderPosition;

    const coordRow = cellCoords.row ?? 0;
    const coordCol = cellCoords.col ?? 0;

    if (fixedColumn) {
      relativeHeaderPosition = wt
        .wtOverlays
        .topInlineStartCornerOverlay
        .getRelativeCellPosition(this.#currentTH, coordRow, coordCol);
    }

    // If the TH is not a child of the top-left overlay, recalculate using
    // the top overlay - as this overlay contains the rest of the headers.
    if (!relativeHeaderPosition) {
      relativeHeaderPosition = wt
        .wtOverlays
        .topOverlay
        .getRelativeCellPosition(this.#currentTH, coordRow, coordCol);
    }

    this.#currentCol = this.hot.columnIndexMapper.getVisualFromRenderableIndex(col);
    this.#selectedCols = [];

    const isFullColumnSelected = this.hot.selection.isSelectedByCorner() ||
      this.hot.selection.isSelectedByColumnHeader();

    if (this.hot.selection.isSelected() && isFullColumnSelected) {
      const selectionRanges = this.hot.getSelectedRange() ?? [];

      arrayEach(selectionRanges, (selectionRange) => {
        const fromColumn = (selectionRange as CellRange).getTopStartCorner().col;
        const toColumn = (selectionRange as CellRange).getBottomEndCorner().col;

        if (fromColumn === null || toColumn === null) {
          return;
        }

        // Add every selected column for resize action.
        rangeEach(fromColumn, toColumn, (columnIndex) => {
          if (!this.#selectedCols.includes(columnIndex)) {
            this.#selectedCols.push(columnIndex);
          }
        });
      });
    }

    if (this.#currentCol === null) {
      return;
    }

    // Resizing element beyond the current selection (also when there is no selection).
    if (!this.#selectedCols.includes(this.#currentCol)) {
      this.#selectedCols = [this.#currentCol];
    }

    if (!relativeHeaderPosition) {
      return;
    }

    this.#startOffset = relativeHeaderPosition.start - 6;
    this.#startWidth = outerWidth(this.#currentTH);
    this.#horizontalScaleFactor = getElementScaleFactor(this.#currentTH);

    this.#handle.style.top = `${relativeHeaderPosition.top}px`;
    this.#handle.style[this.inlineDir] = `${this.#startOffset + this.#startWidth}px`;

    this.#handle.style.height = `${headerHeight}px`;
    this.hot.rootElement.appendChild(this.#handle);
  }

  /**
   * Refresh the resize handle position.
   *
   * @private
   */
  refreshHandlePosition() {
    this.#handle.style[this.inlineDir] = `${(this.#startOffset ?? 0) + (this.#currentWidth ?? 0)}px`;
  }

  /**
   * Sets the resize guide position.
   *
   * @private
   */
  setupGuidePosition() {
    const handleHeight = outerHeight(this.#handle);
    const handleBottomPosition = Number.parseInt(this.#handle.style.top, 10) + handleHeight;
    const tableHeight = this.hot.view.getTableHeight();

    addClass(this.#handle, 'active');
    addClass(this.#guide, 'active');

    this.#guide.style.top = `${handleBottomPosition}px`;
    this.refreshGuidePosition();
    this.#guide.style.height = `${tableHeight - handleHeight}px`;
    this.hot.rootElement.appendChild(this.#guide);
  }

  /**
   * Refresh the resize guide position.
   *
   * @private
   */
  refreshGuidePosition() {
    this.#guide.style[this.inlineDir] = this.#handle.style[this.inlineDir];
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
   * Checks if provided element is considered a column header.
   *
   * @private
   * @param {HTMLElement} element HTML element.
   * @returns {boolean}
   */
  checkIfColumnHeader(element: HTMLElement) {
    const thead = closest(element, ['THEAD'], this.hot.rootElement) as HTMLElement | null;
    const { topOverlay, topInlineStartCornerOverlay } = this.hot.view._wt.wtOverlays;

    return ([
      topOverlay.clone!.wtTable.THEAD,
      topInlineStartCornerOverlay.clone!.wtTable.THEAD,
    ] as (HTMLElement | null)[]).includes(thead);
  }

  /**
   * Gets the TH element from the provided element.
   *
   * @private
   * @param {HTMLElement} element HTML element.
   * @returns {HTMLElement}
   */
  getClosestTHParent(element: HTMLElement): HTMLElement | null {
    if (element.tagName !== 'TABLE') {
      if (element.tagName === 'TH') {
        return element;
      }

      return this.getClosestTHParent(element.parentNode as HTMLElement);
    }

    return null;
  }

  /**
   * 'mouseover' event callback - set the handle position.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseOver(event: MouseEvent) {
    // Workaround for #6926 - if the `event.target` is temporarily detached, we can skip this callback and wait for
    // the next `onmouseover`.
    if (isDetached(eventTargetEl(event)!)) {
      return;
    }

    // A "mouseover" action is triggered right after executing "contextmenu" event. It should be ignored.
    if (this.#isTriggeredByRMB === true) {
      return;
    }

    if (this.checkIfColumnHeader(eventTargetEl(event)!)) {
      const th = this.getClosestTHParent(eventTargetEl(event)!);

      if (!th) {
        return;
      }

      const colspan = th.getAttribute('colspan');

      if (th && (colspan === null || colspan === '1')) {
        if (!this.#pressed) {
          this.setupHandlePosition(th as HTMLTableHeaderCellElement);
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
      this.hot.view.adjustElementsSize();
      this.hot.render();
    };
    const resize = (column: number, forceRender?: boolean) => {
      const hookNewSize = this.hot.runHooks('beforeColumnResize', this.#newSize, column, true);

      if (hookNewSize === false) {
        return;
      }

      if (typeof hookNewSize === 'number') {
        this.#newSize = hookNewSize;
      }

      this.setManualSize(column, this.#newSize ?? 0); // double click sets by auto row size plugin

      this.hot.runHooks('afterColumnResize', this.#newSize, column, true);

      if (forceRender) {
        render();
      }
    };

    if (this.#dblclick >= 2) {
      const selectedColsLength = this.#selectedCols.length;

      if (selectedColsLength > 1) {
        arrayEach(this.#selectedCols, (selectedCol) => {
          resize(selectedCol);
        });
        render();
      } else {
        arrayEach(this.#selectedCols, (selectedCol) => {
          resize(selectedCol, true);
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
  #onMouseDown(event: MouseEvent) {
    if (eventTargetEl(event)!.parentNode !== this.hot.rootElement) {
      return;
    }

    if (hasClass(eventTargetEl(event)!, 'manualColumnResizer') && this.#currentTH) {
      this.setupHandlePosition(this.#currentTH);
      this.setupGuidePosition();
      this.#pressed = true;

      if (this.#autoresizeTimeout === null) {
        this.#autoresizeTimeout = this.hot._registerTimeout(() => this.afterMouseDownTimeout(), 500);
      }
      this.#dblclick += 1;

      this.startX = event.pageX;
      this.#newSize = this.#startWidth;
    }
  }

  /**
   * 'mousemove' event callback - refresh the handle and guide positions, cache the new column width.
   *
   * @param {MouseEvent} event The mouse event.
   */
  #onMouseMove(event: MouseEvent) {
    if (this.#pressed) {
      const visualChange = (event.pageX - this.startX) * this.hot.getDirectionFactor();
      const change = normalizeVisualDelta(visualChange, this.#horizontalScaleFactor);

      this.#currentWidth = (this.#startWidth ?? 0) + change;

      arrayEach(this.#selectedCols, (selectedCol) => {
        this.#newSize = this.setManualSize(selectedCol, this.#currentWidth ?? 0);
      });

      this.refreshHandlePosition();
      this.refreshGuidePosition();
    }
  }

  /**
   * 'mouseup' event callback - apply the column resizing.
   *
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  #onMouseUp() {
    const render = () => {
      this.hot.view.adjustElementsSize();
      this.hot.render();
    };
    const resize = (column: number, forceRender?: boolean) => {
      const hookNewSize = this.hot.runHooks('beforeColumnResize', this.#newSize, column, false);

      if (hookNewSize === false) {
        this.setManualSize(column, this.#startWidth ?? 0);
        this.#newSize = this.#startWidth;
      } else if (typeof hookNewSize === 'number') {
        this.#newSize = hookNewSize;
        this.setManualSize(column, this.#newSize);
      }

      if (forceRender) {
        render();
      }

      if (hookNewSize !== false) {
        this.hot.runHooks('afterColumnResize', this.#newSize, column, false);
      }
    };

    if (this.#pressed) {
      this.hideHandleAndGuide();
      this.#pressed = false;

      if (this.#newSize !== this.#startWidth) {
        const selectedColsLength = this.#selectedCols.length;

        if (selectedColsLength > 1) {
          arrayEach(this.#selectedCols, (selectedCol) => {
            resize(selectedCol);
          });
          render();
        } else {
          arrayEach(this.#selectedCols, (selectedCol) => {
            resize(selectedCol, true);
          });
        }
      }

      if (this.#currentTH) {
        this.setupHandlePosition(this.#currentTH);
      }
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
    (this.hot as Record<string, (cb: () => void) => void>)._registerMicrotask(() => {
      this.#isTriggeredByRMB = false;
    });
  }

  /**
   * Binds the mouse events.
   *
   * @private
   */
  bindEvents() {
    const { rootWindow, rootElement } = this.hot;

    this.eventManager.addEventListener(rootElement, 'mouseover', (e: MouseEvent) => this.#onMouseOver(e));
    this.eventManager.addEventListener(rootElement, 'mousedown', (e: MouseEvent) => this.#onMouseDown(e));
    this.eventManager.addEventListener(rootWindow, 'mousemove', (e: MouseEvent) => this.#onMouseMove(e));
    this.eventManager.addEventListener(rootWindow, 'mouseup', () => this.#onMouseUp());
    this.eventManager.addEventListener(this.#handle, 'contextmenu', () => this.#onContextMenu());
  }

  /**
   * Modifies the provided column width, based on the plugin settings.
   *
   * @param {number} width Column width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  #onModifyColWidth = (width: number, column: number) => {
    let newWidth = width;

    if (this.enabled) {
      const physicalColumn = this.hot.toPhysicalColumn(column);
      const columnWidth = this.#columnWidthsMap.getValueAtIndex<number>(physicalColumn);

      if (this.hot.getSettings()[PLUGIN_KEY] && columnWidth) {
        newWidth = columnWidth;
      }
    }

    return newWidth;
  };

  /**
   * Modifies the provided column stretched width. This hook decides if specified column should be stretched or not.
   *
   * @param {number} stretchedWidth Stretched width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  #onBeforeStretchingColumnWidth = (stretchedWidth: number, column: number) => {
    const width = this.#columnWidthsMap.getValueAtIndex(this.hot.toPhysicalColumn(column));

    if (typeof width === 'number') {
      return width;
    }

    return stretchedWidth;
  };

  /**
   * `beforeColumnResize` hook callback.
   */
  #onBeforeColumnResize = () => {
    // clear the header height cache information
    this.hot.view._wt.wtViewport.resetHasOversizedColumnHeadersMarked();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
