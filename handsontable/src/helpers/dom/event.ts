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
 * A DOM event that carries a touch list.
 */
interface TouchListEvent extends Event {
  touches: ArrayLike<{ clientX: number; clientY: number }>;
}

/**
 * Narrows a DOM event to one that carries a touch list.
 *
 * Detects the list by property rather than with `instanceof TouchEvent`, so it also holds for an
 * event that crossed an iframe boundary - every frame has its own `TouchEvent` constructor - and on
 * desktop Safari, which does not expose `TouchEvent` at all. Use `isTouchEvent` when you need the
 * stricter same-frame check instead.
 *
 * @param {Event} event The event object.
 * @returns {boolean} `true` when the event carries a touch list.
 */
export function hasTouchList(event: Event): event is TouchListEvent {
  return 'touches' in event;
}

/**
 * Reads the viewport coordinates of a touch event's first touch point.
 *
 * @param {Event} event The event object.
 * @returns {object|null} The first touch point as `{clientX, clientY}`, or `null` when the event
 * carries no touch list or the list is empty, as it is on `touchend`.
 */
export function getFirstTouchPoint(event: Event): { clientX: number; clientY: number } | null {
  if (!hasTouchList(event) || event.touches.length === 0) {
    return null;
  }

  const { clientX, clientY } = event.touches[0];

  return { clientX, clientY };
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
