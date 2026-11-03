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
      ['a string that is not a number', 'tall'],
    ])('stores nothing for a height that is %s', (_label, height) => {
      const plugin = buildGrid({ manualRowResize: true });

      plugin.setManualSize(0, 80);
      plugin.setManualSize(0, height);

      expect(plugin.getManualSize(0)).toBe(80);
    });

    it('stores a numeric string as a number, as released versions do', () => {
      const plugin = buildGrid({ manualRowResize: true });

      expect(plugin.setManualSize(0, '150')).toBe(150);
      expect(plugin.getManualSize(0)).toBe(150);
    });

    it('stores the minimum height for `null`, as released versions do', () => {
      const plugin = buildGrid({ manualRowResize: true });
      const minimum = plugin.setManualSize(0, null);

      expect(Number.isFinite(minimum)).toBe(true);
      expect(plugin.getManualSize(0)).toBe(minimum);
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

  describe('the stored setting', () => {
    it('keeps reporting the declared array after a `rowHeights`-only update', () => {
      const plugin = buildGrid({ manualRowResize: [55, 65, 75] });

      hot.updateSettings({ rowHeights: [30, 40, 50, 60, 70] });

      expect(plugin.getSetting()).toEqual([55, 65, 75]);
    });

    it('keeps reporting `true` after a `rowHeights`-only update', () => {
      const plugin = buildGrid({ manualRowResize: true });

      hot.updateSettings({ rowHeights: [30, 40, 50, 60, 70] });

      expect(plugin.getSetting()).toBe(true);
    });
  });
});
