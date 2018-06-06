import BasePlugin from './../_base.js';
import Hooks from './../../pluginHooks';
import {arrayEach, arrayReduce} from './../../helpers/array';
import {addClass, removeClass, offset} from './../../helpers/dom/element';
import {rangeEach} from './../../helpers/number';
import EventManager from './../../eventManager';
import {registerPlugin} from './../../plugins';
import RowsMapper from './rowsMapper';
import BacklightUI from './ui/backlight';
import GuidelineUI from './ui/guideline';

import './manualRowMove.css';

Hooks.getSingleton().register('beforeRowMove');
Hooks.getSingleton().register('afterRowMove');
Hooks.getSingleton().register('unmodifyRow');

const privatePool = new WeakMap();
const CSS_PLUGIN = 'ht__manualRowMove';
const CSS_SHOW_UI = 'show-ui';
const CSS_ON_MOVING = 'on-moving--rows';
const CSS_AFTER_SELECTION = 'after-selection--rows';

/**
 * @plugin ManualRowMove
 *
 * @description
 * This plugin allows to change rows order.
 *
 * API:
 * - `moveRow` - move single row to the new position.
 * - `moveRows` - move many rows (as an array of indexes) to the new position.
 * - `dragRow` - drag single row to the new position.
 * - `dragRows` - drag many rows (as an array of indexes) to the new position.
 *
 * [Documentation](/demo-moving.html#manualRowMove) explain differences between drag and move actions. Please keep in mind that if you want apply visual changes,
 * you have to call manually the `render` method on the instance of Handsontable.
 *
 * UI components:
 * - `backlight` - highlight of selected rows.
 * - `guideline` - line which shows where rows has been moved.
 *
 * @class ManualRowMove
 * @plugin ManualRowMove
 */
class ManualRowMove extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Set up WeakMap of plugin to sharing private parameters;
     */
    privatePool.set(this, {
      rowsToMove: [],
      pressed: void 0,
      target: {
        eventPageY: void 0,
        coords: void 0,
        TD: void 0,
        row: void 0
      },
      cachedDropIndex: void 0
    });

    /**
     * List of last removed row indexes.
     *
     * @private
     * @type {Array}
     */
    this.removedRows = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
    /**
     * Event Manager object.
     *
     * @type {Object}
     */
    this.eventManager = new EventManager(this);
    /**
     * Backlight UI object.
     *
     * @type {Object}
     */
    this.backlight = new BacklightUI(hotInstance);
    /**
     * Guideline UI object.
     *
     * @type {Object}
     */
    this.guideline = new GuidelineUI(hotInstance);
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualRowMove;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('beforeOnCellMouseDown', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseDown(event, coords, TD, blockCalculations));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations));
    this.addHook('afterScrollHorizontally', () => this.onAfterScrollHorizontally());
    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('beforeRemoveRow', (index, amount) => this.onBeforeRemoveRow(index, amount));
    this.addHook('afterRemoveRow', () => this.onAfterRemoveRow());
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('unmodifyRow', (row) => this.onUnmodifyRow(row));

    this.registerEvents();

    // TODO: move adding plugin classname to BasePlugin.
    addClass(this.hot.rootElement, CSS_PLUGIN);

    super.enablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.onAfterPluginsInitialized();

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    let pluginSettings = this.hot.getSettings().manualRowMove;

    if (Array.isArray(pluginSettings)) {
      this.rowsMapper.clearMap();
    }

    removeClass(this.hot.rootElement, CSS_PLUGIN);

    this.unregisterEvents();
    this.backlight.destroy();
    this.guideline.destroy();

    super.disablePlugin();
  }

  /**
   * Move a single row to final index position.
   *
   * @param {Number} row Visual row index to be moved.
   * @param {Number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](/demo-moving.html#manualRowMove).
   */
  moveRow(row, finalIndex) {
    this.moveRows([row], finalIndex);
  }

  /**
   * Move multiple rows to final index position.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {Number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](/demo-moving.html#manualRowMove).
   */
  moveRows(rows, finalIndex) {
    const priv = privatePool.get(this);
    const dropIndex = priv.cachedDropIndex;
    const movePossible = this.isMovePossible(rows, finalIndex);
    const beforeMoveHook = this.hot.runHooks('beforeRowMove', rows, finalIndex, dropIndex, movePossible);

    priv.cachedDropIndex = void 0;

    if (beforeMoveHook === false) {
      return;
    }

    if (movePossible) {
      this.rowsMapper.moveItems(rows, finalIndex);
    }

    this.hot.runHooks('afterRowMove', rows, finalIndex, dropIndex, movePossible, movePossible && this.isRowOrderChanged(rows, finalIndex));
  }

  /**
   * Drag a single row to drop index position.
   *
   * @param {Number} row Visual row index to be dragged.
   * @param {Number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](/demo-moving.html#manualRowMove).
   */
  dragRow(row, dropIndex) {
    this.dragRows([row], dropIndex);
  }

  /**
   * Drag multiple rows to drop index position.
   *
   * @param {Array} rows Array of visual row indexes to be dragged.
   * @param {Number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](/demo-moving.html#manualRowMove).
   */
  dragRows(rows, dropIndex) {
    const finalIndex = this.countFinalIndex(rows, dropIndex);
    const priv = privatePool.get(this);

    priv.cachedDropIndex = dropIndex;

    this.moveRows(rows, finalIndex);
  }

  /**
   * Indicates if it's possible to move rows to the desired position. Some of the actions aren't possible, i.e. you can’t move more than one element to the last position.
   *
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {Number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](/demo-moving.html#manualRowMove).
   * @returns {Boolean}
   */
  isMovePossible(movedRows, finalIndex) {
    // An attempt to transfer more rows to start destination than is possible (only when moving from the top to the bottom).
    const tooHighDestinationIndex = movedRows.length + finalIndex > this.rowsMapper._arrayMap.length;

    const tooLowDestinationIndex = finalIndex < 0;
    const tooLowMovedRowIndex = movedRows.some((movedRow) => movedRow < 0);
    const tooHighMovedRowIndex = movedRows.some((movedRow) => movedRow >= this.rowsMapper._arrayMap.length);

    if (tooHighDestinationIndex || tooLowDestinationIndex || tooLowMovedRowIndex || tooHighMovedRowIndex) {
      return false;
    }

    return true;
  }

  /**
   * Indicates if order of rows was changed.
   *
   * @private
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {Number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](/demo-moving.html#manualRowMove).
   * @returns {Boolean}
   */
  isRowOrderChanged(movedRows, finalIndex) {
    return movedRows.some((row, nrOfMovedElement) => row - nrOfMovedElement !== finalIndex);
  }

  /**
   * Count the final row index from the drop index.
   *
   * @private
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {Number} dropIndex Visual row index, being a drop index for the moved rows.
   * @returns {Number} Visual row index, being a start index for the moved rows.
   */
  countFinalIndex(movedRows, dropIndex) {
    const numberOfRowsLowerThanDropIndex = arrayReduce(movedRows, (numberOfRows, currentRowIndex) => {
      if (currentRowIndex < dropIndex) {
        numberOfRows += 1;
      }

      return numberOfRows;
    }, 0);

    return dropIndex - numberOfRowsLowerThanDropIndex;
  }

  /**
   * Correct the cell selection after the move action. Fired only when action was made with a mouse.
   * That means that changing the row order using the API won't correct the selection.
   *
   * @private
   * @param {Number} startRow Visual row index for the start of the selection.
   * @param {Number} endRow Visual row index for the end of the selection.
   */
  changeSelection(startRow, endRow) {
    this.hot.selectRows(startRow, endRow);
  }

  /**
   * Get the sum of the heights of rows in the provided range.
   *
   * @private
   * @param {Number} from Visual row index.
   * @param {Number} to Visual row index.
   * @returns {Number}
   */
  getRowsHeight(from, to) {
    let height = 0;

    for (let i = from; i < to; i++) {
      let rowHeight = this.hot.view.wt.wtTable.getRowHeight(i) || 23;

      height += rowHeight;
    }

    return height;
  }

  /**
   * Load initial settings when persistent state is saved or when plugin was initialized as an array.
   *
   * @private
   */
  initialSettings() {
    let pluginSettings = this.hot.getSettings().manualRowMove;

    if (Array.isArray(pluginSettings)) {
      this.moveRows(pluginSettings, 0);

    } else if (pluginSettings !== void 0) {
      let persistentState = this.persistentStateLoad();

      if (persistentState.length) {
        this.moveRows(persistentState, 0);
      }
    }
  }

  /**
   * Check if the provided row is in the fixedRowsTop section.
   *
   * @private
   * @param {Number} row Visual row index to check.
   * @returns {Boolean}
   */
  isFixedRowTop(row) {
    return row < this.hot.getSettings().fixedRowsTop;
  }

  /**
   * Check if the provided row is in the fixedRowsBottom section.
   *
   * @private
   * @param {Number} row Visual row index to check.
   * @returns {Boolean}
   */
  isFixedRowBottom(row) {
    return row > this.hot.getSettings().fixedRowsBottom;
  }

  /**
   * Save the manual row positions to the persistent state.
   *
   * @private
   */
  persistentStateSave() {
    this.hot.runHooks('persistentStateSave', 'manualRowMove', this.rowsMapper._arrayMap);
  }

  /**
   * Load the manual row positions from the persistent state.
   *
   * @private
   * @returns {Array} Stored state.
   */
  persistentStateLoad() {
    let storedState = {};

    this.hot.runHooks('persistentStateLoad', 'manualRowMove', storedState);

    return storedState.value ? storedState.value : [];
  }

  /**
   * Prepare array of indexes based on actual selection.
   *
   * @private
   * @returns {Array}
   */
  prepareRowsToMoving() {
    let selection = this.hot.getSelectedRangeLast();
    let selectedRows = [];

    if (!selection) {
      return selectedRows;
    }

    let {from, to} = selection;
    let start = Math.min(from.row, to.row);
    let end = Math.max(from.row, to.row);

    rangeEach(start, end, (i) => {
      selectedRows.push(i);
    });

    return selectedRows;
  }

  /**
   * Update the UI visual position.
   *
   * @private
   */
  refreshPositions() {
    let priv = privatePool.get(this);
    let coords = priv.target.coords;
    let firstVisible = this.hot.view.wt.wtTable.getFirstVisibleRow();
    let lastVisible = this.hot.view.wt.wtTable.getLastVisibleRow();
    let fixedRows = this.hot.getSettings().fixedRowsTop;
    let countRows = this.hot.countRows();

    if (coords.row < fixedRows && firstVisible > 0) {
      this.hot.scrollViewportTo(firstVisible - 1);
    }
    if (coords.row >= lastVisible && lastVisible < countRows) {
      this.hot.scrollViewportTo(lastVisible + 1, undefined, true);
    }

    let wtTable = this.hot.view.wt.wtTable;
    let TD = priv.target.TD;
    let rootElementOffset = offset(this.hot.rootElement);
    let tdOffsetTop = this.hot.view.THEAD.offsetHeight + this.getRowsHeight(0, coords.row);
    let mouseOffsetTop = priv.target.eventPageY - rootElementOffset.top + wtTable.holder.scrollTop;
    let hiderHeight = wtTable.hider.offsetHeight;
    let tbodyOffsetTop = wtTable.TBODY.offsetTop;
    let backlightElemMarginTop = this.backlight.getOffset().top;
    let backlightElemHeight = this.backlight.getSize().height;

    if (this.isFixedRowTop(coords.row)) {
      tdOffsetTop += wtTable.holder.scrollTop;
    }

    // todo: fixedRowsBottom
    // if (this.isFixedRowBottom(coords.row)) {
    //
    // }

    if (coords.row < 0) {
      // if hover on colHeader
      priv.target.row = firstVisible > 0 ? firstVisible - 1 : firstVisible;
    } else if ((TD.offsetHeight / 2) + tdOffsetTop <= mouseOffsetTop) {
      // if hover on lower part of TD
      priv.target.row = coords.row + 1;
      // unfortunately first row is bigger than rest
      tdOffsetTop += coords.row === 0 ? TD.offsetHeight - 1 : TD.offsetHeight;

    } else {
      // elsewhere on table
      priv.target.row = coords.row;
    }

    let backlightTop = mouseOffsetTop;
    let guidelineTop = tdOffsetTop;

    if (mouseOffsetTop + backlightElemHeight + backlightElemMarginTop >= hiderHeight) {
      // prevent display backlight below table
      backlightTop = hiderHeight - backlightElemHeight - backlightElemMarginTop;

    } else if (mouseOffsetTop + backlightElemMarginTop < tbodyOffsetTop) {
      // prevent display above below table
      backlightTop = tbodyOffsetTop + Math.abs(backlightElemMarginTop);
    }

    if (tdOffsetTop >= hiderHeight - 1) {
      // prevent display guideline below table
      guidelineTop = hiderHeight - 1;
    }

    let topOverlayHeight = 0;
    if (this.hot.view.wt.wtOverlays.topOverlay) {
      topOverlayHeight = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.TABLE.offsetHeight;
    }

    if (coords.row >= fixedRows && (guidelineTop - wtTable.holder.scrollTop) < topOverlayHeight) {
      this.hot.scrollViewportTo(coords.row);
    }

    this.backlight.setPosition(backlightTop);
    this.guideline.setPosition(guidelineTop);
  }

  /**
   * This method checks arrayMap from rowsMapper and updates the rowsMapper if it's necessary.
   *
   * @private
   */
  updateRowsMapper() {
    let countRows = this.hot.countSourceRows();
    let rowsMapperLen = this.rowsMapper._arrayMap.length;

    if (rowsMapperLen === 0) {
      this.rowsMapper.createMap(countRows || this.hot.getSettings().startRows);

    } else if (rowsMapperLen < countRows) {
      let diff = countRows - rowsMapperLen;

      this.rowsMapper.insertItems(rowsMapperLen, diff);

    } else if (rowsMapperLen > countRows) {
      let maxIndex = countRows - 1;
      let rowsToRemove = [];

      arrayEach(this.rowsMapper._arrayMap, (value, index) => {
        if (value > maxIndex) {
          rowsToRemove.push(index);
        }
      });

      this.rowsMapper.removeItems(rowsToRemove);
    }
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document.documentElement, 'mousemove', (event) => this.onMouseMove(event));
    this.eventManager.addEventListener(document.documentElement, 'mouseup', () => this.onMouseUp());
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
   * Change the behavior of selection / dragging.
   *
   * @private
   * @param {MouseEvent} event
   * @param {CellCoords} coords Visual coordinates.
   * @param {HTMLElement} TD
   * @param {Object} blockCalculations
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    let wtTable = this.hot.view.wt.wtTable;
    let isHeaderSelection = this.hot.selection.isSelectedByRowHeader();
    let selection = this.hot.getSelectedRangeLast();
    let priv = privatePool.get(this);

    if (!selection || !isHeaderSelection || priv.pressed || event.button !== 0) {
      priv.pressed = false;
      priv.rowsToMove.length = 0;
      removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI]);
      return;
    }

    let guidelineIsNotReady = this.guideline.isBuilt() && !this.guideline.isAppended();
    let backlightIsNotReady = this.backlight.isBuilt() && !this.backlight.isAppended();

    if (guidelineIsNotReady && backlightIsNotReady) {
      this.guideline.appendTo(wtTable.hider);
      this.backlight.appendTo(wtTable.hider);
    }

    let {from, to} = selection;
    let start = Math.min(from.row, to.row);
    let end = Math.max(from.row, to.row);

    if (coords.col < 0 && (coords.row >= start && coords.row <= end)) {
      blockCalculations.row = true;
      priv.pressed = true;
      priv.target.eventPageY = event.pageY;
      priv.target.coords = coords;
      priv.target.TD = TD;
      priv.rowsToMove = this.prepareRowsToMoving();

      let leftPos = wtTable.holder.scrollLeft + this.hot.view.wt.wtViewport.getRowHeaderWidth();

      this.backlight.setPosition(null, leftPos);
      this.backlight.setSize(wtTable.hider.offsetWidth - leftPos, this.getRowsHeight(start, end + 1));
      this.backlight.setOffset((this.getRowsHeight(start, coords.row) + event.layerY) * -1, null);

      addClass(this.hot.rootElement, CSS_ON_MOVING);

      this.refreshPositions();

    } else {
      removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      priv.pressed = false;
      priv.rowsToMove.length = 0;
    }
  }

  /**
   * 'mouseMove' event callback. Fired when pointer move on document.documentElement.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   */
  onMouseMove(event) {
    let priv = privatePool.get(this);

    if (!priv.pressed) {
      return;
    }

    // callback for browser which doesn't supports CSS pointer-event: none
    if (event.realTarget === this.backlight.element) {
      let height = this.backlight.getSize().height;
      this.backlight.setSize(null, 0);

      setTimeout(function() {
        this.backlight.setPosition(null, height);
      });
    }

    priv.target.eventPageY = event.pageY;
    this.refreshPositions();
  }

  /**
   * 'beforeOnCellMouseOver' hook callback. Fired when pointer was over cell.
   *
   * @private
   * @param {MouseEvent} event `mouseover` event properties.
   * @param {CellCoords} coords Visual cell coordinates where was fired event.
   * @param {HTMLElement} TD Cell represented as HTMLElement.
   * @param {Object} blockCalculations Object which contains information about blockCalculation for row, column or cells.
   */
  onBeforeOnCellMouseOver(event, coords, TD, blockCalculations) {
    let selectedRange = this.hot.getSelectedRangeLast();
    let priv = privatePool.get(this);

    if (!selectedRange || !priv.pressed) {
      return;
    }

    if (priv.rowsToMove.indexOf(coords.row) > -1) {
      removeClass(this.hot.rootElement, CSS_SHOW_UI);

    } else {
      addClass(this.hot.rootElement, CSS_SHOW_UI);
    }

    blockCalculations.row = true;
    blockCalculations.column = true;
    blockCalculations.cell = true;
    priv.target.coords = coords;
    priv.target.TD = TD;
  }

  /**
   * `onMouseUp` hook callback.
   *
   * @private
   */
  onMouseUp() {
    let priv = privatePool.get(this);
    let target = priv.target.row;
    let rowsLen = priv.rowsToMove.length;

    priv.pressed = false;
    priv.backlightHeight = 0;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.isSelectedByRowHeader()) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }

    if (rowsLen < 1 || target === void 0) {
      return;
    }

    const firstMovedVisualRow = priv.rowsToMove[0];
    const firstMovedPhysicalRow = this.rowsMapper.getValueByIndex(firstMovedVisualRow);

    this.dragRows(priv.rowsToMove, target);

    this.persistentStateSave();
    this.hot.render();

    let selectionStart = this.rowsMapper.getIndexByValue(firstMovedPhysicalRow);
    let selectionEnd = selectionStart + rowsLen - 1;
    this.changeSelection(selectionStart, selectionEnd);

    priv.rowsToMove.length = 0;
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   *
   * @private
   */
  onAfterScrollHorizontally() {
    let wtTable = this.hot.view.wt.wtTable;
    let headerWidth = this.hot.view.wt.wtViewport.getRowHeaderWidth();
    let scrollLeft = wtTable.holder.scrollLeft;
    let posLeft = headerWidth + scrollLeft;

    this.backlight.setPosition(null, posLeft);
    this.backlight.setSize(wtTable.hider.offsetWidth - posLeft);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {Number} index Visual index of the created row.
   * @param {Number} amount Amount of created rows.
   */
  onAfterCreateRow(index, amount) {
    this.rowsMapper.shiftItems(index, amount);
  }

  /**
   * On before remove row listener.
   *
   * @private
   * @param {Number} index Visual row index.
   * @param {Number} amount Defines how many rows removed.
   */
  onBeforeRemoveRow(index, amount) {
    this.removedRows.length = 0;

    if (index !== false) {
      // Collect physical row index.
      rangeEach(index, index + amount - 1, (removedIndex) => {
        this.removedRows.push(this.hot.runHooks('modifyRow', removedIndex, this.pluginName));
      });
    }
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   */
  onAfterRemoveRow() {
    this.rowsMapper.unshiftItems(this.removedRows);
  }

  /**
   * `afterLoadData` hook callback.
   *
   * @private
   */
  onAfterLoadData() {
    this.updateRowsMapper();
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} row Visual Row index.
   * @returns {Number} Physical row index.
   */
  onModifyRow(row, source) {
    if (source !== this.pluginName) {
      let rowInMapper = this.rowsMapper.getValueByIndex(row);
      row = rowInMapper === null ? row : rowInMapper;
    }

    return row;
  }

  /**
   * 'unmodifyRow' hook callback.
   *
   * @private
   * @param {Number} row Physical row index.
   * @returns {Number} Visual row index.
   */
  onUnmodifyRow(row) {
    let indexInMapper = this.rowsMapper.getIndexByValue(row);

    return indexInMapper === null ? row : indexInMapper;
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onAfterPluginsInitialized() {
    this.updateRowsMapper();
    this.initialSettings();
    this.backlight.build();
    this.guideline.build();
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.backlight.destroy();
    this.guideline.destroy();
    this.rowsMapper.destroy();

    super.destroy();
  }
}

registerPlugin('ManualRowMove', ManualRowMove);

export default ManualRowMove;
