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
});
