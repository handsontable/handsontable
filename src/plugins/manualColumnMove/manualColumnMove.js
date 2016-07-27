import BasePlugin from './../_base.js';
import Handsontable from './../../browser';
import {addClass, hasClass, removeClass, outerHeight} from './../../helpers/dom/element';
import {arrayEach, arrayMap} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {eventManager as eventManagerObject} from './../../eventManager';
import {pageX} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';

const privatePool = new WeakMap();

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
     * DOM element representing the move handle.
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
    this.columnPositions = [];
    /**
     * Event Manager object.
     *
     * @type {Object}
     */
    this.eventManager = eventManagerObject(this);

    // Needs to be in the constructor instead of enablePlugin, because the position array needs to be filled regardless of the plugin state.
    this.addHook('init', () => this.onInit());
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
    this.addHook('unmodifyCol', (col) => this.onUnmodifyCol(col));
    this.addHook('afterRemoveCol', (index, amount) => this.onAfterRemoveCol(index, amount));
    this.addHook('afterCreateCol', (index, amount) => this.onAfterCreateCol(index, amount));

    this.registerEvents();

    if (typeof loadedManualColumnPositions != 'undefined') {
      this.columnPositions = loadedManualColumnPositions;

    } else if (Array.isArray(initialSettings)) {
      this.columnPositions = initialSettings;

    } else if (!initialSettings || this.columnPositions === void 0) {
      this.columnPositions = [];
    }

    super.enablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
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
    let pluginSetting = this.hot.getSettings().manualColumnMove;

    if (Array.isArray(pluginSetting)) {
      this.unregisterEvents();
      this.columnPositions = [];
    }

    super.disablePlugin();
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'mouseover', (event) => this.onMouseOver(event));
    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', (event) => this.onMouseDown(event));
    this.eventManager.addEventListener(window, 'mousemove', (event) => this.onMouseMove(event));
    this.eventManager.addEventListener(window, 'mouseup', (event) => this.onMouseUp(event));
  }

  /**
   * Unbind the events used by the plugin.
   *
   * @private
   */
  unregisterEvents() {
    this.eventManager.clear();
  }

  /**
   * Save the manual column positions.
   */
  saveManualColumnPositions() {
    Handsontable.hooks.run(this.hot, 'persistentStateSave', 'manualColumnPositions', this.columnPositions);
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
   * Complete the manual column positions array to match its length to the column count.
   */
  completeSettingsArray() {
    let columnCount = this.hot.countCols();

    if (this.columnPositions.length === columnCount) {
      return;
    }

    rangeEach(0, columnCount - 1, (i) => {
      if (this.columnPositions.indexOf(i) === -1) {
        this.columnPositions.push(i);
      }
    });
  }

  /**
   * Setup the moving handle position.
   *
   * @param {HTMLElement} TH Currently processed TH element.
   */
  setupHandlePosition(TH) {
    this.currentTH = TH;
    let priv = privatePool.get(this);
    let col = this.hot.view.wt.wtTable.getCoords(TH).col; // getCoords returns WalkontableCellCoords
    let headerHeight = outerHeight(this.currentTH);

    if (col >= 0) { // if not row header
      let box = this.currentTH.getBoundingClientRect();
      priv.currentCol = col;

      priv.startOffset = box.left;
      this.handleElement.style.top = box.top + 'px';
      this.handleElement.style.left = priv.startOffset + 'px';
      this.handleElement.style.height = headerHeight + 'px';
      this.hot.rootElement.appendChild(this.handleElement);
    }
  }

  /**
   * Refresh the moving handle position.
   *
   * @param {HTMLElement} TH TH element with the handle.
   * @param {Number} delta Difference between the related columns.
   */
  refreshHandlePosition(TH, delta) {
    let box = TH.getBoundingClientRect();
    let handleWidth = 6;

    if (delta > 0) {
      this.handleElement.style.left = (box.left + box.width - handleWidth) + 'px';
    } else {
      this.handleElement.style.left = box.left + 'px';
    }
  }

  /**
   * Setup the moving handle position.
   */
  setupGuidePosition() {
    let box = this.currentTH.getBoundingClientRect();
    let priv = privatePool.get(this);
    let handleHeight = parseInt(outerHeight(this.handleElement), 10);
    let handleBottomPosition = parseInt(this.handleElement.style.top, 10) + handleHeight;
    let maximumVisibleElementHeight = parseInt(this.hot.view.maximumVisibleElementHeight(0), 10);

    addClass(this.handleElement, 'active');
    addClass(this.guideElement, 'active');

    this.guideElement.style.width = box.width + 'px';
    this.guideElement.style.height = (maximumVisibleElementHeight - handleHeight) + 'px';
    this.guideElement.style.top = handleBottomPosition + 'px';
    this.guideElement.style.left = priv.startOffset + 'px';
    this.hot.rootElement.appendChild(this.guideElement);
  }

  /**
   * Refresh the moving guide position.
   *
   * @param {Number} diff Difference between the starting and current cursor position.
   */
  refreshGuidePosition(diff) {
    let priv = privatePool.get(this);

    this.guideElement.style.left = priv.startOffset + diff + 'px';
  }

  /**
   * Hide both the moving handle and the moving guide.
   */
  hideHandleAndGuide() {
    removeClass(this.handleElement, 'active');
    removeClass(this.guideElement, 'active');
  }

  /**
   * Check if the provided element is in the column header.
   *
   * @param {HTMLElement} element The DOM element to be checked.
   * @returns {Boolean}
   */
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

  /**
   * Create the initial column position data.
   *
   * @param {Number} len The desired length of the array.
   */
  createPositionData(len) {
    let positionArr = this.columnPositions;

    if (positionArr.length < len) {
      rangeEach(positionArr.length, len - 1, (i) => {
        positionArr[i] = i;
      });
    }
  }

  /**
   * Get the TH parent element from the provided DOM element.
   *
   * @param {HTMLElement} element The DOM element to work on.
   * @returns {HTMLElement|null} The TH element or null, if element has no TH parents.
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
   * Change the column position. It puts the `columnIndex` column after the `destinationIndex` column.
   *
   * @param {Number} columnIndex Index of the column to move.
   * @param {Number} destinationIndex Index of the destination column.
   */
  changeColumnPositions(columnIndex, destinationIndex) {
    let maxLength = Math.max(columnIndex, destinationIndex);

    if (maxLength > this.columnPositions.length - 1) {
      this.createPositionData(maxLength + 1);
    }

    this.columnPositions.splice(destinationIndex, 0, this.columnPositions.splice(columnIndex, 1)[0]);
  }

  /**
   * Get the visible column index from the provided logical index.
   *
   * @param {Number} column Logical column index.
   * @returns {Number|undefined} Visible column index.
   */
  getVisibleColumnIndex(column) {
    const position = this.columnPositions.indexOf(column);

    return position === -1 ? void 0 : position;
  }

  /**
   * Get the logical column index from the provided visible index.
   *
   * @param {Number} column Visible column index.
   * @returns {Number|undefined} Logical column index.
   */
  getLogicalColumnIndex(column) {
    return this.columnPositions[column];
  }

  /**
   * 'mouseover' event callback.
   *
   * @private
   * @param {MouseEvent} event The event object.
   */
  onMouseOver(event) {
    let priv = privatePool.get(this);

    if (this.checkColumnHeader(event.target)) {
      let th = this.getTHFromTargetElement(event.target);

      if (th) {
        if (priv.pressed) {
          let col = this.hot.view.wt.wtTable.getCoords(th).col;

          if (col >= 0) { // not TH above row header
            priv.endCol = col;
            this.refreshHandlePosition(th, priv.endCol - priv.startCol);
          }

        } else {
          this.setupHandlePosition(th);
        }
      }
    }
  }

  /**
   * 'mousedown' event callback.
   *
   * @private
   * @param {MouseEvent} event The event object.
   */
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

  /**
   * 'mousemove' event callback.
   *
   * @private
   * @param {MouseEvent} event The event object.
   */
  onMouseMove(event) {
    let priv = privatePool.get(this);

    if (priv.pressed) {
      this.refreshGuidePosition(pageX(event) - priv.startX);
    }
  }

  /**
   * 'mouseup' event callback.
   *
   * @private
   * @param {MouseEvent} event The event object.
   */
  onMouseUp(event) {
    let priv = privatePool.get(this);

    if (priv.pressed) {
      this.hideHandleAndGuide();
      priv.pressed = false;

      this.createPositionData(this.hot.countCols());
      this.changeColumnPositions(priv.startCol, priv.endCol);

      Handsontable.hooks.run(this.hot, 'beforeColumnMove', priv.startCol, priv.endCol);

      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all

      this.saveManualColumnPositions();

      Handsontable.hooks.run(this.hot, 'afterColumnMove', priv.startCol, priv.endCol);

      this.setupHandlePosition(this.currentTH);
    }
  }

  /**
   * 'modifyCol' hook callback.
   *
   * @private
   * @param {Number} col Column index.
   * @returns {Number} Modified column index.
   */
  onModifyCol(col) {
    return this.getLogicalColumnIndex(col);
  }

  /**
   * 'unmodifyCol' hook callback.
   *
   * @private
   * @param {Number} col Column index.
   * @returns {Number} Unmodified column index.
   */
  onUnmodifyCol(col) {
    return this.getVisibleColumnIndex(col);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {Number} index Index of the removed column.
   * @param {Number} amount Amount of removed columns.
   */
  onAfterRemoveCol(index, amount) {
    if (!this.isEnabled()) {
      return;
    }

    let rmindx;
    let colpos = this.columnPositions;

    // We have removed columns, we also need to remove the indicies from manual column array
    rmindx = colpos.splice(index, amount);

    // We need to remap manualColPositions so it remains constant linear from 0->ncols
    colpos = arrayMap(colpos, function(value, index) {
      let i, newpos = value;

      arrayEach(rmindx, (elem, index) => {
        if (value > elem) {
          newpos--;
        }
      });

      return newpos;
    });

    this.columnPositions = colpos;
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {Number} index Index of the created column.
   * @param {Number} amount Amount of created columns.
   */
  onAfterCreateCol(index, amount) {
    if (!this.isEnabled()) {
      return;
    }

    let colpos = this.columnPositions;

    if (!colpos.length) {
      return;
    }

    let addindx = [];

    rangeEach(0, amount - 1, (i) => {
      addindx.push(index + i);
    });

    if (index >= colpos.length) {
      colpos = colpos.concat(addindx);

    } else {
      // We need to remap manualColPositions so it remains constant linear from 0->ncols
      colpos = arrayMap(colpos, function(value, ind) {
        return (value >= index) ? (value + amount) : value;
      });

      // We have added columns, we also need to add new indicies to column position array
      colpos.splice.apply(colpos, [index, 0].concat(addindx));
    }

    this.columnPositions = colpos;
  }

  /**
   * `init` hook callback.
   */
  onInit() {
    this.completeSettingsArray();
  }

}

export {ManualColumnMove};

registerPlugin('manualColumnMove', ManualColumnMove);
Handsontable.hooks.register('beforeColumnMove');
Handsontable.hooks.register('afterColumnMove');
Handsontable.hooks.register('unmodifyCol');
