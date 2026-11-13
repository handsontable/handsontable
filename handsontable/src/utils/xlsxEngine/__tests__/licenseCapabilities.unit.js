import {
  XLSX_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
  IMPORT_FILE_CAPABILITY_IDS,
  EXPORT_FILE_CAPABILITY_IDS,
} from '../licenseCapabilities';
import * as generated from '../licenseCapabilities.generated';
import XLSX_FEATURES from '../features.json';
import RELEASED_TOKENS from '../../../featureManifest/released-tokens.json';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../xlsxEntitlement';

const { TOKEN_RULE } = require('../../../../scripts/utils/feature-manifest');

/**
 * The id lists themselves are generated from `features.json` and pinned against it in
 * `test/__tests__/featureManifest.unit.js`. These tests cover how `licenseCapabilities.ts` re-exports them.
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
  });

  it('spells every id in the generator token shape', () => {
    XLSX_CAPABILITY_IDS.forEach(id => expect(id).toMatch(TOKEN_RULE));
    expect('xlsx.conditionalFormatting').not.toMatch(TOKEN_RULE);
    XLSX_CAPABILITY_IDS.forEach(id => expect(id.startsWith('xlsx:')).toBe(true));
  });
});
