import { tokensKeys } from '../tokensKeys.mjs';
import { TOKENS_KEY } from './constants.mjs';

/**
 * Keys listed in `tokensKeys.mjs` that are legitimately absent from the per-theme token output.
 * `density` is a global (non-theme) variable group processed separately — see `OTHER_VARIABLES`
 * in `constants.mjs`.
 */
const OPTIONAL_TOKENS = new Set(['density']);

/**
 * Verifies that every key from `tokensKeys.mjs` (minus the documented exceptions above) was
 * produced for every theme. Guards against a `tokens.json` export that lost tokens: the generator
 * wipes `src/themes/static` before writing and `processThemeTokens` silently skips unresolved
 * keys, so a missing token would otherwise be stripped from the shipped themes without a trace —
 * e.g. the hand-authored `cell-selection-handle-*` tokens that are not yet part of the Figma
 * token set.
 *
 * @param {object} themeVariables The generated variables object, keyed by category.
 * @throws {Error} When any theme lacks a required token key, listing every `theme: keys` pair.
 */
export function validateThemeTokens(themeVariables) {
  const problems = [];

  for (const [themeName, tokens] of Object.entries(themeVariables[TOKENS_KEY])) {
    const missing = tokensKeys.filter(key => !OPTIONAL_TOKENS.has(key) && !(key in tokens));

    if (missing.length > 0) {
      problems.push(`  ${themeName}: ${missing.join(', ')}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      'tokens.json is missing expected theme tokens (aborting before wiping src/themes/static):\n'
      + `${problems.join('\n')}\n`
      + 'Every key listed in scripts/themes/figma/tokensKeys.mjs must resolve in the Figma export.',
    );
  }
}
