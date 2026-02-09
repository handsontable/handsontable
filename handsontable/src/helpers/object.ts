import { arrayEach } from './array';

/**
 * Generate schema for passed object.
 *
 * @param {Array|object} object An object to analyze.
 * @returns {Array|object}
 */
export function duckSchema(object: unknown[] | object): unknown {
  let schema: unknown;

  if (Array.isArray(object)) {
    schema = object.length ? new Array(object.length).fill(null) : [];

  } else {
    const schemaObj: Record<string, unknown> = {};

    objectEach(object as Record<string, unknown>, (value, key) => {
      if (key === '__children') {
        return;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        schemaObj[key as string] = duckSchema(value as object);

      } else if (Array.isArray(value)) {
        if (value.length && typeof value[0] === 'object' && !Array.isArray(value[0])) {
          schemaObj[key as string] = [duckSchema(value[0])];
        } else {
          schemaObj[key as string] = [];
        }

      } else {
        schemaObj[key as string] = null;
      }
    });

    schema = schemaObj;
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
export function inherit(Child: Function, Parent: Function): object {
  Parent.prototype.constructor = Parent;
  Child.prototype = new (Parent as unknown as new () => object)();
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
export function extend(target: Record<string, unknown>, extension: Record<string, unknown>, writableKeys?: string[]): object {
  const hasWritableKeys = Array.isArray(writableKeys);

  objectEach(extension, (value, key) => {
    if (hasWritableKeys === false || writableKeys.includes(key as string)) {
      target[key as string] = value;
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
export function deepExtend(target: Record<string, unknown>, extension: Record<string, unknown>): void {
  objectEach(extension, (value, key) => {
    if (extension[key as string] && typeof extension[key as string] === 'object') {
      if (!target[key as string]) {
        if (Array.isArray(extension[key as string])) {
          target[key as string] = [];
        } else if (Object.prototype.toString.call(extension[key as string]) === '[object Date]') {
          target[key as string] = extension[key as string];
        } else {
          target[key as string] = {};
        }
      }
      deepExtend(target[key as string] as Record<string, unknown>, extension[key as string] as Record<string, unknown>);

    } else {
      target[key as string] = extension[key as string];
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
export function deepClone(obj: object): object {
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
export function clone(object: object): object {
  const result: Record<string, unknown> = {};

  objectEach(object as Record<string, unknown>, (value, key) => {
    result[key as string] = value;
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
export function mixin(Base: Function, ...mixins: object[]): object {
  if (!(Base as unknown as Record<string, unknown[]>).MIXINS) {
    (Base as unknown as Record<string, unknown[]>).MIXINS = [];
  }
  arrayEach(mixins, (mixinItem) => {
    (Base as unknown as Record<string, unknown[]>).MIXINS.push((mixinItem as Record<string, unknown>).MIXIN_NAME);

    objectEach(mixinItem as Record<string, unknown>, (value, key) => {
      if (Base.prototype[key as string] !== undefined) {
        throw new Error(`Mixin conflict. Property '${key}' already exist and cannot be overwritten.`);
      }
      if (typeof value === 'function') {
        Base.prototype[key as string] = value;

      } else {
        const getter = function _getter(property: string, initialValue: unknown) {
          const propertyName = `_${property}`;

          const initValue = (newValue: unknown) => {
            let result = newValue;

            if (Array.isArray(result) || isObject(result)) {
              result = deepClone(result as object);
            }

            return result;
          };

          return function(this: Record<string, unknown>) {
            if (this[propertyName] === undefined) {
              this[propertyName] = initValue(initialValue);
            }

            return this[propertyName];
          };
        };
        const setter = function _setter(property: string) {
          const propertyName = `_${property}`;

          return function(this: Record<string, unknown>, newValue: unknown) {
            this[propertyName] = newValue;
          };
        };

        Object.defineProperty(Base.prototype, key as string, {
          get: getter(key as string, value),
          set: setter(key as string),
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
export function isObjectEqual(object1: object | unknown[], object2: object | unknown[]): boolean {
  return JSON.stringify(object1) === JSON.stringify(object2);
}

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects.
 *
 * @param {*} object An object to check.
 * @returns {boolean}
 */
export function isObject(object: unknown): boolean {
  return Object.prototype.toString.call(object) === '[object Object]';
}

/**
 * @param {object} object The object on which to define the property.
 * @param {string} property The name of the property to be defined or modified.
 * @param {*} value The value associated with the property.
 * @param {object} options The descriptor for the property being defined or modified.
 */
export function defineGetter(object: object, property: string, value: unknown, options: PropertyDescriptor): void {
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
export function objectEach(object: Record<string, unknown>, iteratee: (value: unknown, key: unknown, object: object) => unknown): object {
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
export function getProperty(object: Record<string, unknown>, name: string): unknown {
  const names = name.split('.');
  let result: unknown = object;

  objectEach(names as unknown as Record<string, unknown>, (nameItem) => {
    result = (result as Record<string, unknown>)[nameItem as string];

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
export function setProperty(object: Record<string, unknown>, name: string, value: unknown): void {
  if (typeof name !== 'string') {
    return;
  }

  const names = name.split('.');
  let workingObject: Record<string, unknown> = object;

  names.forEach((propName, index) => {
    if (propName === '__proto__' || propName === 'constructor' || propName === 'prototype') {
      // Security: prototype-polluting is not allowed
      return;
    }

    if (index !== names.length - 1) {
      if (!hasOwnProperty(workingObject, propName)) {
        workingObject[propName] = {};
      }

      workingObject = workingObject[propName] as Record<string, unknown>;

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
export function deepObjectSize(object: unknown): number {
  if (!isObject(object)) {
    return 0;
  }

  const recursObjLen = function(obj: unknown) {
    let result = 0;

    if (isObject(obj)) {
      objectEach(obj as Record<string, unknown>, (value, key) => {
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
export interface ObjectPropListener extends Record<string, unknown> {
  isTouched(): boolean;
  value: unknown;
}

export function createObjectPropListener(defaultValue?: unknown, propertyToListen: string = 'value'): ObjectPropListener {
  const privateProperty = `_${propertyToListen}`;
  const holder: Record<string, unknown> = {
    _touched: false,
    [privateProperty]: defaultValue,
    isTouched() {
      return (this as Record<string, unknown>)._touched;
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

  return holder as ObjectPropListener;
}

/**
 * Check if at specified `key` there is any value for `object`.
 *
 * @param {object} object Object to search value at specific key.
 * @param {string} key String key to check.
 * @returns {boolean}
 */
export function hasOwnProperty(object: object, key: string | number): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Assign default values to an object.
 *
 * @param {object} target The object to assign defaults to.
 * @param {object} defaults The default values to assign.
 * @returns {object} The object with defaults assigned.
 */
export function assignObjectDefaults(target: Record<string, unknown>, defaults: Record<string, unknown>) {
  if (typeof target !== 'object' || target === null) {
    return defaults;
  }

  if (typeof defaults !== 'object' || defaults === null) {
    return target;
  }

  const result: Record<string, unknown> = {};

  // Assign defaults
  Object.keys(defaults).forEach((key) => {
    if (
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = assignObjectDefaults(target[key] as Record<string, unknown>, defaults[key] as Record<string, unknown>);
    } else {
      result[key] = hasOwnProperty(target, key) && target[key] !== undefined
        ? target[key]
        : defaults[key];
    }
  });

  // Copy extra keys from target that aren't in defaults
  Object.keys(target).forEach((key) => {
    if (!hasOwnProperty(result, key)) {
      result[key] = target[key];
    }
  });

  return result;
}
