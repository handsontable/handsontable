describe('DataProvider request errors and Dialog', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  /**
   * DataProvider opens error UI via `dialogPlugin.show` with a confirm template (not `showAlert`).
   *
   * @param {object} dialogPlugin Dialog plugin instance.
   * @param {string} title Expected template title.
   * @param {string} description Expected template description.
   * @returns {void}
   */
  function expectDialogShowError(dialogPlugin, title, description) {
    expect(dialogPlugin.show).toHaveBeenCalledWith(jasmine.objectContaining({
      closable: true,
      template: jasmine.objectContaining({
        type: 'confirm',
        title,
        description,
      }),
    }));
  }

  it('should call dialog show when fetchRows fails and dialog is enabled', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dialog: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    const err = new Error('network down');
    const hot = spec().$container.handsontable('getInstance');

    hot.getSettings().dataProvider.fetchRows = () => Promise.reject(err);

    const plugin = getPlugin('dataProvider');
    let caught;

    try {
      await plugin.fetchData();
    } catch (e) {
      caught = e;
    }

    expect(caught).toBe(err);
    expectDialogShowError(dialogPlugin, 'Could not load data', 'network down');
  });

  it('should not call dialog show when fetchRows fails and dialog is disabled', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    const err = new Error('network down');
    const hot = spec().$container.handsontable('getInstance');

    hot.getSettings().dataProvider.fetchRows = () => Promise.reject(err);

    const plugin = getPlugin('dataProvider');

    try {
      await plugin.fetchData();
    } catch (e) {
      expect(e).toBe(err);
    }

    expect(dialogPlugin.show).not.toHaveBeenCalled();
  });

  it('should call dialog show when onRowsCreate rejects', async() => {
    const err = new Error('create rejected');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dialog: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsCreate: () => Promise.reject(err),
      }),
    });

    await sleep(50);

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expectDialogShowError(dialogPlugin, 'Could not create rows', 'create rejected');
  });

  it('should call dialog show with fetch title when create succeeds but refetch fails', async() => {
    const refetchErr = new Error('reload failed');
    let fetchCount = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dialog: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => {
          fetchCount += 1;

          if (fetchCount === 1) {
            return Promise.resolve({
              rows: [{ id: 1, name: 'A' }],
              totalRows: 1,
            });
          }

          return Promise.reject(refetchErr);
        },
        onRowsCreate: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expectDialogShowError(dialogPlugin, 'Could not load data', 'reload failed');
  });

  it('should call dialog show when onRowsUpdate rejects', async() => {
    const err = new Error('update rejected');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dialog: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate: () => Promise.reject(err),
      }),
    });

    await sleep(50);

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([{ id: 1, changes: { name: 'Bob' } }]);

    expectDialogShowError(dialogPlugin, 'Could not update rows', 'update rejected');
  });

  it('should call dialog show when onRowsRemove rejects', async() => {
    const err = new Error('remove rejected');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dialog: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsRemove: () => Promise.reject(err),
      }),
    });

    await sleep(50);

    const dialogPlugin = getPlugin('dialog');

    spyOn(dialogPlugin, 'show').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expectDialogShowError(dialogPlugin, 'Could not remove rows', 'remove rejected');
  });
});
