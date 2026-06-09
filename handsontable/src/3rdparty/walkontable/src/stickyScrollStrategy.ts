import { isSafari } from '../../../helpers/browser';
import type { WalkontableInstance, DomBindings } from './types';
import type Settings from './settings';
import type Table from './table';
import type { Overlay } from './overlay/_base';
import type EventManager from '../../../eventManager';

interface OverlaysLike {
  wot: WalkontableInstance;
  wtTable: Table;
  wtSettings: Settings;
  domBindings: DomBindings;
  eventManager: EventManager;
  scrollableElement: HTMLElement | Window;
  topOverlay: Overlay;
  bottomOverlay: Overlay;
  inlineStartOverlay: Overlay;
  refreshAll(): void;
  applyToDOM(): void;
}

/**
 * Manages the sticky-scroll optimization during native scrollbar drag.
 *
 * When the user grabs the native scrollbar and drags, the master spreader
 * (and overlay clone spreaders in element-scroll mode) switch to
 * `position: sticky` so the browser keeps them visible in the viewport.
 * Row/column content still updates via `refreshAll()` on each scroll event,
 * but the spreader positioning is handled by CSS rather than JS, eliminating
 * visual flickering.
 *
 * The class owns the full lifecycle: detection, activation, offset updates,
 * deactivation, and scroll position correction on release.
 *
 * @class StickyScrollStrategy
 */
export class StickyScrollStrategy {
  /**
   * Reference to the parent Overlays coordinator.
   *
   * @type {OverlaysLike}
   */
  readonly #overlays: OverlaysLike;

  /**
   * Whether sticky-scroll mode is currently active.
   *
   * @type {boolean}
   */
  #active = false;

  /**
   * Whether the mouse button is currently pressed.
   *
   * @type {boolean}
   */
  #mouseDown = false;

  /**
   * @param {Overlays} overlays The parent Overlays instance.
   */
  constructor(overlays: OverlaysLike) {
    this.#overlays = overlays;
  }

  /**
   * Registers mousedown/mouseup listeners for scrollbar drag detection.
   * Called from `Overlays.registerListeners()`.
   */
  registerListeners() {
    const { eventManager, domBindings: { rootDocument } } = this.#overlays;

    // Scrollable elements may have changed (e.g. updateSettings). Discard any
    // leftover sticky state so a stale deactivate() cannot compute a wrong scroll.
    if (this.#active) {
      this.#active = false;
      this.#applySpreaderStyles('relative', 0, 0);
    }

    this.#mouseDown = false;

    eventManager.addEventListener(rootDocument, 'mousedown', (event) => {
      if (event instanceof MouseEvent) {
        this.#mouseDown = this.#isScrollbarTarget(event);
      }
    });
    eventManager.addEventListener(rootDocument, 'mouseup', () => {
      this.#mouseDown = false;

      if (this.#active) {
        this.deactivate();
      }
    });
  }

  /**
   * Checks whether sticky-scroll should activate based on the current state.
   * Called from `Overlays.syncScrollPositions()` after scroll direction is determined.
   *
   * @param {boolean} verticalScrolling Whether vertical scrolling occurred.
   * @param {boolean} horizontalScrolling Whether horizontal scrolling occurred.
   */
  tryActivate(verticalScrolling: boolean, horizontalScrolling: boolean): void {
    if (this.#mouseDown && !this.#active && !isSafari()
      && (verticalScrolling || horizontalScrolling)) {
      this.#activate();
    }
  }

  /**
   * Recalculates and applies sticky offsets on all spreaders. Called after
   * every render (both full and fast draws) to keep the sticky offset in
   * sync with the current scroll position.
   */
  syncOffsets() {
    if (!this.#active) {
      return;
    }

    const overlays = this.#overlays;
    const { wtViewport } = overlays.wot;

    const startTop = wtViewport.rowsRenderCalculator?.startPosition;
    const startLeft = wtViewport.columnsRenderCalculator?.startPosition;

    // startPosition is null when nothing is rendered (empty dataset or trimmed-away rows/columns).
    // Arithmetic with null produces NaN, which would set "NaNpx" on the style. Skip the update.
    if (typeof startTop !== 'number' || typeof startLeft !== 'number') {
      return;
    }

    const stickyTop = startTop - this.#getScrollTop();
    const stickyLeft = startLeft - this.#getScrollLeft();

    this.#applySpreaderStyles('sticky', stickyTop, stickyLeft);
  }

  /**
   * Cleans up on destroy.
   */
  destroy() {
    if (this.#active) {
      this.#applySpreaderStyles('relative', 0, 0);
    }

    this.#active = false;
    this.#mouseDown = false;
  }

  /**
   * Activates sticky-scroll mode: switches spreaders to `position: sticky`
   * using the exact visual offset so no jump occurs.
   */
  #activate() {
    const overlays = this.#overlays;
    const spreader = overlays.wtTable.spreader;
    const isRtl = overlays.wtSettings.getSetting('rtlMode');
    const leftProp = isRtl ? 'right' : 'left';

    const startTop = Number.parseInt(spreader.style.top, 10) || 0;
    const stickyTop = startTop - this.#getScrollTop();

    const startLeft = Number.parseInt(spreader.style[leftProp], 10) || 0;
    const stickyLeft = startLeft - this.#getScrollLeft();

    this.#active = true;

    this.#applySpreaderStyles('sticky', stickyTop, stickyLeft);
  }

  /**
   * Deactivates sticky-scroll mode: captures the current offsets, adjusts
   * the scroll position to match, then restores `position: relative` and
   * triggers a final full render.
   */
  deactivate() {
    const overlays = this.#overlays;
    const spreader = overlays.wtTable.spreader;
    const { wtViewport } = overlays.wot;
    const isRtl = overlays.wtSettings.getSetting('rtlMode');
    const leftProp = isRtl ? 'right' : 'left';

    // Render while still active (same code path as during drag).
    overlays.refreshAll();

    // Capture the sticky offsets and computed start positions.
    const lastStickyTop = Number.parseInt(spreader.style.top, 10) || 0;
    const lastStickyLeft = Number.parseInt(spreader.style[leftProp], 10) || 0;
    const startTop = wtViewport.rowsRenderCalculator?.startPosition;
    const startLeft = wtViewport.columnsRenderCalculator?.startPosition;

    // Adjust scroll position while still active to prevent cascading renders.
    const targetScrollTop = typeof startTop === 'number'
      ? startTop - lastStickyTop : this.#getScrollTop();
    const targetScrollLeft = typeof startLeft === 'number'
      ? startLeft - lastStickyLeft : this.#getScrollLeft();

    this.#setScrollPosition(targetScrollTop, targetScrollLeft);

    // Deactivate and restore relative positioning.
    this.#active = false;

    this.#applySpreaderStyles('relative', 0, 0);

    // Final render in normal mode at the corrected scroll position.
    overlays.refreshAll();
    overlays.applyToDOM();
  }

  /**
   * Returns the current vertical scroll offset in the hider's coordinate system.
   *
   * @returns {number}
   */
  #getScrollTop() {
    const { topOverlay } = this.#overlays;

    return topOverlay.getScrollPosition() - topOverlay.getTableParentOffset();
  }

  /**
   * Returns the current horizontal scroll offset in the hider's coordinate system.
   *
   * @returns {number}
   */
  #getScrollLeft() {
    const { inlineStartOverlay } = this.#overlays;

    // For RTL window scrolling, scrollX increases as the user scrolls left (away from
    // the right-edge origin). getTableParentOffset() returns the left-edge offset which
    // doesn't apply to the RTL coordinate system, so skip it and return scrollX directly.
    if (this.#isRtl() && this.#isWindowScroll()) {
      return Math.abs(inlineStartOverlay.getScrollPosition());
    }

    return Math.abs(inlineStartOverlay.getScrollPosition())
      - inlineStartOverlay.getTableParentOffset();
  }

  /**
   * Sets the scroll position, converting from hider coordinates back to absolute.
   *
   * @param {number} top Vertical offset (hider coordinates).
   * @param {number} left Horizontal offset (hider coordinates).
   */
  #setScrollPosition(top: number, left: number): void {
    const overlays = this.#overlays;

    if (this.#isWindowScroll()) {
      const { rootWindow } = overlays.domBindings;
      // RTL + window-scroll: left is in scrollX coordinates (distance from the right-edge
      // origin), so pass it directly. LTR: add back the table's left page offset.
      const absoluteLeft = this.#isRtl()
        ? left
        : left + overlays.inlineStartOverlay.getTableParentOffset();

      rootWindow.scrollTo(
        absoluteLeft,
        top + overlays.topOverlay.getTableParentOffset()
      );
    } else {
      overlays.wtTable.holder.scrollTop = top;
      overlays.wtTable.holder.scrollLeft = this.#isRtl() ? -left : left;
    }
  }

  /**
   * Clears inset offset inline styles so `position: relative` is not shifted
   * by leftover `top` / `left` / `right` / `bottom` from sticky mode.
   *
   * @param {HTMLElement} element The spreader element.
   */
  #clearSpreaderInsetStyles(element: HTMLElement): void {
    element.style.top = '';
    element.style.bottom = '';
    element.style.left = '';
    element.style.right = '';
  }

  /**
   * Applies position styles to the master spreader and (in element-scroll mode)
   * the overlay clone spreaders.
   *
   * @param {'sticky'|'relative'} position The CSS position value.
   * @param {number} stickyTop The vertical offset (only used for sticky).
   * @param {number} stickyLeft The horizontal offset (only used for sticky).
   */
  #applySpreaderStyles(position: 'sticky' | 'relative', stickyTop: number, stickyLeft: number): void {
    const overlays = this.#overlays;
    const spreader = overlays.wtTable.spreader;
    const isRtl = this.#isRtl();
    const leftProp = isRtl ? 'right' : 'left';
    const isSticky = position === 'sticky';

    // Master spreader
    spreader.style.position = position;

    if (isSticky) {
      spreader.style.top = `${stickyTop}px`;
      spreader.style.bottom = '';
      spreader.style[leftProp] = `${stickyLeft}px`;
      spreader.style[isRtl ? 'left' : 'right'] = '';

    } else {
      this.#clearSpreaderInsetStyles(spreader);
    }

    // Overlay clone spreaders — only in element scroll mode.
    // In window scroll mode, clones use the overlay system's own
    // absolute/fixed positioning which conflicts with sticky.
    if (this.#isWindowScroll()) {
      return;
    }

    if (overlays.inlineStartOverlay.needFullRender && overlays.inlineStartOverlay.clone) {
      const cloneSpreader = overlays.inlineStartOverlay.clone.wtTable.spreader;

      cloneSpreader.style.position = position;

      if (isSticky) {
        cloneSpreader.style.top = `${stickyTop}px`;

      } else {
        this.#clearSpreaderInsetStyles(cloneSpreader);
      }
    }

    if (overlays.topOverlay.needFullRender && overlays.topOverlay.clone) {
      const cloneSpreader = overlays.topOverlay.clone.wtTable.spreader;

      cloneSpreader.style.position = position;

      if (isSticky) {
        cloneSpreader.style[leftProp] = `${stickyLeft}px`;
        cloneSpreader.style[isRtl ? 'left' : 'right'] = '';

      } else {
        this.#clearSpreaderInsetStyles(cloneSpreader);
      }
    }

    if (overlays.bottomOverlay.needFullRender && overlays.bottomOverlay.clone) {
      const cloneSpreader = overlays.bottomOverlay.clone.wtTable.spreader;

      cloneSpreader.style.position = position;

      if (isSticky) {
        cloneSpreader.style[leftProp] = `${stickyLeft}px`;
        cloneSpreader.style[isRtl ? 'left' : 'right'] = '';

      } else {
        this.#clearSpreaderInsetStyles(cloneSpreader);
      }
    }
  }

  /**
   * Returns whether the mousedown event originated from a native scrollbar.
   *
   * When a user clicks a native browser scrollbar, the event target is the
   * scrollable container itself (the scrollbar is part of the element's
   * rendering but not a child DOM node). Clicks on child elements (cells,
   * headers, etc.) set a descendant as the target, so they are excluded.
   *
   * @param {MouseEvent} event The mousedown event.
   * @returns {boolean}
   */
  #isScrollbarTarget(event: MouseEvent): boolean {
    if (this.#isWindowScroll()) {
      return event.target === this.#overlays.domBindings.rootDocument.documentElement;
    }

    return event.target === this.#overlays.scrollableElement;
  }

  /**
   * Returns whether the scrollable element is the window.
   *
   * @returns {boolean}
   */
  #isWindowScroll() {
    return this.#overlays.scrollableElement === this.#overlays.domBindings.rootWindow;
  }

  /**
   * Returns whether the scrollable element is in RTL mode.
   *
   * @returns {boolean}
   */
  #isRtl(): boolean {
    return this.#overlays.wtSettings.getSetting<boolean>('rtlMode');
  }
}
