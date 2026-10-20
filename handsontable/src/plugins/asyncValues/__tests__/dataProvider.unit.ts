import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { products, settle } from './helpers/grid';

registerAllModules();

/**
 * Builds a server-backed grid whose `onRowsUpdate` is a spy. The server holds its own copy of the rows.
 */
async function createServerGrid(asyncValues: unknown = { saveToDataProvider: true }, extra = {}) {
  const container = document.createElement('div');
  const server = products();
  const onRowsUpdate = jest.fn(async(payload: Array<{ id: string; changes: Record<string, unknown> }>) => {
    payload.forEach(({ id, changes }) => Object.assign(server.find(row => row.id === id)!, changes));
  });

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price' }],
    asyncValues,
    dataProvider: {
      rowId: 'id',
      fetchRows: async() => ({ rows: server.map(row => ({ ...row })), totalRows: server.length }),
      onRowsCreate: async() => {},
      onRowsUpdate,
      onRowsRemove: async() => {},
    },
    licenseKey: 'non-commercial-and-evaluation',
    ...extra,
  });

  await settle();

  return {
    hot,
    server,
    onRowsUpdate,
    plugin: hot.getPlugin('asyncValues'),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('AsyncValues: saveToDataProvider', () => {
  it('should send the values of one flush in one onRowsUpdate call', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid();

    await plugin.setAsyncValuesForRows('all', 'name', async({ physicalRow }) => `new ${physicalRow}`);
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0].map(({ id, changes }) => [id, changes]))
      .toEqual([
        ['a', { name: 'new 0' }],
        ['b', { name: 'new 1' }],
        ['c', { name: 'new 2' }],
        ['d', { name: 'new 3' }],
      ]);
    destroy();
  });

  it('should keep the saved value after the refetch', async() => {
    const { hot, plugin, destroy } = await createServerGrid();

    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('server B'));
    await settle();
    await hot.getPlugin('dataProvider').fetchData();
    await settle();

    expect(hot.getDataAtRowProp(1, 'name')).toBe('server B');
    destroy();
  });

  it('should save nothing by default', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid(true);

    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(onRowsUpdate).not.toHaveBeenCalled();
    destroy();
  });

  it('should save the value of a filtered-out row', async() => {
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid(
      { saveToDataProvider: true },
      { filters: true },
    );
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'neq', ['B']);
    filters.filter();
    await settle();

    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0]).toEqual([expect.objectContaining({ id: 'b', changes: { name: 'new B' } })]);
    destroy();
  });

  it('should not save a rejected request', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid();

    await plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.reject(new Error('boom')));
    await settle();

    expect(onRowsUpdate).not.toHaveBeenCalled();
    destroy();
  });

  it('should not save a value a `beforeChange` listener vetoed', async() => {
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid();

    hot.addHook('beforeChange', (changes, source) => (source === 'AsyncValues.resolve' ? false : undefined));
    await plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.resolve('new A'));
    await settle();

    expect(hot.getDataAtRowProp(0, 'name')).toBe('old A');
    expect(onRowsUpdate).not.toHaveBeenCalled();
    destroy();
  });

  it('should leave the cell resolved and report the failure through afterRowsMutationError', async() => {
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid();
    const afterRowsMutationError = jest.fn();

    onRowsUpdate.mockRejectedValueOnce(new Error('save failed'));
    hot.addHook('afterRowsMutationError', afterRowsMutationError);

    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(afterRowsMutationError).toHaveBeenCalled();
    expect(plugin.getAsyncState({ rowId: 'b', prop: 'name' })).toBeNull();
    destroy();
  });

  it('should skip the save and warn once for a call with `undo: \'record\'`', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'), { undo: 'record' });
    await plugin.setAsyncValueAt({ rowId: 'c', prop: 'name' }, Promise.resolve('new C'), { undo: 'record' });
    await settle();

    expect(onRowsUpdate).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    destroy();
  });

  it('should send a second flush in a second onRowsUpdate call', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid();

    await plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.resolve('new A'));
    await settle();
    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(2);
    expect(onRowsUpdate.mock.calls[1][0].map(({ id }) => id)).toEqual(['b']);
    destroy();
  });

  it('should save a value whose validator answers after the flush, once', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid(
      { saveToDataProvider: true },
      {
        columns: [
          { data: 'sku' },
          {
            data: 'name',
            validator: (value: unknown, done: (valid: boolean) => void) => setTimeout(() => done(true), 0),
          },
          { data: 'price' },
        ],
      },
    );

    await Promise.all([
      plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.resolve('new A')),
      plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B')),
    ]);
    await settle();
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0].map(({ id }) => id)).toEqual(['a', 'b']);
    destroy();
  });

  it('should warn once and save nothing without the dataProvider option', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: products(),
      columns: [{ data: 'sku' }, { data: 'name' }],
      rowId: 'id',
      asyncValues: { saveToDataProvider: true },
      licenseKey: 'non-commercial-and-evaluation',
    });

    await hot.getPlugin('asyncValues').setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.resolve('new A'));
    await settle();

    expect(hot.getDataAtRowProp(0, 'name')).toBe('new A');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    hot.destroy();
    container.remove();
  });

  it('should reject a non-boolean value of the option', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { plugin, destroy } = await createServerGrid({ saveToDataProvider: 'yes' });

    expect(plugin.getSetting('saveToDataProvider')).toBe(false);
    warn.mockRestore();
    destroy();
  });
});
