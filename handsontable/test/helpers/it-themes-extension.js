/**
 * This extension allows to run specs only for a specific theme.
 * If the currently loaded theme doesn't match the specified one, the spec will be marked as pending.
 *
 * @example
 * ```
 * it.forTheme('main')('should do something', () => {
 *  // your spec
 * });
 * ```
 */
const originalIt = global.it;
const originalFit = global.fit;
const originalXit = global.xit;

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
  if ((__ENV_ARGS__.HOT_THEME || 'classic') === themeName) {
    originalFn(description, specDefinition);
  }
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

global.it = it;
global.fit = fit;
global.xit = xit;
