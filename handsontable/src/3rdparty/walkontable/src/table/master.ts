import type { DataAccessObject, DomBindings } from '../types';
import type Settings from '../settings';
import {
  getStyle,
  getTrimmingContainer,
  isVisible,
} from './../../../../helpers/dom/element';
import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

/**
 * Cached output values from `alignOverlaysWithTrimmingContainer()`.
 */
interface TrimmingContainerCache {
  holderWidth: string;
  holderHeight: string;
  hasTableHeight: boolean;
  hasTableWidth: boolean;
}

/**
 * Subclass of `Table` that provides the helper methods relevant to the master table (not overlays), implemented through mixins.
 *
 * @mixes calculatedRows
 * @mixes calculatedColumns
 */
class MasterTable extends Table {
  // `null` means a fresh measurement is needed.
  #trimmingCache: TrimmingContainerCache | null = null;
  #trimmingContainerObserver: ResizeObserver | null = null;
  #hiderObserver: ResizeObserver | null = null;
  #observedTrimmingElement: HTMLElement | null = null;

  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(
    dataAccessObject: DataAccessObject, facadeGetter: Function, domBindings: DomBindings, wtSettings: Settings) {
    super(dataAccessObject, facadeGetter, domBindings, wtSettings, 'master');
  }

  alignOverlaysWithTrimmingContainer() {
    // The base-class constructor calls this method before MasterTable's field
    // initializers have run. The brand check detects that case and exits early;
    // the first draw() call (which always follows construction) runs the full path.
    if (!(#trimmingCache in this)) {
      return;
    }

    const trimmingElement = getTrimmingContainer(this.wtRootElement);
    const { rootWindow } = this.domBindings;

    if (!(trimmingElement instanceof HTMLElement)) {
      const preventOverflow = this.wtSettings.getSetting('preventOverflow');

      if (!preventOverflow) {
        this.holder.style.overflow = 'visible';
        this.wtRootElement.style.overflow = 'visible';
      }
    } else {
      // (Re-)establish ResizeObservers when the trimming element changes.
      // This handles the rare case where the HOT container is moved in the DOM.
      if (this.#observedTrimmingElement !== trimmingElement) {
        this.#trimmingContainerObserver?.disconnect();
        this.#hiderObserver?.disconnect();
        this.#trimmingCache = null;
        this.#observedTrimmingElement = trimmingElement;

        const invalidate = () => { this.#trimmingCache = null; };
        const tcObserver = new ResizeObserver(invalidate);

        tcObserver.observe(trimmingElement);
        this.#trimmingContainerObserver = tcObserver;

        const hoObserver = new ResizeObserver(invalidate);

        hoObserver.observe(this.hider);
        this.#hiderObserver = hoObserver;
      }

      const cache = this.#trimmingCache;

      if (cache !== null) {
        // Fast path: apply cached measurements without any DOM reads that would
        // force a synchronous layout flush. This path is taken on every scroll
        // draw where the container dimensions have not changed.
        const holderStyle = this.holder.style;

        holderStyle.width = cache.holderWidth;
        holderStyle.height = cache.holderHeight;
        holderStyle.overflow = '';
        this.hasTableHeight = cache.hasTableHeight;
        this.hasTableWidth = cache.hasTableWidth;
      } else {
        // Slow path: full measurement of the trimming container.
        // Runs on the first draw and whenever a ResizeObserver fires
        // (container or hider size changed).
        const trimmingElementParent = trimmingElement.parentElement;
        const trimmingHeight = getStyle(trimmingElement, 'height', rootWindow);
        const trimmingOverflow = getStyle(trimmingElement, 'overflow', rootWindow);
        const holderStyle = this.holder.style;
        const { scrollWidth, scrollHeight } = trimmingElement;
        let width = trimmingElement.offsetWidth;
        let height = trimmingElement.offsetHeight;
        const overflowValues = ['auto', 'hidden', 'scroll', 'clip'];
        // getStyle() may return a compound value (e.g. 'auto hidden') when overflow-x and
        // overflow-y are set independently. Split on whitespace so each token is checked.
        const hasScrollOverflow = trimmingOverflow.split(' ').some(v => overflowValues.includes(v));
        let useAutoHeight = (trimmingHeight === 'auto');

        if (trimmingElementParent && hasScrollOverflow) {
          const cloneNode = trimmingElement.cloneNode(false) as HTMLElement;

          // Before calculating the height of the trimming element, set overflow: auto to hide scrollbars.
          // An issue occurred on Firefox, where an empty element with overflow: scroll returns an element height higher than 0px
          // despite an empty content within.
          cloneNode.style.overflow = 'auto';
          // Issue #9545 shows problem with calculating height for HOT on Firefox while placing instance in some
          // flex containers and setting overflow for some `div` section.
          cloneNode.style.position = 'absolute';
          // Reset border and padding so border-box sizing does not contribute to the measured height.
          // Without this, a container with a visible border (e.g. border: 1px solid) produces
          // cloneHeight = 2 even though it has no intrinsic height, preventing the zero-height
          // detection that guards against the feedback-loop bug. See issue #3119.
          cloneNode.style.border = '0';
          cloneNode.style.padding = '0';

          if (trimmingElement.nextElementSibling) {
            trimmingElementParent.insertBefore(cloneNode, trimmingElement.nextElementSibling);
          } else {
            trimmingElementParent.appendChild(cloneNode);
          }

          const cloneHeight = parseInt(rootWindow.getComputedStyle(cloneNode).height, 10);

          trimmingElementParent.removeChild(cloneNode);

          if (cloneHeight === 0) {
            height = 0;

            // The trimming container has no intrinsic height — its size is driven entirely by
            // its content (HOT instances). When overflow-y is non-scrollable (hidden/clip),
            // the container cannot be scrolled vertically, so its height grows with content.
            // Setting the holder to a fixed pixel value in this case creates a feedback loop
            // when multiple HOT instances share the same parent, expanding it to the browser's
            // CSS height limit (~2^25 px). Using 'auto' lets the holder size to its content
            // (the hider element) and breaks the loop. When overflow-y is scrollable (auto/
            // scroll), the container IS a vertical scroll viewport and height=0 correctly
            // signals that it has no defined size. See issue #3119.
            const computedStyle = rootWindow.getComputedStyle(trimmingElement);
            const overflowX = computedStyle.overflowX;
            const overflowY = computedStyle.overflowY;

            // Only switch to auto-height for horizontal-scroll containers where:
            // - overflow-x is scrollable (auto/scroll) — the container is intentionally wider than its content
            // - overflow-y is non-scrollable (hidden/clip) — the container height is content-driven
            // This is the exact pattern that triggers the height feedback loop (issue #3119).
            // All-axis scroll/auto containers (overflow: scroll/auto) keep height=0 to correctly
            // signal no defined size. Similarly, overflow: hidden on both axes keeps height=0.
            if ((overflowX === 'auto' || overflowX === 'scroll') &&
                (overflowY !== 'auto' && overflowY !== 'scroll')) {
              useAutoHeight = true;
            }
          }
        }

        height = Math.min(height, scrollHeight);
        width = Math.min(width, scrollWidth);

        const holderHeight = useAutoHeight ? 'auto' : `${height}px`;
        const holderWidth = `${width}px`;
        const hasTableHeight = holderHeight === 'auto' ? true : height > 0;
        const hasTableWidth = width > 0;

        holderStyle.height = holderHeight;
        holderStyle.width = holderWidth;
        holderStyle.overflow = '';
        this.hasTableHeight = hasTableHeight;
        this.hasTableWidth = hasTableWidth;

        // Store measurements in cache. They remain valid until a ResizeObserver fires
        // (container or hider size changed).
        this.#trimmingCache = { holderWidth, holderHeight, hasTableHeight, hasTableWidth };
      }
    }

    // Skip the checkVisibility() style flush when the table is already known
    // to be visible — the common case during scrolling. Only re-check when
    // the last known state was invisible (handles the hidden→visible transition).
    if (!this.isTableVisible) {
      this.isTableVisible = isVisible(this.TABLE);
    }
  }

  markOversizedColumnHeaders() {
    const { wtSettings } = this;
    const { wtViewport } = this.dataAccessObject;
    const overlayName = 'master';
    const columnHeaders = wtSettings.getSetting<unknown[]>('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    if (columnHeadersCount && !wtViewport.hasOversizedColumnHeadersMarked[overlayName]) {
      const rowHeaders = wtSettings.getSetting<unknown[]>('rowHeaders');
      const rowHeaderCount = rowHeaders.length;
      const columnCount = this.getRenderedColumnsCount();

      for (let i = 0; i < columnHeadersCount; i++) {
        for (let renderedColumnIndex = (-1) * rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) { // eslint-disable-line max-len
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
    }
  }

  /**
   * Cleans up ResizeObservers to prevent memory leaks when the Walkontable instance is destroyed.
   */
  destroy() {
    this.#trimmingContainerObserver?.disconnect();
    this.#hiderObserver?.disconnect();
    this.#trimmingCache = null;
    this.#trimmingContainerObserver = null;
    this.#hiderObserver = null;
    this.#observedTrimmingElement = null;
  }
}

mixin(MasterTable, calculatedRows);
mixin(MasterTable, calculatedColumns);

export default MasterTable;
