import type { EngineContext } from '../wire';
import {
  OVERLAY_SCROLLBAR_FADE_DELAY,
  OVERLAY_SCROLLBAR_PROXIMITY,
} from './constants';

/**
 * Which scrollbars are currently on screen. Tracked per axis, because a browser only shows the one for
 * the axis being scrolled.
 */
export interface ScrollbarAxesVisibility {
  horizontal: boolean;
  vertical: boolean;
}

/**
 * Assembles the ScrollbarVisibility dependencies from the engine composition context. It needs the
 * master table (for the scrollport it watches and the offsets it compares), the window the timers live
 * on, and the geometry reader for the one rect it caches.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The ScrollbarVisibility dependency set.
 */
export function createScrollbarVisibilityDeps(ctx: EngineContext) {
  return {
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    getWtTable: ctx.getWtTable,
  };
}

/**
 * The ScrollbarVisibility dependencies, inferred from `createScrollbarVisibilityDeps`.
 */
export type ScrollbarVisibilityDeps = ReturnType<typeof createScrollbarVisibilityDeps>;

/**
 * Tracks which overlay ("floating") scrollbars are currently on screen, so the band each one needs can
 * appear with it and go away again when it fades (#10370).
 *
 * Per axis, and driven by which offset actually moved: a browser shows the horizontal scrollbar when you
 * scroll horizontally and the vertical one when you scroll vertically, never both for one gesture, so a
 * single shared flag would carve out a band along an edge where nothing is drawn.
 *
 * A hover can only *hold* a band open, never open one - no browser draws an overlay scrollbar for a
 * hover alone, so opening on proximity would reserve a band with no scrollbar in it.
 *
 * One flag drives both the band and the clone's clip, so the two can never disagree. The band lives
 * inside the master holder and is therefore drawn *under* the clones: wherever a clone still paints,
 * the band behind it is invisible. Either half-switched state is a visible defect, and both were
 * measured on a real grid:
 *
 * - clip open while the band is part-way through its opacity: only the master's segment of the strip
 *   is tinted while the frozen segments keep their own cells - two colours side by side down the strip
 *   (231,231,233 against 255,255,255), which reads as a different track over each overlay.
 * - clip closed while the band is part-way through its opacity: the strip shows the master's cell where
 *   the frozen content belongs, so a column header looks cut short along its last 16px.
 *
 * That rules out a fade-*out*: a fade-out is by definition a stretch of time when the band is not
 * opaque, and the clip must be either closed for all of it (the second defect) or open for it (the
 * first). So the track fades in and is then dropped outright - the one combination that shows neither.
 *
 * Deliberately cheap: the scrollport's rect is read once per scroll or resize and never per pointer
 * move, the offsets it compares are scroll positions (which force no layout), and a change only ever
 * toggles a `clip-path` and an opacity - paint, never layout.
 *
 * @class ScrollbarVisibility
 */
export class ScrollbarVisibility {
  /**
   * The ScrollbarVisibility dependencies.
   *
   * @type {ScrollbarVisibilityDeps}
   */
  readonly #deps: ScrollbarVisibilityDeps;

  /**
   * Called whenever either axis flips, so the overlays can re-apply their clearance.
   */
  readonly #onChange: () => void;

  /**
   * Which scrollbars are considered on screen right now.
   */
  #visible: ScrollbarAxesVisibility = { horizontal: false, vertical: false };

  /**
   * Handles of the pending fade-outs, one per axis, so each can be restarted on its own.
   */
  #fadeTimeoutIds = { horizontal: 0, vertical: 0 };

  /**
   * Which axes the pointer is currently holding open by sitting beside their scrollbar.
   */
  #pinned = { horizontal: false, vertical: false };

  /**
   * The scroll offsets at the previous scroll notification, so the moved axis can be told apart.
   */
  #lastOffsets = { left: 0, top: 0 };

  /**
   * The scrollport's last known viewport rect, refreshed on scroll and resize rather than per pointer
   * move - a `getBoundingClientRect` on every move would force a layout on a mouse-move path.
   */
  #scrollportRect: { top: number; right: number; bottom: number; left: number } | null = null;

  /**
   * @param {ScrollbarVisibilityDeps} deps The dependency set.
   * @param {Function} onChange Invoked when either axis flips.
   */
  constructor(deps: ScrollbarVisibilityDeps, onChange: () => void) {
    this.#deps = deps;
    this.#onChange = onChange;
  }

  /**
   * Which scrollbars should have a band right now.
   *
   * @returns {ScrollbarAxesVisibility}
   */
  get visible(): ScrollbarAxesVisibility {
    return this.#visible;
  }

  /**
   * Reports that the view was just scrolled, and opens the band for whichever axis moved.
   */
  notifyScrolled(): void {
    this.#invalidateRect();

    const holder = this.#deps.getWtTable().holder;

    if (!holder) {
      return;
    }

    // Scroll positions, not geometry - these force no layout.
    const left = Math.round(holder.scrollLeft);
    const top = Math.round(holder.scrollTop);
    const movedHorizontally = left !== this.#lastOffsets.left;
    const movedVertically = top !== this.#lastOffsets.top;

    this.#lastOffsets = { left, top };

    if (movedHorizontally) {
      this.#show('horizontal');
    }

    if (movedVertically) {
      this.#show('vertical');
    }
  }

  /**
   * Reports that the scrollport's geometry may have changed, so the cached rect is re-read on next use.
   */
  notifyResized(): void {
    this.#invalidateRect();
  }

  /**
   * Handles a pointer move over the page. Holds open whichever band the pointer is near, and only if
   * that band is already showing.
   *
   * @param {number} clientX The pointer's viewport X.
   * @param {number} clientY The pointer's viewport Y.
   */
  notifyPointerMoved(clientX: number, clientY: number): void {
    if (!this.#visible.horizontal && !this.#visible.vertical) {
      return;
    }

    const rect = this.#getScrollportRect();

    if (!rect) {
      return;
    }

    const withinX = clientX >= rect.left - OVERLAY_SCROLLBAR_PROXIMITY
      && clientX <= rect.right + OVERLAY_SCROLLBAR_PROXIMITY;
    const withinY = clientY >= rect.top - OVERLAY_SCROLLBAR_PROXIMITY
      && clientY <= rect.bottom + OVERLAY_SCROLLBAR_PROXIMITY;
    const inReach = withinX && withinY;
    const nearBottom = inReach && clientY >= rect.bottom - OVERLAY_SCROLLBAR_PROXIMITY;
    const nearInlineEdge = inReach && (clientX >= rect.right - OVERLAY_SCROLLBAR_PROXIMITY
      || clientX <= rect.left + OVERLAY_SCROLLBAR_PROXIMITY);

    this.#setPinned('horizontal', nearBottom);
    this.#setPinned('vertical', nearInlineEdge);
  }

  /**
   * Pins an axis's band open while the pointer is beside its scrollbar, or hands it back to the fade
   * timer once the pointer leaves.
   *
   * A pin rather than a restarted timer, because the browser keeps the thumb up for as long as the
   * pointer is there: a timer would close the band under a thumb that is still drawn, the mirror image
   * of the band outliving the thumb.
   *
   * @param {'horizontal' | 'vertical'} axis The axis to pin or release.
   * @param {boolean} pinned Whether the pointer is beside that scrollbar.
   */
  #setPinned(axis: 'horizontal' | 'vertical', pinned: boolean): void {
    if (!this.#visible[axis] || this.#pinned[axis] === pinned) {
      return;
    }

    this.#pinned[axis] = pinned;

    if (pinned) {
      this.#clearFade(axis);
    } else {
      this.#scheduleFade(axis);
    }
  }

  /**
   * Opens one axis's band, and starts its fade unless the pointer is pinning it.
   *
   * @param {'horizontal' | 'vertical'} axis The axis to open.
   */
  #show(axis: 'horizontal' | 'vertical'): void {
    if (!this.#pinned[axis]) {
      this.#scheduleFade(axis);
    }

    this.#set(axis, true);
  }

  /**
   * (Re)starts one axis's fade-out.
   *
   * @param {'horizontal' | 'vertical'} axis The axis to fade.
   */
  #scheduleFade(axis: 'horizontal' | 'vertical'): void {
    const { rootWindow } = this.#deps;

    this.#clearFade(axis);

    this.#fadeTimeoutIds[axis] = rootWindow.setTimeout(() => {
      this.#fadeTimeoutIds[axis] = 0;
      this.#set(axis, false);
    }, OVERLAY_SCROLLBAR_FADE_DELAY);
  }

  /**
   * Cancels one axis's pending fade-out.
   *
   * @param {'horizontal' | 'vertical'} axis The axis to hold.
   */
  #clearFade(axis: 'horizontal' | 'vertical'): void {
    if (this.#fadeTimeoutIds[axis]) {
      this.#deps.rootWindow.clearTimeout(this.#fadeTimeoutIds[axis]);
      this.#fadeTimeoutIds[axis] = 0;
    }
  }

  /**
   * Applies a new state for one axis, notifying only on an actual flip.
   *
   * @param {'horizontal' | 'vertical'} axis The axis to set.
   * @param {boolean} value The new state.
   */
  #set(axis: 'horizontal' | 'vertical', value: boolean): void {
    if (this.#visible[axis] === value) {
      return;
    }

    this.#visible = { ...this.#visible, [axis]: value };

    if (!value) {
      // A closed band cannot be pinned; the next scroll decides again.
      this.#pinned[axis] = false;
    }

    this.#onChange();
  }

  /**
   * Drops the cached rect.
   */
  #invalidateRect(): void {
    this.#scrollportRect = null;
  }

  /**
   * Returns the scrollport's viewport rect, reading it at most once per scroll or resize.
   *
   * @returns {object | null}
   */
  #getScrollportRect() {
    if (this.#scrollportRect) {
      return this.#scrollportRect;
    }

    const holder = this.#deps.getWtTable().holder;

    if (!holder || !holder.parentNode) {
      return null;
    }

    const { top, right, bottom, left } = this.#deps.geometryReader.getBoundingClientRect(holder);

    this.#scrollportRect = { top, right, bottom, left };

    return this.#scrollportRect;
  }

  /**
   * Releases the pending fade-outs.
   */
  destroy(): void {
    (['horizontal', 'vertical'] as const).forEach((axis) => {
      if (this.#fadeTimeoutIds[axis]) {
        this.#deps.rootWindow.clearTimeout(this.#fadeTimeoutIds[axis]);
        this.#fadeTimeoutIds[axis] = 0;
      }
    });

    this.#scrollportRect = null;
  }
}
