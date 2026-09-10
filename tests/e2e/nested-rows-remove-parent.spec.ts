import { test, expect } from '../fixtures/test';
import { NestedRowsRemoveParentPage } from '../fixtures/pages/NestedRowsRemoveParentPage';

/**
 * Removing a parent row is documented to remove that row and everything under it. It did not:
 * `beforeRemoveRow` expanded a removed parent into the parent plus its DIRECT children only, so
 * from the third level down the descendants stayed in the row index maps while the source data
 * lost them along with the parent object. The grid then rendered blank rows with nothing behind
 * them, and no further "Remove row" could clear them (DEV-56).
 *
 * The fixture tree is four levels deep on purpose. Physical layout:
 *   0 Root A / 1 A-1 / 2 A-1-a / 3 A-1-a-i / 4 A-2 / 5 Root B / 6 B-1
 *
 * `Root A` is the deep case; `Root B` is the two-level control. Each case pins three things
 * together, because each one alone can pass while the state is wrong: what the browser painted,
 * what the data layer answers, and how the row count compares to the source row count. A row the
 * plugin failed to remove reads back as `'null'` from the data layer – that string appearing is
 * the bug itself.
 *
 * The reads go through `expect.poll` rather than a bare `await`: `#onAfterRemoveRow` leaves a
 * timeout pending that runs `applyStash()`, which can re-trim rows and so change `countRows()`.
 */

const ALL_ROWS = ['Root A', 'A-1', 'A-1-a', 'A-1-a-i', 'A-2', 'Root B', 'B-1'];

/**
 * Asserts the painted column, the data column, and the row count against one expected list.
 *
 * @param {NestedRowsRemoveParentPage} nestedRows The page object.
 * @param {string[]} names The first column, top to bottom, as it should end up.
 */
async function expectRows(nestedRows: NestedRowsRemoveParentPage, names: string[]): Promise<void> {
  await expect.poll(() => nestedRows.dataNames()).toEqual(names);
  await expect.poll(() => nestedRows.renderedNames()).toEqual(names);
  await expect.poll(() => nestedRows.countRows()).toBe(names.length);
  // The source data always lost the whole subtree; only the row count was too high. Pinning both
  // numbers is what proves they are back in step.
  await expect.poll(() => nestedRows.sourceRowCount()).toBe(names.length);
}

test.describe('NestedRows removing a parent row', () => {
  test('"Remove row" on a four-level parent removes its whole subtree', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();
    await expectRows(nestedRows, ALL_ROWS);

    // The reported steps: right-click the first row's header, then pick "Remove row".
    await nestedRows.removeRowViaContextMenu(0);

    await expectRows(nestedRows, ['Root B', 'B-1']);
  });

  test('removing a parent nested inside another parent removes its grandchildren', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();
    await expectRows(nestedRows, ALL_ROWS);

    // `A-1` sits at level 1 and owns a child that owns a child, so the walk has to keep going
    // past its direct children here too.
    await nestedRows.removeRow(1);

    await expectRows(nestedRows, ['Root A', 'A-2', 'Root B', 'B-1']);
  });

  test('removing a collapsed parent removes the descendants the collapse trimmed', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();

    // Collapsing TRIMS the descendants, so they have no visual index at all. The removal still
    // has to reach every one of them.
    await nestedRows.collapseParent(0);
    await expect.poll(() => nestedRows.dataNames()).toEqual(['Root A', 'Root B', 'B-1']);

    await nestedRows.removeRow(0);

    await expectRows(nestedRows, ['Root B', 'B-1']);
  });

  test('removing a two-level parent takes exactly its own children', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();
    await expectRows(nestedRows, ALL_ROWS);

    // The control. `Root B` has one leaf child, so this case was already correct - it fails only
    // if the subtree expansion reaches past the parent it was asked about.
    await nestedRows.removeRow(5);

    await expectRows(nestedRows, ['Root A', 'A-1', 'A-1-a', 'A-1-a-i', 'A-2']);
  });

  test('a selection spanning a parent and its own descendants removes exactly that subtree',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

      await nestedRows.goto();

      // Rows 0-2 are `Root A`, `A-1` and `A-1-a` - a parent plus two of its own descendants, each
      // of which is itself a parent. Every one of them expands to a subtree nested inside the
      // first, so the list must not grow past `Root A`'s own block.
      await nestedRows.removeRow(0, 3);

      await expectRows(nestedRows, ['Root B', 'B-1']);
    });

  test('a child added to the source data without re-caching cannot drag a sibling parent down',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

      await nestedRows.goto();

      // `render()` does not run `rewriteCache()`, so after this the flatten cache holds 7 rows
      // while the tree holds 8. A removal that read the subtree's SIZE from the live tree would
      // list one index too many, and that index is `Root B` - a different branch entirely.
      await nestedRows.pushChildWithoutRecaching(0, 'A-3');
      await expect.poll(() => nestedRows.sourceRowCount()).toBe(8);
      await expect.poll(() => nestedRows.countRows()).toBe(7);

      await nestedRows.removeRow(0);

      // `Root B` and `B-1` must survive. The uncached child goes with its parent's object, so the
      // data loses it either way - what must never happen is another branch being deleted.
      await expect.poll(() => nestedRows.dataNames()).toEqual(['Root B', 'B-1']);
      await expect.poll(() => nestedRows.countRows()).toBe(2);
    });
});
