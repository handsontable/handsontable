import { getHardConflict, registerConflict } from '../conflictRegistry';

// Registers production dataProvider hard conflicts (and hasExternalDataSource hook).
import '../../dataProvider/dataProvider';

const noop = () => {};

const completeDataProvider = {
  rowId: 'id',
  fetchRows: noop,
  onRowsCreate: noop,
  onRowsUpdate: noop,
  onRowsRemove: noop,
};

describe('conflictRegistry', () => {
  it('should return null when the plugin is not in any blocked list', () => {
    expect(getHardConflict({ dataProvider: completeDataProvider }, '___notBlocked___')).toBe(null);
  });

  it('should return dataProvider conflict for manualRowMove when dataProvider is complete', () => {
    const conflict = getHardConflict({ dataProvider: completeDataProvider }, 'manualRowMove');

    expect(conflict).not.toBe(null);
    expect(conflict.ownerPluginKey).toBe('dataProvider');
    expect(conflict.blockedPluginKeys).toContain('manualRowMove');
  });

  it('should return null for manualRowMove when dataProvider is incomplete', () => {
    expect(getHardConflict({ dataProvider: {} }, 'manualRowMove')).toBe(null);
  });

  it('should return null for custom registration when predicate is false', () => {
    registerConflict('___owner___', () => false, ['___blocked___']);

    expect(getHardConflict({}, '___blocked___')).toBe(null);
  });

  it('should return custom registration when predicate is true', () => {
    registerConflict('___owner2___', () => true, ['___blocked2___']);

    const conflict = getHardConflict({ x: 1 }, '___blocked2___');

    expect(conflict.ownerPluginKey).toBe('___owner2___');
  });

  it('should use the first matching registration', () => {
    registerConflict('___first___', () => true, ['___dup___']);
    registerConflict('___second___', () => true, ['___dup___']);

    expect(getHardConflict({}, '___dup___').ownerPluginKey).toBe('___first___');
  });
});
