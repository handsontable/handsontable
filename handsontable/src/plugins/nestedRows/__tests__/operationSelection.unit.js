import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows, ManualRowMove } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(NestedRows);
registerPlugin(ManualRowMove);

/**
 * A row removal, an "Insert child row" or a detach rewrites the tree, and the plugin expands every
 * collapsed parent for its length (the collapsed rows stash) and collapses them again afterwards,
 * for a removal a tick later. The selection stays on the rows it was on (DEV-509): the stash records
 * the row object under every corner and puts the selection back on those rows when it closes.
 */
describe('NestedRows selection across a row removal, an insert and a detach', () => {
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
   * Builds a grid of three parents with two children each. Physical rows:
   * A (0), A1 (1), A2 (2), B (3), B1 (4), B2 (5), C (6), C1 (7), C2 (8).
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: ['A', 'B', 'C'].map(name => ({
        name,
        __children: [{ name: `${name}1` }, { name: `${name}2` }],
      })),
      columns: [{ data: 'name' }],
      rowHeaders: true,
      nestedRows: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the names of the visible rows, top to bottom.
   *
   * @returns {string[]}
   */
  function visibleNames() {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getDataAtCell(row, 0));
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

  /**
   * Selects the rows from one named row to another, by their row headers.
   *
   * @param {string} from The name of the first row.
   * @param {string} to The name of the last row.
   */
  function selectRowsByName(from, to) {
    const names = visibleNames();

    hot.selectRows(names.indexOf(from), names.indexOf(to));
  }

  /**
   * Waits for the re-collapse a removal runs a tick later.
   *
   * @returns {Promise}
   */
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));

  it('keeps the selection on its rows when a parent above it is removed with its children', async() => {
    buildGrid();
    selectRowsByName('C', 'C1');

    // One row is named, three are removed: the parent and its two children.
    hot.alter('remove_row', 3, 1);
    await settle();

    expect(visibleNames()).toEqual(['A', 'A1', 'A2', 'C', 'C1', 'C2']);
    expect(selectedNames()).toEqual([['C', 'C1']]);
    expect(hot.getSelected()).toEqual([[3, -1, 4, 0]]);
  });

  it('keeps the selection on its rows when a row is removed while a parent above is collapsed', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    selectRowsByName('C', 'C1');

    hot.alter('remove_row', visibleNames().indexOf('B'), 1);
    await settle();

    expect(visibleNames()).toEqual(['A', 'C', 'C1', 'C2']);
    expect(selectedNames()).toEqual([['C', 'C1']]);
  });

  it('brings back a selection the removal stranded on the way', async() => {
    buildGrid();
    // B is collapsed, and the removed row sits above it: the selection passes through the expanded
    // grid and the default repair drops it there, with every selected row still in place.
    hot.getPlugin('nestedRows').collapseParent(3);
    selectRowsByName('C', 'C1');

    hot.alter('remove_row', visibleNames().indexOf('A1'), 1);
    await settle();

    expect(visibleNames()).toEqual(['A', 'A2', 'B', 'C', 'C1', 'C2']);
    expect(selectedNames()).toEqual([['C', 'C1']]);
    expect(hot.getSelected()).toEqual([[3, -1, 4, 0]]);
  });

  it('keeps a range between its two rows when a row inside it is removed', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    selectRowsByName('B', 'C');

    hot.alter('remove_row', visibleNames().indexOf('B1'), 1);
    await settle();

    expect(selectedNames()).toEqual([['B', 'B2', 'C']]);
  });

  it('leaves the selection to the removal when a selected row is removed', async() => {
    buildGrid();
    selectRowsByName('B', 'B');

    // The source the context menu removes with: the selection stays at the place of the removed row.
    hot.alter('remove_row', 3, 1, 'ContextMenu.removeRow');
    await settle();

    expect(hot.getSelected()).toEqual([[3, -1, 3, 0]]);
    expect(selectedNames()).toEqual([['C']]);
  });

  it('does not move a selection made between the removal and the re-collapse', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    selectRowsByName('C', 'C1');

    hot.alter('remove_row', visibleNames().indexOf('B'), 1);
    hot.selectCell(0, 0);
    await settle();

    expect(hot.getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('does not bring back a selection dropped between the removal and the re-collapse', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(3);
    selectRowsByName('C', 'C1');

    hot.alter('remove_row', visibleNames().indexOf('A1'), 1);
    hot.deselectCell();
    await settle();

    expect(hot.getSelected()).toBeUndefined();
  });

  it('keeps the selection on its rows when a child is added to a parent above it', () => {
    buildGrid();
    selectRowsByName('C', 'C1');

    const { dataManager } = hot.getPlugin('nestedRows');

    dataManager.addChild(dataManager.getDataObject(0));

    expect(hot.countRows()).toBe(10);
    expect(selectedNames()).toEqual([['C', 'C1']]);
    expect(hot.getSelected()).toEqual([[7, -1, 8, 0]]);
  });

  it('keeps the selection on its rows when a child above it is detached', () => {
    buildGrid();
    selectRowsByName('C', 'C1');

    // Detaches A1, which becomes the last top-level row.
    hot.getPlugin('nestedRows').dataManager.detachFromParent([1, 0, 1, 0]);

    expect(visibleNames()).toEqual(['A', 'A2', 'B', 'B1', 'B2', 'C', 'C1', 'C2', 'A1']);
    expect(selectedNames()).toEqual([['C', 'C1']]);
  });

  it('leaves a whole-column selection to the grid-tracking repair', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    hot.selectColumns(0);

    hot.alter('remove_row', visibleNames().indexOf('B'), 1);
    await settle();

    expect(hot.countRows()).toBe(4);
    expect(hot.getSelected()[0][2]).toBe(3);
    expect(hot.getDataAtCell(hot.getSelectedRangeActive().highlight.row, 0)).toBe('A');
  });

  it('keeps the focus of a whole-column selection on its row when a parent above it is removed', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    // Seven rows: A (collapsed), B, B1, B2, C, C1, C2. The focus sits on C.
    hot.selectColumns(0, 0, { row: visibleNames().indexOf('C'), col: 0 });

    // Removes B and its children.
    hot.alter('remove_row', 1, 1);
    await settle();

    expect(visibleNames()).toEqual(['A', 'C', 'C1', 'C2']);
    expect(hot.getDataAtCell(hot.getSelectedRangeActive().highlight.row, 0)).toBe('C');
    expect(hot.getSelected()[0][2]).toBe(3);
  });

  it('does not move the focus back after a listener moved it inside an add-child bracket', () => {
    buildGrid();
    hot.selectCell(visibleNames().indexOf('C'), 0, visibleNames().indexOf('C1'), 0);

    let movedFocus = null;

    // A focus move made from the operation's own hook, with no key press. It is the app's change, so
    // the stash drops the rows it recorded and leaves the selection as the app left it.
    hot.addHookOnce('afterCreateRow', () => {
      hot.selection.transformFocus(1, 0);
      movedFocus = hot.getSelectedRangeActive().highlight.clone();
    });

    const relayRows = jest.spyOn(hot.selection, 'relayRows');
    const { dataManager } = hot.getPlugin('nestedRows');

    dataManager.addChild(dataManager.getDataObject(0));

    expect(relayRows).not.toHaveBeenCalled();
    expect(hot.getSelectedRangeActive().highlight.row).toBe(movedFocus.row);
  });

  it('keeps a cell layer on its row when the removal also takes the last row a whole-column layer ends on', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    // A whole column (layer 0) and C1 (layer 1). The whole column ends on C2, the last row.
    hot.selectColumns(0);
    // Adds C1 as a second layer, the way a Ctrl+click does.
    hot.selection.setRangeStart(hot._createCellCoords(visibleNames().indexOf('C1'), 0), true);

    expect(hot.selection.exportSelection().rowExtentSpansGrid).toEqual([0]);
    expect(selectedNames()[1]).toEqual(['C1']);

    const relayRows = jest.spyOn(hot.selection, 'relayRows');

    // Removes C2, the row the whole column ends on. The whole column is left to the grid-tracking
    // repair, so its gone row does not cancel the restore of the cell layer.
    hot.alter('remove_row', visibleNames().indexOf('C2'), 1);
    await settle();

    expect(visibleNames()).toEqual(['A', 'B', 'B1', 'B2', 'C', 'C1']);
    expect(relayRows).toHaveBeenCalledTimes(1);
    // The whole column passes its focus row (A) only: its extent is the grid-tracking repair's.
    expect(relayRows.mock.calls[0][0]).toEqual([{ from: 0, to: 0, highlight: 0 }, { from: 5, to: 5, highlight: 5 }]);
    expect(selectedNames()).toEqual([['A', 'B', 'B1', 'B2', 'C', 'C1'], ['C1']]);
  });

  it('does not bring back a selection a listener of the removal dropped', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(3);
    selectRowsByName('C', 'C1');
    // Runs before the plugin's own listener: a global hook, or any listener after a settings update
    // re-registered the plugin's hooks.
    hot.addHook('afterRemoveRow', () => hot.deselectCell(), -1);

    hot.alter('remove_row', visibleNames().indexOf('A1'), 1);
    await settle();

    expect(hot.getSelected()).toBeUndefined();
  });

  it('does not move a selection after the plugin was disabled before the re-collapse', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    selectRowsByName('C', 'C1');

    hot.alter('remove_row', visibleNames().indexOf('B'), 1);
    hot.updateSettings({ nestedRows: false });
    hot.selectCell(1, 0);
    await settle();

    expect(hot.getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('does not move the selection back after the user pressed a key before the re-collapse', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);
    hot.selectCell(visibleNames().indexOf('C'), 0, visibleNames().indexOf('C1'), 0);
    hot.listen();

    hot.alter('remove_row', visibleNames().indexOf('B'), 1);
    // Enter moves the focus from C to C1 inside the range.
    document.documentElement.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', keyCode: 13, bubbles: true, cancelable: true,
    }));

    expect(hot.getDataAtCell(hot.getSelectedRangeActive().highlight.row, 0)).toBe('C1');

    await settle();

    // The stash no longer owns the selection, so it does not put the focus back on C. What is left
    // is the default repair: the re-collapse of A strands the focus on C1, and drops the selection.
    expect(hot.getSelected()).toBeUndefined();
  });

  it('selects the moved rows after a row move, and fires the selection hooks only for that', () => {
    const afterSelectionEnd = jest.fn();

    buildGrid({ manualRowMove: true, afterSelectionEnd });
    selectRowsByName('C1', 'C1');
    afterSelectionEnd.mockClear();

    // Moves C1 to the place of B1, inside B.
    hot.getPlugin('manualRowMove').dragRows([visibleNames().indexOf('C1')], visibleNames().indexOf('B1'));

    expect(visibleNames()).toEqual(['A', 'A1', 'A2', 'B', 'C1', 'B1', 'B2', 'C', 'C2']);
    expect(selectedNames()).toEqual([['C1']]);
    expect(afterSelectionEnd).toHaveBeenCalledTimes(1);
  });

  it('runs the selection hooks once when the removal moved the selection', async() => {
    const afterSelectionEnd = jest.fn();

    buildGrid({ afterSelectionEnd });
    hot.getPlugin('nestedRows').collapseParent(0);
    selectRowsByName('C', 'C1');

    hot.alter('remove_row', visibleNames().indexOf('B'), 1);
    afterSelectionEnd.mockClear();
    await settle();

    expect(afterSelectionEnd).toHaveBeenCalledTimes(1);
    expect(afterSelectionEnd.mock.calls[0].slice(0, 4)).toEqual([1, -1, 2, 0]);
  });
});
