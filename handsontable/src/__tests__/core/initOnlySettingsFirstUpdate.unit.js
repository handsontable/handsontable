import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

const INIT_ONLY_OPTIONS = [
  ['layoutDirection', 'rtl'],
  ['renderAllRows', true],
  ['renderAllColumns', true],
  ['ariaTags', false],
];

describe('Core: init-only options in the first `updateSettings()` call', () => {
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
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
  });

  /**
   * Builds a grid.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable} The grid.
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  describe.each(INIT_ONLY_OPTIONS)('`%s`', (option, value) => {
    const message = `The \`${option}\` option can not be updated after the Handsontable is initialized.`;

    it('should throw on the first update when the grid was created without it', () => {
      createGrid();

      expect(() => hot.updateSettings({ [option]: value })).toThrowError(message);
    });

    it('should throw on the second update as well', () => {
      createGrid();

      expect(() => hot.updateSettings({ [option]: value })).toThrowError(message);
      expect(() => hot.updateSettings({ [option]: value })).toThrowError(message);
    });

    it('should leave the grid usable after the refused update', () => {
      createGrid();

      expect(() => hot.updateSettings({ [option]: value })).toThrowError(message);
      expect(() => hot.updateSettings({ colHeaders: true })).not.toThrow();
      expect(hot.getSettings().colHeaders).toBe(true);
    });
  });

  it('should still accept the value the grid was created with', () => {
    createGrid({ layoutDirection: 'rtl', renderAllRows: true });

    expect(hot.getSettings().layoutDirection).toBe('rtl');
    expect(hot.getSettings().renderAllRows).toBe(true);
  });

  it('should still refuse to update an option the grid was created with', () => {
    createGrid({ layoutDirection: 'ltr' });

    expect(() => hot.updateSettings({ layoutDirection: 'rtl' }))
      .toThrowError('The `layoutDirection` option can not be updated after the Handsontable is initialized.');
  });

  it('should not affect updates of options that are not init-only', () => {
    createGrid();

    expect(() => hot.updateSettings({ colHeaders: true, rowHeaders: true })).not.toThrow();
    expect(() => hot.updateSettings({ colHeaders: false })).not.toThrow();
  });
});
