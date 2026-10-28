import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('ManualRowResize manual-size API', () => {
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
   * Builds a 5x3 grid.
   *
   * @param {object} [settings] More grid settings.
   * @returns {object} The ManualRowResize plugin.
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(5, 3),
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    return hot.getPlugin('manualRowResize');
  }

  describe('setManualSize()', () => {
    it('stores nothing and does not throw on a plugin that was never enabled', () => {
      const plugin = buildGrid();

      expect(() => plugin.setManualSize(0, 100)).not.toThrow();
      expect(plugin.getManualSize(0)).toBe(null);
    });

    it('stores nothing while the plugin is disabled', () => {
      const plugin = buildGrid({ manualRowResize: true });

      hot.updateSettings({ manualRowResize: false });
      plugin.setManualSize(1, 150);
      hot.updateSettings({ manualRowResize: true });

      expect(plugin.getManualSize(1)).toBe(null);
      expect(plugin.getManualSizes()).toEqual([]);
    });

    it.each([
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['a string', '100'],
    ])('stores nothing for a height that is %s', (_label, height) => {
      const plugin = buildGrid({ manualRowResize: true });

      plugin.setManualSize(0, 80);
      plugin.setManualSize(0, height);

      expect(plugin.getManualSize(0)).toBe(80);
    });
  });

  describe('setManualSizes()', () => {
    it('writes only the pairs of an integer row in range and a finite height', () => {
      const plugin = buildGrid({ manualRowResize: true });

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
      const plugin = buildGrid({ manualRowResize: true });

      expect(() => plugin.setManualSizes(sizes)).not.toThrow();
      expect(plugin.getManualSizes()).toEqual([]);
    });
  });
});
