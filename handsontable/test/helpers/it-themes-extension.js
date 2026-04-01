/**
 * This extension allows to run specs only for a specific theme and to mark specs as flaky.
 *
 * @example
 * ```
 * it.forTheme('main')('should do something', () => {
 *  // your spec
 * });
 *
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
 * Runs the original function under specific conditions based on the theme name.
 *
 * @param {Function} originalFn - The original function to be executed.
 * @param {string} themeName - The name of the theme to check against.
 * @param {string} description - The description of the spec.
 * @param {Function} specDefinition - The function containing the spec definitions.
 */
function runOriginalFnUnderConditions(originalFn, themeName, description, specDefinition) {
  if (__ENV_ARGS__.HOT_THEME === themeName) {
    originalFn(description, specDefinition);
  }
}

/**
 * Wraps a spec function with retry logic for flaky tests. If the spec fails, it is retried
 * up to {@link FLAKY_MAX_RETRIES} times. Between retries, any existing Handsontable instance
 * is destroyed and the test container is re-created.
 *
 * @param {Function} originalFn - The original Jasmine `it` or `fit` function.
 * @param {string} description - The description of the spec.
 * @param {Function} specDefinitions - The async function containing the spec definitions.
 * @returns {*} The result of the original function execution.
 */
function runFlakyFn(originalFn, description, specDefinitions) {
  return originalFn(`[flaky] ${description}`, async function() {
    let lastError;

    for (let attempt = 1; attempt <= FLAKY_MAX_RETRIES; attempt++) {
      try {
        await specDefinitions.call(this);

        return;
      } catch (error) {
        lastError = error;

        if (attempt < FLAKY_MAX_RETRIES) {
          // Clean up between retries by destroying any HOT instance and re-creating the container.
          const container = document.querySelector('#testContainer');

          if (container) {
            try {
              const instance = $(container).handsontable('getInstance');

              if (instance && !instance.isDestroyed) {
                instance.destroy();
              }
            } catch (_e) {
              // No instance to destroy - container may not have a HOT instance.
            }

            container.innerHTML = '';
          }
        }
      }
    }

    throw lastError;
  });
}

/**
 * Helper function allowing to run specs only for a specific theme.
 * If no "chained" call of `it.forTheme()` is used, it will behave as the original `it` function.
 *
 * @param {string} description The description of the spec.
 * @param {Function} specDefinitions The function containing the spec.
 * @returns {Function}
 */
const it = (description, specDefinitions) => runOriginalFn(originalIt, description, specDefinitions);
const fit = (description, specDefinitions) => runOriginalFn(originalFit, description, specDefinitions);
const xit = (description, specDefinitions) => runOriginalFn(originalXit, description, specDefinitions);

it.forTheme = themeName => (description, specDefinition) =>
  runOriginalFnUnderConditions(originalIt, themeName, description, specDefinition);

fit.forTheme = themeName => (description, specDefinition) =>
  runOriginalFnUnderConditions(originalFit, themeName, description, specDefinition);

xit.forTheme = themeName => (description, specDefinition) =>
  runOriginalFnUnderConditions(originalXit, themeName, description, specDefinition);

it.flaky = (description, specDefinitions) => runFlakyFn(originalIt, description, specDefinitions);
fit.flaky = (description, specDefinitions) => runFlakyFn(originalFit, description, specDefinitions);

global.it = it;
global.fit = fit;
global.xit = xit;
