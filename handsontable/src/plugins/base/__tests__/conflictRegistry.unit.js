import { getHardConflict, registerConflict } from '../conflictRegistry';

// Registers production dataProvider hard conflicts (imports dataProvider module for side effects).
import '../../dataProvider/dataProvider';
// Registers pagination hard conflicts (nestedRows, mergeCells, frozen rows).
import '../../pagination/pagination';

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

  it('should return dataProvider conflict when manualRowMove is enabled', () => {
    const conflict = getHardConflict({ manualRowMove: true }, 'dataProvider');

    expect(conflict).not.toBe(null);
    expect(conflict.incompatibleSettingKey).toBe('manualRowMove');
    expect(conflict.blockedKey).toBe('dataProvider');
  });

  it('should return null for dataProvider when conflicting plugins are off', () => {
    expect(getHardConflict({
      manualRowMove: false,
      manualColumnMove: false,
      trimRows: false,
      multiColumnSorting: false,
    }, 'dataProvider')).toBe(null);
  });

  it('should return null when the owner setting is absent or falsy', () => {
    registerConflict('___blocked___', '___owner___');

    expect(getHardConflict({}, '___blocked___')).toBe(null);
  });

  it('should return custom registration when the owner setting is truthy', () => {
    registerConflict('___blocked2___', '___owner2___');

    const conflict = getHardConflict({ ___owner2___: true }, '___blocked2___');

    expect(conflict.incompatibleSettingKey).toBe('___owner2___');
  });

  it('should use the first matching registration when several incompatible settings are active', () => {
    registerConflict('___dup___', '___first___');
    registerConflict('___dup___', '___second___');

    expect(
      getHardConflict({ ___first___: true, ___second___: true }, '___dup___').incompatibleSettingKey,
    ).toBe('___first___');
  });

  it('should register several blocked keys with one incompatible setting in a single call', () => {
    registerConflict(['___batchA___', '___batchB___'], '___batchOwner___');

    expect(getHardConflict({ ___batchOwner___: true }, '___batchA___').incompatibleSettingKey).toBe('___batchOwner___');
    expect(getHardConflict({ ___batchOwner___: true }, '___batchB___').incompatibleSettingKey).toBe('___batchOwner___');
  });

  it('should register several incompatible settings for one blocked key in a single call', () => {
    registerConflict('___multiRule___', ['___flag1___', '___flag2___']);

    expect(getHardConflict({ ___flag1___: 1 }, '___multiRule___').incompatibleSettingKey).toBe('___flag1___');
    expect(getHardConflict({ ___flag2___: 2 }, '___multiRule___').incompatibleSettingKey).toBe('___flag2___');
  });

  it('should block pagination when nestedRows is enabled', () => {
    const conflict = getHardConflict({ nestedRows: true }, 'pagination');

    expect(conflict).not.toBe(null);
    expect(conflict.incompatibleSettingKey).toBe('nestedRows');
  });

  it('should block pagination when fixedRowsTop is positive', () => {
    expect(getHardConflict({ fixedRowsTop: 1 }, 'pagination').incompatibleSettingKey).toBe('fixedRowsTop');
  });

  it('should not block pagination when conflicting options are off', () => {
    expect(getHardConflict({
      nestedRows: false,
      mergeCells: false,
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
    }, 'pagination')).toBe(null);
  });
});
