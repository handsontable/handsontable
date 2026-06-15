
/**
 * Create a key observer.
 *
 * @returns {object}
 */
export function createKeysObserver() {
  const PRESSED_KEYS = new Set();

  return {
    /**
     * Press a key.
     *
     * @param {string} key Names of the shortcut's keys,
     * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
     * in lowercase or uppercase, unified across browsers
     */
    press(key: string) {
      PRESSED_KEYS.add(key);
    },
    /**
     * Release a pressed key.
     *
     * @param {string} key Names of the shortcut's keys,
     * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
     * in lowercase or uppercase, unified across browsers
     */
    release(key: string) {
      PRESSED_KEYS.delete(key);
    },
    /**
     * Release all pressed keys.
     */
    releaseAll() {
      PRESSED_KEYS.clear();
    },
    /**
     * Check if a key is pressed.
     *
     * @param {string} key Names of the shortcut's keys,
     * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
     * in lowercase or uppercase, unified across browsers
     * @returns {boolean}
     */
    isPressed(key: string) {
      return PRESSED_KEYS.has(key);
    },
  };
}
