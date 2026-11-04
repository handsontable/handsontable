import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Creates a provider that answers every fetch with the same two rows.
 *
 * @returns {object}
 */
function createProvider() {
  return {
    rowId: 'id',
    fetchRows: async() => ({ rows: [{ id: 1, name: 'one' }, { id: 2, name: 'two' }], totalRows: 2 }),
    onRowsCreate: async() => [],
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  };
}

describe('SheetsBar afterSheetTabStateRestore listener that destroys the grid in the full build', () => {
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

  it.each([
    ['a local sheet', () => ({ data: [['b']] })],
    ['a server sheet', () => ({
      data: [],
      settings: { dataProvider: createProvider(), pagination: true, columns: [{ data: 'id' }, { data: 'name' }] },
    })],
  ])('stops the switch to %s without an error', async(_, betaEntry) => {
    const afterChange = jasmine.createSpy('afterSheetTabChange');

    hot = new Handsontable(container, {
      emptyDataState: true,
      filters: true,
      sheetsBar: {
        sheets: [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', ...betaEntry() }, { name: 'Gamma', data: [['g']] }],
      },
      afterSheetTabChange: afterChange,
      licenseKey: TEST_LICENSE_KEY,
    });

    const plugin = hot.getPlugin('sheetsBar');

    plugin.setActiveSheet('Beta');
    await flush();
    plugin.setActiveSheet('Alpha');
    await flush();
    afterChange.calls.reset();
    hot.addHook('afterSheetTabStateRestore', () => hot.destroy());

    let result;

    expect(() => {
      result = plugin.setActiveSheet('Beta');
    }).not.toThrow();
    expect(result).toBe(false);
    expect(hot.isDestroyed).toBe(true);
    expect(afterChange).not.toHaveBeenCalled();
    await flush();
  });
});
