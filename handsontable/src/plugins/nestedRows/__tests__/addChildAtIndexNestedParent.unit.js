import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { NestedRows } from '../nestedRows';
import { UndoRedo } from '../../undoRedo/undoRedo';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * `addChildAtIndex()` on a parent below the top level must change that parent only. The source write
 * it makes to announce the change used to address the top-level array by a flattened row index, so
 * it handed the parent's `__children` to an unrelated top-level row. The tree shape is read from the
 * raw nested source, because `getSourceData()` is flattened by the plugin.
 */
describe('NestedRows – addChildAtIndex() on a nested parent', () => {
  let container;
  let hot;

  const createData = () => [
    {
      name: 'A',
      __children: [
        { name: 'A1', __children: [{ name: 'A1a', __children: [{ name: 'A1a-i' }] }, { name: 'A1b' }] },
        { name: 'A2' },
      ],
    },
    { name: 'B', __children: [{ name: 'B1', __children: [{ name: 'B1a' }] }] },
    { name: 'C' },
  ];

  const createGrid = (settings = {}) => {
    hot = new Handsontable(container, {
      data: createData(),
      columns: [{ data: 'name' }],
      nestedRows: true,
      rowHeaders: true,
      undo: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  };

  const dataManager = () => hot.getPlugin('nestedRows').dataManager;
  const describeRow = row => (row.__children ?
    `${row.name}(${row.__children.map(describeRow).join(',')})` :
    row.name);
  const tree = () => dataManager().getRawSourceData().map(describeRow);
  const renderedNames = () => hot.getDataAtCol(0);

  beforeAll(() => {
    registerPlugin(NestedRows);
    registerPlugin(UndoRedo);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('adds the row to the parent only, and leaves every other row alone', () => {
    createGrid();

    const dm = dataManager();

    // The parent sits at flattened row 2, a valid position in the three-row top-level array too.
    dm.addChildAtIndex(dm.getDataObject(2), 0, { name: 'NEW' });

    expect(tree()).toEqual([
      'A(A1(A1a(NEW,A1a-i),A1b),A2)',
      'B(B1(B1a))',
      'C',
    ]);
    expect(hot.countRows()).toBe(11);
    expect(renderedNames()).toEqual(
      ['A', 'A1', 'A1a', 'NEW', 'A1a-i', 'A1b', 'A2', 'B', 'B1', 'B1a', 'C']
    );
  });

  it('adds the row to a top-level parent whose flattened row is another top-level position', () => {
    createGrid({
      data: [
        { name: 'A', __children: [{ name: 'A1' }] },
        { name: 'B', __children: [{ name: 'B1' }] },
        { name: 'C' },
        { name: 'D' },
      ],
    });

    const dm = dataManager();
    const parentB = dm.getDataObject(2);

    // B is top-level position 1 but flattened row 2, which is the top-level position of C.
    expect(parentB.name).toBe('B');

    dm.addChildAtIndex(parentB, 0, { name: 'NEW' });

    expect(tree()).toEqual(['A(A1)', 'B(NEW,B1)', 'C', 'D']);
  });

  it('adds the row to a second-level parent that sits among the top-level positions', () => {
    createGrid({
      data: [
        { name: 'A', __children: [{ name: 'A1', __children: [{ name: 'A1a' }] }] },
        { name: 'B' },
        { name: 'C' },
        { name: 'D' },
      ],
    });

    const dm = dataManager();

    // A1 is flattened row 1, which is also the top-level position of B.
    dm.addChildAtIndex(dm.getDataObject(1), 1, { name: 'NEW' });

    expect(tree()).toEqual(['A(A1(A1a,NEW))', 'B', 'C', 'D']);
  });

  it('does not duplicate rows when the new row is detached right after the insert', () => {
    createGrid();

    const dm = dataManager();

    dm.addChildAtIndex(dm.getDataObject(2), 0, { name: 'NEW' });
    dm.detachFromParent(dm.getDataObject(3));

    // A detach moves the row up one level, next to its former parent's siblings.
    expect(tree()).toEqual([
      'A(A1(A1a(A1a-i),A1b,NEW),A2)',
      'B(B1(B1a))',
      'C',
    ]);
    expect(hot.countRows()).toBe(11);
  });

  it('restores the original tree and row count on undo', () => {
    createGrid();

    const dm = dataManager();

    dm.addChildAtIndex(dm.getDataObject(2), 0, { name: 'NEW' });
    hot.getPlugin('undoRedo').undo();

    expect(tree()).toEqual([
      'A(A1(A1a(A1a-i),A1b),A2)',
      'B(B1(B1a))',
      'C',
    ]);
    expect(hot.countRows()).toBe(10);
    expect(renderedNames()).toEqual(['A', 'A1', 'A1a', 'A1a-i', 'A1b', 'A2', 'B', 'B1', 'B1a', 'C']);
  });

  it('writes the parent\'s own children list, not another row\'s, through afterSetSourceDataAtCell', () => {
    const afterSetSourceDataAtCell = jest.fn();

    createGrid({ afterSetSourceDataAtCell });

    const dm = dataManager();
    const parent = dm.getDataObject(2);

    dm.addChildAtIndex(parent, 0, { name: 'NEW' });

    expect(afterSetSourceDataAtCell).toHaveBeenCalledTimes(1);

    const [row, prop, oldValue, newValue] = afterSetSourceDataAtCell.mock.calls[0][0][0];

    expect(row).toBe(2);
    expect(prop).toBe('__children');
    // The write lands on the parent itself, so the value it replaces is the list it already holds. On
    // another row it would be that row's list, or nothing.
    expect(oldValue).toBe(parent.__children);
    expect(newValue).toBe(parent.__children);
  });

  it('redoes the insert after an undo', () => {
    createGrid();

    const dm = dataManager();

    dm.addChildAtIndex(dm.getDataObject(2), 0, { name: 'NEW' });

    const undoRedo = hot.getPlugin('undoRedo');

    undoRedo.undo();
    undoRedo.redo();

    expect(tree()).toEqual([
      'A(A1(A1a(NEW,A1a-i),A1b),A2)',
      'B(B1(B1a))',
      'C',
    ]);
    expect(hot.countRows()).toBe(11);
  });

  it('adds the row to a nested parent while another parent is collapsed', () => {
    createGrid();

    const nestedRows = hot.getPlugin('nestedRows');

    nestedRows.collapseParent(6);

    const dm = dataManager();

    dm.addChildAtIndex(dm.getDataObject(2), 0, { name: 'NEW' });

    expect(tree()).toEqual([
      'A(A1(A1a(NEW,A1a-i),A1b),A2)',
      'B(B1(B1a))',
      'C',
    ]);
    // B moved down one physical row, and its subtree is still folded away.
    expect(nestedRows.getCollapsedParents()).toEqual([7]);
    expect(hot.countRows()).toBe(9);
  });

  it('does nothing, and warns once, for a parent object the grid no longer holds', () => {
    const beforeAddChild = jest.fn();
    const afterAddChild = jest.fn();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    createGrid({ beforeAddChild, afterAddChild });

    const dm = dataManager();
    const staleParent = dm.getDataObject(6);

    expect(staleParent.name).toBe('B');

    hot.loadData([{ name: 'X', __children: [{ name: 'X1' }] }, { name: 'Y' }]);

    dm.addChildAtIndex(staleParent, 0, { name: 'NEW' });
    dm.addChildAtIndex(staleParent, 0, { name: 'NEW' });

    // The first top-level row keeps its own children, and the grid and its index maps stay in step.
    expect(tree()).toEqual(['X(X1)', 'Y']);
    expect(hot.countRows()).toBe(3);
    expect(hot.rowIndexMapper.getNumberOfIndexes()).toBe(3);
    expect(beforeAddChild).not.toHaveBeenCalled();
    expect(afterAddChild).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('addChildAtIndex()');

    warnSpy.mockRestore();
  });

  it('reads the parent\'s row after beforeAddChild, so a listener that moves the parent does not misaim the write', () => {
    let addedTopRow = false;

    createGrid({
      beforeAddChild: () => {
        if (!addedTopRow) {
          addedTopRow = true;
          // Pushes every row, the parent included, one row down before the insert is placed.
          dataManager().addChildAtIndex(null, 0, { name: 'TOP' });
        }
      },
    });

    const dm = dataManager();

    dm.addChildAtIndex(dm.getDataObject(6), 0, { name: 'NEW' });

    expect(tree()).toEqual([
      'TOP',
      'A(A1(A1a(A1a-i),A1b),A2)',
      'B(NEW,B1(B1a))',
      'C',
    ]);
    expect(renderedNames()).toEqual(['TOP', 'A', 'A1', 'A1a', 'A1a-i', 'A1b', 'A2', 'B', 'NEW', 'B1', 'B1a', 'C']);
    expect(hot.rowIndexMapper.getNumberOfIndexes()).toBe(12);
  });

  it('still fires afterAddChild when a beforeAddChild listener removes the parent', () => {
    const afterAddChild = jest.fn();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    createGrid({
      beforeAddChild: () => {
        hot.alter('remove_row', 6);
      },
      afterAddChild,
    });

    const dm = dataManager();

    dm.addChildAtIndex(dm.getDataObject(6), 0, { name: 'NEW' });

    expect(tree()).toEqual(['A(A1(A1a(A1a-i),A1b),A2)', 'C']);
    expect(hot.countRows()).toBe(7);
    expect(hot.rowIndexMapper.getNumberOfIndexes()).toBe(7);
    expect(afterAddChild).toHaveBeenCalledTimes(1);
    expect(afterAddChild.mock.calls[0][1]).toBeNull();

    warnSpy.mockRestore();
  });
});
