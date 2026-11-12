import {
  XLSX_CAPABILITY_IDS,
  XLSX_CAPABILITY_PREFIX,
  CAPABILITY_TOKEN_PATTERN,
  LISTED_CAPABILITIES_FLAG,
  XLSX_ALL_CAPABILITY,
  XLSX_FLAG_BY_ID,
  IMPORT_FILE_CAPABILITY_IDS,
  EXPORT_FILE_CAPABILITY_IDS,
} from '../licenseCapabilities';
import * as generated from '../licenseCapabilities.generated';
import XLSX_FEATURES from '../features.json';
import RELEASED_TOKENS from '../../../featureManifest/released-tokens.json';
import { KNOWN_CAPABILITIES } from '../../entitlementLicenseKey/constants';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../xlsxEntitlement';

const { KEY_FLAG, TOKEN_RULE } = require('../../../../scripts/utils/feature-manifest');

/**
 * The id lists themselves are generated from `features.json` and pinned against it in
 * `test/__tests__/featureManifest.unit.js`. These tests cover what `licenseCapabilities.ts` adds by hand.
 */
describe('xlsxEngine/licenseCapabilities', () => {
  /**
   * The stable token ids, spelled out by hand: a key issued in the field lists them, so renaming or
   * removing one breaks such a key. This list is deliberately not derived from `features.json`.
   */
  const STABLE_TOKEN_IDS = [
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
  ];

  it('declares, releases, and gates exactly the stable xlsx token ids', () => {
    // `xlsx:import_report` is sold with `gate: "report"`: always produced, so no gate reads its token.
    const declared = XLSX_FEATURES.capabilities
      .filter(entry => entry.licensing === 'token' && ['call', 'degrade'].includes(entry.gate));

    expect(declared.map(entry => entry.id).sort()).toEqual([...STABLE_TOKEN_IDS].sort());
    expect([...XLSX_CAPABILITY_IDS].sort()).toEqual([...STABLE_TOKEN_IDS].sort());
    expect(Object.keys(XLSX_FLAG_BY_ID).sort()).toEqual([...STABLE_TOKEN_IDS].sort());

    STABLE_TOKEN_IDS.forEach((id) => {
      const entry = declared.find(candidate => candidate.id === id);

      expect({ id, status: entry.status, licensing: entry.licensing })
        .toEqual({ id, status: 'stable', licensing: 'token' });
      expect({ id, released: RELEASED_TOKENS[id] }).toEqual({ id, released: ['token'] });
      expect(KNOWN_CAPABILITIES).toContain(id);

      const flag = XLSX_FLAG_BY_ID[id];

      expect({ id, switch: UNRESTRICTED_XLSX_ENTITLEMENT[flag] }).toEqual({ id, switch: true });

      // A token gates the plugins its `plugins` entry names, and no other.
      expect(entry.plugins.length).toBeGreaterThan(0);
      expect({ id, gatedByImport: IMPORT_FILE_CAPABILITY_IDS.includes(id) })
        .toEqual({ id, gatedByImport: entry.plugins.includes('ImportFile') });
      expect({ id, gatedByExport: EXPORT_FILE_CAPABILITY_IDS.includes(id) })
        .toEqual({ id, gatedByExport: entry.plugins.includes('ExportFile') });
      expect(entry.plugins.every(plugin => plugin === 'ImportFile' || plugin === 'ExportFile')).toBe(true);
    });
  });

  it('re-exports the generated lists unchanged', () => {
    expect(XLSX_CAPABILITY_IDS).toBe(generated.XLSX_CAPABILITY_IDS);
    expect(IMPORT_FILE_CAPABILITY_IDS).toBe(generated.IMPORT_FILE_CAPABILITY_IDS);
    expect(EXPORT_FILE_CAPABILITY_IDS).toBe(generated.EXPORT_FILE_CAPABILITY_IDS);
    expect(XLSX_FLAG_BY_ID).toBe(generated.XLSX_FLAG_BY_ID);
    expect(LISTED_CAPABILITIES_FLAG).toBe(generated.LISTED_CAPABILITIES_FLAG);
  });

  it('uses the token rule of the feature manifest', () => {
    expect(CAPABILITY_TOKEN_PATTERN.source).toBe(TOKEN_RULE.source);
    expect(CAPABILITY_TOKEN_PATTERN.flags).toBe(TOKEN_RULE.flags);
  });

  it('spells every id in the generator token shape', () => {
    XLSX_CAPABILITY_IDS.forEach(id => expect(id).toMatch(CAPABILITY_TOKEN_PATTERN));
    expect('xlsx.conditionalFormatting').not.toMatch(CAPABILITY_TOKEN_PATTERN);
    XLSX_CAPABILITY_IDS.forEach(id => expect(id.startsWith(XLSX_CAPABILITY_PREFIX)).toBe(true));
  });

  it('names the namespace grant the feature manifest reserves, outside the token list', () => {
    expect(XLSX_ALL_CAPABILITY).toBe('xlsx:all');
    expect(XLSX_ALL_CAPABILITY).toMatch(CAPABILITY_TOKEN_PATTERN);
    expect(XLSX_CAPABILITY_IDS).not.toContain(XLSX_ALL_CAPABILITY);
  });

  it('names the key flag the feature manifest declares', () => {
    expect(LISTED_CAPABILITIES_FLAG).toBe(KEY_FLAG);
    expect(LISTED_CAPABILITIES_FLAG).toBe('listed-capabilities');
  });
});
