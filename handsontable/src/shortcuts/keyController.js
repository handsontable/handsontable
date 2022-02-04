/**
 * Create keys' controller.
 *
 * @returns {object}
 */
export function createKeysController() {
  const PRESSED_KEYS = new Set();

  return {
    /**
     * Press the given key.
     *
     * @param {string} key Key name based on `KeyboardEvent.key`.
     */
    press(key) {
      PRESSED_KEYS.add(key);
    },
    /**
     * Press the given key.
     *
     * @param {string} key Key name based on `KeyboardEvent.key`.
     */
    release(key) {
      PRESSED_KEYS.delete(key);
    },
    /**
     * Release all pressed keys.
     */
    releaseAll() {
      PRESSED_KEYS.clear();
    },
    /**
     * Check if the given key is pressed.
     *
     * @param {string} key Key name based on `KeyboardEvent.key`.
     * @returns {boolean}
     */
    isPressed(key) {
      return PRESSED_KEYS.has(key);
    },
  };
}
