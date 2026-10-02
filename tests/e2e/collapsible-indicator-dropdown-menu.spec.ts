import { test, expect } from '../fixtures/test';
import { CollapsibleIndicatorDropdownMenuPage } from '../fixtures/pages/CollapsibleIndicatorDropdownMenuPage';

/**
 * DEV-214. A press on a CollapsibleColumns indicator stopped the event with the shared
 * `stopImmediatePropagation()` helper, which besides the grid's own flag also sets `cancelBubble`.
 * The press therefore never reached `document`, where the dropdown menu listens for the click that
 * closes it, so the menu stayed open over a group that had just collapsed or expanded.
 */
test.describe('collapsible indicator pressed while a menu or editor is open', () => {
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

    expect(selectionWithMenuOpen).toHaveLength(1);

    await grid.clickIndicator();

    await grid.expectCollapsed();
    await expect(grid.openMenu()).toBeHidden();
    // The grid skips selection handling for an indicator press; closing the menu must not change that.
    expect(await grid.selection()).toEqual(selectionWithMenuOpen);
  });

  test('pressing the indicator closes an open context menu too', async () => {
    await grid.openCellContextMenu(2, 0);

    await grid.clickIndicator();

    await grid.expectCollapsed();
    await expect(grid.openContextMenu()).toBeHidden();
  });

  test('pressing the indicator leaves an open cell editor open', async () => {
    await grid.openEditor(2, 0);

    await grid.clickIndicator();

    await grid.expectCollapsed();
    await expect(grid.editor()).toBeVisible();
  });
});
