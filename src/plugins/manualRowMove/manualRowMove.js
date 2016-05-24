import BasePlugin from './../_base.js';
import Handsontable from './../../browser';
import {addClass, hasClass, removeClass, outerWidth} from './../../helpers/dom/element';
import {arrayEach, arrayMap} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {eventManager as eventManagerObject} from './../../eventManager';
import {pageX, pageY} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';

const privatePool = new WeakMap();

/**
 * HandsontableManualRowMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the row
 * - guide - the helper guide that shows the desired position as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 *
 * @class ManualRowMove
 * @plugin ManualRowMove
 */
class ManualRowMove extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    privatePool.set(this, {
      guideClassName: 'manualRowMoverGuide',
      handleClassName: 'manualRowMover',
      startOffset: null,
      pressed: null,
      startRow: null,
      endRow: null,
      currentRow: null,
      startX: null,
      startY: null
    });

    /**
     * DOM element representing the horizontal guide line.
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
    this.rowPositions = [];
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
    return !!this.hot.getSettings().manualRowMove;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    let priv = privatePool.get(this);
    let initialSettings = this.hot.getSettings().manualRowMove;
    let loadedManualRowPositions = this.loadManualRowPositions();

    this.handleElement = document.createElement('DIV');
    this.handleElement.className = priv.handleClassName;

    this.guideElement = document.createElement('DIV');
    this.guideElement.className = priv.guideClassName;

    this.addHook('modifyRow', (row) => this.onModifyRow(row));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('init', () => this.onInit());

    this.registerEvents();

    if (typeof loadedManualRowPositions != 'undefined') {
      this.rowPositions = loadedManualRowPositions;

    } else if (Array.isArray(initialSettings)) {
      this.rowPositions = initialSettings;

    } else if (!initialSettings || this.rowPositions === void 0) {
      this.rowPositions = [];
    }

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
    let pluginSetting = this.hot.getSettings().manualRowMove;

    if (Array.isArray(pluginSetting)) {
      this.unregisterEvents();
      this.rowPositions = [];
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
   * Save the manual row positions.
   */
  saveManualRowPositions() {
    Handsontable.hooks.run(this.hot, 'persistentStateSave', 'manualRowPositions', this.rowPositions);
  }

  /**
   * Load the manual row positions.
   *
   * @returns {Object} Stored state.
   */
  loadManualRowPositions() {
    let storedState = {};

    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'manualRowPositions', storedState);

    return storedState.value;
  }

  /**
   * Complete the manual column positions array to match its length to the column count.
   */
  completeSettingsArray() {
    let rowCount = this.hot.countRows();

    if (this.rowPositions.length === rowCount) {
      return;
    }

    rangeEach(0, rowCount - 1, (i) => {
      if (this.rowPositions.indexOf(i) === -1) {
        this.rowPositions.push(i);
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
    let row = this.hot.view.wt.wtTable.getCoords(TH).row; // getCoords returns WalkontableCellCoords
    let headerWidth = outerWidth(this.currentTH);

    if (row >= 0) { // if not row header
      let box = this.currentTH.getBoundingClientRect();
      priv.currentRow = row;

      priv.startOffset = box.top;
      this.handleElement.style.top = priv.startOffset + 'px';
      this.handleElement.style.left = box.left + 'px';
      this.handleElement.style.width = headerWidth + 'px';
      this.hot.rootElement.appendChild(this.handleElement);
    }
  }

  /**
   * Refresh the moving handle position.
   *
   * @param {HTMLElement} TH TH element with the handle.
   * @param {Number} delta Difference between the related rows.
   */
  refreshHandlePosition(TH, delta) {
    let box = TH.getBoundingClientRect();
    let handleHeight = 6;

    if (delta > 0) {
      this.handleElement.style.top = (box.top + box.height - handleHeight) + 'px';
    } else {
      this.handleElement.style.top = box.top + 'px';
    }
  }

  /**
   * Setup the moving handle position.
   */
  setupGuidePosition() {
    let box = this.currentTH.getBoundingClientRect();
    let priv = privatePool.get(this);
    let handleWidth = parseInt(outerWidth(this.handleElement), 10);
    let handleRightPosition = parseInt(this.handleElement.style.left, 10) + handleWidth;
    let maximumVisibleElementWidth = parseInt(this.hot.view.maximumVisibleElementWidth(0), 10);

    addClass(this.handleElement, 'active');
    addClass(this.guideElement, 'active');

    this.guideElement.style.height = box.height + 'px';
    this.guideElement.style.width = (maximumVisibleElementWidth - handleWidth) + 'px';
    this.guideElement.style.top = priv.startOffset + 'px';
    this.guideElement.style.left = handleRightPosition + 'px';
    this.hot.rootElement.appendChild(this.guideElement);
  }

  /**
   * Refresh the moving guide position.
   *
   * @param {Number} diff Difference between the starting and current cursor position.
   */
  refreshGuidePosition(diff) {
    let priv = privatePool.get(this);

    this.guideElement.style.top = priv.startOffset + diff + 'px';
  }

  /**
   * Hide both the moving handle and the moving guide.
   */
  hideHandleAndGuide() {
    removeClass(this.handleElement, 'active');
    removeClass(this.guideElement, 'active');
  }

  /**
   * Check if the provided element is in the row header.
   *
   * @param {HTMLElement} element The DOM element to be checked.
   * @returns {Boolean}
   */
  checkRowHeader(element) {
    if (element != this.hot.rootElement) {
      let parent = element.parentNode;

      if (parent.tagName === 'TBODY') {
        return true;
      }

      return this.checkRowHeader(parent);
    }

    return false;
  }

  /**
   * Create the initial row position data.
   *
   * @param {Number} len The desired length of the array.
   */
  createPositionData(len) {
    let positionArr = this.rowPositions;

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
   * Change the row position. It puts the `rowIndex` row after the `destinationIndex` row.
   *
   * @param {Number} rowIndex Index of the row to move.
   * @param {Number} destinationIndex Index of the destination row.
   */
  changeRowPositions(rowIndex, destinationIndex) {
    let maxLength = Math.max(rowIndex, destinationIndex);

    if (maxLength > this.rowPositions.length - 1) {
      this.createPositionData(maxLength + 1);
    }

    this.rowPositions.splice(destinationIndex, 0, this.rowPositions.splice(rowIndex, 1)[0]);
  }

  /**
   * Get the visible row index from the provided logical index.
   *
   * @param {Number} row Logical row index.
   * @returns {Number} Visible row index.
   */
  getVisibleRowIndex(row) {
    if (row > this.rowPositions.length - 1) {
      this.createPositionData(row);
    }

    return this.rowPositions.indexOf(row);
  }

  /**
   * Get the logical row index from the provided visible index.
   *
   * @param {Number} row Visible row index.
   * @returns {Number|undefined} Logical row index.
   */
  getLogicalRowIndex(row) {
    return this.rowPositions[row];
  }

  /**
   * 'mouseover' event callback.
   *
   * @private
   * @param {MouseEvent} event The event object.
   */
  onMouseOver(event) {
    let priv = privatePool.get(this);

    if (this.checkRowHeader(event.target)) {
      let th = this.getTHFromTargetElement(event.target);

      if (th) {
        if (priv.pressed) {
          priv.endRow = this.hot.view.wt.wtTable.getCoords(th).row;
          this.refreshHandlePosition(th, priv.endRow - priv.startRow);

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
      priv.startY = pageY(event);
      this.setupGuidePosition();

      priv.pressed = this.hot;
      priv.startRow = priv.currentRow;
      priv.endRow = priv.currentRow;
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
      this.refreshGuidePosition(pageY(event) - priv.startY);
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

      this.createPositionData(this.hot.countRows());
      this.changeRowPositions(priv.startRow, priv.endRow);

      Handsontable.hooks.run(this.hot, 'beforeRowMove', priv.startRow, priv.endRow);

      this.hot.forceFullRender = true;
      this.hot.view.render(); // updates all

      this.saveManualRowPositions();

      Handsontable.hooks.run(this.hot, 'afterRowMove', priv.startRow, priv.endRow);

      this.setupHandlePosition(this.currentTH);
    }
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} row Row index.
   * @returns {Number} Modified row index.
   */
  onModifyRow(row) {
    if (typeof this.getVisibleRowIndex(row) === 'undefined') {
      this.createPositionData(row + 1);
    }

    return this.getLogicalRowIndex(row);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {Number} index Index of the removed row.
   * @param {Number} amount Amount of removed rows.
   */
  onAfterRemoveRow(index, amount) {
    if (!this.isEnabled()) {
      return;
    }

    let rmindx;
    let rowpos = this.rowPositions;

    // We have removed rows, we also need to remove the indicies from manual row array
    rmindx = rowpos.splice(index, amount);

    // We need to remap rowPositions so it remains constant linear from 0->nrows
    rowpos = arrayMap(rowpos, function(value, index) {
      let newpos = value;

      arrayEach(rmindx, (elem, index) => {
        if (value > elem) {
          newpos--;
        }
      });

      return newpos;
    });

    this.rowPositions = rowpos;
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {Number} index Index of the created row.
   * @param {Number} amount Amount of created rows.
   */
  onAfterCreateRow(index, amount) {
    if (!this.isEnabled()) {
      return;
    }

    let rowpos = this.rowPositions;

    if (!rowpos.length) {
      return;
    }

    let addindx = [];

    for (var i = 0; i < amount; i++) {
      addindx.push(index + i);
    }

    if (index >= rowpos.length) {
      rowpos.concat(addindx);

    } else {
      // We need to remap rowPositions so it remains constant linear from 0->nrows
      rowpos = arrayMap(rowpos, function(value, ind) {
        return (value >= index) ? (value + amount) : value;
      });

      // We have added rows, we also need to add new indicies to manualrow position array
      rowpos.splice.apply(rowpos, [index, 0].concat(addindx));
    }

    this.rowPositions = rowpos;
  }

  /**
   * `init` hook callback.
   */
  onInit() {
    this.completeSettingsArray();
  }

}

export {ManualRowMove};

registerPlugin('ManualRowMove', ManualRowMove);
Handsontable.hooks.register('beforeRowMove');
Handsontable.hooks.register('afterRowMove');
