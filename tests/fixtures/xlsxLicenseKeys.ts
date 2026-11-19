// The core package's test-only xlsx key helper, its key builder and its fixtures are plain JS
// modules that import the reader's TypeScript (`../extractKeyData`, `../encoding`) and the token list
// (`utils/xlsxEngine/licenseCapabilities.ts`). Playwright's loader follows that chain, so the keys are
// built here at load time rather than generated into a JSON file, and the Jest suites and these
// specs share one builder.
import { SUBSCRIPTION_KEY } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/fixtures';

export {
  ALL_XLSX_TOKENS,
  keyWithoutTier,
  keyWithTier,
} from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';

/**
 * An invalid key: unrestricted for the whole xlsx family, like every invalid key, but it shows the
 * lock screen over the grid, so use it only where a spec calls the API. A spec that clicks the grid
 * uses `CORE_ONLY_KEY`. It is the retired non-commercial key, which reads as invalid since 19.0, so
 * these specs also prove that key restricts nothing.
 */
export const INVALID_KEY = 'non-commercial-and-evaluation';

/**
 * A current subscription key with the `core` capability only, as the real generator issued it. It
 * names no tier, so it is unrestricted for the whole family.
 */
export const CORE_ONLY_KEY: string = SUBSCRIPTION_KEY;
