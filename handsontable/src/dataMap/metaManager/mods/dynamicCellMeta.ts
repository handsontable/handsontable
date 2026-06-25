import type { default as MetaManagerInstance } from '..';
import type { HotInstance } from '../../../core/types';
import { Hooks } from '../../../core/hooks';
import { hasOwnProperty } from '../../../helpers/object';
import { isFunction } from '../../../helpers/function';

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
  addLocalHook: (hookName: string, callback: (...args: unknown[]) => void) => void;
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
   * @type {Map}
   */
  metaSyncMemo = new Map();
  /**
   * The lowest visual row index of the meta "keep band" tracked by the previous eviction pass - the
   * viewport plus a one-viewport hysteresis margin. The next pass evicts the visual rows that fall
   * between this band and the new one (the rows that just scrolled out), so the work is proportional
   * to the scroll distance, not the number of materialized rows. `-1` means no band yet.
   *
   * @type {number}
   */
  #keepBandStart = -1;
  /**
   * The highest visual row index of the meta "keep band". See `#keepBandStart`.
   *
   * @type {number}
   */
  #keepBandEnd = -1;

  /**
   * Initializes the modifier, registers the `afterGetCellMeta` local hook, subscribes to `beforeRender`
   * to clear the memo on full renders, and subscribes to `afterScrollVertically` and `afterViewRender`
   * to evict render-derived cell meta for rows that left the viewport.
   */
  constructor(metaManager: MetaManagerWithHot) {
    this.metaManager = metaManager;

    metaManager.addLocalHook('afterGetCellMeta', (...args: unknown[]) => {
      this.extendCellMeta(args[0] as Record<string, unknown>);
    });

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
  extendCellMeta(cellMeta: Record<string, unknown>) {
    const physicalRow = cellMeta.row as number;
    const physicalColumn = cellMeta.col as number;

    if (this.metaSyncMemo.get(physicalRow)?.has(physicalColumn)) {
      return;
    }

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
      this.metaManager.updateCellMeta(physicalRow, physicalColumn, cellSettings);
    }

    hot.runHooks('afterGetCellMeta', visualRow, visualCol, cellMeta);

    if (!this.metaSyncMemo.has(physicalRow)) {
      this.metaSyncMemo.set(physicalRow, new Set());
    }

    this.metaSyncMemo.get(physicalRow).add(physicalColumn);
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

    if (previousStart !== -1) {
      // Visual rows that dropped below the new keep band.
      this.#evictVisualRowRange(previousStart, Math.min(previousEnd, keepStart - 1));
      // Visual rows that rose above the new keep band.
      this.#evictVisualRowRange(Math.max(previousStart, keepEnd + 1), previousEnd);
    }

    this.#keepBandStart = keepStart;
    this.#keepBandEnd = keepEnd;
  }

  /**
   * Evicts render-derived cell meta for an inclusive range of visual rows. Each visual row is
   * translated to its physical index (cell meta is keyed physically) reading the mapping fresh, so a
   * sort or move that happened since the band was recorded resolves correctly. The currently selected
   * rows are skipped: the prepared or active editor holds the selected cell's meta object by reference
   * (see `BaseEditor#cellProperties`), so evicting it could strand the editor. The matching
   * `metaSyncMemo` entry is cleared so the dynamic extension re-runs when the row is rendered again.
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
    let selectionRowStart = -1;
    let selectionRowEnd = -1;

    // `CellCoords.row` is `null` for header-only selections; skip the row guard in that case.
    if (selectedRange && selectedRange.from.row !== null && selectedRange.to.row !== null) {
      selectionRowStart = Math.min(selectedRange.from.row, selectedRange.to.row);
      selectionRowEnd = Math.max(selectedRange.from.row, selectedRange.to.row);
    }

    for (let visualRow = fromVisualRow; visualRow <= toVisualRow; visualRow++) {
      const isSelected = visualRow >= selectionRowStart && visualRow <= selectionRowEnd;

      if (!isSelected) {
        const physicalRow = hot.toPhysicalRow(visualRow);

        // `toPhysicalRow` is typed `number` but returns `null` for an out-of-range visual row (for
        // example after trimming); `Number.isInteger` filters that without a type-level null compare.
        if (Number.isInteger(physicalRow)) {
          this.metaManager.cellMeta.evictRow(physicalRow);
          this.metaSyncMemo.delete(physicalRow);
        }
      }
    }
  }
}
