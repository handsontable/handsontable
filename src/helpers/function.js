/**
 * Returns new function that, when called, has new context (`this` keyword).
 *
 * @param func Function to proxy.
 * @param context Value passed as the `this` to the function.
 * @returns {Function}
 */
export function proxy(func, context) {
  return function() {
    return func.apply(context, arguments);
  };
}

/**
 * Creates throttle function that enforces a maximum number of times a function (`func`) can be called over time (`wait`).
 *
 * @param {Function} func Function to invoke.
 * @param {Number} wait Delay in miliseconds.
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
 * Creates throttle function that enforces a maximum number of times a function (`func`) can be called over
 * time (`wait`) after specified hits.
 *
 * @param {Function} func Function to invoke.
 * @param {Number} wait Delay in miliseconds.
 * @param {Number} hits Number of hits after throttling will be applied.
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
      remainHits--;

      return func.apply(this, arguments);
    }

    return funcThrottle.apply(this, arguments);
  }
  _throttleAfterHits.clearHits = _clearHits;

  return _throttleAfterHits;
}

/**
 * Creates debounce function that enforces a function (`func`) not be called again until a certain amount of time (`wait`)
 * has passed without it being called.
 *
 * @param {Function} func Function to invoke.
 * @param {Number} wait Delay in miliseconds.
 * @returns {Function}
 */
export function debounce(func, wait = 200) {
  let needCall = false;
  let lastTimer = null;
  let result;

  function _debounce() {
    const args = arguments;

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
