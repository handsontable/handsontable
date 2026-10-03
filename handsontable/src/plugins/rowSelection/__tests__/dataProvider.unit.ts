import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const flush = () => new Promise(resolve => queueMicrotask(() => resolve(undefined)));

/**
 * Lets the fetch chains (request, response, load) run to their end.
 */
async function settle() {
  for (let i = 0; i < 20; i++) {
    await flush();
  }
}

interface ServerRow {
  id: number;
  status: string;
}

/**
 * Builds a grid backed by an in-memory "server" of 25 rows, 10 per page. Rows with an id divisible
 * by 5 are archived.
 */
async function createServerGrid(rowSelection: Record<string, unknown> | boolean = true) {
  const serverRows: ServerRow[] = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    status: (index + 1) % 5 === 0 ? 'archived' : 'active',
  }));
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    columns: [{ data: 'id' }, { data: 'status' }],
    colHeaders: true,
    rowHeaders: true,
    pagination: { pageSize: 10 },
    rowSelection,
    dataProvider: {
      rowId: 'id',
      fetchRows: async({ page, pageSize }: { page: number; pageSize: number }) => ({
        rows: serverRows.slice((page - 1) * pageSize, page * pageSize).map(row => ({ ...row })),
        totalRows: serverRows.length,
      }),
      onRowsCreate: async() => {},
      onRowsUpdate: async() => {},
      onRowsRemove: async() => {},
    },
    licenseKey: 'non-commercial-and-evaluation',
  });

  await settle();

  const plugin = hot.getPlugin('rowSelection');
  const dataProvider = hot.getPlugin('dataProvider');

  return {
    hot,
    plugin,
    async goToPage(page: number) {
      await dataProvider.fetchData({ page });
      await settle();
    },
    loadedIds: () => (plugin.getSelectedRowsData() as ServerRow[]).map(row => row.id),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('RowSelection with DataProvider', () => {
  it('should keep the rows selected on one page after visiting another', async() => {
    const grid = await createServerGrid();

    grid.plugin.selectRows([0, 1]);
    await grid.goToPage(2);

    expect(grid.plugin.getSelectedRows()).toEqual([]);
    expect(grid.plugin.getSelectedCount()).toBe(2);

    grid.plugin.selectRows([0]);
    await grid.goToPage(1);

    expect(grid.loadedIds()).toEqual([1, 2]);
    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [1, 2, 11] });

    grid.destroy();
  });

  it('should select every row matching the query with "select all", including unloaded pages', async() => {
    const grid = await createServerGrid();

    expect(grid.plugin.getHeaderCheckboxState()).toEqual({ state: 'unchecked', selected: 0, total: 25 });

    grid.plugin.selectAll();

    expect(grid.plugin.getHeaderCheckboxState()).toEqual({ state: 'checked', selected: 25, total: 25 });
    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: true, toggledRowIds: [] });

    await grid.goToPage(3);

    // Page 3 was never loaded when "select all" ran, and its rows show as selected.
    expect(grid.loadedIds()).toEqual([21, 22, 23, 24, 25]);

    grid.plugin.deselectRows([1]);

    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: true, toggledRowIds: [22] });
    expect(grid.plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 24, total: 25 });

    grid.destroy();
  });

  it('should clear the selection on every page with "deselect all"', async() => {
    const grid = await createServerGrid();

    grid.plugin.selectRows([3]);
    await grid.goToPage(2);
    grid.plugin.selectRows([4]);

    expect(grid.plugin.deselectAll()).toBe(true);
    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [] });

    await grid.goToPage(1);

    expect(grid.plugin.getSelectedRows()).toEqual([]);

    grid.destroy();
  });

  it('should toggle from the mixed state to every row, and from checked to none', async() => {
    const grid = await createServerGrid();

    grid.plugin.selectRows([0]);
    grid.plugin.toggleAll();

    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: true, toggledRowIds: [] });

    grid.plugin.toggleAll();

    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [] });
    expect(grid.plugin.getSelectedRows()).toEqual([]);

    grid.destroy();
  });

  it('should act on the loaded page only with the "currentPage" scope', async() => {
    const grid = await createServerGrid({ selectAll: 'currentPage' });

    grid.plugin.selectAll();

    expect(grid.plugin.getServerSelection())
      .toEqual({ selectAll: false, toggledRowIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    expect(grid.plugin.getHeaderCheckboxState()).toEqual({ state: 'checked', selected: 10, total: 10 });

    await grid.goToPage(2);

    expect(grid.plugin.getHeaderCheckboxState()).toEqual({ state: 'unchecked', selected: 0, total: 10 });

    grid.destroy();
  });

  it('should keep a single row selected across pages in the "singleRow" mode', async() => {
    const grid = await createServerGrid({ mode: 'singleRow' });

    grid.plugin.selectRows([2]);
    await grid.goToPage(2);
    grid.plugin.selectRows([5]);

    expect(grid.plugin.getServerSelection()).toEqual({ selectAll: false, toggledRowIds: [16] });

    await grid.goToPage(1);

    expect(grid.plugin.getSelectedRows()).toEqual([]);

    grid.destroy();
  });

  it('should restore a saved selection, and report the loaded rows that change', async() => {
    const afterChange = jest.fn();
    const grid = await createServerGrid();

    grid.hot.addHook('afterRowSelectionChange', afterChange);

    expect(grid.plugin.setServerSelection({ selectAll: true, toggledRowIds: [2] })).toBe(true);
    expect(grid.plugin.getSelectedRows()).toEqual([0, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(afterChange).toHaveBeenCalledWith([0, 2, 3, 4, 5, 6, 7, 8, 9], [], 'api');

    // The same selection again changes nothing.
    expect(grid.plugin.setServerSelection({ selectAll: true, toggledRowIds: [2] })).toBe(false);

    grid.destroy();
  });

  it('should show the rows `isRowSelectable` rejects as not selected under "select all"', async() => {
    const grid = await createServerGrid({
      isRowSelectable: (rowData: ServerRow) => rowData.status !== 'archived',
    });

    grid.plugin.selectAll();

    // Row id 5 and 10 are archived.
    expect(grid.loadedIds()).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);

    grid.destroy();
  });

  it('should return no server selection for a grid that is not backed by a server', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: [[1], [2]],
      rowSelection: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin('rowSelection');

    plugin.selectRows([1]);

    expect(plugin.getServerSelection()).toBeNull();
    expect(plugin.setServerSelection({ selectAll: true, toggledRowIds: [] })).toBe(false);
    expect(plugin.getSelectedCount()).toBe(1);

    hot.destroy();
    container.remove();
  });
});
