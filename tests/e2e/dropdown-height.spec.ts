import { test, expect } from '../fixtures/test';
import { DropdownHeightPage } from '../fixtures/pages/DropdownHeightPage';

/**
 * #8872 / DEV-1656: the autocomplete dropdown showed no options when a flexbox parent
 * squeezed the grid. `limitDropdownIfNeeded()` trims the list to whole rows that fit
 * the free space below the edited cell, but its arithmetic returned 0 as soon as that
 * space was not taller than a single row — the list rendered as an invisible sliver,
 * so every choice was hidden. It must keep at least one option visible and stay
 * scrollable to reach the rest.
 *
 * The visibility assertions measure the option against every clipping ancestor, not
 * against the list's own holder: the holder lives inside the grid's root element,
 * which carries `overflow: clip` whenever a `height` is set, and it can hang past that
 * root's bottom edge. A holder-only check (and `toBeVisible()`, which only needs a
 * non-empty bounding box) calls a clipped-away option visible.
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

    // The free space below the cell is exactly one list row, so the list is trimmed —
    // but it must never fall below one whole option. Before the fix this measured ~0-2px.
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

  test('flex-squeezed grid — the last option is reachable from the keyboard', async () => {
    const listRowHeight = await grid.listRowHeight();
    const optionCount = await grid.sourceOptionCount();

    await grid.openDropdownAt(0, 1);

    // The trimmed list scrolls, so nothing is silently dropped: arrowing past the end
    // of the list brings the last option on screen, readable in full.
    expect(await grid.listCanScroll()).toBe(true);

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
