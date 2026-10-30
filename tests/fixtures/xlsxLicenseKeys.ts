// The core package's test-only key builder and its fixtures are plain JS modules that import the
// reader's TypeScript (`../extractKeyData`, `../encoding`). Playwright's loader follows that chain,
// so the keys are built here at load time rather than generated into a JSON file.
import { buildTestKey } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/fixtures';

/**
 * Every `xlsx:*` token a key must list, in the order the core declares them
 * (`handsontable/src/utils/xlsxEngine/licenseCapabilities.ts`, held equal to `features.json`).
 * `xlsx:import_report` is not one of them: it is a `core` feature every key gets.
 */
export const ALL_XLSX_TOKENS: readonly string[] = Object.freeze([
  'xlsx:import',
  'xlsx:export',
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
]);

/**
 * The tokens of the standard xlsx tier.
 */
export const STANDARD_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'] as const;

/**
 * The legacy evaluation key: unrestricted for the whole xlsx family.
 */
export const LEGACY_KEY = 'non-commercial-and-evaluation';

/**
 * The per-product key flag that makes a key unlock exactly the tokens it lists (the feature
 * manifest's `keyFlag`). A product entry without it unlocks every feature.
 */
export const LISTED_CAPABILITIES_FLAG = 'listed-capabilities';

/**
 * A current subscription key with the `core` capability only, as the real generator issued it. It
 * carries no `listed-capabilities` flag, so it is unrestricted for the whole family.
 */
export const CORE_ONLY_KEY: string = SUBSCRIPTION_KEY;

/**
 * Builds a current subscription key that grants `core` plus `tokens` and does NOT carry the
 * `listed-capabilities` flag, so it unlocks every xlsx feature whatever it lists. It runs to
 * 2027-08-12 with a 60-day notice and a 90-day grace period, the same window as `CORE_ONLY_KEY`, so
 * the page object's pinned clock keeps it far from its notice period.
 *
 * @param {readonly string[]} tokens The capability tokens to grant besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
export function keyWithoutFlag(tokens: readonly string[], flags: string[] = []): string {
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
 * @param {readonly string[]} tokens The capability tokens to grant besides `core`.
 * @param {string[]} [flags] Further product flags.
 * @returns {string}
 */
export function keyWith(tokens: readonly string[], flags: string[] = []): string {
  return keyWithoutFlag(tokens, [LISTED_CAPABILITIES_FLAG, ...flags]);
}

/**
 * Builds a key that grants every xlsx token but `token`.
 *
 * @param {string} token The token to leave out.
 * @returns {string}
 */
export function keyWithout(token: string): string {
  if (!ALL_XLSX_TOKENS.includes(token)) {
    // `xlsx:import_report` lands here too: it is `core`, so no key can leave it out.
    throw new Error(`Unknown xlsx token ${JSON.stringify(token)}.`);
  }

  return keyWith(ALL_XLSX_TOKENS.filter(id => id !== token));
}
