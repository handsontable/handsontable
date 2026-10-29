import { addClass, isHTMLElement, removeClass } from '../../../helpers/dom/element';
import type EventManager from '../../../eventManager';
import { LongPressDetector, type LongPressTimers } from '../../../helpers/dom/longPress';
import { computeDropIndex } from './dropIndex';

/**
 * The class the bar wears for the length of a drag. The stylesheet keys the grab cursor and the
 * muted hover states off it.
 *
 * @type {string}
 */
export const DRAGGING_CLASS = 'ht-sheets-bar-dragging';

/**
 * The class the bar wears from the moment a tab is pressed, before the drag threshold. The
 * stylesheet keys the grab cursor off it, so the hand closes on press-down rather than on the
 * first move — the UX review asked for the cursor a beat earlier than the drag itself.
 *
 * @type {string}
 */
export const PRESSING_CLASS = 'ht-sheets-bar-pressing';

/**
 * The class a tab wears once a touch press has held it long enough to drag it.
 *
 * @type {string}
 */
export const LIFTED_CLASS = 'ht-sheets-bar__tab--lifted';

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
export function translationOf(element: HTMLElement): number {
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
   * Called once when a press passes the threshold and becomes a drag.
   */
  readonly #onDragStart: () => void;
  /**
   * Called with the sheet id when a touch press was held long enough to lift the tab and then let
   * go without moving: the strip opens the tab's menu.
   */
  readonly #onHoldRelease: (id: number) => void;
  /**
   * Times a touch press, the way the grid's cells time theirs: a swipe before the hold runs out
   * is a scroll of the strip, a hold lifts the tab for a drag.
   */
  readonly #longPress: LongPressDetector;
  /**
   * Whether the press in progress comes from a finger or a pen, which must hold the tab before it
   * drags, rather than from a mouse, which drags at once.
   */
  #isTouchPress = false;
  /**
   * Whether the touch press in progress was held long enough to lift the tab.
   */
  #isLifted = false;
  /**
   * Where a touch press is while it times its hold, horizontally. The hold allows the finger to
   * drift, and the drag measures its threshold from this point once the tab lifts.
   */
  #holdX = 0;
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
   * constant is what makes the tab stay under the point it was grabbed by. The edge is the tab's
   * resting one: a tab still sliding (a FLIP, or a new tab's entrance) is measured without its
   * in-flight translation, because the drag stops the slide and the tab then jumps to rest.
   */
  #grabOffset = 0;
  /**
   * The dragged tab's index when the gesture started, restored when the drag is canceled.
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
   * @param {object} options The strip, the element that wears the dragging class, the event
   *   manager the document listeners register with, and an optional drag-start callback.
   * @param {Function} onCommit Called with the sheet id and the index it landed on.
   */
  constructor(
    options: {
      host: HTMLElement,
      dragRoot: HTMLElement,
      eventManager: EventManager,
      onDragStart?: () => void,
      timers?: LongPressTimers,
      onHoldRelease?: (id: number) => void,
    },
    onCommit: (id: number, toIndex: number) => void,
  ) {
    this.#host = options.host;
    this.#dragRoot = options.dragRoot;
    this.#eventManager = options.eventManager;
    this.#onDragStart = options.onDragStart ?? (() => {});
    this.#onHoldRelease = options.onHoldRelease ?? (() => {});
    this.#onCommit = onCommit;
    this.#longPress = new LongPressDetector({
      timers: options.timers ?? (options.host.ownerDocument.defaultView as unknown as LongPressTimers),
      onLongPress: () => this.#lift(),
    });
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
    this.#grabOffset = event.clientX - (tab.getBoundingClientRect().left - translationOf(tab));
    this.#originIndex = this.#indexOf(tab);
    this.#isDragging = false;

    addClass(this.#dragRoot, PRESSING_CLASS);

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

    this.#detachTouch();
    this.#isTouchPress = event.pointerType === 'touch' || event.pointerType === 'pen';

    if (this.#isTouchPress) {
      this.#eventManager.addEventListener(this.#host, 'touchmove', this.#onTouchMove, { passive: false });
      this.#eventManager.addEventListener(this.#host, 'touchend', this.#onTouchEnd, { passive: false });
      this.#eventManager.addEventListener(this.#host, 'touchcancel', this.#onTouchCancel);
      this.#holdX = event.clientX;
      this.#longPress.start(event.clientX, event.clientY);
    }
  }

  /**
   * Whether a primary-button press on a tab is held: from `start()` until the pointer is lifted
   * or the press is canceled, wherever that happens on the page.
   *
   * @returns {boolean} `true` while a press is tracked.
   */
  isPressing(): boolean {
    return this.#tab !== null;
  }

  /**
   * Whether the press in progress is a finger or a pen on a tab. Such a press decides what it is by
   * how long it is held: a `contextmenu` the browser raises during it is not the menu's opener.
   *
   * @returns {boolean} `true` while a touch press is tracked.
   */
  isTouchPressing(): boolean {
    return this.#tab !== null && this.#isTouchPress;
  }

  /**
   * The tab a press holds before it became a drag: a mouse press under the drag threshold, or a
   * touch press timing its hold or lifted. A repaint that keeps this tab where it was can leave
   * the press alone.
   *
   * @returns {HTMLElement | null} The pressed tab, or `null` with no press or mid-drag.
   */
  heldTab(): HTMLElement | null {
    return this.#isDragging ? null : this.#tab;
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
    this.#detachTouch();
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

    if (this.#isTouchPress && !this.#isLifted) {
      if (this.#longPress.move(event.clientX, event.clientY)) {
        this.#finish();
      } else {
        this.#holdX = event.clientX;
      }

      return;
    }

    if (!this.#isDragging) {
      if (Math.abs(event.clientX - this.#originX) < DRAG_THRESHOLD) {
        return;
      }

      this.#isDragging = true;
      this.#onDragStart();
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
      // animation happens to be passing through. Right after a swap the displaced neighbor is
      // still traveling, its center still near the pointer, and a pointer that wobbles a pixel
      // would swap it straight back — the strip then flickers between the two orders for as
      // long as the hand is unsteady. The in-flight translation is subtracted, so the swap
      // boundary stands still while the tabs animate around it.
      return (rect.left - translationOf(element)) + (rect.width / 2);
    });
    const from = tabs.indexOf(tab);
    const target = computeDropIndex(centers, this.#lastClientX, from);

    if (target !== from) {
      this.#moveAround(tab, tabs, from, target);
      this.#slideIntoPlace(lefts);
    }

    this.#follow(tab, this.#lastClientX);
  }

  /**
   * Brings the dragged tab to `target` by moving the tabs it passes, never the tab itself.
   *
   * A re-inserted element loses its pointer capture, and taking the capture back from the
   * `lostpointercapture` handler crashes the desktop WebKit content process. Moving the
   * neighbors keeps the dragged tab in place in the DOM, so its capture is never lost.
   *
   * @param {HTMLElement} tab The dragged tab.
   * @param {HTMLElement[]} tabs The tabs in DOM order.
   * @param {number} from The dragged tab's current index.
   * @param {number} target The index the dragged tab moves to.
   */
  #moveAround(tab: HTMLElement, tabs: HTMLElement[], from: number, target: number): void {
    if (target > from) {
      tabs.slice(from + 1, target + 1).forEach(element => this.#host.insertBefore(element, tab));

      return;
    }

    const reference = tab.nextSibling;

    tabs.slice(target, from).forEach(element => this.#host.insertBefore(element, reference));
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
    const wasHeld = this.#isLifted && !wasDragging;
    const landed = tab ? this.#indexOf(tab) : this.#originIndex;
    const id = this.#id;

    this.#finish();

    if (wasDragging && landed !== this.#originIndex) {
      this.#onCommit(id, landed);
    } else if (wasHeld) {
      this.#onHoldRelease(id);
    }
  };

  /**
   * Lifts the tab a touch press has held long enough: from now on the finger drags it. The drag
   * threshold and the grab offset start from where the finger rests now, not where it landed, so
   * the drift the hold allowed does not count as the start of a drag.
   */
  #lift(): void {
    if (this.#tab === null) {
      return;
    }

    this.#originX = this.#holdX;
    this.#grabOffset = this.#holdX - (this.#tab.getBoundingClientRect().left - translationOf(this.#tab));
    this.#isLifted = true;
    addClass(this.#tab, LIFTED_CLASS);
  }

  /**
   * Keeps the browser from panning the strip under a lifted tab. The strip lets the browser pan it
   * before the hold runs out, which is how a swipe scrolls the tabs; once the tab is lifted, the
   * finger's moves are the drag's.
   *
   * @param {TouchEvent} event The `touchmove` event.
   */
  #onTouchMove = (event: TouchEvent): void => {
    if (this.#tab !== null && this.#isLifted && event.cancelable) {
      event.preventDefault();
    }
  };

  /**
   * Ends a held touch press without the mouse events the browser would send for it, so a `click`
   * does not land on the tab after its menu opened or its drag ended. The listeners stay until no
   * finger is left on the screen: a second finger lifting first is not the end of the press.
   *
   * @param {TouchEvent} event The `touchend` event.
   */
  #onTouchEnd = (event: TouchEvent): void => {
    if (this.#isLifted && event.cancelable) {
      event.preventDefault();
    }

    if (event.touches.length === 0) {
      this.#detachTouch();
    }
  };

  /**
   * Drops the touch state when the browser cancels the touches, which sends no `touchend`.
   *
   * @param {TouchEvent} event The `touchcancel` event.
   */
  #onTouchCancel = (event: TouchEvent): void => {
    if (event.touches.length === 0) {
      this.#detachTouch();
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
   * Gives the gesture up when the browser takes the pointer capture away mid-drag.
   *
   * A reorder never moves the dragged tab itself (`#moveAround`), so the capture is lost only
   * when the pointer is gone for good — released over another document, say — and no release
   * will ever reach the strip.
   *
   * The event bubbles, and a touch press captures the pointer on the element under the finger,
   * often the tab's label. Taking the capture onto the tab when the drag starts makes the label
   * lose it, so only a loss on the tab itself ends the gesture.
   *
   * @param {PointerEvent} event The lostpointercapture event.
   */
  #onLostCapture = (event: PointerEvent): void => {
    if (!this.#tab || event.target !== this.#tab || event.pointerId !== this.#pointerId || !this.#isDragging) {
      return;
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

    this.#longPress.reset();

    if (!this.#isLifted) {
      this.#detachTouch();
    }

    if (this.#tab) {
      removeClass(this.#tab, ['ht-sheets-bar__tab--dragging', LIFTED_CLASS]);
      this.#tab.style.transform = '';
      this.#eventManager.removeEventListener(this.#tab, 'lostpointercapture', this.#onLostCapture as EventListener);
    }

    removeClass(this.#dragRoot, DRAGGING_CLASS);
    removeClass(this.#dragRoot, PRESSING_CLASS);

    this.#tab = null;
    this.#pointerId = -1;
    this.#isDragging = false;
    this.#detach();
  }

  /**
   * Detaches the listeners a touch press installed on the strip, once the browser has dispatched
   * the `touchend` that ends it (a `pointerup` comes first, and the `touchend` still has to be
   * canceled after a held press).
   */
  #detachTouch(): void {
    this.#isTouchPress = false;
    this.#isLifted = false;
    this.#eventManager.removeEventListener(this.#host, 'touchmove', this.#onTouchMove as EventListener);
    this.#eventManager.removeEventListener(this.#host, 'touchend', this.#onTouchEnd as EventListener);
    this.#eventManager.removeEventListener(this.#host, 'touchcancel', this.#onTouchCancel as EventListener);
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
    return Array.from(this.#host.children)
      .filter(isHTMLElement)
      .filter(element => element.classList.contains('ht-sheets-bar__tab'));
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
