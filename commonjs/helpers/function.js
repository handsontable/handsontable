'use strict';

exports.__esModule = true;
exports.isFunction = isFunction;
exports.throttle = throttle;
exports.throttleAfterHits = throttleAfterHits;
exports.debounce = debounce;
exports.pipe = pipe;
exports.partial = partial;
exports.curry = curry;
exports.curryRight = curryRight;

var _array = require('./array');

/**
 * Checks if given variable is function.
 *
 * @param {*} func Variable to check.
 * @returns {Boolean}
 */
function isFunction(func) {
  return typeof func === 'function';
}

/**
 * Creates throttle function that enforces a maximum number of times a function (`func`) can be called over time (`wait`).
 *
 * @param {Function} func Function to invoke.
 * @param {Number} wait Delay in miliseconds.
 * @returns {Function}
 */
function throttle(func) {
  var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

  var lastCalled = 0;
  var result = {
    lastCallThrottled: true
  };
  var lastTimer = null;

  function _throttle() {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var stamp = Date.now();
    var needCall = false;

    result.lastCallThrottled = true;

    if (!lastCalled) {
      lastCalled = stamp;
      needCall = true;
    }
    var remaining = wait - (stamp - lastCalled);

    if (needCall) {
      result.lastCallThrottled = false;
      func.apply(this, args);
    } else {
      if (lastTimer) {
        clearTimeout(lastTimer);
      }
      lastTimer = setTimeout(function () {
        result.lastCallThrottled = false;
        func.apply(_this, args);
        lastCalled = 0;
        lastTimer = void 0;
      }, remaining);
    }

    return result;
  }

  return _throttle;
}

/**
 * Creates throttle function that enforces a maximum number of times a function (`func`) can be called over
 * time (`wait`) after specified hits.
 *
 * @param {Function} func Function to invoke.
 * @param {Number} wait Delay in miliseconds.
 * @param {Number} hits Number of hits after throttling will be applied.
 * @returns {Function}
 */
function throttleAfterHits(func) {
  var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;
  var hits = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;

  var funcThrottle = throttle(func, wait);
  var remainHits = hits;

  function _clearHits() {
    remainHits = hits;
  }
  function _throttleAfterHits() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    if (remainHits) {
      remainHits -= 1;

      return func.apply(this, args);
    }

    return funcThrottle.apply(this, args);
  }
  _throttleAfterHits.clearHits = _clearHits;

  return _throttleAfterHits;
}

/**
 * Creates debounce function that enforces a function (`func`) not be called again until a certain amount of time (`wait`)
 * has passed without it being called.
 *
 * @param {Function} func Function to invoke.
 * @param {Number} wait Delay in milliseconds.
 * @returns {Function}
 */
function debounce(func) {
  var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

  var lastTimer = null;
  var result = void 0;

  function _debounce() {
    var _this2 = this;

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    if (lastTimer) {
      clearTimeout(lastTimer);
    }
    lastTimer = setTimeout(function () {
      result = func.apply(_this2, args);
    }, wait);

    return result;
  }

  return _debounce;
}

/**
 * Creates the function that returns the result of calling the given functions. Result of the first function is passed to
 * the second as an argument and so on. Only first function in the chain can handle multiple arguments.
 *
 * @param {Function} functions Functions to compose.
 * @returns {Function}
 */
function pipe() {
  for (var _len4 = arguments.length, functions = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    functions[_key4] = arguments[_key4];
  }

  var firstFunc = functions[0],
      restFunc = functions.slice(1);


  return function _pipe() {
    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    return (0, _array.arrayReduce)(restFunc, function (acc, fn) {
      return fn(acc);
    }, firstFunc.apply(this, args));
  };
}

/**
 * Creates the function that returns the function with cached arguments.
 *
 * @param {Function} func Function to partialization.
 * @param {Array} params Function arguments to cache.
 * @returns {Function}
 */
function partial(func) {
  for (var _len6 = arguments.length, params = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
    params[_key6 - 1] = arguments[_key6];
  }

  return function _partial() {
    for (var _len7 = arguments.length, restParams = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
      restParams[_key7] = arguments[_key7];
    }

    return func.apply(this, params.concat(restParams));
  };
}

/**
 * Creates the functions that returns the function with cached arguments. If count if passed arguments will be matched
 * to the arguments defined in `func` then function will be invoked.
 * Arguments are added to the stack in direction from the left to the right.
 *
 * @example
 * ```
 * var replace = curry(function(find, replace, string) {
 *   return string.replace(find, replace);
 * });
 *
 * // returns function with bounded first argument
 * var replace = replace('foo')
 *
 * // returns replaced string - all arguments was passed so function was invoked
 * replace('bar', 'Some test with foo...');
 *
 * ```
 *
 * @param {Function} func Function to currying.
 * @returns {Function}
 */
function curry(func) {
  var argsLength = func.length;

  function given(argsSoFar) {
    return function _curry() {
      for (var _len8 = arguments.length, params = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        params[_key8] = arguments[_key8];
      }

      var passedArgsSoFar = argsSoFar.concat(params);
      var result = void 0;

      if (passedArgsSoFar.length >= argsLength) {
        result = func.apply(this, passedArgsSoFar);
      } else {
        result = given(passedArgsSoFar);
      }

      return result;
    };
  }

  return given([]);
}

/**
 * Creates the functions that returns the function with cached arguments. If count if passed arguments will be matched
 * to the arguments defined in `func` then function will be invoked.
 * Arguments are added to the stack in direction from the right to the left.
 *
 * @example
 * ```
 * var replace = curry(function(find, replace, string) {
 *   return string.replace(find, replace);
 * });
 *
 * // returns function with bounded first argument
 * var replace = replace('Some test with foo...')
 *
 * // returns replaced string - all arguments was passed so function was invoked
 * replace('bar', 'foo');
 *
 * ```
 *
 * @param {Function} func Function to currying.
 * @returns {Function}
 */
function curryRight(func) {
  var argsLength = func.length;

  function given(argsSoFar) {
    return function _curry() {
      for (var _len9 = arguments.length, params = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        params[_key9] = arguments[_key9];
      }

      var passedArgsSoFar = argsSoFar.concat(params.reverse());
      var result = void 0;

      if (passedArgsSoFar.length >= argsLength) {
        result = func.apply(this, passedArgsSoFar);
      } else {
        result = given(passedArgsSoFar);
      }

      return result;
    };
  }

  return given([]);
}