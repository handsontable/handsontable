import { getParentWindow } from '../helpers/dom/element';

/**
 * A focus listener, used for tracking focus-related and click events.
 *
 * @param {Window} ownerWindow Current window object.
 * @param {object} hooks A callback functions.
 * @param {Function} hooks.onFocus A callback function for focusin events.
 * @param {Function} hooks.onClick A callback function for click events.
 * @param {Function} hooks.onKeyDown A callback function for keydown events.
 * @returns {object}
 */
export function useListener(ownerWindow, hooks = {}) {
  /**
   * Adds event listeners to the starting window and its parents' windows.
   */
  const mount = () => {
    let frameWindow = ownerWindow;

    while (frameWindow) {
      const { documentElement } = frameWindow.document;

      documentElement.addEventListener('focusin', (event) => hooks?.onFocus(event));
      documentElement.addEventListener('click', (event) => hooks?.onClick(event));
      documentElement.addEventListener('keydown', (event) => hooks?.onKeyDown(event));
      frameWindow = getParentWindow(frameWindow);
    }
  };

  /**
   * Removes event listeners from the starting window and its parents' windows.
   */
  const unmount = () => {
    let frameWindow = ownerWindow;

    while (frameWindow) {
      const { documentElement } = frameWindow.document;

      documentElement.removeEventListener('focusin', (event) => hooks?.onFocus(event));
      documentElement.removeEventListener('click', (event) => hooks?.onClick(event));
      documentElement.removeEventListener('keydown', (event) => hooks?.onKeyDown(event));
      frameWindow = getParentWindow(frameWindow);
    }
  };

  return {
    mount,
    unmount,
  };
}
