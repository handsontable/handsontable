import { test, expect } from '../fixtures/test';
import { DropdownHeightPage } from '../fixtures/pages/DropdownHeightPage';

/**
 * #8872 / DEV-1656: the autocomplete dropdown showed no options when a flexbox parent
 * squeezed the grid. `limitDropdownIfNeeded()` trims the list to whole rows that fit
 * the free space below the edited cell, but its arithmetic returned 0 as soon as that
 * space was not taller than a single row — the list rendered as an invisible sliver,
 * so every choice was hidden. It must keep at least one option visible and every
 * option reachable.
 *
 * Since #8688 the list is positioned against the viewport rather than the grid, so the
 * squeezed grid's root (`overflow: clip` whenever a `height` is set) no longer bounds it:
 * the whole list fits below the cell and nothing is trimmed. The visibility assertions
 * still measure the option against every clipping ancestor, not against the list's own
 * holder, because a holder-only check (and `toBeVisible()`, which only needs a non-empty
 * bounding box) would call a clipped-away option visible if the clip ever came back.
 */
test.describe('autocomplete dropdown height', () => {
  let grid: DropdownHeightPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownHeightPage(page, theme, bundle);
    await grid.goto();
  });

  test('flex-squeezed grid — the editor no longer sizes the list to zero', async () => {
    const listRowHeight = await grid.listRowHeight();

    await grid.openDropdownAt(0, 1);

    // The free space below the cell INSIDE the grid is exactly one list row. The list must
    // never fall below one whole option whatever bounds it. Before the fix this measured ~0-2px.
    expect(await grid.listHeight()).toBeGreaterThanOrEqual(listRowHeight);
  });

  test('flex-squeezed grid — the first option is really on screen', async () => {
    const listRowHeight = await grid.listRowHeight();

    await grid.openDropdownAt(0, 1);

    // An option must survive the grid root's clipping, not just exist in the DOM. The
    // threshold is a clear majority of the row rather than all of it: this fixture picks the
    // tightest space that still triggers the bug, and in that space the clipping root always
    // costs the row a pixel or two (see the spec header). A collapsed list measures 0, so
    // the guard stays decisive while leaving room for per-theme drift.
    expect(await grid.visibleHeightOfOption('Germany')).toBeGreaterThanOrEqual(listRowHeight * 0.8);
  });

  test('flex-squeezed grid — every option is rendered and the last one is reachable from the keyboard',
    async () => {
      const listRowHeight = await grid.listRowHeight();
      const optionCount = await grid.sourceOptionCount();

      await grid.openDropdownAt(0, 1);

      // The list escapes the squeezed grid (#8688), so there is room for all of it: every
      // option is rendered and nothing scrolls. Arrowing past the end still lands on the
      // last option, readable in full.
      await expect(grid.options()).toHaveCount(optionCount);
      expect(await grid.listCanScroll()).toBe(false);

      await grid.arrowDownThroughList(optionCount + 1);

      await expect(grid.optionByText('Spain')).toBeVisible();
      expect(await grid.visibleHeightOfOption('Spain')).toBeGreaterThanOrEqual(listRowHeight * 0.8);
    });

  test('normal-height grid — the untrimmed list keeps showing all options', async () => {
    const optionCount = await grid.sourceOptionCount();

    await grid.openDropdownAt(0, 1, 'grid-tall');

    // Regression guard for the non-flexbox case: there is room for the whole list,
    // so it is not trimmed at all — every option is rendered and nothing scrolls.
    await expect(grid.options('grid-tall')).toHaveCount(optionCount);
    expect(await grid.listCanScroll('grid-tall')).toBe(false);
  });
});
