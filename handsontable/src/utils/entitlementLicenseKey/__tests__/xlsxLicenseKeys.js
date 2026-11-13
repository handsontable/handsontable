import { buildTestKey } from './buildTestKey';
import { XLSX_CAPABILITY_IDS } from '../../xlsxEngine/licenseCapabilities';

/**
 * The shared TEST-ONLY license keys for the xlsx capability gates. The Jest suites of `exportFile` and
 * `importFile` import it, and so does the Playwright fixture `tests/fixtures/xlsxLicenseKeys.ts`, which
 * re-exports it - so moving or renaming this file breaks those specs too.
 *
 * It deliberately names no product package ("Standard", "Pro", ...): which tokens a product grants is
 * decided where keys are issued and can change at any time. `keyWithTier()` takes the tier names it is
 * given, never a real product tier.
 */

/**
 * Every gated `xlsx:*` feature id, in the order the core declares them. `xlsx:import_report` is
 * not one of them: it is never gated.
 *
 * @type {string[]}
 */
export const ALL_XLSX_TOKENS = XLSX_CAPABILITY_IDS;

/**
 * Builds a current subscription key whose Handsontable entry lists `core` plus `tokens` and no
 * `tier:<name>` token. Only a tier restricts a key, so this key unlocks every feature, whatever tokens it
 * lists: the case that proves a token outside a tier changes nothing. Like `keyWithTier()`, it is a
 * perpetual key for every build released up to 2099-12-31, so no test depends on the clock.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
export function keyWithoutTier(tokens, flags = []) {
  return buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core', ...tokens],
        release_until: '2099-12-31',
        notice: 60,
        grace: 90,
        flags,
      },
    },
  });
}

/**
 * Builds a perpetual key for every build released up to 2099-12-31, so no test depends on the clock,
 * whose Handsontable entry lists one `tier:<name>` token per tier and nothing else.
 *
 * @param {string[]} tiers The tier names.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
export function keyWithTier(tiers, flags = []) {
  return buildTestKey({
    products: {
      handsontable: {
        capabilities: tiers.map(tier => `tier:${tier}`),
        release_until: '2099-12-31',
        notice: 60,
        grace: 90,
        flags,
      },
    },
  });
}
