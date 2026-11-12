import { buildTestKey } from './buildTestKey';
import { LISTED_CAPABILITIES_FLAG, XLSX_CAPABILITY_IDS } from '../../xlsxEngine/licenseCapabilities';

/**
 * The shared TEST-ONLY license keys for the xlsx capability gates. The Jest suites of `exportFile` and
 * `importFile` import it, and so does the Playwright fixture `tests/fixtures/xlsxLicenseKeys.ts`, which
 * re-exports it - so moving or renaming this file breaks those specs too.
 *
 * It deliberately names no product package ("Standard", "Pro", ...): which tokens a product grants is
 * decided where keys are issued and can change at any time. Tests build keys from single tokens and
 * arbitrary sets of them, and `keyWithTier()` takes the tier names it is given, never a real product tier.
 */

/**
 * Every `xlsx:*` token a key can list, in the order the core declares them. `xlsx:import_report` is
 * not one of them: it is a `core` feature every key gets.
 *
 * @type {string[]}
 */
export const ALL_XLSX_TOKENS = XLSX_CAPABILITY_IDS;

/**
 * The per-product key flag that makes a key unlock exactly the tokens it lists (the feature
 * manifest's `keyFlag`). A product entry without it unlocks every feature.
 *
 * @type {string}
 */
export { LISTED_CAPABILITIES_FLAG };

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
 * Builds a current subscription key (the dates of `keyWithoutFlag`) whose Handsontable entry lists one
 * `tier:<name>` token per tier and nothing else.
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
        usage_until: '2027-08-12',
        notice: 60,
        grace: 90,
        flags,
      },
    },
  });
}

/**
 * The plugin and cell type grants every flagged test key carries. A flagged key also turns off each
 * plugin and cell type it does not list, so without them the grid under test would lose MergeCells,
 * Comments, Formulas, AutoColumnSize and the ExportFile and ImportFile calls themselves; these keys
 * restrict the xlsx family only.
 *
 * @type {string[]}
 */
export const NON_XLSX_TOKENS = Object.freeze(['feat:all', 'cell:all']);

/**
 * Builds a current subscription key that unlocks every plugin and cell type, and of the xlsx family
 * exactly `tokens`: it always carries the `listed-capabilities` flag, besides `flags`.
 *
 * @param {string[]} tokens The xlsx capability tokens besides `core`.
 * @param {string[]} [flags] Further product flags.
 * @returns {string}
 */
export function keyWith(tokens, flags = []) {
  return keyWithoutFlag([...NON_XLSX_TOKENS, ...tokens], [LISTED_CAPABILITIES_FLAG, ...flags]);
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
