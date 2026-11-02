import {
  type LicenseGrants,
  type ProductEntitlement,
  hasCapability,
  HANDSONTABLE_PRODUCT,
} from '../entitlementLicenseKey';
import {
  LISTED_CAPABILITIES_FLAG,
  XLSX_ALL_CAPABILITY,
  XLSX_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
} from './licenseCapabilities';

/**
 * What the license unlocks of the XLSX engine. One flag per capability token, plus the ids of the
 * tokens the license does not grant. `importReport` is always `true`: `xlsx:import_report` is a
 * `core` feature, granted to every key, and never listed in `missing`.
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

/**
 * The flags a capability token drives. `XLSX_FLAG_BY_ID` (generated from `features.json`) names one
 * of them for each token, and a unit test holds every generated name to a key of this interface.
 */
type XlsxFlagName = Exclude<keyof XlsxEntitlement, 'missing' | 'importReport'>;

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
 * Tells whether a product entry carries the `listed-capabilities` flag. The reader normalizes
 * `flags` into an own array, and it is read as an own property all the same.
 *
 * @param {ProductEntitlement} entitlement The product entry.
 * @returns {boolean}
 */
function listsCapabilities(entitlement: ProductEntitlement): boolean {
  if (!Object.prototype.hasOwnProperty.call(entitlement, 'flags')) {
    return false;
  }

  const { flags } = entitlement;

  return Array.isArray(flags) && flags.indexOf(LISTED_CAPABILITIES_FLAG) !== -1;
}

/**
 * Resolves what the license unlocks of the XLSX engine. A license is unrestricted when it is
 * unrestricted as a whole, has no Handsontable product entry, or its entry does not carry the
 * `listed-capabilities` flag (every key issued before the tokens existed). With the flag, only the
 * listed tokens unlock, and `xlsx:all` unlocks every one of them.
 *
 * @param {ProductEntitlement|null} entitlement The `handsontable` product entry of the key, or `null`.
 * @param {LicenseGrants} grants The resolved grants.
 * @returns {XlsxEntitlement}
 */
export function resolveXlsxEntitlement(
  entitlement: ProductEntitlement | null,
  grants: LicenseGrants,
): XlsxEntitlement {
  if (grants.unrestricted || entitlement === null || !listsCapabilities(entitlement)) {
    return UNRESTRICTED_XLSX_ENTITLEMENT;
  }

  // A flagged key that lists `xlsx:all` is still restricted by its flag, but the namespace grant
  // unlocks every xlsx feature, so its flags are the unrestricted ones and nothing is missing.
  if (hasCapability(grants, HANDSONTABLE_PRODUCT, XLSX_ALL_CAPABILITY)) {
    return UNRESTRICTED_XLSX_ENTITLEMENT;
  }

  const flags = {} as Record<XlsxFlagName, boolean>;
  const missing: string[] = [];

  XLSX_CAPABILITY_IDS.forEach((id) => {
    const granted = hasCapability(grants, HANDSONTABLE_PRODUCT, id);

    flags[XLSX_FLAG_BY_ID[id] as XlsxFlagName] = granted;

    if (!granted) {
      missing.push(id);
    }
  });

  return Object.freeze({ ...flags, importReport: true, missing: Object.freeze(missing) as unknown as string[] });
}

/**
 * Narrows the missing tokens to the ones a plugin gates, so each plugin warns and reports only
 * about what it does. Returns the entitlement itself when nothing is left out.
 *
 * @param {XlsxEntitlement} entitlement What the license unlocks.
 * @param {string[]} capabilityIds The tokens the plugin gates.
 * @returns {XlsxEntitlement}
 */
export function scopeXlsxEntitlement(entitlement: XlsxEntitlement, capabilityIds: readonly string[]): XlsxEntitlement {
  const missing = entitlement.missing.filter(id => capabilityIds.includes(id));

  if (missing.length === entitlement.missing.length) {
    return entitlement;
  }

  return Object.freeze({ ...entitlement, missing: Object.freeze(missing) as unknown as string[] });
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
