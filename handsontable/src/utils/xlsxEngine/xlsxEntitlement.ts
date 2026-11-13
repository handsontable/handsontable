import {
  XLSX_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
  XLSX_TIERS_BY_ID,
} from './licenseCapabilities';

/**
 * What the license unlocks of the XLSX engine. One flag per feature id, plus the ids of the
 * features the license does not unlock. `importReport` is always `true`: `xlsx:import_report` is
 * never gated, and never listed in `missing`.
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
 * Resolves what the license unlocks of the XLSX engine from the tiers the key names, as
 * `_getLicenseState` (`helpers/mixed.ts`) reads them. A key that names no tier (`tiers` is `null`) - a
 * legacy, missing or invalid key, a key that does not grant Handsontable, and every key issued before
 * tiers existed - resolves to the unrestricted entitlement. A key that names tiers unlocks a feature
 * only when the feature's tier list contains one of them; any feature id or flag beside the tiers is
 * ignored.
 *
 * @param {string[]|null} [tiers] The tiers the key names, or `null` (or `undefined`) when it names none.
 * @param {object} [tiersById] The tiers that unlock each feature.
 * @returns {XlsxEntitlement}
 */
export function resolveXlsxEntitlement(
  tiers: readonly string[] | null | undefined,
  tiersById: Readonly<Record<string, readonly string[]>> = XLSX_TIERS_BY_ID,
): XlsxEntitlement {
  if (tiers === null || tiers === undefined) {
    return UNRESTRICTED_XLSX_ENTITLEMENT;
  }

  const flags = {} as Record<XlsxFlagName, boolean>;
  const missing: string[] = [];

  XLSX_CAPABILITY_IDS.forEach((id) => {
    const granted = (tiersById[id] ?? []).some(tier => tiers.includes(tier));

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
