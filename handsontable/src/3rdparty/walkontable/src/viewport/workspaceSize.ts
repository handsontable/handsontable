/**
 * The workspace-size and scroll-detection queries for `Viewport`, plus the mixin object that
 * implements them.
 *
 * These methods answer "how big is the drawable area and will scrollbars appear" — the workspace and
 * viewport dimensions, the row-header width / column-header height (with their lazy caches), the
 * scrollbar-presence checks, and the window-scrollability checks. They are applied to `Viewport` with
 * the same `mixin()` helper the range-query and sticky mixins use and reach the injected deps through
 * the public `this.deps` getter (a mixin cannot see the class's `#deps` private field).
 *
 * On the single-pass gated path these read the per-draw `LayoutSnapshot` instead of forcing DOM
 * layout; off that path they measure the DOM directly.
 */
import type { default as Viewport } from './viewport';

/**
 * Legacy (pre-single-pass) vertical-scroll check: measures the rendered DOM. Used when the
 * `singlePassLayout` escape hatch is off (e.g. under `mergeCells`) so the answer matches the
 * multi-pass measure-then-render behavior exactly. Kept as a free function so it does not route
 * through `hasVerticalScroll` (which branches on the flag) and cannot recurse.
 *
 * @param {Viewport} viewport The viewport instance.
 * @returns {boolean}
 */
function measureHasVerticalScroll(viewport: Viewport): boolean {
  const { geometryReader } = viewport.deps;

  if (viewport.isVerticallyScrollableByWindow()) {
    const documentElement = viewport.deps.rootDocument.documentElement;

    return geometryReader.scrollHeight(documentElement) > geometryReader.clientHeight(documentElement);
  }

  const { holder, hider } = viewport.wtTable;
  const holderHeight = geometryReader.clientHeight(holder);
  const hiderOffsetHeight = geometryReader.offsetHeight(hider);

  if (holderHeight < hiderOffsetHeight) {
    return true;
  }

  return hiderOffsetHeight > viewport.getWorkspaceHeight();
}

/**
 * Legacy (pre-single-pass) horizontal-scroll check: measures the rendered DOM. Escape-hatch twin of
 * `measureHasVerticalScroll`.
 *
 * @param {Viewport} viewport The viewport instance.
 * @returns {boolean}
 */
function measureHasHorizontalScroll(viewport: Viewport): boolean {
  const { geometryReader } = viewport.deps;

  if (viewport.isVerticallyScrollableByWindow()) {
    const documentElement = viewport.deps.rootDocument.documentElement;

    return geometryReader.scrollWidth(documentElement) > geometryReader.clientWidth(documentElement);
  }

  const { hider } = viewport.wtTable;
  const hiderOffsetWidth = geometryReader.offsetWidth(hider);
  const scrollbarWidth = measureHasVerticalScroll(viewport) ? geometryReader.getScrollbarWidth() : 0;

  return hiderOffsetWidth > measureWorkspaceWidth(viewport) - scrollbarWidth;
}

/**
 * Measures the workspace height off the live DOM (the trimming container, with the `#3119`
 * zero-height→window fallback). Kept as a free function so the public `getWorkspaceHeight` can return
 * the layout snapshot on the single-pass path while `gatherLayoutInput` (which BUILDS the snapshot)
 * and the legacy measure path route here directly, avoiding recursion through `getLayout()`.
 *
 * @param {Viewport} viewport The viewport instance.
 * @returns {number}
 */
export function measureWorkspaceHeight(viewport: Viewport): number {
  const { rootDocument: currentDocument, rootWindow, geometryReader } = viewport.deps;
  const trimmingContainer = viewport.deps.getTopOverlay().trimmingContainer;
  let height = 0;

  if (trimmingContainer === rootWindow) {
    height = geometryReader.clientHeight(currentDocument.documentElement);

  } else {
    const elemHeight = geometryReader.outerHeight(trimmingContainer as HTMLElement);

    // returns height without DIV scrollbar
    if (elemHeight > 0 && geometryReader.clientHeight(trimmingContainer as HTMLElement) > 0) {
      height = geometryReader.clientHeight(trimmingContainer as HTMLElement);
    } else {
      // Fall back to window height when the trimming container has zero client height
      // (e.g. a parent with overflow set but no explicit height). Returning Infinity
      // previously caused an unbounded viewport, expanding the parent to the browser's
      // ~2^25 px CSS height limit. See issue #3119.
      height = Math.max(geometryReader.clientHeight(currentDocument.documentElement), 1);
    }
  }

  return height;
}

/**
 * Measures the workspace width off the live DOM. Free-function twin of `measureWorkspaceHeight` (see
 * its note on why the raw measure is split out from the public `getWorkspaceWidth`).
 *
 * @param {Viewport} viewport The viewport instance.
 * @returns {number}
 */
export function measureWorkspaceWidth(viewport: Viewport): number {
  const { rootDocument, rootWindow, geometryReader } = viewport.deps;
  const trimmingContainer = viewport.deps.getInlineStartOverlay().trimmingContainer;
  let width;

  if (trimmingContainer === rootWindow) {
    const totalColumns = viewport.wtSettings.getSetting<number>('totalColumns');

    width = geometryReader.offsetWidth(viewport.wtTable.holder);

    if (viewport.getRowHeaderWidth() + viewport.sumColumnWidths(0, totalColumns) > width) {
      width = geometryReader.clientWidth(rootDocument.documentElement);
    }

  } else {
    width = geometryReader.clientWidth(trimmingContainer as HTMLElement);
  }

  return width;
}

/**
 * Workspace-size and scroll-detection queries, mixed into `Viewport`.
 */
export interface WorkspaceSize {
  getWorkspaceHeight(): number;
  getViewportHeight(): number;
  getWorkspaceWidth(): number;
  getViewportWidth(): number;
  hasVerticalScroll(): boolean;
  hasHorizontalScroll(): boolean;
  isVerticallyScrollableByWindow(): boolean;
  isHorizontallyScrollableByWindow(): boolean;
  sumColumnWidths(from: number, length: number): number;
  getWorkspaceOffset(): { left: number, top: number };
  getColumnHeaderHeight(): number;
  getRowHeaderWidth(): number;
}

/**
 * The workspace-size mixin. Implements `WorkspaceSize` by measuring the trimming container and the
 * rendered table through the geometry reader.
 *
 * @type {WorkspaceSize}
 */
export const workspaceSize: WorkspaceSize = {
  /**
   * @this Viewport
   * @returns {number}
   */
  getWorkspaceHeight(this: Viewport): number {
    // The workspace box is resolved once per draw into the layout snapshot (`gatherLayoutInput` →
    // `measureWorkspaceHeight`). On the gated path (element mode + uniform + `singlePassLayout`)
    // return that stored value so the per-draw re-measures collapse to the one read the snapshot
    // already did (identical value — the trimming container does not resize mid-draw — so this only
    // removes forced layouts). Off that path (window / non-uniform) measure the DOM directly.
    if (this.usesLayoutSnapshotForCalculators()) {
      return this.getLayout().workspaceHeight;
    }

    return measureWorkspaceHeight(this);
  },

  /**
   * @this Viewport
   * @returns {number}
   */
  getViewportHeight(this: Viewport): number {
    let containerHeight = this.getWorkspaceHeight();

    const columnHeaderHeight = this.getColumnHeaderHeight();

    if (columnHeaderHeight > 0) {
      containerHeight -= columnHeaderHeight;
    }

    return containerHeight;
  },

  /**
   * Gets the width of the table workspace (in pixels). The workspace size in the current
   * implementation returns the width of the table holder element including scrollbar width when
   * the table has defined size and the width of the window excluding scrollbar width when
   * the table has no defined size (the window is a scrollable container).
   *
   * This is a bug, as the method should always return stable values, always without scrollbar width.
   * Changing this behavior would break the column calculators, which would also need to be adjusted.
   *
   * @this Viewport
   * @returns {number}
   */
  getWorkspaceWidth(this: Viewport): number {
    // Return the workspace width the snapshot already resolved this draw (same gate and
    // identical-value rationale as `getWorkspaceHeight`). Off the gated path, measure the DOM.
    if (this.usesLayoutSnapshotForCalculators()) {
      return this.getLayout().workspaceWidth;
    }

    return measureWorkspaceWidth(this);
  },

  /**
   * @this Viewport
   * @returns {number}
   */
  getViewportWidth(this: Viewport): number {
    const containerWidth = this.getWorkspaceWidth();
    const rowHeaderWidth = this.getRowHeaderWidth();

    if (rowHeaderWidth > 0) {
      return containerWidth - rowHeaderWidth;
    }

    return containerWidth;
  },

  /**
   * Checks if viewport has vertical scroll.
   *
   * @this Viewport
   * @returns {boolean}
   */
  hasVerticalScroll(this: Viewport): boolean {
    // Measure the rendered DOM (legacy V18 path) when either:
    //  - single-pass layout is off (escape hatch, e.g. mergeCells), or
    //  - the table scrolls with the window: the document's scroll depends on other page content, so
    //    predicting it from this table's content totals is unreliable. Single-pass prediction is
    //    scoped to element mode, where content-vs-box is deterministic (and validated by test:walkontable).
    if (!this.wtSettings.getSetting('singlePassLayout') || this.isVerticallyScrollableByWindow()) {
      return measureHasVerticalScroll(this);
    }

    // Predict scrollbar presence from numbers in the layout snapshot, so it is correct before the DOM
    // is written — instead of measuring the rendered `hider` (which is only right on a second pass).
    return this.getLayout().hasVerticalScroll;
  },

  /**
   * Checks if viewport has horizontal scroll.
   *
   * @this Viewport
   * @returns {boolean}
   */
  hasHorizontalScroll(this: Viewport): boolean {
    // Measure the DOM (legacy) when single-pass is off (escape hatch) or the table scrolls with the
    // window (document scroll is externally influenced); predict only in element mode. See
    // `hasVerticalScroll` for the rationale.
    if (!this.wtSettings.getSetting('singlePassLayout') || this.isVerticallyScrollableByWindow()) {
      return measureHasHorizontalScroll(this);
    }

    // Predicted from the layout snapshot, correct pre-render.
    return this.getLayout().hasHorizontalScroll;
  },

  /**
   * Checks if the table uses the window as a viewport and if there is a vertical scrollbar.
   *
   * @this Viewport
   * @returns {boolean}
   */
  isVerticallyScrollableByWindow(this: Viewport): boolean {
    return this.deps.getTopOverlay().trimmingContainer === this.deps.rootWindow;
  },

  /**
   * Checks if the table uses the window as a viewport and if there is a horizontal scrollbar.
   *
   * @this Viewport
   * @returns {boolean}
   */
  isHorizontallyScrollableByWindow(this: Viewport): boolean {
    return this.deps.getInlineStartOverlay().trimmingContainer === this.deps.rootWindow;
  },

  /**
   * @this Viewport
   * @param {number} from The visual column index from the width sum is start calculated.
   * @param {number} length The length of the column to traverse.
   * @returns {number}
   */
  sumColumnWidths(this: Viewport, from: number, length: number): number {
    let sum = 0;
    let column = from;

    while (column < length) {
      sum += this.wtTable.getColumnWidth(column);
      column += 1;
    }

    return sum;
  },

  /**
   * @this Viewport
   * @returns {{ left: number, top: number }}
   */
  getWorkspaceOffset(this: Viewport): { left: number, top: number } {
    return this.deps.geometryReader.offset(this.wtTable.holder);
  },

  /**
   * @this Viewport
   * @returns {number}
   */
  getColumnHeaderHeight(this: Viewport): number {
    const columnHeaders = this.wtSettings.getSetting<Function[]>('columnHeaders');

    if (!columnHeaders.length) {
      this.columnHeaderHeight = 0;
    } else if (isNaN(this.columnHeaderHeight)) {
      this.columnHeaderHeight = this.wtTable.THEAD
        ? this.deps.geometryReader.outerHeight(this.wtTable.THEAD) : 0;
    }

    return this.columnHeaderHeight;
  },

  /**
   * @this Viewport
   * @returns {number}
   */
  getRowHeaderWidth(this: Viewport): number {
    const rowHeadersWidthSetting = this.wtSettings.getSetting<number | Array<number | null>>('rowHeaderWidth');
    const rowHeaders = this.wtSettings.getSetting<Function[]>('rowHeaders');

    if (rowHeadersWidthSetting) {
      this.rowHeaderWidth = 0;

      for (let i = 0, len = rowHeaders.length; i < len; i++) {
        const w = Array.isArray(rowHeadersWidthSetting)
          ? rowHeadersWidthSetting[i]
          : (rowHeadersWidthSetting as number);

        this.rowHeaderWidth += w ?? NaN;
      }
    }

    if (isNaN(this.rowHeaderWidth)) {

      if (rowHeaders.length) {
        let TH = this.wtTable.TABLE.querySelector('TH');

        this.rowHeaderWidth = 0;

        for (let i = 0, len = rowHeaders.length; i < len; i++) {
          if (TH) {
            this.rowHeaderWidth += this.deps.geometryReader.outerWidth(TH as HTMLElement);
            TH = TH.nextSibling as HTMLTableCellElement;

          } else {
            // yes this is a cheat but it worked like that before, just taking assumption from CSS instead of measuring.
            // TODO: proper fix
            this.rowHeaderWidth += 50;
          }
        }
      } else {
        this.rowHeaderWidth = 0;
      }
    }

    this.rowHeaderWidth = this.wtSettings
      .getSetting<number>('onModifyRowHeaderWidth', this.rowHeaderWidth) || this.rowHeaderWidth;

    return this.rowHeaderWidth;
  },
};
