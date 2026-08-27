import type { default as MetaManagerInstance } from '..';
import type { HotInstance } from '../../../core/types';
import type { CellProperties } from '../../../settings';
import { Hooks } from '../../../core/hooks';
import { hasOwnProperty, extend } from '../../../helpers/object';
import { isFunction } from '../../../helpers/function';
import { extendByMetaType, normalizeEditorSetting } from '../utils';

/**
 * @class DynamicCellMetaMod
 *
 * The `DynamicCellMetaMod` modifier allows for extending cell meta objects
 * (returned by `getCellMeta()` from `MetaManager`)
 * by user-specific properties.
 *
 * The user-specific properties can be added and changed dynamically,
 * either by Handsontable's hooks (`beforeGetCellMeta` and`afterGetCellMeta`),
 * or by Handsontable's `cells` option.
 *
 * The `getCellMeta()` method is used widely throughout the source code.
 * To boost the method's execution time,
 * the logic is triggered only once per one Handsontable slow render cycle.
 */
type MetaManagerWithHot = MetaManagerInstance & {
  hot: HotInstance;
  updateCellMeta: (...args: unknown[]) => void;
  [key: string]: unknown;
};

/**
 * Modifier that extends cell meta objects dynamically through Handsontable hooks and the `cells` option,
 * memoizing results per render cycle to avoid redundant work.
 */
export class DynamicCellMetaMod {
  /**
   * @type {MetaManager}
   */
  declare metaManager: MetaManagerWithHot;
  /**
   * Per-render-cycle memo of cells already extended by `extendCellMeta`, keyed by physical row to a
   * set of physical columns.
   *
   * @type {Map<number, Set<number>>}
   */
  metaSyncMemo = new Map<number, Set<number>>();
  /**
   * The lowest visual row index of the meta "keep band" tracked by the previous eviction pass - the
   * viewport plus a one-viewport hysteresis margin. The next pass evicts the visual rows that fall
   * between this band and the new one (the rows that just scrolled out), so the work is proportional
   * to the scroll distance, not the number of materialized rows.
   *
   * @type {number}
   */
  #keepBandStart = 0;
  /**
   * The highest visual row index of the meta "keep band". See `#keepBandStart`.
   *
   * @type {number}
   */
  #keepBandEnd = 0;
  /**
   * Whether a keep band has been recorded yet. A separate flag (rather than a sentinel value) is
   * required because a valid `#keepBandStart` is often negative near the top of the grid (the
   * viewport start minus the hysteresis margin), so no numeric sentinel is safe.
   *
   * @type {boolean}
   */
  #keepBandInitialized = false;

  /**
   * Initializes the modifier, registers the `afterGetCellMeta` local hook, subscribes to `beforeRender`
   * to clear the memo on full renders, and subscribes to `afterScrollVertically` and `afterViewRender`
   * to evict render-derived cell meta for rows that left the viewport.
   */
  constructor(metaManager: MetaManagerWithHot) {
    this.metaManager = metaManager;

    metaManager.addLocalHook('afterGetCellMeta', (cellMeta) => {
      this.extendCellMeta(cellMeta);
    });

    metaManager.addLocalHook('extendTransientCellMeta', (cellMeta) => {
      this.extendTransientCellMeta(cellMeta);
    });

    // These hooks are registered through `Hooks.getSingleton().add(..., hot)` rather than
    // `hot.addHook(...)` on purpose: this modifier is constructed from the `MetaManager`
    // constructor, which runs early in `Core` setup - before `hot.addHook` is defined. The
    // singleton form binds the callback to the `hot` instance and is cleaned up on `hot.destroy()`
    // exactly like `hot.addHook` would be, so this is equivalent once the instance is ready.
    Hooks.getSingleton().add('beforeRender', (forceFullRender: unknown) => {
      if (forceFullRender) {
        this.metaSyncMemo.clear();
      }
    }, this.metaManager.hot);

    const evict = () => this.#evictMetaOutsideViewport();

    // Scrolling materializes cell meta for newly visible rows; evict the rows that left the viewport.
    Hooks.getSingleton().add('afterScrollVertically', evict, this.metaManager.hot);
    // A full render (for example after a sort or filter) can leave behind meta for rows that are no
    // longer in view; run the same pass so retention stays bounded regardless of what triggered it.
    Hooks.getSingleton().add('afterViewRender', evict, this.metaManager.hot);
  }

  /**
   * Extends the cell meta object by user-specific properties.
   *
   * The cell meta object can be extended dynamically,
   * either by Handsontable's hooks (`beforeGetCellMeta` and`afterGetCellMeta`),
   * or by Handsontable's `cells` option.
   *
   * To boost performance, the extending process is triggered only once per one slow Handsontable render cycle.
   *
   * @param {object} cellMeta The cell meta object.
   */
  extendCellMeta(cellMeta: CellProperties) {
    const physicalRow = cellMeta.row;
    const physicalColumn = cellMeta.col;

    if (this.metaSyncMemo.get(physicalRow)?.has(physicalColumn)) {
      return;
    }

    this.#runMetaExtension(cellMeta, (cellSettings) => {
      this.metaManager.updateCellMeta(physicalRow, physicalColumn, cellSettings);
    });

    let memoRow = this.metaSyncMemo.get(physicalRow);

    if (memoRow === undefined) {
      memoRow = new Set();
      this.metaSyncMemo.set(physicalRow, memoRow);
    }

    memoRow.add(physicalColumn);
  }

  /**
   * Extends a transient (not stored) cell meta object by the same user-specific properties as
   * `extendCellMeta`, with two deliberate differences. The `cells`/`type` settings are applied
   * directly on the transient object - never through `updateCellMeta`, which would permanently
   * materialize the cell. And `metaSyncMemo` is neither read nor written: the memo must reflect only
   * STORED meta objects, or a stored cell created later would skip its extension (a rendering bug),
   * and memo growth would defeat the point of a retention-free scan.
   *
   * @param {object} cellMeta The transient cell meta object.
   */
  extendTransientCellMeta(cellMeta: Record<string, unknown>) {
    this.#runMetaExtension(cellMeta, (cellSettings) => {
      extend(cellMeta, cellSettings);
      extendByMetaType(cellMeta, cellSettings);
    });
  }

  /**
   * Runs the dynamic-extension sequence on a cell meta object: resolves `prop`, fires
   * `beforeGetCellMeta`, evaluates the `cells` function and the `type` value it (or the hook)
   * produced, hands the resulting settings to the caller-provided applier, and fires
   * `afterGetCellMeta`. The applier is the only step that differs between the stored path
   * (persist through `updateCellMeta`) and the transient path (extend the throwaway object).
   *
   * @param {object} cellMeta The cell meta object to extend.
   * @param {Function} applyCellSettings Receives the resolved `cells`/`type` settings object.
   */
  #runMetaExtension(cellMeta: Record<string, unknown>, applyCellSettings: (settings: Record<string, unknown>) => void) {
    const physicalRow = cellMeta.row as number;
    const physicalColumn = cellMeta.col as number;
    const visualRow = cellMeta.visualRow as number;
    const visualCol = cellMeta.visualCol as number;
    const hot = this.metaManager.hot;
    const prop = hot.colToProp(visualCol);

    cellMeta.prop = prop;

    hot.runHooks('beforeGetCellMeta', visualRow, visualCol, cellMeta);

    // extend a `type` value, added or changed in the `beforeGetCellMeta` hook
    const cellType = hasOwnProperty(cellMeta, 'type') ? cellMeta.type : null;
    let cellSettings = isFunction(cellMeta.cells)
      ? cellMeta.cells(physicalRow, physicalColumn, prop) as Record<string, unknown> | null
      : null;

    if (cellType) {
      if (cellSettings) {
        cellSettings.type = cellSettings.type ?? cellType;
      } else {
        cellSettings = {
          type: cellType,
        };
      }
    }

    if (cellSettings) {
      applyCellSettings(normalizeEditorSetting(cellSettings));
    }

    hot.runHooks('afterGetCellMeta', visualRow, visualCol, cellMeta);
  }

  /**
   * Evicts render-derived cell meta for rows that scrolled out of the viewport, bounding meta
   * retention to roughly the visible rows plus a one-viewport hysteresis margin on each side ("keep
   * band"). Only the visual rows that fall between the previous keep band and the new one are visited
   * (the rows that just left), so the cost is proportional to the scroll distance, NOT to the number
   * of materialized rows - a grid with many `setCellMeta`/`cell`-option rows pays nothing extra here.
   * The band is tracked in visual space and never reset, so a full render that does not move the
   * viewport produces an empty diff (no work). Row-axis only - the vertical axis is the large one;
   * horizontal scrolling does not evict.
   */
  #evictMetaOutsideViewport() {
    const hot = this.metaManager.hot;
    const firstVisibleRow = hot.getFirstRenderedVisibleRow();
    const lastVisibleRow = hot.getLastRenderedVisibleRow();

    // The render-range getters are typed `number` but return `null` when the viewport is not yet
    // calculated; `Number.isInteger` rejects that case without a type-level null comparison.
    if (!Number.isInteger(firstVisibleRow) || !Number.isInteger(lastVisibleRow) ||
        lastVisibleRow < firstVisibleRow) {
      return;
    }

    const viewportSize = (lastVisibleRow - firstVisibleRow) + 1;
    const keepStart = firstVisibleRow - viewportSize;
    const keepEnd = lastVisibleRow + viewportSize;
    const previousStart = this.#keepBandStart;
    const previousEnd = this.#keepBandEnd;

    if (this.#keepBandInitialized) {
      // Previously-kept rows now above the band (visual index below the new keep-band start).
      this.#evictVisualRowRange(previousStart, Math.min(previousEnd, keepStart - 1));
      // Previously-kept rows now below the band (visual index above the new keep-band end).
      this.#evictVisualRowRange(Math.max(previousStart, keepEnd + 1), previousEnd);
    }

    this.#keepBandStart = keepStart;
    this.#keepBandEnd = keepEnd;
    this.#keepBandInitialized = true;
  }

  /**
   * Evicts render-derived cell meta for an inclusive range of visual rows. Each visual row is
   * translated to its physical index (cell meta is keyed physically) reading the mapping fresh, so a
   * sort or move that happened since the band was recorded resolves correctly. Only the active
   * editor's row is skipped - the selection highlight (focus) cell, where the prepared or active
   * editor holds the cell meta object by reference (see `BaseEditor#cellProperties`). The remaining
   * rows of a wide selection (whole column, multi-row) must stay evictable, or they would pin their
   * cell meta and defeat the viewport bound.
   *
   * @param {number} fromVisualRow The first visual row index in the range (inclusive).
   * @param {number} toVisualRow The last visual row index in the range (inclusive).
   */
  #evictVisualRowRange(fromVisualRow: number, toVisualRow: number) {
    if (fromVisualRow > toVisualRow) {
      return;
    }

    const hot = this.metaManager.hot;
    const selectedRange = hot.getSelectedRangeLast();
    const activeEditorRow = selectedRange ? selectedRange.highlight.row : null;

    for (let visualRow = fromVisualRow; visualRow <= toVisualRow; visualRow++) {
      const physicalRow = hot.toPhysicalRow(visualRow);

      // `toPhysicalRow` is typed `number` but returns `null` for an out-of-range visual row (for
      // example after trimming); `Number.isInteger` filters that without a type-level null compare.
      if (visualRow !== activeEditorRow && Number.isInteger(physicalRow)) {
        this.#evictRowAndPruneMemo(physicalRow);
      }
    }
  }

  /**
   * Evicts the render-derived cell meta of a single physical row and prunes the matching
   * `metaSyncMemo` entries for ONLY the columns that were actually evicted. A re-minted cell then
   * re-runs its dynamic extension, while persisted/invalid cells kept on the same row retain their
   * memo - so they are not needlessly re-extended (which could let a `cells()` result overwrite a
   * `setCellMeta` value). The whole memo row is dropped once empty, keeping the memo bounded.
   *
   * @param {number} physicalRow The physical row index to evict.
   */
  #evictRowAndPruneMemo(physicalRow: number) {
    const evictedColumns = this.metaManager.cellMeta.evictRow(physicalRow);

    if (evictedColumns.length === 0) {
      return;
    }

    const memoRow = this.metaSyncMemo.get(physicalRow);

    if (memoRow === undefined) {
      return;
    }

    for (let i = 0; i < evictedColumns.length; i++) {
      memoRow.delete(evictedColumns[i]);
    }

    if (memoRow.size === 0) {
      this.metaSyncMemo.delete(physicalRow);
    }
  }
}
