import DataProvider from '../dataProvider';

describe('DataProvider#_getNaturalColWidth', () => {
  /**
   * Builds a data provider on a fake instance whose visual order is [2, 0, 1].
   *
   * @param {object} settings The grid settings.
   * @returns {DataProvider}
   */
  function createProvider(settings) {
    const physical = [2, 0, 1];

    return new DataProvider({
      getSettings: () => settings,
      getColumnMeta: () => ({}),
      toPhysicalColumn: visual => physical[visual],
    });
  }

  it('should read an array `colWidths` by the physical column index', () => {
    const provider = createProvider({ colWidths: [100, 120, 140] });

    expect(provider._getNaturalColWidth(0)).toBe(140);
    expect(provider._getNaturalColWidth(1)).toBe(100);
    expect(provider._getNaturalColWidth(2)).toBe(120);
  });

  it('should call a `colWidths` function with the physical column index', () => {
    const provider = createProvider({ colWidths: physical => (physical + 1) * 10 });

    expect(provider._getNaturalColWidth(0)).toBe(30);
    expect(provider._getNaturalColWidth(1)).toBe(10);
  });
});
