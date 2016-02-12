
import {arrayEach} from './array';

/**
 * Generate schema for passed object.
 *
 * @param {Array|Object} object
 * @returns {Array|Object}
 */
export function duckSchema(object) {
  var schema;

  if (Array.isArray(object)) {
    schema = [];
  } else {
    schema = {};

    objectEach(object, function(value, key) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        schema[key] = duckSchema(value);

      } else if (Array.isArray(value)) {
        if (value.length && typeof value[0] === 'object' && !Array.isArray(value[0])) {
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
  objectEach(extension, function(value, key) {
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
  objectEach(extension, function(value, key) {
    if (extension[key] && typeof extension[key] === 'object') {
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
  if (typeof obj === 'object') {
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
  let result = {};

  objectEach(object, (value, key) => {
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
export function mixin(Base, ...mixins) {
  if (!Base.MIXINS) {
    Base.MIXINS = [];
  }
  arrayEach(mixins, (mixin) => {
    Base.MIXINS.push(mixin.MIXIN_NAME);

    objectEach(mixin, (value, key) => {
      if (Base.prototype[key] !== void 0) {
        throw new Error(`Mixin conflict. Property '${key}' already exist and cannot be overwritten.`);
      }
      if (typeof value === 'function') {
        Base.prototype[key] = value;

      } else {
        let getter = function _getter(propertyName, initialValue) {
          propertyName = '_' + propertyName;

          let initValue = (value) => {
            if (Array.isArray(value) || isObject(value)) {
              value = deepClone(value);
            }

            return value;
          };

          return function() {
            if (this[propertyName] === void 0) {
              this[propertyName] = initValue(initialValue);
            }

            return this[propertyName];
          };
        };
        let setter = function _setter(propertyName) {
          propertyName = '_' + propertyName;

          return function(value) {
            this[propertyName] = value;
          };
        };
        Object.defineProperty(Base.prototype, key, {
          get: getter(key, value),
          set: setter(key),
          configurable: true,
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
export function isObjectEquals(object1, object2) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject(obj) {
  return Object.prototype.toString.call(obj) == '[object Object]';
}

export function getPrototypeOf(obj) {
  var prototype;

  /* jshint ignore:start */
  if (typeof obj.__proto__ == 'object') {
    prototype = obj.__proto__;
  } else {
    var oldConstructor,
      constructor = obj.constructor;

    if (typeof obj.constructor == 'function') {
      oldConstructor = constructor;

      if (delete obj.constructor) {
        constructor = obj.constructor; // get real constructor
        obj.constructor = oldConstructor; // restore constructor
      }
    }

    prototype = constructor ? constructor.prototype : null; // needed for IE
  }
  /* jshint ignore:end */

  return prototype;
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
  for (let key in object) {
    if (!object.hasOwnProperty || (object.hasOwnProperty && object.hasOwnProperty(key))) {
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
  let names = name.split('.');
  let result = object;

  objectEach(names, (name) => {
    result = result[name];

    if (result === void 0) {
      result = void 0;

      return false;
    }
  });

  return result;
}
