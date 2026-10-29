import { devices } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

test.describe('menus and the sheets bar on a touch screen', { tag: THEMES_TAG }, () => {
  test('Rename from the tab menu keeps the field open for typing', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await fixture.chevron(0).tap();
    await fixture.menuItem('Rename').tap();
    await expect(fixture.renameInput).toBeFocused();
    await page.keyboard.type('Z');
    await page.keyboard.press('Enter');

    await expect(fixture.tab(0)).toHaveText('Z');
  });

  test('a swipe across an overflowing strip scrolls it and moves no tab', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await page.clock.install();
    await fixture.goto({ sheets: 30 });

    const order = () => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent));
    const before = await order();
    const tab = (await fixture.tab(1).boundingBox())!;
    const y = tab.y + (tab.height / 2);
    const x = tab.x + (tab.width / 2);
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });

    for (let step = 1; step <= 6; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - (step * 30), y }] });
    }

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect.poll(() => fixture.strip.evaluate(strip => strip.scrollLeft)).toBeGreaterThan(0);
    expect(await order()).toEqual(before);
  });

  test('a tab held still lifts, and lifting the finger opens its menu', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await page.clock.install();
    await fixture.goto();

    const tab = (await fixture.tab(0).boundingBox())!;
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: tab.x + (tab.width / 2), y: tab.y + (tab.height / 2) }],
    });
    await page.clock.runFor(600);
    await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--lifted/);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect(fixture.openMenu).toBeVisible();
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveCount(0);
    await expect(fixture.tab(0)).not.toHaveClass(/ht-sheets-bar__tab--lifted/);
  });

  test('a lifted tab sits above its neighbors and keeps an edge in forced colors', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await page.emulateMedia({ forcedColors: 'active' });
    await page.clock.install();
    await fixture.goto();

    const tab = (await fixture.tab(0).boundingBox())!;
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: tab.x + (tab.width / 2), y: tab.y + (tab.height / 2) }],
    });
    await page.clock.runFor(600);
    await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--lifted/);

    const lifted = await fixture.tab(0).evaluate((element) => {
      const style = getComputedStyle(element);

      return { zIndex: style.zIndex, outline: style.outlineStyle };
    });

    expect(lifted).toEqual({ zIndex: '1', outline: 'solid' });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  });

  test('a finger that drifts during the hold still opens the menu on release', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await page.clock.install();
    await fixture.goto();

    const tab = (await fixture.tab(0).boundingBox())!;
    const x = tab.x + (tab.width / 2);
    const y = tab.y + (tab.height / 2);
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 4, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 8, y }] });
    await page.clock.runFor(600);
    await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--lifted/);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 9, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect(fixture.openMenu).toBeVisible();
    await expect(fixture.tab(0)).not.toHaveClass(/ht-sheets-bar__tab--dragging/);
  });

  test('a repaint during the hold keeps the press', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await page.clock.install();
    await fixture.goto();

    const tab = (await fixture.tab(0).boundingBox())!;
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: tab.x + (tab.width / 2), y: tab.y + (tab.height / 2) }],
    });
    await page.clock.runFor(200);
    await page.evaluate(() => {
      const plugin = (window as any).hot.getPlugin('sheetsBar');

      plugin.renameSheet(plugin.getSheets()[2].id, 'Renamed');
    });
    await expect(fixture.tab(2)).toHaveText('Renamed');
    await page.clock.runFor(400);

    await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--lifted/);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(fixture.openMenu).toBeVisible();
  });

  test('a context menu item tapped on a cell still runs', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ menus: true });

    const before = await page.evaluate(() => (window as any).hot.countRows());

    await page.evaluate(() => {
      const hot = (window as any).hot;
      const cell = hot.getCell(1, 1).getBoundingClientRect();

      hot.selectCell(1, 1);
      hot.getPlugin('contextMenu').open({ top: cell.bottom, left: cell.left });
    });
    await page.locator('.htContextMenu td', { hasText: 'Insert row above' }).tap();

    await expect.poll(() => page.evaluate(() => (window as any).hot.countRows())).toBe(before + 1);
    await expect(page.locator('.htContextMenu:visible')).toHaveCount(0);
  });

  test('the filter controls in a dropdown menu answer taps', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ menus: true });

    const countRows = () => page.evaluate(() => (window as any).hot.countRows());
    const before = await countRows();

    await page.locator('.ht_clone_top th').nth(1).locator('.changeType').tap();

    const search = page.locator('.htFiltersMenuValue .htUIMultipleSelectSearch input').first();

    await search.tap();
    await expect(search).toBeFocused();

    const checkbox = page.locator('.htUIMultipleSelectHot input[type=checkbox]').first();

    await expect(checkbox).toBeChecked();
    await checkbox.tap();
    await expect(checkbox).not.toBeChecked();

    await page.locator('.htUIButtonOK input').first().tap();

    await expect.poll(countRows).toBeLessThan(before);
  });

  test('a submenu parent in the context menu opens its submenu on a tap', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ menus: true });
    await page.evaluate(() => {
      const hot = (window as any).hot;
      const cell = hot.getCell(1, 1).getBoundingClientRect();

      hot.selectCell(1, 1);
      hot.getPlugin('contextMenu').open({ top: cell.bottom, left: cell.left });
    });
    await page.locator('.htContextMenu:not([class*="htContextMenuSub_"]) td', { hasText: 'Alignment' }).tap();

    await expect(page.locator('[class*="htContextMenuSub_"]:visible')).toHaveCount(1);
  });

  test('a dropdown menu item tapped on a column header still runs', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ menus: true });

    const before = await page.evaluate(() => (window as any).hot.countCols());

    await page.locator('.ht_clone_top .changeType').first().tap();
    await page.locator('.htDropdownMenu td', { hasText: 'Insert column left' }).tap();

    await expect.poll(() => page.evaluate(() => (window as any).hot.countCols())).toBe(before + 1);
  });
});
