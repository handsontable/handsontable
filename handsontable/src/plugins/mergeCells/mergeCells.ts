import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { Overlay } from '../../3rdparty/walkontable/src/overlay/_base';
import type { default as Table } from '../../3rdparty/walkontable/src/table';
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
import { FocusOrder, type FocusNodeData } from './focusOrder';
import { createMergeCellRenderer } from './renderer';
import { sumCellsHeights } from './utils';

Hooks.getSingleton().register('beforeMergeCells');
Hooks.getSingleton().register('afterMergeCells');
Hooks.getSingleton().register('beforeUnmergeCells');
Hooks.getSingleton().register('afterUnmergeCells');

export const PLUGIN_KEY = 'mergeCells';
export const PLUGIN_PRIORITY = 150;
const SHORTCUTS_GROUP = PLUGIN_KEY;

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
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: getData(),
 *   // Enable plugin
 *   mergeCells: [
 *     { row: 0, col: 3, rowspan: 3, colspan: 3 },
 *     { row: 2, col: 6, rowspan: 2, colspan: 2 },
 *     { row: 4, col: 8, rowspan: 3, colspan: 3 },
 *   ],
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 */
export class MergeCells extends BasePlugin {
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
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    const cells: { row: number; col: number; rowspan: number; colspan: number }[] = [];

    return {
      [defaultMainSettingSymbol]: 'cells',
      virtualized: false,
      cells,
    };
  }

  /**
   * A container for all the merged cells.
   *
   * @private
   * @type {MergedCellsCollection}
   */
  declare mergedCellsCollection: MergedCellsCollection;
  /**
   * Instance of the class responsible for all the autofill-related calculations.
   *
   * @private
   * @type {AutofillCalculations}
   */
  declare autofillCalculations: AutofillCalculations;
  /**
   * Instance of the class responsible for the selection-related calculations.
   *
   * @private
   * @type {SelectionCalculations}
   */
  declare selectionCalculations: SelectionCalculations;
  /**
   * The holder for the last selected focus coordinates. This allows keeping the correct coordinates in cases after the
   * focus is moved out of the merged cell.
   *
   * @type {CellCoords}
   */
  #lastSelectedFocus: CellCoords | null = null;
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
    mergedCellsGetter: (row: number, column: number) => this.mergedCellsCollection.get(row, column),
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
   * Snapshot of physical column indexes per merge, captured before a column move/freeze.
   *
   * @type {Map<MergedCellCoords, number[]> | null}
   */
  #columnMoveSnapshot: Map<MergedCellCoords, number[]> | null = null;
  /**
   * Snapshot of physical row indexes per merge, captured before a row move.
   *
   * @type {Map<MergedCellCoords, number[]> | null}
   */
  #rowMoveSnapshot: Map<MergedCellCoords, number[]> | null = null;
  /**
   * `true` once the plugin has finished its initial settings ingestion. Used to skip
   * snapshot/translate during the bootstrap-time column reorders fired by
   * `manualColumnMove: [...]` initial config, where the merge collection is empty
   * anyway but we want to be defensive against future hook-order changes.
   *
   * @type {boolean}
   */
  #initialized = false;
  /**
   * Physical top-left (row/column) of every merged cell, captured while its visual coordinates are
   * authoritative (creation, structural edits). Read on a pure row-trimming change to re-anchor the
   * merge's visual `row`/`col` onto the rows that stay visible — keeping the merge whole (span
   * unchanged) instead of clipping it. Physical indexes are stable across trimming, so one capture
   * survives any number of filter/trim toggles.
   *
   * @type {WeakMap<MergedCellCoords, { physicalRow: number, physicalColumn: number }>}
   */
  #mergeAnchors: WeakMap<MergedCellCoords, { physicalRow: number, physicalColumn: number }> = new WeakMap();

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link MergeCells#enablePlugin} method is called.
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

    this.mergedCellsCollection = new MergedCellsCollection(this);
    this.autofillCalculations = new AutofillCalculations(this);
    this.selectionCalculations = new SelectionCalculations(this);

    this.addHook('afterInit', this.#onAfterInit);
    this.addHook('modifyTransformFocus', this.#onModifyTransformFocus);
    this.addHook('modifyTransformStart', this.#onModifyTransformStart);
    this.addHook('modifyTransformEnd', this.#onModifyTransformEnd);
    this.addHook('beforeSelectionHighlightSet', this.#onBeforeSelectionHighlightSet);
    this.addHook('beforeSetRangeStart', this.#onBeforeSetRangeStart);
    this.addHook('beforeSetRangeStartOnly', this.#onBeforeSetRangeStart);
    this.addHook('beforeSelectionFocusSet', this.#onBeforeSelectionFocusSet);
    this.addHook('afterSelectionFocusSet', this.#onAfterSelectionFocusSet);
    this.addHook('afterSelectionEnd', this.#onAfterSelectionEnd);
    this.addHook('modifyGetCellCoords', this.#onModifyGetCellCoords);
    this.addHook('modifyGetCoordsElement', this.#onModifyGetCellCoords);
    this.addHook('afterIsMultipleSelection', this.#onAfterIsMultipleSelection);
    this.addHook('afterRenderer',
      (TD: HTMLTableCellElement, row: number, col: number) => this.#cellRenderer.after(TD, row, col));
    this.addHook('afterContextMenuDefaultOptions',
      (defaultOptions: { items: unknown[] }) => this.#addMergeActionsToContextMenu(defaultOptions));
    this.addHook('afterGetCellMeta', this.#onAfterGetCellMeta);
    this.addHook('afterViewportRowCalculatorOverride', this.#onAfterViewportRowCalculatorOverride);
    this.addHook('afterViewportColumnCalculatorOverride', this.#onAfterViewportColumnCalculatorOverride);
    this.addHook('modifyAutofillRange', this.#onModifyAutofillRange);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);
    this.addHook('afterCreateRow', this.#onAfterCreateRow);
    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('beforeColumnMove', this.#onBeforeColumnMove);
    this.addHook('afterColumnMove', this.#onAfterColumnMove);
    this.addHook('beforeRowMove', this.#onBeforeRowMove);
    this.addHook('afterRowMove', this.#onAfterRowMove);
    this.addHook('beforeColumnFreeze', this.#onBeforeColumnFreeze);
    this.addHook('afterColumnFreeze', this.#onAfterColumnFreeze);
    this.addHook('beforeColumnUnfreeze', this.#onBeforeColumnFreeze);
    this.addHook('afterColumnUnfreeze', this.#onAfterColumnFreeze);
    this.addHook('afterChange', this.#onAfterChange);
    this.addHook('beforeDrawBorders', this.#onBeforeDrawAreaBorders);
    this.addHook('afterDrawSelection', this.#onAfterDrawSelection);
    this.addHook('beforeRemoveCellClassNames', this.#onBeforeRemoveCellClassNames);
    this.addHook('beforeBeginEditing', this.#onBeforeBeginEditing);
    this.addHook('modifyRowHeightByOverlayName', this.#onModifyRowHeightByOverlayName);
    this.addHook('beforeUndoStackChange', (action: unknown, source: unknown) => {
      if (source === 'MergeCells') {
        return false;
      }
    });

    this.addHook('afterMergeCells', this.#onAfterMergeCellsCapture);

    this.registerShortcuts();

    // React to the row trimming map changing (Filters / `trimRows` / `nestedRows` collapse), so a
    // merge whose anchor row gets hidden is re-anchored onto the still-visible rows.
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onRowIndexCacheUpdated);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onRowIndexCacheUpdated);
    this.clearCollections();
    this.unregisterShortcuts();
    this.hot.render();
    this.#initialized = false;
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
    this.#initialized = true;
    this.#captureMergeAnchors();

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

    const rowsToRefresh: HTMLElement[] = [];
    let rowIndexesToRefresh: number[] = [];

    this.mergedCellsCollection.mergedCells.forEach((mergedCell: MergedCellCoords) => {
      const { row, rowspan } = mergedCell;

      for (let r = row + 1; r < row + rowspan; r++) {
        rowIndexesToRefresh.push(r);
      }
    });

    // Remove duplicates
    rowIndexesToRefresh = [...new Set(rowIndexesToRefresh)];

    rowIndexesToRefresh.forEach((rowIndex: number) => {
      const renderableRowIndex = this.hot.rowIndexMapper.getRenderableFromVisualIndex(rowIndex);

      if (renderableRowIndex === null) {
        return;
      }

      this.hot.view._wt.wtOverlays.getOverlays(true).map(
        (overlay: Overlay | Table) => ((overlay as Table).name === 'master'
          ? (overlay as Table)
          : (overlay as Overlay).clone!.wtTable)
      ).forEach((wtTableRef: Table) => {
        const rowToRefresh = wtTableRef.getRow(renderableRowIndex);

        if (rowToRefresh) {
          // Modify the TR's `background` property to later modify it asynchronously.
          // The background color is getting modified only with the alpha, so the change should not be visible (and is
          // covered by the TDs' background color).
          rowToRefresh.style.background =
            getStyle(rowToRefresh, 'backgroundColor')?.replace(')', ', 0.99)') ?? '';

          rowsToRefresh.push(rowToRefresh);
        }
      });
    });

    // Asynchronously revert the TRs' `background` property to force a fresh repaint.
    this.hot._registerTimeout(() => {
      rowsToRefresh.forEach((rowElement) => {
        rowElement.style.background =
          getStyle(rowElement, 'backgroundColor')?.replace(', 0.99)', '') ?? '';
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
  validateSetting(setting: { row: number, col: number, rowspan: number, colspan: number }) {
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
    const validSettings = this.getSetting<{ row: number, col: number, rowspan: number, colspan: number }[]>('cells')
      .filter(mergeCellInfo => this.validateSetting(mergeCellInfo));
    const nonOverlappingSettings = this.mergedCellsCollection
      .filterOverlappingMergeCells(validSettings);

    const populatedNulls: unknown[][] = [];

    nonOverlappingSettings.forEach((mergeCellInfo: { row: number, col: number, rowspan: number, colspan: number }) => {
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
    this.hot.setDataAtCell(populatedNulls, undefined, undefined, this.pluginName ?? undefined);
  }

  /**
   * Clears the merged cells from the merged cell container.
   */
  clearCollections(): void {
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
  canMergeRange(newMergedCellInfo: { row: number, col: number, rowspan: number, colspan: number }, auto = false) {
    return auto ? true : this.validateSetting(newMergedCellInfo);
  }

  /**
   * Merges the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  mergeSelection(cellRange = this.hot.getSelectedRangeActive()): void {
    if (!cellRange) {
      return;
    }

    cellRange.setDirection(this.hot.isRtl() ? 'NE-SW' : 'NW-SE');

    const { from, to } = cellRange;

    this.unmergeRange(cellRange, true);
    this.mergeRange(cellRange);

    if (from.row !== null && from.col !== null && to.row !== null && to.col !== null) {
      this.hot.selectCell(from.row, from.col, to.row, to.col, false);
    }
  }

  /**
   * Unmerges the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  unmergeSelection(cellRange = this.hot.getSelectedRangeActive()): void {
    if (!cellRange) {
      return;
    }

    const { from, to } = cellRange;

    this.unmergeRange(cellRange, true);

    if (from.row !== null && from.col !== null && to.row !== null && to.col !== null) {
      this.hot.selectCell(from.row, from.col, to.row, to.col, false);
    }
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
  mergeRange(cellRange: CellRange, auto = false, preventPopulation = false) {
    const topStart = cellRange.getTopStartCorner();
    const bottomEnd = cellRange.getBottomEndCorner();

    if (topStart.row === null || topStart.col === null || bottomEnd.row === null || bottomEnd.col === null) {
      return false;
    }

    const mergeParent = {
      row: topStart.row,
      col: topStart.col,
      rowspan: bottomEnd.row - topStart.row + 1,
      colspan: bottomEnd.col - topStart.col + 1
    };
    const clearedData: unknown[][] = [];
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
          mergeParent.row, mergeParent.col, clearedData, undefined, undefined, this.pluginName ?? undefined);
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
  unmergeRange(cellRange: CellRange, auto = false) {
    const mergedCells = this.mergedCellsCollection.getWithinRange(cellRange);

    if (mergedCells.length === 0) {
      return;
    }

    this.hot.runHooks('beforeUnmergeCells', cellRange, auto);

    arrayEach(mergedCells, (currentCollection: MergedCellCoords) => {
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
  toggleMerge(cellRange: CellRange) {
    const { from, to } = cellRange.clone().normalize();

    if (from.row === null || from.col === null || to.row === null || to.col === null) {
      return;
    }

    const mergedCell = this.mergedCellsCollection.get(from.row, from.col);
    const mergedCellCoversWholeRange = mergedCell !== false &&
      mergedCell.row === from.row &&
      mergedCell.col === from.col &&
      mergedCell.row + mergedCell.rowspan - 1 === to.row &&
      mergedCell.col + mergedCell.colspan - 1 === to.col;

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
  merge(startRow: number, startColumn: number, endRow: number, endColumn: number): void {
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
  unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): void {
    const start = this.hot._createCellCoords(startRow, startColumn);
    const end = this.hot._createCellCoords(endRow, endColumn);

    this.unmergeRange(this.hot._createCellRange(start, start, end));
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit = () => {
    this.generateFromSettings();
    this.hot.render();
    this.#initialized = true;
    this.#captureMergeAnchors();
  };

  /**
   * `afterMergeCells` hook callback. Captures the physical anchor of the just-created merge so it can
   * be re-anchored on later trimming changes (covers user/API merges; config merges are also captured
   * in `afterInit`/`updatePlugin`).
   *
   * @param {CellRange} _cellRange The merged range (unused).
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergeParent The merged cell.
   */
  #onAfterMergeCellsCapture = (
    _cellRange: CellRange,
    mergeParent: { row: number, col: number, rowspan: number, colspan: number }
  ) => {
    const merge = this.mergedCellsCollection.get(mergeParent.row, mergeParent.col);

    if (merge) {
      this.#captureAnchorOf(merge);
    }
  };

  /**
   * Row index mapper `cacheUpdated` callback. On a pure row-trimming change (Filters / `trimRows` /
   * `nestedRows` collapse, i.e. no index-sequence change), re-anchors each merge onto the rows that
   * remain visible, so trimming rows above a merge no longer leaves its anchor behind. Moves, sorts,
   * inserts and removals carry an index-sequence change and are handled by their dedicated hooks, so
   * they are skipped here.
   *
   * @param {{ trimmedIndexesChanged: boolean, indexesSequenceChanged: boolean }} changes Cache flags.
   */
  #onRowIndexCacheUpdated = (
    { trimmedIndexesChanged, indexesSequenceChanged }:
    { trimmedIndexesChanged: boolean, indexesSequenceChanged: boolean }
  ) => {
    // `this.hot` is dropped on destroy, but this local hook outlives the plugin (it is not managed
    // by `addHook`), so the row index map's final `updateCache` can still reach us.
    if (!this.hot || !this.#initialized) {
      return;
    }

    if (trimmedIndexesChanged && !indexesSequenceChanged) {
      this.#reanchorMergesToVisibleRows();
    }
  };

  /**
   * Captures the physical top-left of a single merge from its current (authoritative) visual coords.
   *
   * @param {MergedCellCoords} merge The merge to capture.
   */
  #captureAnchorOf(merge: MergedCellCoords) {
    const physicalRow = this.hot.toPhysicalRow(merge.row);
    const physicalColumn = this.hot.toPhysicalColumn(merge.col);

    if (physicalRow !== null && physicalColumn !== null) {
      this.#mergeAnchors.set(merge, { physicalRow, physicalColumn });
    }
  }

  /**
   * Captures the physical top-left of every merge (after a bulk (re)generation).
   */
  #captureMergeAnchors() {
    this.mergedCellsCollection.mergedCells.forEach(merge => this.#captureAnchorOf(merge));
  }

  /**
   * Re-anchors every merge's visual `row`/`col` to the visual position of its captured physical
   * top-left, keeping `rowspan`/`colspan`. The render translation then spans the merge over the
   * visible rows from there. Merges with no captured anchor, or whose anchor row/column is itself
   * hidden, are left untouched.
   */
  #reanchorMergesToVisibleRows() {
    let changed = false;

    this.mergedCellsCollection.mergedCells.forEach((merge) => {
      const anchor = this.#mergeAnchors.get(merge);

      if (!anchor) {
        return;
      }

      const visualRow = this.hot.toVisualRow(anchor.physicalRow);
      const visualColumn = this.hot.toVisualColumn(anchor.physicalColumn);

      if (visualRow === null || visualColumn === null) {
        return;
      }

      if (merge.row !== visualRow || merge.col !== visualColumn) {
        merge.row = visualRow;
        merge.col = visualColumn;
        changed = true;
      }
    });

    if (changed) {
      this.mergedCellsCollection.rebuildMatrix();
    }
  }

  /**
   * Register shortcuts responsible for toggling a merge.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    if (!gridContext) {
      return;
    }

    gridContext.addShortcut({
      keys: [['Control', 'm']],
      callback: () => {
        const range = this.hot.getSelectedRangeActive();

        if (range && !range.isSingleHeader()) {
          this.toggleMerge(range);
          this.hot.render();
        }
      },
      runOnlyIf: (event?: KeyboardEvent) => !event?.altKey, // right ALT in some systems triggers ALT+CTRL
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

    gridContext?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Modifies the information on whether the current selection contains multiple cells. The `afterIsMultipleSelection`
   * hook callback.
   *
   * @param {boolean} isMultiple Determines whether the current selection contains multiple cells.
   * @returns {boolean}
   */
  #onAfterIsMultipleSelection = (isMultiple: boolean) => {
    if (isMultiple) {
      const mergedCells = this.mergedCellsCollection.mergedCells;
      const selectionRange = this.hot.getSelectedRangeActive();

      if (!selectionRange) {
        return isMultiple;
      }

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
  };

  /**
   * `modifyTransformFocus` hook callback.
   *
   * @param {object} delta The transformation delta.
   */
  #onModifyTransformFocus = (delta: { row: number, col: number }) => {
    this.#lastFocusDelta.row = delta.row;
    this.#lastFocusDelta.col = delta.col;
  };

  /**
   * `modifyTransformStart` hook callback.
   *
   * @param {object} delta The transformation delta.
   */
  #onModifyTransformStart = (delta: { row: number, col: number }) => {
    const selectedRange = this.hot.getSelectedRangeActive();

    if (!selectedRange) {
      return;
    }

    const { highlight } = selectedRange;
    const { columnIndexMapper, rowIndexMapper } = this.hot;

    if (this.#lastSelectedFocus) {
      if (this.#lastSelectedFocus.row !== null &&
          rowIndexMapper.getRenderableFromVisualIndex(this.#lastSelectedFocus.row) !== null) {
        highlight.row = this.#lastSelectedFocus.row;
      }

      if (this.#lastSelectedFocus.col !== null &&
          columnIndexMapper.getRenderableFromVisualIndex(this.#lastSelectedFocus.col) !== null) {
        highlight.col = this.#lastSelectedFocus.col;
      }

      this.#lastSelectedFocus = null;
    }

    if (highlight.row === null || highlight.col === null) {
      return;
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
        delta.col = -this.hot.view.countRenderableColumnsInRange(0, highlight.col);
      } else {
        delta.col = -Math.max(this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, highlight.col) - 1, 1);
      }

    } else if (delta.col > 0) {
      const nextColumn = highlight.col >= visualColumnIndexStart && highlight.col <= visualColumnIndexEnd ?
        visualColumnIndexEnd + 1 : visualColumnIndexStart;
      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

      if (notHiddenColumnIndex === null) {
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
        delta.row = -this.hot.view.countRenderableRowsInRange(0, highlight.row);
      } else {
        delta.row = -Math.max(this.hot.view.countRenderableRowsInRange(notHiddenRowIndex, highlight.row) - 1, 1);
      }

    } else if (delta.row > 0) {
      const nextRow = highlight.row >= visualRowIndexStart && highlight.row <= visualRowIndexEnd ?
        visualRowIndexEnd + 1 : visualRowIndexStart;
      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, 1);

      if (notHiddenRowIndex === null) {
        delta.row = this.hot.view.countRenderableRowsInRange(highlight.row, this.hot.countRows());
      } else {
        delta.row = Math.max(this.hot.view.countRenderableRowsInRange(highlight.row, notHiddenRowIndex) - 1, 1);
      }
    }
  };

  /**
   * The hook allows to modify the delta transformation object necessary for correct selection end transformations.
   *
   * @param {{ row: number, col: number }} delta The transformation delta.
   */
  #onModifyTransformEnd = (delta: { row: number, col: number }) => {
    const selectedRange = this.hot.getSelectedRangeActive();

    if (!selectedRange) {
      return;
    }

    const cloneRange = selectedRange.clone();
    const { to } = selectedRange;
    const toRow = to.row ?? 0;
    const toCol = to.col ?? 0;
    const { columnIndexMapper, rowIndexMapper } = this.hot;
    const expandCloneRange = (row: number, col: number) => {
      cloneRange.expand(this.hot._createCellCoords(row, col));

      for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
        const range = this.mergedCellsCollection.mergedCells[i].getRange();

        if (range) {
          cloneRange.expandByRange(range);
        }
      }
    };

    if (delta.col < 0) {
      let nextColumn = this.mergedCellsCollection.getStartMostColumnIndex(selectedRange, toCol) + delta.col;

      expandCloneRange(toRow, nextColumn);

      if (selectedRange.getHorizontalDirection() === 'E-W' && cloneRange.getHorizontalDirection() === 'E-W') {
        nextColumn = cloneRange.getTopStartCorner().col ?? nextColumn;
      }

      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, 1);

      if (notHiddenColumnIndex !== null) {
        delta.col = -Math.max(this.hot.view.countRenderableColumnsInRange(notHiddenColumnIndex, toCol) - 1, 1);
      }

    } else if (delta.col > 0) {
      let nextColumn = this.mergedCellsCollection.getEndMostColumnIndex(selectedRange, toCol) + delta.col;

      expandCloneRange(toRow, nextColumn);

      if (selectedRange.getHorizontalDirection() === 'W-E' && cloneRange.getHorizontalDirection() === 'W-E') {
        nextColumn = cloneRange.getBottomEndCorner().col ?? nextColumn;
      }

      const notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(nextColumn, -1);

      if (notHiddenColumnIndex !== null) {
        delta.col = Math.max(this.hot.view.countRenderableColumnsInRange(toCol, notHiddenColumnIndex) - 1, 1);
      }
    }

    if (delta.row < 0) {
      let nextRow = this.mergedCellsCollection.getTopMostRowIndex(selectedRange, toRow) + delta.row;

      expandCloneRange(nextRow, toCol);

      if (selectedRange.getVerticalDirection() === 'S-N' && cloneRange.getVerticalDirection() === 'S-N') {
        nextRow = cloneRange.getTopStartCorner().row ?? nextRow;
      }

      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, 1);

      if (notHiddenRowIndex !== null) {
        delta.row = -Math.max(this.hot.view.countRenderableRowsInRange(notHiddenRowIndex, toRow) - 1, 1);
      }

    } else if (delta.row > 0) {
      let nextRow = this.mergedCellsCollection.getBottomMostRowIndex(selectedRange, toRow) + delta.row;

      expandCloneRange(nextRow, toCol);

      if (selectedRange.getVerticalDirection() === 'N-S' && cloneRange.getVerticalDirection() === 'N-S') {
        nextRow = cloneRange.getBottomStartCorner().row ?? nextRow;
      }

      const notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(nextRow, -1);

      if (notHiddenRowIndex !== null) {
        delta.row = Math.max(this.hot.view.countRenderableRowsInRange(toRow, notHiddenRowIndex) - 1, 1);
      }
    }
  };

  /**
   * The hook corrects the range (before drawing it) after the selection was made on the merged cells.
   */
  #onBeforeSelectionHighlightSet = () => {
    const selectedRange = this.hot.getSelectedRangeLast();

    if (!selectedRange) {
      return;
    }

    const { highlight } = selectedRange;

    if (this.hot.selection.isSelectedByColumnHeader() || this.hot.selection.isSelectedByRowHeader()) {
      this.#lastSelectedFocus = highlight.clone();

      return;
    }

    for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
      const range = this.mergedCellsCollection.mergedCells[i].getRange();

      if (range) {
        selectedRange.expandByRange(range, false);
      }
    }

    for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
      const range = this.mergedCellsCollection.mergedCells[i].getRange();

      if (range) {
        selectedRange.expandByRange(range, false);
      }
    }

    if (highlight.row === null || highlight.col === null) {
      return;
    }

    const mergedParent = this.mergedCellsCollection.get(highlight.row, highlight.col);

    this.#lastSelectedFocus = highlight.clone();

    if (mergedParent) {
      highlight.assign(mergedParent);
    }
  };

  /**
   * The `modifyGetCellCoords` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} column Visual column index.
   * @param {boolean} topmost Indicates if the requested element belongs to the topmost layer.
   * @param {string} [source] String that identifies how this coords change will be processed.
   * @returns {Array|undefined} Visual coordinates of the merge.
   */
  #onModifyGetCellCoords = (row: number, column: number, topmost: boolean, source: string) => {
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
  };

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @param {object} defaultOptions The default context menu options.
   */
  #addMergeActionsToContextMenu(defaultOptions: { items: unknown[] }) {
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
  #onBeforeSetRangeStart = () => {
    this.#lastSelectedFocus = null;
  };

  /**
   * Detects if the last selected cell was a header cell.
   */
  #onBeforeSelectionFocusSet = () => {
    if (!this.#lastSelectedFocus || this.#lastSelectedFocus.isCell()) {
      return;
    }

    const selectedRange = this.hot.getSelectedRangeActive();

    if (!selectedRange) {
      return;
    }

    const verticalDir = selectedRange.getVerticalDirection();
    const horizontalDir = selectedRange.getHorizontalDirection();
    const focusCoords = this.#lastSelectedFocus.clone().normalize();

    if (focusCoords.row === null || focusCoords.col === null) {
      return;
    }

    this.#focusOrder.setActiveNode(focusCoords.row, focusCoords.col);

    if (this.#lastFocusDelta.row > 0 || this.#lastFocusDelta.col > 0) {
      this.#focusOrder.setPrevNodeAsActive();

    } else if (
      horizontalDir === 'E-W' && this.#lastFocusDelta.col < 0 ||
      verticalDir === 'S-N' && this.#lastFocusDelta.row < 0
    ) {
      this.#focusOrder.setNextNodeAsActive();
    }
  };

  /**
   * Changes the focus selection to the next or previous cell or merged cell position.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   */
  #onAfterSelectionFocusSet = (row: number, column: number) => {
    const { columnIndexMapper, rowIndexMapper } = this.hot;
    let activeSelectionLayerIndex = this.hot.getActiveSelectionLayerIndex();
    let notHiddenRowIndex = null;
    let notHiddenColumnIndex = null;

    if (this.#lastFocusDelta.col < 0) {
      const { rowEnd, colEnd, selectionLayer } = this.#focusOrder.getPrevHorizontalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colEnd, -1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowEnd, -1);
      activeSelectionLayerIndex = selectionLayer;

    } else if (this.#lastFocusDelta.col > 0) {
      const { rowStart, colStart, selectionLayer } = this.#focusOrder.getNextHorizontalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colStart, 1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowStart, 1);
      activeSelectionLayerIndex = selectionLayer;

    } else if (this.#lastFocusDelta.row < 0) {
      const { rowEnd, colEnd, selectionLayer } = this.#focusOrder.getPrevVerticalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colEnd, -1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowEnd, -1);
      activeSelectionLayerIndex = selectionLayer;

    } else if (this.#lastFocusDelta.row > 0) {
      const { rowStart, colStart, selectionLayer } = this.#focusOrder.getNextVerticalNode();

      notHiddenColumnIndex = columnIndexMapper.getNearestNotHiddenIndex(colStart, 1);
      notHiddenRowIndex = rowIndexMapper.getNearestNotHiddenIndex(rowStart, 1);
      activeSelectionLayerIndex = selectionLayer;
    }

    if (notHiddenRowIndex !== null || notHiddenColumnIndex !== null) {
      this.hot.selection.setActiveSelectionLayerIndex(activeSelectionLayerIndex);

      const selectedRange = this.hot.getSelectedRangeActive();
      const resolvedRow = notHiddenRowIndex ?? 0;
      const resolvedCol = notHiddenColumnIndex ?? 0;
      const coords = this.hot._createCellCoords(resolvedRow, resolvedCol);
      const mergeParent = this.mergedCellsCollection.get(resolvedRow, resolvedCol);
      const focusHighlight = this.hot.selection.highlight.getFocus();

      row = resolvedRow;
      column = resolvedCol;

      if (selectedRange) {
        if (mergeParent) {
          selectedRange.highlight.assign({
            row: this.hot.rowIndexMapper.getNearestNotHiddenIndex(mergeParent.row, 1) ?? undefined,
            col: this.hot.columnIndexMapper.getNearestNotHiddenIndex(mergeParent.col, 1) ?? undefined,
          });
        } else {
          selectedRange.highlight.assign(coords);
        }
      }

      focusHighlight.clear();
      focusHighlight
        .add(coords)
        .commit();
    }

    this.#focusOrder.setActiveNode(row, column, activeSelectionLayerIndex);
    this.#lastFocusDelta = { row: 0, col: 0 };
  };

  /**
   * Creates the horizontal and vertical cells order matrix (linked lists) for focused cell.
   */
  #onAfterSelectionEnd = () => {
    const selectedRanges = this.hot.getSelectedRange();

    if (selectedRanges) {
      this.#focusOrder.buildFocusOrder(selectedRanges);
    }
  };

  /**
   * The `afterGetCellMeta` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} col Column index.
   * @param {object} cellProperties The cell properties object.
   */
  #onAfterGetCellMeta = (row: number, col: number, cellProperties: Record<string, unknown>) => {
    const mergeParent = this.mergedCellsCollection.get(row, col);

    if (mergeParent) {
      if (mergeParent.row !== row || mergeParent.col !== col) {
        cellProperties.copyable = false;
        cellProperties.hidden = true;

      } else {
        cellProperties.rowspan = mergeParent.rowspan;
        cellProperties.colspan = mergeParent.colspan;
        cellProperties.spanned = true;
      }
    }
  };

  /**
   * `afterViewportRowCalculatorOverride` hook callback.
   *
   * @param {object} calc The row calculator object.
   */
  #onAfterViewportRowCalculatorOverride = (calc: { startRow: number, endRow: number }) => {
    if (this.getSetting('virtualized')) {
      return;
    }

    const nrOfColumns = this.hot.countCols();

    this.modifyViewportRowStart(calc, nrOfColumns);
    this.modifyViewportRowEnd(calc, nrOfColumns);
  };

  /**
   * Modify viewport start when needed.
   *
   * @private
   * @param {object} calc The row calculator object.
   * @param {number} nrOfColumns Number of visual columns.
   */
  modifyViewportRowStart(calc: { startRow: number, endRow: number }, nrOfColumns: number) {
    const rowMapper = this.hot.rowIndexMapper;
    const visualStartRow = rowMapper.getVisualFromRenderableIndex(calc.startRow) ?? 0;

    for (let visualColumnIndex = 0; visualColumnIndex < nrOfColumns; visualColumnIndex += 1) {
      const mergeParentForViewportStart = this.mergedCellsCollection.get(visualStartRow, visualColumnIndex);

      if (mergeParentForViewportStart !== false) {
        const nearestNotHiddenRow = rowMapper.getNearestNotHiddenIndex(mergeParentForViewportStart.row, 1);
        const renderableIndexAtMergeStart = nearestNotHiddenRow !== null
          ? rowMapper.getRenderableFromVisualIndex(nearestNotHiddenRow)
          : null;

        if (renderableIndexAtMergeStart !== null && renderableIndexAtMergeStart < calc.startRow) {
          calc.startRow = renderableIndexAtMergeStart;
          this.modifyViewportRowStart(calc, nrOfColumns);

          return;
        }
      }
    }
  }

  /**
   * Modify viewport end when needed.
   *
   * @private
   * @param {object} calc The row calculator object.
   * @param {number} nrOfColumns Number of visual columns.
   */
  modifyViewportRowEnd(calc: { startRow: number, endRow: number }, nrOfColumns: number) {
    const rowMapper = this.hot.rowIndexMapper;
    const visualEndRow = rowMapper.getVisualFromRenderableIndex(calc.endRow) ?? 0;

    for (let visualColumnIndex = 0; visualColumnIndex < nrOfColumns; visualColumnIndex += 1) {
      const mergeParentForViewportEnd = this.mergedCellsCollection.get(visualEndRow, visualColumnIndex);

      if (mergeParentForViewportEnd !== false) {
        const mergeEnd = mergeParentForViewportEnd.row + mergeParentForViewportEnd.rowspan - 1;
        const nearestRow = rowMapper.getNearestNotHiddenIndex(mergeEnd, -1);

        if (nearestRow !== null) {
          const renderableIndexAtMergeEnd = rowMapper.getRenderableFromVisualIndex(nearestRow);

          if (renderableIndexAtMergeEnd !== null && renderableIndexAtMergeEnd > calc.endRow) {
            calc.endRow = renderableIndexAtMergeEnd;
            this.modifyViewportRowEnd(calc, nrOfColumns);

            return;
          }
        }
      }
    }
  }

  /**
   * `afterViewportColumnCalculatorOverride` hook callback.
   *
   * @param {object} calc The column calculator object.
   */
  #onAfterViewportColumnCalculatorOverride = (calc: { startColumn: number, endColumn: number }) => {
    if (this.getSetting('virtualized')) {
      return;
    }

    const nrOfRows = this.hot.countRows();

    this.modifyViewportColumnStart(calc, nrOfRows);
    this.modifyViewportColumnEnd(calc, nrOfRows);
  };

  /**
   * Modify viewport start when needed.
   *
   * @private
   * @param {object} calc The column calculator object.
   * @param {number} nrOfRows Number of visual rows.
   */
  modifyViewportColumnStart(calc: { startColumn: number, endColumn: number }, nrOfRows: number) {
    const columnMapper = this.hot.columnIndexMapper;
    const visualStartCol = columnMapper.getVisualFromRenderableIndex(calc.startColumn) ?? 0;

    for (let visualRowIndex = 0; visualRowIndex < nrOfRows; visualRowIndex += 1) {
      const mergeParentForViewportStart = this.mergedCellsCollection.get(visualRowIndex, visualStartCol);

      if (mergeParentForViewportStart !== false) {
        const nearestCol = columnMapper.getNearestNotHiddenIndex(mergeParentForViewportStart.col, 1);

        if (nearestCol !== null) {
          const renderableIndexAtMergeStart = columnMapper.getRenderableFromVisualIndex(nearestCol);

          if (renderableIndexAtMergeStart !== null && renderableIndexAtMergeStart < calc.startColumn) {
            calc.startColumn = renderableIndexAtMergeStart;
            this.modifyViewportColumnStart(calc, nrOfRows);

            return;
          }
        }
      }
    }
  }

  /**
   * Modify viewport end when needed.
   *
   * @private
   * @param {object} calc The column calculator object.
   * @param {number} nrOfRows Number of visual rows.
   */
  modifyViewportColumnEnd(calc: { startColumn: number, endColumn: number }, nrOfRows: number) {
    const columnMapper = this.hot.columnIndexMapper;
    const visualEndCol = columnMapper.getVisualFromRenderableIndex(calc.endColumn) ?? 0;

    for (let visualRowIndex = 0; visualRowIndex < nrOfRows; visualRowIndex += 1) {
      const mergeParentForViewportEnd = this.mergedCellsCollection.get(visualRowIndex, visualEndCol);

      if (mergeParentForViewportEnd !== false) {
        const mergeEnd = mergeParentForViewportEnd.col + mergeParentForViewportEnd.colspan - 1;
        const nearestCol = columnMapper.getNearestNotHiddenIndex(mergeEnd, -1);

        if (nearestCol !== null) {
          const renderableIndexAtMergeEnd = columnMapper.getRenderableFromVisualIndex(nearestCol);

          if (renderableIndexAtMergeEnd !== null && renderableIndexAtMergeEnd > calc.endColumn) {
            calc.endColumn = renderableIndexAtMergeEnd;
            this.modifyViewportColumnEnd(calc, nrOfRows);

            return;
          }
        }
      }
    }
  }

  /**
   * Translates merged cell coordinates to renderable indexes.
   *
   * @private
   * @param {number} parentRow Visual row index.
   * @param {number} rowspan Rowspan.
   * @param {number} parentColumn Visual column index.
   * @param {number} colspan Colspan.
   * @returns {Array<number>} A two-element array of `[renderableRow, renderableColumn]`.
   */
  translateMergedCellToRenderable(
    parentRow: number, rowspan: number, parentColumn: number, colspan: number
  ): [number, number] {
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

    const renderableRow = parentRow >= 0 && firstNonHiddenRow !== null ?
      (rowMapper.getRenderableFromVisualIndex(firstNonHiddenRow) ?? parentRow) : parentRow;
    const renderableColumn = parentColumn >= 0 && firstNonHiddenColumn !== null ?
      (columnMapper.getRenderableFromVisualIndex(firstNonHiddenColumn) ?? parentColumn) : parentColumn;

    return [renderableRow, renderableColumn];
  }

  /**
   * The `modifyAutofillRange` hook callback.
   *
   * @param {number[]} fullArea The drag + base area coordinates (`[startRow, startColumn, endRow, endColumn]`).
   * @param {number[]} baseArea The selection area coordinates (`[startRow, startColumn, endRow, endColumn]`).
   * @returns {number[]} The new drag area (`[startRow, startColumn, endRow, endColumn]`).
   */
  #onModifyAutofillRange = (fullArea: number[], baseArea: number[]) => {
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
  };

  /**
   * `afterCreateCol` hook callback.
   *
   * @param {number} column Column index.
   * @param {number} count Number of created columns.
   */
  #onAfterCreateCol = (column: number, count: number) => {
    this.mergedCellsCollection.shiftCollections('right', column, count);
    this.#captureMergeAnchors();
  };

  /**
   * `afterRemoveCol` hook callback.
   *
   * @param {number} column Column index.
   * @param {number} count Number of removed columns.
   */
  #onAfterRemoveCol = (column: number, count: number) => {
    this.mergedCellsCollection.shiftCollections('left', column, count);
    this.#captureMergeAnchors();
  };

  /**
   * `afterCreateRow` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} count Number of created rows.
   * @param {string} source Source of change.
   */
  #onAfterCreateRow = (row: number, count: number, source: string) => {
    if (source === 'auto') {
      return;
    }

    this.mergedCellsCollection.shiftCollections('down', row, count);
    this.#captureMergeAnchors();
  };

  /**
   * `afterRemoveRow` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} count Number of removed rows.
   */
  #onAfterRemoveRow = (row: number, count: number) => {
    this.mergedCellsCollection.shiftCollections('up', row, count);
    this.#captureMergeAnchors();
  };

  /**
   * `beforeColumnMove` hook callback. Captures physical column positions of every merge
   * so they can be translated onto the new visual order in `afterColumnMove`.
   *
   * @param {number[]} columns Visual column indexes being moved.
   * @param {number} finalIndex Drop target visual index.
   * @param {number} dropIndex Drop index from drag.
   * @param {boolean} movePossible Whether the move is allowed.
   */
  #onBeforeColumnMove = (_columns: number[], _finalIndex: number, _dropIndex: number, movePossible: boolean) => {
    if (!movePossible || !this.#initialized) {
      this.#columnMoveSnapshot = null;

      return;
    }

    this.#columnMoveSnapshot = this.mergedCellsCollection.capturePhysicalSpans('column');
  };

  /**
   * `afterColumnMove` hook callback. Translates merges using the pre-move snapshot
   * and the now-updated column index mapping. Auto-splits merges whose physical
   * columns are no longer contiguous.
   *
   * @param {number[]} columns Visual column indexes that were moved.
   * @param {number} finalIndex Drop target visual index.
   * @param {number} dropIndex Drop index from drag.
   * @param {boolean} movePossible Whether the move was allowed.
   * @param {boolean} orderChanged Whether the move actually changed the order.
   */
  #onAfterColumnMove = (
    _columns: number[], _finalIndex: number, _dropIndex: number, _movePossible: boolean, orderChanged: boolean
  ) => {
    const snapshot = this.#columnMoveSnapshot;

    this.#columnMoveSnapshot = null;

    if (!orderChanged || !snapshot) {
      return;
    }

    this.mergedCellsCollection.translateAfterAxisMove('column', snapshot);
    this.#captureMergeAnchors();
    this.hot.render();
  };

  /**
   * `beforeRowMove` hook callback. Captures physical row positions of every merge
   * so they can be translated onto the new visual order in `afterRowMove`.
   *
   * @param {number[]} rows Visual row indexes being moved.
   * @param {number} finalIndex Drop target visual index.
   * @param {number} dropIndex Drop index from drag.
   * @param {boolean} movePossible Whether the move is allowed.
   */
  #onBeforeRowMove = (_rows: number[], _finalIndex: number, _dropIndex: number, movePossible: boolean) => {
    if (!movePossible || !this.#initialized) {
      this.#rowMoveSnapshot = null;

      return;
    }

    this.#rowMoveSnapshot = this.mergedCellsCollection.capturePhysicalSpans('row');
  };

  /**
   * `afterRowMove` hook callback. Translates merges using the pre-move snapshot
   * and the now-updated row index mapping. Auto-splits merges whose physical
   * rows are no longer contiguous.
   *
   * @param {number[]} rows Visual row indexes that were moved.
   * @param {number} finalIndex Drop target visual index.
   * @param {number} dropIndex Drop index from drag.
   * @param {boolean} movePossible Whether the move was allowed.
   * @param {boolean} orderChanged Whether the move actually changed the order.
   */
  #onAfterRowMove = (
    _rows: number[], _finalIndex: number, _dropIndex: number, _movePossible: boolean, orderChanged: boolean
  ) => {
    const snapshot = this.#rowMoveSnapshot;

    this.#rowMoveSnapshot = null;

    if (!orderChanged || !snapshot) {
      return;
    }

    this.mergedCellsCollection.translateAfterAxisMove('row', snapshot);
    this.#captureMergeAnchors();
    this.hot.render();
  };

  /**
   * `beforeColumnFreeze` / `beforeColumnUnfreeze` hook callback. `manualColumnFreeze`
   * reorders the visual sequence directly through the column index mapper, so we
   * need to translate merges through it the same way as for `manualColumnMove`.
   *
   * @param {number} column Visual column index being frozen/unfrozen.
   * @param {boolean} performed Whether the (un)freeze will actually run.
   */
  #onBeforeColumnFreeze = (_column: number, performed: boolean) => {
    if (!performed || !this.#initialized) {
      this.#columnMoveSnapshot = null;

      return;
    }

    this.#columnMoveSnapshot = this.mergedCellsCollection.capturePhysicalSpans('column');
  };

  /**
   * `afterColumnFreeze` / `afterColumnUnfreeze` hook callback.
   *
   * @param {number} column Visual column index that was frozen/unfrozen.
   * @param {boolean} performed Whether the (un)freeze actually ran.
   */
  #onAfterColumnFreeze = (_column: number, performed: boolean) => {
    const snapshot = this.#columnMoveSnapshot;

    this.#columnMoveSnapshot = null;

    if (!performed || !snapshot) {
      return;
    }

    this.mergedCellsCollection.translateAfterAxisMove('column', snapshot);
    this.#captureMergeAnchors();
    this.hot.render();
  };

  /**
   * `afterChange` hook callback. Used to propagate merged cells after using Autofill.
   *
   * @param {Array} changes The changes array.
   * @param {string} source Determines the source of the change.
   */
  #onAfterChange = (changes: unknown[][], source: string) => {
    if (source !== 'Autofill.fill') {
      return;
    }

    this.autofillCalculations.recreateAfterDataPopulation(changes);
  };

  /**
   * `beforeDrawAreaBorders` hook callback.
   *
   * @param {Array} corners Visual coordinates of the area corners.
   * @param {string} className Class name for the area.
   */
  #onBeforeDrawAreaBorders = (corners: number[], className: string) => {
    if (className && className === 'area') {
      const selectedRange = this.hot.getSelectedRangeActive();

      if (!selectedRange) {
        return;
      }

      const mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(selectedRange);

      arrayEach(mergedCellsWithinRange, (mergedCell: MergedCellCoords) => {
        if (selectedRange.getBottomEndCorner().row === mergedCell.getLastRow() &&
          selectedRange.getBottomEndCorner().col === mergedCell.getLastColumn()) {
          corners[2] = mergedCell.row;
          corners[3] = mergedCell.col;
        }
      });
    }
  };

  /**
   * `afterDrawSelection` hook callback.
   *
   * @param {number} currentRow Visual row index of the currently processed cell.
   * @param {number} currentColumn Visual column index of the currently cell.
   * @param {Array} cornersOfSelection Array of the current selection.
   * @param {number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @returns {string|undefined}
   */
  #onAfterDrawSelection = (
    currentRow: number, currentColumn: number, cornersOfSelection: number[], layerLevel: number | undefined
  ) => {
    // Nothing's selected (hook might be triggered by the custom borders)
    if (!cornersOfSelection) {
      return;
    }

    return this.selectionCalculations
      .getSelectedMergedCellClassName(currentRow, currentColumn, cornersOfSelection, layerLevel);
  };

  /**
   * `beforeRemoveCellClassNames` hook callback.
   *
   * @returns {string[]}
   */
  #onBeforeRemoveCellClassNames = () => {
    return this.selectionCalculations.getSelectedMergedCellClassNameToRemove();
  };

  /**
   * Allows to prevent opening the editor while more than one merged cell is selected.
   *
   * @param {number} row Visual row index of the edited cell.
   * @param {number} column Visual column index of the edited cell.
   * @param {string | null} initialValue The initial editor value.
   * @param {MouseEvent | KeyboardEvent} event The event which was responsible for opening the editor.
   * @returns {boolean | undefined}
   */
  #onBeforeBeginEditing = (
    row: number, column: number, initialValue: string | null, event: MouseEvent | KeyboardEvent
  ) => {
    if (!(event instanceof MouseEvent)) {
      return;
    }

    const selection = this.hot.getSelectedRangeActive();

    if (!selection) {
      return;
    }

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
  };

  /**
   * Hook used to modify the row height depends on the merged cells in the row.
   *
   * @param {number} height The row height value provided by the Core.
   * @param {number} row The visual row index.
   * @param {string} overlayType The overlay type that is currently rendered.
   * @returns {number}
   */
  #onModifyRowHeightByOverlayName = (height: number, row: number, overlayType: string) => {
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
      const activeOverlay = this.hot.view.getOverlayByName(overlayType) as unknown as Overlay | null;
      const overlayWtTable = activeOverlay?.clone?.wtTable;

      if (!overlayWtTable) {
        return height;
      }

      firstColumn = this.hot.columnIndexMapper
        .getVisualFromRenderableIndex(overlayWtTable.getFirstRenderedColumn());
      lastColumn = this.hot.columnIndexMapper
        .getVisualFromRenderableIndex(overlayWtTable.getLastRenderedColumn());
    }

    if (firstColumn === null || firstColumn === undefined) {
      return height;
    }

    const firstMergedCellInRow = this.mergedCellsCollection.get(row, firstColumn);

    if (!firstMergedCellInRow) {
      return height;
    }

    const from = this.hot._createCellCoords(row, firstColumn);
    const to = this.hot._createCellCoords(row, lastColumn ?? firstColumn);
    const viewportRange = this.hot._createCellRange(from, from, to);
    const mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(viewportRange, true);
    const maxRowspan = mergedCellsWithinRange.reduce(
      (acc: number, { rowspan }: { rowspan: number }) => Math.max(acc, rowspan), 1);
    let rowspanCorrection = 0;

    if (mergedCellsWithinRange.length > 1 && mergedCellsWithinRange[0].rowspan < maxRowspan) {
      rowspanCorrection = maxRowspan - mergedCellsWithinRange[0].rowspan;
    }

    mergedCellsWithinRange.forEach(({ rowspan }: { rowspan: number }) => {
      let rowspanAfterCorrection = 0;

      if (overlayType === 'top' || overlayType === 'top_inline_start_corner') {
        rowspanAfterCorrection = Math.min(maxRowspan, this.hot.view.countNotHiddenFixedRowsTop() - row);
      } else {
        rowspanAfterCorrection = rowspan - rowspanCorrection;
      }

      height = Math.max(height ?? 0, sumCellsHeights(this.hot, row, rowspanAfterCorrection));
    });

    return height;
  };
}
