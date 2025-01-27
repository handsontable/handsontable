import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { arrayReduce } from '../../helpers/array';
import { addClass, removeClass, offset, getTrimmingContainer } from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import BacklightUI from './ui/backlight';
import GuidelineUI from './ui/guideline';

Hooks.getSingleton().register('beforeRowMove');
Hooks.getSingleton().register('afterRowMove');

export const PLUGIN_KEY = 'manualRowMove';
export const PLUGIN_PRIORITY = 140;
const CSS_PLUGIN = 'ht__manualRowMove';
const CSS_SHOW_UI = 'show-ui';
const CSS_ON_MOVING = 'on-moving--rows';
const CSS_AFTER_SELECTION = 'after-selection--rows';

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin ManualRowMove
 * @class ManualRowMove
 *
 * @description
 * This plugin allows to change rows order. To make rows order persistent the {@link Options#persistentState}
 * plugin should be enabled.
 *
 * API:
 * - `moveRow` - move single row to the new position.
 * - `moveRows` - move many rows (as an array of indexes) to the new position.
 * - `dragRow` - drag single row to the new position.
 * - `dragRows` - drag many rows (as an array of indexes) to the new position.
 *
 * [Documentation](@/guides/rows/row-moving/row-moving.md) explain differences between drag and move actions. Please keep in mind that if you want apply visual changes,
 * you have to call manually the `render` method on the instance of Handsontable.
 *
 * The plugin creates additional components to make moving possibly using user interface:
 * - backlight - highlight of selected rows.
 * - guideline - line which shows where rows has been moved.
 *
 * @class ManualRowMove
 * @plugin ManualRowMove
 */
export class ManualRowMove extends BasePlugin {
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
  #rowsToMove = [];
  /**
   * @type {boolean}
   */
  #pressed;
  /**
   * @type {object}
   */
  #target = {};
  /**
   * @type {number}
   */
  #cachedDropIndex;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualRowMove#enablePlugin} method is called.
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
    this.addHook('afterScrollHorizontally', () => this.#onAfterScrollHorizontally());
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
   *  - [`manualRowMove`](@/api/options.md#manualrowmove)
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
   * Moves a single row.
   *
   * To see the outcome, rerender your grid by calling [`render()`](@/api/core.md#render).
   *
   * @param {number} row Visual row index to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin).
   * @fires Hooks#beforeRowMove
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  moveRow(row, finalIndex) {
    return this.moveRows([row], finalIndex);
  }

  /**
   * Moves multiple rows.
   *
   * To see the outcome, rerender your grid by calling [`render()`](@/api/core.md#render).
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin).
   * @fires Hooks#beforeRowMove
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  moveRows(rows, finalIndex) {
    const dropIndex = this.#cachedDropIndex;
    const movePossible = this.isMovePossible(rows, finalIndex);
    const beforeMoveHook = this.hot.runHooks('beforeRowMove', rows, finalIndex, dropIndex, movePossible);

    this.#cachedDropIndex = undefined;

    if (beforeMoveHook === false) {
      return;
    }

    if (movePossible) {
      this.hot.rowIndexMapper.moveIndexes(rows, finalIndex);
    }

    const movePerformed = movePossible && this.isRowOrderChanged(rows, finalIndex);

    this.hot.runHooks('afterRowMove', rows, finalIndex, dropIndex, movePossible, movePerformed);

    return movePerformed;
  }

  /**
   * Drag a single row to drop index position.
   *
   * @param {number} row Visual row index to be dragged.
   * @param {number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin).
   * @fires Hooks#beforeRowMove
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  dragRow(row, dropIndex) {
    return this.dragRows([row], dropIndex);
  }

  /**
   * Drag multiple rows to drop index position.
   *
   * @param {Array} rows Array of visual row indexes to be dragged.
   * @param {number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin).
   * @fires Hooks#beforeRowMove
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  dragRows(rows, dropIndex) {
    const finalIndex = this.countFinalIndex(rows, dropIndex);

    this.#cachedDropIndex = dropIndex;

    return this.moveRows(rows, finalIndex);
  }

  /**
   * Indicates if it's possible to move rows to the desired position. Some of the actions aren't possible, i.e. You can’t move more than one element to the last position.
   *
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin).
   * @returns {boolean}
   */
  isMovePossible(movedRows, finalIndex) {
    const length = this.hot.rowIndexMapper.getNotTrimmedIndexesLength();

    // An attempt to transfer more rows to start destination than is possible (only when moving from the top to the bottom).
    const tooHighDestinationIndex = movedRows.length + finalIndex > length;

    const tooLowDestinationIndex = finalIndex < 0;
    const tooLowMovedRowIndex = movedRows.some(movedRow => movedRow < 0);
    const tooHighMovedRowIndex = movedRows.some(movedRow => movedRow >= length);

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
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin).
   * @returns {boolean}
   */
  isRowOrderChanged(movedRows, finalIndex) {
    return movedRows.some((row, nrOfMovedElement) => row - nrOfMovedElement !== finalIndex);
  }

  /**
   * Count the final row index from the drop index.
   *
   * @private
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {number} dropIndex Visual row index, being a drop index for the moved rows.
   * @returns {number} Visual row index, being a start index for the moved rows.
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
   * Gets the sum of the heights of rows in the provided range.
   *
   * @private
   * @param {number} fromRow Visual row index.
   * @param {number} toRow Visual row index.
   * @returns {number}
   */
  getRowsHeight(fromRow, toRow) {
    const rowMapper = this.hot.rowIndexMapper;
    let rowsHeight = 0;

    for (let visualRowIndex = fromRow; visualRowIndex <= toRow; visualRowIndex++) {
      const renderableIndex = rowMapper.getRenderableFromVisualIndex(visualRowIndex);

      if (renderableIndex !== null) {
        rowsHeight += this.hot.view._wt.wtTable.getRowHeight(renderableIndex) || this.hot.view.getDefaultRowHeight();
      }
    }

    return rowsHeight;
  }

  /**
   * Loads initial settings when persistent state is saved or when plugin was initialized as an array.
   *
   * @private
   */
  moveBySettingsOrLoad() {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY];

    if (Array.isArray(pluginSettings)) {
      this.moveRows(pluginSettings, 0);

    } else if (pluginSettings !== undefined) {
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
   * @param {number} row Visual row index to check.
   * @returns {boolean}
   */
  isFixedRowTop(row) {
    return row < this.hot.getSettings().fixedRowsTop;
  }

  /**
   * Checks if the provided row is in the fixedRowsBottom section.
   *
   * @private
   * @param {number} row Visual row index to check.
   * @returns {boolean}
   */
  isFixedRowBottom(row) {
    return row > this.hot.countRows() - 1 - this.hot.getSettings().fixedRowsBottom;
  }

  /**
   * Saves the manual row positions to the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @private
   * @fires Hooks#persistentStateSave
   */
  persistentStateSave() {
    // The `PersistentState` plugin should be refactored.
    this.hot.runHooks('persistentStateSave', 'manualRowMove', this.hot.rowIndexMapper.getIndexesSequence());
  }

  /**
   * Loads the manual row positions from the persistent state (the {@link Options#persistentState} option has to be enabled).
   *
   * @private
   * @fires Hooks#persistentStateLoad
   * @returns {Array} Stored state.
   */
  persistentStateLoad() {
    const storedState = {};

    this.hot.runHooks('persistentStateLoad', 'manualRowMove', storedState);

    return storedState.value ? storedState.value : [];
  }

  /**
   * Prepares an array of indexes based on actual selection.
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
    const coords = this.#target.coords;
    const firstVisible = this.hot.getFirstFullyVisibleRow();
    const lastVisible = this.hot.getLastFullyVisibleRow();
    const countRows = this.hot.countRows();

    if (this.isFixedRowTop(coords.row) && firstVisible > 0) {
      this.hot.scrollViewportTo(this.hot.rowIndexMapper.getNearestNotHiddenIndex(firstVisible - 1, -1));
    }
    if (this.isFixedRowBottom(coords.row) && lastVisible < countRows) {
      this.hot.scrollViewportTo(
        this.hot.rowIndexMapper.getNearestNotHiddenIndex(lastVisible + 1, 1), undefined, true);
    }

    const wtTable = this.hot.view._wt.wtTable;
    const TD = this.#target.TD;
    const rootElement = this.hot.rootElement;
    const rootElementOffset = offset(rootElement);
    const trimmingContainer = getTrimmingContainer(rootElement);
    const tableScroll = wtTable.holder.scrollTop;
    const trimmingContainerScroll = this.hot.rootWindow !== trimmingContainer ? trimmingContainer.scrollTop : 0;

    const pixelsAbove = rootElementOffset.top - trimmingContainerScroll;
    const pixelsRelToTableStart = this.#target.eventPageY - pixelsAbove + tableScroll;
    const hiderHeight = wtTable.hider.offsetHeight;
    const tbodyOffsetTop = wtTable.TBODY.offsetTop;
    const backlightElemMarginTop = this.#backlight.getOffset().top;
    const backlightElemHeight = this.#backlight.getSize().height;
    const tdMiddle = (TD.offsetHeight / 2);
    const tdHeight = TD.offsetHeight;
    let tdStartPixel = this.hot.view.THEAD.offsetHeight + this.getRowsHeight(0, coords.row - 1);
    const isBelowTable = pixelsRelToTableStart >= tdStartPixel + tdMiddle;

    if (this.isFixedRowTop(coords.row)) {
      tdStartPixel += this.hot.view._wt.wtOverlays.topOverlay.getOverlayOffset();
    }

    if (coords.row < 0) {
      // if hover on colHeader
      this.#target.row = firstVisible > 0 ? firstVisible - 1 : firstVisible;
    } else if (isBelowTable) {
      // if hover on lower part of TD
      this.#target.row = coords.row + 1;
      // unfortunately first row is bigger than rest
      tdStartPixel += coords.row === 0 ? tdHeight - 1 : tdHeight;

    } else {
      // elsewhere on table
      this.#target.row = coords.row;
    }

    let backlightTop = pixelsRelToTableStart;
    let guidelineTop = tdStartPixel;

    if (pixelsRelToTableStart + backlightElemHeight + backlightElemMarginTop >= hiderHeight) {
      // prevent display backlight below table
      backlightTop = hiderHeight - backlightElemHeight - backlightElemMarginTop;

    } else if (pixelsRelToTableStart + backlightElemMarginTop < tbodyOffsetTop) {
      // prevent display above below table
      backlightTop = tbodyOffsetTop + Math.abs(backlightElemMarginTop);
    }

    if (tdStartPixel >= hiderHeight - 1) {
      // prevent display guideline below table
      guidelineTop = hiderHeight - 1;
    }

    this.#backlight.setPosition(backlightTop);
    this.#guideline.setPosition(guidelineTop);
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
    const { wtTable, wtViewport } = this.hot.view._wt;
    const isHeaderSelection = this.hot.selection.isSelectedByRowHeader();
    const selection = this.hot.getSelectedRangeLast();

    if (!selection || !isHeaderSelection || this.#pressed || event.button !== 0) {
      this.#pressed = false;
      this.#rowsToMove.length = 0;
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
    const start = Math.min(from.row, to.row);
    const end = Math.max(from.row, to.row);

    if (coords.col < 0 && (coords.row >= start && coords.row <= end)) {
      controller.row = true;
      this.#pressed = true;

      this.#target.eventPageY = event.pageY;
      this.#target.coords = coords;
      this.#target.TD = TD;
      this.#rowsToMove = this.prepareRowsToMoving();

      const leftPos = wtTable.holder.scrollLeft + wtViewport.getRowHeaderWidth();
      const topOffset = this.getRowsHeight(start, coords.row - 1) + (event.clientY - TD.getBoundingClientRect().top);

      this.#backlight.setPosition(null, leftPos);
      this.#backlight.setSize(wtTable.hider.offsetWidth - leftPos, this.getRowsHeight(start, end));
      this.#backlight.setOffset(-topOffset, null);

      addClass(this.hot.rootElement, CSS_ON_MOVING);

      this.refreshPositions();

    } else {
      removeClass(this.hot.rootElement, CSS_AFTER_SELECTION);
      this.#pressed = false;
      this.#rowsToMove.length = 0;
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

    this.#target.eventPageY = event.pageY;
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

    if (this.#rowsToMove.indexOf(coords.row) > -1) {
      removeClass(this.hot.rootElement, CSS_SHOW_UI);

    } else {
      addClass(this.hot.rootElement, CSS_SHOW_UI);
    }

    controller.row = true;
    controller.column = true;
    controller.cell = true;
    this.#target.coords = coords;
    this.#target.TD = TD;
  }

  /**
   * `onMouseUp` hook callback.
   */
  #onMouseUp() {
    const target = this.#target.row;
    const rowsLen = this.#rowsToMove.length;

    this.#pressed = false;

    removeClass(this.hot.rootElement, [CSS_ON_MOVING, CSS_SHOW_UI, CSS_AFTER_SELECTION]);

    if (this.hot.selection.isSelectedByRowHeader()) {
      addClass(this.hot.rootElement, CSS_AFTER_SELECTION);
    }

    if (rowsLen < 1 || target === undefined) {
      return;
    }

    const firstMovedVisualRow = this.#rowsToMove[0];
    const firstMovedPhysicalRow = this.hot.toPhysicalRow(firstMovedVisualRow);
    const movePerformed = this.dragRows(this.#rowsToMove, target);

    this.#rowsToMove.length = 0;

    if (movePerformed === true) {
      this.persistentStateSave();
      this.hot.render();
      this.hot.view.adjustElementsSize();

      const selectionStart = this.hot.toVisualRow(firstMovedPhysicalRow);
      const selectionEnd = selectionStart + rowsLen - 1;

      this.hot.selectRows(selectionStart, selectionEnd);
    }
  }

  /**
   * `afterScrollHorizontally` hook callback. Fired the table was scrolled horizontally.
   */
  #onAfterScrollHorizontally() {
    const wtTable = this.hot.view._wt.wtTable;
    const headerWidth = this.hot.view._wt.wtViewport.getRowHeaderWidth();
    const scrollLeft = wtTable.holder.scrollLeft;
    const posLeft = headerWidth + scrollLeft;

    this.#backlight.setPosition(null, posLeft);
    this.#backlight.setSize(wtTable.hider.offsetWidth - posLeft);
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
