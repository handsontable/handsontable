/**
 * Extends (wraps) the method to wait for the scroll event to be triggered before resolving the promise.
 * The decorator function is useful for helpers that change the scroll position of the table.
 *
 * @param {Function} wrappedMethod The method to be executed.
 * @returns {Function}
 */
export function waitOnScroll(wrappedMethod) {
  return (...methodArgs) => {
    return new Promise((resolve) => {
      let result;

      // in case when the helper method is not key-worded with `await` and the test finishes before
      // the promise is executed (the HoT instance is destroyed), resolve it immediately as-is
      if (!hot() || hot().isDestroyed) {
        resolve(result);

        return;
      }

      const wtScroll = hot().view._wt.wtScroll;
      const origScrollViewportHorizontally = wtScroll.scrollViewportHorizontally;
      const origScrollViewportVertically = wtScroll.scrollViewportVertically;
      let isScrollCalled = false;
      let isScrollHappened = false;

      wtScroll.scrollViewportHorizontally = function(...args) {
        isScrollCalled = true;

        const isScrolled = origScrollViewportHorizontally.apply(this, args);

        if (isScrolled) {
          isScrollHappened = true;
        }

        return isScrolled;
      };
      wtScroll.scrollViewportVertically = function(...args) {
        isScrollCalled = true;

        const isScrolled = origScrollViewportVertically.apply(this, args);

        if (isScrolled) {
          isScrollHappened = true;
        }

        return isScrolled;
      };

      const scrollCallback = () => {
        resolve(result);
      };

      hot().addHookOnce('afterScroll', scrollCallback);

      result = wrappedMethod(...methodArgs);

      if (!isScrollCalled || isScrollCalled && !isScrollHappened) {
        hot().removeHook('afterScroll', scrollCallback);
        window.queueMicrotask(() => resolve(result));
      } else {
        // trigger fast render which will trigger the `afterScroll` event
        hot().view.render();
      }

      wtScroll.scrollViewportHorizontally = origScrollViewportHorizontally;
      wtScroll.scrollViewportVertically = origScrollViewportVertically;
    });
  };
}
