import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import { arrayEach } from './../../helpers/array';
import { addClass, removeClass, offset } from './../../helpers/dom/element';
import { rangeEach } from './../../helpers/number';
import EventManager from './../../eventManager';
import { registerPlugin } from './../../plugins';
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
 * This plugin allows to change rows order. To make rows order persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * API:
 * - moveRow - move single row to the new position.
 * - moveRows - move many rows (as an array of indexes) to the new position.
 *
 * If you want apply visual changes, you have to call manually the render() method on the instance of handsontable.
 *
 * The plugin creates additional components to make moving possibly using user interface:
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
     * @private
     * @type {Array}
     */
    this.removedRows = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
    /**
     * Event Manager object.
     *
     * @private
     * @type {Object}
     */
    this.eventManager = new EventManager(this);
    /**
     * Backlight UI object.
     *
     * @private
     * @type {Object}
     */
    this.backlight = new BacklightUI(hotInstance);
    /**
     * Guideline UI object.
     *
     * @private
     * @type {Object}
     */
    this.guideline = new GuidelineUI(hotInstance);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ManualRowMove#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualRowMove;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
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
    this.addHook('beforeColumnSort', (column, order) => this.onBeforeColumnSort(column, order));
    this.addHook('unmodifyRow', row => this.onUnmodifyRow(row));

    this.registerEvents();

    // TODO: move adding plugin classname to BasePlugin.
    addClass(this.hot.rootElement, CSS_PLUGIN);

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.onAfterPluginsInitialized();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    const pluginSettings = this.hot.getSettings().manualRowMove;

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
   * Moves a single row.
   *
   * @param {Number} row Visual row index to be moved.
   * @param {Number} target Visual row index being a target for the moved row.
   * @fires Hooks#beforeRowMove
   * @fires Hooks#afterRowMove
   */
  moveRow(row, target) {
    this.moveRows([row], target);
  }

  /**
   * Moves a multiple rows.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {Number} target Visual row index being a target for the moved rows.
   * @fires Hooks#beforeRowMove
   * @fires Hooks#afterRowMove
   */
  moveRows(rows, target) {
    const visualRows = [...rows];
    const priv = privatePool.get(this);
    const beforeMoveHook = this.hot.runHooks('beforeRowMove', visualRows, target);

    priv.disallowMoving = beforeMoveHook === false;

    if (!priv.disallowMoving) {
      // first we need to rewrite an visual indexes to physical for save reference after move
      arrayEach(rows, (row, index, array) => {
        array[index] = this.rowsMapper.getValueByIndex(row);
      });

      // next, when we have got an physical indexes, we can move rows
      arrayEach(rows, (row, index) => {
        const actualPosition = this.rowsMapper.getIndexByValue(row);

        if (actualPosition !== target) {
          this.rowsMapper.moveRow(actualPosition, target + index);
        }
      });

      // after moving we have to clear rowsMapper from null entries
      this.rowsMapper.clearNull();
    }

    this.hot.runHooks('afterRowMove', visualRows, target);
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
   * Gets the sum of the heights of rows in the provided range.
   *
   * @private
   * @param {Number} from Visual row index.
   * @param {Number} to Visual row index.
   * @returns {Number}
   */
  getRowsHeight(from, to) {
    let height = 0;

    for (let i = from; i < to; i++) {
      const rowHeight = this.hot.view.wt.wtTable.getRowHeight(i) || 23;

      height += rowHeight;
    }

    return height;
  }

  /**
   * Loads initial settings when persistent state is saved or when plugin was initialized as an array.
   *
   * @private
   */
  initialSettings() {
    const pluginSettings = this.hot.getSettings().manualRowMove;

    if (Array.isArray(pluginSettings)) {
      this.moveRows(pluginSettings, 0);

    } else if (pluginSettings !== void 0) {
      const persistentState = this.persistentStateLoad();

      if (persistentState.length) {
        this.moveRows(persistentState, 0);
      }
    }
  }

  /**
   * Checks if the provided row is in the fixedRowsTop section.
   *
   * @private
   * @param {Number} row Visual row index to check.
   * @returns {Boolean}
   */
  isFixedRowTop(row) {
    return row < this.hot.getSettings().fixedRowsTop;
  }

  /**
   * Checks if the provided row is in the fixedRowsBottom section.
   *
   * @private
   * @param {Number} row Visual row index to check.
   * @returns {Boolean}
   */
  isFixedRowBottom(row) {
    return row > this.hot.getSettings().fixedRowsBottom;
  }

  /**
   * Saves the manual row positions to the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @fires Hooks#persistentStateSave
   * @fires Hooks#manualRowMove
   */
  persistentStateSave() {
    this.hot.runHooks('persistentStateSave', 'manualRowMove', this.rowsMapper._arrayMap);
  }

  /**
   * Loads the manual row positions from the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @returns {Array} Stored state.
   *
   * @fires Hooks#persistentStateLoad
   * @fires Hooks#manualRowMove
   */
  persistentStateLoad() {
    const storedState = {};

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
    const selection = this.hot.getSelectedRangeLast();
    const selectedRows = [];

    if (!selection) {
      return selectedRows;
    }

    const { from, to } = selection;
    const start = Math.min(from.row, to.row);
    const end = Math.max(from.row, to.row);

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
    const priv = privatePool.get(this);
    const coords = priv.target.coords;
    const firstVisible = this.hot.view.wt.wtTable.getFirstVisibleRow();
    const lastVisible = this.hot.view.wt.wtTable.getLastVisibleRow();
    const fixedRows = this.hot.getSettings().fixedRowsTop;
    const countRows = this.hot.countRows();

    if (coords.row < fixedRows && firstVisible > 0) {
      this.hot.scrollViewportTo(firstVisible - 1);
    }
    if (coords.row >= lastVisible && lastVisible < countRows) {
      this.hot.scrollViewportTo(lastVisible + 1, undefined, true);
    }

    const wtTable = this.hot.view.wt.wtTable;
    const TD = priv.target.TD;
    const rootElementOffset = offset(this.hot.rootElement);
    let tdOffsetTop = this.hot.view.THEAD.offsetHeight + this.getRowsHeight(0, coords.row);
    const mouseOffsetTop = priv.target.eventPageY - rootElementOffset.top + wtTable.holder.scrollTop;
    const hiderHeight = wtTable.hider.offsetHeight;
    const tbodyOffsetTop = wtTable.TBODY.offsetTop;
    const backlightElemMarginTop = this.backlight.getOffset().top;
    const backlightElemHeight = this.backlight.getSize().height;

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
    const countRows = this.hot.countSourceRows();
    const rowsMapperLen = this.rowsMapper._arrayMap.length;

    if (rowsMapperLen === 0) {
      this.rowsMapper.createMap(countRows || this.hot.getSettings().startRows);

    } else if (rowsMapperLen < countRows) {
      const diff = countRows - rowsMapperLen;

      this.rowsMapper.insertItems(rowsMapperLen, diff);

    } else if (rowsMapperLen > countRows) {
      const maxIndex = countRows - 1;
      const rowsToRemove = [];

      arrayEach(this.rowsMapper._arrayMap, (value, index) => {
        if (value > maxIndex) {
          rowsToRemove.push(index);
        }
      });

      this.rowsMapper.removeItems(rowsToRemove);
    }
  }

  /**
   * Binds the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document.documentElement, 'mousemove', event => this.onMouseMove(event));
    this.eventManager.addEventListener(document.documentElement, 'mouseup', () => this.onMouseUp());
  }

  /**
   * Unbinds the events used by the plugin.
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
    const priv = privatePool.get(this);

    priv.disallowMoving = order !== void 0;
  }

  /**
   * Changes the behavior of selection / dragging.
   *
   * @private
   * @param {MouseEvent} event
   * @param {CellCoords} coords Visual coordinates.
   * @param {HTMLElement} TD
   * @param {Object} blockCalculations
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    const wtTable = this.hot.view.wt.wtTable;
    const isHeaderSelection = this.hot.selection.isSelectedByRowHeader();
    const selection = this.hot.getSelectedRangeLast();
    const priv = privatePool.get(this);

    if (!selection || !isHeaderSelection || priv.pressed || event.button !== 0) {
      priv.pressed = false;
      priv.rowsToMove.length = 0;
      removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI]);
      return;
    }

    const guidelineIsNotReady = this.guideline.isBuilt() && !this.guideline.isAppended();
    const backlightIsNotReady = this.backlight.isBuilt() && !this.backlight.isAppended();

    if (guidelineIsNotReady && backlightIsNotReady) {
      this.guideline.appendTo(wtTable.hider);
      this.backlight.appendTo(wtTable.hider);
    }

    const { from, to } = selection;
    const start = Math.min(from.row, to.row);
    const end = Math.max(from.row, to.row);

    if (coords.col < 0 && (coords.row >= start && coords.row <= end)) {
      blockCalculations.row = true;
      priv.pressed = true;
      priv.target.eventPageY = event.pageY;
      priv.target.coords = coords;
      priv.target.TD = TD;
      priv.rowsToMove = this.prepareRowsToMoving();

      const leftPos = wtTable.holder.scrollLeft + this.hot.view.wt.wtViewport.getRowHeaderWidth();

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
    const priv = privatePool.get(this);

    if (!priv.pressed) {
      return;
    }

    // callback for browser which doesn't supports CSS pointer-event: none
    if (event.realTarget === this.backlight.element) {
      const height = this.backlight.getSize().height;
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
    const selectedRange = this.hot.getSelectedRangeLast();
    const priv = privatePool.get(this);

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
    const priv = privatePool.get(this);
    const target = priv.target.row;
    const rowsLen = priv.rowsToMove.length;

    priv.pressed = false;
    priv.backlightHeight = 0;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.isSelectedByRowHeader()) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }

    if (rowsLen < 1 || target === void 0 || priv.rowsToMove.indexOf(target) > -1 ||
        (priv.rowsToMove[rowsLen - 1] === target - 1)) {
      return;
    }

    this.moveRows(priv.rowsToMove, target);

    this.persistentStateSave();
    this.hot.render();

    if (!priv.disallowMoving) {
      const selectionStart = this.rowsMapper.getIndexByValue(priv.rowsToMove[0]);
      const selectionEnd = this.rowsMapper.getIndexByValue(priv.rowsToMove[rowsLen - 1]);
      this.changeSelection(selectionStart, selectionEnd);
    }

    priv.rowsToMove.length = 0;
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   *
   * @private
   */
  onAfterScrollHorizontally() {
    const wtTable = this.hot.view.wt.wtTable;
    const headerWidth = this.hot.view.wt.wtViewport.getRowHeaderWidth();
    const scrollLeft = wtTable.holder.scrollLeft;
    const posLeft = headerWidth + scrollLeft;

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
    let physicalRow = row;

    if (source !== this.pluginName) {
      const rowInMapper = this.rowsMapper.getValueByIndex(physicalRow);
      physicalRow = rowInMapper === null ? physicalRow : rowInMapper;
    }

    return physicalRow;
  }

  /**
   * 'unmodifyRow' hook callback.
   *
   * @private
   * @param {Number} row Physical row index.
   * @returns {Number} Visual row index.
   */
  onUnmodifyRow(row) {
    const indexInMapper = this.rowsMapper.getIndexByValue(row);

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
   * Destroys the plugin instance.
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
