import { SUBSCRIPTION_KEY } from '../../entitlementLicenseKey/__tests__/fixtures';

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

/**
 * The plugins that are on in every grid (`gate: 'call'`) check the license key when they are used. Every test
 * loads a fresh copy of the modules, because the console message prints once per page.
 */
describe('license gates of the plugins that are on in every grid', () => {
  let Handsontable;
  let tierKeyWith;
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
    // The tier keys must spy on the plugin classes of the same fresh copy.
    // eslint-disable-next-line global-require
    ({ tierKeyWith, resetTierKeys } = require('../../entitlementLicenseKey/__tests__/tierKeys'));
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
   * Builds a key that unlocks the base package.
   *
   * @returns {string}
   */
  function baseKey() {
    return tierKeyWith(BASE_FEATURES);
  }

  /**
   * Builds a key that unlocks the column menu and the AutoColumnSize it requires, and leaves every other
   * plugin that is on by default out.
   *
   * @returns {string}
   */
  function minimalKey() {
    return tierKeyWith(['feat:dropdown_menu', 'feat:auto_column_size']);
  }

  describe('ExportFile', () => {
    it('should refuse an export the key does not cover, and report it once', async() => {
      const hot = createGrid({ licenseKey: minimalKey() });
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

      // A feature refused on a call stays in the bar after an update: the key still leaves it out.
      hot.updateSettings({ colHeaders: false });

      expect(hot.rootSlotBottomElement.querySelector('.hot-display-license-info_missing-features').textContent)
        .toContain('Export to file');
    });

    it('should export when the key covers it, and when the key is not flagged', () => {
      expect(createGrid({ licenseKey: baseKey() }).getPlugin('exportFile').exportAsString('csv', { bom: false }))
        .toBe('1,2,true\r\n3,4,false');
      expect(createGrid({ licenseKey: SUBSCRIPTION_KEY }).getPlugin('exportFile').exportAsString('csv', { bom: false }))
        .toBe('1,2,true\r\n3,4,false');
      expect(missingFeatureErrors()).toEqual([]);
    });

    it('should hide the "Export" menu item when the key does not cover it', () => {
      // eslint-disable-next-line global-require
      const exportItem = require('handsontable/plugins/exportFile/contextMenuItem/exportItem').default;
      const restricted = createGrid({ licenseKey: minimalKey(), exportFile: {} });
      const covered = createGrid({ licenseKey: baseKey(), exportFile: {} });

      expect(exportItem(restricted.getPlugin('exportFile')).hidden.call(restricted)).toBe(true);
      expect(exportItem(covered.getPlugin('exportFile')).hidden.call(covered)).toBe(false);
      // Hiding the item reports nothing: only a call does.
      expect(missingFeatureErrors().filter(text => text.includes('feat:export_file'))).toEqual([]);
    });

    it('should read no merges from a MergeCells plugin the key keeps off', () => {
      // eslint-disable-next-line global-require
      const ExportDataProvider = require('handsontable/plugins/exportFile/dataProvider').default;
      const hot = createGrid({
        licenseKey: baseKey(),
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });
      const provider = new ExportDataProvider(hot);

      provider.setOptions({ range: [] });

      expect(hot.getPlugin('mergeCells').enabled).toBe(false);
      expect(provider.getMergeCells()).toEqual([]);
    });

    it('should read no column summaries from a ColumnSummary plugin the key keeps off', () => {
      // eslint-disable-next-line global-require
      const ExportDataProvider = require('handsontable/plugins/exportFile/dataProvider').default;
      const hot = createGrid({
        licenseKey: baseKey(),
        columnSummary: [{ sourceColumn: 0, destinationRow: 1, destinationColumn: 1, type: 'sum' }],
      });
      const provider = new ExportDataProvider(hot);

      provider.setOptions({ range: [] });

      // The plugin builds its endpoints when it starts, so an XLSX export that read them threw a TypeError.
      expect(hot.getPlugin('columnSummary').isEnabled()).toBe(true);
      expect(hot.getPlugin('columnSummary').enabled).toBe(false);
      expect(provider.getColumnSummaries()).toEqual([]);
    });
  });

  describe('ImportFile', () => {
    it('should refuse an import the key does not cover', async() => {
      const hot = createGrid({ licenseKey: minimalKey() });
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
      const hot = createGrid({ licenseKey: baseKey() });

      expect(hot.getPlugin('importFile').inferColumnTypes([['1'], ['2']]).columns.length).toBe(1);
    });
  });

  describe('ViewState', () => {
    it('should refuse to read, check, or restore a view state the key does not cover', () => {
      const hot = createGrid({ licenseKey: minimalKey() });
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
      const hot = createGrid({ licenseKey: baseKey() });

      expect(typeof hot.getPlugin('viewState').getViewState()).toBe('object');
    });
  });

  describe('CheckboxHeader', () => {
    const settings = {
      data: [[true, 1], [false, 2]],
      columns: [{ type: 'checkbox', headerCheckbox: true }, {}],
    };

    it('should draw no header checkbox the key does not cover, and name it in the one message of the grid', async() => {
      const hot = createGrid({ licenseKey: minimalKey(), ...settings });
      // CheckboxHeader checks its columns in its ready step, after the plugins the key keeps off are known.
      // The grid prints one message, before the constructor returns, that names both.
      const printedAtInit = missingFeatureErrors();

      expect(hot.getPlugin('checkboxHeader').hasHeaderCheckbox(0)).toBe(false);
      expect(hot.rootElement.querySelector('.htCheckboxHeaderInput')).toBeNull();
      expect(hot.getPlugin('checkboxHeader').toggleColumn(0)).toBe(false);
      expect(hot.getDataAtCol(0)).toEqual([true, false]);
      expect(printedAtInit.length).toBe(1);
      expect(printedAtInit[0]).toContain('Checkbox header (feat:checkbox_header)');
      expect(printedAtInit[0]).toContain('Copy and paste (feat:copy_paste)');

      await Promise.resolve();

      const barLines = hot.rootSlotBottomElement.querySelectorAll('.hot-display-license-info_missing-features');

      expect(missingFeatureErrors()).toEqual(printedAtInit);
      expect(barLines.length).toBe(1);
      expect(barLines[0].textContent).toContain('Checkbox header');
      expect(barLines[0].textContent).toContain('Copy and paste');
    });

    it('should print one message when an `init` listener updates the settings before the `init` write', async() => {
      const hot = createGrid({
        licenseKey: minimalKey(),
        ...settings,
        colWidths: 60,
        init() {
          this.updateSettings({ readOnly: false });
        },
      });
      const printedAtInit = missingFeatureErrors();

      expect(printedAtInit.length).toBe(1);
      expect(printedAtInit[0]).toContain('Checkbox header (feat:checkbox_header)');
      expect(printedAtInit[0]).toContain('Copy and paste (feat:copy_paste)');

      await Promise.resolve();

      const barLines = hot.rootSlotBottomElement.querySelectorAll('.hot-display-license-info_missing-features');

      expect(missingFeatureErrors()).toEqual(printedAtInit);
      expect(barLines.length).toBe(1);
      expect(barLines[0].textContent).toContain('Checkbox header');
    });

    it('should print one message when a gated call made before the `init` write throws', async() => {
      let thrown = null;

      createGrid({
        licenseKey: minimalKey(),
        ...settings,
        colWidths: 60,
        init() {
          try {
            this.getPlugin('viewState').getViewState();
          } catch (error) {
            thrown = error;
          }
        },
      });
      const printedAtInit = missingFeatureErrors();

      expect(thrown).not.toBeNull();
      expect(printedAtInit.length).toBe(1);
      expect(printedAtInit[0]).toContain('Checkbox header (feat:checkbox_header)');
      expect(printedAtInit[0]).toContain('View state (feat:view_state)');

      await Promise.resolve();

      expect(missingFeatureErrors()).toEqual(printedAtInit);
    });

    it('should write the message and the bar on `init`, after the listeners added before it and before the first render',
      () => {
        const seen = {};
        const read = hot => ({
          errors: missingFeatureErrors().length,
          barLines: hot.rootSlotBottomElement.querySelectorAll('.hot-display-license-info_missing-features').length,
        });

        createGrid({
          licenseKey: minimalKey(),
          ...settings,
          init() {
            seen.init = read(this);
          },
          afterRender() {
            seen.firstRender ??= read(this);
          },
          afterInit() {
            seen.afterInit = read(this);
          },
        });

        expect(seen.init).toEqual({ errors: 0, barLines: 0 });
        expect(seen.firstRender).toEqual({ errors: 1, barLines: 1 });
        expect(seen.afterInit).toEqual({ errors: 1, barLines: 1 });
      });

    it.each([
      ['a key that leaves out the header checkbox', () => minimalKey()],
      ['a key that covers every feature', () => SUBSCRIPTION_KEY],
    ])('should let an `afterInit` listener destroy the grid built with %s', (_, buildKey) => {
      const licenseKey = buildKey();
      const container = document.createElement('div');

      document.body.appendChild(container);
      containers.push(container);

      let hot = null;

      expect(() => {
        hot = new Handsontable(container, {
          licenseKey,
          ...settings,
          afterInit() {
            this.destroy();
          },
        });
      }).not.toThrow();
      expect(hot.isDestroyed).toBe(true);
    });

    it('should name the header checkbox of a column the first render does not draw in the one message', async() => {
      const columnCount = 40;
      const hot = createGrid({
        licenseKey: minimalKey(),
        data: [Array.from({ length: columnCount }, (_, column) => column === columnCount - 1)],
        columns: Array.from({ length: columnCount }, (_, column) => (
          column === columnCount - 1 ? { type: 'checkbox', headerCheckbox: true } : {}
        )),
        colWidths: 100,
        width: 300,
        height: 200,
      });
      const printedAtInit = missingFeatureErrors();

      expect(hot.countRenderedCols()).toBeLessThan(columnCount);
      expect(printedAtInit.length).toBe(1);
      expect(printedAtInit[0]).toContain('Checkbox header (feat:checkbox_header)');

      hot.scrollViewportTo({ col: columnCount - 1 });
      hot.render();
      await Promise.resolve();

      expect(missingFeatureErrors()).toEqual(printedAtInit);
    });

    it('should name the header checkbox of a grid built hidden in the one message', async() => {
      const container = document.createElement('div');

      container.style.display = 'none';
      document.body.appendChild(container);
      containers.push(container);

      const hot = new Handsontable(container, { licenseKey: minimalKey(), ...settings });

      grids.push(hot);

      const printedAtInit = missingFeatureErrors();

      expect(printedAtInit.length).toBe(1);
      expect(printedAtInit[0]).toContain('Checkbox header (feat:checkbox_header)');

      container.style.display = '';
      hot.render();
      await Promise.resolve();

      expect(missingFeatureErrors()).toEqual(printedAtInit);
    });

    it('should name the header checkbox of a column added by a later settings pass in that pass\'s message', () => {
      const hot = createGrid({ licenseKey: minimalKey(), data: [[1, true]], colWidths: 60 });
      const printedAtInit = missingFeatureErrors();

      expect(printedAtInit.every(text => !text.includes('feat:checkbox_header'))).toBe(true);

      hot.suspendRender();
      hot.updateSettings({ columns: [{}, { type: 'checkbox', headerCheckbox: true }] });

      const printed = missingFeatureErrors().slice(printedAtInit.length);

      expect(printed.length).toBe(1);
      expect(printed[0]).toContain('Checkbox header (feat:checkbox_header)');

      hot.resumeRender();
    });

    it('should write nothing more for a refused header checkbox when a key that covers it arrives', async() => {
      // The ready step refuses the header checkbox and leaves a write to a microtask; the key below is passed
      // before that microtask runs, so the write finds nothing missing.
      const hot = createGrid({ licenseKey: minimalKey(), ...settings });
      const printedAtInit = missingFeatureErrors();

      hot.updateSettings({ licenseKey: SUBSCRIPTION_KEY });

      await Promise.resolve();

      expect(missingFeatureErrors()).toEqual(printedAtInit);
      expect(hot.rootSlotBottomElement.querySelector('.hot-display-license-info_missing-features')).toBeNull();
    });

    it('should draw the header checkbox when the key covers it', () => {
      const hot = createGrid({ licenseKey: baseKey(), ...settings });

      expect(hot.getPlugin('checkboxHeader').hasHeaderCheckbox(0)).toBe(true);
      expect(hot.rootElement.querySelector('.htCheckboxHeaderInput')).not.toBeNull();
    });

    it('should report nothing for a grid whose columns ask for no header checkbox', async() => {
      createGrid({ licenseKey: minimalKey() });

      await Promise.resolve();

      expect(missingFeatureErrors().filter(text => text.includes('feat:checkbox_header'))).toEqual([]);
    });
  });

  describe('AutoRowSize kept off by the key', () => {
    it('should let the engine measure the rows itself', () => {
      const restricted = createGrid({ licenseKey: baseKey(), autoRowSize: true });
      const unrestricted = createGrid({ licenseKey: SUBSCRIPTION_KEY, autoRowSize: true });

      expect(restricted.getPlugin('autoRowSize').enabled).toBe(false);
      expect(restricted.view._wt.getSetting('externalRowCalculator')).toBe(false);
      expect(unrestricted.view._wt.getSetting('externalRowCalculator')).toBe(true);
    });
  });
});
