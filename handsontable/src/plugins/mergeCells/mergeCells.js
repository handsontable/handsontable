import { BasePlugin, defaultMainSettingSymbol } from '../base';
import { Hooks } from '../../core/hooks';
import MergedCellsCollection from './cellsCollection';
import MergedCellCoords from './cellCoords';
import AutofillCalculations from './calculations/autofill';
import SelectionCalculations from './calculations/selection';
import toggleMergeItem from './contextMenuItem/toggleMerge';
import { arrayEach } from '../../helpers/array';
import { isObject } from '../../helpers/object';
import { warn } from '../../helpers/console';
import { rangeEach, clamp } from '../../helpers/number';
import { getStyle } from '../../helpers/dom/element';
import { isChrome } from '../../helpers/browser';
import { FocusOrder } from './focusOrder';
import { createMergeCellRenderer } from './renderer';

Hooks.getSingleton().register('beforeMergeCells');
Hooks.getSingleton().register('afterMergeCells');
Hooks.getSingleton().register('beforeUnmergeCells');
Hooks.getSingleton().register('afterUnmergeCells');

export const PLUGIN_KEY = 'mergeCells';
export const PLUGIN_PRIORITY = 150;
const SHORTCUTS_GROUP = PLUGIN_KEY;

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin MergeCells
 * @class MergeCells
 *
 * @description
 * Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *  data: getData(),
 *  mergeCells: [
 *    {row: 0, col: 3, rowspan: 3, colspan: 3},
 *    {row: 2, col: 6, rowspan: 2, colspan: 2},
 *    {row: 4, col: 8, rowspan: 3, colspan: 3}
 *  ],
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   // enable plugin
 *   mergeCells={[
 *    {row: 0, col: 3, rowspan: 3, colspan: 3},
 *    {row: 2, col: 6, rowspan: 2, colspan: 2},
 *    {row: 4, col: 8, rowspan: 3, colspan: 3}
 *   ]}
 * />
 * ```
 * :::
 */
export class MergeCells extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      [defaultMainSettingSymbol]: 'cells',
      virtualized: false,
      cells: [],
    };
  }

  /**
   * A container for all the merged cells.
   *
   * @private
   * @type {MergedCellsCollection}
   */
  mergedCellsCollection = null;
  /**
   * Instance of the class responsible for all the autofill-related calculations.
   *
   * @private
   * @type {AutofillCalculations}
   */
  autofillCalculations = null;
  /**
   * Instance of the class responsible for the selection-related calculations.
   *
   * @private
   * @type {SelectionCalculations}
   */
  selectionCalculations = null;
  /**
   * The holder for the last selected focus coordinates. This allows keeping the correct coordinates in cases after the
   * focus is moved out of the merged cell.
   *
   * @type {CellCoords}
   */
  #lastSelectedFocus = null;
  /**
   * The last used transformation delta.
   *
   * @type {{ row: number, col: number }}
   */
  #lastFocusDelta = { row: 0, col: 0 };
  /**
   * The module responsible for providing the correct focus order (vertical and horizontal) within a selection that
   * contains merged cells.
   *
   * @type {FocusOrder}
   */
  #focusOrder = new FocusOrder({
    mergedCellsGetter: (row, column) => this.mergedCellsCollection.get(row, column),
    rowIndexMapper: this.hot.rowIndexMapper,
    columnIndexMapper: this.hot.columnIndexMapper,
  });
  /**
   * The cell renderer responsible for rendering the merged cells.
   *
   * @type {{before: Function, after: Function}}
   */
  #cellRenderer = createMergeCellRenderer(this);

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link MergeCells#enablePlugin} method is called.
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

    this.mergedCellsCollection = new MergedCellsCollection(this);
    this.autofillCalculations = new AutofillCalculations(this);
    this.selectionCalculations = new SelectionCalculations(this);

    this.addHook('afterInit', (...args) => this.#onAfterInit(...args));
    this.addHook('modifyTransformFocus', (...args) => this.#onModifyTransformFocus(...args));
    this.addHook('modifyTransformStart', (...args) => this.#onModifyTransformStart(...args));
    this.addHook('modifyTransformEnd', (...args) => this.#onModifyTransformEnd(...args));
    this.addHook('beforeSelectionHighlightSet', (...args) => this.#onBeforeSelectionHighlightSet(...args));
    this.addHook('beforeSetRangeStart', (...args) => this.#onBeforeSetRangeStart(...args));
    this.addHook('beforeSetRangeStartOnly', (...args) => this.#onBeforeSetRangeStart(...args));
    this.addHook('beforeSelectionFocusSet', (...args) => this.#onBeforeSelectionFocusSet(...args));
    this.addHook('afterSelectionFocusSet', (...args) => this.#onAfterSelectionFocusSet(...args));
    this.addHook('afterSelectionEnd', (...args) => this.#onAfterSelectionEnd(...args));
    this.addHook('modifyGetCellCoords', (...args) => this.#onModifyGetCellCoords(...args));
    this.addHook('modifyGetCoordsElement', (...args) => this.#onModifyGetCellCoords(...args));
    this.addHook('afterIsMultipleSelection', (...args) => this.#onAfterIsMultipleSelection(...args));
    this.addHook('afterRenderer', (...args) => this.#cellRenderer.after(...args));
    this.addHook('afterContextMenuDefaultOptions', (...args) => this.#addMergeActionsToContextMenu(...args));
    this.addHook('afterGetCellMeta', (...args) => this.#onAfterGetCellMeta(...args));
    this.addHook('afterViewportRowCalculatorOverride',
      (...args) => this.#onAfterViewportRowCalculatorOverride(...args));
    this.addHook('afterViewportColumnCalculatorOverride',
      (...args) => this.#onAfterViewportColumnCalculatorOverride(...args));
    this.addHook('modifyAutofillRange', (...args) => this.#onModifyAutofillRange(...args));
    this.addHook('afterCreateCol', (...args) => this.#onAfterCreateCol(...args));
    this.addHook('afterRemoveCol', (...args) => this.#onAfterRemoveCol(...args));
    this.addHook('afterCreateRow', (...args) => this.#onAfterCreateRow(...args));
    this.addHook('afterRemoveRow', (...args) => this.#onAfterRemoveRow(...args));
    this.addHook('afterChange', (...args) => this.#onAfterChange(...args));
    this.addHook('beforeDrawBorders', (...args) => this.#onBeforeDrawAreaBorders(...args));
    this.addHook('afterDrawSelection', (...args) => this.#onAfterDrawSelection(...args));
    this.addHook('beforeRemoveCellClassNames', (...args) => this.#onBeforeRemoveCellClassNames(...args));
    this.addHook('beforeBeginEditing', (...args) => this.#onBeforeBeginEditing(...args));
    this.addHook('modifyRowHeightByOverlayName', (...args) => this.#onModifyRowHeightByOverlayName(...args));
    this.addHook('beforeUndoStackChange', (action, source) => {
      if (source === 'MergeCells') {
        return false;
      }
    });

    this.registerShortcuts();

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.clearCollections();
    this.unregisterShortcuts();
    this.hot.render();
    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
   * following configuration options:
   *  - [`mergeCells`](@/api/options.md#mergecells)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.generateFromSettings();

    super.updatePlugin();
  }

  /**
   * If the browser is recognized as Chrome, force an additional repaint to prevent showing the effects of a Chrome bug.
   *
   * Issue described in https://github.com/handsontable/dev-handsontable/issues/521.
   *
   * @private
   */
  ifChromeForceRepaint() {
    if (!isChrome()) {
      return;
    }

    const rowsToRefresh = [];
    let rowIndexesToRefresh = [];

    this.mergedCellsCollection.mergedCells.forEach((mergedCell) => {
      const { row, rowspan } = mergedCell;

      for (let r = row + 1; r < row + rowspan; r++) {
        rowIndexesToRefresh.push(r);
      }
    });

    // Remove duplicates
    rowIndexesToRefresh = [...new Set(rowIndexesToRefresh)];

    rowIndexesToRefresh.forEach((rowIndex) => {
      const renderableRowIndex = this.hot.rowIndexMapper.getRenderableFromVisualIndex(rowIndex);

      this.hot.view._wt.wtOverlays.getOverlays(true).map(
        overlay => (overlay?.name === 'master' ? overlay : overlay.clone.wtTable)
      ).forEach((wtTableRef) => {
        const rowToRefresh = wtTableRef.getRow(renderableRowIndex);

        if (rowToRefresh) {
          // Modify the TR's `background` property to later modify it asynchronously.
          // The background color is getting modified only with the alpha, so the change should not be visible (and is
          // covered by the TDs' background color).
          rowToRefresh.style.background =
            getStyle(rowToRefresh, 'backgroundColor').replace(')', ', 0.99)');

          rowsToRefresh.push(rowToRefresh);
        }
      });
    });

    // Asynchronously revert the TRs' `background` property to force a fresh repaint.
    this.hot._registerTimeout(() => {
      rowsToRefresh.forEach((rowElement) => {
        rowElement.style.background =
          getStyle(rowElement, 'backgroundColor').replace(', 0.99)', ')');
      });
    }, 1);
  }

  /**
   * Validates a single setting object, represented by a single merged cell information object.
   *
   * @private
   * @param {object} setting An object with `row`, `col`, `rowspan` and `colspan` properties.
   * @returns {boolean}
   */
  validateSetting(setting) {
    if (!setting) {
      return false;
    }

    if (MergedCellCoords.containsNegativeValues(setting)) {
      warn(MergedCellCoords.NEGATIVE_VALUES_WARNING(setting));

      return false;
    }
    if (MergedCellCoords.isOutOfBounds(setting, this.hot.countRows(), this.hot.countCols())) {
      warn(MergedCellCoords.IS_OUT_OF_BOUNDS_WARNING(setting));

      return false;
    }
    if (MergedCellCoords.isSingleCell(setting)) {
      warn(MergedCellCoords.IS_SINGLE_CELL(setting));

      return false;
    }
    if (MergedCellCoords.containsZeroSpan(setting)) {
      warn(MergedCellCoords.ZERO_SPAN_WARNING(setting));

      return false;
    }

    return true;
  }

  /**
   * Generates the merged cells from the settings provided to the plugin.
   *
   * @private
   */
  generateFromSettings() {
    const validSettings = this.getSetting('cells')
      .filter(mergeCellInfo => this.validateSetting(mergeCellInfo));
    const nonOverlappingSettings = this.mergedCellsCollection
      .filterOverlappingMergeCells(validSettings);

    const populatedNulls = [];

    nonOverlappingSettings.forEach((mergeCellInfo) => {
      const { row, col, rowspan, colspan } = mergeCellInfo;
      const from = this.hot._createCellCoords(row, col);
      const to = this.hot._createCellCoords(row + rowspan - 1, col + colspan - 1);
      const mergeRange = this.hot._createCellRange(from, from, to);

      // Merging without data population.
      this.mergeRange(mergeRange, true, true);

      for (let r = row; r < row + rowspan; r++) {
        for (let c = col; c < col + colspan; c++) {
          // Not resetting a cell representing a merge area's value.
          if (r !== row || c !== col) {
            populatedNulls.push([r, c, null]);
          }
        }
      }
    });

    // There are no merged cells. Thus, no data population is needed.
    if (populatedNulls.length === 0) {
      return;
    }

    // TODO: Change the `source` argument to a more meaningful value, e.g. `${this.pluginName}.clearCells`.
    this.hot.setDataAtCell(populatedNulls, undefined, undefined, this.pluginName);
  }

  /**
   * Clears the merged cells from the merged cell container.
   */
  clearCollections() {
    this.mergedCellsCollection.clear();
  }

  /**
   * Returns `true` if a range is mergeable.
   *
   * @private
   * @param {object} newMergedCellInfo Merged cell information object to test.
   * @param {boolean} [auto=false] `true` if triggered at initialization.
   * @returns {boolean}
   */
  canMergeRange(newMergedCellInfo, auto = false) {
    return auto ? true : this.validateSetting(newMergedCellInfo);
  }

  /**
   * Merges the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  mergeSelection(cellRange = this.hot.getSelectedRangeLast()) {
    if (!cellRange) {
      return;
    }

    cellRange.setDirection(this.hot.isRtl() ? 'NE-SW' : 'NW-SE');

    const { from, to } = cellRange;

    this.unmergeRange(cellRange, true);
    this.mergeRange(cellRange);
    this.hot.selectCell(from.row, from.col, to.row, to.col, false);
  }

  /**
   * Unmerges the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  unmergeSelection(cellRange = this.hot.getSelectedRangeLast()) {
    if (!cellRange) {
      return;
    }

    const { from, to } = cellRange;

    this.unmergeRange(cellRange, true);
    this.hot.selectCell(from.row, from.col, to.row, to.col, false);
  }

  /**
   * Merges cells in the provided cell range.
   *
   * @private
   * @param {CellRange} cellRange Cell range to merge.
   * @param {boolean} [auto=false] `true` if is called automatically, e.g. At initialization.
   * @param {boolean} [preventPopulation=false] `true`, if the method should not run `populateFromArray` at the end,
   *   but rather return its arguments.
   * @returns {Array|boolean} Returns an array of [row, column, dataUnderCollection] if preventPopulation is set to
   *   true. If the the merging process went successful, it returns `true`, otherwise - `false`.
   * @fires Hooks#beforeMergeCells
   * @fires Hooks#afterMergeCells
   */
  mergeRange(cellRange, auto = false, preventPopulation = false) {
    const topStart = cellRange.getTopStartCorner();
    const bottomEnd = cellRange.getBottomEndCorner();
    const mergeParent = {
      row: topStart.row,
      col: topStart.col,
      rowspan: bottomEnd.row - topStart.row + 1,
      colspan: bottomEnd.col - topStart.col + 1
    };
    const clearedData = [];
    let populationInfo = null;

    if (!this.canMergeRange(mergeParent, auto)) {
      return false;
    }

    this.hot.runHooks('beforeMergeCells', cellRange, auto);

    rangeEach(0, mergeParent.rowspan - 1, (i) => {
      rangeEach(0, mergeParent.colspan - 1, (j) => {
        let clearedValue = null;

        if (!clearedData[i]) {
          clearedData[i] = [];
        }

        if (i === 0 && j === 0) {
          clearedValue = this.hot.getSourceDataAtCell(this.hot.toPhysicalRow(mergeParent.row),
            this.hot.toPhysicalColumn(mergeParent.col));

        } else {
          this.hot.setCellMeta(mergeParent.row + i, mergeParent.col + j, 'hidden', true);
        }

        clearedData[i][j] = clearedValue;
      });
    });

    this.hot.setCellMeta(mergeParent.row, mergeParent.col, 'spanned', true);

    const mergedCellAdded = this.mergedCellsCollection.add(mergeParent, auto);

    if (mergedCellAdded) {
      if (preventPopulation) {
        populationInfo = [mergeParent.row, mergeParent.col, clearedData];

      } else {
        // TODO: Change the `source` argument to a more meaningful value, e.g. `${this.pluginName}.clearCells`.
        this.hot.populateFromArray(
          mergeParent.row, mergeParent.col, clearedData, undefined, undefined, this.pluginName);
      }

      if (!auto) {
        this.ifChromeForceRepaint();
      }

      this.hot.runHooks('afterMergeCells', cellRange, mergeParent, auto);

      return populationInfo;
    }

    return true;
  }

  /**
   * Unmerges the selection provided as a cell range. If no cell range is provided, it uses the current selection.
   *
   * @private
   * @param {CellRange} cellRange Selection cell range.
   * @param {boolean} [auto=false] `true` if called automatically by the plugin.
   *
   * @fires Hooks#beforeUnmergeCells
   * @fires Hooks#afterUnmergeCells
   */
  unmergeRange(cellRange, auto = false) {
    const mergedCells = this.mergedCellsCollection.getWithinRange(cellRange);

    if (mergedCells.length === 0) {
      return;
    }

    this.hot.runHooks('beforeUnmergeCells', cellRange, auto);

    arrayEach(mergedCells, (currentCollection) => {
      this.mergedCellsCollection.remove(currentCollection.row, currentCollection.col);

      rangeEach(0, currentCollection.rowspan - 1, (i) => {
        rangeEach(0, currentCollection.colspan - 1, (j) => {
          this.hot.removeCellMeta(currentCollection.row + i, currentCollection.col + j, 'hidden');
          this.hot.removeCellMeta(currentCollection.row + i, currentCollection.col + j, 'copyable');
        });
      });

      this.hot.removeCellMeta(currentCollection.row, currentCollection.col, 'spanned');
    });

    this.hot.runHooks('afterUnmergeCells', cellRange, auto);
    this.hot.render();
  }

  /**
   * Merges or unmerges, based on the cell range provided as `cellRange`.
   *
   * @private
   * @param {CellRange} cellRange The cell range to merge or unmerged.
   */
  toggleMerge(cellRange) {
    const mergedCell = this.mergedCellsCollection.get(cellRange.from.row, cellRange.from.col);
    const mergedCellCoversWholeRange = mergedCell.row === cellRange.from.row &&
      mergedCell.col === cellRange.from.col &&
      mergedCell.row + mergedCell.rowspan - 1 === cellRange.to.row &&
      mergedCell.col + mergedCell.colspan - 1 === cellRange.to.col;

    if (mergedCellCoversWholeRange) {
      this.unmergeRange(cellRange);

    } else {
      this.mergeSelection(cellRange);
    }
  }

  /**
   * Merges the specified range.
   *
   * @param {number} startRow Start row of the merged cell.
   * @param {number} startColumn Start column of the merged cell.
   * @param {number} endRow End row of the merged cell.
   * @param {number} endColumn End column of the merged cell.
   * @fires Hooks#beforeMergeCells
   * @fires Hooks#afterMergeCells
   */
  merge(startRow, startColumn, endRow, endColumn) {
    const start = this.hot._createCellCoords(startRow, startColumn);
    const end = this.hot._createCellCoords(endRow, endColumn);

    this.mergeRange(this.hot._createCellRange(start, start, end));
  }

  /**
   * Unmerges the merged cell in the provided range.
   *
   * @param {number} startRow Start row of the merged cell.
   * @param {number} startColumn Start column of the merged cell.
   * @param {number} endRow End row of the merged cell.
   * @param {number} endColumn End column of the merged cell.
   * @fires Hooks#beforeUnmergeCells
   * @fires Hooks#afterUnmergeCells
   */
  unmerge(startRow, startColumn, endRow, endColumn) {
    const start = this.hot._createCellCoords(startRow, startColumn);
    const end = this.hot._createCellCoords(endRow, endColumn);

    this.unmergeRange(this.hot._createCellRange(start, start, end));
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit() {
    this.generateFromSettings();
    this.hot.render();
  }

  /**
   * Register shortcuts responsible for toggling a merge.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['Control', 'm']],
      callback: () => {
        const range = this.hot.getSelectedRangeLast();

        if (range && !range.isSingleHeader()) {
          this.toggleMerge(range);
          this.hot.render();
        }
      },
      runOnlyIf: event => !event.altKey, // right ALT in some systems triggers ALT+CTRL
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts responsible for toggling a merge.
   *
   * @private
   */
  unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Modifies the information on whether the current selection contains multiple cells. The `afterIsMultipleSelection`
   * hook callback.
   *
   * @param {boolean} isMultiple Determines whether the current selection contains multiple cells.
   * @returns {boolean}
   */
  #onAfterIsMultipleSelection(isMultiple) {
    if (isMultiple) {
      const mergedCells = this.mergedCellsCollection.mergedCells;
      const selectionRange = this.hot.getSelectedRangeLast();
      const topStartCoords = selectionRange.getTopStartCorner();
      const bottomEndCoords = selectionRange.getBottomEndCorner();

      for (let group = 0; group < mergedCells.length; group += 1) {
        if (
          topStartCoords.row === mergedCells[group].row &&
          topStartCoords.col === mergedCells[group].col &&
          bottomEndCoords.row === mergedCells[group].row + mergedCells[group].rowspan - 1 &&
          bottomEndCoords.col === mergedCells[group].col + mergedCells[group].colspan - 1
        ) {
          return false;
        }
      }
    }

    return isMultiple;
  }

  /**
   * `modifyTransformFocus` hook callback.
   *
   * @param {object} delta The transformation delta.
   */
  #onModifyTransformFocus(delta) {
    this.#lastFocusDelta.row = delta.row;
    this.#lastFocusDelta.col = delta.col;
  }

  /**
   * `modifyTransformStart` hook callback.
   *
   * @param {object} delta The transformation delta.
   */
  #onModifyTransformStart(delta) {
    const selectedRange = this.hot.getSelectedRangeLast();
    const { highlight } = selectedRange;
    const { columnIndexMapper, rowIndexMapper } = this.hot;

    if (this.#lastSelectedFocus) {
      if (rowIndexMapper.getRenderableFromVisualIndex(this.#lastSelectedFocus.row) !== null) {
        highlight.row = this.#lastSelectedFocus.row;
      }

      if (columnIndexMapper.getRenderableFromVisualIndex(this.#lastSelectedFocus.col) !== null) {
        highlight.col = this.#lastSelectedFocus.col;
      }

      this.#lastSelectedFocus = null;
    }

    const mergedParent = this.mergedCellsCollection.get(highlight.row, highlight.col);

    if (!mergedParent) {
      return;
    }

    const visualColumnIndexStart = mergedParent.col;
    const visualColumnIndexEnd = mergedParent.col + mergedParent.colspan - 1;

    if (delta.col < 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexStart - 1 : visualColumnIndexEnd;
      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, -1);

      if (notHiddenColumnIndex === null) {
        // There are no visible columns anymore, so move the selection out of the table edge. This will
        // be processed by the selection Transformer class as a move selection to the previous row (if autoWrapRow is enabled).
        delta.col = -this.hot.view.countRenderableColumnsInRange(0, highlight.col);
      } else {
        delta.col = -Math.max(this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, highlight.col) - 1, 1);
      }

    } else if (delta.col > 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexEnd + 1 : visualColumnIndexStart;
      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

      if (notHiddenColumnIndex === null) {
        // There are no visible columns anymore, so move the selection out of the table edge. This will
        // be processed by the selection Transformer class as a move selection to the next row (if autoWrapRow is enabled).
        delta.col = this.hot.view.countRenderableColumnsInRange(highlight.col, this.hot.countCols());
      } else {
        delta.col = Math.max(this.hot.view.countRenderableColumnsInRange(highlight.col, notHiddenColumnIndex) - 1, 1);
      }
    }

    const visualRowIndexStart = mergedParent.row;
    const visualRowIndexEnd = mergedParent.row + mergedParent.rowspan - 1;

    if (delta.row < 0) {
      const nextRow = highlight.row >= visualRowIndexStart && highlight.row <= visualRowIndexEnd ?
        visualRowIndexStart - 1 : visualRowIndexEnd;
      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, -1);

      if (notHiddenRowIndex === null) {
        // There are no visible rows anymore, so move the selection out of the table edge. This will
        // be processed by the selection Transformer class as a move selection to the previous column (if autoWrapCol is enabled).
        delta.row = -this.hot.view.countRenderableRowsInRange(0, highlight.row);
      } else {
        delta.row = -Math.max(this.hot.view.countRenderableRowsInRange(notHiddenRowIndex, highlight.row) - 1, 1);
      }

    } else if (delta.row > 0) {
      const nextRow = highlight.row >= visualRowIndexStart && highlight.row <= visualRowIndexEnd ?
        visualRowIndexEnd + 1 : visualRowIndexStart;
      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, 1);

      if (notHiddenRowIndex === null) {
        // There are no visible rows anymore, so move the selection out of the table edge. This will
        // be processed by the selection Transformer class as a move selection to the next column (if autoWrapCol is enabled).
        delta.row = this.hot.view.countRenderableRowsInRange(highlight.row, this.hot.countRows());
      } else {
        delta.row = Math.max(this.hot.view.countRenderableRowsInRange(highlight.row, notHiddenRowIndex) - 1, 1);
      }
    }
  }

  /**
   * The hook allows to modify the delta transformation object necessary for correct selection end transformations.
   * The logic here handles "jumping over" merged merged cells, while selecting.
   *
   * @param {{ row: number, col: number }} delta The transformation delta.
   */
  #onModifyTransformEnd(delta) {
    const selectedRange = this.hot.getSelectedRangeLast();
    const cloneRange = selectedRange.clone();
    const { to } = selectedRange;
    const { columnIndexMapper, rowIndexMapper } = this.hot;
    const expandCloneRange = (row, col) => {
      cloneRange.expand(this.hot._createCellCoords(row, col));

      for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
        cloneRange.expandByRange(this.mergedCellsCollection.mergedCells[i].getRange());
      }
    };

    if (delta.col < 0) {
      let nextColumn = this.mergedCellsCollection.getStartMostColumnIndex(selectedRange, to.col) + delta.col;

      expandCloneRange(to.row, nextColumn);

      if (selectedRange.getHorizontalDirection() === 'E-W' && cloneRange.getHorizontalDirection() === 'E-W') {
        nextColumn = cloneRange.getTopStartCorner().col;
      }

      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

      if (notHiddenColumnIndex !== null) {
        delta.col = -Math.max(this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, to.col) - 1, 1);
      }

    } else if (delta.col > 0) {
      let nextColumn = this.mergedCellsCollection.getEndMostColumnIndex(selectedRange, to.col) + delta.col;

      expandCloneRange(to.row, nextColumn);

      if (selectedRange.getHorizontalDirection() === 'W-E' && cloneRange.getHorizontalDirection() === 'W-E') {
        nextColumn = cloneRange.getBottomEndCorner().col;
      }

      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, -1);

      if (notHiddenColumnIndex !== null) {
        delta.col = Math.max(this.hot.view.countRenderableColumnsInRange(to.col, notHiddenColumnIndex) - 1, 1);
      }
    }

    if (delta.row < 0) {
      let nextRow = this.mergedCellsCollection.getTopMostRowIndex(selectedRange, to.row) + delta.row;

      expandCloneRange(nextRow, to.col);

      if (selectedRange.getVerticalDirection() === 'S-N' && cloneRange.getVerticalDirection() === 'S-N') {
        nextRow = cloneRange.getTopStartCorner().row;
      }

      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, 1);

      if (notHiddenRowIndex !== null) {
        delta.row = -Math.max(this.hot.view.countRenderableRowsInRange(notHiddenRowIndex, to.row) - 1, 1);
      }

    } else if (delta.row > 0) {
      let nextRow = this.mergedCellsCollection.getBottomMostRowIndex(selectedRange, to.row) + delta.row;

      expandCloneRange(nextRow, to.col);

      if (selectedRange.getVerticalDirection() === 'N-S' && cloneRange.getVerticalDirection() === 'N-S') {
        nextRow = cloneRange.getBottomStartCorner().row;
      }

      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, -1);

      if (notHiddenRowIndex !== null) {
        delta.row = Math.max(this.hot.view.countRenderableRowsInRange(to.row, notHiddenRowIndex) - 1, 1);
      }
    }
  }

  /**
   * The hook corrects the range (before drawing it) after the selection was made on the merged cells.
   * It expands the range to cover the entire area of the selected merged cells.
   */
  #onBeforeSelectionHighlightSet() {
    const selectedRange = this.hot.getSelectedRangeLast();
    const { highlight } = selectedRange;

    if (this.hot.selection.isSelectedByColumnHeader() || this.hot.selection.isSelectedByRowHeader()) {
      this.#lastSelectedFocus = highlight.clone();

      return;
    }

    for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
      selectedRange.expandByRange(this.mergedCellsCollection.mergedCells[i].getRange(), false);
    }
    // TODO: This is a workaround for an issue with the selection not being extended properly.
    // In some cases when the merge cells are defined in random order the selection is not
    // extended in that way that it covers all overlapped merge cells.
    for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
      selectedRange.expandByRange(this.mergedCellsCollection.mergedCells[i].getRange(), false);
    }

    const mergedParent = this.mergedCellsCollection.get(highlight.row, highlight.col);

    this.#lastSelectedFocus = highlight.clone();

    if (mergedParent) {
      highlight.assign(mergedParent);
    }
  }

  /**
   * The `modifyGetCellCoords` hook callback allows forwarding all `getCell` calls that point in-between the merged cells
   * to the root element of the cell.
   *
   * @param {number} row Row index.
   * @param {number} column Visual column index.
   * @param {boolean} topmost Indicates if the requested element belongs to the topmost layer (any overlay) or not.
   * @param {string} [source] String that identifies how this coords change will be processed.
   * @returns {Array|undefined} Visual coordinates of the merge.
   */
  #onModifyGetCellCoords(row, column, topmost, source) {
    if (row < 0 || column < 0) {
      return;
    }

    const mergeParent = this.mergedCellsCollection.get(row, column);

    if (!mergeParent) {
      return;
    }

    const {
      row: mergeRow,
      col: mergeColumn,
      colspan,
      rowspan,
    } = mergeParent;
    const topStartRow = mergeRow;
    const topStartColumn = mergeColumn;
    const bottomEndRow = mergeRow + rowspan - 1;
    const bottomEndColumn = mergeColumn + colspan - 1;

    if (source === 'render' && this.getSetting('virtualized')) {
      const overlayName = this.hot.view.getActiveOverlayName();
      const firstRenderedRow = ['top', 'top_inline_start_corner']
        .includes(overlayName) ? 0 : this.hot.getFirstRenderedVisibleRow();
      const firstRenderedColumn = ['inline_start', 'top_inline_start_corner', 'bottom_inline_start_corner']
        .includes(overlayName) ? 0 : this.hot.getFirstRenderedVisibleColumn();

      return [
        clamp(firstRenderedRow, topStartRow, bottomEndRow),
        clamp(firstRenderedColumn, topStartColumn, bottomEndColumn),
        clamp(this.hot.getLastRenderedVisibleRow(), topStartRow, bottomEndRow),
        clamp(this.hot.getLastRenderedVisibleColumn(), topStartColumn, bottomEndColumn),
      ];
    }

    return [
      topStartRow,
      topStartColumn,
      bottomEndRow,
      bottomEndColumn,
    ];
  }

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @param {object} defaultOptions The default context menu options.
   */
  #addMergeActionsToContextMenu(defaultOptions) {
    defaultOptions.items.push(
      {
        name: '---------',
      },
      toggleMergeItem(this)
    );
  }

  /**
   * Clears the last selected coordinates before setting a new selection range.
   */
  #onBeforeSetRangeStart() {
    this.#lastSelectedFocus = null;
  }

  /**
   * Detects if the last selected cell was a header cell if so update the order list active node for further
   * computations.
   */
  #onBeforeSelectionFocusSet() {
    if (this.#lastSelectedFocus.isCell()) {
      return;
    }

    const selectedRange = this.hot.getSelectedRangeLast();
    const verticalDir = selectedRange.getVerticalDirection();
    const horizontalDir = selectedRange.getHorizontalDirection();
    const focusCoords = this.#lastSelectedFocus.clone().normalize();

    this.#focusOrder.setActiveNode(focusCoords.row, focusCoords.col);

    if (this.#lastFocusDelta.row > 0 || this.#lastFocusDelta.col > 0) {
      this.#focusOrder.setPrevNodeAsActive();

    } else if (
      horizontalDir === 'E-W' && this.#lastFocusDelta.col < 0 ||
      verticalDir === 'S-N' && this.#lastFocusDelta.row < 0
    ) {
      this.#focusOrder.setNextNodeAsActive();
    }
  }

  /**
   * Changes the focus selection to the next or previous cell or merged cell position.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   */
  #onAfterSelectionFocusSet(row, column) {
    const selectedRange = this.hot.getSelectedRangeLast();
    const { columnIndexMapper, rowIndexMapper } = this.hot;
    let notHiddenRowIndex = null;
    let notHiddenColumnIndex = null;

    if (this.#lastFocusDelta.col < 0) {
      const { rowEnd, colEnd } = this.#focusOrder.getPrevHorizontalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colEnd, -1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowEnd, -1);

    } else if (this.#lastFocusDelta.col > 0) {
      const { rowStart, colStart } = this.#focusOrder.getNextHorizontalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colStart, 1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowStart, 1);

    } else if (this.#lastFocusDelta.row < 0) {
      const { rowEnd, colEnd } = this.#focusOrder.getPrevVerticalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colEnd, -1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowEnd, -1);

    } else if (this.#lastFocusDelta.row > 0) {
      const { rowStart, colStart } = this.#focusOrder.getNextVerticalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colStart, 1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowStart, 1);
    }

    if (notHiddenRowIndex !== null || notHiddenColumnIndex !== null) {
      const coords = this.hot._createCellCoords(notHiddenRowIndex, notHiddenColumnIndex);
      const mergeParent = this.mergedCellsCollection.get(coords.row, coords.col);
      const focusHighlight = this.hot.selection.highlight.getFocus();

      row = coords.row;
      column = coords.col;

      if (mergeParent) {
        selectedRange.highlight.assign({
          row: this.hot.rowIndexMapper.getNearestNotHiddenIndex(mergeParent.row, 1),
          col: this.hot.columnIndexMapper.getNearestNotHiddenIndex(mergeParent.col, 1),
        });
      } else {
        selectedRange.highlight.assign(coords);
      }

      focusHighlight.clear();
      focusHighlight
        .add(coords)
        .commit();
    }

    this.#focusOrder.setActiveNode(row, column);
    this.#lastFocusDelta = { row: 0, col: 0 };
  }

  /**
   * Creates the horizontal and vertical cells order matrix (linked lists) for focused cell.
   */
  #onAfterSelectionEnd() {
    const selection = this.hot.getSelectedRangeLast();

    if (!selection.isHeader()) {
      this.#focusOrder.buildFocusOrder(this.hot.getSelectedRangeLast());
    }
  }

  /**
   * The `afterGetCellMeta` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} col Column index.
   * @param {object} cellProperties The cell properties object.
   */
  #onAfterGetCellMeta(row, col, cellProperties) {
    const mergeParent = this.mergedCellsCollection.get(row, col);

    if (mergeParent) {
      if (mergeParent.row !== row || mergeParent.col !== col) {
        cellProperties.copyable = false;

      } else {
        cellProperties.rowspan = mergeParent.rowspan;
        cellProperties.colspan = mergeParent.colspan;
      }
    }
  }

  /**
   * `afterViewportRowCalculatorOverride` hook callback.
   *
   * @param {object} calc The row calculator object.
   */
  #onAfterViewportRowCalculatorOverride(calc) {
    if (this.getSetting('virtualized')) {
      return;
    }

    const nrOfColumns = this.hot.countCols();

    this.modifyViewportRowStart(calc, nrOfColumns);
    this.modifyViewportRowEnd(calc, nrOfColumns);
  }

  /**
   * Modify viewport start when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The row calculator object.
   * @param {number} nrOfColumns Number of visual columns.
   */
  modifyViewportRowStart(calc, nrOfColumns) {
    const rowMapper = this.hot.rowIndexMapper;
    const visualStartRow = rowMapper.getVisualFromRenderableIndex(calc.startRow);

    for (let visualColumnIndex = 0; visualColumnIndex < nrOfColumns; visualColumnIndex += 1) {
      const mergeParentForViewportStart = this.mergedCellsCollection.get(visualStartRow, visualColumnIndex);

      if (isObject(mergeParentForViewportStart)) {
        const renderableIndexAtMergeStart = rowMapper.getRenderableFromVisualIndex(
          rowMapper.getNearestNotHiddenIndex(mergeParentForViewportStart.row, 1));

        // Merge start is out of the viewport (i.e. when we scrolled to the bottom and we can see just part of a merge).
        if (renderableIndexAtMergeStart < calc.startRow) {
          // We extend viewport when some rows have been merged.
          calc.startRow = renderableIndexAtMergeStart;
          // We are looking for next merges inside already extended viewport (starting again from row equal to 0).
          this.modifyViewportRowStart(calc, nrOfColumns); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   *  Modify viewport end when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The row calculator object.
   * @param {number} nrOfColumns Number of visual columns.
   */
  modifyViewportRowEnd(calc, nrOfColumns) {
    const rowMapper = this.hot.rowIndexMapper;
    const visualEndRow = rowMapper.getVisualFromRenderableIndex(calc.endRow);

    for (let visualColumnIndex = 0; visualColumnIndex < nrOfColumns; visualColumnIndex += 1) {
      const mergeParentForViewportEnd = this.mergedCellsCollection.get(visualEndRow, visualColumnIndex);

      if (isObject(mergeParentForViewportEnd)) {
        const mergeEnd = mergeParentForViewportEnd.row + mergeParentForViewportEnd.rowspan - 1;
        const renderableIndexAtMergeEnd = rowMapper.getRenderableFromVisualIndex(
          rowMapper.getNearestNotHiddenIndex(mergeEnd, -1));

        // Merge end is out of the viewport.
        if (renderableIndexAtMergeEnd > calc.endRow) {
          // We extend the viewport when some rows have been merged.
          calc.endRow = renderableIndexAtMergeEnd;
          // We are looking for next merges inside already extended viewport (starting again from row equal to 0).
          this.modifyViewportRowEnd(calc, nrOfColumns); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   * `afterViewportColumnCalculatorOverride` hook callback.
   *
   * @param {object} calc The column calculator object.
   */
  #onAfterViewportColumnCalculatorOverride(calc) {
    if (this.getSetting('virtualized')) {
      return;
    }

    const nrOfRows = this.hot.countRows();

    this.modifyViewportColumnStart(calc, nrOfRows);
    this.modifyViewportColumnEnd(calc, nrOfRows);
  }

  /**
   * Modify viewport start when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The column calculator object.
   * @param {number} nrOfRows Number of visual rows.
   */
  modifyViewportColumnStart(calc, nrOfRows) {
    const columnMapper = this.hot.columnIndexMapper;
    const visualStartCol = columnMapper.getVisualFromRenderableIndex(calc.startColumn);

    for (let visualRowIndex = 0; visualRowIndex < nrOfRows; visualRowIndex += 1) {
      const mergeParentForViewportStart = this.mergedCellsCollection.get(visualRowIndex, visualStartCol);

      if (isObject(mergeParentForViewportStart)) {
        const renderableIndexAtMergeStart = columnMapper.getRenderableFromVisualIndex(
          columnMapper.getNearestNotHiddenIndex(mergeParentForViewportStart.col, 1));

        // Merge start is out of the viewport (i.e. when we scrolled to the right and we can see just part of a merge).
        if (renderableIndexAtMergeStart < calc.startColumn) {
          // We extend viewport when some columns have been merged.
          calc.startColumn = renderableIndexAtMergeStart;
          // We are looking for next merges inside already extended viewport (starting again from column equal to 0).
          this.modifyViewportColumnStart(calc, nrOfRows); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   *  Modify viewport end when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The column calculator object.
   * @param {number} nrOfRows Number of visual rows.
   */
  modifyViewportColumnEnd(calc, nrOfRows) {
    const columnMapper = this.hot.columnIndexMapper;
    const visualEndCol = columnMapper.getVisualFromRenderableIndex(calc.endColumn);

    for (let visualRowIndex = 0; visualRowIndex < nrOfRows; visualRowIndex += 1) {
      const mergeParentForViewportEnd = this.mergedCellsCollection.get(visualRowIndex, visualEndCol);

      if (isObject(mergeParentForViewportEnd)) {
        const mergeEnd = mergeParentForViewportEnd.col + mergeParentForViewportEnd.colspan - 1;
        const renderableIndexAtMergeEnd = columnMapper.getRenderableFromVisualIndex(
          columnMapper.getNearestNotHiddenIndex(mergeEnd, -1));

        // Merge end is out of the viewport.
        if (renderableIndexAtMergeEnd > calc.endColumn) {
          // We extend the viewport when some columns have been merged.
          calc.endColumn = renderableIndexAtMergeEnd;
          // We are looking for next merges inside already extended viewport (starting again from column equal to 0).
          this.modifyViewportColumnEnd(calc, nrOfRows); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   * Translates merged cell coordinates to renderable indexes.
   *
   * @private
   * @param {number} parentRow Visual row index.
   * @param {number} rowspan Rowspan which describes shift which will be applied to parent row
   *                         to calculate renderable index which points to the most bottom
   *                         index position. Pass rowspan as `0` to calculate the most top
   *                         index position.
   * @param {number} parentColumn Visual column index.
   * @param {number} colspan Colspan which describes shift which will be applied to parent column
   *                         to calculate renderable index which points to the most right
   *                         index position. Pass colspan as `0` to calculate the most left
   *                         index position.
   * @returns {number[]}
   */
  translateMergedCellToRenderable(parentRow, rowspan, parentColumn, colspan) {
    const { rowIndexMapper: rowMapper, columnIndexMapper: columnMapper } = this.hot;
    let firstNonHiddenRow;
    let firstNonHiddenColumn;

    if (rowspan === 0) {
      firstNonHiddenRow = rowMapper.getNearestNotHiddenIndex(parentRow, 1);
    } else {
      firstNonHiddenRow = rowMapper.getNearestNotHiddenIndex(parentRow + rowspan - 1, -1);
    }

    if (colspan === 0) {
      firstNonHiddenColumn = columnMapper.getNearestNotHiddenIndex(parentColumn, 1);
    } else {
      firstNonHiddenColumn = columnMapper.getNearestNotHiddenIndex(parentColumn + colspan - 1, -1);
    }

    const renderableRow = parentRow >= 0 ?
      rowMapper.getRenderableFromVisualIndex(firstNonHiddenRow) : parentRow;
    const renderableColumn = parentColumn >= 0 ?
      columnMapper.getRenderableFromVisualIndex(firstNonHiddenColumn) : parentColumn;

    return [renderableRow, renderableColumn];
  }

  /**
   * The `modifyAutofillRange` hook callback.
   *
   * @param {Array} fullArea The drag + base area coordinates.
   * @param {Array} baseArea The selection information.
   * @returns {Array} The new drag area.
   */
  #onModifyAutofillRange(fullArea, baseArea) {
    const dragDirection = this.autofillCalculations.getDirection(baseArea, fullArea);

    if (this.autofillCalculations.dragAreaOverlapsCollections(baseArea, fullArea, dragDirection)) {
      return baseArea;
    }

    const from = this.hot._createCellCoords(baseArea[0], baseArea[1]);
    const to = this.hot._createCellCoords(baseArea[2], baseArea[3]);
    const range = this.hot._createCellRange(from, from, to);
    const mergedCellsWithinSelectionArea = this.mergedCellsCollection.getWithinRange(range);

    if (mergedCellsWithinSelectionArea.length === 0) {
      return fullArea;
    }

    return this.autofillCalculations
      .snapDragArea(baseArea, fullArea, dragDirection, mergedCellsWithinSelectionArea);
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @param {number} column Column index.
   * @param {number} count Number of created columns.
   */
  #onAfterCreateCol(column, count) {
    this.mergedCellsCollection.shiftCollections('right', column, count);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @param {number} column Column index.
   * @param {number} count Number of removed columns.
   */
  #onAfterRemoveCol(column, count) {
    this.mergedCellsCollection.shiftCollections('left', column, count);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} count Number of created rows.
   * @param {string} source Source of change.
   */
  #onAfterCreateRow(row, count, source) {
    if (source === 'auto') {
      return;
    }

    this.mergedCellsCollection.shiftCollections('down', row, count);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} count Number of removed rows.
   */
  #onAfterRemoveRow(row, count) {
    this.mergedCellsCollection.shiftCollections('up', row, count);
  }

  /**
   * `afterChange` hook callback. Used to propagate merged cells after using Autofill.
   *
   * @param {Array} changes The changes array.
   * @param {string} source Determines the source of the change.
   */
  #onAfterChange(changes, source) {
    if (source !== 'Autofill.fill') {
      return;
    }

    this.autofillCalculations.recreateAfterDataPopulation(changes);
  }

  /**
   * `beforeDrawAreaBorders` hook callback.
   *
   * @param {Array} corners Visual coordinates of the area corners.
   * @param {string} className Class name for the area.
   */
  #onBeforeDrawAreaBorders(corners, className) {
    if (className && className === 'area') {
      const selectedRange = this.hot.getSelectedRangeLast();
      const mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(selectedRange);

      arrayEach(mergedCellsWithinRange, (mergedCell) => {
        if (selectedRange.getBottomEndCorner().row === mergedCell.getLastRow() &&
          selectedRange.getBottomEndCorner().col === mergedCell.getLastColumn()) {
          corners[2] = mergedCell.row;
          corners[3] = mergedCell.col;
        }
      });
    }
  }

  /**
   * `afterDrawSelection` hook callback. Used to add the additional class name for the entirely-selected merged cells.
   *
   * @param {number} currentRow Visual row index of the currently processed cell.
   * @param {number} currentColumn Visual column index of the currently cell.
   * @param {Array} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow,
   *   endColumn]`.
   * @param {number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @returns {string|undefined} A `String`, which will act as an additional `className` to be added to the currently
   *   processed cell.
   */
  #onAfterDrawSelection(currentRow, currentColumn, cornersOfSelection, layerLevel) {
    // Nothing's selected (hook might be triggered by the custom borders)
    if (!cornersOfSelection) {
      return;
    }

    return this.selectionCalculations
      .getSelectedMergedCellClassName(currentRow, currentColumn, cornersOfSelection, layerLevel);
  }

  /**
   * `beforeRemoveCellClassNames` hook callback. Used to remove additional class name from all cells in the table.
   *
   * @returns {string[]} An `Array` of `String`s. Each of these strings will act like class names to be removed from
   *   all the cells in the table.
   */
  #onBeforeRemoveCellClassNames() {
    return this.selectionCalculations.getSelectedMergedCellClassNameToRemove();
  }

  /**
   * Allows to prevent opening the editor while more than one merged cell is selected.
   *
   * @param {number} row Visual row index of the edited cell.
   * @param {number} column Visual column index of the edited cell.
   * @param {string | null} initialValue The initial editor value.
   * @param {MouseEvent | KeyboardEvent} event The event which was responsible for opening the editor.
   * @returns {boolean | undefined}
   */
  #onBeforeBeginEditing(row, column, initialValue, event) {
    if (!(event instanceof MouseEvent)) {
      return;
    }

    const selection = this.hot.getSelectedRangeLast();
    const mergeCell = this.mergedCellsCollection.getByRange(selection);

    if (!mergeCell) {
      return;
    }

    const from = this.hot._createCellCoords(
      mergeCell.row,
      mergeCell.col
    );
    const to = this.hot._createCellCoords(
      mergeCell.row + mergeCell.rowspan - 1,
      mergeCell.col + mergeCell.colspan - 1
    );

    return this.hot.selection.getLayerLevel() === 0 && selection.isEqual(
      this.hot._createCellRange(from, from, to)
    );
  }

  /**
   * Hook used to modify the row height depends on the merged cells in the row.
   *
   * @param {number} height The row height value provided by the Core.
   * @param {number} row The visual row index.
   * @param {string} overlayType The overlay type that is currently rendered.
   * @returns {number}
   */
  #onModifyRowHeightByOverlayName(height, row, overlayType) {
    if (
      this.hot.getSettings().rowHeaders ||
      // merged cells do not work with the bottom overlays
      overlayType === 'bottom' || overlayType === 'bottom_inline_start_corner'
    ) {
      return height;
    }

    let firstColumn;
    let lastColumn;

    if (overlayType === 'master') {
      firstColumn = this.hot.getFirstRenderedVisibleColumn();
      lastColumn = this.hot.getLastRenderedVisibleColumn();

    } else {
      const activeOverlay = this.hot.view.getOverlayByName(overlayType);

      firstColumn = this.hot.columnIndexMapper
        .getVisualFromRenderableIndex(activeOverlay.clone.wtTable.getFirstRenderedColumn());
      lastColumn = this.hot.columnIndexMapper
        .getVisualFromRenderableIndex(activeOverlay.clone.wtTable.getLastRenderedColumn());
    }

    const firstMergedCellInRow = this.mergedCellsCollection.get(row, firstColumn);

    if (!firstMergedCellInRow) {
      return height;
    }

    const from = this.hot._createCellCoords(row, firstColumn);
    const to = this.hot._createCellCoords(row, lastColumn);
    const viewportRange = this.hot._createCellRange(from, from, to);
    const mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(viewportRange, true);
    const maxRowspan = mergedCellsWithinRange.reduce((acc, { rowspan }) => Math.max(acc, rowspan), 1);
    let rowspanCorrection = 0;

    if (mergedCellsWithinRange.length > 1 && mergedCellsWithinRange[0].rowspan < maxRowspan) {
      rowspanCorrection = maxRowspan - mergedCellsWithinRange[0].rowspan;
    }

    mergedCellsWithinRange.forEach(({ rowspan }) => {
      let rowspanAfterCorrection = 0;

      if (overlayType === 'top' || overlayType === 'top_inline_start_corner') {
        rowspanAfterCorrection = Math.min(maxRowspan, this.hot.view.countNotHiddenFixedRowsTop() - row);
      } else {
        rowspanAfterCorrection = rowspan - rowspanCorrection;
      }

      height = Math.max(height ?? 0, this.#sumCellsHeights(row, rowspanAfterCorrection));
    });

    return height;
  }

  /**
   * Sums the heights of the all cells that the merge cell consists of.
   *
   * @param {number} row The visual row index of the merged cell.
   * @param {number} rowspan The rowspan value of the merged cell.
   * @returns {number}
   */
  #sumCellsHeights(row, rowspan) {
    const stylesHandler = this.hot.view.getStylesHandler();
    const defaultHeight = this.hot.view.getDefaultRowHeight();
    const autoRowSizePlugin = this.hot.getPlugin('autoRowSize');
    let height = 0;

    for (let i = row; i < row + rowspan; i++) {
      if (!this.hot.rowIndexMapper.isHidden(i)) {
        height += autoRowSizePlugin?.getRowHeight(i) ?? defaultHeight;

        if (i === 0 && !stylesHandler.isClassicTheme()) {
          height += 1; // border-top-width
        }
      }
    }

    return height;
  }
}
