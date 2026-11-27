import { test, expect, THEMES_TAG } from '../fixtures/test';
import { ForcedColorsPage, type ForcedColorsIcons } from '../fixtures/pages/ForcedColorsPage';

/**
 * Forced colors (a Windows contrast theme) repaints every background with a system color and drops box
 * shadows. Two parts of the grid were built from exactly those: a mask icon is a masked
 * `background-color`, so the column menu button in a header showed nothing, and a menu or a list marked
 * its highlighted and hovered item with an inset box shadow or a background, so that item looked like
 * the others (WCAG 1.4.11, 1.4.1, 2.4.7).
 *
 * What is drawn is judged from captures. The computed style keeps the author's value in forced colors,
 * so it reads the same with the defect and without it. The system colors are read from the page,
 * because each browser resolves them to its own values.
 */
test.describe('forced colors', { tag: THEMES_TAG }, () => {
  let grid: ForcedColorsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ForcedColorsPage(page, theme, bundle);
  });

  test('draw the column menu button icon in a header', async() => {
    await grid.goto();

    const button = grid.headerMenuButton(0);

    await expect(button).toBeVisible();
    expect(await grid.drawsElement(button, button.locator('.ht-icon'), '.ht_clone_top .changeType .ht-icon'),
      'the icon changes what the button looks like').toBe(true);
  });

  test('draw a pager button icon in the button color, and in the disabled color when disabled', async() => {
    await grid.goto();

    // Page 1: first and previous are disabled, next and last are not.
    const first = grid.pagerButton('first');
    const next = grid.pagerButton('next');

    await expect(first).toBeDisabled();
    await expect(next).toBeEnabled();

    expect(await grid.drawsElement(first, first.locator('.ht-icon'), '.ht-pagination .ht-page-first .ht-icon'),
      'the disabled button draws its icon').toBe(true);
    expect(await grid.drawsElement(next, next.locator('.ht-icon'), '.ht-pagination .ht-page-next .ht-icon'),
      'the enabled button draws its icon').toBe(true);

    const grayText = await grid.systemColor('GrayText');

    expect(grayText).not.toBe(await grid.systemColor('CanvasText'));
    await expect(first.locator('.ht-icon')).toHaveCSS('color', grayText);
    await expect(next.locator('.ht-icon')).toHaveCSS('color', await grid.systemColor('ButtonText'));
  });

  test('mark the menu item the arrow keys move to', async() => {
    await grid.goto();
    await grid.openContextMenu(1, 1);

    const items = grid.contextMenuItems;
    // The item ArrowDown lands on: the one after the highlighted item, or the first when the menu
    // opened with none highlighted.
    const highlightedIndex = await items.evaluateAll(cells => cells.findIndex(cell => cell.classList.contains('current')));
    const target = items.nth(highlightedIndex + 1);

    await expect(target).not.toHaveClass(/\bcurrent\b/);

    const atRest = await target.screenshot();

    await grid.page.keyboard.press('ArrowDown');
    await expect(target).toHaveClass(/\bcurrent\b/);

    expect((await target.screenshot()).equals(atRest), 'the highlighted item looks different from the item at rest')
      .toBe(false);
    // The mark is an outline, which forced colors keeps, in the system highlight color.
    await expect(target).toHaveCSS('outline-style', 'solid');
    await expect(target).toHaveCSS('outline-width', '2px');
    await expect(target).toHaveCSS('outline-offset', '-2px');
    expect(await grid.outlineColor(target)).toBe(await grid.systemColor('Highlight'));
  });

  test('mark the menu item under the pointer', async() => {
    await grid.goto();
    await grid.openContextMenu(1, 1);

    // An item with a submenu: hovering it opens the submenu and leaves the item without the
    // highlight class, so only the hover rule can mark it. Hovering a plain item moves the highlight
    // to it, which the arrow-key test covers.
    const target = grid.page.locator('.htContextMenu .ht_master td.htSubmenu').first();

    await expect(target).not.toHaveClass(/\bcurrent\b/);

    const atRest = await target.screenshot();

    await target.hover();
    await expect(target).toHaveAttribute('aria-expanded', 'true');
    await expect(target).not.toHaveClass(/\bcurrent\b/);

    // The capture alone is not enough here: the submenu arrow changes when the submenu opens. The
    // outline, which forced colors keeps, is what marks the item.
    expect((await target.screenshot()).equals(atRest), 'the item under the pointer looks different').toBe(false);
    await expect(target).toHaveCSS('outline-style', 'solid');
    expect(await grid.outlineColor(target)).toBe(await grid.systemColor('Highlight'));
  });

  test('mark the highlighted row of the dropdown editor list', async() => {
    await grid.goto();
    await grid.openDropdownEditor(0);

    const items = grid.dropdownListItems;
    const target = items.nth(1);

    await expect(target).not.toHaveClass(/\bcurrent\b/);

    const atRest = await target.screenshot();

    await grid.page.keyboard.press('ArrowDown');
    await expect(target).toHaveClass(/\bcurrent\b/);

    expect((await target.screenshot()).equals(atRest), 'the highlighted row looks different from the row at rest')
      .toBe(false);
    expect(await grid.outlineColor(target)).toBe(await grid.systemColor('Highlight'));
  });

  test('mark the highlighted row of the all-sheets menu', async() => {
    await grid.goto();
    await grid.openAllSheetsMenu();

    const target = grid.allSheetsMenuItems.nth(1);

    await expect(target).not.toHaveClass(/\bcurrent\b/);

    const atRest = await target.screenshot();

    await grid.page.keyboard.press('ArrowDown');
    await grid.page.keyboard.press('ArrowDown');
    await expect(target).toHaveClass(/\bcurrent\b/);

    expect((await target.screenshot()).equals(atRest), 'the highlighted row looks different from the row at rest')
      .toBe(false);
    expect(await grid.outlineColor(target)).toBe(await grid.systemColor('Highlight'));
  });

  for (const icons of ['mask', 'external'] as ForcedColorsIcons[]) {
    test(`draw the mark of a checked checkbox, and none on an unchecked one (${icons} icons)`, async() => {
      await grid.goto(icons);

      const cell = grid.cell(0, 1);
      const mark = cell.locator('.ht-icon');
      const selector = '[data-testid="grid"] td input[type="checkbox"] + .ht-icon';

      await expect(mark).toHaveCount(1);

      // Unchecked: the mark is in the DOM, and the themes hide it with a transparent color only.
      await grid.setDataAt(0, 1, false);
      await expect(grid.checkbox(0)).not.toBeChecked();

      const unchecked = await cell.screenshot();

      expect(await grid.drawsElement(cell, mark, selector), 'an unchecked box shows no mark').toBe(false);

      // Checked: the mark is drawn.
      await grid.setDataAt(0, 1, true);
      await expect(grid.checkbox(0)).toBeChecked();
      await expect(mark).toHaveCSS('visibility', 'visible');

      expect(await grid.drawsElement(cell, mark, selector), 'a checked box shows its mark').toBe(true);
      expect((await cell.screenshot()).equals(unchecked), 'a checked box looks different from an unchecked one')
        .toBe(false);
    });

    test(`draw the mark of the checked radio button only (${icons} icons)`, async() => {
      await grid.goto(icons);
      await grid.openFiltersWithCondition();

      const [and, or] = [grid.operatorRadios.nth(0), grid.operatorRadios.nth(1)];

      await expect(and).toBeChecked();
      await expect(or).not.toBeChecked();

      const operators = grid.page.locator('.htDropdownMenu .htFiltersMenuOperators');
      const andMark = and.locator('xpath=following-sibling::*[contains(@class, "ht-icon")][1]');
      const orMark = or.locator('xpath=following-sibling::*[contains(@class, "ht-icon")][1]');

      expect(await grid.drawsElement(operators, andMark, '.htFiltersMenuOperators input:checked + .ht-icon'),
        'the checked radio button shows its mark').toBe(true);
      expect(await grid.drawsElement(operators, orMark, '.htFiltersMenuOperators input:not(:checked) + .ht-icon'),
        'the unchecked radio button shows no mark').toBe(false);
    });
  }
});
