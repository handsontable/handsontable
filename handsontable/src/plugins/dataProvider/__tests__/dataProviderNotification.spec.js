describe('DataProvider request errors and Notification', () => {
  const { DATA_PROVIDER_BUTTONS_REFETCH } = Handsontable.languages.dictionaryKeys;

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
   * @param {object} notificationPlugin Notification plugin instance.
   * @param {string} title Expected toast title.
   * @param {string} message Expected toast message.
   * @returns {void}
   */
  function expectNotificationShowError(notificationPlugin, title, message) {
    expect(notificationPlugin.showMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      variant: 'error',
      title,
      message,
    }));
  }

  it('should call notification showMessage when fetchRows fails and notification is enabled', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      notification: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

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
    expectNotificationShowError(notificationPlugin, 'Could not load data', 'network down');

    const fetchErrorCall = notificationPlugin.showMessage.calls.mostRecent().args[0];

    expect(fetchErrorCall.duration).toBe(0);
    expect(fetchErrorCall.actions?.length).toBe(1);
    expect(fetchErrorCall.actions[0].label).toBe(hot.getTranslatedPhrase(DATA_PROVIDER_BUTTONS_REFETCH));
    expect(fetchErrorCall.actions[0].type).toBe('primary');
  });

  it('should not call notification showMessage when fetchRows fails and notification is disabled', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    const err = new Error('network down');
    const hot = spec().$container.handsontable('getInstance');

    hot.getSettings().dataProvider.fetchRows = () => Promise.reject(err);

    const plugin = getPlugin('dataProvider');

    try {
      await plugin.fetchData();
    } catch (e) {
      expect(e).toBe(err);
    }

    expect(notificationPlugin.showMessage).not.toHaveBeenCalled();
  });

  it('should call notification showMessage when onRowsCreate rejects', async() => {
    const err = new Error('create rejected');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      notification: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsCreate: () => Promise.reject(err),
      }),
    });

    await sleep(50);

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expectNotificationShowError(notificationPlugin, 'Could not create rows', 'create rejected');

    const createErrorCall = notificationPlugin.showMessage.calls.mostRecent().args[0];

    expect(createErrorCall.actions).toBeUndefined();
  });

  it('should call notification showMessage with fetch title when create succeeds but refetch fails', async() => {
    const refetchErr = new Error('reload failed');
    let fetchCount = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      notification: true,
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

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expectNotificationShowError(notificationPlugin, 'Could not load data', 'reload failed');

    const refetchFailCall = notificationPlugin.showMessage.calls.mostRecent().args[0];

    expect(refetchFailCall.duration).toBe(0);
    expect(refetchFailCall.actions?.length).toBe(1);
    expect(notificationPlugin.showMessage.calls.count()).toBe(1);
  });

  it('should show only one notification when onRowsUpdate succeeds but refetch fails', async() => {
    const refetchErr = new Error('reload after patch failed');
    let fetchCount = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      notification: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => {
          fetchCount += 1;

          if (fetchCount === 1) {
            return Promise.resolve({
              rows: [{ id: 1, name: 'Alice' }],
              totalRows: 1,
            });
          }

          return Promise.reject(refetchErr);
        },
        onRowsUpdate: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([{ id: 1, changes: { name: 'Bob' } }]);

    expectNotificationShowError(notificationPlugin, 'Could not load data', 'reload after patch failed');
    expect(notificationPlugin.showMessage.calls.count()).toBe(1);
  });

  it('should run fetchData again when refetch action is triggered after fetch failure', async() => {
    let fetchRowsCalls = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      notification: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const hot = spec().$container.handsontable('getInstance');
    const plugin = getPlugin('dataProvider');

    hot.getSettings().dataProvider.fetchRows = () => {
      fetchRowsCalls += 1;

      if (fetchRowsCalls === 1) {
        return Promise.reject(new Error('temporary'));
      }

      return Promise.resolve({ rows: [], totalRows: 0 });
    };

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    try {
      await plugin.fetchData();
    } catch (e) {
      expect(e.message).toBe('temporary');
    }

    expect(fetchRowsCalls).toBe(1);

    const opts = notificationPlugin.showMessage.calls.mostRecent().args[0];

    hot.getSettings().dataProvider.fetchRows = () => {
      fetchRowsCalls += 1;

      return Promise.resolve({ rows: [], totalRows: 0 });
    };

    opts.actions[0].callback();
    await sleep(50);

    expect(fetchRowsCalls).toBe(2);
  });

  it('should call notification showMessage when onRowsUpdate rejects', async() => {
    const err = new Error('update rejected');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      notification: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate: () => Promise.reject(err),
      }),
    });

    await sleep(50);

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([{ id: 1, changes: { name: 'Bob' } }]);

    expectNotificationShowError(notificationPlugin, 'Could not update rows', 'update rejected');
  });

  it('should call notification showMessage when onRowsRemove rejects', async() => {
    const err = new Error('remove rejected');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      notification: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsRemove: () => Promise.reject(err),
      }),
    });

    await sleep(50);

    const notificationPlugin = getPlugin('notification');

    spyOn(notificationPlugin, 'showMessage').and.callThrough();

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expectNotificationShowError(notificationPlugin, 'Could not remove rows', 'remove rejected');
  });
});
