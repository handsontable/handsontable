var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { arrayEach } from './../../helpers/array';

/**
 * @class Storage
 * @plugin PersistentState
 */

var Storage = function () {
  function Storage(prefix) {
    _classCallCheck(this, Storage);

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


  _createClass(Storage, [{
    key: 'saveValue',
    value: function saveValue(key, value) {
      window.localStorage.setItem(this.prefix + '_' + key, JSON.stringify(value));

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

  }, {
    key: 'loadValue',
    value: function loadValue(key, defaultValue) {
      var itemKey = typeof key === 'undefined' ? defaultValue : key;
      var value = window.localStorage.getItem(this.prefix + '_' + itemKey);

      return value === null ? void 0 : JSON.parse(value);
    }

    /**
     * Reset given data from localStorage.
     *
     * @param {String} key Key string.
     */

  }, {
    key: 'reset',
    value: function reset(key) {
      window.localStorage.removeItem(this.prefix + '_' + key);
    }

    /**
     * Reset all data from localStorage.
     *
     */

  }, {
    key: 'resetAll',
    value: function resetAll() {
      var _this = this;

      arrayEach(this.savedKeys, function (value, index) {
        window.localStorage.removeItem(_this.prefix + '_' + _this.savedKeys[index]);
      });

      this.clearSavedKeys();
    }

    /**
     * Load and save all keys from localStorage.
     *
     * @private
     */

  }, {
    key: 'loadSavedKeys',
    value: function loadSavedKeys() {
      var keysJSON = window.localStorage.getItem(this.prefix + '__persistentStateKeys');
      var keys = typeof keysJSON === 'string' ? JSON.parse(keysJSON) : void 0;

      this.savedKeys = keys || [];
    }

    /**
     * Save saved key in localStorage.
     *
     * @private
     */

  }, {
    key: 'saveSavedKeys',
    value: function saveSavedKeys() {
      window.localStorage.setItem(this.prefix + '__persistentStateKeys', JSON.stringify(this.savedKeys));
    }

    /**
     * Clear saved key from localStorage.
     *
     * @private
     */

  }, {
    key: 'clearSavedKeys',
    value: function clearSavedKeys() {
      this.savedKeys.length = 0;
      this.saveSavedKeys();
    }
  }]);

  return Storage;
}();

export default Storage;