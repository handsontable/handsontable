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
import { getElementScaleFactor, normalizeVisualDelta } from '../manualResize/utils';

// Developer note! Whenever you make a change in this file, make an analogous change in manualColumnResize.js

export const PLUGIN_KEY = 'manualRowResize';
export const PLUGIN_PRIORITY = 30;
const PERSISTENT_STATE_KEY = PLUGIN_KEY;

/**
 * @plugin ManualRowResize
 * @class ManualRowResize
 *
 * @description
 * This plugin allows to change rows height.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired height of the row.
 * - guide - the helper guide that shows the desired height as a horizontal guide.
 */
export class ManualRowResize extends BasePlugin {
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
   * @type {HTMLTableCellElement}
   */
  #currentTH: HTMLTableHeaderCellElement | null = null;
  /**
   * @type {number}
   */
  #currentRow: number | null = null;
  /**
   * @type {number[]}
   */
  #selectedRows: number[] = [];
  /**
   * @type {number}
   */
  #currentHeight: number | null = null;
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
  #startHeight: number | null = null;
  /**
   * @type {number}
   */
  #startOffset: number | null = null;
  /**
   * @type {number}
   */
  #verticalScaleFactor = 1;
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
  #autoresizeTimeout: ReturnType<typeof setTimeout> | null = null;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical row indexes.
   *
   * @type {PhysicalIndexToValueMap}
   */
  #rowHeightsMap!: IndexToValueMap;
  /**
   * Disposer function for the row heights map observer. Called on disable to clean up.
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

    this.#rowHeightsMap = new IndexToValueMap();
    this.#rowHeightsMap.addLocalHook('init', () => this.#onMapInit());
    this.hot.rowIndexMapper.registerMap(this.pluginName!, this.#rowHeightsMap);

    this.#disposeMapObserver = this.hot.rowIndexMapper
      .observeMapChange(this.#rowHeightsMap, () => {
        this.hot.view?.invalidateRowHeightCache();
      });

    this.addHook('modifyRowHeight', this.#onModifyRowHeight);

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
    if (this.#disposeMapObserver) {
      this.#disposeMapObserver();
      this.#disposeMapObserver = null;
    }

    this.#config = this.#rowHeightsMap.getValues();

    this.hot.rowIndexMapper.unregisterMap(this.pluginName!);
    super.disablePlugin();
  }

  /**
   * Saves the current sizes using the persistentState plugin (the {@link Options#persistentState} option has to be
   * enabled).
   *
   * @fires Hooks#persistentStateSave
   */
  saveManualRowHeights(): void {
    this.hot.runHooks('persistentStateSave', PERSISTENT_STATE_KEY, this.#rowHeightsMap.getValues());
  }

  /**
   * Loads the previously saved sizes using the persistentState plugin (the {@link Options#persistentState} option
   * has be enabled).
   *
   * @returns {Array}
   * @fires Hooks#persistentStateLoad
   */
  loadManualRowHeights(): Array<number | null> {
    const storedState: Record<string, unknown> = {};

    this.hot.runHooks('persistentStateLoad', PERSISTENT_STATE_KEY, storedState);

    return storedState.value as Array<number | null>;
  }

  /**
   * Sets the new height for specified row index.
   *
   * @param {number} row Visual row index.
   * @param {number} height Row height.
   * @returns {number} Returns new height.
   */
  setManualSize(row: number, height: number): number {
    const physicalRow = this.hot.toPhysicalRow(row);
    const newHeight = Math.max(height, this.hot.stylesHandler.getDefaultRowHeight() ?? 0);

    if (physicalRow !== null) {
      this.#rowHeightsMap.setValueAtIndex(physicalRow, newHeight);
    }

    return newHeight;
  }

  /**
   * Returns the last desired row height set manually with the resize handle.
   *
   * @returns {number} The last desired row height.
   */
  getLastDesiredRowHeight(): number {
    return this.#currentHeight ?? 0;
  }

  /**
   * Sets the resize handle position.
   *
   * @private
   * @param {HTMLCellElement} TH TH HTML element.
   */
  setupHandlePosition(TH: HTMLTableHeaderCellElement) {
    if (!TH.parentNode || this.#dblclick > 1) {
      return;
    }

    this.#currentTH = TH;

    const { view } = this.hot;
    const { _wt: wt } = view;
    const cellCoords = wt.wtTable.getCoords(this.#currentTH);

    if (!cellCoords) {
      return;
    }

    const row = cellCoords.row;

    // Ignore row headers.
    if (row === null || row < 0) {
      return;
    }

    const headerWidth = outerWidth(this.#currentTH);
    // Read "fixedRowsTop" and "fixedRowsBottom" through the Walkontable as in that context, the fixed
    // rows are modified (reduced by the number of hidden rows) by TableView module.
    const fixedRowTop = row < (wt.getSetting('fixedRowsTop') as number);
    const fixedRowBottom = row >= view.countNotHiddenRowIndexes(0, 1) - (wt.getSetting('fixedRowsBottom') as number);
    let relativeHeaderPosition;

    const coordRow = cellCoords.row ?? 0;
    const coordCol = cellCoords.col ?? 0;

    if (fixedRowTop) {
      relativeHeaderPosition = wt
        .wtOverlays
        .topInlineStartCornerOverlay
        .getRelativeCellPosition(this.#currentTH, coordRow, coordCol);

    } else if (fixedRowBottom) {
      relativeHeaderPosition = wt
        .wtOverlays
        .bottomInlineStartCornerOverlay
        .getRelativeCellPosition(this.#currentTH, coordRow, coordCol);
    }

    // If the TH is not a child of the top-left/bottom-left overlay, recalculate using
    // the left overlay - as this overlay contains the rest of the headers.
    if (!relativeHeaderPosition) {
      relativeHeaderPosition = wt
        .wtOverlays
        .inlineStartOverlay
        .getRelativeCellPosition(this.#currentTH, coordRow, coordCol);
    }

    this.#currentRow = this.hot.rowIndexMapper.getVisualFromRenderableIndex(row);
    this.#selectedRows = [];

    const isFullRowSelected = this.hot.selection.isSelectedByCorner() || this.hot.selection.isSelectedByRowHeader();

    if (this.hot.selection.isSelected() && isFullRowSelected) {
      const selectionRanges = this.hot.getSelectedRange() ?? [];

      arrayEach(selectionRanges, (selectionRange) => {
        const fromRow = (selectionRange as CellRange).getTopStartCorner().row;
        const toRow = (selectionRange as CellRange).getBottomStartCorner().row;

        if (fromRow === null || toRow === null) {
          return;
        }

        // Add every selected row for resize action.
        rangeEach(fromRow, toRow, (rowIndex) => {
          if (!this.#selectedRows.includes(rowIndex)) {
            this.#selectedRows.push(rowIndex);
          }
        });
      });
    }

    if (this.#currentRow === null) {
      return;
    }

    // Resizing element beyond the current selection (also when there is no selection).
    if (!this.#selectedRows.includes(this.#currentRow)) {
      this.#selectedRows = [this.#currentRow];
    }

    if (!relativeHeaderPosition) {
      return;
    }

    this.#startOffset = relativeHeaderPosition.top - 6;
    this.#startHeight = outerHeight(this.#currentTH);
    this.#verticalScaleFactor = getElementScaleFactor(this.#currentTH, 'vertical');

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
    this.#handle.style.top = `${(this.#startOffset ?? 0) + (this.#currentHeight ?? 0)}px`;
  }

  /**
   * Sets the resize guide position.
   *
   * @private
   */
  setupGuidePosition() {
    const handleWidth = outerWidth(this.#handle);
    const handleEndPosition = Number.parseInt(this.#handle.style[this.inlineDir], 10) + handleWidth;
    const tableWidth = this.hot.view.getTableWidth();

    addClass(this.#handle, 'active');
    addClass(this.#guide, 'active');

    this.#guide.style.top = this.#handle.style.top;
    this.#guide.style[this.inlineDir] = `${handleEndPosition}px`;
    this.#guide.style.width = `${tableWidth - handleWidth}px`;
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
  checkIfRowHeader(element: HTMLElement) {
    const tbody = closest(element, ['TBODY'], this.hot.rootElement);
    const {
      inlineStartOverlay,
      topInlineStartCornerOverlay,
      bottomInlineStartCornerOverlay,
    } = this.hot.view._wt.wtOverlays;

    return [
      inlineStartOverlay.clone?.wtTable.TBODY,
      topInlineStartCornerOverlay.clone?.wtTable.TBODY,
      bottomInlineStartCornerOverlay.clone?.wtTable.TBODY,
    ].includes(tbody as HTMLTableSectionElement);
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
   * Returns the actual height for the provided row index.
   *
   * @private
   * @param {number} row Visual row index.
   * @returns {number} Actual row height.
   */
  getActualRowHeight(row: number) {
    // TODO: this should utilize `this.hot.getRowHeight` after it's fixed and working properly.
    const walkontableHeight = this.hot.view._wt.wtTable.getRowHeight(row);

    if (walkontableHeight !== undefined && this.#newSize !== null && this.#newSize < walkontableHeight) {
      return walkontableHeight;
    }

    return this.#newSize;
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

    if (this.checkIfRowHeader(eventTargetEl(event)!)) {
      const th = this.getClosestTHParent(eventTargetEl(event)!);

      if (th) {
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
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   */
  afterMouseDownTimeout() {
    const render = () => {
      this.hot.view.adjustElementsSize();
      this.hot.render();
    };
    const resize = (row: number, forceRender?: unknown) => {
      const hookNewSize = this.hot.runHooks('beforeRowResize', this.getActualRowHeight(row), row, true);

      if (hookNewSize === false) {
        return;
      }

      if (typeof hookNewSize === 'number') {
        this.#newSize = hookNewSize;
      }

      this.setManualSize(row, this.#newSize!); // double click sets auto row size

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
  #onMouseDown(event: MouseEvent) {
    if (eventTargetEl(event)!.parentNode !== this.hot.rootElement) {
      return;
    }

    if (hasClass(eventTargetEl(event)!, 'manualRowResizer')) {
      this.setupHandlePosition(this.#currentTH!);
      this.setupGuidePosition();
      this.#pressed = true;

      if (this.#autoresizeTimeout === null) {
        this.#autoresizeTimeout = this.hot._registerTimeout(() => this.afterMouseDownTimeout(), 500);
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
  #onMouseMove(event: MouseEvent) {
    if (this.#pressed) {
      const visualChange = event.pageY - (this.#startY ?? 0);
      const change = normalizeVisualDelta(visualChange, this.#verticalScaleFactor);

      this.#currentHeight = (this.#startHeight ?? 0) + change;

      arrayEach(this.#selectedRows, (selectedRow) => {
        this.#newSize = this.setManualSize(selectedRow, this.#currentHeight as number);
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
      this.hot.view.adjustElementsSize();
      this.hot.render();
    };
    const runHooks = (row: number, forceRender?: unknown) => {
      const hookNewSize = this.hot.runHooks('beforeRowResize', this.getActualRowHeight(row), row, false);

      if (hookNewSize === false) {
        this.setManualSize(row, this.#startHeight!);
        this.#newSize = this.#startHeight;
      } else if (typeof hookNewSize === 'number') {
        this.#newSize = hookNewSize;
        this.setManualSize(row, this.#newSize);
      }

      if (forceRender) {
        render();
      }

      this.saveManualRowHeights();

      if (hookNewSize !== false) {
        this.hot.runHooks('afterRowResize', this.getActualRowHeight(row), row, false);
      }
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

      this.setupHandlePosition(this.#currentTH!);
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
    const { rootElement, rootWindow } = this.hot;

    this.eventManager.addEventListener(rootElement, 'mouseover', (e: MouseEvent) => this.#onMouseOver(e));
    this.eventManager.addEventListener(rootElement, 'mousedown', (e: MouseEvent) => this.#onMouseDown(e));
    this.eventManager.addEventListener(rootWindow, 'mousemove', (e: MouseEvent) => this.#onMouseMove(e));
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
  #onModifyRowHeight = (height: number, row: number) => {
    let newHeight = height;

    if (this.enabled) {
      const physicalRow = this.hot.toPhysicalRow(row);
      const rowHeight = this.#rowHeightsMap.getValueAtIndex<number>(physicalRow);

      if (this.hot.getSettings()[PLUGIN_KEY] && rowHeight) {
        if (this.hot.getPlugin('autoRowSize')?.isEnabled()) {
          newHeight = Math.max(rowHeight, newHeight ?? 0);

        } else {
          newHeight = rowHeight;
        }
      }
    }

    return newHeight;
  };

  /**
   * Callback to call on map's `init` local hook.
   */
  #onMapInit() {
    const initialSetting = this.hot.getSettings()[PLUGIN_KEY];

    this.hot.batchExecution(() => {
      if (Array.isArray(initialSetting)) {

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
