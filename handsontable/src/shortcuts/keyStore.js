/**
 * TODO description.
 *
 * @returns {object}
 */
export function createKeyStore() {
  const PRESSED_KEYS = new Set();

  return {
    press(key) {
      PRESSED_KEYS.add(key);
    },
    release(key) {
      PRESSED_KEYS.delete(key);
    },
    releaseAll() {
      PRESSED_KEYS.clear();
    },
    getPressed() {
      return [...PRESSED_KEYS.values()].sort();
    },
    isPressed(key) {
      return PRESSED_KEYS.has(key);
    },
  };
}
