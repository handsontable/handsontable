describe('DataProvider `removeRows` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call onRowsRemove with array of row ids', async() => {
    const onRowsRemove = jasmine.createSpy('onRowsRemove').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
          totalRows: 2,
        }),
        onRowsRemove,
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows([1, 2]);

    expect(onRowsRemove).toHaveBeenCalledWith([1, 2]);
  });

  it('should accept single row id', async() => {
    const onRowsRemove = jasmine.createSpy('onRowsRemove').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsRemove,
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expect(onRowsRemove).toHaveBeenCalledWith([1]);
  });

  it('should refetch after successful remove', async() => {
    const rows = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    let fetchCount = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => {
          fetchCount += 1;

          return Promise.resolve({
            rows: fetchCount === 1 ? rows : [rows[1]],
            totalRows: fetchCount === 1 ? 2 : 1,
          });
        },
        onRowsRemove: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    expect(countRows()).toBe(2);

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expect(fetchCount).toBe(2);
    expect(countRows()).toBe(1);
    expect(getDataAtCell(0, 0)).toBe(2);
  });

  it('should go to previous page when remove leaves current page empty (pagination)', async() => {
    let totalRows = 4;
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const start = (params.page - 1) * params.pageSize;
      const rows = start >= totalRows
        ? []
        : Array.from({ length: Math.min(params.pageSize, totalRows - start) }, (_, i) => ({
          id: start + i + 1,
          name: `Row ${start + i + 1}`,
        }));

      return Promise.resolve({ rows, totalRows });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 2, initialPage: 2 },
      dataProvider: createDataProviderConfig({
        fetchRows,
        onRowsRemove: () => {
          totalRows -= 2;

          return Promise.resolve();
        },
      }),
    });

    await sleep(100);

    expect(getPlugin('pagination').getPaginationData().currentPage).toBe(2);
    expect(countRows()).toBe(2);

    fetchRows.calls.reset();

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows([3, 4]);

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(fetchRows.calls.mostRecent().args[0].page).toBe(1);
    expect(getPlugin('pagination').getPaginationData().currentPage).toBe(1);
  });

  it('should refetch the same page when remove does not clear all loaded rows (pagination)', async() => {
    let totalRows = 4;
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const start = (params.page - 1) * params.pageSize;
      const rows = start >= totalRows
        ? []
        : Array.from({ length: Math.min(params.pageSize, totalRows - start) }, (_, i) => ({
          id: start + i + 1,
          name: `Row ${start + i + 1}`,
        }));

      return Promise.resolve({ rows, totalRows });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 2, initialPage: 2 },
      dataProvider: createDataProviderConfig({
        fetchRows,
        onRowsRemove: () => {
          totalRows -= 1;

          return Promise.resolve();
        },
      }),
    });

    await sleep(100);

    fetchRows.calls.reset();

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(4);

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(fetchRows.calls.mostRecent().args[0].page).toBe(2);
    expect(getPlugin('pagination').getPaginationData().currentPage).toBe(2);
    expect(countRows()).toBe(1);
    expect(getDataAtCell(0, 0)).toBe(3);
  });

  it('should do nothing when onRowsRemove is not provided', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
        onRowsRemove: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const config = spec().$container.handsontable('getInstance').getSettings().dataProvider;

    config.onRowsRemove = undefined;

    const plugin = getPlugin('dataProvider');
    const out = await plugin.removeRows(1);

    expect(out).toBeUndefined();
    expect(countRows()).toBe(1);
  });

  it('should throw when an id is null or undefined', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');
    let caught;

    try {
      await plugin.removeRows(null);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeDefined();
    expect(caught.message).toContain('removeRows');
  });
});
