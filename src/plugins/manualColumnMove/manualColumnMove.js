import BasePlugin from './../_base.js';
import {addClass, hasClass, removeClass} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {pageX, pageY} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';

const privatePool = new WeakMap();

// TODO: reloading the demo enables the manual column resize plugin

/**
 * @description
 * Handsontable ManualColumnMove
 *
 * Has 2 UI components:
 * * handle - the draggable element that sets the desired position of the column,
 * * guide - the helper guide that shows the desired position as a vertical guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 *
 * @private
 * @class ManualColumnMove
 * @plugin ManualColumnMove
 */
class ManualColumnMove extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    privatePool.set(this, {
      guideClassName: 'manualColumnMoverGuide',
      handleClassName: 'manualColumnMover',
      startOffset: null,
      pressed: null,
      startCol: null,
      endCol: null,
      currentCol: null,
      startX: null,
      startY: null
    });

    /**
     * DOM element representing the vertical guide line.
     *
     * @type {HTMLElement}
     */
    this.guideElement = null;
    /**
     * DOM element representing the vertical guide line.
     *
     * @type {HTMLElement}
     */
    this.handleElement = null;
    /**
     * Currently processed TH element.
     *
     * @type {HTMLElement}
     */
    this.currentTH = null;
    /**
     * Manual column positions array.
     *
     * @type {Array}
     */
    this.manualColumnPositions = [];
    this.pluginUsages = [];
    /**
     * Event Manager object.
     *
     * @type {Object}
     */
    this.eventManager = eventManagerObject(this);
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualColumnMove;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    let priv = privatePool.get(this);
    let initialSettings = this.hot.getSettings().manualColumnMove;
    let loadedManualColumnPositions = this.loadManualColumnPositions();

    this.handleElement = document.createElement('DIV');
    this.handleElement.className = priv.handleClassName;

    this.guideElement = document.createElement('DIV');
    this.guideElement.className = priv.guideClassName;

    this.addHook('modifyCol', (col) => this.onModifyCol(col));
    this.addHook('afterRemoveCol', (index, amount) => this.afterRemoveCol(index, amount));
    this.addHook('afterCreateCol', (index, amount) => this.afterCreateCol(index, amount));

    this.bindEvents();

    if (typeof loadedManualColumnPositions != 'undefined') {
      this.manualColumnPositions = loadedManualColumnPositions;

    } else if (Array.isArray(initialSettings)) {
      this.manualColumnPositions = initialSettings;

    } else if (!initialSettings || this.manualColumnPositions === void 0) {
      this.manualColumnPositions = [];
    }

    this.pluginUsages.push('manualColumnMove');

    super.enablePlugin();
  }

  /**
   * Update the plugin.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    let otherPluginsInUse = this.pluginUsages.length > 1;
    let pluginSetting = this.hot.getSettings().manualColumnMove;

    if (!otherPluginsInUse && Array.isArray(pluginSetting)) {
      this.unbindEvents();
      this.manualColumnPositions = [];
      this.pluginUsages = [];
    }

    super.disablePlugin();
  }

  /**
   * Bind the events used by the plugin.
   */
  bindEvents() {
    let priv = privatePool.get(this);

    this.eventManager.addEventListener(this.hot.rootElement, 'mouseover', (event) => this.onMouseOver(event));
    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', (event) => this.onMouseDown(event));
    this.eventManager.addEventListener(window, 'mousemove', (event) => this.onMouseMove(event));
    this.eventManager.addEventListener(window, 'mouseup', (event) => this.onMouseUp(event));
  }

  /**
   * Unbind the events used by the plugin.
   */
  unbindEvents() {
    this.eventManager.clear();
  }

  /**
   * Save the manual column positions.
   */
  saveManualColumnPositions() {
    Handsontable.hooks.run(this.hot, 'persistentStateSave', 'manualColumnPositions', this.manualColumnPositions);
  }

  /**
   * Load the manual column positions.
   *
   * @returns {Object} Stored state.
   */
  loadManualColumnPositions() {
    let storedState = {};

    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'manualColumnPositions', storedState);

    return storedState.value;
  }

  /**
   * Setup the moving handle position.
   *
   * @param {HTMLElement} TH Currently processed TH element.
   */
  setupHandlePosition(TH) {
    let priv = privatePool.get(this);
    let col = this.hot.view.wt.wtTable.getCoords(TH).col; // getCoords returns WalkontableCellCoords
    this.currentTH = TH;

    if (col >= 0) { // if not row header
      let box = this.currentTH.getBoundingClientRect();
      priv.currentCol = col;

      priv.startOffset = box.left;
      this.handleElement.style.top = box.top + 'px';
      this.handleElement.style.left = priv.startOffset + 'px';
      this.hot.rootElement.appendChild(this.handleElement);
    }
  }

  refreshHandlePosition(TH, delta) {
    let box = TH.getBoundingClientRect();
    let handleWidth = 6;

    if (delta > 0) {
      this.handleElement.style.left = (box.left + box.width - handleWidth) + 'px';
    } else {
      this.handleElement.style.left = box.left + 'px';
    }
  }

  setupGuidePosition() {
    let box = this.currentTH.getBoundingClientRect();
    let priv = privatePool.get(this);

    addClass(this.handleElement, 'active');
    addClass(this.guideElement, 'active');

    this.guideElement.style.width = box.width + 'px';
    this.guideElement.style.height = this.hot.view.maximumVisibleElementHeight(0) + 'px';
    this.guideElement.style.top = this.handleElement.style.top;
    this.guideElement.style.left = priv.startOffset + 'px';
    this.hot.rootElement.appendChild(this.guideElement);
  }

  refreshGuidePosition(diff) {
    let priv = privatePool.get(this);

    this.guideElement.style.left = priv.startOffset + diff + 'px';
  }

  hideHandleAndGuide() {
    removeClass(this.handleElement, 'active');
    removeClass(this.guideElement, 'active');
  }

  checkColumnHeader(element) {
    if (element != this.hot.rootElement) {
      let parent = element.parentNode;

      if (parent.tagName === 'THEAD') {
        return true;
      }

      return this.checkColumnHeader(parent);
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

  createPositionData(positionArr, len) {
    if (positionArr.length < len) {
      for (var i = positionArr.length; i < len; i++) {
        positionArr[i] = i;
      }
    }
  }

  onMouseOver(event) {
    let priv = privatePool.get(this);

    if (this.checkColumnHeader(event.target)) {
      let th = this.getTHFromTargetElement(event.target);

      if (th) {
        if (priv.pressed) {
          let col = this.hot.view.wt.wtTable.getCoords(th).col;

          if (col >= 0) { // not TH above row header
            priv.endCol = col;
            this.refreshHandlePosition(event.target, priv.endCol - priv.startCol);
          }

        } else {
          this.setupHandlePosition(th);
        }
      }
    }
  }

  onMouseDown(event) {
    let priv = privatePool.get(this);

    if (hasClass(event.target, priv.handleClassName)) {
      priv.startX = pageX(event);
      this.setupGuidePosition();

      priv.pressed = this.hot;
      priv.startCol = priv.currentCol;
      priv.endCol = priv.currentCol;
    }
  }

  onMouseMove(event) {
    let priv = privatePool.get(this);

    if (priv.pressed) {
      this.refreshGuidePosition(pageX(event) - priv.startX);
    }
  }

  onMouseUp(event) {
    let priv = privatePool.get(this);

    if (priv.pressed) {
      this.hideHandleAndGuide();
      priv.pressed = false;

      this.createPositionData(this.manualColumnPositions, this.hot.countCols());
      this.manualColumnPositions.splice(priv.endCol, 0, this.manualColumnPositions.splice(priv.startCol, 1)[0]);

      Handsontable.hooks.run(this.hot, 'beforeColumnMove', priv.startCol, priv.endCol);

      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all

      this.saveManualColumnPositions();

      Handsontable.hooks.run(this.hot, 'afterColumnMove', priv.startCol, priv.endCol);

      this.setupHandlePosition(this.currentTH);
    }
  }

  onModifyCol(col) {
    // TODO test performance: http://jsperf.com/object-wrapper-vs-primitive/2

    if (typeof this.manualColumnPositions[col] === 'undefined') {
      this.createPositionData(this.manualColumnPositions, col + 1);
    }

    return this.manualColumnPositions[col];
  }

  afterRemoveCol(index, amount) {
    if (!this.isEnabled()) {
      return;
    }

    let rmindx;
    let colpos = this.manualColumnPositions;

    // We have removed columns, we also need to remove the indicies from manual column array
    rmindx = colpos.splice(index, amount);

    // We need to remap manualColPositions so it remains constant linear from 0->ncols
    colpos = colpos.map(function(colpos) {
      let i, newpos = colpos;

      for (i = 0; i < rmindx.length; i++) {
        if (colpos > rmindx[i]) {
          newpos--;
        }
      }

      return newpos;
    });

    this.manualColumnPositions = colpos;
  }

  afterCreateCol(index, amount) {
    if (!this.isEnabled()) {
      return;
    }

    let colpos = this.manualColumnPositions;

    if (!colpos.length) {
      return;
    }

    let addindx = [];

    for (var i = 0; i < amount; i++) {
      addindx.push(index + i);
    }

    if (index >= colpos.length) {
      colpos.concat(addindx);

    } else {
      // We need to remap manualColPositions so it remains constant linear from 0->ncols
      colpos = colpos.map(function(colpos) {
        return (colpos >= index) ? (colpos + amount) : colpos;
      });

      // We have added columns, we also need to add new indicies to manualcolumn position array
      colpos.splice.apply(colpos, [index, 0].concat(addindx));
    }

    this.manualColumnPositions = colpos;
  }

}

export {ManualColumnMove};

registerPlugin('manualColumnMove', ManualColumnMove);
Handsontable.hooks.register('beforeColumnMove');
Handsontable.hooks.register('afterColumnMove');
