import Handsontable from './../../browser';
import BasePlugin from './../_base.js';
import {addClass, hasClass, removeClass, outerHeight} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {pageX, pageY} from './../../helpers/dom/event';
import {arrayEach} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {registerPlugin} from './../../plugins';

// Developer note! Whenever you make a change in this file, make an analogous change in manualRowResize.js

/**
 * @description
 * ManualColumnResize Plugin.
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired width of the column.
 * - guide - the helper guide that shows the desired width as a vertical guide.
 *
 * @plugin ManualColumnResize
 */
class ManualColumnResize extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    this.currentTH = null;
    this.currentCol = null;
    this.selectedCols = [];
    this.currentWidth = null;
    this.newSize = null;
    this.startY = null;
    this.startWidth = null;
    this.startOffset = null;
    this.handle = document.createElement('DIV');
    this.guide = document.createElement('DIV');
    this.eventManager = eventManagerObject(this);
    this.pressed = null;
    this.dblclick = 0;
    this.autoresizeTimeout = null;
    this.manualColumnWidths = [];

    addClass(this.handle, 'manualColumnResizer');
    addClass(this.guide, 'manualColumnResizerGuide');
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().manualColumnResize;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.manualColumnWidths = [];
    let initialColumnWidth = this.hot.getSettings().manualColumnResize;
    let loadedManualColumnWidths = this.loadManualColumnWidths();

    this.addHook('modifyColWidth', (width, col) => this.onModifyColWidth(width, col));
    this.addHook('beforeStretchingColumnWidth', (stretchedWidth, column) => this.onBeforeStretchingColumnWidth(stretchedWidth, column));
    this.addHook('beforeColumnResize', (currentColumn, newSize, isDoubleClick) => this.onBeforeColumnResize(currentColumn, newSize, isDoubleClick));

    if (typeof loadedManualColumnWidths != 'undefined') {
      this.manualColumnWidths = loadedManualColumnWidths;
    } else if (Array.isArray(initialColumnWidth)) {
      this.manualColumnWidths = initialColumnWidth;
    } else {
      this.manualColumnWidths = [];
    }

    Handsontable.hooks.register('beforeColumnResize');
    Handsontable.hooks.register('afterColumnResize');

    this.bindEvents();

    super.enablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    let initialColumnWidth = this.hot.getSettings().manualColumnResize;

    if (Array.isArray(initialColumnWidth)) {
      this.manualColumnWidths = initialColumnWidth;

    } else if (!initialColumnWidth) {
      this.manualColumnWidths = [];
    }
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Save the current sizes using the persistentState plugin.
   */
  saveManualColumnWidths() {
    this.hot.runHooks('persistentStateSave', 'manualColumnWidths', this.manualColumnWidths);
  }

  /**
   * Load the previously saved sizes using the persistentState plugin.
   *
   * @returns {Array}
   */
  loadManualColumnWidths() {
    let storedState = {};

    this.hot.runHooks('persistentStateLoad', 'manualColumnWidths', storedState);

    return storedState.value;
  }

  /**
   * Set the resize handle position.
   *
   * @param {HTMLCellElement} TH TH HTML element.
   */
  setupHandlePosition(TH) {
    if (!TH.parentNode) {
      return false;
    }

    this.currentTH = TH;

    let col = this.hot.view.wt.wtTable.getCoords(TH).col; // getCoords returns WalkontableCellCoords
    let headerHeight = outerHeight(this.currentTH);

    if (col >= 0) { // if not col header
      let box = this.currentTH.getBoundingClientRect();

      this.currentCol = col;
      this.selectedCols = [];

      if (this.hot.selection.isSelected() && this.hot.selection.selectedHeader.cols) {
        let {from, to} = this.hot.getSelectedRange();
        let start = from.col;
        let end = to.col;

        if (start >= end) {
          start = to.col;
          end = from.col;
        }

        if (this.currentCol >= start && this.currentCol <= end) {
          rangeEach(start, end, (i) => this.selectedCols.push(i));

        } else {
          this.selectedCols.push(this.currentCol);
        }
      } else {
        this.selectedCols.push(this.currentCol);
      }

      this.startOffset = box.left - 6;
      this.startWidth = parseInt(box.width, 10);
      this.handle.style.top = box.top + 'px';
      this.handle.style.left = this.startOffset + this.startWidth + 'px';
      this.handle.style.height = headerHeight + 'px';
      this.hot.rootElement.appendChild(this.handle);
    }
  }

  /**
   * Refresh the resize handle position.
   */
  refreshHandlePosition() {
    this.handle.style.left = this.startOffset + this.currentWidth + 'px';
  }

  /**
   * Set the resize guide position.
   */
  setupGuidePosition() {
    let handleHeight = parseInt(outerHeight(this.handle), 10);
    let handleBottomPosition = parseInt(this.handle.style.top, 10) + handleHeight;
    let maximumVisibleElementHeight = parseInt(this.hot.view.maximumVisibleElementHeight(0), 10);

    addClass(this.handle, 'active');
    addClass(this.guide, 'active');

    this.guide.style.top = handleBottomPosition + 'px';
    this.guide.style.left = this.handle.style.left;
    this.guide.style.height = (maximumVisibleElementHeight - handleHeight) + 'px';
    this.hot.rootElement.appendChild(this.guide);
  }

  /**
   * Refresh the resize guide position.
   */
  refreshGuidePosition() {
    this.guide.style.left = this.handle.style.left;
  }

  /**
   * Hide both the resize handle and resize guide.
   */
  hideHandleAndGuide() {
    removeClass(this.handle, 'active');
    removeClass(this.guide, 'active');
  }

  /**
   * Check if provided element is considered a column header.
   *
   * @param {HTMLElement} element HTML element.
   * @returns {Boolean}
   */
  checkIfColumnHeader(element) {
    if (element != this.hot.rootElement) {
      let parent = element.parentNode;

      if (parent.tagName === 'THEAD') {
        return true;
      }

      return this.checkIfColumnHeader(parent);
    }

    return false;
  }

  /**
   * Get the TH element from the provided element.
   *
   * @param {HTMLElement} element HTML element.
   * @returns {HTMLElement}
   */
  getTHFromTargetElement(element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return this.getTHFromTargetElement(element.parentNode);
      }
    }

    return null;
  }

  /**
   * 'mouseover' event callback - set the handle position.
   *
   * @private
   * @param {MouseEvent} event
   */
  onMouseOver(event) {
    if (this.checkIfColumnHeader(event.target)) {
      let th = this.getTHFromTargetElement(event.target);

      if (!th) {
        return;
      }

      let colspan = th.getAttribute('colspan');

      if (th && (colspan === null || colspan === 1)) {
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
   */
  afterMouseDownTimeout() {
    const render = () => {
      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all
      this.hot.view.wt.wtOverlays.adjustElementsSize(true);
    };
    const resize = (selectedCol, forceRender) => {
      let hookNewSize = this.hot.runHooks('beforeColumnResize', selectedCol, this.newSize, true);

      if (hookNewSize !== void 0) {
        this.newSize = hookNewSize;
      }

      if (this.hot.getSettings().stretchH === 'all') {
        this.clearManualSize(selectedCol);
      } else {
        this.setManualSize(selectedCol, this.newSize); // double click sets by auto row size plugin
      }

      if (forceRender) {
        render();
      }

      this.saveManualColumnWidths();

      this.hot.runHooks('afterColumnResize', selectedCol, this.newSize, true);
    };

    if (this.dblclick >= 2) {
      let selectedColsLength = this.selectedCols.length;

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
   * @param {MouseEvent} e
   */
  onMouseDown(event) {
    if (hasClass(event.target, 'manualColumnResizer')) {
      this.setupGuidePosition();
      this.pressed = this.hot;

      if (this.autoresizeTimeout === null) {
        this.autoresizeTimeout = setTimeout(() => this.afterMouseDownTimeout(), 500);

        this.hot._registerTimeout(this.autoresizeTimeout);
      }
      this.dblclick++;

      this.startX = pageX(event);
      this.newSize = this.startWidth;
    }
  }

  /**
   * 'mousemove' event callback - refresh the handle and guide positions, cache the new column width.
   *
   * @private
   * @param {MouseEvent} e
   */
  onMouseMove(event) {
    if (this.pressed) {
      this.currentWidth = this.startWidth + (pageX(event) - this.startX);

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
   * @param {MouseEvent} e
   */
  onMouseUp(event) {
    const render = () => {
      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all
      this.hot.view.wt.wtOverlays.adjustElementsSize(true);
    };
    const resize = (selectedCol, forceRender) => {
      this.hot.runHooks('beforeColumnResize', selectedCol, this.newSize);

      if (forceRender) {
        render();
      }

      this.saveManualColumnWidths();

      this.hot.runHooks('afterColumnResize', selectedCol, this.newSize);
    };

    if (this.pressed) {
      this.hideHandleAndGuide();
      this.pressed = false;

      if (this.newSize != this.startWidth) {
        let selectedColsLength = this.selectedCols.length;

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
   * Bind the mouse events.
   *
   * @private
   */
  bindEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'mouseover', (e) => this.onMouseOver(e));
    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', (e) => this.onMouseDown(e));
    this.eventManager.addEventListener(window, 'mousemove', (e) => this.onMouseMove(e));
    this.eventManager.addEventListener(window, 'mouseup', (e) => this.onMouseUp(e));
  }

  /**
   * Cache the current column width.
   *
   * @param {Number} column Column index.
   * @param {Number} width Column width.
   * @returns {Number}
   */
  setManualSize(column, width) {
    width = Math.max(width, 20);

    /**
     *  We need to run col through modifyCol hook, in case the order of displayed columns is different than the order
     *  in data source. For instance, this order can be modified by manualColumnMove plugin.
     */
    column = this.hot.runHooks('modifyCol', column);

    this.manualColumnWidths[column] = width;

    return width;
  }

  /**
   * Clear cache for the current column index.
   *
   * @param {Number} column Column index.
   */
  clearManualSize(column) {
    column = this.hot.runHooks('modifyCol', column);

    this.manualColumnWidths[column] = void 0;
  }

  /**
   * Modify the provided column width, based on the plugin settings
   *
   * @private
   * @param {Number} width Column width.
   * @param {Number} column Column index.
   * @returns {Number}
   */
  onModifyColWidth(width, column) {
    if (this.enabled) {
      column = this.hot.runHooks('modifyCol', column);

      if (this.hot.getSettings().manualColumnResize && this.manualColumnWidths[column]) {
        return this.manualColumnWidths[column];
      }
    }

    return width;
  }

  /**
   * Modify the provided column stretched width. This hook decides if specified column should be stretched or not.
   *
   * @private
   * @param {Number} stretchedWidth Stretched width.
   * @param {Number} column Column index.
   * @returns {Number}
   */
  onBeforeStretchingColumnWidth(stretchedWidth, column) {
    let width = this.manualColumnWidths[column];

    if (width === void 0) {
      width = stretchedWidth;
    }

    return width;
  }

  /**
   * `beforeColumnResize` hook callback.
   *
   * @private
   * @param {Number} currentColumn Index of the resized column.
   * @param {Number} newSize Calculated new column width.
   * @param {Boolean} isDoubleClick Flag that determines whether there was a double-click.
   */
  onBeforeColumnResize() {
    // clear the header height cache information
    this.hot.view.wt.wtViewport.hasOversizedColumnHeadersMarked = {};
  }
}

export {ManualColumnResize};

registerPlugin('manualColumnResize', ManualColumnResize);
