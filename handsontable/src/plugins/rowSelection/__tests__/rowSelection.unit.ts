import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { injectRealCoreStyles, removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';

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

/**
 * The corner above the plugin's row header column (the column coordinate `-1`).
 */
function cornerOf(hot: Handsontable) {
  return hot.getCell(-1, -1, true) as HTMLElement;
}

/**
 * Presses the left mouse button on an element, as Walkontable receives it.
 */
function mouseDown(element: Element, init: MouseEventInit = {}) {
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ...init }));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, ...init }));
}

/**
 * Presses the left mouse button on a data cell.
 */
function cellMouseDown(hot: Handsontable, row: number, column: number, init: MouseEventInit = {}) {
  mouseDown(hot.getCell(row, column)!, init);
}

/**
 * Presses Space through the shortcut manager's real keyboard path, so the shortcuts' `runOnlyIf`
 * guards run.
 */
function pressSpace(hot: Handsontable) {
  const { documentElement } = hot.rootDocument;
  const init = { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true, cancelable: true };

  hot.listen();
  documentElement.dispatchEvent(new KeyboardEvent('keydown', init));
  documentElement.dispatchEvent(new KeyboardEvent('keyup', init));
}

describe('RowSelection', () => {
  afterEach(() => {
    removeRealCoreStyles();
  });

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

  it('should draw the tick of every checkbox as an icon next to it, and a dash for the mixed state', () => {
    const { hot, plugin, destroy } = createGrid({}, 3);
    const iconOf = (selector: string) => hot.rootElement
      .querySelector(`${selector} .htRowSelectionCheckbox`)?.nextElementSibling;

    expect(iconOf('.htRowSelectionCell')?.classList.contains('ht-icon-checkbox')).toBe(true);
    expect(iconOf('.htRowSelectionHeader')?.classList.contains('ht-icon-checkbox')).toBe(true);

    plugin.selectRows([0]);

    expect(iconOf('.htRowSelectionHeader')?.classList.contains('ht-icon-collapse-off')).toBe(true);

    plugin.selectRows([1, 2]);

    expect(iconOf('.htRowSelectionHeader')?.classList.contains('ht-icon-checkbox')).toBe(true);
    expect(hot.rootElement.querySelectorAll('.htRowSelectionCheckboxBox > .ht-icon').length)
      .toBe(hot.rootElement.querySelectorAll('.htRowSelectionCheckboxBox > .htRowSelectionCheckbox').length);

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
    // jsdom loads no theme, so the column takes the fallbacks: a 16px checkbox, 8px of padding on
    // each side, and the 1px cell border.
    expect(widths[1]).toBe(33);

    destroy();
  });

  describe('the corner without the "select all" checkbox', () => {
    it.each([
      ['headerCheckbox: false', { headerCheckbox: false }],
      ['the "singleRow" mode', { mode: 'singleRow' }],
    ])('should render a plain corner that selects the grid with %s', (_, rowSelection) => {
      const { hot, plugin, destroy } = createGrid({ rowSelection });
      const corner = cornerOf(hot);

      expect(corner.querySelector('.htRowSelectionCheckbox')).toBeNull();
      expect(corner.classList.contains('htRowSelectionHeader')).toBe(false);
      expect(corner.classList.contains('htRowSelectionCorner')).toBe(false);

      mouseDown(corner);

      expect(plugin.getSelectedRows()).toEqual([]);
      // The press is not swallowed: the corner selects the whole grid, from the first row header
      // column, as a corner without the plugin does.
      expect(hot.getSelectedLast()).toEqual([-1, -2, 5, 1]);

      destroy();
    });

    it('should not toggle every row with Space on a corner without the "select all" checkbox', () => {
      const { hot, plugin, destroy } = createGrid({ rowSelection: { headerCheckbox: false }, navigableHeaders: true });

      hot.selectCell(-1, -1);
      pressSpace(hot);

      expect(plugin.getSelectedRows()).toEqual([]);

      destroy();
    });

    it('should select every row from the corner with the "select all" checkbox on', () => {
      const { hot, plugin, destroy } = createGrid();

      mouseDown(cornerOf(hot));

      expect(plugin.getSelectedRows()).toEqual([0, 1, 2, 3, 4, 5]);

      destroy();
    });
  });

  describe('a row with no checkbox', () => {
    const checkboxes = (_rowData: unknown, physicalRow: number) => physicalRow !== 1;

    it('should not toggle the row from its row header cell, by click or by Space', () => {
      const { hot, plugin, destroy } = createGrid({ rowSelection: { checkboxes }, navigableHeaders: true });
      const header = hot.getCell(1, -1, true) as HTMLElement;

      expect(header.querySelector('.htRowSelectionCheckbox')).toBeNull();
      expect(header.classList.contains('htRowSelectionCell')).toBe(false);

      mouseDown(header);

      expect(plugin.getSelectedRows()).toEqual([]);

      hot.selectCell(1, -1);
      pressSpace(hot);

      expect(plugin.getSelectedRows()).toEqual([]);

      // a row with a checkbox, for contrast
      mouseDown(hot.getCell(0, -1, true) as HTMLElement);

      expect(plugin.getSelectedRows()).toEqual([0]);

      destroy();
    });

    it.each([
      ['`checkboxes` returns false', { checkboxes }],
      ['`hideDisabledCheckboxes` hides it', {
        hideDisabledCheckboxes: true,
        isRowSelectable: (_rowData: unknown, physicalRow: number) => physicalRow !== 1,
      }],
    ])('should keep a hidden placeholder in the first column when %s, and not toggle the row', (_, settings) => {
      const { hot, plugin, destroy } = createGrid({
        rowSelection: { checkboxLocation: 'firstColumn', ...settings },
      });
      const placeholder = hot.getCell(1, 0)!.querySelector<HTMLInputElement>('.htRowSelectionCheckbox')!;

      // The placeholder keeps the values of every row at the same offset.
      expect(placeholder).not.toBeNull();
      expect(placeholder.classList.contains('htRowSelectionCheckboxHidden')).toBe(true);
      expect(placeholder.disabled).toBe(true);
      expect(hot.getCell(0, 0)!.querySelector('.htRowSelectionCheckboxHidden')).toBeNull();

      mouseDown(placeholder);

      expect(plugin.getSelectedPhysicalRows()).toEqual([]);

      destroy();
    });
  });

  it('should toggle the row with Space on a first column checkbox without opening the editor', () => {
    const { hot, plugin, destroy } = createGrid({ rowSelection: { checkboxLocation: 'firstColumn' } });

    hot.selectCell(1, 0);
    hot.listen();
    hot.rootDocument.documentElement.dispatchEvent(new KeyboardEvent('keydown', {
      key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true, cancelable: true,
    }));

    expect(plugin.getSelectedPhysicalRows()).toEqual([1]);
    expect(hot.getActiveEditor()?.isOpened()).toBe(false);

    destroy();
  });

  it('should resolve the row checks once per draw, not once per painted cell', () => {
    injectRealCoreStyles();

    const countDuringRender = (rowSelection: boolean | Record<string, unknown>) => {
      const { hot, destroy } = createGrid({ rowSelection }, 6);
      const getNumberOfIndexes = jest.spyOn(hot.rowIndexMapper, 'getNumberOfIndexes');

      hot.render();

      const calls = getNumberOfIndexes.mock.calls.length;

      destroy();

      return calls;
    };
    const withoutPlugin = countDuringRender(false);
    const withPlugin = countDuringRender(true);

    // Six rows of two cells and a row header each: a per-cell build would add over a dozen calls.
    expect(withPlugin - withoutPlugin).toBeLessThanOrEqual(2);
    // `hideDisabledCheckboxes` asks every painted row whether it can be selected.
    expect(countDuringRender({ hideDisabledCheckboxes: true }) - withoutPlugin).toBeLessThanOrEqual(2);
  });

  it('should paint a selection made in the same task as an earlier draw', () => {
    const { hot, plugin, destroy } = createGrid({}, 3);

    hot.render();
    plugin.selectRows([1]);

    expect(hot.getCell(1, 0)?.classList.contains('htRowSelected')).toBe(true);

    plugin.deselectRows([1]);

    expect(hot.getCell(1, 0)?.classList.contains('htRowSelected')).toBe(false);

    destroy();
  });

  describe('rows out of every scope', () => {
    it('should leave the rows HiddenRows hides out of a Shift+click range', () => {
      // Rows past the second are outside the jsdom viewport under the Jest core styles stub.
      injectRealCoreStyles();

      const { hot, plugin, destroy } = createGrid({
        hiddenRows: { rows: [2] },
        rowSelection: { enableClickSelection: true },
      });

      cellMouseDown(hot, 0, 0);
      cellMouseDown(hot, 4, 0, { shiftKey: true });

      expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 3, 4]);

      destroy();
    });

    it('should select the rows of other pages that a Shift+click range spans', () => {
      // Rows past the second are outside the jsdom viewport under the Jest core styles stub.
      injectRealCoreStyles();

      const { hot, plugin, destroy } = createGrid({
        pagination: { pageSize: 2 },
        rowSelection: { enableClickSelection: true },
      });

      cellMouseDown(hot, 1, 0);
      hot.getPlugin('pagination').setPage(3);
      cellMouseDown(hot, 4, 0, { shiftKey: true });

      expect(plugin.getSelectedPhysicalRows()).toEqual([1, 2, 3, 4]);

      destroy();
    });

    it('should leave the rows HiddenRows hides out of a range toggled with Space', () => {
      const { hot, plugin, destroy } = createGrid({ hiddenRows: { rows: [2] } });

      hot.selectCell(0, 1, 4, 1);
      pressSpace(hot);

      expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 3, 4]);

      destroy();
    });
  });

  it('should count in the remove menu item only the rows the action removes', () => {
    const { hot, plugin, destroy } = createGrid({ filters: true });
    const options = { items: [] as Array<{ key: string; name: (this: unknown) => string; disabled: () => boolean;
      hidden: () => boolean; callback: (this: unknown) => void; }> };

    hot.runHooks('afterContextMenuDefaultOptions', options);

    const remove = options.items.find(item => item.key === 'row_selection_remove')!;
    const filters = hot.getPlugin('filters');

    plugin.selectAll();
    filters.addCondition(1, 'eq', ['even']);
    filters.filter();

    // Six rows are selected, but the three filtered out are not removed.
    expect(plugin.getSelectedCount()).toBe(6);
    expect(remove.name.call(hot)).toBe('Remove selected rows (3)');

    remove.callback.call(hot);

    expect((hot.getSourceData() as Array<{ id: number }>).map(row => row.id)).toEqual([1, 3, 5]);

    // Only filtered-out rows are selected now: nothing to remove.
    filters.clearConditions();
    filters.addCondition(1, 'eq', ['none']);
    filters.filter();

    expect(remove.hidden()).toBe(false);
    expect(remove.name.call(hot)).toBe('Remove selected rows (0)');
    expect(remove.disabled()).toBe(true);

    destroy();
  });

  it('should keep only the anchor row selected after switching to the "singleRow" mode', () => {
    // Rows past the second are outside the jsdom viewport under the Jest core styles stub.
    injectRealCoreStyles();

    const { hot, plugin, destroy } = createGrid({ rowSelection: { enableClickSelection: true } });

    plugin.selectRows([0, 4]);
    cellMouseDown(hot, 2, 0, { ctrlKey: true });

    expect(plugin.getSelectedRows()).toEqual([0, 2, 4]);

    hot.updateSettings({ rowSelection: { mode: 'singleRow', enableClickSelection: true } });

    expect(plugin.getSelectedRows()).toEqual([2]);

    destroy();
  });

  it('should keep the last selected row after switching to the "singleRow" mode with no anchor', () => {
    const { hot, plugin, destroy } = createGrid();

    plugin.selectRows([0, 4, 3]);
    hot.updateSettings({ rowSelection: { mode: 'singleRow' } });

    expect(plugin.getSelectedRows()).toEqual([4]);

    destroy();
  });

  it('should not move the Shift+click anchor to a row whose toggle was vetoed', () => {
    // Rows past the second are outside the jsdom viewport under the Jest core styles stub.
    injectRealCoreStyles();

    const { hot, plugin, destroy } = createGrid({
      rowSelection: { enableClickSelection: true },
      beforeRowSelectionChange: (rowsToSelect: number[]) => !(rowsToSelect.length === 1 && rowsToSelect[0] === 1),
    });

    cellMouseDown(hot, 1, 0, { ctrlKey: true });

    expect(plugin.getSelectedRows()).toEqual([]);

    cellMouseDown(hot, 3, 0, { shiftKey: true });

    // With no anchor, a Shift+click toggles its own row only.
    expect(plugin.getSelectedRows()).toEqual([3]);

    destroy();
  });

  it('should toggle a row on a tap: the deferred `touchstart` Walkontable passes has no mouse button', () => {
    const { hot, plugin, destroy } = createGrid();
    const header = hot.getCell(1, -1, true) as HTMLElement;
    const checkbox = header.querySelector('.htRowSelectionCheckbox')!;
    const touchEvent = new TouchEvent('touchstart', { bubbles: true, cancelable: true });

    Object.defineProperty(touchEvent, 'target', { value: checkbox });
    hot.runHooks('beforeOnCellMouseDown', touchEvent, { row: 1, col: -1 }, header);

    expect(plugin.getSelectedRows()).toEqual([1]);

    destroy();
  });

  it('should remove the "select all" checkbox from the headers when the plugin is disabled', () => {
    ['firstColumn', 'rowHeader'].forEach((checkboxLocation) => {
      const { hot, destroy } = createGrid({ rowSelection: { checkboxLocation } });
      const headerCheckboxes = () => hot.rootElement
        .querySelectorAll('th .htRowSelectionCheckboxBox, th.htRowSelectionHeader, th.htRowSelectionCorner');

      expect(headerCheckboxes().length).toBeGreaterThan(0);

      hot.updateSettings({ rowSelection: false });

      expect(headerCheckboxes().length).toBe(0);

      destroy();
    });
  });

  it('should keep the selection by row position on `updateData()`, and clear it on `loadData()`', () => {
    const { hot, plugin, destroy } = createGrid();
    const afterRowSelectionChange = jest.fn();
    const otherRecords = () => Array.from({ length: 6 }, (_, index) => ({ id: index + 10, status: 'new' }));

    plugin.selectRows([0, 2]);
    hot.addHook('afterRowSelectionChange', afterRowSelectionChange);
    hot.updateData(otherRecords());

    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 2]);
    expect(afterRowSelectionChange).not.toHaveBeenCalled();

    hot.loadData(otherRecords());

    expect(plugin.getSelectedPhysicalRows()).toEqual([]);

    destroy();
  });

  it('should not toggle rows with Space while an overlay covers the grid body', () => {
    const { hot, plugin, destroy } = createGrid({
      navigableHeaders: true,
      rowSelection: { checkboxLocation: 'firstColumn' },
    });
    const cover = document.createElement('div');

    hot.rootElement.appendChild(cover);
    hot.getFocusScopeManager().registerScope('testCover', cover, { coversGridBody: true });

    hot.selectCell(1, 0); // A first column checkbox.
    pressSpace(hot);
    hot.selectCell(2, 1); // A data cell.
    pressSpace(hot);
    hot.selectCell(-1, 0); // The "select all" checkbox.
    pressSpace(hot);

    expect(plugin.getSelectedPhysicalRows()).toEqual([]);

    hot.getFocusScopeManager().unregisterScope('testCover');
    hot.selectCell(2, 1);
    pressSpace(hot);

    expect(plugin.getSelectedPhysicalRows()).toEqual([2]);

    hot.selectCell(-1, 0);
    pressSpace(hot);

    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 2, 3, 4, 5]);

    destroy();
  });

  it('should announce the count, not a row number, when the only changed row has no visual index', () => {
    const { hot, plugin, destroy } = createGrid({ filters: true });
    const filters = hot.getPlugin('filters');

    plugin.selectRows([0, 2, 3, 4, 5]);
    filters.addCondition(1, 'eq', ['even']);
    filters.filter();

    const getTranslatedPhrase = jest.spyOn(hot, 'getTranslatedPhrase');

    // Mixed in the "all" scope: the header press selects the one row left, physical 1, filtered out.
    mouseDown(cornerOf(hot).querySelector('.htRowSelectionCheckbox')!);

    expect(plugin.getSelectedPhysicalRows()).toEqual([0, 1, 2, 3, 4, 5]);

    const phrases = getTranslatedPhrase.mock.calls.map(([key]) => key);

    expect(phrases).toContain('RowSelection:announce.count');
    expect(phrases).not.toContain('RowSelection:announce.rowSelected');

    destroy();
  });
});
