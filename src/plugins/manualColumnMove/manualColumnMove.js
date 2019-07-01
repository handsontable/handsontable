import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import { arrayEach } from './../../helpers/array';
import { addClass, removeClass, offset, hasClass } from './../../helpers/dom/element';
import { rangeEach } from './../../helpers/number';
import EventManager from './../../eventManager';
import { registerPlugin } from './../../plugins';
import ColumnsMapper from './columnsMapper';
import BacklightUI from './ui/backlight';
import GuidelineUI from './ui/guideline';

import './manualColumnMove.css';

Hooks.getSingleton().register('beforeColumnMove');
Hooks.getSingleton().register('afterColumnMove');
Hooks.getSingleton().register('unmodifyCol');

const privatePool = new WeakMap();
const CSS_PLUGIN = 'ht__manualColumnMove';
const CSS_SHOW_UI = 'show-ui';
const CSS_ON_MOVING = 'on-moving--columns';
const CSS_AFTER_SELECTION = 'after-selection--columns';

/**
 * @plugin ManualColumnMove
 *
 * @description
 * This plugin allows to change columns order. To make columns order persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * API:
 * - moveColumn - move single column to the new position.
 * - moveColumns - move many columns (as an array of indexes) to the new position.
 *
 * If you want apply visual changes, you have to call manually the render() method on the instance of Handsontable.
 *
 * The plugin creates additional components to make moving possibly using user interface:
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
     * @private
     * @type {Array}
     */
    this.removedColumns = [];
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    this.columnsMapper = new ColumnsMapper(this);
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
   * hook and if it returns `true` than the {@link ManualColumnMove#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().manualColumnMove;
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
    this.addHook('afterScrollVertically', () => this.onAfterScrollVertically());
    this.addHook('modifyCol', (row, source) => this.onModifyCol(row, source));
    this.addHook('beforeRemoveCol', (index, amount) => this.onBeforeRemoveCol(index, amount));
    this.addHook('afterRemoveCol', () => this.onAfterRemoveCol());
    this.addHook('afterCreateCol', (index, amount) => this.onAfterCreateCol(index, amount));
    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('unmodifyCol', column => this.onUnmodifyCol(column));

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
    const pluginSettings = this.hot.getSettings().manualColumnMove;

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
   * Moves a single column.
   *
   * @param {Number} column Visual column index to be moved.
   * @param {Number} target Visual column index being a target for the moved column.
   * @fires Hooks#beforeColumnMove
   * @fires Hooks#afterColumnMove
   */
  moveColumn(column, target) {
    this.moveColumns([column], target);
  }

  /**
   * Moves a multiple columns.
   *
   * @param {Array} columns Array of visual column indexes to be moved.
   * @param {Number} target Visual column index being a target for the moved columns.
   * @fires Hooks#beforeColumnMove
   * @fires Hooks#afterColumnMove
   */
  moveColumns(columns, target) {
    const visualColumns = [...columns];
    const priv = privatePool.get(this);
    const beforeColumnHook = this.hot.runHooks('beforeColumnMove', visualColumns, target);

    priv.disallowMoving = !beforeColumnHook;

    if (beforeColumnHook !== false) {
      // first we need to rewrite an visual indexes to physical for save reference after move
      arrayEach(columns, (column, index, array) => {
        array[index] = this.columnsMapper.getValueByIndex(column);
      });

      // next, when we have got an physical indexes, we can move columns
      arrayEach(columns, (column, index) => {
        const actualPosition = this.columnsMapper.getIndexByValue(column);

        if (actualPosition !== target) {
          this.columnsMapper.moveColumn(actualPosition, target + index);
        }
      });

      // after moving we have to clear columnsMapper from null entries
      this.columnsMapper.clearNull();

      this.hot.runHooks('afterColumnMove', visualColumns, target);
    }
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
    this.hot.selectColumns(startColumn, endColumn);
  }

  /**
   * Gets the sum of the widths of columns in the provided range.
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
        columnWidth = this.hot.view.wt.wtViewport.getRowHeaderWidth() || 0;
      } else {
        columnWidth = this.hot.view.wt.wtTable.getStretchedColumnWidth(i) || 0;
      }

      width += columnWidth;
    }

    return width;
  }

  /**
   * Loads initial settings when persistent state is saved or when plugin was initialized as an array.
   *
   * @private
   */
  initialSettings() {
    const pluginSettings = this.hot.getSettings().manualColumnMove;

    if (Array.isArray(pluginSettings)) {
      this.moveColumns(pluginSettings, 0);

    } else if (pluginSettings !== void 0) {
      this.persistentStateLoad();
    }
  }

  /**
   * Checks if the provided column is in the fixedColumnsLeft section.
   *
   * @private
   * @param {Number} column Visual column index to check.
   * @returns {Boolean}
   */
  isFixedColumnsLeft(column) {
    return column < this.hot.getSettings().fixedColumnsLeft;
  }

  /**
   * Saves the manual column positions to the persistent state (the {@link Options#persistentState} option has to be enabled).
   */
  persistentStateSave() {
    this.hot.runHooks('persistentStateSave', 'manualColumnMove', this.columnsMapper._arrayMap);
  }

  /**
   * Loads the manual column positions from the persistent state (the {@link Options#persistentState} option has to be enabled).
   */
  persistentStateLoad() {
    const storedState = {};

    this.hot.runHooks('persistentStateLoad', 'manualColumnMove', storedState);

    if (storedState.value) {
      this.columnsMapper._arrayMap = storedState.value;
    }
  }

  /**
   * Prepares an array of indexes based on actual selection.
   *
   * @private
   * @returns {Array}
   */
  prepareColumnsToMoving(start, end) {
    const selectedColumns = [];

    rangeEach(start, end, (i) => {
      selectedColumns.push(i);
    });

    return selectedColumns;
  }

  /**
   * Updates the UI visual position.
   *
   * @private
   */
  refreshPositions() {
    const priv = privatePool.get(this);
    const firstVisible = this.hot.view.wt.wtTable.getFirstVisibleColumn();
    const lastVisible = this.hot.view.wt.wtTable.getLastVisibleColumn();
    const wtTable = this.hot.view.wt.wtTable;
    const scrollableElement = this.hot.view.wt.wtOverlays.scrollableElement;
    const scrollLeft = typeof scrollableElement.scrollX === 'number' ? scrollableElement.scrollX : scrollableElement.scrollLeft;
    let tdOffsetLeft = this.hot.view.THEAD.offsetLeft + this.getColumnsWidth(0, priv.coordsColumn);
    const mouseOffsetLeft = priv.target.eventPageX - (priv.rootElementOffset - (scrollableElement.scrollX === void 0 ? scrollLeft : 0));
    const hiderWidth = wtTable.hider.offsetWidth;
    const tbodyOffsetLeft = wtTable.TBODY.offsetLeft;
    const backlightElemMarginLeft = this.backlight.getOffset().left;
    const backlightElemWidth = this.backlight.getSize().width;
    let rowHeaderWidth = 0;

    if ((priv.rootElementOffset + wtTable.holder.offsetWidth + scrollLeft) < priv.target.eventPageX) {
      if (priv.coordsColumn < priv.countCols) {
        priv.coordsColumn += 1;
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

    } else if (((priv.target.TD.offsetWidth / 2) + tdOffsetLeft) <= mouseOffsetLeft) {
      const newCoordsCol = priv.coordsColumn >= priv.countCols ? priv.countCols - 1 : priv.coordsColumn;
      // if hover on right part of TD
      priv.target.col = newCoordsCol + 1;
      // unfortunately first column is bigger than rest
      tdOffsetLeft += priv.target.TD.offsetWidth;

      if (priv.target.col > lastVisible && lastVisible < priv.countCols) {
        this.hot.scrollViewportTo(void 0, lastVisible + 1, void 0, true);
      }

    } else {
      // elsewhere on table
      priv.target.col = priv.coordsColumn;

      if (priv.target.col <= firstVisible && priv.target.col >= priv.fixedColumns && firstVisible > 0) {
        this.hot.scrollViewportTo(void 0, firstVisible - 1);
      }
    }

    if (priv.target.col <= firstVisible && priv.target.col >= priv.fixedColumns && firstVisible > 0) {
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
      guidelineLeft -= ((priv.rootElementOffset <= scrollableElement.scrollX) ? priv.rootElementOffset : 0);
    }

    this.backlight.setPosition(null, backlightLeft);
    this.guideline.setPosition(null, guidelineLeft);
  }

  /**
   * This method checks arrayMap from columnsMapper and updates the columnsMapper if it's necessary.
   *
   * @private
   */
  updateColumnsMapper() {
    const countCols = this.hot.countSourceCols();
    const columnsMapperLen = this.columnsMapper._arrayMap.length;

    if (columnsMapperLen === 0) {
      this.columnsMapper.createMap(countCols || this.hot.getSettings().startCols);

    } else if (columnsMapperLen < countCols) {
      const diff = countCols - columnsMapperLen;

      this.columnsMapper.insertItems(columnsMapperLen, diff);

    } else if (columnsMapperLen > countCols) {
      const maxIndex = countCols - 1;
      const columnsToRemove = [];

      arrayEach(this.columnsMapper._arrayMap, (value, index) => {
        if (value > maxIndex) {
          columnsToRemove.push(index);
        }
      });

      this.columnsMapper.removeItems(columnsToRemove);
    }
  }

  /**
   * Binds the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    const { documentElement } = this.hot.rootDocument;

    this.eventManager.addEventListener(documentElement, 'mousemove', event => this.onMouseMove(event));
    this.eventManager.addEventListener(documentElement, 'mouseup', () => this.onMouseUp());
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
   * Changes the behavior of selection / dragging.
   *
   * @private
   * @param {MouseEvent} event `mousedown` event properties.
   * @param {CellCoords} coords Visual cell coordinates where was fired event.
   * @param {HTMLElement} TD Cell represented as HTMLElement.
   * @param {Object} blockCalculations Object which contains information about blockCalculation for row, column or cells.
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    const wtTable = this.hot.view.wt.wtTable;
    const isHeaderSelection = this.hot.selection.isSelectedByColumnHeader();
    const selection = this.hot.getSelectedRangeLast();
    const priv = privatePool.get(this);
    // This block action shouldn't be handled below.
    const isSortingElement = hasClass(event.realTarget, 'sortAction');

    if (!selection || !isHeaderSelection || priv.pressed || event.button !== 0 || isSortingElement) {
      priv.pressed = false;
      priv.columnsToMove.length = 0;
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
    const start = Math.min(from.col, to.col);
    const end = Math.max(from.col, to.col);

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

      const countColumnsFrom = priv.hasRowHeaders ? -1 : 0;
      const topPos = wtTable.holder.scrollTop + wtTable.getColumnHeaderHeight(0) + 1;
      const fixedColumns = coords.col < priv.fixedColumns;
      const scrollableElement = this.hot.view.wt.wtOverlays.scrollableElement;
      const wrapperIsWindow = scrollableElement.scrollX ? scrollableElement.scrollX - priv.rootElementOffset : 0;

      const mouseOffset = event.layerX - (fixedColumns ? wrapperIsWindow : 0);
      const leftOffset = Math.abs(this.getColumnsWidth(start, coords.col) + mouseOffset);

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
    const priv = privatePool.get(this);

    if (!priv.pressed) {
      return;
    }

    // callback for browser which doesn't supports CSS pointer-event: none
    if (event.realTarget === this.backlight.element) {
      const width = this.backlight.getSize().width;
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
    const priv = privatePool.get(this);

    priv.coordsColumn = void 0;
    priv.pressed = false;
    priv.backlightWidth = 0;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.isSelectedByColumnHeader()) {
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
      const selectionStart = this.columnsMapper.getIndexByValue(priv.columnsToMove[0]);
      const selectionEnd = this.columnsMapper.getIndexByValue(priv.columnsToMove[priv.columnsToMove.length - 1]);
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
    const wtTable = this.hot.view.wt.wtTable;
    const headerHeight = wtTable.getColumnHeaderHeight(0) + 1;
    const scrollTop = wtTable.holder.scrollTop;
    const posTop = headerHeight + scrollTop;

    this.backlight.setPosition(posTop);
    this.backlight.setSize(null, wtTable.hider.offsetHeight - posTop);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {Number} index Visual index of the created column.
   * @param {Number} amount Amount of created columns.
   */
  onAfterCreateCol(index, amount) {
    this.columnsMapper.shiftItems(index, amount);
  }

  /**
   * On before remove column listener.
   *
   * @private
   * @param {Number} index Visual column index.
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
   */
  onAfterRemoveCol() {
    this.columnsMapper.unshiftItems(this.removedColumns);
  }

  /**
   * `afterLoadData` hook callback.
   *
   * @private
   */
  onAfterLoadData() {
    this.updateColumnsMapper();
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} column Visual column index.
   * @returns {Number} Physical column index.
   */
  onModifyCol(column, source) {
    let physicalColumn = column;

    if (source !== this.pluginName) {
      // ugly fix for try to insert new, needed columns after pasting data
      const columnInMapper = this.columnsMapper.getValueByIndex(physicalColumn);
      physicalColumn = columnInMapper === null ? physicalColumn : columnInMapper;
    }

    return physicalColumn;
  }

  /**
   * 'unmodifyCol' hook callback.
   *
   * @private
   * @param {Number} column Physical column index.
   * @returns {Number} Visual column index.
   */
  onUnmodifyCol(column) {
    const indexInMapper = this.columnsMapper.getIndexByValue(column);

    return indexInMapper === null ? column : indexInMapper;
  }

  /**
   * `afterPluginsInitialized` hook callback.
   *
   * @private
   */
  onAfterPluginsInitialized() {
    this.updateColumnsMapper();
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

    super.destroy();
  }
}

registerPlugin('ManualColumnMove', ManualColumnMove);

export default ManualColumnMove;
