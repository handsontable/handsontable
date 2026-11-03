// The core package's test-only xlsx key helper, its key builder and its fixtures are plain JS
// modules that import the reader's TypeScript (`../extractKeyData`, `../encoding`) and the token list
// (`utils/xlsxEngine/licenseCapabilities.ts`). Playwright's loader follows that chain, so the keys are
// built here at load time rather than generated into a JSON file, and the Jest suites and these
// specs share one builder.
import { SUBSCRIPTION_KEY } from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/fixtures';

export {
  ALL_XLSX_TOKENS,
  LISTED_CAPABILITIES_FLAG,
  keyWith,
  keyWithAll,
  keyWithout,
  keyWithoutFlag,
} from '../../handsontable/src/utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';

/**
 * The legacy evaluation key: unrestricted for the whole xlsx family.
 */
export const LEGACY_KEY = 'non-commercial-and-evaluation';


/**
 * A current subscription key with the `core` capability only, as the real generator issued it. It
 * carries no `listed-capabilities` flag, so it is unrestricted for the whole family.
 */
export const CORE_ONLY_KEY: string = SUBSCRIPTION_KEY;
