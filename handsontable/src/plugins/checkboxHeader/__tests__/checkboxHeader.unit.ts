import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

interface Task {
  name: string;
  done: unknown;
  status: string;
}

/**
 * Builds a grid of six tasks with a `done` checkbox column (rows 1 and 3 done).
 */
function createGrid(settings: Record<string, unknown> = {}, doneColumn: Record<string, unknown> = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: Array.from({ length: 6 }, (_, index) => ({
      name: `Task ${index}`,
      done: index === 1 || index === 3,
      status: index % 2 ? 'odd' : 'even',
    })),
    columns: [
      { data: 'name' },
      { data: 'done', type: 'checkbox', headerCheckbox: true, ...doneColumn },
      { data: 'status' },
    ],
    colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  return {
    hot,
    plugin: hot.getPlugin('checkboxHeader'),
    done: () => (hot.getSourceData() as Task[]).map(row => row.done),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('CheckboxHeader', () => {
  it('should only give a header checkbox to checkbox columns that ask for it', () => {
    const { plugin, destroy } = createGrid({
      columns: [
        { data: 'name', headerCheckbox: true },
        { data: 'done', type: 'checkbox' },
        { data: 'done', type: 'checkbox', headerCheckbox: true },
      ],
    });

    expect(plugin.hasHeaderCheckbox(0)).toBe(false);
    expect(plugin.hasHeaderCheckbox(1)).toBe(false);
    expect(plugin.hasHeaderCheckbox(2)).toBe(true);
    expect(plugin.hasHeaderCheckbox(-1)).toBe(false);

    destroy();
  });

  it('should count the checked cells for the header state', () => {
    const { plugin, destroy } = createGrid();

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 6 });

    destroy();
  });

  it('should draw the tick of the header checkbox as an icon next to it, and a dash for the mixed state', () => {
    const { hot, plugin, destroy } = createGrid();
    const icon = () => hot.rootElement.querySelector('.htCheckboxHeaderInput')?.nextElementSibling;

    expect(icon()?.classList.contains('ht-icon-collapse-off')).toBe(true);

    plugin.toggleColumn(1);

    expect(icon()?.classList.contains('ht-icon-checkbox')).toBe(true);

    destroy();
  });

  it('should listen to source data writes only while a column shows a "check all" checkbox', () => {
    // AutoColumnSize listens to the same hook; with it off, the plugin's listener is the only one.
    const { hot, destroy } = createGrid({ autoColumnSize: false }, { headerCheckbox: false });

    // The plugin is on in every grid: without a header checkbox it must not make
    // `setSourceDataAtCell()` build the hook's payload (and run the `valueSetter` for it).
    expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(false);

    hot.updateSettings({ columns: [{ data: 'name' }, { data: 'done', type: 'checkbox', headerCheckbox: true }] });

    expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(true);

    hot.updateSettings({ columns: [{ data: 'name' }, { data: 'done', type: 'checkbox' }] });

    expect(hot.hasHook('afterSetSourceDataAtCell')).toBe(false);

    destroy();
  });

  it('should follow a source data write in the header state', () => {
    const { hot, plugin, destroy } = createGrid();

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 6 });

    hot.setSourceDataAtCell(0, 'done', true);

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 3, total: 6 });

    destroy();
  });

  it('should check every cell from the mixed state, and uncheck every cell from the checked state', () => {
    const { plugin, done, destroy } = createGrid();

    expect(plugin.toggleColumn(1)).toBe(true);
    expect(done()).toEqual([true, true, true, true, true, true]);
    expect(plugin.getHeaderCheckboxState(1).state).toBe('checked');

    expect(plugin.toggleColumn(1)).toBe(true);
    expect(done()).toEqual([false, false, false, false, false, false]);
    expect(plugin.getHeaderCheckboxState(1).state).toBe('unchecked');

    destroy();
  });

  it('should write the column\'s own templates', () => {
    const { plugin, done, destroy } = createGrid({}, { checkedTemplate: 'Yes', uncheckedTemplate: 'No' });

    // With `'Yes'`/`'No'` templates a boolean reads as unchecked (as `checkboxRenderer` reads it), so
    // unchecking finds nothing to change.
    expect(plugin.setColumnChecked(1, false)).toBe(false);
    expect(done()).toEqual([false, true, false, true, false, false]);

    plugin.setColumnChecked(1, true);

    expect(done()).toEqual(['Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes']);

    destroy();
  });

  it('should skip read-only cells, and leave them out of the count', () => {
    const { hot, plugin, done, destroy } = createGrid({
      cells(row: number, column: number) {
        return row === 0 && column === 1 ? { readOnly: true } : {};
      },
    });

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 5 });

    plugin.setColumnChecked(1, true);

    expect(done()).toEqual([false, true, true, true, true, true]);
    expect(plugin.getHeaderCheckboxState(1).state).toBe('checked');
    expect(hot.getDataAtCell(0, 1)).toBe(false);

    destroy();
  });

  it('should write only the rows that pass the filters by default', () => {
    const { hot, plugin, done, destroy } = createGrid({ filters: true });
    const filters = hot.getPlugin('filters');

    filters.addCondition(2, 'eq', ['even']);
    filters.filter();
    plugin.setColumnChecked(1, true);

    // Rows 0, 2, and 4 pass the filter; row 5 (filtered out, unchecked) is left alone.
    expect(done()).toEqual([true, true, true, true, true, false]);

    destroy();
  });

  it('should also write the rows the filters hide with the "all" scope', () => {
    const { hot, plugin, done, destroy } = createGrid({ filters: true }, { headerCheckbox: { scope: 'all' } });
    const filters = hot.getPlugin('filters');

    filters.addCondition(2, 'eq', ['even']);
    filters.filter();
    plugin.setColumnChecked(1, true);

    expect(done()).toEqual([true, true, true, true, true, true]);

    destroy();
  });

  it('should keep a read-only cell of a row the filters removed out of the "all" scope (`cells` option)', () => {
    const { hot, plugin, done, destroy } = createGrid({
      filters: true,
      // Physical row 5 (unchecked, status 'odd') is read-only, and the filter below removes it.
      cells(row: number, column: number) {
        return row === 5 && column === 1 ? { readOnly: true } : {};
      },
    }, { headerCheckbox: { scope: 'all' } });
    const filters = hot.getPlugin('filters');

    filters.addCondition(2, 'eq', ['even']);
    filters.filter();

    expect(hot.toVisualRow(5)).toBe(null);
    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 5 });

    plugin.setColumnChecked(1, true);

    expect(done()).toEqual([true, true, true, true, true, false]);
    expect(plugin.getHeaderCheckboxState(1).state).toBe('checked');

    destroy();
  });

  it('should keep a read-only cell of a row the filters removed out of the "all" scope (`setCellMeta()`)', () => {
    const { hot, plugin, done, destroy } = createGrid({ filters: true }, { headerCheckbox: { scope: 'all' } });
    const filters = hot.getPlugin('filters');

    hot.setCellMeta(5, 1, 'readOnly', true);
    filters.addCondition(2, 'eq', ['even']);
    filters.filter();

    expect(hot.toVisualRow(5)).toBe(null);
    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 5 });

    plugin.setColumnChecked(1, true);

    expect(done()).toEqual([true, true, true, true, true, false]);

    destroy();
  });

  it('should toggle the column on a tap on the header checkbox (a touch event has no `button`)', () => {
    const { hot, done, destroy } = createGrid();
    const input = hot.rootElement.querySelector('.htCheckboxHeaderInput')!;
    // Walkontable hands the deferred `touchend` to `beforeOnCellMouseDown`; the event only needs a
    // target, so it is dispatched under a type no grid listener handles.
    const tap = new TouchEvent('checkbox-header-test-tap', { bubbles: true, cancelable: true });

    input.dispatchEvent(tap);

    expect((tap as unknown as MouseEvent).button).toBe(undefined);

    hot.runHooks('beforeOnCellMouseDown', tap, hot._createCellCoords(-1, 1), input.closest('th'));

    expect(done()).toEqual([true, true, true, true, true, true]);
    expect(tap.defaultPrevented).toBe(true);

    destroy();
  });

  it('should ignore a press with a button other than the main one', () => {
    const { hot, done, destroy } = createGrid();
    const input = hot.rootElement.querySelector('.htCheckboxHeaderInput')!;
    const press = new MouseEvent('checkbox-header-test-press', { bubbles: true, button: 2 });

    input.dispatchEvent(press);
    hot.runHooks('beforeOnCellMouseDown', press, hot._createCellCoords(-1, 1), input.closest('th'));

    expect(done()).toEqual([false, true, false, true, false, false]);

    destroy();
  });

  it('should re-read only the edited rows after an edit, not the whole column', () => {
    const readRows = new Set<number>();
    const { hot, plugin, destroy } = createGrid({
      data: Array.from({ length: 200 }, (_, index) => ({ name: `Task ${index}`, done: false, status: 'even' })),
      cells(row: number, column: number) {
        if (column === 1) {
          readRows.add(row);
        }

        return {};
      },
    });

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'unchecked', selected: 0, total: 200 });
    expect(readRows.size).toBe(200);

    // The render is suspended so that only the header's own reads are counted, not the cell renders.
    hot.suspendRender();

    // An edit in another column re-reads that row only (its meta can follow the row's values).
    readRows.clear();
    hot.setDataAtCell(150, 0, 'Renamed');

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'unchecked', selected: 0, total: 200 });
    expect([...readRows]).toEqual([150]);

    // An edit in the column moves the counts without a rescan.
    readRows.clear();
    hot.setDataAtCell(120, 1, true);

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 1, total: 200 });
    expect([...readRows]).toEqual([120]);

    hot.resumeRender();
    destroy();
  });

  it('should follow a `cells` function that makes a checkbox read-only by another column\'s value', () => {
    const { hot, plugin, destroy } = createGrid({
      cells(this: { instance: Handsontable }, row: number, column: number) {
        const status = (this.instance.getSourceDataAtRow(row) as Task).status;

        return column === 1 && status === 'locked' ? { readOnly: true } : {};
      },
    });

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 6 });

    hot.setDataAtCell(1, 2, 'locked');

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 1, total: 5 });

    destroy();
  });

  it('should update the header state after `setCellMeta()` and `removeCellMeta()`', () => {
    const { hot, plugin, destroy } = createGrid();

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 6 });

    hot.setCellMeta(1, 1, 'readOnly', true);

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 1, total: 5 });

    hot.removeCellMeta(1, 1, 'readOnly');

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 2, total: 6 });

    destroy();
  });

  it('should update the header after an undo and a redo of a cell meta change', () => {
    const { hot, plugin, destroy } = createGrid({ undoRedo: true });
    const input = () => hot.rootElement.querySelector<HTMLInputElement>('.htCheckboxHeaderInput')!;

    hot.setDataAtCell([[0, 1, true], [2, 1, true], [4, 1, true], [5, 1, true]]);
    hot.setCellMeta(1, 1, 'readOnly', true);
    hot.setDataAtCell(1, 1, false, 'test');

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'checked', selected: 5, total: 5 });

    hot.removeCellMeta(1, 1, 'readOnly');

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 5, total: 6 });

    hot.getPlugin('undoRedo').undo();

    expect(hot.getCellMeta(1, 1).readOnly).toBe(true);
    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'checked', selected: 5, total: 5 });
    expect(input().checked).toBe(true);

    hot.getPlugin('undoRedo').redo();

    expect(hot.getCellMeta(1, 1).readOnly).toBe(false);
    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 5, total: 6 });
    expect(input().indeterminate).toBe(true);

    destroy();
  });

  it('should not re-enter its own read when a meta hook calls `setCellMeta()`', () => {
    const { hot, plugin, destroy } = createGrid({
      afterGetCellMeta(this: Handsontable, row: number, column: number) {
        if (column === 1) {
          this.setCellMeta(row, column, 'checkedByHook', true);
        }
      },
    });

    hot.setDataAtCell(0, 1, true);

    expect(plugin.getHeaderCheckboxState(1)).toEqual({ state: 'mixed', selected: 3, total: 6 });

    destroy();
  });

  it('should undo a "check all" in one step', () => {
    const { hot, plugin, done, destroy } = createGrid({ undoRedo: true });

    plugin.toggleColumn(1);
    hot.getPlugin('undoRedo').undo();

    expect(done()).toEqual([false, true, false, true, false, false]);
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);

    destroy();
  });

  it('should update the header state after a cell edit', () => {
    const { hot, plugin, destroy } = createGrid();

    expect(plugin.getHeaderCheckboxState(1).selected).toBe(2);

    hot.setDataAtCell(0, 1, true);

    expect(plugin.getHeaderCheckboxState(1).selected).toBe(3);

    destroy();
  });

  it('should step aside for the column RowSelection uses as its selection', () => {
    const { plugin, destroy } = createGrid({ rowSelection: { checkboxLocation: { column: 'done' } } });

    expect(plugin.hasHeaderCheckbox(1)).toBe(false);
    expect(plugin.toggleColumn(1)).toBe(false);

    destroy();
  });

  it('should not toggle the column with Space while an overlay covers the grid body', () => {
    const { hot, done, destroy } = createGrid({ navigableHeaders: true });
    const cover = document.createElement('div');
    const pressSpace = () => {
      const init = { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true, cancelable: true };

      hot.listen();
      hot.rootDocument.documentElement.dispatchEvent(new KeyboardEvent('keydown', init));
      hot.rootDocument.documentElement.dispatchEvent(new KeyboardEvent('keyup', init));
    };

    hot.rootElement.appendChild(cover);
    hot.getFocusScopeManager().registerScope('testCover', cover, { coversGridBody: true });
    hot.selectCell(-1, 1);
    pressSpace();

    expect(done()).toEqual([false, true, false, true, false, false]);

    hot.getFocusScopeManager().unregisterScope('testCover');
    hot.selectCell(-1, 1);
    pressSpace();

    expect(done()).toEqual([true, true, true, true, true, true]);

    destroy();
  });

  it('should not map the changed rows of an edit when no column shows a "check all" checkbox', () => {
    const countRowMappings = (pluginEnabled: boolean) => {
      const { hot, plugin, destroy } = createGrid({}, { headerCheckbox: false });

      if (!pluginEnabled) {
        plugin.disablePlugin();
      }

      const toPhysicalRow = jest.spyOn(hot, 'toPhysicalRow');

      hot.setDataAtCell([[0, 0, 'a'], [1, 0, 'b'], [2, 0, 'c']]);

      const calls = toPhysicalRow.mock.calls.length;

      destroy();

      return calls;
    };

    // The plugin adds no mapping of its own to what core does for the edit.
    expect(countRowMappings(true)).toBe(countRowMappings(false));
  });

  it('should leave the header of the column RowSelection draws into with `checkboxLocation: \'firstColumn\'`', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { hot, plugin, destroy } = createGrid({
      columns: [
        { data: 'done', type: 'checkbox', headerCheckbox: true },
        { data: 'name' },
      ],
      rowSelection: { checkboxLocation: 'firstColumn' },
    });
    const headerCheckboxes = () => hot.getCell(-1, 0)!.querySelectorAll('input[type="checkbox"]');

    expect(plugin.hasHeaderCheckbox(0)).toBe(false);
    // Only the "select all" checkbox of RowSelection.
    expect(headerCheckboxes()).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('draws the row checkboxes into a checkbox column'));

    hot.render();

    expect(warnSpy).toHaveBeenCalledTimes(1);

    hot.updateSettings({ rowSelection: false });

    expect(plugin.hasHeaderCheckbox(0)).toBe(true);
    expect(headerCheckboxes()).toHaveLength(1);

    warnSpy.mockRestore();
    destroy();
  });
});
