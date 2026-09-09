import { getHiderHeightCompensation, addContentHeightSlack } from '../axisSizing/hiderCompensation';
import type { EngineContext } from '../wire';
import type { default as Overlays } from './overlays';

/**
 * Assembles the SpreaderSize's dependencies. Most come from the engine composition context; the
 * scrollable element is resolved through the owning Overlays instance (it is computed there and can
 * change on `updateSettings`), so it is read via a thunk rather than captured.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @param {Overlays} overlays The owning Overlays coordinator.
 * @returns {object} The SpreaderSize dependency set.
 */
export function createSpreaderSizeDeps(ctx: EngineContext, overlays: Overlays) {
  return {
    wtSettings: ctx.wtSettings,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    wtTable: ctx.getWtTable(),
    getWtViewport: ctx.getWtViewport,
    getTopOverlay: ctx.getTopOverlay,
    getInlineStartOverlay: ctx.getInlineStartOverlay,
    getBottomOverlay: ctx.getBottomOverlay,
    getScrollableElement: () => overlays.scrollableElement,
  };
}

/**
 * The SpreaderSize dependencies, inferred from `createSpreaderSizeDeps`.
 */
export type SpreaderSizeDeps = ReturnType<typeof createSpreaderSizeDeps>;

/**
 * Owns the master hider/spreader sizing math: it computes the hider's width/height from the summed
 * cell sizes (plus the header sizes and the border compensations), writes them to the DOM, and then
 * delegates to the top/inline-start/bottom overlays to size their own elements. It also caches the
 * last measured spreader size so the coordinator can skip a redundant resize when nothing changed.
 *
 * Extracted from the Overlays coordinator so the sizing lifecycle is self-contained; the coordinator
 * keeps thin public `adjustElementsSize`/`updateLastSpreaderSize`/`expandHider*` delegates because
 * those are part of the public overlay API.
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
    const { wtSettings, rootWindow, geometryReader } = this.#deps;
    const wtViewport = this.#deps.getWtViewport();
    const { wtTable } = this.#deps;
    const topOverlay = this.#deps.getTopOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const scrollableElement = this.#deps.getScrollableElement();
    const isWindowScrolled = scrollableElement === rootWindow;
    const totalColumns = wtSettings.getSetting<number>('totalColumns');
    const totalRows = wtSettings.getSetting<number>('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    // The internal row height calculator contains a known issue that results in a 1px miscalculation.
    // Ideally, this should be addressed at the core level. However, resolving it is non-trivial,
    // as the flaw is embedded across multiple core modules and corresponding test cases.
    // This limitation does not affect when the external calculator is used (AutoRowSize), which
    // computes heights accurately, so no adjustment is required when using it.
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
    const isScrolledBeyondHiderHeight = () => {
      if (isWindowScrolled || !(scrollableElement instanceof HTMLElement)) {
        return false;
      }

      return scrollableElement.scrollTop >
        Math.max(0, summedHiderHeight - geometryReader.clientHeight(wtTable.holder));
    };
    const columnHeaderBorderCompensation = isScrolledBeyondHiderHeight() ? 1 : 0;
    // The slack goes on last, over the scroll compensation too, so the height that actually reaches
    // the DOM is the one that carries it. The scroll test above reads the plain sum on purpose: it
    // asks how far this element can scroll, which is the content total, not the written height.
    const proposedHiderHeight = addContentHeightSlack(
      summedHiderHeight + columnHeaderBorderCompensation
    );

    return { width: proposedHiderWidth, height: proposedHiderHeight };
  }

  /**
   * Adjust overlays elements size and master table size.
   */
  adjustElementsSize() {
    const { wtTable } = this.#deps;
    const { width, height } = this.getProposedHiderSize();
    const hiderStyle = wtTable.hider.style;

    // If the elements are being adjusted after scrolling the table from the very beginning to the very end,
    // we need to adjust the hider height by the column header border size.
    // (https://github.com/handsontable/dev-handsontable/issues/1772)
    // The width needs no such compensation: the row header carries its inline-end border at every
    // scroll position, so the horizontal total never changes by scrolling (#6673).
    hiderStyle.width = `${width}px`;
    hiderStyle.height = `${height}px`;

    this.#deps.getTopOverlay().adjustElementsSize();
    this.#deps.getInlineStartOverlay().adjustElementsSize();
    this.#deps.getBottomOverlay().adjustElementsSize();
  }

  /**
   * Expand the hider vertically element by the provided delta value.
   *
   * @param {number} heightDelta The delta value to expand the hider element by.
   */
  expandHiderVerticallyBy(heightDelta: number) {
    const { hider } = this.#deps.wtTable;

    // `parseFloat`, not `parseInt`: below 100% zoom the height written above is fractional
    // (e.g. "1209.1px"), and truncating it here would hand back the sub-pixel shortfall that
    // `adjustElementsSize` just corrected.
    hider.style.height = `${parseFloat(hider.style.height) + heightDelta}px`;
  }
}
