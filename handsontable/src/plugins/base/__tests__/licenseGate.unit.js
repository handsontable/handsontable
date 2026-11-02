import {
  SUBSCRIPTION_KEY,
  FLAGGED_BASE_KEY,
  FLAGGED_FILTERS_KEY,
  FLAGGED_MINIMAL_KEY,
  FLAGGED_EXTERNAL_KEY,
  FLAGGED_NO_UI_WARNS_KEY,
  FLAGGED_NO_CONSOLE_WARNS_KEY,
  FLAGGED_MAINTENANCE_EXPIRED_KEY,
} from '../../../utils/entitlementLicenseKey/__tests__/fixtures';

const FILTERS_MESSAGE = 'The license key for Handsontable does not include these features: Filters ' +
  '(feat:filters). They are turned off. To add them, contact sales@handsontable.com.';

/**
 * The license gate keeps a plugin a key does not list off. The console message prints once per page,
 * so every test loads a fresh copy of the modules.
 */
describe('BasePlugin license gate', () => {
  let Handsontable;
  let consoleError;
  let containers;
  let grids;

  /**
   * Builds a root grid.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    const container = document.createElement('div');

    document.body.appendChild(container);
    containers.push(container);

    const hot = new Handsontable(container, { data: [[1, 2], [3, 4]], colHeaders: true, ...settings });

    grids.push(hot);

    return hot;
  }

  /**
   * Returns the license messages printed with `console.error`.
   *
   * @returns {string[]}
   */
  function missingFeatureErrors() {
    return consoleError.mock.calls.map(args => args.join(' '))
      .filter(text => text.includes('does not include these features'));
  }

  /**
   * Returns the license bar of a grid.
   *
   * @param {Handsontable} hot The grid.
   * @returns {HTMLElement[]}
   */
  function licenseBars(hot) {
    return Array.from(hot.rootSlotBottomElement.querySelectorAll('.hot-display-license-info'));
  }

  beforeEach(() => {
    jest.resetModules();
    // A fresh copy for every test: the console message prints once per page.
    // eslint-disable-next-line global-require
    Handsontable = require('handsontable').default;
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    containers = [];
    grids = [];
  });

  afterEach(() => {
    grids.forEach(hot => hot.destroy());
    containers.forEach(container => container.remove());
    consoleError.mockRestore();
  });

  describe('at init', () => {
    it('should keep a plugin the key does not list off, keep its setting, and report it once', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY, filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(hot.getPlugin('dropdownMenu').enabled).toBe(false);
      expect(hot.getSettings().filters).toBe(true);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);

      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelector('.hot-display-license-info_missing-features').textContent)
        .toBe(FILTERS_MESSAGE);
      expect(bars[0].querySelector('a').getAttribute('href')).toBe('mailto:sales@handsontable.com');
    });

    it('should enable every plugin that is on by default under the base package, with no message', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY });

      ['autoColumnSize', 'autofill', 'copyPaste', 'dragToScroll', 'undoRedo', 'exportFile', 'importFile',
        'viewState', 'checkboxHeader'].forEach((pluginName) => {
        expect({ pluginName, enabled: hot.getPlugin(pluginName).enabled }).toEqual({ pluginName, enabled: true });
      });
      expect(missingFeatureErrors()).toEqual([]);
      expect(licenseBars(hot)).toEqual([]);
    });

    it('should name every feature the key leaves out in one message, sorted by token', () => {
      const hot = createGrid({ licenseKey: FLAGGED_MINIMAL_KEY });

      expect(hot.getPlugin('copyPaste').enabled).toBe(false);
      expect(hot.getPlugin('undoRedo').enabled).toBe(false);
      // The key lists DropdownMenu, which requires AutoColumnSize, so that one stays on.
      expect(hot.getPlugin('autoColumnSize').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([
        'The license key for Handsontable does not include these features: Autofill (feat:autofill), ' +
        'Copy and paste (feat:copy_paste), Drag to scroll (feat:drag_to_scroll), Undo and redo ' +
        '(feat:undo_redo). They are turned off. To add them, contact sales@handsontable.com.',
      ]);
    });

    it('should enable a plugin whose token the key implies through a listed plugin', () => {
      const hot = createGrid({ licenseKey: FLAGGED_FILTERS_KEY, filters: true, dropdownMenu: true });

      expect(hot.getPlugin('filters').enabled).toBe(true);
      expect(hot.getPlugin('dropdownMenu').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should not restrict a key without the flag', () => {
      const hot = createGrid({ licenseKey: SUBSCRIPTION_KEY, filters: true, nestedRows: false, mergeCells: true });

      expect(hot.getPlugin('filters').enabled).toBe(true);
      expect(hot.getPlugin('mergeCells').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should not check a plugin whose own static LICENSE is not a generated one', () => {
      // eslint-disable-next-line global-require
      const { BasePlugin, registerPlugin } = require('handsontable/plugins');

      class ThirdPartyPlugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'thirdPartyLicensed';
        }

        static get LICENSE() {
          return { name: 'MIT' };
        }

        isEnabled() {
          return true;
        }
      }

      registerPlugin(ThirdPartyPlugin);

      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY });

      expect(hot.getPlugin('thirdPartyLicensed').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should not restrict the non-commercial key', () => {
      const hot = createGrid({ licenseKey: 'non-commercial-and-evaluation', filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should print one console message for two grids with the same key and missing features', () => {
      createGrid({ licenseKey: FLAGGED_BASE_KEY, filters: true });
      const second = createGrid({ licenseKey: FLAGGED_BASE_KEY, filters: true });

      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
      expect(licenseBars(second).length).toBe(1);
    });
  });

  describe('the silencing flags', () => {
    it('should show the bar and print nothing with "no-console-warns"', () => {
      const hot = createGrid({ licenseKey: FLAGGED_NO_CONSOLE_WARNS_KEY, filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([]);
      expect(licenseBars(hot).length).toBe(1);
    });

    it('should print the message and show no bar with "no-ui-warns"', () => {
      const hot = createGrid({ licenseKey: FLAGGED_NO_UI_WARNS_KEY, filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
      expect(licenseBars(hot)).toEqual([]);
    });

    it('should keep the plugin off with no message on a key issued for external use', () => {
      const hot = createGrid({ licenseKey: FLAGGED_EXTERNAL_KEY, filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([]);
      expect(licenseBars(hot)).toEqual([]);
    });
  });

  describe('next to a lifecycle message', () => {
    it('should add the message to the one license bar the grid has', () => {
      const hot = createGrid({ licenseKey: FLAGGED_MAINTENANCE_EXPIRED_KEY, filters: true });
      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelectorAll('.hot-display-license-info_inner').length).toBe(2);
      expect(bars[0].querySelector('.hot-display-license-info_missing-features').textContent)
        .toBe(FILTERS_MESSAGE);
    });
  });

  describe('on updateSettings()', () => {
    it('should keep a plugin turned on later off, report it once, and keep its setting', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY });

      hot.updateSettings({ filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(hot.getSettings().filters).toBe(true);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
      expect(licenseBars(hot).length).toBe(1);

      hot.updateSettings({ filters: true });
      hot.updateSettings({ rowHeaders: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
    });

    it('should add a feature turned off later to the same bar', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY, filters: true });

      hot.updateSettings({ mergeCells: true });

      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelectorAll('.hot-display-license-info_missing-features').length).toBe(1);
      expect(bars[0].textContent).toContain('Filters (feat:filters), Merge cells (feat:merge_cells).');
      expect(missingFeatureErrors().length).toBe(2);
    });

    it('should enable the plugin once a key that lists it is passed', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY, filters: true });

      hot.updateSettings({ licenseKey: FLAGGED_FILTERS_KEY });

      expect(hot.getPlugin('filters').enabled).toBe(true);
    });

    it('should take the message away for a key that leaves nothing out, and bring the same bar back after', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY, filters: true });
      const [bar] = licenseBars(hot);

      hot.updateSettings({ licenseKey: SUBSCRIPTION_KEY });

      expect(hot.getPlugin('filters').enabled).toBe(true);
      expect(licenseBars(hot)).toEqual([]);

      // The bar registered a focus scope when it was built; registering it again would throw.
      expect(() => hot.updateSettings({ licenseKey: FLAGGED_BASE_KEY })).not.toThrow();
      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(licenseBars(hot)).toEqual([bar]);
      expect(bar.querySelector('.hot-display-license-info_missing-features').textContent).toBe(FILTERS_MESSAGE);
      // The same key and the same features: the console message is not printed twice on a page.
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
    });

    it('should keep the lifecycle message in the bar when the missing features go away', () => {
      const hot = createGrid({ licenseKey: FLAGGED_MAINTENANCE_EXPIRED_KEY, filters: true });

      hot.updateSettings({ filters: false });
      hot.updateSettings({ licenseKey: SUBSCRIPTION_KEY, filters: true });

      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelector('.hot-display-license-info_missing-features')).toBeNull();
      expect(bars[0].querySelectorAll('.hot-display-license-info_inner').length).toBe(1);
    });

    it('should turn an enabled plugin off when a key that leaves it out is passed', () => {
      const hot = createGrid({ licenseKey: SUBSCRIPTION_KEY, filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(true);

      hot.updateSettings({ licenseKey: FLAGGED_BASE_KEY });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(hot.getSettings().filters).toBe(true);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
    });
  });
});
