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
 * `Root A` is the deep case; `Root B` is the two-level control. The assertions read the first
 * column's text rather than only counting rows, because a row the plugin failed to remove reads
 * back as `'null'` - that string appearing is the bug itself.
 */

const ALL_ROWS = ['Root A', 'A-1', 'A-1-a', 'A-1-a-i', 'A-2', 'Root B', 'B-1'];

test.describe('NestedRows removing a parent row', () => {
  test('"Remove row" on a four-level parent removes its whole subtree', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();
    expect(await nestedRows.visibleNames()).toEqual(ALL_ROWS);

    // The reported steps: right-click the first row's header, then pick "Remove row".
    await nestedRows.removeRowViaContextMenu(0);

    expect(await nestedRows.visibleNames()).toEqual(['Root B', 'B-1']);
    expect(await nestedRows.countRows()).toBe(2);
    // The source data always lost the whole subtree; only the row count was too high. Pinning both
    // numbers is what proves they are back in step.
    expect(await nestedRows.sourceRowCount()).toBe(2);
  });

  test('removing a parent nested inside another parent removes its grandchildren', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();

    // `A-1` sits at level 1 and owns a child that owns a child, so the walk has to keep going
    // past its direct children here too.
    await nestedRows.removeRow(1);

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-2', 'Root B', 'B-1']);
    expect(await nestedRows.countRows()).toBe(4);
    expect(await nestedRows.sourceRowCount()).toBe(4);
  });

  test('removing a collapsed parent removes the descendants the collapse trimmed', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();

    // Collapsing TRIMS the descendants, so they have no visual index at all. The removal still
    // has to reach every one of them.
    await nestedRows.collapseParent(0);
    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1']);

    await nestedRows.removeRow(0);

    expect(await nestedRows.visibleNames()).toEqual(['Root B', 'B-1']);
    expect(await nestedRows.countRows()).toBe(2);
    expect(await nestedRows.sourceRowCount()).toBe(2);
  });

  test('removing a two-level parent takes exactly its own children', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRemoveParentPage(page, theme, bundle);

    await nestedRows.goto();

    // The control. `Root B` has one leaf child, so this case was already correct - it fails only
    // if the subtree expansion reaches past the parent it was asked about.
    await nestedRows.removeRow(5);

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-1-a', 'A-1-a-i', 'A-2']);
    expect(await nestedRows.countRows()).toBe(5);
    expect(await nestedRows.sourceRowCount()).toBe(5);
  });
});
