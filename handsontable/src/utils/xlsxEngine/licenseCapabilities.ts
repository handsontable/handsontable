/**
 * The license capability tokens the XLSX engine reads from an entitlement license key. The tokens
 * themselves (names, descriptions, plugins, requirements) are declared in `features.json` next to
 * this file, the feature manifest's source; this module keeps only what the runtime checks need, and
 * its unit test holds it equal to that file. It imports nothing, so any other module can depend on it.
 */

/**
 * The prefix every XLSX capability token starts with.
 */
export const XLSX_CAPABILITY_PREFIX = 'xlsx:';

/**
 * The shape a capability token must have (the same pattern the license generator uses).
 */
export const CAPABILITY_TOKEN_PATTERN = /^[a-z][a-z0-9_]*(?::[a-z0-9_]+(?:\.[a-z0-9_]+)*)?$/;

/**
 * The per-product key flag that makes a key unlock exactly the tokens it lists (the feature
 * manifest's `keyFlag`). A product entry without it unlocks every feature, so every key issued
 * before the tokens existed keeps working.
 */
export const LISTED_CAPABILITIES_FLAG = 'listed-capabilities';

/**
 * The grant of the whole XLSX namespace. The feature manifest reserves `<namespace>:all` for that
 * (HyperFormula honors `feat:all` and `fun:all` the same way): a key with the `listed-capabilities`
 * flag that lists it unlocks every XLSX feature. It is not a feature of its own, so it is not one of
 * the `XLSX_CAPABILITY_IDS` and has no entry in `features.json`.
 */
export const XLSX_ALL_CAPABILITY = 'xlsx:all';

/**
 * The XLSX tokens a key must list (`licensing: "token"` in `features.json`), in the order that
 * file declares them. `xlsx:import_report` is `core`, always granted, so it is not one of them.
 */
export const XLSX_CAPABILITY_IDS: readonly string[] = Object.freeze([
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
 * The tokens the ImportFile plugin gates, in declaration order. `xlsx:number_formats` is not one of
 * them: the import always reads number formats to infer cell types.
 */
export const IMPORT_FILE_CAPABILITY_IDS: readonly string[] = Object.freeze([
  'xlsx:import',
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:comments',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
]);

/**
 * The tokens the ExportFile plugin gates, in declaration order.
 */
export const EXPORT_FILE_CAPABILITY_IDS: readonly string[] = Object.freeze([
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
