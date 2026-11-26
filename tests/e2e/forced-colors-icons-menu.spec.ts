import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * Forced colors (a Windows contrast theme) repaints every background with a system color and drops box
 * shadows. Two parts of the grid were built from exactly those: a mask icon is a masked
 * `background-color`, so the column menu button in a header showed nothing, and a menu marked its
 * highlighted item with an inset box shadow, so the item the arrow keys moved to looked like the others
 * (WCAG 1.4.11, 1.4.1, 2.4.7).
 *
 * Both are judged from what is painted. The computed style keeps the author's value in forced colors,
 * so it reads the same with the defect and without it.
 */
test.describe('forced colors', { tag: THEMES_TAG }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('draw the column menu button icon in a header', async({ page }) => {
    const button = page.locator('.ht_clone_top .changeType').first();
    const icon = button.locator('.ht-icon');

    await expect(button).toBeVisible();
    await expect(icon).toHaveCount(1);

    const drawn = await button.screenshot();

    // The reference is the same button with its icon taken out. An icon forced colors does not draw
    // leaves the two captures equal.
    // A stylesheet rule, not an inline style: the grid can draw the header again and build a new icon
    // element, which an inline style would not follow.
    await page.addStyleTag({ content: '.ht_clone_top .changeType .ht-icon { visibility: hidden !important; }' });
    await expect(icon).toHaveCSS('visibility', 'hidden');

    const withoutIcon = await button.screenshot();

    expect(drawn.equals(withoutIcon), 'the icon changes what the button looks like').toBe(false);
  });

  test('mark the menu item the arrow keys move to', async({ page }) => {
    await grid.cell(1, 1).click();
    // The menu opens over the clicked cell. The pointer leaves the grid first, or the item under it
    // takes the hover look and the two captures compare a hover, not the keyboard highlight.
    await page.mouse.move(0, 0);
    await page.keyboard.press('Shift+F10');

    const items = page.locator('.htContextMenu .ht_master .htCore tbody td:not(.htSeparator):not(.htDisabled)');

    await expect(items.first()).toBeVisible();

    // The item ArrowDown lands on: the one after the highlighted item, or the first when the menu
    // opened with none highlighted.
    const highlightedIndex = await items.evaluateAll(cells => cells.findIndex(cell => cell.classList.contains('current')));
    const target = items.nth(highlightedIndex + 1);

    await expect(target).not.toHaveClass(/\bcurrent\b/);

    const atRest = await target.screenshot();

    await page.keyboard.press('ArrowDown');

    await expect(target).toHaveClass(/\bcurrent\b/);

    const highlighted = await target.screenshot();

    expect(highlighted.equals(atRest), 'the highlighted item looks different from the item at rest').toBe(false);
    // The mark is an outline, which forced colors keeps, in a system color.
    await expect(target).toHaveCSS('outline-style', 'solid');
    await expect(target).toHaveCSS('outline-width', '2px');
    await expect(target).toHaveCSS('outline-offset', '-2px');
  });
  test('draw the mark of a checked checkbox, and none on an unchecked one', async({ page }) => {
    // The first checkbox cell the grid draws, found by its input: the column's place is the fixture's.
    const coords = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="grid"] .ht_master td input[type="checkbox"]');
      const cell = input?.closest('td');
      const hot = (document.querySelector('.ht-root-wrapper') as unknown as {
        __hotInstance: { getCoords: (element: Element) => { row: number, col: number } },
      }).__hotInstance;
      const found = cell ? hot.getCoords(cell) : null;

      return found ? [found.row, found.col] : null;
    });

    expect(coords, 'the fixture draws a checkbox cell').not.toBeNull();

    const [row, column] = coords as [number, number];
    const cell = grid.cell(row, column);
    const input = cell.locator('input[type="checkbox"]');
    const HIDE_MARK = '[data-testid="grid"] td input[type="checkbox"] + .ht-icon { visibility: hidden !important; }';

    // Unchecked: the mark is in the DOM, and the themes hide it with a transparent color only. A capture
    // with the mark taken out must equal the one with it in.
    await grid.setDataAt(row, column, false);
    await expect(input).not.toBeChecked();
    await expect(cell.locator('.ht-icon')).toHaveCount(1);

    const unchecked = await cell.screenshot();
    const hideForUnchecked = await page.addStyleTag({ content: HIDE_MARK });

    await expect(cell.locator('.ht-icon')).toHaveCSS('visibility', 'hidden');
    expect((await cell.screenshot()).equals(unchecked), 'an unchecked box shows no mark').toBe(true);

    await hideForUnchecked.evaluate(style => style.remove());

    // Checked: the mark is drawn, so taking it out changes the capture.
    await grid.setDataAt(row, column, true);
    await expect(input).toBeChecked();
    await expect(cell.locator('.ht-icon')).toHaveCSS('visibility', 'visible');

    const checked = await cell.screenshot();

    await page.addStyleTag({ content: HIDE_MARK });
    await expect(cell.locator('.ht-icon')).toHaveCSS('visibility', 'hidden');

    expect((await cell.screenshot()).equals(checked), 'a checked box shows its mark').toBe(false);
    expect(checked.equals(unchecked), 'a checked box looks different from an unchecked one').toBe(false);
  });
});
