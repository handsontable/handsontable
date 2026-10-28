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
    it('keeps the imported column types and locks on the sheet the file was imported into', async() => {
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
        { name: 'Alpha', data: threeColumns() },
        { name: 'Beta', data: threeColumns() },
      ]);
      const alphaWidth = hot.getColWidth(0);
      const alphaHeight = hot.getRowHeight(1);

      bar.setActiveSheet('Beta');
      await importFixture('layout');

      const betaWidth = hot.getColWidth(0);
      const betaHeight = hot.getRowHeight(1);

      expect(betaWidth).not.toBe(alphaWidth);
      expect(hot.getPlugin('hiddenRows').isHidden(3)).toBe(true);
      expect(hot.getPlugin('hiddenColumns').isHidden(2)).toBe(true);

      bar.setActiveSheet('Alpha');

      expect(hot.getColWidth(0)).toBe(alphaWidth);
      expect(hot.getRowHeight(1)).toBe(alphaHeight);
      expect(hot.getPlugin('hiddenRows').isHidden(2)).toBe(false);
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
