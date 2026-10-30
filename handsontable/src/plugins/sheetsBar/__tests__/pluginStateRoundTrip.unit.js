import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('SheetsBar plugin state across sheet switches', () => {
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

  const rows = () => [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];

  /**
   * Creates a grid with a sheets bar.
   *
   * @param {object} settings Grid settings.
   * @param {Array} sheets The sheets.
   * @returns {object} The SheetsBar plugin.
   */
  function build(settings, sheets) {
    hot = new Handsontable(container, {
      ...settings,
      sheetsBar: { sheets },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Returns the id of the sheet with the name.
   *
   * @param {object} bar The SheetsBar plugin.
   * @param {string} name The sheet name.
   * @returns {number}
   */
  function idOf(bar, name) {
    return bar.getSheets().find(sheet => sheet.name === name).id;
  }

  describe('CollapsibleColumns', () => {
    const collapsibleSettings = {
      nestedHeaders: [[{ label: 'G', colspan: 2 }, 'c'], ['a', 'b', 'c']],
      collapsibleColumns: true,
    };

    it('keeps a collapsed column group across a round trip', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(false);
      expect(hot.getPlugin('nestedHeaders').getStateManager().exportCollapsedGroups()).toEqual([]);

      bar.setActiveSheet('A');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(true);
      expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]);
      expect(hot.getPlugin('nestedHeaders').getStateManager().exportCollapsedGroups())
        .toEqual([{ headerLevel: 0, authoredColumnIndex: 0 }]);
    });

    it('runs no collapse hooks on a switch', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const hooks = jest.fn();

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      ['beforeColumnCollapse', 'afterColumnCollapse', 'beforeColumnExpand', 'afterColumnExpand']
        .forEach(hook => hot.addHook(hook, () => hooks(hook)));
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');

      expect(hooks.mock.calls).toEqual([]);
    });

    it('keeps the group expanded once the user expanded it', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const collapsible = hot.getPlugin('collapsibleColumns');

      collapsible.collapseSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');
      collapsible.expandSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(false);
      expect(collapsible.getCollapsedColumns()).toEqual([]);
    });

    it('expands the groups of a hidden sheet updateSheetSettings() gave new `nestedHeaders`', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');
      bar.updateSheetSettings(idOf(bar, 'A'), {
        nestedHeaders: [[{ label: 'H', colspan: 2 }, 'z'], ['x', 'y', 'z']],
      });
      bar.setActiveSheet('A');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(false);
      expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);
      expect(hot.getPlugin('nestedHeaders').getStateManager().exportCollapsedGroups()).toEqual([]);
    });

    it('expands the groups of a hidden sheet updateSheetSettings() gave new `collapsibleColumns`', () => {
      const bar = build(collapsibleSettings, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      bar.setActiveSheet('B');
      bar.updateSheetSettings(idOf(bar, 'A'), {
        collapsibleColumns: [{ row: -2, col: 0, collapsible: true }],
      });
      bar.setActiveSheet('A');

      expect(hot.columnIndexMapper.isHidden(1)).toBe(false);
      expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);
      expect(hot.getPlugin('nestedHeaders').getStateManager().exportCollapsedGroups()).toEqual([]);
    });
  });

  describe('RowSelection', () => {
    it('keeps the checked rows across a round trip', () => {
      const bar = build({ rowSelection: true, rowHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('rowSelection').selectRows([1, 3]);
      bar.setActiveSheet('B');

      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([]);

      bar.setActiveSheet('A');

      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([1, 3]);
    });

    it('runs no row selection hooks on a switch', () => {
      const bar = build({ rowSelection: true, rowHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const hooks = jest.fn();

      hot.getPlugin('rowSelection').selectRows([1, 3]);
      hot.addHook('beforeRowSelectionChange', () => hooks('before'));
      hot.addHook('afterRowSelectionChange', () => hooks('after'));
      bar.setActiveSheet('B');
      bar.setActiveSheet('A');

      expect(hooks.mock.calls).toEqual([]);
    });

    it('keeps a bound checkbox column in the data across a round trip', () => {
      const bar = build({
        rowSelection: { checkboxLocation: { column: 0 } },
        columns: [{ type: 'checkbox' }, {}],
      }, [
        { name: 'A', data: [[false, 'a'], [false, 'b'], [false, 'c']] },
        { name: 'B', data: [[false, 'x'], [false, 'y'], [false, 'z']] },
      ]);

      hot.getPlugin('rowSelection').selectRows([2]);
      bar.setActiveSheet('B');

      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([]);

      bar.setActiveSheet('A');

      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([2]);
      expect(hot.getDataAtCol(0)).toEqual([false, false, true]);
    });

    it('keeps one checked row on a hidden sheet switched to the single-row mode', () => {
      const bar = build({ rowSelection: true, rowHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const hooks = jest.fn();

      hot.getPlugin('rowSelection').selectRows([1, 3]);
      bar.setActiveSheet('B');
      bar.updateSheetSettings(idOf(bar, 'A'), { rowSelection: { mode: 'singleRow' } });
      hot.addHook('beforeRowSelectionChange', () => hooks('before'));
      hot.addHook('afterRowSelectionChange', () => hooks('after'));
      bar.setActiveSheet('A');

      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([3]);
      expect(hooks.mock.calls).toEqual([]);
    });
  });

  describe('RowSelection with server-backed sheets', () => {
    /**
     * Creates a DataProvider configuration with five rows.
     *
     * @param {string} prefix The status prefix.
     * @param {jest.Mock} onRowsRemove The remove spy.
     * @returns {object}
     */
    function provider(prefix, onRowsRemove) {
      const serverRows = Array.from({ length: 5 }, (_, index) => ({ id: index + 1, status: `${prefix}${index}` }));

      return {
        rowId: 'id',
        fetchRows: async() => ({ rows: serverRows.map(row => ({ ...row })), totalRows: serverRows.length }),
        onRowsCreate: async() => {},
        onRowsUpdate: async() => {},
        onRowsRemove,
      };
    }

    /**
     * Creates a workbook of two server-backed sheets and waits for the first fetch.
     *
     * @returns {Promise<object>}
     */
    async function buildServerWorkbook() {
      let resolveFetch = null;
      const nextFetch = () => new Promise((resolve) => {
        resolveFetch = resolve;
      });
      const first = nextFetch();
      const ordersRemove = jest.fn(async() => {});
      const customersRemove = jest.fn(async() => {});

      const bar = build({
        columns: [{ data: 'id' }, { data: 'status' }],
        rowHeaders: true,
        rowSelection: true,
        afterDataProviderFetch() {
          const resolve = resolveFetch;

          resolveFetch = null;
          resolve?.();
        },
      }, [
        { name: 'Orders', data: [], settings: { dataProvider: provider('o', ordersRemove) } },
        { name: 'Customers', data: [], settings: { dataProvider: provider('c', customersRemove) } },
      ]);

      await first;

      return { bar, nextFetch, ordersRemove, customersRemove };
    }

    it('keeps each sheet\'s selection by row id to that sheet', async() => {
      const { bar, nextFetch } = await buildServerWorkbook();
      const plugin = hot.getPlugin('rowSelection');

      plugin.selectRows([0, 1]);

      const fetched = nextFetch();

      bar.setActiveSheet('Customers');
      await fetched;

      expect(plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [] });
      expect(plugin.getSelectedRows()).toEqual([]);

      plugin.selectRows([4]);
      bar.setActiveSheet('Orders');

      expect(plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [1, 2] });
      expect(plugin.getSelectedRows()).toEqual([0, 1]);

      bar.setActiveSheet('Customers');

      expect(plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [5] });
      expect(plugin.getSelectedRows()).toEqual([4]);
    });

    it('keeps a "select all" with its row count to its sheet', async() => {
      const { bar, nextFetch } = await buildServerWorkbook();
      const plugin = hot.getPlugin('rowSelection');

      plugin.selectAll();
      plugin.deselectRows([2]);

      const fetched = nextFetch();

      bar.setActiveSheet('Customers');
      await fetched;

      expect(plugin.getSelectedCount()).toBe(0);

      bar.setActiveSheet('Orders');

      expect(plugin.getServerSelection()).toEqual({ selectAll: true, toggledRowIds: [3] });
      expect(plugin.getSelectedCount()).toBe(4);
    });

    it('does not remove the rows of one sheet by the ids checked on another', async() => {
      const { bar, nextFetch, customersRemove } = await buildServerWorkbook();
      const plugin = hot.getPlugin('rowSelection');

      plugin.selectRows([0]);

      const fetched = nextFetch();

      bar.setActiveSheet('Customers');
      await fetched;

      plugin.removeSelectedRows();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(customersRemove.mock.calls).toEqual([]);
    });

    it('runs no row selection hooks on a switch', async() => {
      const { bar, nextFetch } = await buildServerWorkbook();
      const plugin = hot.getPlugin('rowSelection');
      const hooks = jest.fn();

      plugin.selectRows([0, 1]);
      hot.addHook('beforeRowSelectionChange', () => hooks('before'));
      hot.addHook('afterRowSelectionChange', () => hooks('after'));

      const fetched = nextFetch();

      bar.setActiveSheet('Customers');
      await fetched;
      bar.setActiveSheet('Orders');

      expect(hooks.mock.calls).toEqual([]);
    });

    it('keeps one row id on a hidden server sheet switched to the single-row mode', async() => {
      const { bar, nextFetch } = await buildServerWorkbook();
      const plugin = hot.getPlugin('rowSelection');
      const hooks = jest.fn();

      plugin.selectRows([0, 1]);

      const fetched = nextFetch();

      bar.setActiveSheet('Customers');
      await fetched;
      bar.updateSheetSettings(idOf(bar, 'Orders'), { rowSelection: { mode: 'singleRow' } });
      hot.addHook('beforeRowSelectionChange', () => hooks('before'));
      hot.addHook('afterRowSelectionChange', () => hooks('after'));
      bar.setActiveSheet('Orders');

      expect(plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [2] });
      expect(plugin.getSelectedRows()).toEqual([1]);
      expect(hooks.mock.calls).toEqual([]);
    });
  });

  describe('duplicateSheet', () => {
    it('gives a copy of the shown sheet its runtime merges and hidden rows', () => {
      const bar = build({ mergeCells: true, hiddenRows: true, colHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('mergeCells').merge(0, 1, 1, 2);
      hot.getPlugin('hiddenRows').hideRows([3]);

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);

      expect(hot.getPlugin('mergeCells').getVisibleMergedAreas())
        .toEqual([{ row: 0, col: 1, rowspan: 2, colspan: 2 }]);
      expect(hot.getPlugin('hiddenRows').getHiddenRows()).toEqual([3]);
    });

    it('gives a copy of the shown sheet its runtime sort', () => {
      const bar = build({ columnSorting: true, colHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);
      expect(hot.getDataAtCol(0)).toEqual([10, 7, 4, 1]);
    });

    it('gives a copy of a hidden sheet the view state that sheet left with', () => {
      const bar = build({ hiddenColumns: true, colHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('hiddenColumns').hideColumns([2]);
      bar.setActiveSheet('B');

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);
    });

    it('gives a copy neither the selection nor the scroll position of its original', () => {
      const bar = build({ colHeaders: true }, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const restored = jest.fn();

      hot.selectCell(2, 1);
      hot.addHook('afterSheetTabStateRestore', (id, state) => restored(state));

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);

      expect(hot.getSelected()).toBeUndefined();
      expect(restored).toHaveBeenCalledTimes(1);
      expect(restored.mock.calls[0][0]).toEqual(expect.objectContaining({
        selection: undefined,
        selectionState: null,
        scroll: { row: 0, col: 0 },
      }));
    });

    it('carries the collapsed column groups and the checked rows to the copy', () => {
      const bar = build({
        nestedHeaders: [[{ label: 'G', colspan: 2 }, 'c'], ['a', 'b', 'c']],
        collapsibleColumns: true,
        rowSelection: true,
        rowHeaders: true,
      }, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });
      hot.getPlugin('rowSelection').selectRows([2]);

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);

      expect(hot.columnIndexMapper.isHidden(1)).toBe(true);
      expect(hot.getPlugin('rowSelection').getSelectedRows()).toEqual([2]);
    });

    it('fires afterSheetTabStateRestore on the copy\'s first visit', () => {
      const bar = build({ colHeaders: true }, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);
      const restored = jest.fn();

      hot.addHook('afterSheetTabStateRestore', restored);

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);

      expect(restored).toHaveBeenCalledTimes(1);
      expect(restored.mock.calls[0][0]).toBe(copy.id);
    });

    it('does not share a stored value between the copy and its original', () => {
      const bar = build({ hiddenColumns: true, colHeaders: true },
        [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.getPlugin('hiddenColumns').hideColumns([2]);
      bar.setActiveSheet('B');

      const copy = bar.duplicateSheet(idOf(bar, 'A'));

      bar.setActiveSheet(copy.id);
      hot.getPlugin('hiddenColumns').showColumns([2]);
      bar.setActiveSheet('A');

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);
    });

    it('gives a copy of a hidden sheet the `hiddenColumns` updateSheetSettings() declared while it was hidden', () => {
      const bar = build({ colHeaders: true }, [
        { name: 'Alpha', data: rows(), settings: { hiddenColumns: { columns: [1] } } },
        { name: 'Beta', data: rows() },
      ]);
      const alphaId = idOf(bar, 'Alpha');

      bar.setActiveSheet('Beta');
      bar.updateSheetSettings(alphaId, { hiddenColumns: { columns: [0] } });

      const copy = bar.duplicateSheet(alphaId);

      bar.setActiveSheet(copy.id);

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0]);

      bar.setActiveSheet(alphaId);

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0]);
    });

    it('gives a copy of a hidden sheet the `mergeCells` updateSheetSettings() declared while it was hidden', () => {
      const bar = build({ colHeaders: true }, [
        { name: 'Alpha', data: rows(), settings: { mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }] } },
        { name: 'Beta', data: rows() },
      ]);
      const alphaId = idOf(bar, 'Alpha');

      bar.setActiveSheet('Beta');
      bar.updateSheetSettings(alphaId, { mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }] });

      const copy = bar.duplicateSheet(alphaId);

      bar.setActiveSheet(copy.id);

      expect(hot.getPlugin('mergeCells').getVisibleMergedAreas())
        .toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);

      bar.setActiveSheet(alphaId);

      expect(hot.getPlugin('mergeCells').getVisibleMergedAreas())
        .toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);
    });

    it('gives a copy of a hidden sheet the `customBorders` updateSheetSettings() declared while it was hidden', () => {
      const border = (row, col) => [{ row, col, top: { width: 2, color: 'blue' } }];
      const bar = build({ colHeaders: true }, [
        { name: 'Alpha', data: rows(), settings: { customBorders: border(0, 0) } },
        { name: 'Beta', data: rows() },
      ]);
      const alphaId = idOf(bar, 'Alpha');

      bar.setActiveSheet('Beta');
      bar.updateSheetSettings(alphaId, { customBorders: border(1, 1) });

      const copy = bar.duplicateSheet(alphaId);

      bar.setActiveSheet(copy.id);

      expect(hot.getPlugin('customBorders').getBorders().map(entry => [entry.row, entry.col])).toEqual([[1, 1]]);
    });

    it('gives a copy of a hidden sheet the page size updateSheetSettings() declared while it was hidden', () => {
      const bar = build({ colHeaders: true }, [
        { name: 'Alpha', data: [[1], [2], [3], [4], [5]], settings: { pagination: { pageSize: 1 } } },
        { name: 'Beta', data: rows() },
      ]);
      const alphaId = idOf(bar, 'Alpha');

      hot.getPlugin('pagination').setPage(4);
      bar.setActiveSheet('Beta');
      bar.updateSheetSettings(alphaId, { pagination: { pageSize: 2 } });

      const copy = bar.duplicateSheet(alphaId);

      bar.setActiveSheet(copy.id);

      const { currentPage, pageSize } = hot.getPlugin('pagination').getPaginationData();

      expect([currentPage, pageSize]).toEqual([3, 2]);
    });

    it('gives a copy of a never-visited copy the cell meta of its original', () => {
      const bar = build({ colHeaders: true }, [{ name: 'A', data: rows() }, { name: 'B', data: rows() }]);

      hot.setCellMeta(1, 1, 'className', 'kept');
      bar.setActiveSheet('B');

      const copy = bar.duplicateSheet(idOf(bar, 'A'));
      const copyOfCopy = bar.duplicateSheet(copy.id);

      bar.setActiveSheet(copyOfCopy.id);

      expect(hot.getCellMeta(1, 1).className).toBe('kept');
    });
  });
});
