import { getParentWindow } from '../helpers/dom/element';

/**
 * An event listener, used for tracking focus-related and click events necessary for focus management.
 *
 * @param {Window} ownerWindow Current window object.
 * @param {object} hooks A callback functions.
 * @param {function(Event)} hooks.onFocus A callback function for focusin events.
 * @param {function(Event)} hooks.onClick A callback function for click events.
 * @param {function(Event)} hooks.onTabKeyDown A callback function for tab key down events.
 * @returns {{mount: function(), unmount: function()}}
 */
export function useEventListener(ownerWindow: Window, hooks: {
  onFocus?: (event: Event) => void;
  onClick?: (event: Event) => void;
  onTabKeyDown?: (event: Event) => void;
} = {}) {
  let mouseDown = false;

  /**
   * A callback function for focusin events.
   *
   * @param {Event} event The event object.
   */
  function handleFocus(event: Event) {
    if (!mouseDown) {
      hooks.onFocus?.(event);
    }
  }

  /**
   * A callback function for click events.
   *
   * @param {Event} event The event object.
   */
  function handleClick(event: Event) {
    hooks.onClick?.(event);
  }

  /**
   * A callback function for tab key down events.
   *
   * @param {Event} event The event object.
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      hooks.onTabKeyDown?.(event);
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
   * Adds event listeners to the starting window and its parents' windows.
   */
  const mount = () => {
    let frameWindow: Window | null = ownerWindow;

    while (frameWindow) {
      const { documentElement } = frameWindow.document;

      documentElement.addEventListener('focusin', handleFocus);
      documentElement.addEventListener('click', handleClick);
      documentElement.addEventListener('keydown', handleKeyDown);
      documentElement.addEventListener('mousedown', handleMouseDown);
      documentElement.addEventListener('mouseup', handleMouseUp);
      frameWindow = getParentWindow(frameWindow);
    }
  };

  /**
   * Removes event listeners from the starting window and its parents' windows.
   */
  const unmount = () => {
    let frameWindow: Window | null = ownerWindow;

    while (frameWindow) {
      const { documentElement } = frameWindow.document;

      documentElement.removeEventListener('focusin', handleFocus);
      documentElement.removeEventListener('click', handleClick);
      documentElement.removeEventListener('keydown', handleKeyDown);
      documentElement.removeEventListener('mousedown', handleMouseDown);
      documentElement.removeEventListener('mouseup', handleMouseUp);
      frameWindow = getParentWindow(frameWindow);
    }
  };

  return {
    mount,
    unmount,
  };
}
