import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { arrayReduce } from '../../helpers/array';
import { addClass, removeClass, offset, outerWidth } from '../../helpers/dom/element';
import { offsetRelativeTo } from '../../helpers/dom/event';
import { rangeEach } from '../../helpers/number';
import { clampFixedColumnsEnd } from '../../3rdparty/walkontable/src/settings/fixedColumnsEnd';
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
// Matches ColumnSorting's tolerance. Kept as a local constant rather than imported - plugins do not
// import each other.
const POINTER_DRAG_TOLERANCE = 3;

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
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
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
   * Whether the pointer traveled far enough since the header was pressed to count as a drag. A
   * press that stayed put is a click to sort, so no columns move and the move hooks stay quiet.
   */
  #dragged = false;
  /**
   * Pointer client coordinates captured on press, for measuring that travel.
   */
  #pressOrigin = { x: 0, y: 0 };
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
   * The combined height of the column header levels above the grabbed header cell, captured when a
   * drag starts. The backlight starts at the top of the grabbed cell (so grabbing a top group covers
   * the full header height, while grabbing a leaf header covers only its own row downward). Reused
   * when the table is scrolled mid-drag.
   *
   * @type {number}
   */
  #grabbedHeaderOffsetTop = 0;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualColumnMove#enablePlugin} method is called.
   * When {@link Options#dataProvider} is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.
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
    return this.runOperation('col_move', () => {
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
    }, { columns: Array.isArray(columns) ? columns.slice() : columns, finalColumnIndex: finalIndex });
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
   * Checks whether a column drag is in progress - the header is held down and the pointer has
   * traveled far enough to count as a drag rather than a click.
   *
   * `ColumnSorting` asks this on release to tell a click apart from a drag, so the two plugins
   * cannot disagree about where that line is.
   *
   * @returns {boolean}
   */
  isDragging(): boolean {
    return this.enabled && this.#pressed && this.#dragged;
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

    return this.#keepsEndBandIntact(movedColumns, finalIndex);
  }

  /**
   * The frozen end columns are a band of their own: a move may not change which columns the band holds. A column
   * cannot leave it, a scrolling column cannot land in it, and a selection that holds both is allowed only when
   * the result puts the same columns back in the band (for example a full saved column order that keeps the
   * end columns last). Without `fixedColumnsEnd` nothing is restricted.
   *
   * @param {Array} movedColumns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns.
   * @returns {boolean}
   */
  #keepsEndBandIntact(movedColumns: number[], finalIndex: number): boolean {
    const endCount = this.getFixedColumnsEndCount();

    if (endCount === 0 || movedColumns.length === 0) {
      return true;
    }

    // The band sits at the end of the columns the grid draws (`countCols()`, capped by `maxCols`), which is not
    // the end of the not trimmed ones when `maxCols` is lower than the source column count.
    const totalColumns = this.hot.countCols();
    const bandStart = totalColumns - endCount;
    const length = this.hot.columnIndexMapper.getNotTrimmedIndexesLength();
    const moved = new Set(movedColumns);
    const remaining: number[] = [];

    for (let column = 0; column < length; column++) {
      if (!moved.has(column)) {
        remaining.push(column);
      }
    }

    // The order after the move: the moved columns are taken out and put back at the final index.
    const order = [...remaining.slice(0, finalIndex), ...movedColumns, ...remaining.slice(finalIndex)];

    // The band is intact when its slots still hold columns that were in the band before the move.
    for (let slot = bandStart; slot < totalColumns; slot++) {
      if (order[slot] < bandStart || order[slot] >= totalColumns) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets how far (a negative number) the frozen end columns sit from their place in the scrolled content. The
   * end overlay is pinned to the inline-end edge of the viewport, while the backlight and the guideline are
   * positioned in the content that scrolls under it. Zero when the grid is scrolled to its inline end.
   *
   * The distance is read from the rendered boxes, so it holds for a grid the element scrolls and for a grid the
   * window scrolls alike: the viewport width of the window includes the scrollbar and ignores the offset of the
   * grid's root in the page, the boxes do not.
   *
   * @returns {number}
   */
  #getEndBandShift(): number {
    const { wtTable, wtOverlays } = this.hot.view._wt;
    const endClone = wtOverlays.inlineEndOverlay?.clone;

    if (!endClone) {
      return 0;
    }

    const endRect = endClone.wtTable.holder.getBoundingClientRect();
    const hiderRect = wtTable.hider.getBoundingClientRect();

    return Math.min(0, this.hot.isRtl() ? hiderRect.left - endRect.left : endRect.right - hiderRect.right);
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
   * Gets the number of columns the inline-end overlay really holds, after the `fixedColumnsStart` priority
   * clamp. The columns are the last ones in the visual order.
   *
   * @private
   * @returns {number}
   */
  getFixedColumnsEndCount(): number {
    const { fixedColumnsEnd, fixedColumnsStart } = this.hot.getSettings();

    // The initial `manualColumnMove` array moves the columns while the plugin is enabled, before the table view
    // exists. A grid with no end columns has nothing to count, so answer without reading the view.
    if (!fixedColumnsEnd) {
      return 0;
    }

    // Without the view, count over the same total the view uses (`countCols()`, capped by `maxCols`).
    if (!this.hot.view) {
      return clampFixedColumnsEnd(fixedColumnsEnd, fixedColumnsStart, this.hot.countCols());
    }

    return this.hot.view.countFixedColumnsEnd();
  }

  /**
   * Checks if the provided column is in the fixedColumnsEnd section.
   *
   * @private
   * @param {number} column Visual column index to check.
   * @returns {boolean}
   */
  isFixedColumnsEnd(column: number): boolean {
    const endCount = this.getFixedColumnsEndCount();

    const totalColumns = this.hot.countCols();

    return endCount > 0 && column >= totalColumns - endCount && column < totalColumns;
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

    const mouseOffsetStart = this.#calculateMouseOffsetStart(
      scrollableElement, scrollStart, rootElementOffset
    );

    if (this.#hasRowHeaders) {
      const inlineClone = this.hot.view._wt.wtOverlays.inlineStartOverlay.clone;

      rowHeaderWidth = inlineClone?.wtTable.getColumnHeader(-1)?.offsetWidth ?? 0;
    }

    if (this.isFixedColumnsStart(hoveredColumn)) {
      tdOffsetStart += scrollStart;

    } else if (this.isFixedColumnsEnd(hoveredColumn)) {
      tdOffsetStart += this.#getEndBandShift();
    }

    tdOffsetStart += rowHeaderWidth;

    tdOffsetStart = this.#calculateTargetCol(
      hoveredColumn, tdOffsetStart, mouseOffsetStart, firstVisible, fixedColumnsStart
    );

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
    this.#placeGuideline(guidelineStart, this.isFixedColumnsStart(hoveredColumn) ? scrollStart : 0);
  }

  /**
   * Places the guideline. Over a frozen start column it goes into the frozen overlay and not into the master
   * table: the overlay paints over the master as a whole (the master is a stacking context), so a guideline
   * living in the master is covered there however high its `z-index` is. The line stays in the master
   * everywhere else, where it scrolls with the columns.
   *
   * @param {number} masterStart The guideline start offset in the master table's coordinates.
   * @param {number} frozenShift The scroll offset that `masterStart` already includes for a frozen column.
   */
  #placeGuideline(masterStart: number, frozenShift: number) {
    const masterHider = this.hot.view._wt.wtTable.hider;
    const overFrozen = this.isFixedColumnsStart(this.#hoveredColumn ?? 0);
    const cloneTable = overFrozen ? this.hot.view._wt.wtOverlays.inlineStartOverlay.clone?.wtTable : undefined;
    const cloneHider = cloneTable?.hider;

    if (!cloneTable || !cloneHider) {
      this.#attachGuideline(masterHider);
      this.#guideline.setPosition(undefined, masterStart);

      return;
    }

    this.#attachGuideline(cloneHider);
    // The overlay's table starts at the grid's start edge, so the position is the master one without the scroll
    // offset. A drop at the freeze line is the table's last pixel: the overlay holder clips anything past it. The overlay's hider
    // has no width of its own, so the table is measured.
    this.#guideline.setPosition(
      undefined,
      Math.min(Math.max(masterStart - frozenShift, 1), cloneTable.TABLE.offsetWidth - 1)
    );
  }

  /**
   * Moves the guideline into the given hider, unless it is already there. A guideline that was never appended is
   * left alone: `onMouseDown` appends it together with the backlight, and appending it here first would make that
   * check skip the backlight.
   *
   * @param {HTMLElement} hider The hider of the table to draw the guideline in.
   */
  #attachGuideline(hider: HTMLElement) {
    if (this.#guideline.isAppended() && this.#guideline._element!.parentElement !== hider) {
      this.#guideline.appendTo(hider);
    }
  }

  /**
   * Calculates the mouse offset from the start of the grid, accounting for RTL direction.
   *
   * @param {Window | HTMLElement} scrollableElement The scrollable container element.
   * @param {number} scrollStart The current scroll position.
   * @param {number} rootElementOffset The offset of the root element.
   * @returns {number}
   */
  #calculateMouseOffsetStart(
    scrollableElement: Window | Element,
    scrollStart: number,
    rootElementOffset: number
  ): number {
    if (this.hot.isRtl()) {
      const rootWindow = this.hot.rootWindow;
      const containerWidth = outerWidth(this.hot.rootElement);
      const gridMostRightPos = rootWindow.innerWidth - rootElementOffset - containerWidth;

      return rootWindow.innerWidth - this.#target.eventPageX - gridMostRightPos -
        (!(scrollableElement instanceof Window) ? scrollStart : 0);
    }

    return this.#target.eventPageX -
      (rootElementOffset - (!(scrollableElement instanceof Window) ? scrollStart : 0));
  }

  /**
   * Calculates the target column based on hover position and updates `#target.col`.
   * Returns the updated tdOffsetStart value.
   *
   * @param {number} hoveredColumn The currently hovered column index.
   * @param {number} tdOffsetStart The current TD offset from the start.
   * @param {number} mouseOffsetStart The current mouse offset from the start.
   * @param {number} firstVisible The first fully visible column index.
   * @param {number} fixedColumnsStart The number of fixed columns at the start.
   * @returns {number}
   */
  #calculateTargetCol(
    hoveredColumn: number,
    tdOffsetStart: number,
    mouseOffsetStart: number,
    firstVisible: number,
    fixedColumnsStart: number
  ): number {
    if (hoveredColumn < 0) {
      // if hover on rowHeader
      if (fixedColumnsStart > 0) {
        this.#target.col = 0;
      } else {
        this.#target.col = firstVisible > 0 ? firstVisible - 1 : firstVisible;
      }

      return tdOffsetStart;
    }

    return this.#resolveTargetWithinHeader(hoveredColumn, tdOffsetStart, mouseOffsetStart);
  }

  /**
   * Resolves the drop target when hovering a header cell, snapping to a child-column boundary even
   * when the hovered header spans several columns (a nested group header). Walks the visible leaf
   * columns the header covers to find the one under the cursor, then picks the nearer edge - so the
   * guideline jumps per child column, and the column drops inside the group when released between two
   * children and aside when released at the group's left or right edge. Updates `#target.col` and
   * returns the guideline start offset (a real column boundary).
   *
   * @param {number} hoveredColumn The hovered header's leftmost (anchor) column index.
   * @param {number} tdOffsetStart The start offset of the hovered header's left edge.
   * @param {number} mouseOffsetStart The cursor offset from the start.
   * @returns {number}
   */
  #resolveTargetWithinHeader(hoveredColumn: number, tdOffsetStart: number, mouseOffsetStart: number): number {
    const headerEnd = tdOffsetStart + this.#target.TD.offsetWidth;
    let edge = tdOffsetStart;
    let column = hoveredColumn;

    while (column < this.#countCols) {
      const width = this.getColumnsWidth(column, column);

      // Stop on the column under the cursor, or on the last column the header covers (its right edge
      // reaches the header's end). A hidden column has zero width, so it is stepped over.
      if ((width > 0 && mouseOffsetStart < edge + width) || edge + width >= headerEnd) {
        if ((width / 2) + edge <= mouseOffsetStart) {
          // A drop at a column's right edge should land past any hidden (zero-width) columns that
          // follow it, so releasing at the visible end of a collapsed group drops after the whole
          // group rather than between its visible column and an adjacent hidden one.
          let targetColumn = column + 1;

          while (targetColumn < this.#countCols && this.getColumnsWidth(targetColumn, targetColumn) === 0) {
            targetColumn += 1;
          }

          this.#target.col = targetColumn;

          return edge + width;
        }

        this.#target.col = column;

        return edge;
      }

      edge += width;
      column += 1;
    }

    this.#target.col = column;

    return edge;
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

    if (!selection || !isHeaderSelection || this.#pressed || event.button !== 0) {
      this.#pressed = false;
      this.#dragged = false;
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
      this.#pressOrigin = { x: event.clientX, y: event.clientY };

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

      // Start the backlight at the top of the grabbed header cell: the grabbed level is the row's
      // distance from the topmost header, and the offset is the height of every level above it.
      this.#grabbedHeaderOffsetTop = this.#columnHeadersHeightAbove(coords.row + wtTable.getColumnHeadersCount());

      const topPos = wtTable.holder.scrollTop + this.#grabbedHeaderOffsetTop + 1;
      const fixedColumnsStart = coords.col < (this.#fixedColumnsStart ?? 0);
      const horizontalScrollPosition = this.hot.view._wt.wtOverlays.inlineStartOverlay.getOverlayOffset();
      const endBandShift = this.isFixedColumnsEnd(coords.col) ? this.#getEndBandShift() : 0;
      const offsetX = Math.abs(eventOffsetX - (this.hot.isRtl() ? TD.offsetWidth : 0));
      const inlineOffset = this.getColumnsWidth(start, coords.col - 1) + offsetX;
      const inlinePos = this.getColumnsWidth(countColumnsFrom, start - 1) +
        (fixedColumnsStart ? horizontalScrollPosition : 0) + endBandShift + inlineOffset;

      this.#backlight.setPosition(topPos, inlinePos);
      this.#backlight.setSize(this.getColumnsWidth(start, end), wtTable.hider.offsetHeight - topPos);
      this.#backlight.setOffset(0, -inlineOffset);

      this.#dragged = false;

      addClass(this.hot.rootElement, CSS_ON_MOVING);

    } else {
      removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      this.#pressed = false;
      this.#dragged = false;
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

    // Same tolerance ColumnSorting uses to tell a click from a drag, so a pointer that jitters a
    // pixel or two does not both sort and fire the move hooks.
    if (Math.abs(event.clientX - this.#pressOrigin.x) > POINTER_DRAG_TOLERANCE ||
        Math.abs(event.clientY - this.#pressOrigin.y) > POINTER_DRAG_TOLERANCE) {
      this.#dragged = true;
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
    const wasDragged = this.#dragged;

    this.#hoveredColumn = undefined;
    this.#pressed = false;
    this.#dragged = false;

    // The next drag starts with the guideline in the master table, where `onMouseDown` expects it.
    this.#attachGuideline(this.hot.view._wt.wtTable.hider);

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.isSelectedByColumnHeader()) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }

    // A press that never traveled is a click, not a move. Bailing out here also keeps
    // `beforeColumnMove` / `afterColumnMove` from firing on every header click.
    if (!wasDragged || columnsLen < 1 || target === undefined) {
      this.#columnsToMove.length = 0;

      return;
    }

    const firstMovedVisualColumn = this.#columnsToMove[0];
    const firstMovedPhysicalColumn = this.hot.toPhysicalColumn(firstMovedVisualColumn);
    const movePerformed = this.dragColumns(this.#columnsToMove, target);

    this.#columnsToMove.length = 0;

    if (movePerformed === true) {
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
    const posTop = this.#grabbedHeaderOffsetTop + 1 + wtTable.holder.scrollTop;

    this.#backlight.setPosition(posTop);
    this.#backlight.setSize(undefined, wtTable.hider.offsetHeight - posTop);
  };

  /**
   * Sums the heights of the column header levels above the given level - the vertical offset from the
   * top of the column headers down to the top of a cell at that level. Used to anchor the drag
   * backlight at the top of the grabbed header cell.
   *
   * @param {number} level The grabbed header level (0 = topmost header row).
   * @returns {number}
   */
  #columnHeadersHeightAbove(level: number): number {
    const wtTable = this.hot.view._wt.wtTable;
    let height = 0;

    for (let aboveLevel = 0; aboveLevel < level; aboveLevel++) {
      height += wtTable.getColumnHeaderHeight(aboveLevel);
    }

    return height;
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
