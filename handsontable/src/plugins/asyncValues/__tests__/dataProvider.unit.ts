import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { products, settle } from './helpers/grid';

registerAllModules();

/**
 * Builds a server-backed grid whose `onRowsUpdate` is a spy. The server holds its own copy of the rows.
 */
async function createServerGrid(
  asyncValues: unknown = { saveToDataProvider: true },
  extra = {},
  rowId: unknown = 'id',
) {
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
      rowId,
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

  it('should send the row\'s data along with the changes', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid();

    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(onRowsUpdate.mock.calls[0][0]).toEqual([
      { id: 'b', changes: { name: 'new B' }, rowData: { id: 'b', sku: 'B', name: 'new B', price: 2 } },
    ]);
    destroy();
  });

  it('should save a value on the record it resolved for after a data replacement moved the row', async() => {
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid();

    hot.addHook('afterChange', (changes, source) => {
      if (source === 'AsyncValues.resolve') {
        hot.updateData([{ id: 'z', sku: 'Z', name: 'new Z', price: 0 }, ...hot.getSourceData() as object[]]);
      }
    });
    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0].map(({ id, changes }) => [id, changes])).toEqual([['b', { name: 'new B' }]]);
    destroy();
  });

  it('should not save a value the user overwrote before the save ran', async() => {
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid();

    hot.addHook('afterChange', (changes, source) => {
      if (source === 'AsyncValues.resolve') {
        hot.setDataAtRowProp(1, 'name', 'user B', 'edit');
      }
    });
    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0].map(({ id, changes }) => [id, changes])).toEqual([['b', { name: 'user B' }]]);
    destroy();
  });

  it('should save nothing when the option is switched off before the save ran', async() => {
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid();

    hot.addHook('afterChange', (changes, source) => {
      if (source === 'AsyncValues.resolve') {
        hot.updateSettings({ asyncValues: { saveToDataProvider: false } });
      }
    });
    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('new B'));
    await settle();

    expect(hot.getDataAtRowProp(1, 'name')).toBe('new B');
    expect(onRowsUpdate).not.toHaveBeenCalled();
    destroy();
  });

  it('should warn and skip a row whose dataProvider.rowId has no value', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { plugin, onRowsUpdate, destroy } = await createServerGrid(
      { saveToDataProvider: true },
      {},
      (row: { id: string; sku: string }) => (row.sku === 'D' ? null : row.id),
    );

    await plugin.setAsyncValueAt({ physicalRow: 3, prop: 'name' }, Promise.resolve('new D'));
    await settle();

    expect(onRowsUpdate).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`dataProvider.rowId` has no value'));
    warn.mockRestore();
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
    expect(hot.getDataAtRowProp(1, 'name')).toBe('new B');
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
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`undo: \'record\'`'));
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
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs the `dataProvider` option'));
    warn.mockRestore();
    hot.destroy();
    container.remove();
  });

  it('should leave out a value the cell\'s validator marked invalid, like DataProvider does for an edit', async() => {
    const { plugin, onRowsUpdate, destroy } = await createServerGrid(
      { saveToDataProvider: true },
      { columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price', type: 'numeric' }] },
    );

    await Promise.all([
      plugin.setAsyncValueAt({ rowId: 'a', prop: 'price' }, Promise.resolve(11)),
      plugin.setAsyncValueAt({ rowId: 'b', prop: 'price' }, Promise.resolve('n/a')),
      plugin.setAsyncValueAt({ rowId: 'c', prop: 'price' }, Promise.resolve(33)),
    ]);
    await settle();
    await settle();

    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0].map(({ id, changes }) => [id, changes]))
      .toEqual([['a', { price: 11 }], ['c', { price: 33 }]]);
    destroy();
  });

  it('should save the value a validator corrected through a `*Validator` source', async() => {
    let hotRef: Handsontable;
    const { hot, plugin, onRowsUpdate, destroy } = await createServerGrid(
      { saveToDataProvider: true },
      {
        columns: [
          { data: 'sku' },
          {
            data: 'name',
            validator(this: { visualRow: number; prop: string }, value: unknown, done: (valid: boolean) => void) {
              if (typeof value === 'string' && value !== value.trim()) {
                hotRef.setDataAtRowProp(this.visualRow, this.prop, value.trim(), 'trimValidator');
              }

              done(true);
            },
          },
          { data: 'price' },
        ],
      },
    );

    hotRef = hot;
    await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, Promise.resolve('  new B  '));
    await settle();
    await settle();

    expect(hot.getDataAtRowProp(1, 'name')).toBe('new B');
    expect(onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(onRowsUpdate.mock.calls[0][0].map(({ id, changes }) => [id, changes])).toEqual([['b', { name: 'new B' }]]);
    destroy();
  });

  it('should reject a non-boolean value of the option', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { plugin, destroy } = await createServerGrid({ saveToDataProvider: 'yes' });

    expect(plugin.getSetting('saveToDataProvider')).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    destroy();
  });
});
