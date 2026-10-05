import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/**
 * Builds a grid of `rows` rows whose first column holds the physical index.
 */
function createGrid(settings: Record<string, unknown> = {}, rows = 6) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: Array.from({ length: rows }, (_, index) => ({ id: index, status: index % 2 ? 'odd' : 'even' })),
    columns: [{ data: 'id' }, { data: 'status' }],
    rowHeaders: true,
    colHeaders: true,
    rowSelection: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
  const plugin = hot.getPlugin('rowSelection');

  return {
    hot,
    plugin,
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('RowSelection', () => {
  it('should select and deselect rows through the API without touching the data', () => {
    const { hot, plugin, destroy } = createGrid();
    const dataBefore = JSON.stringify(hot.getSourceData());

    expect(plugin.selectRows([1, 3])).toBe(true);
    expect(plugin.getSelectedRows()).toEqual([1, 3]);
    expect(plugin.isRowSelected(1)).toBe(true);
    expect(plugin.isRowSelected(2)).toBe(false);

    expect(plugin.deselectRows([1])).toBe(true);
    expect(plugin.getSelectedRows()).toEqual([3]);
    expect(JSON.stringify(hot.getSourceData())).toBe(dataBefore);

    destroy();
  });

  it('should report no change when the rows already have the requested state', () => {
    const { plugin, destroy } = createGrid();

    plugin.selectRows([2]);

    expect(plugin.selectRows([2])).toBe(false);
    expect(plugin.deselectRows([0])).toBe(false);

    destroy();
  });

  it('should keep only one row selected in the "singleRow" mode', () => {
    const { plugin, destroy } = createGrid({ rowSelection: { mode: 'singleRow' } });

    plugin.selectRows([1]);
    plugin.selectRows([4]);

    expect(plugin.getSelectedRows()).toEqual([4]);
    expect(plugin.selectAll()).toBe(false);
    expect(plugin.getSelectedRows()).toEqual([4]);

    destroy();
  });

  it('should skip the rows `isRowSelectable` rejects, and leave them out of the header state', () => {
    const { plugin, destroy } = createGrid({
      rowSelection: { isRowSelectable: (rowData: { status: string }) => rowData.status === 'even' },
    });

    plugin.selectRows([0, 1, 2]);

    expect(plugin.getSelectedRows()).toEqual([0, 2]);
    expect(plugin.isRowSelectable(1)).toBe(false);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 2, total: 3 });

    plugin.selectAll();

    expect(plugin.getSelectedRows()).toEqual([0, 2, 4]);
    expect(plugin.getHeaderCheckboxState().state).toBe('checked');

    destroy();
  });

  it('should move the header checkbox through unchecked, mixed, and checked as rows are selected', () => {
    const { plugin, destroy } = createGrid({}, 3);

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'unchecked', selected: 0, total: 3 });

    plugin.selectRows([0]);

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 3 });

    plugin.selectRows([1, 2]);

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'checked', selected: 3, total: 3 });

    destroy();
  });

  it('should select everything from the mixed state and deselect everything from the checked state', () => {
    const { plugin, destroy } = createGrid({}, 3);

    plugin.selectRows([1]);
    plugin.toggleAll();

    expect(plugin.getSelectedRows()).toEqual([0, 1, 2]);

    plugin.toggleAll();

    expect(plugin.getSelectedRows()).toEqual([]);

    destroy();
  });

  it('should select the rows the filters removed with the default "all" scope', () => {
    const { hot, plugin, destroy } = createGrid({ filters: true });
    const filters = hot.getPlugin('filters');

    filters.addCondition(1, 'eq', ['even']);
    filters.filter();

    expect(hot.countRows()).toBe(3);

    plugin.selectAll();

    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 2, 3, 4, 5]);
    // The visual list cannot name a filtered-out row.
    expect(plugin.getSelectedRows()).toEqual([0, 1, 2]);
    expect(plugin.getSelectedRowsData()).toHaveLength(6);

    destroy();
  });

  it('should select only the filtered rows with the "filtered" scope, and count only them', () => {
    const { hot, plugin, destroy } = createGrid({ filters: true, rowSelection: { selectAll: 'filtered' } });
    const filters = hot.getPlugin('filters');

    filters.addCondition(1, 'eq', ['even']);
    filters.filter();
    plugin.selectAll();

    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 2, 4]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'checked', selected: 3, total: 3 });

    filters.clearConditions();
    filters.filter();

    // The selection survives the filter change, and the header now describes the bigger scope.
    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 2, 4]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 3, total: 6 });

    destroy();
  });

  it('should select only the current page with the "currentPage" scope', () => {
    const { hot, plugin, destroy } = createGrid({
      pagination: { pageSize: 2 },
      rowSelection: { selectAll: 'currentPage' },
    });

    hot.getPlugin('pagination').setPage(2);
    plugin.selectAll();

    expect(plugin.getSelectedPhysicalRows()).toEqual([2, 3]);

    destroy();
  });

  it('should never select the rows hidden by HiddenRows or trimmed by TrimRows', () => {
    const { plugin, destroy } = createGrid({ hiddenRows: { rows: [1] }, trimRows: [4] });

    plugin.selectAll();

    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 2, 3, 5]);
    expect(plugin.getHeaderCheckboxState().state).toBe('checked');

    destroy();
  });

  it('should keep the selection on its rows when the rows are sorted', () => {
    const { hot, plugin, destroy } = createGrid({ columnSorting: true });

    plugin.selectRows([0]);
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

    expect(plugin.getSelectedRows()).toEqual([5]);
    expect(plugin.getSelectedRowsData()).toEqual([{ id: 0, status: 'even' }]);

    destroy();
  });

  it('should keep the selection on its rows when rows are inserted or removed above them', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.selectRows([3]);
    hot.alter('insert_row_above', 0, 2);

    expect(plugin.getSelectedRows()).toEqual([5]);

    hot.alter('remove_row', 0, 3);

    expect(plugin.getSelectedRows()).toEqual([2]);
    expect(plugin.getSelectedRowsData()).toEqual([{ id: 3, status: 'odd' }]);

    destroy();
  });

  it('should clear the selection when new data is loaded', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.selectRows([1, 2]);
    hot.loadData([{ id: 10 }, { id: 11 }]);

    expect(plugin.getSelectedPhysicalRows()).toEqual([]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'unchecked', selected: 0, total: 2 });

    destroy();
  });

  it('should keep the selection across a settings update of the plugin', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.selectRows([1, 2]);
    hot.updateSettings({ rowSelection: { selectAll: 'filtered' } });

    expect(plugin.getSelectedRows()).toEqual([1, 2]);

    destroy();
  });

  it('should not record a selection change as an undo step', () => {
    const { hot, plugin, destroy } = createGrid({ undoRedo: true });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(0, 1, 'edited');
    plugin.selectRows([2, 3]);
    undoRedo.undo();

    expect(hot.getDataAtCell(0, 1)).toBe('even');
    expect(plugin.getSelectedRows()).toEqual([2, 3]);
    expect(undoRedo.isUndoAvailable()).toBe(false);

    destroy();
  });

  it('should let `beforeRowSelectionChange` cancel a change, and report the physical rows and source', () => {
    const afterChange = jest.fn();
    const { plugin, destroy } = createGrid({
      beforeRowSelectionChange: (rowsToSelect: number[]) => !rowsToSelect.includes(0),
      afterRowSelectionChange: afterChange,
    });

    expect(plugin.selectRows([0, 1])).toBe(false);
    expect(plugin.getSelectedRows()).toEqual([]);
    expect(afterChange).not.toHaveBeenCalled();

    plugin.selectRows([2]);

    expect(afterChange).toHaveBeenCalledWith([2], [], 'api');

    destroy();
  });

  it('should only allow the top level of a nested tree to be selected with `groupSelects: \'topLevel\'`', () => {
    const { plugin, destroy } = createGrid({
      data: [
        { id: 'a', __children: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'b', __children: [] },
      ],
      columns: [{ data: 'id' }],
      nestedRows: true,
      rowSelection: { groupSelects: 'topLevel' },
    });

    plugin.selectAll();

    expect(plugin.getSelectedRows()).toEqual([0, 3]);
    expect(plugin.isRowSelectable(1)).toBe(false);

    destroy();
  });

  it('should keep the selection on its rows when the rows are moved', () => {
    const { hot, plugin, destroy } = createGrid({ manualRowMove: true });

    plugin.selectRows([0, 4]);
    hot.getPlugin('manualRowMove').moveRow(0, 3);
    hot.render();

    expect(plugin.getSelectedRowsData()).toEqual([{ id: 0, status: 'even' }, { id: 4, status: 'even' }]);
    // `moveRow(0, 3)` puts the row at visual index 3.
    expect(plugin.getSelectedRows()).toEqual([3, 4]);

    destroy();
  });

  it('should keep the selection of a nested parent when its children collapse and expand', () => {
    const { hot, plugin, destroy } = createGrid({
      data: [
        { id: 'a', __children: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'b', __children: [{ id: 'b1' }] },
      ],
      columns: [{ data: 'id' }],
      nestedRows: true,
      rowSelection: { groupSelects: 'topLevel' },
    });
    const collapsingUI = hot.getPlugin('nestedRows').collapsingUI!;

    plugin.selectRows([3]);
    collapsingUI.collapseChildren(0);

    expect(plugin.getSelectedRows()).toEqual([1]);

    collapsingUI.expandChildren(0);

    expect(plugin.getSelectedRows()).toEqual([3]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 2 });

    destroy();
  });

  it('should remove the selected rows in one undo step', () => {
    const { hot, plugin, destroy } = createGrid({ undoRedo: true });

    plugin.selectRows([1, 2, 4]);

    expect(plugin.removeSelectedRows()).toBe(true);
    expect((hot.getSourceData() as Array<{ id: number }>).map(row => row.id)).toEqual([0, 3, 5]);
    expect(plugin.getSelectedRows()).toEqual([]);

    hot.getPlugin('undoRedo').undo();

    expect((hot.getSourceData() as Array<{ id: number }>).map(row => row.id)).toEqual([0, 1, 2, 3, 4, 5]);

    destroy();
  });

  it('should not remove rows when the grid does not allow it', () => {
    const { hot, plugin, destroy } = createGrid({ allowRemoveRow: false });

    plugin.selectRows([1]);

    expect(plugin.removeSelectedRows()).toBe(false);
    expect(hot.countRows()).toBe(6);

    destroy();
  });

  it('should add the bulk actions to the context menu, hidden while nothing is selected', () => {
    const { hot, plugin, destroy } = createGrid();

    interface MenuItem {
      key: string;
      name: (this: unknown) => string;
      callback: (this: unknown) => void;
      hidden: () => boolean;
      disabled: () => boolean;
    }
    const options = { items: [] as MenuItem[] };

    hot.runHooks('afterContextMenuDefaultOptions', options);

    const remove = options.items.find(item => item.key === 'row_selection_remove')!;
    const clear = options.items.find(item => item.key === 'row_selection_clear')!;

    expect(remove.hidden()).toBe(true);
    expect(clear.hidden()).toBe(true);

    plugin.selectRows([0, 2]);

    expect(remove.hidden()).toBe(false);
    expect(remove.disabled()).toBe(false);
    expect(remove.name.call(hot)).toBe('Remove selected rows (2)');

    clear.callback.call(hot);

    expect(plugin.getSelectedRows()).toEqual([]);

    plugin.selectRows([0, 2]);
    remove.callback.call(hot);

    expect(hot.countRows()).toBe(4);

    destroy();
  });

  it('should give the plugin\'s row header column its own width next to the existing one', () => {
    const { hot, destroy } = createGrid();

    const widths = hot.runHooks('modifyRowHeaderWidth', 50);

    expect(Array.isArray(widths)).toBe(true);
    expect(widths).toHaveLength(2);
    expect(widths[0]).toBe(50);
    expect(widths[1]).toBeGreaterThan(0);
    expect(widths[1]).not.toBe(50);

    destroy();
  });
});
