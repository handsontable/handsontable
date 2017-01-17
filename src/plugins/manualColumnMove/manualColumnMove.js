import BasePlugin from './../_base.js';
import Handsontable from './../../browser';
import {arrayEach} from './../../helpers/array';
import {addClass, removeClass, offset} from './../../helpers/dom/element';
import {rangeEach} from './../../helpers/number';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {ColumnsMapper} from './columnsMapper';
import {BacklightUI} from './ui/backlight';
import {GuidelineUI} from './ui/guideline';

const privatePool = new WeakMap();
const CSS_PLUGIN = 'ht__manualColumnMove';
const CSS_SHOW_UI = 'show-ui';
const CSS_ON_MOVING = 'on-moving--columns';
const CSS_AFTER_SELECTION = 'after-selection--columns';

/**
 * @plugin ManualColumnMove
 *
 * @description
 * This plugin allows to change columns order.
 *
 * API:
 * - moveColumn - move single column to the new position.
 * - moveColumns - move many columns (as an array of indexes) to the new position.
 *
 * If you want apply visual changes, you have to call manually the render() method on the instance of Handsontable.
 *
 * UI components:
 * - backlight - highlight of selected columns.
 * - guideline - line which shows where rows has been moved.
 *
 * @class ManualColumnMove
 * @plugin ManualColumnMove
 */
class ManualColumnMove extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Set up WeakMap of plugin to sharing private parameters;
     */
    privatePool.set(this, {
      columnsToMove: [],
      countCols: 0,
      fixedColumns: 0,
      pressed: void 0,
      disallowMoving: void 0,
      target: {
        eventPageX: void 0,
        coords: void 0,
        TD: void 0,
        col: void 0
      }
    });

    /**
     * List of last removed row indexes.
     *
     * @type {Array}
     */
    this.removedColumns = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @type {RowsMapper}
     */
    this.columnsMapper = new ColumnsMapper(this);
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
    return !!this.hot.getSettings().manualColumnMove;
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
    this.addHook('afterScrollVertically', () => this.onAfterScrollVertically());
    this.addHook('modifyCol', (row, source) => this.onModifyCol(row, source));
    this.addHook('beforeRemoveCol', (index, amount) => this.onBeforeRemoveCol(index, amount));
    this.addHook('afterRemoveCol', (index, amount) => this.onAfterRemoveCol(index, amount));
    this.addHook('afterCreateCol', (index, amount) => this.onAfterCreateCol(index, amount));
    this.addHook('unmodifyCol', (column) => this.onUnmodifyCol(column));

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
    let pluginSettings = this.hot.getSettings().manualColumnMove;

    if (Array.isArray(pluginSettings)) {
      this.columnsMapper.clearMap();
    }

    removeClass(this.hot.rootElement, CSS_PLUGIN);

    this.unregisterEvents();
    this.backlight.destroy();
    this.guideline.destroy();

    super.disablePlugin();
  }

  /**
   * Move a single column.
   *
   * @param {Number} column Visual column index to be moved.
   * @param {Number} target Visual column index being a target for the moved column.
   */
  moveColumn(column, target) {
    this.moveColumns([column], target);
  }

  /**
   * Move multiple columns.
   *
   * @param {Array} columns Array of visual column indexes to be moved.
   * @param {Number} target Visual column index being a target for the moved columns.
   */
  moveColumns(columns, target) {
    let priv = privatePool.get(this);
    let beforeColumnHook = this.hot.runHooks('beforeColumnMove', columns, target);

    priv.disallowMoving = !beforeColumnHook;

    if (beforeColumnHook !== false) {
      // first we need to rewrite an visual indexes to logical for save reference after move
      arrayEach(columns, (column, index, array) => {
        array[index] = this.columnsMapper.getValueByIndex(column);
      });

      // next, when we have got an logical indexes, we can move columns
      arrayEach(columns, (column, index) => {
        let actualPosition = this.columnsMapper.getIndexByValue(column);

        if (actualPosition !== target) {
          this.columnsMapper.moveColumn(actualPosition, target + index);
        }
      });

      // after moving we have to clear columnsMapper from null entries
      this.columnsMapper.clearNull();
    }

    this.hot.runHooks('afterColumnMove', columns, target);
  }

  /**
   * Correct the cell selection after the move action. Fired only when action was made with a mouse.
   * That means that changing the column order using the API won't correct the selection.
   *
   * @private
   * @param {Number} startColumn Visual column index for the start of the selection.
   * @param {Number} endColumn Visual column index for the end of the selection.
   */
  changeSelection(startColumn, endColumn) {
    let selection = this.hot.selection;
    let lastRowIndex = this.hot.countRows() - 1;

    selection.setRangeStartOnly(new WalkontableCellCoords(0, startColumn));
    selection.setRangeEnd(new WalkontableCellCoords(lastRowIndex, endColumn), false);
  }

  /**
   * Get the sum of the widths of columns in the provided range.
   *
   * @private
   * @param {Number} from Visual column index.
   * @param {Number} to Visual column index.
   * @returns {Number}
   */
  getColumnsWidth(from, to) {
    let width = 0;

    for (let i = from; i < to; i++) {
      let columnWidth = 0;

      if (i < 0) {
        columnWidth = this.hot.view.wt.wtTable.getColumnWidth(i) || 0;
      } else {
        columnWidth = this.hot.view.wt.wtTable.getStretchedColumnWidth(i) || 0;
      }

      width += columnWidth;
    }

    return width;
  }

  /**
   * Load initial settings when persistent state is saved or when plugin was initialized as an array.
   *
   * @private
   */
  initialSettings() {
    let pluginSettings = this.hot.getSettings().manualColumnMove;

    if (Array.isArray(pluginSettings)) {
      this.moveColumns(pluginSettings, 0);

    } else if (pluginSettings !== void 0) {
      let persistentState = this.persistentStateLoad();

      if (persistentState.length) {
        this.moveColumns(persistentState, 0);
      }
    }
  }

  /**
   * Check if the provided column is in the fixedColumnsLeft section.
   *
   * @private
   * @param {Number} column Visual column index to check.
   * @returns {Boolean}
   */
  isFixedColumnsLeft(column) {
    return column < this.hot.getSettings().fixedColumnsLeft;
  }

  /**
   * Save the manual column positions to the persistent state.
   *
   * @private
   */
  persistentStateSave() {
    Handsontable.hooks.run(this.hot, 'persistentStateSave', 'manualColumnMove', this.columnsMapper._arrayMap);
  }

  /**
   * Load the manual column positions from the persistent state.
   *
   * @private
   * @returns {Array} Stored state.
   */
  persistentStateLoad() {
    let storedState = {};

    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'manualColumnsMove', storedState);

    return storedState.value ? storedState.value : [];
  }

  /**
   * Prepare array of indexes based on actual selection.
   *
   * @private
   * @returns {Array}
   */
  prepareColumnsToMoving(start, end) {
    let selectedColumns = [];

    rangeEach(start, end, (i) => {
      selectedColumns.push(i);
    });

    return selectedColumns;
  }

  /**
   * Update the UI visual position.
   *
   * @private
   */
  refreshPositions() {
    let priv = privatePool.get(this);
    let firstVisible = this.hot.view.wt.wtTable.getFirstVisibleColumn();
    let lastVisible = this.hot.view.wt.wtTable.getLastVisibleColumn();
    let wtTable = this.hot.view.wt.wtTable;
    let scrollableElement = this.hot.view.wt.wtOverlays.scrollableElement;
    let scrollLeft = typeof scrollableElement.scrollX === 'number' ? scrollableElement.scrollX : scrollableElement.scrollLeft;
    let tdOffsetLeft = this.hot.view.THEAD.offsetLeft + this.getColumnsWidth(0, priv.coordsColumn);
    let mouseOffsetLeft = priv.target.eventPageX - (priv.rootElementOffset - (scrollableElement.scrollX === void 0 ? scrollLeft : 0));
    let hiderWidth = wtTable.hider.offsetWidth;
    let tbodyOffsetLeft = wtTable.TBODY.offsetLeft;
    let backlightElemMarginLeft = this.backlight.getOffset().left;
    let backlightElemWidth = this.backlight.getSize().width;
    let rowHeaderWidth = 0;

    if ((priv.rootElementOffset + wtTable.holder.offsetWidth + scrollLeft) < priv.target.eventPageX) {
      if (priv.coordsColumn < priv.countCols) {
        priv.coordsColumn++;
      }
    }

    if (priv.hasRowHeaders) {
      rowHeaderWidth = this.hot.view.wt.wtOverlays.leftOverlay.clone.wtTable.getColumnHeader(-1).offsetWidth;
    }
    if (this.isFixedColumnsLeft(priv.coordsColumn)) {
      tdOffsetLeft += scrollLeft;
    }
    tdOffsetLeft += rowHeaderWidth;

    if (priv.coordsColumn < 0) {
      // if hover on rowHeader
      if (priv.fixedColumns > 0) {
        priv.target.col = 0;
      } else {
        priv.target.col = firstVisible > 0 ? firstVisible - 1 : firstVisible;
      }

    } else if ((priv.target.TD.offsetWidth / 2 + tdOffsetLeft) <= mouseOffsetLeft) {
      let newCoordsCol = priv.coordsColumn >= priv.countCols ? priv.countCols - 1 : priv.coordsColumn;
      // if hover on right part of TD
      priv.target.col = newCoordsCol + 1;
      // unfortunately first column is bigger than rest
      tdOffsetLeft += priv.target.TD.offsetWidth;

      if (priv.target.col > lastVisible) {
        this.hot.scrollViewportTo(void 0, lastVisible + 1, void 0, true);
      }

    } else {
      // elsewhere on table
      priv.target.col = priv.coordsColumn;

      if (priv.target.col <= firstVisible && priv.target.col >= priv.fixedColumns) {
        this.hot.scrollViewportTo(void 0, firstVisible - 1);
      }
    }

    if (priv.target.col <= firstVisible && priv.target.col >= priv.fixedColumns) {
      this.hot.scrollViewportTo(void 0, firstVisible - 1);
    }

    let backlightLeft = mouseOffsetLeft;
    let guidelineLeft = tdOffsetLeft;

    if (mouseOffsetLeft + backlightElemWidth + backlightElemMarginLeft >= hiderWidth) {
      // prevent display backlight on the right side of the table
      backlightLeft = hiderWidth - backlightElemWidth - backlightElemMarginLeft;

    } else if (mouseOffsetLeft + backlightElemMarginLeft < tbodyOffsetLeft + rowHeaderWidth) {
      // prevent display backlight on the left side of the table
      backlightLeft = tbodyOffsetLeft + rowHeaderWidth + Math.abs(backlightElemMarginLeft);
    }

    if (tdOffsetLeft >= hiderWidth - 1) {
      // prevent display guideline outside the table
      guidelineLeft = hiderWidth - 1;

    } else if (guidelineLeft === 0) {
      // guideline has got `margin-left: -1px` as default
      guidelineLeft = 1;

    } else if (scrollableElement.scrollX !== void 0 && priv.coordsColumn < priv.fixedColumns) {
      guidelineLeft = guidelineLeft - ((priv.rootElementOffset <= scrollableElement.scrollX) ? priv.rootElementOffset : 0);
    }

    this.backlight.setPosition(null, backlightLeft);
    this.guideline.setPosition(null, guidelineLeft);
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
   * @param {WalkontableCellCoords} coords
   * @param {HTMLElement} TD
   * @param {Object} blockCalculations
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    let wtTable = this.hot.view.wt.wtTable;
    let isHeaderSelection = this.hot.selection.selectedHeader.cols;
    let selection = this.hot.getSelectedRange();
    let priv = privatePool.get(this);
    let isSortingElement = event.realTarget.className.indexOf('columnSorting') > -1;

    if (!selection || !isHeaderSelection || priv.pressed || event.button !== 0 || isSortingElement) {
      priv.pressed = false;
      priv.columnsToMove.length = 0;
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
    let start = Math.min(from.col, to.col);
    let end = Math.max(from.col, to.col);

    if (coords.row < 0 && (coords.col >= start && coords.col <= end)) {
      blockCalculations.column = true;
      priv.pressed = true;
      priv.target.eventPageX = event.pageX;
      priv.coordsColumn = coords.col;
      priv.target.TD = TD;
      priv.target.col = coords.col;
      priv.columnsToMove = this.prepareColumnsToMoving(start, end);
      priv.hasRowHeaders = !!this.hot.getSettings().rowHeaders;
      priv.countCols = this.hot.countCols();
      priv.fixedColumns = this.hot.getSettings().fixedColumnsLeft;
      priv.rootElementOffset = offset(this.hot.rootElement).left;

      let countColumnsFrom = priv.hasRowHeaders ? -1 : 0;
      let topPos = wtTable.holder.scrollTop + wtTable.getColumnHeaderHeight(0) + 1;
      let fixedColumns = coords.col < priv.fixedColumns;
      let scrollableElement = this.hot.view.wt.wtOverlays.scrollableElement;
      let wrapperIsWindow = scrollableElement.scrollX ? scrollableElement.scrollX - priv.rootElementOffset : 0;

      let mouseOffset = event.layerX - (fixedColumns ? wrapperIsWindow : 0);
      let leftOffset = Math.abs(this.getColumnsWidth(start, coords.col) + mouseOffset);

      this.backlight.setPosition(topPos, this.getColumnsWidth(countColumnsFrom, start) + leftOffset);
      this.backlight.setSize(this.getColumnsWidth(start, end + 1), wtTable.hider.offsetHeight - topPos);
      this.backlight.setOffset(null, leftOffset * -1);

      addClass(this.hot.rootElement, CSS_ON_MOVING);

    } else {
      removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      priv.pressed = false;
      priv.columnsToMove.length = 0;
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
      let width = this.backlight.getSize().width;
      this.backlight.setSize(0);

      setTimeout(function() {
        this.backlight.setPosition(width);
      });
    }

    priv.target.eventPageX = event.pageX;
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

    if (priv.columnsToMove.indexOf(coords.col) > -1) {
      removeClass(this.hot.rootElement, CSS_SHOW_UI);

    } else {
      addClass(this.hot.rootElement, CSS_SHOW_UI);
    }

    blockCalculations.row = true;
    blockCalculations.column = true;
    blockCalculations.cell = true;
    priv.coordsColumn = coords.col;
    priv.target.TD = TD;
  }

  /**
   * `onMouseUp` hook callback.
   *
   * @private
   */
  onMouseUp() {
    let priv = privatePool.get(this);

    priv.coordsColumn = void 0;
    priv.pressed = false;
    priv.backlightWidth = 0;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.selectedHeader.cols) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }
    if (priv.columnsToMove.length < 1 || priv.target.col === void 0 || priv.columnsToMove.indexOf(priv.target.col) > -1) {
      return;
    }

    this.moveColumns(priv.columnsToMove, priv.target.col);
    this.persistentStateSave();
    this.hot.render();
    this.hot.view.wt.wtOverlays.adjustElementsSize(true);

    if (!priv.disallowMoving) {
      let selectionStart = this.columnsMapper.getIndexByValue(priv.columnsToMove[0]);
      let selectionEnd = this.columnsMapper.getIndexByValue(priv.columnsToMove[priv.columnsToMove.length - 1]);
      this.changeSelection(selectionStart, selectionEnd);
    }

    priv.columnsToMove.length = 0;
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   *
   * @private
   */
  onAfterScrollVertically() {
    let wtTable = this.hot.view.wt.wtTable;
    let headerHeight = wtTable.getColumnHeaderHeight(0) + 1;
    let scrollTop = wtTable.holder.scrollTop;
    let posTop = headerHeight + scrollTop;

    this.backlight.setPosition(posTop);
    this.backlight.setSize(null, wtTable.hider.offsetHeight - posTop);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {Number} index Index of the created column.
   * @param {Number} amount Amount of created columns.
   */
  onAfterCreateCol(index, amount) {
    this.columnsMapper.shiftItems(index, amount);
  }

  /**
   * On before remove column listener.
   *
   * @private
   * @param {Number} index Column index.
   * @param {Number} amount Defines how many columns removed.
   */
  onBeforeRemoveCol(index, amount) {
    this.removedColumns.length = 0;

    if (index !== false) {
      // Collect physical row index.
      rangeEach(index, index + amount - 1, (removedIndex) => {
        this.removedColumns.push(this.hot.runHooks('modifyCol', removedIndex, this.pluginName));
      });
    }
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {Number} index Index of the removed column.
   * @param {Number} amount Amount of removed columns.
   */
  onAfterRemoveCol(index, amount) {
    this.columnsMapper.unshiftItems(this.removedColumns);
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} column Visual column index.
   * @returns {Number} Modified column index.
   */
  onModifyCol(column, source) {
    if (source !== this.pluginName) {
      // ugly fix for try to insert new, needed columns after pasting data
      let columnInMapper = this.columnsMapper.getValueByIndex(column);
      column = columnInMapper === null ? column : columnInMapper;
    }

    return column;
  }

  /**
   * 'unmodifyCol' hook callback.
   *
   * @private
   * @param {Number} column Visual column index.
   * @returns {Number} Logical column index.
   */
  onUnmodifyCol(column) {
    let indexInMapper = this.columnsMapper.getIndexByValue(column);
    column = indexInMapper === null ? column : indexInMapper;

    return column;
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onAfterPluginsInitialized() {
    let countCols = this.hot.countCols();
    let columnsMapperLen = this.columnsMapper._arrayMap.length;

    if (columnsMapperLen === 0) {
      this.columnsMapper.createMap(this.hot.countSourceCols() || this.hot.getSettings().startCols);

    } else if (columnsMapperLen < countCols) {
      let diff = countCols - columnsMapperLen;

      this.columnsMapper.insertItems(columnsMapperLen, diff);

    } else if (columnsMapperLen > countCols) {
      let maxIndex = countCols - 1;
      let columnsToRemove = [];

      arrayEach(this.columnsMapper._arrayMap, (value, index, array) => {
        if (value > maxIndex) {
          columnsToRemove.push(index);
        }
      });

      this.columnsMapper.removeItems(columnsToRemove);
    }

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

    super.destroy();
  }
}

export {ManualColumnMove};

registerPlugin('ManualColumnMove', ManualColumnMove);
Handsontable.hooks.register('beforeColumnMove');
Handsontable.hooks.register('afterColumnMove');
Handsontable.hooks.register('unmodifyCol');
