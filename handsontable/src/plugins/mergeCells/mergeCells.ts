import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { Overlay } from '../../3rdparty/walkontable/src/overlay/regions/_base';
import type { default as Table } from '../../3rdparty/walkontable/src/table/baseTable';
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
import { sumCellsHeights, toMergeAreaKey } from './utils';
import { toMergeAreaRange, type MergeAreaGeometry } from '../../utils/mergeAreas';
import type { CellChange } from '../../settings';

Hooks.getSingleton().register('beforeMergeCells');
Hooks.getSingleton().register('afterMergeCells');
Hooks.getSingleton().register('beforeUnmergeCells');
Hooks.getSingleton().register('afterUnmergeCells');

export const PLUGIN_KEY = 'mergeCells';
export const PLUGIN_PRIORITY = 150;
const SHORTCUTS_GROUP = PLUGIN_KEY;

/**
 * The physical description of a merged cell: every physical row it covers, and its physical left
 * column. Physical indexes survive trimming and reordering, so this stays authoritative while the
 * merge's visual coordinates are a derived value.
 */
interface MergeAnchor {
  physicalRows: number[];
  physicalColumn: number;
}

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
   * Keys of the merge areas seen in a previous settings application, in the {@link toMergeAreaKey}
   * form. Recording an area says only that its clearing pass has already run once — not that the
   * write landed, which a `beforeChange` handler or a validator can still refuse. Derived from the
   * declared settings, never from `mergedCellsCollection`: the collection's coordinates are
   * re-anchored when rows are trimmed or reordered, so they stop matching what the settings declare
   * and would make a re-applied area look new.
   *
   * @type {Set<string>}
   */
  #appliedMergeKeys: Set<string> = new Set();
  /**
   * The physical rows every merged cell covers, plus its physical left column, captured while its
   * visual coordinates are authoritative (creation, structural edits). This is the authoritative
   * description of a merge: physical indexes are stable across trimming, so one capture survives any
   * number of filter/trim toggles, and the merge's visual `row`/`rowspan` are derived from it on every
   * index-mapper cache change by {@link MergeCells#reanchorMergesToVisibleRows}.
   *
   * The rows are stored as an explicit list rather than a `{ start, length }` range because a merge's
   * physical rows need not be contiguous — merging on a sorted grid, or over a row hidden by a filter,
   * produces a scattered set.
   *
   * @type {WeakMap<MergedCellCoords, MergeAnchor>}
   */
  #mergeAnchors: WeakMap<MergedCellCoords, MergeAnchor> = new WeakMap();

  /**
   * Merges whose entire row span is currently trimmed, so they have been removed from the lookup
   * matrix to avoid colliding with whatever physical row later surfaces at their stale visual slot.
   * Tracked so that when such a merge becomes visible again it is force-added back to the matrix even
   * if it lands on the exact visual `row`/`col` it held before being purged (where the
   * "skip when unchanged" relocation optimization would otherwise leave it absent).
   *
   * @type {WeakSet<MergedCellCoords>}
   */
  #purgedMerges: WeakSet<MergedCellCoords> = new WeakSet();

  /**
   * Whether the clipboard block of the paste currently being processed is a single cell. A single
   * pasted value carries no structure, so it leaves the merge it lands on intact and only writes
   * the merge's top-left cell; a multi-cell block cannot fit inside a merge, so the merge is
   * dropped and every value becomes visible. Set from `beforePaste`, which always runs before the
   * paste's `beforeChange`.
   *
   * @type {boolean}
   */
  #isSingleCellPaste = false;

  /**
   * The merge areas that the paste currently being processed is about to destroy, captured from
   * `beforeChange` while they are still in the collection, and measured against the changes that
   * survived every other listener. The UndoRedo plugin reads this so that the geometry rides
   * inside the same undo action as the pasted data.
   *
   * @type {Array}
   */
  #pasteUnmergeSnapshot: MergeAreaGeometry[] = [];

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
    // Runs last among the `beforePaste` listeners: another listener may rewrite `pastedData` in
    // place (a supported contract), and the single-cell decision has to see the final block.
    this.addHook('beforePaste', this.#onBeforePaste, 1000);
    // Runs at 900: after every ordinary `beforeChange` listener, so the recorded geometry is
    // measured against the change set that actually survives, and before `DataChangeAction`'s
    // listener at 1000, which reads it. A listener that vetoes part of a paste by nulling its
    // entries therefore shrinks - or empties - what this records, instead of leaving a snapshot
    // that describes a write that never happened.
    this.addHook('beforeChange', this.#onBeforeChange, 900);
    this.addHook('afterChange', this.#onAfterChange);
    this.addHook('beforeDrawBorders', this.#onBeforeDrawAreaBorders);
    this.addHook('afterDrawSelection', this.#onAfterDrawSelection);
    this.addHook('beforeRemoveCellClassNames', this.#onBeforeRemoveCellClassNames);
    this.addHook('beforeBeginEditing', this.#onBeforeBeginEditing);
    this.addHook('modifyRowHeightByOverlayName', this.#onModifyRowHeightByOverlayName);
    this.addHook('modifySinglePassLayout', this.#onModifySinglePassLayout);
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
    this.#appliedMergeKeys.clear();
    this.#resetPasteState();
    this.unregisterShortcuts();
    this.hot.render();
    this.#initialized = false;
    super.disablePlugin();
  }

  /**
   * Destroys the plugin instance. Removes the row index mapper local hook explicitly, because
   * `BasePlugin#destroy` only clears `addHook`-managed hooks, not raw `addLocalHook` registrations,
   * and releases the per-paste state, which `BasePlugin#destroy` cannot reach either - its
   * `objectEach` sweep only sees enumerable own properties, never `#` fields.
   */
  destroy() {
    this.hot?.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onRowIndexCacheUpdated);
    this.#resetPasteState();
    super.destroy();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
   * following configuration options:
   *  - [`mergeCells`](@/api/options.md#mergecells)
   */
  updatePlugin() {
    // Copy before `disablePlugin()` clears the field, so `generateFromSettings()` can tell a
    // re-applied area from a newly declared one.
    const alreadyAppliedMerges = new Set(this.#appliedMergeKeys);

    this.disablePlugin();
    this.enablePlugin();

    this.generateFromSettings(alreadyAppliedMerges);
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
   * @param {Set<string>} [alreadyAppliedMerges] Keys of the merge areas that were already applied before
   * this call, in the {@link toMergeAreaKey} form — normally a copy of `#appliedMergeKeys` taken before
   * `disablePlugin()` cleared it. Those areas keep their merge but skip the data population, because
   * their cells were cleared when they were first applied. Defaults to an empty set, so a first
   * application populates every area.
   */
  generateFromSettings(alreadyAppliedMerges: Set<string> = new Set()) {
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

      // Merging without data population. Runs for every area, re-applied or not — `updatePlugin()`
      // clears the collection first, so skipping this would drop the merge entirely.
      this.mergeRange(mergeRange, true, true);

      const mergeAreaKey = toMergeAreaKey(mergeCellInfo);
      // A first application clears the whole area, exactly as before. A re-applied one clears only
      // the cells that still hold a value: writing `null` over a cell that is already empty changes
      // no data, but still emits `beforeChange`/`afterChange`, and that is what loops an integration
      // resending its settings in response to those hooks (#7555).
      const isReapplied = alreadyAppliedMerges.has(mergeAreaKey);

      this.#appliedMergeKeys.add(mergeAreaKey);

      for (let r = row; r < row + rowspan; r++) {
        for (let c = col; c < col + colspan; c++) {
          // Not resetting a cell representing a merge area's value.
          if (r === row && c === col) {
            continue;
          }

          if (!isReapplied || this.#getStoredValueAt(r, c) !== null) {
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
   * Reads what a cell holds in the data source, bypassing `valueGetter` and the `modifyData` hook.
   * A merge area's clearing write stores `null`, so deciding whether it still needs to run has to
   * compare against the stored value — the displayed one can be non-null for an already cleared cell.
   * Returns `undefined` when the coordinates cannot be translated, which keeps the caller on the safe
   * side by treating the cell as not yet cleared.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {*} The stored value.
   */
  #getStoredValueAt(row: number, column: number): unknown {
    const physicalRow = this.hot.toPhysicalRow(row);

    if (physicalRow === null) {
      return undefined;
    }

    // `getSourceDataAtCell()` takes a physical row but a *visual* column — it runs `colToProp()`,
    // which translates to physical itself. Translating the column here as well would translate it
    // twice and read a different cell whenever the two orders differ.
    return this.hot.getSourceDataAtCell(physicalRow, column);
  }

  /**
   * Clears the merged cells from the merged cell container.
   */
  clearCollections(): void {
    arrayEach(this.mergedCellsCollection.mergedCells, (mergedCell: MergedCellCoords) => {
      this.#resetMergedCellMeta(mergedCell);
    });

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
    // A one-cell area is never a merge, on any path. The automatic paths (settings, undo) restore
    // areas that were merges when they were recorded, so a single cell reaching them means the
    // recorded geometry described only the visible part of a merge whose other rows were trimmed
    // away. Creating it would silently shrink the merge to that one cell. Rejected without a warning
    // here: unlike a hand-written setting, there is nothing for the developer to correct.
    if (auto) {
      return !MergedCellCoords.isSingleCell(newMergedCellInfo);
    }

    return this.validateSetting(newMergedCellInfo);
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
   * Eagerly removes the merge-related cell meta (`hidden`, `copyable`, `spanned`, `rowspan`,
   * `colspan`) for every cell covered by the provided merged cell. Done at the moment the merge
   * is dropped — rather than lazily in `afterGetCellMeta` — so the stale flags cannot linger in
   * the cached meta and leak into consumers that read it directly (e.g. `toHTML`) when the
   * following render is suspended/batched and never actually runs.
   *
   * @param {MergedCellCoords} mergedCell The merged cell whose meta should be reset.
   */
  #resetMergedCellMeta(mergedCell: MergedCellCoords) {
    rangeEach(0, mergedCell.rowspan - 1, (i) => {
      rangeEach(0, mergedCell.colspan - 1, (j) => {
        this.hot.removeCellMeta(mergedCell.row + i, mergedCell.col + j, 'hidden');
        this.hot.removeCellMeta(mergedCell.row + i, mergedCell.col + j, 'copyable');
      });
    });

    this.hot.removeCellMeta(mergedCell.row, mergedCell.col, 'spanned');
    this.hot.removeCellMeta(mergedCell.row, mergedCell.col, 'rowspan');
    this.hot.removeCellMeta(mergedCell.row, mergedCell.col, 'colspan');
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
      this.#resetMergedCellMeta(currentCollection);
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
   * Returns the merge areas that the paste currently being processed is about to destroy, captured
   * before any of its data reached the grid. The UndoRedo plugin reads this from its own
   * `beforeChange` listener - registered at a later priority, so it runs after this plugin's -
   * so the geometry can ride inside the same undo action as the pasted data and a single undo step
   * puts both back.
   *
   * @private
   * @returns {Array} Array of `{ row, col, rowspan, colspan }` objects. Empty for a change that
   *   destroys no merge, which is every change other than a multi-cell paste over a merge.
   */
  getPasteUnmergeSnapshot(): MergeAreaGeometry[] {
    return [...this.#pasteUnmergeSnapshot];
  }

  /**
   * Merges the specified range.
   *
   * @param {number} startRow Visual start row of the merged cell.
   * @param {number} startColumn Visual start column of the merged cell.
   * @param {number} endRow Visual end row of the merged cell.
   * @param {number} endColumn Visual end column of the merged cell.
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
   * @param {number} startRow Visual start row of the merged cell.
   * @param {number} startColumn Visual start column of the merged cell.
   * @param {number} endRow Visual end row of the merged cell.
   * @param {number} endColumn Visual end column of the merged cell.
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
   *
   * Applying the declared merges used to draw the grid twice: `generateFromSettings()` clears the
   * cells each area covers through `setDataAtCell()`, which renders on its own, and the merge then
   * needs a render of its own to span them. Batching collapses the two into a single draw. With no
   * declared area there is nothing to apply, so the initial render already shows the final grid and
   * any draw here would repaint an identical table (#5687).
   */
  #onAfterInit = () => {
    if (this.getSetting<unknown[]>('cells').length > 0) {
      this.hot.suspendRender();

      try {
        this.generateFromSettings();
        // Load-bearing: `resumeRender()` draws through the view, which picks fast-vs-full from
        // `forceFullRender`, and only `Core#render` sets it. Without this the batched draw can be
        // a fast one, which skips the cell renderers that apply the spans.
        this.hot.render();
      } finally {
        // Suspend/resume by hand rather than through `Core#batchRender`, which has no `finally`:
        // the clearing write runs user code (`beforeChange`, a validator), and a throw there would
        // otherwise leave the render-suspend counter raised for the rest of the instance's life.
        // Only that counter is restored here — the throw still propagates, as it did before.
        this.hot.resumeRender();
      }
    }

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
   * Row index mapper `cacheUpdated` callback. Re-anchors every merge onto its physical anchor's current
   * visual position after any index-mapper cache change — a visibility change (Filters / `trimRows` /
   * `nestedRows` collapse / `hiddenRows`) or an index-sequence change (a sort / move). The re-anchor is
   * anchor-based and idempotent, and this hook fires after the mapper cache has been (re)built —
   * including once at the end of a batched `suspendOperations`/`resumeOperations` block — so it is the
   * authoritative place to position merges: it covers a plain filter, a sort and a filter batched
   * together, and a standalone batched sort (where re-anchoring inside the in-batch `afterColumnSort`
   * hook used to read a stale, pre-sort cache). Row/column moves additionally translate (and split)
   * spans in their `afterRowMove`/`afterColumnMove` hooks; this re-anchor runs on top of that authoritative
   * translation as a no-op.
   *
   * @param {{ trimmedIndexesChanged: boolean, hiddenIndexesChanged: boolean, indexesSequenceChanged:
   *   boolean }} changes Cache flags.
   */
  #onRowIndexCacheUpdated = (
    { trimmedIndexesChanged, hiddenIndexesChanged, indexesSequenceChanged }:
    { trimmedIndexesChanged: boolean, hiddenIndexesChanged: boolean, indexesSequenceChanged: boolean }
  ) => {
    // The hook is removed in `disablePlugin`/`destroy`, but keep a defensive guard in case a final
    // `updateCache` still reaches us after `this.hot` has been dropped.
    if (!this.hot || !this.#initialized) {
      return;
    }

    if (trimmedIndexesChanged || hiddenIndexesChanged || indexesSequenceChanged) {
      this.#reanchorMergesToVisibleRows();
    }
  };

  /**
   * Captures the physical rows and the physical left column of a single merge from its current visual
   * coords. While row trimming is active the merge's visual `row`/`rowspan` are a derived value (set by
   * {@link MergeCells#reanchorMergesToVisibleRows}) that describes only the visible part, so
   * re-deriving the physical rows from it would shrink the authoritative anchor captured earlier — the
   * previously stored `physicalRows` are kept instead. The column is never distorted by row trimming,
   * so it is always refreshed (covering column insert/remove performed while a filter is active). A
   * merge with no anchor yet (e.g. created during an active filter) is captured from its current,
   * visible position, which is exactly the set of rows it covers.
   *
   * @param {MergedCellCoords} merge The merge to capture.
   * @param {boolean} [trimmingActive] Whether row trimming is currently active (computed if omitted).
   */
  #captureAnchorOf(merge: MergedCellCoords, trimmingActive: boolean = this.#isRowTrimmingActive()) {
    const physicalColumn = this.hot.toPhysicalColumn(merge.col);

    if (physicalColumn === null) {
      return;
    }

    const existing = this.#mergeAnchors.get(merge);

    if (trimmingActive && existing) {
      this.#mergeAnchors.set(merge, { physicalRows: existing.physicalRows, physicalColumn });

      return;
    }

    const physicalRows: number[] = [];

    for (let offset = 0; offset < merge.rowspan; offset++) {
      const physicalRow = this.hot.toPhysicalRow(merge.row + offset);

      if (physicalRow !== null) {
        physicalRows.push(physicalRow);
      }
    }

    if (physicalRows.length > 0) {
      this.#mergeAnchors.set(merge, { physicalRows, physicalColumn });
    }
  }

  /**
   * Captures the physical rows and left column of every merge (after a bulk (re)generation).
   */
  #captureMergeAnchors() {
    const trimmingActive = this.#isRowTrimmingActive();

    this.mergedCellsCollection.mergedCells.forEach(merge => this.#captureAnchorOf(merge, trimmingActive));
  }

  /**
   * Captures an anchor only for merges that do not have one yet. Used by the row insert/remove hooks,
   * which mirror the physical renumbering onto the existing anchors themselves: re-deriving those from
   * the merges there would read coordinates the shift has just rewritten from a mid-edit state, and
   * would discard the trimmed rows of a partially trimmed merge.
   */
  #captureMissingMergeAnchors() {
    const trimmingActive = this.#isRowTrimmingActive();

    this.mergedCellsCollection.mergedCells.forEach((merge) => {
      if (!this.#mergeAnchors.has(merge)) {
        this.#captureAnchorOf(merge, trimmingActive);
      }
    });
  }

  /**
   * Remaps the cached physical rows of every merge's anchor after a row insert. While trimming is
   * active {@link MergeCells#captureAnchorOf} preserves the stored `physicalRows` verbatim, so the
   * structural edit's physical renumbering has to be mirrored onto the cache here or re-anchoring
   * would later target stale rows. Rows at or after the insertion point move down by `count`, and a
   * merge that had rows on both sides of that point grows to cover the inserted ones — the physical
   * mirror of the `indexOfChange > mergeStart` branch in {@link MergedCellCoords#shift}.
   *
   * @param {number} pivot The physical row the new rows were inserted at.
   * @param {number} count The number of inserted rows.
   */
  #remapRowAnchorsAfterInsert(pivot: number, count: number) {
    this.#remapAnchors((physicalRows) => {
      const remapped = physicalRows.map(physicalRow => (physicalRow >= pivot ? physicalRow + count : physicalRow));
      const growsOverInsertion = remapped.some(physicalRow => physicalRow < pivot) &&
        remapped.some(physicalRow => physicalRow >= pivot + count);

      if (!growsOverInsertion) {
        return remapped;
      }

      const inserted = Array.from({ length: count }, (_, offset) => pivot + offset);

      // Appended rather than sorted in: the list's first entry is what
      // {@link MergeCells#reanchorMergesToVisibleRows} reads as the merge's top-left, and a merge made
      // on a sorted grid has a list that does not ascend, so sorting could move the anchor onto
      // another row of the span.
      return remapped.concat(inserted);
    });
  }

  /**
   * Remaps the cached physical rows of every merge's anchor after a row remove. Removed rows drop out
   * of each anchor and the survivors are renumbered down by how many removed rows sat above them. A
   * merge whose rows were all removed keeps an empty anchor — {@link MergeCells#onAfterRemoveRow}
   * uses that as the signal to let `shiftCollections` drop it.
   *
   * @param {number[]} physicalRows Physical indexes of the removed rows.
   */
  #remapRowAnchorsAfterRemove(physicalRows: number[]) {
    const removed = new Set(physicalRows);

    this.#remapAnchors(anchoredRows => anchoredRows
      .filter(physicalRow => !removed.has(physicalRow))
      .map(physicalRow => physicalRow -
        physicalRows.reduce((shift, removedRow) => shift + (removedRow < physicalRow ? 1 : 0), 0)));
  }

  /**
   * Applies a remapping function to the cached physical rows of every merge's anchor. Merges with no
   * anchor are left untouched.
   *
   * @param {function(number[]): number[]} mapPhysicalRows Maps the old physical rows to the new ones.
   */
  #remapAnchors(mapPhysicalRows: (physicalRows: number[]) => number[]) {
    this.mergedCellsCollection.mergedCells.forEach((merge) => {
      const anchor = this.#mergeAnchors.get(merge);

      if (!anchor) {
        return;
      }

      this.#mergeAnchors.set(merge, {
        physicalRows: mapPhysicalRows(anchor.physicalRows),
        physicalColumn: anchor.physicalColumn,
      });
    });
  }

  /**
   * Carries the physical anchors across a reorder. `translateAfterAxisMove` replaces every merge with
   * a new object, and the anchors are keyed on object identity, so without this the replacements would
   * be anchored from their post-move visual coordinates — which, while rows are trimmed, describe only
   * the visible part of the merge. The trimmed rows would then be lost for good, and clearing the
   * filter would no longer restore the merge.
   *
   * A column reorder never changes which rows a merge covers, so every fragment it produces inherits
   * the rows of the merge it came from. A row reorder does change them, and when it splits a merge
   * there is no way to tell which fragment a trimmed row belongs to, so only an unsplit merge carries
   * its rows over; a split one is re-anchored from what is visible, as it was before.
   *
   * @param {Map<MergedCellCoords, MergedCellCoords[]>} replacements Map of the merge before the
   * reorder -> the merges that replaced it.
   * @param {'column' | 'row'} axis The reordered axis.
   */
  #transferAnchorsAfterAxisMove(replacements: Map<MergedCellCoords, MergedCellCoords[]>, axis: 'column' | 'row') {
    replacements.forEach((newMerges, source) => {
      const anchor = this.#mergeAnchors.get(source);

      if (!anchor || (axis === 'row' && newMerges.length !== 1)) {
        return;
      }

      newMerges.forEach((merge) => {
        this.#mergeAnchors.set(merge, {
          physicalRows: [...anchor.physicalRows],
          physicalColumn: anchor.physicalColumn,
        });
      });
    });
  }

  /**
   * Whether any row is currently trimmed (Filters / `trimRows` / `nestedRows`). Trimming compresses
   * the visual row space, so while it is active a merge's visual `row` may be a re-anchored, derived
   * value rather than an authoritative one.
   *
   * @returns {boolean}
   */
  #isRowTrimmingActive(): boolean {
    const { rowIndexMapper } = this.hot;

    return rowIndexMapper.getNotTrimmedIndexesLength() < rowIndexMapper.getNumberOfIndexes();
  }

  /**
   * Derives every merge's visual `row`/`col`/`rowspan` from its captured physical rows. The merge is
   * placed on the visual position of the first of those rows that is still visible, and spans as many
   * visual rows as it has visible physical rows. Trimming compresses the visual row space — a trimmed
   * row has no visual index at all — so a merge that kept its full `rowspan` while some of its rows
   * were trimmed would reach past its own data and onto the rows below, colliding with whatever merge
   * lives there. The full span is preserved in the anchor, so the merge is restored whole once its
   * rows come back. Hidden (as opposed to trimmed) rows keep their visual index, so they do not shrink
   * the span here; the renderer clips them out of the rendered `rowspan` instead.
   *
   * Merges with no captured anchor are left untouched. Merges with a hidden anchor column or with
   * every row trimmed have no visible top-left, so they are purged from the lookup matrix (and
   * re-added once they become visible again) to avoid leaving a stale entry that a later filter could
   * resolve to as a phantom merge.
   *
   * A merge whose visible physical rows are not consecutive in the visual order (only reachable by
   * sorting or moving rows, never by trimming alone) still spans one continuous visual block from its
   * first visible row, as it did before this derivation was introduced.
   */
  #reanchorMergesToVisibleRows() {
    const { mergedCells } = this.mergedCellsCollection;

    // `cacheUpdated` fires on every filter/trim toggle, so bail out cheaply when there is nothing to
    // re-anchor.
    if (mergedCells.length === 0) {
      return;
    }

    const relocations: { mergedCell: MergedCellCoords, row: number, col: number, rowspan: number }[] = [];
    const purges: MergedCellCoords[] = [];

    mergedCells.forEach((merge) => {
      const anchor = this.#mergeAnchors.get(merge);

      if (!anchor) {
        return;
      }

      const visualColumn = this.hot.toVisualColumn(anchor.physicalColumn);
      let visualRow: number | null = null;
      let visualRowspan = 0;

      if (visualColumn !== null) {
        anchor.physicalRows.forEach((physicalRow) => {
          const rowIndex = this.hot.toVisualRow(physicalRow);

          if (rowIndex === null) {
            return;
          }

          if (visualRow === null) {
            visualRow = rowIndex;
          }

          visualRowspan += 1;
        });
      }

      // No visible top-left (every row trimmed, or the anchor column is hidden): drop the stale matrix
      // entry so a later filter showing a different physical row at the same visual slot does not
      // resolve to this phantom merge. Always re-purge (removing an absent footprint is a cheap no-op)
      // so the entry stays gone even after `shiftCollections` rebuilds the matrix from every merge on a
      // structural edit.
      if (visualColumn === null || visualRow === null) {
        this.#purgedMerges.add(merge);
        purges.push(merge);

        return;
      }

      // Force a relocation for a merge that re-enters the viewport so it is re-added to the matrix even
      // when it lands on the same visual coordinates it had before being purged.
      const wasPurged = this.#purgedMerges.delete(merge);

      if (wasPurged || merge.row !== visualRow || merge.col !== visualColumn || merge.rowspan !== visualRowspan) {
        relocations.push({
          mergedCell: merge,
          row: visualRow,
          col: visualColumn,
          rowspan: visualRowspan,
        });
      }
    });

    if (purges.length > 0) {
      this.mergedCellsCollection.removeFromMatrix(purges);
    }

    if (relocations.length > 0) {
      this.mergedCellsCollection.relocateInMatrix(relocations);
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
    const mergedCellsWithinRow = this.mergedCellsCollection.getByVisualRow(visualStartRow);

    for (let i = 0; i < mergedCellsWithinRow.length; i += 1) {
      const mergeParentForViewportStart = mergedCellsWithinRow[i];
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
    const mergedCellsWithinRow = this.mergedCellsCollection.getByVisualRow(visualEndRow);

    for (let i = 0; i < mergedCellsWithinRow.length; i += 1) {
      const mergeParentForViewportEnd = mergedCellsWithinRow[i];
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
    const mergedCellsWithinColumn = this.mergedCellsCollection.getByVisualColumn(visualStartCol);

    for (let i = 0; i < mergedCellsWithinColumn.length; i += 1) {
      const mergeParentForViewportStart = mergedCellsWithinColumn[i];
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
    const mergedCellsWithinColumn = this.mergedCellsCollection.getByVisualColumn(visualEndCol);

    for (let i = 0; i < mergedCellsWithinColumn.length; i += 1) {
      const mergeParentForViewportEnd = mergedCellsWithinColumn[i];
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
    // `shiftCollections` rebuilt the matrix from every merge, re-adding any currently purged
    // (fully hidden) merge; re-anchor to drop those stale footprints again.
    this.#reanchorMergesToVisibleRows();
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
    // `shiftCollections` rebuilt the matrix from every merge, re-adding any currently purged
    // (fully hidden) merge; re-anchor to drop those stale footprints again.
    this.#reanchorMergesToVisibleRows();
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

    // Inserting renumbers physical rows at/after the insertion point up by `count`; mirror that onto
    // the anchors, which stay the authoritative description of the merge. The remap has to run before
    // the re-anchor at the end of this hook, and it cannot be replaced by re-deriving the anchors from
    // the merges: the index mapper emits its cache update *before* this hook, so a re-anchor has
    // already run against a grid whose row count changed while the merges had not been shifted yet,
    // leaving their visual geometry mid-edit.
    const pivot = this.hot.toPhysicalRow(row);

    if (pivot !== null) {
      this.#remapRowAnchorsAfterInsert(pivot, count);
    }

    this.mergedCellsCollection.shiftCollections('down', row, count);

    this.#captureMissingMergeAnchors();
    // `shiftCollections` rebuilt the matrix from every merge, re-adding any currently purged
    // (fully hidden) merge; re-anchor to drop those stale footprints again, and to overwrite the
    // geometry the shift derived from the mid-edit coordinates with one derived from the anchors.
    this.#reanchorMergesToVisibleRows();
  };

  /**
   * `afterRemoveRow` hook callback.
   *
   * @param {number} row Row index.
   * @param {number} count Number of removed rows.
   * @param {number[]} physicalRows Physical indexes of the removed rows.
   */
  #onAfterRemoveRow = (row: number, count: number, physicalRows: number[]) => {
    // Removing renumbers each surviving physical row down by how many removed rows sat above it;
    // mirror that onto the anchors, which stay the authoritative description of the merge. The remap
    // runs before the shift so the shift can ask the updated anchors whether a merge it wants to drop
    // still owns rows: while rows inside a merge are trimmed the merge occupies fewer visual rows than
    // it owns, so removing all of its visible rows must not take the trimmed ones with it.
    const remapped = Array.isArray(physicalRows);

    if (remapped) {
      this.#remapRowAnchorsAfterRemove(physicalRows);
    }

    this.mergedCellsCollection.shiftCollections('up', row, count, (mergedCell) => {
      if (!remapped) {
        return true;
      }

      const anchor = this.#mergeAnchors.get(mergedCell);

      return !anchor || anchor.physicalRows.length === 0;
    });

    this.#captureMissingMergeAnchors();
    // `shiftCollections` rebuilt the matrix from every merge, re-adding any currently purged
    // (fully hidden) merge; re-anchor to drop those stale footprints again, and to overwrite the
    // geometry the shift derived from the mid-edit coordinates with one derived from the anchors.
    this.#reanchorMergesToVisibleRows();
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

    this.#transferAnchorsAfterAxisMove(
      this.mergedCellsCollection.translateAfterAxisMove('column', snapshot), 'column');
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

    const snapshot = this.mergedCellsCollection.capturePhysicalSpans('row');

    // `capturePhysicalSpans` walks the merge's visual rows, which while trimming is active cover only
    // the visible part of it. Take the rows from the anchors instead, so the move translates every row
    // the merge owns. A trimmed row has no visual index, so it drops out of the translation and the
    // visual runs it produces are the same either way.
    snapshot.forEach((unusedPhysicalRows, merge) => {
      const anchor = this.#mergeAnchors.get(merge);

      if (anchor) {
        snapshot.set(merge, [...anchor.physicalRows]);
      }
    });

    this.#rowMoveSnapshot = snapshot;
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

    this.#transferAnchorsAfterAxisMove(
      this.mergedCellsCollection.translateAfterAxisMove('row', snapshot), 'row');
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

    this.#transferAnchorsAfterAxisMove(
      this.mergedCellsCollection.translateAfterAxisMove('column', snapshot), 'column');
    this.#captureMergeAnchors();
    this.hot.render();
  };

  /**
   * Forgets everything remembered about the paste currently being processed.
   */
  #resetPasteState() {
    this.#isSingleCellPaste = false;
    this.#pasteUnmergeSnapshot = [];
  }

  /**
   * `beforePaste` hook callback. Records whether the clipboard holds a single cell, which decides
   * whether the merge the paste lands on is kept or dropped. `onPaste` has already squared the
   * clipboard off with `padRowsToWidest`, so the first row's length is the block's width.
   *
   * @param {Array} pastedData The clipboard contents as a 2D array.
   */
  #onBeforePaste = (pastedData: unknown[][]) => {
    this.#isSingleCellPaste = pastedData?.length === 1 && pastedData[0]?.length === 1;
  };

  /**
   * `beforeChange` hook callback. Decides what a paste does to the merges it covers, while the
   * values are still on their way in.
   *
   * A multi-cell clipboard cannot fit inside a merge, so every merge the write touches is recorded
   * here and dropped in `afterChange` once the data has landed. Recording it before the write is
   * what lets the UndoRedo plugin capture the geometry - see `getPasteUnmergeSnapshot`.
   *
   * A single-cell clipboard leaves the merge alone. That needs an intervention of its own, because
   * a selection touching a merge is expanded to the merge's whole rectangle and the CopyPaste
   * plugin then tiles the clipboard across it - so one pasted value arrives as one change per
   * covered cell. Every change addressing a covered cell is discarded, leaving only the merge's
   * top-left cell to be written.
   *
   * The snapshot survives until the paste's own `afterChange` consumes it, and nothing else may
   * clear it. `afterChange` is NOT reliably the next thing to run: as soon as any pasted cell
   * carries a validator - which `type: 'numeric'`, `type: 'date'`, `dropdown` and `autocomplete`
   * all install - `validateChanges` defers `applyChanges` to a microtask, so `afterPaste` fires
   * first and a validator writing a correction can even open a nested `beforeChange` in between.
   * Clearing the snapshot from either of those made this whole fix inert on a validated column.
   *
   * @param {Array} changes The changes array. Mutated in place to discard changes.
   * @param {string} source Determines the source of the change.
   */
  #onBeforeChange = (changes: (CellChange | null)[], source: string) => {
    if (source !== 'CopyPaste.paste' || !Array.isArray(changes) || changes.length === 0) {
      return;
    }

    if (this.#isSingleCellPaste) {
      this.#pasteUnmergeSnapshot = [];
      this.#discardChangesOnCoveredCells(changes);

      return;
    }

    this.#pasteUnmergeSnapshot = this.#collectMergesFromChanges(changes);
  };

  /**
   * Resolves one change entry to the merge area it writes into, or `false` when it writes into
   * none. Entries another `beforeChange` listener nulled out address no cell and resolve to
   * `false`.
   *
   * @param {Array} change One `[row, prop, ...]` change entry, or `null`.
   * @returns {MergedCellCoords|false} The merge area covering the change, or `false`.
   */
  #mergeAtChange(change: CellChange | null) {
    if (!Array.isArray(change)) {
      return false;
    }

    const [row, prop] = change;
    // A `columns[].data` accessor function reaches `prop` as the function itself, which
    // `propToCol` cannot resolve. Core normalizes the change tuple the same way at every read
    // site (`core.ts` `processChanges`, `applyChanges`).
    const column = this.hot.propToCol(prop as string | number);

    return this.mergedCellsCollection.get(row, column);
  }

  /**
   * Collects every merge area that a set of changes actually writes into.
   *
   * Each change is resolved individually rather than through the rectangle they span, because a
   * merge can sit inside that rectangle and still receive nothing: `populateFromArray` drops the
   * change for every cell that is `readOnly`, `skipRowOnPaste` or `skipColumnOnPaste`, so a merge
   * covering only such cells would be dropped with no value written into it. Resolving per change
   * still catches a merge that the write only clips, because `MergedCellsCollection#get` matches
   * from any covered cell and not just the top-left one.
   *
   * @param {Array} changes The changes array.
   * @returns {Array} Array of `{ row, col, rowspan, colspan }` objects.
   */
  #collectMergesFromChanges(changes: (CellChange | null)[]): MergeAreaGeometry[] {
    const found = new Map<MergedCellCoords, MergeAreaGeometry>();

    changes.forEach((change) => {
      const mergedCell = this.#mergeAtChange(change);

      if (mergedCell !== false && !found.has(mergedCell)) {
        const { row, col, rowspan, colspan } = mergedCell;

        found.set(mergedCell, { row, col, rowspan, colspan });
      }
    });

    return [...found.values()];
  }

  /**
   * Discards every change addressing a cell that a merge covers but does not anchor, by nulling it
   * out in place. Nulling an entry is the documented way for a `beforeChange` listener to drop a
   * change: the value is never written and the UndoRedo plugin filters the entry out too, so no
   * phantom undo step is recorded either.
   *
   * @param {Array} changes The changes array, mutated in place.
   */
  #discardChangesOnCoveredCells(changes: (CellChange | null)[]) {
    changes.forEach((change, index) => {
      const mergedCell = this.#mergeAtChange(change);

      if (mergedCell === false) {
        return;
      }

      const [row, prop] = change as CellChange;

      if (mergedCell.row !== row || mergedCell.col !== this.hot.propToCol(prop as string | number)) {
        changes[index] = null;
      }
    });
  }

  /**
   * `afterChange` hook callback. Propagates merged cells after an autofill, and drops the merges a
   * paste has overwritten.
   *
   * @param {Array} changes The changes array.
   * @param {string} source Determines the source of the change.
   */
  #onAfterChange = (changes: CellChange[], source: string) => {
    if (source === 'Autofill.fill') {
      this.autofillCalculations.recreateAfterDataPopulation(changes);

      return;
    }

    if (source === 'CopyPaste.paste') {
      this.#unmergeAfterPaste();
    }
  };

  /**
   * Drops the merges that this plugin's `beforeChange` listener recorded for the paste that has
   * just landed, so the pasted values stop being covered and start rendering.
   *
   * Each merge is unmerged through its own range rather than the written rectangle, because
   * `unmergeRange` matches by a merge's top-left corner and the written rectangle need not contain
   * it. `auto` is on: the geometry is already known-good, and the undo entry for this is carried by
   * the paste's own data-change action instead.
   */
  #unmergeAfterPaste() {
    const snapshot = this.#pasteUnmergeSnapshot;

    this.#pasteUnmergeSnapshot = [];

    if (snapshot.length === 0) {
      return;
    }

    // `unmergeRange` renders on its own, so a multi-merge paste would otherwise redraw once per
    // merge. `batchRender` cannot be used: it has no `try`/`finally`, and `unmergeRange` runs the
    // `beforeUnmergeCells`/`afterUnmergeCells` hooks whether `auto` is set or not (`auto` is only
    // forwarded to them). `runHooks` does not catch, so one throwing listener would skip
    // `resumeRender()` and the grid would never draw again.
    this.hot.suspendRender();

    try {
      snapshot.forEach((mergeArea) => {
        this.unmergeRange(toMergeAreaRange(this.hot, mergeArea), true);
      });
    } finally {
      this.hot.resumeRender();
    }
  }

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
   * Opts the table out of single-pass rendering while merged cells are present. A virtualized merged
   * cell's height depends on which rows are in the viewport — the very thing the predicted layout is
   * trying to compute — so merge tables keep the legacy measure-then-render path.
   *
   * @returns {boolean}
   */
  #onModifySinglePassLayout = () => false;

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
