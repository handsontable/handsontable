import Handsontable from '../../../base';
import { registerPlugin } from '../../../plugins/registry';
import { DataProvider } from '../../../plugins/dataProvider/dataProvider';

registerPlugin(DataProvider);

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Lets the fetches and mutations of the provider run to their end.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  for (let i = 0; i < 10; i++) {
    await flush();
  }
}

/**
 * Builds a provider over an in-memory list of records that removals change.
 *
 * @returns {object}
 */
function createServer() {
  let records = [
    { id: 'SKU-4821', name: 'Wireless Mouse' },
    { id: 'SKU-0093', name: 'Stainless Steel Water Bottle' },
    { id: 'SKU-1170', name: 'USB-C Cable' },
  ];

  return {
    rowId: 'id',
    fetchRows: jest.fn(async() => ({ rows: records.map(record => ({ ...record })), totalRows: records.length })),
    onRowsCreate: jest.fn(async() => []),
    onRowsUpdate: jest.fn(async() => {}),
    onRowsRemove: jest.fn(async(ids) => {
      records = records.filter(record => !ids.includes(record.id));
    }),
  };
}

describe('Row identity with a server-backed grid', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should read the ids with `dataProvider.rowId`, and report the ids the server removed', async() => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      dataProvider: createServer(),
      columns: [{ data: 'name' }],
    });
    await settle();

    const removed = jest.fn();

    hot.addHook('afterRowIdsRemoved', removed);

    expect(hot.getRowIds()).toEqual(['SKU-4821', 'SKU-0093', 'SKU-1170']);

    await hot.getPlugin('dataProvider').fetchData();
    await settle();

    expect(removed).not.toHaveBeenCalled();

    await hot.getPlugin('dataProvider').removeRows(['SKU-0093']);
    await settle();

    expect(hot.getRowIds()).toEqual(['SKU-4821', 'SKU-1170']);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledWith(['SKU-0093'], 'dataProvider');
  });
});
