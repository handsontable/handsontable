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
 *   is tinted while the frozen segments keep their own cells - two colors side by side down the strip
 *   (231,231,233 against 255,255,255), which reads as a different track over each overlay.
 * - clip closed while the band is part-way through its opacity: the strip shows the master's cell where
 *   the frozen content belongs, so a column header looks cut short along its last 16px.
 *
 * That rules out a fade-*out*: a fade-out is by definition a stretch of time when the band is not
 * opaque, and the clip must be either closed for all of it (the second defect) or open for it (the
 * first). So the track fades in and is then dropped outright - the one combination that shows neither.
 *
 * Deliberately cheap: the scrollport's rect is read once per scroll, page scroll or resize and never
 * per pointer move, the offsets it compares are scroll positions (which force no layout), and a change only ever
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
   * The pointer's last known position, so proximity can be re-checked when a band opens rather than
   * only when the pointer moves. A wheel-stop with the cursor already resting in the strip fires no
   * further move, and the browser keeps the hovered thumb up regardless.
   */
  #lastPointer: { x: number; y: number; rtl: boolean } | null = null;

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
   * Reports that the scrollport may have moved or changed size, so the cached rect is re-read on next
   * use. Called when the overlay elements are sized, and on a page scroll - the rect is in viewport
   * coordinates, so scrolling the page moves the grid without any of its own offsets changing.
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
   * @param {boolean} rtl Whether the grid runs right-to-left, which puts the vertical scrollbar on the
   * opposite edge.
   */
  notifyPointerMoved(clientX: number, clientY: number, rtl: boolean = false): void {
    // Recorded before the early return: the pointer may come to rest beside the scrollbar long before
    // anything opens a band, and that resting position is what decides the pin when one does.
    this.#lastPointer = { x: clientX, y: clientY, rtl };

    if (!this.#visible.horizontal && !this.#visible.vertical) {
      return;
    }

    const near = this.#proximity();

    if (!near) {
      return;
    }

    this.#setPinned('horizontal', near.bottom);
    this.#setPinned('vertical', near.inlineEnd);
  }

  /**
   * Reports that the pointer left the window, so nothing is holding a band open any more.
   *
   * Without this a pin could never be released: releasing it needs a move that says "no longer near",
   * and once the pointer is gone no more moves arrive - so the strip stayed painted indefinitely.
   */
  notifyPointerLeft(): void {
    this.#lastPointer = null;

    (['horizontal', 'vertical'] as const).forEach((axis) => {
      this.#setPinned(axis, false);
    });
  }

  /**
   * Which scrollbars the pointer is currently resting beside, from its last known position.
   *
   * @returns {{ bottom: boolean; inlineEnd: boolean } | null} Null when there is no pointer to judge.
   */
  #proximity(): { bottom: boolean; inlineEnd: boolean } | null {
    const pointer = this.#lastPointer;
    const rect = pointer ? this.#getScrollportRect() : null;

    if (!pointer || !rect) {
      return null;
    }

    // Inside the scrollport, with no outward tolerance. A pin has no timer behind it - it is released
    // by a move that says "no longer near", or by the pointer leaving the WINDOW - so anything counted
    // as near while the pointer rests outside the grid holds the band open indefinitely. With the
    // tolerance applied outwards, a cursor parked just below the grid did exactly that: the browser's
    // own thumb faded after about a second and the band stayed painted over the bottom row, swallowing
    // presses there with no scrollbar on screen to explain why. No browser keeps a thumb up for a
    // pointer that is not over the element, so neither should this.
    const withinX = pointer.x >= rect.left && pointer.x <= rect.right;
    const withinY = pointer.y >= rect.top && pointer.y <= rect.bottom;
    const inReach = withinX && withinY;

    return {
      bottom: inReach && pointer.y >= rect.bottom - OVERLAY_SCROLLBAR_PROXIMITY,
      // One edge only, and which one depends on direction. Testing both meant that in LTR a pointer
      // over the row headers - nowhere near the vertical scrollbar - pinned the right-hand band open.
      inlineEnd: inReach && (pointer.rtl
        ? pointer.x <= rect.left + OVERLAY_SCROLLBAR_PROXIMITY
        : pointer.x >= rect.right - OVERLAY_SCROLLBAR_PROXIMITY),
    };
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
    // Judged from where the pointer already is, not from a move that may never come. Stopping a wheel
    // scroll with the cursor resting in the strip fires no pointermove, so waiting for one closed the
    // band a second later underneath a thumb the browser was still drawing.
    const near = this.#proximity();

    if (near) {
      this.#pinned[axis] = axis === 'horizontal' ? near.bottom : near.inlineEnd;
    }

    if (this.#pinned[axis]) {
      // Disarm whatever an earlier show armed. This path assigns `#pinned` directly rather than going
      // through `#setPinned`, so nothing else cancels a fade that is already counting down - and a
      // scroll can pin an axis that was opened while the pointer was elsewhere (the pointer never
      // moved; the grid moved under it). Left armed, that timer closes the band a second later under
      // a thumb the browser is still drawing.
      this.#clearFade(axis);
    } else {
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
