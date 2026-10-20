import { test, expect, THEMES_TAG, MOTION_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * Freezes the page clock once the fixture has loaded, so the timers that end the motion only run
 * when the test advances time, and holds every CSS transition and animation of the strip at its
 * start.
 */
async function openPaused(bar: SheetsBarPage): Promise<void> {
  await bar.gotoWithPausedClock();
  await bar.holdStripMotion();
}

/**
 * Runs a command from the menu of a sheet's tab.
 */
async function runTabMenuCommand(bar: SheetsBarPage, name: string, command: string): Promise<void> {
  await bar.tabByName(name).click({ button: 'right' });
  await bar.menuItem(command).click();
}

/**
 * Runs a sheets bar API call on the fixture's grid.
 */
async function callPlugin(bar: SheetsBarPage, method: string, ...args: unknown[]): Promise<void> {
  await bar.page.evaluate(({ name, params }) => {
    const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

    plugin[name](...params);
  }, { name: method, params: args });
}

/**
 * The id of a sheet, found by its name.
 */
async function sheetId(bar: SheetsBarPage, name: string): Promise<number> {
  return bar.page.evaluate(sheetName => (window as never as { hot: any }).hot.getPlugin('sheetsBar')
    .getSheets()
    .find((sheet: { name: string }) => sheet.name === sheetName).id, name);
}

/**
 * The text color a hovered tab takes when the bar's hover token is forced to it.
 */
const FORCED_HOVER_COLOR = 'rgb(255, 0, 0)';

test.describe('sheets bar animation option – one motion off', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('`switch: false` switches without a marker slide while a new tab still slides in', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.setAnimation({ switch: false });
    await bar.recordIndicators();
    await bar.recordTabEntrances();

    await bar.clickTab(1);

    await bar.expectActiveTab(1);
    expect(await bar.indicatorsAdded()).toBe(0);

    await callPlugin(bar, 'addSheet', 'Delta');

    await expect.poll(async() => (await bar.tabsAdded('Delta')).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded('Delta')).every(entry => entry.entering)).toBe(true);
  });

  test('`add: false` adds and duplicates a tab without an entrance while a switch still slides the marker', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.setAnimation({ add: false });
    await bar.recordTabEntrances();

    await bar.addButton.click();
    await bar.expectActiveTab(3);

    const added = await bar.lastSheetName();

    await callPlugin(bar, 'duplicateSheet', await sheetId(bar, 'Beta'));
    await expect.poll(() => bar.tabNames()).toHaveLength(5);

    expect((await bar.tabsAdded(added)).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded()).filter(entry => entry.entering)).toEqual([]);
    expect(await bar.tabEntrance(added)).toEqual({ entering: false, delay: '' });

    await page.clock.runFor(1000);
    await expect(bar.indicator).toHaveCount(0);

    await bar.clickTab(0);

    await bar.expectActiveTab(0);
    await expect(bar.indicator).toHaveCount(1);
  });

  test('`remove: false` removes a tab without a leaving copy or a gap slide while a move still slides', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.setAnimation({ remove: false });
    await bar.recordStripMotion();

    await callPlugin(bar, 'removeSheet', await sheetId(bar, 'Beta'));

    await expect.poll(() => bar.tabNames()).toEqual(['Alpha', 'Gamma']);
    await expect(bar.ghost).toHaveCount(0);
    expect(await bar.stripMotionRecord()).toMatchObject({ sliding: false, ghosts: 0 });
    expect(await bar.runningTabSlides()).toBe(0);

    await runTabMenuCommand(bar, 'Alpha', 'Move right');

    await expect.poll(() => bar.tabNames()).toEqual(['Gamma', 'Alpha']);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--sliding/);
    expect(await bar.runningTabSlides()).toBeGreaterThan(0);
  });

  test('`move: false` moves a tab without a slide while a removed tab still leaves through its copy', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.setAnimation({ move: false });
    await bar.recordStripMotion();

    await runTabMenuCommand(bar, 'Alpha', 'Move right');
    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
    await callPlugin(bar, 'moveSheetToIndex', await sheetId(bar, 'Gamma'), 0);
    await expect.poll(() => bar.tabNames()).toEqual(['Gamma', 'Beta', 'Alpha']);

    expect(await bar.stripMotionRecord()).toMatchObject({ sliding: false, ghosts: 0 });
    expect(await bar.runningTabSlides()).toBe(0);

    await callPlugin(bar, 'removeSheet', await sheetId(bar, 'Gamma'));

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha']);
    await expect(bar.ghost).toHaveCount(1);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--sliding/);
    expect(await bar.runningTabSlides()).toBeGreaterThan(0);
  });
});

[
  { label: '`animation: false`', animation: false },
  { label: '`move: false`', animation: { move: false } },
].forEach(({ label, animation }) => {
  test.describe(`sheets bar animation option – drag with ${label}`, { tag: [THEMES_TAG, MOTION_TAG] }, () => {
    test('moves the tabs a drag pushes aside at once, and slides them again once motion is back on', async({
      page, theme, bundle,
    }) => {
      const bar = new SheetsBarPage(page, theme, bundle);

      await bar.goto();
      await bar.holdStripMotion();
      await bar.setAnimation(animation);
      await bar.dragTabPast('Alpha', 'Beta');

      await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
      await expect(bar.tabByName('Alpha')).toHaveClass(/ht-sheets-bar__tab--dragging/);
      expect(await bar.tabTransformDurationMs('Beta')).toBe(0);
      expect(await bar.runningTabSlides()).toBe(0);

      await page.mouse.up();
      await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
      await bar.setAnimation(true);
      await bar.dragTabPast('Alpha', 'Gamma');

      await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Gamma', 'Alpha']);
      expect(await bar.tabTransformDurationMs('Gamma')).toBeGreaterThan(0);
      expect(await bar.runningTabSlides()).toBeGreaterThan(0);

      await page.mouse.up();
    });
  });
});

test.describe('sheets bar animation option – runtime change', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('turning `animation` off mid-slide ends the marker and tab slides and keeps the workbook', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.setActiveSheet('Gamma');
      plugin.moveSheetToIndex(plugin.getSheets()[0].id, 2);
    });

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Gamma', 'Alpha']);
    await expect(bar.indicator).toHaveCount(1);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--sliding/);

    await bar.setAnimation(false);

    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);
    expect(await bar.runningTabSlides()).toBe(0);
    expect(await bar.tabNames()).toEqual(['Beta', 'Gamma', 'Alpha']);
    await bar.expectActiveTab(1);
    await bar.expectCell(0, 0, 'G1');

    await bar.recordIndicators();
    await bar.recordStripMotion();
    await bar.clickTab(0);
    await callPlugin(bar, 'moveSheetToIndex', await sheetId(bar, 'Alpha'), 0);

    await bar.expectActiveTab(1);
    await bar.expectCell(0, 0, 'B1');
    expect(await bar.tabNames()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(await bar.indicatorsAdded()).toBe(0);
    expect(await bar.stripMotionRecord()).toMatchObject({ sliding: false });
  });

  test('turning `remove` off mid-exit ends the leaving copy while a running entrance continues', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await callPlugin(bar, 'removeSheet', await sheetId(bar, 'Beta'));
    await callPlugin(bar, 'addSheet', 'Delta');

    await expect.poll(() => bar.tabNames()).toEqual(['Alpha', 'Gamma', 'Delta']);
    await expect(bar.ghost).toHaveCount(1);
    expect((await bar.tabEntrance('Delta')).entering).toBe(true);

    await bar.setAnimation({ remove: false });

    await expect(bar.ghost).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);
    expect((await bar.tabEntrance('Delta')).entering).toBe(true);
    expect(await bar.tabNames()).toEqual(['Alpha', 'Gamma', 'Delta']);
    await bar.expectActiveTab(0);
    await bar.expectCell(0, 0, 'A1');
  });
});

test.describe('sheets bar animation option – hover', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('`animation: false` leaves the hover text color fade running', async({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await bar.setAnimation(false);
    await page.mouse.move(0, 0);
    await bar.bar.evaluate((element, color) => {
      element.style.setProperty('--ht-sheets-bar-tab-hover-foreground-color', color);
    }, FORCED_HOVER_COLOR);

    expect((await bar.tabColorMotion('Beta')).colorDurationMs).toBeGreaterThan(0);

    await bar.recordTabTransitions();
    await bar.tabByName('Beta').hover();

    await expect.poll(() => bar.tabTransitions('color')).toEqual([{ name: 'Beta', property: 'color' }]);
    await expect.poll(async() => (await bar.tabColorMotion('Beta')).color).toBe(FORCED_HOVER_COLOR);
  });
});

test.describe('sheets bar animation option – every motion off', { tag: THEMES_TAG }, () => {
  test('`animation: false` makes a switch, an add, a duplicate, a move, and a removal instant', async({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await bar.waitForFrames();
    await bar.setAnimation(false);
    await bar.recordIndicators();
    await bar.recordTabEntrances();
    await bar.recordStripMotion();

    await bar.clickTab(1);
    await bar.expectActiveTab(1);
    await bar.addButton.click();
    await bar.expectActiveTab(3);
    await callPlugin(bar, 'duplicateSheet', await sheetId(bar, 'Alpha'));
    await runTabMenuCommand(bar, 'Alpha', 'Move right');
    await callPlugin(bar, 'moveSheetToIndex', await sheetId(bar, 'Gamma'), 0);
    await callPlugin(bar, 'removeSheet', await sheetId(bar, 'Beta'));

    await expect.poll(() => bar.tabNames()).toHaveLength(4);
    expect(await bar.tabNames()).not.toContain('Beta');
    expect(await bar.indicatorsAdded()).toBe(0);
    expect((await bar.tabsAdded()).length).toBeGreaterThan(0);
    expect((await bar.tabsAdded()).filter(entry => entry.entering)).toEqual([]);
    expect(await bar.stripMotionRecord()).toMatchObject({ sliding: false, ghosts: 0 });
    await expect(bar.ghost).toHaveCount(0);
    await expect(bar.indicator).toHaveCount(0);
  });
});
