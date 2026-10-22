import { test, expect, THEMES_TAG, MOTION_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * The timing of each animated theme: the base transition `T` and the marker slide (`2.25 × T`).
 */
const SPEC_TIMING: Record<string, { transition: number, marker: number }> = {
  main: { transition: 150, marker: 337.5 },
  horizon: { transition: 200, marker: 450 },
};

/**
 * An `animation` value that turns on every motion, like the default `true`, in another shape: sent with
 * the same `sheets`, it keeps the workbook but rebuilds the bar, which hands the running motion over.
 */
const EVERY_MOTION = { switch: true, add: true, remove: true, move: true };

/**
 * Freezes the page clock once the fixture has loaded, so the timers that end the slide only run
 * when the test advances time, and holds every CSS transition at its start for
 * the test to seek.
 */
async function openPaused(bar: SheetsBarPage, options: Parameters<SheetsBarPage['goto']>[0] = {}): Promise<void> {
  await bar.gotoWithPausedClock(options);
  await bar.holdTransitions();
}

/**
 * Asserts that two horizontal boxes match to within the one pixel `offsetLeft` rounding allows.
 */
function expectSameBox(actual: { left: number, width: number }, expected: { left: number, width: number }): void {
  expect(Math.abs(actual.left - expected.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(1);
}

/**
 * The slide is cleaned up by a timer, so every animated case freezes the page clock once the
 * fixture has loaded: the indicator then lives until the test advances time past its duration.
 * The CSS transitions run on real time, so the cases hold them at their start and seek them.
 */
test.describe('sheets bar switch animation – active tab marker', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('the marker slides from the previous tab to the new one', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordIndicators();

    const oldTab = await bar.tabBox(0);

    await bar.clickTab(1);

    const newTab = await bar.tabBox(1);

    await expect(bar.indicator).toHaveCount(1);
    await expect(bar.indicator).toHaveAttribute('aria-hidden', 'true');
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);
    expect(await bar.indicatorsAdded()).toBe(1);
    expect(Math.abs(newTab.left - oldTab.left)).toBeGreaterThan(10);

    const start = await bar.indicatorBoxAt(0);
    const end = await bar.indicatorBoxAt(1);

    expect(start.transitions).toBeGreaterThan(0);
    expectSameBox(start, oldTab);
    expectSameBox(end, newTab);
  });

  test('the marker is removed after the slide and the new tab carries the active styling', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const duration = SPEC_TIMING[theme].marker;

    await bar.clickTab(1);
    await page.clock.runFor(Math.floor(duration) - 1);

    await expect(bar.indicator).toHaveCount(1);

    await page.clock.runFor(2);

    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);
    await expect(bar.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);
    await bar.expectCell(0, 0, 'B1');
  });

  test('a switch during a slide starts the new slide where the marker is on screen', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const firstTab = await bar.tabBox(0);
    const secondTab = await bar.tabBox(1);

    await bar.clickTab(1);

    const midway = await bar.indicatorBoxAt(0.5);

    expect(Math.abs(midway.left - firstTab.left)).toBeGreaterThan(2);
    expect(Math.abs(midway.left - secondTab.left)).toBeGreaterThan(2);

    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').setActiveSheet('Gamma'));

    await expect(bar.indicator).toHaveCount(1);
    expectSameBox(await bar.indicatorBoxAt(0), midway);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(2));
  });

  test('a tab drag that starts during a slide removes the marker', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.indicator).toHaveCount(1);

    const tab = await bar.tab(2).boundingBox();

    if (tab === null) {
      throw new Error('Tab 2 is not rendered');
    }

    await page.mouse.move(tab.x + (tab.width / 2), tab.y + (tab.height / 2));
    await page.mouse.down();
    await page.mouse.move(tab.x + (tab.width / 2) + 30, tab.y + (tab.height / 2), { steps: 3 });

    await expect(bar.tab(2)).toHaveClass(/ht-sheets-bar__tab--dragging/);
    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);

    await page.mouse.up();
  });

  test('a rename that starts during a slide removes the marker', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    await expect(bar.indicator).toHaveCount(1);

    await bar.tab(1).locator('.ht-sheets-bar__tab-label').dblclick();

    await expect(bar.renameInput).toBeVisible();
    await expect(bar.indicator).toHaveCount(0);
  });

  test('under RTL the marker slides toward the inline end', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { rtl: true });

    const oldTab = await bar.tabBox(0);

    await bar.clickTab(1);

    const newTab = await bar.tabBox(1);
    const start = await bar.indicatorBoxAt(0);
    const end = await bar.indicatorBoxAt(1);

    expect(newTab.left).toBeLessThan(oldTab.left);
    expectSameBox(start, oldTab);
    expectSameBox(end, newTab);
  });

  test('only the tabs the marker passes over show it through their background', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.bar.evaluate((element) => {
      element.style.setProperty('--ht-sheets-bar-tab-background-color', 'rgb(255, 0, 0)');
    });

    await expect.poll(() => bar.tabBackground(2)).toBe('rgb(255, 0, 0)');

    await bar.clickTab(1);

    await expect(bar.indicator).toHaveCount(1);
    expect(await bar.tabBackground(0)).toBe('rgba(0, 0, 0, 0)');
    expect(await bar.tabBackground(1)).toBe('rgba(0, 0, 0, 0)');
    expect(await bar.tabBackground(2)).toBe('rgb(255, 0, 0)');
  });

  test('an opaque inactive tab surface stays visible on the tabs the marker passes over', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.bar.evaluate((element) => {
      element.style.setProperty('--ht-sheets-bar-tab-background-color', 'rgb(255, 0, 0)');
    });

    await expect.poll(() => bar.tabSurfaceColor(1)).toBe('rgb(255, 0, 0)');

    await bar.clickTab(2);
    await bar.indicatorBoxAt(0);

    await expect(bar.tab(1)).toHaveClass(/ht-sheets-bar__tab--indicator-path/);
    expect(await bar.tabSurfaceColor(1)).toBe('rgb(255, 0, 0)');
  });

  test('a wrapper re-sending the same sheets leaves the bar and its sliding marker as they are', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);

    const midway = await bar.indicatorBoxAt(0.5);

    await bar.rememberBarElements();
    await bar.resendSheetsSetting();

    expect(await bar.barElementsKept()).toBe(true);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);

    const kept = await bar.indicatorBox();

    expect(kept.transitions).toBeGreaterThan(0);
    expectSameBox(kept, midway);
  });

  test('a round trip that rebuilds the bar keeps the marker sliding from where it is', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const duration = SPEC_TIMING[theme].marker;

    await bar.clickTab(1);

    const midway = await bar.indicatorBoxAt(0.5);

    await bar.setAnimation(EVERY_MOTION);

    await expect(bar.indicator).toHaveCount(1);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);

    const resumed = await bar.indicatorBoxAt(0);

    expect(resumed.transitions).toBeGreaterThan(0);
    expectSameBox(resumed, midway);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(1));

    await page.clock.runFor(Math.ceil(duration) + 1);

    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--indicator-moving/);
  });

  test('removing the active tab from the middle slides the marker onto the tab that takes its place', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const duration = SPEC_TIMING[theme].marker;

    await bar.clickTab(1);
    await page.clock.runFor(Math.ceil(duration) + 1);

    await expect(bar.indicator).toHaveCount(0);

    const removedTab = await bar.tabBox(1);

    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.removeSheet(plugin.getSheets()[1].id);
    });

    await expect(bar.tabByName('Beta')).toHaveCount(0);
    await bar.expectActiveTab(1);
    await expect(bar.indicator).toHaveCount(1);

    const landingMotion = await bar.stripMotionAt('Gamma', 0);
    const landing = { left: landingMotion.restLeft, width: landingMotion.width };

    expectSameBox(await bar.indicatorBoxAt(0), removedTab);
    expectSameBox(await bar.indicatorBoxAt(1), landing);
    await bar.expectCell(0, 0, 'G1');
  });

  test('an afterSheetTabChange listener that adds a tab leaves the marker landing on the active tab', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.addHookOnce('afterSheetTabChange', () => hot.getPlugin('sheetsBar').addSheet('Delta'));
    });
    await bar.clickTab(1);

    await expect(bar.tabByName('Delta')).toHaveCount(1);
    await bar.expectActiveTab(1);
    await expect(bar.indicator).toHaveCount(1);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(1));
  });

  test('an afterSheetTabChange listener that switches again leaves one marker sliding from the tab it left', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordIndicators();
    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;
      const plugin = hot.getPlugin('sheetsBar');
      const gammaId = plugin.getSheets().find((sheet: { name: string }) => sheet.name === 'Gamma').id;

      hot.addHookOnce('afterSheetTabChange', () => plugin.setActiveSheet(gammaId));
    });

    const firstTab = await bar.tabBox(0);
    const secondTab = await bar.tabBox(1);

    await bar.clickTab(1);

    await bar.expectActiveTab(2);
    await bar.expectCell(0, 0, 'G1');
    await expect(bar.indicator).toHaveCount(1);
    expect(await bar.indicatorsAdded()).toBe(1);
    expect(Math.abs(secondTab.left - firstTab.left)).toBeGreaterThan(10);

    const start = await bar.indicatorBoxAt(0);

    expectSameBox(start, secondTab);
    expectSameBox(await bar.indicatorBoxAt(1), await bar.tabBox(2));
  });

  test('reduced motion never shows the marker', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordIndicators();
    await bar.clickTab(1);
    await bar.clickTab(2);

    await bar.expectActiveTab(2);
    expect(await bar.indicatorsAdded()).toBe(0);
  });
});

/**
 * Reads a sheet tab's computed font size, in pixels: the entrance offset is `2em` of it.
 */
async function tabFontSize(bar: SheetsBarPage, name: string): Promise<number> {
  return Number.parseFloat(await bar.tabByName(name).evaluate(tab => getComputedStyle(tab).fontSize));
}

test.describe('sheets bar switch animation – new tab entrance', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('a tab added with "+" slides in from the inline start and keeps sliding through the switch', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    await expect(bar.bar.locator('.ht-sheets-bar__tab--entering')).toHaveCount(0);

    await bar.recordTabEntrances();
    await bar.addButton.click();

    const name = await bar.lastSheetName();
    const added = await bar.tabsAdded(name);

    expect(added.length).toBeGreaterThanOrEqual(2);
    expect(added.every(entry => entry.entering)).toBe(true);
    expect(await bar.tabEntrance(name)).toEqual({ entering: true, delay: '0ms' });
    expect((await bar.tabsAdded()).filter(entry => entry.name !== name).every(entry => !entry.entering)).toBe(true);

    const marker = await bar.indicatorBoxAt(1);
    const start = await bar.tabEntranceBoxAt(name, 0);
    const offset = 2 * (await tabFontSize(bar, name));

    expect(start.animations).toBe(1);
    expect(start.opacity).toBe(0);
    expect(Math.abs((start.restLeft - start.left) - offset)).toBeLessThanOrEqual(1);
    expectSameBox(marker, { left: start.restLeft, width: start.width });
  });

  test('the entrance class is removed once the transition has run', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const { transition } = SPEC_TIMING[theme];

    await bar.addButton.click();

    const name = await bar.lastSheetName();

    await page.clock.runFor(Math.floor(transition) - 1);

    expect((await bar.tabEntrance(name)).entering).toBe(true);

    await page.clock.runFor(2);

    expect(await bar.tabEntrance(name)).toEqual({ entering: false, delay: '' });
  });

  test('a tab added through the API continues its slide on a later repaint', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordTabEntrances();
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').addSheet('Delta'));

    expect(await bar.tabEntrance('Delta')).toEqual({ entering: true, delay: '0ms' });

    await page.clock.runFor(40);
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').setActiveSheet('Delta'));

    const added = await bar.tabsAdded('Delta');

    expect(added).toHaveLength(2);
    expect(added[1]).toEqual({ name: 'Delta', entering: true, delay: '-40ms' });
    expect(await bar.tabEntrance('Delta')).toEqual({ entering: true, delay: '-40ms' });
  });

  test('a wrapper re-sending the same sheets leaves a new tab sliding in on its own element', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.addButton.click();

    const name = await bar.lastSheetName();

    await page.clock.runFor(40);
    await bar.rememberBarElements();
    await bar.resendSheetsSetting();

    expect(await bar.barElementsKept()).toBe(true);
    expect((await bar.tabEntrance(name)).entering).toBe(true);

    const { transition } = SPEC_TIMING[theme];

    await page.clock.runFor(Math.ceil(transition) - 40 + 1);

    expect(await bar.tabEntrance(name)).toEqual({ entering: false, delay: '' });
  });

  test('a round trip that rebuilds the bar keeps a new tab sliding in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.addButton.click();

    const name = await bar.lastSheetName();

    await page.clock.runFor(40);
    await bar.setAnimation(EVERY_MOTION);

    await expect(bar.tabByName(name)).toHaveCount(1);
    expect(await bar.tabEntrance(name)).toEqual({ entering: true, delay: '-40ms' });
    await expect(bar.indicator).toHaveCount(1);

    const { transition } = SPEC_TIMING[theme];

    await page.clock.runFor(Math.ceil(transition) - 40 + 1);

    expect(await bar.tabEntrance(name)).toEqual({ entering: false, delay: '' });
  });

  for (const rtl of [false, true]) {
    test(`ten "+" presses leave the last new tab fully in view${rtl ? ' under RTL' : ''}`, async ({
      page, theme, bundle,
    }) => {
      const bar = new SheetsBarPage(page, theme, bundle);

      await openPaused(bar, { rtl });

      for (let i = 0; i < 10; i += 1) {
        await bar.addButton.click();
      }

      const name = await bar.lastSheetName();

      expect((await bar.tabEntrance(name)).entering).toBe(true);
      await expect.poll(async () => {
        const { travelled, total } = await bar.stripScroll();

        return total > 0 && Math.abs(travelled - total) <= 1;
      }).toBe(true);
      await expect(bar.pageNext).toHaveAttribute('aria-disabled', 'true');
    });
  }

  test('a duplicated sheet\'s tab slides in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const { transition } = SPEC_TIMING[theme];

    await bar.chevron(0).click();
    await bar.menuItem('Duplicate').click();

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();
    expect((await bar.tabEntrance('Alpha (2)')).entering).toBe(true);
    expect((await bar.tabEntrance('Alpha')).entering).toBe(false);

    await page.clock.runFor(Math.ceil(transition) + 1);

    expect((await bar.tabEntrance('Alpha (2)')).entering).toBe(false);
  });

  test('a workbook rebuild slides no tab in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordTabEntrances();
    await page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({
      sheetsBar: { sheets: [{ name: 'One', data: [['1']] }, { name: 'Two', data: [['2']] }] },
    }));

    await expect(bar.tabByName('Two')).toBeVisible();
    expect((await bar.tabsAdded()).length).toBeGreaterThanOrEqual(2);
    expect((await bar.tabsAdded()).every(entry => !entry.entering)).toBe(true);
  });

  test('under RTL a new tab slides in from the right', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { rtl: true });
    await bar.recordTabEntrances();
    await bar.addButton.click();

    const name = await bar.lastSheetName();
    const marker = await bar.indicatorBoxAt(1);
    const start = await bar.tabEntranceBoxAt(name, 0);
    const offset = 2 * (await tabFontSize(bar, name));

    expect(start.animations).toBe(1);
    expect(Math.abs((start.left - start.restLeft) - offset)).toBeLessThanOrEqual(1);
    expectSameBox(marker, { left: start.restLeft, width: start.width });
  });

  test('a tab dragged mid-entrance stays under the pointer and reorders', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordTabEntrances();
    await bar.addButton.click();

    const name = await bar.lastSheetName();
    const start = await bar.tabEntranceBoxAt(name, 0);
    const box = await bar.tabByName(name).boundingBox();
    const first = await bar.tabBox(0);

    if (box === null) {
      throw new Error('The new tab is not rendered');
    }

    const y = box.y + (box.height / 2);
    const x = start.left + (start.width / 2);

    expect(start.restLeft - start.left).toBeGreaterThan(10);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 30, y, { steps: 2 });

    await expect(bar.tabByName(name)).toHaveClass(/ht-sheets-bar__tab--dragging/);
    expect((await bar.tabEntrance(name)).entering).toBe(false);
    expect(Math.abs((await bar.tabBox(3)).left - (start.restLeft - 30))).toBeLessThanOrEqual(1);

    await page.mouse.move(first.left + 5, y, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent))).toEqual([name, 'Alpha', 'Beta', 'Gamma']);
  });

  test('reduced motion never slides a new tab in', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordTabEntrances();
    await bar.addButton.click();
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').addSheet('Delta'));
    await bar.tab(0).click({ button: 'right' });
    await bar.menuItem('Duplicate').click();

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();
    expect((await bar.tabsAdded('Delta')).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded()).every(entry => !entry.entering)).toBe(true);
  });
});

test.describe('sheets bar switch animation – classic theme', { tag: THEMES_TAG }, () => {
  test('the classic theme never shows the marker', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordIndicators();
    await bar.clickTab(1);
    await bar.clickTab(2);

    await bar.expectActiveTab(2);
    expect(await bar.indicatorsAdded()).toBe(0);
  });

  test('the classic theme never slides a new tab in', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordTabEntrances();
    await bar.addButton.click();
    await page.evaluate(() => (window as never as { hot: any }).hot.getPlugin('sheetsBar').addSheet('Delta'));
    await bar.tab(0).click({ button: 'right' });
    await bar.menuItem('Duplicate').click();

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();
    expect((await bar.tabsAdded('Delta')).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded()).every(entry => !entry.entering)).toBe(true);
  });
});
