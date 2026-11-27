import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DataProvider } from '../dataProvider';
import { Pagination } from '../../pagination/pagination';
import { AutoRowSize } from '../../autoRowSize/autoRowSize';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const ALL_ROWS = Array.from({ length: 50 }, (value, index) => ({ id: index + 1, name: `Row ${index + 1}` }));
const MAX_FETCHES = 20;

/**
 * Lets the queued microtask chains (fetch landing, revert, any refetch it starts) run to their end.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  for (let i = 0; i < 200; i++) {
    await Promise.resolve();
  }
}

describe('DataProvider -> a page-size change whose fetch fails', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DataProvider);
    registerPlugin(Pagination);
    registerPlugin(AutoRowSize);
  });

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
   * @returns {object} A provider that answers from `ALL_ROWS` until `failing` is set, then rejects every call.
   * It stops answering after `MAX_FETCHES` calls, so a refetch loop ends as a count, not a hung test.
   */
  function createProvider() {
    const provider = {
      failing: false,
      calls: [],
    };

    provider.config = {
      rowId: 'id',
      fetchRows: ({ page, pageSize }) => {
        provider.calls.push({ page, pageSize });

        if (provider.calls.length > MAX_FETCHES) {
          return new Promise(() => {});
        }

        if (provider.failing) {
          return Promise.reject(new Error('Network error'));
        }

        return Promise.resolve({
          rows: ALL_ROWS.slice((page - 1) * pageSize, page * pageSize).map(row => ({ ...row })),
          totalRows: ALL_ROWS.length,
        });
      },
      onRowsCreate: () => Promise.resolve(),
      onRowsUpdate: () => Promise.resolve(),
      onRowsRemove: () => Promise.resolve(),
    };

    return provider;
  }

  /**
   * Builds the grid, waits for the first page, and moves to `page` with the server working.
   *
   * @param {object} provider The provider from `createProvider()`.
   * @param {number} page The page to start from.
   * @param {object} [settings] Extra grid settings.
   * @returns {Promise<void>}
   */
  async function createGridOnPage(provider, page, settings = {}) {
    hot = new Handsontable(container, {
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: provider.config,
      pagination: { pageSize: 10 },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    await settle();
    hot.getPlugin('pagination').setPage(page);
    await settle();
  }

  it('should fetch once and put the pager back on the shown page when the new size moves it past the last page',
    async() => {
      const provider = createProvider();

      await createGridOnPage(provider, 4);

      const pagination = hot.getPlugin('pagination');
      const afterPageChange = jest.fn();

      hot.addHook('afterPageChange', afterPageChange);
      provider.calls.length = 0;
      provider.failing = true;

      pagination.setPageSize(20);
      await settle();

      expect(provider.calls).toEqual([{ page: 1, pageSize: 20 }]);
      expect(pagination.getCurrentPageSize()).toBe(10);
      expect(pagination.getCurrentPage()).toBe(4);
      expect(hot.getPlugin('dataProvider').getQueryParameters()).toEqual(
        expect.objectContaining({ page: 4, pageSize: 10 })
      );
      expect(hot.getDataAtCol(0)).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);
      expect(afterPageChange).not.toHaveBeenCalled();
    });

  it('should fetch once and keep the page when the new size keeps it in range', async() => {
    const provider = createProvider();

    await createGridOnPage(provider, 2);

    const pagination = hot.getPlugin('pagination');

    provider.calls.length = 0;
    provider.failing = true;

    pagination.setPageSize(20);
    await settle();

    expect(provider.calls).toEqual([{ page: 1, pageSize: 20 }]);
    expect(pagination.getCurrentPageSize()).toBe(10);
    expect(pagination.getCurrentPage()).toBe(2);
  });

  it('should fetch once when the failed change was to the `auto` page size', async() => {
    const provider = createProvider();

    await createGridOnPage(provider, 2, { autoRowSize: true });

    const pagination = hot.getPlugin('pagination');

    provider.calls.length = 0;
    provider.failing = true;

    pagination.setPageSize('auto');
    await settle();

    expect(provider.calls).toEqual([{ page: 1, pageSize: 10 }]);
    expect(pagination.getCurrentPageSize()).toBe(10);
    expect(pagination.getCurrentPage()).toBe(2);
  });

  it('should fetch once when a failed page change is reverted', async() => {
    const provider = createProvider();

    await createGridOnPage(provider, 2);

    const pagination = hot.getPlugin('pagination');

    provider.calls.length = 0;
    provider.failing = true;

    pagination.setPage(3);
    await settle();

    expect(provider.calls).toEqual([{ page: 3, pageSize: 10 }]);
    expect(pagination.getCurrentPage()).toBe(2);
  });

  it('should put the pager back on the shown page when a failed page change superseded another one', async() => {
    const provider = createProvider();

    await createGridOnPage(provider, 2);

    const pagination = hot.getPlugin('pagination');

    provider.calls.length = 0;
    provider.failing = true;

    pagination.setPage(3);
    pagination.setPage(4);
    await settle();

    expect(provider.calls).toEqual([{ page: 3, pageSize: 10 }, { page: 4, pageSize: 10 }]);
    expect(pagination.getCurrentPage()).toBe(2);
    expect(hot.getDataAtCol(0)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('should put the pager back on the shown page size when a failed size change superseded another one',
    async() => {
      const provider = createProvider();

      await createGridOnPage(provider, 2);

      const pagination = hot.getPlugin('pagination');

      provider.calls.length = 0;
      provider.failing = true;

      pagination.setPageSize(20);
      pagination.setPageSize(50);
      await settle();

      expect(provider.calls).toEqual([{ page: 1, pageSize: 20 }, { page: 1, pageSize: 50 }]);
      expect(pagination.getCurrentPageSize()).toBe(10);
      expect(pagination.getCurrentPage()).toBe(2);
    });

  it('should fetch another page size a listener sets while the pager is put back', async() => {
    const provider = createProvider();

    await createGridOnPage(provider, 4);

    const pagination = hot.getPlugin('pagination');
    let isListenerArmed = true;

    hot.addHook('afterPageSizeChange', (oldPageSize, newPageSize) => {
      if (isListenerArmed && oldPageSize === 20 && newPageSize === 10) {
        isListenerArmed = false;
        provider.failing = false;
        pagination.setPageSize(5);
      }
    });
    provider.calls.length = 0;
    provider.failing = true;

    pagination.setPageSize(20);
    await settle();

    expect(provider.calls).toEqual([{ page: 1, pageSize: 20 }, { page: 1, pageSize: 5 }]);
    expect(pagination.getCurrentPageSize()).toBe(5);
    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should load the new page size once the server works again', async() => {
    const provider = createProvider();

    await createGridOnPage(provider, 4);

    const pagination = hot.getPlugin('pagination');

    provider.failing = true;
    pagination.setPageSize(20);
    await settle();

    provider.calls.length = 0;
    provider.failing = false;
    pagination.setPageSize(20);
    await settle();

    expect(provider.calls).toEqual([{ page: 1, pageSize: 20 }]);
    expect(pagination.getCurrentPageSize()).toBe(20);
    expect(pagination.getCurrentPage()).toBe(1);
  });
});
