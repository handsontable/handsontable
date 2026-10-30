import {
  type LicenseGrants,
  getProductCapabilities,
  hasCapability,
  HANDSONTABLE_PRODUCT,
} from '../entitlementLicenseKey';
import { XLSX_CAPABILITIES, XLSX_CAPABILITY_PREFIX } from './licenseCapabilities';

/**
 * What the license unlocks of the XLSX engine. One flag per capability token, plus the ids of the
 * tokens the license does not grant.
 */
export interface XlsxEntitlement {
  import: boolean;
  export: boolean;
  formulas: boolean;
  layout: boolean;
  numberFormats: boolean;
  comments: boolean;
  importReport: boolean;
  styles: boolean;
  conditionalFormatting: boolean;
  dataValidation: boolean;
  protection: boolean;
  missing: string[];
}

type XlsxFlagName = Exclude<keyof XlsxEntitlement, 'missing'>;

/**
 * The flag each capability token drives.
 */
const FLAG_BY_ID: Readonly<Record<string, XlsxFlagName>> = Object.freeze({
  'xlsx:import': 'import',
  'xlsx:export': 'export',
  'xlsx:formulas': 'formulas',
  'xlsx:layout': 'layout',
  'xlsx:number_formats': 'numberFormats',
  'xlsx:comments': 'comments',
  'xlsx:import_report': 'importReport',
  'xlsx:styles': 'styles',
  'xlsx:conditional_formatting': 'conditionalFormatting',
  'xlsx:data_validation': 'dataValidation',
  'xlsx:protection': 'protection',
});

/**
 * The entitlement of a license that does not gate the XLSX engine: every flag is on and nothing is
 * missing.
 */
export const UNRESTRICTED_XLSX_ENTITLEMENT: XlsxEntitlement = Object.freeze({
  import: true,
  export: true,
  formulas: true,
  layout: true,
  numberFormats: true,
  comments: true,
  importReport: true,
  styles: true,
  conditionalFormatting: true,
  dataValidation: true,
  protection: true,
  missing: Object.freeze([]) as unknown as string[],
});

/**
 * Resolves what the license unlocks of the XLSX engine. A license is unrestricted when it is
 * unrestricted as a whole, does not grant Handsontable, or lists no `xlsx:` token (every key issued
 * before the tokens existed). Once any `xlsx:` token is listed, only the listed tokens unlock.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @returns {XlsxEntitlement}
 */
export function resolveXlsxEntitlement(grants: LicenseGrants): XlsxEntitlement {
  const tokens = getProductCapabilities(grants, HANDSONTABLE_PRODUCT);

  if (tokens === null || !tokens.some(token => token.startsWith(XLSX_CAPABILITY_PREFIX))) {
    return UNRESTRICTED_XLSX_ENTITLEMENT;
  }

  const flags = {} as Record<XlsxFlagName, boolean>;
  const missing: string[] = [];

  XLSX_CAPABILITIES.forEach(({ id }) => {
    const granted = hasCapability(grants, HANDSONTABLE_PRODUCT, id);

    flags[FLAG_BY_ID[id]] = granted;

    if (!granted) {
      missing.push(id);
    }
  });

  return Object.freeze({ ...flags, missing: Object.freeze(missing) as unknown as string[] });
}

/**
 * Builds the console warning that names the features a license does not unlock.
 *
 * @param {'import'|'export'} operation The operation that skipped the features.
 * @param {string[]} missing The ids of the tokens the license does not grant.
 * @returns {string}
 */
export function formatMissingCapabilitiesWarning(operation: 'import' | 'export', missing: string[]): string {
  return `The xlsx ${operation} skipped features your license does not unlock: ${missing.join(', ')}.`;
}
