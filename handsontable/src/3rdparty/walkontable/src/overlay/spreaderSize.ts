import type { EngineContext } from '../wire';
import { getFirstRowBorderCompensation } from '../axisSizing/boxModel';

/**
 * Assembles the SpreaderSize's dependencies from the engine composition context.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The SpreaderSize dependency set.
 */
export function createSpreaderSizeDeps(ctx: EngineContext) {
  return {
    wtSettings: ctx.wtSettings,
    geometryReader: ctx.geometryReader,
    wtTable: ctx.getWtTable(),
    getWtViewport: ctx.getWtViewport,
    getTopOverlay: ctx.getTopOverlay,
    getInlineStartOverlay: ctx.getInlineStartOverlay,
    getBottomOverlay: ctx.getBottomOverlay,
  };
}

/**
 * The SpreaderSize dependencies, inferred from `createSpreaderSizeDeps`.
 */
export type SpreaderSizeDeps = ReturnType<typeof createSpreaderSizeDeps>;

/**
 * Owns the master hider/spreader sizing math: it computes the hider's width/height from the summed
 * cell sizes (plus the header sizes and the first-row border compensation), writes them to the DOM,
 * and then delegates to the top/inline-start/bottom overlays to size their own elements. It also
 * caches the last measured spreader size so the coordinator can skip a redundant resize when nothing
 * changed.
 *
 * Extracted from the Overlays coordinator so the sizing lifecycle is self-contained; the coordinator
 * keeps thin public `adjustElementsSize`/`updateLastSpreaderSize` delegates because those are part of
 * the public overlay API.
 *
 * @class SpreaderSize
 */
export class SpreaderSize {
  /**
   * The SpreaderSize dependencies.
   *
   * @type {SpreaderSizeDeps}
   */
  readonly #deps: SpreaderSizeDeps;

  /**
   * The last cached spreader size, used to detect whether a resize is needed.
   *
   * @type {{ width: number | null, height: number | null }}
   */
  #lastSize: { width: number | null; height: number | null } = { width: null, height: null };

  /**
   * @param {SpreaderSizeDeps} deps The SpreaderSize dependencies.
   */
  constructor(deps: SpreaderSizeDeps) {
    this.#deps = deps;
  }

  /**
   * Update the last cached spreader size with the current size.
   *
   * @returns {boolean} `true` if the lastSize cache was updated, `false` otherwise.
   */
  updateLastSpreaderSize() {
    const spreader = this.#deps.wtTable.spreader;
    const { geometryReader } = this.#deps;
    const width = geometryReader.clientWidth(spreader);
    const height = geometryReader.clientHeight(spreader);
    const needsUpdating = width !== this.#lastSize.width || height !== this.#lastSize.height;

    if (needsUpdating) {
      this.#lastSize.width = width;
      this.#lastSize.height = height;
    }

    return needsUpdating;
  }

  /**
   * Adjust overlays elements size and master table size.
   */
  adjustElementsSize() {
    const { wtSettings } = this.#deps;
    const wtViewport = this.#deps.getWtViewport();
    const { wtTable } = this.#deps;
    const topOverlay = this.#deps.getTopOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const bottomOverlay = this.#deps.getBottomOverlay();
    const totalColumns = wtSettings.getSetting<number>('totalColumns');
    const totalRows = wtSettings.getSetting<number>('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    // `sumCellSizes` reports every row at its logical height, and the FIRST rendered body row renders
    // 1px taller when it draws its own `border-top`. The rule lives in `axisSizing/boxModel` so this
    // write and `gatherLayoutInput`'s scrollbar prediction cannot drift.
    const hiderHeightComp = getFirstRowBorderCompensation(
      wtSettings.getSetting<boolean>('externalRowCalculator'),
      (wtSettings.getSetting('columnHeaders') as unknown[]).length > 0
    );
    const proposedHiderHeight = headerColumnSize + topOverlay.sumCellSizes(0, totalRows) + hiderHeightComp;
    const proposedHiderWidth = headerRowSize + inlineStartOverlay.sumCellSizes(0, totalColumns);
    const hiderElement = wtTable.hider;
    const hiderStyle = hiderElement.style;

    // Neither dimension takes a scroll-position compensation any more. The row header carries its
    // inline-end border at every scroll position (#6673) and the column header its bottom border
    // (DEV-2786), so neither total changes by scrolling — the `innerBorderTop` compensation that used
    // to be added here once the table was scrolled to its very end
    // (https://github.com/handsontable/dev-handsontable/issues/1772) has nothing left to correct.
    hiderStyle.width = `${proposedHiderWidth}px`;
    hiderStyle.height = `${proposedHiderHeight}px`;

    topOverlay.adjustElementsSize();
    inlineStartOverlay.adjustElementsSize();
    bottomOverlay.adjustElementsSize();
  }
}
