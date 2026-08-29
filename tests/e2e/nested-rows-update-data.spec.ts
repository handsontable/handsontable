import { test, expect } from '../fixtures/test';
import { NestedRowsPage } from '../fixtures/pages/NestedRowsPage';

/**
 * `updateData()` is documented to keep the rows' states, and a collapsed parent is one of
 * those states. The plugin used to keep it as raw physical row indexes, which stop pointing
 * at the same rows as soon as any parent gains or loses a child. The stale indexes then hid
 * whatever row happened to sit there - parent rows included, which made them vanish while
 * their children stayed on screen (GitHub #10239, DEV-2594).
 *
 * The fixture tree, by physical row index:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 A-3 / 6 Root B / 7 B-1 / 8 B-2
 *
 * Every dataset below keeps the parents where they are in the tree and only changes how many
 * children they hold - which is what the issue reports, and what used to break.
 */

interface TreeRow {
  name: string;
  __children?: TreeRow[];
}

const ALL_ROWS = ['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B', 'B-1', 'B-2'];

const leaves = (...names: string[]): TreeRow[] => names.map(name => ({ name }));

/**
 * Builds the fixture tree with the parts a test varies.
 *
 * @param {string[]} a2 Names of A-2's children. An empty list leaves A-2 without children.
 * @param {string[]} rootB Names of Root B's children.
 * @param {string[]} [extraRootA] Names of extra leaves appended to Root A, after A-3.
 * @returns {TreeRow[]}
 */
function tree(a2: string[], rootB: string[], extraRootA: string[] = []): TreeRow[] {
  const a2Node: TreeRow = a2.length > 0 ? { name: 'A-2', __children: leaves(...a2) } : { name: 'A-2' };

  return [
    {
      name: 'Root A',
      __children: [{ name: 'A-1' }, a2Node, { name: 'A-3' }, ...leaves(...extraRootA)],
    },
    {
      name: 'Root B',
      __children: leaves(...rootB),
    },
  ];
}

/** The same shape the fixture seeds the grid with. */
const baseTree = () => tree(['A-2-a', 'A-2-b'], ['B-1', 'B-2']);

test.describe('NestedRows collapsed parents across a data replacement', () => {
  test('keeps the same parents collapsed when updateData() shrinks their children', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // `collapseParent` takes a visual index, so the deeper parent goes last - collapsing A-2
    // first would pull Root B up out of visual row 6.
    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.callPlugin('collapseParent', 2); // A-2

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B']);

    // A-2 and Root B each drop a child, so every physical index after A-2 shifts.
    await nestedRows.updateData(tree(['A-2-a'], ['B-1']));

    // A-2 is still physical 2, but Root B moved from 6 to 5.
    expect(await nestedRows.collapsedParents()).toEqual([2, 5]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B']);
  });

  test('keeps the same parents collapsed when updateData() grows their children', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 6); // Root B

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B']);

    // Root A gains a fourth child, which pushes Root B one row down.
    await nestedRows.updateData(tree(['A-2-a', 'A-2-b'], ['B-1', 'B-2'], ['A-4']));

    expect(await nestedRows.collapsedParents()).toEqual([7]);
    expect(await nestedRows.visibleNames())
      .toEqual(['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'A-4', 'Root B']);
  });

  test('keeps a parent collapsed inside another collapsed parent', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    // Visual indexes again: Root B while it is still at row 6, then A-2, then Root A.
    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.callPlugin('collapseParent', 2); // A-2, nested inside Root A
    await nestedRows.callPlugin('collapseParent', 0); // Root A

    expect(await nestedRows.collapsedParents()).toEqual([0, 2, 6]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B']);

    // A-2 gains a third child, which pushes Root B one row down.
    await nestedRows.updateData(tree(['A-2-a', 'A-2-b', 'A-2-c'], ['B-1', 'B-2']));

    expect(await nestedRows.collapsedParents()).toEqual([0, 2, 7]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B']);
  });

  test('forgets a collapsed parent that updateData() left without children', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 2); // A-2

    await nestedRows.updateData(tree([], ['B-1', 'B-2']));

    expect(await nestedRows.collapsedParents()).toEqual([]);
    expect(await nestedRows.visibleNames())
      .toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B', 'B-1', 'B-2']);
  });

  test('replaying the collapsed parents does not fire the collapse hooks', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.resetHookLog();

    await nestedRows.updateData(tree(['A-2-a'], ['B-1', 'B-2']));

    // The user already chose this state, so restoring it is not a new collapse.
    expect(await nestedRows.hookNames()).toEqual([]);
    expect(await nestedRows.collapsedParents()).toEqual([5]);
  });

  test('re-points a stash that another operation left open', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.callPlugin('collapseParent', 2); // A-2

    // Add child, detach child, remove row and row move each expand the grid and park the collapsed
    // parents in a stash until they finish. An app that replaces the data from inside one of those
    // windows must not get the stash restored onto the old row numbers.
    await nestedRows.stashCollapsedState();
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);

    await nestedRows.updateData(tree(['A-2-a'], ['B-1']));

    await nestedRows.applyCollapsedStash();

    expect(await nestedRows.collapsedParents()).toEqual([2, 5]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B']);
  });

  test('forgets a collapsed parent that updateData() removed from the data', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.callPlugin('collapseParent', 2); // A-2

    // Root B is gone from the new data, so its path leads nowhere and it is simply dropped.
    await nestedRows.updateData([tree(['A-2-a'], [])[0]]);

    expect(await nestedRows.collapsedParents()).toEqual([2]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3']);
  });

  test('leaves the selection inside the grid after the replay trims rows', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 2); // A-2, leaves 7 rows
    await page.evaluate(() => window.hot.selectCell(6, 0));

    // The Core clamps the selection while the grid is still fully expanded, and trimming does not
    // re-clamp it, so the highlight could end up past the last row.
    await nestedRows.updateData(tree(['A-2-a'], ['B-1']));

    const highlightedRow = await nestedRows.highlightedRow();

    expect(highlightedRow).not.toBeNull();
    expect(highlightedRow).toBeLessThan(await nestedRows.countRows());
    expect(await page.evaluate(row => window.hot.toPhysicalRow(row as number), highlightedRow)).not.toBeNull();
  });

  test('keeps the collapsed parents when the data is replaced from inside an add-child', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.callPlugin('collapseParent', 2); // A-2

    // A real operation opens the stash, not the spec: `beforeAddChild` stashes, `afterAddChild`
    // restores, and the data is replaced in between.
    await nestedRows.replaceDataWhileAddingChild(tree(['A-2-a'], ['B-1']), 6);

    expect(await nestedRows.collapsedParents()).toEqual([2, 5]);
  });

  test('loadData() drops the collapsed parents, as it resets every other row state', async({ page, theme }) => {
    const nestedRows = new NestedRowsPage(page, theme);

    await nestedRows.goto();

    await nestedRows.callPlugin('collapseParent', 6); // Root B
    await nestedRows.callPlugin('collapseParent', 2); // A-2

    await nestedRows.loadData(baseTree());

    // Nothing may be left pointing at the old rows. The reported state and the internal one
    // both have to be empty, otherwise the next collapse acts on a parent the user never
    // collapsed.
    expect(await nestedRows.collapsedParents()).toEqual([]);
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);

    await nestedRows.callPlugin('collapseParent', 0);

    expect(await nestedRows.collapsedParents()).toEqual([0]);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
  });
});
