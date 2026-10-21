import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NestedRowsAutofillPage } from '../fixtures/pages/NestedRowsAutofillPage';

const PARENT_1 = { category: 'Parent 1', item: 'p1', __children: [{ category: 'child', item: 'x' }] };
const INITIAL_TREE = [
  PARENT_1,
  { category: 'Parent 2', item: 'p2', __children: [{ category: 'child', item: 'a' }] },
];

/**
 * DEV-139: dragging the fill handle past the last row of a nested grid inserts rows
 * (`fillHandle.autoInsertRow`). They continue the level of the row the drag starts from, so a drag
 * from a child adds children to the same parent instead of new top-level parents.
 *
 * How many rows the drag inserts depends on the pointer path (reaching the last row inserts one
 * more), so the specs assert the level of every inserted row and the value of the first one, not
 * the count.
 */
// leg-declarations: ignore pointer-offset -- the drag goes 80 px below the grid's own box, past the last row on every theme, and then waits on the row count, not on a position
test.describe('fill handle on nested rows', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: NestedRowsAutofillPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NestedRowsAutofillPage(page, theme, bundle);
    await grid.goto();
  });

  test('adds the rows a drag from a child inserts to that child\'s parent', async() => {
    await grid.dragFillHandleBelowTable(3, 1);

    await expect(grid.cell(4, 1)).toHaveText('a');

    const { tree, levels, items } = await grid.state();
    const [parent1, parent2] = tree as typeof INITIAL_TREE;

    expect(tree).toHaveLength(2);
    expect(parent1).toEqual(PARENT_1);
    expect(parent2.__children.length).toBeGreaterThan(1);
    expect(parent2.__children.slice(0, 2)).toEqual([
      { category: 'child', item: 'a' },
      { category: null, item: 'a' },
    ]);
    expect(levels.slice(3)).toEqual(levels.slice(3).map(() => 1));
    expect(items.slice(3, 5)).toEqual(['a', 'a']);
    expect(grid.pageErrors).toEqual([]);
  });

  // A guard, green before DEV-139 too: undo restores the tree shape the plugin recorded, wherever
  // the rows were inserted.
  test('undo takes the inserted rows out of the parent again', async() => {
    await grid.dragFillHandleBelowTable(3, 1);
    await expect(grid.cell(4, 1)).toHaveText('a');

    await grid.undoAllWithKeyboard();

    expect((await grid.state()).tree).toEqual(INITIAL_TREE);
    expect(await grid.countRows()).toBe(4);
    expect(grid.pageErrors).toEqual([]);
  });

  // A guard, green before DEV-139 too: the last visible row is a top-level parent here, so the
  // rows continue at the top level and never land inside the collapsed parent.
  test('keeps adding top-level rows below a collapsed top-level parent', async() => {
    await grid.collapseParent(2);
    expect(await grid.countRows()).toBe(3);

    await grid.dragFillHandleBelowTable(2, 1);

    await expect(grid.cell(3, 1)).toHaveText('p2');

    const { tree, levels } = await grid.state();

    expect(tree.slice(0, 2)).toEqual(INITIAL_TREE);
    expect(tree[2]).toEqual({ category: null, item: 'p2' });
    expect(levels.slice(2)).toEqual(levels.slice(2).map(() => 0));
    expect(grid.pageErrors).toEqual([]);
  });
});
