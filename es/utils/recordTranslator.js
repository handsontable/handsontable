var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import Core from './../core';
import { isObject } from './../helpers/object';

/**
 * @class RecordTranslator
 * @util
 */
export var RecordTranslator = function () {
  function RecordTranslator(hot) {
    _classCallCheck(this, RecordTranslator);

    this.hot = hot;
  }

  /**
   * Translate physical row index into visual.
   *
   * @param {Number} row Physical row index.
   * @returns {Number} Returns visual row index.
   */


  _createClass(RecordTranslator, [{
    key: 'toVisualRow',
    value: function toVisualRow(row) {
      return this.hot.runHooks('unmodifyRow', row);
    }

    /**
     * Translate physical column index into visual.
     *
     * @param {Number} column Physical column index.
     * @returns {Number} Returns visual column index.
     */

  }, {
    key: 'toVisualColumn',
    value: function toVisualColumn(column) {
      return this.hot.runHooks('unmodifyCol', column);
    }

    /**
     * Translate physical coordinates into visual. Can be passed as separate 2 arguments (row, column) or as an object in first
     * argument with `row` and `column` keys.
     *
     * @param {Number|Object} row Physical coordinates or row index.
     * @param {Number} [column] Physical column index.
     * @returns {Object|Array} Returns an object with visual records or an array if coordinates passed as separate arguments.
     */

  }, {
    key: 'toVisual',
    value: function toVisual(row, column) {
      var result = void 0;

      if (isObject(row)) {
        result = {
          row: this.toVisualRow(row.row),
          column: this.toVisualColumn(row.column)
        };
      } else {
        result = [this.toVisualRow(row), this.toVisualColumn(column)];
      }

      return result;
    }

    /**
     * Translate visual row index into physical.
     *
     * @param {Number} row Visual row index.
     * @returns {Number} Returns physical row index.
     */

  }, {
    key: 'toPhysicalRow',
    value: function toPhysicalRow(row) {
      return this.hot.runHooks('modifyRow', row);
    }

    /**
     * Translate visual column index into physical.
     *
     * @param {Number} column Visual column index.
     * @returns {Number} Returns physical column index.
     */

  }, {
    key: 'toPhysicalColumn',
    value: function toPhysicalColumn(column) {
      return this.hot.runHooks('modifyCol', column);
    }

    /**
     * Translate visual coordinates into physical. Can be passed as separate 2 arguments (row, column) or as an object in first
     * argument with `row` and `column` keys.
     *
     * @param {Number|Object} row Visual coordinates or row index.
     * @param {Number} [column] Visual column index.
     * @returns {Object|Array} Returns an object with physical records or an array if coordinates passed as separate arguments.
     */

  }, {
    key: 'toPhysical',
    value: function toPhysical(row, column) {
      var result = void 0;

      if (isObject(row)) {
        result = {
          row: this.toPhysicalRow(row.row),
          column: this.toPhysicalColumn(row.column)
        };
      } else {
        result = [this.toPhysicalRow(row), this.toPhysicalColumn(column)];
      }

      return result;
    }
  }]);

  return RecordTranslator;
}();

var identities = new WeakMap();
var translatorSingletons = new WeakMap();

/**
 * Allows to register custom identity manually.
 *
 * @param {*} identity
 * @param {*} hot
 */
export function registerIdentity(identity, hot) {
  identities.set(identity, hot);
}

/**
 * Returns a cached instance of RecordTranslator or create the new one for given identity.
 *
 * @param {*} identity
 * @returns {RecordTranslator}
 */
export function getTranslator(identity) {
  var instance = identity instanceof Core ? identity : getIdentity(identity);
  var singleton = void 0;

  if (translatorSingletons.has(instance)) {
    singleton = translatorSingletons.get(instance);
  } else {
    singleton = new RecordTranslator(instance);
    translatorSingletons.set(instance, singleton);
  }

  return singleton;
}

/**
 * Returns mapped identity.
 *
 * @param {*} identity
 * @returns {*}
 */
export function getIdentity(identity) {
  if (!identities.has(identity)) {
    throw Error('Record translator was not registered for this object identity');
  }

  return identities.get(identity);
}