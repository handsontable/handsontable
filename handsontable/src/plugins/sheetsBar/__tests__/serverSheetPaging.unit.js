import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const TOTAL = 25;
const SERVER_ROWS = Array.from({ length: TOTAL }, (_, i) => ({ id: i + 1, name: `R${i + 1}` }));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Lets every promise chain started by a fetch settle.
 */
async function settle() {
  for (let i = 0; i < 10; i++) {
    await flush();
  }
}

/**
 * Creates a provider whose fetches resolve or reject on demand.
 *
 * @returns {object}
 */
function createProvider() {
  const pending = [];
  const calls = [];

  return {
    calls,
    pending,
    config: {
      rowId: 'id',
      fetchRows: jest.fn((params) => {
        calls.push(params);

        return new Promise((resolve, reject) => {
          pending.push({ params, resolve, reject });
        });
      }),
      onRowsCreate: async() => [],
      onRowsUpdate: async() => {},
      onRowsRemove: async() => {},
    },
    async resolveNext() {
      const { params, resolve } = pending.shift();
      let rows = SERVER_ROWS.slice();

      if (params.sort?.order === 'desc') {
        rows = rows.reverse();
      }

      const start = (params.page - 1) * params.pageSize;

      resolve({ rows: rows.slice(start, start + params.pageSize), totalRows: TOTAL });
      await settle();
    },
    async rejectNext() {
      const { reject } = pending.shift();

      reject(new Error('offline'));
      await settle();
    },
  };
}

/**
 * Reads what the grid shows of a paged, sorted server sheet.
 *
 * @param {Handsontable} hot The grid.
 * @returns {object}
 */
function readPagedView(hot) {
  const { currentPage, totalPages, pageSize } = hot.getPlugin('pagination').getPaginationData();

  return {
    firstCell: hot.getDataAtCell(0, 0),
    firstRowHeader: hot.getRowHeader(0),
    currentPage,
    totalPages,
    pageSize,
    sort: hot.getPlugin('columnSorting').getSortConfig(),
  };
}

describe('SheetsBar server sheet paging', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  describe('returning to a sheet whose page fetch is still running', () => {
    /**
     * Builds a sorted server sheet on page 3 of 5, starts a fetch for page 4, and switches away
     * and back while that fetch runs.
     *
     * @param {object} [settings] Additional grid settings.
     * @returns {Promise<object>}
     */
    async function returnDuringPageFetch(settings = {}) {
      const orders = createProvider();

      hot = new Handsontable(container, {
        rowHeaders: true,
        colHeaders: true,
        columnSorting: true,
        pagination: { pageSize: 5 },
        ...settings,
        sheetsBar: {
          sheets: [
            {
              name: 'Orders',
              data: [],
              settings: { dataProvider: orders.config, columns: [{ data: 'id' }, { data: 'name' }] },
            },
            { name: 'Notes', data: [['a'], ['b']] },
          ],
        },
        licenseKey: LICENSE_KEY,
      });
      await settle();
      await orders.resolveNext();

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      await settle();
      await orders.resolveNext();
      hot.getPlugin('pagination').setPage(3);
      await settle();
      await orders.resolveNext();

      hot.getPlugin('pagination').setPage(4);
      await settle();

      hot.getPlugin('sheetsBar').setActiveSheet('Notes');
      hot.getPlugin('sheetsBar').setActiveSheet('Orders');
      await settle();

      return orders;
    }

    it('shows the last response\'s page, total, sort, and row numbers while the fetch runs, under the loading overlay', async() => {
      const orders = await returnDuringPageFetch({ emptyDataState: true });

      expect(orders.pending).toHaveLength(1);
      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
      expect(readPagedView(hot)).toEqual({
        firstCell: 15,
        firstRowHeader: 11,
        currentPage: 3,
        totalPages: 5,
        pageSize: 5,
        sort: [{ column: 0, sortOrder: 'desc' }],
      });
    });

    it('loads the requested page when the fetch succeeds', async() => {
      const orders = await returnDuringPageFetch();

      await orders.resolveNext();

      expect(readPagedView(hot)).toEqual({
        firstCell: 10,
        firstRowHeader: 16,
        currentPage: 4,
        totalPages: 5,
        pageSize: 5,
        sort: [{ column: 0, sortOrder: 'desc' }],
      });
      expect(orders.calls).toHaveLength(4);
    });

    it('keeps the last good page, sort, and row numbers when the fetch fails, and offers a Refetch of the failed page', async() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const orders = await returnDuringPageFetch({ notification: true });
      const showMessage = jest.spyOn(hot.getPlugin('notification'), 'showMessage');

      await orders.rejectNext();

      expect(readPagedView(hot)).toEqual({
        firstCell: 15,
        firstRowHeader: 11,
        currentPage: 3,
        totalPages: 5,
        pageSize: 5,
        sort: [{ column: 0, sortOrder: 'desc' }],
      });

      const options = showMessage.mock.calls.at(-1)[0];

      expect(options.variant).toBe('error');
      expect(options.actions).toHaveLength(1);

      options.actions[0].callback();
      await settle();

      expect(orders.calls.at(-1)).toEqual(expect.objectContaining({ page: 4, pageSize: 5 }));
      expect(orders.calls.at(-1).sort).toEqual(orders.calls[1].sort);
    });
  });

});
