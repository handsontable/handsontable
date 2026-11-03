import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Builds a provider whose `fetchRows` never answers, so the first fetch stays in flight until it is aborted.
 *
 * @returns {object}
 */
function createHangingProvider() {
  return {
    rowId: 'id',
    fetchRows: jest.fn((query, { signal }) => new Promise((resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })),
    onRowsCreate: jest.fn(async() => []),
    onRowsUpdate: jest.fn(async() => {}),
    onRowsRemove: jest.fn(async() => {}),
  };
}

describe('DataProvider turned off while its first fetch runs', () => {
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

  it('takes the loading overlay down once the plugin is off and local rows arrive', async() => {
    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: createHangingProvider(),
      columns: [{ data: 'id' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();

    const emptyDataState = hot.getPlugin('emptyDataState');

    expect(hot.getPlugin('dataProvider').isFetching()).toBe(true);
    expect(emptyDataState.isVisible()).toBe(true);

    hot.updateSettings({ dataProvider: null });
    hot.loadData([{ id: 5 }, { id: 6 }]);
    await flush();

    expect(hot.getPlugin('dataProvider').enabled).toBe(false);
    expect(hot.countRows()).toBe(2);
    expect(emptyDataState.isVisible()).toBe(false);
  });

  it('takes the loading overlay down once the plugin is off, even when the fetch never settles', async() => {
    const provider = {
      ...createHangingProvider(),
      fetchRows: jest.fn(() => new Promise(() => {})),
    };

    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: provider,
      columns: [{ data: 'id' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();

    const emptyDataState = hot.getPlugin('emptyDataState');

    expect(hot.getPlugin('dataProvider').isFetching()).toBe(true);
    expect(emptyDataState.isVisible()).toBe(true);

    hot.updateSettings({ dataProvider: null });
    hot.loadData([{ id: 5 }, { id: 6 }]);
    await flush();

    expect(hot.getPlugin('dataProvider').enabled).toBe(false);
    expect(hot.countRows()).toBe(2);
    expect(emptyDataState.isVisible()).toBe(false);
  });

  it('keeps the loading overlay up while an update of the provider refetches', async() => {
    const provider = createHangingProvider();

    hot = new Handsontable(container, {
      emptyDataState: true,
      dataProvider: provider,
      columns: [{ data: 'id' }],
      licenseKey: LICENSE_KEY,
    });
    await flush();

    hot.updateSettings({ dataProvider: { ...provider } });
    await flush();

    expect(hot.getPlugin('dataProvider').isFetching()).toBe(true);
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
  });
});
