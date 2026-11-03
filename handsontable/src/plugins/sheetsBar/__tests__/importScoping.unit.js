import Handsontable from '../../../index';
import { loadFixture } from '../../../utils/xlsxEngine/__tests__/helpers/fixtures';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const STYLE_SELECTOR = 'style[data-hot-imported-styles]';

/**
 * Returns three rows of three columns.
 *
 * @returns {Array[]}
 */
function threeColumns() {
  return [['a1', 'b1', 'c1'], ['a2', 'b2', 'c2'], ['a3', 'b3', 'c3']];
}

/**
 * Returns five rows of three columns, enough for every row index `layout.xlsx` hides or freezes.
 *
 * @returns {Array[]}
 */
function fiveRows() {
  return Array.from({ length: 5 }, (_, row) => [`a${row}`, `b${row}`, `c${row}`]);
}

describe('SheetsBar with an imported file', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

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
   * Builds a grid with ImportFile and a sheets bar over the given sheets.
   *
   * @param {object[]} sheets The `sheets` setting.
   * @param {object} [settings] Grid-level settings.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(sheets, settings = {}) {
    hot = new Handsontable(container, {
      importFile: true,
      ...settings,
      sheetsBar: { sheets },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Imports a fixture into the visible sheet.
   *
   * @param {string} fixture The fixture name.
   * @param {object} [options] The import options.
   * @returns {Promise}
   */
  function importFixture(fixture, options = {}) {
    return hot.getPlugin('importFile').importFromArrayBuffer('xlsx', loadFixture(fixture), options);
  }

  /**
   * Returns the text of the imported stylesheet, or `''` when there is none.
   *
   * @returns {string}
   */
  function importedStyles() {
    return hot.rootWrapperElement.querySelector(STYLE_SELECTOR)?.textContent ?? '';
  }

  /**
   * Returns the imported style classes the cell at `(0, 0)` carries.
   *
   * @returns {string[]}
   */
  function importedClassesAtFirstCell() {
    const { className } = hot.getCellMeta(0, 0);
    const classes = Array.isArray(className) ? className : `${className ?? ''}`.split(' ');

    return classes.filter(name => name.startsWith('htImported-'));
  }

  describe('the settings the import writes', () => {
    it('keeps the imported locks and column count on the sheet the file was imported into', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      bar.setActiveSheet('Beta');
      await importFixture('styles', { importStyles: true });

      const importedColumns = hot.countCols();

      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);

      bar.setActiveSheet('Alpha');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.countCols()).toBe(3);

      bar.setActiveSheet('Beta');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
      expect(hot.countCols()).toBe(importedColumns);
    });

    it('keeps the imported sizes and hidden rows and columns on the sheet the file was imported into', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: fiveRows() },
        { name: 'Beta', data: fiveRows() },
      ]);
      const alphaWidth = hot.getColWidth(0);
      const alphaHeight = hot.getRowHeight(1);

      bar.setActiveSheet('Beta');
      await importFixture('layout');

      const betaWidth = hot.getColWidth(0);
      const betaHeight = hot.getRowHeight(1);

      expect(betaWidth).not.toBe(alphaWidth);
      expect(betaHeight).not.toBe(alphaHeight);
      expect(hot.getPlugin('hiddenRows').isHidden(3)).toBe(true);
      expect(hot.getPlugin('hiddenColumns').isHidden(2)).toBe(true);

      bar.setActiveSheet('Alpha');

      expect(hot.getColWidth(0)).toBe(alphaWidth);
      expect(hot.getRowHeight(1)).toBe(alphaHeight);
      expect(hot.getPlugin('hiddenRows').isHidden(3)).toBe(false);
      expect(hot.getPlugin('hiddenColumns').isHidden(2)).toBe(false);

      bar.setActiveSheet('Beta');

      expect(hot.getColWidth(0)).toBe(betaWidth);
      expect(hot.getRowHeight(1)).toBe(betaHeight);
      expect(hot.getPlugin('hiddenRows').isHidden(3)).toBe(true);
      expect(hot.getPlugin('hiddenColumns').isHidden(2)).toBe(true);
    });

    it('keeps imported column headers on the sheet the file was imported into', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ], { colHeaders: ['X', 'Y', 'Z'] });

      bar.setActiveSheet('Beta');
      await importFixture('layout', { colHeaders: 'firstRow' });

      expect(hot.getColHeader(0)).toBe('R1C1');

      bar.setActiveSheet('Alpha');

      expect(hot.getColHeader(0)).toBe('X');

      bar.setActiveSheet('Beta');

      expect(hot.getColHeader(0)).toBe('R1C1');
    });

    it('keeps imported nested headers on the sheet the file was imported into', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ], { colHeaders: true });

      bar.setActiveSheet('Beta');
      await importFixture('layout', { colHeaders: 'firstRow', headerRows: 2 });

      expect(hot.getPlugin('nestedHeaders').enabled).toBe(true);

      bar.setActiveSheet('Alpha');

      expect(hot.getPlugin('nestedHeaders').enabled).toBe(false);
      expect(hot.getColHeader(0)).toBe('A');

      bar.setActiveSheet('Beta');

      expect(hot.getPlugin('nestedHeaders').enabled).toBe(true);
    });

    it('brings the imported widths back over the widths the sheet declares', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns(), settings: { colWidths: 50 } },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('layout');

      const importedWidth = hot.getColWidth(0);

      expect(importedWidth).not.toBe(50);

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');

      expect(hot.getColWidth(0)).toBe(importedWidth);
    });

    it('brings the imported column settings back over the columns the sheet declares', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns(), settings: { columns: [{ type: 'numeric' }, {}, {}] } },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      expect(hot.getCellMeta(0, 0).type).toBe('text');
      expect(hot.countCols()).toBe(5);

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');

      expect(hot.getCellMeta(0, 0).type).toBe('text');
      expect(hot.countCols()).toBe(5);
    });

    it('keeps the imported frozen rows and columns and merged cells on the sheet the file was imported into', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: fiveRows() },
        { name: 'Beta', data: fiveRows() },
      ]);
      const merges = () => hot.getPlugin('mergeCells').mergedCellsCollection?.mergedCells.length ?? 0;

      bar.setActiveSheet('Beta');
      await importFixture('layout');

      expect(hot.getSettings().fixedRowsTop).toBe(1);
      expect(hot.getSettings().fixedColumnsStart).toBe(1);
      expect(merges()).toBe(2);

      bar.setActiveSheet('Alpha');

      expect(hot.getSettings().fixedRowsTop).toBe(0);
      expect(hot.getSettings().fixedColumnsStart).toBe(0);
      expect(merges()).toBe(0);

      bar.setActiveSheet('Beta');

      expect(hot.getSettings().fixedRowsTop).toBe(1);
      expect(hot.getSettings().fixedColumnsStart).toBe(1);
      expect(merges()).toBe(2);
    });

    it('keeps the default widths a later import without widths leaves on the sheet', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);
      const defaultWidth = hot.getColWidth(0);

      await importFixture('layout');

      expect(hot.getColWidth(0)).not.toBe(defaultWidth);

      await importFixture('values');

      expect(hot.getColWidth(0)).toBe(defaultWidth);

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');

      expect(hot.getColWidth(0)).toBe(defaultWidth);
    });

    it('keeps a setting a listener changes during the import as a grid-level value', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);
      let listenerRan = false;

      hot.addHook('afterLoadData', (sourceData, initialLoad) => {
        if (!initialLoad && !listenerRan) {
          listenerRan = true;
          hot.updateSettings({ readOnly: true });
        }
      });
      await importFixture('values');

      expect(listenerRan).toBe(true);
      expect(hot.getSettings().readOnly).toBe(true);

      bar.setActiveSheet('Beta');

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('leaves the imported layout on the grid when the bar is turned off', async() => {
      buildWorkbook([
        { name: 'Alpha', data: fiveRows() },
        { name: 'Beta', data: fiveRows() },
      ]);

      await importFixture('layout');

      const importedWidths = hot.getSettings().colWidths;

      hot.updateSettings({ sheetsBar: false });

      expect(hot.getDataAtCell(0, 0)).toBe('R1C1');
      expect(hot.getSettings().colWidths).toEqual(importedWidths);
      expect(hot.getSettings().fixedRowsTop).toBe(1);
      expect(hot.getPlugin('hiddenRows').isHidden(3)).toBe(true);
    });

    it('leaves the imported layout on the grid when the bar is turned off on a copy of the imported sheet', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: fiveRows() },
        { name: 'Beta', data: fiveRows() },
      ]);

      await importFixture('layout');

      const importedWidths = hot.getSettings().colWidths;
      const copy = bar.duplicateSheet(bar.getSheets()[0].id);

      bar.setActiveSheet(copy.id);
      hot.updateSettings({ sheetsBar: false });

      expect(hot.getSettings().colWidths).toEqual(importedWidths);
      expect(hot.getSettings().fixedRowsTop).toBe(1);
    });

    it('gives the grid back its own settings when the bar is turned off on a sheet without an import', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: fiveRows() },
        { name: 'Beta', data: fiveRows() },
      ]);

      await importFixture('layout');
      bar.setActiveSheet('Beta');
      hot.updateSettings({ sheetsBar: false });

      expect(hot.getSettings().colWidths).toBeNull();
      expect(hot.getSettings().fixedRowsTop).toBe(0);
    });

    it('leaves the settings the host declared for the sheet as they were', async() => {
      const declared = { colWidths: 50 };
      const sheets = [
        { name: 'Alpha', data: threeColumns(), settings: declared },
        { name: 'Beta', data: threeColumns() },
      ];

      buildWorkbook(sheets);
      await importFixture('layout');

      expect(declared).toEqual({ colWidths: 50 });
      expect(sheets[0].settings).toBe(declared);
    });
  });

  describe('the imported cell styles', () => {
    it('keeps each sheet\'s imported styles when another sheet imports a file', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      const [alphaClass] = importedClassesAtFirstCell();

      expect(importedStyles()).toContain(alphaClass);

      bar.setActiveSheet('Beta');
      await importFixture('values', { importStyles: true });

      expect(importedStyles()).not.toContain(alphaClass);

      bar.setActiveSheet('Alpha');

      expect(importedClassesAtFirstCell()).toEqual([alphaClass]);
      expect(importedStyles()).toContain(alphaClass);
    });

    it('keeps a sheet\'s imported styles after a visit to a sheet that turns ImportFile off', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns(), settings: { importFile: false } },
      ]);

      await importFixture('styles', { importStyles: true });

      const [alphaClass] = importedClassesAtFirstCell();

      bar.setActiveSheet('Beta');

      expect(importedStyles()).toBe('');

      bar.setActiveSheet('Alpha');

      expect(importedStyles()).toContain(alphaClass);
    });

    it('keeps the tracked styles in step with the stylesheet when a listener throws during the import', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);
      let throwOnce = true;

      hot.addHook('afterSetCellMeta', () => {
        if (throwOnce) {
          throwOnce = false;
          throw new Error('listener failed');
        }
      });

      await expect(importFixture('styles', { importStyles: true })).rejects.toThrow('listener failed');

      const installed = importedStyles();

      expect(installed).not.toBe('');
      expect(Object.keys(hot.getPlugin('importFile')._exportImportedStyles()).length).toBe(2);

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');

      expect(importedStyles()).toBe(installed);
    });

    it('does not leave the departing sheet\'s styles on the arriving one when a load listener throws', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);
      let throwOnce = true;

      await importFixture('styles', { importStyles: true });
      hot.addHook('afterLoadData', (sourceData, initialLoad, source) => {
        if (throwOnce && `${source}`.endsWith('.switch')) {
          throwOnce = false;
          throw new Error('listener failed');
        }
      });

      expect(() => bar.setActiveSheet('Beta')).toThrow('listener failed');
      expect(bar.getSheets().find(sheet => sheet.isActive).name).toBe('Beta');
      expect(importedStyles()).toBe('');
    });

    it('brings a sheet\'s imported styles back when ImportFile is turned on again for the visible sheet', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      const [alphaClass] = importedClassesAtFirstCell();

      bar.setActiveSheet('Beta');
      bar.updateSheetSettings('Alpha', { importFile: false });
      bar.setActiveSheet('Alpha');

      expect(importedStyles()).toBe('');

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');
      bar.updateSheetSettings('Alpha', { importFile: true });

      expect(importedStyles()).toContain(alphaClass);

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');

      expect(importedStyles()).toContain(alphaClass);
    });

    it('brings the visible sheet\'s imported styles back when ImportFile is turned off and on for it', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      const [alphaClass] = importedClassesAtFirstCell();

      bar.updateSheetSettings('Alpha', { importFile: false });

      expect(importedStyles()).toBe('');

      bar.updateSheetSettings('Alpha', { importFile: true });

      expect(importedStyles()).toContain(alphaClass);
    });

    it('gives a duplicate the stored styles of a visible original that turned ImportFile off', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      const [alphaClass] = importedClassesAtFirstCell();

      bar.updateSheetSettings('Alpha', { importFile: false });

      const copy = bar.duplicateSheet(bar.getSheets()[0].id);

      bar.setActiveSheet(copy.id);
      bar.updateSheetSettings(copy.id, { importFile: true });

      expect(importedStyles()).toContain(alphaClass);
    });

    it('removes the previous workbook\'s styles when a new workbook is built', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      expect(importedStyles()).not.toBe('');

      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'X', data: [[1]] }, { name: 'Y', data: [[2]] }] } });

      expect(importedStyles()).toBe('');

      bar.setActiveSheet('Y');
      bar.setActiveSheet('X');

      expect(hot.getPlugin('importFile')._exportImportedStyles()).toEqual({});
    });

    it('gives a duplicate the imported styles of its original', async() => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);

      await importFixture('styles', { importStyles: true });

      const [alphaClass] = importedClassesAtFirstCell();
      const alpha = bar.getSheets().find(sheet => sheet.name === 'Alpha');
      const copy = bar.duplicateSheet(alpha.id);

      bar.setActiveSheet('Beta');

      expect(importedStyles()).toBe('');

      bar.setActiveSheet(copy.id);

      expect(importedStyles()).toContain(alphaClass);
    });
  });
});
