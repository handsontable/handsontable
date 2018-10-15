var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { arrayEach } from './array';

/**
 * Generate schema for passed object.
 *
 * @param {Array|Object} object
 * @returns {Array|Object}
 */
export function duckSchema(object) {
  var schema = void 0;

  if (Array.isArray(object)) {
    schema = [];
  } else {
    schema = {};

    objectEach(object, function (value, key) {
      if (key === '__children') {
        return;
      }

      if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !Array.isArray(value)) {
        schema[key] = duckSchema(value);
      } else if (Array.isArray(value)) {
        if (value.length && _typeof(value[0]) === 'object' && !Array.isArray(value[0])) {
          schema[key] = [duckSchema(value[0])];
        } else {
          schema[key] = [];
        }
      } else {
        schema[key] = null;
      }
    });
  }

  return schema;
}

/**
 * Inherit without without calling parent constructor, and setting `Child.prototype.constructor` to `Child` instead of `Parent`.
 * Creates temporary dummy function to call it as constructor.
 * Described in ticket: https://github.com/handsontable/handsontable/pull/516
 *
 * @param  {Object} Child  child class
 * @param  {Object} Parent parent class
 * @return {Object}        extended Child
 */
export function inherit(Child, Parent) {
  Parent.prototype.constructor = Parent;
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;

  return Child;
}

/**
 * Perform shallow extend of a target object with extension's own properties.
 *
 * @param {Object} target An object that will receive the new properties.
 * @param {Object} extension An object containing additional properties to merge into the target.
 */
export function extend(target, extension) {
  objectEach(extension, function (value, key) {
    target[key] = value;
  });

  return target;
}

/**
 * Perform deep extend of a target object with extension's own properties.
 *
 * @param {Object} target An object that will receive the new properties.
 * @param {Object} extension An object containing additional properties to merge into the target.
 */
export function deepExtend(target, extension) {
  objectEach(extension, function (value, key) {
    if (extension[key] && _typeof(extension[key]) === 'object') {
      if (!target[key]) {
        if (Array.isArray(extension[key])) {
          target[key] = [];
        } else if (Object.prototype.toString.call(extension[key]) === '[object Date]') {
          target[key] = extension[key];
        } else {
          target[key] = {};
        }
      }
      deepExtend(target[key], extension[key]);
    } else {
      target[key] = extension[key];
    }
  });
}

/**
 * Perform deep clone of an object.
 * WARNING! Only clones JSON properties. Will cause error when `obj` contains a function, Date, etc.
 *
 * @param {Object} obj An object that will be cloned
 * @return {Object}
 */
export function deepClone(obj) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
    return JSON.parse(JSON.stringify(obj));
  }

  return obj;
}

/**
 * Shallow clone object.
 *
 * @param {Object} object
 * @returns {Object}
 */
export function clone(object) {
  var result = {};

  objectEach(object, function (value, key) {
    result[key] = value;
  });

  return result;
}

/**
 * Extend the Base object (usually prototype) of the functionality the `mixins` objects.
 *
 * @param {Object} Base Base object which will be extended.
 * @param {Object} mixins The object of the functionality will be "copied".
 * @returns {Object}
 */
export function mixin(Base) {
  if (!Base.MIXINS) {
    Base.MIXINS = [];
  }

  for (var _len = arguments.length, mixins = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    mixins[_key - 1] = arguments[_key];
  }

  arrayEach(mixins, function (mixinItem) {
    Base.MIXINS.push(mixinItem.MIXIN_NAME);

    objectEach(mixinItem, function (value, key) {
      if (Base.prototype[key] !== void 0) {
        throw new Error('Mixin conflict. Property \'' + key + '\' already exist and cannot be overwritten.');
      }
      if (typeof value === 'function') {
        Base.prototype[key] = value;
      } else {
        var getter = function _getter(property, initialValue) {
          var propertyName = '_' + property;

          var initValue = function initValue(newValue) {
            var result = newValue;

            if (Array.isArray(result) || isObject(result)) {
              result = deepClone(result);
            }

            return result;
          };

          return function () {
            if (this[propertyName] === void 0) {
              this[propertyName] = initValue(initialValue);
            }

            return this[propertyName];
          };
        };
        var setter = function _setter(property) {
          var propertyName = '_' + property;

          return function (newValue) {
            this[propertyName] = newValue;
          };
        };
        Object.defineProperty(Base.prototype, key, {
          get: getter(key, value),
          set: setter(key),
          configurable: true
        });
      }
    });
  });

  return Base;
}

/**
 * Checks if two objects or arrays are (deep) equal
 *
 * @param {Object|Array} object1
 * @param {Object|Array} object2
 * @returns {Boolean}
 */
export function isObjectEqual(object1, object2) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

export function defineGetter(object, property, value, options) {
  options.value = value;
  options.writable = options.writable !== false;
  options.enumerable = options.enumerable !== false;
  options.configurable = options.configurable !== false;

  Object.defineProperty(object, property, options);
}

/**
 * A specialized version of `.forEach` for objects.
 *
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
export function objectEach(object, iteratee) {
  // eslint-disable-next-line no-restricted-syntax
  for (var key in object) {
    if (!object.hasOwnProperty || object.hasOwnProperty && Object.prototype.hasOwnProperty.call(object, key)) {
      if (iteratee(object[key], key, object) === false) {
        break;
      }
    }
  }

  return object;
}

/**
 * Get object property by its name. Access to sub properties can be achieved by dot notation (e.q. `'foo.bar.baz'`).
 *
 * @param {Object} object Object which value will be exported.
 * @param {String} name Object property name.
 * @returns {*}
 */
export function getProperty(object, name) {
  var names = name.split('.');
  var result = object;

  objectEach(names, function (nameItem) {
    result = result[nameItem];

    if (result === void 0) {
      result = void 0;

      return false;
    }
  });

  return result;
}

/**
 * Return object length (recursively).
 *
 * @param {*} object Object for which we want get length.
 * @returns {Number}
 */
export function deepObjectSize(object) {
  if (!isObject(object)) {
    return 0;
  }
  var recursObjLen = function recursObjLen(obj) {
    var result = 0;

    if (isObject(obj)) {
      objectEach(obj, function (key) {
        result += recursObjLen(key);
      });
    } else {
      result += 1;
    }

    return result;
  };

  return recursObjLen(object);
}

/**
 * Create object with property where its value change will be observed.
 *
 * @param {*} [defaultValue=undefined] Default value.
 * @param {String} [propertyToListen='value'] Property to listen.
 * @returns {Object}
 */
export function createObjectPropListener(defaultValue) {
  var _holder;

  var propertyToListen = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'value';

  var privateProperty = '_' + propertyToListen;
  var holder = (_holder = {
    _touched: false
  }, _defineProperty(_holder, privateProperty, defaultValue), _defineProperty(_holder, 'isTouched', function isTouched() {
    return this._touched;
  }), _holder);

  Object.defineProperty(holder, propertyToListen, {
    get: function get() {
      return this[privateProperty];
    },
    set: function set(value) {
      this._touched = true;
      this[privateProperty] = value;
    },

    enumerable: true,
    configurable: true
  });

  return holder;
}

/**
 * Check if at specified `key` there is any value for `object`.
 *
 * @param {Object} object Object to search value at specyfic key.
 * @param {String} key String key to check.
 */
export function hasOwnProperty(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}