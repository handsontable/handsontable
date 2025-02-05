const KNOWN_THEMES = ['classic', 'main'];

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

/**
 * Helper function allowing to run specs only for a specific theme.
 * If no "chained" call of `it.forTheme()` is used, it will behave as the original `it` function.
 *
 * @param {string} description The description of the spec.
 * @param {Function} specDefinitions The function containing the spec.
 * @returns {Function}
 */
function it(description, specDefinitions) {
  return originalIt(description, specDefinitions);
}

it.forTheme = themeName => (description, specDefinition) => {
  if (
    ((__ENV_ARGS__.HOT_THEME || 'classic') === themeName) ||
    (!KNOWN_THEMES.includes(__ENV_ARGS__.HOT_THEME) && themeName === 'classic')
  ) {
    originalIt(description, specDefinition);
  }
};

global.it = it;
