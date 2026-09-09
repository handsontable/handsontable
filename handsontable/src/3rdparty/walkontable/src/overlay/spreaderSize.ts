import { getHiderHeightCompensation, addContentHeightSlack } from '../axisSizing/hiderCompensation';
import type { EngineContext } from '../wire';

/**
 * Assembles the SpreaderSize's dependencies from the engine composition context.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The SpreaderSize dependency set.
 */
export function createSpreaderSizeDeps(ctx: EngineContext) {
  return {
    wtSettings: ctx.wtSettings,
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
 * and then delegates to the top/inline-start/bottom overlays to size their own elements.
 *
 * Extracted from the Overlays coordinator so the sizing lifecycle is self-contained; the coordinator
 * keeps a thin public `adjustElementsSize` delegate because that is part of the public overlay API.
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
   * @param {SpreaderSizeDeps} deps The SpreaderSize dependencies.
   */
  constructor(deps: SpreaderSizeDeps) {
    this.#deps = deps;
  }

  /**
   * Computes the width and height the hider element must take, without writing anything.
   *
   * Split out of {@link SpreaderSize#adjustElementsSize} so the change-detection gate in
   * `Overlays` can ask "would this write differ from the last one?" against the very numbers the
   * write uses. A gate built on a separate approximation of these values can disagree with the
   * writer, and every such disagreement is either a missed resize (overlays drift out of step) or
   * a wasted one.
   *
   * @returns {{ width: number, height: number }} The hider size in pixels.
   */
  getProposedHiderSize(): { width: number; height: number } {
    const { wtSettings } = this.#deps;
    const wtViewport = this.#deps.getWtViewport();
    const topOverlay = this.#deps.getTopOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const totalColumns = wtSettings.getSetting<number>('totalColumns');
    const totalRows = wtSettings.getSetting<number>('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    // `sumCellSizes` reports every row at its logical height, and the internal row-height calculator
    // is short by one cell bottom border, which `getHiderHeightCompensation` folds back in (0 when
    // AutoRowSize supplies exact heights, and 0 when a column header is rendered - since DEV-2786 the
    // header owns that gridline and no body row draws it).
    //
    // Both terms carry their sub-pixel part: `getColumnHeaderHeight()` is an integer the calculators
    // depend on, and the compensation is a real border the browser widens below 100% zoom. Dropping
    // either left the hider short of the table it holds and the browser drew a scrollbar on a grid
    // that needs none (DEV-2525). Both are 0 at 100% zoom. `gatherLayoutInput` folds in exactly the
    // same two terms, so the predicted scroll boundary keeps matching what is written here.
    const hiderHeightComp = getHiderHeightCompensation(wtSettings);
    const summedHiderHeight = headerColumnSize + wtViewport.getColumnHeaderHeightFraction() +
      topOverlay.sumCellSizes(0, totalRows) + hiderHeightComp;
    const proposedHiderWidth = headerRowSize + inlineStartOverlay.sumCellSizes(0, totalColumns);

    // Neither dimension takes a SCROLL-POSITION compensation any more. The row header carries its
    // inline-end border at every scroll position (#6673) and the column header its bottom border
    // (DEV-2786), so neither total changes by scrolling - the `innerBorderTop` compensation that used
    // to be added here once the table was scrolled to its very end
    // (https://github.com/handsontable/dev-handsontable/issues/1772) has nothing left to correct, and
    // the `isScrolledBeyondHiderHeight` test that selected it is gone with it.
    //
    // The SUB-PIXEL slack is a different thing and stays: it stops the hider element landing a hair
    // under the table inside it, which is enough for the browser to draw a scrollbar (DEV-2525).
    const proposedHiderHeight = addContentHeightSlack(summedHiderHeight);

    return { width: proposedHiderWidth, height: proposedHiderHeight };
  }

  /**
   * Adjust overlays elements size and master table size.
   *
   * Returns the size it wrote so the caller does not have to recompute it. `getProposedHiderSize()`
   * walks every column, and `Overlays` needs the same two numbers for its change-detection
   * signature - handing them back is what keeps a resizing draw at two walks instead of three.
   *
   * @returns {{ width: number, height: number }} The hider size written, in pixels.
   */
  adjustElementsSize(): { width: number; height: number } {
    const size = this.getProposedHiderSize();
    const hiderStyle = this.#deps.wtTable.hider.style;

    hiderStyle.width = `${size.width}px`;
    hiderStyle.height = `${size.height}px`;

    this.#deps.getTopOverlay().adjustElementsSize();
    this.#deps.getInlineStartOverlay().adjustElementsSize();
    this.#deps.getBottomOverlay().adjustElementsSize();

    return size;
  }
}
