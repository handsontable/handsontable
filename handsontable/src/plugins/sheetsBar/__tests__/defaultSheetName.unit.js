import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('SheetsBar default sheet names', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(SheetsBar);
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
   * Builds a workbook from the given sheet names and returns the plugin.
   *
   * @param {string[]} names The declared sheet names.
   * @returns {object}
   */
  function buildWorkbook(names) {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: names.map((name, index) => ({ name, data: [[index]] })) },
      licenseKey: TEST_LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  it('numbers a nameless sheet by how many sheets the workbook has added', () => {
    const plugin = buildWorkbook(['Budget', 'Forecast', 'Notes']);

    expect(plugin.addSheet().name).toBe('Sheet4');
  });

  it('does not reuse the name of a removed sheet', () => {
    const plugin = buildWorkbook(['Budget', 'Forecast', 'Notes']);
    const added = plugin.addSheet();

    plugin.removeSheet(added.id);

    expect(plugin.addSheet().name).toBe('Sheet5');
  });

  it('counts a duplicated sheet in the number', () => {
    const plugin = buildWorkbook(['Budget', 'Forecast']);

    plugin.duplicateSheet(plugin.getSheets()[0].id);

    expect(plugin.addSheet().name).toBe('Sheet4');
  });

  it('gives a blank name the default in addSheet() and refuses it in renameSheet()', () => {
    const plugin = buildWorkbook(['Budget']);

    expect(plugin.addSheet('   ').name).toBe('Sheet2');
    expect(plugin.renameSheet(plugin.getSheets()[0].id, '   ')).toBe(false);
    expect(plugin.getSheets()[0].name).toBe('Budget');
  });

  it('skips a number another sheet already uses', () => {
    const plugin = buildWorkbook(['Budget', 'Sheet3']);

    expect(plugin.addSheet().name).toBe('Sheet4');
  });
});
