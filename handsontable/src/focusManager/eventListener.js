import { getParentWindow } from '../helpers/dom/element';

/**
 * An event listener, used for tracking focus-related and click events necessary for focus management.
 *
 * @param {Window} ownerWindow Current window object.
 * @param {object} hooks A callback functions.
 * @param {function(Event)} hooks.onFocus A callback function for focusin events.
 * @param {function(Event)} hooks.onClick A callback function for click events.
 * @param {function(Event)} hooks.onTabKeyDown A callback function for tab key down events.
 * @param {function(Event)} hooks.onTabKeyUp A callback function for tab key up events.
 * @returns {{mount: function(), unmount: function()}}
 */
export function useEventListener(ownerWindow, hooks = {}) {
  let mouseDown = false;

  /**
   * A callback function for focusin events.
   *
   * @param {Event} event The event object.
   */
  function handleFocus(event) {
    if (!mouseDown) {
      hooks.onFocus?.(event);
    }
  }

  /**
   * A callback function for click events.
   *
   * @param {Event} event The event object.
   */
  function handleClick(event) {
    hooks.onClick?.(event);
  }

  /**
   * A callback function for tab key down events.
   *
   * @param {Event} event The event object.
   */
  function handleKeyDown(event) {
    if (event.key === 'Tab') {
      hooks.onTabKeyDown?.(event);
    }
  }

  /**
   * A callback function for tab key up events.
   *
   * @param {Event} event The event object.
   */
  function handleKeyUp(event) {
    if (event.key === 'Tab') {
      hooks.onTabKeyUp?.(event);
    }
  }

  /**
   * A callback function for mouse down events.
   */
  function handleMouseDown() {
    mouseDown = true;
  }

  /**
   * A callback function for mouse up events.
   */
  function handleMouseUp() {
    mouseDown = false;
  }

  /**
   * A callback function for window focus events.
   *
   * @param {Event} event The event object.
   */
  function handleWindowFocus(event) {
    hooks.onWindowFocus?.(event);
  }

  /**
   * A callback function for window blur events.
   *
   * @param {Event} event The event object.
   */
  function handleWindowBlur(event) {
    hooks.onWindowBlur?.(event);
  }

  /**
   * Adds event listeners to the starting window and its parents' windows.
   */
  const mount = () => {
    let frameWindow = ownerWindow;

    while (frameWindow) {
      const { documentElement } = frameWindow.document;

      documentElement.addEventListener('focusin', handleFocus);
      documentElement.addEventListener('click', handleClick);
      documentElement.addEventListener('keydown', handleKeyDown);
      documentElement.addEventListener('keyup', handleKeyUp);
      documentElement.addEventListener('mousedown', handleMouseDown);
      documentElement.addEventListener('mouseup', handleMouseUp);
      frameWindow.addEventListener('focus', handleWindowFocus);
      frameWindow.addEventListener('blur', handleWindowBlur);
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

      documentElement.removeEventListener('focusin', handleFocus);
      documentElement.removeEventListener('click', handleClick);
      documentElement.removeEventListener('keydown', handleKeyDown);
      documentElement.removeEventListener('keyup', handleKeyUp);
      documentElement.removeEventListener('mousedown', handleMouseDown);
      documentElement.removeEventListener('mouseup', handleMouseUp);
      frameWindow.removeEventListener('focus', handleWindowFocus);
      frameWindow.removeEventListener('blur', handleWindowBlur);
      frameWindow = getParentWindow(frameWindow);
    }
  };

  return {
    mount,
    unmount,
  };
}
