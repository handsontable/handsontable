// The core package's test-only key builder and its fixtures are plain JS modules that import the
// reader's TypeScript (`../extractKeyData`, `../encoding`). Playwright's loader follows that chain,
// so the keys are built here at load time rather than generated into a JSON file.
import { buildTestKey } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/fixtures';

/**
 * Every `xlsx:*` capability token, in the order the core declares them
 * (`handsontable/src/utils/xlsxEngine/licenseCapabilities.ts`).
 */
export const ALL_XLSX_TOKENS: readonly string[] = Object.freeze([
  'xlsx:import',
  'xlsx:export',
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:import_report',
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
 * A current subscription key with the `core` capability only, as the real generator issued it. It
 * carries no `xlsx:` token, so it is unrestricted for the whole family.
 */
export const CORE_ONLY_KEY: string = SUBSCRIPTION_KEY;

/**
 * Builds a current subscription key that grants `core` plus `tokens`. It runs to 2027-08-12 with a
 * 60-day notice and a 90-day grace period, the same window as `CORE_ONLY_KEY`, so the page object's
 * pinned clock keeps it far from its notice period.
 *
 * @param {readonly string[]} tokens The capability tokens to grant besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
export function keyWith(tokens: readonly string[], flags: string[] = []): string {
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
 * Builds a key that grants every xlsx token but `token`.
 *
 * @param {string} token The token to leave out.
 * @returns {string}
 */
export function keyWithout(token: string): string {
  if (!ALL_XLSX_TOKENS.includes(token)) {
    throw new Error(`Unknown xlsx token ${JSON.stringify(token)}.`);
  }

  return keyWith(ALL_XLSX_TOKENS.filter(id => id !== token));
}
