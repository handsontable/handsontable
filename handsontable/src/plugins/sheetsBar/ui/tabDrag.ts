import { addClass, isHTMLElement, removeClass } from '../../../helpers/dom/element';
import type EventManager from '../../../eventManager';
import { computeDropIndex } from './dropIndex';

/**
 * The class the bar wears for the length of a drag. The stylesheet keys the grab cursor and the
 * muted hover states off it.
 *
 * @type {string}
 */
export const DRAGGING_CLASS = 'ht-sheets-bar-dragging';

/**
 * Pointer travel, in pixels, before a press on a tab becomes a drag. Below it the gesture stays
 * a click, so activating a sheet and opening the rename editor keep working with an unsteady
 * hand or a finger.
 *
 * @type {number}
 */
const DRAG_THRESHOLD = 4;

/**
 * Width, in pixels, of the band at each end of the strip that scrolls it while a tab is held
 * there. It is what lets a drag reach a tab that overflow has pushed out of sight.
 *
 * @type {number}
 */
const AUTO_SCROLL_ZONE = 48;

/**
 * The fastest the strip scrolls itself, in pixels per frame, reached at the very edge. Closer to
 * the middle of the band the speed tapers off, so a tab parked just inside it creeps rather than
 * bolts.
 *
 * @type {number}
 */
const AUTO_SCROLL_SPEED = 14;

/**
 * Reads how far a transform currently shifts an element along the x axis, in pixels.
 *
 * During the reorder animation the transition drives the transform, so the offset lives in the
 * computed style rather than in the inline one.
 *
 * @param {HTMLElement} element The element to read.
 * @returns {number} The current x translation, `0` for an untransformed element.
 */
function translationOf(element: HTMLElement): number {
  const view = element.ownerDocument.defaultView;
  const transform = view?.getComputedStyle(element).transform;

  if (!transform || transform === 'none') {
    return 0;
  }

  const matrix = transform.match(/matrix(3d)?\(([^)]+)\)/);

  if (!matrix) {
    return 0;
  }

  const values = matrix[2].split(',').map(parseFloat);

  return (matrix[1] === '3d' ? values[12] : values[4]) || 0;
}

/**
 * Drags a sheet tab along the strip, reordering the tabs under the pointer as it goes.
 *
 * The controller is presentation only: it shuffles DOM nodes so the strip always shows the
 * result, and on release reports the index the tab landed on. Committing that to the workbook —
 * and repainting from it — belongs to the plugin.
 */
export class TabDrag {
  /**
   * The tab strip element the tabs live in.
   */
  readonly #host: HTMLElement;
  /**
   * The element that wears the dragging class — the bar, so the cursor and the muted hover
   * states cover the whole of it and nothing outside it.
   */
  readonly #dragRoot: HTMLElement;
  /**
   * The plugin's event manager, which owns the document-level listeners of a gesture the way
   * it owns every other listener the plugin installs: they go when the plugin does.
   */
  readonly #eventManager: EventManager;
  /**
   * Reports a finished drag: the sheet that moved and the index it landed on.
   */
  readonly #onCommit: (id: number, toIndex: number) => void;
  /**
   * The tab being dragged, or `null` when no gesture is in progress.
   */
  #tab: HTMLElement | null = null;
  /**
   * The dragged sheet's id.
   */
  #id = -1;
  /**
   * The pointer id the live gesture belongs to. Events carrying any other id are ignored, so a
   * second pointer cannot hijack or abandon a gesture already in progress.
   */
  #pointerId = -1;
  /**
   * Pointer coordinate the gesture started at, used for the threshold and the offset.
   */
  #originX = 0;
  /**
   * Distance between the pointer and the tab's leading edge when the gesture started. Keeping it
   * constant is what makes the tab stay under the point it was grabbed by.
   */
  #grabOffset = 0;
  /**
   * The dragged tab's index when the gesture started, restored when the drag is cancelled.
   */
  #originIndex = 0;
  /**
   * Whether the gesture has passed the threshold and become a drag.
   */
  #isDragging = false;
  /**
   * The pointer coordinate the last move reported. The auto-scroll frames replay the drag from
   * it, because the content moves under a pointer that is standing still.
   */
  #lastClientX = 0;
  /**
   * Pixels per frame the strip is scrolling itself by, negative toward the start. Zero when the
   * pointer is away from both ends.
   */
  #scrollSpeed = 0;
  /**
   * Handle of the pending auto-scroll frame, or `0` when none is scheduled.
   */
  #frame = 0;

  /**
   * Binds the controller to a strip.
   *
   * @param {object} options The strip, the element that wears the dragging class, and the
   *   event manager the document listeners register with.
   * @param {Function} onCommit Called with the sheet id and the index it landed on.
   */
  constructor(
    options: { host: HTMLElement, dragRoot: HTMLElement, eventManager: EventManager },
    onCommit: (id: number, toIndex: number) => void,
  ) {
    this.#host = options.host;
    this.#dragRoot = options.dragRoot;
    this.#eventManager = options.eventManager;
    this.#onCommit = onCommit;
  }

  /**
   * Begins tracking a press on a tab. The gesture only becomes a drag once the pointer travels
   * past the threshold, so this is safe to call on every `pointerdown`.
   *
   * @param {PointerEvent} event The originating pointer event.
   * @param {HTMLElement} tab The tab element under the pointer.
   * @param {number} id The sheet id the tab represents.
   */
  start(event: PointerEvent, tab: HTMLElement, id: number): void {
    if (this.#tab) {
      return;
    }

    this.#tab = tab;
    this.#id = id;
    this.#pointerId = event.pointerId;
    this.#originX = event.clientX;
    this.#grabOffset = event.clientX - tab.getBoundingClientRect().left;
    this.#originIndex = this.#indexOf(tab);
    this.#isDragging = false;

    const ownerDocument = this.#host.ownerDocument;
    const view = ownerDocument.defaultView;

    this.#eventManager.addEventListener(ownerDocument, 'pointermove', this.#onPointerMove);
    this.#eventManager.addEventListener(ownerDocument, 'pointerup', this.#onPointerUp);
    this.#eventManager.addEventListener(ownerDocument, 'pointercancel', this.#onCancel);
    this.#eventManager.addEventListener(ownerDocument, 'keydown', this.#onKeyDown);
    this.#eventManager.addEventListener(tab, 'lostpointercapture', this.#onLostCapture);

    if (view) {
      this.#eventManager.addEventListener(view, 'blur', this.#onWindowBlur);
    }
  }

  /**
   * Whether a gesture has passed the threshold and is reordering the strip.
   *
   * @returns {boolean} `true` mid-drag.
   */
  isDragging(): boolean {
    return this.#isDragging;
  }

  /**
   * Stops any gesture in progress, restoring the original tab order, without detaching the
   * listeners. Safe to call whenever the host is about to be rebuilt out from under the
   * gesture — the listeners re-attach on the next `start()`.
   */
  abort(): void {
    this.#cancel();
  }

  /**
   * Stops any gesture in progress and detaches every listener.
   */
  destroy(): void {
    this.abort();
    this.#detach();
  }

  /**
   * Follows the pointer: starts the drag once past the threshold, then keeps the tab under the
   * pointer and the strip reordered around it.
   *
   * @param {PointerEvent} event The pointermove event.
   */
  #onPointerMove = (event: PointerEvent): void => {
    const tab = this.#tab;

    if (!tab || event.pointerId !== this.#pointerId) {
      return;
    }

    if (tab.parentNode !== this.#host) {
      this.#finish();

      return;
    }

    if (!this.#isDragging) {
      if (Math.abs(event.clientX - this.#originX) < DRAG_THRESHOLD) {
        return;
      }

      this.#isDragging = true;
      addClass(tab, 'ht-sheets-bar__tab--dragging');
      addClass(this.#dragRoot, DRAGGING_CLASS);
      tab.setPointerCapture?.(event.pointerId);
    }

    this.#lastClientX = event.clientX;

    this.#reorder(tab);
    this.#syncAutoScroll();
  };

  /**
   * Puts the tab in the slot the pointer is over and repaints it under the pointer.
   *
   * @param {HTMLElement} tab The dragged tab.
   */
  #reorder(tab: HTMLElement): void {
    // Measured with the follow offset off, so the slot the tab currently occupies is what the
    // drop index is computed from — not the position it was painted at.
    tab.style.transform = '';

    const tabs = this.#tabs();
    const lefts = new Map<HTMLElement, number>();
    const centers = tabs.map((element) => {
      const rect = element.getBoundingClientRect();

      lefts.set(element, rect.left);

      // The drop decision reads the slot a tab has settled in, not the point its slide
      // animation happens to be passing through. Right after a swap the displaced neighbour is
      // still travelling, its centre still near the pointer, and a pointer that wobbles a pixel
      // would swap it straight back — the strip then flickers between the two orders for as
      // long as the hand is unsteady. The in-flight translation is subtracted, so the swap
      // boundary stands still while the tabs animate around it.
      return (rect.left - translationOf(element)) + (rect.width / 2);
    });
    const target = computeDropIndex(centers, this.#lastClientX, tabs.indexOf(tab));

    if (target !== tabs.indexOf(tab)) {
      const reference = target > tabs.indexOf(tab) ? tabs[target].nextSibling : tabs[target];

      this.#host.insertBefore(tab, reference);
      this.#slideIntoPlace(lefts);
    }

    this.#follow(tab, this.#lastClientX);
  }

  /**
   * Scrolls the strip while the pointer is held near either end, so a drag can reach the tabs
   * overflow has pushed out of sight. The speed tapers off with the distance from the edge, and
   * each frame replays the drag, because the slots move under a pointer that is standing still.
   */
  #syncAutoScroll(): void {
    const rect = this.#host.getBoundingClientRect();
    const fromStart = this.#lastClientX - rect.left;
    const fromEnd = rect.right - this.#lastClientX;
    let speed = 0;

    if (fromStart < AUTO_SCROLL_ZONE) {
      speed = -this.#speedAt(fromStart);
    } else if (fromEnd < AUTO_SCROLL_ZONE) {
      speed = this.#speedAt(fromEnd);
    }

    this.#scrollSpeed = speed;

    if (speed !== 0 && this.#frame === 0) {
      this.#frame = this.#host.ownerDocument.defaultView?.requestAnimationFrame(this.#onFrame) ?? 0;
    }
  }

  /**
   * Returns how fast the strip scrolls for a pointer this far from the edge.
   *
   * @param {number} distance Distance from the edge, in pixels.
   * @returns {number} Pixels per frame, at least 1 anywhere inside the band.
   */
  #speedAt(distance: number): number {
    const depth = (AUTO_SCROLL_ZONE - Math.max(distance, 0)) / AUTO_SCROLL_ZONE;

    return Math.max(Math.round(depth * AUTO_SCROLL_SPEED), 1);
  }

  /**
   * Scrolls one frame's worth and replays the drag against the content's new position.
   */
  #onFrame = (): void => {
    this.#frame = 0;

    const tab = this.#tab;

    if (!tab || this.#scrollSpeed === 0 || tab.parentNode !== this.#host) {
      return;
    }

    const before = this.#host.scrollLeft;

    this.#host.scrollLeft = before + this.#scrollSpeed;

    if (this.#host.scrollLeft !== before) {
      this.#reorder(tab);
    }

    this.#frame = this.#host.ownerDocument.defaultView?.requestAnimationFrame(this.#onFrame) ?? 0;
  };

  /**
   * Stops the strip scrolling itself and drops any frame still pending.
   */
  #stopAutoScroll(): void {
    if (this.#frame !== 0) {
      this.#host.ownerDocument.defaultView?.cancelAnimationFrame(this.#frame);
    }

    this.#frame = 0;
    this.#scrollSpeed = 0;
  }

  /**
   * Slides the tabs the reorder displaced from where they were to where they now are.
   *
   * The reorder itself is a DOM move, which paints in one jump. Each displaced tab is put back
   * at its previous position with an untransitioned offset, then released — the browser animates
   * the way back, so the strip reads as tabs making room rather than snapping.
   *
   * @param {Map} previous The tabs' leading edges as they were before the reorder.
   */
  #slideIntoPlace(previous: Map<HTMLElement, number>): void {
    previous.forEach((left, element) => {
      if (element === this.#tab) {
        return;
      }

      const delta = left - element.getBoundingClientRect().left;

      if (delta === 0) {
        return;
      }

      element.style.transition = 'none';
      element.style.transform = `translateX(${delta}px)`;

      // Reading the geometry back flushes the offset above into the rendered frame. Without it
      // the two writes collapse into one and there is nothing to animate from.
      element.getBoundingClientRect();

      element.style.transition = '';
      element.style.transform = '';
    });
  }

  /**
   * Offsets the tab so it stays under the point it was grabbed by, clamped to the strip.
   *
   * @param {HTMLElement} tab The dragged tab.
   * @param {number} clientX The current pointer coordinate.
   */
  #follow(tab: HTMLElement, clientX: number): void {
    const rect = tab.getBoundingClientRect();
    const hostRect = this.#host.getBoundingClientRect();
    const wanted = clientX - this.#grabOffset;
    const left = Math.min(Math.max(wanted, hostRect.left), hostRect.right - rect.width);

    tab.style.transform = `translateX(${left - rect.left}px)`;
  }

  /**
   * Ends the gesture, reporting the move when the tab changed slot.
   */
  #onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId) {
      return;
    }

    const tab = this.#tab;
    const wasDragging = this.#isDragging;
    const landed = tab ? this.#indexOf(tab) : this.#originIndex;
    const id = this.#id;

    this.#finish();

    if (wasDragging && landed !== this.#originIndex) {
      this.#onCommit(id, landed);
    }
  };

  /**
   * Aborts the gesture on Escape, putting the strip back the way it was.
   *
   * @param {KeyboardEvent} event The keydown event.
   */
  #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.#cancel();
    }
  };

  /**
   * Aborts the gesture when the browser takes the pointer away — a `pointercancel`, or the
   * capture lost to a pointer released over another document.
   */
  #onCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId) {
      return;
    }

    this.#cancel();
  };

  /**
   * Keeps hold of the pointer, or gives the gesture up when it is gone for good.
   *
   * Moving the tab to another slot re-inserts it into the strip, and a re-inserted element
   * loses its pointer capture — so the capture is taken again, and the gesture goes on. When
   * the pointer itself is no longer active — released over another document, say — taking it
   * again fails, and no release will ever reach the strip: the gesture is cancelled instead.
   *
   * @param {PointerEvent} event The lostpointercapture event.
   */
  #onLostCapture = (event: PointerEvent): void => {
    const tab = this.#tab;

    if (!tab || event.pointerId !== this.#pointerId || !this.#isDragging) {
      return;
    }

    if (tab.parentNode === this.#host) {
      try {
        tab.setPointerCapture(event.pointerId);

        return;
      } catch {
        // The pointer is gone; fall through to the cancel.
      }
    }

    this.#cancel();
  };

  /**
   * Aborts the gesture when the window loses focus mid-drag, since no release will ever reach
   * the document then.
   */
  #onWindowBlur = (): void => {
    this.#cancel();
  };

  /**
   * Restores the original order and ends the gesture without reporting anything.
   */
  #cancel(): void {
    const tab = this.#tab;

    if (tab && this.#isDragging && tab.parentNode === this.#host) {
      const tabs = this.#tabs().filter(element => element !== tab);

      this.#host.insertBefore(tab, tabs[this.#originIndex] ?? null);
    }

    this.#finish();
  }

  /**
   * Clears the drag state and its visual marker.
   */
  #finish(): void {
    this.#stopAutoScroll();

    if (this.#tab) {
      removeClass(this.#tab, 'ht-sheets-bar__tab--dragging');
      this.#tab.style.transform = '';
      this.#eventManager.removeEventListener(this.#tab, 'lostpointercapture', this.#onLostCapture as EventListener);
    }

    removeClass(this.#dragRoot, DRAGGING_CLASS);

    this.#tab = null;
    this.#pointerId = -1;
    this.#isDragging = false;
    this.#detach();
  }

  /**
   * Detaches the document-level listeners the gesture installed.
   */
  #detach(): void {
    const ownerDocument = this.#host.ownerDocument;
    const view = ownerDocument.defaultView;

    this.#eventManager.removeEventListener(ownerDocument, 'pointermove', this.#onPointerMove as EventListener);
    this.#eventManager.removeEventListener(ownerDocument, 'pointerup', this.#onPointerUp as EventListener);
    this.#eventManager.removeEventListener(ownerDocument, 'pointercancel', this.#onCancel as EventListener);
    this.#eventManager.removeEventListener(ownerDocument, 'keydown', this.#onKeyDown as EventListener);

    if (view) {
      this.#eventManager.removeEventListener(view, 'blur', this.#onWindowBlur);
    }
  }

  /**
   * Returns the tabs currently in the strip, in DOM order.
   *
   * @returns {HTMLElement[]} The tab elements.
   */
  #tabs(): HTMLElement[] {
    return Array.from(this.#host.children).filter(isHTMLElement);
  }

  /**
   * Returns a tab's index in the strip.
   *
   * @param {HTMLElement} tab The tab to locate.
   * @returns {number} Its index in DOM order.
   */
  #indexOf(tab: HTMLElement): number {
    return this.#tabs().indexOf(tab);
  }
}
