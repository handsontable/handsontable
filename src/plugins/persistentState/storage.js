import { arrayEach } from './../../helpers/array';

/**
 * @class Storage
 * @plugin PersistentState
 */
class Storage {
  constructor(prefix) {
    /**
     * Prefix for key (id element).
     *
     * @type {String}
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
   * @param {String} key Key string.
   * @param {Mixed} value Value to save.
   */
  saveValue(key, value) {
    window.localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify(value));

    if (this.savedKeys.indexOf(key) === -1) {
      this.savedKeys.push(key);
      this.saveSavedKeys();
    }
  }

  /**
   * Load data from localStorage.
   *
   * @param {String} key Key string.
   * @param {Object} defaultValue Object containing the loaded data.
   *
   * @returns {}
   */
  loadValue(key, defaultValue) {
    const itemKey = typeof key === 'undefined' ? defaultValue : key;
    const value = window.localStorage.getItem(`${this.prefix}_${itemKey}`);

    return value === null ? void 0 : JSON.parse(value);
  }

  /**
   * Reset given data from localStorage.
   *
   * @param {String} key Key string.
   */
  reset(key) {
    window.localStorage.removeItem(`${this.prefix}_${key}`);
  }

  /**
   * Reset all data from localStorage.
   *
   */
  resetAll() {
    arrayEach(this.savedKeys, (value, index) => {
      window.localStorage.removeItem(`${this.prefix}_${this.savedKeys[index]}`);
    });

    this.clearSavedKeys();
  }

  /**
   * Load and save all keys from localStorage.
   *
   * @private
   */
  loadSavedKeys() {
    const keysJSON = window.localStorage.getItem(`${this.prefix}__persistentStateKeys`);
    const keys = typeof keysJSON === 'string' ? JSON.parse(keysJSON) : void 0;

    this.savedKeys = keys || [];
  }

  /**
   * Save saved key in localStorage.
   *
   * @private
   */
  saveSavedKeys() {
    window.localStorage.setItem(`${this.prefix}__persistentStateKeys`, JSON.stringify(this.savedKeys));
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
