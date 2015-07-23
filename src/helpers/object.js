
/**
 * Generate schema for passed object
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

    for (var i in object) {
      if (object.hasOwnProperty(i)) {
        if (object[i] && typeof object[i] === 'object' && !Array.isArray(object[i])) {
          schema[i] = duckSchema(object[i]);

        } else if (Array.isArray(object[i])) {
          if (object[i].length && typeof object[i][0] === 'object' && !Array.isArray(object[i][0])) {
            schema[i] = [duckSchema(object[i][0])];
          } else {
            schema[i] = [];
          }

        } else {
          schema[i] = null;
        }
      }
    }
  }

  return schema;
}

/**
 * Inherit without without calling parent constructor, and setting `Child.prototype.constructor` to `Child` instead of `Parent`.
 * Creates temporary dummy function to call it as constructor.
 * Described in ticket: https://github.com/handsontable/handsontable/pull/516
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
 * Perform shallow extend of a target object with extension's own properties
 * @param {Object} target An object that will receive the new properties
 * @param {Object} extension An object containing additional properties to merge into the target
 */
export function extend(target, extension) {
  for (var i in extension) {
    if (extension.hasOwnProperty(i)) {
      target[i] = extension[i];
    }
  }
}

/**
 * Perform deep extend of a target object with extension's own properties
 * @param {Object} target An object that will receive the new properties
 * @param {Object} extension An object containing additional properties to merge into the target
 */
export function deepExtend(target, extension) {
  for (var key in extension) {
    if (extension.hasOwnProperty(key)) {
      if (extension[key] && typeof extension[key] === 'object') {
        if (!target[key]) {
          if (Array.isArray(extension[key])) {
            target[key] = [];
          }
          else {
            target[key] = {};
          }
        }
        deepExtend(target[key], extension[key]);
      }
      else {
        target[key] = extension[key];
      }
    }
  }
}

/**
 * Perform deep clone of an object
 * WARNING! Only clones JSON properties. Will cause error when `obj` contains a function, Date, etc
 * @param {Object} obj An object that will be cloned
 * @return {Object}
 */
export function deepClone(obj) {
  if (typeof obj === "object") {
    return JSON.parse(JSON.stringify(obj));
  }
  else {
    return obj;
  }
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
  if(typeof obj.__proto__ == "object"){
    prototype = obj.__proto__;
  } else {
    var oldConstructor,
      constructor = obj.constructor;

    if (typeof obj.constructor == "function") {
      oldConstructor = constructor;

      if (delete obj.constructor){
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
  options.writable = options.writable === false ? false : true;
  options.enumerable = options.enumerable === false ? false : true;
  options.configurable = options.configurable === false ? false : true;

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
