import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const FALLBACK_WARNING = /RowSelection: `checkboxLocation\.column` .* is not a checkbox column/;

describe('RowSelection: the "falls back to the row header" warning', () => {
  let container;
  let hot;
  let warnSpy;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    warnSpy.mockRestore();
  });

  /**
   * Answers the fallback warnings logged so far.
   *
   * @returns {string[]}
   */
  function fallbackWarnings() {
    return warnSpy.mock.calls.map(([message]) => String(message)).filter(message => FALLBACK_WARNING.test(message));
  }

  it('is not logged when one update turns the plugin off and drops the bound checkbox column', () => {
    hot = new Handsontable(container, {
      data: [[true, 'a']],
      columns: [{ type: 'checkbox' }, {}],
      rowSelection: { checkboxLocation: { column: 0 } },
      rowHeaders: true,
      licenseKey: LICENSE_KEY,
    });

    expect(fallbackWarnings()).toEqual([]);

    hot.updateSettings({ columns: [{}, {}, {}], rowSelection: false, data: [['x', 'y', 'z']] });

    expect(fallbackWarnings()).toEqual([]);
  });

  it('is not logged when the sheets bar opens on a sheet bound to a checkbox column', () => {
    hot = new Handsontable(container, {
      rowHeaders: true,
      colHeaders: true,
      sheetsBar: {
        sheets: [
          {
            name: 'Bound',
            data: [[true, 'a'], [false, 'b']],
            settings: { columns: [{ type: 'checkbox' }, {}], rowSelection: { checkboxLocation: { column: 0 } } },
          },
          { name: 'Other', data: [['x', 'y', 'z']], settings: { columns: [{}, {}, {}] } },
        ],
      },
      licenseKey: LICENSE_KEY,
    });

    expect(hot.getPlugin('rowSelection').getBoundColumn()).toBe(0);
    expect(fallbackWarnings()).toEqual([]);

    hot.getPlugin('sheetsBar').setActiveSheet('Other');
    hot.getPlugin('sheetsBar').setActiveSheet('Bound');

    expect(fallbackWarnings()).toEqual([]);
  });

  it('is still logged once when the bound column is not a checkbox column', () => {
    hot = new Handsontable(container, {
      data: [[true, 'a']],
      columns: [{ type: 'checkbox' }, {}],
      rowSelection: { checkboxLocation: { column: 1 } },
      rowHeaders: true,
      licenseKey: LICENSE_KEY,
    });

    hot.render();

    expect(hot.getPlugin('rowSelection').getBoundColumn()).toBeNull();
    expect(fallbackWarnings().length).toBe(1);
  });
});
