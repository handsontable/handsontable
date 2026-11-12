// Generated from `features.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

// The XLSX tokens a gate checks (`licensing: "token"`, `gate` "call" or "degrade"), in the order
// `features.json` declares them.
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

// The tokens the ImportFile plugin gates (`plugins` names it), in the same order.
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

// The tokens the ExportFile plugin gates (`plugins` names it), in the same order.
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

// The `XlsxEntitlement` flag each token drives: the id's suffix in camelCase.
export const XLSX_FLAG_BY_ID: Readonly<Record<string, string>> = Object.freeze({
  'xlsx:import': 'import',
  'xlsx:export': 'export',
  'xlsx:formulas': 'formulas',
  'xlsx:layout': 'layout',
  'xlsx:number_formats': 'numberFormats',
  'xlsx:comments': 'comments',
  'xlsx:styles': 'styles',
  'xlsx:conditional_formatting': 'conditionalFormatting',
  'xlsx:data_validation': 'dataValidation',
  'xlsx:protection': 'protection',
});

// The per-product key flag that makes a key unlock exactly the tokens it lists (the manifest's `keyFlag`).
export const LISTED_CAPABILITIES_FLAG = 'listed-capabilities';
