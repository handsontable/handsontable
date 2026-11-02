/**
 * The license capability tokens the XLSX engine reads from an entitlement license key. The tokens
 * themselves (names, descriptions, plugins, requirements) are declared in `features.json` next to
 * this file, the feature manifest's source. The id lists, the flag each token drives, and the key
 * flag are generated from it into `licenseCapabilities.generated.ts` (`npm run
 * generate:feature-manifest`); this module re-exports them and adds only what the manifest does not
 * declare. It imports nothing but that module, so any other module can depend on it.
 */
export {
  XLSX_CAPABILITY_IDS,
  IMPORT_FILE_CAPABILITY_IDS,
  EXPORT_FILE_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
  LISTED_CAPABILITIES_FLAG,
} from './licenseCapabilities.generated';

/**
 * The prefix every XLSX capability token starts with.
 */
export const XLSX_CAPABILITY_PREFIX = 'xlsx:';

/**
 * The shape a capability token must have (the same pattern the license generator uses, `TOKEN_RULE`
 * in `scripts/utils/feature-manifest.js`; a unit test holds the two equal).
 */
export const CAPABILITY_TOKEN_PATTERN = /^[a-z][a-z0-9_]*(?::[a-z0-9_]+(?:\.[a-z0-9_]+)*)?$/;

/**
 * The grant of the whole XLSX namespace. The feature manifest reserves `<namespace>:all` for that
 * (HyperFormula honors `feat:all` and `fun:all` the same way): a key with the `listed-capabilities`
 * flag that lists it unlocks every XLSX feature. It is not a feature of its own, so it is not one of
 * the `XLSX_CAPABILITY_IDS` and has no entry in `features.json`.
 */
export const XLSX_ALL_CAPABILITY = 'xlsx:all';
