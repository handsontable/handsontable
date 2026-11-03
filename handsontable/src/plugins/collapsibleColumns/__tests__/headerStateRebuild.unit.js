import Handsontable from 'handsontable';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const NESTED_HEADERS = [[{ label: 'G', colspan: 3 }], ['a', 'b', 'c']];

/**
 * NestedHeaders builds its header state from its own setting after every data load and every
 * `nestedHeaders` update, which resets the `collapsible` flags CollapsibleColumns wrote into it. The
 * flags are written again from NestedHeaders' `afterHeaderStateRebuild` local hook.
 */
describe('CollapsibleColumns flags after a NestedHeaders state rebuild', () => {
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
   * Tells whether the group header over the first three columns is collapsible.
   *
   * @returns {boolean}
   */
  function isGroupCollapsible() {
    return hot.getPlugin('nestedHeaders').getStateManager().getHeaderSettings(0, 0)?.collapsible === true;
  }

  it('keeps the group collapsible after `updateSettings({ nestedHeaders })` and a data load', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      collapsibleColumns: true,
      licenseKey: LICENSE_KEY,
    });

    hot.updateSettings({ nestedHeaders: NESTED_HEADERS });

    expect(isGroupCollapsible()).toBe(true);

    hot.loadData(Handsontable.helper.createSpreadsheetData(3, 3));

    expect(isGroupCollapsible()).toBe(true);
  });

  it('keeps an array-form setting\'s flags after a data load', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      nestedHeaders: NESTED_HEADERS,
      collapsibleColumns: [{ row: -2, col: 0, collapsible: true }],
      licenseKey: LICENSE_KEY,
    });

    hot.loadData(Handsontable.helper.createSpreadsheetData(3, 3));

    expect(isGroupCollapsible()).toBe(true);
  });

  it('makes the group of a sheet declaring nested headers collapsible, also after a round trip', () => {
    hot = new Handsontable(container, {
      colHeaders: true,
      collapsibleColumns: true,
      sheetsBar: {
        sheets: [
          { name: 'Plain', data: Handsontable.helper.createSpreadsheetData(3, 3) },
          {
            name: 'Grouped',
            data: Handsontable.helper.createSpreadsheetData(3, 3),
            settings: { nestedHeaders: NESTED_HEADERS },
          },
        ],
      },
      licenseKey: LICENSE_KEY,
    });

    const sheetsBar = hot.getPlugin('sheetsBar');

    sheetsBar.setActiveSheet('Grouped');

    expect(isGroupCollapsible()).toBe(true);

    sheetsBar.setActiveSheet('Plain');
    sheetsBar.setActiveSheet('Grouped');

    expect(isGroupCollapsible()).toBe(true);
  });

  it('stops writing the flags once the plugin is off', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      nestedHeaders: NESTED_HEADERS,
      collapsibleColumns: true,
      licenseKey: LICENSE_KEY,
    });

    hot.updateSettings({ collapsibleColumns: false });
    hot.loadData(Handsontable.helper.createSpreadsheetData(3, 3));

    expect(isGroupCollapsible()).toBe(false);
  });
});
