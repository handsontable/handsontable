import BasePlugin from './../_base.js';
import {addClass, hasClass, removeClass} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {pageX, pageY} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';

/**
 * HandsontableManualColumnResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired width of the column
 * - guide - the helper guide that shows the desired width as a vertical guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 *
 * @plugin ManualColumnResize
 */
class ManualColumnResize extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    this.currentTH = null;
    this.currentCol = null;
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
    this.hot.manualColumnWidths = [];
  }

  init() {
    super.init();

    this.handle.className = 'manualColumnResizer';
    this.guide.className = 'manualColumnResizerGuide';
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    super.enablePlugin();

    this.addHook('init', () => this.onInit());
    this.addHook('afterUpdateSettings', () => this.onInit('afterUpdateSettings'));
    this.addHook('modifyColWidth', (width, col) => this.onModifyColWidth(width, col));
    this.addHook('afterDestroy', () => this.unbindEvents());

    Handsontable.hooks.register('beforeColumnResize');
    Handsontable.hooks.register('afterColumnResize');
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
   * Save the current sizes using the persistentState plugin
   */
  saveManualColumnWidths() {
    this.hot.runHooks('persistentStateSave', 'manualColumnWidths', this.hot.manualColumnWidths);
  }

  /**
   * Load the previously saved sizes using the persistentState plugin
   *
   * @returns {Array}
   */
  loadManualColumnWidths() {
    let storedState = {};
    this.hot.runHooks('persistentStateLoad', 'manualColumnWidths', storedState);
    return storedState.value;
  }

  /**
   * Set the resize handle position
   *
   * @param {HTMLElement} TH
   */
  setupHandlePosition(TH) {
    this.currentTH = TH;
    let col = this.hot.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords

    if (col >= 0) { //if not col header
      let box = this.currentTH.getBoundingClientRect();
      this.currentCol = col;
      this.startOffset = box.left - 6;
      this.startWidth = parseInt(box.width, 10);
      this.handle.style.top = box.top + 'px';
      this.handle.style.left = this.startOffset + this.startWidth + 'px';
      this.hot.rootElement.appendChild(this.handle);
    }
  }

  /**
   * Refresh the resize handle position
   */
  refreshHandlePosition() {
    this.handle.style.left = this.startOffset + this.currentWidth + 'px';
  }

  /**
   * Set the resize guide position
   */
  setupGuidePosition() {
    addClass(this.handle, 'active');
    addClass(this.guide, 'active');

    this.guide.style.top = this.handle.style.top;
    this.guide.style.left = this.handle.style.left;
    this.guide.style.height = this.hot.view.maximumVisibleElementHeight(0) + 'px';
    this.hot.rootElement.appendChild(this.guide);
  }

  /**
   * Refresh the resize guide position
   */
  refreshGuidePosition() {
    this.guide.style.left = this.handle.style.left;
  }

  /**
   * Hide both the resize handle and resize guide
   */
  hideHandleAndGuide() {
    removeClass(this.handle, 'active');
    removeClass(this.guide, 'active');
  }

  /**
   * Check if provided element is considered a column header
   *
   * @param {HTMLElement} element
   * @returns {Boolean}
   */
  checkIfColumnHeader(element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'THEAD') {
        return true;
      } else {
        element = element.parentNode;
        return this.checkIfColumnHeader(element);
      }
    }
    return false;
  }

  /**
   * Get the TH element from the provided element
   *
   * @param {HTMLElement} element
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
   * 'mouseover' event callback - set the handle position
   *
   * @param {MouseEvent} e
   */
  onMouseOver(e) {
    if (this.checkIfColumnHeader(e.target)) {
      let th = this.getTHFromTargetElement(e.target);

      if (th) {
        if (!this.pressed) {
          this.setupHandlePosition(th);
        }
      }
    }
  }

  /**
   * Auto-size row after doubleclick - callback
   */
  afterMouseDownTimeout() {
    if (this.dblclick >= 2) {
      let hookNewSize = this.hot.runHooks('beforeColumnResize', this.currentCol, this.newSize, true);

      if (hookNewSize !== void 0) {
        this.newSize = hookNewSize;
      }

      this.setManualSize(this.currentCol, this.newSize); //double click sets auto row size

      this.hot.forceFullRender = true;
      this.hot.view.render(); //updates all
      this.hot.view.wt.wtOverlays.adjustElementsSize(true);

      this.hot.runHooks('afterColumnResize', this.currentCol, this.newSize, true);
    }
    this.dblclick = 0;
    this.autoresizeTimeout = null;
  }

  /**
   * 'mousedown' event callback
   *
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    if (hasClass(e.target, 'manualColumnResizer')) {
      this.setupGuidePosition();
      this.pressed = this.hot;

      if (this.autoresizeTimeout === null) {
        this.autoresizeTimeout = setTimeout(() => this.afterMouseDownTimeout(), 500);

        this.hot._registerTimeout(this.autoresizeTimeout);
      }
      this.dblclick++;

      this.startX = pageX(e);
      this.newSize = this.startWidth;
    }
  }

  /**
   * 'mousemove' event callback - refresh the handle and guide positions, cache the new column width
   *
   * @param {MouseEvent} e
   */
  onMouseMove(e) {
    if (this.pressed) {
      this.currentWidth = this.startWidth + (pageX(e) - this.startX);
      this.newSize = this.setManualSize(this.currentCol, this.currentWidth);
      this.refreshHandlePosition();
      this.refreshGuidePosition();
    }
  }

  /**
   * 'mouseup' event callback - apply the column resizing
   *
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    if (this.pressed) {
      this.hideHandleAndGuide();
      this.pressed = false;

      if (this.newSize != this.startWidth) {
        this.hot.runHooks('beforeColumnResize', this.currentCol, this.newSize);

        this.hot.forceFullRender = true;
        this.hot.view.render(); //updates all
        this.hot.view.wt.wtOverlays.adjustElementsSize(true);

        this.saveManualColumnWidths();

        this.hot.runHooks('afterColumnResize', this.currentCol, this.newSize);
      }

      this.setupHandlePosition(this.currentTH);
    }
  }

  /**
   * Bind the mouse events
   */
  bindEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'mouseover', (e) => this.onMouseOver(e));
    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', (e) => this.onMouseDown(e));
    this.eventManager.addEventListener(window, 'mousemove', (e) => this.onMouseMove(e));
    this.eventManager.addEventListener(window, 'mouseup', (e) => this.onMouseUp(e));
  }

  /**
   * Unbind the mouse events
   */
  unbindEvents() {
    this.eventManager.clear();
  }

  /**
   * Initialize the plugin after Handsontable init or updateSettings
   *
   * @param {String} source
   */
  onInit(source) {
    this.hot.manualColumnWidths = [];

    if (this.enabled) {
      let initialColumnWidths = this.hot.getSettings().manualColumnResize;
      let loadedManualColumnWidths = this.loadManualColumnWidths();


      if (typeof loadedManualColumnWidths != 'undefined') {
        this.hot.manualColumnWidths = loadedManualColumnWidths;
      } else if (Array.isArray(initialColumnWidths)) {
        this.hot.manualColumnWidths = initialColumnWidths;
      } else {
        this.hot.manualColumnWidths = [];
      }

      if (source === void 0) {
        this.bindEvents();
      }
    }
  }

  /**
   * Cache the current column width
   *
   * @param {Number} col
   * @param {Number} width
   * @returns {Number}
   */
  setManualSize(col, width) {
    width = Math.max(width, 20);
    /**
     *  We need to run col through modifyCol hook, in case the order of displayed columns is different than the order
     *  in data source. For instance, this order can be modified by manualColumnMove plugin.
     */
    col = this.hot.runHooks('modifyCol', col);
    this.hot.manualColumnWidths[col] = width;

    return width;
  }

  /**
   * Modify the provided column width, based on the plugin settings
   *
   * @param {Number} width
   * @param {Number} col
   * @returns {Number}
   */
  onModifyColWidth(width, col) {
    if (this.enabled) {
      col = this.hot.runHooks('modifyCol', col);

      if (this.hot.getSettings().manualColumnResize && this.hot.manualColumnWidths[col]) {
        return this.hot.manualColumnWidths[col];
      }
    }

    return width;
  }

}

export {ManualColumnResize};

registerPlugin('manualColumnResize', ManualColumnResize);