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

  it('should read a literal dotted `dataProvider.rowId` key the way the cell does, in CRUD as well', async() => {
    const server = {
      ...createServer(),
      rowId: 'sku.code',
      fetchRows: jest.fn(async() => ({
        rows: [
          { 'sku.code': 'SKU-4821', sku: { code: 'legacy-1' }, name: 'Wireless Mouse' },
          { 'sku.code': 'SKU-0093', sku: { code: 'legacy-2' }, name: 'Stainless Steel Water Bottle' },
        ],
        totalRows: 2,
      })),
    };

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      dataProvider: server,
      columns: [{ data: 'sku.code' }, { data: 'name' }],
    });
    await settle();

    const plugin = hot.getPlugin('dataProvider');

    expect(hot.getDataAtCol(0)).toEqual(['SKU-4821', 'SKU-0093']);
    expect(hot.getRowIds()).toEqual(['SKU-4821', 'SKU-0093']);
    expect(plugin.getRowId(1)).toBe('SKU-0093');

    hot.setDataAtCell(1, 1, 'Insulated Water Bottle');
    await settle();

    expect(server.onRowsUpdate).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'SKU-0093', changes: { name: 'Insulated Water Bottle' } }),
    ]);

    await plugin.updateRows([{ id: 'SKU-0093', changes: { name: 'Steel Water Bottle' } }]);
    await settle();

    expect(server.onRowsUpdate).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'SKU-0093', changes: { name: 'Steel Water Bottle' } }),
    ]);

    hot.alter('remove_row', 0, 1);
    await settle();

    expect(server.onRowsRemove).toHaveBeenCalledWith(['SKU-4821']);
  });

  it('should not walk a dotted `dataProvider.rowId` key while `dataDotNotation` is off', async() => {
    const server = {
      ...createServer(),
      rowId: 'sku.code',
      fetchRows: jest.fn(async() => ({
        rows: [{ sku: { code: 'SKU-4821' }, name: 'Wireless Mouse' }],
        totalRows: 1,
      })),
    };

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      dataProvider: server,
      dataDotNotation: false,
      columns: [{ data: 'name' }],
    });
    await settle();

    expect(hot.getRowIds()).toEqual([null]);
    expect(hot.getPlugin('dataProvider').getRowId(0)).toBeUndefined();
    expect(() => hot.alter('remove_row', 0, 1)).toThrow(/cannot remove row at visual index 0/);
    expect(server.onRowsRemove).not.toHaveBeenCalled();
  });
});
