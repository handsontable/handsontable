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
   * Adjust overlays elements size and master table size.
   */
  adjustElementsSize() {
    const { wtSettings, rootWindow, geometryReader } = this.#deps;
    const wtViewport = this.#deps.getWtViewport();
    const { wtTable } = this.#deps;
    const topOverlay = this.#deps.getTopOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const bottomOverlay = this.#deps.getBottomOverlay();
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
    const hiderHeightComp = wtSettings.getSetting('externalRowCalculator') ? 0 : 1;
    const proposedHiderHeight = headerColumnSize + topOverlay.sumCellSizes(0, totalRows) + hiderHeightComp;
    const proposedHiderWidth = headerRowSize + inlineStartOverlay.sumCellSizes(0, totalColumns);
    const hiderElement = wtTable.hider;
    const hiderStyle = hiderElement.style;
    const isScrolledBeyondHiderHeight = () => {
      if (isWindowScrolled || !(scrollableElement instanceof HTMLElement)) {
        return false;
      }

      return scrollableElement.scrollTop >
        Math.max(0, proposedHiderHeight - geometryReader.clientHeight(wtTable.holder));
    };
    const isScrolledBeyondHiderWidth = () => {
      if (isWindowScrolled || !(scrollableElement instanceof HTMLElement)) {
        return false;
      }

      return scrollableElement.scrollLeft >
        Math.max(0, proposedHiderWidth - geometryReader.clientWidth(wtTable.holder));
    };
    const columnHeaderBorderCompensation = isScrolledBeyondHiderHeight() ? 1 : 0;
    const rowHeaderBorderCompensation = isScrolledBeyondHiderWidth() ? 1 : 0;

    // If the elements are being adjusted after scrolling the table from the very beginning to the very end,
    // we need to adjust the hider dimensions by the header border size. (https://github.com/handsontable/dev-handsontable/issues/1772)
    hiderStyle.width = `${proposedHiderWidth + rowHeaderBorderCompensation}px`;
    hiderStyle.height = `${proposedHiderHeight + columnHeaderBorderCompensation}px`;

    topOverlay.adjustElementsSize();
    inlineStartOverlay.adjustElementsSize();
    bottomOverlay.adjustElementsSize();
  }

  /**
   * Expand the hider vertically element by the provided delta value.
   *
   * @param {number} heightDelta The delta value to expand the hider element by.
   */
  expandHiderVerticallyBy(heightDelta: number) {
    const { hider } = this.#deps.wtTable;

    hider.style.height = `${parseInt(hider.style.height, 10) + heightDelta}px`;
  }

  /**
   * Expand the hider horizontally element by the provided delta value.
   *
   * @param {number} widthDelta The delta value to expand the hider element by.
   */
  expandHiderHorizontallyBy(widthDelta: number) {
    const { hider } = this.#deps.wtTable;

    hider.style.width = `${parseInt(hider.style.width, 10) + widthDelta}px`;
  }
}
