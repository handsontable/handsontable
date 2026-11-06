import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const NESTED_HEADERS = [[{ label: 'G', colspan: 3 }], ['a', 'b', 'c']];
const WARNING = 'You need to configure the Nested Headers plugin in order to use collapsible headers.';

/**
 * The warning about a missing `nestedHeaders` setting is checked in the plugin's ready step, once the
 * settings in force are the ones the data was loaded with. Checked in `enablePlugin()`, a grid-level
 * `collapsibleColumns: true` warned under SheetsBar before the sheet's own `nestedHeaders` arrived.
 */
describe('CollapsibleColumns missing-nestedHeaders warning', () => {
  let container;
  let hot;
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    warnSpy.mockRestore();
  });

  const warnings = () => warnSpy.mock.calls.filter(([message]) => String(message) === WARNING);

  it('warns once when a grid enables the plugin without nested headers', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(2, 3),
      colHeaders: true,
      collapsibleColumns: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(warnings()).toHaveLength(1);
  });

  it('does not warn when the grid declares nested headers', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(2, 3),
      colHeaders: true,
      nestedHeaders: NESTED_HEADERS,
      collapsibleColumns: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(warnings()).toHaveLength(0);
  });

  it('does not warn when only the sheets declare nested headers under a grid-level option', () => {
    hot = new Handsontable(container, {
      colHeaders: true,
      collapsibleColumns: true,
      sheetsBar: {
        sheets: [
          {
            name: 'Grouped',
            data: Handsontable.helper.createSpreadsheetData(2, 3),
            settings: { nestedHeaders: NESTED_HEADERS },
          },
          { name: 'Plain', data: Handsontable.helper.createSpreadsheetData(2, 3) },
        ],
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(warnings()).toHaveLength(0);

    const bar = hot.getPlugin('sheetsBar');

    bar.setActiveSheet('Plain');
    bar.setActiveSheet('Grouped');

    expect(warnings()).toHaveLength(0);
    expect(hot.getPlugin('nestedHeaders').getStateManager().getHeaderSettings(0, 0)?.collapsible).toBe(true);
  });

  it('does not warn when the opening sheet has no nested headers and a later sheet declares them', () => {
    hot = new Handsontable(container, {
      colHeaders: true,
      collapsibleColumns: true,
      sheetsBar: {
        sheets: [
          { name: 'Plain', data: Handsontable.helper.createSpreadsheetData(2, 3) },
          {
            name: 'Grouped',
            data: Handsontable.helper.createSpreadsheetData(2, 3),
            settings: { nestedHeaders: NESTED_HEADERS },
          },
        ],
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(warnings()).toHaveLength(0);

    hot.getPlugin('sheetsBar').setActiveSheet('Grouped');

    expect(warnings()).toHaveLength(0);
    expect(hot.getPlugin('nestedHeaders').getStateManager().getHeaderSettings(0, 0)?.collapsible).toBe(true);
  });

  it('warns once when no sheet of a workbook declares nested headers', () => {
    hot = new Handsontable(container, {
      colHeaders: true,
      collapsibleColumns: true,
      sheetsBar: {
        sheets: [
          { name: 'One', data: Handsontable.helper.createSpreadsheetData(2, 3) },
          { name: 'Two', data: Handsontable.helper.createSpreadsheetData(2, 3) },
        ],
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(warnings()).toHaveLength(1);
  });

  it('checks again when the plugin is enabled through updateSettings()', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(2, 3),
      colHeaders: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.updateSettings({ collapsibleColumns: true });

    expect(warnings()).toHaveLength(1);

    hot.updateSettings({ collapsibleColumns: false });
    hot.updateSettings({ nestedHeaders: NESTED_HEADERS, collapsibleColumns: true });

    expect(warnings()).toHaveLength(1);
  });
});
