import Handsontable from '../../../index';
import { textRenderer } from '../../../renderers/textRenderer';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * A renderer only the second sheet declares, so a test can tell it from the grid-level one.
 *
 * @param {...*} args The renderer arguments.
 */
function ownRenderer(...args) {
  textRenderer.apply(this, args);
}

describe('SheetsBar: a sheet\'s own settings win over grid-level updates', () => {
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
    jest.restoreAllMocks();
  });

  /**
   * Builds a workbook whose second sheet declares its own headers and renderer.
   *
   * @param {object} [settings] Grid-level settings.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(settings = {}) {
    hot = new Handsontable(container, {
      colHeaders: ['a', 'b'],
      ...settings,
      sheetsBar: {
        sheets: [
          { name: 'Plain', data: [[1, 2]] },
          { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'], renderer: ownRenderer } },
        ],
      },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  it('keeps the visible sheet\'s headers and renderer when the grid-level values are sent again', () => {
    const plugin = buildWorkbook();

    plugin.setActiveSheet('Own');
    hot.updateSettings({
      colHeaders: ['a', 'b'],
      renderer: textRenderer,
      sheetsBar: hot.getSettings().sheetsBar,
    });

    expect(hot.getColHeader(0)).toBe('X');
    expect(hot.getCellRenderer(0, 0)).toBe(ownRenderer);
  });

  it('keeps the visible sheet\'s headers when a direct update changes the grid-level value', () => {
    const plugin = buildWorkbook();

    plugin.setActiveSheet('Own');
    hot.updateSettings({ colHeaders: ['c', 'd'] });

    expect(hot.getColHeader(0)).toBe('X');
  });

  it('applies a grid-level value the visible sheet declares to the sheets that do not declare it', () => {
    const plugin = buildWorkbook();

    plugin.setActiveSheet('Own');
    hot.updateSettings({ colHeaders: ['c', 'd'] });
    plugin.setActiveSheet('Plain');

    expect(hot.getColHeader(0)).toBe('c');

    plugin.setActiveSheet('Own');

    expect(hot.getColHeader(0)).toBe('X');
  });

  it('applies a grid-level value the visible sheet does not declare at once', () => {
    buildWorkbook();

    hot.updateSettings({ colHeaders: ['c', 'd'] });

    expect(hot.getColHeader(0)).toBe('c');
  });

  it('gives the grid the last grid-level value back when the bar is turned off', () => {
    const plugin = buildWorkbook();

    plugin.setActiveSheet('Own');
    hot.updateSettings({ colHeaders: ['c', 'd'] });
    hot.updateSettings({ sheetsBar: false });

    expect(hot.getColHeader(0)).toBe('c');
  });

  it('leaves the payload object the caller passed unchanged', () => {
    const plugin = buildWorkbook();
    const payload = { colHeaders: ['c', 'd'], readOnly: true };

    plugin.setActiveSheet('Own');
    hot.updateSettings(payload);

    expect(payload).toEqual({ colHeaders: ['c', 'd'], readOnly: true });
    expect(hot.getSettings().readOnly).toBe(true);
  });

  it('keeps the visible sheet\'s headers when the payload carries a `sheets` value the bar rejects', () => {
    const plugin = buildWorkbook();
    const ids = plugin.getSheets().map(sheet => sheet.id);

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    plugin.setActiveSheet('Own');
    hot.updateSettings({ sheetsBar: { sheets: 'not a list' }, colHeaders: ['c', 'd'] });

    expect(plugin.getSheets().map(sheet => sheet.id)).toEqual(ids);
    expect(hot.getColHeader(0)).toBe('X');
  });

  it('runs no settings cycle when every key of the payload belongs to the visible sheet', () => {
    const plugin = buildWorkbook();
    const updated = jest.fn();

    plugin.setActiveSheet('Own');
    hot.addHook('afterUpdateSettings', updated);
    hot.updateSettings({ colHeaders: ['c', 'd'] });

    expect(updated).not.toHaveBeenCalled();
  });

  it('leaves a grid without the bar unfiltered', () => {
    hot = new Handsontable(container, { colHeaders: ['a', 'b'], data: [[1, 2]], licenseKey: LICENSE_KEY });

    hot.updateSettings({ colHeaders: ['c', 'd'] });

    expect(hot.getColHeader(0)).toBe('c');
  });
});
