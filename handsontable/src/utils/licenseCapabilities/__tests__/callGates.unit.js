import {
  SUBSCRIPTION_KEY,
  FLAGGED_BASE_KEY,
  FLAGGED_MINIMAL_KEY,
} from '../../entitlementLicenseKey/__tests__/fixtures';

/**
 * The plugins that are on in every grid (`gate: 'call'`) check the license key when they are used. Every test
 * loads a fresh copy of the modules, because the console message prints once per page.
 */
describe('license gates of the plugins that are on in every grid', () => {
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

    const hot = new Handsontable(container, {
      data: [[1, 2, true], [3, 4, false]],
      colHeaders: true,
      ...settings,
    });

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
   * Builds the message for one missing feature.
   *
   * @param {string} feature The feature as the message names it.
   * @returns {string}
   */
  function messageFor(feature) {
    return `The license key for Handsontable does not include these features: ${feature}. ` +
      'They are turned off. To add them, contact sales@handsontable.com.';
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

  describe('ExportFile', () => {
    it('should refuse an export the key does not cover, and report it once', async() => {
      const hot = createGrid({ licenseKey: FLAGGED_MINIMAL_KEY });
      const exportFile = hot.getPlugin('exportFile');
      const expected = messageFor('Export to file (feat:export_file)');
      const printedAtInit = missingFeatureErrors().length;

      expect(() => exportFile.exportAsString('csv')).toThrow(expected);
      expect(() => exportFile.exportAsBlob('csv')).toThrow(expected);
      expect(() => exportFile.downloadFile('csv')).toThrow(expected);
      await expect(exportFile.exportAsBlobAsync('csv')).rejects.toThrow(expected);
      await expect(exportFile.downloadFileAsync('xlsx')).rejects.toThrow(expected);

      // The key also leaves out the plugins that are on by default, which init reported. The first refused
      // call adds one message, which lists them all; the later calls add nothing.
      const printed = missingFeatureErrors().slice(printedAtInit);

      expect(printed.length).toBe(1);
      expect(printed[0]).toContain('Export to file (feat:export_file)');

      // The bar says the same as the console, without the tokens.
      const bar = hot.rootSlotBottomElement.querySelector('.hot-display-license-info_missing-features').textContent;

      expect(bar).toBe(printed[0].replace(/ \([a-z]+:[a-z_]+\)/g, ''));
      expect(bar).toContain('Export to file');
      expect(bar).not.toContain('feat:');
    });

    it('should export when the key covers it, and when the key is not flagged', () => {
      expect(createGrid({ licenseKey: FLAGGED_BASE_KEY }).getPlugin('exportFile').exportAsString('csv', { bom: false }))
        .toBe('1,2,true\r\n3,4,false');
      expect(createGrid({ licenseKey: SUBSCRIPTION_KEY }).getPlugin('exportFile').exportAsString('csv', { bom: false }))
        .toBe('1,2,true\r\n3,4,false');
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should hide the "Export" menu item when the key does not cover it', () => {
      // eslint-disable-next-line global-require
      const exportItem = require('handsontable/plugins/exportFile/contextMenuItem/exportItem').default;
      const restricted = createGrid({ licenseKey: FLAGGED_MINIMAL_KEY, exportFile: {} });
      const covered = createGrid({ licenseKey: FLAGGED_BASE_KEY, exportFile: {} });

      expect(exportItem(restricted.getPlugin('exportFile')).hidden.call(restricted)).toBe(true);
      expect(exportItem(covered.getPlugin('exportFile')).hidden.call(covered)).toBe(false);
      // Hiding the item reports nothing: only a call does.
      expect(missingFeatureErrors().filter(text => text.includes('feat:export_file'))).toEqual([]);
    });

    it('should read no merges from a MergeCells plugin the key keeps off', () => {
      // eslint-disable-next-line global-require
      const ExportDataProvider = require('handsontable/plugins/exportFile/dataProvider').default;
      const hot = createGrid({
        licenseKey: FLAGGED_BASE_KEY,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });
      const provider = new ExportDataProvider(hot);

      provider.setOptions({ range: [] });

      expect(hot.getPlugin('mergeCells').enabled).toBe(false);
      expect(provider.getMergeCells()).toEqual([]);
    });
  });

  describe('ImportFile', () => {
    it('should refuse an import the key does not cover', async() => {
      const hot = createGrid({ licenseKey: FLAGGED_MINIMAL_KEY });
      const importFile = hot.getPlugin('importFile');
      const expected = messageFor('Import from file (feat:import_file)');
      const printedAtInit = missingFeatureErrors().length;

      expect(() => importFile.inferColumnTypes([['1']])).toThrow(expected);
      await expect(importFile.importFromBlob('xlsx', new Blob([]))).rejects.toThrow(expected);
      await expect(importFile.importFromArrayBuffer('xlsx', new ArrayBuffer(0))).rejects.toThrow(expected);

      const printed = missingFeatureErrors().slice(printedAtInit);

      expect(printed.length).toBe(1);
      expect(printed[0]).toContain('Import from file (feat:import_file)');
    });

    it('should infer column types when the key covers it', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY });

      expect(hot.getPlugin('importFile').inferColumnTypes([['1'], ['2']]).columns.length).toBe(1);
    });
  });

  describe('ViewState', () => {
    it('should refuse to read, check, or restore a view state the key does not cover', () => {
      const hot = createGrid({ licenseKey: FLAGGED_MINIMAL_KEY });
      const viewState = hot.getPlugin('viewState');
      const expected = messageFor('View state (feat:view_state)');
      const printedAtInit = missingFeatureErrors().length;

      expect(() => viewState.getViewState()).toThrow(expected);
      expect(() => viewState.validateViewState({})).toThrow(expected);
      expect(() => viewState.setViewState({})).toThrow(expected);

      const printed = missingFeatureErrors().slice(printedAtInit);

      expect(printed.length).toBe(1);
      expect(printed[0]).toContain('View state (feat:view_state)');
    });

    it('should read the view state when the key covers it', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY });

      expect(typeof hot.getPlugin('viewState').getViewState()).toBe('object');
    });
  });

  describe('CheckboxHeader', () => {
    const settings = {
      data: [[true, 1], [false, 2]],
      columns: [{ type: 'checkbox', headerCheckbox: true }, {}],
    };

    it('should draw no header checkbox the key does not cover, and report it after the render', async() => {
      const hot = createGrid({ licenseKey: FLAGGED_MINIMAL_KEY, ...settings });
      const printedAtInit = missingFeatureErrors().length;

      expect(hot.getPlugin('checkboxHeader').hasHeaderCheckbox(0)).toBe(false);
      expect(hot.rootElement.querySelector('.htCheckboxHeaderInput')).toBeNull();
      expect(hot.getPlugin('checkboxHeader').toggleColumn(0)).toBe(false);
      expect(hot.getDataAtCol(0)).toEqual([true, false]);

      await Promise.resolve();

      const printed = missingFeatureErrors().slice(printedAtInit);

      expect(printed.length).toBe(1);
      expect(printed[0]).toContain('Checkbox header (feat:checkbox_header)');
    });

    it('should draw the header checkbox when the key covers it', () => {
      const hot = createGrid({ licenseKey: FLAGGED_BASE_KEY, ...settings });

      expect(hot.getPlugin('checkboxHeader').hasHeaderCheckbox(0)).toBe(true);
      expect(hot.rootElement.querySelector('.htCheckboxHeaderInput')).not.toBeNull();
    });

    it('should report nothing for a grid whose columns ask for no header checkbox', async() => {
      createGrid({ licenseKey: FLAGGED_MINIMAL_KEY });

      await Promise.resolve();

      expect(missingFeatureErrors().filter(text => text.includes('feat:checkbox_header'))).toEqual([]);
    });
  });

  describe('AutoRowSize kept off by the key', () => {
    it('should let the engine measure the rows itself', () => {
      const restricted = createGrid({ licenseKey: FLAGGED_BASE_KEY, autoRowSize: true });
      const unrestricted = createGrid({ licenseKey: SUBSCRIPTION_KEY, autoRowSize: true });

      expect(restricted.getPlugin('autoRowSize').enabled).toBe(false);
      expect(restricted.view._wt.getSetting('externalRowCalculator')).toBe(false);
      expect(unrestricted.view._wt.getSetting('externalRowCalculator')).toBe(true);
    });
  });
});
