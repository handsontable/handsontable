/**
 * This extension marks specs as flaky. Theme-specific expectations belong in `getThemeLayout()`
 * (e.g. `e2e*` helpers) so each spec runs once per theme job.
 *
 * @example
 * ```
 * it.flaky('should eventually pass', async() => {
 *  // flaky spec - retried up to 3 times before reporting failure
 * });
 * ```
 */
const originalIt = global.it;
const originalFit = global.fit;
const originalXit = global.xit;

const FLAKY_MAX_RETRIES = 3;

/**
 * Runs the original function with the provided description and spec definitions.
 *
 * @param {Function} originalFn - The original function to be executed.
 * @param {string} description - The description of the spec.
 * @param {Function} specDefinitions - The function containing the spec definitions.
 * @returns {*} The result of the original function execution.
 */
function runOriginalFn(originalFn, description, specDefinitions) {
  return originalFn(description, specDefinitions);
}

/**
 * Cleans up the test container between flaky test retries by destroying any existing
 * Handsontable instance and clearing the container's contents.
 */
function cleanUpBetweenRetries() {
  const container = document.querySelector('#testContainer');

  if (container) {
    const $container = $(container);

    try {
      const instance = $container.data('handsontable');

      if (instance && !instance.isDestroyed) {
        instance.destroy();
      }
    } catch (_e) {
      // No instance to destroy - container may not have a HOT instance.
    }

    $container.removeData();
    container.innerHTML = '';
  }
}

/**
 * Wraps a spec function with retry logic for flaky tests. If the spec fails, it is retried
 * up to {@link FLAKY_MAX_RETRIES} times. Between retries, any existing Handsontable instance
 * is destroyed and the test container is cleared.
 *
 * On non-final attempts, Jasmine's `Spec.prototype.addExpectationResult` is intercepted so that
 * expectation failures are swallowed (not recorded in the spec result) and can be detected for
 * retry. On the final attempt, the spec runs with standard Jasmine behavior so failures are
 * reported normally.
 *
 * @param {Function} originalFn - The original Jasmine `it` or `fit` function.
 * @param {string} description - The description of the spec.
 * @param {Function} specDefinitions - The async function containing the spec definitions.
 * @returns {*} The result of the original function execution.
 */
function runFlakyFn(originalFn, description, specDefinitions) {
  return originalFn(`[flaky] ${description}`, async function() {
    const origAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;

    for (let attempt = 1; attempt <= FLAKY_MAX_RETRIES; attempt++) {
      let expectationFailed = false;
      let caughtError = null;

      // Suppress all expectation results during non-final attempts to avoid duplicates
      // across retries and to keep retry internals invisible to Jasmine's result tracking.
      jasmine.Spec.prototype.addExpectationResult = function(passed) {
        if (!passed) {
          expectationFailed = true;
        }
      };

      try {
        await specDefinitions.call(this);
      } catch (error) {
        caughtError = error;
      } finally {
        jasmine.Spec.prototype.addExpectationResult = origAddExpectationResult;
      }

      if (!expectationFailed && !caughtError) {
        return;
      }

      cleanUpBetweenRetries();
    }

    // Final attempt - run with standard Jasmine behavior so failures are reported normally.
    await specDefinitions.call(this);
  });
}

const it = (description, specDefinitions) => runOriginalFn(originalIt, description, specDefinitions);
const fit = (description, specDefinitions) => runOriginalFn(originalFit, description, specDefinitions);
const xit = (description, specDefinitions) => runOriginalFn(originalXit, description, specDefinitions);

it.flaky = (description, specDefinitions) => runFlakyFn(originalIt, description, specDefinitions);
fit.flaky = (description, specDefinitions) => runFlakyFn(originalFit, description, specDefinitions);

global.it = it;
global.fit = fit;
global.xit = xit;
