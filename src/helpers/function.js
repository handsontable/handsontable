
export function proxy(fun, context) {
  return function () {
    return fun.apply(context, arguments);
  };
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
