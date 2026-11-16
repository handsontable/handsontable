import { filterSeparators } from 'handsontable/utils/menu/menu/utils';
import { SEPARATOR } from 'handsontable/utils/menu/predefinedItems';

describe('filterSeparators', () => {
  const separator = () => ({ name: SEPARATOR });

  it('should keep adjacent items that share the same string name', () => {
    const items = [
      { key: 'a', name: 'Name' },
      { key: 'b', name: 'Name' },
      { key: 'c', name: 'Name' },
    ];

    expect(filterSeparators(items).map(item => item.key)).toEqual(['a', 'b', 'c']);
  });

  it('should keep adjacent items that share the same function name reference', () => {
    const name = () => 'Name';
    const items = [
      { key: 'a', name },
      { key: 'b', name },
    ];

    expect(filterSeparators(items).map(item => item.key)).toEqual(['a', 'b']);
  });

  it('should collapse adjacent separators into one', () => {
    const items = [
      { key: 'a', name: 'A' },
      separator(),
      separator(),
      separator(),
      { key: 'b', name: 'B' },
    ];

    expect(filterSeparators(items).map(item => item.name)).toEqual(['A', SEPARATOR, 'B']);
  });

  it('should strip leading and trailing separators', () => {
    const items = [
      separator(),
      separator(),
      { key: 'a', name: 'A' },
      separator(),
      separator(),
    ];

    expect(filterSeparators(items).map(item => item.name)).toEqual(['A']);
  });

  it('should keep adjacent items that have no name', () => {
    const items = [
      { key: 'a' },
      { key: 'b' },
    ];

    expect(filterSeparators(items).map(item => item.key)).toEqual(['a', 'b']);
  });

  it('should collapse the separator given as the second argument, not the default one', () => {
    const custom = '=====';
    const items = [
      { key: 'a', name: 'A' },
      { name: custom },
      { name: custom },
      { key: 'b', name: 'B' },
      { name: SEPARATOR },
      { name: SEPARATOR },
      { key: 'c', name: 'C' },
    ];

    // The default separator is just another label here, so the repeated pair of it is kept.
    expect(filterSeparators(items, custom).map(item => item.name)).toEqual(
      ['A', custom, 'B', SEPARATOR, SEPARATOR, 'C']);
  });

  it('should keep a separator between two items that share the same string name', () => {
    const items = [
      { key: 'a', name: 'Name' },
      separator(),
      { key: 'b', name: 'Name' },
    ];

    expect(filterSeparators(items).map(item => item.key ?? item.name)).toEqual(['a', SEPARATOR, 'b']);
  });
});
