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

const { KEY_FLAG, TOKEN_RULE } = require('../../../../scripts/utils/feature-manifest');

/**
 * The id lists themselves are generated from `features.json` and pinned against it in
 * `test/__tests__/featureManifest.unit.js`. These tests cover what `licenseCapabilities.ts` adds by hand.
 */
describe('xlsxEngine/licenseCapabilities', () => {
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
