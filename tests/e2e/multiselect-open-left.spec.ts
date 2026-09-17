import { test, expect } from '../fixtures/test';
import { MultiselectOpenLeftPage } from '../fixtures/pages/MultiselectOpenLeftPage';

/**
 * DEV-1198: the multiselect list opened toward the inline end even when that
 * side had no room, so a last-column cell on a narrow grid cut the list off.
 * Autocomplete / Handsontable editors already flip horizontally; this spec
 * pins the same contract for multiselect. Hit-testing and clipping-ancestor
 * width are required: `toBeVisible()` and `boundingBox()` both pass for a
 * fully clipped option. Hit-test the first painted option, not the last
 * row: horizon's taller items put the last `<li>` below the dropdown fold.
 */
test.describe('multiselect opens to the left when there is no room on the right', () => {
  let grid: MultiselectOpenLeftPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MultiselectOpenLeftPage(page, theme, bundle);
    await grid.goto();
  });

  test('first column — the list stays aligned with the cell and every control is reachable', async () => {
    await grid.openEditorAt(0, 0);

    const placement = await grid.placement(0, 0);

    expect(Math.abs(placement.dropdownLeft - placement.cellLeft)).toBeLessThanOrEqual(2);
    expect(await grid.isFlippedHorizontally()).toBe(false);
    expect(await grid.visibleWidthOf(grid.firstOption())).toBeGreaterThan(20);
    expect(await grid.isReachable(grid.firstOption())).toBe(true);
    expect(await grid.isReachable(grid.searchInput())).toBe(true);
  });

  test('last column — the list opens to the left and stays fully usable', async () => {
    await grid.openEditorAt(0, 2);

    const placement = await grid.placement(0, 2);

    // Without the fix the list keeps the cell's left edge and hangs past the grid.
    expect(placement.dropdownLeft).toBeLessThan(placement.cellLeft - 20);
    expect(Math.abs(placement.dropdownRight - placement.cellRight)).toBeLessThanOrEqual(3);
    expect(placement.dropdownRight).toBeLessThanOrEqual(placement.gridRight + 1);
    // Flip prefers the bigger side (HandsontableEditor parity) and may overhang
    // the inline start. Overlap + hit-tests prove the painted controls stay usable.
    expect(grid.overlapWithGrid(placement)).toBeGreaterThan(placement.cellRight - placement.cellLeft);
    expect(await grid.isFlippedHorizontally()).toBe(true);
    expect(await grid.visibleWidthOf(grid.firstOption())).toBeGreaterThan(20);
    expect(await grid.isReachable(grid.firstOption())).toBe(true);
    expect(await grid.isReachable(grid.searchInput())).toBe(true);
  });

  test('RTL first column — the list stays aligned on `right` and is not flipped', async () => {
    await grid.rebuild({ layoutDirection: 'rtl' });
    await grid.openEditorAt(0, 0);

    const placement = await grid.placement(0, 0);

    expect(placement.isRtl).toBe(true);
    expect(Math.abs(placement.dropdownRight - placement.cellRight)).toBeLessThanOrEqual(2);
    expect(await grid.isFlippedHorizontally()).toBe(false);
    expect(await grid.isReachable(grid.firstOption())).toBe(true);
    expect(await grid.isReachable(grid.searchInput())).toBe(true);
  });

  test('RTL last column — the list flips onto `right` and stays fully usable', async () => {
    await grid.rebuild({ layoutDirection: 'rtl' });
    await grid.openEditorAt(0, 2);

    const placement = await grid.placement(0, 2);

    expect(placement.isRtl).toBe(true);
    // Inline-end is physical left in RTL; the flipped list aligns that edge with the cell
    // and grows toward inline-start (physical right).
    expect(placement.dropdownRight).toBeGreaterThan(placement.cellRight + 20);
    expect(Math.abs(placement.dropdownLeft - placement.cellLeft)).toBeLessThanOrEqual(3);
    expect(placement.dropdownLeft).toBeGreaterThanOrEqual(placement.gridLeft - 1);
    expect(grid.overlapWithGrid(placement)).toBeGreaterThan(placement.cellRight - placement.cellLeft);
    expect(await grid.isFlippedHorizontally()).toBe(true);
    expect(await grid.visibleWidthOf(grid.firstOption())).toBeGreaterThan(20);
    expect(await grid.isReachable(grid.firstOption())).toBe(true);
    expect(await grid.isReachable(grid.searchInput())).toBe(true);
  });
});
