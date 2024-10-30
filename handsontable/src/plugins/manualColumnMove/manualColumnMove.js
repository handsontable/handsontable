import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { arrayReduce } from '../../helpers/array';
import { addClass, removeClass, offset, hasClass, outerWidth } from '../../helpers/dom/element';
import { offsetRelativeTo } from '../../helpers/dom/event';
import { rangeEach } from '../../helpers/number';
import BacklightUI from './ui/backlight';
import GuidelineUI from './ui/guideline';

Hooks.getSingleton().register('beforeColumnMove');
Hooks.getSingleton().register('afterColumnMove');

export const PLUGIN_KEY = 'manualColumnMove';
export const PLUGIN_PRIORITY = 120;
const CSS_PLUGIN = 'ht__manualColumnMove';
const CSS_SHOW_UI = 'show-ui';
const CSS_ON_MOVING = 'on-moving--columns';
const CSS_AFTER_SELECTION = 'after-selection--columns';

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin ManualColumnMove
 * @class ManualColumnMove
 *
 * @description
 * This plugin allows to change columns order. To make columns order persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * API:
 * - `moveColumn` - move single column to the new position.
 * - `moveColumns` - move many columns (as an array of indexes) to the new position.
 * - `dragColumn` - drag single column to the new position.
 * - `dragColumns` - drag many columns (as an array of indexes) to the new position.
 *
 * [Documentation](@/guides/columns/column-moving/column-moving.md) explain differences between drag and move actions.
 * Please keep in mind that if you want apply visual changes,
 * you have to call manually the `render` method on the instance of Handsontable.
 *
 * The plugin creates additional components to make moving possibly using user interface:
 * - backlight - highlight of selected columns.
 * - guideline - line which shows where columns has been moved.
 *
 * @class ManualColumnMove
 * @plugin ManualColumnMove
 */
export class ManualColumnMove extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Backlight UI object.
   *
   * @type {object}
   */
  #backlight = new BacklightUI(this.hot);
  /**
   * Guideline UI object.
   *
   * @type {object}
   */
  #guideline = new GuidelineUI(this.hot);
  /**
   * @type {number[]}
   */
  #columnsToMove = [];
  /**
   * @type {number}
   */
  #countCols = 0;
  /**
   * @type {boolean}
   */
  #pressed = false;
  /**
   * @type {object}
   */
  #target = {};
  /**
   * @type {number}
   */
  #cachedDropIndex;
  /**
   * @type {number}
   */
  #hoveredColumn;
  /**
   * @type {number}
   */
  #rootElementOffset;
  /**
   * @type {boolean}
   */
  #hasRowHeaders;
  /**
   * @type {number}
   */
  #fixedColumnsStart;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualColumnMove#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('beforeOnCellMouseDown', (...args) => this.#onBeforeOnCellMouseDown(...args));
    this.addHook('beforeOnCellMouseOver', (...args) => this.#onBeforeOnCellMouseOver(...args));
    this.addHook('afterScrollVertically', () => this.#onAfterScrollVertically());
    this.addHook('afterLoadData', (...args) => this.#onAfterLoadData(...args));

    this.buildPluginUI();
    this.registerEvents();

    // TODO: move adding plugin classname to BasePlugin.
    addClass(this.hot.rootElement, CSS_PLUGIN);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`manualColumnMove`](@/api/options.md#manualcolumnmove)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.moveBySettingsOrLoad();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    removeClass(this.hot.rootElement, CSS_PLUGIN);

    this.unregisterEvents();
    this.#backlight.destroy();
    this.#guideline.destroy();

    super.disablePlugin();
  }

  /**
   * Moves a single column.
   *
   * @param {number} column Visual column index to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin).
   * @fires Hooks#beforeColumnMove
   * @fires Hooks#afterColumnMove
   * @returns {boolean}
   */
  moveColumn(column, finalIndex) {
    return this.moveColumns([column], finalIndex);
  }

  /**
   * Moves a multiple columns.
   *
   * @param {Array} columns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin).
   * @fires Hooks#beforeColumnMove
   * @fires Hooks#afterColumnMove
   * @returns {boolean}
   */
  moveColumns(columns, finalIndex) {
    const dropIndex = this.#cachedDropIndex;
    const movePossible = this.isMovePossible(columns, finalIndex);
    const beforeMoveHook = this.hot.runHooks('beforeColumnMove', columns, finalIndex, dropIndex, movePossible);

    this.#cachedDropIndex = undefined;

    if (beforeMoveHook === false) {
      return;
    }

    if (movePossible) {
      this.hot.columnIndexMapper.moveIndexes(columns, finalIndex);
    }

    const movePerformed = movePossible && this.isColumnOrderChanged(columns, finalIndex);

    this.hot.runHooks('afterColumnMove', columns, finalIndex, dropIndex, movePossible, movePerformed);

    return movePerformed;
  }

  /**
   * Drag a single column to drop index position.
   *
   * @param {number} column Visual column index to be dragged.
   * @param {number} dropIndex Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin).
   * @fires Hooks#beforeColumnMove
   * @fires Hooks#afterColumnMove
   * @returns {boolean}
   */
  dragColumn(column, dropIndex) {
    return this.dragColumns([column], dropIndex);
  }

  /**
   * Drag multiple columns to drop index position.
   *
   * @param {Array} columns Array of visual column indexes to be dragged.
   * @param {number} dropIndex Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin).
   * @fires Hooks#beforeColumnMove
   * @fires Hooks#afterColumnMove
   * @returns {boolean}
   */
  dragColumns(columns, dropIndex) {
    const finalIndex = this.countFinalIndex(columns, dropIndex);

    this.#cachedDropIndex = dropIndex;

    return this.moveColumns(columns, finalIndex);
  }

  /**
   * Indicates if it's possible to move columns to the desired position. Some of the actions aren't
   * possible, i.e. You can’t move more than one element to the last position.
   *
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin).
   * @returns {boolean}
   */
  isMovePossible(movedColumns, finalIndex) {
    const length = this.hot.columnIndexMapper.getNotTrimmedIndexesLength();

    // An attempt to transfer more columns to start destination than is possible (only when moving from the top to the bottom).
    const tooHighDestinationIndex = movedColumns.length + finalIndex > length;

    const tooLowDestinationIndex = finalIndex < 0;
    const tooLowMovedColumnIndex = movedColumns.some(movedColumn => movedColumn < 0);
    const tooHighMovedColumnIndex = movedColumns.some(movedColumn => movedColumn >= length);

    if (tooHighDestinationIndex || tooLowDestinationIndex || tooLowMovedColumnIndex || tooHighMovedColumnIndex) {
      return false;
    }

    return true;
  }

  /**
   * Indicates if order of columns was changed.
   *
   * @private
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin).
   * @returns {boolean}
   */
  isColumnOrderChanged(movedColumns, finalIndex) {
    return movedColumns.some((column, nrOfMovedElement) => column - nrOfMovedElement !== finalIndex);
  }

  /**
   * Count the final column index from the drop index.
   *
   * @private
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} dropIndex Visual column index, being a drop index for the moved columns.
   * @returns {number} Visual column index, being a start index for the moved columns.
   */
  countFinalIndex(movedColumns, dropIndex) {
    const numberOfColumnsLowerThanDropIndex = arrayReduce(movedColumns, (numberOfColumns, currentColumnIndex) => {
      if (currentColumnIndex < dropIndex) {
        numberOfColumns += 1;
      }

      return numberOfColumns;
    }, 0);

    return dropIndex - numberOfColumnsLowerThanDropIndex;
  }

  /**
   * Gets the sum of the widths of columns in the provided range.
   *
   * @private
   * @param {number} fromColumn Visual column index.
   * @param {number} toColumn Visual column index.
   * @returns {number}
   */
  getColumnsWidth(fromColumn, toColumn) {
    const columnMapper = this.hot.columnIndexMapper;
    let columnsWidth = 0;

    for (let visualColumnIndex = fromColumn; visualColumnIndex <= toColumn; visualColumnIndex += 1) {
      const renderableIndex = columnMapper.getRenderableFromVisualIndex(visualColumnIndex);

      if (visualColumnIndex < 0) {
        columnsWidth += this.hot.view._wt.wtViewport.getRowHeaderWidth() || 0;

      } else if (renderableIndex !== null) {
        columnsWidth += this.hot.view._wt.wtTable.getColumnWidth(renderableIndex) || 0;
      }
    }

    return columnsWidth;
  }

  /**
   * Loads initial settings when persistent state is saved or when plugin was initialized as an array.
   *
   * @private
   */
  moveBySettingsOrLoad() {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (Array.isArray(pluginSettings)) {
      this.moveColumns(pluginSettings, 0);

    } else if (pluginSettings !== undefined) {
      const persistentState = this.persistentStateLoad();

      if (persistentState.length) {
        this.moveColumns(persistentState, 0);
      }
    }
  }

  /**
   * Checks if the provided column is in the fixedColumnsTop section.
   *
   * @private
   * @param {number} column Visual column index to check.
   * @returns {boolean}
   */
  isFixedColumnsStart(column) {
    return column < this.hot.getSettings().fixedColumnsStart;
  }

  /**
   * Saves the manual column positions to the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @private
   * @fires Hooks#persistentStateSave
   */
  persistentStateSave() {
    this.hot.runHooks('persistentStateSave', 'manualColumnMove', this.hot.columnIndexMapper.getIndexesSequence()); // The `PersistentState` plugin should be refactored.
  }

  /**
   * Loads the manual column positions from the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @private
   * @fires Hooks#persistentStateLoad
   * @returns {Array} Stored state.
   */
  persistentStateLoad() {
    const storedState = {};

    this.hot.runHooks('persistentStateLoad', 'manualColumnMove', storedState);

    return storedState.value ? storedState.value : [];
  }

  /**
   * Prepares an array of indexes based on actual selection.
   *
   * @private
   * @param {number} start The start index.
   * @param {number} end The end index.
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
   * Update the UI visual position.
   *
   * @private
   */
  refreshPositions() {
    const firstVisible = this.hot.view.getFirstFullyVisibleColumn();

    if (this.isFixedColumnsStart(this.#hoveredColumn) && firstVisible > 0) {
      this.hot.scrollViewportTo({
        col: this.hot.columnIndexMapper.getNearestNotHiddenIndex(firstVisible - 1, -1)
      });
    }

    const wtTable = this.hot.view._wt.wtTable;
    const scrollableElement = this.hot.view._wt.wtOverlays.scrollableElement;
    const scrollStart = typeof scrollableElement.scrollX === 'number' ?
      scrollableElement.scrollX : scrollableElement.scrollLeft;
    let tdOffsetStart = this.hot.view.THEAD.offsetLeft + this.getColumnsWidth(0, this.#hoveredColumn - 1);
    const hiderWidth = wtTable.hider.offsetWidth;
    const tbodyOffsetLeft = wtTable.TBODY.offsetLeft;
    const backlightElemMarginStart = this.#backlight.getOffset().start;
    const backlightElemWidth = this.#backlight.getSize().width;
    let rowHeaderWidth = 0;
    let mouseOffsetStart = 0;

    if (this.hot.isRtl()) {
      const rootWindow = this.hot.rootWindow;
      const containerWidth = outerWidth(this.hot.rootElement);
      const gridMostRightPos = rootWindow.innerWidth - this.#rootElementOffset - containerWidth;

      mouseOffsetStart = rootWindow.innerWidth - this.#target.eventPageX - gridMostRightPos -
        (scrollableElement.scrollX === undefined ? scrollStart : 0);

    } else {
      mouseOffsetStart = this.#target.eventPageX -
        (this.#rootElementOffset - (scrollableElement.scrollX === undefined ? scrollStart : 0));
    }

    if (this.#hasRowHeaders) {
      rowHeaderWidth = this.hot.view._wt.wtOverlays.inlineStartOverlay.clone.wtTable.getColumnHeader(-1).offsetWidth;
    }

    if (this.isFixedColumnsStart(this.#hoveredColumn)) {
      tdOffsetStart += scrollStart;
    }

    tdOffsetStart += rowHeaderWidth;

    if (this.#hoveredColumn < 0) {
      // if hover on rowHeader
      if (this.#fixedColumnsStart > 0) {
        this.#target.col = 0;
      } else {
        this.#target.col = firstVisible > 0 ? firstVisible - 1 : firstVisible;
      }

    } else if (((this.#target.TD.offsetWidth / 2) + tdOffsetStart) <= mouseOffsetStart) {
      const newCoordsCol = this.#hoveredColumn >= this.#countCols ? this.#countCols - 1 : this.#hoveredColumn;

      // if hover on right part of TD
      this.#target.col = newCoordsCol + 1;
      // unfortunately first column is bigger than rest
      tdOffsetStart += this.#target.TD.offsetWidth;

    } else {
      // elsewhere on table
      this.#target.col = this.#hoveredColumn;
    }

    let backlightStart = mouseOffsetStart;
    let guidelineStart = tdOffsetStart;

    if (mouseOffsetStart + backlightElemWidth + backlightElemMarginStart >= hiderWidth) {
      // prevent display backlight on the right side of the table
      backlightStart = hiderWidth - backlightElemWidth - backlightElemMarginStart;

    } else if (mouseOffsetStart + backlightElemMarginStart < tbodyOffsetLeft + rowHeaderWidth) {
      // prevent display backlight on the left side of the table
      backlightStart = tbodyOffsetLeft + rowHeaderWidth + Math.abs(backlightElemMarginStart);
    }

    if (tdOffsetStart >= hiderWidth - 1) {
      // prevent display guideline outside the table
      guidelineStart = hiderWidth - 1;

    } else if (guidelineStart === 0) {
      // guideline has got `margin-left: -1px` as default
      guidelineStart = 1;

    } else if (scrollableElement.scrollX !== undefined && this.#hoveredColumn < this.#fixedColumnsStart) {
      guidelineStart -= ((this.#rootElementOffset <= scrollableElement.scrollX) ? this.#rootElementOffset : 0);
    }

    this.#backlight.setPosition(null, backlightStart);
    this.#guideline.setPosition(null, guidelineStart);
  }

  /**
   * Binds the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    const { documentElement } = this.hot.rootDocument;

    this.eventManager.addEventListener(documentElement, 'mousemove', event => this.#onMouseMove(event));
    this.eventManager.addEventListener(documentElement, 'mouseup', () => this.#onMouseUp());
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
   * Change the behavior of selection / dragging.
   *
   * @param {MouseEvent} event `mousedown` event properties.
   * @param {CellCoords} coords Visual cell coordinates where was fired event.
   * @param {HTMLElement} TD Cell represented as HTMLElement.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  #onBeforeOnCellMouseDown(event, coords, TD, controller) {
    const wtTable = this.hot.view._wt.wtTable;
    const isHeaderSelection = this.hot.selection.isSelectedByColumnHeader();
    const selection = this.hot.getSelectedRangeLast();
    // This block action shouldn't be handled below.
    const isSortingElement = hasClass(event.target, 'sortAction');

    if (!selection || !isHeaderSelection || this.#pressed || event.button !== 0 || isSortingElement) {
      this.#pressed = false;
      this.#columnsToMove.length = 0;
      removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI]);

      return;
    }

    const guidelineIsNotReady = this.#guideline.isBuilt() && !this.#guideline.isAppended();
    const backlightIsNotReady = this.#backlight.isBuilt() && !this.#backlight.isAppended();

    if (guidelineIsNotReady && backlightIsNotReady) {
      this.#guideline.appendTo(wtTable.hider);
      this.#backlight.appendTo(wtTable.hider);
    }

    const { from, to } = selection;
    const start = Math.min(from.col, to.col);
    const end = Math.max(from.col, to.col);

    if (coords.row < 0 && (coords.col >= start && coords.col <= end)) {
      controller.column = true;
      this.#pressed = true;

      const eventOffsetX = TD.firstChild ? offsetRelativeTo(event, TD.firstChild).x : event.offsetX;

      this.#target.eventPageX = event.pageX;
      this.#hoveredColumn = coords.col;
      this.#target.TD = TD;
      this.#target.col = coords.col;
      this.#columnsToMove = this.prepareColumnsToMoving(start, end);
      this.#hasRowHeaders = !!this.hot.getSettings().rowHeaders;
      this.#countCols = this.hot.countCols();
      this.#fixedColumnsStart = this.hot.getSettings().fixedColumnsStart;
      this.#rootElementOffset = offset(this.hot.rootElement).left;

      const countColumnsFrom = this.#hasRowHeaders ? -1 : 0;
      const topPos = wtTable.holder.scrollTop + wtTable.getColumnHeaderHeight(0) + 1;
      const fixedColumnsStart = coords.col < this.#fixedColumnsStart;
      const horizontalScrollPosition = this.hot.view._wt.wtOverlays.inlineStartOverlay.getOverlayOffset();
      const offsetX = Math.abs(eventOffsetX - (this.hot.isRtl() ? TD.offsetWidth : 0));
      const inlineOffset = this.getColumnsWidth(start, coords.col - 1) + offsetX;
      const inlinePos = this.getColumnsWidth(countColumnsFrom, start - 1) +
        (fixedColumnsStart ? horizontalScrollPosition : 0) + inlineOffset;

      this.#backlight.setPosition(topPos, inlinePos);
      this.#backlight.setSize(this.getColumnsWidth(start, end), wtTable.hider.offsetHeight - topPos);
      this.#backlight.setOffset(null, -inlineOffset);

      addClass(this.hot.rootElement, CSS_ON_MOVING);

    } else {
      removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      this.#pressed = false;
      this.#columnsToMove.length = 0;
    }
  }

  /**
   * 'mouseMove' event callback. Fired when pointer move on document.documentElement.
   *
   * @param {MouseEvent} event `mousemove` event properties.
   */
  #onMouseMove(event) {
    if (!this.#pressed) {
      return;
    }

    this.#target.eventPageX = event.pageX;
    this.refreshPositions();
  }

  /**
   * 'beforeOnCellMouseOver' hook callback. Fired when pointer was over cell.
   *
   * @param {MouseEvent} event `mouseover` event properties.
   * @param {CellCoords} coords Visual cell coordinates where was fired event.
   * @param {HTMLElement} TD Cell represented as HTMLElement.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  #onBeforeOnCellMouseOver(event, coords, TD, controller) {
    const selectedRange = this.hot.getSelectedRangeLast();

    if (!selectedRange || !this.#pressed) {
      return;
    }

    if (this.#columnsToMove.indexOf(coords.col) > -1) {
      removeClass(this.hot.rootElement, CSS_SHOW_UI);

    } else {
      addClass(this.hot.rootElement, CSS_SHOW_UI);
    }

    controller.row = true;
    controller.column = true;
    controller.cell = true;
    this.#hoveredColumn = coords.col;
    this.#target.TD = TD;
  }

  /**
   * `onMouseUp` hook callback.
   */
  #onMouseUp() {
    const target = this.#target.col;
    const columnsLen = this.#columnsToMove.length;

    this.#hoveredColumn = undefined;
    this.#pressed = false;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.isSelectedByColumnHeader()) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }

    if (columnsLen < 1 || target === undefined) {
      return;
    }

    const firstMovedVisualColumn = this.#columnsToMove[0];
    const firstMovedPhysicalColumn = this.hot.toPhysicalColumn(firstMovedVisualColumn);
    const movePerformed = this.dragColumns(this.#columnsToMove, target);

    this.#columnsToMove.length = 0;

    if (movePerformed === true) {
      this.persistentStateSave();
      this.hot.render();
      this.hot.view.adjustElementsSize();

      const selectionStart = this.hot.toVisualColumn(firstMovedPhysicalColumn);
      const selectionEnd = selectionStart + columnsLen - 1;

      this.hot.selectColumns(selectionStart, selectionEnd);
    }
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   */
  #onAfterScrollVertically() {
    const wtTable = this.hot.view._wt.wtTable;
    const headerHeight = wtTable.getColumnHeaderHeight(0) + 1;
    const scrollTop = wtTable.holder.scrollTop;
    const posTop = headerHeight + scrollTop;

    this.#backlight.setPosition(posTop);
    this.#backlight.setSize(null, wtTable.hider.offsetHeight - posTop);
  }

  /**
   * Builds the plugin's UI.
   *
   * @private
   */
  buildPluginUI() {
    this.#backlight.build();
    this.#guideline.build();
  }

  /**
   * Callback for the `afterLoadData` hook.
   *
   * @private
   */
  #onAfterLoadData() {
    this.moveBySettingsOrLoad();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#backlight.destroy();
    this.#guideline.destroy();

    super.destroy();
  }
}
