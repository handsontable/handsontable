import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Builds a provider whose `fetchRows` calls wait until the test answers them.
 *
 * @returns {object}
 */
function createControlledProvider() {
  const calls = [];
  const config = {
    rowId: 'id',
    fetchRows: jest.fn((query, { signal }) => new Promise((resolve, reject) => {
      const call = { query, signal, resolve, reject };

      calls.push(call);
      signal?.addEventListener('abort', () => {
        const error = new Error('Aborted');

        error.name = 'AbortError';
        reject(error);
      });
    })),
    onRowsCreate: jest.fn(async() => []),
    onRowsUpdate: jest.fn(async() => {}),
    onRowsRemove: jest.fn(async() => {}),
  };

  return { config, calls };
}

/**
 * Builds a list of rows for the provider to answer with.
 *
 * @param {number} count The number of rows.
 * @returns {Array}
 */
function rows(count) {
  return Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Row ${index + 1}` }));
}

/**
 * Reads what EmptyDataState shows: whether its overlay is up and whether that overlay is the loading one.
 *
 * @param {HTMLElement} container The grid container.
 * @param {Core} hot The grid.
 * @returns {{ visible: boolean, loading: boolean }}
 */
function overlayState(container, hot) {
  const element = container.querySelector('.ht-empty-data-state');
  const visible = hot.getPlugin('emptyDataState').isVisible();

  return {
    visible,
    loading: visible && !!element?.classList.contains('ht-empty-data-state--loading'),
  };
}

describe('DataProvider loading overlay when a fetch ends without data', () => {
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

  /**
   * Builds a server-backed grid with the empty data state on.
   *
   * @param {object} config The `dataProvider` configuration.
   * @param {object} [extra] More grid settings.
   * @returns {Core}
   */
  function build(config, extra = {}) {
    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
      ...extra,
    });

    return hot;
  }

  it('takes the loading overlay down when a listener cancels the first fetch', async() => {
    const { config } = createControlledProvider();

    build(config, { beforeDataProviderFetch: () => false });
    await flush();

    expect(config.fetchRows).not.toHaveBeenCalled();
    expect(overlayState(container, hot).loading).toBe(false);
  });

  it('takes the loading overlay down when a listener cancels a later fetch', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.addHook('beforeDataProviderFetch', query => (query.page === 2 ? false : undefined));
    await hot.getPlugin('dataProvider').fetchData({ page: 2 });

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('takes the loading overlay down when the shown fetch rejects with an AbortError', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();

    expect(overlayState(container, hot).loading).toBe(true);

    const error = new Error('Aborted');

    error.name = 'AbortError';
    calls[0].reject(error);
    await flush();

    expect(overlayState(container, hot).loading).toBe(false);
  });

  it('takes the loading overlay off the rows when a later fetch rejects with an AbortError', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    const error = new Error('Aborted');

    error.name = 'AbortError';
    calls[1].reject(error);
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('takes the loading overlay down when the signal was aborted before the fetch answered', async() => {
    const { config, calls } = createControlledProvider();

    config.fetchRows.mockImplementationOnce((query, { signal }) => new Promise((resolve) => {
      calls.push({ query, signal, resolve, reject: () => {} });
    }));
    build(config);
    await flush();

    expect(overlayState(container, hot).loading).toBe(true);

    Object.defineProperty(calls[0].signal, 'aborted', { configurable: true, get: () => true });
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(overlayState(container, hot).loading).toBe(false);
  });

  it('keeps the loading overlay while a newer fetch replaces the one that ended', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();
    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();

    expect(calls).toHaveLength(3);
    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[2].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });
});

describe('DataProvider loading overlay when a silent fetch replaces a loading one', () => {
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

  /**
   * Builds a server-backed grid with the empty data state and sorting on.
   *
   * @param {object} config The `dataProvider` configuration.
   */
  function build(config) {
    hot = new Handsontable(container, {
      emptyDataState: true,
      columnSorting: true,
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
  }

  it('keeps the loading overlay over an empty grid while a sort refetch replaces the first fetch', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    await flush();

    expect(calls).toHaveLength(2);
    expect(calls[0].signal.aborted).toBe(true);
    expect(hot.getPlugin('dataProvider').isFetching()).toBe(true);
    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[1].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('keeps the loading overlay over the rows while a sort refetch replaces a reload', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    await flush();

    expect(calls).toHaveLength(3);
    expect(calls[1].signal.aborted).toBe(true);
    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[2].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('keeps the loading overlay while the refetch of a create replaces a page fetch', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();
    hot.getPlugin('dataProvider').createRows();
    await flush();
    await flush();

    expect(config.onRowsCreate).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(3);
    expect(calls[1].signal.aborted).toBe(true);
    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[2].resolve({ rows: rows(4), totalRows: 4 });
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('does not raise the loading overlay for a silent fetch that replaces another silent one', async() => {
    const { config, calls } = createControlledProvider();

    build(config);
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ skipLoading: true }).catch(() => {});
    await flush();
    hot.getPlugin('dataProvider').fetchData({ skipLoading: true }).catch(() => {});
    await flush();

    expect(calls).toHaveLength(3);
    expect(hot.getPlugin('dataProvider').isFetching()).toBe(false);
    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });
});

describe('DataProvider page-clamp refetch canceled by a listener', () => {
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

  it('takes the loading overlay down', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      pagination: { pageSize: 2 },
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();
    calls[0].resolve({ rows: rows(2), totalRows: 6 });
    await flush();

    hot.addHook('beforeDataProviderFetch', query => (query.page === 1 ? false : undefined));
    hot.getPlugin('dataProvider').fetchData({ page: 3 }).catch(() => {});
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[1].resolve({ rows: [], totalRows: 2 });
    await flush();

    expect(calls).toHaveLength(2);
    expect(hot.getPlugin('dataProvider').isFetching()).toBe(false);
    expect(overlayState(container, hot).loading).toBe(false);
  });
});

describe('EmptyDataState turned on while a fetch runs', () => {
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

  it('shows the loading overlay for the fetch already running', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();

    hot.updateSettings({ emptyDataState: false });
    hot.updateSettings({ emptyDataState: true });

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('shows the loading overlay over the rows a running reload replaces', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();
    hot.updateSettings({ emptyDataState: true });

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });
  });

  it('shows no loading overlay when no fetch runs', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.updateSettings({ emptyDataState: true });

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });
});

describe('DataProvider loading overlay on a server sheet when a fetch ends without data', () => {
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

  it('takes the loading overlay down on the sheet shown when its fetch rejects with an AbortError', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      columns: [{ data: 'id' }, { data: 'name' }],
      sheetsBar: {
        sheets: [
          { name: 'Server', data: [], settings: { dataProvider: config } },
          { name: 'Local', data: rows(2) },
        ],
      },
      licenseKey: LICENSE_KEY,
    });
    await flush();

    expect(overlayState(container, hot).loading).toBe(true);

    const error = new Error('Aborted');

    error.name = 'AbortError';
    calls[0].reject(error);
    await flush();

    expect(overlayState(container, hot).loading).toBe(false);
  });

  it('takes the loading overlay down on the sheet shown when a listener cancels its fetch', async() => {
    const { config } = createControlledProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      columns: [{ data: 'id' }, { data: 'name' }],
      beforeDataProviderFetch: () => false,
      sheetsBar: {
        sheets: [
          { name: 'Server', data: [], settings: { dataProvider: config } },
          { name: 'Local', data: rows(2) },
        ],
      },
      licenseKey: LICENSE_KEY,
    });
    await flush();

    expect(config.fetchRows).not.toHaveBeenCalled();
    expect(overlayState(container, hot).loading).toBe(false);
  });
});

describe('DataProvider fetch canceled by a listener', () => {
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

  it('keeps the fetch already running, and loads its answer', async() => {
    const { config, calls } = createControlledProvider();
    const aborted = jest.fn();

    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      beforeDataProviderFetch: query => (query.page === 2 ? false : undefined),
      afterDataProviderFetchAbort: aborted,
      licenseKey: LICENSE_KEY,
    });
    await flush();

    await hot.getPlugin('dataProvider').fetchData({ page: 2 });

    expect(calls).toHaveLength(1);
    expect(calls[0].signal.aborted).toBe(false);
    expect(aborted).not.toHaveBeenCalled();
    expect(hot.getPlugin('dataProvider').isFetching()).toBe(true);
    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(hot.countRows()).toBe(3);
    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('still aborts the running fetch once the newer one starts', async() => {
    const { config, calls } = createControlledProvider();
    const aborted = jest.fn();

    hot = new Handsontable(container, {
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      afterDataProviderFetchAbort: aborted,
      licenseKey: LICENSE_KEY,
    });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();

    expect(calls).toHaveLength(2);
    expect(calls[0].signal.aborted).toBe(true);
    expect(aborted).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyDataState options updated while a fetch runs', () => {
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

  it('keeps the loading overlay over an empty grid', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();

    hot.updateSettings({ emptyDataState: { message: 'Custom' } });

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });

    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    expect(overlayState(container, hot)).toEqual({ visible: false, loading: false });
  });

  it('keeps the loading overlay over the rows a refetch replaces', async() => {
    const { config, calls } = createControlledProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: config,
      columns: [{ data: 'id' }, { data: 'name' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();
    calls[0].resolve({ rows: rows(3), totalRows: 3 });
    await flush();

    hot.getPlugin('dataProvider').fetchData({ page: 1 }).catch(() => {});
    await flush();
    hot.updateSettings({ emptyDataState: { message: 'Custom' } });

    expect(overlayState(container, hot)).toEqual({ visible: true, loading: true });
  });
});
