/* eslint-disable jsdoc/require-description-complete-sentence */
import { KeysObserver } from './types';

/**
 * Create a key observer.
 *
 * @returns {object}
 */
export function createKeysObserver(): KeysObserver {
  const PRESSED_KEYS: Set<string> = new Set();

  return {
    /**
     * Press a key.
     *
     * @param {string} key Names of the shortcut's keys,
     * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
     * in lowercase or uppercase, unified across browsers
     */
    press(key: string): void {
      PRESSED_KEYS.add(key);
    },
    /**
     * Release a pressed key.
     *
     * @param {string} key Names of the shortcut's keys,
     * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
     * in lowercase or uppercase, unified across browsers
     */
    release(key: string): void {
      PRESSED_KEYS.delete(key);
    },
    /**
     * Release all pressed keys.
     */
    releaseAll(): void {
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
    isPressed(key: string): boolean {
      return PRESSED_KEYS.has(key);
    },
  };
}
