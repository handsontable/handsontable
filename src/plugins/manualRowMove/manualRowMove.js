import BasePlugin from './../_base.js';
import Handsontable from './../../browser';
import {arrayEach} from './../../helpers/array';
import {addClass, removeClass, offset} from './../../helpers/dom/element';
import {rangeEach} from './../../helpers/number';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {RowsMapper} from './rowsMapper';
import {BacklightUI} from './ui/backlight';
import {GuidelineUI} from './ui/guideline';

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
 * - moveRow - move single row to the new position.
 * - moveRows - move many rows (as an array of indexes) to the new position.
 *
 * If you want apply visual changes, you have to call manually the render() method on the instance of handsontable.
 *
 * UI components:
 * - backlight - highlight of selected rows.
 * - guideline - line which shows where rows has been moved.
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
      disallowMoving: void 0,
      target: {
        eventPageY: void 0,
        coords: void 0,
        TD: void 0,
        row: void 0
      }
    });

    /**
     * List of last removed row indexes.
     *
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
    this.eventManager = eventManagerObject(this);
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

    this.rowsMapper.createMap(this.hot.countSourceRows());

    this.addHook('beforeOnCellMouseDown', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseDown(event, coords, TD, blockCalculations));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD, blockCalculations) => this.onBeforeOnCellMouseOver(event, coords, TD, blockCalculations));
    this.addHook('afterScrollHorizontally', () => this.onAfterScrollHorizontally());
    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('beforeRemoveRow', (index, amount) => this.onBeforeRemoveRow(index, amount));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('beforeColumnSort', (column, order) => this.onBeforeColumnSort(column, order));
    this.addHook('unmodifyRow', (row) => this.onUnmodifyRow(row));

    this.initialSettings();
    this.backlight.build();
    this.guideline.build();
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

    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.rowsMapper.clearMap();

    removeClass(this.hot.rootElement, CSS_PLUGIN);

    this.unregisterEvents();
    this.backlight.destroy();
    this.guideline.destroy();

    super.disablePlugin();
  }

  /**
   * Move a single row.
   *
   * @param {Number} row Visual row index to be moved.
   * @param {Number} target Visual row index being a target for the moved row.
   */
  moveRow(row, target) {
    this.moveRows([row], target);
  }

  /**
   * Move multiple rows.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {Number} target Visual row index being a target for the moved rows.
   */
  moveRows(rows, target) {
    this.hot.runHooks('beforeRowMove', rows, target);

    // first we need to rewrite an visual indexes to logical for save reference after move
    arrayEach(rows, (row, index, array) => {
      array[index] = this.rowsMapper.getValueByIndex(row);
    });

    // next, when we have got an logical indexes, we can
    arrayEach(rows, (row, index) => {
      let actualPosition = this.rowsMapper.getIndexByValue(row);

      if (actualPosition !== target) {
        this.rowsMapper.moveRow(actualPosition, target + index);
      }
    });

    // after moving we have to clear rowsMapper from null entries
    this.rowsMapper.clearNull();

    this.hot.runHooks('afterRowMove', rows, target);
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
    let selection = this.hot.selection;
    let lastColIndex = this.hot.countCols() - 1;

    selection.setRangeStart(new WalkontableCellCoords(startRow, 0));
    selection.setRangeEnd(new WalkontableCellCoords(endRow, lastColIndex), false);
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
    Handsontable.hooks.run(this.hot, 'persistentStateSave', 'manualRowMove', this.rowsMapper._arrayMap);
  }

  /**
   * Load the manual row positions from the persistent state.
   *
   * @private
   * @returns {Array} Stored state.
   */
  persistentStateLoad() {
    let storedState = {};

    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'manualRowMove', storedState);

    return storedState.value ? storedState.value : [];
  }

  /**
   * Prepare array of indexes based on actual selection.
   *
   * @private
   * @returns {Array}
   */
  prepareRowsToMoving() {
    let selection = this.hot.getSelectedRange();
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
    let wtTable = this.hot.view.wt.wtTable;
    let priv = privatePool.get(this);
    let coords = priv.target.coords;
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

    //todo: fixedRowsBottom
    // if (this.isFixedRowBottom(coords.row)) {
    //
    // }

    if (coords.row < 0) {
      // if hover on colHeader
      priv.target.row = 0;

    } else if (TD.offsetHeight / 2 + tdOffsetTop <= mouseOffsetTop) {
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

    this.backlight.setPosition(backlightTop);
    this.guideline.setPosition(guidelineTop);
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
   * `beforeColumnSort` hook callback. If user uses the sorting, manual row moving is disabled.
   *
   * @private
   * @param {Number} column Column index where soring is present
   * @param {*} order State of sorting. ASC/DESC/None
   */
  onBeforeColumnSort(column, order) {
    let priv = privatePool.get(this);

    priv.disallowMoving = order !== void 0;
  }

  /**
   * Change the behavior of selection / dragging.
   *
   * @private
   * @param {MouseEvent} event
   * @param {WalkontableCellCoords} coords
   * @param {HTMLElement} TD
   * @param {Object} blockCalculations
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    let wtTable = this.hot.view.wt.wtTable;
    let isHeaderSelection = this.hot.selection.selectedHeader.rows;
    let selection = this.hot.getSelectedRange();
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

      let leftPos = wtTable.holder.scrollLeft + wtTable.getColumnWidth(-1);

      this.backlight.setPosition(null, leftPos);
      this.backlight.setSize(wtTable.hider.offsetWidth - leftPos,  this.getRowsHeight(start, end + 1));
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
   * @param {WalkontableCellCoords} coords Cell coordinates where was fired event.
   * @param {HTMLElement} TD Cell represented as HTMLElement.
   * @param {Object} blockCalculations Object which contains information about blockCalculation for row, column or cells.
   */
  onBeforeOnCellMouseOver(event, coords, TD, blockCalculations) {
    let selectedRange = this.hot.getSelectedRange();
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
    priv.pressed = false;
    priv.backlightHeight = 0;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.selectedHeader.rows) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }
    if (priv.rowsToMove.length < 1) {
      return;
    }

    let target = priv.target.row;

    this.moveRows(priv.rowsToMove, target);
    this.persistentStateSave();
    this.hot.render();

    let selectionStart = this.rowsMapper.getIndexByValue(priv.rowsToMove[0]);
    let selectionEnd = this.rowsMapper.getIndexByValue(priv.rowsToMove[priv.rowsToMove.length - 1]);
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
    let headerWidth = wtTable.getColumnWidth(-1);
    let scrollLeft = wtTable.holder.scrollLeft;
    let posLeft = headerWidth + scrollLeft;

    this.backlight.setPosition(null, posLeft);
    this.backlight.setSize(wtTable.hider.offsetWidth - posLeft);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {Number} index Index of the created row.
   * @param {Number} amount Amount of created rows.
   */
  onAfterCreateRow(index, amount) {
    this.rowsMapper.shiftItems(index, amount);
  }

  /**
   * On before remove row listener.
   *
   * @private
   * @param {Number} index Row index.
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
   * @param {Number} index Index of the removed row.
   * @param {Number} amount Amount of removed rows.
   */
  onAfterRemoveRow(index, amount) {
    this.rowsMapper.unshiftItems(this.removedRows);
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} row Visual Row index.
   * @returns {Number} Modified row index.
   */
  onModifyRow(row, source) {
    if (source !== this.pluginName) {
      row = this.rowsMapper.getValueByIndex(row);
    }

    return row;
  }

  /**
   * 'unmodifyRow' hook callback.
   *
   * @private
   * @param {Number} row Visual row index.
   * @returns {Number} Logical row index.
   */
  onUnmodifyRow(row) {
    return this.rowsMapper.getIndexByValue(row);
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.backlight.destroy();
    this.guideline.destroy();

    super.destroy();
  }
}

export {ManualRowMove};

registerPlugin('ManualRowMove', ManualRowMove);
Handsontable.hooks.register('beforeRowMove');
Handsontable.hooks.register('afterRowMove');
Handsontable.hooks.register('unmodifyRow');
