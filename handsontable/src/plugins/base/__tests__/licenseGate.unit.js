import { SUBSCRIPTION_KEY } from '../../../utils/entitlementLicenseKey/__tests__/fixtures';

/**
 * The base package: the nine plugins that are on by default.
 *
 * @type {string[]}
 */
const BASE_FEATURES = [
  'feat:auto_column_size',
  'feat:autofill',
  'feat:checkbox_header',
  'feat:copy_paste',
  'feat:drag_to_scroll',
  'feat:export_file',
  'feat:import_file',
  'feat:undo_redo',
  'feat:view_state',
];

const FILTERS_MESSAGE = 'The license key for Handsontable does not include these features: Filters ' +
  '(feat:filters). They are turned off. To add them, contact sales@handsontable.com.';
// The bar can reach the end user, so it names the features without their tokens.
const FILTERS_BAR_MESSAGE = 'The license key for Handsontable does not include these features: Filters. ' +
  'They are turned off. To add them, contact sales@handsontable.com.';

/**
 * The license gate keeps a plugin the key's tiers do not include off. The console message prints once per page,
 * so every test loads a fresh copy of the modules.
 */
describe('BasePlugin license gate', () => {
  let Handsontable;
  let tierKeyWith;
  let tierKeyWithout;
  let resetTierKeys;
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
    // The tier keys must spy on the plugin classes of the same fresh copy.
    ({
      tierKeyWith,
      tierKeyWithout,
      resetTierKeys,
      // eslint-disable-next-line global-require
    } = require('../../../utils/entitlementLicenseKey/__tests__/tierKeys'));
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    containers = [];
    grids = [];
  });

  afterEach(() => {
    grids.forEach(hot => hot.destroy());
    containers.forEach(container => container.remove());
    consoleError.mockRestore();
    resetTierKeys();
  });

  /**
   * Builds a key that unlocks the base package and `featureIds`.
   *
   * @param {string[]} [featureIds] The features besides the base package.
   * @param {string[]} [flags] The product flags.
   * @param {object} [dates] The license window.
   * @returns {string}
   */
  function baseKey(featureIds = [], flags = [], dates = undefined) {
    return tierKeyWith([...BASE_FEATURES, ...featureIds], flags, dates);
  }

  describe('at init', () => {
    it('should keep a plugin the key does not list off, keep its setting, and report it once', () => {
      const hot = createGrid({ licenseKey: baseKey(), filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(hot.getPlugin('dropdownMenu').enabled).toBe(false);
      expect(hot.getSettings().filters).toBe(true);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);

      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelector('.hot-display-license-info_missing-features').textContent)
        .toBe(FILTERS_BAR_MESSAGE);
      expect(bars[0].querySelector('a').getAttribute('href')).toBe('mailto:sales@handsontable.com');
    });

    it('should enable every plugin that is on by default under the base package, with no message', () => {
      const hot = createGrid({ licenseKey: baseKey() });

      ['autoColumnSize', 'autofill', 'copyPaste', 'dragToScroll', 'undoRedo', 'exportFile', 'importFile',
        'viewState', 'checkboxHeader'].forEach((pluginName) => {
        expect({ pluginName, enabled: hot.getPlugin(pluginName).enabled }).toEqual({ pluginName, enabled: true });
      });
      expect(missingFeatureErrors()).toEqual([]);
      expect(licenseBars(hot)).toEqual([]);
    });

    it('should name every feature the key leaves out in one message, sorted by token', () => {
      // DropdownMenu requires AutoColumnSize, and the key's tier includes both.
      const hot = createGrid({ licenseKey: tierKeyWith(['feat:dropdown_menu', 'feat:auto_column_size']) });

      expect(hot.getPlugin('copyPaste').enabled).toBe(false);
      expect(hot.getPlugin('undoRedo').enabled).toBe(false);
      expect(hot.getPlugin('autoColumnSize').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([
        'The license key for Handsontable does not include these features: Autofill (feat:autofill), ' +
        'Copy and paste (feat:copy_paste), Drag to scroll (feat:drag_to_scroll), Undo and redo ' +
        '(feat:undo_redo). They are turned off. To add them, contact sales@handsontable.com.',
      ]);
    });

    it('should not restrict a key that names no tier', () => {
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

      const hot = createGrid({ licenseKey: baseKey() });

      expect(hot.getPlugin('thirdPartyLicensed').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should not restrict the non-commercial key, which reads as invalid since 19.0', () => {
      const hot = createGrid({ licenseKey: 'non-commercial-and-evaluation', filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(true);
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should print one console message for two grids with the same key and missing features', () => {
      const licenseKey = baseKey();

      createGrid({ licenseKey, filters: true });
      const second = createGrid({ licenseKey, filters: true });

      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
      expect(licenseBars(second).length).toBe(1);
    });
  });

  describe('the silencing flags', () => {
    it('should show the bar and print nothing with "no-console-warns"', () => {
      const hot = createGrid({ licenseKey: baseKey([], ['no-console-warns']), filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([]);
      expect(licenseBars(hot).length).toBe(1);
    });

    it('should print the message and show no bar with "no-ui-warns"', () => {
      const hot = createGrid({ licenseKey: baseKey([], ['no-ui-warns']), filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
      expect(licenseBars(hot)).toEqual([]);
    });

    it('should keep the plugin off with no message on a key issued for external use', () => {
      const hot = createGrid({ licenseKey: baseKey([], ['no-console-warns', 'no-ui-warns']), filters: true });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(missingFeatureErrors()).toEqual([]);
      expect(licenseBars(hot)).toEqual([]);
    });
  });

  describe('next to a lifecycle message', () => {
    it('should add the message to the one license bar the grid has', () => {
      const hot = createGrid({ licenseKey: baseKey([], [], { release_until: '2020-01-01' }), filters: true });
      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelectorAll('.hot-display-license-info_inner').length).toBe(2);
      expect(bars[0].querySelector('.hot-display-license-info_missing-features').textContent)
        .toBe(FILTERS_BAR_MESSAGE);
    });
  });

  describe('on updateSettings()', () => {
    it('should keep a plugin turned on later off, report it once, and keep its setting', () => {
      const hot = createGrid({ licenseKey: baseKey() });

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
      const hot = createGrid({ licenseKey: baseKey(), filters: true });

      hot.updateSettings({ mergeCells: true });

      const bars = licenseBars(hot);

      expect(bars.length).toBe(1);
      expect(bars[0].querySelectorAll('.hot-display-license-info_missing-features').length).toBe(1);
      expect(bars[0].textContent).toContain('these features: Filters, Merge cells. They are turned off.');
      expect(missingFeatureErrors()[1]).toContain('Filters (feat:filters), Merge cells (feat:merge_cells).');
      expect(missingFeatureErrors().length).toBe(2);
    });

    it('should enable the plugin once a key with a tier that includes it is passed', () => {
      const hot = createGrid({ licenseKey: baseKey(), filters: true });

      // Filters requires DropdownMenu, HiddenRows and AutoColumnSize, and the key's tier includes them too.
      hot.updateSettings({
        licenseKey: baseKey(['feat:filters', 'feat:dropdown_menu', 'feat:hidden_rows']),
      });

      expect(hot.getPlugin('filters').enabled).toBe(true);
    });

    it('should take the message away for a key that leaves nothing out, and bring the same bar back after', () => {
      const licenseKey = baseKey();
      const hot = createGrid({ licenseKey, filters: true });
      const [bar] = licenseBars(hot);

      hot.updateSettings({ licenseKey: SUBSCRIPTION_KEY });

      expect(hot.getPlugin('filters').enabled).toBe(true);
      expect(licenseBars(hot)).toEqual([]);

      // The bar registered a focus scope when it was built; registering it again would throw.
      expect(() => hot.updateSettings({ licenseKey })).not.toThrow();
      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(licenseBars(hot)).toEqual([bar]);
      expect(bar.querySelector('.hot-display-license-info_missing-features').textContent).toBe(FILTERS_BAR_MESSAGE);
      // The same key and the same features: the console message is not printed twice on a page.
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
    });

    it('should keep the lifecycle message in the bar when the missing features go away', () => {
      const hot = createGrid({ licenseKey: baseKey([], [], { release_until: '2020-01-01' }), filters: true });

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

      hot.updateSettings({ licenseKey: baseKey() });

      expect(hot.getPlugin('filters').enabled).toBe(false);
      expect(hot.getSettings().filters).toBe(true);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
    });
  });

  describe('a plugin that asks another one whether it runs', () => {
    it('should let a resized row go below its declared height when the key keeps AutoRowSize off', () => {
      // Unlocks Row resizing and leaves Auto row size out.
      const hot = createGrid({
        licenseKey: tierKeyWith(['feat:manual_row_resize']),
        autoRowSize: true,
        rowHeights: 40,
        manualRowResize: true,
      });

      expect(hot.getPlugin('autoRowSize').isEnabled()).toBe(true);
      expect(hot.getPlugin('autoRowSize').enabled).toBe(false);
      expect(hot.getPlugin('manualRowResize').enabled).toBe(true);

      hot.getPlugin('manualRowResize').setManualSize(0, 25);

      // A running AutoRowSize keeps a row at least as tall as its content, so a resize only raises it.
      // One that never started measures nothing, and the resized height stands.
      expect(hot.getRowHeight(0)).toBe(25);
    });

    it('should hide the undo and redo items of the context menu when the key keeps UndoRedo off', () => {
      // eslint-disable-next-line global-require
      const undoItem = require('handsontable/utils/menu/predefinedItems/undo').default;
      // eslint-disable-next-line global-require
      const redoItem = require('handsontable/utils/menu/predefinedItems/redo').default;
      const restricted = createGrid({ licenseKey: tierKeyWith(['feat:dropdown_menu', 'feat:auto_column_size']) });
      const covered = createGrid({ licenseKey: baseKey() });

      expect(restricted.getPlugin('undoRedo').isEnabled()).toBe(true);
      expect(restricted.getPlugin('undoRedo').enabled).toBe(false);
      expect(undoItem().hidden.call(restricted)).toBe(true);
      expect(redoItem().hidden.call(restricted)).toBe(true);
      expect(undoItem().hidden.call(covered)).toBe(false);
      expect(redoItem().hidden.call(covered)).toBe(false);
    });
  });

  describe('when the options change', () => {
    it('should take the message away when the option of the only missing feature is turned off', () => {
      const hot = createGrid({ licenseKey: baseKey(), filters: true });

      expect(licenseBars(hot).length).toBe(1);

      hot.updateSettings({ filters: false });

      expect(licenseBars(hot)).toEqual([]);
      expect(missingFeatureErrors()).toEqual([FILTERS_MESSAGE]);
    });

    it('should drop a feature from the bar, and print nothing, when its option is turned off', () => {
      const hot = createGrid({ licenseKey: baseKey(), filters: true, mergeCells: true });

      expect(missingFeatureErrors().length).toBe(1);

      hot.updateSettings({ mergeCells: false });

      expect(licenseBars(hot)[0].querySelector('.hot-display-license-info_missing-features').textContent)
        .toBe(FILTERS_BAR_MESSAGE);
      // A shorter list names nothing new.
      expect(missingFeatureErrors().length).toBe(1);
    });

    it('should list a feature turned on by the same update that turns another one off', () => {
      const hot = createGrid({ licenseKey: baseKey(), filters: true, mergeCells: true });

      hot.updateSettings({ mergeCells: false, comments: true });

      expect(licenseBars(hot)[0].textContent).toContain('these features: Comments, Filters. They are turned off.');
      expect(missingFeatureErrors().length).toBe(2);
      expect(missingFeatureErrors()[1]).toContain('Comments (feat:comments), Filters (feat:filters).');
    });
  });

  describe('a gated call made while the grid is built', () => {
    it('should write the message into the one bar the grid builds, after the lifecycle message', () => {
      // Past its maintenance date (so the grid gets a lifecycle bar) and leaving View state out.
      const expiredKey = tierKeyWith([], [], { release_until: '2020-01-01' });
      const refused = [];
      let hot;

      expect(() => {
        hot = createGrid({
          licenseKey: expiredKey,
          afterLoadData() {
            try {
              this.getPlugin('viewState').getViewState();
            } catch (error) {
              refused.push(error.message);
            }
          },
        });
      }).not.toThrow();

      const bars = licenseBars(hot);

      expect(refused.length).toBeGreaterThan(0);
      expect(bars.length).toBe(1);
      expect(bars[0].querySelectorAll('.hot-display-license-info_inner').length).toBe(2);
      expect(bars[0].querySelector('.hot-display-license-info_missing-features').textContent).toContain('View state');
    });
  });

  describe('checks beyond the settings pass', () => {
    it('should keep a plugin off when an app turns it on directly and the key leaves it out', () => {
      const hot = createGrid({ licenseKey: baseKey(), filters: true });

      hot.getPlugin('filters').enablePlugin();

      expect(hot.getPlugin('filters').enabled).toBe(false);

      // A plugin the key lists still turns on directly.
      hot.getPlugin('undoRedo').disablePlugin();
      hot.getPlugin('undoRedo').enablePlugin();

      expect(hot.getPlugin('undoRedo').enabled).toBe(true);
    });

    it('should not let a plugin the key keeps off block a listed plugin it conflicts with', () => {
      // Unlocks Pagination and leaves NestedRows out.
      const hot = createGrid({ licenseKey: tierKeyWith(['feat:pagination']), pagination: true, nestedRows: true });

      expect(hot.getPlugin('nestedRows').enabled).toBe(false);
      expect(hot.getPlugin('pagination').enabled).toBe(true);
      expect(hot.getSettings().pagination).toBe(true);

      // With both plugins allowed, the conflict holds as before.
      // A tier that unlocks every registered plugin.
      const covered = createGrid({
        licenseKey: tierKeyWithout([]),
        data: [{ a: 1 }, { a: 2 }],
        pagination: true,
        nestedRows: true,
      });

      expect(covered.getPlugin('nestedRows').enabled).toBe(true);
      expect(covered.getPlugin('pagination').enabled).toBe(false);
    });

    it('should name the missing features in alphabetical order', () => {
      // By token the order would be Dialog (feat:dialog), Column menu (feat:dropdown_menu).
      const hot = createGrid({ licenseKey: baseKey(), dialog: true, dropdownMenu: true });

      expect(licenseBars(hot)[0].textContent).toContain('these features: Column menu, Dialog. They are turned off.');
      expect(missingFeatureErrors()[0]).toContain('Column menu (feat:dropdown_menu), Dialog (feat:dialog).');
    });

    it('should disable the "Copy with group headers" item when the key keeps NestedHeaders off', () => {
      // eslint-disable-next-line global-require
      const copyWithGroupHeadersItem = require(
        'handsontable/plugins/copyPaste/contextMenuItem/copyWithColumnGroupHeaders'
      ).default;
      const nestedHeaders = [[{ label: 'Group', colspan: 2 }], ['A', 'B']];
      const restricted = createGrid({ licenseKey: baseKey(), nestedHeaders });
      const covered = createGrid({ licenseKey: tierKeyWithout([]), nestedHeaders });
      const copyPastePlugin = { copyWithAllColumnHeaders() {} };

      restricted.selectCell(0, 0, 0, 1);
      covered.selectCell(0, 0, 0, 1);

      expect(copyWithGroupHeadersItem(copyPastePlugin).disabled.call(restricted)).toBe(true);
      expect(copyWithGroupHeadersItem(copyPastePlugin).disabled.call(covered)).toBe(false);
    });
  });
});
