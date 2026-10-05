import { test, expect } from '../fixtures/test';
import { NarrowHeaderMenuButtonPage } from '../fixtures/pages/NarrowHeaderMenuButtonPage';

/**
 * DEV-158. A column dragged to its narrowest left the header's menu button hanging over the
 * neighbouring header. The narrowest width used to be a flat 20px, and the label and the sort
 * indicator kept their room, so the button - the only way into the menu - was pushed out of its own cell
 * while the neighbour painted over it.
 *
 * The narrowest width is now the icon size plus the cell padding on both sides, and the header gives
 * things up in a fixed order as it narrows: the label text, then the sort indicator, and the menu button
 * last. Both are layout facts (a clamp against the stored width, percentages against the header's own
 * width), so none of this is checkable in jsdom, where every size is zero.
 *
 * The widths come from a real drag on the resize handle, so the stored width is produced the way a
 * user produces it. The floor is read from the theme's own tokens, so the same assertions hold on all
 * three themes, which are 24, 32 and 40px wide at the floor.
 */
test.describe('Narrow header with a menu button', () => {
  let grid: NarrowHeaderMenuButtonPage;

  // Column 1 has the longest label, so it is the one that fights the menu button hardest.
  const COLUMN = 1;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NarrowHeaderMenuButtonPage(page, theme, bundle);
    await grid.goto();
  });

  for (const [testId, direction] of [
    ['menu', 'a plain'],
    ['menu-sort', 'a sortable'],
    ['menu-sort-right', 'a right-aligned sortable'],
    ['menu-sort-rtl', 'a right-to-left sortable'],
    ['menu-sort-rtl-left', 'a right-to-left, left-aligned sortable'],
  ] as const) {
    test(`stops ${direction} column at the width that fits its menu button`, async () => {
      const minimum = await grid.minimumWidth(testId);
      // A right-to-left column narrows when its handle moves toward the inline end.
      const delta = testId.includes('-rtl') ? 400 : -400;

      await grid.dragColumnHandle(testId, COLUMN, delta);

      // The drag overshoots by hundreds of pixels, so the width is the floor and nothing else.
      expect((await grid.geometry(testId, COLUMN)).width).toBe(minimum);
    });

    test(`keeps the menu button of ${direction} column inside its own header at the narrowest width`, async () => {
      await grid.dragColumnHandle(testId, COLUMN, testId.includes('-rtl') ? 400 : -400);

      const { width, icon } = await grid.geometry(testId, COLUMN);

      // The icon, not its larger hit area: the hit area overhangs by design, the icon must not.
      // A pixel of slack for the border that the header's box includes.
      expect(icon[0]).toBeGreaterThanOrEqual(-1);
      expect(icon[1]).toBeLessThanOrEqual(width + 1);
    });
  }

  test('keeps the menu button of a sorted column inside its header, and hides the indicator', async () => {
    await grid.sortColumn('menuSort', COLUMN);
    await grid.dragColumnHandle('menu-sort', COLUMN);

    const { width, icon, indicator } = await grid.geometry('menu-sort', COLUMN);

    expect(icon[0]).toBeGreaterThanOrEqual(-1);
    expect(icon[1]).toBeLessThanOrEqual(width + 1);
    // The indicator gives way before the menu button does.
    expect(indicator).toBe(0);
  });

  test('keeps the sort indicator while the column is wide enough for it', async () => {
    // The control for the test above: the indicator is hidden by the narrow-header rule, not always.
    await grid.sortColumn('menuSort', COLUMN);
    await grid.dragColumnHandle('menu-sort', COLUMN, 120);

    const { width, icon, indicator } = await grid.geometry('menu-sort', COLUMN);

    expect(width).toBeGreaterThan(await grid.minimumWidth('menu-sort'));
    expect(indicator).toBeGreaterThan(0);
    expect(icon[1]).toBeLessThanOrEqual(width + 1);
  });
});
