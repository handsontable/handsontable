import { isHTMLElement } from './element';

/**
 * Prevent other listeners of the same event from being called.
 *
 * @param {Event} event The mouse event object.
 */
export function stopImmediatePropagation(event: Event & { isImmediatePropagationEnabled?: boolean }): void {
  event.isImmediatePropagationEnabled = false;
  event.cancelBubble = true;
}

/**
 * Check if event was stopped by `stopImmediatePropagation`.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isImmediatePropagationStopped(event: Event & { isImmediatePropagationEnabled?: boolean }): boolean {
  return event.isImmediatePropagationEnabled === false;
}

/**
 * Check if provided event was triggered by clicking the right mouse button.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isRightClick(event: MouseEvent): boolean {
  return event.button === 2;
}

/**
 * Check if provided event was triggered by clicking the left mouse button.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isLeftClick(event: MouseEvent): boolean {
  return event.button === 0;
}

/**
 * Check if the provided event is a touch event.
 *
 * @param {Event} event The event object.
 * @returns {boolean}
 */
export function isTouchEvent(event: Event): boolean {
  return event instanceof TouchEvent;
}

/**
 * Calculates the event offset until reaching the element defined by `relativeElement` argument.
 *
 * @param {Event} event The mouse event object.
 * @param {HTMLElement|undefined} [untilElement] The element to which the offset will be calculated.
 * @returns {{ x: number, y: number }}
 */
export function offsetRelativeTo(event: MouseEvent | TouchEvent, untilElement?: HTMLElement): { x: number, y: number } {
  const offset = {
    x: 0,
    y: 0,
  };
  
  if (event instanceof MouseEvent) {
    offset.x = event.offsetX;
    offset.y = event.offsetY;
  }
  
  const target = event.target;
  
  if (!(target instanceof HTMLElement) || 
      !untilElement ||
      target !== untilElement && target.contains(untilElement)) {
    return offset;
  }

  let element: HTMLElement = target;

  while (element !== untilElement) {
    offset.x += element.offsetLeft;
    offset.y += element.offsetTop;

    const parent = element.offsetParent;
    if (!(parent instanceof HTMLElement)) {
      break;
    }
    element = parent;
  }

  return offset;
}
