import { buildTestKey } from './buildTestKey';
import { XLSX_CAPABILITY_IDS } from '../../xlsxEngine/licenseCapabilities';

/**
 * The shared TEST-ONLY license keys for the xlsx capability gates. The Jest suites of `exportFile` and
 * `importFile` import it, and so does the Playwright fixture `tests/fixtures/xlsxLicenseKeys.ts`, which
 * re-exports it - so moving or renaming this file breaks those specs too.
 */

/**
 * Every `xlsx:*` token a key can list, in the order the core declares them. `xlsx:import_report` is
 * not one of them: it is a `core` feature every key gets.
 *
 * @type {string[]}
 */
export const ALL_XLSX_TOKENS = XLSX_CAPABILITY_IDS;

/**
 * The tokens of the standard xlsx tier.
 *
 * @type {string[]}
 */
export const STANDARD_TOKENS = Object.freeze(['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout']);

/**
 * Builds a current subscription key granting `core` plus `tokens`, without the `listed-capabilities`
 * flag: such a key unlocks every xlsx feature, whatever it lists. It runs to 2027-08-12 with a 60-day
 * notice and a 90-day grace period.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
export function keyWithoutFlag(tokens, flags = []) {
  return buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core', ...tokens],
        usage_until: '2027-08-12',
        notice: 60,
        grace: 90,
        flags,
      },
    },
  });
}

/**
 * Builds a current subscription key that unlocks exactly `core` plus `tokens`: it always carries the
 * `listed-capabilities` flag, besides `flags`.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @param {string[]} [flags] Further product flags.
 * @returns {string}
 */
export function keyWith(tokens, flags = []) {
  return keyWithoutFlag(tokens, ['listed-capabilities', ...flags]);
}

/**
 * Builds a key that unlocks every xlsx token but `token`.
 *
 * @param {string} token The token to leave out.
 * @returns {string}
 */
export function keyWithout(token) {
  if (!ALL_XLSX_TOKENS.includes(token)) {
    // `xlsx:import_report` lands here too: it is `core`, so no key can leave it out.
    throw new Error(`Unknown xlsx token ${JSON.stringify(token)}.`);
  }

  return keyWith(ALL_XLSX_TOKENS.filter(id => id !== token));
}

/**
 * Builds a flagged key that lists `xlsx:all`, the grant of the whole xlsx namespace, and no other
 * xlsx token: it unlocks every xlsx feature.
 *
 * @param {string[]} [flags] Further product flags.
 * @returns {string}
 */
export function keyWithAll(flags = []) {
  return keyWith(['xlsx:all'], flags);
}
