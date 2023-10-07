/**
 * Prevent other listeners of the same event from being called.
 *
 * @param {Event} event The mouse event object.
 */
export function stopImmediatePropagation(event) {
  event.isImmediatePropagationEnabled = false;
  event.cancelBubble = true;
}

/**
 * Check if event was stopped by `stopImmediatePropagation`.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isImmediatePropagationStopped(event) {
  return event.isImmediatePropagationEnabled === false;
}

/**
 * Check if provided event was triggered by clicking the right mouse button.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isRightClick(event) {
  return event.button === 2;
}

/**
 * Check if provided event was triggered by clicking the left mouse button.
 *
 * @param {Event} event The mouse event object.
 * @returns {boolean}
 */
export function isLeftClick(event) {
  return event.button === 0;
}

/**
 * Calculates the event offset until reaching the element defined by `relativeElement` argument.
 *
 * @param {Event} event The mouse event object.
 * @param {HTMLElement|undefined} [untilElement] The element to which the offset will be calculated.
 * @returns {{ x: number, y: number }}
 */
export function offsetRelativeTo(event, untilElement) {
  let element = event.target;
  const isRtl = window.getComputedStyle(element).direction === 'rtl'; // eslint-disable-line
  const offset = {
    x: isRtl ? element.offsetWidth - event.offsetX : event.offsetX,
    y: event.offsetY,
  };

  if (!(untilElement instanceof HTMLElement) ||
      element !== untilElement && element.contains(untilElement)) {
    return offset;
  }

  while (element !== untilElement) {
    if (isRtl) {
      offset.x += (element.offsetParent.offsetWidth - element.offsetWidth - element.offsetLeft);
    } else {
      offset.x += element.offsetLeft;
    }

    offset.y += element.offsetTop;
    element = element.offsetParent;
  }

  if (offset.x < 0) {
    offset.x = 0;
  }
  if (offset.y < 0) {
    offset.y = 0;
  }

  return offset;
}
