import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('ManualColumnResize manual-size API', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a 3x5 grid.
   *
   * @param {object} [settings] More grid settings.
   * @returns {object} The ManualColumnResize plugin.
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 5),
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    return hot.getPlugin('manualColumnResize');
  }

  describe('setManualSize()', () => {
    it('stores nothing and does not throw on a plugin that was never enabled', () => {
      const plugin = buildGrid();

      expect(() => plugin.setManualSize(0, 100)).not.toThrow();
      expect(plugin.getManualSize(0)).toBe(null);
    });

    it('stores nothing while the plugin is disabled', () => {
      const plugin = buildGrid({ manualColumnResize: true });

      hot.updateSettings({ manualColumnResize: false });
      plugin.setManualSize(1, 150);
      hot.updateSettings({ manualColumnResize: true });

      expect(plugin.getManualSize(1)).toBe(null);
      expect(plugin.getManualSizes()).toEqual([]);
    });

    it('stores nothing for a column that does not exist', () => {
      const plugin = buildGrid({ manualColumnResize: true });
      const map = hot.columnIndexMapper.variousMapsCollection.get(plugin.pluginName);

      plugin.setManualSize(999, 100);

      expect(Object.keys(map.getValues())).not.toContain('null');
      expect(plugin.getManualSizes()).toEqual([]);
    });

    it.each([
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['a string', '100'],
    ])('stores nothing for a width that is %s', (_label, width) => {
      const plugin = buildGrid({ manualColumnResize: true });

      plugin.setManualSize(0, 80);
      plugin.setManualSize(0, width);

      expect(plugin.getManualSize(0)).toBe(80);
    });
  });

  describe('setManualSizes()', () => {
    it('writes only the pairs of an integer column in range and a finite width', () => {
      const plugin = buildGrid({ manualColumnResize: true });

      expect(() => plugin.setManualSizes([
        [0.5, 100],
        ['1', 100],
        [2, NaN],
        [3, '90'],
        null,
        [4],
        'pair',
        [4, 120],
      ])).not.toThrow();

      expect(plugin.getManualSizes()).toEqual([[4, 120]]);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an object', { 0: 100 }],
    ])('ignores %s instead of throwing', (_label, sizes) => {
      const plugin = buildGrid({ manualColumnResize: true });

      expect(() => plugin.setManualSizes(sizes)).not.toThrow();
      expect(plugin.getManualSizes()).toEqual([]);
    });
  });
});
