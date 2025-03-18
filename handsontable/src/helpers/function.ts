import { arrayReduce } from './array';
import { isDefined } from './mixed';

/**
 * Checks if given variable is function.
 *
 * @param {*} func Variable to check.
 * @returns {boolean}
 */
export function isFunction(func) {
  return typeof func === 'function';
}

/**
 * Creates throttle function that enforces a maximum number of times a function (`func`) can be called over time (`wait`).
 *
 * @param {Function} func Function to invoke.
 * @param {number} wait Delay in miliseconds.
 * @returns {Function}
 */
export function throttle(func, wait = 200) {
  let lastCalled = 0;
  const result = {
    lastCallThrottled: true
  };
  let lastTimer = null;

  /**
   * @param {...*} args The list of arguments passed during the function invocation.
   * @returns {object}
   */
  function _throttle(...args) {
    const stamp = Date.now();
    let needCall = false;

    result.lastCallThrottled = true;

    if (!lastCalled) {
      lastCalled = stamp;
      needCall = true;
    }
    const remaining = wait - (stamp - lastCalled);

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
        lastTimer = undefined;
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
 * @param {number} wait Delay in miliseconds.
 * @param {number} hits Number of hits after throttling will be applied.
 * @returns {Function}
 */
export function throttleAfterHits(func, wait = 200, hits = 10) {
  const funcThrottle = throttle(func, wait);
  let remainHits = hits;

  /**
   *
   */
  function _clearHits() {
    remainHits = hits;
  }
  /**
   * @param {*} args The list of arguments passed during the function invocation.
   * @returns {*}
   */
  function _throttleAfterHits(...args) {
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
 * @param {number} wait Delay in milliseconds.
 * @returns {Function}
 */
export function debounce(func, wait = 200) {
  let lastTimer = null;
  let result;

  /**
   * @param {*} args The list of arguments passed during the function invocation.
   * @returns {*}
   */
  function _debounce(...args) {
    if (lastTimer) {
      clearTimeout(lastTimer);
    }
    lastTimer = setTimeout(() => {
      result = func.apply(this, args);
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
export function pipe(...functions) {
  const [firstFunc, ...restFunc] = functions;

  return function _pipe(...args) {
    return arrayReduce(restFunc, (acc, fn) => fn(acc), firstFunc.apply(this, args));
  };
}

/**
 * Creates the function that returns the function with cached arguments.
 *
 * @param {Function} func Function to partialization.
 * @param {Array} params Function arguments to cache.
 * @returns {Function}
 */
export function partial(func, ...params) {
  return function _partial(...restParams) {
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
export function curry(func) {
  const argsLength = func.length;

  /**
   * @param {*} argsSoFar The list of arguments passed during the function invocation.
   * @returns {Function}
   */
  function given(argsSoFar) {
    return function _curry(...params) {
      const passedArgsSoFar = argsSoFar.concat(params);
      let result;

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
export function curryRight(func) {
  const argsLength = func.length;

  /**
   * @param {*} argsSoFar The list of arguments passed during the function invocation.
   * @returns {Function}
   */
  function given(argsSoFar) {
    return function _curry(...params) {
      const passedArgsSoFar = argsSoFar.concat(params.reverse());
      let result;

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
 * Calls a function in the quickest way available.
 *
 * In contrast to the `apply()` method that passes arguments as an array,
 * the `call()` method passes arguments directly, to avoid garbage collection costs.
 *
 * @param {Function} func The function to call.
 * @param {*} context The value to use as `this` when calling the `func` function.
 * @param {*} [arg1] An argument passed to the `func` function.
 * @param {*} [arg2] An argument passed to `func` function.
 * @param {*} [arg3] An argument passed to `func` function.
 * @param {*} [arg4] An argument passed to `func` function.
 * @param {*} [arg5] An argument passed to `func` function.
 * @param {*} [arg6] An argument passed to `func` function.
 * @returns {*}
 */
export function fastCall(func, context, arg1, arg2, arg3, arg4, arg5, arg6) {
  if (isDefined(arg6)) {
    return func.call(context, arg1, arg2, arg3, arg4, arg5, arg6);

  } else if (isDefined(arg5)) {
    return func.call(context, arg1, arg2, arg3, arg4, arg5);

  } else if (isDefined(arg4)) {
    return func.call(context, arg1, arg2, arg3, arg4);

  } else if (isDefined(arg3)) {
    return func.call(context, arg1, arg2, arg3);

  } else if (isDefined(arg2)) {
    return func.call(context, arg1, arg2);

  } else if (isDefined(arg1)) {
    return func.call(context, arg1);
  }

  return func.call(context);
}
