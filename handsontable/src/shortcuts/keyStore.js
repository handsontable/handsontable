/**
 * TODO description.
 *
 * @returns {object}
 */
export function createKeyStore() {
  const PRESSED_KEYS = new Set();

  return {
    /**
     * 
     * @param {string} key 
     */
    press(key) {
      PRESSED_KEYS.add(key);
    },
    /**
     * 
     * @param {*} key 
     */
    release(key) {
      PRESSED_KEYS.delete(key);
    },
    /**
     * 
     */
    releaseAll() {
      PRESSED_KEYS.clear();
    },
    /**
     * 
     * @returns 
     */
    getPressed() {
      return [...PRESSED_KEYS.values()].sort();
    },
    /**
     * 
     * @param {*} key 
     * @returns 
     */
    isPressed(key) {
      return PRESSED_KEYS.has(key);
    },
  };
}
