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
    const { hot, plugin, destroy } = createGrid({ rowSelection: { checkboxLocation: { column: 'id' } } });

    expect(plugin.getBoundColumn()).toBeNull();
    // The checkboxes are drawn in the row header, and the "select all" checkbox above them.
    expect(hot.getCell(0, -1)?.querySelector('.htRowSelectionCheckbox')).not.toBeNull();
    expect(hot.rootElement.querySelector('th.htRowSelectionCorner .htRowSelectionCheckbox')).not.toBeNull();

    plugin.selectRows([1]);

    expect(plugin.getSelectedRows()).toEqual([1]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not a checkbox column'));

    warnSpy.mockRestore();
    destroy();
  });

  it('should paint the row tint on the render an edit runs, under `renderMode: \'onChange\'`', () => {
    const { hot, destroy } = createGrid({ renderMode: 'onChange' });

    hot.setDataAtCell(1, 1, true);

    // The render runs before `afterChange`: an unmarked row would keep the previous paint.
    expect(hot.getCell(1, 0)!.classList.contains('htRowSelected')).toBe(true);

    hot.setDataAtCell(1, 1, false);

    expect(hot.getCell(1, 0)!.classList.contains('htRowSelected')).toBe(false);

    destroy();
  });

  it('should report no change when a `beforeChange` listener cancels the write', () => {
    const afterChange = jest.fn();
    const { plugin, selectedValues, destroy } = createGrid({
      beforeChange: () => false,
      afterRowSelectionChange: afterChange,
    });

    expect(plugin.selectRows([0])).toBe(false);
    expect(selectedValues()).toEqual([false, false, true, false, false]);
    expect(afterChange).not.toHaveBeenCalled();

    destroy();
  });

  it('should report only the rows a `beforeChange` listener lets through', () => {
    const afterChange = jest.fn();
    const { plugin, selectedValues, destroy } = createGrid({
      beforeChange(changes: Array<unknown[] | null>) {
        changes.forEach((change, index) => {
          if (change && change[0] === 0) {
            changes[index] = null;
          }
        });
      },
      afterRowSelectionChange: afterChange,
    });

    expect(plugin.selectRows([0, 1])).toBe(true);
    expect(selectedValues()).toEqual([false, true, true, false, false]);
    expect(afterChange).toHaveBeenCalledTimes(1);
    expect(afterChange).toHaveBeenCalledWith([1], [], 'api');

    destroy();
  });

  it('should report no change when a validator rejects the write with `allowInvalid: false`', () => {
    const afterChange = jest.fn();
    const { plugin, selectedValues, destroy } = createGrid({
      columns: [
        { data: 'id' },
        {
          data: 'selected',
          type: 'checkbox',
          allowInvalid: false,
          validator: (_value: unknown, callback: (valid: boolean) => void) => callback(false),
        },
      ],
      afterRowSelectionChange: afterChange,
    });

    expect(plugin.selectRows([0])).toBe(false);
    expect(selectedValues()).toEqual([false, false, true, false, false]);
    expect(afterChange).not.toHaveBeenCalled();

    destroy();
  });

  it('should report a write an asynchronous validator holds once it lands', async() => {
    const afterChange = jest.fn();
    const { plugin, selectedValues, destroy } = createGrid({
      columns: [
        { data: 'id' },
        {
          data: 'selected',
          type: 'checkbox',
          validator: (_value: unknown, callback: (valid: boolean) => void) => {
            Promise.resolve().then(() => callback(true));
          },
        },
      ],
      afterRowSelectionChange: afterChange,
    });

    plugin.selectRows([0]);

    expect(afterChange).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(selectedValues()).toEqual([true, false, true, false, false]);
    expect(afterChange).toHaveBeenCalledTimes(1);
    expect(afterChange).toHaveBeenCalledWith([0], [], 'api');

    destroy();
  });

  it('should resolve the bound column once, not for every painted cell', () => {
    const { hot, plugin, destroy } = createGrid();
    const propToCol = jest.spyOn(hot, 'propToCol');

    hot.markAllCellsChanged();
    hot.render();

    expect(propToCol).not.toHaveBeenCalled();
    expect(plugin.getBoundColumn()).toBe(1);

    destroy();
  });

  it('should refresh the "select all" state when an edit of another column makes a bound cell read-only', () => {
    // The `id` column decides, through `cells`, whether the row's bound cell can be written.
    const { hot, plugin, destroy } = createGrid({
      cells(physicalRow: number, physicalColumn: number) {
        const id = this.instance.getSourceDataAtCell(physicalRow, 'id');

        return physicalColumn === 1 && id === 'locked' ? { readOnly: true } : {};
      },
    });

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    hot.setDataAtCell(0, 0, 'locked');

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 4 });

    // A header press acts on the fresh state: the locked row stays unchecked.
    plugin.toggleAll();

    expect(plugin.getSelectedRows()).toEqual([1, 2, 3, 4]);

    destroy();
  });

  it('should refresh the "select all" state when `setCellMeta()` makes a bound cell read-only', () => {
    const { hot, plugin, destroy } = createGrid();

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    hot.setCellMeta(0, 1, 'readOnly', true);

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 4 });

    hot.removeCellMeta(0, 1, 'readOnly');

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    destroy();
  });

  it('should refresh the "select all" state on an undo and a redo of the Read only menu item', () => {
    const { hot, plugin, destroy } = createGrid({ contextMenu: true, undoRedo: true });

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    hot.selectCell(0, 1);
    hot.getPlugin('contextMenu').executeCommand('make_read_only');

    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 4 });

    // UndoRedo restores the meta through the meta manager, which fires no `afterSetCellMeta`.
    hot.getPlugin('undoRedo').undo();

    expect(hot.getCellMeta(0, 1).readOnly).toBeFalsy();
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    hot.getPlugin('undoRedo').redo();

    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 4 });

    // A header press acts on the fresh state: the read-only row stays unchecked.
    plugin.toggleAll();

    expect(plugin.getSelectedRows()).toEqual([1, 2, 3, 4]);

    destroy();
  });

  it('should follow the bound column when the columns move or change', () => {
    const { hot, plugin, destroy } = createGrid({ manualColumnMove: true });

    hot.getPlugin('manualColumnMove').moveColumn(1, 0);

    expect(plugin.getBoundColumn()).toBe(0);
    expect(plugin.getSelectedRows()).toEqual([2]);

    hot.updateSettings({ columns: [{ data: 'id' }, { data: 'id' }, { data: 'selected', type: 'checkbox' }] });

    expect(plugin.getBoundColumn()).toBe(2);

    destroy();
  });

  it('should keep the cached "select all" state across an edit of another column', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.getHeaderCheckboxState();
    hot.setDataAtCell(0, 0, 99);

    const getSourceDataAtCell = jest.spyOn(hot, 'getSourceDataAtCell');

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });
    expect(getSourceDataAtCell).not.toHaveBeenCalled();

    // An edit of the bound column drops it.
    hot.setDataAtCell(0, 1, true);

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 2, total: 5 });

    destroy();
  });

  it('should read the own cell meta of a row the filters removed', () => {
    const { hot, plugin, selectedValues, destroy } = createGrid({
      filters: true,
      cells(row: number, column: number) {
        return row === 3 && column === 1 ? { readOnly: true } : {};
      },
    });
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'neq', [3]);
    filters.filter();

    expect(hot.countRows()).toBe(4);
    // The read-only row is out of the count while filtered out, as it is while shown.
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 4 });

    plugin.selectAll();

    expect(selectedValues()).toEqual([true, true, true, false, true]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'checked', selected: 4, total: 4 });

    destroy();
  });

  it('should report a `setSourceDataAtCell()` write to the column, and refresh the "select all" state', () => {
    const afterRowSelectionChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ afterRowSelectionChange });

    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

    hot.setSourceDataAtCell(0, 'selected', true);

    expect(plugin.getSelectedRows()).toEqual([0, 2]);
    expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 2, total: 5 });
    expect(afterRowSelectionChange).toHaveBeenLastCalledWith([0], [], 'dataChange');

    hot.setSourceDataAtCell(1, 'id', 100);

    expect(afterRowSelectionChange).toHaveBeenCalledTimes(1);

    destroy();
  });

  it('should report a filtered-out row its own write reaches through the source data only once', () => {
    const afterRowSelectionChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ afterRowSelectionChange, filters: true });
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'lt', [2]);
    filters.filter();
    plugin.selectAll();

    expect(afterRowSelectionChange).toHaveBeenCalledTimes(1);
    expect(afterRowSelectionChange.mock.calls[0][0].sort()).toEqual([0, 1, 3, 4]);

    destroy();
  });

  it('should report an undo and a redo of a checkbox click once each', () => {
    const afterRowSelectionChange = jest.fn();
    const { hot, plugin, destroy } = createGrid({ afterRowSelectionChange, undoRedo: true });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(0, 1, true, 'edit');

    expect(afterRowSelectionChange).toHaveBeenCalledTimes(1);

    undoRedo.undo();

    expect(plugin.getSelectedRows()).toEqual([2]);
    expect(afterRowSelectionChange).toHaveBeenCalledTimes(2);
    expect(afterRowSelectionChange).toHaveBeenLastCalledWith([], [0], 'dataChange');

    undoRedo.redo();

    expect(plugin.getSelectedRows()).toEqual([0, 2]);
    expect(afterRowSelectionChange).toHaveBeenCalledTimes(3);
    expect(afterRowSelectionChange).toHaveBeenLastCalledWith([0], [], 'dataChange');

    destroy();
  });

  it('should not select a row `isRowSelectable` rejects through an edit of its cell, and still let it be unchecked', () => {
    const afterRowSelectionChange = jest.fn();
    const { hot, plugin, selectedValues, destroy } = createGrid({
      afterRowSelectionChange,
      rowSelection: {
        checkboxLocation: { column: 'selected' },
        isRowSelectable: (rowData: Order) => rowData.id !== 2 && rowData.id !== 3,
      },
    });

    hot.setDataAtCell(3, 1, true, 'edit');

    expect(selectedValues()).toEqual([false, false, true, false, false]);
    expect(plugin.getSelectedRows()).toEqual([2]);
    expect(afterRowSelectionChange).not.toHaveBeenCalled();

    // Row 2 starts checked in the data: unchecking it is allowed.
    hot.setDataAtCell(2, 1, false, 'edit');

    expect(selectedValues()).toEqual([false, false, false, false, false]);
    expect(afterRowSelectionChange).toHaveBeenCalledWith([], [2], 'checkbox');

    destroy();
  });

  it('should resolve the row checks once for a paste into the column, not once per row', () => {
    // Every `RowChecks` build asks for the bound column, so the count must not grow with the rows.
    const countBoundColumnLookups = (rows: number[]) => {
      const { hot, plugin, destroy } = createGrid();
      const getBoundColumn = jest.spyOn(plugin, 'getBoundColumn');

      hot.setDataAtCell(rows.map(row => [row, 1, true]), 'CopyPaste.paste');

      expect(plugin.getSelectedRows()).toEqual([...rows, 2].sort());

      const calls = getBoundColumn.mock.calls.length;

      destroy();

      return calls;
    };

    expect(countBoundColumnLookups([0, 1, 3, 4])).toBe(countBoundColumnLookups([0]));
  });
});
