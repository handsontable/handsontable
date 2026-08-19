import { test, expect } from '../fixtures/test';
import { DropdownHeightPage } from '../fixtures/pages/DropdownHeightPage';

/**
 * #8872 / DEV-1656: the autocomplete dropdown showed no options when a flexbox
 * parent squeezed the grid. `limitDropdownIfNeeded()` trims the list to whole rows
 * that fit the free space below the edited cell, but its arithmetic returned 0 as
 * soon as that space was not taller than a single row — the list rendered as an
 * invisible sliver, so every choice was hidden. It must keep at least one option
 * visible and stay scrollable to reach the rest.
 */
test.describe('autocomplete dropdown height', () => {
  let grid: DropdownHeightPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownHeightPage(page, theme, bundle);
    await grid.goto();
  });

  test('flex-squeezed grid — the list still shows an option instead of collapsing', async () => {
    const rowHeight = await grid.defaultRowHeight();

    await grid.openDropdownAt(0, 1);

    // The free space below the cell is half a row, so the list is trimmed — but it
    // must never fall below one whole option. Before the fix this measured ~0-2px.
    expect(await grid.listHeight()).toBeGreaterThanOrEqual(rowHeight - 2);
  });

  test('flex-squeezed grid — the last option is reachable from the keyboard', async () => {
    const optionCount = await grid.sourceOptionCount();

    await grid.openDropdownAt(0, 1);

    // The trimmed list scrolls, so nothing is silently dropped: arrowing past the
    // end of the list brings the last option into the visible box.
    expect(await grid.listCanScroll()).toBe(true);

    await grid.arrowDownThroughList(optionCount + 1);

    await expect(grid.optionByText('Spain')).toBeVisible();
    expect(await grid.isOptionInsideVisibleList('Spain')).toBe(true);
  });

  test('flex-squeezed grid — the first option is inside the visible list box', async () => {
    await grid.openDropdownAt(0, 1);

    // A 0-height list leaves the option row entirely below the holder's bottom edge,
    // clipped out of sight. The first option must sit within the visible box.
    expect(await grid.isOptionInsideVisibleList('Germany')).toBe(true);
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
