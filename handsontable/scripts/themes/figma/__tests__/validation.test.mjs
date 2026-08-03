import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateThemeTokens } from '../utils/validation.mjs';
import { tokensKeys } from '../tokensKeys.mjs';
import { TOKENS_KEY } from '../utils/constants.mjs';

/**
 * Builds a themeVariables object whose themes contain every required token key.
 *
 * @param {string[]} [withoutKeys] Keys to omit from the `main` theme.
 * @returns {object} A minimal themeVariables shape for `validateThemeTokens`.
 */
function buildThemeVariables(withoutKeys = []) {
  const complete = Object.fromEntries(tokensKeys.map(key => [key, '1px']));
  const main = { ...complete };

  withoutKeys.forEach((key) => {
    delete main[key];
  });

  return { [TOKENS_KEY]: { main, horizon: { ...complete } } };
}

test('validateThemeTokens passes when every theme holds every required key', () => {
  assert.doesNotThrow(() => validateThemeTokens(buildThemeVariables()));
});

test('validateThemeTokens throws naming the theme and the missing key', () => {
  // The hand-authored selection-handle tokens are exactly the keys this guard exists for:
  // they are not yet in the Figma token set, so a regeneration from a raw export would
  // silently strip them from the committed themes.
  assert.throws(
    () => validateThemeTokens(buildThemeVariables(['cell-selection-handle-size'])),
    /main: cell-selection-handle-size/,
  );
});

test('validateThemeTokens ignores the documented optional keys', () => {
  // `density` is a global (non-theme) variable group — its absence from per-theme output
  // is the expected state of the committed themes today.
  assert.doesNotThrow(() => validateThemeTokens(buildThemeVariables(['density'])));
});
