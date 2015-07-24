
import * as dom from './dom.js';

/**
 * Returns true if keyCode represents a printable character
 * @param {Number} keyCode
 * @return {Boolean}
 */
export function isPrintableChar(keyCode) {
  return ((keyCode == 32) || //space
  (keyCode >= 48 && keyCode <= 57) || //0-9
  (keyCode >= 96 && keyCode <= 111) || //numpad
  (keyCode >= 186 && keyCode <= 192) || //;=,-./`
  (keyCode >= 219 && keyCode <= 222) || //[]{}\|"'
  keyCode >= 226 || //special chars (229 for Asian chars)
  (keyCode >= 65 && keyCode <= 90)); //a-z
}
export function isMetaKey(_keyCode) {
  var metaKeys = [
    keyCode.ARROW_DOWN,
    keyCode.ARROW_UP,
    keyCode.ARROW_LEFT,
    keyCode.ARROW_RIGHT,
    keyCode.HOME,
    keyCode.END,
    keyCode.DELETE,
    keyCode.BACKSPACE,
    keyCode.F1,
    keyCode.F2,
    keyCode.F3,
    keyCode.F4,
    keyCode.F5,
    keyCode.F6,
    keyCode.F7,
    keyCode.F8,
    keyCode.F9,
    keyCode.F10,
    keyCode.F11,
    keyCode.F12,
    keyCode.TAB,
    keyCode.PAGE_DOWN,
    keyCode.PAGE_UP,
    keyCode.ENTER,
    keyCode.ESCAPE,
    keyCode.SHIFT,
    keyCode.CAPS_LOCK,
    keyCode.ALT
  ];

  return metaKeys.indexOf(_keyCode) != -1;
}

export function isCtrlKey(_keyCode) {
  return [keyCode.CONTROL_LEFT, 224, keyCode.COMMAND_LEFT, keyCode.COMMAND_RIGHT].indexOf(_keyCode) != -1;
}

/**
 * Converts a value to string
 * @param value
 * @return {String}
 */
export function stringify(value) {
  switch (typeof value) {
    case 'string':
    case 'number':
      return value + '';

    case 'object':
      if (value === null) {
        return '';
      }
      else {
        return value.toString();
      }
      break;
    case 'undefined':
      return '';

    default:
      return value.toString();
  }
}

/**
 * Convert string to upper case first letter.
 *
 * @param {String} string String to convert.
 * @returns {String}
 */
export function toUpperCaseFirst(string) {
  return string[0].toUpperCase() + string.substr(1);
}

/**
 * Compare strings case insensitively.
 *
 * @param {...String} strings Strings to compare.
 * @returns {Boolean}
 */
export function equalsIgnoreCase(...strings) {
  let unique = [];
  let length = strings.length;

  while (length --) {
    let string = stringify(strings[length]).toLowerCase();

    if (unique.indexOf(string) === -1) {
      unique.push(string);
    }
  }

  return unique.length === 1;
}

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
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc
 * @param index
 * @returns {String}
 */
export function spreadsheetColumnLabel(index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }
  return columnLabel;
}

/**
 * Creates 2D array of Excel-like values "A1", "A2", ...
 * @param rowCount
 * @param colCount
 * @returns {Array}
 */
export function createSpreadsheetData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = [];
    for (j = 0; j < colCount; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    rows.push(row);
  }
  return rows;
}

export function createSpreadsheetObjectData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = {};
    for (j = 0; j < colCount; j++) {
      row['prop' + j] = spreadsheetColumnLabel(j) + (i + 1);
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Checks if value of n is a numeric one
 * http://jsperf.com/isnan-vs-isnumeric/4
 * @param n
 * @returns {boolean}
 */
export function isNumeric(n) {
  var t = typeof n;
  return t == 'number' ? !isNaN(n) && isFinite(n) :
    t == 'string' ? !n.length ? false :
      n.length == 1 ? /\d/.test(n) :
        /^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) :
      t == 'object' ? !!n && typeof n.valueOf() == "number" && !(n instanceof Date) : false;
}

/**
 * Generates a random hex string. Used as namespace for Handsontable instance events.
 * @return {String} - 16 character random string: "92b1bfc74ec4"
 */
export function randomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + s4() + s4();
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

/**
 * Factory for columns constructors.
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
export function columnFactory(GridSettings, conflictList) {
  function ColumnSettings () {}

  inherit(ColumnSettings, GridSettings);

  // Clear conflict settings
  for (var i = 0, len = conflictList.length; i < len; i++) {
    ColumnSettings.prototype[conflictList[i]] = void 0;
  }

  return ColumnSettings;
}

export function translateRowsToColumns(input) {
  var i
    , ilen
    , j
    , jlen
    , output = []
    , olen = 0;

  for (i = 0, ilen = input.length; i < ilen; i++) {
    for (j = 0, jlen = input[i].length; j < jlen; j++) {
      if (j == olen) {
        output.push([]);
        olen++;
      }
      output[j].push(input[i][j]);
    }
  }
  return output;
}

export function to2dArray(arr) {
  var i = 0
    , ilen = arr.length;
  while (i < ilen) {
    arr[i] = [arr[i]];
    i++;
  }
}

export function extendArray(arr, extension) {
  var i = 0
    , ilen = extension.length;
  while (i < ilen) {
    arr.push(extension[i]);
    i++;
  }
}

/**
 * Determines if the given DOM element is an input field.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
export function isInput(element) {
  var inputs = ['INPUT', 'SELECT', 'TEXTAREA'];

  return inputs.indexOf(element.nodeName) > -1 || element.contentEditable === 'true';
}

/**
 * Determines if the given DOM element is an input field placed OUTSIDE of HOT.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
export function isOutsideInput(element) {
  return isInput(element) && element.className.indexOf('handsontableInput') == -1 && element.className.indexOf('copyPaste') == -1;
}

export var keyCode = {
  MOUSE_LEFT: 1,
  MOUSE_RIGHT: 3,
  MOUSE_MIDDLE: 2,
  BACKSPACE: 8,
  COMMA: 188,
  INSERT: 45,
  DELETE: 46,
  END: 35,
  ENTER: 13,
  ESCAPE: 27,
  CONTROL_LEFT: 91,
  COMMAND_LEFT: 17,
  COMMAND_RIGHT: 93,
  ALT: 18,
  HOME: 36,
  PAGE_DOWN: 34,
  PAGE_UP: 33,
  PERIOD: 190,
  SPACE: 32,
  SHIFT: 16,
  CAPS_LOCK: 20,
  TAB: 9,
  ARROW_RIGHT: 39,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  A: 65,
  X: 88,
  C: 67,
  V: 86
};

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject(obj) {
  return Object.prototype.toString.call(obj) == '[object Object]';
}

export function pivot(arr) {
  var pivotedArr = [];

  if(!arr || arr.length === 0 || !arr[0] || arr[0].length === 0){
    return pivotedArr;
  }

  var rowCount = arr.length;
  var colCount = arr[0].length;

  for(var i = 0; i < rowCount; i++){
    for(var j = 0; j < colCount; j++){
      if(!pivotedArr[j]){
        pivotedArr[j] = [];
      }

      pivotedArr[j][i] = arr[i][j];
    }
  }

  return pivotedArr;
}

export function proxy(fun, context) {
  return function () {
    return fun.apply(context, arguments);
  };
}

/**
 * Factory that produces a function for searching methods (or any properties) which could be defined directly in
 * table configuration or implicitly, within cell type definition.
 *
 * For example: renderer can be defined explicitly using "renderer" property in column configuration or it can be
 * defined implicitly using "type" property.
 *
 * Methods/properties defined explicitly always takes precedence over those defined through "type".
 *
 * If the method/property is not found in an object, searching is continued recursively through prototype chain, until
 * it reaches the Object.prototype.
 *
 *
 * @param methodName {String} name of the method/property to search (i.e. 'renderer', 'validator', 'copyable')
 * @param allowUndefined {Boolean} [optional] if false, the search is continued if methodName has not been found in cell "type"
 * @returns {Function}
 */
export function cellMethodLookupFactory(methodName, allowUndefined) {

  allowUndefined = typeof allowUndefined == 'undefined' ? true : allowUndefined;

  return function cellMethodLookup (row, col) {

    return (function getMethodFromProperties(properties) {

      if (!properties){

        return;                       //method not found

      }
      else if (properties.hasOwnProperty(methodName) && properties[methodName] !== void 0) { //check if it is own and is not empty

        return properties[methodName];  //method defined directly

      } else if (properties.hasOwnProperty('type') && properties.type) { //check if it is own and is not empty

        var type;

        if(typeof properties.type != 'string' ){
          throw new Error('Cell type must be a string ');
        }

        type = translateTypeNameToObject(properties.type);

        if (type.hasOwnProperty(methodName)) {
          return type[methodName]; //method defined in type.
        } else if (allowUndefined) {
          return; //method does not defined in type (eg. validator), returns undefined
        }

      }

      return getMethodFromProperties(getPrototypeOf(properties));

    })(typeof row == 'number' ? this.getCellMeta(row, col) : row);

  };

  function translateTypeNameToObject(typeName) {
    var type = Handsontable.cellTypes[typeName];

    if(typeof type == 'undefined'){
      throw new Error('You declared cell type "' + typeName + '" as a string that is not mapped to a known object. ' +
      'Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
    }

    return type;
  }
}

export function isMobileBrowser(userAgent) {
  if(!userAgent) {
    userAgent = navigator.userAgent;
  }
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));

  // Logic for checking the specific mobile browser
  //
  /* var type = type != void 0 ? type.toLowerCase() : ''
   , result;
   switch(type) {
   case '':
   result = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
   return result;
   break;
   case 'ipad':
   return navigator.userAgent.indexOf('iPad') > -1;
   break;
   case 'android':
   return navigator.userAgent.indexOf('Android') > -1;
   break;
   case 'windows':
   return navigator.userAgent.indexOf('IEMobile') > -1;
   break;
   default:
   throw new Error('Invalid isMobileBrowser argument');
   break;
   } */
}

export function isTouchSupported() {
  return ('ontouchstart' in window);
}

export function stopPropagation(event) {
  // ie8
  //http://msdn.microsoft.com/en-us/library/ie/ff975462(v=vs.85).aspx
  if (typeof (event.stopPropagation) === 'function') {
    event.stopPropagation();
  }
  else {
    event.cancelBubble = true;
  }
}

export function pageX(event) {
  if (event.pageX) {
    return event.pageX;
  }

  var scrollLeft = dom.getWindowScrollLeft();
  var cursorX = event.clientX + scrollLeft;

  return cursorX;
}

export function pageY(event) {
  if (event.pageY) {
    return event.pageY;
  }

  var scrollTop = dom.getWindowScrollTop();
  var cursorY = event.clientY + scrollTop;

  return cursorY;
}

export function defineGetter(object, property, value, options) {
  options.value = value;
  options.writable = options.writable === false ? false : true;
  options.enumerable = options.enumerable === false ? false : true;
  options.configurable = options.configurable === false ? false : true;

  Object.defineProperty(object, property, options);
}

// https://gist.github.com/paulirish/1579671
let lastTime = 0;
let vendors = ['ms', 'moz', 'webkit', 'o'];
let _requestAnimationFrame = window.requestAnimationFrame;
let _cancelAnimationFrame = window.cancelAnimationFrame;

for (let x = 0; x < vendors.length && !_requestAnimationFrame; ++x) {
  _requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  _cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

if (!_requestAnimationFrame) {
  _requestAnimationFrame = function(callback) {
    let currTime = new Date().getTime();
    let timeToCall = Math.max(0, 16 - (currTime - lastTime));
    let id = window.setTimeout(function() {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;

    return id;
  };
}

if (!_cancelAnimationFrame) {
  _cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

/**
 * Polyfill for requestAnimationFrame
 *
 * @param {Function} callback
 * @returns {Number}
 */
export function requestAnimationFrame(callback) {
  return _requestAnimationFrame.call(window, callback);
}

/**
 * Polyfill for cancelAnimationFrame
 *
 * @param {Number} id
 */
export function cancelAnimationFrame(id) {
  _cancelAnimationFrame.call(window, id);
}

/**
 * A specialized version of `.reduce` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {Boolean} [initFromArray] Specify using the first element of `array` as the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initFromArray) {
  let index = -1,
    length = array.length;

  if (initFromArray && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }

  return accumulator;
}

/**
 * A specialized version of `.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
export function arrayFilter(array, predicate) {
  let index = -1,
    length = array.length,
    resIndex = -1,
    result = [];

  while (++index < length) {
    let value = array[index];

    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
  }

  return result;
}

/**
 * A specialized version of `.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * {@link https://github.com/lodash/lodash/blob/master/lodash.js}
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
export function arrayEach(array, iteratee) {
  let index = -1,
    length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }

  return array;
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
 * A specialized version of `.forEach` defined by ranges.
 *
 * @param {Number} rangeFrom The number from start iterate.
 * @param {Number} rangeTo The number where finish iterate.
 * @param {Function} iteratee The function invoked per iteration.
 */
export function rangeEach(rangeFrom, rangeTo, iteratee) {
  let index = -1;

  if (typeof rangeTo === 'function') {
    iteratee = rangeTo;
    rangeTo = rangeFrom;
  } else {
    index = rangeFrom - 1;
  }
  while (++index <= rangeTo) {
    if (iteratee(index) === false) {
      break;
    }
  }
}

/**
 * Calculate sum value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {Number} Returns calculated sum value.
 */
export function arraySum(array) {
  return arrayReduce(array, (a, b) => (a + b), 0);
}

/**
 * Calculate average value for each item of the array.
 *
 * @param {Array} array The array to process.
 * @returns {Number} Returns calculated average value.
 */
export function arrayAvg(array) {
  if (!array.length) {
    return 0;
  }

  return arraySum(array) / array.length;
}

/**
 * Checks if value is valid percent.
 *
 * @param {String} value
 * @returns {Boolean}
 */
export function isPercentValue(value) {
  return /^([0-9][0-9]?\%$)|(^100\%$)/.test(value);
}

/**
 * Calculate value from percent.
 *
 * @param {Number} value Base value from percent will be calculated.
 * @param {String|Number} percent Can be Number or String (eq. `'33%'`).
 * @returns {Number}
 */
export function valueAccordingPercent(value, percent) {
  percent = parseInt(percent.toString().replace('%', ''), 10);
  percent = parseInt(value * percent / 100);

  return percent;
}

/**
 * Creates throttle function that invokes `func` only once per `wait` (in miliseconds).
 *
 * @param {Function} func
 * @param {Number} wait
 * @returns {Function}
 */
export function throttle(func, wait = 200) {
  let lastCalled = 0;
  let result = {
    lastCallThrottled: true
  };
  let lastTimer = null;

  function _throttle() {
    const args = arguments;
    let stamp = Date.now();
    let needCall = false;

    result.lastCallThrottled = true;

    if (!lastCalled) {
      lastCalled = stamp;
      needCall = true;
    }
    let remaining = wait - (stamp - lastCalled);

    if (needCall) {
      result.lastCallThrottled = false;
      func.apply(this, args);
    } else {
      if (lastTimer) {
        clearTimeout(lastTimer);
      }
      lastTimer = setTimeout(() => {
        result.lastCallThrottled = false;
        func.apply(this, args);
        lastCalled = 0;
        lastTimer = void 0;
      }, remaining);
    }

    return result;
  }

  return _throttle;
}

/**
 * Creates throttle function that invokes `func` only once per `wait` (in miliseconds) after hits.
 *
 * @param {Function} func
 * @param {Number} wait
 * @param {Number} hits
 * @returns {Function}
 */
export function throttleAfterHits(func, wait = 200, hits = 10) {
  const funcThrottle = throttle(func, wait);
  let remainHits = hits;

  function _clearHits() {
    remainHits = hits;
  }
  function _throttleAfterHits() {
    if (remainHits) {
      remainHits --;

      return func.apply(this, arguments);
    }

    return funcThrottle.apply(this, arguments);
  }
  _throttleAfterHits.clearHits = _clearHits;

  return _throttleAfterHits;
}


window.Handsontable = window.Handsontable || {};
Handsontable.helper = {
  arrayAvg,
  arrayEach,
  arrayFilter,
  arrayReduce,
  arraySum,
  cancelAnimationFrame,
  cellMethodLookupFactory,
  columnFactory,
  createSpreadsheetData,
  createSpreadsheetObjectData,
  deepClone,
  deepExtend,
  defineGetter,
  duckSchema,
  equalsIgnoreCase,
  extend,
  extendArray,
  getPrototypeOf,
  inherit,
  isCtrlKey,
  isInput,
  isMetaKey,
  isMobileBrowser,
  isNumeric,
  isObject,
  isObjectEquals,
  isOutsideInput,
  isPercentValue,
  isPrintableChar,
  isTouchSupported,
  keyCode,
  objectEach,
  pageX,
  pageY,
  pivot,
  proxy,
  randomString,
  rangeEach,
  requestAnimationFrame,
  spreadsheetColumnLabel,
  stopPropagation,
  stringify,
  throttle,
  throttleAfterHits,
  to2dArray,
  toUpperCaseFirst,
  translateRowsToColumns,
  valueAccordingPercent
};
