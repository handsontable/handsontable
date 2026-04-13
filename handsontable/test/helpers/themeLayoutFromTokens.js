import { createThemeLayoutCore } from './themeLayoutCore';
import { buildThemeLayoutE2eHelpers } from './themeLayoutE2eHelpers';

/**
 * Compute layout metrics for a given theme by resolving the same static token,
 * sizing and density modules that production themes use.
 *
 * This module composes {@link createThemeLayoutCore} (token primitives) with
 * {@link buildThemeLayoutE2eHelpers} (hashed E2E regression expectations). Add new themes in
 * `themeLayoutCore.js`; add scenario-specific expectations in `themeLayoutE2eHelpers.js`.
 *
 * @param {string} themeName Theme key (`classic`, `main`, `horizon`, …).
 * @returns {object} Merged layout API for tests.
 */
export function themeLayoutFromTokens(themeName) {
  const core = createThemeLayoutCore(themeName);

  return {
    ...core,
    ...buildThemeLayoutE2eHelpers(core),
  };
}
