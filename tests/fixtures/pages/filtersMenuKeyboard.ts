import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Opens a column's dropdown menu from the keyboard: selects the cell through the API, then presses
 * Alt+Shift+ArrowDown, and waits for the menu. Shared by the filter page objects.
 *
 * @param {Page} page The Playwright page.
 * @param {Locator} menu The dropdown menu the key opens.
 * @param {number} row The visual row index of the cell to select.
 * @param {number} col The visual column index of the cell to select.
 */
export async function openMenuWithKeyboard(page: Page, menu: Locator, row: number, col: number): Promise<void> {
  await page.evaluate(([r, c]) => (window as unknown as {
    hot: { selectCell: (row: number, column: number) => void }
  }).hot.selectCell(r, c), [row, col]);
  await page.keyboard.press('Alt+Shift+ArrowDown');
  await expect(menu).toBeVisible();
}

/**
 * Chooses a condition in the focused "Filter by condition" select from the keyboard: Enter opens its
 * list, ArrowDown walks to the wanted item, Enter accepts it. Fails loudly when ArrowDown never reaches
 * the item, so a later assertion cannot blame the focus order for a walk that stopped short. The caller
 * asserts where the focus lands next.
 *
 * Shared by the filter page objects, so a fix to the walk (the highlight selector, the step limit) lands
 * once.
 *
 * @param {Page} page The Playwright page.
 * @param {Locator} conditionsMenu The open condition list (`.htFiltersConditionsMenu:visible`).
 * @param {string} label The condition's visible label, e.g. `Contains`.
 */
export async function chooseConditionWithKeyboard(page: Page, conditionsMenu: Locator, label: string): Promise<void> {
  const highlighted = conditionsMenu.locator('td.current');

  await page.keyboard.press('Enter');
  await expect(conditionsMenu).toBeVisible();

  for (let i = 0; i < 20; i++) {
    if ((await highlighted.count()) === 1 && (await highlighted.innerText()).trim() === label) {
      await page.keyboard.press('Enter');
      await expect(conditionsMenu).toBeHidden();

      return;
    }

    await page.keyboard.press('ArrowDown');
  }

  throw new Error(`ArrowDown never reached the ${JSON.stringify(label)} condition`);
}
