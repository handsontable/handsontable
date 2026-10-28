import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';
import type { Locator } from '@playwright/test';

/**
 * Reads a one-pixel line along one edge of an element, inset from its corners.
 *
 * @param {Locator} element The element.
 * @param {'top' | 'bottom'} edge The edge to read.
 * @returns {Promise<Buffer>} The pixels.
 */
async function edgePixels(element: Locator, edge: 'top' | 'bottom'): Promise<Buffer> {
  const box = await element.boundingBox();

  expect(box, 'the element is laid out').not.toBeNull();

  const { x, y, height } = box!;

  return element.page().screenshot({
    clip: { x: x + 4, y: edge === 'top' ? y : y + height - 1, width: 16, height: 1 },
    animations: 'disabled',
  });
}

test.describe('sheets bar UI and accessibility', { tag: THEMES_TAG }, () => {
  test('the tab menu trigger is a 24 by 24 px target', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();

    const hits = await fixture.chevron(0).evaluate((chevron) => {
      const box = chevron.getBoundingClientRect();
      const centerX = box.left + (box.width / 2);
      const centerY = box.top + (box.height / 2);
      const points = [[-11, 0], [11, 0], [0, -11], [0, 11]];

      return points.map(([dx, dy]) => {
        const hit = document.elementFromPoint(centerX + dx, centerY + dy);

        return hit !== null && chevron.contains(hit);
      });
    });

    expect(hits).toEqual([true, true, true, true]);
  });

  test('the tab menu and the all-sheets menu hang from their anchor in RTL', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ rtl: true });

    const edges = async(anchor: Locator) => anchor.evaluate((element) => {
      const menu = [...document.querySelectorAll<HTMLElement>('.htSheetsBarMenu')]
        .find(candidate => candidate.offsetParent !== null) as HTMLElement;

      return { anchorEnd: element.getBoundingClientRect().right, menuEnd: menu.getBoundingClientRect().right };
    });

    await fixture.chevron(0).click();
    await expect(fixture.openMenu).toBeVisible();

    const tabMenu = await edges(fixture.chevron(0));

    expect(Math.abs(tabMenu.menuEnd - tabMenu.anchorEnd)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(fixture.openMenu).toHaveCount(0);
    await fixture.allButton.click();
    await expect(fixture.openMenu).toBeVisible();

    const allSheetsMenu = await edges(fixture.allButton);

    expect(Math.abs(allSheetsMenu.menuEnd - allSheetsMenu.anchorEnd)).toBeLessThanOrEqual(1);
  });

  test('the all-sheets menu is named and offers its sheets as a single choice', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await fixture.allButton.click();

    await expect(page.getByRole('menu', { name: 'All sheets' })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'Sheet 1' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('menuitemradio', { name: 'Sheet 2' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('menuitemcheckbox')).toHaveCount(0);
  });

  test('the strip is one Tab stop, and the arrow keys move it', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ sheets: 30 });
    await fixture.allButton.focus();
    await page.keyboard.press('Tab');
    await expect(fixture.activeTab).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('.ht-sheets-bar__tab:focus')).toHaveCount(0);

    await page.keyboard.press('Shift+Tab');
    await expect(fixture.activeTab).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(fixture.tab(1)).toBeFocused();
    await expect(fixture.tab(1)).toHaveAttribute('tabindex', '0');
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '-1');
  });

  test('the grid is named after the sheet it shows', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await expect(page.getByRole('treegrid', { name: 'Sheet 1' })).toBeAttached();

    await fixture.tab(1).click();
    await expect(page.getByRole('treegrid', { name: 'Sheet 2' })).toBeAttached();

    await fixture.tab(1).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Budget');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('treegrid', { name: 'Budget' })).toBeAttached();
  });

  test('a name the host gave the grid is kept', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ hostLabel: 'Quarterly report' });
    await fixture.tab(1).click();
    await expect(page.getByRole('treegrid', { name: 'Quarterly report' })).toBeAttached();
  });

  test('duplicating and moving a sheet from its menu is announced politely', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const politeRegion = page.locator('[aria-live="polite"]');

    await fixture.goto();
    await fixture.chevron(0).click();
    await fixture.menuItem('Duplicate').click();

    const copyName = await page.evaluate(() => (window as any).hot.getPlugin('sheetsBar').getSheets()[1].name);

    await expect(politeRegion).toContainText(`Sheet Sheet 1 duplicated as ${copyName}`);

    await fixture.chevron(0).click();
    await fixture.menuItem('Move right').click();
    await expect(politeRegion).toContainText('Sheet Sheet 1 moved to position 2 of 4');
  });

  test('the bar follows the colorScheme and density of its grid', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ colorScheme: 'dark', density: 'compact' });

    const tokens = await fixture.bar.evaluate((bar) => {
      const wrapper = bar.closest('.ht-root-wrapper') as HTMLElement;
      const read = (element: Element, name: string) => getComputedStyle(element).getPropertyValue(name).trim();

      return {
        bar: [read(bar, '--ht-background-color'), read(bar, '--ht-cell-vertical-padding')],
        grid: [read(wrapper, '--ht-background-color'), read(wrapper, '--ht-cell-vertical-padding')],
      };
    });

    expect(tokens.bar).toEqual(tokens.grid);
  });

  test.describe('the tab strip', () => {
    test('reveals the active tab on first paint', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, activeSheet: 25 });
      await expect.poll(() => fixture.tabInStrip(25)).toBe(true);
    });

    test('reveals a tab activated while the grid was hidden once it is shown', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, hidden: true });
      await fixture.setActiveSheet(25);
      await fixture.showHost();
      await expect.poll(() => fixture.tabInStrip(25)).toBe(true);
    });

    test('reveals the tab the arrow keys move the focus to', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30 });
      await fixture.activeTab.focus();

      for (let step = 0; step < 20; step += 1) {
        await page.keyboard.press('ArrowRight');
      }

      await expect(fixture.tab(20)).toBeFocused();
      await expect.poll(() => fixture.tabInStrip(20)).toBe(true);

      await page.keyboard.press('End');
      await expect(fixture.tab(29)).toBeFocused();
      await expect.poll(() => fixture.tabInStrip(29)).toBe(true);
    });

    test('a press on another tab during a rename commits the name and switches', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
      await fixture.renameInput.fill('Draft');
      await fixture.tab(1).click();

      await expect(fixture.tab(0)).toHaveText('Draft');
      await expect(fixture.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);
    });

    test('a repaint the rename did not cause keeps the name being typed', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
      await fixture.renameInput.fill('Draft');
      await page.evaluate(() => (window as any).hot.getPlugin('sheetsBar').addSheet('Added'));

      await expect(fixture.renameInput).toHaveValue('Draft');
      await expect(fixture.renameInput).toBeFocused();
    });

    test('a cell selected before Tab moved the focus into the bar comes back with its sheet', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await page.evaluate(() => (window as any).hot.selectCell(5, 3));
      await page.keyboard.press('Tab');
      await expect(fixture.addButton).toBeFocused();

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(fixture.activeTab).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await expect(fixture.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);

      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Enter');
      await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--active/);
      await expect.poll(() => page.evaluate(() => (window as any).hot.getSelected())).toEqual([[5, 3, 5, 3]]);
    });
  });

  test.describe('forced colors', () => {
    test.beforeEach(async({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
    });

    test('the active tab keeps a visible marker', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();

      expect(await edgePixels(fixture.tab(0), 'bottom'))
        .not.toEqual(await edgePixels(fixture.tab(1), 'bottom'));
    });

    test('the rename field keeps a visible edge', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
      await expect(fixture.renameInput).toBeFocused();

      expect(await edgePixels(fixture.tab(0), 'top'))
        .not.toEqual(await edgePixels(fixture.tab(1), 'top'));
    });
  });
});
