import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

interface Order {
  id: number;
  selected: unknown;
}

/**
 * Builds a grid of five orders whose `selected` checkbox column is the row selection (order 2 selected).
 */
function createGrid(settings: Record<string, unknown> = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: Array.from({ length: 5 }, (_, index) => ({ id: index, selected: index === 2 })),
    columns: [{ data: 'id' }, { data: 'selected', type: 'checkbox' }],
    colHeaders: true,
    rowHeaders: true,
    rowSelection: { checkboxLocation: { column: 'selected' } },
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  return {
    hot,
    plugin: hot.getPlugin('rowSelection'),
    selectedValues: () => (hot.getSourceData() as Order[]).map(row => row.selected),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('RowSelection bound to a checkbox column', () => {
  it('should read the selection from the column values', () => {
    const { plugin, destroy } = createGrid();

    expect(plugin.getBoundColumn()).toBe(1);
    expect(plugin.getSelectedRows()).toEqual([2]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    destroy();
  });

  it('should write a selection made through the API into the column, as one undo step', () => {
    const { hot, plugin, selectedValues, destroy } = createGrid({ undoRedo: true });

    plugin.selectAll();

    expect(selectedValues()).toEqual([true, true, true, true, true]);

    hot.getPlugin('undoRedo').undo();

    expect(selectedValues()).toEqual([false, false, true, false, false]);

    destroy();
  });

  it('should report an edit of the column as a selection change with the "dataChange" source', () => {
    const afterChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ afterRowSelectionChange: afterChange });

    hot.setDataAtCell(0, 1, true, 'CopyPaste.paste');

    expect(plugin.getSelectedRows()).toEqual([0, 2]);
    expect(afterChange).toHaveBeenCalledWith([0], [], 'dataChange');

    hot.setDataAtCell(2, 1, false);

    expect(afterChange).toHaveBeenLastCalledWith([], [2], 'checkbox');

    destroy();
  });

  it('should let `beforeRowSelectionChange` veto an edit of the column', () => {
    const { hot, plugin, selectedValues, destroy } = createGrid({
      beforeRowSelectionChange: (rowsToSelect: number[]) => !rowsToSelect.includes(4),
    });

    // The hook answers for the whole change, so the veto drops both cells of the batch.
    hot.setDataAtCell([[3, 1, true], [4, 1, true]]);

    expect(selectedValues()).toEqual([false, false, true, false, false]);
    expect(plugin.getSelectedRows()).toEqual([2]);

    hot.setDataAtCell(3, 1, true);

    expect(plugin.getSelectedRows()).toEqual([2, 3]);

    destroy();
  });

  it('should not report its own writes twice', () => {
    const afterChange = jest.fn();
    const { plugin, destroy } = createGrid({ afterRowSelectionChange: afterChange });

    plugin.selectRows([0]);

    expect(afterChange).toHaveBeenCalledTimes(1);
    expect(afterChange).toHaveBeenCalledWith([0], [], 'api');

    destroy();
  });

  it('should not select a row whose cell is read-only', () => {
    const { plugin, selectedValues, destroy } = createGrid({
      cells(row: number, column: number) {
        return row === 0 && column === 1 ? { readOnly: true } : {};
      },
    });

    plugin.selectAll();

    expect(selectedValues()).toEqual([false, true, true, true, true]);
    expect(plugin.isRowSelectable(0)).toBe(false);
    expect(plugin.getHeaderCheckboxState().state).toBe('checked');

    destroy();
  });

  it('should not add a row header column, and keep the cell checkboxes the checkbox cell type\'s', () => {
    const { hot, destroy } = createGrid();

    const widths = hot.runHooks('modifyRowHeaderWidth', 50);

    expect(widths).toBe(50);

    destroy();
  });

  it('should fall back to the row header location, with a warning, when the column is not a checkbox column', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { plugin, destroy } = createGrid({ rowSelection: { checkboxLocation: { column: 'id' } } });

    expect(plugin.getBoundColumn()).toBeNull();

    plugin.selectRows([1]);

    expect(plugin.getSelectedRows()).toEqual([1]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not a checkbox column'));

    warnSpy.mockRestore();
    destroy();
  });
});
