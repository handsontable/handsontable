import {
  XLSX_CAPABILITY_IDS,
  XLSX_CAPABILITY_PREFIX,
  CAPABILITY_TOKEN_PATTERN,
  LISTED_CAPABILITIES_FLAG,
  IMPORT_FILE_CAPABILITY_IDS,
  EXPORT_FILE_CAPABILITY_IDS,
} from '../licenseCapabilities';

const features = require('../features.json');
const { KEY_FLAG } = require('../../../../scripts/utils/feature-manifest');

/**
 * The ids of the `features.json` entries a key must list, in the order the file declares them.
 */
const TOKEN_IDS = features.capabilities.filter(entry => entry.licensing === 'token').map(entry => entry.id);

describe('xlsxEngine/licenseCapabilities', () => {
  it('lists the token entries of features.json, in its order', () => {
    expect(XLSX_CAPABILITY_IDS).toEqual(TOKEN_IDS);
    expect(XLSX_CAPABILITY_IDS).toEqual([
      'xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout', 'xlsx:number_formats', 'xlsx:comments',
      'xlsx:styles', 'xlsx:conditional_formatting', 'xlsx:data_validation', 'xlsx:protection',
    ]);
    expect(XLSX_CAPABILITY_IDS).not.toContain('xlsx:import_report');
    expect(Object.isFrozen(XLSX_CAPABILITY_IDS)).toBe(true);
  });

  it('spells every id in the generator token shape', () => {
    XLSX_CAPABILITY_IDS.forEach(id => expect(id).toMatch(CAPABILITY_TOKEN_PATTERN));
    expect('xlsx.conditionalFormatting').not.toMatch(CAPABILITY_TOKEN_PATTERN);
    XLSX_CAPABILITY_IDS.forEach(id => expect(id.startsWith(XLSX_CAPABILITY_PREFIX)).toBe(true));
  });

  it('names the key flag the feature manifest declares', () => {
    expect(LISTED_CAPABILITIES_FLAG).toBe(KEY_FLAG);
    expect(LISTED_CAPABILITIES_FLAG).toBe('listed-capabilities');
  });

  it('gives each plugin exactly the tokens features.json assigns to it', () => {
    const tokensOf = plugin => features.capabilities
      .filter(entry => entry.licensing === 'token' && entry.plugins.includes(plugin))
      .map(entry => entry.id);

    expect(IMPORT_FILE_CAPABILITY_IDS).toEqual(tokensOf('ImportFile'));
    expect(EXPORT_FILE_CAPABILITY_IDS).toEqual(tokensOf('ExportFile'));
    expect(IMPORT_FILE_CAPABILITY_IDS).not.toContain('xlsx:number_formats');
    expect(IMPORT_FILE_CAPABILITY_IDS).not.toContain('xlsx:export');
    expect(EXPORT_FILE_CAPABILITY_IDS).not.toContain('xlsx:import');
    expect(Object.isFrozen(IMPORT_FILE_CAPABILITY_IDS)).toBe(true);
    expect(Object.isFrozen(EXPORT_FILE_CAPABILITY_IDS)).toBe(true);
  });
});
