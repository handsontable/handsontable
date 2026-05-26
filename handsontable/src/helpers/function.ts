import { arrayReduce } from './array';
import { isDefined } from './mixed';

/**
 * Checks if given variable is function.
 *
 * @param {*} func Variable to check.
 * @returns {boolean}
 */
export function isFunction<T>(func: T): func is T & ((...args: unknown[]) => unknown) {
  return typeof func === 'function';
}

/**
 * Creates throttle function that enforces a maximum number of times a function (`func`) can be called over time (`wait`).
 *
 * @param {Function} func Function to invoke.
 * @param {number} wait Delay in miliseconds.
 * @returns {Function}
 */
export function throttle(func: (...args: unknown[]) => unknown, wait: number = 200): (...args: unknown[]) => unknown {
  let lastCalled = 0;
  const result = {
    lastCallThrottled: true
  };
  let lastTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param {...*} args The list of arguments passed during the function invocation.
   * @returns {object}
   */
  function _throttle(...args: unknown[]) {
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
export function throttleAfterHits(
  func: (...args: unknown[]) => unknown, wait: number = 200, hits: number = 10): (...args: unknown[]) => unknown {
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
  function _throttleAfterHits(...args: unknown[]) {
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
 * @returns {Function} The debounced function. It has a `cancel` method that clears a pending timer.
 */
export function debounce(
  func: (...args: unknown[]) => unknown,
  wait: number = 200): ((...args: unknown[]) => unknown) & { cancel: () => void } {
  let lastTimer: ReturnType<typeof setTimeout> | null = null;
  let result: unknown;

  /**
   * @param {*} args The list of arguments passed during the function invocation.
   * @returns {*}
   */
  function _debounce(...args: unknown[]) {
    if (lastTimer) {
      clearTimeout(lastTimer);
    }
    lastTimer = setTimeout(() => {
      lastTimer = null;
      result = func.apply(this, args);
    }, wait);

    return result;
  }

  /**
   * Clears the scheduled invocation so the debounced function does not run later.
   */
  function cancel() {
    if (lastTimer !== null) {
      clearTimeout(lastTimer);
      lastTimer = null;
    }
  }

  _debounce.cancel = cancel;

  return _debounce;
}

/**
 * Creates the function that returns the result of calling the given functions. Result of the first function is passed to
 * the second as an argument and so on. Only first function in the chain can handle multiple arguments.
 *
 * @param {Function} functions Functions to compose.
 * @returns {Function}
 */
export function pipe(...functions: Array<(...args: unknown[]) => unknown>): (...args: unknown[]) => unknown {
  const [firstFunc, ...restFunc] = functions;

  return function _pipe(...args) {
    return arrayReduce(
      restFunc, (acc, fn) => (fn as (...args: unknown[]) => unknown)(acc), firstFunc.apply(this, args));
  };
}

/**
 * Creates the function that returns the function with cached arguments.
 *
 * @param {Function} func Function to partialization.
 * @param {Array} params Function arguments to cache.
 * @returns {Function}
 */
export function partial(func: (...args: never[]) => unknown, ...params: unknown[]): (...args: unknown[]) => unknown {
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
export function curry(func: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown {
  const argsLength = func.length;

  /**
   * @param {*} argsSoFar The list of arguments passed during the function invocation.
   * @returns {Function}
   */
  function given(argsSoFar: unknown[]) {
    return function _curry(...params: unknown[]) {
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
export function curryRight(func: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown {
  const argsLength = func.length;

  /**
   * @param {*} argsSoFar The list of arguments passed during the function invocation.
   * @returns {Function}
   */
  function given(argsSoFar: unknown[]) {
    return function _curry(...params: unknown[]) {
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
export function fastCall(
  func: (...args: unknown[]) => unknown, context: unknown,
  arg1?: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown, arg5?: unknown, arg6?: unknown): unknown {
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
