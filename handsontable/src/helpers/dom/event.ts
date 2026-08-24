import { eventTargetEl, isHTMLElement } from './element';

/**
 * Prevent other listeners of the same event from being called.
 *
 * @param {Event} event The mouse event object.
 */
export function stopImmediatePropagation(event: Event): void {
  (event as Event & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;
  event.cancelBubble = true;
}

/**
 * Check if event was stopped by `stopImmediatePropagation`.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isImmediatePropagationStopped(event: Event): boolean {
  return (event as Event & { isImmediatePropagationEnabled?: boolean }).isImmediatePropagationEnabled === false;
}

/**
 * Check if provided event was triggered by clicking the right mouse button.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isRightClick(event: Event): boolean {
  return (event as MouseEvent).button === 2;
}

/**
 * Check if provided event was triggered by clicking the left mouse button.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isLeftClick(event: Event): boolean {
  return (event as MouseEvent).button === 0;
}

/**
 * Check if provided event was triggered by clicking the middle mouse button (the scroll wheel).
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isMiddleClick(event: Event): boolean {
  return (event as MouseEvent).button === 1;
}

/**
 * Check if the provided event is a touch event.
 *
 * @param {Event} event The event object.
 * @returns {boolean}
 */
export function isTouchEvent(event: Event): boolean {
  return typeof TouchEvent !== 'undefined' && event instanceof TouchEvent;
}

/**
 * One finger, as a touch event reports it.
 */
export interface TouchPoint {
  identifier: number;
  clientX: number;
  clientY: number;
}

/**
 * A DOM event that carries touch lists.
 *
 * `touches` is every finger currently on the screen, in the order they were placed. `changedTouches`
 * is only the fingers this particular event is about - the ones that landed, moved, lifted or were
 * cancelled.
 */
export interface TouchListEvent extends Event {
  touches: ArrayLike<TouchPoint>;
  changedTouches: ArrayLike<TouchPoint>;
}

/**
 * Narrows a DOM event to one that carries touch lists.
 *
 * Detects them by property rather than with `instanceof TouchEvent`, so it also holds for an event
 * that crossed an iframe boundary - every frame has its own `TouchEvent` constructor - and on
 * desktop Safari, which does not expose `TouchEvent` at all. Use `isTouchEvent` when you need the
 * stricter same-frame check instead.
 *
 * @param {Event} event The event object.
 * @returns {boolean} `true` when the event carries touch lists.
 */
export function hasTouchList(event: Event): event is TouchListEvent {
  return 'touches' in event && 'changedTouches' in event;
}

/**
 * Reads the finger a touch event is about - the first of its `changedTouches`.
 *
 * Use this on `touchstart` to learn which finger began a gesture, and keep the returned
 * `identifier` to follow that same finger through `getTouchPointById()`. Reading `touches[0]`
 * instead would give the first finger placed *anywhere* on the screen, which is a different finger
 * as soon as one was already resting there.
 *
 * @param {Event} event The event object.
 * @returns {object|null} The finger as `{identifier, clientX, clientY}`, or `null` when the event
 * carries no touch lists or names no changed finger.
 */
export function getFirstChangedTouch(event: Event): TouchPoint | null {
  if (!hasTouchList(event) || event.changedTouches.length === 0) {
    return null;
  }

  const { identifier, clientX, clientY } = event.changedTouches[0];

  return { identifier, clientX, clientY };
}

/**
 * Reads where one specific finger currently is.
 *
 * Looks the finger up in `touches`, which holds only the fingers still on the screen. A `null`
 * result therefore answers two questions at once: where is my finger, and is it still down? That is
 * what makes it the right test for ending a gesture on `touchend` and `touchcancel` - both fire once
 * per finger, so "some finger lifted" is never the same question as "my finger lifted".
 *
 * @param {Event} event The event object.
 * @param {number} identifier The `Touch.identifier` to look for.
 * @returns {object|null} The finger as `{identifier, clientX, clientY}`, matching
 * `getFirstChangedTouch()`, or `null` when it is no longer touching the screen.
 */
export function getTouchPointById(event: Event, identifier: number): TouchPoint | null {
  if (!hasTouchList(event)) {
    return null;
  }

  for (let i = 0; i < event.touches.length; i++) {
    const touch = event.touches[i];

    if (touch.identifier === identifier) {
      return { identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY };
    }
  }

  return null;
}

/**
 * Calculates the event offset until reaching the element defined by `relativeElement` argument.
 *
 * @param {Event} event The mouse event object.
 * @param {HTMLElement|undefined} [untilElement] The element to which the offset will be calculated.
 * @returns {{ x: number, y: number }}
 */
export function offsetRelativeTo(event: Event, untilElement: HTMLElement | undefined): { x: number, y: number } {
  const offset = {
    x: (event as MouseEvent).offsetX,
    y: (event as MouseEvent).offsetY,
  };
  let element = eventTargetEl(event)!;

  if (!isHTMLElement(untilElement) ||
      element !== untilElement && element.contains(untilElement)) {
    return offset;
  }

  while (element !== untilElement) {
    offset.x += element.offsetLeft;
    offset.y += element.offsetTop;

    element = element.offsetParent as HTMLElement;
  }

  return offset;
}
