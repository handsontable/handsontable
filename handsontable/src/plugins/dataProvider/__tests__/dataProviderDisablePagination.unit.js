import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Builds a provider that answers every fetch with the requested page of a 50-row server table.
 *
 * @returns {object}
 */
function createProvider() {
  return {
    rowId: 'id',
    fetchRows: jest.fn(async({ page, pageSize }) => {
      const start = (page - 1) * pageSize;
      const rows = Array.from({ length: pageSize }, (_, index) => ({ id: start + index + 1 }));

      return { rows, totalRows: 50 };
    }),
    onRowsCreate: jest.fn(async() => []),
    onRowsUpdate: jest.fn(async() => {}),
    onRowsRemove: jest.fn(async() => {}),
  };
}

describe('DataProvider removed through updateSettings()', () => {
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
   * Builds a server-backed grid with 10 rows per page and waits for the first response.
   *
   * @param {object} [settings] Extra settings.
   * @returns {Promise<void>}
   */
  async function createServerGrid(settings = {}) {
    hot = new Handsontable(container, {
      dataProvider: createProvider(),
      pagination: { pageSize: 10 },
      columns: [{ data: 'id' }],
      licenseKey: LICENSE_KEY,
      ...settings,
    });
    await flush();
  }

  it('counts the pages from the rows the grid holds once the dataProvider is gone', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');

    expect(pagination.getPaginationData().totalPages).toBe(5);

    hot.updateSettings({ dataProvider: undefined });

    expect(hot.getPlugin('dataProvider').enabled).toBe(false);
    expect(hot.countRows()).toBe(10);
    expect(pagination.getPaginationData()).toEqual(expect.objectContaining({
      currentPage: 1,
      totalPages: 1,
      numberOfRenderedRows: 10,
    }));
  });

  it('pages the rows the grid holds with the configured page size once the dataProvider is gone', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');

    pagination.setPageSize(5);
    await flush();

    expect(hot.countRows()).toBe(5);
    expect(pagination.getPaginationData().totalPages).toBe(10);

    hot.updateSettings({ dataProvider: null });

    expect(pagination.getPaginationData()).toEqual(expect.objectContaining({
      currentPage: 1,
      totalPages: 1,
      numberOfRenderedRows: 5,
    }));
  });

  it('goes back to page 1 when the server page was past the last local page', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');

    pagination.setPage(3);
    await flush();

    expect(pagination.getPaginationData().currentPage).toBe(3);

    hot.updateSettings({ dataProvider: null });

    expect(pagination.getPaginationData()).toEqual(expect.objectContaining({
      currentPage: 1,
      totalPages: 1,
    }));
  });

  it('counts the pages from the rows the grid holds after a direct disablePlugin() call', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');

    hot.getPlugin('dataProvider').disablePlugin();

    expect(hot.getSettings().dataProvider).toBeDefined();
    expect(pagination.getPaginationData().totalPages).toBe(1);
  });

  it('counts the pages from the rows the grid holds once a conflicting option turns the dataProvider off', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');

    hot.updateSettings({ trimRows: true });

    expect(hot.getPlugin('dataProvider').enabled).toBe(false);
    expect(pagination.getPaginationData().totalPages).toBe(1);
  });

  it('leaves the total to the owner while the dataProvider is passive', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');
    const sync = jest.spyOn(pagination, '_syncDataProviderRemoval');

    hot.getPlugin('dataProvider')._runWithoutFetching(() => {
      hot.updateSettings({ dataProvider: null });
    });

    expect(hot.getPlugin('dataProvider').enabled).toBe(false);
    expect(sync).not.toHaveBeenCalled();
  });

  it('lands on the same page whether the settings go ahead of the new data or with it', async() => {
    const data = () => Array.from({ length: 25 }, (_, index) => ({ id: index + 1 }));

    await createServerGrid();
    hot.getPlugin('pagination').setPage(3);
    await flush();
    hot.updateSettings({ dataProvider: null, data: data() });

    const withData = hot.getPlugin('pagination').getPaginationData();

    hot.destroy();
    await createServerGrid();
    hot.getPlugin('pagination').setPage(3);
    await flush();
    hot._applySettingsAndData({ dataProvider: null }, data());

    expect(hot.getPlugin('pagination').getPaginationData()).toEqual(withData);
    expect(withData).toEqual(expect.objectContaining({ currentPage: 3, totalPages: 3 }));
  });

  it('keeps the server total while a new dataProvider refetches', async() => {
    await createServerGrid();

    const pagination = hot.getPlugin('pagination');
    const provider = {
      ...createProvider(),
      fetchRows: jest.fn(() => new Promise(() => {})),
    };

    hot.updateSettings({ dataProvider: provider });

    expect(provider.fetchRows).toHaveBeenCalledTimes(1);
    expect(pagination.getPaginationData().totalPages).toBe(5);
  });

  it('paints once when the dataProvider is removed together with new data', async() => {
    await createServerGrid();

    const afterRender = jest.fn();

    hot.addHook('afterRender', afterRender);
    hot.updateSettings({
      dataProvider: null,
      data: Array.from({ length: 25 }, (_, index) => ({ id: index + 1 })),
    });

    expect(afterRender).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('pagination').getPaginationData().totalPages).toBe(3);
  });
});
