import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows, TrimRows, UndoRedo } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(NestedRows);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);

/**
 * A collapse or an expand the user asked for moves the selection with its rows (DEV-509). Only that
 * path opts in (`Selection#followRecordsWhile()`): a replay of a collapsed state and any other
 * trimming change keep the default repair, which leaves the visual coordinates where they are.
 */
describe('NestedRows selection across a collapse or an expand', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid of two parents with two children each. Physical rows:
   * A (0), A1 (1), A2 (2), B (3), B1 (4), B2 (5).
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [
        { name: 'A', __children: [{ name: 'A1' }, { name: 'A2' }] },
        { name: 'B', __children: [{ name: 'B1' }, { name: 'B2' }] },
      ],
      columns: [{ data: 'name' }],
      rowHeaders: true,
      nestedRows: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the names of the rows each selection layer covers.
   *
   * @returns {string[][]}
   */
  function selectedNames() {
    return (hot.getSelected() ?? []).map(([fromRow, , toRow]) => {
      const names = [];

      for (let row = Math.min(fromRow, toRow); row <= Math.max(fromRow, toRow); row++) {
        names.push(hot.getDataAtCell(row, 0));
      }

      return names;
    });
  }

  it('moves a selection below an expanded parent down with its rows', () => {
    buildGrid();

    const plugin = hot.getPlugin('nestedRows');

    plugin.collapseParent(0);
    hot.selectRows(1, 2);

    expect(selectedNames()).toEqual([['B', 'B1']]);

    plugin.expandParent(0);

    expect(selectedNames()).toEqual([['B', 'B1']]);
    expect(hot.getSelected()).toEqual([[3, -1, 4, 0]]);
  });

  it('keeps a range between its two rows when an expand reveals rows inside it', () => {
    buildGrid();

    const plugin = hot.getPlugin('nestedRows');

    plugin.collapseParent(0);
    hot.selectRows(0, 1);

    expect(selectedNames()).toEqual([['A', 'B']]);

    plugin.expandParent(0);

    expect(selectedNames()).toEqual([['A', 'A1', 'A2', 'B']]);

    plugin.collapseParent(0);

    expect(selectedNames()).toEqual([['A', 'B']]);
  });

  it('runs the selection hooks once for a toggle that moved the selection, and not otherwise', () => {
    const afterSelectionEnd = jest.fn();

    buildGrid({ afterSelectionEnd });

    const plugin = hot.getPlugin('nestedRows');

    hot.selectCell(3, 0);
    afterSelectionEnd.mockClear();

    plugin.collapseParent(0);

    expect(afterSelectionEnd).toHaveBeenCalledTimes(1);
    expect(afterSelectionEnd.mock.calls[0].slice(0, 4)).toEqual([1, 0, 1, 0]);

    afterSelectionEnd.mockClear();
    // B sits on the selected row itself, so collapsing it moves nothing.
    plugin.collapseParent(1);

    expect(afterSelectionEnd).not.toHaveBeenCalled();
  });

  it('drops the selection when the focused row itself is collapsed away', () => {
    const afterDeselect = jest.fn();

    buildGrid({ afterDeselect });

    // The focus is on B1 and the range reaches up to A2, which survives the collapse. Shrinking the
    // range onto A2 would move the focus to a row the user never picked.
    hot.selectCell(4, 0, 2, 0);
    // The grid is not listening here, so the plugin does not put a selection on the parent.
    hot.unlisten();
    hot.getPlugin('nestedRows').collapseParent(3);

    expect(hot.getSelected()).toBeUndefined();
    expect(afterDeselect).toHaveBeenCalledTimes(1);
  });

  it('keeps the focus in the layer it was in when several layers move', () => {
    buildGrid();

    const plugin = hot.getPlugin('nestedRows');

    plugin.collapseParent(0);
    hot.selectCells([[1, 0, 1, 0], [2, 0, 2, 0], [3, 0, 3, 0]]);
    // Moves the focus from the last layer (B2) to the first one (B).
    hot.selection.transformFocus(1, 0);

    expect(hot.getSelectedRangeActive().highlight.row).toBe(1);

    plugin.expandParent(0);

    expect(hot.getSelected()).toEqual([[3, 0, 3, 0], [4, 0, 4, 0], [5, 0, 5, 0]]);
    expect(hot.getSelectedRangeActive().highlight.row).toBe(3);
    expect(hot.getDataAtCell(hot.getSelectedRangeActive().highlight.row, 0)).toBe('B');
  });

  it('reports the range and the level of the active layer last when the focus is not in the last layer', () => {
    const afterSelection = jest.fn();

    buildGrid({ afterSelection });

    const plugin = hot.getPlugin('nestedRows');

    plugin.collapseParent(0);
    hot.selectCells([[1, 0, 1, 0], [2, 0, 3, 0]]);
    // Moves the focus from the last layer (B1) to the first one (B).
    hot.selection.transformFocus(2, 0);

    expect(hot.getSelectedRangeActive().highlight.row).toBe(1);

    afterSelection.mockClear();
    plugin.expandParent(0);

    const lastCall = afterSelection.mock.calls.at(-1);

    // The first layer (B) is the active one, so it is laid last and reported with its own level.
    expect(lastCall.slice(0, 4)).toEqual([3, 0, 3, 0]);
    expect(lastCall[5]).toBe(0);
    // Every layer is reported once, each with its own range and level.
    expect(afterSelection.mock.calls.map(call => [...call.slice(0, 4), call[5]])).toEqual([
      [4, 0, 5, 0, 1],
      [3, 0, 3, 0, 0],
    ]);
  });

  it('keeps the viewport following later selections when an afterSelection listener throws during a re-lay', () => {
    buildGrid();

    const plugin = hot.getPlugin('nestedRows');

    plugin.collapseParent(0);
    hot.selectCells([[1, 0, 1, 0], [2, 0, 3, 0]]);
    hot.selection.transformFocus(2, 0);

    let shouldThrow = true;

    hot.addHook('afterSelection', () => {
      if (shouldThrow) {
        shouldThrow = false;

        throw new Error('listener failure');
      }
    });

    expect(() => plugin.expandParent(0)).toThrowError('listener failure');

    const scrollViewportTo = jest.spyOn(hot, 'scrollViewportTo');
    const afterSelection = jest.fn();

    hot.addHook('afterSelection', afterSelection);
    hot.selectCell(5, 0);

    // The deferral of the active layer's end is reset, so a new selection is the last layer again:
    // `afterSelection` reports it at level 0 and the grid scrolls to it.
    expect(afterSelection).toHaveBeenCalledTimes(1);
    expect(scrollViewportTo).toHaveBeenCalled();
  });

  it('runs no selection hook for a select-all on a grid capped by maxRows', () => {
    const afterSelectionEnd = jest.fn();

    buildGrid({ maxRows: 4, afterSelectionEnd });

    // Four rows are left (A, B, B1, B2), so the select-all below covers the whole axis and tracks it.
    hot.getPlugin('nestedRows').collapseParent(0);
    hot.selectAll();

    const selectedBefore = hot.getSelected();

    expect(selectedBefore[0][2]).toBe(3);

    afterSelectionEnd.mockClear();
    // Six rows exist again, and the grid still shows four of them.
    hot.getPlugin('nestedRows').expandParent(0);

    expect(hot.countRows()).toBe(4);
    // The far corner stays on the last row the grid shows, so the selection did not move.
    // Compared as text: `selectAll()` starts the range at `-0`, which `toEqual()` tells from `0`.
    expect(JSON.stringify(hot.getSelected())).toBe(JSON.stringify(selectedBefore));
    expect(afterSelectionEnd).not.toHaveBeenCalled();
  });

  it('does not run the selection hooks on a later trim when a listener dropped the moved selection', () => {
    const afterSelectionEnd = jest.fn();

    buildGrid({ trimRows: true, afterSelectionEnd });

    const dropSelection = () => hot.deselectCell();

    hot.selectCell(3, 0);
    // Not listening, so the plugin does not put a selection back on the row.
    hot.unlisten();
    hot.addHookOnce('afterRowSequenceCacheUpdate', dropSelection);
    // The collapse moves the selection, and the listener drops it before the hooks it owes run.
    hot.getPlugin('nestedRows').collapseParent(0);

    expect(hot.getSelected()).toBeUndefined();

    hot.selectCell(0, 0);
    afterSelectionEnd.mockClear();
    hot.getPlugin('trimRows').trimRow(3);

    expect(hot.getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(afterSelectionEnd).not.toHaveBeenCalled();
  });

  it('moves the selection with its rows on an undo and a redo of a collapse', () => {
    const afterSelectionEnd = jest.fn();

    buildGrid({ afterSelectionEnd });

    hot.selectRows(3, 4);
    hot.getPlugin('nestedRows').collapseParent(0);

    expect(selectedNames()).toEqual([['B', 'B1']]);

    afterSelectionEnd.mockClear();
    hot.getPlugin('undoRedo').undo();

    expect(hot.countRows()).toBe(6);
    expect(selectedNames()).toEqual([['B', 'B1']]);
    expect(hot.getSelected()).toEqual([[3, -1, 4, 0]]);
    expect(afterSelectionEnd).toHaveBeenCalledTimes(1);

    hot.getPlugin('undoRedo').redo();

    expect(hot.countRows()).toBe(4);
    expect(selectedNames()).toEqual([['B', 'B1']]);
    expect(hot.getSelected()).toEqual([[1, -1, 2, 0]]);
  });

  it('reads the restored collapsed parents from a selection listener the undo runs', () => {
    const collapsedParentsSeen = [];

    buildGrid({
      afterSelectionEnd() {
        collapsedParentsSeen.push(this.getPlugin('nestedRows').getCollapsedParents());
      },
    });

    hot.selectRows(3, 4);
    hot.getPlugin('nestedRows').collapseParent(0);
    collapsedParentsSeen.length = 0;
    hot.getPlugin('undoRedo').undo();

    expect(collapsedParentsSeen).toEqual([[]]);
  });

  it('keeps the default repair for an undo of a batch that also trimmed rows elsewhere', () => {
    buildGrid({ trimRows: true });

    hot.selectRows(3, 4);
    hot.batch(() => {
      hot.getPlugin('nestedRows').collapseParent(0);
      hot.getPlugin('trimRows').trimRow(4);
    });

    const selectedAfterBatch = hot.getSelected();

    hot.getPlugin('undoRedo').undo();

    // The trim of B1 is part of the step, so the visual coordinates are left as they were.
    expect(hot.countRows()).toBe(6);
    expect(hot.getSelected()).toEqual(selectedAfterBatch);
  });

  it('does not let an undone toggle make a later trim follow records', async() => {
    buildGrid({ trimRows: true });

    hot.selectCell(4, 0);
    hot.getPlugin('nestedRows').collapseParent(0);
    hot.getPlugin('undoRedo').undo();
    // The request the undo made is for one update, and what is left of it is dropped in a microtask.
    await Promise.resolve();

    hot.selectCell(4, 0);
    hot.getPlugin('trimRows').trimRow(0);

    expect(hot.getSelected()).toEqual([[4, 0, 4, 0]]);
  });

  it('leaves the visual coordinates alone when a collapsed state is replayed without hooks', () => {
    buildGrid();

    const { collapsingUI } = hot.getPlugin('nestedRows');

    collapsingUI.toggleCollapsedRows([0], 'collapse', false);
    hot.selectRows(1, 2);
    collapsingUI.toggleCollapsedRows([0], 'expand', false);

    expect(hot.getSelected()).toEqual([[1, -1, 2, 0]]);
  });

  it('leaves the visual coordinates alone when another plugin trims rows', () => {
    buildGrid({ trimRows: true });

    const trimRows = hot.getPlugin('trimRows');

    // A toggle that changes nothing must not leave a request behind for the trim below.
    hot.getPlugin('nestedRows').expandParent(0);
    hot.selectCell(4, 0);
    trimRows.trimRow(0);

    expect(hot.getSelected()).toEqual([[4, 0, 4, 0]]);

    trimRows.untrimAll();

    expect(hot.getSelected()).toEqual([[4, 0, 4, 0]]);
  });
});
