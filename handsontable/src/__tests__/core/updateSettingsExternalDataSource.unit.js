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

  // Regression: with hasExternalDataSource, unrelated updateSettings must not clear rows (DataProvider refetches
  // only when the payload includes dataProvider).
  it('should not clear loaded rows when updateSettings changes an unrelated option', async() => {
    const noop = () => {};

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: {
        rowId: 'id',
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
        onRowsCreate: noop,
        onRowsUpdate: noop,
        onRowsRemove: noop,
      },
    });

    await delay(50);

    expect(hot.countRows()).toBe(1);

    await hot.updateSettings({ height: 500 });

    expect(hot.countRows()).toBe(1);
    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe('A');
  });
});
