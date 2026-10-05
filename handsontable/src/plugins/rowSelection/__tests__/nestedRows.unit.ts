import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/**
 * A three-level tree. Physical (and, with nothing collapsed, visual) rows:
 *
 * 0 a
 * 1   a1
 * 2     a1x
 * 3     a1y
 * 4   a2
 * 5 b
 * 6   b1
 * 7 c
 *
 * The leaves are a1x, a1y, a2, b1, and c.
 */
function createTree() {
  return [
    {
      id: 'a',
      __children: [
        { id: 'a1', __children: [{ id: 'a1x' }, { id: 'a1y' }] },
        { id: 'a2' },
      ],
    },
    { id: 'b', __children: [{ id: 'b1' }] },
    { id: 'c' },
  ];
}

/**
 * Builds a NestedRows grid over the tree with the row selection settings.
 */
function createGrid(rowSelection: Record<string, unknown> | boolean = true, settings: Record<string, unknown> = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: createTree(),
    columns: [{ data: 'id' }],
    rowHeaders: true,
    colHeaders: true,
    nestedRows: true,
    rowSelection,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
  const plugin = hot.getPlugin('rowSelection');

  return {
    hot,
    plugin,
    /**
     * The `checked` and `indeterminate` state of the row checkbox of a visual row.
     */
    checkboxState(row: number) {
      const input = hot.getCell(row, -1)?.querySelector<HTMLInputElement>('.htRowSelectionCheckbox');

      return input ? { checked: input.checked, indeterminate: input.indeterminate } : null;
    },
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('RowSelection with NestedRows', () => {
  describe('groupSelects: \'descendants\' (default)', () => {
    it('should show a parent as mixed on every level above a selected leaf', () => {
      const { plugin, checkboxState, destroy } = createGrid();

      plugin.selectRows([2]);

      expect(plugin.getSelectedRows()).toEqual([2]);
      expect(checkboxState(1)).toEqual({ checked: false, indeterminate: true });
      expect(checkboxState(0)).toEqual({ checked: false, indeterminate: true });
      expect(checkboxState(5)).toEqual({ checked: false, indeterminate: false });
      // the "select all" checkbox counts the leaves
      expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 5 });

      destroy();
    });

    it('should select every leaf under a parent, and report only the leaves to the hooks', () => {
      const afterChange = jest.fn();
      const { hot, plugin, checkboxState, destroy } = createGrid();

      hot.addHook('afterRowSelectionChange', afterChange);
      plugin.selectRows([0]);

      expect(afterChange).toHaveBeenCalledWith([2, 3, 4], [], 'api');
      // a parent whose leaves are all selected is selected too
      expect(plugin.getSelectedRows()).toEqual([0, 1, 2, 3, 4]);
      expect(plugin.getSelectedCount()).toBe(3);
      expect(checkboxState(0)).toEqual({ checked: true, indeterminate: false });
      expect(checkboxState(1)).toEqual({ checked: true, indeterminate: false });

      destroy();
    });

    it('should check a parent once its last leaf is selected, and clear its leaves when it is toggled again', () => {
      const { plugin, checkboxState, destroy } = createGrid();

      plugin.toggleRow(1);
      expect(checkboxState(0)).toEqual({ checked: false, indeterminate: true });

      plugin.toggleRow(4);
      expect(checkboxState(0)).toEqual({ checked: true, indeterminate: false });

      plugin.toggleRow(0);
      expect(plugin.getSelectedRows()).toEqual([]);
      expect(checkboxState(0)).toEqual({ checked: false, indeterminate: false });

      destroy();
    });

    it('should select the leaves of a mixed parent that are not selected yet', () => {
      const { plugin, destroy } = createGrid();

      plugin.selectRows([3]);
      plugin.toggleRow(0);

      expect(plugin.getSelectedRows()).toEqual([0, 1, 2, 3, 4]);

      destroy();
    });

    it('should select the leaves of collapsed parents with "select all", and keep counting them', () => {
      const { hot, plugin, destroy } = createGrid();

      hot.getPlugin('nestedRows').collapsingUI!.collapseChildren(0);

      expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'unchecked', selected: 0, total: 5 });

      plugin.toggleAll();

      expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'checked', selected: 5, total: 5 });
      expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      // visual rows: a (collapsed), b, b1, c
      expect(plugin.getSelectedRows()).toEqual([0, 1, 2, 3]);

      plugin.toggleAll();

      expect(plugin.getSelectedPhysicalRows()).toEqual([]);

      destroy();
    });

    it('should toggle the leaves of a collapsed parent from the parent', () => {
      const { hot, plugin, destroy } = createGrid();

      hot.getPlugin('nestedRows').collapsingUI!.collapseChildren(0);
      plugin.toggleRow(0);

      expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 2, 3, 4]);

      hot.getPlugin('nestedRows').collapsingUI!.expandChildren(0);

      expect(plugin.getSelectedRows()).toEqual([0, 1, 2, 3, 4]);

      destroy();
    });

    it('should make the rows under a parent that `isRowSelectable` rejects unselectable', () => {
      const { plugin, checkboxState, destroy } = createGrid({
        isRowSelectable: (rowData: { id: string }) => rowData.id !== 'a1',
      });

      expect(plugin.isRowSelectable(1)).toBe(false);
      expect(plugin.isRowSelectable(2)).toBe(false);
      expect(plugin.isRowSelectable(0)).toBe(true);

      plugin.toggleRow(0);

      // only a2 can be selected under a, so a is checked once it is
      expect(plugin.getSelectedPhysicalRows()).toEqual([0, 4]);
      expect(checkboxState(0)).toEqual({ checked: true, indeterminate: false });
      expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 1, total: 3 });

      destroy();
    });

    it('should toggle every row of a selected range with Space through the leaves', () => {
      const { hot, plugin, destroy } = createGrid();

      hot.selectCell(5, 0, 6, 0);
      hot.getShortcutManager().getContext('grid')!.getShortcuts([' '])[0]
        .callback(new KeyboardEvent('keydown', { key: ' ' }));

      expect(plugin.getSelectedRows()).toEqual([5, 6]);

      destroy();
    });

    it('should remove a fully selected parent with its rows, keep a mixed one, and undo it in one step', () => {
      const { hot, plugin, destroy } = createGrid(true, { undoRedo: true });

      // a1 with its leaves, and the top-level leaf c; a turns mixed, b stays unselected
      plugin.selectRows([1, 7]);

      const tree = () => hot.getPlugin('nestedRows').dataManager!.getData();

      expect(plugin.removeSelectedRows()).toBe(true);
      expect(tree()).toEqual([
        { id: 'a', __children: [{ id: 'a2' }] },
        { id: 'b', __children: [{ id: 'b1' }] },
      ]);

      hot.getPlugin('undoRedo').undo();

      expect(tree()).toEqual(createTree());

      destroy();
    });
  });

  it('should remove a selected collapsed parent with its hidden rows, and the selected rows below it', () => {
    const { hot, plugin, destroy } = createGrid();

    hot.getPlugin('nestedRows').collapsingUI!.collapseChildren(0);
    // visual rows: a (collapsed), b, b1, c
    plugin.selectRows([0, 3]);

    expect(plugin.removeSelectedRows()).toBe(true);
    expect(hot.getPlugin('nestedRows').dataManager!.getData()).toEqual([
      { id: 'b', __children: [{ id: 'b1' }] },
    ]);

    destroy();
  });

  describe('groupSelects: \'self\'', () => {
    it('should select every row on its own, at any level', () => {
      const { plugin, checkboxState, destroy } = createGrid({ groupSelects: 'self' });

      plugin.selectRows([0, 2]);

      expect(plugin.getSelectedRows()).toEqual([0, 2]);
      expect(checkboxState(1)).toEqual({ checked: false, indeterminate: false });
      expect(plugin.getHeaderCheckboxState()).toEqual({ state: 'mixed', selected: 2, total: 8 });

      destroy();
    });
  });

  it('should fall back to `\'self\'` in the `\'singleRow\'` mode', () => {
    const { plugin, destroy } = createGrid({ mode: 'singleRow' });

    plugin.selectRows([0]);

    expect(plugin.getSelectedRows()).toEqual([0]);

    plugin.selectRows([2]);

    expect(plugin.getSelectedRows()).toEqual([2]);

    destroy();
  });

  it('should keep the selection when `groupSelects` changes through `updateSettings()`', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.selectRows([2]);
    hot.updateSettings({ rowSelection: { groupSelects: 'self' } });

    expect(plugin.getSelectedRows()).toEqual([2]);

    destroy();
  });
});
