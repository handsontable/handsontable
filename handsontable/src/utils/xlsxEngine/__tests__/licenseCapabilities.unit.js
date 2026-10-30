import {
  XLSX_CAPABILITIES, XLSX_CAPABILITY_IDS, XLSX_CAPABILITY_PREFIX, CAPABILITY_TOKEN_PATTERN, capabilitiesOfPlugin,
} from '../licenseCapabilities';

describe('xlsxEngine/licenseCapabilities', () => {
  it('declares the eleven stable tokens in the agreed order', () => {
    expect(XLSX_CAPABILITY_IDS).toEqual([
      'xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout', 'xlsx:number_formats', 'xlsx:comments',
      'xlsx:import_report', 'xlsx:styles', 'xlsx:conditional_formatting', 'xlsx:data_validation', 'xlsx:protection',
    ]);
  });

  it('spells every id in the generator token shape', () => {
    XLSX_CAPABILITY_IDS.forEach(id => expect(id).toMatch(CAPABILITY_TOKEN_PATTERN));
    expect('xlsx.conditionalFormatting').not.toMatch(CAPABILITY_TOKEN_PATTERN);
    XLSX_CAPABILITY_IDS.forEach(id => expect(id.startsWith(XLSX_CAPABILITY_PREFIX)).toBe(true));
  });

  it('points every requires entry at a declared id, with no cycle', () => {
    const ids = new Set(XLSX_CAPABILITY_IDS);

    XLSX_CAPABILITIES.forEach(({ requires }) => {
      [...(requires.allOf ?? []), ...(requires.anyOf ?? [])].forEach(dep => expect(ids.has(dep)).toBe(true));
    });
    expect(XLSX_CAPABILITIES.find(c => c.id === 'xlsx:import').requires).toEqual({});
    expect(XLSX_CAPABILITIES.find(c => c.id === 'xlsx:import_report').requires).toEqual({ allOf: ['xlsx:import'] });
    expect(XLSX_CAPABILITIES.find(c => c.id === 'xlsx:styles').requires)
      .toEqual({ anyOf: ['xlsx:import', 'xlsx:export'] });
  });

  it('gives every token a non-empty plugins list, since 19.0.0, status stable, and is frozen', () => {
    XLSX_CAPABILITIES.forEach((c) => {
      expect(c.plugins.length).toBeGreaterThan(0);
      expect(c.since).toBe('19.0.0');
      expect(c.status).toBe('stable');
    });
    expect(Object.isFrozen(XLSX_CAPABILITIES)).toBe(true);
    expect(capabilitiesOfPlugin('ImportFile').map(c => c.id)).not.toContain('xlsx:export');
    expect(capabilitiesOfPlugin('ExportFile').map(c => c.id)).not.toContain('xlsx:import');
    expect(capabilitiesOfPlugin('ExportFile').map(c => c.id)).toContain('xlsx:styles');
  });
});
