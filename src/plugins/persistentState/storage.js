import { arrayEach } from '../../helpers/array';

/**
 * @class Storage
 * @plugin PersistentState
 */
class Storage {
  // eslint-disable-next-line no-restricted-globals
  constructor(prefix, rootWindow = window) {
    /**
     * Reference to proper window.
     *
     * @type {Window}
     */
    this.rootWindow = rootWindow;
    /**
     * Prefix for key (id element).
     *
     * @type {string}
     */
    this.prefix = prefix;

    /**
     * Saved keys.
     *
     * @type {Array}
     */
    this.savedKeys = [];
    this.loadSavedKeys();
  }

  /**
   * Save data to localStorage.
   *
   * @param {string} key Key string.
   * @param {Mixed} value Value to save.
   */
  saveValue(key, value) {
    this.rootWindow.localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify(value));

    if (this.savedKeys.indexOf(key) === -1) {
      this.savedKeys.push(key);
      this.saveSavedKeys();
    }
  }

  /**
   * Load data from localStorage.
   *
   * @param {string} key Key string.
   * @param {object} defaultValue Object containing the loaded data.
   *
   * @returns {object|undefined}
   */
  loadValue(key, defaultValue) {
    const itemKey = typeof key === 'undefined' ? defaultValue : key;
    const value = this.rootWindow.localStorage.getItem(`${this.prefix}_${itemKey}`);

    return value === null ? void 0 : JSON.parse(value);
  }

  /**
   * Reset given data from localStorage.
   *
   * @param {string} key Key string.
   */
  reset(key) {
    this.rootWindow.localStorage.removeItem(`${this.prefix}_${key}`);
  }

  /**
   * Reset all data from localStorage.
   *
   */
  resetAll() {
    arrayEach(this.savedKeys, (value, index) => {
      this.rootWindow.localStorage.removeItem(`${this.prefix}_${this.savedKeys[index]}`);
    });

    this.clearSavedKeys();
  }

  /**
   * Load and save all keys from localStorage.
   *
   * @private
   */
  loadSavedKeys() {
    const keysJSON = this.rootWindow.localStorage.getItem(`${this.prefix}__persistentStateKeys`);
    const keys = typeof keysJSON === 'string' ? JSON.parse(keysJSON) : void 0;

    this.savedKeys = keys || [];
  }

  /**
   * Save saved key in localStorage.
   *
   * @private
   */
  saveSavedKeys() {
    this.rootWindow.localStorage.setItem(`${this.prefix}__persistentStateKeys`, JSON.stringify(this.savedKeys));
  }

  /**
   * Clear saved key from localStorage.
   *
   * @private
   */
  clearSavedKeys() {
    this.savedKeys.length = 0;
    this.saveSavedKeys();
  }
}

export default Storage;
