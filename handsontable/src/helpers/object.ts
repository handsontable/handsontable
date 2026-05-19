import { arrayEach } from './array';
import { isDefined } from './mixed';
import { throwWithCause } from './errors';

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
    const schemaObj: Record<string, unknown> = Object.create(null);

    objectEach(object, (value, key) => {
      if (key === '__children') {
        return;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        schemaObj[key] = duckSchema(value);

      } else if (Array.isArray(value)) {
        if (value.length && typeof value[0] === 'object' && !Array.isArray(value[0])) {
          schemaObj[key] = [duckSchema(value[0])];
        } else {
          schemaObj[key] = [];
        }

      } else {
        schemaObj[key] = null;
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
export function extend(
  target: Record<string, unknown>, extension: Record<string, unknown>, writableKeys?: string[]): object {
  const hasWritableKeys = Array.isArray(writableKeys);

  objectEach(extension, (value, key) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }
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
export function deepExtend(target: Record<string, unknown>, extension: Record<string, unknown>): void {
  objectEach(extension, (_value, key) => {
    const extensionValue = extension[key];

    if (extensionValue && typeof extensionValue === 'object') {
      if (!target[key]) {
        if (Array.isArray(extensionValue)) {
          target[key] = [];
        } else if (Object.prototype.toString.call(extensionValue) === '[object Date]') {
          target[key] = extensionValue;
        } else {
          target[key] = {};
        }
      }
      deepExtend(target[key] as Record<string, unknown>, extensionValue as Record<string, unknown>);

    } else {
      target[key] = extensionValue;
    }
  });
}

/**
 * Perform deep clone of an object.
 * Clones plain objects, arrays, and primitives recursively, preserving undefined-valued properties.
 * Non-plain objects (Date, RegExp, Map, Set, class instances) are returned by reference.
 *
 * @param {T} obj An object that will be cloned.
 * @returns {T}
 */
export function deepClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  if (obj instanceof Date) {
    return new Date(obj) as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
      result[key] = deepClone((obj as Record<string, unknown>)[key]);
    }

    return result as T;
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
export function mixin(Base: Function, ...mixins: object[]): object {
  if (!(Base as unknown as Record<string, unknown[]>).MIXINS) {
    (Base as unknown as Record<string, unknown[]>).MIXINS = [];
  }
  arrayEach(mixins, (mixinItem) => {
    (Base as unknown as Record<string, unknown[]>).MIXINS.push((mixinItem as Record<string, unknown>).MIXIN_NAME);

    objectEach(mixinItem, (value, key) => {
      if (Base.prototype[key] !== undefined) {
        throwWithCause(`Mixin conflict. Property '${key}' already exist and cannot be overwritten.`);
      }
      if (typeof value === 'function') {
        Base.prototype[key] = value;

      } else {
        const getter = function _getter(property: string, initialValue: unknown) {
          const propertyName = `_${property}`;

          const initValue = (newValue: unknown) => {
            let result = newValue;

            if (Array.isArray(result) || isObject(result)) {
              result = deepClone(result);
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
export function isObjectEqual(object1: object | unknown[], object2: object | unknown[]): boolean {
  const stableStringify = (obj: unknown): string => {
    if (obj === undefined) {
      return 'undefined';
    }
    if (Array.isArray(obj)) {
      return `[${obj.map(stableStringify).join(',')}]`;
    }
    if (obj instanceof Date) {
      return JSON.stringify(obj);
    }
    if (obj !== null && typeof obj === 'object') {
      const pairs = Object.keys(obj).sort((a, b) => a.localeCompare(b))
        .map(key => `${JSON.stringify(key)}:${stableStringify((obj as Record<string, unknown>)[key])}`);

      return `{${pairs.join(',')}}`;
    }

    return JSON.stringify(obj);
  };

  return stableStringify(object1) === stableStringify(object2);
}

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects.
 *
 * @param {*} object An object to check.
 * @returns {boolean}
 */
export function isObject(object: unknown): boolean {
  return isPlainObject(object);
}

/**
 * Internal type-guard variant of {@link isObject} used to narrow values within this module.
 * Kept private to avoid changing the public `isObject` return type, which downstream
 * code relies on for compatibility with `as` casts to unrelated types.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
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
export function objectEach(object: object, iteratee: (value: unknown, key: string, object: object) => unknown): object {
  const rec = object as Record<string, unknown>;

  // eslint-disable-next-line no-restricted-syntax
  for (const key in rec) {
    if (!rec.hasOwnProperty || (rec.hasOwnProperty && Object.prototype.hasOwnProperty.call(rec, key))) {
      if (iteratee(rec[key], key, object) === false) {
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
 * @returns {T | undefined}
 */
export function getProperty<T = unknown>(object: Record<string, unknown>, name: string): T | undefined {
  const names = name.split('.');
  let result: unknown = object;

  for (const nameItem of names) {
    result = (result as Record<string, unknown>)[nameItem];

    if (result === undefined) {
      return undefined;
    }
  }

  return result as T | undefined;
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

  if (!isPlainObject(object)) {
    return;
  }

  const names = name.split('.');
  let workingObject: Record<string, unknown> = object;

  for (let index = 0; index < names.length; index += 1) {
    const propName = names[index];

    if (propName === '__proto__' || propName === 'constructor' || propName === 'prototype') {
      // Security: prototype-polluting is not allowed
      return;
    }

    if (index !== names.length - 1) {
      if (!hasOwnProperty(workingObject, propName)) {
        workingObject[propName] = Object.create(null);
      }

      const nextLevel = workingObject[propName];

      if (!isPlainObject(nextLevel)) {
        return;
      }
      workingObject = nextLevel;

    } else {
      Object.defineProperty(workingObject, propName, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
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

    if (isPlainObject(obj)) {
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
export interface ObjectPropListener extends Record<string, unknown> {
  isTouched(): boolean;
  value: unknown;
}

/**
 *
 */
export function createObjectPropListener(
  defaultValue?: unknown, propertyToListen: string = 'value'): ObjectPropListener {
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
    const defaultValue = defaults[key];
    const targetValue = target[key];

    if (isPlainObject(defaultValue)) {
      result[key] = assignObjectDefaults(
        isPlainObject(targetValue) ? targetValue : {},
        defaultValue
      );
    } else {
      result[key] = hasOwnProperty(target, key) && targetValue !== undefined
        ? targetValue
        : defaultValue;
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

/**
 * Deeply merges two objects.
 * For every key:
 *  - If both source and target values are plain objects, they are merged recursively.
 *  - Otherwise, the source value replaces the target value.
 *
 * @param {object} target The target object.
 * @param {object} source The source object.
 * @returns {object} The merged object.
 */
export function deepMerge(
  target: Record<string, unknown> = {}, source: Record<string, unknown> = {}
): Record<string, unknown> {
  const result = {
    ...target,
  };

  Object.keys(source).forEach((key) => {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }

    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
    } else {
      result[key] = sourceValue;
    }
  });

  return result;
}

/**
 * Checks if the value is a key/value object.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isKeyValueObject(value: unknown): boolean {
  return isPlainObject(value) && isDefined(value.key) && isDefined(value.value);
}
