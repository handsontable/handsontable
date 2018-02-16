(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["formulaParser"] = factory();
	else
		root["formulaParser"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

exports.nil = new Error('#NULL!');
exports.div0 = new Error('#DIV/0!');
exports.value = new Error('#VALUE!');
exports.ref = new Error('#REF!');
exports.name = new Error('#NAME?');
exports.num = new Error('#NUM!');
exports.na = new Error('#N/A');
exports.error = new Error('#ERROR!');
exports.data = new Error('#GETTING_DATA');


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);

exports.flattenShallow = function(array) {
  if (!array || !array.reduce) {
    return array;
  }

  return array.reduce(function(a, b) {
    var aIsArray = Array.isArray(a);
    var bIsArray = Array.isArray(b);

    if (aIsArray && bIsArray ) {
      return a.concat(b);
    }
    if (aIsArray) {
      a.push(b);

      return a;
    }
    if (bIsArray) {
      return [a].concat(b);
    }

    return [a, b];
  });
};

exports.isFlat = function(array) {
  if (!array) {
    return false;
  }

  for (var i = 0; i < array.length; ++i) {
    if (Array.isArray(array[i])) {
      return false;
    }
  }

  return true;
};

exports.flatten = function() {
  var result = exports.argsToArray.apply(null, arguments);

  while (!exports.isFlat(result)) {
    result = exports.flattenShallow(result);
  }

  return result;
};

exports.argsToArray = function(args) {
  var result = [];

  exports.arrayEach(args, function(value) {
    result.push(value);
  });

  return result;
};

exports.numbers = function() {
  var possibleNumbers = this.flatten.apply(null, arguments);
  return possibleNumbers.filter(function(el) {
    return typeof el === 'number';
  });
};

exports.cleanFloat = function(number) {
  var power = 1e14;
  return Math.round(number * power) / power;
};

exports.parseBool = function(bool) {
  if (typeof bool === 'boolean') {
    return bool;
  }

  if (bool instanceof Error) {
    return bool;
  }

  if (typeof bool === 'number') {
    return bool !== 0;
  }

  if (typeof bool === 'string') {
    var up = bool.toUpperCase();
    if (up === 'TRUE') {
      return true;
    }

    if (up === 'FALSE') {
      return false;
    }
  }

  if (bool instanceof Date && !isNaN(bool)) {
    return true;
  }

  return error.value;
};

exports.parseNumber = function(string) {
  if (string === undefined || string === '') {
    return error.value;
  }
  if (!isNaN(string)) {
    return parseFloat(string);
  }

  return error.value;
};

exports.parseNumberArray = function(arr) {
  var len;

  if (!arr || (len = arr.length) === 0) {
    return error.value;
  }

  var parsed;

  while (len--) {
    parsed = exports.parseNumber(arr[len]);
    if (parsed === error.value) {
      return parsed;
    }
    arr[len] = parsed;
  }

  return arr;
};

exports.parseMatrix = function(matrix) {
  var n;

  if (!matrix || (n = matrix.length) === 0) {
    return error.value;
  }
  var pnarr;

  for (var i = 0; i < matrix.length; i++) {
    pnarr = exports.parseNumberArray(matrix[i]);
    matrix[i] = pnarr;

    if (pnarr instanceof Error) {
      return pnarr;
    }
  }

  return matrix;
};

var d1900 = new Date(1900, 0, 1);
exports.parseDate = function(date) {
  if (!isNaN(date)) {
    if (date instanceof Date) {
      return new Date(date);
    }
    var d = parseInt(date, 10);
    if (d < 0) {
      return error.num;
    }
    if (d <= 60) {
      return new Date(d1900.getTime() + (d - 1) * 86400000);
    }
    return new Date(d1900.getTime() + (d - 2) * 86400000);
  }
  if (typeof date === 'string') {
    date = new Date(date);
    if (!isNaN(date)) {
      return date;
    }
  }
  return error.value;
};

exports.parseDateArray = function(arr) {
  var len = arr.length;
  var parsed;
  while (len--) {
    parsed = this.parseDate(arr[len]);
    if (parsed === error.value) {
      return parsed;
    }
    arr[len] = parsed;
  }
  return arr;
};

exports.anyIsError = function() {
  var n = arguments.length;
  while (n--) {
    if (arguments[n] instanceof Error) {
      return true;
    }
  }
  return false;
};

exports.arrayValuesToNumbers = function(arr) {
  var n = arr.length;
  var el;
  while (n--) {
    el = arr[n];
    if (typeof el === 'number') {
      continue;
    }
    if (el === true) {
      arr[n] = 1;
      continue;
    }
    if (el === false) {
      arr[n] = 0;
      continue;
    }
    if (typeof el === 'string') {
      var number = this.parseNumber(el);
      if (number instanceof Error) {
        arr[n] = 0;
      } else {
        arr[n] = number;
      }
    }
  }
  return arr;
};

exports.rest = function(array, idx) {
  idx = idx || 1;
  if (!array || typeof array.slice !== 'function') {
    return array;
  }
  return array.slice(idx);
};

exports.initial = function(array, idx) {
  idx = idx || 1;
  if (!array || typeof array.slice !== 'function') {
    return array;
  }
  return array.slice(0, array.length - idx);
};

exports.arrayEach = function(array, iteratee) {
  var index = -1, length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }

  return array;
};

exports.transpose = function(matrix) {
  if(!matrix) { 
    return error.value;
  }

  return matrix[0].map(function(col, i) { 
    return matrix.map(function(row) { 
      return row[i];
    });
  });
};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _errors;

exports['default'] = error;
exports.isValidStrict = isValidStrict;
var ERROR = exports.ERROR = 'ERROR';
var ERROR_DIV_ZERO = exports.ERROR_DIV_ZERO = 'DIV/0';
var ERROR_NAME = exports.ERROR_NAME = 'NAME';
var ERROR_NOT_AVAILABLE = exports.ERROR_NOT_AVAILABLE = 'N/A';
var ERROR_NULL = exports.ERROR_NULL = 'NULL';
var ERROR_NUM = exports.ERROR_NUM = 'NUM';
var ERROR_REF = exports.ERROR_REF = 'REF';
var ERROR_VALUE = exports.ERROR_VALUE = 'VALUE';

var errors = (_errors = {}, _errors[ERROR] = '#ERROR!', _errors[ERROR_DIV_ZERO] = '#DIV/0!', _errors[ERROR_NAME] = '#NAME?', _errors[ERROR_NOT_AVAILABLE] = '#N/A', _errors[ERROR_NULL] = '#NULL!', _errors[ERROR_NUM] = '#NUM!', _errors[ERROR_REF] = '#REF!', _errors[ERROR_VALUE] = '#VALUE!', _errors);

/**
 * Return error type based on provided error id.
 *
 * @param {String} type Error type.
 * @returns {String|null} Returns error id.
 */
function error(type) {
  var result = void 0;

  type = (type + '').replace(/#|!|\?/g, '');

  if (errors[type]) {
    result = errors[type];
  }

  return result ? result : null;
}

/**
 * Check if error type is strict valid with knows errors.
 *
 * @param {String} Error type.
 * @return {Boolean}
 */
function isValidStrict(type) {
  var valid = false;

  for (var i in errors) {
    if (Object.prototype.hasOwnProperty.call(errors, i) && errors[i] === type) {
      valid = true;
      break;
    }
  }

  return valid;
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.toNumber = toNumber;
exports.invertNumber = invertNumber;
/**
 * Convert value into number.
 *
 * @param {String|Number} number
 * @returns {*}
 */
function toNumber(number) {
  var result = void 0;

  if (typeof number === 'number') {
    result = number;
  } else if (typeof number === 'string') {
    result = number.indexOf('.') > -1 ? parseFloat(number) : parseInt(number, 10);
  }

  return result;
}

/**
 * Invert provided number.
 *
 * @param {Number} number
 * @returns {Number} Returns inverted number.
 */
function invertNumber(number) {
  return -1 * toNumber(number);
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var utils = __webpack_require__(1);
var error = __webpack_require__(0);
var statistical = __webpack_require__(5);
var information = __webpack_require__(7);

exports.ABS = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = Math.abs(number);

  return result;
};

exports.ACOS = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = Math.acos(number);

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.ACOSH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = Math.log(number + Math.sqrt(number * number - 1));

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.ACOT = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = Math.atan(1 / number);

  return result;
};

exports.ACOTH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = 0.5 * Math.log((number + 1) / (number - 1));

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

//TODO: use options
exports.AGGREGATE = function(function_num, options, ref1, ref2) {
  function_num = utils.parseNumber(function_num);
  options = utils.parseNumber(function_num);
  if (utils.anyIsError(function_num, options)) {
    return error.value;
  }
  switch (function_num) {
    case 1:
      return statistical.AVERAGE(ref1);
    case 2:
      return statistical.COUNT(ref1);
    case 3:
      return statistical.COUNTA(ref1);
    case 4:
      return statistical.MAX(ref1);
    case 5:
      return statistical.MIN(ref1);
    case 6:
      return exports.PRODUCT(ref1);
    case 7:
      return statistical.STDEV.S(ref1);
    case 8:
      return statistical.STDEV.P(ref1);
    case 9:
      return exports.SUM(ref1);
    case 10:
      return statistical.VAR.S(ref1);
    case 11:
      return statistical.VAR.P(ref1);
    case 12:
      return statistical.MEDIAN(ref1);
    case 13:
      return statistical.MODE.SNGL(ref1);
    case 14:
      return statistical.LARGE(ref1, ref2);
    case 15:
      return statistical.SMALL(ref1, ref2);
    case 16:
      return statistical.PERCENTILE.INC(ref1, ref2);
    case 17:
      return statistical.QUARTILE.INC(ref1, ref2);
    case 18:
      return statistical.PERCENTILE.EXC(ref1, ref2);
    case 19:
      return statistical.QUARTILE.EXC(ref1, ref2);
  }
};

exports.ARABIC = function(text) {
  // Credits: Rafa? Kukawski
  if (!/^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/.test(text)) {
    return error.value;
  }
  var r = 0;
  text.replace(/[MDLV]|C[MD]?|X[CL]?|I[XV]?/g, function(i) {
    r += {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    }[i];
  });
  return r;
};

exports.ASIN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = Math.asin(number);

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.ASINH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.log(number + Math.sqrt(number * number + 1));
};

exports.ATAN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.atan(number);
};

exports.ATAN2 = function(number_x, number_y) {
  number_x = utils.parseNumber(number_x);
  number_y = utils.parseNumber(number_y);
  if (utils.anyIsError(number_x, number_y)) {
    return error.value;
  }
  return Math.atan2(number_x, number_y);
};

exports.ATANH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var result = Math.log((1 + number) / (1 - number)) / 2;

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.BASE = function(number, radix, min_length) {
  min_length = min_length || 0;

  number = utils.parseNumber(number);
  radix = utils.parseNumber(radix);
  min_length = utils.parseNumber(min_length);
  if (utils.anyIsError(number, radix, min_length)) {
    return error.value;
  }
  min_length = (min_length === undefined) ? 0 : min_length;
  var result = number.toString(radix);
  return new Array(Math.max(min_length + 1 - result.length, 0)).join('0') + result;
};

exports.CEILING = function(number, significance, mode) {
  significance = (significance === undefined) ? 1 : Math.abs(significance);
  mode = mode || 0;

  number = utils.parseNumber(number);
  significance = utils.parseNumber(significance);
  mode = utils.parseNumber(mode);
  if (utils.anyIsError(number, significance, mode)) {
    return error.value;
  }
  if (significance === 0) {
    return 0;
  }
  var precision = -Math.floor(Math.log(significance) / Math.log(10));
  if (number >= 0) {
    return exports.ROUND(Math.ceil(number / significance) * significance, precision);
  } else {
    if (mode === 0) {
      return -exports.ROUND(Math.floor(Math.abs(number) / significance) * significance, precision);
    } else {
      return -exports.ROUND(Math.ceil(Math.abs(number) / significance) * significance, precision);
    }
  }
};

exports.CEILING.MATH = exports.CEILING;

exports.CEILING.PRECISE = exports.CEILING;

exports.COMBIN = function(number, number_chosen) {
  number = utils.parseNumber(number);
  number_chosen = utils.parseNumber(number_chosen);
  if (utils.anyIsError(number, number_chosen)) {
    return error.value;
  }
  return exports.FACT(number) / (exports.FACT(number_chosen) * exports.FACT(number - number_chosen));
};

exports.COMBINA = function(number, number_chosen) {
  number = utils.parseNumber(number);
  number_chosen = utils.parseNumber(number_chosen);
  if (utils.anyIsError(number, number_chosen)) {
    return error.value;
  }
  return (number === 0 && number_chosen === 0) ? 1 : exports.COMBIN(number + number_chosen - 1, number - 1);
};

exports.COS = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.cos(number);
};

exports.COSH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return (Math.exp(number) + Math.exp(-number)) / 2;
};

exports.COT = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return 1 / Math.tan(number);
};

exports.COTH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var e2 = Math.exp(2 * number);
  return (e2 + 1) / (e2 - 1);
};

exports.CSC = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return 1 / Math.sin(number);
};

exports.CSCH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return 2 / (Math.exp(number) - Math.exp(-number));
};

exports.DECIMAL = function(number, radix) {
  if (arguments.length < 1) {
    return error.value;
  }

  return parseInt(number, radix);
};

exports.DEGREES = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return number * 180 / Math.PI;
};

exports.EVEN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return exports.CEILING(number, -2, -1);
};

exports.EXP = function(number) {
  if (arguments.length < 1) {
    return error.na;
  }
  if (typeof number !== 'number' || arguments.length > 1) {
    return error.error;
  }

  number = Math.exp(number);

  return number;
};

var MEMOIZED_FACT = [];
exports.FACT = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var n = Math.floor(number);
  if (n === 0 || n === 1) {
    return 1;
  } else if (MEMOIZED_FACT[n] > 0) {
    return MEMOIZED_FACT[n];
  } else {
    MEMOIZED_FACT[n] = exports.FACT(n - 1) * n;
    return MEMOIZED_FACT[n];
  }
};

exports.FACTDOUBLE = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var n = Math.floor(number);
  if (n <= 0) {
    return 1;
  } else {
    return n * exports.FACTDOUBLE(n - 2);
  }
};

exports.FLOOR = function(number, significance) {
  number = utils.parseNumber(number);
  significance = utils.parseNumber(significance);
  if (utils.anyIsError(number, significance)) {
    return error.value;
  }
  if (significance === 0) {
    return 0;
  }

  if (!(number > 0 && significance > 0) && !(number < 0 && significance < 0)) {
    return error.num;
  }

  significance = Math.abs(significance);
  var precision = -Math.floor(Math.log(significance) / Math.log(10));
  if (number >= 0) {
    return exports.ROUND(Math.floor(number / significance) * significance, precision);
  } else {
    return -exports.ROUND(Math.ceil(Math.abs(number) / significance), precision);
  }
};

//TODO: Verify
exports.FLOOR.MATH = function(number, significance, mode) {
  significance = (significance === undefined) ? 1 : significance;
  mode = (mode === undefined) ? 0 : mode;

  number = utils.parseNumber(number);
  significance = utils.parseNumber(significance);
  mode = utils.parseNumber(mode);
  if (utils.anyIsError(number, significance, mode)) {
    return error.value;
  }
  if (significance === 0) {
    return 0;
  }

  significance = significance ? Math.abs(significance) : 1;
  var precision = -Math.floor(Math.log(significance) / Math.log(10));
  if (number >= 0) {
    return exports.ROUND(Math.floor(number / significance) * significance, precision);
  } else if (mode === 0 || mode === undefined) {
    return -exports.ROUND(Math.ceil(Math.abs(number) / significance) * significance, precision);
  }
  return -exports.ROUND(Math.floor(Math.abs(number) / significance) * significance, precision);
};

// Deprecated
exports.FLOOR.PRECISE = exports.FLOOR.MATH;

// adapted http://rosettacode.org/wiki/Greatest_common_divisor#JavaScript
exports.GCD = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var n = range.length;
  var r0 = range[0];
  var x = r0 < 0 ? -r0 : r0;
  for (var i = 1; i < n; i++) {
    var ri = range[i];
    var y = ri < 0 ? -ri : ri;
    while (x && y) {
      if (x > y) {
        x %= y;
      } else {
        y %= x;
      }
    }
    x += y;
  }
  return x;
};


exports.INT = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.floor(number);
};

//TODO: verify
exports.ISO = {
  CEILING: exports.CEILING
};

exports.LCM = function() {
  // Credits: Jonas Raoni Soares Silva
  var o = utils.parseNumberArray(utils.flatten(arguments));
  if (o instanceof Error) {
    return o;
  }
  for (var i, j, n, d, r = 1;
       (n = o.pop()) !== undefined;) {
    while (n > 1) {
      if (n % 2) {
        for (i = 3, j = Math.floor(Math.sqrt(n)); i <= j && n % i; i += 2) {
          //empty
        }
        d = (i <= j) ? i : n;
      } else {
        d = 2;
      }
      for (n /= d, r *= d, i = o.length; i;
           (o[--i] % d) === 0 && (o[i] /= d) === 1 && o.splice(i, 1)) {
        //empty
      }
    }
  }
  return r;
};

exports.LN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.log(number);
};

exports.LN10 = function() {
  return Math.log(10);
};

exports.LN2 = function() {
  return Math.log(2);
};

exports.LOG10E = function() {
  return Math.LOG10E;
};

exports.LOG2E = function() {
  return Math.LOG2E;
};

exports.LOG = function(number, base) {
  number = utils.parseNumber(number);
  base = utils.parseNumber(base);
  if (utils.anyIsError(number, base)) {
    return error.value;
  }
  base = (base === undefined) ? 10 : base;
  return Math.log(number) / Math.log(base);
};

exports.LOG10 = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.log(number) / Math.log(10);
};

exports.MOD = function(dividend, divisor) {
  dividend = utils.parseNumber(dividend);
  divisor = utils.parseNumber(divisor);
  if (utils.anyIsError(dividend, divisor)) {
    return error.value;
  }
  if (divisor === 0) {
    return error.div0;
  }
  var modulus = Math.abs(dividend % divisor);
  return (divisor > 0) ? modulus : -modulus;
};

exports.MROUND = function(number, multiple) {
  number = utils.parseNumber(number);
  multiple = utils.parseNumber(multiple);
  if (utils.anyIsError(number, multiple)) {
    return error.value;
  }
  if (number * multiple < 0) {
    return error.num;
  }

  return Math.round(number / multiple) * multiple;
};

exports.MULTINOMIAL = function() {
  var args = utils.parseNumberArray(utils.flatten(arguments));
  if (args instanceof Error) {
    return args;
  }
  var sum = 0;
  var divisor = 1;
  for (var i = 0; i < args.length; i++) {
    sum += args[i];
    divisor *= exports.FACT(args[i]);
  }
  return exports.FACT(sum) / divisor;
};

exports.ODD = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var temp = Math.ceil(Math.abs(number));
  temp = (temp & 1) ? temp : temp + 1;
  return (number > 0) ? temp : -temp;
};

exports.PI = function() {
  return Math.PI;
};

exports.E = function() {
  return Math.E;
};

exports.POWER = function(number, power) {
  number = utils.parseNumber(number);
  power = utils.parseNumber(power);
  if (utils.anyIsError(number, power)) {
    return error.value;
  }
  var result = Math.pow(number, power);
  if (isNaN(result)) {
    return error.num;
  }

  return result;
};

exports.PRODUCT = function() {
  var args = utils.parseNumberArray(utils.flatten(arguments));
  if (args instanceof Error) {
    return args;
  }
  var result = 1;
  for (var i = 0; i < args.length; i++) {
    result *= args[i];
  }
  return result;
};

exports.QUOTIENT = function(numerator, denominator) {
  numerator = utils.parseNumber(numerator);
  denominator = utils.parseNumber(denominator);
  if (utils.anyIsError(numerator, denominator)) {
    return error.value;
  }
  return parseInt(numerator / denominator, 10);
};

exports.RADIANS = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return number * Math.PI / 180;
};

exports.RAND = function() {
  return Math.random();
};

exports.RANDBETWEEN = function(bottom, top) {
  bottom = utils.parseNumber(bottom);
  top = utils.parseNumber(top);
  if (utils.anyIsError(bottom, top)) {
    return error.value;
  }
  // Creative Commons Attribution 3.0 License
  // Copyright (c) 2012 eqcode
  return bottom + Math.ceil((top - bottom + 1) * Math.random()) - 1;
};

// TODO
exports.ROMAN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  // The MIT License
  // Copyright (c) 2008 Steven Levithan
  var digits = String(number).split('');
  var key = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM', '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC', '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  var roman = '';
  var i = 3;
  while (i--) {
    roman = (key[+digits.pop() + (i * 10)] || '') + roman;
  }
  return new Array(+digits.join('') + 1).join('M') + roman;
};

exports.ROUND = function(number, digits) {
  number = utils.parseNumber(number);
  digits = utils.parseNumber(digits);
  if (utils.anyIsError(number, digits)) {
    return error.value;
  }
  return Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);
};

exports.ROUNDDOWN = function(number, digits) {
  number = utils.parseNumber(number);
  digits = utils.parseNumber(digits);
  if (utils.anyIsError(number, digits)) {
    return error.value;
  }
  var sign = (number > 0) ? 1 : -1;
  return sign * (Math.floor(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
};

exports.ROUNDUP = function(number, digits) {
  number = utils.parseNumber(number);
  digits = utils.parseNumber(digits);
  if (utils.anyIsError(number, digits)) {
    return error.value;
  }
  var sign = (number > 0) ? 1 : -1;
  return sign * (Math.ceil(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
};

exports.SEC = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return 1 / Math.cos(number);
};

exports.SECH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return 2 / (Math.exp(number) + Math.exp(-number));
};

exports.SERIESSUM = function(x, n, m, coefficients) {
  x = utils.parseNumber(x);
  n = utils.parseNumber(n);
  m = utils.parseNumber(m);
  coefficients = utils.parseNumberArray(coefficients);
  if (utils.anyIsError(x, n, m, coefficients)) {
    return error.value;
  }
  var result = coefficients[0] * Math.pow(x, n);
  for (var i = 1; i < coefficients.length; i++) {
    result += coefficients[i] * Math.pow(x, n + i * m);
  }
  return result;
};

exports.SIGN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  if (number < 0) {
    return -1;
  } else if (number === 0) {
    return 0;
  } else {
    return 1;
  }
};

exports.SIN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.sin(number);
};

exports.SINH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return (Math.exp(number) - Math.exp(-number)) / 2;
};

exports.SQRT = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  if (number < 0) {
    return error.num;
  }
  return Math.sqrt(number);
};

exports.SQRTPI = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.sqrt(number * Math.PI);
};

exports.SQRT1_2 = function() {
  return 1 / Math.sqrt(2);
};

exports.SQRT2 = function() {
  return Math.sqrt(2);
};

exports.SUBTOTAL = function(function_code, ref1) {
  function_code = utils.parseNumber(function_code);
  if (function_code instanceof Error) {
    return function_code;
  }
  switch (function_code) {
    case 1:
      return statistical.AVERAGE(ref1);
    case 2:
      return statistical.COUNT(ref1);
    case 3:
      return statistical.COUNTA(ref1);
    case 4:
      return statistical.MAX(ref1);
    case 5:
      return statistical.MIN(ref1);
    case 6:
      return exports.PRODUCT(ref1);
    case 7:
      return statistical.STDEV.S(ref1);
    case 8:
      return statistical.STDEV.P(ref1);
    case 9:
      return exports.SUM(ref1);
    case 10:
      return statistical.VAR.S(ref1);
    case 11:
      return statistical.VAR.P(ref1);
    // no hidden values for us
    case 101:
      return statistical.AVERAGE(ref1);
    case 102:
      return statistical.COUNT(ref1);
    case 103:
      return statistical.COUNTA(ref1);
    case 104:
      return statistical.MAX(ref1);
    case 105:
      return statistical.MIN(ref1);
    case 106:
      return exports.PRODUCT(ref1);
    case 107:
      return statistical.STDEV.S(ref1);
    case 108:
      return statistical.STDEV.P(ref1);
    case 109:
      return exports.SUM(ref1);
    case 110:
      return statistical.VAR.S(ref1);
    case 111:
      return statistical.VAR.P(ref1);

  }
};

exports.ADD = function (num1, num2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  num1 = utils.parseNumber(num1);
  num2 = utils.parseNumber(num2);
  if (utils.anyIsError(num1, num2)) {
    return error.value;
  }

  return num1 + num2;
};

exports.MINUS = function (num1, num2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  num1 = utils.parseNumber(num1);
  num2 = utils.parseNumber(num2);
  if (utils.anyIsError(num1, num2)) {
    return error.value;
  }

  return num1 - num2;
};

exports.DIVIDE = function (dividend, divisor) {
  if (arguments.length !== 2) {
    return error.na;
  }

  dividend = utils.parseNumber(dividend);
  divisor = utils.parseNumber(divisor);
  if (utils.anyIsError(dividend, divisor)) {
    return error.value;
  }

  if (divisor === 0) {
    return error.div0;
  }

  return dividend / divisor;
};

exports.MULTIPLY = function (factor1, factor2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  factor1 = utils.parseNumber(factor1);
  factor2 = utils.parseNumber(factor2);
  if (utils.anyIsError(factor1, factor2)) {
    return error.value;
  }

  return factor1 * factor2;
};

exports.GTE = function (num1, num2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  num1 = utils.parseNumber(num1);
  num2 = utils.parseNumber(num2);
  if (utils.anyIsError(num1, num2)) {
    return error.error;
  }

  return num1 >= num2;
};

exports.LT = function (num1, num2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  num1 = utils.parseNumber(num1);
  num2 = utils.parseNumber(num2);
  if (utils.anyIsError(num1, num2)) {
    return error.error;
  }

  return num1 < num2;
};


exports.LTE = function (num1, num2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  num1 = utils.parseNumber(num1);
  num2 = utils.parseNumber(num2);
  if (utils.anyIsError(num1, num2)) {
    return error.error;
  }

  return num1 <= num2;
};

exports.EQ = function (value1, value2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  return value1 === value2;
};

exports.NE = function (value1, value2) {
  if (arguments.length !== 2) {
    return error.na;
  }

  return value1 !== value2;
};

exports.POW = function (base, exponent) {
  if (arguments.length !== 2) {
    return error.na;
  }

  base = utils.parseNumber(base);
  exponent = utils.parseNumber(exponent);
  if (utils.anyIsError(base, exponent)) {
    return error.error;
  }

  return exports.POWER(base, exponent);
};

exports.SUM = function() {
  var result = 0;

  utils.arrayEach(utils.argsToArray(arguments), function(value) {
    if (typeof value === 'number') {
      result += value;

    } else if (typeof value === 'string') {
      var parsed = parseFloat(value);

      !isNaN(parsed) && (result += parsed);

    } else if (Array.isArray(value)) {
      result += exports.SUM.apply(null, value);
    }
  });

  return result;
};

exports.SUMIF = function(range, criteria) {
  range = utils.parseNumberArray(utils.flatten(range));
  if (range instanceof Error) {
    return range;
  }
  var result = 0;
  for (var i = 0; i < range.length; i++) {
    result += (eval(range[i] + criteria)) ? range[i] : 0; // jshint ignore:line
  }
  return result;
};

exports.SUMIFS = function() {
  var args = utils.argsToArray(arguments);
  var range = utils.parseNumberArray(utils.flatten(args.shift()));
  if (range instanceof Error) {
    return range;
  }
  var criteria = args;

  var n_range_elements = range.length;
  var n_criterias = criteria.length;

  var result = 0;
  for (var i = 0; i < n_range_elements; i++) {
    var el = range[i];
    var condition = '';
    for (var c = 0; c < n_criterias; c++) {
      condition += el + criteria[c];
      if (c !== n_criterias - 1) {
        condition += '&&';
      }
    }
    if (eval(condition)) { // jshint ignore:line
      result += el;
    }
  }
  return result;
};

exports.SUMPRODUCT = function() {
  if (!arguments || arguments.length === 0) {
    return error.value;
  }
  var arrays = arguments.length + 1;
  var result = 0;
  var product;
  var k;
  var _i;
  var _ij;
  for (var i = 0; i < arguments[0].length; i++) {
    if (!(arguments[0][i] instanceof Array)) {
      product = 1;
      for (k = 1; k < arrays; k++) {
        _i = utils.parseNumber(arguments[k - 1][i]);
        if (_i instanceof Error) {
          return _i;
        }
        product *= _i;
      }
      result += product;
    } else {
      for (var j = 0; j < arguments[0][i].length; j++) {
        product = 1;
        for (k = 1; k < arrays; k++) {
          _ij = utils.parseNumber(arguments[k - 1][i][j]);
          if (_ij instanceof Error) {
            return _ij;
          }
          product *= _ij;
        }
        result += product;
      }
    }
  }
  return result;
};

exports.SUMSQ = function() {
  var numbers = utils.parseNumberArray(utils.flatten(arguments));
  if (numbers instanceof Error) {
    return numbers;
  }
  var result = 0;
  var length = numbers.length;
  for (var i = 0; i < length; i++) {
    result += (information.ISNUMBER(numbers[i])) ? numbers[i] * numbers[i] : 0;
  }
  return result;
};

exports.SUMX2MY2 = function(array_x, array_y) {
  array_x = utils.parseNumberArray(utils.flatten(array_x));
  array_y = utils.parseNumberArray(utils.flatten(array_y));
  if (utils.anyIsError(array_x, array_y)) {
    return error.value;
  }
  var result = 0;
  for (var i = 0; i < array_x.length; i++) {
    result += array_x[i] * array_x[i] - array_y[i] * array_y[i];
  }
  return result;
};

exports.SUMX2PY2 = function(array_x, array_y) {
  array_x = utils.parseNumberArray(utils.flatten(array_x));
  array_y = utils.parseNumberArray(utils.flatten(array_y));
  if (utils.anyIsError(array_x, array_y)) {
    return error.value;
  }
  var result = 0;
  array_x = utils.parseNumberArray(utils.flatten(array_x));
  array_y = utils.parseNumberArray(utils.flatten(array_y));
  for (var i = 0; i < array_x.length; i++) {
    result += array_x[i] * array_x[i] + array_y[i] * array_y[i];
  }
  return result;
};

exports.SUMXMY2 = function(array_x, array_y) {
  array_x = utils.parseNumberArray(utils.flatten(array_x));
  array_y = utils.parseNumberArray(utils.flatten(array_y));
  if (utils.anyIsError(array_x, array_y)) {
    return error.value;
  }
  var result = 0;
  array_x = utils.flatten(array_x);
  array_y = utils.flatten(array_y);
  for (var i = 0; i < array_x.length; i++) {
    result += Math.pow(array_x[i] - array_y[i], 2);
  }
  return result;
};

exports.TAN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return Math.tan(number);
};

exports.TANH = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  var e2 = Math.exp(2 * number);
  return (e2 - 1) / (e2 + 1);
};

exports.TRUNC = function(number, digits) {
  digits = (digits === undefined) ? 0 : digits;
  number = utils.parseNumber(number);
  digits = utils.parseNumber(digits);
  if (utils.anyIsError(number, digits)) {
    return error.value;
  }
  var sign = (number > 0) ? 1 : -1;
  return sign * (Math.floor(Math.abs(number) * Math.pow(10, digits))) / Math.pow(10, digits);
};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var mathTrig = __webpack_require__(4);
var text = __webpack_require__(6);
var jStat = __webpack_require__(11).jStat;
var utils = __webpack_require__(1);
var error = __webpack_require__(0);
var misc = __webpack_require__(12);

var SQRT2PI = 2.5066282746310002;

exports.AVEDEV = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  return jStat.sum(jStat(range).subtract(jStat.mean(range)).abs()[0]) / range.length;
};

exports.AVERAGE = function() {
  var range = utils.numbers(utils.flatten(arguments));
  var n = range.length;
  var sum = 0;
  var count = 0;
  var result;

  for (var i = 0; i < n; i++) {
    sum += range[i];
    count += 1;
  }
  result = sum / count;

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.AVERAGEA = function() {
  var range = utils.flatten(arguments);
  var n = range.length;
  var sum = 0;
  var count = 0;
  var result;
  for (var i = 0; i < n; i++) {
    var el = range[i];
    if (typeof el === 'number') {
      sum += el;
    }
    if (el === true) {
      sum++;
    }
    if (el !== null) {
      count++;
    }
  }
  result = sum / count;

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.AVERAGEIF = function(range, criteria, average_range) {
  if (arguments.length <= 1) {
    return error.na;
  }
  average_range = average_range || range;
  range = utils.flatten(range);
  average_range = utils.parseNumberArray(utils.flatten(average_range));
  if (average_range instanceof Error) {
    return average_range;
  }
  var average_count = 0;
  var result = 0;
  for (var i = 0; i < range.length; i++) {
    if (eval(range[i] + criteria)) { // jshint ignore:line
      result += average_range[i];
      average_count++;
    }
  }
  return result / average_count;
};

exports.AVERAGEIFS = function() {
  // Does not work with multi dimensional ranges yet!
  //http://office.microsoft.com/en-001/excel-help/averageifs-function-HA010047493.aspx
  var args = utils.argsToArray(arguments);
  var criteria = (args.length - 1) / 2;
  var range = utils.flatten(args[0]);
  var count = 0;
  var result = 0;
  for (var i = 0; i < range.length; i++) {
    var condition = '';
    for (var j = 0; j < criteria; j++) {
      condition += args[2 * j + 1][i] + args[2 * j + 2];
      if (j !== criteria - 1) {
        condition += '&&';
      }
    }
    if (eval(condition)) { // jshint ignore:line
      result += range[i];
      count++;
    }
  }

  var average = result / count;
  if (isNaN(average)) {
    return 0;
  } else {
    return average;
  }
};

exports.BETA = {};

exports.BETA.DIST = function(x, alpha, beta, cumulative, A, B) {
  if (arguments.length < 4) {
    return error.value;
  }

  A = (A === undefined) ? 0 : A;
  B = (B === undefined) ? 1 : B;

  x = utils.parseNumber(x);
  alpha = utils.parseNumber(alpha);
  beta = utils.parseNumber(beta);
  A = utils.parseNumber(A);
  B = utils.parseNumber(B);
  if (utils.anyIsError(x, alpha, beta, A, B)) {
    return error.value;
  }

  x = (x - A) / (B - A);
  return (cumulative) ? jStat.beta.cdf(x, alpha, beta) : jStat.beta.pdf(x, alpha, beta);
};

exports.BETA.INV = function(probability, alpha, beta, A, B) {
  A = (A === undefined) ? 0 : A;
  B = (B === undefined) ? 1 : B;

  probability = utils.parseNumber(probability);
  alpha = utils.parseNumber(alpha);
  beta = utils.parseNumber(beta);
  A = utils.parseNumber(A);
  B = utils.parseNumber(B);
  if (utils.anyIsError(probability, alpha, beta, A, B)) {
    return error.value;
  }

  return jStat.beta.inv(probability, alpha, beta) * (B - A) + A;
};

exports.BINOM = {};

exports.BINOM.DIST = function(successes, trials, probability, cumulative) {
  successes = utils.parseNumber(successes);
  trials = utils.parseNumber(trials);
  probability = utils.parseNumber(probability);
  cumulative = utils.parseNumber(cumulative);
  if (utils.anyIsError(successes, trials, probability, cumulative)) {
    return error.value;
  }
  return (cumulative) ? jStat.binomial.cdf(successes, trials, probability) : jStat.binomial.pdf(successes, trials, probability);
};

exports.BINOM.DIST.RANGE = function(trials, probability, successes, successes2) {
  successes2 = (successes2 === undefined) ? successes : successes2;

  trials = utils.parseNumber(trials);
  probability = utils.parseNumber(probability);
  successes = utils.parseNumber(successes);
  successes2 = utils.parseNumber(successes2);
  if (utils.anyIsError(trials, probability, successes, successes2)) {
    return error.value;
  }

  var result = 0;
  for (var i = successes; i <= successes2; i++) {
    result += mathTrig.COMBIN(trials, i) * Math.pow(probability, i) * Math.pow(1 - probability, trials - i);
  }
  return result;
};

exports.BINOM.INV = function(trials, probability, alpha) {
  trials = utils.parseNumber(trials);
  probability = utils.parseNumber(probability);
  alpha = utils.parseNumber(alpha);
  if (utils.anyIsError(trials, probability, alpha)) {
    return error.value;
  }

  var x = 0;
  while (x <= trials) {
    if (jStat.binomial.cdf(x, trials, probability) >= alpha) {
      return x;
    }
    x++;
  }
};

exports.CHISQ = {};

exports.CHISQ.DIST = function(x, k, cumulative) {
  x = utils.parseNumber(x);
  k = utils.parseNumber(k);
  if (utils.anyIsError(x, k)) {
    return error.value;
  }

  return (cumulative) ? jStat.chisquare.cdf(x, k) : jStat.chisquare.pdf(x, k);
};

exports.CHISQ.DIST.RT = function(x, k) {
  if (!x | !k) {
    return error.na;
  }

  if (x < 1 || k > Math.pow(10, 10)) {
    return error.num;
  }

  if ((typeof x !== 'number') || (typeof k !== 'number')) {
    return error.value;
  }

  return 1 -  jStat.chisquare.cdf(x, k);
};

exports.CHISQ.INV = function(probability, k) {
  probability = utils.parseNumber(probability);
  k = utils.parseNumber(k);
  if (utils.anyIsError(probability, k)) {
    return error.value;
  }
  return jStat.chisquare.inv(probability, k);
};

exports.CHISQ.INV.RT = function(p, k) {
  if (!p | !k) {
    return error.na;
  }

  if (p < 0 || p > 1 || k < 1 || k > Math.pow(10, 10)) {
    return error.num;
  }

  if ((typeof p !== 'number') || (typeof k !== 'number')) {
    return error.value;
  }

  return jStat.chisquare.inv(1.0 - p, k);
};

exports.CHISQ.TEST = function(observed, expected) {
  if (arguments.length !== 2) {
    return error.na;
  }

  if ((!(observed instanceof Array)) || (!(expected instanceof Array))) {
    return error.value;
  }

  if (observed.length !== expected.length) {
    return error.value;
  }

  if (observed[0] && expected[0] &&
    observed[0].length !== expected[0].length) {
    return error.value;
  }

  var row = observed.length;
  var tmp, i, j;

  // Convert single-dimension array into two-dimension array
  for (i = 0; i < row; i ++) {
    if (!(observed[i] instanceof Array)) {
      tmp = observed[i];
      observed[i] = [];
      observed[i].push(tmp);
    }
    if (!(expected[i] instanceof Array)) {
      tmp = expected[i];
      expected[i] = [];
      expected[i].push(tmp);
    }
  }

  var col = observed[0].length;
  var dof = (col === 1) ? row-1 : (row-1)*(col-1);
  var xsqr = 0;
  var Pi =Math.PI;

  for (i = 0; i < row; i ++) {
    for (j = 0; j < col; j ++) {
      xsqr += Math.pow((observed[i][j] - expected[i][j]), 2) / expected[i][j];
    }
  }

  // Get independency by X square and its degree of freedom
  function ChiSq(xsqr, dof) {
    var p = Math.exp(-0.5 * xsqr);
    if((dof%2) === 1) {
      p = p * Math.sqrt(2 * xsqr/Pi);
    }
    var k = dof;
    while(k >= 2) {
      p = p * xsqr/k;
      k = k - 2;
    }
    var t = p;
    var a = dof;
    while (t > 0.0000000001*p) {
      a = a + 2;
      t = t * xsqr/a;
      p = p + t;
    }
    return 1-p;
  }

  return Math.round(ChiSq(xsqr, dof) * 1000000) / 1000000;
};

exports.COLUMN = function(matrix, index) {
  if (arguments.length !== 2) {
    return error.na;
  }

  if (index < 0) {
    return error.num;
  }

  if (!(matrix instanceof Array) || (typeof index !== 'number')) {
    return error.value;
  }

  if (matrix.length === 0) {
    return undefined;
  }

  return jStat.col(matrix, index);
};

exports.COLUMNS = function(matrix) {
  if (arguments.length !== 1) {
    return error.na;
  }

  if (!(matrix instanceof Array)) {
    return error.value;
  }

  if (matrix.length === 0) {
    return 0;
  }

  return jStat.cols(matrix);
};

exports.CONFIDENCE = {};

exports.CONFIDENCE.NORM = function(alpha, sd, n) {
  alpha = utils.parseNumber(alpha);
  sd = utils.parseNumber(sd);
  n = utils.parseNumber(n);
  if (utils.anyIsError(alpha, sd, n)) {
    return error.value;
  }
  return jStat.normalci(1, alpha, sd, n)[1] - 1;
};

exports.CONFIDENCE.T = function(alpha, sd, n) {
  alpha = utils.parseNumber(alpha);
  sd = utils.parseNumber(sd);
  n = utils.parseNumber(n);
  if (utils.anyIsError(alpha, sd, n)) {
    return error.value;
  }
  return jStat.tci(1, alpha, sd, n)[1] - 1;
};

exports.CORREL = function(array1, array2) {
  array1 = utils.parseNumberArray(utils.flatten(array1));
  array2 = utils.parseNumberArray(utils.flatten(array2));
  if (utils.anyIsError(array1, array2)) {
    return error.value;
  }
  return jStat.corrcoeff(array1, array2);
};

exports.COUNT = function() {
  return utils.numbers(utils.flatten(arguments)).length;
};

exports.COUNTA = function() {
  var range = utils.flatten(arguments);
  return range.length - exports.COUNTBLANK(range);
};

exports.COUNTIN = function (range, value) {
  var result = 0;

  range = utils.flatten(range);

  for (var i = 0; i < range.length; i++) {
    if (range[i] === value) {
      result++;
    }
  }
  return result;
};


exports.COUNTBLANK = function() {
  var range = utils.flatten(arguments);
  var blanks = 0;
  var element;
  for (var i = 0; i < range.length; i++) {
    element = range[i];
    if (element === null || element === '') {
      blanks++;
    }
  }
  return blanks;
};

exports.COUNTIF = function(range, criteria) {
  range = utils.flatten(range);
  if (!/[<>=!]/.test(criteria)) {
    criteria = '=="' + criteria + '"';
  }
  var matches = 0;
  for (var i = 0; i < range.length; i++) {
    if (typeof range[i] !== 'string') {
      if (eval(range[i] + criteria)) { // jshint ignore:line
        matches++;
      }
    } else {
      if (eval('"' + range[i] + '"' + criteria)) { // jshint ignore:line
        matches++;
      }
    }
  }
  return matches;
};

exports.COUNTIFS = function() {
  var args = utils.argsToArray(arguments);
  var results = new Array(utils.flatten(args[0]).length);
  for (var i = 0; i < results.length; i++) {
    results[i] = true;
  }
  for (i = 0; i < args.length; i += 2) {
    var range = utils.flatten(args[i]);
    var criteria = args[i + 1];
    if (!/[<>=!]/.test(criteria)) {
      criteria = '=="' + criteria + '"';
    }
    for (var j = 0; j < range.length; j++) {
      if (typeof range[j] !== 'string') {
        results[j] = results[j] && eval(range[j] + criteria); // jshint ignore:line
      } else {
        results[j] = results[j] && eval('"' + range[j] + '"' + criteria); // jshint ignore:line
      }
    }
  }
  var result = 0;
  for (i = 0; i < results.length; i++) {
    if (results[i]) {
      result++;
    }
  }
  return result;
};

exports.COUNTUNIQUE = function () {
  return misc.UNIQUE.apply(null, utils.flatten(arguments)).length;
};

exports.COVARIANCE = {};

exports.COVARIANCE.P = function(array1, array2) {
  array1 = utils.parseNumberArray(utils.flatten(array1));
  array2 = utils.parseNumberArray(utils.flatten(array2));
  if (utils.anyIsError(array1, array2)) {
    return error.value;
  }
  var mean1 = jStat.mean(array1);
  var mean2 = jStat.mean(array2);
  var result = 0;
  var n = array1.length;
  for (var i = 0; i < n; i++) {
    result += (array1[i] - mean1) * (array2[i] - mean2);
  }
  return result / n;
};

exports.COVARIANCE.S = function(array1, array2) {
  array1 = utils.parseNumberArray(utils.flatten(array1));
  array2 = utils.parseNumberArray(utils.flatten(array2));
  if (utils.anyIsError(array1, array2)) {
    return error.value;
  }
  return jStat.covariance(array1, array2);
};

exports.DEVSQ = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var mean = jStat.mean(range);
  var result = 0;
  for (var i = 0; i < range.length; i++) {
    result += Math.pow((range[i] - mean), 2);
  }
  return result;
};

exports.EXPON = {};

exports.EXPON.DIST = function(x, lambda, cumulative) {
  x = utils.parseNumber(x);
  lambda = utils.parseNumber(lambda);
  if (utils.anyIsError(x, lambda)) {
    return error.value;
  }
  return (cumulative) ? jStat.exponential.cdf(x, lambda) : jStat.exponential.pdf(x, lambda);
};

exports.F = {};

exports.F.DIST = function(x, d1, d2, cumulative) {
  x = utils.parseNumber(x);
  d1 = utils.parseNumber(d1);
  d2 = utils.parseNumber(d2);
  if (utils.anyIsError(x, d1, d2)) {
    return error.value;
  }
  return (cumulative) ? jStat.centralF.cdf(x, d1, d2) : jStat.centralF.pdf(x, d1, d2);
};

exports.F.DIST.RT = function(x, d1, d2) {
  if (arguments.length !== 3) {
    return error.na;
  }

  if (x < 0 || d1 < 1 || d2 < 1) {
    return error.num;
  }

  if ((typeof x !== 'number') || (typeof d1 !== 'number') || (typeof d2 !== 'number')) {
    return error.value;
  }

  return 1 - jStat.centralF.cdf(x, d1, d2);
};

exports.F.INV = function(probability, d1, d2) {
  probability = utils.parseNumber(probability);
  d1 = utils.parseNumber(d1);
  d2 = utils.parseNumber(d2);
  if (utils.anyIsError(probability, d1, d2)) {
    return error.value;
  }
  if (probability <= 0.0 || probability > 1.0) {
    return error.num;
  }

  return jStat.centralF.inv(probability, d1, d2);
};

exports.F.INV.RT = function(p, d1, d2) {
  if (arguments.length !== 3) {
    return error.na;
  }

  if (p < 0 || p > 1 || d1 < 1 || d1 > Math.pow(10, 10) || d2 < 1 || d2 > Math.pow(10, 10)) {
    return error.num;
  }

  if ((typeof p !== 'number') || (typeof d1 !== 'number') || (typeof d2 !== 'number')) {
    return error.value;
  }

  return jStat.centralF.inv(1.0 - p, d1, d2);
};

exports.F.TEST = function(array1, array2) {
  if (!array1 || !array2) {
    return error.na;
  }

  if (!(array1 instanceof Array) || !(array2 instanceof Array)) {
    return error.na;
  }

  if (array1.length < 2 || array2.length < 2) {
    return error.div0;
  }

  var sumOfSquares = function(values, x1) {
    var sum = 0;
    for (var i = 0; i < values.length; i++) {
      sum +=Math.pow((values[i] - x1), 2);
    }
    return sum;
  };

  var x1 = mathTrig.SUM(array1) / array1.length;
  var x2 = mathTrig.SUM(array2) / array2.length;
  var sum1 = sumOfSquares(array1, x1) / (array1.length - 1);
  var sum2 = sumOfSquares(array2, x2) / (array2.length - 1);

  return sum1 / sum2;
};

exports.FISHER = function(x) {
  x = utils.parseNumber(x);
  if (x instanceof Error) {
    return x;
  }
  return Math.log((1 + x) / (1 - x)) / 2;
};

exports.FISHERINV = function(y) {
  y = utils.parseNumber(y);
  if (y instanceof Error) {
    return y;
  }
  var e2y = Math.exp(2 * y);
  return (e2y - 1) / (e2y + 1);
};

exports.FORECAST = function(x, data_y, data_x) {
  x = utils.parseNumber(x);
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  if (utils.anyIsError(x, data_y, data_x)) {
    return error.value;
  }
  var xmean = jStat.mean(data_x);
  var ymean = jStat.mean(data_y);
  var n = data_x.length;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    num += (data_x[i] - xmean) * (data_y[i] - ymean);
    den += Math.pow(data_x[i] - xmean, 2);
  }
  var b = num / den;
  var a = ymean - b * xmean;
  return a + b * x;
};

exports.FREQUENCY = function(data, bins) {
  data = utils.parseNumberArray(utils.flatten(data));
  bins = utils.parseNumberArray(utils.flatten(bins));
  if (utils.anyIsError(data, bins)) {
    return error.value;
  }
  var n = data.length;
  var b = bins.length;
  var r = [];
  for (var i = 0; i <= b; i++) {
    r[i] = 0;
    for (var j = 0; j < n; j++) {
      if (i === 0) {
        if (data[j] <= bins[0]) {
          r[0] += 1;
        }
      } else if (i < b) {
        if (data[j] > bins[i - 1] && data[j] <= bins[i]) {
          r[i] += 1;
        }
      } else if (i === b) {
        if (data[j] > bins[b - 1]) {
          r[b] += 1;
        }
      }
    }
  }
  return r;
};


exports.GAMMA = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }

  if (number === 0) {
    return error.num;
  }

  if (parseInt(number, 10) === number && number < 0) {
    return error.num;
  }

  return jStat.gammafn(number);
};

exports.GAMMA.DIST = function(value, alpha, beta, cumulative) {
  if (arguments.length !== 4) {
    return error.na;
  }

  if (value < 0 || alpha <= 0 || beta <= 0) {
    return error.value;
  }

  if ((typeof value !== 'number') || (typeof alpha !== 'number') || (typeof beta !== 'number')) {
    return error.value;
  }

  return cumulative ? jStat.gamma.cdf(value, alpha, beta, true) : jStat.gamma.pdf(value, alpha, beta, false);
};

exports.GAMMA.INV = function(probability, alpha, beta) {
  if (arguments.length !== 3) {
    return error.na;
  }

  if (probability < 0 || probability > 1 || alpha <= 0 || beta <= 0) {
    return error.num;
  }

  if ((typeof probability !== 'number') || (typeof alpha !== 'number') || (typeof beta !== 'number')) {
    return error.value;
  }

  return jStat.gamma.inv(probability, alpha, beta);
};

exports.GAMMALN = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return jStat.gammaln(number);
};

exports.GAMMALN.PRECISE = function(x) {
  if (arguments.length !== 1) {
    return error.na;
  }

  if (x <= 0) {
    return error.num;
  }

  if (typeof x !== 'number') {
    return error.value;
  }

  return jStat.gammaln(x);
};

exports.GAUSS = function(z) {
  z = utils.parseNumber(z);
  if (z instanceof Error) {
    return z;
  }
  return jStat.normal.cdf(z, 0, 1) - 0.5;
};

exports.GEOMEAN = function() {
  var args = utils.parseNumberArray(utils.flatten(arguments));
  if (args instanceof Error) {
    return args;
  }
  return jStat.geomean(args);
};

exports.GROWTH = function(known_y, known_x, new_x, use_const) {
  // Credits: Ilmari Karonen (http://stackoverflow.com/questions/14161990/how-to-implement-growth-function-in-javascript)

  known_y = utils.parseNumberArray(known_y);
  if (known_y instanceof Error) {
    return known_y;
  }

  // Default values for optional parameters:
  var i;
  if (known_x === undefined) {
    known_x = [];
    for (i = 1; i <= known_y.length; i++) {
      known_x.push(i);
    }
  }
  if (new_x === undefined) {
    new_x = [];
    for (i = 1; i <= known_y.length; i++) {
      new_x.push(i);
    }
  }

  known_x = utils.parseNumberArray(known_x);
  new_x = utils.parseNumberArray(new_x);
  if (utils.anyIsError(known_x, new_x)) {
    return error.value;
  }


  if (use_const === undefined) {
    use_const = true;
  }

  // Calculate sums over the data:
  var n = known_y.length;
  var avg_x = 0;
  var avg_y = 0;
  var avg_xy = 0;
  var avg_xx = 0;
  for (i = 0; i < n; i++) {
    var x = known_x[i];
    var y = Math.log(known_y[i]);
    avg_x += x;
    avg_y += y;
    avg_xy += x * y;
    avg_xx += x * x;
  }
  avg_x /= n;
  avg_y /= n;
  avg_xy /= n;
  avg_xx /= n;

  // Compute linear regression coefficients:
  var beta;
  var alpha;
  if (use_const) {
    beta = (avg_xy - avg_x * avg_y) / (avg_xx - avg_x * avg_x);
    alpha = avg_y - beta * avg_x;
  } else {
    beta = avg_xy / avg_xx;
    alpha = 0;
  }

  // Compute and return result array:
  var new_y = [];
  for (i = 0; i < new_x.length; i++) {
    new_y.push(Math.exp(alpha + beta * new_x[i]));
  }
  return new_y;
};

exports.HARMEAN = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var n = range.length;
  var den = 0;
  for (var i = 0; i < n; i++) {
    den += 1 / range[i];
  }
  return n / den;
};

exports.HYPGEOM = {};

exports.HYPGEOM.DIST = function(x, n, M, N, cumulative) {
  x = utils.parseNumber(x);
  n = utils.parseNumber(n);
  M = utils.parseNumber(M);
  N = utils.parseNumber(N);
  if (utils.anyIsError(x, n, M, N)) {
    return error.value;
  }

  function pdf(x, n, M, N) {
    return mathTrig.COMBIN(M, x) * mathTrig.COMBIN(N - M, n - x) / mathTrig.COMBIN(N, n);
  }

  function cdf(x, n, M, N) {
    var result = 0;
    for (var i = 0; i <= x; i++) {
      result += pdf(i, n, M, N);
    }
    return result;
  }

  return (cumulative) ? cdf(x, n, M, N) : pdf(x, n, M, N);
};

exports.INTERCEPT = function(known_y, known_x) {
  known_y = utils.parseNumberArray(known_y);
  known_x = utils.parseNumberArray(known_x);
  if (utils.anyIsError(known_y, known_x)) {
    return error.value;
  }
  if (known_y.length !== known_x.length) {
    return error.na;
  }
  return exports.FORECAST(0, known_y, known_x);
};

exports.KURT = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var mean = jStat.mean(range);
  var n = range.length;
  var sigma = 0;
  for (var i = 0; i < n; i++) {
    sigma += Math.pow(range[i] - mean, 4);
  }
  sigma = sigma / Math.pow(jStat.stdev(range, true), 4);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sigma - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));
};

exports.LARGE = function(range, k) {
  range = utils.parseNumberArray(utils.flatten(range));
  k = utils.parseNumber(k);
  if (utils.anyIsError(range, k)) {
    return range;
  }
  return range.sort(function(a, b) {
    return b - a;
  })[k - 1];
};

exports.LINEST = function(data_y, data_x) {
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  if (utils.anyIsError(data_y, data_x)) {
    return error.value;
  }
  var ymean = jStat.mean(data_y);
  var xmean = jStat.mean(data_x);
  var n = data_x.length;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    num += (data_x[i] - xmean) * (data_y[i] - ymean);
    den += Math.pow(data_x[i] - xmean, 2);
  }
  var m = num / den;
  var b = ymean - m * xmean;
  return [m, b];
};

// According to Microsoft:
// http://office.microsoft.com/en-us/starter-help/logest-function-HP010342665.aspx
// LOGEST returns are based on the following linear model:
// ln y = x1 ln m1 + ... + xn ln mn + ln b
exports.LOGEST = function(data_y, data_x) {
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  if (utils.anyIsError(data_y, data_x)) {
    return error.value;
  }
  for (var i = 0; i < data_y.length; i ++) {
    data_y[i] = Math.log(data_y[i]);
  }

  var result = exports.LINEST(data_y, data_x);
  result[0] = Math.round(Math.exp(result[0])*1000000)/1000000;
  result[1] = Math.round(Math.exp(result[1])*1000000)/1000000;
  return result;
};

exports.LOGNORM = {};

exports.LOGNORM.DIST = function(x, mean, sd, cumulative) {
  x = utils.parseNumber(x);
  mean = utils.parseNumber(mean);
  sd = utils.parseNumber(sd);
  if (utils.anyIsError(x, mean, sd)) {
    return error.value;
  }
  return (cumulative) ? jStat.lognormal.cdf(x, mean, sd) : jStat.lognormal.pdf(x, mean, sd);
};

exports.LOGNORM.INV = function(probability, mean, sd) {
  probability = utils.parseNumber(probability);
  mean = utils.parseNumber(mean);
  sd = utils.parseNumber(sd);
  if (utils.anyIsError(probability, mean, sd)) {
    return error.value;
  }
  return jStat.lognormal.inv(probability, mean, sd);
};

exports.MAX = function() {
  var range = utils.numbers(utils.flatten(arguments));
  return (range.length === 0) ? 0 : Math.max.apply(Math, range);
};

exports.MAXA = function() {
  var range = utils.arrayValuesToNumbers(utils.flatten(arguments));
  return (range.length === 0) ? 0 : Math.max.apply(Math, range);
};

exports.MEDIAN = function() {
  var range = utils.arrayValuesToNumbers(utils.flatten(arguments));
  var result = jStat.median(range);

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.MIN = function() {
  var range = utils.numbers(utils.flatten(arguments));
  return (range.length === 0) ? 0 : Math.min.apply(Math, range);
};

exports.MINA = function() {
  var range = utils.arrayValuesToNumbers(utils.flatten(arguments));
  return (range.length === 0) ? 0 : Math.min.apply(Math, range);
};

exports.MODE = {};

exports.MODE.MULT = function() {
  // Credits: Roönaän
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var n = range.length;
  var count = {};
  var maxItems = [];
  var max = 0;
  var currentItem;

  for (var i = 0; i < n; i++) {
    currentItem = range[i];
    count[currentItem] = count[currentItem] ? count[currentItem] + 1 : 1;
    if (count[currentItem] > max) {
      max = count[currentItem];
      maxItems = [];
    }
    if (count[currentItem] === max) {
      maxItems[maxItems.length] = currentItem;
    }
  }
  return maxItems;
};

exports.MODE.SNGL = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  return exports.MODE.MULT(range).sort(function(a, b) {
    return a - b;
  })[0];
};

exports.NEGBINOM = {};

exports.NEGBINOM.DIST = function(k, r, p, cumulative) {
  k = utils.parseNumber(k);
  r = utils.parseNumber(r);
  p = utils.parseNumber(p);
  if (utils.anyIsError(k, r, p)) {
    return error.value;
  }
  return (cumulative) ? jStat.negbin.cdf(k, r, p) : jStat.negbin.pdf(k, r, p);
};

exports.NORM = {};

exports.NORM.DIST = function(x, mean, sd, cumulative) {
  x = utils.parseNumber(x);
  mean = utils.parseNumber(mean);
  sd = utils.parseNumber(sd);
  if (utils.anyIsError(x, mean, sd)) {
    return error.value;
  }
  if (sd <= 0) {
    return error.num;
  }

  // Return normal distribution computed by jStat [http://jstat.org]
  return (cumulative) ? jStat.normal.cdf(x, mean, sd) : jStat.normal.pdf(x, mean, sd);
};

exports.NORM.INV = function(probability, mean, sd) {
  probability = utils.parseNumber(probability);
  mean = utils.parseNumber(mean);
  sd = utils.parseNumber(sd);
  if (utils.anyIsError(probability, mean, sd)) {
    return error.value;
  }
  return jStat.normal.inv(probability, mean, sd);
};

exports.NORM.S = {};

exports.NORM.S.DIST = function(z, cumulative) {
  z = utils.parseNumber(z);
  if (z instanceof Error) {
    return error.value;
  }
  return (cumulative) ? jStat.normal.cdf(z, 0, 1) : jStat.normal.pdf(z, 0, 1);
};

exports.NORM.S.INV = function(probability) {
  probability = utils.parseNumber(probability);
  if (probability instanceof Error) {
    return error.value;
  }
  return jStat.normal.inv(probability, 0, 1);
};

exports.PEARSON = function(data_x, data_y) {
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  if (utils.anyIsError(data_y, data_x)) {
    return error.value;
  }
  var xmean = jStat.mean(data_x);
  var ymean = jStat.mean(data_y);
  var n = data_x.length;
  var num = 0;
  var den1 = 0;
  var den2 = 0;
  for (var i = 0; i < n; i++) {
    num += (data_x[i] - xmean) * (data_y[i] - ymean);
    den1 += Math.pow(data_x[i] - xmean, 2);
    den2 += Math.pow(data_y[i] - ymean, 2);
  }
  return num / Math.sqrt(den1 * den2);
};

exports.PERCENTILE = {};

exports.PERCENTILE.EXC = function(array, k) {
  array = utils.parseNumberArray(utils.flatten(array));
  k = utils.parseNumber(k);
  if (utils.anyIsError(array, k)) {
    return error.value;
  }
  array = array.sort(function(a, b) {
    {
      return a - b;
    }
  });
  var n = array.length;
  if (k < 1 / (n + 1) || k > 1 - 1 / (n + 1)) {
    return error.num;
  }
  var l = k * (n + 1) - 1;
  var fl = Math.floor(l);
  return utils.cleanFloat((l === fl) ? array[l] : array[fl] + (l - fl) * (array[fl + 1] - array[fl]));
};

exports.PERCENTILE.INC = function(array, k) {
  array = utils.parseNumberArray(utils.flatten(array));
  k = utils.parseNumber(k);
  if (utils.anyIsError(array, k)) {
    return error.value;
  }
  array = array.sort(function(a, b) {
    return a - b;
  });
  var n = array.length;
  var l = k * (n - 1);
  var fl = Math.floor(l);
  return utils.cleanFloat((l === fl) ? array[l] : array[fl] + (l - fl) * (array[fl + 1] - array[fl]));
};

exports.PERCENTRANK = {};

exports.PERCENTRANK.EXC = function(array, x, significance) {
  significance = (significance === undefined) ? 3 : significance;
  array = utils.parseNumberArray(utils.flatten(array));
  x = utils.parseNumber(x);
  significance = utils.parseNumber(significance);
  if (utils.anyIsError(array, x, significance)) {
    return error.value;
  }
  array = array.sort(function(a, b) {
    return a - b;
  });
  var uniques = misc.UNIQUE.apply(null, array);
  var n = array.length;
  var m = uniques.length;
  var power = Math.pow(10, significance);
  var result = 0;
  var match = false;
  var i = 0;
  while (!match && i < m) {
    if (x === uniques[i]) {
      result = (array.indexOf(uniques[i]) + 1) / (n + 1);
      match = true;
    } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
      result = (array.indexOf(uniques[i]) + 1 + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n + 1);
      match = true;
    }
    i++;
  }
  return Math.floor(result * power) / power;
};

exports.PERCENTRANK.INC = function(array, x, significance) {
  significance = (significance === undefined) ? 3 : significance;
  array = utils.parseNumberArray(utils.flatten(array));
  x = utils.parseNumber(x);
  significance = utils.parseNumber(significance);
  if (utils.anyIsError(array, x, significance)) {
    return error.value;
  }
  array = array.sort(function(a, b) {
    return a - b;
  });
  var uniques = misc.UNIQUE.apply(null, array);
  var n = array.length;
  var m = uniques.length;
  var power = Math.pow(10, significance);
  var result = 0;
  var match = false;
  var i = 0;
  while (!match && i < m) {
    if (x === uniques[i]) {
      result = array.indexOf(uniques[i]) / (n - 1);
      match = true;
    } else if (x >= uniques[i] && (x < uniques[i + 1] || i === m - 1)) {
      result = (array.indexOf(uniques[i]) + (x - uniques[i]) / (uniques[i + 1] - uniques[i])) / (n - 1);
      match = true;
    }
    i++;
  }
  return Math.floor(result * power) / power;
};

exports.PERMUT = function(number, number_chosen) {
  number = utils.parseNumber(number);
  number_chosen = utils.parseNumber(number_chosen);
  if (utils.anyIsError(number, number_chosen)) {
    return error.value;
  }
  return mathTrig.FACT(number) / mathTrig.FACT(number - number_chosen);
};

exports.PERMUTATIONA = function(number, number_chosen) {
  number = utils.parseNumber(number);
  number_chosen = utils.parseNumber(number_chosen);
  if (utils.anyIsError(number, number_chosen)) {
    return error.value;
  }
  return Math.pow(number, number_chosen);
};

exports.PHI = function(x) {
  x = utils.parseNumber(x);
  if (x instanceof Error) {
    return error.value;
  }
  return Math.exp(-0.5 * x * x) / SQRT2PI;
};

exports.POISSON = {};

exports.POISSON.DIST = function(x, mean, cumulative) {
  x = utils.parseNumber(x);
  mean = utils.parseNumber(mean);
  if (utils.anyIsError(x, mean)) {
    return error.value;
  }
  return (cumulative) ? jStat.poisson.cdf(x, mean) : jStat.poisson.pdf(x, mean);
};

exports.PROB = function(range, probability, lower, upper) {
  if (lower === undefined) {
    return 0;
  }
  upper = (upper === undefined) ? lower : upper;

  range = utils.parseNumberArray(utils.flatten(range));
  probability = utils.parseNumberArray(utils.flatten(probability));
  lower = utils.parseNumber(lower);
  upper = utils.parseNumber(upper);
  if (utils.anyIsError(range, probability, lower, upper)) {
    return error.value;
  }

  if (lower === upper) {
    return (range.indexOf(lower) >= 0) ? probability[range.indexOf(lower)] : 0;
  }

  var sorted = range.sort(function(a, b) {
    return a - b;
  });
  var n = sorted.length;
  var result = 0;
  for (var i = 0; i < n; i++) {
    if (sorted[i] >= lower && sorted[i] <= upper) {
      result += probability[range.indexOf(sorted[i])];
    }
  }
  return result;
};

exports.QUARTILE = {};

exports.QUARTILE.EXC = function(range, quart) {
  range = utils.parseNumberArray(utils.flatten(range));
  quart = utils.parseNumber(quart);
  if (utils.anyIsError(range, quart)) {
    return error.value;
  }
  switch (quart) {
    case 1:
      return exports.PERCENTILE.EXC(range, 0.25);
    case 2:
      return exports.PERCENTILE.EXC(range, 0.5);
    case 3:
      return exports.PERCENTILE.EXC(range, 0.75);
    default:
      return error.num;
  }
};

exports.QUARTILE.INC = function(range, quart) {
  range = utils.parseNumberArray(utils.flatten(range));
  quart = utils.parseNumber(quart);
  if (utils.anyIsError(range, quart)) {
    return error.value;
  }
  switch (quart) {
    case 1:
      return exports.PERCENTILE.INC(range, 0.25);
    case 2:
      return exports.PERCENTILE.INC(range, 0.5);
    case 3:
      return exports.PERCENTILE.INC(range, 0.75);
    default:
      return error.num;
  }
};

exports.RANK = {};

exports.RANK.AVG = function(number, range, order) {
  number = utils.parseNumber(number);
  range = utils.parseNumberArray(utils.flatten(range));
  if (utils.anyIsError(number, range)) {
    return error.value;
  }
  range = utils.flatten(range);
  order = order || false;
  var sort = (order) ? function(a, b) {
    return a - b;
  } : function(a, b) {
    return b - a;
  };
  range = range.sort(sort);

  var length = range.length;
  var count = 0;
  for (var i = 0; i < length; i++) {
    if (range[i] === number) {
      count++;
    }
  }

  return (count > 1) ? (2 * range.indexOf(number) + count + 1) / 2 : range.indexOf(number) + 1;
};

exports.RANK.EQ = function(number, range, order) {
  number = utils.parseNumber(number);
  range = utils.parseNumberArray(utils.flatten(range));
  if (utils.anyIsError(number, range)) {
    return error.value;
  }
  order = order || false;
  var sort = (order) ? function(a, b) {
    return a - b;
  } : function(a, b) {
    return b - a;
  };
  range = range.sort(sort);
  return range.indexOf(number) + 1;
};

exports.ROW = function(matrix, index) {
  if (arguments.length !== 2) {
    return error.na;
  }

  if (index < 0) {
    return error.num;
  }

  if (!(matrix instanceof Array) || (typeof index !== 'number')) {
    return error.value;
  }

  if (matrix.length === 0) {
    return undefined;
  }

  return jStat.row(matrix, index);
};

exports.ROWS = function(matrix) {
  if (arguments.length !== 1) {
    return error.na;
  }

  if (!(matrix instanceof Array)) {
    return error.value;
  }

  if (matrix.length === 0) {
    return 0;
  }

  return jStat.rows(matrix);
};

exports.RSQ = function(data_x, data_y) { // no need to flatten here, PEARSON will take care of that
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  if (utils.anyIsError(data_x, data_y)) {
    return error.value;
  }
  return Math.pow(exports.PEARSON(data_x, data_y), 2);
};

exports.SKEW = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var mean = jStat.mean(range);
  var n = range.length;
  var sigma = 0;
  for (var i = 0; i < n; i++) {
    sigma += Math.pow(range[i] - mean, 3);
  }
  return n * sigma / ((n - 1) * (n - 2) * Math.pow(jStat.stdev(range, true), 3));
};

exports.SKEW.P = function() {
  var range = utils.parseNumberArray(utils.flatten(arguments));
  if (range instanceof Error) {
    return range;
  }
  var mean = jStat.mean(range);
  var n = range.length;
  var m2 = 0;
  var m3 = 0;
  for (var i = 0; i < n; i++) {
    m3 += Math.pow(range[i] - mean, 3);
    m2 += Math.pow(range[i] - mean, 2);
  }
  m3 = m3 / n;
  m2 = m2 / n;
  return m3 / Math.pow(m2, 3 / 2);
};

exports.SLOPE = function(data_y, data_x) {
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  if (utils.anyIsError(data_y, data_x)) {
    return error.value;
  }
  var xmean = jStat.mean(data_x);
  var ymean = jStat.mean(data_y);
  var n = data_x.length;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    num += (data_x[i] - xmean) * (data_y[i] - ymean);
    den += Math.pow(data_x[i] - xmean, 2);
  }
  return num / den;
};

exports.SMALL = function(range, k) {
  range = utils.parseNumberArray(utils.flatten(range));
  k = utils.parseNumber(k);
  if (utils.anyIsError(range, k)) {
    return range;
  }
  return range.sort(function(a, b) {
    return a - b;
  })[k - 1];
};

exports.STANDARDIZE = function(x, mean, sd) {
  x = utils.parseNumber(x);
  mean = utils.parseNumber(mean);
  sd = utils.parseNumber(sd);
  if (utils.anyIsError(x, mean, sd)) {
    return error.value;
  }
  return (x - mean) / sd;
};

exports.STDEV = {};

exports.STDEV.P = function() {
  var v = exports.VAR.P.apply(this, arguments);
  var result = Math.sqrt(v);

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.STDEV.S = function() {
  var v = exports.VAR.S.apply(this, arguments);
  var result = Math.sqrt(v);

  return result;
};

exports.STDEVA = function() {
  var v = exports.VARA.apply(this, arguments);
  var result = Math.sqrt(v);

  return result;
};

exports.STDEVPA = function() {
  var v = exports.VARPA.apply(this, arguments);
  var result = Math.sqrt(v);

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};


exports.STEYX = function(data_y, data_x) {
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  if (utils.anyIsError(data_y, data_x)) {
    return error.value;
  }
  var xmean = jStat.mean(data_x);
  var ymean = jStat.mean(data_y);
  var n = data_x.length;
  var lft = 0;
  var num = 0;
  var den = 0;
  for (var i = 0; i < n; i++) {
    lft += Math.pow(data_y[i] - ymean, 2);
    num += (data_x[i] - xmean) * (data_y[i] - ymean);
    den += Math.pow(data_x[i] - xmean, 2);
  }
  return Math.sqrt((lft - num * num / den) / (n - 2));
};

exports.TRANSPOSE = function(matrix) {
  if (!matrix) {
    return error.na;
  }
  return jStat.transpose(matrix);
};

exports.T = text.T;

exports.T.DIST = function(x, df, cumulative) {
  x = utils.parseNumber(x);
  df = utils.parseNumber(df);
  if (utils.anyIsError(x, df)) {
    return error.value;
  }
  return (cumulative) ? jStat.studentt.cdf(x, df) : jStat.studentt.pdf(x, df);
};

exports.T.DIST['2T'] = function(x, df) {
  if (arguments.length !== 2) {
    return error.na;
  }

  if (x < 0 || df < 1) {
    return error.num;
  }

  if ((typeof x !== 'number') || (typeof df !== 'number')) {
    return error.value;
  }

  return (1 - jStat.studentt.cdf(x , df)) * 2;
};

exports.T.DIST.RT = function(x, df) {
  if (arguments.length !== 2) {
    return error.na;
  }

  if (x < 0 || df < 1) {
    return error.num;
  }

  if ((typeof x !== 'number') || (typeof df !== 'number')) {
    return error.value;
  }

  return 1 - jStat.studentt.cdf(x , df);
};

exports.T.INV = function(probability, df) {
  probability = utils.parseNumber(probability);
  df = utils.parseNumber(df);
  if (utils.anyIsError(probability, df)) {
    return error.value;
  }
  return jStat.studentt.inv(probability, df);
};

exports.T.INV['2T'] = function(probability, df) {
  probability = utils.parseNumber(probability);
  df = utils.parseNumber(df);
  if (probability <= 0 || probability > 1 || df < 1) {
    return error.num;
  }
  if (utils.anyIsError(probability, df)) {
    return error.value;
  }
  return Math.abs(jStat.studentt.inv(probability/2, df));
};

// The algorithm can be found here:
// http://www.chem.uoa.gr/applets/AppletTtest/Appl_Ttest2.html
exports.T.TEST = function(data_x, data_y) {
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  if (utils.anyIsError(data_x, data_y)) {
    return error.value;
  }

  var mean_x = jStat.mean(data_x);
  var mean_y = jStat.mean(data_y);
  var s_x = 0;
  var s_y = 0;
  var i;

  for (i = 0; i < data_x.length; i++) {
    s_x += Math.pow(data_x[i] - mean_x, 2);
  }
  for (i = 0; i < data_y.length; i++) {
    s_y += Math.pow(data_y[i] - mean_y, 2);
  }

  s_x = s_x / (data_x.length-1);
  s_y = s_y / (data_y.length-1);

  var t = Math.abs(mean_x - mean_y) / Math.sqrt(s_x/data_x.length + s_y/data_y.length);

  return exports.T.DIST['2T'](t, data_x.length+data_y.length-2);
};

exports.TREND = function(data_y, data_x, new_data_x) {
  data_y = utils.parseNumberArray(utils.flatten(data_y));
  data_x = utils.parseNumberArray(utils.flatten(data_x));
  new_data_x = utils.parseNumberArray(utils.flatten(new_data_x));
  if (utils.anyIsError(data_y, data_x, new_data_x)) {
    return error.value;
  }
  var linest = exports.LINEST(data_y, data_x);
  var m = linest[0];
  var b = linest[1];
  var result = [];

  new_data_x.forEach(function(x) {
    result.push(m * x + b);
  });

  return result;
};

exports.TRIMMEAN = function(range, percent) {
  range = utils.parseNumberArray(utils.flatten(range));
  percent = utils.parseNumber(percent);
  if (utils.anyIsError(range, percent)) {
    return error.value;
  }
  var trim = mathTrig.FLOOR(range.length * percent, 2) / 2;
  return jStat.mean(utils.initial(utils.rest(range.sort(function(a, b) {
    return a - b;
  }), trim), trim));
};

exports.VAR = {};

exports.VAR.P = function() {
  var range = utils.numbers(utils.flatten(arguments));
  var n = range.length;
  var sigma = 0;
  var mean = exports.AVERAGE(range);
  var result;
  for (var i = 0; i < n; i++) {
    sigma += Math.pow(range[i] - mean, 2);
  }
  result = sigma / n;

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.VAR.S = function() {
  var range = utils.numbers(utils.flatten(arguments));
  var n = range.length;
  var sigma = 0;
  var mean = exports.AVERAGE(range);
  for (var i = 0; i < n; i++) {
    sigma += Math.pow(range[i] - mean, 2);
  }
  return sigma / (n - 1);
};

exports.VARA = function() {
  var range = utils.flatten(arguments);
  var n = range.length;
  var sigma = 0;
  var count = 0;
  var mean = exports.AVERAGEA(range);
  for (var i = 0; i < n; i++) {
    var el = range[i];
    if (typeof el === 'number') {
      sigma += Math.pow(el - mean, 2);
    } else if (el === true) {
      sigma += Math.pow(1 - mean, 2);
    } else {
      sigma += Math.pow(0 - mean, 2);
    }

    if (el !== null) {
      count++;
    }
  }
  return sigma / (count - 1);
};

exports.VARPA = function() {
  var range = utils.flatten(arguments);
  var n = range.length;
  var sigma = 0;
  var count = 0;
  var mean = exports.AVERAGEA(range);
  var result;
  for (var i = 0; i < n; i++) {
    var el = range[i];
    if (typeof el === 'number') {
      sigma += Math.pow(el - mean, 2);
    } else if (el === true) {
      sigma += Math.pow(1 - mean, 2);
    } else {
      sigma += Math.pow(0 - mean, 2);
    }

    if (el !== null) {
      count++;
    }
  }
  result = sigma / count;

  if (isNaN(result)) {
    result = error.num;
  }

  return result;
};

exports.WEIBULL = {};

exports.WEIBULL.DIST = function(x, alpha, beta, cumulative) {
  x = utils.parseNumber(x);
  alpha = utils.parseNumber(alpha);
  beta = utils.parseNumber(beta);
  if (utils.anyIsError(x, alpha, beta)) {
    return error.value;
  }
  return (cumulative) ? 1 - Math.exp(-Math.pow(x / beta, alpha)) : Math.pow(x, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha)) * alpha / Math.pow(beta, alpha);
};

exports.Z = {};

exports.Z.TEST = function(range, x, sd) {
  range = utils.parseNumberArray(utils.flatten(range));
  x = utils.parseNumber(x);
  if (utils.anyIsError(range, x)) {
    return error.value;
  }

  sd = sd || exports.STDEV.S(range);
  var n = range.length;
  return 1 - exports.NORM.S.DIST((exports.AVERAGE(range) - x) / (sd / Math.sqrt(n)), true);
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var utils = __webpack_require__(1);
var error = __webpack_require__(0);
var numbro = __webpack_require__(9);

//TODO
exports.ASC = function() {
  throw new Error('ASC is not implemented');
};

//TODO
exports.BAHTTEXT = function() {
  throw new Error('BAHTTEXT is not implemented');
};

exports.CHAR = function(number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return String.fromCharCode(number);
};

exports.CLEAN = function(text) {
  text = text || '';
  var re = /[\0-\x1F]/g;
  return text.replace(re, "");
};

exports.CODE = function(text) {
  text = text || '';
  var result = text.charCodeAt(0);

  if (isNaN(result)) {
    result = error.na;
  }
  return result;
};

exports.CONCATENATE = function() {
  var args = utils.flatten(arguments);

  var trueFound = 0;
  while ((trueFound = args.indexOf(true)) > -1) {
    args[trueFound] = 'TRUE';
  }

  var falseFound = 0;
  while ((falseFound = args.indexOf(false)) > -1) {
    args[falseFound] = 'FALSE';
  }

  return args.join('');
};

//TODO
exports.DBCS = function() {
  throw new Error('DBCS is not implemented');
};

exports.DOLLAR = function(number, decimals) {
  decimals = (decimals === undefined) ? 2 : decimals;

  number = utils.parseNumber(number);
  decimals = utils.parseNumber(decimals);
  if (utils.anyIsError(number, decimals)) {
    return error.value;
  }
  var format = '';
  if (decimals <= 0) {
    number = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    format = '($0,0)';
  } else if (decimals > 0) {
    format = '($0,0.' + new Array(decimals + 1).join('0') + ')';
  }
  return numbro(number).format(format);
};

exports.EXACT = function(text1, text2) {
  if (arguments.length !== 2) {
    return error.na;
  }
  return text1 === text2;
};

exports.FIND = function(find_text, within_text, position) {
  if (arguments.length < 2) {
    return error.na;
  }
  position = (position === undefined) ? 0 : position;
  return within_text ? within_text.indexOf(find_text, position - 1) + 1 : null;
};

exports.FIXED = function(number, decimals, no_commas) {
  decimals = (decimals === undefined) ? 2 : decimals;
  no_commas = (no_commas === undefined) ? false : no_commas;

  number = utils.parseNumber(number);
  decimals = utils.parseNumber(decimals);
  if (utils.anyIsError(number, decimals)) {
    return error.value;
  }

  var format = no_commas ? '0' : '0,0';
  if (decimals <= 0) {
    number = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  } else if (decimals > 0) {
    format += '.' + new Array(decimals + 1).join('0');
  }
  return numbro(number).format(format);
};

exports.HTML2TEXT = function (value) {
  var result = '';

  if (value) {
    if (value instanceof Array) {
      value.forEach(function (line) {
        if (result !== '') {
          result += '\n';
        }
        result += (line.replace(/<(?:.|\n)*?>/gm, ''));
      });
    } else {
      result = value.replace(/<(?:.|\n)*?>/gm, '');
    }
  }

  return result;
};

exports.LEFT = function(text, number) {
  number = (number === undefined) ? 1 : number;
  number = utils.parseNumber(number);
  if (number instanceof Error || typeof text !== 'string') {
    return error.value;
  }
  return text ? text.substring(0, number) : null;
};

exports.LEN = function(text) {
  if (arguments.length === 0) {
    return error.error;
  }

  if (typeof text === 'string') {
    return text ? text.length : 0;
  }

  if (text.length) {
    return text.length;
  }

  return error.value;
};

exports.LOWER = function(text) {
  if (typeof text !== 'string') {
    return error.value;
  }
  return text ? text.toLowerCase() : text;
};

exports.MID = function(text, start, number) {
  start = utils.parseNumber(start);
  number = utils.parseNumber(number);
  if (utils.anyIsError(start, number) || typeof text !== 'string') {
    return number;
  }

  var begin = start - 1;
  var end = begin + number;

  return text.substring(begin, end);
};

// TODO
exports.NUMBERVALUE = function (text, decimal_separator, group_separator)  {
  decimal_separator = (typeof decimal_separator === 'undefined') ? '.' : decimal_separator;
  group_separator = (typeof group_separator === 'undefined') ? ',' : group_separator;
  return Number(text.replace(decimal_separator, '.').replace(group_separator, ''));
};

// TODO
exports.PRONETIC = function() {
  throw new Error('PRONETIC is not implemented');
};

exports.PROPER = function(text) {
  if (text === undefined || text.length === 0) {
    return error.value;
  }
  if (text === true) {
    text = 'TRUE';
  }
  if (text === false) {
    text = 'FALSE';
  }
  if (isNaN(text) && typeof text === 'number') {
    return error.value;
  }
  if (typeof text === 'number') {
    text = '' + text;
  }

  return text.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

exports.REGEXEXTRACT = function (text, regular_expression) {
  if (arguments.length < 2) {
    return error.na;
  }
  var match = text.match(new RegExp(regular_expression));
  return match ? (match[match.length > 1 ? match.length - 1 : 0]) : null;
};

exports.REGEXMATCH = function (text, regular_expression, full) {
  if (arguments.length < 2) {
    return error.na;
  }
  var match = text.match(new RegExp(regular_expression));
  return full ? match : !!match;
};

exports.REGEXREPLACE = function (text, regular_expression, replacement) {
  if (arguments.length < 3) {
    return error.na;
  }
  return text.replace(new RegExp(regular_expression), replacement);
};

exports.REPLACE = function(text, position, length, new_text) {
  position = utils.parseNumber(position);
  length = utils.parseNumber(length);
  if (utils.anyIsError(position, length) ||
    typeof text !== 'string' ||
    typeof new_text !== 'string') {
    return error.value;
  }
  return text.substr(0, position - 1) + new_text + text.substr(position - 1 + length);
};

exports.REPT = function(text, number) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return new Array(number + 1).join(text);
};

exports.RIGHT = function(text, number) {
  number = (number === undefined) ? 1 : number;
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }
  return text ? text.substring(text.length - number) : error.na;
};

exports.SEARCH = function(find_text, within_text, position) {
  var foundAt;
  if (typeof find_text !== 'string' || typeof within_text !== 'string') {
    return error.value;
  }
  position = (position === undefined) ? 0 : position;
  foundAt = within_text.toLowerCase().indexOf(find_text.toLowerCase(), position - 1)+1;
  return (foundAt === 0)?error.value:foundAt;
};

exports.SPLIT = function (text, separator) {
  return text.split(separator);
};

exports.SUBSTITUTE = function(text, old_text, new_text, occurrence) {
  if (arguments.length < 2) {
    return error.na;
  }
  if (!text || !old_text || !new_text) {
    return text;
  } else if (occurrence === undefined) {
    return text.replace(new RegExp(old_text, 'g'), new_text);
  } else {
    var index = 0;
    var i = 0;
    while (text.indexOf(old_text, index) > 0) {
      index = text.indexOf(old_text, index + 1);
      i++;
      if (i === occurrence) {
        return text.substring(0, index) + new_text + text.substring(index + old_text.length);
      }
    }
  }
};

exports.T = function(value) {
  return (typeof value === "string") ? value : '';
};

// TODO incomplete implementation
exports.TEXT = function(value, format) {
  value = utils.parseNumber(value);
  if (utils.anyIsError(value)) {
    return error.na;
  }

  return numbro(value).format(format);
};

exports.TRIM = function(text) {
  if (typeof text !== 'string') {
    return error.value;
  }
  return text.replace(/ +/g, ' ').trim();
};

exports.UNICHAR = exports.CHAR;

exports.UNICODE = exports.CODE;

exports.UPPER = function(text) {
  if (typeof text !== 'string') {
    return error.value;
  }
  return text.toUpperCase();
};

exports.VALUE = function(text) {
  if (typeof text !== 'string') {
    return error.value;
  }
  var result = numbro().unformat(text);

  return result === void 0 ? 0 : result;
};


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);

// TODO
exports.CELL = function() {
  throw new Error('CELL is not implemented');
};

exports.ERROR = {};
exports.ERROR.TYPE = function(error_val) {
  switch (error_val) {
    case error.nil: return 1;
    case error.div0: return 2;
    case error.value: return 3;
    case error.ref: return 4;
    case error.name: return 5;
    case error.num: return 6;
    case error.na: return 7;
    case error.data: return 8;
  }
  return error.na;
};

// TODO
exports.INFO = function() {
  throw new Error('INFO is not implemented');
};

exports.ISBLANK = function(value) {
  return value === null;
};

exports.ISBINARY = function (number) {
  return (/^[01]{1,10}$/).test(number);
};

exports.ISERR = function(value) {
  return ([error.value, error.ref, error.div0, error.num, error.name, error.nil]).indexOf(value) >= 0 ||
    (typeof value === 'number' && (isNaN(value) || !isFinite(value)));
};

exports.ISERROR = function(value) {
  return exports.ISERR(value) || value === error.na;
};

exports.ISEVEN = function(number) {
  return (Math.floor(Math.abs(number)) & 1) ? false : true;
};

// TODO
exports.ISFORMULA = function() {
  throw new Error('ISFORMULA is not implemented');
};

exports.ISLOGICAL = function(value) {
  return value === true || value === false;
};

exports.ISNA = function(value) {
  return value === error.na;
};

exports.ISNONTEXT = function(value) {
  return typeof(value) !== 'string';
};

exports.ISNUMBER = function(value) {
  return typeof(value) === 'number' && !isNaN(value) && isFinite(value);
};

exports.ISODD = function(number) {
  return (Math.floor(Math.abs(number)) & 1) ? true : false;
};

// TODO
exports.ISREF = function() {
  throw new Error('ISREF is not implemented');
};

exports.ISTEXT = function(value) {
  return typeof(value) === 'string';
};

exports.N = function(value) {
  if (this.ISNUMBER(value)) {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (value === true) {
    return 1;
  }
  if (value === false) {
    return 0;
  }
  if (this.ISERROR(value)) {
    return value;
  }
  return 0;
};

exports.NA = function() {
  return error.na;
};


// TODO
exports.SHEET = function() {
  throw new Error('SHEET is not implemented');
};

// TODO
exports.SHEETS = function() {
  throw new Error('SHEETS is not implemented');
};

exports.TYPE = function(value) {
  if (this.ISNUMBER(value)) {
    return 1;
  }
  if (this.ISTEXT(value)) {
    return 2;
  }
  if (this.ISLOGICAL(value)) {
    return 4;
  }
  if (this.ISERROR(value)) {
    return 16;
  }
  if (Array.isArray(value)) {
    return 64;
  }
};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);
var utils = __webpack_require__(1);

var d1900 = new Date(1900, 0, 1);
var WEEK_STARTS = [
  undefined,
  0,
  1,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  1,
  2,
  3,
  4,
  5,
  6,
  0
];
var WEEK_TYPES = [
  [],
  [1, 2, 3, 4, 5, 6, 7],
  [7, 1, 2, 3, 4, 5, 6],
  [6, 0, 1, 2, 3, 4, 5],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [7, 1, 2, 3, 4, 5, 6],
  [6, 7, 1, 2, 3, 4, 5],
  [5, 6, 7, 1, 2, 3, 4],
  [4, 5, 6, 7, 1, 2, 3],
  [3, 4, 5, 6, 7, 1, 2],
  [2, 3, 4, 5, 6, 7, 1],
  [1, 2, 3, 4, 5, 6, 7]
];
var WEEKEND_TYPES = [
  [],
  [6, 0],
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  undefined,
  undefined,
  undefined, [0, 0],
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6]
];

exports.DATE = function(year, month, day) {
  var result;

  year = utils.parseNumber(year);
  month = utils.parseNumber(month);
  day = utils.parseNumber(day);

  if (utils.anyIsError(year, month, day)) {
    result = error.value;

  } else if (year < 0 || month < 0 || day < 0) {
    result = error.num;

  } else {
    result = new Date(year, month - 1, day);
  }

  return result;
};

exports.DATEVALUE = function(date_text) {
  if (typeof date_text !== 'string') {
    return error.value;
  }
  var date = Date.parse(date_text);

  if (isNaN(date)) {
    return error.value;
  }
  if (date <= -2203891200000) {
    return (date - d1900) / 86400000 + 1;
  }

  return (date - d1900) / 86400000 + 2;
};

exports.DAY = function(serial_number) {
  var date = utils.parseDate(serial_number);
  if (date instanceof Error) {
    return date;
  }

  return date.getDate();
};

exports.DAYS = function(end_date, start_date) {
  end_date = utils.parseDate(end_date);
  start_date = utils.parseDate(start_date);

  if (end_date instanceof Error) {
    return end_date;
  }
  if (start_date instanceof Error) {
    return start_date;
  }

  return serial(end_date) - serial(start_date);
};

exports.DAYS360 = function(start_date, end_date, method) {
  method = utils.parseBool(method);
  start_date = utils.parseDate(start_date);
  end_date = utils.parseDate(end_date);

  if (start_date instanceof Error) {
    return start_date;
  }
  if (end_date instanceof Error) {
    return end_date;
  }
  if (method instanceof Error) {
    return method;
  }
  var sm = start_date.getMonth();
  var em = end_date.getMonth();
  var sd, ed;

  if (method) {
    sd = start_date.getDate() === 31 ? 30 : start_date.getDate();
    ed = end_date.getDate() === 31 ? 30 : end_date.getDate();
  } else {
    var smd = new Date(start_date.getFullYear(), sm + 1, 0).getDate();
    var emd = new Date(end_date.getFullYear(), em + 1, 0).getDate();
    sd = start_date.getDate() === smd ? 30 : start_date.getDate();
    if (end_date.getDate() === emd) {
      if (sd < 30) {
        em++;
        ed = 1;
      } else {
        ed = 30;
      }
    } else {
      ed = end_date.getDate();
    }
  }

  return 360 * (end_date.getFullYear() - start_date.getFullYear()) +
    30 * (em - sm) + (ed - sd);
};

exports.EDATE = function(start_date, months) {
  start_date = utils.parseDate(start_date);

  if (start_date instanceof Error) {
    return start_date;
  }
  if (isNaN(months)) {
    return error.value;
  }
  months = parseInt(months, 10);
  start_date.setMonth(start_date.getMonth() + months);

  return serial(start_date);
};

exports.EOMONTH = function(start_date, months) {
  start_date = utils.parseDate(start_date);

  if (start_date instanceof Error) {
    return start_date;
  }
  if (isNaN(months)) {
    return error.value;
  }
  months = parseInt(months, 10);

  return serial(new Date(start_date.getFullYear(), start_date.getMonth() + months + 1, 0));
};

exports.HOUR = function(serial_number) {
  serial_number = utils.parseDate(serial_number);

  if (serial_number instanceof Error) {
    return serial_number;
  }

  return serial_number.getHours();
};

exports.INTERVAL = function (second) {
  if (typeof second !== 'number' && typeof second !== 'string') {
    return error.value;
  } else {
    second = parseInt(second, 10);
  }

  var year  = Math.floor(second/946080000);
  second    = second%946080000;
  var month = Math.floor(second/2592000);
  second    = second%2592000;
  var day   = Math.floor(second/86400);
  second    = second%86400;

  var hour  = Math.floor(second/3600);
  second    = second%3600;
  var min   = Math.floor(second/60);
  second    = second%60;
  var sec   = second;

  year  = (year  > 0) ? year  + 'Y' : '';
  month = (month > 0) ? month + 'M' : '';
  day   = (day   > 0) ? day   + 'D' : '';
  hour  = (hour  > 0) ? hour  + 'H' : '';
  min   = (min   > 0) ? min   + 'M' : '';
  sec   = (sec   > 0) ? sec   + 'S' : '';

  return 'P' + year + month + day + 'T' + hour + min + sec;
};

exports.ISOWEEKNUM = function(date) {
  date = utils.parseDate(date);

  if (date instanceof Error) {
    return date;
  }

  date.setHours(0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  var yearStart = new Date(date.getFullYear(), 0, 1);

  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

exports.MINUTE = function(serial_number) {
  serial_number = utils.parseDate(serial_number);

  if (serial_number instanceof Error) {
    return serial_number;
  }

  return serial_number.getMinutes();
};

exports.MONTH = function(serial_number) {
  serial_number = utils.parseDate(serial_number);

  if (serial_number instanceof Error) {
    return serial_number;
  }

  return serial_number.getMonth() + 1;
};

exports.NETWORKDAYS = function(start_date, end_date, holidays) {
  return this.NETWORKDAYS.INTL(start_date, end_date, 1, holidays);
};

exports.NETWORKDAYS.INTL = function(start_date, end_date, weekend, holidays) {
  start_date = utils.parseDate(start_date);

  if (start_date instanceof Error) {
    return start_date;
  }
  end_date = utils.parseDate(end_date);

  if (end_date instanceof Error) {
    return end_date;
  }
  if (weekend === undefined) {
    weekend = WEEKEND_TYPES[1];
  } else {
    weekend = WEEKEND_TYPES[weekend];
  }
  if (!(weekend instanceof Array)) {
    return error.value;
  }
  if (holidays === undefined) {
    holidays = [];
  } else if (!(holidays instanceof Array)) {
    holidays = [holidays];
  }

  for (var i = 0; i < holidays.length; i++) {
    var h = utils.parseDate(holidays[i]);
    if (h instanceof Error) {
      return h;
    }
    holidays[i] = h;
  }
  var days = (end_date - start_date) / (1000 * 60 * 60 * 24) + 1;
  var total = days;
  var day = start_date;
  for (i = 0; i < days; i++) {
    var d = (new Date().getTimezoneOffset() > 0) ? day.getUTCDay() : day.getDay();
    var dec = false;
    if (d === weekend[0] || d === weekend[1]) {
      dec = true;
    }
    for (var j = 0; j < holidays.length; j++) {
      var holiday = holidays[j];
      if (holiday.getDate() === day.getDate() &&
        holiday.getMonth() === day.getMonth() &&
        holiday.getFullYear() === day.getFullYear()) {
        dec = true;
        break;
      }
    }
    if (dec) {
      total--;
    }
    day.setDate(day.getDate() + 1);
  }

  return total;
};

exports.NOW = function() {
  return new Date();
};

exports.SECOND = function(serial_number) {
  serial_number = utils.parseDate(serial_number);
  if (serial_number instanceof Error) {
    return serial_number;
  }

  return serial_number.getSeconds();
};

exports.TIME = function(hour, minute, second) {
  hour = utils.parseNumber(hour);
  minute = utils.parseNumber(minute);
  second = utils.parseNumber(second);
  if (utils.anyIsError(hour, minute, second)) {
    return error.value;
  }
  if (hour < 0 || minute < 0 || second < 0) {
    return error.num;
  }

  return (3600 * hour + 60 * minute + second) / 86400;
};

exports.TIMEVALUE = function(time_text) {
  time_text = utils.parseDate(time_text);

  if (time_text instanceof Error) {
    return time_text;
  }

  return (3600 * time_text.getHours() + 60 * time_text.getMinutes() + time_text.getSeconds()) / 86400;
};

exports.TODAY = function() {
  return new Date();
};

exports.WEEKDAY = function(serial_number, return_type) {
  serial_number = utils.parseDate(serial_number);
  if (serial_number instanceof Error) {
    return serial_number;
  }
  if (return_type === undefined) {
    return_type = 1;
  }
  var day = serial_number.getDay();

  return WEEK_TYPES[return_type][day];
};

exports.WEEKNUM = function(serial_number, return_type) {
  serial_number = utils.parseDate(serial_number);
  if (serial_number instanceof Error) {
    return serial_number;
  }
  if (return_type === undefined) {
    return_type = 1;
  }
  if (return_type === 21) {
    return this.ISOWEEKNUM(serial_number);
  }
  var week_start = WEEK_STARTS[return_type];
  var jan = new Date(serial_number.getFullYear(), 0, 1);
  var inc = jan.getDay() < week_start ? 1 : 0;
  jan -= Math.abs(jan.getDay() - week_start) * 24 * 60 * 60 * 1000;

  return Math.floor(((serial_number - jan) / (1000 * 60 * 60 * 24)) / 7 + 1) + inc;
};

exports.WORKDAY = function(start_date, days, holidays) {
  return this.WORKDAY.INTL(start_date, days, 1, holidays);
};

exports.WORKDAY.INTL = function(start_date, days, weekend, holidays) {
  start_date = utils.parseDate(start_date);
  if (start_date instanceof Error) {
    return start_date;
  }
  days = utils.parseNumber(days);
  if (days instanceof Error) {
    return days;
  }
  if (days < 0) {
    return error.num;
  }
  if (weekend === undefined) {
    weekend = WEEKEND_TYPES[1];
  } else {
    weekend = WEEKEND_TYPES[weekend];
  }
  if (!(weekend instanceof Array)) {
    return error.value;
  }
  if (holidays === undefined) {
    holidays = [];
  } else if (!(holidays instanceof Array)) {
    holidays = [holidays];
  }
  for (var i = 0; i < holidays.length; i++) {
    var h = utils.parseDate(holidays[i]);
    if (h instanceof Error) {
      return h;
    }
    holidays[i] = h;
  }
  var d = 0;
  while (d < days) {
    start_date.setDate(start_date.getDate() + 1);
    var day = start_date.getDay();
    if (day === weekend[0] || day === weekend[1]) {
      continue;
    }
    for (var j = 0; j < holidays.length; j++) {
      var holiday = holidays[j];
      if (holiday.getDate() === start_date.getDate() &&
        holiday.getMonth() === start_date.getMonth() &&
        holiday.getFullYear() === start_date.getFullYear()) {
        d--;
        break;
      }
    }
    d++;
  }

  return start_date;
};

exports.YEAR = function(serial_number) {
  serial_number = utils.parseDate(serial_number);

  if (serial_number instanceof Error) {
    return serial_number;
  }

  return serial_number.getFullYear();
};

function isLeapYear(year) {
  return new Date(year, 1, 29).getMonth() === 1;
}

// TODO : Use DAYS ?
function daysBetween(start_date, end_date) {
  return Math.ceil((end_date - start_date) / 1000 / 60 / 60 / 24);
}

exports.YEARFRAC = function(start_date, end_date, basis) {
  start_date = utils.parseDate(start_date);
  if (start_date instanceof Error) {
    return start_date;
  }
  end_date = utils.parseDate(end_date);
  if (end_date instanceof Error) {
    return end_date;
  }

  basis = basis || 0;
  var sd = start_date.getDate();
  var sm = start_date.getMonth() + 1;
  var sy = start_date.getFullYear();
  var ed = end_date.getDate();
  var em = end_date.getMonth() + 1;
  var ey = end_date.getFullYear();

  switch (basis) {
    case 0:
      // US (NASD) 30/360
      if (sd === 31 && ed === 31) {
        sd = 30;
        ed = 30;
      } else if (sd === 31) {
        sd = 30;
      } else if (sd === 30 && ed === 31) {
        ed = 30;
      }
      return ((ed + em * 30 + ey * 360) - (sd + sm * 30 + sy * 360)) / 360;
    case 1:
      // Actual/actual
      var feb29Between = function(date1, date2) {
        var year1 = date1.getFullYear();
        var mar1year1 = new Date(year1, 2, 1);
        if (isLeapYear(year1) && date1 < mar1year1 && date2 >= mar1year1) {
          return true;
        }
        var year2 = date2.getFullYear();
        var mar1year2 = new Date(year2, 2, 1);
        return (isLeapYear(year2) && date2 >= mar1year2 && date1 < mar1year2);
      };
      var ylength = 365;
      if (sy === ey || ((sy + 1) === ey) && ((sm > em) || ((sm === em) && (sd >= ed)))) {
        if ((sy === ey && isLeapYear(sy)) ||
          feb29Between(start_date, end_date) ||
          (em === 1 && ed === 29)) {
          ylength = 366;
        }
        return daysBetween(start_date, end_date) / ylength;
      }
      var years = (ey - sy) + 1;
      var days = (new Date(ey + 1, 0, 1) - new Date(sy, 0, 1)) / 1000 / 60 / 60 / 24;
      var average = days / years;
      return daysBetween(start_date, end_date) / average;
    case 2:
      // Actual/360
      return daysBetween(start_date, end_date) / 360;
    case 3:
      // Actual/365
      return daysBetween(start_date, end_date) / 365;
    case 4:
      // European 30/360
      return ((ed + em * 30 + ey * 360) - (sd + sm * 30 + sy * 360)) / 360;
  }
};

function serial(date) {
  var addOn = (date > -2203891200000) ? 2 : 1;

  return (date - d1900) / 86400000 + addOn;
}


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * numbro.js
 * version : 1.11.1
 * author : Företagsplatsen AB
 * license : MIT
 * http://www.foretagsplatsen.se
 */

(function () {
    'use strict';

    /************************************
        Constants
    ************************************/

    var numbro,
        VERSION = '1.11.1',
        binarySuffixes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'],
        decimalSuffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        bytes = {
            general: { scale: 1024, suffixes: decimalSuffixes, marker: 'bd' },
            binary:  { scale: 1024, suffixes: binarySuffixes, marker: 'b' },
            decimal: { scale: 1000, suffixes: decimalSuffixes, marker: 'd' }
        },
        // general must be before the others because it reuses their characters!
        byteFormatOrder = [ bytes.general, bytes.binary, bytes.decimal ],
    // internal storage for culture config files
        cultures = {},
    // Todo: Remove in 2.0.0
        languages = cultures,
        currentCulture = 'en-US',
        zeroFormat = null,
        defaultFormat = '0,0',
        defaultCurrencyFormat = '0$',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),
    // default culture
        enUS = {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            ordinal: function(number) {
                var b = number % 10;
                return (~~(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            },
            currency: {
                symbol: '$',
                position: 'prefix'
            },
            defaults: {
                currencyFormat: ',0000 a'
            },
            formats: {
                fourDigits: '0000 a',
                fullWithTwoDecimals: '$ ,0.00',
                fullWithTwoDecimalsNoCurrency: ',0.00'
            }
        };

    /************************************
        Constructors
    ************************************/


    // Numbro prototype object
    function Numbro(number) {
        this._value = number;
    }

    function numberLength(number) {
        if (number === 0) { return 1; }
        return Math.floor(Math.log(Math.abs(number)) / Math.LN10) + 1;
    }

    function zeroes(count) {
        var i, ret = '';

        for (i = 0; i < count; i++) {
            ret += '0';
        }

        return ret;
    }
    /**
     * Implementation of toFixed() for numbers with exponents
     * This function may return negative representations for zero values e.g. "-0.0"
     */
    function toFixedLargeSmall(value, precision) {
        var mantissa,
            beforeDec,
            afterDec,
            exponent,
            prefix,
            endStr,
            zerosStr,
            str;

        str = value.toString();

        mantissa = str.split('e')[0];
        exponent = str.split('e')[1];

        beforeDec = mantissa.split('.')[0];
        afterDec = mantissa.split('.')[1] || '';

        if (+exponent > 0) {
            // exponent is positive - add zeros after the numbers
            str = beforeDec + afterDec + zeroes(exponent - afterDec.length);
        } else {
            // exponent is negative

            if (+beforeDec < 0) {
                prefix = '-0';
            } else {
                prefix = '0';
            }

            // tack on the decimal point if needed
            if (precision > 0) {
                prefix += '.';
            }

            zerosStr = zeroes((-1 * exponent) - 1);
            // substring off the end to satisfy the precision
            endStr = (zerosStr + Math.abs(beforeDec) + afterDec).substr(0, precision);
            str = prefix + endStr;
        }

        // only add percision 0's if the exponent is positive
        if (+exponent > 0 && precision > 0) {
            str += '.' + zeroes(precision);
        }

        return str;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     *
     * Also removes negative signs for zero-formatted numbers. e.g. -0.01 w/ precision 1 -> 0.0
     */
    function toFixed(value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;

        if (value.toString().indexOf('e') > -1) {
            // toFixed returns scientific notation for numbers above 1e21 and below 1e-7
            output = toFixedLargeSmall(value, precision);
            // remove the leading negative sign if it exists and should not be present (e.g. -0.00)
            if (output.charAt(0) === '-' && +output >= 0) {
                output = output.substr(1); // chop off the '-'
            }
        }
        else {
            // Multiply up by precision, round accurately, then divide and use native toFixed():
            output = (roundingFunction(value + 'e+' + precision) / power).toFixed(precision);
        }

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumbro(n, format, roundingFunction) {
        var output,
            escapedFormat = format.replace(/\{[^\{\}]*\}/g, '');

        // figure out what kind of format we are dealing with
        if (escapedFormat.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, cultures[currentCulture].currency.symbol, format, roundingFunction);
        } else if (escapedFormat.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (escapedFormat.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumbro(n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (cultures[currentCulture].delimiters.decimal !== '.') {
                    string = string.replace(/\./g, '').replace(cultures[currentCulture].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.thousand +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.million +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.billion +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.trillion +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 1; power < binarySuffixes.length && !bytesMultiplier; ++power) {
                    if (string.indexOf(binarySuffixes[power]) > -1) {
                        bytesMultiplier = Math.pow(1024, power);
                    } else if (string.indexOf(decimalSuffixes[power]) > -1) {
                        bytesMultiplier = Math.pow(1000, power);
                    }
                }

                var str = string.replace(/[^0-9\.]+/g, '');
                if (str === '') {
                    // An empty string is not a number.
                    n._value = NaN;

                } else {
                    // do some math to create our number
                    n._value = ((bytesMultiplier) ? bytesMultiplier : 1) *
                        ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) *
                        ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) *
                        ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) *
                        ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) *
                        ((string.indexOf('%') > -1) ? 0.01 : 1) *
                        (((string.split('-').length +
                            Math.min(string.split('(').length - 1, string.split(')').length - 1)) % 2) ? 1 : -1) *
                        Number(str);

                    // round if we are talking about bytes
                    n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
                }
            }
        }
        return n._value;
    }

    function formatCurrency(n, currencySymbol, originalFormat, roundingFunction) {
        var format = originalFormat,
            symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            plusSignIndex = format.indexOf('+'),
            minusSignIndex = format.indexOf('-'),
            space = '',
            decimalSeparator = '',
            spliceIndex,
            output;

        if(format.indexOf('$') === -1){
            // Use defaults instead of the format provided
            if (cultures[currentCulture].currency.position === 'infix') {
                decimalSeparator = currencySymbol;
                if (cultures[currentCulture].currency.spaceSeparated) {
                    decimalSeparator = ' ' + decimalSeparator + ' ';
                }
            } else if (cultures[currentCulture].currency.spaceSeparated) {
                space = ' ';
            }
        } else {
            // check for space before or after currency
            if (format.indexOf(' $') > -1) {
                space = ' ';
                format = format.replace(' $', '');
            } else if (format.indexOf('$ ') > -1) {
                space = ' ';
                format = format.replace('$ ', '');
            } else {
                format = format.replace('$', '');
            }
        }

        // Format The Number
        output = formatNumber(n._value, format, roundingFunction, decimalSeparator);

        if (originalFormat.indexOf('$') === -1) {
            // Use defaults instead of the format provided
            switch (cultures[currentCulture].currency.position) {
                case 'postfix':
                    if (output.indexOf(')') > -1) {
                        output = output.split('');
                        output.splice(-1, 0, space + currencySymbol);
                        output = output.join('');
                    } else {
                        output = output + space + currencySymbol;
                    }
                    break;
                case 'infix':
                    break;
                case 'prefix':
                    if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                        output = output.split('');
                        spliceIndex = Math.max(openParenIndex, minusSignIndex) + 1;

                        output.splice(spliceIndex, 0, currencySymbol + space);
                        output = output.join('');
                    } else {
                        output = currencySymbol + space + output;
                    }
                    break;
                default:
                    throw Error('Currency position should be among ["prefix", "infix", "postfix"]');
            }
        } else {
            // position the symbol
            if (symbolIndex <= 1) {
                if (output.indexOf('(') > -1 || output.indexOf('+') > -1 || output.indexOf('-') > -1) {
                    output = output.split('');
                    spliceIndex = 1;
                    if (symbolIndex < openParenIndex || symbolIndex < plusSignIndex || symbolIndex < minusSignIndex) {
                        // the symbol appears before the "(", "+" or "-"
                        spliceIndex = 0;
                    }
                    output.splice(spliceIndex, 0, currencySymbol + space);
                    output = output.join('');
                } else {
                    output = currencySymbol + space + output;
                }
            } else {
                if (output.indexOf(')') > -1) {
                    output = output.split('');
                    output.splice(-1, 0, space + currencySymbol);
                    output = output.join('');
                } else {
                    output = output + space + currencySymbol;
                }
            }
        }

        return output;
    }

    function formatForeignCurrency(n, foreignCurrencySymbol, originalFormat, roundingFunction) {
        return formatCurrency(n, foreignCurrencySymbol, originalFormat, roundingFunction);
    }

    function formatPercentage(n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);

        if (output.indexOf(')') > -1) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime(n) {
        var hours = Math.floor(n._value / 60 / 60),
            minutes = Math.floor((n._value - (hours * 60 * 60)) / 60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' +
            ((minutes < 10) ? '0' + minutes : minutes) + ':' +
            ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime(string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatByteUnits (value, suffixes, scale) {
        var suffix = suffixes[0],
            power,
            min,
            max,
            abs = Math.abs(value);

        if (abs >= scale) {
            for (power = 1; power < suffixes.length; ++power) {
                min = Math.pow(scale, power);
                max = Math.pow(scale, power + 1);

                if (abs >= min && abs < max) {
                    suffix = suffixes[power];
                    value = value / min;
                    break;
                }
            }

            // values greater than or equal to [scale] YB never set the suffix
            if (suffix === suffixes[0]) {
                value = value / Math.pow(scale, suffixes.length - 1);
                suffix = suffixes[suffixes.length - 1];
            }
        }

        return { value: value, suffix: suffix };
    }

    function formatNumber (value, format, roundingFunction, sep) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            byteFormat,
            units,
            ord = '',
            abs = Math.abs(value),
            totalLength,
            length,
            minimumPrecision,
            pow,
            w,
            intPrecision,
            precision,
            prefix,
            postfix,
            thousands,
            d = '',
            forcedNeg = false,
            neg = false,
            indexOpenP,
            indexMinus,
            paren = '',
            minlen,
            i;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        }

        if (!isFinite(value)) {
            return '' + value;
        }

        if (format.indexOf('{') === 0) {
            var end = format.indexOf('}');
            if (end === -1) {
                throw Error('Format should also contain a "}"');
            }
            prefix = format.slice(1, end);
            format = format.slice(end + 1);
        } else {
            prefix = '';
        }

        if (format.indexOf('}') === format.length - 1 && format.length) {
            var start = format.indexOf('{');
            if (start === -1) {
                throw Error('Format should also contain a "{"');
            }
            postfix = format.slice(start + 1, -1);
            format = format.slice(0, start + 1);
        } else {
            postfix = '';
        }

        // check for min length
        var info;
        if (format.indexOf('.') === -1) {
            info = format.match(/([0-9]+).*/);
        } else {
            info = format.match(/([0-9]+)\..*/);
        }
        minlen = info === null ? -1 : info[1].length;

        // see if we should use parentheses for negative number or if we should prefix with a sign
        // if both are present we default to parentheses
        if (format.indexOf('-') !== -1) {
            forcedNeg = true;
        }
        if (format.indexOf('(') > -1) {
            negP = true;
            format = format.slice(1, -1);
        } else if (format.indexOf('+') > -1) {
            signed = true;
            format = format.replace(/\+/g, '');
        }

        // see if abbreviation is wanted
        if (format.indexOf('a') > -1) {
            intPrecision = format.split('.')[0].match(/[0-9]+/g) || ['0'];
            intPrecision = parseInt(intPrecision[0], 10);

            // check if abbreviation is specified
            abbrK = format.indexOf('aK') >= 0;
            abbrM = format.indexOf('aM') >= 0;
            abbrB = format.indexOf('aB') >= 0;
            abbrT = format.indexOf('aT') >= 0;
            abbrForce = abbrK || abbrM || abbrB || abbrT;

            // check for space before abbreviation
            if (format.indexOf(' a') > -1) {
                abbr = ' ';
                format = format.replace(' a', '');
            } else {
                format = format.replace('a', '');
            }

            totalLength = numberLength(value);
            minimumPrecision = totalLength % 3;
            minimumPrecision = minimumPrecision === 0 ? 3 : minimumPrecision;

            if (intPrecision && abs !== 0) {
                pow = 3 * ~~((Math.min(intPrecision, totalLength) - minimumPrecision) / 3);
                abs = abs / Math.pow(10, pow);
            }

            if (totalLength !== intPrecision) {
                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + cultures[currentCulture].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + cultures[currentCulture].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + cultures[currentCulture].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + cultures[currentCulture].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            length = numberLength(value);
            if (intPrecision && length < intPrecision && format.indexOf('.') === -1) {
                format += '[.]';
                format += zeroes(intPrecision - length);
            }
        }

        // see if we are formatting
        //   binary-decimal bytes (1024 MB), binary bytes (1024 MiB), or decimal bytes (1000 MB)
        for (i = 0; i < byteFormatOrder.length; ++i) {
            byteFormat = byteFormatOrder[i];

            if (format.indexOf(byteFormat.marker) > -1) {
                // check for space before
                if (format.indexOf(' ' + byteFormat.marker) >-1) {
                    bytes = ' ';
                }

                // remove the marker (with the space if it had one)
                format = format.replace(bytes + byteFormat.marker, '');

                units = formatByteUnits(value, byteFormat.suffixes, byteFormat.scale);

                value = units.value;
                bytes = bytes + units.suffix;

                break;
            }
        }

        // see if ordinal is wanted
        if (format.indexOf('o') > -1) {
            // check for space before
            if (format.indexOf(' o') > -1) {
                ord = ' ';
                format = format.replace(' o', '');
            } else {
                format = format.replace('o', '');
            }

            if (cultures[currentCulture].ordinal) {
                ord = ord + cultures[currentCulture].ordinal(value);
            }
        }

        if (format.indexOf('[.]') > -1) {
            optDec = true;
            format = format.replace('[.]', '.');
        }

        precision = format.split('.')[1];
        thousands = format.indexOf(',');

        if (precision) {
            var dSplit = [];

            if (precision.indexOf('*') !== -1) {
                d = value.toString();
                dSplit = d.split('.');
                if (dSplit.length > 1) {
                    d = toFixed(value, dSplit[1].length, roundingFunction);
                }
            } else {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction,
                        precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }
            }

            dSplit = d.split('.');
            w = dSplit[0];

            if (dSplit.length > 1 && dSplit[1].length) {
                var p = sep ? abbr + sep : cultures[currentCulture].delimiters.decimal;
                d = p + dSplit[1];
            } else {
                d = '';
            }

            if (optDec && Number(d.slice(1)) === 0) {
                d = '';
            }
        } else {
            w = toFixed(value, 0, roundingFunction);
        }

        // format number
        if (w.indexOf('-') > -1) {
            w = w.slice(1);
            neg = true;
        }

        if (w.length < minlen) {
            w = zeroes(minlen - w.length) + w;
        }

        if (thousands > -1) {
            w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' +
                cultures[currentCulture].delimiters.thousands);
        }

        if (format.indexOf('.') === 0) {
            w = '';
        }

        indexOpenP = format.indexOf('(');
        indexMinus = format.indexOf('-');

        if (indexOpenP < indexMinus) {
            paren = ((negP && neg) ? '(' : '') + (((forcedNeg && neg) || (!negP && neg)) ? '-' : '');
        } else {
            paren = (((forcedNeg && neg) || (!negP && neg)) ? '-' : '') + ((negP && neg) ? '(' : '');
        }

        return prefix +
            paren + ((!neg && signed && value !== 0) ? '+' : '') +
            w + d +
            ((ord) ? ord : '') +
            ((abbr && !sep) ? abbr : '') +
            ((bytes) ? bytes : '') +
            ((negP && neg) ? ')' : '') +
            postfix;
    }

    /************************************
        Top Level Functions
    ************************************/

    numbro = function(input) {
        if (numbro.isNumbro(input)) {
            input = input.value();
        } else if (typeof input === 'string' || typeof input === 'number') {
            input = numbro.fn.unformat(input);
        } else {
            input = NaN;
        }

        return new Numbro(Number(input));
    };

    // version number
    numbro.version = VERSION;

    // compare numbro object
    numbro.isNumbro = function(obj) {
        return obj instanceof Numbro;
    };

    /**
     * This function allow the user to set a new language with a fallback if
     * the language does not exist. If no fallback language is provided,
     * it fallbacks to english.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `setCulture` should be used instead.
     */
    numbro.setLanguage = function(newLanguage, fallbackLanguage) {
        console.warn('`setLanguage` is deprecated since version 1.6.0. Use `setCulture` instead');
        var key = newLanguage,
            prefix = newLanguage.split('-')[0],
            matchingLanguage = null;
        if (!languages[key]) {
            Object.keys(languages).forEach(function(language) {
                if (!matchingLanguage && language.split('-')[0] === prefix) {
                    matchingLanguage = language;
                }
            });
            key = matchingLanguage || fallbackLanguage || 'en-US';
        }
        chooseCulture(key);
    };

    /**
     * This function allow the user to set a new culture with a fallback if
     * the culture does not exist. If no fallback culture is provided,
     * it falls back to "en-US".
     */
    numbro.setCulture = function(newCulture, fallbackCulture) {
        var key = newCulture,
            suffix = newCulture.split('-')[1],
            matchingCulture = null;
        if (!cultures[key]) {
            if (suffix) {
                Object.keys(cultures).forEach(function(language) {
                    if (!matchingCulture && language.split('-')[1] === suffix) {
                        matchingCulture = language;
                    }
                });
            }

            key = matchingCulture || fallbackCulture || 'en-US';
        }
        chooseCulture(key);
    };

    /**
     * This function will load languages and then set the global language.  If
     * no arguments are passed in, it will simply return the current global
     * language key.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `culture` should be used instead.
     */
    numbro.language = function(key, values) {
        console.warn('`language` is deprecated since version 1.6.0. Use `culture` instead');

        if (!key) {
            return currentCulture;
        }

        if (key && !values) {
            if (!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            chooseCulture(key);
        }

        if (values || !languages[key]) {
            setCulture(key, values);
        }

        return numbro;
    };

    /**
     * This function will load cultures and then set the global culture.  If
     * no arguments are passed in, it will simply return the current global
     * culture code.
     */
    numbro.culture = function(code, values) {
        if (!code) {
            return currentCulture;
        }

        if (code && !values) {
            if (!cultures[code]) {
                throw new Error('Unknown culture : ' + code);
            }
            chooseCulture(code);
        }

        if (values || !cultures[code]) {
            setCulture(code, values);
        }

        return numbro;
    };

    /**
     * This function provides access to the loaded language data.  If
     * no arguments are passed in, it will simply return the current
     * global language object.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `culture` should be used instead.
     */
    numbro.languageData = function(key) {
        console.warn('`languageData` is deprecated since version 1.6.0. Use `cultureData` instead');

        if (!key) {
            return languages[currentCulture];
        }

        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }

        return languages[key];
    };

    /**
     * This function provides access to the loaded culture data.  If
     * no arguments are passed in, it will simply return the current
     * global culture object.
     */
    numbro.cultureData = function(code) {
        if (!code) {
            return cultures[currentCulture];
        }

        if (!cultures[code]) {
            throw new Error('Unknown culture : ' + code);
        }

        return cultures[code];
    };

    numbro.culture('en-US', enUS);

    /**
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `cultures` should be used instead.
     */
    numbro.languages = function() {
        console.warn('`languages` is deprecated since version 1.6.0. Use `cultures` instead');

        return languages;
    };

    numbro.cultures = function() {
        return cultures;
    };

    numbro.zeroFormat = function(format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numbro.defaultFormat = function(format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    numbro.defaultCurrencyFormat = function (format) {
        defaultCurrencyFormat = typeof(format) === 'string' ? format : '0$';
    };

    numbro.validate = function(val, culture) {

        var _decimalSep,
            _thousandSep,
            _currSymbol,
            _valArray,
            _abbrObj,
            _thousandRegEx,
            cultureData,
            temp;

        //coerce val to string
        if (typeof val !== 'string') {
            val += '';
            if (console.warn) {
                console.warn('Numbro.js: Value is not string. It has been co-erced to: ', val);
            }
        }

        //trim whitespaces from either sides
        val = val.trim();

        //replace the initial '+' or '-' sign if present
        val = val.replace(/^[+-]?/, '');

        //if val is just digits return true
        if ( !! val.match(/^\d+$/)) {
            return true;
        }

        //if val is empty return false
        if (val === '') {
            return false;
        }

        //get the decimal and thousands separator from numbro.cultureData
        try {
            //check if the culture is understood by numbro. if not, default it to current culture
            cultureData = numbro.cultureData(culture);
        } catch (e) {
            cultureData = numbro.cultureData(numbro.culture());
        }

        //setup the delimiters and currency symbol based on culture
        _currSymbol = cultureData.currency.symbol;
        _abbrObj = cultureData.abbreviations;
        _decimalSep = cultureData.delimiters.decimal;
        if (cultureData.delimiters.thousands === '.') {
            _thousandSep = '\\.';
        } else {
            _thousandSep = cultureData.delimiters.thousands;
        }

        // validating currency symbol
        temp = val.match(/^[^\d\.\,]+/);
        if (temp !== null) {
            val = val.substr(1);
            if (temp[0] !== _currSymbol) {
                return false;
            }
        }

        //validating abbreviation symbol
        temp = val.match(/[^\d]+$/);
        if (temp !== null) {
            val = val.slice(0, -1);
            if (temp[0] !== _abbrObj.thousand && temp[0] !== _abbrObj.million &&
                    temp[0] !== _abbrObj.billion && temp[0] !== _abbrObj.trillion) {
                return false;
            }
        }

        _thousandRegEx = new RegExp(_thousandSep + '{2}');

        if (!val.match(/[^\d.,]/g)) {
            _valArray = val.split(_decimalSep);
            if (_valArray.length > 2) {
                return false;
            } else {
                if (_valArray.length < 2) {
                    return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx));
                } else {
                    if (_valArray[0] === '') {
                        // for values without leading zero eg. .984
                        return (!_valArray[0].match(_thousandRegEx) &&
                            !!_valArray[1].match(/^\d+$/));

                    } else if (_valArray[0].length === 1) {
                        return ( !! _valArray[0].match(/^\d+$/) &&
                            !_valArray[0].match(_thousandRegEx) &&
                            !! _valArray[1].match(/^\d+$/));
                    } else {
                        return ( !! _valArray[0].match(/^\d+.*\d$/) &&
                            !_valArray[0].match(_thousandRegEx) &&
                            !! _valArray[1].match(/^\d+$/));
                    }
                }
            }
        }

        return false;
    };

    /**
     * * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `loadCulturesInNode` should be used instead.
     */
    numbro.loadLanguagesInNode = function() {
        console.warn('`loadLanguagesInNode` is deprecated since version 1.6.0. Use `loadCulturesInNode` instead');

        numbro.loadCulturesInNode();
    };

    numbro.loadCulturesInNode = function() {
        // TODO: Rename the folder in 2.0.0
        var cultures = __webpack_require__(27);

        for(var langLocaleCode in cultures) {
            if(langLocaleCode) {
                numbro.culture(langLocaleCode, cultures[langLocaleCode]);
            }
        }
    };

    /************************************
        Helpers
    ************************************/

    function setCulture(code, values) {
        cultures[code] = values;
    }

    function chooseCulture(code) {
        currentCulture = code;
        var defaults = cultures[code].defaults;
        if (defaults && defaults.format) {
            numbro.defaultFormat(defaults.format);
        }
        if (defaults && defaults.currencyFormat) {
            numbro.defaultCurrencyFormat(defaults.currencyFormat);
        }
    }

    function inNodejsRuntime() {
        return (typeof process !== 'undefined') &&
            (process.browser === undefined) &&
            process.title &&
            (
                process.title.indexOf('node') !== -1 ||
                process.title.indexOf('meteor-tool') > 0 ||
                process.title === 'grunt' ||
                process.title === 'gulp'
            ) &&
            ("function" !== 'undefined');
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
        Array.prototype.reduce = function(callback, optInitialValue) {

            if (null === this || 'undefined' === typeof this) {
                // At the moment all modern browsers, that support strict mode, have
                // native implementation of Array.prototype.reduce. For instance, IE8
                // does not support strict mode, so this check is actually useless.
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }

            if ('function' !== typeof callback) {
                throw new TypeError(callback + ' is not a function');
            }

            var index,
                value,
                length = this.length >>> 0,
                isValueSet = false;

            if (1 < arguments.length) {
                value = optInitialValue;
                isValueSet = true;
            }

            for (index = 0; length > index; ++index) {
                if (this.hasOwnProperty(index)) {
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
            }

            if (!isValueSet) {
                throw new TypeError('Reduce of empty array with no initial value');
            }

            return value;
        };
    }


    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function(prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
            return mp > mn ? mp : mn;
        }, -Infinity);
    }

    /************************************
        Numbro Prototype
    ************************************/


    numbro.fn = Numbro.prototype = {

        clone: function() {
            return numbro(this);
        },

        format: function(inputString, roundingFunction) {
            return formatNumbro(this,
                inputString ? inputString : defaultFormat,
                (roundingFunction !== undefined) ? roundingFunction : Math.round
            );
        },

        formatCurrency: function(inputString, roundingFunction) {
            return formatCurrency(this,
                cultures[currentCulture].currency.symbol,
                inputString ? inputString : defaultCurrencyFormat,
                (roundingFunction !== undefined) ? roundingFunction : Math.round
            );
        },

        formatForeignCurrency: function(currencySymbol, inputString, roundingFunction) {
            return formatForeignCurrency(this,
                currencySymbol,
                inputString ? inputString : defaultCurrencyFormat,
                (roundingFunction !== undefined) ? roundingFunction : Math.round
            );
        },

        unformat: function(inputString) {
            if (typeof inputString === 'number') {
                return inputString;
            } else if (typeof inputString === 'string') {
                var result = unformatNumbro(this, inputString);

                // Any unparseable string (represented as NaN in the result) is
                // converted into undefined.
                return isNaN(result) ? undefined : result;
            } else {
                return undefined;
            }
        },

        binaryByteUnits: function() {
            return formatByteUnits(this._value, bytes.binary.suffixes, bytes.binary.scale).suffix;
        },

        byteUnits: function() {
            return formatByteUnits(this._value, bytes.general.suffixes, bytes.general.scale).suffix;
        },

        decimalByteUnits: function() {
            return formatByteUnits(this._value, bytes.decimal.suffixes, bytes.decimal.scale).suffix;
        },

        value: function() {
            return this._value;
        },

        valueOf: function() {
            return this._value;
        },

        set: function(value) {
            this._value = Number(value);
            return this;
        },

        add: function(value) {
            var corrFactor = correctionFactor.call(null, this._value, value);

            function cback(accum, curr) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract: function(value) {
            var corrFactor = correctionFactor.call(null, this._value, value);

            function cback(accum, curr) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;
            return this;
        },

        multiply: function(value) {
            function cback(accum, curr) {
                var corrFactor = correctionFactor(accum, curr),
                    result = accum * corrFactor;
                result *= curr * corrFactor;
                result /= corrFactor * corrFactor;
                return result;
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide: function(value) {
            function cback(accum, curr) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);
            return this;
        },

        difference: function(value) {
            return Math.abs(numbro(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numbro
    ************************************/

    if (inNodejsRuntime()) {
        //Todo: Rename the folder in 2.0.0
        numbro.loadCulturesInNode();
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numbro;
    } else {
        /*global ender:false */
        if (typeof ender === 'undefined') {
            // here, `this` means `window` in the browser, or `global` on the server
            // add `numbro` as a global object via a string identifier,
            // for Closure Compiler 'advanced' mode
            this.numbro = numbro;
        }

        /*global define:false */
        if (true) {
            !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function() {
                return numbro;
            }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
        }
    }

}.call(typeof window === 'undefined' ? this : window));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(10)))

/***/ }),
/* 10 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

(function (window, factory) {
    if (true) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        window.jStat = factory();
    }
})(this, function () {
var jStat = (function(Math, undefined) {

// For quick reference.
var concat = Array.prototype.concat;
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

// Calculate correction for IEEE error
// TODO: This calculation can be improved.
function calcRdx(n, m) {
  var val = n > m ? n : m;
  return Math.pow(10,
                  17 - ~~(Math.log(((val > 0) ? val : -val)) * Math.LOG10E));
}


var isArray = Array.isArray || function isArray(arg) {
  return toString.call(arg) === '[object Array]';
};


function isFunction(arg) {
  return toString.call(arg) === '[object Function]';
}


function isNumber(arg) {
  return typeof arg === 'number' && arg === arg;
}


// Converts the jStat matrix to vector.
function toVector(arr) {
  return concat.apply([], arr);
}


// The one and only jStat constructor.
function jStat() {
  return new jStat._init(arguments);
}


// TODO: Remove after all references in src files have been removed.
jStat.fn = jStat.prototype;


// By separating the initializer from the constructor it's easier to handle
// always returning a new instance whether "new" was used or not.
jStat._init = function _init(args) {
  var i;

  // If first argument is an array, must be vector or matrix.
  if (isArray(args[0])) {
    // Check if matrix.
    if (isArray(args[0][0])) {
      // See if a mapping function was also passed.
      if (isFunction(args[1]))
        args[0] = jStat.map(args[0], args[1]);
      // Iterate over each is faster than this.push.apply(this, args[0].
      for (var i = 0; i < args[0].length; i++)
        this[i] = args[0][i];
      this.length = args[0].length;

    // Otherwise must be a vector.
    } else {
      this[0] = isFunction(args[1]) ? jStat.map(args[0], args[1]) : args[0];
      this.length = 1;
    }

  // If first argument is number, assume creation of sequence.
  } else if (isNumber(args[0])) {
    this[0] = jStat.seq.apply(null, args);
    this.length = 1;

  // Handle case when jStat object is passed to jStat.
  } else if (args[0] instanceof jStat) {
    // Duplicate the object and pass it back.
    return jStat(args[0].toArray());

  // Unexpected argument value, return empty jStat object.
  // TODO: This is strange behavior. Shouldn't this throw or some such to let
  // the user know they had bad arguments?
  } else {
    this[0] = [];
    this.length = 1;
  }

  return this;
};
jStat._init.prototype = jStat.prototype;
jStat._init.constructor = jStat;


// Utility functions.
// TODO: for internal use only?
jStat.utils = {
  calcRdx: calcRdx,
  isArray: isArray,
  isFunction: isFunction,
  isNumber: isNumber,
  toVector: toVector
};


// Easily extend the jStat object.
// TODO: is this seriously necessary?
jStat.extend = function extend(obj) {
  var i, j;

  if (arguments.length === 1) {
    for (j in obj)
      jStat[j] = obj[j];
    return this;
  }

  for (var i = 1; i < arguments.length; i++) {
    for (j in arguments[i])
      obj[j] = arguments[i][j];
  }

  return obj;
};


// Returns the number of rows in the matrix.
jStat.rows = function rows(arr) {
  return arr.length || 1;
};


// Returns the number of columns in the matrix.
jStat.cols = function cols(arr) {
  return arr[0].length || 1;
};


// Returns the dimensions of the object { rows: i, cols: j }
jStat.dimensions = function dimensions(arr) {
  return {
    rows: jStat.rows(arr),
    cols: jStat.cols(arr)
  };
};


// Returns a specified row as a vector or return a sub matrix by pick some rows
jStat.row = function row(arr, index) {
  if (isArray(index)) {
    return index.map(function(i) {
      return jStat.row(arr, i);
    })
  }
  return arr[index];
};


// return row as array
// rowa([[1,2],[3,4]],0) -> [1,2]
jStat.rowa = function rowa(arr, i) {
  return jStat.row(arr, i);
};


// Returns the specified column as a vector or return a sub matrix by pick some
// columns
jStat.col = function col(arr, index) {
  if (isArray(index)) {
    var submat = jStat.arange(arr.length).map(function(i) {
      return new Array(index.length);
    });
    index.forEach(function(ind, i){
      jStat.arange(arr.length).forEach(function(j) {
        submat[j][i] = arr[j][ind];
      });
    });
    return submat;
  }
  var column = new Array(arr.length);
  for (var i = 0; i < arr.length; i++)
    column[i] = [arr[i][index]];
  return column;
};


// return column as array
// cola([[1,2],[3,4]],0) -> [1,3]
jStat.cola = function cola(arr, i) {
  return jStat.col(arr, i).map(function(a){ return a[0] });
};


// Returns the diagonal of the matrix
jStat.diag = function diag(arr) {
  var nrow = jStat.rows(arr);
  var res = new Array(nrow);
  for (var row = 0; row < nrow; row++)
    res[row] = [arr[row][row]];
  return res;
};


// Returns the anti-diagonal of the matrix
jStat.antidiag = function antidiag(arr) {
  var nrow = jStat.rows(arr) - 1;
  var res = new Array(nrow);
  for (var i = 0; nrow >= 0; nrow--, i++)
    res[i] = [arr[i][nrow]];
  return res;
};

// Transpose a matrix or array.
jStat.transpose = function transpose(arr) {
  var obj = [];
  var objArr, rows, cols, j, i;

  // Make sure arr is in matrix format.
  if (!isArray(arr[0]))
    arr = [arr];

  rows = arr.length;
  cols = arr[0].length;

  for (var i = 0; i < cols; i++) {
    objArr = new Array(rows);
    for (j = 0; j < rows; j++)
      objArr[j] = arr[j][i];
    obj.push(objArr);
  }

  // If obj is vector, return only single array.
  return obj.length === 1 ? obj[0] : obj;
};


// Map a function to an array or array of arrays.
// "toAlter" is an internal variable.
jStat.map = function map(arr, func, toAlter) {
  var row, nrow, ncol, res, col;

  if (!isArray(arr[0]))
    arr = [arr];

  nrow = arr.length;
  ncol = arr[0].length;
  res = toAlter ? arr : new Array(nrow);

  for (row = 0; row < nrow; row++) {
    // if the row doesn't exist, create it
    if (!res[row])
      res[row] = new Array(ncol);
    for (col = 0; col < ncol; col++)
      res[row][col] = func(arr[row][col], row, col);
  }

  return res.length === 1 ? res[0] : res;
};


// Cumulatively combine the elements of an array or array of arrays using a function.
jStat.cumreduce = function cumreduce(arr, func, toAlter) {
  var row, nrow, ncol, res, col;

  if (!isArray(arr[0]))
    arr = [arr];

  nrow = arr.length;
  ncol = arr[0].length;
  res = toAlter ? arr : new Array(nrow);

  for (row = 0; row < nrow; row++) {
    // if the row doesn't exist, create it
    if (!res[row])
      res[row] = new Array(ncol);
    if (ncol > 0)
      res[row][0] = arr[row][0];
    for (col = 1; col < ncol; col++)
      res[row][col] = func(res[row][col-1], arr[row][col]);
  }
  return res.length === 1 ? res[0] : res;
};


// Destructively alter an array.
jStat.alter = function alter(arr, func) {
  return jStat.map(arr, func, true);
};


// Generate a rows x cols matrix according to the supplied function.
jStat.create = function  create(rows, cols, func) {
  var res = new Array(rows);
  var i, j;

  if (isFunction(cols)) {
    func = cols;
    cols = rows;
  }

  for (var i = 0; i < rows; i++) {
    res[i] = new Array(cols);
    for (j = 0; j < cols; j++)
      res[i][j] = func(i, j);
  }

  return res;
};


function retZero() { return 0; }


// Generate a rows x cols matrix of zeros.
jStat.zeros = function zeros(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, retZero);
};


function retOne() { return 1; }


// Generate a rows x cols matrix of ones.
jStat.ones = function ones(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, retOne);
};


// Generate a rows x cols matrix of uniformly random numbers.
jStat.rand = function rand(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, Math.random);
};


function retIdent(i, j) { return i === j ? 1 : 0; }


// Generate an identity matrix of size row x cols.
jStat.identity = function identity(rows, cols) {
  if (!isNumber(cols))
    cols = rows;
  return jStat.create(rows, cols, retIdent);
};


// Tests whether a matrix is symmetric
jStat.symmetric = function symmetric(arr) {
  var issymmetric = true;
  var size = arr.length;
  var row, col;

  if (arr.length !== arr[0].length)
    return false;

  for (row = 0; row < size; row++) {
    for (col = 0; col < size; col++)
      if (arr[col][row] !== arr[row][col])
        return false;
  }

  return true;
};


// Set all values to zero.
jStat.clear = function clear(arr) {
  return jStat.alter(arr, retZero);
};


// Generate sequence.
jStat.seq = function seq(min, max, length, func) {
  if (!isFunction(func))
    func = false;

  var arr = [];
  var hival = calcRdx(min, max);
  var step = (max * hival - min * hival) / ((length - 1) * hival);
  var current = min;
  var cnt;

  // Current is assigned using a technique to compensate for IEEE error.
  // TODO: Needs better implementation.
  for (cnt = 0;
       current <= max && cnt < length;
       cnt++, current = (min * hival + step * hival * cnt) / hival) {
    arr.push((func ? func(current, cnt) : current));
  }

  return arr;
};


// arange(5) -> [0,1,2,3,4]
// arange(1,5) -> [1,2,3,4]
// arange(5,1,-1) -> [5,4,3,2]
jStat.arange = function arange(start, end, step) {
  var rl = [];
  step = step || 1;
  if (end === undefined) {
    end = start;
    start = 0;
  }
  if (start === end || step === 0) {
    return [];
  }
  if (start < end && step < 0) {
    return [];
  }
  if (start > end && step > 0) {
    return [];
  }
  if (step > 0) {
    for (i = start; i < end; i += step) {
      rl.push(i);
    }
  } else {
    for (i = start; i > end; i += step) {
      rl.push(i);
    }
  }
  return rl;
};


// A=[[1,2,3],[4,5,6],[7,8,9]]
// slice(A,{row:{end:2},col:{start:1}}) -> [[2,3],[5,6]]
// slice(A,1,{start:1}) -> [5,6]
// as numpy code A[:2,1:]
jStat.slice = (function(){
  function _slice(list, start, end, step) {
    // note it's not equal to range.map mode it's a bug
    var i;
    var rl = [];
    var length = list.length;
    if (start === undefined && end === undefined && step === undefined) {
      return jStat.copy(list);
    }

    start = start || 0;
    end = end || list.length;
    start = start >= 0 ? start : length + start;
    end = end >= 0 ? end : length + end;
    step = step || 1;
    if (start === end || step === 0) {
      return [];
    }
    if (start < end && step < 0) {
      return [];
    }
    if (start > end && step > 0) {
      return [];
    }
    if (step > 0) {
      for (i = start; i < end; i += step) {
        rl.push(list[i]);
      }
    } else {
      for (i = start; i > end;i += step) {
        rl.push(list[i]);
      }
    }
    return rl;
  }

  function slice(list, rcSlice) {
    rcSlice = rcSlice || {};
    if (isNumber(rcSlice.row)) {
      if (isNumber(rcSlice.col))
        return list[rcSlice.row][rcSlice.col];
      var row = jStat.rowa(list, rcSlice.row);
      var colSlice = rcSlice.col || {};
      return _slice(row, colSlice.start, colSlice.end, colSlice.step);
    }

    if (isNumber(rcSlice.col)) {
      var col = jStat.cola(list, rcSlice.col);
      var rowSlice = rcSlice.row || {};
      return _slice(col, rowSlice.start, rowSlice.end, rowSlice.step);
    }

    var rowSlice = rcSlice.row || {};
    var colSlice = rcSlice.col || {};
    var rows = _slice(list, rowSlice.start, rowSlice.end, rowSlice.step);
    return rows.map(function(row) {
      return _slice(row, colSlice.start, colSlice.end, colSlice.step);
    });
  }

  return slice;
}());


// A=[[1,2,3],[4,5,6],[7,8,9]]
// sliceAssign(A,{row:{start:1},col:{start:1}},[[0,0],[0,0]])
// A=[[1,2,3],[4,0,0],[7,0,0]]
jStat.sliceAssign = function sliceAssign(A, rcSlice, B) {
  if (isNumber(rcSlice.row)) {
    if (isNumber(rcSlice.col))
      return A[rcSlice.row][rcSlice.col] = B;
    rcSlice.col = rcSlice.col || {};
    rcSlice.col.start = rcSlice.col.start || 0;
    rcSlice.col.end = rcSlice.col.end || A[0].length;
    rcSlice.col.step = rcSlice.col.step || 1;
    var nl = jStat.arange(rcSlice.col.start,
                          Math.min(A.length, rcSlice.col.end),
                          rcSlice.col.step);
    var m = rcSlice.row;
    nl.forEach(function(n, i) {
      A[m][n] = B[i];
    });
    return A;
  }

  if (isNumber(rcSlice.col)) {
    rcSlice.row = rcSlice.row || {};
    rcSlice.row.start = rcSlice.row.start || 0;
    rcSlice.row.end = rcSlice.row.end || A.length;
    rcSlice.row.step = rcSlice.row.step || 1;
    var ml = jStat.arange(rcSlice.row.start,
                          Math.min(A[0].length, rcSlice.row.end),
                          rcSlice.row.step);
    var n = rcSlice.col;
    ml.forEach(function(m, j) {
      A[m][n] = B[j];
    });
    return A;
  }

  if (B[0].length === undefined) {
    B = [B];
  }
  rcSlice.row.start = rcSlice.row.start || 0;
  rcSlice.row.end = rcSlice.row.end || A.length;
  rcSlice.row.step = rcSlice.row.step || 1;
  rcSlice.col.start = rcSlice.col.start || 0;
  rcSlice.col.end = rcSlice.col.end || A[0].length;
  rcSlice.col.step = rcSlice.col.step || 1;
  var ml = jStat.arange(rcSlice.row.start,
                        Math.min(A.length, rcSlice.row.end),
                        rcSlice.row.step);
  var nl = jStat.arange(rcSlice.col.start,
                        Math.min(A[0].length, rcSlice.col.end),
                        rcSlice.col.step);
  ml.forEach(function(m, i) {
    nl.forEach(function(n, j) {
      A[m][n] = B[i][j];
    });
  });
  return A;
};


// [1,2,3] ->
// [[1,0,0],[0,2,0],[0,0,3]]
jStat.diagonal = function diagonal(diagArray) {
  var mat = jStat.zeros(diagArray.length, diagArray.length);
  diagArray.forEach(function(t, i) {
    mat[i][i] = t;
  });
  return mat;
};


// return copy of A
jStat.copy = function copy(A) {
  return A.map(function(row) {
    if (isNumber(row))
      return row;
    return row.map(function(t) {
      return t;
    });
  });
};


// TODO: Go over this entire implementation. Seems a tragic waste of resources
// doing all this work. Instead, and while ugly, use new Function() to generate
// a custom function for each static method.

// Quick reference.
var jProto = jStat.prototype;

// Default length.
jProto.length = 0;

// For internal use only.
// TODO: Check if they're actually used, and if they are then rename them
// to _*
jProto.push = Array.prototype.push;
jProto.sort = Array.prototype.sort;
jProto.splice = Array.prototype.splice;
jProto.slice = Array.prototype.slice;


// Return a clean array.
jProto.toArray = function toArray() {
  return this.length > 1 ? slice.call(this) : slice.call(this)[0];
};


// Map a function to a matrix or vector.
jProto.map = function map(func, toAlter) {
  return jStat(jStat.map(this, func, toAlter));
};


// Cumulatively combine the elements of a matrix or vector using a function.
jProto.cumreduce = function cumreduce(func, toAlter) {
  return jStat(jStat.cumreduce(this, func, toAlter));
};


// Destructively alter an array.
jProto.alter = function alter(func) {
  jStat.alter(this, func);
  return this;
};


// Extend prototype with methods that have no argument.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = function(func) {
      var self = this,
      results;
      // Check for callback.
      if (func) {
        setTimeout(function() {
          func.call(self, jProto[passfunc].call(self));
        });
        return this;
      }
      results = jStat[passfunc](this);
      return isArray(results) ? jStat(results) : results;
    };
  })(funcs[i]);
})('transpose clear symmetric rows cols dimensions diag antidiag'.split(' '));


// Extend prototype with methods that have one argument.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = function(index, func) {
      var self = this;
      // check for callback
      if (func) {
        setTimeout(function() {
          func.call(self, jProto[passfunc].call(self, index));
        });
        return this;
      }
      return jStat(jStat[passfunc](this, index));
    };
  })(funcs[i]);
})('row col'.split(' '));


// Extend prototype with simple shortcut methods.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = new Function(
        'return jStat(jStat.' + passfunc + '.apply(null, arguments));');
  })(funcs[i]);
})('create zeros ones rand identity'.split(' '));


// Exposing jStat.
return jStat;

}(Math));
(function(jStat, Math) {

var isFunction = jStat.utils.isFunction;

// Ascending functions for sort
function ascNum(a, b) { return a - b; }

function clip(arg, min, max) {
  return Math.max(min, Math.min(arg, max));
}


// sum of an array
jStat.sum = function sum(arr) {
  var sum = 0;
  var i = arr.length;
  while (--i >= 0)
    sum += arr[i];
  return sum;
};


// sum squared
jStat.sumsqrd = function sumsqrd(arr) {
  var sum = 0;
  var i = arr.length;
  while (--i >= 0)
    sum += arr[i] * arr[i];
  return sum;
};


// sum of squared errors of prediction (SSE)
jStat.sumsqerr = function sumsqerr(arr) {
  var mean = jStat.mean(arr);
  var sum = 0;
  var i = arr.length;
  var tmp;
  while (--i >= 0) {
    tmp = arr[i] - mean;
    sum += tmp * tmp;
  }
  return sum;
};

// sum of an array in each row
jStat.sumrow = function sumrow(arr) {
  var sum = 0;
  var i = arr.length;
  while (--i >= 0)
    sum += arr[i];
  return sum;
};

// product of an array
jStat.product = function product(arr) {
  var prod = 1;
  var i = arr.length;
  while (--i >= 0)
    prod *= arr[i];
  return prod;
};


// minimum value of an array
jStat.min = function min(arr) {
  var low = arr[0];
  var i = 0;
  while (++i < arr.length)
    if (arr[i] < low)
      low = arr[i];
  return low;
};


// maximum value of an array
jStat.max = function max(arr) {
  var high = arr[0];
  var i = 0;
  while (++i < arr.length)
    if (arr[i] > high)
      high = arr[i];
  return high;
};


// unique values of an array
jStat.unique = function unique(arr) {
  var hash = {}, _arr = [];
  for(var i = 0; i < arr.length; i++) {
    if (!hash[arr[i]]) {
      hash[arr[i]] = true;
      _arr.push(arr[i]);
    }
  }
  return _arr;
};


// mean value of an array
jStat.mean = function mean(arr) {
  return jStat.sum(arr) / arr.length;
};


// mean squared error (MSE)
jStat.meansqerr = function meansqerr(arr) {
  return jStat.sumsqerr(arr) / arr.length;
};


// geometric mean of an array
jStat.geomean = function geomean(arr) {
  return Math.pow(jStat.product(arr), 1 / arr.length);
};


// median of an array
jStat.median = function median(arr) {
  var arrlen = arr.length;
  var _arr = arr.slice().sort(ascNum);
  // check if array is even or odd, then return the appropriate
  return !(arrlen & 1)
    ? (_arr[(arrlen / 2) - 1 ] + _arr[(arrlen / 2)]) / 2
    : _arr[(arrlen / 2) | 0 ];
};


// cumulative sum of an array
jStat.cumsum = function cumsum(arr) {
  return jStat.cumreduce(arr, function (a, b) { return a + b; });
};


// cumulative product of an array
jStat.cumprod = function cumprod(arr) {
  return jStat.cumreduce(arr, function (a, b) { return a * b; });
};


// successive differences of a sequence
jStat.diff = function diff(arr) {
  var diffs = [];
  var arrLen = arr.length;
  var i;
  for (var i = 1; i < arrLen; i++)
    diffs.push(arr[i] - arr[i - 1]);
  return diffs;
};


// ranks of an array
jStat.rank = function (arr) {
  var arrlen = arr.length;
  var sorted = arr.slice().sort(ascNum);
  var ranks = new Array(arrlen);
  for (var i = 0; i < arrlen; i++) {
    var first = sorted.indexOf(arr[i]);
    var last = sorted.lastIndexOf(arr[i]);
    if (first === last) {
      var val = first;
    } else {
      var val = (first + last) / 2;
    }
    ranks[i] = val + 1;
  }
  return ranks;
};


// mode of an array
// if there are multiple modes of an array, return all of them
// is this the appropriate way of handling it?
jStat.mode = function mode(arr) {
  var arrLen = arr.length;
  var _arr = arr.slice().sort(ascNum);
  var count = 1;
  var maxCount = 0;
  var numMaxCount = 0;
  var mode_arr = [];
  var i;

  for (var i = 0; i < arrLen; i++) {
    if (_arr[i] === _arr[i + 1]) {
      count++;
    } else {
      if (count > maxCount) {
        mode_arr = [_arr[i]];
        maxCount = count;
        numMaxCount = 0;
      }
      // are there multiple max counts
      else if (count === maxCount) {
        mode_arr.push(_arr[i]);
        numMaxCount++;
      }
      // resetting count for new value in array
      count = 1;
    }
  }

  return numMaxCount === 0 ? mode_arr[0] : mode_arr;
};


// range of an array
jStat.range = function range(arr) {
  return jStat.max(arr) - jStat.min(arr);
};

// variance of an array
// flag = true indicates sample instead of population
jStat.variance = function variance(arr, flag) {
  return jStat.sumsqerr(arr) / (arr.length - (flag ? 1 : 0));
};

// pooled variance of an array of arrays
jStat.pooledvariance = function pooledvariance(arr) {
  var sumsqerr = arr.reduce(function (a, samples) {return a + jStat.sumsqerr(samples);}, 0);
  var count = arr.reduce(function (a, samples) {return a + samples.length;}, 0);
  return sumsqerr / (count - arr.length);
};

// deviation of an array
jStat.deviation = function (arr) {
  var mean = jStat.mean(arr);
  var arrlen = arr.length;
  var dev = new Array(arrlen);
  for (var i = 0; i < arrlen; i++) {
    dev[i] = arr[i] - mean;
  }
  return dev;
};

// standard deviation of an array
// flag = true indicates sample instead of population
jStat.stdev = function stdev(arr, flag) {
  return Math.sqrt(jStat.variance(arr, flag));
};

// pooled standard deviation of an array of arrays
jStat.pooledstdev = function pooledstdev(arr) {
  return Math.sqrt(jStat.pooledvariance(arr));
};

// mean deviation (mean absolute deviation) of an array
jStat.meandev = function meandev(arr) {
  var mean = jStat.mean(arr);
  var a = [];
  for (var i = arr.length - 1; i >= 0; i--) {
    a.push(Math.abs(arr[i] - mean));
  }
  return jStat.mean(a);
};


// median deviation (median absolute deviation) of an array
jStat.meddev = function meddev(arr) {
  var median = jStat.median(arr);
  var a = [];
  for (var i = arr.length - 1; i >= 0; i--) {
    a.push(Math.abs(arr[i] - median));
  }
  return jStat.median(a);
};


// coefficient of variation
jStat.coeffvar = function coeffvar(arr) {
  return jStat.stdev(arr) / jStat.mean(arr);
};


// quartiles of an array
jStat.quartiles = function quartiles(arr) {
  var arrlen = arr.length;
  var _arr = arr.slice().sort(ascNum);
  return [
    _arr[ Math.round((arrlen) / 4) - 1 ],
    _arr[ Math.round((arrlen) / 2) - 1 ],
    _arr[ Math.round((arrlen) * 3 / 4) - 1 ]
  ];
};


// Arbitary quantiles of an array. Direct port of the scipy.stats
// implementation by Pierre GF Gerard-Marchant.
jStat.quantiles = function quantiles(arr, quantilesArray, alphap, betap) {
  var sortedArray = arr.slice().sort(ascNum);
  var quantileVals = [quantilesArray.length];
  var n = arr.length;
  var i, p, m, aleph, k, gamma;

  if (typeof alphap === 'undefined')
    alphap = 3 / 8;
  if (typeof betap === 'undefined')
    betap = 3 / 8;

  for (var i = 0; i < quantilesArray.length; i++) {
    p = quantilesArray[i];
    m = alphap + p * (1 - alphap - betap);
    aleph = n * p + m;
    k = Math.floor(clip(aleph, 1, n - 1));
    gamma = clip(aleph - k, 0, 1);
    quantileVals[i] = (1 - gamma) * sortedArray[k - 1] + gamma * sortedArray[k];
  }

  return quantileVals;
};

// Returns the k-th percentile of values in a range, where k is in the
// range 0..1, exclusive.
jStat.percentile = function percentile(arr, k) {
  var _arr = arr.slice().sort(ascNum);
  var realIndex = k * (_arr.length - 1);
  var index = parseInt(realIndex);
  var frac = realIndex - index;

  if (index + 1 < _arr.length) {
    return _arr[index] * (1 - frac) + _arr[index + 1] * frac;
  } else {
    return _arr[index];
  }
}


// The percentile rank of score in a given array. Returns the percentage
// of all values in the input array that are less than (kind='strict') or
// less or equal than (kind='weak') score. Default is weak.
jStat.percentileOfScore = function percentileOfScore(arr, score, kind) {
  var counter = 0;
  var len = arr.length;
  var strict = false;
  var value, i;

  if (kind === 'strict')
    strict = true;

  for (var i = 0; i < len; i++) {
    value = arr[i];
    if ((strict && value < score) ||
        (!strict && value <= score)) {
      counter++;
    }
  }

  return counter / len;
};


// Histogram (bin count) data
jStat.histogram = function histogram(arr, bins) {
  var first = jStat.min(arr);
  var binCnt = bins || 4;
  var binWidth = (jStat.max(arr) - first) / binCnt;
  var len = arr.length;
  var bins = [];
  var i;

  for (var i = 0; i < binCnt; i++)
    bins[i] = 0;
  for (var i = 0; i < len; i++)
    bins[Math.min(Math.floor(((arr[i] - first) / binWidth)), binCnt - 1)] += 1;

  return bins;
};


// covariance of two arrays
jStat.covariance = function covariance(arr1, arr2) {
  var u = jStat.mean(arr1);
  var v = jStat.mean(arr2);
  var arr1Len = arr1.length;
  var sq_dev = new Array(arr1Len);
  var i;

  for (var i = 0; i < arr1Len; i++)
    sq_dev[i] = (arr1[i] - u) * (arr2[i] - v);

  return jStat.sum(sq_dev) / (arr1Len - 1);
};


// (pearson's) population correlation coefficient, rho
jStat.corrcoeff = function corrcoeff(arr1, arr2) {
  return jStat.covariance(arr1, arr2) /
      jStat.stdev(arr1, 1) /
      jStat.stdev(arr2, 1);
};

  // (spearman's) rank correlation coefficient, sp
jStat.spearmancoeff =  function (arr1, arr2) {
  arr1 = jStat.rank(arr1);
  arr2 = jStat.rank(arr2);
  //return pearson's correlation of the ranks:
  return jStat.corrcoeff(arr1, arr2);
}


// statistical standardized moments (general form of skew/kurt)
jStat.stanMoment = function stanMoment(arr, n) {
  var mu = jStat.mean(arr);
  var sigma = jStat.stdev(arr);
  var len = arr.length;
  var skewSum = 0;

  for (var i = 0; i < len; i++)
    skewSum += Math.pow((arr[i] - mu) / sigma, n);

  return skewSum / arr.length;
};

// (pearson's) moment coefficient of skewness
jStat.skewness = function skewness(arr) {
  return jStat.stanMoment(arr, 3);
};

// (pearson's) (excess) kurtosis
jStat.kurtosis = function kurtosis(arr) {
  return jStat.stanMoment(arr, 4) - 3;
};


var jProto = jStat.prototype;


// Extend jProto with method for calculating cumulative sums and products.
// This differs from the similar extension below as cumsum and cumprod should
// not be run again in the case fullbool === true.
// If a matrix is passed, automatically assume operation should be done on the
// columns.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    // If a matrix is passed, automatically assume operation should be done on
    // the columns.
    jProto[passfunc] = function(fullbool, func) {
      var arr = [];
      var i = 0;
      var tmpthis = this;
      // Assignment reassignation depending on how parameters were passed in.
      if (isFunction(fullbool)) {
        func = fullbool;
        fullbool = false;
      }
      // Check if a callback was passed with the function.
      if (func) {
        setTimeout(function() {
          func.call(tmpthis, jProto[passfunc].call(tmpthis, fullbool));
        });
        return this;
      }
      // Check if matrix and run calculations.
      if (this.length > 1) {
        tmpthis = fullbool === true ? this : this.transpose();
        for (; i < tmpthis.length; i++)
          arr[i] = jStat[passfunc](tmpthis[i]);
        return arr;
      }
      // Pass fullbool if only vector, not a matrix. for variance and stdev.
      return jStat[passfunc](this[0], fullbool);
    };
  })(funcs[i]);
})(('cumsum cumprod').split(' '));


// Extend jProto with methods which don't require arguments and work on columns.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    // If a matrix is passed, automatically assume operation should be done on
    // the columns.
    jProto[passfunc] = function(fullbool, func) {
      var arr = [];
      var i = 0;
      var tmpthis = this;
      // Assignment reassignation depending on how parameters were passed in.
      if (isFunction(fullbool)) {
        func = fullbool;
        fullbool = false;
      }
      // Check if a callback was passed with the function.
      if (func) {
        setTimeout(function() {
          func.call(tmpthis, jProto[passfunc].call(tmpthis, fullbool));
        });
        return this;
      }
      // Check if matrix and run calculations.
      if (this.length > 1) {
        if (passfunc !== 'sumrow')
          tmpthis = fullbool === true ? this : this.transpose();
        for (; i < tmpthis.length; i++)
          arr[i] = jStat[passfunc](tmpthis[i]);
        return fullbool === true
            ? jStat[passfunc](jStat.utils.toVector(arr))
            : arr;
      }
      // Pass fullbool if only vector, not a matrix. for variance and stdev.
      return jStat[passfunc](this[0], fullbool);
    };
  })(funcs[i]);
})(('sum sumsqrd sumsqerr sumrow product min max unique mean meansqerr ' +
    'geomean median diff rank mode range variance deviation stdev meandev ' +
    'meddev coeffvar quartiles histogram skewness kurtosis').split(' '));


// Extend jProto with functions that take arguments. Operations on matrices are
// done on columns.
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jProto[passfunc] = function() {
      var arr = [];
      var i = 0;
      var tmpthis = this;
      var args = Array.prototype.slice.call(arguments);

      // If the last argument is a function, we assume it's a callback; we
      // strip the callback out and call the function again.
      if (isFunction(args[args.length - 1])) {
        var callbackFunction = args[args.length - 1];
        var argsToPass = args.slice(0, args.length - 1);

        setTimeout(function() {
          callbackFunction.call(tmpthis,
                                jProto[passfunc].apply(tmpthis, argsToPass));
        });
        return this;

      // Otherwise we curry the function args and call normally.
      } else {
        var callbackFunction = undefined;
        var curriedFunction = function curriedFunction(vector) {
          return jStat[passfunc].apply(tmpthis, [vector].concat(args));
        }
      }

      // If this is a matrix, run column-by-column.
      if (this.length > 1) {
        tmpthis = tmpthis.transpose();
        for (; i < tmpthis.length; i++)
          arr[i] = curriedFunction(tmpthis[i]);
        return arr;
      }

      // Otherwise run on the vector.
      return curriedFunction(this[0]);
    };
  })(funcs[i]);
})('quantiles percentileOfScore'.split(' '));

}(jStat, Math));
// Special functions //
(function(jStat, Math) {

// Log-gamma function
jStat.gammaln = function gammaln(x) {
  var j = 0;
  var cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  var ser = 1.000000000190015;
  var xx, y, tmp;
  tmp = (y = xx = x) + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  for (; j < 6; j++)
    ser += cof[j] / ++y;
  return Math.log(2.5066282746310005 * ser / xx) - tmp;
};


// gamma of x
jStat.gammafn = function gammafn(x) {
  var p = [-1.716185138865495, 24.76565080557592, -379.80425647094563,
           629.3311553128184, 866.9662027904133, -31451.272968848367,
           -36144.413418691176, 66456.14382024054
  ];
  var q = [-30.8402300119739, 315.35062697960416, -1015.1563674902192,
           -3107.771671572311, 22538.118420980151, 4755.8462775278811,
           -134659.9598649693, -115132.2596755535];
  var fact = false;
  var n = 0;
  var xden = 0;
  var xnum = 0;
  var y = x;
  var i, z, yi, res, sum, ysq;
  if (y <= 0) {
    res = y % 1 + 3.6e-16;
    if (res) {
      fact = (!(y & 1) ? 1 : -1) * Math.PI / Math.sin(Math.PI * res);
      y = 1 - y;
    } else {
      return Infinity;
    }
  }
  yi = y;
  if (y < 1) {
    z = y++;
  } else {
    z = (y -= n = (y | 0) - 1) - 1;
  }
  for (var i = 0; i < 8; ++i) {
    xnum = (xnum + p[i]) * z;
    xden = xden * z + q[i];
  }
  res = xnum / xden + 1;
  if (yi < y) {
    res /= yi;
  } else if (yi > y) {
    for (var i = 0; i < n; ++i) {
      res *= y;
      y++;
    }
  }
  if (fact) {
    res = fact / res;
  }
  return res;
};


// lower incomplete gamma function, which is usually typeset with a
// lower-case greek gamma as the function symbol
jStat.gammap = function gammap(a, x) {
  return jStat.lowRegGamma(a, x) * jStat.gammafn(a);
};


// The lower regularized incomplete gamma function, usually written P(a,x)
jStat.lowRegGamma = function lowRegGamma(a, x) {
  var aln = jStat.gammaln(a);
  var ap = a;
  var sum = 1 / a;
  var del = sum;
  var b = x + 1 - a;
  var c = 1 / 1.0e-30;
  var d = 1 / b;
  var h = d;
  var i = 1;
  // calculate maximum number of itterations required for a
  var ITMAX = -~(Math.log((a >= 1) ? a : 1 / a) * 8.5 + a * 0.4 + 17);
  var an, endval;

  if (x < 0 || a <= 0) {
    return NaN;
  } else if (x < a + 1) {
    for (; i <= ITMAX; i++) {
      sum += del *= x / ++ap;
    }
    return (sum * Math.exp(-x + a * Math.log(x) - (aln)));
  }

  for (; i <= ITMAX; i++) {
    an = -i * (i - a);
    b += 2;
    d = an * d + b;
    c = b + an / c;
    d = 1 / d;
    h *= d * c;
  }

  return (1 - h * Math.exp(-x + a * Math.log(x) - (aln)));
};

// natural log factorial of n
jStat.factorialln = function factorialln(n) {
  return n < 0 ? NaN : jStat.gammaln(n + 1);
};

// factorial of n
jStat.factorial = function factorial(n) {
  return n < 0 ? NaN : jStat.gammafn(n + 1);
};

// combinations of n, m
jStat.combination = function combination(n, m) {
  // make sure n or m don't exceed the upper limit of usable values
  return (n > 170 || m > 170)
      ? Math.exp(jStat.combinationln(n, m))
      : (jStat.factorial(n) / jStat.factorial(m)) / jStat.factorial(n - m);
};


jStat.combinationln = function combinationln(n, m){
  return jStat.factorialln(n) - jStat.factorialln(m) - jStat.factorialln(n - m);
};


// permutations of n, m
jStat.permutation = function permutation(n, m) {
  return jStat.factorial(n) / jStat.factorial(n - m);
};


// beta function
jStat.betafn = function betafn(x, y) {
  // ensure arguments are positive
  if (x <= 0 || y <= 0)
    return undefined;
  // make sure x + y doesn't exceed the upper limit of usable values
  return (x + y > 170)
      ? Math.exp(jStat.betaln(x, y))
      : jStat.gammafn(x) * jStat.gammafn(y) / jStat.gammafn(x + y);
};


// natural logarithm of beta function
jStat.betaln = function betaln(x, y) {
  return jStat.gammaln(x) + jStat.gammaln(y) - jStat.gammaln(x + y);
};


// Evaluates the continued fraction for incomplete beta function by modified
// Lentz's method.
jStat.betacf = function betacf(x, a, b) {
  var fpmin = 1e-30;
  var m = 1;
  var qab = a + b;
  var qap = a + 1;
  var qam = a - 1;
  var c = 1;
  var d = 1 - qab * x / qap;
  var m2, aa, del, h;

  // These q's will be used in factors that occur in the coefficients
  if (Math.abs(d) < fpmin)
    d = fpmin;
  d = 1 / d;
  h = d;

  for (; m <= 100; m++) {
    m2 = 2 * m;
    aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    // One step (the even one) of the recurrence
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin)
      d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin)
      c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    // Next step of the recurrence (the odd one)
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin)
      d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin)
      c = fpmin;
    d = 1 / d;
    del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < 3e-7)
      break;
  }

  return h;
};


// Returns the inverse of the lower regularized inomplete gamma function
jStat.gammapinv = function gammapinv(p, a) {
  var j = 0;
  var a1 = a - 1;
  var EPS = 1e-8;
  var gln = jStat.gammaln(a);
  var x, err, t, u, pp, lna1, afac;

  if (p >= 1)
    return Math.max(100, a + 100 * Math.sqrt(a));
  if (p <= 0)
    return 0;
  if (a > 1) {
    lna1 = Math.log(a1);
    afac = Math.exp(a1 * (lna1 - 1) - gln);
    pp = (p < 0.5) ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
    if (p < 0.5)
      x = -x;
    x = Math.max(1e-3,
                 a * Math.pow(1 - 1 / (9 * a) - x / (3 * Math.sqrt(a)), 3));
  } else {
    t = 1 - a * (0.253 + a * 0.12);
    if (p < t)
      x = Math.pow(p / t, 1 / a);
    else
      x = 1 - Math.log(1 - (p - t) / (1 - t));
  }

  for(; j < 12; j++) {
    if (x <= 0)
      return 0;
    err = jStat.lowRegGamma(a, x) - p;
    if (a > 1)
      t = afac * Math.exp(-(x - a1) + a1 * (Math.log(x) - lna1));
    else
      t = Math.exp(-x + a1 * Math.log(x) - gln);
    u = err / t;
    x -= (t = u / (1 - 0.5 * Math.min(1, u * ((a - 1) / x - 1))));
    if (x <= 0)
      x = 0.5 * (x + t);
    if (Math.abs(t) < EPS * x)
      break;
  }

  return x;
};


// Returns the error function erf(x)
jStat.erf = function erf(x) {
  var cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
             -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
             4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
             1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
             6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
             -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
             -6.886027e-12, 8.94487e-13, 3.13092e-13,
             -1.12708e-13, 3.81e-16, 7.106e-15,
             -1.523e-15, -9.4e-17, 1.21e-16,
             -2.8e-17];
  var j = cof.length - 1;
  var isneg = false;
  var d = 0;
  var dd = 0;
  var t, ty, tmp, res;

  if (x < 0) {
    x = -x;
    isneg = true;
  }

  t = 2 / (2 + x);
  ty = 4 * t - 2;

  for(; j > 0; j--) {
    tmp = d;
    d = ty * d - dd + cof[j];
    dd = tmp;
  }

  res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
  return isneg ? res - 1 : 1 - res;
};


// Returns the complmentary error function erfc(x)
jStat.erfc = function erfc(x) {
  return 1 - jStat.erf(x);
};


// Returns the inverse of the complementary error function
jStat.erfcinv = function erfcinv(p) {
  var j = 0;
  var x, err, t, pp;
  if (p >= 2)
    return -100;
  if (p <= 0)
    return 100;
  pp = (p < 1) ? p : 2 - p;
  t = Math.sqrt(-2 * Math.log(pp / 2));
  x = -0.70711 * ((2.30753 + t * 0.27061) /
                  (1 + t * (0.99229 + t * 0.04481)) - t);
  for (; j < 2; j++) {
    err = jStat.erfc(x) - pp;
    x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err);
  }
  return (p < 1) ? x : -x;
};


// Returns the inverse of the incomplete beta function
jStat.ibetainv = function ibetainv(p, a, b) {
  var EPS = 1e-8;
  var a1 = a - 1;
  var b1 = b - 1;
  var j = 0;
  var lna, lnb, pp, t, u, err, x, al, h, w, afac;
  if (p <= 0)
    return 0;
  if (p >= 1)
    return 1;
  if (a >= 1 && b >= 1) {
    pp = (p < 0.5) ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));
    x = (2.30753 + t * 0.27061) / (1 + t* (0.99229 + t * 0.04481)) - t;
    if (p < 0.5)
      x = -x;
    al = (x * x - 3) / 6;
    h = 2 / (1 / (2 * a - 1)  + 1 / (2 * b - 1));
    w = (x * Math.sqrt(al + h) / h) - (1 / (2 * b - 1) - 1 / (2 * a - 1)) *
        (al + 5 / 6 - 2 / (3 * h));
    x = a / (a + b * Math.exp(2 * w));
  } else {
    lna = Math.log(a / (a + b));
    lnb = Math.log(b / (a + b));
    t = Math.exp(a * lna) / a;
    u = Math.exp(b * lnb) / b;
    w = t + u;
    if (p < t / w)
      x = Math.pow(a * w * p, 1 / a);
    else
      x = 1 - Math.pow(b * w * (1 - p), 1 / b);
  }
  afac = -jStat.gammaln(a) - jStat.gammaln(b) + jStat.gammaln(a + b);
  for(; j < 10; j++) {
    if (x === 0 || x === 1)
      return x;
    err = jStat.ibeta(x, a, b) - p;
    t = Math.exp(a1 * Math.log(x) + b1 * Math.log(1 - x) + afac);
    u = err / t;
    x -= (t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x)))));
    if (x <= 0)
      x = 0.5 * (x + t);
    if (x >= 1)
      x = 0.5 * (x + t + 1);
    if (Math.abs(t) < EPS * x && j > 0)
      break;
  }
  return x;
};


// Returns the incomplete beta function I_x(a,b)
jStat.ibeta = function ibeta(x, a, b) {
  // Factors in front of the continued fraction.
  var bt = (x === 0 || x === 1) ?  0 :
    Math.exp(jStat.gammaln(a + b) - jStat.gammaln(a) -
             jStat.gammaln(b) + a * Math.log(x) + b *
             Math.log(1 - x));
  if (x < 0 || x > 1)
    return false;
  if (x < (a + 1) / (a + b + 2))
    // Use continued fraction directly.
    return bt * jStat.betacf(x, a, b) / a;
  // else use continued fraction after making the symmetry transformation.
  return 1 - bt * jStat.betacf(1 - x, b, a) / b;
};


// Returns a normal deviate (mu=0, sigma=1).
// If n and m are specified it returns a object of normal deviates.
jStat.randn = function randn(n, m) {
  var u, v, x, y, q, mat;
  if (!m)
    m = n;
  if (n)
    return jStat.create(n, m, function() { return jStat.randn(); });
  do {
    u = Math.random();
    v = 1.7156 * (Math.random() - 0.5);
    x = u - 0.449871;
    y = Math.abs(v) + 0.386595;
    q = x * x + y * (0.19600 * y - 0.25472 * x);
  } while (q > 0.27597 && (q > 0.27846 || v * v > -4 * Math.log(u) * u * u));
  return v / u;
};


// Returns a gamma deviate by the method of Marsaglia and Tsang.
jStat.randg = function randg(shape, n, m) {
  var oalph = shape;
  var a1, a2, u, v, x, mat;
  if (!m)
    m = n;
  if (!shape)
    shape = 1;
  if (n) {
    mat = jStat.zeros(n,m);
    mat.alter(function() { return jStat.randg(shape); });
    return mat;
  }
  if (shape < 1)
    shape += 1;
  a1 = shape - 1 / 3;
  a2 = 1 / Math.sqrt(9 * a1);
  do {
    do {
      x = jStat.randn();
      v = 1 + a2 * x;
    } while(v <= 0);
    v = v * v * v;
    u = Math.random();
  } while(u > 1 - 0.331 * Math.pow(x, 4) &&
          Math.log(u) > 0.5 * x*x + a1 * (1 - v + Math.log(v)));
  // alpha > 1
  if (shape == oalph)
    return a1 * v;
  // alpha < 1
  do {
    u = Math.random();
  } while(u === 0);
  return Math.pow(u, 1 / oalph) * a1 * v;
};


// making use of static methods on the instance
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jStat.fn[passfunc] = function() {
      return jStat(
          jStat.map(this, function(value) { return jStat[passfunc](value); }));
    }
  })(funcs[i]);
})('gammaln gammafn factorial factorialln'.split(' '));


(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jStat.fn[passfunc] = function() {
      return jStat(jStat[passfunc].apply(null, arguments));
    };
  })(funcs[i]);
})('randn'.split(' '));

}(jStat, Math));
(function(jStat, Math) {

// generate all distribution instance methods
(function(list) {
  for (var i = 0; i < list.length; i++) (function(func) {
    // distribution instance method
    jStat[func] = function(a, b, c) {
      if (!(this instanceof arguments.callee))
        return new arguments.callee(a, b, c);
      this._a = a;
      this._b = b;
      this._c = c;
      return this;
    };
    // distribution method to be used on a jStat instance
    jStat.fn[func] = function(a, b, c) {
      var newthis = jStat[func](a, b, c);
      newthis.data = this;
      return newthis;
    };
    // sample instance method
    jStat[func].prototype.sample = function(arr) {
      var a = this._a;
      var b = this._b;
      var c = this._c;
      if (arr)
        return jStat.alter(arr, function() {
          return jStat[func].sample(a, b, c);
        });
      else
        return jStat[func].sample(a, b, c);
    };
    // generate the pdf, cdf and inv instance methods
    (function(vals) {
      for (var i = 0; i < vals.length; i++) (function(fnfunc) {
        jStat[func].prototype[fnfunc] = function(x) {
          var a = this._a;
          var b = this._b;
          var c = this._c;
          if (!x && x !== 0)
            x = this.data;
          if (typeof x !== 'number') {
            return jStat.fn.map.call(x, function(x) {
              return jStat[func][fnfunc](x, a, b, c);
            });
          }
          return jStat[func][fnfunc](x, a, b, c);
        };
      })(vals[i]);
    })('pdf cdf inv'.split(' '));
    // generate the mean, median, mode and variance instance methods
    (function(vals) {
      for (var i = 0; i < vals.length; i++) (function(fnfunc) {
        jStat[func].prototype[fnfunc] = function() {
          return jStat[func][fnfunc](this._a, this._b, this._c);
        };
      })(vals[i]);
    })('mean median mode variance'.split(' '));
  })(list[i]);
})((
  'beta centralF cauchy chisquare exponential gamma invgamma kumaraswamy ' +
  'laplace lognormal noncentralt normal pareto studentt weibull uniform ' +
  'binomial negbin hypgeom poisson triangular tukey arcsine'
).split(' '));



// extend beta function with static methods
jStat.extend(jStat.beta, {
  pdf: function pdf(x, alpha, beta) {
    // PDF is zero outside the support
    if (x > 1 || x < 0)
      return 0;
    // PDF is one for the uniform case
    if (alpha == 1 && beta == 1)
      return 1;

    if (alpha < 512 && beta < 512) {
      return (Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)) /
          jStat.betafn(alpha, beta);
    } else {
      return Math.exp((alpha - 1) * Math.log(x) +
                      (beta - 1) * Math.log(1 - x) -
                      jStat.betaln(alpha, beta));
    }
  },

  cdf: function cdf(x, alpha, beta) {
    return (x > 1 || x < 0) ? (x > 1) * 1 : jStat.ibeta(x, alpha, beta);
  },

  inv: function inv(x, alpha, beta) {
    return jStat.ibetainv(x, alpha, beta);
  },

  mean: function mean(alpha, beta) {
    return alpha / (alpha + beta);
  },

  median: function median(alpha, beta) {
    return jStat.ibetainv(0.5, alpha, beta);
  },

  mode: function mode(alpha, beta) {
    return (alpha - 1 ) / ( alpha + beta - 2);
  },

  // return a random sample
  sample: function sample(alpha, beta) {
    var u = jStat.randg(alpha);
    return u / (u + jStat.randg(beta));
  },

  variance: function variance(alpha, beta) {
    return (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  }
});

// extend F function with static methods
jStat.extend(jStat.centralF, {
  // This implementation of the pdf function avoids float overflow
  // See the way that R calculates this value:
  // https://svn.r-project.org/R/trunk/src/nmath/df.c
  pdf: function pdf(x, df1, df2) {
    var p, q, f;

    if (x < 0)
      return 0;

    if (df1 <= 2) {
      if (x === 0 && df1 < 2) {
        return Infinity;
      }
      if (x === 0 && df1 === 2) {
        return 1;
      }
      return (1 / jStat.betafn(df1 / 2, df2 / 2)) *
              Math.pow(df1 / df2, df1 / 2) *
              Math.pow(x, (df1/2) - 1) *
              Math.pow((1 + (df1 / df2) * x), -(df1 + df2) / 2);
    }

    p = (df1 * x) / (df2 + x * df1);
    q = df2 / (df2 + x * df1);
    f = df1 * q / 2.0;
    return f * jStat.binomial.pdf((df1 - 2) / 2, (df1 + df2 - 2) / 2, p);
  },

  cdf: function cdf(x, df1, df2) {
    if (x < 0)
      return 0;
    return jStat.ibeta((df1 * x) / (df1 * x + df2), df1 / 2, df2 / 2);
  },

  inv: function inv(x, df1, df2) {
    return df2 / (df1 * (1 / jStat.ibetainv(x, df1 / 2, df2 / 2) - 1));
  },

  mean: function mean(df1, df2) {
    return (df2 > 2) ? df2 / (df2 - 2) : undefined;
  },

  mode: function mode(df1, df2) {
    return (df1 > 2) ? (df2 * (df1 - 2)) / (df1 * (df2 + 2)) : undefined;
  },

  // return a random sample
  sample: function sample(df1, df2) {
    var x1 = jStat.randg(df1 / 2) * 2;
    var x2 = jStat.randg(df2 / 2) * 2;
    return (x1 / df1) / (x2 / df2);
  },

  variance: function variance(df1, df2) {
    if (df2 <= 4)
      return undefined;
    return 2 * df2 * df2 * (df1 + df2 - 2) /
        (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4));
  }
});


// extend cauchy function with static methods
jStat.extend(jStat.cauchy, {
  pdf: function pdf(x, local, scale) {
    if (scale < 0) { return 0; }

    return (scale / (Math.pow(x - local, 2) + Math.pow(scale, 2))) / Math.PI;
  },

  cdf: function cdf(x, local, scale) {
    return Math.atan((x - local) / scale) / Math.PI + 0.5;
  },

  inv: function(p, local, scale) {
    return local + scale * Math.tan(Math.PI * (p - 0.5));
  },

  median: function median(local, scale) {
    return local;
  },

  mode: function mode(local, scale) {
    return local;
  },

  sample: function sample(local, scale) {
    return jStat.randn() *
        Math.sqrt(1 / (2 * jStat.randg(0.5))) * scale + local;
  }
});



// extend chisquare function with static methods
jStat.extend(jStat.chisquare, {
  pdf: function pdf(x, dof) {
    if (x < 0)
      return 0;
    return (x === 0 && dof === 2) ? 0.5 :
        Math.exp((dof / 2 - 1) * Math.log(x) - x / 2 - (dof / 2) *
                 Math.log(2) - jStat.gammaln(dof / 2));
  },

  cdf: function cdf(x, dof) {
    if (x < 0)
      return 0;
    return jStat.lowRegGamma(dof / 2, x / 2);
  },

  inv: function(p, dof) {
    return 2 * jStat.gammapinv(p, 0.5 * dof);
  },

  mean : function(dof) {
    return dof;
  },

  // TODO: this is an approximation (is there a better way?)
  median: function median(dof) {
    return dof * Math.pow(1 - (2 / (9 * dof)), 3);
  },

  mode: function mode(dof) {
    return (dof - 2 > 0) ? dof - 2 : 0;
  },

  sample: function sample(dof) {
    return jStat.randg(dof / 2) * 2;
  },

  variance: function variance(dof) {
    return 2 * dof;
  }
});



// extend exponential function with static methods
jStat.extend(jStat.exponential, {
  pdf: function pdf(x, rate) {
    return x < 0 ? 0 : rate * Math.exp(-rate * x);
  },

  cdf: function cdf(x, rate) {
    return x < 0 ? 0 : 1 - Math.exp(-rate * x);
  },

  inv: function(p, rate) {
    return -Math.log(1 - p) / rate;
  },

  mean : function(rate) {
    return 1 / rate;
  },

  median: function (rate) {
    return (1 / rate) * Math.log(2);
  },

  mode: function mode(rate) {
    return 0;
  },

  sample: function sample(rate) {
    return -1 / rate * Math.log(Math.random());
  },

  variance : function(rate) {
    return Math.pow(rate, -2);
  }
});



// extend gamma function with static methods
jStat.extend(jStat.gamma, {
  pdf: function pdf(x, shape, scale) {
    if (x < 0)
      return 0;
    return (x === 0 && shape === 1) ? 1 / scale :
            Math.exp((shape - 1) * Math.log(x) - x / scale -
                    jStat.gammaln(shape) - shape * Math.log(scale));
  },

  cdf: function cdf(x, shape, scale) {
    if (x < 0)
      return 0;
    return jStat.lowRegGamma(shape, x / scale);
  },

  inv: function(p, shape, scale) {
    return jStat.gammapinv(p, shape) * scale;
  },

  mean : function(shape, scale) {
    return shape * scale;
  },

  mode: function mode(shape, scale) {
    if(shape > 1) return (shape - 1) * scale;
    return undefined;
  },

  sample: function sample(shape, scale) {
    return jStat.randg(shape) * scale;
  },

  variance: function variance(shape, scale) {
    return shape * scale * scale;
  }
});

// extend inverse gamma function with static methods
jStat.extend(jStat.invgamma, {
  pdf: function pdf(x, shape, scale) {
    if (x <= 0)
      return 0;
    return Math.exp(-(shape + 1) * Math.log(x) - scale / x -
                    jStat.gammaln(shape) + shape * Math.log(scale));
  },

  cdf: function cdf(x, shape, scale) {
    if (x <= 0)
      return 0;
    return 1 - jStat.lowRegGamma(shape, scale / x);
  },

  inv: function(p, shape, scale) {
    return scale / jStat.gammapinv(1 - p, shape);
  },

  mean : function(shape, scale) {
    return (shape > 1) ? scale / (shape - 1) : undefined;
  },

  mode: function mode(shape, scale) {
    return scale / (shape + 1);
  },

  sample: function sample(shape, scale) {
    return scale / jStat.randg(shape);
  },

  variance: function variance(shape, scale) {
    if (shape <= 2)
      return undefined;
    return scale * scale / ((shape - 1) * (shape - 1) * (shape - 2));
  }
});


// extend kumaraswamy function with static methods
jStat.extend(jStat.kumaraswamy, {
  pdf: function pdf(x, alpha, beta) {
    if (x === 0 && alpha === 1)
      return beta;
    else if (x === 1 && beta === 1)
      return alpha;
    return Math.exp(Math.log(alpha) + Math.log(beta) + (alpha - 1) *
                    Math.log(x) + (beta - 1) *
                    Math.log(1 - Math.pow(x, alpha)));
  },

  cdf: function cdf(x, alpha, beta) {
    if (x < 0)
      return 0;
    else if (x > 1)
      return 1;
    return (1 - Math.pow(1 - Math.pow(x, alpha), beta));
  },

  inv: function inv(p, alpha, beta) {
    return Math.pow(1 - Math.pow(1 - p, 1 / beta), 1 / alpha);
  },

  mean : function(alpha, beta) {
    return (beta * jStat.gammafn(1 + 1 / alpha) *
            jStat.gammafn(beta)) / (jStat.gammafn(1 + 1 / alpha + beta));
  },

  median: function median(alpha, beta) {
    return Math.pow(1 - Math.pow(2, -1 / beta), 1 / alpha);
  },

  mode: function mode(alpha, beta) {
    if (!(alpha >= 1 && beta >= 1 && (alpha !== 1 && beta !== 1)))
      return undefined;
    return Math.pow((alpha - 1) / (alpha * beta - 1), 1 / alpha);
  },

  variance: function variance(alpha, beta) {
    throw new Error('variance not yet implemented');
    // TODO: complete this
  }
});



// extend lognormal function with static methods
jStat.extend(jStat.lognormal, {
  pdf: function pdf(x, mu, sigma) {
    if (x <= 0)
      return 0;
    return Math.exp(-Math.log(x) - 0.5 * Math.log(2 * Math.PI) -
                    Math.log(sigma) - Math.pow(Math.log(x) - mu, 2) /
                    (2 * sigma * sigma));
  },

  cdf: function cdf(x, mu, sigma) {
    if (x < 0)
      return 0;
    return 0.5 +
        (0.5 * jStat.erf((Math.log(x) - mu) / Math.sqrt(2 * sigma * sigma)));
  },

  inv: function(p, mu, sigma) {
    return Math.exp(-1.41421356237309505 * sigma * jStat.erfcinv(2 * p) + mu);
  },

  mean: function mean(mu, sigma) {
    return Math.exp(mu + sigma * sigma / 2);
  },

  median: function median(mu, sigma) {
    return Math.exp(mu);
  },

  mode: function mode(mu, sigma) {
    return Math.exp(mu - sigma * sigma);
  },

  sample: function sample(mu, sigma) {
    return Math.exp(jStat.randn() * sigma + mu);
  },

  variance: function variance(mu, sigma) {
    return (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
  }
});



// extend noncentralt function with static methods
jStat.extend(jStat.noncentralt, {
  pdf: function pdf(x, dof, ncp) {
    var tol = 1e-14;
    if (Math.abs(ncp) < tol)  // ncp approx 0; use student-t
      return jStat.studentt.pdf(x, dof)

    if (Math.abs(x) < tol) {  // different formula for x == 0
      return Math.exp(jStat.gammaln((dof + 1) / 2) - ncp * ncp / 2 -
                      0.5 * Math.log(Math.PI * dof) - jStat.gammaln(dof / 2));
    }

    // formula for x != 0
    return dof / x *
        (jStat.noncentralt.cdf(x * Math.sqrt(1 + 2 / dof), dof+2, ncp) -
         jStat.noncentralt.cdf(x, dof, ncp));
  },

  cdf: function cdf(x, dof, ncp) {
    var tol = 1e-14;
    var min_iterations = 200;

    if (Math.abs(ncp) < tol)  // ncp approx 0; use student-t
      return jStat.studentt.cdf(x, dof);

    // turn negative x into positive and flip result afterwards
    var flip = false;
    if (x < 0) {
      flip = true;
      ncp = -ncp;
    }

    var prob = jStat.normal.cdf(-ncp, 0, 1);
    var value = tol + 1;
    // use value at last two steps to determine convergence
    var lastvalue = value;
    var y = x * x / (x * x + dof);
    var j = 0;
    var p = Math.exp(-ncp * ncp / 2);
    var q = Math.exp(-ncp * ncp / 2 - 0.5 * Math.log(2) -
                     jStat.gammaln(3 / 2)) * ncp;
    while (j < min_iterations || lastvalue > tol || value > tol) {
      lastvalue = value;
      if (j > 0) {
        p *= (ncp * ncp) / (2 * j);
        q *= (ncp * ncp) / (2 * (j + 1 / 2));
      }
      value = p * jStat.beta.cdf(y, j + 0.5, dof / 2) +
          q * jStat.beta.cdf(y, j+1, dof/2);
      prob += 0.5 * value;
      j++;
    }

    return flip ? (1 - prob) : prob;
  }
});


// extend normal function with static methods
jStat.extend(jStat.normal, {
  pdf: function pdf(x, mean, std) {
    return Math.exp(-0.5 * Math.log(2 * Math.PI) -
                    Math.log(std) - Math.pow(x - mean, 2) / (2 * std * std));
  },

  cdf: function cdf(x, mean, std) {
    return 0.5 * (1 + jStat.erf((x - mean) / Math.sqrt(2 * std * std)));
  },

  inv: function(p, mean, std) {
    return -1.41421356237309505 * std * jStat.erfcinv(2 * p) + mean;
  },

  mean : function(mean, std) {
    return mean;
  },

  median: function median(mean, std) {
    return mean;
  },

  mode: function (mean, std) {
    return mean;
  },

  sample: function sample(mean, std) {
    return jStat.randn() * std + mean;
  },

  variance : function(mean, std) {
    return std * std;
  }
});



// extend pareto function with static methods
jStat.extend(jStat.pareto, {
  pdf: function pdf(x, scale, shape) {
    if (x < scale)
      return 0;
    return (shape * Math.pow(scale, shape)) / Math.pow(x, shape + 1);
  },

  cdf: function cdf(x, scale, shape) {
    if (x < scale)
      return 0;
    return 1 - Math.pow(scale / x, shape);
  },

  inv: function inv(p, scale, shape) {
    return scale / Math.pow(1 - p, 1 / shape);
  },

  mean: function mean(scale, shape) {
    if (shape <= 1)
      return undefined;
    return (shape * Math.pow(scale, shape)) / (shape - 1);
  },

  median: function median(scale, shape) {
    return scale * (shape * Math.SQRT2);
  },

  mode: function mode(scale, shape) {
    return scale;
  },

  variance : function(scale, shape) {
    if (shape <= 2)
      return undefined;
    return (scale*scale * shape) / (Math.pow(shape - 1, 2) * (shape - 2));
  }
});



// extend studentt function with static methods
jStat.extend(jStat.studentt, {
  pdf: function pdf(x, dof) {
    dof = dof > 1e100 ? 1e100 : dof;
    return (1/(Math.sqrt(dof) * jStat.betafn(0.5, dof/2))) *
        Math.pow(1 + ((x * x) / dof), -((dof + 1) / 2));
  },

  cdf: function cdf(x, dof) {
    var dof2 = dof / 2;
    return jStat.ibeta((x + Math.sqrt(x * x + dof)) /
                       (2 * Math.sqrt(x * x + dof)), dof2, dof2);
  },

  inv: function(p, dof) {
    var x = jStat.ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5);
    x = Math.sqrt(dof * (1 - x) / x);
    return (p > 0.5) ? x : -x;
  },

  mean: function mean(dof) {
    return (dof > 1) ? 0 : undefined;
  },

  median: function median(dof) {
    return 0;
  },

  mode: function mode(dof) {
    return 0;
  },

  sample: function sample(dof) {
    return jStat.randn() * Math.sqrt(dof / (2 * jStat.randg(dof / 2)));
  },

  variance: function variance(dof) {
    return (dof  > 2) ? dof / (dof - 2) : (dof > 1) ? Infinity : undefined;
  }
});



// extend weibull function with static methods
jStat.extend(jStat.weibull, {
  pdf: function pdf(x, scale, shape) {
    if (x < 0 || scale < 0 || shape < 0)
      return 0;
    return (shape / scale) * Math.pow((x / scale), (shape - 1)) *
        Math.exp(-(Math.pow((x / scale), shape)));
  },

  cdf: function cdf(x, scale, shape) {
    return x < 0 ? 0 : 1 - Math.exp(-Math.pow((x / scale), shape));
  },

  inv: function(p, scale, shape) {
    return scale * Math.pow(-Math.log(1 - p), 1 / shape);
  },

  mean : function(scale, shape) {
    return scale * jStat.gammafn(1 + 1 / shape);
  },

  median: function median(scale, shape) {
    return scale * Math.pow(Math.log(2), 1 / shape);
  },

  mode: function mode(scale, shape) {
    if (shape <= 1)
      return 0;
    return scale * Math.pow((shape - 1) / shape, 1 / shape);
  },

  sample: function sample(scale, shape) {
    return scale * Math.pow(-Math.log(Math.random()), 1 / shape);
  },

  variance: function variance(scale, shape) {
    return scale * scale * jStat.gammafn(1 + 2 / shape) -
        Math.pow(jStat.weibull.mean(scale, shape), 2);
  }
});



// extend uniform function with static methods
jStat.extend(jStat.uniform, {
  pdf: function pdf(x, a, b) {
    return (x < a || x > b) ? 0 : 1 / (b - a);
  },

  cdf: function cdf(x, a, b) {
    if (x < a)
      return 0;
    else if (x < b)
      return (x - a) / (b - a);
    return 1;
  },

  inv: function(p, a, b) {
    return a + (p * (b - a));
  },

  mean: function mean(a, b) {
    return 0.5 * (a + b);
  },

  median: function median(a, b) {
    return jStat.mean(a, b);
  },

  mode: function mode(a, b) {
    throw new Error('mode is not yet implemented');
  },

  sample: function sample(a, b) {
    return (a / 2 + b / 2) + (b / 2 - a / 2) * (2 * Math.random() - 1);
  },

  variance: function variance(a, b) {
    return Math.pow(b - a, 2) / 12;
  }
});



// extend uniform function with static methods
jStat.extend(jStat.binomial, {
  pdf: function pdf(k, n, p) {
    return (p === 0 || p === 1) ?
      ((n * p) === k ? 1 : 0) :
      jStat.combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  },

  cdf: function cdf(x, n, p) {
    var binomarr = [],
    k = 0;
    if (x < 0) {
      return 0;
    }
    if (x < n) {
      for (; k <= x; k++) {
        binomarr[ k ] = jStat.binomial.pdf(k, n, p);
      }
      return jStat.sum(binomarr);
    }
    return 1;
  }
});



// extend uniform function with static methods
jStat.extend(jStat.negbin, {
  pdf: function pdf(k, r, p) {
    if (k !== k >>> 0)
      return false;
    if (k < 0)
      return 0;
    return jStat.combination(k + r - 1, r - 1) *
        Math.pow(1 - p, k) * Math.pow(p, r);
  },

  cdf: function cdf(x, r, p) {
    var sum = 0,
    k = 0;
    if (x < 0) return 0;
    for (; k <= x; k++) {
      sum += jStat.negbin.pdf(k, r, p);
    }
    return sum;
  }
});



// extend uniform function with static methods
jStat.extend(jStat.hypgeom, {
  pdf: function pdf(k, N, m, n) {
    // Hypergeometric PDF.

    // A simplification of the CDF algorithm below.

    // k = number of successes drawn
    // N = population size
    // m = number of successes in population
    // n = number of items drawn from population

    if(k !== k | 0) {
      return false;
    } else if(k < 0 || k < m - (N - n)) {
      // It's impossible to have this few successes drawn.
      return 0;
    } else if(k > n || k > m) {
      // It's impossible to have this many successes drawn.
      return 0;
    } else if (m * 2 > N) {
      // More than half the population is successes.

      if(n * 2 > N) {
        // More than half the population is sampled.

        return jStat.hypgeom.pdf(N - m - n + k, N, N - m, N - n)
      } else {
        // Half or less of the population is sampled.

        return jStat.hypgeom.pdf(n - k, N, N - m, n);
      }

    } else if(n * 2 > N) {
      // Half or less is successes.

      return jStat.hypgeom.pdf(m - k, N, m, N - n);

    } else if(m < n) {
      // We want to have the number of things sampled to be less than the
      // successes available. So swap the definitions of successful and sampled.
      return jStat.hypgeom.pdf(k, N, n, m);
    } else {
      // If we get here, half or less of the population was sampled, half or
      // less of it was successes, and we had fewer sampled things than
      // successes. Now we can do this complicated iterative algorithm in an
      // efficient way.

      // The basic premise of the algorithm is that we partially normalize our
      // intermediate product to keep it in a numerically good region, and then
      // finish the normalization at the end.

      // This variable holds the scaled probability of the current number of
      // successes.
      var scaledPDF = 1;

      // This keeps track of how much we have normalized.
      var samplesDone = 0;

      for(var i = 0; i < k; i++) {
        // For every possible number of successes up to that observed...

        while(scaledPDF > 1 && samplesDone < n) {
          // Intermediate result is growing too big. Apply some of the
          // normalization to shrink everything.

          scaledPDF *= 1 - (m / (N - samplesDone));

          // Say we've normalized by this sample already.
          samplesDone++;
        }

        // Work out the partially-normalized hypergeometric PDF for the next
        // number of successes
        scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1));
      }

      for(; samplesDone < n; samplesDone++) {
        // Apply all the rest of the normalization
        scaledPDF *= 1 - (m / (N - samplesDone));
      }

      // Bound answer sanely before returning.
      return Math.min(1, Math.max(0, scaledPDF));
    }
  },

  cdf: function cdf(x, N, m, n) {
    // Hypergeometric CDF.

    // This algorithm is due to Prof. Thomas S. Ferguson, <tom@math.ucla.edu>,
    // and comes from his hypergeometric test calculator at
    // <http://www.math.ucla.edu/~tom/distributions/Hypergeometric.html>.

    // x = number of successes drawn
    // N = population size
    // m = number of successes in population
    // n = number of items drawn from population

    if(x < 0 || x < m - (N - n)) {
      // It's impossible to have this few successes drawn or fewer.
      return 0;
    } else if(x >= n || x >= m) {
      // We will always have this many successes or fewer.
      return 1;
    } else if (m * 2 > N) {
      // More than half the population is successes.

      if(n * 2 > N) {
        // More than half the population is sampled.

        return jStat.hypgeom.cdf(N - m - n + x, N, N - m, N - n)
      } else {
        // Half or less of the population is sampled.

        return 1 - jStat.hypgeom.cdf(n - x - 1, N, N - m, n);
      }

    } else if(n * 2 > N) {
      // Half or less is successes.

      return 1 - jStat.hypgeom.cdf(m - x - 1, N, m, N - n);

    } else if(m < n) {
      // We want to have the number of things sampled to be less than the
      // successes available. So swap the definitions of successful and sampled.
      return jStat.hypgeom.cdf(x, N, n, m);
    } else {
      // If we get here, half or less of the population was sampled, half or
      // less of it was successes, and we had fewer sampled things than
      // successes. Now we can do this complicated iterative algorithm in an
      // efficient way.

      // The basic premise of the algorithm is that we partially normalize our
      // intermediate sum to keep it in a numerically good region, and then
      // finish the normalization at the end.

      // Holds the intermediate, scaled total CDF.
      var scaledCDF = 1;

      // This variable holds the scaled probability of the current number of
      // successes.
      var scaledPDF = 1;

      // This keeps track of how much we have normalized.
      var samplesDone = 0;

      for(var i = 0; i < x; i++) {
        // For every possible number of successes up to that observed...

        while(scaledCDF > 1 && samplesDone < n) {
          // Intermediate result is growing too big. Apply some of the
          // normalization to shrink everything.

          var factor = 1 - (m / (N - samplesDone));

          scaledPDF *= factor;
          scaledCDF *= factor;

          // Say we've normalized by this sample already.
          samplesDone++;
        }

        // Work out the partially-normalized hypergeometric PDF for the next
        // number of successes
        scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1));

        // Add to the CDF answer.
        scaledCDF += scaledPDF;
      }

      for(; samplesDone < n; samplesDone++) {
        // Apply all the rest of the normalization
        scaledCDF *= 1 - (m / (N - samplesDone));
      }

      // Bound answer sanely before returning.
      return Math.min(1, Math.max(0, scaledCDF));
    }
  }
});



// extend uniform function with static methods
jStat.extend(jStat.poisson, {
  pdf: function pdf(k, l) {
    if (l < 0 || (k % 1) !== 0 || k < 0) {
      return 0;
    }

    return Math.pow(l, k) * Math.exp(-l) / jStat.factorial(k);
  },

  cdf: function cdf(x, l) {
    var sumarr = [],
    k = 0;
    if (x < 0) return 0;
    for (; k <= x; k++) {
      sumarr.push(jStat.poisson.pdf(k, l));
    }
    return jStat.sum(sumarr);
  },

  mean : function(l) {
    return l;
  },

  variance : function(l) {
    return l;
  },

  sample: function sample(l) {
    var p = 1, k = 0, L = Math.exp(-l);
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }
});

// extend triangular function with static methods
jStat.extend(jStat.triangular, {
  pdf: function pdf(x, a, b, c) {
    if (b <= a || c < a || c > b) {
      return NaN;
    } else {
      if (x < a || x > b) {
        return 0;
      } else if (x < c) {
          return (2 * (x - a)) / ((b - a) * (c - a));
      } else if (x === c) {
          return (2 / (b - a));
      } else { // x > c
          return (2 * (b - x)) / ((b - a) * (b - c));
      }
    }
  },

  cdf: function cdf(x, a, b, c) {
    if (b <= a || c < a || c > b)
      return NaN;
    if (x <= a)
      return 0;
    else if (x >= b)
      return 1;
    if (x <= c)
      return Math.pow(x - a, 2) / ((b - a) * (c - a));
    else // x > c
      return 1 - Math.pow(b - x, 2) / ((b - a) * (b - c));
  },

  inv: function inv(p, a, b, c) {
    if (b <= a || c < a || c > b) {
      return NaN;
    } else {
      if (p <= ((c - a) / (b - a))) {
        return a + (b - a) * Math.sqrt(p * ((c - a) / (b - a)));
      } else { // p > ((c - a) / (b - a))
        return a + (b - a) * (1 - Math.sqrt((1 - p) * (1 - ((c - a) / (b - a)))));
      }
    }
  },

  mean: function mean(a, b, c) {
    return (a + b + c) / 3;
  },

  median: function median(a, b, c) {
    if (c <= (a + b) / 2) {
      return b - Math.sqrt((b - a) * (b - c)) / Math.sqrt(2);
    } else if (c > (a + b) / 2) {
      return a + Math.sqrt((b - a) * (c - a)) / Math.sqrt(2);
    }
  },

  mode: function mode(a, b, c) {
    return c;
  },

  sample: function sample(a, b, c) {
    var u = Math.random();
    if (u < ((c - a) / (b - a)))
      return a + Math.sqrt(u * (b - a) * (c - a))
    return b - Math.sqrt((1 - u) * (b - a) * (b - c));
  },

  variance: function variance(a, b, c) {
    return (a * a + b * b + c * c - a * b - a * c - b * c) / 18;
  }
});


// extend arcsine function with static methods
jStat.extend(jStat.arcsine, {
  pdf: function pdf(x, a, b) {
    if (b <= a) return NaN;

    return (x <= a || x >= b) ? 0 :
      (2 / Math.PI) *
        Math.pow(Math.pow(b - a, 2) -
                  Math.pow(2 * x - a - b, 2), -0.5);
  },

  cdf: function cdf(x, a, b) {
    if (x < a)
      return 0;
    else if (x < b)
      return (2 / Math.PI) * Math.asin(Math.sqrt((x - a)/(b - a)));
    return 1;
  },

  inv: function(p, a, b) {
    return a + (0.5 - 0.5 * Math.cos(Math.PI * p)) * (b - a);
  },

  mean: function mean(a, b) {
    if (b <= a) return NaN;
    return (a + b) / 2;
  },

  median: function median(a, b) {
    if (b <= a) return NaN;
    return (a + b) / 2;
  },

  mode: function mode(a, b) {
    throw new Error('mode is not yet implemented');
  },

  sample: function sample(a, b) {
    return ((a + b) / 2) + ((b - a) / 2) *
      Math.sin(2 * Math.PI * jStat.uniform.sample(0, 1));
  },

  variance: function variance(a, b) {
    if (b <= a) return NaN;
    return Math.pow(b - a, 2) / 8;
  }
});


function laplaceSign(x) { return x / Math.abs(x); }

jStat.extend(jStat.laplace, {
  pdf: function pdf(x, mu, b) {
    return (b <= 0) ? 0 : (Math.exp(-Math.abs(x - mu) / b)) / (2 * b);
  },

  cdf: function cdf(x, mu, b) {
    if (b <= 0) { return 0; }

    if(x < mu) {
      return 0.5 * Math.exp((x - mu) / b);
    } else {
      return 1 - 0.5 * Math.exp(- (x - mu) / b);
    }
  },

  mean: function(mu, b) {
    return mu;
  },

  median: function(mu, b) {
    return mu;
  },

  mode: function(mu, b) {
    return mu;
  },

  variance: function(mu, b) {
    return 2 * b * b;
  },

  sample: function sample(mu, b) {
    var u = Math.random() - 0.5;

    return mu - (b * laplaceSign(u) * Math.log(1 - (2 * Math.abs(u))));
  }
});

function tukeyWprob(w, rr, cc) {
  var nleg = 12;
  var ihalf = 6;

  var C1 = -30;
  var C2 = -50;
  var C3 = 60;
  var bb   = 8;
  var wlar = 3;
  var wincr1 = 2;
  var wincr2 = 3;
  var xleg = [
    0.981560634246719250690549090149,
    0.904117256370474856678465866119,
    0.769902674194304687036893833213,
    0.587317954286617447296702418941,
    0.367831498998180193752691536644,
    0.125233408511468915472441369464
  ];
  var aleg = [
    0.047175336386511827194615961485,
    0.106939325995318430960254718194,
    0.160078328543346226334652529543,
    0.203167426723065921749064455810,
    0.233492536538354808760849898925,
    0.249147045813402785000562436043
  ];

  var qsqz = w * 0.5;

  // if w >= 16 then the integral lower bound (occurs for c=20)
  // is 0.99999999999995 so return a value of 1.

  if (qsqz >= bb)
    return 1.0;

  // find (f(w/2) - 1) ^ cc
  // (first term in integral of hartley's form).

  var pr_w = 2 * jStat.normal.cdf(qsqz, 0, 1, 1, 0) - 1; // erf(qsqz / M_SQRT2)
  // if pr_w ^ cc < 2e-22 then set pr_w = 0
  if (pr_w >= Math.exp(C2 / cc))
    pr_w = Math.pow(pr_w, cc);
  else
    pr_w = 0.0;

  // if w is large then the second component of the
  // integral is small, so fewer intervals are needed.

  var wincr;
  if (w > wlar)
    wincr = wincr1;
  else
    wincr = wincr2;

  // find the integral of second term of hartley's form
  // for the integral of the range for equal-length
  // intervals using legendre quadrature.  limits of
  // integration are from (w/2, 8).  two or three
  // equal-length intervals are used.

  // blb and bub are lower and upper limits of integration.

  var blb = qsqz;
  var binc = (bb - qsqz) / wincr;
  var bub = blb + binc;
  var einsum = 0.0;

  // integrate over each interval

  var cc1 = cc - 1.0;
  for (var wi = 1; wi <= wincr; wi++) {
    var elsum = 0.0;
    var a = 0.5 * (bub + blb);

    // legendre quadrature with order = nleg

    var b = 0.5 * (bub - blb);

    for (var jj = 1; jj <= nleg; jj++) {
      var j, xx;
      if (ihalf < jj) {
        j = (nleg - jj) + 1;
        xx = xleg[j-1];
      } else {
        j = jj;
        xx = -xleg[j-1];
      }
      var c = b * xx;
      var ac = a + c;

      // if exp(-qexpo/2) < 9e-14,
      // then doesn't contribute to integral

      var qexpo = ac * ac;
      if (qexpo > C3)
        break;

      var pplus = 2 * jStat.normal.cdf(ac, 0, 1, 1, 0);
      var pminus= 2 * jStat.normal.cdf(ac, w, 1, 1, 0);

      // if rinsum ^ (cc-1) < 9e-14,
      // then doesn't contribute to integral

      var rinsum = (pplus * 0.5) - (pminus * 0.5);
      if (rinsum >= Math.exp(C1 / cc1)) {
        rinsum = (aleg[j-1] * Math.exp(-(0.5 * qexpo))) * Math.pow(rinsum, cc1);
        elsum += rinsum;
      }
    }
    elsum *= (((2.0 * b) * cc) / Math.sqrt(2 * Math.PI));
    einsum += elsum;
    blb = bub;
    bub += binc;
  }

  // if pr_w ^ rr < 9e-14, then return 0
  pr_w += einsum;
  if (pr_w <= Math.exp(C1 / rr))
    return 0;

  pr_w = Math.pow(pr_w, rr);
  if (pr_w >= 1) // 1 was iMax was eps
    return 1;
  return pr_w;
}

function tukeyQinv(p, c, v) {
  var p0 = 0.322232421088;
  var q0 = 0.993484626060e-01;
  var p1 = -1.0;
  var q1 = 0.588581570495;
  var p2 = -0.342242088547;
  var q2 = 0.531103462366;
  var p3 = -0.204231210125;
  var q3 = 0.103537752850;
  var p4 = -0.453642210148e-04;
  var q4 = 0.38560700634e-02;
  var c1 = 0.8832;
  var c2 = 0.2368;
  var c3 = 1.214;
  var c4 = 1.208;
  var c5 = 1.4142;
  var vmax = 120.0;

  var ps = 0.5 - 0.5 * p;
  var yi = Math.sqrt(Math.log(1.0 / (ps * ps)));
  var t = yi + (((( yi * p4 + p3) * yi + p2) * yi + p1) * yi + p0)
     / (((( yi * q4 + q3) * yi + q2) * yi + q1) * yi + q0);
  if (v < vmax) t += (t * t * t + t) / v / 4.0;
  var q = c1 - c2 * t;
  if (v < vmax) q += -c3 / v + c4 * t / v;
  return t * (q * Math.log(c - 1.0) + c5);
}

jStat.extend(jStat.tukey, {
  cdf: function cdf(q, nmeans, df) {
    // Identical implementation as the R ptukey() function as of commit 68947
    var rr = 1;
    var cc = nmeans;

    var nlegq = 16;
    var ihalfq = 8;

    var eps1 = -30.0;
    var eps2 = 1.0e-14;
    var dhaf  = 100.0;
    var dquar = 800.0;
    var deigh = 5000.0;
    var dlarg = 25000.0;
    var ulen1 = 1.0;
    var ulen2 = 0.5;
    var ulen3 = 0.25;
    var ulen4 = 0.125;
    var xlegq = [
      0.989400934991649932596154173450,
      0.944575023073232576077988415535,
      0.865631202387831743880467897712,
      0.755404408355003033895101194847,
      0.617876244402643748446671764049,
      0.458016777657227386342419442984,
      0.281603550779258913230460501460,
      0.950125098376374401853193354250e-1
    ];
    var alegq = [
      0.271524594117540948517805724560e-1,
      0.622535239386478928628438369944e-1,
      0.951585116824927848099251076022e-1,
      0.124628971255533872052476282192,
      0.149595988816576732081501730547,
      0.169156519395002538189312079030,
      0.182603415044923588866763667969,
      0.189450610455068496285396723208
    ];

    if (q <= 0)
      return 0;

    // df must be > 1
    // there must be at least two values

    if (df < 2 || rr < 1 || cc < 2) return NaN;

    if (!Number.isFinite(q))
      return 1;

    if (df > dlarg)
      return tukeyWprob(q, rr, cc);

    // calculate leading constant

    var f2 = df * 0.5;
    var f2lf = ((f2 * Math.log(df)) - (df * Math.log(2))) - jStat.gammaln(f2);
    var f21 = f2 - 1.0;

    // integral is divided into unit, half-unit, quarter-unit, or
    // eighth-unit length intervals depending on the value of the
    // degrees of freedom.

    var ff4 = df * 0.25;
    var ulen;
    if      (df <= dhaf)  ulen = ulen1;
    else if (df <= dquar) ulen = ulen2;
    else if (df <= deigh) ulen = ulen3;
    else                  ulen = ulen4;

    f2lf += Math.log(ulen);

    // integrate over each subinterval

    var ans = 0.0;

    for (var i = 1; i <= 50; i++) {
      var otsum = 0.0;

      // legendre quadrature with order = nlegq
      // nodes (stored in xlegq) are symmetric around zero.

      var twa1 = (2 * i - 1) * ulen;

      for (var jj = 1; jj <= nlegq; jj++) {
        var j, t1;
        if (ihalfq < jj) {
          j = jj - ihalfq - 1;
          t1 = (f2lf + (f21 * Math.log(twa1 + (xlegq[j] * ulen))))
              - (((xlegq[j] * ulen) + twa1) * ff4);
        } else {
          j = jj - 1;
          t1 = (f2lf + (f21 * Math.log(twa1 - (xlegq[j] * ulen))))
              + (((xlegq[j] * ulen) - twa1) * ff4);
        }

        // if exp(t1) < 9e-14, then doesn't contribute to integral
        var qsqz;
        if (t1 >= eps1) {
          if (ihalfq < jj) {
            qsqz = q * Math.sqrt(((xlegq[j] * ulen) + twa1) * 0.5);
          } else {
            qsqz = q * Math.sqrt(((-(xlegq[j] * ulen)) + twa1) * 0.5);
          }

          // call wprob to find integral of range portion

          var wprb = tukeyWprob(qsqz, rr, cc);
          var rotsum = (wprb * alegq[j]) * Math.exp(t1);
          otsum += rotsum;
        }
        // end legendre integral for interval i
        // L200:
      }

      // if integral for interval i < 1e-14, then stop.
      // However, in order to avoid small area under left tail,
      // at least  1 / ulen  intervals are calculated.
      if (i * ulen >= 1.0 && otsum <= eps2)
        break;

      // end of interval i
      // L330:

      ans += otsum;
    }

    if (otsum > eps2) { // not converged
      throw new Error('tukey.cdf failed to converge');
    }
    if (ans > 1)
      ans = 1;
    return ans;
  },

  inv: function(p, nmeans, df) {
    // Identical implementation as the R qtukey() function as of commit 68947
    var rr = 1;
    var cc = nmeans;

    var eps = 0.0001;
    var maxiter = 50;

    // df must be > 1 ; there must be at least two values
    if (df < 2 || rr < 1 || cc < 2) return NaN;

    if (p < 0 || p > 1) return NaN;
    if (p === 0) return 0;
    if (p === 1) return Infinity;

    // Initial value

    var x0 = tukeyQinv(p, cc, df);

    // Find prob(value < x0)

    var valx0 = jStat.tukey.cdf(x0, nmeans, df) - p;

    // Find the second iterate and prob(value < x1).
    // If the first iterate has probability value
    // exceeding p then second iterate is 1 less than
    // first iterate; otherwise it is 1 greater.

    var x1;
    if (valx0 > 0.0)
      x1 = Math.max(0.0, x0 - 1.0);
    else
      x1 = x0 + 1.0;
    var valx1 = jStat.tukey.cdf(x1, nmeans, df) - p;

    // Find new iterate

    var ans;
    for(var iter = 1; iter < maxiter; iter++) {
      ans = x1 - ((valx1 * (x1 - x0)) / (valx1 - valx0));
      valx0 = valx1;

      // New iterate must be >= 0

      x0 = x1;
      if (ans < 0.0) {
        ans = 0.0;
        valx1 = -p;
      }
      // Find prob(value < new iterate)

      valx1 = jStat.tukey.cdf(ans, nmeans, df) - p;
      x1 = ans;

      // If the difference between two successive
      // iterates is less than eps, stop

      var xabs = Math.abs(x1 - x0);
      if (xabs < eps)
        return ans;
    }

    throw new Error('tukey.inv failed to converge');
  }
});

}(jStat, Math));
/* Provides functions for the solution of linear system of equations, integration, extrapolation,
 * interpolation, eigenvalue problems, differential equations and PCA analysis. */

(function(jStat, Math) {

var push = Array.prototype.push;
var isArray = jStat.utils.isArray;

function isUsable(arg) {
  return isArray(arg) || arg instanceof jStat;
}

jStat.extend({

  // add a vector/matrix to a vector/matrix or scalar
  add: function add(arr, arg) {
    // check if arg is a vector or scalar
    if (isUsable(arg)) {
      if (!isUsable(arg[0])) arg = [ arg ];
      return jStat.map(arr, function(value, row, col) {
        return value + arg[row][col];
      });
    }
    return jStat.map(arr, function(value) { return value + arg; });
  },

  // subtract a vector or scalar from the vector
  subtract: function subtract(arr, arg) {
    // check if arg is a vector or scalar
    if (isUsable(arg)) {
      if (!isUsable(arg[0])) arg = [ arg ];
      return jStat.map(arr, function(value, row, col) {
        return value - arg[row][col] || 0;
      });
    }
    return jStat.map(arr, function(value) { return value - arg; });
  },

  // matrix division
  divide: function divide(arr, arg) {
    if (isUsable(arg)) {
      if (!isUsable(arg[0])) arg = [ arg ];
      return jStat.multiply(arr, jStat.inv(arg));
    }
    return jStat.map(arr, function(value) { return value / arg; });
  },

  // matrix multiplication
  multiply: function multiply(arr, arg) {
    var row, col, nrescols, sum, nrow, ncol, res, rescols;
    // eg: arr = 2 arg = 3 -> 6 for res[0][0] statement closure
    if (arr.length === undefined && arg.length === undefined) {
      return arr * arg;
    }
    nrow = arr.length,
    ncol = arr[0].length,
    res = jStat.zeros(nrow, nrescols = (isUsable(arg)) ? arg[0].length : ncol),
    rescols = 0;
    if (isUsable(arg)) {
      for (; rescols < nrescols; rescols++) {
        for (row = 0; row < nrow; row++) {
          sum = 0;
          for (col = 0; col < ncol; col++)
          sum += arr[row][col] * arg[col][rescols];
          res[row][rescols] = sum;
        }
      }
      return (nrow === 1 && rescols === 1) ? res[0][0] : res;
    }
    return jStat.map(arr, function(value) { return value * arg; });
  },

  // outer([1,2,3],[4,5,6])
  // ===
  // [[1],[2],[3]] times [[4,5,6]]
  // ->
  // [[4,5,6],[8,10,12],[12,15,18]]
  outer:function outer(A, B) {
    return jStat.multiply(A.map(function(t){ return [t] }), [B]);
  },


  // Returns the dot product of two matricies
  dot: function dot(arr, arg) {
    if (!isUsable(arr[0])) arr = [ arr ];
    if (!isUsable(arg[0])) arg = [ arg ];
    // convert column to row vector
    var left = (arr[0].length === 1 && arr.length !== 1) ? jStat.transpose(arr) : arr,
    right = (arg[0].length === 1 && arg.length !== 1) ? jStat.transpose(arg) : arg,
    res = [],
    row = 0,
    nrow = left.length,
    ncol = left[0].length,
    sum, col;
    for (; row < nrow; row++) {
      res[row] = [];
      sum = 0;
      for (col = 0; col < ncol; col++)
      sum += left[row][col] * right[row][col];
      res[row] = sum;
    }
    return (res.length === 1) ? res[0] : res;
  },

  // raise every element by a scalar
  pow: function pow(arr, arg) {
    return jStat.map(arr, function(value) { return Math.pow(value, arg); });
  },

  // exponentiate every element
  exp: function exp(arr) {
    return jStat.map(arr, function(value) { return Math.exp(value); });
  },

  // generate the natural log of every element
  log: function exp(arr) {
    return jStat.map(arr, function(value) { return Math.log(value); });
  },

  // generate the absolute values of the vector
  abs: function abs(arr) {
    return jStat.map(arr, function(value) { return Math.abs(value); });
  },

  // computes the p-norm of the vector
  // In the case that a matrix is passed, uses the first row as the vector
  norm: function norm(arr, p) {
    var nnorm = 0,
    i = 0;
    // check the p-value of the norm, and set for most common case
    if (isNaN(p)) p = 2;
    // check if multi-dimensional array, and make vector correction
    if (isUsable(arr[0])) arr = arr[0];
    // vector norm
    for (; i < arr.length; i++) {
      nnorm += Math.pow(Math.abs(arr[i]), p);
    }
    return Math.pow(nnorm, 1 / p);
  },

  // computes the angle between two vectors in rads
  // In case a matrix is passed, this uses the first row as the vector
  angle: function angle(arr, arg) {
    return Math.acos(jStat.dot(arr, arg) / (jStat.norm(arr) * jStat.norm(arg)));
  },

  // augment one matrix by another
  // Note: this function returns a matrix, not a jStat object
  aug: function aug(a, b) {
    var newarr = [];
    for (var i = 0; i < a.length; i++) {
      newarr.push(a[i].slice());
    }
    for (var i = 0; i < newarr.length; i++) {
      push.apply(newarr[i], b[i]);
    }
    return newarr;
  },

  // The inv() function calculates the inverse of a matrix
  // Create the inverse by augmenting the matrix by the identity matrix of the
  // appropriate size, and then use G-J elimination on the augmented matrix.
  inv: function inv(a) {
    var rows = a.length;
    var cols = a[0].length;
    var b = jStat.identity(rows, cols);
    var c = jStat.gauss_jordan(a, b);
    var result = [];
    var i = 0;
    var j;

    //We need to copy the inverse portion to a new matrix to rid G-J artifacts
    for (; i < rows; i++) {
      result[i] = [];
      for (j = cols; j < c[0].length; j++)
        result[i][j - cols] = c[i][j];
    }
    return result;
  },

  // calculate the determinant of a matrix
  det: function det(a) {
    var alen = a.length,
    alend = alen * 2,
    vals = new Array(alend),
    rowshift = alen - 1,
    colshift = alend - 1,
    mrow = rowshift - alen + 1,
    mcol = colshift,
    i = 0,
    result = 0,
    j;
    // check for special 2x2 case
    if (alen === 2) {
      return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    }
    for (; i < alend; i++) {
      vals[i] = 1;
    }
    for (var i = 0; i < alen; i++) {
      for (j = 0; j < alen; j++) {
        vals[(mrow < 0) ? mrow + alen : mrow ] *= a[i][j];
        vals[(mcol < alen) ? mcol + alen : mcol ] *= a[i][j];
        mrow++;
        mcol--;
      }
      mrow = --rowshift - alen + 1;
      mcol = --colshift;
    }
    for (var i = 0; i < alen; i++) {
      result += vals[i];
    }
    for (; i < alend; i++) {
      result -= vals[i];
    }
    return result;
  },

  gauss_elimination: function gauss_elimination(a, b) {
    var i = 0,
    j = 0,
    n = a.length,
    m = a[0].length,
    factor = 1,
    sum = 0,
    x = [],
    maug, pivot, temp, k;
    a = jStat.aug(a, b);
    maug = a[0].length;
    for(var i = 0; i < n; i++) {
      pivot = a[i][i];
      j = i;
      for (k = i + 1; k < m; k++) {
        if (pivot < Math.abs(a[k][i])) {
          pivot = a[k][i];
          j = k;
        }
      }
      if (j != i) {
        for(k = 0; k < maug; k++) {
          temp = a[i][k];
          a[i][k] = a[j][k];
          a[j][k] = temp;
        }
      }
      for (j = i + 1; j < n; j++) {
        factor = a[j][i] / a[i][i];
        for(k = i; k < maug; k++) {
          a[j][k] = a[j][k] - factor * a[i][k];
        }
      }
    }
    for (var i = n - 1; i >= 0; i--) {
      sum = 0;
      for (j = i + 1; j<= n - 1; j++) {
        sum = sum + x[j] * a[i][j];
      }
      x[i] =(a[i][maug - 1] - sum) / a[i][i];
    }
    return x;
  },

  gauss_jordan: function gauss_jordan(a, b) {
    var m = jStat.aug(a, b),
    h = m.length,
    w = m[0].length;
    var c = 0;
    // find max pivot
    for (var y = 0; y < h; y++) {
      var maxrow = y;
      for (var y2 = y+1; y2 < h; y2++) {
        if (Math.abs(m[y2][y]) > Math.abs(m[maxrow][y]))
          maxrow = y2;
      }
      var tmp = m[y];
      m[y] = m[maxrow];
      m[maxrow] = tmp
      for (var y2 = y+1; y2 < h; y2++) {
        c = m[y2][y] / m[y][y];
        for (var x = y; x < w; x++) {
          m[y2][x] -= m[y][x] * c;
        }
      }
    }
    // backsubstitute
    for (var y = h-1; y >= 0; y--) {
      c = m[y][y];
      for (var y2 = 0; y2 < y; y2++) {
        for (var x = w-1; x > y-1; x--) {
          m[y2][x] -= m[y][x] * m[y2][y] / c;
        }
      }
      m[y][y] /= c;
      for (var x = h; x < w; x++) {
        m[y][x] /= c;
      }
    }
    return m;
  },

  // solve equation
  // Ax=b
  // A is upper triangular matrix
  // A=[[1,2,3],[0,4,5],[0,6,7]]
  // b=[1,2,3]
  // triaUpSolve(A,b) // -> [2.666,0.1666,1.666]
  // if you use matrix style
  // A=[[1,2,3],[0,4,5],[0,6,7]]
  // b=[[1],[2],[3]]
  // will return [[2.666],[0.1666],[1.666]]
  triaUpSolve: function triaUpSolve(A, b) {
    var size = A[0].length;
    var x = jStat.zeros(1, size)[0];
    var parts;
    var matrix_mode = false;

    if (b[0].length != undefined) {
      b = b.map(function(i){ return i[0] });
      matrix_mode = true;
    }

    jStat.arange(size - 1, -1, -1).forEach(function(i) {
      parts = jStat.arange(i + 1, size).map(function(j) {
        return x[j] * A[i][j];
      });
      x[i] = (b[i] - jStat.sum(parts)) / A[i][i];
    });

    if (matrix_mode)
      return x.map(function(i){ return [i] });
    return x;
  },

  triaLowSolve: function triaLowSolve(A, b) {
    // like to triaUpSolve but A is lower triangular matrix
    var size = A[0].length;
    var x = jStat.zeros(1, size)[0];
    var parts;

    var matrix_mode=false;
    if (b[0].length != undefined) {
      b = b.map(function(i){ return i[0] });
      matrix_mode = true;
    }

    jStat.arange(size).forEach(function(i) {
      parts = jStat.arange(i).map(function(j) {
        return A[i][j] * x[j];
      });
      x[i] = (b[i] - jStat.sum(parts)) / A[i][i];
    })

    if (matrix_mode)
      return x.map(function(i){ return [i] });
    return x;
  },


  // A -> [L,U]
  // A=LU
  // L is lower triangular matrix
  // U is upper triangular matrix
  lu: function lu(A) {
    var size = A.length;
    //var L=jStat.diagonal(jStat.ones(1,size)[0]);
    var L = jStat.identity(size);
    var R = jStat.zeros(A.length, A[0].length);
    var parts;
    jStat.arange(size).forEach(function(t) {
      R[0][t] = A[0][t];
    });
    jStat.arange(1, size).forEach(function(l) {
      jStat.arange(l).forEach(function(i) {
        parts = jStat.arange(i).map(function(jj) {
          return L[l][jj] * R[jj][i];
        });
        L[l][i] = (A[l][i] - jStat.sum(parts)) / R[i][i];
      });
      jStat.arange(l, size).forEach(function(j) {
        parts = jStat.arange(l).map(function(jj) {
          return L[l][jj] * R[jj][j];
        });
        R[l][j] = A[i][j] - jStat.sum(parts);
      });
    });
    return [L, R];
  },

  // A -> T
  // A=TT'
  // T is lower triangular matrix
  cholesky: function cholesky(A) {
    var size = A.length;
    var T = jStat.zeros(A.length, A[0].length);
    var parts;
    jStat.arange(size).forEach(function(i) {
      parts = jStat.arange(i).map(function(t) {
        return Math.pow(T[i][t],2);
      });
      T[i][i] = Math.sqrt(A[i][i] - jStat.sum(parts));
      jStat.arange(i + 1, size).forEach(function(j) {
        parts = jStat.arange(i).map(function(t) {
          return T[i][t] * T[j][t];
        });
        T[j][i] = (A[i][j] - jStat.sum(parts)) / T[i][i];
      });
    });
    return T;
  },


  gauss_jacobi: function gauss_jacobi(a, b, x, r) {
    var i = 0;
    var j = 0;
    var n = a.length;
    var l = [];
    var u = [];
    var d = [];
    var xv, c, h, xk;
    for (; i < n; i++) {
      l[i] = [];
      u[i] = [];
      d[i] = [];
      for (j = 0; j < n; j++) {
        if (i > j) {
          l[i][j] = a[i][j];
          u[i][j] = d[i][j] = 0;
        } else if (i < j) {
          u[i][j] = a[i][j];
          l[i][j] = d[i][j] = 0;
        } else {
          d[i][j] = a[i][j];
          l[i][j] = u[i][j] = 0;
        }
      }
    }
    h = jStat.multiply(jStat.multiply(jStat.inv(d), jStat.add(l, u)), -1);
    c = jStat.multiply(jStat.inv(d), b);
    xv = x;
    xk = jStat.add(jStat.multiply(h, x), c);
    i = 2;
    while (Math.abs(jStat.norm(jStat.subtract(xk,xv))) > r) {
      xv = xk;
      xk = jStat.add(jStat.multiply(h, xv), c);
      i++;
    }
    return xk;
  },

  gauss_seidel: function gauss_seidel(a, b, x, r) {
    var i = 0;
    var n = a.length;
    var l = [];
    var u = [];
    var d = [];
    var j, xv, c, h, xk;
    for (; i < n; i++) {
      l[i] = [];
      u[i] = [];
      d[i] = [];
      for (j = 0; j < n; j++) {
        if (i > j) {
          l[i][j] = a[i][j];
          u[i][j] = d[i][j] = 0;
        } else if (i < j) {
          u[i][j] = a[i][j];
          l[i][j] = d[i][j] = 0;
        } else {
          d[i][j] = a[i][j];
          l[i][j] = u[i][j] = 0;
        }
      }
    }
    h = jStat.multiply(jStat.multiply(jStat.inv(jStat.add(d, l)), u), -1);
    c = jStat.multiply(jStat.inv(jStat.add(d, l)), b);
    xv = x;
    xk = jStat.add(jStat.multiply(h, x), c);
    i = 2;
    while (Math.abs(jStat.norm(jStat.subtract(xk, xv))) > r) {
      xv = xk;
      xk = jStat.add(jStat.multiply(h, xv), c);
      i = i + 1;
    }
    return xk;
  },

  SOR: function SOR(a, b, x, r, w) {
    var i = 0;
    var n = a.length;
    var l = [];
    var u = [];
    var d = [];
    var j, xv, c, h, xk;
    for (; i < n; i++) {
      l[i] = [];
      u[i] = [];
      d[i] = [];
      for (j = 0; j < n; j++) {
        if (i > j) {
          l[i][j] = a[i][j];
          u[i][j] = d[i][j] = 0;
        } else if (i < j) {
          u[i][j] = a[i][j];
          l[i][j] = d[i][j] = 0;
        } else {
          d[i][j] = a[i][j];
          l[i][j] = u[i][j] = 0;
        }
      }
    }
    h = jStat.multiply(jStat.inv(jStat.add(d, jStat.multiply(l, w))),
                       jStat.subtract(jStat.multiply(d, 1 - w),
                                      jStat.multiply(u, w)));
    c = jStat.multiply(jStat.multiply(jStat.inv(jStat.add(d,
        jStat.multiply(l, w))), b), w);
    xv = x;
    xk = jStat.add(jStat.multiply(h, x), c);
    i = 2;
    while (Math.abs(jStat.norm(jStat.subtract(xk, xv))) > r) {
      xv = xk;
      xk = jStat.add(jStat.multiply(h, xv), c);
      i++;
    }
    return xk;
  },

  householder: function householder(a) {
    var m = a.length;
    var n = a[0].length;
    var i = 0;
    var w = [];
    var p = [];
    var alpha, r, k, j, factor;
    for (; i < m - 1; i++) {
      alpha = 0;
      for (j = i + 1; j < n; j++)
      alpha += (a[j][i] * a[j][i]);
      factor = (a[i + 1][i] > 0) ? -1 : 1;
      alpha = factor * Math.sqrt(alpha);
      r = Math.sqrt((((alpha * alpha) - a[i + 1][i] * alpha) / 2));
      w = jStat.zeros(m, 1);
      w[i + 1][0] = (a[i + 1][i] - alpha) / (2 * r);
      for (k = i + 2; k < m; k++) w[k][0] = a[k][i] / (2 * r);
      p = jStat.subtract(jStat.identity(m, n),
          jStat.multiply(jStat.multiply(w, jStat.transpose(w)), 2));
      a = jStat.multiply(p, jStat.multiply(a, p));
    }
    return a;
  },

  // A -> [Q,R]
  // Q is orthogonal matrix
  // R is upper triangular
  QR: (function() {
    // x -> Q
    // find a orthogonal matrix Q st.
    // Qx=y
    // y is [||x||,0,0,...]

    // quick ref
    var sum   = jStat.sum;
    var range = jStat.arange;

    function get_Q1(x) {
      var size = x.length;
      var norm_x = jStat.norm(x, 2);
      var e1 = jStat.zeros(1, size)[0];
      e1[0] = 1;
      var u = jStat.add(jStat.multiply(jStat.multiply(e1, norm_x), -1), x);
      var norm_u = jStat.norm(u, 2);
      var v = jStat.divide(u, norm_u);
      var Q = jStat.subtract(jStat.identity(size),
                             jStat.multiply(jStat.outer(v, v), 2));
      return Q;
    }

    function qr(A) {
      var size = A[0].length;
      var QList = [];
      jStat.arange(size).forEach(function(i) {
        var x = jStat.slice(A, { row: { start: i }, col: i });
        var Q = get_Q1(x);
        var Qn = jStat.identity(A.length);
        Qn = jStat.sliceAssign(Qn, { row: { start: i }, col: { start: i }}, Q);
        A = jStat.multiply(Qn, A);
        QList.push(Qn);
      });
      var Q = QList.reduce(function(x, y){ return jStat.multiply(x,y) });
      var R = A;
      return [Q, R];
    }

    function qr2(x) {
      // quick impletation
      // https://www.stat.wisc.edu/~larget/math496/qr.html

      var n = x.length;
      var p = x[0].length;

      x = jStat.copy(x);
      r = jStat.zeros(p, p);

      var i,j,k;
      for(j = 0; j < p; j++){
        r[j][j] = Math.sqrt(sum(range(n).map(function(i){
          return x[i][j] * x[i][j];
        })));
        for(i = 0; i < n; i++){
          x[i][j] = x[i][j] / r[j][j];
        }
        for(k = j+1; k < p; k++){
          r[j][k] = sum(range(n).map(function(i){
            return x[i][j] * x[i][k];
          }));
          for(i = 0; i < n; i++){
            x[i][k] = x[i][k] - x[i][j]*r[j][k];
          }
        }
      }
      return [x, r];
    }

    return qr2;
  }()),

  lstsq: (function(A, b) {
    // solve least squard problem for Ax=b as QR decomposition way if b is
    // [[b1],[b2],[b3]] form will return [[x1],[x2],[x3]] array form solution
    // else b is [b1,b2,b3] form will return [x1,x2,x3] array form solution
    function R_I(A) {
      A = jStat.copy(A);
      var size = A.length;
      var I = jStat.identity(size);
      jStat.arange(size - 1, -1, -1).forEach(function(i) {
        jStat.sliceAssign(
            I, { row: i }, jStat.divide(jStat.slice(I, { row: i }), A[i][i]));
        jStat.sliceAssign(
            A, { row: i }, jStat.divide(jStat.slice(A, { row: i }), A[i][i]));
        jStat.arange(i).forEach(function(j) {
          var c = jStat.multiply(A[j][i], -1);
          var Aj = jStat.slice(A, { row: j });
          var cAi = jStat.multiply(jStat.slice(A, { row: i }), c);
          jStat.sliceAssign(A, { row: j }, jStat.add(Aj, cAi));
          var Ij = jStat.slice(I, { row: j });
          var cIi = jStat.multiply(jStat.slice(I, { row: i }), c);
          jStat.sliceAssign(I, { row: j }, jStat.add(Ij, cIi));
        })
      });
      return I;
    }

    function qr_solve(A, b){
      var array_mode = false;
      if (b[0].length === undefined) {
        // [c1,c2,c3] mode
        b = b.map(function(x){ return [x] });
        array_mode = true;
      }
      var QR = jStat.QR(A);
      var Q = QR[0];
      var R = QR[1];
      var attrs = A[0].length;
      var Q1 = jStat.slice(Q,{col:{end:attrs}});
      var R1 = jStat.slice(R,{row:{end:attrs}});
      var RI = R_I(R1);
	  var Q2 = jStat.transpose(Q1);

	  if(Q2[0].length === undefined){
		  Q2 = [Q2]; // The confusing jStat.multifly implementation threat nature process again.
	  }

      var x = jStat.multiply(jStat.multiply(RI, Q2), b);

	  if(x.length === undefined){
		  x = [[x]]; // The confusing jStat.multifly implementation threat nature process again.
	  }


      if (array_mode)
        return x.map(function(i){ return i[0] });
      return x;
    }

    return qr_solve;
  }()),

  jacobi: function jacobi(a) {
    var condition = 1;
    var count = 0;
    var n = a.length;
    var e = jStat.identity(n, n);
    var ev = [];
    var b, i, j, p, q, maxim, theta, s;
    // condition === 1 only if tolerance is not reached
    while (condition === 1) {
      count++;
      maxim = a[0][1];
      p = 0;
      q = 1;
      for (var i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          if (i != j) {
            if (maxim < Math.abs(a[i][j])) {
              maxim = Math.abs(a[i][j]);
              p = i;
              q = j;
            }
          }
        }
      }
      if (a[p][p] === a[q][q])
        theta = (a[p][q] > 0) ? Math.PI / 4 : -Math.PI / 4;
      else
        theta = Math.atan(2 * a[p][q] / (a[p][p] - a[q][q])) / 2;
      s = jStat.identity(n, n);
      s[p][p] = Math.cos(theta);
      s[p][q] = -Math.sin(theta);
      s[q][p] = Math.sin(theta);
      s[q][q] = Math.cos(theta);
      // eigen vector matrix
      e = jStat.multiply(e, s);
      b = jStat.multiply(jStat.multiply(jStat.inv(s), a), s);
      a = b;
      condition = 0;
      for (var i = 1; i < n; i++) {
        for (j = 1; j < n; j++) {
          if (i != j && Math.abs(a[i][j]) > 0.001) {
            condition = 1;
          }
        }
      }
    }
    for (var i = 0; i < n; i++) ev.push(a[i][i]);
    //returns both the eigenvalue and eigenmatrix
    return [e, ev];
  },

  rungekutta: function rungekutta(f, h, p, t_j, u_j, order) {
    var k1, k2, u_j1, k3, k4;
    if (order === 2) {
      while (t_j <= p) {
        k1 = h * f(t_j, u_j);
        k2 = h * f(t_j + h, u_j + k1);
        u_j1 = u_j + (k1 + k2) / 2;
        u_j = u_j1;
        t_j = t_j + h;
      }
    }
    if (order === 4) {
      while (t_j <= p) {
        k1 = h * f(t_j, u_j);
        k2 = h * f(t_j + h / 2, u_j + k1 / 2);
        k3 = h * f(t_j + h / 2, u_j + k2 / 2);
        k4 = h * f(t_j +h, u_j + k3);
        u_j1 = u_j + (k1 + 2 * k2 + 2 * k3 + k4) / 6;
        u_j = u_j1;
        t_j = t_j + h;
      }
    }
    return u_j;
  },

  romberg: function romberg(f, a, b, order) {
    var i = 0;
    var h = (b - a) / 2;
    var x = [];
    var h1 = [];
    var g = [];
    var m, a1, j, k, I, d;
    while (i < order / 2) {
      I = f(a);
      for (j = a, k = 0; j <= b; j = j + h, k++) x[k] = j;
      m = x.length;
      for (j = 1; j < m - 1; j++) {
        I += (((j % 2) !== 0) ? 4 : 2) * f(x[j]);
      }
      I = (h / 3) * (I + f(b));
      g[i] = I;
      h /= 2;
      i++;
    }
    a1 = g.length;
    m = 1;
    while (a1 !== 1) {
      for (j = 0; j < a1 - 1; j++)
      h1[j] = ((Math.pow(4, m)) * g[j + 1] - g[j]) / (Math.pow(4, m) - 1);
      a1 = h1.length;
      g = h1;
      h1 = [];
      m++;
    }
    return g;
  },

  richardson: function richardson(X, f, x, h) {
    function pos(X, x) {
      var i = 0;
      var n = X.length;
      var p;
      for (; i < n; i++)
        if (X[i] === x) p = i;
      return p;
    }
    var n = X.length,
    h_min = Math.abs(x - X[pos(X, x) + 1]),
    i = 0,
    g = [],
    h1 = [],
    y1, y2, m, a, j;
    while (h >= h_min) {
      y1 = pos(X, x + h);
      y2 = pos(X, x);
      g[i] = (f[y1] - 2 * f[y2] + f[2 * y2 - y1]) / (h * h);
      h /= 2;
      i++;
    }
    a = g.length;
    m = 1;
    while (a != 1) {
      for (j = 0; j < a - 1; j++)
      h1[j] = ((Math.pow(4, m)) * g[j + 1] - g[j]) / (Math.pow(4, m) - 1);
      a = h1.length;
      g = h1;
      h1 = [];
      m++;
    }
    return g;
  },

  simpson: function simpson(f, a, b, n) {
    var h = (b - a) / n;
    var I = f(a);
    var x = [];
    var j = a;
    var k = 0;
    var i = 1;
    var m;
    for (; j <= b; j = j + h, k++)
      x[k] = j;
    m = x.length;
    for (; i < m - 1; i++) {
      I += ((i % 2 !== 0) ? 4 : 2) * f(x[i]);
    }
    return (h / 3) * (I + f(b));
  },

  hermite: function hermite(X, F, dF, value) {
    var n = X.length;
    var p = 0;
    var i = 0;
    var l = [];
    var dl = [];
    var A = [];
    var B = [];
    var j;
    for (; i < n; i++) {
      l[i] = 1;
      for (j = 0; j < n; j++) {
        if (i != j) l[i] *= (value - X[j]) / (X[i] - X[j]);
      }
      dl[i] = 0;
      for (j = 0; j < n; j++) {
        if (i != j) dl[i] += 1 / (X [i] - X[j]);
      }
      A[i] = (1 - 2 * (value - X[i]) * dl[i]) * (l[i] * l[i]);
      B[i] = (value - X[i]) * (l[i] * l[i]);
      p += (A[i] * F[i] + B[i] * dF[i]);
    }
    return p;
  },

  lagrange: function lagrange(X, F, value) {
    var p = 0;
    var i = 0;
    var j, l;
    var n = X.length;
    for (; i < n; i++) {
      l = F[i];
      for (j = 0; j < n; j++) {
        // calculating the lagrange polynomial L_i
        if (i != j) l *= (value - X[j]) / (X[i] - X[j]);
      }
      // adding the lagrange polynomials found above
      p += l;
    }
    return p;
  },

  cubic_spline: function cubic_spline(X, F, value) {
    var n = X.length;
    var i = 0, j;
    var A = [];
    var B = [];
    var alpha = [];
    var c = [];
    var h = [];
    var b = [];
    var d = [];
    for (; i < n - 1; i++)
      h[i] = X[i + 1] - X[i];
    alpha[0] = 0;
    for (var i = 1; i < n - 1; i++) {
      alpha[i] = (3 / h[i]) * (F[i + 1] - F[i]) -
          (3 / h[i-1]) * (F[i] - F[i-1]);
    }
    for (var i = 1; i < n - 1; i++) {
      A[i] = [];
      B[i] = [];
      A[i][i-1] = h[i-1];
      A[i][i] = 2 * (h[i - 1] + h[i]);
      A[i][i+1] = h[i];
      B[i][0] = alpha[i];
    }
    c = jStat.multiply(jStat.inv(A), B);
    for (j = 0; j < n - 1; j++) {
      b[j] = (F[j + 1] - F[j]) / h[j] - h[j] * (c[j + 1][0] + 2 * c[j][0]) / 3;
      d[j] = (c[j + 1][0] - c[j][0]) / (3 * h[j]);
    }
    for (j = 0; j < n; j++) {
      if (X[j] > value) break;
    }
    j -= 1;
    return F[j] + (value - X[j]) * b[j] + jStat.sq(value-X[j]) *
        c[j] + (value - X[j]) * jStat.sq(value - X[j]) * d[j];
  },

  gauss_quadrature: function gauss_quadrature() {
    throw new Error('gauss_quadrature not yet implemented');
  },

  PCA: function PCA(X) {
    var m = X.length;
    var n = X[0].length;
    var flag = false;
    var i = 0;
    var j, temp1;
    var u = [];
    var D = [];
    var result = [];
    var temp2 = [];
    var Y = [];
    var Bt = [];
    var B = [];
    var C = [];
    var V = [];
    var Vt = [];
    for (var i = 0; i < m; i++) {
      u[i] = jStat.sum(X[i]) / n;
    }
    for (var i = 0; i < n; i++) {
      B[i] = [];
      for(j = 0; j < m; j++) {
        B[i][j] = X[j][i] - u[j];
      }
    }
    B = jStat.transpose(B);
    for (var i = 0; i < m; i++) {
      C[i] = [];
      for (j = 0; j < m; j++) {
        C[i][j] = (jStat.dot([B[i]], [B[j]])) / (n - 1);
      }
    }
    result = jStat.jacobi(C);
    V = result[0];
    D = result[1];
    Vt = jStat.transpose(V);
    for (var i = 0; i < D.length; i++) {
      for (j = i; j < D.length; j++) {
        if(D[i] < D[j])  {
          temp1 = D[i];
          D[i] = D[j];
          D[j] = temp1;
          temp2 = Vt[i];
          Vt[i] = Vt[j];
          Vt[j] = temp2;
        }
      }
    }
    Bt = jStat.transpose(B);
    for (var i = 0; i < m; i++) {
      Y[i] = [];
      for (j = 0; j < Bt.length; j++) {
        Y[i][j] = jStat.dot([Vt[i]], [Bt[j]]);
      }
    }
    return [X, D, Vt, Y];
  }
});

// extend jStat.fn with methods that require one argument
(function(funcs) {
  for (var i = 0; i < funcs.length; i++) (function(passfunc) {
    jStat.fn[passfunc] = function(arg, func) {
      var tmpthis = this;
      // check for callback
      if (func) {
        setTimeout(function() {
          func.call(tmpthis, jStat.fn[passfunc].call(tmpthis, arg));
        }, 15);
        return this;
      }
      if (typeof jStat[passfunc](this, arg) === 'number')
        return jStat[passfunc](this, arg);
      else
        return jStat(jStat[passfunc](this, arg));
    };
  }(funcs[i]));
}('add divide multiply subtract dot pow exp log abs norm angle'.split(' ')));

}(jStat, Math));
(function(jStat, Math) {

var slice = [].slice;
var isNumber = jStat.utils.isNumber;
var isArray = jStat.utils.isArray;

// flag==true denotes use of sample standard deviation
// Z Statistics
jStat.extend({
  // 2 different parameter lists:
  // (value, mean, sd)
  // (value, array, flag)
  zscore: function zscore() {
    var args = slice.call(arguments);
    if (isNumber(args[1])) {
      return (args[0] - args[1]) / args[2];
    }
    return (args[0] - jStat.mean(args[1])) / jStat.stdev(args[1], args[2]);
  },

  // 3 different paramter lists:
  // (value, mean, sd, sides)
  // (zscore, sides)
  // (value, array, sides, flag)
  ztest: function ztest() {
    var args = slice.call(arguments);
    var z;
    if (isArray(args[1])) {
      // (value, array, sides, flag)
      z = jStat.zscore(args[0],args[1],args[3]);
      return (args[2] === 1) ?
        (jStat.normal.cdf(-Math.abs(z), 0, 1)) :
        (jStat.normal.cdf(-Math.abs(z), 0, 1)*2);
    } else {
      if (args.length > 2) {
        // (value, mean, sd, sides)
        z = jStat.zscore(args[0],args[1],args[2]);
        return (args[3] === 1) ?
          (jStat.normal.cdf(-Math.abs(z),0,1)) :
          (jStat.normal.cdf(-Math.abs(z),0,1)* 2);
      } else {
        // (zscore, sides)
        z = args[0];
        return (args[1] === 1) ?
          (jStat.normal.cdf(-Math.abs(z),0,1)) :
          (jStat.normal.cdf(-Math.abs(z),0,1)*2);
      }
    }
  }
});

jStat.extend(jStat.fn, {
  zscore: function zscore(value, flag) {
    return (value - this.mean()) / this.stdev(flag);
  },

  ztest: function ztest(value, sides, flag) {
    var zscore = Math.abs(this.zscore(value, flag));
    return (sides === 1) ?
      (jStat.normal.cdf(-zscore, 0, 1)) :
      (jStat.normal.cdf(-zscore, 0, 1) * 2);
  }
});

// T Statistics
jStat.extend({
  // 2 parameter lists
  // (value, mean, sd, n)
  // (value, array)
  tscore: function tscore() {
    var args = slice.call(arguments);
    return (args.length === 4) ?
      ((args[0] - args[1]) / (args[2] / Math.sqrt(args[3]))) :
      ((args[0] - jStat.mean(args[1])) /
       (jStat.stdev(args[1], true) / Math.sqrt(args[1].length)));
  },

  // 3 different paramter lists:
  // (value, mean, sd, n, sides)
  // (tscore, n, sides)
  // (value, array, sides)
  ttest: function ttest() {
    var args = slice.call(arguments);
    var tscore;
    if (args.length === 5) {
      tscore = Math.abs(jStat.tscore(args[0], args[1], args[2], args[3]));
      return (args[4] === 1) ?
        (jStat.studentt.cdf(-tscore, args[3]-1)) :
        (jStat.studentt.cdf(-tscore, args[3]-1)*2);
    }
    if (isNumber(args[1])) {
      tscore = Math.abs(args[0])
      return (args[2] == 1) ?
        (jStat.studentt.cdf(-tscore, args[1]-1)) :
        (jStat.studentt.cdf(-tscore, args[1]-1) * 2);
    }
    tscore = Math.abs(jStat.tscore(args[0], args[1]))
    return (args[2] == 1) ?
      (jStat.studentt.cdf(-tscore, args[1].length-1)) :
      (jStat.studentt.cdf(-tscore, args[1].length-1) * 2);
  }
});

jStat.extend(jStat.fn, {
  tscore: function tscore(value) {
    return (value - this.mean()) / (this.stdev(true) / Math.sqrt(this.cols()));
  },

  ttest: function ttest(value, sides) {
    return (sides === 1) ?
      (1 - jStat.studentt.cdf(Math.abs(this.tscore(value)), this.cols()-1)) :
      (jStat.studentt.cdf(-Math.abs(this.tscore(value)), this.cols()-1)*2);
  }
});

// F Statistics
jStat.extend({
  // Paramter list is as follows:
  // (array1, array2, array3, ...)
  // or it is an array of arrays
  // array of arrays conversion
  anovafscore: function anovafscore() {
    var args = slice.call(arguments),
    expVar, sample, sampMean, sampSampMean, tmpargs, unexpVar, i, j;
    if (args.length === 1) {
      tmpargs = new Array(args[0].length);
      for (var i = 0; i < args[0].length; i++) {
        tmpargs[i] = args[0][i];
      }
      args = tmpargs;
    }
    // 2 sample case
    if (args.length === 2) {
      return jStat.variance(args[0]) / jStat.variance(args[1]);
    }
    // Builds sample array
    sample = new Array();
    for (var i = 0; i < args.length; i++) {
      sample = sample.concat(args[i]);
    }
    sampMean = jStat.mean(sample);
    // Computes the explained variance
    expVar = 0;
    for (var i = 0; i < args.length; i++) {
      expVar = expVar + args[i].length * Math.pow(jStat.mean(args[i]) - sampMean, 2);
    }
    expVar /= (args.length - 1);
    // Computes unexplained variance
    unexpVar = 0;
    for (var i = 0; i < args.length; i++) {
      sampSampMean = jStat.mean(args[i]);
      for (j = 0; j < args[i].length; j++) {
        unexpVar += Math.pow(args[i][j] - sampSampMean, 2);
      }
    }
    unexpVar /= (sample.length - args.length);
    return expVar / unexpVar;
  },

  // 2 different paramter setups
  // (array1, array2, array3, ...)
  // (anovafscore, df1, df2)
  anovaftest: function anovaftest() {
    var args = slice.call(arguments),
    df1, df2, n, i;
    if (isNumber(args[0])) {
      return 1 - jStat.centralF.cdf(args[0], args[1], args[2]);
    }
    anovafscore = jStat.anovafscore(args);
    df1 = args.length - 1;
    n = 0;
    for (var i = 0; i < args.length; i++) {
      n = n + args[i].length;
    }
    df2 = n - df1 - 1;
    return 1 - jStat.centralF.cdf(anovafscore, df1, df2);
  },

  ftest: function ftest(fscore, df1, df2) {
    return 1 - jStat.centralF.cdf(fscore, df1, df2);
  }
});

jStat.extend(jStat.fn, {
  anovafscore: function anovafscore() {
    return jStat.anovafscore(this.toArray());
  },

  anovaftes: function anovaftes() {
    var n = 0;
    var i;
    for (var i = 0; i < this.length; i++) {
      n = n + this[i].length;
    }
    return jStat.ftest(this.anovafscore(), this.length - 1, n - this.length);
  }
});

// Tukey's range test
jStat.extend({
  // 2 parameter lists
  // (mean1, mean2, n1, n2, sd)
  // (array1, array2, sd)
  qscore: function qscore() {
    var args = slice.call(arguments);
    var mean1, mean2, n1, n2, sd;
    if (isNumber(args[0])) {
        mean1 = args[0];
        mean2 = args[1];
        n1 = args[2];
        n2 = args[3];
        sd = args[4];
    } else {
        mean1 = jStat.mean(args[0]);
        mean2 = jStat.mean(args[1]);
        n1 = args[0].length;
        n2 = args[1].length;
        sd = args[2];
    }
    return Math.abs(mean1 - mean2) / (sd * Math.sqrt((1 / n1 + 1 / n2) / 2));
  },

  // 3 different parameter lists:
  // (qscore, n, k)
  // (mean1, mean2, n1, n2, sd, n, k)
  // (array1, array2, sd, n, k)
  qtest: function qtest() {
    var args = slice.call(arguments);

    var qscore;
    if (args.length === 3) {
      qscore = args[0];
      args = args.slice(1);
    } else if (args.length === 7) {
      qscore = jStat.qscore(args[0], args[1], args[2], args[3], args[4]);
      args = args.slice(5);
    } else {
      qscore = jStat.qscore(args[0], args[1], args[2]);
      args = args.slice(3);
    }

    var n = args[0];
    var k = args[1];

    return 1 - jStat.tukey.cdf(qscore, k, n - k);
  },

  tukeyhsd: function tukeyhsd(arrays) {
    var sd = jStat.pooledstdev(arrays);
    var means = arrays.map(function (arr) {return jStat.mean(arr);});
    var n = arrays.reduce(function (n, arr) {return n + arr.length;}, 0);

    var results = [];
    for (var i = 0; i < arrays.length; ++i) {
        for (var j = i + 1; j < arrays.length; ++j) {
            var p = jStat.qtest(means[i], means[j], arrays[i].length, arrays[j].length, sd, n, arrays.length);
            results.push([[i, j], p]);
        }
    }

    return results;
  }
});

// Error Bounds
jStat.extend({
  // 2 different parameter setups
  // (value, alpha, sd, n)
  // (value, alpha, array)
  normalci: function normalci() {
    var args = slice.call(arguments),
    ans = new Array(2),
    change;
    if (args.length === 4) {
      change = Math.abs(jStat.normal.inv(args[1] / 2, 0, 1) *
                        args[2] / Math.sqrt(args[3]));
    } else {
      change = Math.abs(jStat.normal.inv(args[1] / 2, 0, 1) *
                        jStat.stdev(args[2]) / Math.sqrt(args[2].length));
    }
    ans[0] = args[0] - change;
    ans[1] = args[0] + change;
    return ans;
  },

  // 2 different parameter setups
  // (value, alpha, sd, n)
  // (value, alpha, array)
  tci: function tci() {
    var args = slice.call(arguments),
    ans = new Array(2),
    change;
    if (args.length === 4) {
      change = Math.abs(jStat.studentt.inv(args[1] / 2, args[3] - 1) *
                        args[2] / Math.sqrt(args[3]));
    } else {
      change = Math.abs(jStat.studentt.inv(args[1] / 2, args[2].length - 1) *
                        jStat.stdev(args[2], true) / Math.sqrt(args[2].length));
    }
    ans[0] = args[0] - change;
    ans[1] = args[0] + change;
    return ans;
  },

  significant: function significant(pvalue, alpha) {
    return pvalue < alpha;
  }
});

jStat.extend(jStat.fn, {
  normalci: function normalci(value, alpha) {
    return jStat.normalci(value, alpha, this.toArray());
  },

  tci: function tci(value, alpha) {
    return jStat.tci(value, alpha, this.toArray());
  }
});

// internal method for calculating the z-score for a difference of proportions test
function differenceOfProportions(p1, n1, p2, n2) {
  if (p1 > 1 || p2 > 1 || p1 <= 0 || p2 <= 0) {
    throw new Error("Proportions should be greater than 0 and less than 1")
  }
  var pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
  var se = Math.sqrt(pooled * (1 - pooled) * ((1/n1) + (1/n2)));
  return (p1 - p2) / se;
}

// Difference of Proportions
jStat.extend(jStat.fn, {
  oneSidedDifferenceOfProportions: function oneSidedDifferenceOfProportions(p1, n1, p2, n2) {
    var z = differenceOfProportions(p1, n1, p2, n2);
    return jStat.ztest(z, 1);
  },

  twoSidedDifferenceOfProportions: function twoSidedDifferenceOfProportions(p1, n1, p2, n2) {
    var z = differenceOfProportions(p1, n1, p2, n2);
    return jStat.ztest(z, 2);
  }
});

}(jStat, Math));
jStat.models = (function(){

  function sub_regress(endog, exog) {
    return ols(endog, exog);
  }

  function sub_regress(exog) {
    var var_count = exog[0].length;
    var modelList = jStat.arange(var_count).map(function(endog_index) {
      var exog_index =
          jStat.arange(var_count).filter(function(i){return i!==endog_index});
      return ols(jStat.col(exog, endog_index).map(function(x){ return x[0] }),
                 jStat.col(exog, exog_index))
    });
    return modelList;
  }

  // do OLS model regress
  // exog have include const columns ,it will not generate it .In fact, exog is
  // "design matrix" look at
  //https://en.wikipedia.org/wiki/Design_matrix
  function ols(endog, exog) {
    var nobs = endog.length;
    var df_model = exog[0].length - 1;
    var df_resid = nobs-df_model - 1;
    var coef = jStat.lstsq(exog, endog);
    var predict =
        jStat.multiply(exog, coef.map(function(x) { return [x] }))
            .map(function(p) { return p[0] });
    var resid = jStat.subtract(endog, predict);
    var ybar = jStat.mean(endog);
    // constant cause problem
    // var SST = jStat.sum(endog.map(function(y) {
    //   return Math.pow(y-ybar,2);
    // }));
    var SSE = jStat.sum(predict.map(function(f) {
      return Math.pow(f - ybar, 2);
    }));
    var SSR = jStat.sum(endog.map(function(y, i) {
      return Math.pow(y - predict[i], 2);
    }));
    var SST = SSE + SSR;
    var R2 = (SSE / SST);
    return {
        exog:exog,
        endog:endog,
        nobs:nobs,
        df_model:df_model,
        df_resid:df_resid,
        coef:coef,
        predict:predict,
        resid:resid,
        ybar:ybar,
        SST:SST,
        SSE:SSE,
        SSR:SSR,
        R2:R2
    };
  }

  // H0: b_I=0
  // H1: b_I!=0
  function t_test(model) {
    var subModelList = sub_regress(model.exog);
    //var sigmaHat=jStat.stdev(model.resid);
    var sigmaHat = Math.sqrt(model.SSR / (model.df_resid));
    var seBetaHat = subModelList.map(function(mod) {
      var SST = mod.SST;
      var R2 = mod.R2;
      return sigmaHat / Math.sqrt(SST * (1 - R2));
    });
    var tStatistic = model.coef.map(function(coef, i) {
      return (coef - 0) / seBetaHat[i];
    });
    var pValue = tStatistic.map(function(t) {
      var leftppf = jStat.studentt.cdf(t, model.df_resid);
      return (leftppf > 0.5 ? 1 - leftppf : leftppf) * 2;
    });
    var c = jStat.studentt.inv(0.975, model.df_resid);
    var interval95 = model.coef.map(function(coef, i) {
      var d = c * seBetaHat[i];
      return [coef - d, coef + d];
    })
    return {
        se: seBetaHat,
        t: tStatistic,
        p: pValue,
        sigmaHat: sigmaHat,
        interval95: interval95
    };
  }

  function F_test(model) {
    var F_statistic =
        (model.R2 / model.df_model) / ((1 - model.R2) / model.df_resid);
    var fcdf = function(x, n1, n2) {
      return jStat.beta.cdf(x / (n2 / n1 + x), n1 / 2, n2 / 2)
    }
    var pvalue = 1 - fcdf(F_statistic, model.df_model, model.df_resid);
    return { F_statistic: F_statistic, pvalue: pvalue };
  }

  function ols_wrap(endog, exog) {
    var model = ols(endog,exog);
    var ttest = t_test(model);
    var ftest = F_test(model);
    // Provide the Wherry / Ezekiel / McNemar / Cohen Adjusted R^2
    // Which matches the 'adjusted R^2' provided by R's lm package
    var adjust_R2 =
        1 - (1 - model.R2) * ((model.nobs - 1) / (model.df_resid));
    model.t = ttest;
    model.f = ftest;
    model.adjust_R2 = adjust_R2;
    return model;
  }

  return { ols: ols_wrap };
})();
  // Make it compatible with previous version.
  jStat.jStat = jStat;

  return jStat;
});


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var utils = __webpack_require__(1);
var numbro = __webpack_require__(9);
var error = __webpack_require__(0);

exports.UNIQUE = function () {
  var result = [];
  for (var i = 0; i < arguments.length; ++i) {
    var hasElement = false;
    var element    = arguments[i];

    // Check if we've already seen this element.
    for (var j = 0; j < result.length; ++j) {
      hasElement = result[j] === element;
      if (hasElement) { break; }
    }

    // If we did not find it, add it to the result.
    if (!hasElement) {
      result.push(element);
    }
  }
  return result;
};

exports.FLATTEN = utils.flatten;

exports.ARGS2ARRAY = function () {
  return Array.prototype.slice.call(arguments, 0);
};

exports.REFERENCE = function (context, reference) {
  if (!arguments.length) {
    return error.error;
  }
  try {
    var path = reference.split('.');
    var result = context;
    for (var i = 0; i < path.length; ++i) {
      var step = path[i];
      if (step[step.length - 1] === ']') {
        var opening = step.indexOf('[');
        var index = step.substring(opening + 1, step.length - 1);
        result = result[step.substring(0, opening)][index];
      } else {
        result = result[step];
      }
    }
    return result;
  } catch (error) {}
};

exports.JOIN = function (array, separator) {
  return array.join(separator);
};

exports.NUMBERS = function () {
  var possibleNumbers = utils.flatten(arguments);
  return possibleNumbers.filter(function (el) {
    return typeof el === 'number';
  });
};

exports.NUMERAL = function (number, format) {
  return numbro(number).format(format);
};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);
var jStat = __webpack_require__(11).jStat;
var text = __webpack_require__(6);
var utils = __webpack_require__(1);
var bessel = __webpack_require__(28);

function isValidBinaryNumber(number) {
  return (/^[01]{1,10}$/).test(number);
}

exports.BESSELI = function(x, n) {
  x = utils.parseNumber(x);
  n = utils.parseNumber(n);
  if (utils.anyIsError(x, n)) {
    return error.value;
  }

  return bessel.besseli(x, n);
};

exports.BESSELJ = function(x, n) {
  x = utils.parseNumber(x);
  n = utils.parseNumber(n);
  if (utils.anyIsError(x, n)) {
    return error.value;
  }

  return bessel.besselj(x, n);
};

exports.BESSELK = function(x, n) {
  x = utils.parseNumber(x);
  n = utils.parseNumber(n);
  if (utils.anyIsError(x, n)) {
    return error.value;
  }

  return bessel.besselk(x, n);
};

exports.BESSELY = function(x, n) {
  x = utils.parseNumber(x);
  n = utils.parseNumber(n);
  if (utils.anyIsError(x, n)) {
    return error.value;
  }

  return bessel.bessely(x, n);
};

exports.BIN2DEC = function(number) {
  // Return error if number is not binary or contains more than 10 characters (10 digits)
  if (!isValidBinaryNumber(number)) {
    return error.num;
  }

  // Convert binary number to decimal
  var result = parseInt(number, 2);

  // Handle negative numbers
  var stringified = number.toString();
  if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
    return parseInt(stringified.substring(1), 2) - 512;
  } else {
    return result;
  }
};


exports.BIN2HEX = function(number, places) {
  // Return error if number is not binary or contains more than 10 characters (10 digits)
  if (!isValidBinaryNumber(number)) {
    return error.num;
  }

  // Ignore places and return a 10-character hexadecimal number if number is negative
  var stringified = number.toString();
  if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
    return (1099511627264 + parseInt(stringified.substring(1), 2)).toString(16);
  }

  // Convert binary number to hexadecimal
  var result = parseInt(number, 2).toString(16);

  // Return hexadecimal number using the minimum number of characters necessary if places is undefined
  if (places === undefined) {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.BIN2OCT = function(number, places) {
  // Return error if number is not binary or contains more than 10 characters (10 digits)
  if (!isValidBinaryNumber(number)) {
    return error.num;
  }

  // Ignore places and return a 10-character octal number if number is negative
  var stringified = number.toString();
  if (stringified.length === 10 && stringified.substring(0, 1) === '1') {
    return (1073741312 + parseInt(stringified.substring(1), 2)).toString(8);
  }

  // Convert binary number to octal
  var result = parseInt(number, 2).toString(8);

  // Return octal number using the minimum number of characters necessary if places is undefined
  if (places === undefined) {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.BITAND = function(number1, number2) {
  // Return error if either number is a non-numeric value
  number1 = utils.parseNumber(number1);
  number2 = utils.parseNumber(number2);
  if (utils.anyIsError(number1, number2)) {
    return error.value;
  }

  // Return error if either number is less than 0
  if (number1 < 0 || number2 < 0) {
    return error.num;
  }

  // Return error if either number is a non-integer
  if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
    return error.num;
  }

  // Return error if either number is greater than (2^48)-1
  if (number1 > 281474976710655 || number2 > 281474976710655) {
    return error.num;
  }

  // Return bitwise AND of two numbers
  return number1 & number2;
};

exports.BITLSHIFT = function(number, shift) {
  number = utils.parseNumber(number);
  shift = utils.parseNumber(shift);
  if (utils.anyIsError(number, shift)) {
    return error.value;
  }

  // Return error if number is less than 0
  if (number < 0) {
    return error.num;
  }

  // Return error if number is a non-integer
  if (Math.floor(number) !== number) {
    return error.num;
  }

  // Return error if number is greater than (2^48)-1
  if (number > 281474976710655) {
    return error.num;
  }

  // Return error if the absolute value of shift is greater than 53
  if (Math.abs(shift) > 53) {
    return error.num;
  }

  // Return number shifted by shift bits to the left or to the right if shift is negative
  return (shift >= 0) ? number << shift : number >> -shift;
};

exports.BITOR = function(number1, number2) {
  number1 = utils.parseNumber(number1);
  number2 = utils.parseNumber(number2);
  if (utils.anyIsError(number1, number2)) {
    return error.value;
  }

  // Return error if either number is less than 0
  if (number1 < 0 || number2 < 0) {
    return error.num;
  }

  // Return error if either number is a non-integer
  if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
    return error.num;
  }

  // Return error if either number is greater than (2^48)-1
  if (number1 > 281474976710655 || number2 > 281474976710655) {
    return error.num;
  }

  // Return bitwise OR of two numbers
  return number1 | number2;
};

exports.BITRSHIFT = function(number, shift) {
  number = utils.parseNumber(number);
  shift = utils.parseNumber(shift);
  if (utils.anyIsError(number, shift)) {
    return error.value;
  }

  // Return error if number is less than 0
  if (number < 0) {
    return error.num;
  }

  // Return error if number is a non-integer
  if (Math.floor(number) !== number) {
    return error.num;
  }

  // Return error if number is greater than (2^48)-1
  if (number > 281474976710655) {
    return error.num;
  }

  // Return error if the absolute value of shift is greater than 53
  if (Math.abs(shift) > 53) {
    return error.num;
  }

  // Return number shifted by shift bits to the right or to the left if shift is negative
  return (shift >= 0) ? number >> shift : number << -shift;
};

exports.BITXOR = function(number1, number2) {
  number1 = utils.parseNumber(number1);
  number2 = utils.parseNumber(number2);
  if (utils.anyIsError(number1, number2)) {
    return error.value;
  }

  // Return error if either number is less than 0
  if (number1 < 0 || number2 < 0) {
    return error.num;
  }

  // Return error if either number is a non-integer
  if (Math.floor(number1) !== number1 || Math.floor(number2) !== number2) {
    return error.num;
  }

  // Return error if either number is greater than (2^48)-1
  if (number1 > 281474976710655 || number2 > 281474976710655) {
    return error.num;
  }

  // Return bitwise XOR of two numbers
  return number1 ^ number2;
};

exports.COMPLEX = function(real, imaginary, suffix) {
  real = utils.parseNumber(real);
  imaginary = utils.parseNumber(imaginary);
  if (utils.anyIsError(real, imaginary)) {
    return real;
  }

  // Set suffix
  suffix = (suffix === undefined) ? 'i' : suffix;

  // Return error if suffix is neither "i" nor "j"
  if (suffix !== 'i' && suffix !== 'j') {
    return error.value;
  }

  // Return complex number
  if (real === 0 && imaginary === 0) {
    return 0;
  } else if (real === 0) {
    return (imaginary === 1) ? suffix : imaginary.toString() + suffix;
  } else if (imaginary === 0) {
    return real.toString();
  } else {
    var sign = (imaginary > 0) ? '+' : '';
    return real.toString() + sign + ((imaginary === 1) ? suffix : imaginary.toString() + suffix);
  }
};

exports.CONVERT = function(number, from_unit, to_unit) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }

  // List of units supported by CONVERT and units defined by the International System of Units
  // [Name, Symbol, Alternate symbols, Quantity, ISU, CONVERT, Conversion ratio]
  var units = [
    ["a.u. of action", "?", null, "action", false, false, 1.05457168181818e-34],
    ["a.u. of charge", "e", null, "electric_charge", false, false, 1.60217653141414e-19],
    ["a.u. of energy", "Eh", null, "energy", false, false, 4.35974417757576e-18],
    ["a.u. of length", "a?", null, "length", false, false, 5.29177210818182e-11],
    ["a.u. of mass", "m?", null, "mass", false, false, 9.10938261616162e-31],
    ["a.u. of time", "?/Eh", null, "time", false, false, 2.41888432650516e-17],
    ["admiralty knot", "admkn", null, "speed", false, true, 0.514773333],
    ["ampere", "A", null, "electric_current", true, false, 1],
    ["ampere per meter", "A/m", null, "magnetic_field_intensity", true, false, 1],
    ["ångström", "Å", ["ang"], "length", false, true, 1e-10],
    ["are", "ar", null, "area", false, true, 100],
    ["astronomical unit", "ua", null, "length", false, false, 1.49597870691667e-11],
    ["bar", "bar", null, "pressure", false, false, 100000],
    ["barn", "b", null, "area", false, false, 1e-28],
    ["becquerel", "Bq", null, "radioactivity", true, false, 1],
    ["bit", "bit", ["b"], "information", false, true, 1],
    ["btu", "BTU", ["btu"], "energy", false, true, 1055.05585262],
    ["byte", "byte", null, "information", false, true, 8],
    ["candela", "cd", null, "luminous_intensity", true, false, 1],
    ["candela per square metre", "cd/m?", null, "luminance", true, false, 1],
    ["coulomb", "C", null, "electric_charge", true, false, 1],
    ["cubic ångström", "ang3", ["ang^3"], "volume", false, true, 1e-30],
    ["cubic foot", "ft3", ["ft^3"], "volume", false, true, 0.028316846592],
    ["cubic inch", "in3", ["in^3"], "volume", false, true, 0.000016387064],
    ["cubic light-year", "ly3", ["ly^3"], "volume", false, true, 8.46786664623715e-47],
    ["cubic metre", "m?", null, "volume", true, true, 1],
    ["cubic mile", "mi3", ["mi^3"], "volume", false, true, 4168181825.44058],
    ["cubic nautical mile", "Nmi3", ["Nmi^3"], "volume", false, true, 6352182208],
    ["cubic Pica", "Pica3", ["Picapt3", "Pica^3", "Picapt^3"], "volume", false, true, 7.58660370370369e-8],
    ["cubic yard", "yd3", ["yd^3"], "volume", false, true, 0.764554857984],
    ["cup", "cup", null, "volume", false, true, 0.0002365882365],
    ["dalton", "Da", ["u"], "mass", false, false, 1.66053886282828e-27],
    ["day", "d", ["day"], "time", false, true, 86400],
    ["degree", "°", null, "angle", false, false, 0.0174532925199433],
    ["degrees Rankine", "Rank", null, "temperature", false, true, 0.555555555555556],
    ["dyne", "dyn", ["dy"], "force", false, true, 0.00001],
    ["electronvolt", "eV", ["ev"], "energy", false, true, 1.60217656514141],
    ["ell", "ell", null, "length", false, true, 1.143],
    ["erg", "erg", ["e"], "energy", false, true, 1e-7],
    ["farad", "F", null, "electric_capacitance", true, false, 1],
    ["fluid ounce", "oz", null, "volume", false, true, 0.0000295735295625],
    ["foot", "ft", null, "length", false, true, 0.3048],
    ["foot-pound", "flb", null, "energy", false, true, 1.3558179483314],
    ["gal", "Gal", null, "acceleration", false, false, 0.01],
    ["gallon", "gal", null, "volume", false, true, 0.003785411784],
    ["gauss", "G", ["ga"], "magnetic_flux_density", false, true, 1],
    ["grain", "grain", null, "mass", false, true, 0.0000647989],
    ["gram", "g", null, "mass", false, true, 0.001],
    ["gray", "Gy", null, "absorbed_dose", true, false, 1],
    ["gross registered ton", "GRT", ["regton"], "volume", false, true, 2.8316846592],
    ["hectare", "ha", null, "area", false, true, 10000],
    ["henry", "H", null, "inductance", true, false, 1],
    ["hertz", "Hz", null, "frequency", true, false, 1],
    ["horsepower", "HP", ["h"], "power", false, true, 745.69987158227],
    ["horsepower-hour", "HPh", ["hh", "hph"], "energy", false, true, 2684519.538],
    ["hour", "h", ["hr"], "time", false, true, 3600],
    ["imperial gallon (U.K.)", "uk_gal", null, "volume", false, true, 0.00454609],
    ["imperial hundredweight", "lcwt", ["uk_cwt", "hweight"], "mass", false, true, 50.802345],
    ["imperial quart (U.K)", "uk_qt", null, "volume", false, true, 0.0011365225],
    ["imperial ton", "brton", ["uk_ton", "LTON"], "mass", false, true, 1016.046909],
    ["inch", "in", null, "length", false, true, 0.0254],
    ["international acre", "uk_acre", null, "area", false, true, 4046.8564224],
    ["IT calorie", "cal", null, "energy", false, true, 4.1868],
    ["joule", "J", null, "energy", true, true, 1],
    ["katal", "kat", null, "catalytic_activity", true, false, 1],
    ["kelvin", "K", ["kel"], "temperature", true, true, 1],
    ["kilogram", "kg", null, "mass", true, true, 1],
    ["knot", "kn", null, "speed", false, true, 0.514444444444444],
    ["light-year", "ly", null, "length", false, true, 9460730472580800],
    ["litre", "L", ["l", "lt"], "volume", false, true, 0.001],
    ["lumen", "lm", null, "luminous_flux", true, false, 1],
    ["lux", "lx", null, "illuminance", true, false, 1],
    ["maxwell", "Mx", null, "magnetic_flux", false, false, 1e-18],
    ["measurement ton", "MTON", null, "volume", false, true, 1.13267386368],
    ["meter per hour", "m/h", ["m/hr"], "speed", false, true, 0.00027777777777778],
    ["meter per second", "m/s", ["m/sec"], "speed", true, true, 1],
    ["meter per second squared", "m?s??", null, "acceleration", true, false, 1],
    ["parsec", "pc", ["parsec"], "length", false, true, 30856775814671900],
    ["meter squared per second", "m?/s", null, "kinematic_viscosity", true, false, 1],
    ["metre", "m", null, "length", true, true, 1],
    ["miles per hour", "mph", null, "speed", false, true, 0.44704],
    ["millimetre of mercury", "mmHg", null, "pressure", false, false, 133.322],
    ["minute", "?", null, "angle", false, false, 0.000290888208665722],
    ["minute", "min", ["mn"], "time", false, true, 60],
    ["modern teaspoon", "tspm", null, "volume", false, true, 0.000005],
    ["mole", "mol", null, "amount_of_substance", true, false, 1],
    ["morgen", "Morgen", null, "area", false, true, 2500],
    ["n.u. of action", "?", null, "action", false, false, 1.05457168181818e-34],
    ["n.u. of mass", "m?", null, "mass", false, false, 9.10938261616162e-31],
    ["n.u. of speed", "c?", null, "speed", false, false, 299792458],
    ["n.u. of time", "?/(me?c??)", null, "time", false, false, 1.28808866778687e-21],
    ["nautical mile", "M", ["Nmi"], "length", false, true, 1852],
    ["newton", "N", null, "force", true, true, 1],
    ["œrsted", "Oe ", null, "magnetic_field_intensity", false, false, 79.5774715459477],
    ["ohm", "Ω", null, "electric_resistance", true, false, 1],
    ["ounce mass", "ozm", null, "mass", false, true, 0.028349523125],
    ["pascal", "Pa", null, "pressure", true, false, 1],
    ["pascal second", "Pa?s", null, "dynamic_viscosity", true, false, 1],
    ["pferdestärke", "PS", null, "power", false, true, 735.49875],
    ["phot", "ph", null, "illuminance", false, false, 0.0001],
    ["pica (1/6 inch)", "pica", null, "length", false, true, 0.00035277777777778],
    ["pica (1/72 inch)", "Pica", ["Picapt"], "length", false, true, 0.00423333333333333],
    ["poise", "P", null, "dynamic_viscosity", false, false, 0.1],
    ["pond", "pond", null, "force", false, true, 0.00980665],
    ["pound force", "lbf", null, "force", false, true, 4.4482216152605],
    ["pound mass", "lbm", null, "mass", false, true, 0.45359237],
    ["quart", "qt", null, "volume", false, true, 0.000946352946],
    ["radian", "rad", null, "angle", true, false, 1],
    ["second", "?", null, "angle", false, false, 0.00000484813681109536],
    ["second", "s", ["sec"], "time", true, true, 1],
    ["short hundredweight", "cwt", ["shweight"], "mass", false, true, 45.359237],
    ["siemens", "S", null, "electrical_conductance", true, false, 1],
    ["sievert", "Sv", null, "equivalent_dose", true, false, 1],
    ["slug", "sg", null, "mass", false, true, 14.59390294],
    ["square ångström", "ang2", ["ang^2"], "area", false, true, 1e-20],
    ["square foot", "ft2", ["ft^2"], "area", false, true, 0.09290304],
    ["square inch", "in2", ["in^2"], "area", false, true, 0.00064516],
    ["square light-year", "ly2", ["ly^2"], "area", false, true, 8.95054210748189e+31],
    ["square meter", "m?", null, "area", true, true, 1],
    ["square mile", "mi2", ["mi^2"], "area", false, true, 2589988.110336],
    ["square nautical mile", "Nmi2", ["Nmi^2"], "area", false, true, 3429904],
    ["square Pica", "Pica2", ["Picapt2", "Pica^2", "Picapt^2"], "area", false, true, 0.00001792111111111],
    ["square yard", "yd2", ["yd^2"], "area", false, true, 0.83612736],
    ["statute mile", "mi", null, "length", false, true, 1609.344],
    ["steradian", "sr", null, "solid_angle", true, false, 1],
    ["stilb", "sb", null, "luminance", false, false, 0.0001],
    ["stokes", "St", null, "kinematic_viscosity", false, false, 0.0001],
    ["stone", "stone", null, "mass", false, true, 6.35029318],
    ["tablespoon", "tbs", null, "volume", false, true, 0.0000147868],
    ["teaspoon", "tsp", null, "volume", false, true, 0.00000492892],
    ["tesla", "T", null, "magnetic_flux_density", true, true, 1],
    ["thermodynamic calorie", "c", null, "energy", false, true, 4.184],
    ["ton", "ton", null, "mass", false, true, 907.18474],
    ["tonne", "t", null, "mass", false, false, 1000],
    ["U.K. pint", "uk_pt", null, "volume", false, true, 0.00056826125],
    ["U.S. bushel", "bushel", null, "volume", false, true, 0.03523907],
    ["U.S. oil barrel", "barrel", null, "volume", false, true, 0.158987295],
    ["U.S. pint", "pt", ["us_pt"], "volume", false, true, 0.000473176473],
    ["U.S. survey mile", "survey_mi", null, "length", false, true, 1609.347219],
    ["U.S. survey/statute acre", "us_acre", null, "area", false, true, 4046.87261],
    ["volt", "V", null, "voltage", true, false, 1],
    ["watt", "W", null, "power", true, true, 1],
    ["watt-hour", "Wh", ["wh"], "energy", false, true, 3600],
    ["weber", "Wb", null, "magnetic_flux", true, false, 1],
    ["yard", "yd", null, "length", false, true, 0.9144],
    ["year", "yr", null, "time", false, true, 31557600]
  ];

  // Binary prefixes
  // [Name, Prefix power of 2 value, Previx value, Abbreviation, Derived from]
  var binary_prefixes = {
    Yi: ["yobi", 80, 1208925819614629174706176, "Yi", "yotta"],
    Zi: ["zebi", 70, 1180591620717411303424, "Zi", "zetta"],
    Ei: ["exbi", 60, 1152921504606846976, "Ei", "exa"],
    Pi: ["pebi", 50, 1125899906842624, "Pi", "peta"],
    Ti: ["tebi", 40, 1099511627776, "Ti", "tera"],
    Gi: ["gibi", 30, 1073741824, "Gi", "giga"],
    Mi: ["mebi", 20, 1048576, "Mi", "mega"],
    ki: ["kibi", 10, 1024, "ki", "kilo"]
  };

  // Unit prefixes
  // [Name, Multiplier, Abbreviation]
  var unit_prefixes = {
    Y: ["yotta", 1e+24, "Y"],
    Z: ["zetta", 1e+21, "Z"],
    E: ["exa", 1e+18, "E"],
    P: ["peta", 1e+15, "P"],
    T: ["tera", 1e+12, "T"],
    G: ["giga", 1e+09, "G"],
    M: ["mega", 1e+06, "M"],
    k: ["kilo", 1e+03, "k"],
    h: ["hecto", 1e+02, "h"],
    e: ["dekao", 1e+01, "e"],
    d: ["deci", 1e-01, "d"],
    c: ["centi", 1e-02, "c"],
    m: ["milli", 1e-03, "m"],
    u: ["micro", 1e-06, "u"],
    n: ["nano", 1e-09, "n"],
    p: ["pico", 1e-12, "p"],
    f: ["femto", 1e-15, "f"],
    a: ["atto", 1e-18, "a"],
    z: ["zepto", 1e-21, "z"],
    y: ["yocto", 1e-24, "y"]
  };

  // Initialize units and multipliers
  var from = null;
  var to = null;
  var base_from_unit = from_unit;
  var base_to_unit = to_unit;
  var from_multiplier = 1;
  var to_multiplier = 1;
  var alt;

  // Lookup from and to units
  for (var i = 0; i < units.length; i++) {
    alt = (units[i][2] === null) ? [] : units[i][2];
    if (units[i][1] === base_from_unit || alt.indexOf(base_from_unit) >= 0) {
      from = units[i];
    }
    if (units[i][1] === base_to_unit || alt.indexOf(base_to_unit) >= 0) {
      to = units[i];
    }
  }

  // Lookup from prefix
  if (from === null) {
    var from_binary_prefix = binary_prefixes[from_unit.substring(0, 2)];
    var from_unit_prefix = unit_prefixes[from_unit.substring(0, 1)];

    // Handle dekao unit prefix (only unit prefix with two characters)
    if (from_unit.substring(0, 2) === 'da') {
      from_unit_prefix = ["dekao", 1e+01, "da"];
    }

    // Handle binary prefixes first (so that 'Yi' is processed before 'Y')
    if (from_binary_prefix) {
      from_multiplier = from_binary_prefix[2];
      base_from_unit = from_unit.substring(2);
    } else if (from_unit_prefix) {
      from_multiplier = from_unit_prefix[1];
      base_from_unit = from_unit.substring(from_unit_prefix[2].length);
    }

    // Lookup from unit
    for (var j = 0; j < units.length; j++) {
      alt = (units[j][2] === null) ? [] : units[j][2];
      if (units[j][1] === base_from_unit || alt.indexOf(base_from_unit) >= 0) {
        from = units[j];
      }
    }
  }

  // Lookup to prefix
  if (to === null) {
    var to_binary_prefix = binary_prefixes[to_unit.substring(0, 2)];
    var to_unit_prefix = unit_prefixes[to_unit.substring(0, 1)];

    // Handle dekao unit prefix (only unit prefix with two characters)
    if (to_unit.substring(0, 2) === 'da') {
      to_unit_prefix = ["dekao", 1e+01, "da"];
    }

    // Handle binary prefixes first (so that 'Yi' is processed before 'Y')
    if (to_binary_prefix) {
      to_multiplier = to_binary_prefix[2];
      base_to_unit = to_unit.substring(2);
    } else if (to_unit_prefix) {
      to_multiplier = to_unit_prefix[1];
      base_to_unit = to_unit.substring(to_unit_prefix[2].length);
    }

    // Lookup to unit
    for (var k = 0; k < units.length; k++) {
      alt = (units[k][2] === null) ? [] : units[k][2];
      if (units[k][1] === base_to_unit || alt.indexOf(base_to_unit) >= 0) {
        to = units[k];
      }
    }
  }

  // Return error if a unit does not exist
  if (from === null || to === null) {
    return error.na;
  }

  // Return error if units represent different quantities
  if (from[3] !== to[3]) {
    return error.na;
  }

  // Return converted number
  return number * from[6] * from_multiplier / (to[6] * to_multiplier);
};

exports.DEC2BIN = function(number, places) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }

  // Return error if number is not decimal, is lower than -512, or is greater than 511
  if (!/^-?[0-9]{1,3}$/.test(number) || number < -512 || number > 511) {
    return error.num;
  }

  // Ignore places and return a 10-character binary number if number is negative
  if (number < 0) {
    return '1' + text.REPT('0', 9 - (512 + number).toString(2).length) + (512 + number).toString(2);
  }

  // Convert decimal number to binary
  var result = parseInt(number, 10).toString(2);

  // Return binary number using the minimum number of characters necessary if places is undefined
  if (typeof places === 'undefined') {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.DEC2HEX = function(number, places) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }

  // Return error if number is not decimal, is lower than -549755813888, or is greater than 549755813887
  if (!/^-?[0-9]{1,12}$/.test(number) || number < -549755813888 || number > 549755813887) {
    return error.num;
  }

  // Ignore places and return a 10-character hexadecimal number if number is negative
  if (number < 0) {
    return (1099511627776 + number).toString(16);
  }

  // Convert decimal number to hexadecimal
  var result = parseInt(number, 10).toString(16);

  // Return hexadecimal number using the minimum number of characters necessary if places is undefined
  if (typeof places === 'undefined') {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.DEC2OCT = function(number, places) {
  number = utils.parseNumber(number);
  if (number instanceof Error) {
    return number;
  }

  // Return error if number is not decimal, is lower than -549755813888, or is greater than 549755813887
  if (!/^-?[0-9]{1,9}$/.test(number) || number < -536870912 || number > 536870911) {
    return error.num;
  }

  // Ignore places and return a 10-character octal number if number is negative
  if (number < 0) {
    return (1073741824 + number).toString(8);
  }

  // Convert decimal number to octal
  var result = parseInt(number, 10).toString(8);

  // Return octal number using the minimum number of characters necessary if places is undefined
  if (typeof places === 'undefined') {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.DELTA = function(number1, number2) {
  // Set number2 to zero if undefined
  number2 = (number2 === undefined) ? 0 : number2;
  number1 = utils.parseNumber(number1);
  number2 = utils.parseNumber(number2);
  if (utils.anyIsError(number1, number2)) {
    return error.value;
  }

  // Return delta
  return (number1 === number2) ? 1 : 0;
};

// TODO: why is upper_bound not used ? The excel documentation has no examples with upper_bound
exports.ERF = function(lower_bound, upper_bound) {
  // Set number2 to zero if undefined
  upper_bound = (upper_bound === undefined) ? 0 : upper_bound;

  lower_bound = utils.parseNumber(lower_bound);
  upper_bound = utils.parseNumber(upper_bound);
  if (utils.anyIsError(lower_bound, upper_bound)) {
    return error.value;
  }

  return jStat.erf(lower_bound);
};

// TODO
exports.ERF.PRECISE = function() {
  throw new Error('ERF.PRECISE is not implemented');
};

exports.ERFC = function(x) {
  // Return error if x is not a number
  if (isNaN(x)) {
    return error.value;
  }

  return jStat.erfc(x);
};

// TODO
exports.ERFC.PRECISE = function() {
  throw new Error('ERFC.PRECISE is not implemented');
};

exports.GESTEP = function(number, step) {
  step = step || 0;
  number = utils.parseNumber(number);
  if (utils.anyIsError(step, number)) {
    return number;
  }

  // Return delta
  return (number >= step) ? 1 : 0;
};

exports.HEX2BIN = function(number, places) {
  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
  if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
    return error.num;
  }

  // Check if number is negative
  var negative = (number.length === 10 && number.substring(0, 1).toLowerCase() === 'f') ? true : false;

  // Convert hexadecimal number to decimal
  var decimal = (negative) ? parseInt(number, 16) - 1099511627776 : parseInt(number, 16);

  // Return error if number is lower than -512 or greater than 511
  if (decimal < -512 || decimal > 511) {
    return error.num;
  }

  // Ignore places and return a 10-character binary number if number is negative
  if (negative) {
    return '1' + text.REPT('0', 9 - (512 + decimal).toString(2).length) + (512 + decimal).toString(2);
  }

  // Convert decimal number to binary
  var result = decimal.toString(2);

  // Return binary number using the minimum number of characters necessary if places is undefined
  if (places === undefined) {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.HEX2DEC = function(number) {
  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
  if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
    return error.num;
  }

  // Convert hexadecimal number to decimal
  var decimal = parseInt(number, 16);

  // Return decimal number
  return (decimal >= 549755813888) ? decimal - 1099511627776 : decimal;
};

exports.HEX2OCT = function(number, places) {
  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
  if (!/^[0-9A-Fa-f]{1,10}$/.test(number)) {
    return error.num;
  }

  // Convert hexadecimal number to decimal
  var decimal = parseInt(number, 16);

  // Return error if number is positive and greater than 0x1fffffff (536870911)
  if (decimal > 536870911 && decimal < 1098974756864) {
    return error.num;
  }

  // Ignore places and return a 10-character octal number if number is negative
  if (decimal >= 1098974756864) {
    return (decimal - 1098437885952).toString(8);
  }

  // Convert decimal number to octal
  var result = decimal.toString(8);

  // Return octal number using the minimum number of characters necessary if places is undefined
  if (places === undefined) {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.IMABS = function(inumber) {
  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  // Return error if either coefficient is not a number
  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Return absolute value of complex number
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
};

exports.IMAGINARY = function(inumber) {
  if (inumber === undefined || inumber === true || inumber === false) {
    return error.value;
  }

  // Return 0 if inumber is equal to 0
  if (inumber === 0 || inumber === '0') {
    return 0;
  }

  // Handle special cases
  if (['i', 'j'].indexOf(inumber) >= 0) {
    return 1;
  }

  // Normalize imaginary coefficient
  inumber = inumber.replace('+i', '+1i').replace('-i', '-1i').replace('+j', '+1j').replace('-j', '-1j');

  // Lookup sign
  var plus = inumber.indexOf('+');
  var minus = inumber.indexOf('-');
  if (plus === 0) {
    plus = inumber.indexOf('+', 1);
  }

  if (minus === 0) {
    minus = inumber.indexOf('-', 1);
  }

  // Lookup imaginary unit
  var last = inumber.substring(inumber.length - 1, inumber.length);
  var unit = (last === 'i' || last === 'j');

  if (plus >= 0 || minus >= 0) {
    // Return error if imaginary unit is neither i nor j
    if (!unit) {
      return error.num;
    }

    // Return imaginary coefficient of complex number
    if (plus >= 0) {
      return (isNaN(inumber.substring(0, plus)) || isNaN(inumber.substring(plus + 1, inumber.length - 1))) ?
        error.num :
        Number(inumber.substring(plus + 1, inumber.length - 1));
    } else {
      return (isNaN(inumber.substring(0, minus)) || isNaN(inumber.substring(minus + 1, inumber.length - 1))) ?
        error.num :
        -Number(inumber.substring(minus + 1, inumber.length - 1));
    }
  } else {
    if (unit) {
      return (isNaN(inumber.substring(0, inumber.length - 1))) ? error.num : inumber.substring(0, inumber.length - 1);
    } else {
      return (isNaN(inumber)) ? error.num : 0;
    }
  }
};

exports.IMARGUMENT = function(inumber) {
  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  // Return error if either coefficient is not a number
  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Return error if inumber is equal to zero
  if (x === 0 && y === 0) {
    return error.div0;
  }

  // Return PI/2 if x is equal to zero and y is positive
  if (x === 0 && y > 0) {
    return Math.PI / 2;
  }

  // Return -PI/2 if x is equal to zero and y is negative
  if (x === 0 && y < 0) {
    return -Math.PI / 2;
  }

  // Return zero if x is negative and y is equal to zero
  if (y === 0 && x > 0) {
    return 0;
  }

  // Return zero if x is negative and y is equal to zero
  if (y === 0 && x < 0) {
    return -Math.PI;
  }

  // Return argument of complex number
  if (x > 0) {
    return Math.atan(y / x);
  } else if (x < 0 && y >= 0) {
    return Math.atan(y / x) + Math.PI;
  } else {
    return Math.atan(y / x) - Math.PI;
  }
};

exports.IMCONJUGATE = function(inumber) {
  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return conjugate of complex number
  return (y !== 0) ? exports.COMPLEX(x, -y, unit) : inumber;
};

exports.IMCOS = function(inumber) {
  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return cosine of complex number
  return exports.COMPLEX(Math.cos(x) * (Math.exp(y) + Math.exp(-y)) / 2, -Math.sin(x) * (Math.exp(y) - Math.exp(-y)) / 2, unit);
};

exports.IMCOSH = function(inumber) {
  // Lookup real and imaginary coefficients using exports.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return hyperbolic cosine of complex number
  return exports.COMPLEX(Math.cos(y) * (Math.exp(x) + Math.exp(-x)) / 2, Math.sin(y) * (Math.exp(x) - Math.exp(-x)) / 2, unit);
};

exports.IMCOT = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Return cotangent of complex number
  return exports.IMDIV(exports.IMCOS(inumber), exports.IMSIN(inumber));
};

exports.IMDIV = function(inumber1, inumber2) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var a = exports.IMREAL(inumber1);
  var b = exports.IMAGINARY(inumber1);
  var c = exports.IMREAL(inumber2);
  var d = exports.IMAGINARY(inumber2);

  if (utils.anyIsError(a, b, c, d)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit1 = inumber1.substring(inumber1.length - 1);
  var unit2 = inumber2.substring(inumber2.length - 1);
  var unit = 'i';
  if (unit1 === 'j') {
    unit = 'j';
  } else if (unit2 === 'j') {
    unit = 'j';
  }

  // Return error if inumber2 is null
  if (c === 0 && d === 0) {
    return error.num;
  }

  // Return exponential of complex number
  var den = c * c + d * d;
  return exports.COMPLEX((a * c + b * d) / den, (b * c - a * d) / den, unit);
};

exports.IMEXP = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return exponential of complex number
  var e = Math.exp(x);
  return exports.COMPLEX(e * Math.cos(y), e * Math.sin(y), unit);
};

exports.IMLN = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return exponential of complex number
  return exports.COMPLEX(Math.log(Math.sqrt(x * x + y * y)), Math.atan(y / x), unit);
};

exports.IMLOG10 = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return exponential of complex number
  return exports.COMPLEX(Math.log(Math.sqrt(x * x + y * y)) / Math.log(10), Math.atan(y / x) / Math.log(10), unit);
};

exports.IMLOG2 = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return exponential of complex number
  return exports.COMPLEX(Math.log(Math.sqrt(x * x + y * y)) / Math.log(2), Math.atan(y / x) / Math.log(2), unit);
};

exports.IMPOWER = function(inumber, number) {
  number = utils.parseNumber(number);
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);
  if (utils.anyIsError(number, x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Calculate power of modulus
  var p = Math.pow(exports.IMABS(inumber), number);

  // Calculate argument
  var t = exports.IMARGUMENT(inumber);

  // Return exponential of complex number
  return exports.COMPLEX(p * Math.cos(number * t), p * Math.sin(number * t), unit);
};

exports.IMPRODUCT = function() {
  // Initialize result
  var result = arguments[0];

  if (!arguments.length) {
    return error.value;
  }

  // Loop on all numbers
  for (var i = 1; i < arguments.length; i++) {
    // Lookup coefficients of two complex numbers
    var a = exports.IMREAL(result);
    var b = exports.IMAGINARY(result);
    var c = exports.IMREAL(arguments[i]);
    var d = exports.IMAGINARY(arguments[i]);

    if (utils.anyIsError(a, b, c, d)) {
      return error.value;
    }

    // Complute product of two complex numbers
    result = exports.COMPLEX(a * c - b * d, a * d + b * c);
  }

  // Return product of complex numbers
  return result;
};

exports.IMREAL = function(inumber) {
  if (inumber === undefined || inumber === true || inumber === false) {
    return error.value;
  }

  // Return 0 if inumber is equal to 0
  if (inumber === 0 || inumber === '0') {
    return 0;
  }

  // Handle special cases
  if (['i', '+i', '1i', '+1i', '-i', '-1i', 'j', '+j', '1j', '+1j', '-j', '-1j'].indexOf(inumber) >= 0) {
    return 0;
  }

  // Lookup sign
  var plus = inumber.indexOf('+');
  var minus = inumber.indexOf('-');
  if (plus === 0) {
    plus = inumber.indexOf('+', 1);
  }
  if (minus === 0) {
    minus = inumber.indexOf('-', 1);
  }

  // Lookup imaginary unit
  var last = inumber.substring(inumber.length - 1, inumber.length);
  var unit = (last === 'i' || last === 'j');

  if (plus >= 0 || minus >= 0) {
    // Return error if imaginary unit is neither i nor j
    if (!unit) {
      return error.num;
    }

    // Return real coefficient of complex number
    if (plus >= 0) {
      return (isNaN(inumber.substring(0, plus)) || isNaN(inumber.substring(plus + 1, inumber.length - 1))) ?
        error.num :
        Number(inumber.substring(0, plus));
    } else {
      return (isNaN(inumber.substring(0, minus)) || isNaN(inumber.substring(minus + 1, inumber.length - 1))) ?
        error.num :
        Number(inumber.substring(0, minus));
    }
  } else {
    if (unit) {
      return (isNaN(inumber.substring(0, inumber.length - 1))) ? error.num : 0;
    } else {
      return (isNaN(inumber)) ? error.num : inumber;
    }
  }
};

exports.IMSEC = function(inumber) {
  // Return error if inumber is a logical value
  if (inumber === true || inumber === false) {
    return error.value;
  }

  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Return secant of complex number
  return exports.IMDIV('1', exports.IMCOS(inumber));
};

exports.IMSECH = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Return hyperbolic secant of complex number
  return exports.IMDIV('1', exports.IMCOSH(inumber));
};

exports.IMSIN = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return sine of complex number
  return exports.COMPLEX(Math.sin(x) * (Math.exp(y) + Math.exp(-y)) / 2, Math.cos(x) * (Math.exp(y) - Math.exp(-y)) / 2, unit);
};

exports.IMSINH = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Return hyperbolic sine of complex number
  return exports.COMPLEX(Math.cos(y) * (Math.exp(x) - Math.exp(-x)) / 2, Math.sin(y) * (Math.exp(x) + Math.exp(-x)) / 2, unit);
};

exports.IMSQRT = function(inumber) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit = inumber.substring(inumber.length - 1);
  unit = (unit === 'i' || unit === 'j') ? unit : 'i';

  // Calculate power of modulus
  var s = Math.sqrt(exports.IMABS(inumber));

  // Calculate argument
  var t = exports.IMARGUMENT(inumber);

  // Return exponential of complex number
  return exports.COMPLEX(s * Math.cos(t / 2), s * Math.sin(t / 2), unit);
};

exports.IMCSC = function (inumber) {
  // Return error if inumber is a logical value
  if (inumber === true || inumber === false) {
    return error.value;
  }

  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  // Return error if either coefficient is not a number
  if (utils.anyIsError(x, y)) {
    return error.num;
  }

  // Return cosecant of complex number
  return exports.IMDIV('1', exports.IMSIN(inumber));
};

exports.IMCSCH = function (inumber) {
  // Return error if inumber is a logical value
  if (inumber === true || inumber === false) {
    return error.value;
  }

  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  // Return error if either coefficient is not a number
  if (utils.anyIsError(x, y)) {
    return error.num;
  }

  // Return hyperbolic cosecant of complex number
  return exports.IMDIV('1', exports.IMSINH(inumber));
};

exports.IMSUB = function(inumber1, inumber2) {
  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var a = this.IMREAL(inumber1);
  var b = this.IMAGINARY(inumber1);
  var c = this.IMREAL(inumber2);
  var d = this.IMAGINARY(inumber2);

  if (utils.anyIsError(a, b, c, d)) {
    return error.value;
  }

  // Lookup imaginary unit
  var unit1 = inumber1.substring(inumber1.length - 1);
  var unit2 = inumber2.substring(inumber2.length - 1);
  var unit = 'i';
  if (unit1 === 'j') {
    unit = 'j';
  } else if (unit2 === 'j') {
    unit = 'j';
  }

  // Return _ of two complex numbers
  return this.COMPLEX(a - c, b - d, unit);
};

exports.IMSUM = function() {
  if (!arguments.length) {
    return error.value;
  }
  var args = utils.flatten(arguments);

  // Initialize result
  var result = args[0];

  // Loop on all numbers
  for (var i = 1; i < args.length; i++) {
    // Lookup coefficients of two complex numbers
    var a = this.IMREAL(result);
    var b = this.IMAGINARY(result);
    var c = this.IMREAL(args[i]);
    var d = this.IMAGINARY(args[i]);

    if (utils.anyIsError(a, b, c, d)) {
      return error.value;
    }

    // Complute product of two complex numbers
    result = this.COMPLEX(a + c, b + d);
  }

  // Return sum of complex numbers
  return result;
};

exports.IMTAN = function(inumber) {
  // Return error if inumber is a logical value
  if (inumber === true || inumber === false) {
    return error.value;
  }

  // Lookup real and imaginary coefficients using Formula.js [http://formulajs.org]
  var x = exports.IMREAL(inumber);
  var y = exports.IMAGINARY(inumber);

  if (utils.anyIsError(x, y)) {
    return error.value;
  }

  // Return tangent of complex number
  return this.IMDIV(this.IMSIN(inumber), this.IMCOS(inumber));
};

exports.OCT2BIN = function(number, places) {
  // Return error if number is not hexadecimal or contains more than ten characters (10 digits)
  if (!/^[0-7]{1,10}$/.test(number)) {
    return error.num;
  }

  // Check if number is negative
  var negative = (number.length === 10 && number.substring(0, 1) === '7') ? true : false;

  // Convert octal number to decimal
  var decimal = (negative) ? parseInt(number, 8) - 1073741824 : parseInt(number, 8);

  // Return error if number is lower than -512 or greater than 511
  if (decimal < -512 || decimal > 511) {
    return error.num;
  }

  // Ignore places and return a 10-character binary number if number is negative
  if (negative) {
    return '1' + text.REPT('0', 9 - (512 + decimal).toString(2).length) + (512 + decimal).toString(2);
  }

  // Convert decimal number to binary
  var result = decimal.toString(2);

  // Return binary number using the minimum number of characters necessary if places is undefined
  if (typeof places === 'undefined') {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};

exports.OCT2DEC = function(number) {
  // Return error if number is not octal or contains more than ten characters (10 digits)
  if (!/^[0-7]{1,10}$/.test(number)) {
    return error.num;
  }

  // Convert octal number to decimal
  var decimal = parseInt(number, 8);

  // Return decimal number
  return (decimal >= 536870912) ? decimal - 1073741824 : decimal;
};

exports.OCT2HEX = function(number, places) {
  // Return error if number is not octal or contains more than ten characters (10 digits)
  if (!/^[0-7]{1,10}$/.test(number)) {
    return error.num;
  }

  // Convert octal number to decimal
  var decimal = parseInt(number, 8);

  // Ignore places and return a 10-character octal number if number is negative
  if (decimal >= 536870912) {
    return 'ff' + (decimal + 3221225472).toString(16);
  }

  // Convert decimal number to hexadecimal
  var result = decimal.toString(16);

  // Return hexadecimal number using the minimum number of characters necessary if places is undefined
  if (places === undefined) {
    return result;
  } else {
    // Return error if places is nonnumeric
    if (isNaN(places)) {
      return error.value;
    }

    // Return error if places is negative
    if (places < 0) {
      return error.num;
    }

    // Truncate places in case it is not an integer
    places = Math.floor(places);

    // Pad return value with leading 0s (zeros) if necessary (using Underscore.string)
    return (places >= result.length) ? text.REPT('0', places - result.length) + result : error.num;
  }
};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var SUPPORTED_FORMULAS = ['ABS', 'ACCRINT', 'ACOS', 'ACOSH', 'ACOT', 'ACOTH', 'ADD', 'AGGREGATE', 'AND', 'ARABIC', 'ARGS2ARRAY', 'ASIN', 'ASINH', 'ATAN', 'ATAN2', 'ATANH', 'AVEDEV', 'AVERAGE', 'AVERAGEA', 'AVERAGEIF', 'AVERAGEIFS', 'BASE', 'BESSELI', 'BESSELJ', 'BESSELK', 'BESSELY', 'BETA.DIST', 'BETA.INV', 'BETADIST', 'BETAINV', 'BIN2DEC', 'BIN2HEX', 'BIN2OCT', 'BINOM.DIST', 'BINOM.DIST.RANGE', 'BINOM.INV', 'BINOMDIST', 'BITAND', 'BITLSHIFT', 'BITOR', 'BITRSHIFT', 'BITXOR', 'CEILING', 'CEILINGMATH', 'CEILINGPRECISE', 'CHAR', 'CHISQ.DIST', 'CHISQ.DIST.RT', 'CHISQ.INV', 'CHISQ.INV.RT', 'CHOOSE', 'CHOOSE', 'CLEAN', 'CODE', 'COLUMN', 'COLUMNS', 'COMBIN', 'COMBINA', 'COMPLEX', 'CONCATENATE', 'CONFIDENCE', 'CONFIDENCE.NORM', 'CONFIDENCE.T', 'CONVERT', 'CORREL', 'COS', 'COSH', 'COT', 'COTH', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF', 'COUNTIFS', 'COUNTIN', 'COUNTUNIQUE', 'COVARIANCE.P', 'COVARIANCE.S', 'CSC', 'CSCH', 'CUMIPMT', 'CUMPRINC', 'DATE', 'DATEVALUE', 'DAY', 'DAYS', 'DAYS360', 'DB', 'DDB', 'DEC2BIN', 'DEC2HEX', 'DEC2OCT', 'DECIMAL', 'DEGREES', 'DELTA', 'DEVSQ', 'DIVIDE', 'DOLLAR', 'DOLLARDE', 'DOLLARFR', 'E', 'EDATE', 'EFFECT', 'EOMONTH', 'EQ', 'ERF', 'ERFC', 'EVEN', 'EXACT', 'EXP', 'EXPON.DIST', 'EXPONDIST', 'F.DIST', 'F.DIST.RT', 'F.INV', 'F.INV.RT', 'FACT', 'FACTDOUBLE', 'FALSE', 'FDIST', 'FDISTRT', 'FIND', 'FINV', 'FINVRT', 'FISHER', 'FISHERINV', 'FIXED', 'FLATTEN', 'FLOOR', 'FORECAST', 'FREQUENCY', 'FV', 'FVSCHEDULE', 'GAMMA', 'GAMMA.DIST', 'GAMMA.INV', 'GAMMADIST', 'GAMMAINV', 'GAMMALN', 'GAMMALN.PRECISE', 'GAUSS', 'GCD', 'GEOMEAN', 'GESTEP', 'GROWTH', 'GTE', 'HARMEAN', 'HEX2BIN', 'HEX2DEC', 'HEX2OCT', 'HOUR', 'HTML2TEXT', 'HYPGEOM.DIST', 'HYPGEOMDIST', 'IF', 'IMABS', 'IMAGINARY', 'IMARGUMENT', 'IMCONJUGATE', 'IMCOS', 'IMCOSH', 'IMCOT', 'IMCSC', 'IMCSCH', 'IMDIV', 'IMEXP', 'IMLN', 'IMLOG10', 'IMLOG2', 'IMPOWER', 'IMPRODUCT', 'IMREAL', 'IMSEC', 'IMSECH', 'IMSIN', 'IMSINH', 'IMSQRT', 'IMSUB', 'IMSUM', 'IMTAN', 'INT', 'INTERCEPT', 'INTERVAL', 'IPMT', 'IRR', 'ISBINARY', 'ISBLANK', 'ISEVEN', 'ISLOGICAL', 'ISNONTEXT', 'ISNUMBER', 'ISODD', 'ISODD', 'ISOWEEKNUM', 'ISPMT', 'ISTEXT', 'JOIN', 'KURT', 'LARGE', 'LCM', 'LEFT', 'LEN', 'LINEST', 'LN', 'LOG', 'LOG10', 'LOGEST', 'LOGNORM.DIST', 'LOGNORM.INV', 'LOGNORMDIST', 'LOGNORMINV', 'LOWER', 'LT', 'LTE', 'MATCH', 'MAX', 'MAXA', 'MEDIAN', 'MID', 'MIN', 'MINA', 'MINUS', 'MINUTE', 'MIRR', 'MOD', 'MODE.MULT', 'MODE.SNGL', 'MODEMULT', 'MODESNGL', 'MONTH', 'MROUND', 'MULTINOMIAL', 'MULTIPLY', 'NE', 'NEGBINOM.DIST', 'NEGBINOMDIST', 'NETWORKDAYS', 'NOMINAL', 'NORM.DIST', 'NORM.INV', 'NORM.S.DIST', 'NORM.S.INV', 'NORMDIST', 'NORMINV', 'NORMSDIST', 'NORMSINV', 'NOT', 'NOW', 'NPER', 'NPV', 'NUMBERS', 'NUMERAL', 'OCT2BIN', 'OCT2DEC', 'OCT2HEX', 'ODD', 'OR', 'PDURATION', 'PEARSON', 'PERCENTILEEXC', 'PERCENTILEINC', 'PERCENTRANKEXC', 'PERCENTRANKINC', 'PERMUT', 'PERMUTATIONA', 'PHI', 'PI', 'PMT', 'POISSON.DIST', 'POISSONDIST', 'POW', 'POWER', 'PPMT', 'PROB', 'PRODUCT', 'PROPER', 'PV', 'QUARTILE.EXC', 'QUARTILE.INC', 'QUARTILEEXC', 'QUARTILEINC', 'QUOTIENT', 'RADIANS', 'RAND', 'RANDBETWEEN', 'RANK.AVG', 'RANK.EQ', 'RANKAVG', 'RANKEQ', 'RATE', 'REFERENCE', 'REGEXEXTRACT', 'REGEXMATCH', 'REGEXREPLACE', 'REPLACE', 'REPT', 'RIGHT', 'ROMAN', 'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'ROW', 'ROWS', 'RRI', 'RSQ', 'SEARCH', 'SEC', 'SECH', 'SECOND', 'SERIESSUM', 'SIGN', 'SIN', 'SINH', 'SKEW', 'SKEW.P', 'SKEWP', 'SLN', 'SLOPE', 'SMALL', 'SPLIT', 'SPLIT', 'SQRT', 'SQRTPI', 'STANDARDIZE', 'STDEV.P', 'STDEV.S', 'STDEVA', 'STDEVP', 'STDEVPA', 'STDEVS', 'STEYX', 'SUBSTITUTE', 'SUBTOTAL', 'SUM', 'SUMIF', 'SUMIFS', 'SUMPRODUCT', 'SUMSQ', 'SUMX2MY2', 'SUMX2PY2', 'SUMXMY2', 'SWITCH', 'SYD', 'T', 'T.DIST', 'T.DIST.2T', 'T.DIST.RT', 'T.INV', 'T.INV.2T', 'TAN', 'TANH', 'TBILLEQ', 'TBILLPRICE', 'TBILLYIELD', 'TDIST', 'TDIST2T', 'TDISTRT', 'TEXT', 'TIME', 'TIMEVALUE', 'TINV', 'TINV2T', 'TODAY', 'TRANSPOSE', 'TREND', 'TRIM', 'TRIMMEAN', 'TRUE', 'TRUNC', 'UNICHAR', 'UNICODE', 'UNIQUE', 'UPPER', 'VALUE', 'VAR.P', 'VAR.S', 'VARA', 'VARP', 'VARPA', 'VARS', 'WEEKDAY', 'WEEKNUM', 'WEIBULL.DIST', 'WEIBULLDIST', 'WORKDAY', 'XIRR', 'XNPV', 'XOR', 'YEAR', 'YEARFRAC'];

exports['default'] = SUPPORTED_FORMULAS;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.rowLabelToIndex = rowLabelToIndex;
exports.rowIndexToLabel = rowIndexToLabel;
exports.columnLabelToIndex = columnLabelToIndex;
exports.columnIndexToLabel = columnIndexToLabel;
exports.extractLabel = extractLabel;
exports.toLabel = toLabel;
/**
 * Convert row label to index.
 *
 * @param {String} label Row label (eq. '1', '5')
 * @returns {Number} Returns -1 if label is not recognized otherwise proper row index.
 */
function rowLabelToIndex(label) {
  var result = parseInt(label, 10);

  if (isNaN(result)) {
    result = -1;
  } else {
    result = Math.max(result - 1, -1);
  }

  return result;
}

/**
 * Convert row index to label.
 *
 * @param {Number} row Row index.
 * @returns {String} Returns row label (eq. '1', '7').
 */
function rowIndexToLabel(row) {
  var result = '';

  if (row >= 0) {
    result = '' + (row + 1);
  }

  return result;
}

var COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Convert column label to index.
 *
 * @param {String} label Column label (eq. 'ABB', 'CNQ')
 * @returns {Number} Returns -1 if label is not recognized otherwise proper column index.
 */
function columnLabelToIndex(label) {
  var result = 0;

  if (typeof label === 'string') {
    label = label.toUpperCase();

    for (var i = 0, j = label.length - 1; i < label.length; i += 1, j -= 1) {
      result += Math.pow(COLUMN_LABEL_BASE_LENGTH, j) * (COLUMN_LABEL_BASE.indexOf(label[i]) + 1);
    }
  }
  --result;

  return result;
}

/**
 * Convert column index to label.
 *
 * @param {Number} column Column index.
 * @returns {String} Returns column label (eq. 'ABB', 'CNQ').
 */
function columnIndexToLabel(column) {
  var result = '';

  while (column >= 0) {
    result = String.fromCharCode(column % COLUMN_LABEL_BASE_LENGTH + 97) + result;
    column = Math.floor(column / COLUMN_LABEL_BASE_LENGTH) - 1;
  }

  return result.toUpperCase();
}

var LABEL_EXTRACT_REGEXP = /^([$])?([A-Za-z]+)([$])?([0-9]+)$/;

/**
 * Extract cell coordinates.
 *
 * @param {String} label Cell coordinates (eq. 'A1', '$B6', '$N$98').
 * @returns {Array} Returns an array of objects.
 */
function extractLabel(label) {
  if (typeof label !== 'string' || !LABEL_EXTRACT_REGEXP.test(label)) {
    return [];
  }

  var _label$toUpperCase$ma = label.toUpperCase().match(LABEL_EXTRACT_REGEXP),
      columnAbs = _label$toUpperCase$ma[1],
      column = _label$toUpperCase$ma[2],
      rowAbs = _label$toUpperCase$ma[3],
      row = _label$toUpperCase$ma[4];

  return [{
    index: rowLabelToIndex(row),
    label: row,
    isAbsolute: rowAbs === '$'
  }, {
    index: columnLabelToIndex(column),
    label: column,
    isAbsolute: columnAbs === '$'
  }];
}

/**
 * Convert row and column indexes into cell label.
 *
 * @param {Object} row Object with `index` and `isAbsolute` properties.
 * @param {Object} column Object with `index` and `isAbsolute` properties.
 * @returns {String} Returns cell label.
 */
function toLabel(row, column) {
  var rowLabel = (row.isAbsolute ? '$' : '') + rowIndexToLabel(row.index);
  var columnLabel = (column.isAbsolute ? '$' : '') + columnIndexToLabel(column.index);

  return columnLabel + rowLabel;
}

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.rowLabelToIndex = exports.rowIndexToLabel = exports.columnLabelToIndex = exports.columnIndexToLabel = exports.toLabel = exports.extractLabel = exports.error = exports.Parser = exports.ERROR_VALUE = exports.ERROR_REF = exports.ERROR_NUM = exports.ERROR_NULL = exports.ERROR_NOT_AVAILABLE = exports.ERROR_NAME = exports.ERROR_DIV_ZERO = exports.ERROR = exports.SUPPORTED_FORMULAS = undefined;

var _parser = __webpack_require__(17);

var _parser2 = _interopRequireDefault(_parser);

var _supportedFormulas = __webpack_require__(14);

var _supportedFormulas2 = _interopRequireDefault(_supportedFormulas);

var _error = __webpack_require__(2);

var _error2 = _interopRequireDefault(_error);

var _cell = __webpack_require__(15);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports.SUPPORTED_FORMULAS = _supportedFormulas2['default'];
exports.ERROR = _error.ERROR;
exports.ERROR_DIV_ZERO = _error.ERROR_DIV_ZERO;
exports.ERROR_NAME = _error.ERROR_NAME;
exports.ERROR_NOT_AVAILABLE = _error.ERROR_NOT_AVAILABLE;
exports.ERROR_NULL = _error.ERROR_NULL;
exports.ERROR_NUM = _error.ERROR_NUM;
exports.ERROR_REF = _error.ERROR_REF;
exports.ERROR_VALUE = _error.ERROR_VALUE;
exports.Parser = _parser2['default'];
exports.error = _error2['default'];
exports.extractLabel = _cell.extractLabel;
exports.toLabel = _cell.toLabel;
exports.columnIndexToLabel = _cell.columnIndexToLabel;
exports.columnLabelToIndex = _cell.columnLabelToIndex;
exports.rowIndexToLabel = _cell.rowIndexToLabel;
exports.rowLabelToIndex = _cell.rowLabelToIndex;

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _tinyEmitter = __webpack_require__(18);

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _evaluateByOperator = __webpack_require__(19);

var _evaluateByOperator2 = _interopRequireDefault(_evaluateByOperator);

var _grammarParser = __webpack_require__(41);

var _string = __webpack_require__(43);

var _number = __webpack_require__(3);

var _error = __webpack_require__(2);

var _error2 = _interopRequireDefault(_error);

var _cell = __webpack_require__(15);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @class Parser
 */
var Parser = function (_Emitter) {
  _inherits(Parser, _Emitter);

  function Parser() {
    _classCallCheck(this, Parser);

    var _this = _possibleConstructorReturn(this, _Emitter.call(this));

    _this.parser = new _grammarParser.Parser();
    _this.parser.yy = {
      toNumber: _number.toNumber,
      trimEdges: _string.trimEdges,
      invertNumber: _number.invertNumber,
      throwError: function throwError(errorName) {
        return _this._throwError(errorName);
      },
      callVariable: function callVariable(variable) {
        return _this._callVariable(variable);
      },
      evaluateByOperator: _evaluateByOperator2['default'],
      callFunction: function callFunction(name, params) {
        return _this._callFunction(name, params);
      },
      cellValue: function cellValue(value) {
        return _this._callCellValue(value);
      },
      rangeValue: function rangeValue(start, end) {
        return _this._callRangeValue(start, end);
      }
    };
    _this.variables = Object.create(null);
    _this.functions = Object.create(null);

    _this.setVariable('TRUE', true).setVariable('FALSE', false).setVariable('NULL', null);
    return _this;
  }

  /**
   * Parse formula expression.
   *
   * @param {String} expression to parse.
   * @return {*} Returns an object with tow properties `error` and `result`.
   */


  Parser.prototype.parse = function parse(expression) {
    var result = null;
    var error = null;

    try {
      if (expression === '') {
        result = '';
      } else {
        result = this.parser.parse(expression);
      }
    } catch (ex) {
      var message = (0, _error2['default'])(ex.message);

      if (message) {
        error = message;
      } else {
        error = (0, _error2['default'])(_error.ERROR);
      }
    }

    if (result instanceof Error) {
      error = (0, _error2['default'])(result.message) || (0, _error2['default'])(_error.ERROR);
      result = null;
    }

    return {
      error: error,
      result: result
    };
  };

  /**
   * Set predefined variable name which can be visible while parsing formula expression.
   *
   * @param {String} name Variable name.
   * @param {*} value Variable value.
   * @returns {Parser}
   */


  Parser.prototype.setVariable = function setVariable(name, value) {
    this.variables[name] = value;

    return this;
  };

  /**
   * Get variable name.
   *
   * @param {String} name Variable name.
   * @returns {*}
   */


  Parser.prototype.getVariable = function getVariable(name) {
    return this.variables[name];
  };

  /**
   * Retrieve variable value by its name.
   *
   * @param name Variable name.
   * @returns {*}
   * @private
   */


  Parser.prototype._callVariable = function _callVariable(name) {
    var value = this.getVariable(name);

    this.emit('callVariable', name, function (newValue) {
      if (newValue !== void 0) {
        value = newValue;
      }
    });

    if (value === void 0) {
      throw Error(_error.ERROR_NAME);
    }

    return value;
  };

  /**
   * Set custom function which can be visible while parsing formula expression.
   *
   * @param {String} name Custom function name.
   * @param {Function} fn Custom function.
   * @returns {Parser}
   */


  Parser.prototype.setFunction = function setFunction(name, fn) {
    this.functions[name] = fn;

    return this;
  };

  /**
   * Get custom function.
   *
   * @param {String} name Custom function name.
   * @returns {*}
   */


  Parser.prototype.getFunction = function getFunction(name) {
    return this.functions[name];
  };

  /**
   * Call function with provided params.
   *
   * @param name Function name.
   * @param params Function params.
   * @returns {*}
   * @private
   */


  Parser.prototype._callFunction = function _callFunction(name) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    var fn = this.getFunction(name);
    var value = void 0;

    if (fn) {
      value = fn(params);
    }

    this.emit('callFunction', name, params, function (newValue) {
      if (newValue !== void 0) {
        value = newValue;
      }
    });

    return value === void 0 ? (0, _evaluateByOperator2['default'])(name, params) : value;
  };

  /**
   * Retrieve value by its label (`B3`, `B$3`, `B$3`, `$B$3`).
   *
   * @param {String} label Coordinates.
   * @returns {*}
   * @private
   */


  Parser.prototype._callCellValue = function _callCellValue(label) {
    label = label.toUpperCase();

    var _extractLabel = (0, _cell.extractLabel)(label),
        row = _extractLabel[0],
        column = _extractLabel[1];

    var value = void 0;

    this.emit('callCellValue', { label: label, row: row, column: column }, function (_value) {
      value = _value;
    });

    return value;
  };

  /**
   * Retrieve value by its label (`B3:A1`, `B$3:A1`, `B$3:$A1`, `$B$3:A$1`).
   *
   * @param {String} startLabel Coordinates of the first cell.
   * @param {String} endLabel Coordinates of the last cell.
   * @returns {Array} Returns an array of mixed values.
   * @private
   */


  Parser.prototype._callRangeValue = function _callRangeValue(startLabel, endLabel) {
    startLabel = startLabel.toUpperCase();
    endLabel = endLabel.toUpperCase();

    var _extractLabel2 = (0, _cell.extractLabel)(startLabel),
        startRow = _extractLabel2[0],
        startColumn = _extractLabel2[1];

    var _extractLabel3 = (0, _cell.extractLabel)(endLabel),
        endRow = _extractLabel3[0],
        endColumn = _extractLabel3[1];

    var startCell = {};
    var endCell = {};

    if (startRow.index <= endRow.index) {
      startCell.row = startRow;
      endCell.row = endRow;
    } else {
      startCell.row = endRow;
      endCell.row = startRow;
    }

    if (startColumn.index <= endColumn.index) {
      startCell.column = startColumn;
      endCell.column = endColumn;
    } else {
      startCell.column = endColumn;
      endCell.column = startColumn;
    }

    startCell.label = (0, _cell.toLabel)(startCell.row, startCell.column);
    endCell.label = (0, _cell.toLabel)(endCell.row, endCell.column);

    var value = [];

    this.emit('callRangeValue', startCell, endCell, function () {
      var _value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      value = _value;
    });

    return value;
  };

  /**
   * Try to throw error by its name.
   *
   * @param {String} errorName Error name.
   * @returns {String}
   * @private
   */


  Parser.prototype._throwError = function _throwError(errorName) {
    if ((0, _error.isValidStrict)(errorName)) {
      throw Error(errorName);
    }

    throw Error(_error.ERROR);
  };

  return Parser;
}(_tinyEmitter2['default']);

exports['default'] = Parser;

/***/ }),
/* 18 */
/***/ (function(module, exports) {

function E () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = evaluateByOperator;
exports.registerOperation = registerOperation;

var _add = __webpack_require__(20);

var _add2 = _interopRequireDefault(_add);

var _ampersand = __webpack_require__(21);

var _ampersand2 = _interopRequireDefault(_ampersand);

var _divide = __webpack_require__(22);

var _divide2 = _interopRequireDefault(_divide);

var _equal = __webpack_require__(23);

var _equal2 = _interopRequireDefault(_equal);

var _formulaFunction = __webpack_require__(24);

var _formulaFunction2 = _interopRequireDefault(_formulaFunction);

var _greaterThan = __webpack_require__(33);

var _greaterThan2 = _interopRequireDefault(_greaterThan);

var _greaterThanOrEqual = __webpack_require__(34);

var _greaterThanOrEqual2 = _interopRequireDefault(_greaterThanOrEqual);

var _lessThan = __webpack_require__(35);

var _lessThan2 = _interopRequireDefault(_lessThan);

var _lessThanOrEqual = __webpack_require__(36);

var _lessThanOrEqual2 = _interopRequireDefault(_lessThanOrEqual);

var _minus = __webpack_require__(37);

var _minus2 = _interopRequireDefault(_minus);

var _multiply = __webpack_require__(38);

var _multiply2 = _interopRequireDefault(_multiply);

var _notEqual = __webpack_require__(39);

var _notEqual2 = _interopRequireDefault(_notEqual);

var _power = __webpack_require__(40);

var _power2 = _interopRequireDefault(_power);

var _error = __webpack_require__(2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/* eslint-disable import/no-named-as-default-member */
var availableOperators = Object.create(null);

/**
 * Evaluate values by operator id.git
 *
 * @param {String} operator Operator id.
 * @param {Array} [params=[]] Arguments to evaluate.
 * @returns {*}
 */
function evaluateByOperator(operator) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  operator = operator.toUpperCase();

  if (!availableOperators[operator]) {
    throw Error(_error.ERROR_NAME);
  }

  return availableOperators[operator].apply(availableOperators, params);
}

/**
 * Register operator.
 *
 * @param {String|Array} symbol Symbol to register.
 * @param {Function} func Logic to register for this symbol.
 */
function registerOperation(symbol, func) {
  if (!Array.isArray(symbol)) {
    symbol = [symbol.toUpperCase()];
  }
  symbol.forEach(function (s) {
    if (func.isFactory) {
      availableOperators[s] = func(s);
    } else {
      availableOperators[s] = func;
    }
  });
}

registerOperation(_add2['default'].SYMBOL, _add2['default']);
registerOperation(_ampersand2['default'].SYMBOL, _ampersand2['default']);
registerOperation(_divide2['default'].SYMBOL, _divide2['default']);
registerOperation(_equal2['default'].SYMBOL, _equal2['default']);
registerOperation(_power2['default'].SYMBOL, _power2['default']);
registerOperation(_formulaFunction2['default'].SYMBOL, _formulaFunction2['default']);
registerOperation(_greaterThan2['default'].SYMBOL, _greaterThan2['default']);
registerOperation(_greaterThanOrEqual2['default'].SYMBOL, _greaterThanOrEqual2['default']);
registerOperation(_lessThan2['default'].SYMBOL, _lessThan2['default']);
registerOperation(_lessThanOrEqual2['default'].SYMBOL, _lessThanOrEqual2['default']);
registerOperation(_multiply2['default'].SYMBOL, _multiply2['default']);
registerOperation(_notEqual2['default'].SYMBOL, _notEqual2['default']);
registerOperation(_minus2['default'].SYMBOL, _minus2['default']);

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.SYMBOL = undefined;
exports['default'] = func;

var _number = __webpack_require__(3);

var _error = __webpack_require__(2);

var SYMBOL = exports.SYMBOL = '+';

function func(first) {
  for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var result = rest.reduce(function (acc, value) {
    return acc + (0, _number.toNumber)(value);
  }, (0, _number.toNumber)(first));

  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '&';

function func() {
  for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
    params[_key] = arguments[_key];
  }

  return params.reduce(function (acc, value) {
    return acc + value.toString();
  }, '');
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.SYMBOL = undefined;
exports['default'] = func;

var _number = __webpack_require__(3);

var _error = __webpack_require__(2);

var SYMBOL = exports.SYMBOL = '/';

function func(first) {
  for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var result = rest.reduce(function (acc, value) {
    return acc / (0, _number.toNumber)(value);
  }, (0, _number.toNumber)(first));

  if (result === Infinity) {
    throw Error(_error.ERROR_DIV_ZERO);
  }
  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '=';

function func(exp1, exp2) {
  return exp1 === exp2;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.SYMBOL = undefined;
exports['default'] = func;

var _formulajs = __webpack_require__(25);

var formulajs = _interopRequireWildcard(_formulajs);

var _supportedFormulas = __webpack_require__(14);

var _supportedFormulas2 = _interopRequireDefault(_supportedFormulas);

var _error = __webpack_require__(2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var SYMBOL = exports.SYMBOL = _supportedFormulas2['default'];

function func(symbol) {
  return function __formulaFunction() {
    symbol = symbol.toUpperCase();

    var symbolParts = symbol.split('.');
    var foundFormula = false;
    var result = void 0;

    if (symbolParts.length === 1) {
      if (formulajs[symbolParts[0]]) {
        foundFormula = true;
        result = formulajs[symbolParts[0]].apply(formulajs, arguments);
      }
    } else {
      var length = symbolParts.length;
      var index = 0;
      var nestedFormula = formulajs;

      while (index < length) {
        nestedFormula = nestedFormula[symbolParts[index]];
        index++;

        if (!nestedFormula) {
          nestedFormula = null;
          break;
        }
      }
      if (nestedFormula) {
        foundFormula = true;
        result = nestedFormula.apply(undefined, arguments);
      }
    }

    if (!foundFormula) {
      throw Error(_error.ERROR_NAME);
    }

    return result;
  };
}

func.isFactory = true;
func.SYMBOL = SYMBOL;

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var categories = [
  __webpack_require__(26),
  __webpack_require__(29),
  __webpack_require__(13),
  __webpack_require__(30),
  __webpack_require__(4),
  __webpack_require__(6),
  __webpack_require__(8),
  __webpack_require__(31),
  __webpack_require__(7),
  __webpack_require__(32),
  __webpack_require__(5),
  __webpack_require__(12)
];

for (var c in categories) {
  var category = categories[c];
  for (var f in category) {
    exports[f] = exports[f] || category[f];
  }
}


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var mathTrig = __webpack_require__(4);
var statistical = __webpack_require__(5);
var engineering = __webpack_require__(13);
var dateTime = __webpack_require__(8);

function set(fn, root) {
  if (root) {
    for (var i in root) {
      fn[i] = root[i];
    }
  }

  return fn;
}

exports.BETADIST = statistical.BETA.DIST;
exports.BETAINV = statistical.BETA.INV;
exports.BINOMDIST = statistical.BINOM.DIST;
exports.CEILING = exports.ISOCEILING = set(mathTrig.CEILING.MATH, mathTrig.CEILING);
exports.CEILINGMATH = mathTrig.CEILING.MATH;
exports.CEILINGPRECISE = mathTrig.CEILING.PRECISE;
exports.CHIDIST = statistical.CHISQ.DIST;
exports.CHIDISTRT = statistical.CHISQ.DIST.RT;
exports.CHIINV = statistical.CHISQ.INV;
exports.CHIINVRT = statistical.CHISQ.INV.RT;
exports.CHITEST = statistical.CHISQ.TEST;
exports.CONFIDENCE = set(statistical.CONFIDENCE.NORM, statistical.CONFIDENCE);
exports.COVAR = statistical.COVARIANCE.P;
exports.COVARIANCEP = statistical.COVARIANCE.P;
exports.COVARIANCES = statistical.COVARIANCE.S;
exports.CRITBINOM = statistical.BINOM.INV;
exports.EXPONDIST = statistical.EXPON.DIST;
exports.ERFCPRECISE = engineering.ERFC.PRECISE;
exports.ERFPRECISE = engineering.ERF.PRECISE;
exports.FDIST = statistical.F.DIST;
exports.FDISTRT = statistical.F.DIST.RT;
exports.FINVRT = statistical.F.INV.RT;
exports.FINV = statistical.F.INV;
exports.FLOOR = set(mathTrig.FLOOR.MATH, mathTrig.FLOOR);
exports.FLOORMATH = mathTrig.FLOOR.MATH;
exports.FLOORPRECISE = mathTrig.FLOOR.PRECISE;
exports.FTEST = statistical.F.TEST;
exports.GAMMADIST = statistical.GAMMA.DIST;
exports.GAMMAINV = statistical.GAMMA.INV;
exports.GAMMALNPRECISE = statistical.GAMMALN.PRECISE;
exports.HYPGEOMDIST = statistical.HYPGEOM.DIST;
exports.LOGINV = statistical.LOGNORM.INV;
exports.LOGNORMINV = statistical.LOGNORM.INV;
exports.LOGNORMDIST = statistical.LOGNORM.DIST;
exports.MODE = set(statistical.MODE.SNGL, statistical.MODE);
exports.MODEMULT = statistical.MODE.MULT;
exports.MODESNGL = statistical.MODE.SNGL;
exports.NEGBINOMDIST = statistical.NEGBINOM.DIST;
exports.NETWORKDAYSINTL = dateTime.NETWORKDAYS.INTL;
exports.NORMDIST = statistical.NORM.DIST;
exports.NORMINV = statistical.NORM.INV;
exports.NORMSDIST = statistical.NORM.S.DIST;
exports.NORMSINV = statistical.NORM.S.INV;
exports.PERCENTILE = set(statistical.PERCENTILE.EXC, statistical.PERCENTILE);
exports.PERCENTILEEXC = statistical.PERCENTILE.EXC;
exports.PERCENTILEINC = statistical.PERCENTILE.INC;
exports.PERCENTRANK = set(statistical.PERCENTRANK.INC, statistical.PERCENTRANK);
exports.PERCENTRANKEXC = statistical.PERCENTRANK.EXC;
exports.PERCENTRANKINC = statistical.PERCENTRANK.INC;
exports.POISSON = set(statistical.POISSON.DIST, statistical.POISSON);
exports.POISSONDIST = statistical.POISSON.DIST;
exports.QUARTILE = set(statistical.QUARTILE.INC, statistical.QUARTILE);
exports.QUARTILEEXC = statistical.QUARTILE.EXC;
exports.QUARTILEINC = statistical.QUARTILE.INC;
exports.RANK = set(statistical.RANK.EQ, statistical.RANK);
exports.RANKAVG = statistical.RANK.AVG;
exports.RANKEQ = statistical.RANK.EQ;
exports.SKEWP = statistical.SKEW.P;
exports.STDEV = set(statistical.STDEV.S, statistical.STDEV);
exports.STDEVP = statistical.STDEV.P;
exports.STDEVS = statistical.STDEV.S;
exports.TDIST = statistical.T.DIST;
exports.TDISTRT = statistical.T.DIST.RT;
exports.TINV = statistical.T.INV;
exports.TTEST = statistical.T.TEST;
exports.VAR = set(statistical.VAR.S, statistical.VAR);
exports.VARP = statistical.VAR.P;
exports.VARS = statistical.VAR.S;
exports.WEIBULL = set(statistical.WEIBULL.DIST, statistical.WEIBULL);
exports.WEIBULLDIST = statistical.WEIBULL.DIST;
exports.WORKDAYINTL = dateTime.WORKDAY.INTL;
exports.ZTEST = statistical.Z.TEST;


/***/ }),
/* 27 */
/***/ (function(module, exports) {



/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

var M = Math;
function _horner(arr, v) { return arr.reduce(function(z,w){return v * z + w;},0); };
function _bessel_iter(x, n, f0, f1, sign) {
  if(!sign) sign = -1;
  var tdx = 2 / x, f2;
  if(n === 0) return f0;
  if(n === 1) return f1;
  for(var o = 1; o != n; ++o) {
    f2 = f1 * o * tdx + sign * f0;
    f0 = f1; f1 = f2;
  }
  return f1;
}
function _bessel_wrap(bessel0, bessel1, name, nonzero, sign) {
  return function bessel(x,n) {
    if(n === 0) return bessel0(x);
    if(n === 1) return bessel1(x);
    if(n < 0) throw name + ': Order (' + n + ') must be nonnegative';
    if(nonzero == 1 && x === 0) throw name + ': Undefined when x == 0';
    if(nonzero == 2 && x <= 0) throw name + ': Undefined when x <= 0';
    var b0 = bessel0(x), b1 = bessel1(x);
    return _bessel_iter(x, n, b0, b1, sign);
  };
}
var besselj = (function() {
  var b0_a1a = [57568490574.0,-13362590354.0,651619640.7,-11214424.18,77392.33017,-184.9052456].reverse();
  var b0_a2a = [57568490411.0,1029532985.0,9494680.718,59272.64853,267.8532712,1.0].reverse();
  var b0_a1b = [1.0, -0.1098628627e-2, 0.2734510407e-4, -0.2073370639e-5, 0.2093887211e-6].reverse();
  var b0_a2b = [-0.1562499995e-1, 0.1430488765e-3, -0.6911147651e-5, 0.7621095161e-6, -0.934935152e-7].reverse();
  var W = 0.636619772; // 2 / Math.PI

  function bessel0(x) {
    var a, a1, a2, y = x * x, xx = M.abs(x) - 0.785398164;
    if(M.abs(x) < 8) {
      a1 = _horner(b0_a1a, y);
      a2 = _horner(b0_a2a, y);
      a = a1/a2;
    }
    else {
      y = 64 / y;
      a1 = _horner(b0_a1b, y);
      a2 = _horner(b0_a2b, y);
      a = M.sqrt(W/M.abs(x))*(M.cos(xx)*a1-M.sin(xx)*a2*8/M.abs(x));
    }
    return a;
  }
  var b1_a1a = [72362614232.0,-7895059235.0,242396853.1,-2972611.439, 15704.48260, -30.16036606].reverse();
  var b1_a2a = [144725228442.0, 2300535178.0, 18583304.74, 99447.43394, 376.9991397, 1.0].reverse();
  var b1_a1b = [1.0, 0.183105e-2, -0.3516396496e-4, 0.2457520174e-5, -0.240337019e-6].reverse();
  var b1_a2b = [0.04687499995, -0.2002690873e-3, 0.8449199096e-5, -0.88228987e-6, 0.105787412e-6].reverse();
  function bessel1(x) {
    var a, a1, a2, y = x*x, xx = M.abs(x) - 2.356194491;
    if(Math.abs(x)< 8) {
      a1 = x*_horner(b1_a1a, y);
      a2 = _horner(b1_a2a, y);
      a = a1 / a2;
    } else {
      y = 64 / y;
      a1=_horner(b1_a1b, y);
      a2=_horner(b1_a2b, y);
      a=M.sqrt(W/M.abs(x))*(M.cos(xx)*a1-M.sin(xx)*a2*8/M.abs(x));
      if(x < 0) a = -a;
    }
    return a;
  }
  return function besselj(x, n) {
    n = Math.round(n);
    if(n === 0) return bessel0(M.abs(x));
    if(n === 1) return bessel1(M.abs(x));
    if(n < 0) throw 'BESSELJ: Order (' + n + ') must be nonnegative';
    if(M.abs(x) === 0) return 0;

    var ret, j, tox = 2 / M.abs(x), m, jsum, sum, bjp, bj, bjm;
    if(M.abs(x) > n) {
      ret = _bessel_iter(x, n, bessel0(M.abs(x)), bessel1(M.abs(x)),-1);
    } else {
      m=2*M.floor((n+M.floor(M.sqrt(40*n)))/2);
      jsum=0;
      bjp=ret=sum=0.0;
      bj=1.0;
      for (j=m;j>0;j--) {
        bjm=j*tox*bj-bjp;
        bjp=bj;
        bj=bjm;
        if (M.abs(bj) > 1E10) {
          bj *= 1E-10;
          bjp *= 1E-10;
          ret *= 1E-10;
          sum *= 1E-10;
        }
        if (jsum) sum += bj;
        jsum=!jsum;
        if (j == n) ret=bjp;
      }
      sum=2.0*sum-bj;
      ret /= sum;
    }
    return x < 0 && (n%2) ? -ret : ret;
  };
})();
var bessely = (function() {
  var b0_a1a = [-2957821389.0, 7062834065.0, -512359803.6, 10879881.29, -86327.92757, 228.4622733].reverse();
  var b0_a2a = [40076544269.0, 745249964.8, 7189466.438, 47447.26470, 226.1030244, 1.0].reverse();
  var b0_a1b = [1.0, -0.1098628627e-2, 0.2734510407e-4, -0.2073370639e-5, 0.2093887211e-6].reverse();
  var b0_a2b = [-0.1562499995e-1, 0.1430488765e-3, -0.6911147651e-5, 0.7621095161e-6, -0.934945152e-7].reverse();

  var W = 0.636619772;
  function bessel0(x) {
    var a, a1, a2, y = x * x, xx = x - 0.785398164;
    if(x < 8) {
      a1 = _horner(b0_a1a, y);
      a2 = _horner(b0_a2a, y);
      a = a1/a2 + W * besselj(x,0) * M.log(x);
    } else {
      y = 64 / y;
      a1 = _horner(b0_a1b, y);
      a2 = _horner(b0_a2b, y);
      a = M.sqrt(W/x)*(M.sin(xx)*a1+M.cos(xx)*a2*8/x);
    }
    return a;
  }

  var b1_a1a = [-0.4900604943e13, 0.1275274390e13, -0.5153438139e11, 0.7349264551e9, -0.4237922726e7, 0.8511937935e4].reverse();
  var b1_a2a = [0.2499580570e14, 0.4244419664e12, 0.3733650367e10, 0.2245904002e8, 0.1020426050e6, 0.3549632885e3, 1].reverse();
  var b1_a1b = [1.0, 0.183105e-2, -0.3516396496e-4, 0.2457520174e-5, -0.240337019e-6].reverse();
  var b1_a2b = [0.04687499995, -0.2002690873e-3, 0.8449199096e-5, -0.88228987e-6, 0.105787412e-6].reverse();
  function bessel1(x) {
    var a, a1, a2, y = x*x, xx = x - 2.356194491;
    if(x < 8) {
      a1 = x*_horner(b1_a1a, y);
      a2 = _horner(b1_a2a, y);
      a = a1/a2 + W * (besselj(x,1) * M.log(x) - 1 / x);
    } else {
      y = 64 / y;
      a1=_horner(b1_a1b, y);
      a2=_horner(b1_a2b, y);
      a=M.sqrt(W/x)*(M.sin(xx)*a1+M.cos(xx)*a2*8/x);
    }
    return a;
  }

  return _bessel_wrap(bessel0, bessel1, 'BESSELY', 1, -1);
})();
var besseli = (function() {
  var b0_a = [1.0, 3.5156229, 3.0899424, 1.2067492, 0.2659732, 0.360768e-1, 0.45813e-2].reverse();
  var b0_b = [0.39894228, 0.1328592e-1, 0.225319e-2, -0.157565e-2, 0.916281e-2, -0.2057706e-1, 0.2635537e-1, -0.1647633e-1, 0.392377e-2].reverse();
  function bessel0(x) {
    if(x <= 3.75) return _horner(b0_a, x*x/(3.75*3.75));
    return M.exp(M.abs(x))/M.sqrt(M.abs(x))*_horner(b0_b, 3.75/M.abs(x));
  }

  var b1_a = [0.5, 0.87890594, 0.51498869, 0.15084934, 0.2658733e-1, 0.301532e-2, 0.32411e-3].reverse();
  var b1_b = [0.39894228, -0.3988024e-1, -0.362018e-2, 0.163801e-2, -0.1031555e-1, 0.2282967e-1, -0.2895312e-1, 0.1787654e-1, -0.420059e-2].reverse();
  function bessel1(x) {
    if(x < 3.75) return x * _horner(b1_a, x*x/(3.75*3.75));
    return (x < 0 ? -1 : 1) * M.exp(M.abs(x))/M.sqrt(M.abs(x))*_horner(b1_b, 3.75/M.abs(x));
  }

  return function besseli(x, n) {
    n = Math.round(n);
    if(n === 0) return bessel0(x);
    if(n == 1) return bessel1(x);
    if(n < 0) throw 'BESSELI Order (' + n + ') must be nonnegative';
    if(M.abs(x) === 0) return 0;

    var ret, j, tox = 2 / M.abs(x), m, bip, bi, bim;
    m=2*M.round((n+M.round(M.sqrt(40*n)))/2);
    bip=ret=0.0;
    bi=1.0;
    for (j=m;j>0;j--) {
      bim=j*tox*bi + bip;
      bip=bi; bi=bim;
      if (M.abs(bi) > 1E10) {
        bi *= 1E-10;
        bip *= 1E-10;
        ret *= 1E-10;
      }
      if(j == n) ret = bip;
    }
    ret *= besseli(x, 0) / bi;
    return x < 0 && (n%2) ? -ret : ret;
  };

})();

var besselk = (function() {
  var b0_a = [-0.57721566, 0.42278420, 0.23069756, 0.3488590e-1, 0.262698e-2, 0.10750e-3, 0.74e-5].reverse();
  var b0_b = [1.25331414, -0.7832358e-1, 0.2189568e-1, -0.1062446e-1, 0.587872e-2, -0.251540e-2, 0.53208e-3].reverse();
  function bessel0(x) {
    if(x <= 2) return -M.log(x/2)*besseli(x,0) + _horner(b0_a, x*x/4);
    return M.exp(-x)/M.sqrt(x)*_horner(b0_b, 2/x);
  }

  var b1_a = [1.0, 0.15443144, -0.67278579, -0.18156897, -0.1919402e-1, -0.110404e-2, -0.4686e-4].reverse();
  var b1_b = [1.25331414, 0.23498619, -0.3655620e-1, 0.1504268e-1, -0.780353e-2, 0.325614e-2, -0.68245e-3].reverse();
  function bessel1(x) {
    if(x <= 2) return M.log(x/2)*besseli(x,1) + (1/x)*_horner(b1_a, x*x/4);
    return M.exp(-x)/M.sqrt(x)*_horner(b1_b, 2/x);
  }

  return _bessel_wrap(bessel0, bessel1, 'BESSELK', 2, 1);
})();
if(true) {
  exports.besselj = besselj;
  exports.bessely = bessely;
  exports.besseli = besseli;
  exports.besselk = besselk;
}



/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);
var stats = __webpack_require__(5);
var maths = __webpack_require__(4);
var utils = __webpack_require__(1);

function compact(array) {
  var result = [];

  utils.arrayEach(array, function(value) {
    if (value) {
      result.push(value);
    }
  });

  return result;
}

exports.FINDFIELD = function(database, title) {
  var index = null;

  utils.arrayEach(database, function(value, i) {
    if (value[0] === title) {
      index = i;
      return false;
    }
  });

  // Return error if the input field title is incorrect
  if (index == null) {
    return error.value;
  }

  return index;
};

function findResultIndex(database, criterias) {
  var matches = {};
  for (var i = 1; i < database[0].length; ++i) {
    matches[i] = true;
  }
  var maxCriteriaLength = criterias[0].length;
  for (i = 1; i < criterias.length; ++i) {
    if (criterias[i].length > maxCriteriaLength) {
      maxCriteriaLength = criterias[i].length;
    }
  }

  for (var k = 1; k < database.length; ++k) {
    for (var l = 1; l < database[k].length; ++l) {
      var currentCriteriaResult = false;
      var hasMatchingCriteria   = false;
      for (var j = 0; j < criterias.length; ++j) {
        var criteria = criterias[j];
        if (criteria.length < maxCriteriaLength) {
          continue;
        }

        var criteriaField = criteria[0];
        if (database[k][0] !== criteriaField) {
          continue;
        }
        hasMatchingCriteria = true;
        for (var p = 1; p < criteria.length; ++p) {
          currentCriteriaResult = currentCriteriaResult || eval(database[k][l] + criteria[p]);  // jshint ignore:line
        }
      }
      if (hasMatchingCriteria) {
        matches[l] = matches[l] && currentCriteriaResult;
      }
    }
  }

  var result = [];
  for (var n = 0; n < database[0].length; ++n) {
    if (matches[n]) {
      result.push(n - 1);
    }
  }

  return result;
}

// Database functions
exports.DAVERAGE = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }
  var sum = 0;

  utils.arrayEach(resultIndexes, function(value) {
    sum += targetFields[value];
  });

  return resultIndexes.length === 0 ? error.div0 : sum / resultIndexes.length;
};

exports.DCOUNT = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });

  return stats.COUNT(targetValues);
};

exports.DCOUNTA = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }

  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });

  return stats.COUNTA(targetValues);
};

exports.DGET = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }

  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  // Return error if no record meets the criteria
  if (resultIndexes.length === 0) {
    return error.value;
  }
  // Returns the #NUM! error value because more than one record meets the
  // criteria
  if (resultIndexes.length > 1) {
    return error.num;
  }

  return targetFields[resultIndexes[0]];
};

exports.DMAX = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var maxValue = targetFields[resultIndexes[0]];

  utils.arrayEach(resultIndexes, function(value) {
    if (maxValue < targetFields[value]) {
      maxValue = targetFields[value];
    }
  });

  return maxValue;
};

exports.DMIN = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }

  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var minValue = targetFields[resultIndexes[0]];

  utils.arrayEach(resultIndexes, function(value) {
    if (minValue > targetFields[value]) {
      minValue = targetFields[value];
    }
  });

  return minValue;
};

exports.DPRODUCT = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }

  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });
  targetValues = compact(targetValues);

  var result = 1;

  utils.arrayEach(targetValues, function(value) {
    result *= value;
  });

  return result;
};

exports.DSTDEV = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }
  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });
  targetValues = compact(targetValues);

  return stats.STDEV.S(targetValues);
};

exports.DSTDEVP = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });
  targetValues = compact(targetValues);

  return stats.STDEV.P(targetValues);
};

exports.DSUM = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }

  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });

  return maths.SUM(targetValues);
};

exports.DVAR = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }
  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });

  return stats.VAR.S(targetValues);
};

exports.DVARP = function(database, field, criteria) {
  // Return error if field is not a number and not a string
  if (isNaN(field) && (typeof field !== "string")) {
    return error.value;
  }
  var resultIndexes = findResultIndex(database, criteria);
  var targetFields = [];

  if (typeof field === "string") {
    var index = exports.FINDFIELD(database, field);
    targetFields = utils.rest(database[index]);
  } else {
    targetFields = utils.rest(database[field]);
  }
  var targetValues = [];

  utils.arrayEach(resultIndexes, function(value) {
    targetValues.push(targetFields[value]);
  });

  return stats.VAR.P(targetValues);
};


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);
var utils = __webpack_require__(1);
var information = __webpack_require__(7);

exports.AND = function() {
  var args = utils.flatten(arguments);
  var result = true;
  for (var i = 0; i < args.length; i++) {
    if (!args[i]) {
      result = false;
    }
  }
  return result;
};

exports.CHOOSE = function() {
  if (arguments.length < 2) {
    return error.na;
  }

  var index = arguments[0];
  if (index < 1 || index > 254) {
    return error.value;
  }

  if (arguments.length < index + 1) {
    return error.value;
  }

  return arguments[index];
};

exports.FALSE = function() {
  return false;
};

exports.IF = function(test, then_value, otherwise_value) {
  return test ? then_value : otherwise_value;
};

exports.IFERROR = function(value, valueIfError) {
  if (information.ISERROR(value)) {
    return valueIfError;
  }
  return value;
};

exports.IFNA = function(value, value_if_na) {
  return value === error.na ? value_if_na : value;
};

exports.NOT = function(logical) {
  return !logical;
};

exports.OR = function() {
  var args = utils.flatten(arguments);
  var result = false;
  for (var i = 0; i < args.length; i++) {
    if (args[i]) {
      result = true;
    }
  }
  return result;
};

exports.TRUE = function() {
  return true;
};

exports.XOR = function() {
  var args = utils.flatten(arguments);
  var result = 0;
  for (var i = 0; i < args.length; i++) {
    if (args[i]) {
      result++;
    }
  }
  return (Math.floor(Math.abs(result)) & 1) ? true : false;
};

exports.SWITCH = function () {
  var result;

  if (arguments.length > 0)  {
    var targetValue = arguments[0];
    var argc = arguments.length - 1;
    var switchCount = Math.floor(argc / 2);
    var switchSatisfied = false;
    var hasDefaultClause = argc % 2 !== 0;
    var defaultClause = argc % 2 === 0 ? null : arguments[arguments.length - 1];

    if (switchCount) {
      for (var index = 0; index < switchCount; index++) {
        if (targetValue === arguments[index * 2 + 1]) {
          result = arguments[index * 2 + 2];
          switchSatisfied = true;
          break;
        }
      }
    }

    if (!switchSatisfied) {
      result = hasDefaultClause ? defaultClause : error.na;
    }
  } else {
    result = error.value;
  }

  return result;
};


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);
var dateTime = __webpack_require__(8);
var utils = __webpack_require__(1);

function validDate(d) {
  return d && d.getTime && !isNaN(d.getTime());
}

function ensureDate(d) {
  return (d instanceof Date)?d:new Date(d);
}

exports.ACCRINT = function(issue, first, settlement, rate, par, frequency, basis) {
  // Return error if either date is invalid
  issue      = ensureDate(issue);
  first      = ensureDate(first);
  settlement = ensureDate(settlement);
  if (!validDate(issue) || !validDate(first) || !validDate(settlement)) {
    return error.value;
  }

  // Return error if either rate or par are lower than or equal to zero
  if (rate <= 0 || par <= 0) {
    return error.num;
  }

  // Return error if frequency is neither 1, 2, or 4
  if ([1, 2, 4].indexOf(frequency) === -1) {
    return error.num;
  }

  // Return error if basis is neither 0, 1, 2, 3, or 4
  if ([0, 1, 2, 3, 4].indexOf(basis) === -1) {
    return error.num;
  }

  // Return error if settlement is before or equal to issue
  if (settlement <= issue) {
    return error.num;
  }

  // Set default values
  par   = par   || 0;
  basis = basis || 0;

  // Compute accrued interest
  return par * rate * dateTime.YEARFRAC(issue, settlement, basis);
};

// TODO
exports.ACCRINTM = function() {
  throw new Error('ACCRINTM is not implemented');
};

// TODO
exports.AMORDEGRC = function() {
  throw new Error('AMORDEGRC is not implemented');
};

// TODO
exports.AMORLINC = function() {
  throw new Error('AMORLINC is not implemented');
};

// TODO
exports.COUPDAYBS = function() {
  throw new Error('COUPDAYBS is not implemented');
};

// TODO
exports.COUPDAYS = function() {
  throw new Error('COUPDAYS is not implemented');
};

// TODO
exports.COUPDAYSNC = function() {
  throw new Error('COUPDAYSNC is not implemented');
};

// TODO
exports.COUPNCD = function() {
  throw new Error('COUPNCD is not implemented');
};

// TODO
exports.COUPNUM = function() {
  throw new Error('COUPNUM is not implemented');
};

// TODO
exports.COUPPCD = function() {
  throw new Error('COUPPCD is not implemented');
};

exports.CUMIPMT = function(rate, periods, value, start, end, type) {
  // Credits: algorithm inspired by Apache OpenOffice
  // Credits: Hannes Stiebitzhofer for the translations of function and variable names
  // Requires exports.FV() and exports.PMT() from exports.js [http://stoic.com/exports/]

  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  value = utils.parseNumber(value);
  if (utils.anyIsError(rate, periods, value)) {
    return error.value;
  }

  // Return error if either rate, periods, or value are lower than or equal to zero
  if (rate <= 0 || periods <= 0 || value <= 0) {
    return error.num;
  }

  // Return error if start < 1, end < 1, or start > end
  if (start < 1 || end < 1 || start > end) {
    return error.num;
  }

  // Return error if type is neither 0 nor 1
  if (type !== 0 && type !== 1) {
    return error.num;
  }

  // Compute cumulative interest
  var payment = exports.PMT(rate, periods, value, 0, type);
  var interest = 0;

  if (start === 1) {
    if (type === 0) {
      interest = -value;
      start++;
    }
  }

  for (var i = start; i <= end; i++) {
    if (type === 1) {
      interest += exports.FV(rate, i - 2, payment, value, 1) - payment;
    } else {
      interest += exports.FV(rate, i - 1, payment, value, 0);
    }
  }
  interest *= rate;

  // Return cumulative interest
  return interest;
};

exports.CUMPRINC = function(rate, periods, value, start, end, type) {
  // Credits: algorithm inspired by Apache OpenOffice
  // Credits: Hannes Stiebitzhofer for the translations of function and variable names

  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  value = utils.parseNumber(value);
  if (utils.anyIsError(rate, periods, value)) {
    return error.value;
  }

  // Return error if either rate, periods, or value are lower than or equal to zero
  if (rate <= 0 || periods <= 0 || value <= 0) {
    return error.num;
  }

  // Return error if start < 1, end < 1, or start > end
  if (start < 1 || end < 1 || start > end) {
    return error.num;
  }

  // Return error if type is neither 0 nor 1
  if (type !== 0 && type !== 1) {
    return error.num;
  }

  // Compute cumulative principal
  var payment = exports.PMT(rate, periods, value, 0, type);
  var principal = 0;
  if (start === 1) {
    if (type === 0) {
      principal = payment + value * rate;
    } else {
      principal = payment;
    }
    start++;
  }
  for (var i = start; i <= end; i++) {
    if (type > 0) {
      principal += payment - (exports.FV(rate, i - 2, payment, value, 1) - payment) * rate;
    } else {
      principal += payment - exports.FV(rate, i - 1, payment, value, 0) * rate;
    }
  }

  // Return cumulative principal
  return principal;
};

exports.DB = function(cost, salvage, life, period, month) {
  // Initialize month
  month = (month === undefined) ? 12 : month;

  cost = utils.parseNumber(cost);
  salvage = utils.parseNumber(salvage);
  life = utils.parseNumber(life);
  period = utils.parseNumber(period);
  month = utils.parseNumber(month);
  if (utils.anyIsError(cost, salvage, life, period, month)) {
    return error.value;
  }

  // Return error if any of the parameters is negative
  if (cost < 0 || salvage < 0 || life < 0 || period < 0) {
    return error.num;
  }

  // Return error if month is not an integer between 1 and 12
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(month) === -1) {
    return error.num;
  }

  // Return error if period is greater than life
  if (period > life) {
    return error.num;
  }

  // Return 0 (zero) if salvage is greater than or equal to cost
  if (salvage >= cost) {
    return 0;
  }

  // Rate is rounded to three decimals places
  var rate = (1 - Math.pow(salvage / cost, 1 / life)).toFixed(3);

  // Compute initial depreciation
  var initial = cost * rate * month / 12;

  // Compute total depreciation
  var total = initial;
  var current = 0;
  var ceiling = (period === life) ? life - 1 : period;
  for (var i = 2; i <= ceiling; i++) {
    current = (cost - total) * rate;
    total += current;
  }

  // Depreciation for the first and last periods are special cases
  if (period === 1) {
    // First period
    return initial;
  } else if (period === life) {
    // Last period
    return (cost - total) * rate;
  } else {
    return current;
  }
};

exports.DDB = function(cost, salvage, life, period, factor) {
  // Initialize factor
  factor = (factor === undefined) ? 2 : factor;

  cost = utils.parseNumber(cost);
  salvage = utils.parseNumber(salvage);
  life = utils.parseNumber(life);
  period = utils.parseNumber(period);
  factor = utils.parseNumber(factor);
  if (utils.anyIsError(cost, salvage, life, period, factor)) {
    return error.value;
  }

  // Return error if any of the parameters is negative or if factor is null
  if (cost < 0 || salvage < 0 || life < 0 || period < 0 || factor <= 0) {
    return error.num;
  }

  // Return error if period is greater than life
  if (period > life) {
    return error.num;
  }

  // Return 0 (zero) if salvage is greater than or equal to cost
  if (salvage >= cost) {
    return 0;
  }

  // Compute depreciation
  var total = 0;
  var current = 0;
  for (var i = 1; i <= period; i++) {
    current = Math.min((cost - total) * (factor / life), (cost - salvage - total));
    total += current;
  }

  // Return depreciation
  return current;
};

// TODO
exports.DISC = function() {
  throw new Error('DISC is not implemented');
};

exports.DOLLARDE = function(dollar, fraction) {
  // Credits: algorithm inspired by Apache OpenOffice

  dollar = utils.parseNumber(dollar);
  fraction = utils.parseNumber(fraction);
  if (utils.anyIsError(dollar, fraction)) {
    return error.value;
  }

  // Return error if fraction is negative
  if (fraction < 0) {
    return error.num;
  }

  // Return error if fraction is greater than or equal to 0 and less than 1
  if (fraction >= 0 && fraction < 1) {
    return error.div0;
  }

  // Truncate fraction if it is not an integer
  fraction = parseInt(fraction, 10);

  // Compute integer part
  var result = parseInt(dollar, 10);

  // Add decimal part
  result += (dollar % 1) * Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN10)) / fraction;

  // Round result
  var power = Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN2) + 1);
  result = Math.round(result * power) / power;

  // Return converted dollar price
  return result;
};

exports.DOLLARFR = function(dollar, fraction) {
  // Credits: algorithm inspired by Apache OpenOffice

  dollar = utils.parseNumber(dollar);
  fraction = utils.parseNumber(fraction);
  if (utils.anyIsError(dollar, fraction)) {
    return error.value;
  }

  // Return error if fraction is negative
  if (fraction < 0) {
    return error.num;
  }

  // Return error if fraction is greater than or equal to 0 and less than 1
  if (fraction >= 0 && fraction < 1) {
    return error.div0;
  }

  // Truncate fraction if it is not an integer
  fraction = parseInt(fraction, 10);

  // Compute integer part
  var result = parseInt(dollar, 10);

  // Add decimal part
  result += (dollar % 1) * Math.pow(10, -Math.ceil(Math.log(fraction) / Math.LN10)) * fraction;

  // Return converted dollar price
  return result;
};

// TODO
exports.DURATION = function() {
  throw new Error('DURATION is not implemented');
};

exports.EFFECT = function(rate, periods) {
  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  if (utils.anyIsError(rate, periods)) {
    return error.value;
  }

  // Return error if rate <=0 or periods < 1
  if (rate <= 0 || periods < 1) {
    return error.num;
  }

  // Truncate periods if it is not an integer
  periods = parseInt(periods, 10);

  // Return effective annual interest rate
  return Math.pow(1 + rate / periods, periods) - 1;
};

exports.FV = function(rate, periods, payment, value, type) {
  // Credits: algorithm inspired by Apache OpenOffice

  value = value || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  payment = utils.parseNumber(payment);
  value = utils.parseNumber(value);
  type = utils.parseNumber(type);
  if (utils.anyIsError(rate, periods, payment, value, type)) {
    return error.value;
  }

  // Return future value
  var result;
  if (rate === 0) {
    result = value + payment * periods;
  } else {
    var term = Math.pow(1 + rate, periods);
    if (type === 1) {
      result = value * term + payment * (1 + rate) * (term - 1) / rate;
    } else {
      result = value * term + payment * (term - 1) / rate;
    }
  }
  return -result;
};

exports.FVSCHEDULE = function(principal, schedule) {
  principal = utils.parseNumber(principal);
  schedule = utils.parseNumberArray(utils.flatten(schedule));
  if (utils.anyIsError(principal, schedule)) {
    return error.value;
  }

  var n = schedule.length;
  var future = principal;

  // Apply all interests in schedule
  for (var i = 0; i < n; i++) {
    // Apply scheduled interest
    future *= 1 + schedule[i];
  }

  // Return future value
  return future;
};

// TODO
exports.INTRATE = function() {
  throw new Error('INTRATE is not implemented');
};

exports.IPMT = function(rate, period, periods, present, future, type) {
  // Credits: algorithm inspired by Apache OpenOffice

  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  period = utils.parseNumber(period);
  periods = utils.parseNumber(periods);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  type = utils.parseNumber(type);
  if (utils.anyIsError(rate, period, periods, present, future, type)) {
    return error.value;
  }

  // Compute payment
  var payment = exports.PMT(rate, periods, present, future, type);

  // Compute interest
  var interest;
  if (period === 1) {
    if (type === 1) {
      interest = 0;
    } else {
      interest = -present;
    }
  } else {
    if (type === 1) {
      interest = exports.FV(rate, period - 2, payment, present, 1) - payment;
    } else {
      interest = exports.FV(rate, period - 1, payment, present, 0);
    }
  }

  // Return interest
  return interest * rate;
};

exports.IRR = function(values, guess) {
  // Credits: algorithm inspired by Apache OpenOffice

  guess = guess || 0;

  values = utils.parseNumberArray(utils.flatten(values));
  guess = utils.parseNumber(guess);
  if (utils.anyIsError(values, guess)) {
    return error.value;
  }

  // Calculates the resulting amount
  var irrResult = function(values, dates, rate) {
    var r = rate + 1;
    var result = values[0];
    for (var i = 1; i < values.length; i++) {
      result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
    }
    return result;
  };

  // Calculates the first derivation
  var irrResultDeriv = function(values, dates, rate) {
    var r = rate + 1;
    var result = 0;
    for (var i = 1; i < values.length; i++) {
      var frac = (dates[i] - dates[0]) / 365;
      result -= frac * values[i] / Math.pow(r, frac + 1);
    }
    return result;
  };

  // Initialize dates and check that values contains at least one positive value and one negative value
  var dates = [];
  var positive = false;
  var negative = false;
  for (var i = 0; i < values.length; i++) {
    dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
    if (values[i] > 0) {
      positive = true;
    }
    if (values[i] < 0) {
      negative = true;
    }
  }

  // Return error if values does not contain at least one positive value and one negative value
  if (!positive || !negative) {
    return error.num;
  }

  // Initialize guess and resultRate
  guess = (guess === undefined) ? 0.1 : guess;
  var resultRate = guess;

  // Set maximum epsilon for end of iteration
  var epsMax = 1e-10;

  // Implement Newton's method
  var newRate, epsRate, resultValue;
  var contLoop = true;
  do {
    resultValue = irrResult(values, dates, resultRate);
    newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
    epsRate = Math.abs(newRate - resultRate);
    resultRate = newRate;
    contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
  } while (contLoop);

  // Return internal rate of return
  return resultRate;
};

exports.ISPMT = function(rate, period, periods, value) {
  rate = utils.parseNumber(rate);
  period = utils.parseNumber(period);
  periods = utils.parseNumber(periods);
  value = utils.parseNumber(value);
  if (utils.anyIsError(rate, period, periods, value)) {
    return error.value;
  }

  // Return interest
  return value * rate * (period / periods - 1);
};

// TODO
exports.MDURATION = function() {
  throw new Error('MDURATION is not implemented');
};

exports.MIRR = function(values, finance_rate, reinvest_rate) {
  values = utils.parseNumberArray(utils.flatten(values));
  finance_rate = utils.parseNumber(finance_rate);
  reinvest_rate = utils.parseNumber(reinvest_rate);
  if (utils.anyIsError(values, finance_rate, reinvest_rate)) {
    return error.value;
  }

  // Initialize number of values
  var n = values.length;

  // Lookup payments (negative values) and incomes (positive values)
  var payments = [];
  var incomes = [];
  for (var i = 0; i < n; i++) {
    if (values[i] < 0) {
      payments.push(values[i]);
    } else {
      incomes.push(values[i]);
    }
  }

  // Return modified internal rate of return
  var num = -exports.NPV(reinvest_rate, incomes) * Math.pow(1 + reinvest_rate, n - 1);
  var den = exports.NPV(finance_rate, payments) * (1 + finance_rate);
  return Math.pow(num / den, 1 / (n - 1)) - 1;
};

exports.NOMINAL = function(rate, periods) {
  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  if (utils.anyIsError(rate, periods)) {
    return error.value;
  }

  // Return error if rate <=0 or periods < 1
  if (rate <= 0 || periods < 1) {
    return error.num;
  }

  // Truncate periods if it is not an integer
  periods = parseInt(periods, 10);

  // Return nominal annual interest rate
  return (Math.pow(rate + 1, 1 / periods) - 1) * periods;
};

exports.NPER = function(rate, payment, present, future, type) {
  type = (type === undefined) ? 0 : type;
  future = (future === undefined) ? 0 : future;

  rate = utils.parseNumber(rate);
  payment = utils.parseNumber(payment);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  type = utils.parseNumber(type);
  if (utils.anyIsError(rate, payment, present, future, type)) {
    return error.value;
  }

  // Return number of periods
  var num = payment * (1 + rate * type) - future * rate;
  var den = (present * rate + payment * (1 + rate * type));
  return Math.log(num / den) / Math.log(1 + rate);
};

exports.NPV = function() {
  var args = utils.parseNumberArray(utils.flatten(arguments));
  if (args instanceof Error) {
    return args;
  }

  // Lookup rate
  var rate = args[0];

  // Initialize net present value
  var value = 0;

  // Loop on all values
  for (var j = 1; j < args.length; j++) {
    value += args[j] / Math.pow(1 + rate, j);
  }

  // Return net present value
  return value;
};

// TODO
exports.ODDFPRICE = function() {
  throw new Error('ODDFPRICE is not implemented');
};

// TODO
exports.ODDFYIELD = function() {
  throw new Error('ODDFYIELD is not implemented');
};

// TODO
exports.ODDLPRICE = function() {
  throw new Error('ODDLPRICE is not implemented');
};

// TODO
exports.ODDLYIELD = function() {
  throw new Error('ODDLYIELD is not implemented');
};

exports.PDURATION = function(rate, present, future) {
  rate = utils.parseNumber(rate);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  if (utils.anyIsError(rate, present, future)) {
    return error.value;
  }

  // Return error if rate <=0
  if (rate <= 0) {
    return error.num;
  }

  // Return number of periods
  return (Math.log(future) - Math.log(present)) / Math.log(1 + rate);
};

exports.PMT = function(rate, periods, present, future, type) {
  // Credits: algorithm inspired by Apache OpenOffice

  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  type = utils.parseNumber(type);
  if (utils.anyIsError(rate, periods, present, future, type)) {
    return error.value;
  }

  // Return payment
  var result;
  if (rate === 0) {
    result = (present + future) / periods;
  } else {
    var term = Math.pow(1 + rate, periods);
    if (type === 1) {
      result = (future * rate / (term - 1) + present * rate / (1 - 1 / term)) / (1 + rate);
    } else {
      result = future * rate / (term - 1) + present * rate / (1 - 1 / term);
    }
  }
  return -result;
};

exports.PPMT = function(rate, period, periods, present, future, type) {
  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  type = utils.parseNumber(type);
  if (utils.anyIsError(rate, periods, present, future, type)) {
    return error.value;
  }

  return exports.PMT(rate, periods, present, future, type) - exports.IPMT(rate, period, periods, present, future, type);
};

// TODO
exports.PRICE = function() {
  throw new Error('PRICE is not implemented');
};

// TODO
exports.PRICEDISC = function() {
  throw new Error('PRICEDISC is not implemented');
};

// TODO
exports.PRICEMAT = function() {
  throw new Error('PRICEMAT is not implemented');
};

exports.PV = function(rate, periods, payment, future, type) {
  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  periods = utils.parseNumber(periods);
  payment = utils.parseNumber(payment);
  future = utils.parseNumber(future);
  type = utils.parseNumber(type);
  if (utils.anyIsError(rate, periods, payment, future, type)) {
    return error.value;
  }

  // Return present value
  if (rate === 0) {
    return -payment * periods - future;
  } else {
    return (((1 - Math.pow(1 + rate, periods)) / rate) * payment * (1 + rate * type) - future) / Math.pow(1 + rate, periods);
  }
};

exports.RATE = function(periods, payment, present, future, type, guess) {
  // Credits: rabugento

  guess = (guess === undefined) ? 0.01 : guess;
  future = (future === undefined) ? 0 : future;
  type = (type === undefined) ? 0 : type;

  periods = utils.parseNumber(periods);
  payment = utils.parseNumber(payment);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  type = utils.parseNumber(type);
  guess = utils.parseNumber(guess);
  if (utils.anyIsError(periods, payment, present, future, type, guess)) {
    return error.value;
  }

  // Set maximum epsilon for end of iteration
  var epsMax = 1e-10;

  // Set maximum number of iterations
  var iterMax = 50;

  // Implement Newton's method
  var y, y0, y1, x0, x1 = 0,
    f = 0,
    i = 0;
  var rate = guess;
  if (Math.abs(rate) < epsMax) {
    y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
  } else {
    f = Math.exp(periods * Math.log(1 + rate));
    y = present * f + payment * (1 / rate + type) * (f - 1) + future;
  }
  y0 = present + payment * periods + future;
  y1 = present * f + payment * (1 / rate + type) * (f - 1) + future;
  i = x0 = 0;
  x1 = rate;
  while ((Math.abs(y0 - y1) > epsMax) && (i < iterMax)) {
    rate = (y1 * x0 - y0 * x1) / (y1 - y0);
    x0 = x1;
    x1 = rate;
    if (Math.abs(rate) < epsMax) {
      y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
    } else {
      f = Math.exp(periods * Math.log(1 + rate));
      y = present * f + payment * (1 / rate + type) * (f - 1) + future;
    }
    y0 = y1;
    y1 = y;
    ++i;
  }
  return rate;
};

// TODO
exports.RECEIVED = function() {
  throw new Error('RECEIVED is not implemented');
};

exports.RRI = function(periods, present, future) {
  periods = utils.parseNumber(periods);
  present = utils.parseNumber(present);
  future = utils.parseNumber(future);
  if (utils.anyIsError(periods, present, future)) {
    return error.value;
  }

  // Return error if periods or present is equal to 0 (zero)
  if (periods === 0 || present === 0) {
    return error.num;
  }

  // Return equivalent interest rate
  return Math.pow(future / present, 1 / periods) - 1;
};

exports.SLN = function(cost, salvage, life) {
  cost = utils.parseNumber(cost);
  salvage = utils.parseNumber(salvage);
  life = utils.parseNumber(life);
  if (utils.anyIsError(cost, salvage, life)) {
    return error.value;
  }

  // Return error if life equal to 0 (zero)
  if (life === 0) {
    return error.num;
  }

  // Return straight-line depreciation
  return (cost - salvage) / life;
};

exports.SYD = function(cost, salvage, life, period) {
  // Return error if any of the parameters is not a number
  cost = utils.parseNumber(cost);
  salvage = utils.parseNumber(salvage);
  life = utils.parseNumber(life);
  period = utils.parseNumber(period);
  if (utils.anyIsError(cost, salvage, life, period)) {
    return error.value;
  }

  // Return error if life equal to 0 (zero)
  if (life === 0) {
    return error.num;
  }

  // Return error if period is lower than 1 or greater than life
  if (period < 1 || period > life) {
    return error.num;
  }

  // Truncate period if it is not an integer
  period = parseInt(period, 10);

  // Return straight-line depreciation
  return ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1));
};

exports.TBILLEQ = function(settlement, maturity, discount) {
  settlement = utils.parseDate(settlement);
  maturity = utils.parseDate(maturity);
  discount = utils.parseNumber(discount);
  if (utils.anyIsError(settlement, maturity, discount)) {
    return error.value;
  }

  // Return error if discount is lower than or equal to zero
  if (discount <= 0) {
    return error.num;
  }

  // Return error if settlement is greater than maturity
  if (settlement > maturity) {
    return error.num;
  }

  // Return error if maturity is more than one year after settlement
  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
    return error.num;
  }

  // Return bond-equivalent yield
  return (365 * discount) / (360 - discount * dateTime.DAYS360(settlement, maturity, false));
};

exports.TBILLPRICE = function(settlement, maturity, discount) {
  settlement = utils.parseDate(settlement);
  maturity = utils.parseDate(maturity);
  discount = utils.parseNumber(discount);
  if (utils.anyIsError(settlement, maturity, discount)) {
    return error.value;
  }

  // Return error if discount is lower than or equal to zero
  if (discount <= 0) {
    return error.num;
  }

  // Return error if settlement is greater than maturity
  if (settlement > maturity) {
    return error.num;
  }

  // Return error if maturity is more than one year after settlement
  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
    return error.num;
  }

  // Return bond-equivalent yield
  return 100 * (1 - discount * dateTime.DAYS360(settlement, maturity, false) / 360);
};

exports.TBILLYIELD = function(settlement, maturity, price) {
  settlement = utils.parseDate(settlement);
  maturity = utils.parseDate(maturity);
  price = utils.parseNumber(price);
  if (utils.anyIsError(settlement, maturity, price)) {
    return error.value;
  }

  // Return error if price is lower than or equal to zero
  if (price <= 0) {
    return error.num;
  }

  // Return error if settlement is greater than maturity
  if (settlement > maturity) {
    return error.num;
  }

  // Return error if maturity is more than one year after settlement
  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
    return error.num;
  }

  // Return bond-equivalent yield
  return (100 - price) * 360 / (price * dateTime.DAYS360(settlement, maturity, false));
};

// TODO
exports.VDB = function() {
  throw new Error('VDB is not implemented');
};

// TODO needs better support for date
// exports.XIRR = function(values, dates, guess) {
//   // Credits: algorithm inspired by Apache OpenOffice
//
//   values = utils.parseNumberArray(utils.flatten(values));
//   dates = utils.parseDateArray(utils.flatten(dates));
//   guess = utils.parseNumber(guess);
//
//   if (utils.anyIsError(values, dates, guess)) {
//     return error.value;
//   }
//
//   // Calculates the resulting amount
//   var irrResult = function(values, dates, rate) {
//     var r = rate + 1;
//     var result = values[0];
//     for (var i = 1; i < values.length; i++) {
//       result += values[i] / Math.pow(r, dateTime.DAYS(dates[i], dates[0]) / 365);
//     }
//     return result;
//   };
//
//   // Calculates the first derivation
//   var irrResultDeriv = function(values, dates, rate) {
//     var r = rate + 1;
//     var result = 0;
//     for (var i = 1; i < values.length; i++) {
//       var frac = dateTime.DAYS(dates[i], dates[0]) / 365;
//       result -= frac * values[i] / Math.pow(r, frac + 1);
//     }
//     return result;
//   };
//
//   // Check that values contains at least one positive value and one negative value
//   var positive = false;
//   var negative = false;
//   for (var i = 0; i < values.length; i++) {
//     if (values[i] > 0) {
//       positive = true;
//     }
//     if (values[i] < 0) {
//       negative = true;
//     }
//   }
//
//   // Return error if values does not contain at least one positive value and one negative value
//   if (!positive || !negative) {
//     return error.num;
//   }
//
//   // Initialize guess and resultRate
//   guess = guess || 0.1;
//   var resultRate = guess;
//
//   // Set maximum epsilon for end of iteration
//   var epsMax = 1e-10;
//
//   // Implement Newton's method
//   var newRate, epsRate, resultValue;
//   var contLoop = true;
//   do {
//     resultValue = irrResult(values, dates, resultRate);
//     newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
//     epsRate = Math.abs(newRate - resultRate);
//     resultRate = newRate;
//     contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
//   } while (contLoop);
//
//   // Return internal rate of return
//   return resultRate;
// };

exports.XNPV = function(rate, values, dates) {
  rate = utils.parseNumber(rate);
  values = utils.parseNumberArray(utils.flatten(values));
  dates = utils.parseDateArray(utils.flatten(dates));
  if (utils.anyIsError(rate, values, dates)) {
    return error.value;
  }

  var result = 0;
  for (var i = 0; i < values.length; i++) {
    result += values[i] / Math.pow(1 + rate, dateTime.DAYS(dates[i], dates[0]) / 365);
  }
  return result;
};

// TODO
exports.YIELD = function() {
  throw new Error('YIELD is not implemented');
};

// TODO
exports.YIELDDISC = function() {
  throw new Error('YIELDDISC is not implemented');
};

// TODO
exports.YIELDMAT = function() {
  throw new Error('YIELDMAT is not implemented');
};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

var error = __webpack_require__(0);
var utils = __webpack_require__(1);

exports.MATCH = function(lookupValue, lookupArray, matchType) {
  if (!lookupValue && !lookupArray) {
    return error.na;
  }

  if (arguments.length === 2) {
    matchType = 1;
  }
  if (!(lookupArray instanceof Array)) {
    return error.na;
  }

  if (matchType !== -1 && matchType !== 0 && matchType !== 1) {
    return error.na;
  }
  var index;
  var indexValue;
  for (var idx = 0; idx < lookupArray.length; idx++) {
    if (matchType === 1) {
      if (lookupArray[idx] === lookupValue) {
        return idx + 1;
      } else if (lookupArray[idx] < lookupValue) {
        if (!indexValue) {
          index = idx + 1;
          indexValue = lookupArray[idx];
        } else if (lookupArray[idx] > indexValue) {
          index = idx + 1;
          indexValue = lookupArray[idx];
        }
      }
    } else if (matchType === 0) {
      if (typeof lookupValue === 'string') {
        lookupValue = lookupValue.replace(/\?/g, '.');
        if (lookupArray[idx].toLowerCase().match(lookupValue.toLowerCase())) {
          return idx + 1;
        }
      } else {
        if (lookupArray[idx] === lookupValue) {
          return idx + 1;
        }
      }
    } else if (matchType === -1) {
      if (lookupArray[idx] === lookupValue) {
        return idx + 1;
      } else if (lookupArray[idx] > lookupValue) {
        if (!indexValue) {
          index = idx + 1;
          indexValue = lookupArray[idx];
        } else if (lookupArray[idx] < indexValue) {
          index = idx + 1;
          indexValue = lookupArray[idx];
        }
      }
    }
  }

  return index ? index : error.na;
};

exports.VLOOKUP = function (needle, table, index, rangeLookup) {
  if (!needle || !table || !index) {
    return error.na;
  }

  rangeLookup = rangeLookup || false;
  for (var i = 0; i < table.length; i++) {
    var row = table[i];
    if ((!rangeLookup && row[0] === needle) ||
      ((row[0] === needle) ||
        (rangeLookup && typeof row[0] === "string" && row[0].toLowerCase().indexOf(needle.toLowerCase()) !== -1))) {
      return (index < (row.length + 1) ? row[index - 1] : error.ref);
    }
  }

  return error.na;
};      

exports.HLOOKUP = function (needle, table, index, rangeLookup) {
  if (!needle || !table || !index) {
    return error.na;
  }

  rangeLookup = rangeLookup || false;

  var transposedTable = utils.transpose(table);

  for (var i = 0; i < transposedTable.length; i++) {
    var row = transposedTable[i];
    if ((!rangeLookup && row[0] === needle) ||
      ((row[0] === needle) ||
        (rangeLookup && typeof row[0] === "string" && row[0].toLowerCase().indexOf(needle.toLowerCase()) !== -1))) {
      return (index < (row.length + 1) ? row[index - 1] : error.ref);
    }
  }

  return error.na;
};


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '>';

function func(exp1, exp2) {
  return exp1 > exp2;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '>=';

function func(exp1, exp2) {
  return exp1 >= exp2;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '<';

function func(exp1, exp2) {
  return exp1 < exp2;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '<=';

function func(exp1, exp2) {
  return exp1 <= exp2;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.SYMBOL = undefined;
exports['default'] = func;

var _number = __webpack_require__(3);

var _error = __webpack_require__(2);

var SYMBOL = exports.SYMBOL = '-';

function func(first) {
  for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var result = rest.reduce(function (acc, value) {
    return acc - (0, _number.toNumber)(value);
  }, (0, _number.toNumber)(first));

  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.SYMBOL = undefined;
exports['default'] = func;

var _number = __webpack_require__(3);

var _error = __webpack_require__(2);

var SYMBOL = exports.SYMBOL = '*';

function func(first) {
  for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var result = rest.reduce(function (acc, value) {
    return acc * (0, _number.toNumber)(value);
  }, (0, _number.toNumber)(first));

  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports['default'] = func;
var SYMBOL = exports.SYMBOL = '<>';

function func(exp1, exp2) {
  return exp1 !== exp2;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.SYMBOL = undefined;
exports['default'] = func;

var _number = __webpack_require__(3);

var _error = __webpack_require__(2);

var SYMBOL = exports.SYMBOL = '^';

function func(exp1, exp2) {
  var result = Math.pow((0, _number.toNumber)(exp1), (0, _number.toNumber)(exp2));

  if (isNaN(result)) {
    throw Error(_error.ERROR_VALUE);
  }

  return result;
}

func.SYMBOL = SYMBOL;

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, process) {/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var grammarParser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,5],$V1=[1,8],$V2=[1,6],$V3=[1,7],$V4=[1,9],$V5=[1,14],$V6=[1,15],$V7=[1,16],$V8=[1,12],$V9=[1,13],$Va=[1,17],$Vb=[1,19],$Vc=[1,20],$Vd=[1,21],$Ve=[1,22],$Vf=[1,23],$Vg=[1,24],$Vh=[1,25],$Vi=[1,26],$Vj=[1,27],$Vk=[1,28],$Vl=[5,9,10,11,13,14,15,16,17,18,19,20,29,30],$Vm=[5,9,10,11,13,14,15,16,17,18,19,20,29,30,32],$Vn=[5,9,10,11,13,14,15,16,17,18,19,20,29,30,34],$Vo=[5,10,11,13,14,15,16,17,29,30],$Vp=[5,10,13,14,15,16,29,30],$Vq=[5,10,11,13,14,15,16,17,18,19,29,30],$Vr=[13,29,30];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"expression":4,"EOF":5,"variableSequence":6,"number":7,"STRING":8,"&":9,"=":10,"+":11,"(":12,")":13,"<":14,">":15,"NOT":16,"-":17,"*":18,"/":19,"^":20,"FUNCTION":21,"expseq":22,"cell":23,"ABSOLUTE_CELL":24,"RELATIVE_CELL":25,"MIXED_CELL":26,":":27,"ARRAY":28,";":29,",":30,"VARIABLE":31,"DECIMAL":32,"NUMBER":33,"%":34,"ERROR":35,"$accept":0,"$end":1},
terminals_: {5:"EOF",8:"STRING",9:"&",10:"=",11:"+",12:"(",13:")",14:"<",15:">",16:"NOT",17:"-",18:"*",19:"/",20:"^",21:"FUNCTION",24:"ABSOLUTE_CELL",25:"RELATIVE_CELL",26:"MIXED_CELL",27:":",28:"ARRAY",29:";",30:",",31:"VARIABLE",32:"DECIMAL",33:"NUMBER",34:"%",35:"ERROR"},
productions_: [0,[3,2],[4,1],[4,1],[4,1],[4,3],[4,3],[4,3],[4,3],[4,4],[4,4],[4,4],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,2],[4,3],[4,4],[4,1],[4,1],[4,2],[23,1],[23,1],[23,1],[23,3],[23,3],[23,3],[23,3],[23,3],[23,3],[23,3],[23,3],[23,3],[22,1],[22,1],[22,3],[22,3],[6,1],[6,3],[7,1],[7,3],[7,2],[2,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

      return $$[$0-1];

break;
case 2:

      this.$ = yy.callVariable($$[$0][0]);

break;
case 3:

      this.$ = yy.toNumber($$[$0]);

break;
case 4:

      this.$ = yy.trimEdges($$[$0]);

break;
case 5:

      this.$ = yy.evaluateByOperator('&', [$$[$0-2], $$[$0]]);

break;
case 6:

      this.$ = yy.evaluateByOperator('=', [$$[$0-2], $$[$0]]);

break;
case 7:

      this.$ = yy.evaluateByOperator('+', [$$[$0-2], $$[$0]]);

break;
case 8:

      this.$ = $$[$0-1];

break;
case 9:

      this.$ = yy.evaluateByOperator('<=', [$$[$0-3], $$[$0]]);

break;
case 10:

      this.$ = yy.evaluateByOperator('>=', [$$[$0-3], $$[$0]]);

break;
case 11:

      this.$ = yy.evaluateByOperator('<>', [$$[$0-3], $$[$0]]);

break;
case 12:

      this.$ = yy.evaluateByOperator('NOT', [$$[$0-2], $$[$0]]);

break;
case 13:

      this.$ = yy.evaluateByOperator('>', [$$[$0-2], $$[$0]]);

break;
case 14:

      this.$ = yy.evaluateByOperator('<', [$$[$0-2], $$[$0]]);

break;
case 15:

      this.$ = yy.evaluateByOperator('-', [$$[$0-2], $$[$0]]);

break;
case 16:

      this.$ = yy.evaluateByOperator('*', [$$[$0-2], $$[$0]]);

break;
case 17:

      this.$ = yy.evaluateByOperator('/', [$$[$0-2], $$[$0]]);

break;
case 18:

      this.$ = yy.evaluateByOperator('^', [$$[$0-2], $$[$0]]);

break;
case 19:

      var n1 = yy.invertNumber($$[$0]);

      this.$ = n1;

      if (isNaN(this.$)) {
          this.$ = 0;
      }

break;
case 20:

      var n1 = yy.toNumber($$[$0]);

      this.$ = n1;

      if (isNaN(this.$)) {
          this.$ = 0;
      }

break;
case 21:

      this.$ = yy.callFunction($$[$0-2]);

break;
case 22:

      this.$ = yy.callFunction($$[$0-3], $$[$0-1]);

break;
case 26: case 27: case 28:

      this.$ = yy.cellValue($$[$0]);

break;
case 29: case 30: case 31: case 32: case 33: case 34: case 35: case 36: case 37:

      this.$ = yy.rangeValue($$[$0-2], $$[$0]);

break;
case 38: case 42:

      this.$ = [$$[$0]];

break;
case 39:

      var result = [];
      var arr = eval("[" + yytext + "]");

      arr.forEach(function(item) {
        result.push(item);
      });

      this.$ = result;

break;
case 40: case 41:

      $$[$0-2].push($$[$0]);
      this.$ = $$[$0-2];

break;
case 43:

      this.$ = (Array.isArray($$[$0-2]) ? $$[$0-2] : [$$[$0-2]]);
      this.$.push($$[$0]);

break;
case 44:

      this.$ = $$[$0];

break;
case 45:

      this.$ = ($$[$0-2] + '.' + $$[$0]) * 1;

break;
case 46:

      this.$ = $$[$0-1] * 0.01;

break;
case 47:

      this.$ = yy.throwError($$[$0]);

break;
}
},
table: [{2:11,3:1,4:2,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{1:[3]},{5:[1,18],9:$Vb,10:$Vc,11:$Vd,14:$Ve,15:$Vf,16:$Vg,17:$Vh,18:$Vi,19:$Vj,20:$Vk},o($Vl,[2,2],{32:[1,29]}),o($Vl,[2,3],{34:[1,30]}),o($Vl,[2,4]),{2:11,4:31,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:32,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:33,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{12:[1,34]},o($Vl,[2,23]),o($Vl,[2,24],{2:35,35:$Va}),o($Vm,[2,42]),o($Vn,[2,44],{32:[1,36]}),o($Vl,[2,26],{27:[1,37]}),o($Vl,[2,27],{27:[1,38]}),o($Vl,[2,28],{27:[1,39]}),o([5,9,10,11,13,14,15,16,17,18,19,20,29,30,35],[2,47]),{1:[2,1]},{2:11,4:40,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:41,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:42,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:45,6:3,7:4,8:$V0,10:[1,43],11:$V1,12:$V2,15:[1,44],17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:47,6:3,7:4,8:$V0,10:[1,46],11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:48,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:49,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:50,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:51,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:52,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{31:[1,53]},o($Vn,[2,46]),{9:$Vb,10:$Vc,11:$Vd,13:[1,54],14:$Ve,15:$Vf,16:$Vg,17:$Vh,18:$Vi,19:$Vj,20:$Vk},o($Vo,[2,19],{9:$Vb,18:$Vi,19:$Vj,20:$Vk}),o($Vo,[2,20],{9:$Vb,18:$Vi,19:$Vj,20:$Vk}),{2:11,4:57,6:3,7:4,8:$V0,11:$V1,12:$V2,13:[1,55],17:$V3,21:$V4,22:56,23:10,24:$V5,25:$V6,26:$V7,28:[1,58],31:$V8,33:$V9,35:$Va},o($Vl,[2,25]),{33:[1,59]},{24:[1,60],25:[1,61],26:[1,62]},{24:[1,63],25:[1,64],26:[1,65]},{24:[1,66],25:[1,67],26:[1,68]},o($Vl,[2,5]),o([5,10,13,29,30],[2,6],{9:$Vb,11:$Vd,14:$Ve,15:$Vf,16:$Vg,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vo,[2,7],{9:$Vb,18:$Vi,19:$Vj,20:$Vk}),{2:11,4:69,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:70,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},o($Vp,[2,14],{9:$Vb,11:$Vd,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),{2:11,4:71,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},o($Vp,[2,13],{9:$Vb,11:$Vd,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o([5,10,13,16,29,30],[2,12],{9:$Vb,11:$Vd,14:$Ve,15:$Vf,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vo,[2,15],{9:$Vb,18:$Vi,19:$Vj,20:$Vk}),o($Vq,[2,16],{9:$Vb,20:$Vk}),o($Vq,[2,17],{9:$Vb,20:$Vk}),o([5,10,11,13,14,15,16,17,18,19,20,29,30],[2,18],{9:$Vb}),o($Vm,[2,43]),o($Vl,[2,8]),o($Vl,[2,21]),{13:[1,72],29:[1,73],30:[1,74]},o($Vr,[2,38],{9:$Vb,10:$Vc,11:$Vd,14:$Ve,15:$Vf,16:$Vg,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vr,[2,39]),o($Vn,[2,45]),o($Vl,[2,29]),o($Vl,[2,30]),o($Vl,[2,31]),o($Vl,[2,32]),o($Vl,[2,33]),o($Vl,[2,34]),o($Vl,[2,35]),o($Vl,[2,36]),o($Vl,[2,37]),o($Vp,[2,9],{9:$Vb,11:$Vd,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vp,[2,11],{9:$Vb,11:$Vd,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vp,[2,10],{9:$Vb,11:$Vd,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vl,[2,22]),{2:11,4:75,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},{2:11,4:76,6:3,7:4,8:$V0,11:$V1,12:$V2,17:$V3,21:$V4,23:10,24:$V5,25:$V6,26:$V7,31:$V8,33:$V9,35:$Va},o($Vr,[2,40],{9:$Vb,10:$Vc,11:$Vd,14:$Ve,15:$Vf,16:$Vg,17:$Vh,18:$Vi,19:$Vj,20:$Vk}),o($Vr,[2,41],{9:$Vb,10:$Vc,11:$Vd,14:$Ve,15:$Vf,16:$Vg,17:$Vh,18:$Vi,19:$Vj,20:$Vk})],
defaultActions: {18:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        tstack = [], // token stack
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    var args = lstack.slice.call(arguments, 1);

    //this.reductionCount = this.shiftCount = 0;

    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    // copy state
    for (var k in this.yy) {
      if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
        sharedState.yy[k] = this.yy[k];
      }
    }

    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);

    var ranges = lexer.options && lexer.options.ranges;

    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }

    function popStack (n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    var lex = function () {
        var token;
        token = lexer.lex() || EOF;
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }

    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length - 1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var error_rule_depth;
            var errStr = '';

            // Return the rule stack depth where the nearest error rule can be found.
            // Return FALSE when no error recovery rule was found.
            function locateNearestErrorRecoveryRule(state) {
                var stack_probe = stack.length - 1;
                var depth = 0;

                // try to recover from error
                for(;;) {
                    // check for error recovery rule in this state
                    if ((TERROR.toString()) in table[state]) {
                        return depth;
                    }
                    if (state === 0 || stack_probe < 2) {
                        return false; // No suitable error recovery rule available.
                    }
                    stack_probe -= 2; // popStack(1): [symbol, action]
                    state = stack[stack_probe];
                    ++depth;
                }
            }

            if (!recovering) {
                // first see if there's any chance at hitting an error recovery rule:
                error_rule_depth = locateNearestErrorRecoveryRule(state);

                // Report error
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push("'"+this.terminals_[p]+"'");
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + (this.terminals_[symbol] || symbol)+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == EOF ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected,
                    recoverable: (error_rule_depth !== false)
                });
            } else if (preErrorSymbol !== EOF) {
                error_rule_depth = locateNearestErrorRecoveryRule(state);
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol === EOF || preErrorSymbol === EOF) {
                    throw new Error(errStr || 'Parsing halted while starting to recover from another error.');
                }

                // discard current lookahead and grab another
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            if (error_rule_depth === false) {
                throw new Error(errStr || 'Parsing halted. No suitable error recovery rule available.');
            }
            popStack(error_rule_depth);

            preErrorSymbol = (symbol == TERROR ? null : symbol); // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {
            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(lexer.yytext);
                lstack.push(lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = lexer.yyleng;
                    yytext = lexer.yytext;
                    yylineno = lexer.yylineno;
                    yyloc = lexer.yylloc;
                    if (recovering > 0) {
                        recovering--;
                    }
                } else {
                    // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2:
                // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                if (ranges) {
                  yyval._$.range = [lstack[lstack.length-(len||1)].range[0], lstack[lstack.length-1].range[1]];
                }
                r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3:
                // accept
                return true;
        }

    }

    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 8;
break;
case 2:return 8;
break;
case 3:return 21;
break;
case 4:return 35;
break;
case 5:return 24;
break;
case 6:return 26;
break;
case 7:return 26;
break;
case 8:return 25;
break;
case 9:return 21;
break;
case 10:return 31;
break;
case 11:return 31;
break;
case 12:return 33;
break;
case 13:return 28;
break;
case 14:return 9;
break;
case 15:return ' ';
break;
case 16:return 32;
break;
case 17:return 27;
break;
case 18:return 29;
break;
case 19:return 30;
break;
case 20:return 18;
break;
case 21:return 19;
break;
case 22:return 17;
break;
case 23:return 11;
break;
case 24:return 20;
break;
case 25:return 12;
break;
case 26:return 13;
break;
case 27:return 15;
break;
case 28:return 14;
break;
case 29:return 16;
break;
case 30:return '"';
break;
case 31:return "'";
break;
case 32:return "!";
break;
case 33:return 10;
break;
case 34:return 34;
break;
case 35:return '#';
break;
case 36:return 5;
break;
}
},
rules: [/^(?:\s+)/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:[A-Za-z]{1,}[A-Za-z_0-9\.]+(?=[(]))/,/^(?:#[A-Z0-9\/]+(!|\?)?)/,/^(?:\$[A-Za-z]+\$[0-9]+)/,/^(?:\$[A-Za-z]+[0-9]+)/,/^(?:[A-Za-z]+\$[0-9]+)/,/^(?:[A-Za-z]+[0-9]+)/,/^(?:[A-Za-z\.]+(?=[(]))/,/^(?:[A-Za-z]{1,}[A-Za-z_0-9]+)/,/^(?:[A-Za-z_]+)/,/^(?:[0-9]+)/,/^(?:\[(.*)?\])/,/^(?:&)/,/^(?: )/,/^(?:[.])/,/^(?::)/,/^(?:;)/,/^(?:,)/,/^(?:\*)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:\^)/,/^(?:\()/,/^(?:\))/,/^(?:>)/,/^(?:<)/,/^(?:NOT\b)/,/^(?:")/,/^(?:')/,/^(?:!)/,/^(?:=)/,/^(?:%)/,/^(?:[#])/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = grammarParser;
exports.Parser = grammarParser.Parser;
exports.parse = function () { return grammarParser.parse.apply(grammarParser, arguments); };
if (typeof module !== 'undefined' && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(42)(module), __webpack_require__(10)))

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.trimEdges = trimEdges;
/* eslint-disable import/prefer-default-export */
/**
 * Trim value by cutting character starting from the beginning and ending at the same time.
 *
 * @param {String} string String to trimming.
 * @param {Number} [margin=1] Number of character to cut.
 * @returns {String}
 */
function trimEdges(string) {
  var margin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

  string = string.substring(margin, string.length - margin);

  return string;
}

/***/ })
/******/ ]);
});