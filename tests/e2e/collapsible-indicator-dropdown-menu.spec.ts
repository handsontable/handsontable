import { test, expect } from '../fixtures/test';
import { CollapsibleIndicatorDropdownMenuPage } from '../fixtures/pages/CollapsibleIndicatorDropdownMenuPage';

/**
 * DEV-214. A press on a CollapsibleColumns indicator stopped the event with the shared
 * `stopImmediatePropagation()` helper, which besides the grid's own flag also sets `cancelBubble`.
 * The press therefore never reached `document`, where the dropdown menu listens for the click that
 * closes it, so the menu stayed open over a group that had just collapsed or expanded.
 */
test.describe('collapsible indicator while the dropdown menu is open', () => {
  let grid: CollapsibleIndicatorDropdownMenuPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new CollapsibleIndicatorDropdownMenuPage(page, theme, bundle);
    await grid.goto();
  });

  test('collapsing the group closes the menu', async () => {
    await grid.expectExpanded();
    await grid.openColumnMenu();

    await grid.clickIndicator();

    await grid.expectCollapsed();
    await expect(grid.openMenu()).toBeHidden();
  });

  test('expanding the group closes the menu', async () => {
    await grid.clickIndicator();
    await grid.expectCollapsed();
    await grid.openColumnMenu();

    await grid.clickIndicator();

    await grid.expectExpanded();
    await expect(grid.openMenu()).toBeHidden();
  });

  test('the press still does not move the selection', async () => {
    await grid.openColumnMenu();
    // Opening the menu from a header selects that whole column.
    const selectionWithMenuOpen = await grid.selection();

    expect(selectionWithMenuOpen).toEqual([[-1, 1, 4, 1]]);

    await grid.clickIndicator();

    await grid.expectCollapsed();
    await expect(grid.openMenu()).toBeHidden();
    // The grid skips selection handling for an indicator press; closing the menu must not change that.
    expect(await grid.selection()).toEqual(selectionWithMenuOpen);
  });
});
