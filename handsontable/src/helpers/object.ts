import { arrayEach } from './array';

/**
 * Generate schema for passed object.
 *
 * @param {Array|object} object An object to analyze.
 * @returns {Array|object}
 */
export function duckSchema(object) {
  let schema;

  if (Array.isArray(object)) {
    schema = object.length ? new Array(object.length).fill(null) : [];

  } else {
    schema = {};

    objectEach(object, (value, key) => {
      if (key === '__children') {
        return;
      }

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
 * Described in ticket: https://github.com/handsontable/handsontable/pull/516.
 *
 * @param {object} Child The child class.
 * @param {object} Parent The parent class.
 * @returns {object}
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
 * @param {object} target An object that will receive the new properties.
 * @param {object} extension An object containing additional properties to merge into the target.
 * @param {string[]} [writableKeys] An array of keys that are writable to target object.
 * @returns {object}
 */
export function extend(target, extension, writableKeys) {
  const hasWritableKeys = Array.isArray(writableKeys);

  objectEach(extension, (value, key) => {
    if (hasWritableKeys === false || writableKeys.includes(key)) {
      target[key] = value;
    }
  });

  return target;
}

/**
 * Perform deep extend of a target object with extension's own properties.
 *
 * @param {object} target An object that will receive the new properties.
 * @param {object} extension An object containing additional properties to merge into the target.
 */
export function deepExtend(target, extension) {
  objectEach(extension, (value, key) => {
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
 * @param {object} obj An object that will be cloned.
 * @returns {object}
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
 * @param {object} object An object to clone.
 * @returns {object}
 */
export function clone(object) {
  const result = {};

  objectEach(object, (value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Extend the Base object (usually prototype) of the functionality the `mixins` objects.
 *
 * @param {object} Base Base object which will be extended.
 * @param {object} mixins The object of the functionality will be "copied".
 * @returns {object}
 */
export function mixin(Base, ...mixins) {
  if (!Base.MIXINS) {
    Base.MIXINS = [];
  }
  arrayEach(mixins, (mixinItem) => {
    Base.MIXINS.push(mixinItem.MIXIN_NAME);

    objectEach(mixinItem, (value, key) => {
      if (Base.prototype[key] !== undefined) {
        throw new Error(`Mixin conflict. Property '${key}' already exist and cannot be overwritten.`);
      }
      if (typeof value === 'function') {
        Base.prototype[key] = value;

      } else {
        const getter = function _getter(property, initialValue) {
          const propertyName = `_${property}`;

          const initValue = (newValue) => {
            let result = newValue;

            if (Array.isArray(result) || isObject(result)) {
              result = deepClone(result);
            }

            return result;
          };

          return function() {
            if (this[propertyName] === undefined) {
              this[propertyName] = initValue(initialValue);
            }

            return this[propertyName];
          };
        };
        const setter = function _setter(property) {
          const propertyName = `_${property}`;

          return function(newValue) {
            this[propertyName] = newValue;
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
 * Checks if two objects or arrays are (deep) equal.
 *
 * @param {object|Array} object1 The first object to compare.
 * @param {object|Array} object2 The second object to compare.
 * @returns {boolean}
 */
export function isObjectEqual(object1, object2) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects.
 *
 * @param {*} object An object to check.
 * @returns {boolean}
 */
export function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}

/**
 * @param {object} object The object on which to define the property.
 * @param {string} property The name of the property to be defined or modified.
 * @param {*} value The value associated with the property.
 * @param {object} options The descriptor for the property being defined or modified.
 */
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
 * @param {object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {object} Returns `object`.
 */
export function objectEach(object, iteratee) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in object) {
    if (!object.hasOwnProperty || (object.hasOwnProperty && Object.prototype.hasOwnProperty.call(object, key))) {
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
 * @param {object} object Object which value will be exported.
 * @param {string} name Object property name.
 * @returns {*}
 */
export function getProperty(object, name) {
  const names = name.split('.');
  let result = object;

  objectEach(names, (nameItem) => {
    result = result[nameItem];

    if (result === undefined) {
      result = undefined;

      return false;
    }
  });

  return result;
}

/**
 * Set a property value on the provided object. Works on nested object prop names as well (e.g. `first.name`).
 *
 * @param {object} object Object to work on.
 * @param {string} name Prop name.
 * @param {*} value Value to be assigned at the provided property.
 */
export function setProperty(object, name, value) {
  const names = name.split('.');
  let workingObject = object;

  names.forEach((propName, index) => {
    if (propName === '__proto__' || propName === 'constructor' || propName === 'prototype') {
      // Security: prototype-polluting is not allowed
      return;
    }

    if (index !== names.length - 1) {
      if (!hasOwnProperty(workingObject, propName)) {
        workingObject[propName] = {};
      }

      workingObject = workingObject[propName];

    } else {
      workingObject[propName] = value;
    }
  });
}

/**
 * Return object length (recursively).
 *
 * @param {*} object Object for which we want get length.
 * @returns {number}
 */
export function deepObjectSize(object) {
  if (!isObject(object)) {
    return 0;
  }

  const recursObjLen = function(obj) {
    let result = 0;

    if (isObject(obj)) {
      objectEach(obj, (value, key) => {
        if (key === '__children') {
          return;
        }

        result += recursObjLen(value);
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
 * @param {string} [propertyToListen='value'] Property to listen.
 * @returns {object}
 */
export function createObjectPropListener(defaultValue, propertyToListen = 'value') {
  const privateProperty = `_${propertyToListen}`;
  const holder = {
    _touched: false,
    [privateProperty]: defaultValue,
    isTouched() {
      return this._touched;
    }
  };

  Object.defineProperty(holder, propertyToListen, {
    get() {
      return this[privateProperty];
    },
    set(value) {
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
 * @param {object} object Object to search value at specific key.
 * @param {string} key String key to check.
 * @returns {boolean}
 */
export function hasOwnProperty(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}
