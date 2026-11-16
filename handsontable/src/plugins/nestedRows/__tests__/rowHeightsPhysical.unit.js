import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows, ManualRowMove, UndoRedo } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(NestedRows);
registerPlugin(ManualRowMove);
registerPlugin(UndoRedo);

/**
 * The `rowHeights` array is addressed by the physical row index (DEV-508), so a height stays with its
 * row when a collapse trims rows, and when the tree operations of this plugin, which build their
 * inserts and moves by hand instead of through `alter()`, change the physical order.
 */
describe('NestedRows with rowHeights addressed by physical row index', () => {
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
   * Builds a grid with a parent holding two children and a top-level row after it. Physical rows:
   * P (0), C1 (1), C2 (2), Q (3).
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [
        { name: 'P', __children: [{ name: 'C1' }, { name: 'C2' }] },
        { name: 'Q' },
      ],
      columns: [{ data: 'name' }],
      rowHeaders: true,
      autoRowSize: false,
      rowHeights: [100, 50, 40, 70],
      nestedRows: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the height of every visible row, keyed by the row's name.
   *
   * @returns {object}
   */
  function heightsByName() {
    const heights = {};

    for (let row = 0; row < hot.countRows(); row++) {
      heights[hot.getDataAtCell(row, 0) ?? `new-${row}`] = hot.getRowHeight(row);
    }

    return heights;
  }

  it('should leave the next parent at its own height when a parent is collapsed, and restore on expand', () => {
    buildGrid();

    hot.getPlugin('nestedRows').collapseParent(0);

    expect(heightsByName()).toEqual({ P: 100, Q: 70 });

    hot.getPlugin('nestedRows').expandParent(0);

    expect(heightsByName()).toEqual({ P: 100, C1: 50, C2: 40, Q: 70 });
  });

  it('should keep the heights below a child added with `addChild()` with their rows', () => {
    buildGrid();

    const plugin = hot.getPlugin('nestedRows');

    plugin.dataManager.addChild(plugin.dataManager.getDataObject(0));

    expect(hot.countRows()).toBe(5);
    expect(heightsByName()).toEqual({ P: 100, C1: 50, C2: 40, 'new-3': undefined, Q: 70 });
  });

  it('should keep the heights below a child added with `addChildAtIndex()` with their rows', () => {
    buildGrid();

    const plugin = hot.getPlugin('nestedRows');

    plugin.dataManager.addChildAtIndex(plugin.dataManager.getDataObject(0), 0, { name: 'C0' });

    expect(heightsByName()).toEqual({ P: 100, C0: undefined, C1: 50, C2: 40, Q: 70 });
  });

  it('should give no entry to a child added with `addChildAtIndex()` past the child count', () => {
    // entries past the rows, so a child that took the next entry would read 60
    buildGrid({ rowHeights: [100, 50, 40, 70, 60, 30] });

    const dataManager = hot.getPlugin('nestedRows').dataManager;

    // past the child count, the index mapper reads the insert as an append, while the row lands after C2
    dataManager.addChildAtIndex(dataManager.getDataObject(0), 99, { name: 'C3' });

    expect(hot.getDataAtCol(0)).toEqual(['P', 'C1', 'C2', 'C3', 'Q']);
    expect(heightsByName()).toEqual({ P: 100, C1: 50, C2: 40, C3: undefined, Q: 70 });

    // the next real append still takes the entry after the highest one in use
    hot.alter('insert_row_below', hot.countRows() - 1);

    expect(hot.getRowHeight(5)).toBe(60);
  });

  it('should keep the heights with their rows when a sibling is added below a nested child', () => {
    buildGrid({
      data: [
        { name: 'A', __children: [{ name: 'A1', __children: [{ name: 'A1a' }, { name: 'A1b' }] }, { name: 'A2' }] },
        { name: 'B' },
      ],
      rowHeights: [100, 60, 45, 50, 55, 90],
    });

    // what the context menu's "Insert row below" does on A2 (visual row 4)
    hot.getPlugin('nestedRows').dataManager.addSibling(4, 'below');

    expect(hot.getDataAtCol(0)).toEqual(['A', 'A1', 'A1a', 'A1b', 'A2', null, 'B']);
    expect([0, 1, 2, 3, 4, 5, 6].map(row => hot.getRowHeight(row)))
      .toEqual([100, 60, 45, 50, 55, undefined, 90]);
  });

  it('should keep the heights with their rows when a sibling is added above a nested child', () => {
    buildGrid({
      data: [
        { name: 'A', __children: [{ name: 'A1', __children: [{ name: 'A1a' }, { name: 'A1b' }] }, { name: 'A2' }] },
        { name: 'B' },
      ],
      rowHeights: [100, 60, 45, 50, 55, 90],
    });

    // what the context menu's "Insert row above" does on A1b (visual row 3)
    hot.getPlugin('nestedRows').dataManager.addSibling(3, 'above');

    expect(hot.getDataAtCol(0)).toEqual(['A', 'A1', 'A1a', null, 'A1b', 'A2', 'B']);
    expect([0, 1, 2, 3, 4, 5, 6].map(row => hot.getRowHeight(row)))
      .toEqual([100, 60, 45, undefined, 50, 55, 90]);
  });

  it('should move the height of a detached child with it', () => {
    buildGrid();

    // the selection coordinates of C1; a detached top-level child goes to the end of the tree
    hot.getPlugin('nestedRows').dataManager.detachFromParent([1, 0, 1, 0]);

    expect(hot.getDataAtCol(0)).toEqual(['P', 'C2', 'Q', 'C1']);
    expect(heightsByName()).toEqual({ P: 100, C2: 40, Q: 70, C1: 50 });
  });

  it('should move the height of a row the user moves with it', () => {
    buildGrid({ manualRowMove: true });

    // drop C2 above C1
    hot.getPlugin('manualRowMove').dragRows([2], 1);

    expect(hot.getDataAtCol(0)).toEqual(['P', 'C2', 'C1', 'Q']);
    expect(heightsByName()).toEqual({ P: 100, C2: 40, C1: 50, Q: 70 });
  });

  it('should move the heights of rows dragged down across their siblings', () => {
    buildGrid({
      data: [{ name: 'P', __children: [{ name: 'C1' }, { name: 'C2' }, { name: 'C3' }, { name: 'C4' }] }],
      rowHeights: [100, 11, 22, 33, 44],
      manualRowMove: true,
    });

    hot.getPlugin('manualRowMove').dragRows([1], 4);

    expect(hot.getDataAtCol(0)).not.toEqual(['P', 'C1', 'C2', 'C3', 'C4']);
    expect(heightsByName()).toEqual({ P: 100, C1: 11, C2: 22, C3: 33, C4: 44 });
  });

  it('should move the height of each row of an unsorted multi-row drag with its own row', () => {
    buildGrid({
      data: [{ name: 'P', __children: [{ name: 'C1' }, { name: 'C2' }, { name: 'C3' }, { name: 'C4' }] }],
      rowHeights: [100, 11, 22, 33, 44],
      manualRowMove: true,
    });

    hot.getPlugin('manualRowMove').dragRows([2, 1], 5);

    expect(hot.getDataAtCol(0)).not.toEqual(['P', 'C1', 'C2', 'C3', 'C4']);
    expect(heightsByName()).toEqual({ P: 100, C1: 11, C2: 22, C3: 33, C4: 44 });
  });

  it('should keep the array the user passed unchanged through the tree operations', () => {
    const rowHeights = [100, 50, 40, 70];

    buildGrid({ rowHeights, manualRowMove: true });

    const plugin = hot.getPlugin('nestedRows');

    plugin.dataManager.addChild(plugin.dataManager.getDataObject(0));
    plugin.dataManager.detachFromParent([1, 0, 1, 0]);
    hot.alter('remove_row', 0, 1);

    expect(hot.getSettings().rowHeights).toBe(rowHeights);
    expect(rowHeights).toEqual([100, 50, 40, 70]);
  });

  it('should drop the heights of a removed parent and its whole subtree', () => {
    buildGrid();

    hot.alter('remove_row', 0, 1);

    expect(heightsByName()).toEqual({ Q: 70 });
  });

  it('should drop the heights of a removed collapsed parent and its hidden children', () => {
    buildGrid();

    hot.getPlugin('nestedRows').collapseParent(0);
    hot.alter('remove_row', 0, 1);

    expect(heightsByName()).toEqual({ Q: 70 });
  });

  it('should put the heights back when a child removal is undone and redone', () => {
    buildGrid({ undo: true });

    hot.alter('remove_row', 1, 1);

    expect(heightsByName()).toEqual({ P: 100, C2: 40, Q: 70 });

    hot.getPlugin('undoRedo').undo();

    expect(heightsByName()).toEqual({ P: 100, C1: 50, C2: 40, Q: 70 });

    hot.getPlugin('undoRedo').redo();

    expect(heightsByName()).toEqual({ P: 100, C2: 40, Q: 70 });
  });

  it('should keep the heights aligned when an added child is undone', () => {
    buildGrid({ undo: true });

    const plugin = hot.getPlugin('nestedRows');

    plugin.dataManager.addChild(plugin.dataManager.getDataObject(0));
    hot.getPlugin('undoRedo').undo();

    expect(heightsByName()).toEqual({ P: 100, C1: 50, C2: 40, Q: 70 });
  });

  it('should put the heights back when a detach is undone', () => {
    buildGrid({ undo: true });

    hot.getPlugin('nestedRows').dataManager.detachFromParent([1, 0, 1, 0]);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getDataAtCol(0)).toEqual(['P', 'C1', 'C2', 'Q']);
    expect(heightsByName()).toEqual({ P: 100, C1: 50, C2: 40, Q: 70 });
  });
});
