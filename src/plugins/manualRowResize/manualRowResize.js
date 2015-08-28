import BasePlugin from './../_base.js';
import {addClass, hasClass, removeClass} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {pageX, pageY} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';

const privatePool = new WeakMap();

/**
 * HandsontableManualRowResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired height of the row
 * - guide - the helper guide that shows the desired height as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 *
 * @plugin ManualRowResize
 */
class ManualRowResize extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);

    this.currentTH = void 0;
    this.currentRow = void 0;
    this.currentHeight = void 0;
    this.newSize = void 0;
    this.startY = void 0;
    this.startHeight = void 0;
    this.startOffset = void 0;
    this.handle = document.createElement('DIV');
    this.guide = document.createElement('DIV');
    this.eventManager = eventManagerObject(this);
    this.pressed = void 0;
    this.dblclick = 0;
    this.autoresizeTimeout = null;
    this.hot.manualRowHeights = [];
  }

  init() {
    super.init();

    this.handle.className = 'manualRowResizer';
    this.guide.className = 'manualRowResizerGuide';
  }

  enablePlugin() {
    this.addHook('init', () => this.onInit());
    this.addHook('afterUpdateSettings', () => this.onInit('afterUpdateSettings'));
    this.addHook('modifyRowHeight', (height, row) => this.modifyRowHeight(height, row));

    Handsontable.hooks.register('beforeRowResize');
    Handsontable.hooks.register('afterRowResize');
  }

  isEnabled() {
    return this.hot.getSettings().manualRowResize;
  }

  saveManualRowHeights() {
    this.hot.runHooks('persistentStateSave', 'manualRowHeights', this.hot.manualRowHeights);
  }

  loadManualRowHeights() {
    let storedState = {};
    this.hot.runHooks('persistentStateLoad', 'manualRowHeights', storedState);
    return storedState.value;
  }

  setupHandlePosition(TH) {
    this.currentTH = TH;
    let row = this.hot.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords

    if (row >= 0) { //if not col header
      let box = this.currentTH.getBoundingClientRect();
      this.currentRow = row;
      this.startOffset = box.top - 6;
      this.startHeight = parseInt(box.height, 10);
      this.handle.style.left = box.left + 'px';
      this.handle.style.top = this.startOffset + this.startHeight + 'px';
      this.hot.rootElement.appendChild(this.handle);
    }
  }

  refreshHandlePosition() {
    this.handle.style.top = this.startOffset + this.currentHeight + 'px';
  }

  setupGuidePosition() {
    addClass(this.handle, 'active');
    addClass(this.guide, 'active');

    this.guide.style.top = this.handle.style.top;
    this.guide.style.left = this.handle.style.left;
    this.guide.style.width = this.hot.view.maximumVisibleElementWidth(0) + 'px';
    this.hot.rootElement.appendChild(this.guide);
  }

  refreshGuidePosition() {
    this.guide.style.top = this.handle.style.top;
  }

  hideHandleAndGuide() {
    removeClass(this.handle, 'active');
    removeClass(this.guide, 'active');
  }

  checkIfRowHeader(element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'TBODY') {
        return true;
      } else {
        element = element.parentNode;
        return this.checkIfRowHeader(element);
      }
    }
    return false;
  }

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

  onMouseOver(e) {
    if (this.checkIfRowHeader(e.target)) {
      let th = this.getTHFromTargetElement(e.target);

      if (th) {
        if (!this.pressed) {
          this.setupHandlePosition(th);
        }
      }
    }
  }

  afterMouseDownTimeout() {
    if (this.dblclick >= 2) {
      let hookNewSize = this.hot.runHooks('beforeRowResize', this.currentRow, this.newSize, true);

      if (hookNewSize !== void 0) {
        this.newSize = hookNewSize;
      }

      this.setManualSize(this.currentRow, this.newSize); //double click sets auto row size

      this.hot.forceFullRender = true;
      this.hot.view.render(); //updates all
      this.hot.view.wt.wtOverlays.adjustElementsSize(true);

      this.hot.runHooks('afterRowResize', this.currentRow, this.newSize, true);
    }
    this.dblclick = 0;
    this.autoresizeTimeout = null;
  }

  onMouseDown(e) {
    if (hasClass(e.target, 'manualRowResizer')) {
      this.setupGuidePosition();
      this.pressed = this.hot;

      if (this.autoresizeTimeout == null) {
        this.autoresizeTimeout = setTimeout(() => this.afterMouseDownTimeout(), 500);

        this.hot._registerTimeout(this.autoresizeTimeout);
      }
      this.dblclick++;

      this.startY = pageY(e);
      this.newSize = this.startHeight;
    }
  }

  onMouseMove(e) {
    if (this.pressed) {
      this.currentHeight = this.startHeight + (pageY(e) - this.startY);
      this.newSize = this.setManualSize(this.currentRow, this.currentHeight);
      this.refreshHandlePosition();
      this.refreshGuidePosition();
    }
  }

  onMouseUp(e) {
    if (this.pressed) {
      this.hideHandleAndGuide();
      this.pressed = false;

      if (this.newSize != this.startHeight) {
        this.hot.runHooks('beforeRowResize', this.currentRow, this.newSize);

        this.hot.forceFullRender = true;
        this.hot.view.render(); //updates all
        this.hot.view.wt.wtOverlays.adjustElementsSize(true);

        this.saveManualRowHeights();

        this.hot.runHooks('afterRowResize', this.currentRow, this.newSize);
      }

      this.setupHandlePosition(this.currentTH);
    }
  }

  bindEvents() {

    this.eventManager.addEventListener(this.hot.rootElement, 'mouseover', (e) => this.onMouseOver(e));

    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', (e) => this.onMouseDown(e));

    this.eventManager.addEventListener(window, 'mousemove', (e) => this.onMouseMove(e));

    this.eventManager.addEventListener(window, 'mouseup', (e) => this.onMouseUp(e));

    this.hot.addHook('afterDestroy', () => this.unbindEvents());
  }

  unbindEvents() {
    this.eventManager.clear();
  }

  onInit(source) {
    this.hot.manualRowHeights = [];

    if (this.isEnabled()) {
      let initialRowHeights = this.hot.getSettings().manualRowResize;
      let loadedManualRowHeights = this.loadManualRowHeights();

      // update plugin usages count for manualColumnPositions
      if (typeof this.hot.manualRowHeightsPluginUsages != 'undefined') {
        this.hot.manualRowHeightsPluginUsages.push('manualRowResize');
      } else {
        this.hot.manualRowHeightsPluginUsages = ['manualRowResize'];
      }

      if (typeof loadedManualRowHeights != 'undefined') {
        this.hot.manualRowHeights = loadedManualRowHeights;
      } else if (Array.isArray(initialRowHeights)) {
        this.hot.manualRowHeights = initialRowHeights;
      } else {
        this.hot.manualRowHeights = [];
      }

      if (source === void 0) {
        this.bindEvents();
      }
    } else {
      let pluginUsagesIndex = this.hot.manualRowHeightsPluginUsages ? this.hot.manualRowHeightsPluginUsages.indexOf('manualRowResize') : -1;

      if (pluginUsagesIndex > -1) {
        this.unbindEvents();
        this.hot.manualRowHeights = [];
        this.hot.manualRowHeightsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  }

  setManualSize(row, height) {
    row = this.hot.runHooks('modifyRow', row);
    this.hot.manualRowHeights[row] = height;

    return height;
  }


  modifyRowHeight(height, row) {
    if (this.hot.getSettings().manualRowResize) {
      row = this.hot.runHooks('modifyRow', row);

      if (this.hot.manualRowHeights[row] !== void 0) {
        return this.hot.manualRowHeights[row];
      }
    }

    return height;
  }

}

export {ManualRowResize};

registerPlugin('manualRowResize', ManualRowResize);
