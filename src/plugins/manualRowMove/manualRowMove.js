import BasePlugin from './../_base.js';
import Handsontable from './../../browser';
import {addClass, removeClass, offset} from './../../helpers/dom/element';
import {rangeEach} from './../../helpers/number';
import {eventManager as eventManagerObject} from './../../eventManager';
import {isImmediatePropagationStopped} from './../../helpers/dom/event';
import {registerPlugin} from './../../plugins';
import {RowsMapper} from './rowsMapper';
import {BacklightUI} from './ui/backlight';
import {GuidelineUI} from './ui/guideline';

const privatePool = new WeakMap();
const CSS_PLUGIN = 'ht__manualRowMove';
const CSS_SHOWUI = 'show-ui';
const CSS_ONMOVING = 'on-moving--rows';
const CSS_AFTERSELECTION = 'after-selection--rows';

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

    privatePool.set(this, {
      rowsToMove: [],
      pressed: void 0,
      target: {
        event: void 0,
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
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualRowMove;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
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
   * Load initial settings when persistent state is saved or when plugin was initialized as an array.
   */
  initialSettings() {
    let pluginSettings = this.hot.getSettings().manualRowMove;

    if (Array.isArray(pluginSettings)) {
      this.moveRows(0, pluginSettings);

    } else if (pluginSettings !== void 0) {
      let persistantState = this.persistentStateLoad();

      if (persistantState.length) {
        this.moveRows(0, persistantState);
      }
    }
  }
  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document.documentElement, 'mousemove', (event, instance) => this.onMouseMove(event, this));
    this.eventManager.addEventListener(document.documentElement, 'mouseup', (event, instance) => this.onMouseUp(event, this));
  }

  /**
   * Unbind the events used by the plugin.
   *
   * @private
   */
  unregisterEvents() {
    this.eventManager.clear();
  }

  onBeforeColumnSort(column, order) {
    // this.rowsMapper.createMap(this.hot.countRows());
  }

  /**
   * Method for change behavior of selection / dragging.
   *
   * @param {MouseEvent} event
   * @param {WalkontableCellCoords} coords
   * @param {HTMLElement} TD
   * @param {Object} blockCalculations
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    let isHeaderSelection = this.hot.selection.selectedHeader.rows;
    let selection = this.hot.getSelectedRange();
    let priv = privatePool.get(this);

    if (!selection || !isHeaderSelection || priv.pressed || event.button !== 0 || isImmediatePropagationStopped(event)) {
      priv.pressed = false;
      priv.rowsToMove.length = 0;
      removeClass(this.hot.rootElement, [CSS_ONMOVING, CSS_SHOWUI]);
      return;
    }

    let guidelineIsNotReady = this.guideline.isBuilt() && !this.guideline.isAppended();
    let backlightIsNotReady = this.backlight.isBuilt() && !this.backlight.isAppended();

    if (guidelineIsNotReady && backlightIsNotReady) {
      this.guideline.appendTo(this.hot.view.wt.wtTable.hider);
      this.backlight.appendTo(this.hot.view.wt.wtTable.hider);
    }

    let {from, to} = selection;
    let start = Math.min(from.row, to.row);
    let end = Math.max(from.row, to.row);

    if (coords.col < 0 && (coords.row >= start && coords.row <= end)) {
      blockCalculations.row = true;
      priv.pressed = true;
      priv.target.event = event;
      priv.target.coords = coords;
      priv.target.TD = TD;
      priv.rowsToMove = this.prepareRowsToMoving();

      this.backlight.element.style.left = this.hot.view.wt.wtTable.holder.scrollLeft + this.hot.view.wt.wtTable.getColumnWidth(-1) + 'px';
      this.backlight.element.style.width = (this.hot.view.wt.wtTable.hider.offsetWidth - this.hot.view.wt.wtTable.getColumnWidth(-1)) + 'px';
      this.backlight.element.style.height = this.getRowsHeight(start, end + 1) + 'px';
      this.backlight.element.style.marginTop = ((this.getRowsHeight(start, coords.row) + event.layerY) * -1) + 'px';

      addClass(this.hot.rootElement, CSS_ONMOVING);

      this.refreshPositions();

    } else {
      removeClass(this.hot.rootElement, CSS_AFTERSELECTION);
      priv.pressed = false;
      priv.rowsToMove.length = 0;
    }
  }

  /**
   * 'beforeOnCellMouseOver' hook callback. Fired when pointer was over cell.
   *
   * @param {MouseEvent} event `mouseover` event properties.
   * @param {WalkontableCellCoords} coords Cell coordinates where was fired event.
   * @param {HTMLElement} TD Cell represented as HTMLElement.
   * @param {Object} blockCalculations Object which contains information about blockCalculation for row, column or cells.
   */
  onBeforeOnCellMouseOver(event, coords, TD, blockCalculations) {
    let selectedRange = this.hot.getSelectedRange();
    let selection = this.hot.selection;
    let priv = privatePool.get(this);

    if (!selectedRange || !priv.pressed) {
      return;
    }

    if (priv.rowsToMove.indexOf(coords.row) > -1) {
      removeClass(this.hot.rootElement, CSS_SHOWUI);

    } else {
      addClass(this.hot.rootElement, CSS_SHOWUI);
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
   * @param event {MouseEvent} `mouseup` event properties.
   * @param instance {ManualRowMove} Instance of the `manualRowMove` plugin.
   */
  onMouseUp(event, instance) {
    let priv = privatePool.get(instance);
    let blockMoving = {
      rows: false
    };
    priv.pressed = false;
    priv.backlightHeight = 0;

    removeClass(instance.hot.rootElement, [CSS_ONMOVING, CSS_SHOWUI, CSS_AFTERSELECTION]);

    if (instance.hot.selection.selectedHeader.rows) {
      addClass(instance.hot.rootElement, CSS_AFTERSELECTION);
    }
    if (priv.rowsToMove.length < 1) {
      return;
    }

    let target = priv.target.row;

    instance.moveRows(target, priv.rowsToMove, blockMoving);
    instance.persistentStateSave();
    instance.hot.render();

    if (!blockMoving.rows) {
      let selectionStart = instance.rowsMapper.getIndexByValue(priv.rowsToMove[0]);
      let selectionEnd = instance.rowsMapper.getIndexByValue(priv.rowsToMove[priv.rowsToMove.length - 1]);
      instance.changeSelection(selectionStart, selectionEnd);
    }
    priv.rowsToMove.length = 0;
  }

  /**
   * 'mouseMove' event callback. Fired when pointer move on document.documentElement.
   *
   * @param {MouseEvent} event `mousemove` event properties.
   * @param {ManualRowMove} instance Plugin instance.
   */
  onMouseMove(event, instance) {
    let priv = privatePool.get(instance);

    if (!priv.pressed) {
      return;
    }

    // callback for browser which doesn't supports CSS pointer-event: none
    if (event.realTarget === instance.backlight.element) {
      let height = instance.backlight.element.style.height;
      instance.backlight.element.style.height = '0';

      setTimeout(function() {
        instance.backlight.element.style.height = height;
      });
    }

    priv.target.event = event;
    this.refreshPositions();
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   */
  onAfterScrollHorizontally() {
    let headerWidth = this.hot.view.wt.wtTable.getColumnWidth(-1);
    let scrollLeft = this.hot.view.wt.wtTable.holder.scrollLeft;
    let posLeft = headerWidth + scrollLeft;
    this.backlight.element.style.left = posLeft + 'px';
    this.backlight.element.style.width = (this.hot.view.wt.wtTable.hider.offsetWidth - posLeft) + 'px';
  }

  /**
   * Prepare array of indexes based on actual selection.
   *
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
   * Method for moving single rows.
   *
   * @param {Number} target Visual row index as target of moved row.
   * @param {Number} row Visual row index to move.
   */
  moveRow(target, ...row) {
    this.moveRows(target, row);
  }

  /**
   * Method for moving multi rows.
   *
   * @param {Number} target Visual row index as target for moved rows.
   * @param {Array} rows Array of visual rows index to moving.
   * @param {Object} blockMoving Contains information about block native moving.
   */
  moveRows(target, rows, blockMoving = { rows: false }) {
    let rowsLen = rows.length;
    let i = 0;

    Handsontable.hooks.run(this.hot, 'beforeRowMove', rows, target, blockMoving);
    // rewrite visual indexes to logical for save reference after move
    if (!blockMoving.rows) {
      for (i = 0; i < rowsLen; i++) {
        rows[i] = this.rowsMapper.getValueByIndex(rows[i]);
      }

      for (i = 0; i < rowsLen; i++) {
        let actualPosition = this.rowsMapper.getIndexByValue(rows[i]);

        if (actualPosition !== target) {
          this.rowsMapper.moveRow(actualPosition, target + i);
        }
      }
      this.rowsMapper.clearNull();
    }

    Handsontable.hooks.run(this.hot, 'afterRowMove', rows, target);
  }

  /**
   * Select properly rows after move action. Fired only when action was fired by mouse.
   * That's mean change row order by API doesn't change selection.
   *
   * @param {Number} startRow Visual row index for start selection.
   * @param {Number} endRow Visual row index for end selection.
   */
  changeSelection(startRow, endRow) {
    let selection = this.hot.selection;
    let lastColIndex = this.hot.countCols() - 1;

    selection.setRangeStart(new WalkontableCellCoords(startRow, 0));
    selection.setRangeEnd(new WalkontableCellCoords(endRow, lastColIndex), true);
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} row Row index.
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
   * @param {Number} row Row index.
   * @returns {Number} Modified row index.
   */
  onUnmodifyRow(row) {
    return this.rowsMapper.getIndexByValue(row);
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
   * Method for update UI visual position.
   *
   * @private
   */
  refreshPositions() {
    let priv = privatePool.get(this);
    let event = priv.target.event;
    let coords = priv.target.coords;
    let TD = priv.target.TD;
    let rootElementOffset = offset(this.hot.rootElement);
    let tdOffsetTop = this.hot.view.THEAD.offsetHeight + this.getRowsHeight(0, coords.row);
    let mouseOffsetTop = event.pageY - rootElementOffset.top + this.hot.view.wt.wtTable.holder.scrollTop;
    let hiderHeight = this.hot.view.wt.wtTable.hider.offsetHeight;
    let tbodyOffsetTop = this.hot.view.wt.wtTable.TBODY.offsetTop;
    let backlightElemMarginTop = parseInt(this.backlight.element.style.marginTop, 10);
    let backlightElemHeight = parseInt(this.backlight.element.style.height, 10);

    if (this.isFixedRowTop(coords.row)) {
      tdOffsetTop += this.hot.view.wt.wtTable.holder.scrollTop;
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
      tdOffsetTop += TD.offsetHeight;

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

    this.backlight.element.style.top = backlightTop + 'px';
    this.guideline.element.style.top = guidelineTop + 'px';
  }

  /**
   * Save the manual row positions to the persistent state.
   */
  persistentStateSave() {
    Handsontable.hooks.run(this.hot, 'persistentStateSave', 'manualRowMove', this.rowsMapper._arrayMap);
  }

  /**
   * Load the manual row positions from the persistent state.
   *
   * @returns {Array} Stored state.
   */
  persistentStateLoad() {
    let storedState = {};

    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'manualRowMove', storedState);

    return storedState.value ? storedState.value : [];
  }

  /**
   * Helpers for check is row fixed top.
   *
   * @param {Number} row Visual row index to check.
   * @returns {Boolean}
   */
  isFixedRowTop(row) {
    return row < this.hot.getSettings().fixedRowsTop;
  }

  /**
   * Helpers for check is row fixed bottom.
   *
   * @param {Number} row Visual row index to check.
   * @returns {Boolean}
   */
  isFixedRowBottom(row) {
    return row > this.hot.getSettings().fixedRowsBottom;
  }

  /**
   * Helpers for get sum of height of rows range.
   *
   * @param {Number} from Visual row index.
   * @param {Number} to Viusal row index.
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
}

export {ManualRowMove};

registerPlugin('ManualRowMove', ManualRowMove);
Handsontable.hooks.register('beforeRowMove');
Handsontable.hooks.register('afterRowMove');
Handsontable.hooks.register('unmodifyRow');
