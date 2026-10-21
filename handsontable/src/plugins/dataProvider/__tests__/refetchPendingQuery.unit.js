import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DataProvider } from '../dataProvider';
import { Pagination } from '../../pagination/pagination';

const ALL_ROWS = Array.from({ length: 6 }, (value, index) => ({ id: index + 1, name: `Row ${index + 1}` }));

/**
 * Lets the queued microtask chains (mutation queue, fetch landing) run to their end.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  for (let i = 0; i < 40; i++) {
    await Promise.resolve();
  }
}

describe('DataProvider -> refetch after a save while a page change is loading', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DataProvider);
    registerPlugin(Pagination);
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
   * @returns {object} A provider whose page 2 and above fetches wait until `release()` is called.
   */
  function createProvider() {
    const held = [];
    const config = {
      rowId: 'id',
      fetchRows: jest.fn(({ page, pageSize }, { signal }) => new Promise((resolve, reject) => {
        const respond = () => resolve({
          rows: ALL_ROWS.slice((page - 1) * pageSize, page * pageSize).map(row => ({ ...row })),
          totalRows: ALL_ROWS.length,
        });

        if (page === 1) {
          respond();

          return;
        }

        held.push(respond);
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })),
      onRowsCreate: jest.fn(() => Promise.resolve()),
      onRowsUpdate: jest.fn(() => Promise.resolve()),
      onRowsRemove: jest.fn(() => Promise.resolve()),
    };

    return {
      config,
      pagesRequested: () => config.fetchRows.mock.calls.map(([query]) => query.page),
      async release() {
        held.splice(0).forEach(respond => respond());
        await settle();
      },
    };
  }

  /**
   * @param {object} provider The provider from `createProvider()`.
   * @param {object} [dataProviderOverrides] Extra `dataProvider` keys.
   * @returns {Promise<void>}
   */
  async function createGrid(provider, dataProviderOverrides = {}) {
    hot = new Handsontable(container, {
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: { ...provider.config, ...dataProviderOverrides },
      pagination: { pageSize: 2 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    await settle();
  }

  it('should keep the page the user asked for when an edit is saved before the page loads', async() => {
    const provider = createProvider();

    await createGrid(provider);

    hot.getPlugin('pagination').setPage(2);
    hot.setDataAtCell(0, 1, 'user edit', 'edit');
    await settle();
    await provider.release();

    expect(provider.config.onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(provider.pagesRequested()).toEqual([1, 2, 2]);
    expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
    expect(hot.getDataAtCol(0)).toEqual([3, 4]);
  });

  it('should refetch the current page when no page change is pending', async() => {
    const provider = createProvider();

    await createGrid(provider);

    hot.setDataAtCell(0, 1, 'user edit', 'edit');
    await settle();

    expect(provider.config.onRowsUpdate).toHaveBeenCalledTimes(1);
    expect(provider.pagesRequested()).toEqual([1, 1]);
    expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(1);
  });

  it('should keep the pending page when rows are removed before the page loads', async() => {
    const provider = createProvider();

    await createGrid(provider);

    hot.getPlugin('pagination').setPage(2);
    const removal = hot.getPlugin('dataProvider').removeRows(1);

    await settle();
    await provider.release();
    await removal;

    expect(provider.config.onRowsRemove).toHaveBeenCalledTimes(1);
    expect(provider.pagesRequested()).toEqual([1, 2, 2]);
    expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
  });

  it('should keep the pending page when rows are created without a refetch before the page loads', async() => {
    const provider = createProvider();

    await createGrid(provider, { refetchAfterCreate: false });

    hot.getPlugin('pagination').setPage(2);
    const creation = hot.getPlugin('dataProvider').createRows();

    await settle();
    await provider.release();
    await creation;

    expect(provider.config.onRowsCreate).toHaveBeenCalledTimes(1);
    expect(provider.pagesRequested()).toEqual([1, 2, 2]);
    expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
  });

  it('should refetch the shown page when the pending page fetch has already failed', async() => {
    const provider = createProvider();

    await createGrid(provider);

    provider.config.fetchRows.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    hot.getPlugin('pagination').setPage(2);
    await settle();
    hot.setDataAtCell(0, 1, 'user edit', 'edit');
    await settle();

    expect(provider.pagesRequested()).toEqual([1, 2, 1]);
    expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(1);
  });
});
