import {
  type LicenseGrants,
  hasCapability,
  HANDSONTABLE_PRODUCT,
} from '../entitlementLicenseKey';
import {
  XLSX_ALL_CAPABILITY,
  XLSX_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
  XLSX_TIERS_BY_ID,
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
 * Resolves what the license unlocks of the XLSX engine from its grants, as `_getLicenseState`
 * (`helpers/mixed.ts`) resolves them. That is where the flag rule lives: a legacy, missing or invalid
 * key, a key that does not grant Handsontable, and a Handsontable entry without the
 * `listed-capabilities` flag (every key issued before the tokens existed) all resolve to unrestricted
 * grants, and so to the unrestricted entitlement here. With the flag, only the listed tokens unlock,
 * and `xlsx:all` unlocks every one of them.
 *
 * When the key names tiers (`tiers` is a list), the tiers alone decide: a feature is granted when
 * its tier list contains one of them, and `grants` is not read.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string[]|null} [tiers] The tiers the key names, or `null` when it names none.
 * @param {object} [tiersById] The tiers that unlock each feature.
 * @returns {XlsxEntitlement}
 */
export function resolveXlsxEntitlement(
  grants: LicenseGrants,
  tiers: readonly string[] | null = null,
  tiersById: Readonly<Record<string, readonly string[]>> = XLSX_TIERS_BY_ID,
): XlsxEntitlement {
  if (tiers !== null) {
    const tierFlags = {} as Record<XlsxFlagName, boolean>;
    const tierMissing: string[] = [];

    XLSX_CAPABILITY_IDS.forEach((id) => {
      const granted = (tiersById[id] ?? []).some(tier => tiers.includes(tier));

      tierFlags[XLSX_FLAG_BY_ID[id] as XlsxFlagName] = granted;

      if (!granted) {
        tierMissing.push(id);
      }
    });

    return Object.freeze({
      ...tierFlags,
      importReport: true,
      missing: Object.freeze(tierMissing) as unknown as string[],
    });
  }

  if (grants.unrestricted) {
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
