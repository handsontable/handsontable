import Handsontable from 'handsontable';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Core#updateSettings with external data source', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
    }
    container.remove();
  });

  it('should not clear loaded rows when updateSettings changes an unrelated option', async() => {
    const noop = () => {};
    const fetchRows = jest.fn().mockResolvedValue({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    });

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: {
        rowId: 'id',
        fetchRows,
        onRowsCreate: noop,
        onRowsUpdate: noop,
        onRowsRemove: noop,
      },
    });

    await delay(50);

    expect(hot.countRows()).toBe(1);
    expect(fetchRows).toHaveBeenCalledTimes(1);

    await hot.updateSettings({ height: 500 });

    await delay(50);

    expect(hot.countRows()).toBe(1);
    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe('A');
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should keep ignoring static data after a DataProvider updatePlugin cycle', async() => {
    const noop = () => {};
    const dp = {
      rowId: 'id',
      fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
      onRowsCreate: noop,
      onRowsUpdate: noop,
      onRowsRemove: noop,
    };

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: dp,
    });

    await delay(50);

    expect(hot.runHooks('hasExternalDataSource')).toBe(true);

    await hot.updateSettings({ dataProvider: { ...dp } });

    await delay(50);

    expect(hot.runHooks('hasExternalDataSource')).toBe(true);

    await hot.updateSettings({ data: [[99, 'Replaced']] });

    // External-data path must not bind static `data` as the dataset (regression: lost hook used to call updateData).
    expect(hot.countRows() === 1 && hot.getDataAtCell(0, 0) === 99).toBe(false);

    await hot.getPlugin('dataProvider').fetchData();
    await delay(50);

    expect(hot.countRows()).toBe(1);
    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe('A');
  });
});
