import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { arrayReduce } from '../../helpers/array';
import { addClass, eventTargetEl, removeClass, offset, hasClass, outerWidth } from '../../helpers/dom/element';
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
 * This plugin allows to change columns order.
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
  readonly #backlight = new BacklightUI(this.hot);
  /**
   * Guideline UI object.
   *
   * @type {object}
   */
  readonly #guideline = new GuidelineUI(this.hot);
  /**
   * @type {number[]}
   */
  #columnsToMove: number[] = [];
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
  #target = {} as { col: number; eventPageX: number; TD: HTMLTableCellElement };
  /**
   * @type {number}
   */
  #cachedDropIndex: number | undefined;
  /**
   * @type {number}
   */
  #hoveredColumn: number | undefined;
  /**
   * @type {number}
   */
  #rootElementOffset: number | undefined;
  /**
   * @type {boolean}
   */
  #hasRowHeaders: boolean | undefined;
  /**
   * @type {number}
   */
  #fixedColumnsStart: number | undefined;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualColumnMove#enablePlugin} method is called.
   * When [[Options#dataProvider]] is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    this.addHook('beforeOnCellMouseOver', this.#onBeforeOnCellMouseOver);
    this.addHook('beforeOnCellMouseOverOutside',
      (event: MouseEvent, coords: unknown, TD: HTMLElement, controller: Record<string, boolean>) =>
        this.#onBeforeOnCellMouseOverOutside(controller));
    this.addHook('afterScrollVertically', this.#onAfterScrollVertically);
    this.addHook('afterLoadData', this.#onAfterLoadData);

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
  moveColumn(column: number, finalIndex: number): boolean {
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
  moveColumns(columns: number[], finalIndex: number): boolean {
    const dropIndex = this.#cachedDropIndex;
    const movePossible = this.isMovePossible(columns, finalIndex);
    const beforeMoveHook = this.hot.runHooks('beforeColumnMove', columns, finalIndex, dropIndex, movePossible);

    this.#cachedDropIndex = undefined;

    if (beforeMoveHook === false) {
      return false;
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
  dragColumn(column: number, dropIndex: number): boolean {
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
  dragColumns(columns: number[], dropIndex: number): boolean {
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
  isMovePossible(movedColumns: number[], finalIndex: number): boolean {
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
  isColumnOrderChanged(movedColumns: number[], finalIndex: number) {
    return movedColumns.some((column: number, nrOfMovedElement: number) => column - nrOfMovedElement !== finalIndex);
  }

  /**
   * Count the final column index from the drop index.
   *
   * @private
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} dropIndex Visual column index, being a drop index for the moved columns.
   * @returns {number} Visual column index, being a start index for the moved columns.
   */
  countFinalIndex(movedColumns: number[], dropIndex: number) {
    const numberOfColumnsLowerThanDropIndex = arrayReduce(movedColumns, (numberOfColumns, currentColumnIndex) => {
      if (currentColumnIndex < dropIndex) {
        return numberOfColumns + 1;
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
  getColumnsWidth(fromColumn: number, toColumn: number) {
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
   * Loads initial settings when state was saved (e.g. via hooks) or when plugin was initialized as an array.
   *
   * @private
   */
  moveBySettingsOrLoad() {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (Array.isArray(pluginSettings)) {
      this.moveColumns(pluginSettings, 0);

    }
  }

  /**
   * Checks if the provided column is in the fixedColumnsTop section.
   *
   * @private
   * @param {number} column Visual column index to check.
   * @returns {boolean}
   */
  isFixedColumnsStart(column: number) {
    return column < (this.hot.getSettings().fixedColumnsStart ?? 0);
  }

  /**
   * Saves the manual column positions to the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @private
   * @fires Hooks#persistentStateSave
   */
  persistentStateSave() {
    // The `PersistentState` plugin should be refactored.
    this.hot.runHooks('persistentStateSave', 'manualColumnMove',
      this.hot.columnIndexMapper.getIndexesSequence());
  }

  /**
   * Loads the manual column positions from the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @private
   * @fires Hooks#persistentStateLoad
   * @returns {Array} Stored state.
   */
  persistentStateLoad(): number[] {
    const storedState: Record<string, unknown> = {};

    this.hot.runHooks('persistentStateLoad', 'manualColumnMove', storedState);

    return (storedState.value ? storedState.value : []) as number[];
  }

  /**
   * Prepares an array of indexes based on actual selection.
   *
   * @private
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array}
   */
  prepareColumnsToMoving(start: number, end: number) {
    const selectedColumns: number[] = [];

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
    const firstVisible = this.hot.view.getFirstFullyVisibleColumn() ?? 0;
    const hoveredColumn = this.#hoveredColumn ?? 0;
    const fixedColumnsStart = this.#fixedColumnsStart ?? 0;
    const rootElementOffset = this.#rootElementOffset ?? 0;

    if (this.isFixedColumnsStart(hoveredColumn) && firstVisible > 0) {
      this.hot.scrollViewportTo({
        col: this.hot.columnIndexMapper.getNearestNotHiddenIndex(firstVisible - 1, -1) ?? undefined
      });
    }

    const wtTable = this.hot.view._wt.wtTable;
    const scrollableElement = this.hot.view._wt.wtOverlays.scrollableElement;
    const scrollStart = scrollableElement instanceof Window ?
      scrollableElement.scrollX : (scrollableElement as HTMLElement).scrollLeft;
    let tdOffsetStart = this.hot.view.THEAD.offsetLeft + this.getColumnsWidth(0, hoveredColumn - 1);
    const hiderWidth = wtTable.hider.offsetWidth;
    const tbodyOffsetLeft = wtTable.TBODY?.offsetLeft ?? 0;
    const backlightElemMarginStart = this.#backlight.getOffset().start;
    const backlightElemWidth = this.#backlight.getSize().width;
    let rowHeaderWidth = 0;
    let mouseOffsetStart = 0;

    if (this.hot.isRtl()) {
      const rootWindow = this.hot.rootWindow;
      const containerWidth = outerWidth(this.hot.rootElement);
      const gridMostRightPos = rootWindow.innerWidth - rootElementOffset - containerWidth;

      mouseOffsetStart = rootWindow.innerWidth - this.#target.eventPageX - gridMostRightPos -
        (!(scrollableElement instanceof Window) ? scrollStart : 0);

    } else {
      mouseOffsetStart = this.#target.eventPageX -
        (rootElementOffset - (!(scrollableElement instanceof Window) ? scrollStart : 0));
    }

    if (this.#hasRowHeaders) {
      const inlineClone = this.hot.view._wt.wtOverlays.inlineStartOverlay.clone;

      rowHeaderWidth = inlineClone?.wtTable.getColumnHeader(-1)?.offsetWidth ?? 0;
    }

    if (this.isFixedColumnsStart(hoveredColumn)) {
      tdOffsetStart += scrollStart;
    }

    tdOffsetStart += rowHeaderWidth;

    if (hoveredColumn < 0) {
      // if hover on rowHeader
      if (fixedColumnsStart > 0) {
        this.#target.col = 0;
      } else {
        this.#target.col = firstVisible > 0 ? firstVisible - 1 : firstVisible;
      }

    } else if (((this.#target.TD.offsetWidth / 2) + tdOffsetStart) <= mouseOffsetStart) {
      const newCoordsCol = hoveredColumn >= this.#countCols ? this.#countCols - 1 : hoveredColumn;

      // if hover on right part of TD
      this.#target.col = newCoordsCol + 1;
      // unfortunately first column is bigger than rest
      tdOffsetStart += this.#target.TD.offsetWidth;

    } else {
      // elsewhere on table
      this.#target.col = hoveredColumn;
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

    } else if (scrollableElement instanceof Window && hoveredColumn < fixedColumnsStart) {
      guidelineStart -= ((rootElementOffset <= scrollableElement.scrollX) ? rootElementOffset : 0);
    }

    this.#backlight.setPosition(undefined, backlightStart);
    this.#guideline.setPosition(undefined, guidelineStart);
  }

  /**
   * Binds the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    const { documentElement } = this.hot.rootDocument;

    this.eventManager.addEventListener(documentElement, 'mousemove',
      (event: Event) => this.#onMouseMove(event as MouseEvent));
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
  #onBeforeOnCellMouseDown = (
    event: MouseEvent, coords: { row: number, col: number }, TD: HTMLTableCellElement,
    controller: Record<string, boolean>
  ) => {
    const wtTable = this.hot.view._wt.wtTable;
    const isHeaderSelection = this.hot.selection.isSelectedByColumnHeader();
    const selection = this.hot.getSelectedRangeActive();
    // This block action shouldn't be handled below.
    const isSortingElement = hasClass(eventTargetEl(event)!, 'sortAction');

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
    const start = Math.min(from.col ?? 0, to.col ?? 0);
    const end = Math.max(from.col ?? 0, to.col ?? 0);

    if (coords.row < 0 && (coords.col >= start && coords.col <= end)) {
      controller.column = true;
      this.#pressed = true;

      const eventOffsetX = TD.firstChild ? offsetRelativeTo(event, TD.firstChild as HTMLElement).x : event.offsetX;

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
      const fixedColumnsStart = coords.col < (this.#fixedColumnsStart ?? 0);
      const horizontalScrollPosition = this.hot.view._wt.wtOverlays.inlineStartOverlay.getOverlayOffset();
      const offsetX = Math.abs(eventOffsetX - (this.hot.isRtl() ? TD.offsetWidth : 0));
      const inlineOffset = this.getColumnsWidth(start, coords.col - 1) + offsetX;
      const inlinePos = this.getColumnsWidth(countColumnsFrom, start - 1) +
        (fixedColumnsStart ? horizontalScrollPosition : 0) + inlineOffset;

      this.#backlight.setPosition(topPos, inlinePos);
      this.#backlight.setSize(this.getColumnsWidth(start, end), wtTable.hider.offsetHeight - topPos);
      this.#backlight.setOffset(0, -inlineOffset);

      addClass(this.hot.rootElement, CSS_ON_MOVING);

    } else {
      removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      this.#pressed = false;
      this.#columnsToMove.length = 0;
    }
  };

  /**
   * 'mouseMove' event callback. Fired when pointer move on document.documentElement.
   *
   * @param {MouseEvent} event `mousemove` event properties.
   */
  #onMouseMove(event: MouseEvent) {
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
  #onBeforeOnCellMouseOver = (
    event: MouseEvent, coords: { row: number, col: number }, TD: HTMLTableCellElement,
    controller: Record<string, boolean>
  ) => {
    const selectedRange = this.hot.getSelectedRangeActive();

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
  };

  /**
   * Suppresses selection changes during a column move drag when the mouse
   * is outside the data viewport (e.g. over column headers during scroll).
   *
   * @param {object} controller The controller object.
   */
  #onBeforeOnCellMouseOverOutside(controller: Record<string, boolean>) {
    if (!this.#pressed) {
      return;
    }

    controller.row = true;
    controller.column = true;
    controller.cell = true;
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
      this.hot.view.adjustElementsSize();
      this.hot.render();

      const selectionStart = this.hot.toVisualColumn(firstMovedPhysicalColumn);
      const selectionEnd = selectionStart + columnsLen - 1;

      this.hot.selectColumns(selectionStart, selectionEnd);
    }
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   */
  #onAfterScrollVertically = () => {
    const wtTable = this.hot.view._wt.wtTable;
    const headerHeight = wtTable.getColumnHeaderHeight(0) + 1;
    const scrollTop = wtTable.holder.scrollTop;
    const posTop = headerHeight + scrollTop;

    this.#backlight.setPosition(posTop);
    this.#backlight.setSize(undefined, wtTable.hider.offsetHeight - posTop);
  };

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
  #onAfterLoadData = () => {
    this.moveBySettingsOrLoad();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#backlight.destroy();
    this.#guideline.destroy();

    super.destroy();
  }
}
