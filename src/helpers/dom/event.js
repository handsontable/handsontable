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
 * Get the parent element of the provided event. Useful, when `event.target.parentElement` returns `null` after it's
 * been freshly added to DOM.
 *
 * @param {Event} event The event to get the target's parent from.
 * @returns {HTMLElement|null} The parent of the `target` element or `null`, if it doesn't have any parents.
 */
export function getTargetParent(event) {
  let targetParent = event.target.parentElement;

  if (!targetParent && event.composedPath) {
    targetParent = event.composedPath()[1] || null;
  }

  return targetParent;
}
