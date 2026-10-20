import { test, expect, THEMES_TAG, MOTION_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * The timing of each animated theme: the base transition `T` and the slide of the tabs after a
 * move (`2.25 × T`, the pace of the marker slide).
 */
const SPEC_TIMING: Record<string, { transition: number, slide: number }> = {
  main: { transition: 150, slide: 337.5 },
  horizon: { transition: 200, slide: 450 },
};

/**
 * Freezes the page clock once the fixture has loaded, so the timers that end the motion only run
 * when the test advances time, and holds every CSS transition and animation of the strip at its
 * start for the test to seek.
 */
async function openPaused(bar: SheetsBarPage, options: Parameters<SheetsBarPage['goto']>[0] = {}): Promise<void> {
  await bar.gotoWithPausedClock(options);
  await bar.holdStripMotion();
}

/**
 * Asserts that two horizontal positions match to within the one pixel `offsetLeft` rounding
 * allows.
 */
function expectSameLeft(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

/**
 * The text color a hovered tab takes when the bar's hover token is forced to it. The `horizon`
 * and `classic` themes give the hover token the resting text color, so a hover changes nothing
 * there until a test sets a color of its own.
 */
const FORCED_HOVER_COLOR = 'rgb(255, 0, 0)';

/**
 * Sets the bar's hover text color token to `FORCED_HOVER_COLOR`.
 */
async function forceHoverColor(bar: SheetsBarPage): Promise<void> {
  await bar.bar.evaluate((element, color) => {
    element.style.setProperty('--ht-sheets-bar-tab-hover-foreground-color', color);
  }, FORCED_HOVER_COLOR);
}

/**
 * Resolves one of the bar's color tokens inside a sheet tab, the way the tab's own rules read it,
 * as a computed text color.
 */
async function resolveTabToken(bar: SheetsBarPage, name: string, token: string): Promise<string> {
  return bar.tabByName(name).evaluate((element, variable) => {
    const probe = element.ownerDocument.createElement('span');

    probe.style.color = `var(${variable})`;
    element.appendChild(probe);

    const color = getComputedStyle(probe).color;

    probe.remove();

    return color;
  }, token);
}

/**
 * Runs a command from the menu of a sheet's tab.
 */
async function runTabMenuCommand(bar: SheetsBarPage, name: string, command: string): Promise<void> {
  await bar.tabByName(name).click({ button: 'right' });
  await bar.menuItem(command).click();
}

test.describe('sheets bar tab motion – move', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('Move right slides the active tab and its displaced neighbor from their old boxes to the new ones', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.recordIndicators();

    const alpha = await bar.tabBox(0);
    const beta = await bar.tabBox(1);

    await runTabMenuCommand(bar, 'Alpha', 'Move right');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--sliding/);
    await expect(bar.tabByName('Alpha')).toHaveClass(/ht-sheets-bar__tab--slide-lead/);
    await expect(bar.tabByName('Alpha')).toHaveClass(/ht-sheets-bar__tab--active/);

    const movedStart = await bar.stripMotionAt('Alpha', 0);
    const neighborStart = await bar.stripMotionAt('Beta', 0);

    expect(movedStart.durations).toEqual([SPEC_TIMING[theme].slide]);
    expect(neighborStart.durations).toEqual([SPEC_TIMING[theme].slide]);
    expectSameLeft(movedStart.left, alpha.left);
    expectSameLeft(neighborStart.left, beta.left);
    expectSameLeft(neighborStart.restLeft, alpha.left);
    expectSameLeft(movedStart.restLeft, alpha.left + beta.width);

    const movedMid = await bar.stripMotionAt('Alpha', 0.5);

    expect(movedMid.left).toBeGreaterThan(alpha.left + 2);
    expect(movedMid.left).toBeLessThan(movedStart.restLeft - 2);

    const movedEnd = await bar.stripMotionAt('Alpha', 0.999);
    const neighborEnd = await bar.stripMotionAt('Beta', 0.999);

    expectSameLeft(movedEnd.left, movedStart.restLeft);
    expectSameLeft(neighborEnd.left, alpha.left);
    expect(await bar.indicatorsAdded()).toBe(0);

    await page.clock.runFor(Math.ceil(SPEC_TIMING[theme].slide) + 1);

    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);
    await expect(bar.tabByName('Alpha')).not.toHaveClass(/ht-sheets-bar__tab--slide-lead/);
    await expect(bar.tabByName('Alpha')).toHaveAttribute('aria-current', 'true');
    expectSameLeft((await bar.tabBox(1)).left, movedStart.restLeft);
  });

  test('the moved active tab carries its own marker the whole way', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await runTabMenuCommand(bar, 'Alpha', 'Move right');

    await expect(bar.indicator).toHaveCount(0);

    const marker = await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.textContent === 'Alpha');

      if (!(tab instanceof HTMLElement)) {
        throw new Error('No Alpha tab');
      }

      const animation = tab.getAnimations()[0];

      animation.currentTime = Number(animation.effect?.getComputedTiming().activeDuration ?? 0) * 0.5;

      const style = getComputedStyle(tab);
      const inactive = getComputedStyle(document.querySelector('.ht-sheets-bar__tab:not(.ht-sheets-bar__tab--active)')!);

      return {
        shadow: style.boxShadow,
        background: style.backgroundColor,
        inactiveBackground: inactive.backgroundColor,
        zIndex: style.zIndex,
      };
    });

    expect(marker.shadow).not.toBe('none');
    expect(marker.background).not.toBe(marker.inactiveBackground);
    expect(marker.zIndex).toBe('1');
  });

  test('Move left slides an inactive neighbor out of the way of the active tab', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);
    await page.clock.runFor(1000);

    const alpha = await bar.tabBox(0);
    const beta = await bar.tabBox(1);

    await runTabMenuCommand(bar, 'Beta', 'Move left');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);

    const moved = await bar.stripMotionAt('Beta', 0);
    const displaced = await bar.stripMotionAt('Alpha', 0);

    expectSameLeft(moved.left, beta.left);
    expectSameLeft(moved.restLeft, alpha.left);
    expectSameLeft(displaced.left, alpha.left);
    expectSameLeft(displaced.restLeft, alpha.left + beta.width);
    expectSameLeft((await bar.stripMotionAt('Beta', 0.999)).left, alpha.left);
    await expect(bar.tabByName('Beta')).toHaveAttribute('aria-current', 'true');
  });

  test('under RTL Move left slides the first tab toward the left', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { rtl: true });

    const alpha = await bar.tabBox(0);
    const beta = await bar.tabBox(1);

    expect(beta.left).toBeLessThan(alpha.left);

    await runTabMenuCommand(bar, 'Alpha', 'Move left');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);

    const moved = await bar.stripMotionAt('Alpha', 0);
    const displaced = await bar.stripMotionAt('Beta', 0);

    expectSameLeft(moved.left, alpha.left);
    expectSameLeft(moved.restLeft, beta.left);
    expectSameLeft(displaced.left, beta.left);
    expect(displaced.restLeft).toBeGreaterThan(beta.left + 2);
    expectSameLeft((await bar.stripMotionAt('Alpha', 0.999)).left, beta.left);
  });

  test('moving a sheet through the API slides its tab and reveals it in an overflowing strip', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      for (let index = 0; index < 20; index += 1) {
        plugin.addSheet(`Extra sheet ${index}`);
      }
    });
    await page.clock.runFor(1000);
    await page.evaluate(() => {
      document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft = 0;
    });

    const gammaBefore = await bar.stripMotionAt('Gamma', 0);

    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');
      const gamma = plugin.getSheets().find((sheet: { name: string }) => sheet.name === 'Gamma');

      plugin.moveSheetToIndex(gamma.id, plugin.getSheets().length - 1);
    });

    await expect(bar.tabByName('Gamma')).toHaveClass(/ht-sheets-bar__tab--slide-lead/);

    const view = await page.evaluate(() => {
      const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
      const tab = Array.from(strip.querySelectorAll('.ht-sheets-bar__tab'))
        .find(element => element.textContent === 'Gamma') as HTMLElement;

      return {
        start: strip.scrollLeft,
        end: strip.scrollLeft + strip.clientWidth,
        tabStart: tab.offsetLeft,
        tabEnd: tab.offsetLeft + tab.offsetWidth,
      };
    });

    expect(view.start).toBeGreaterThan(0);
    expect(view.tabStart).toBeGreaterThanOrEqual(view.start - 1);
    expect(view.tabEnd).toBeLessThanOrEqual(view.end + 1);

    const gammaMoving = await bar.stripMotionAt('Gamma', 0);

    expect(gammaMoving.durations).toEqual([SPEC_TIMING[theme].slide]);
    expectSameLeft(gammaMoving.left, gammaBefore.left - view.start);
  });

  test('a move during a move starts the slide from where the tabs are on screen', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await runTabMenuCommand(bar, 'Alpha', 'Move right');

    const midway = await bar.stripMotionAt('Alpha', 0.5);

    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.moveSheetToIndex(plugin.getSheets()[1].id, 2);
    });

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Gamma', 'Alpha']);

    const restarted = await bar.stripMotionAt('Alpha', 0);

    expectSameLeft(restarted.left, midway.left);
    expect(restarted.durations).toEqual([SPEC_TIMING[theme].slide]);
  });

  test('a tab drag that starts during a slide ends it and still reorders the strip', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const first = await bar.tabBox(0);

    await runTabMenuCommand(bar, 'Alpha', 'Move right');

    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--sliding/);

    const gamma = await bar.tab(2).boundingBox();

    if (gamma === null) {
      throw new Error('Tab 2 is not rendered');
    }

    const y = gamma.y + (gamma.height / 2);

    await page.mouse.move(gamma.x + (gamma.width / 2), y);
    await page.mouse.down();
    await page.mouse.move(gamma.x + (gamma.width / 2) - 10, y, { steps: 2 });

    await expect(bar.tabByName('Gamma')).toHaveClass(/ht-sheets-bar__tab--dragging/);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);
    await expect(bar.tabByName('Alpha')).not.toHaveClass(/ht-sheets-bar__tab--slide-lead/);

    await page.mouse.move(first.left + 5, y, { steps: 6 });
    await page.mouse.up();

    await expect.poll(() => bar.tabNames()).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  test('a rename that starts during a slide ends it', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.moveSheetToIndex(plugin.getSheets()[2].id, 0);
    });

    await expect(bar.strip).toHaveClass(/ht-sheets-bar__tabs--sliding/);

    await bar.tabByName('Alpha').locator('.ht-sheets-bar__tab-label').dblclick();

    await expect(bar.renameInput).toBeVisible();
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);
    expect(await page.evaluate(() => document.querySelector('.ht-sheets-bar__tabs')!
      .getAnimations({ subtree: true })
      .filter(animation => !(animation instanceof CSSTransition) || animation.transitionProperty === 'transform')
      .length)).toBe(0);
  });
});

/**
 * Removes a sheet by name through the API.
 */
async function removeThroughApi(bar: SheetsBarPage, name: string): Promise<void> {
  await bar.page.evaluate((sheetName) => {
    const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

    plugin.removeSheet(plugin.getSheets().find((sheet: { name: string }) => sheet.name === sheetName).id);
  }, name);
}

test.describe('sheets bar tab motion – delete', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('a removed tab fades out toward the inline start while the next tab closes the gap', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);

    const beta = await bar.tabBox(1);
    const gamma = await bar.tabBox(2);

    await removeThroughApi(bar, 'Beta');

    await expect.poll(() => bar.tabNames()).toEqual(['Alpha', 'Gamma']);
    await expect(bar.ghost).toHaveCount(1);
    await expect(bar.ghost).toHaveText('Beta');
    await expect(bar.ghost).toHaveAttribute('aria-hidden', 'true');
    await expect(bar.ghost).toHaveJSProperty('inert', true);
    await expect(bar.ghost).not.toHaveClass(/(^|\s)ht-sheets-bar__tab(\s|$)/);
    await expect(bar.strip.locator('.ht-sheets-bar__tab')).toHaveCount(2);

    const ghostStart = await bar.stripMotionAt(null, 0);
    const ghostEnd = await bar.stripMotionAt(null, 0.999);

    expect(ghostStart.durations).toEqual([SPEC_TIMING[theme].transition]);
    expectSameLeft(ghostStart.left, beta.left);
    expect(Math.abs(ghostStart.width - beta.width)).toBeLessThanOrEqual(1);
    expect(ghostStart.opacity).toBe(1);
    expect(ghostEnd.opacity).toBeLessThan(0.01);
    expect(ghostEnd.left).toBeLessThan(beta.left - 10);

    const closingStart = await bar.stripMotionAt('Gamma', 0);

    expect(closingStart.durations).toEqual([SPEC_TIMING[theme].slide]);
    expectSameLeft(closingStart.left, gamma.left);
    expectSameLeft(closingStart.restLeft, beta.left);
    expectSameLeft((await bar.stripMotionAt('Gamma', 0.999)).left, beta.left);

    await page.clock.runFor(SPEC_TIMING[theme].transition - 1);

    await expect(bar.ghost).toHaveCount(1);

    await page.clock.runFor(2);

    await expect(bar.ghost).toHaveCount(0);
  });

  test('deleting the active tab from its menu fades it out and slides the marker onto the tab that takes its place', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await bar.clickTab(1);
    await page.clock.runFor(1000);

    const beta = await bar.tabBox(1);
    const gamma = await bar.tabBox(2);

    await runTabMenuCommand(bar, 'Beta', 'Delete');

    await expect.poll(() => bar.tabNames()).toEqual(['Alpha', 'Gamma']);
    await expect(bar.tabByName('Gamma')).toHaveAttribute('aria-current', 'true');
    await expect(bar.ghost).toHaveCount(1);
    await expect(bar.indicator).toHaveCount(1);

    expectSameLeft((await bar.stripMotionAt(null, 0)).left, beta.left);
    expectSameLeft((await bar.stripMotionAt('Gamma', 0)).left, gamma.left);
    expectSameLeft((await bar.indicatorBoxAt(0)).left, beta.left);
    expectSameLeft((await bar.indicatorBoxAt(0.999)).left, beta.left);
    expect((await bar.stripMotionAt(null, 0.999)).opacity).toBeLessThan(0.01);

    await page.clock.runFor(1000);

    await expect(bar.ghost).toHaveCount(0);
    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);
    expectSameLeft((await bar.tabBox(1)).left, beta.left);
    await bar.expectActiveTab(1);
  });

  test('under RTL a removed tab fades out toward the right', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar, { rtl: true });

    const beta = await bar.tabBox(1);
    const gamma = await bar.tabBox(2);

    await removeThroughApi(bar, 'Beta');

    await expect(bar.ghost).toHaveCount(1);

    const ghostEnd = await bar.stripMotionAt(null, 0.999);
    const closing = await bar.stripMotionAt('Gamma', 0);

    expectSameLeft((await bar.stripMotionAt(null, 0)).left, beta.left);
    expect(ghostEnd.left).toBeGreaterThan(beta.left + 10);
    expectSameLeft(closing.left, gamma.left);
    expectSameLeft(closing.restLeft, beta.left + beta.width - gamma.width);
  });

  test('a rename or a drag that starts while a removed tab leaves ends its exit', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await openPaused(bar);
    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.addSheet('Delta');
      plugin.addSheet('Zeta');
    });
    await page.clock.runFor(1000);

    const first = await bar.tabBox(0);

    await removeThroughApi(bar, 'Beta');

    await expect(bar.ghost).toHaveCount(1);

    await bar.tabByName('Alpha').locator('.ht-sheets-bar__tab-label').dblclick();

    await expect(bar.renameInput).toBeVisible();
    await expect(bar.ghost).toHaveCount(0);
    await expect(bar.strip).not.toHaveClass(/ht-sheets-bar__tabs--sliding/);

    await page.keyboard.press('Escape');
    await removeThroughApi(bar, 'Delta');

    await expect(bar.ghost).toHaveCount(1);

    const zeta = await bar.tabByName('Zeta').boundingBox();

    if (zeta === null) {
      throw new Error('The Zeta tab is not rendered');
    }

    const y = zeta.y + (zeta.height / 2);

    await page.mouse.move(zeta.x + (zeta.width / 2), y);
    await page.mouse.down();
    await page.mouse.move(zeta.x + (zeta.width / 2) - 10, y, { steps: 2 });

    await expect(bar.tabByName('Zeta')).toHaveClass(/ht-sheets-bar__tab--dragging/);
    await expect(bar.ghost).toHaveCount(0);

    await page.mouse.move(first.left + 5, y, { steps: 6 });
    await page.mouse.up();

    await expect.poll(() => bar.tabNames()).toEqual(['Zeta', 'Alpha', 'Gamma']);
  });
});

test.describe('sheets bar tab motion – instant', { tag: THEMES_TAG }, () => {
  test('the classic theme moves a tab without any motion', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordStripMotion();
    await runTabMenuCommand(bar, 'Alpha', 'Move right');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect(await bar.stripMotionRecord()).toEqual({ sliding: false, ghosts: 0, animations: 0 });
  });

  test('reduced motion moves a tab without any motion', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordStripMotion();
    await runTabMenuCommand(bar, 'Alpha', 'Move right');
    await page.evaluate(() => {
      const plugin = (window as never as { hot: any }).hot.getPlugin('sheetsBar');

      plugin.moveSheetToIndex(plugin.getSheets()[2].id, 0);
    });

    await expect.poll(() => bar.tabNames()).toEqual(['Gamma', 'Beta', 'Alpha']);
    expect(await bar.stripMotionRecord()).toEqual({ sliding: false, ghosts: 0, animations: 0 });
  });

  test('the classic theme deletes a tab without any motion', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.recordStripMotion();
    await removeThroughApi(bar, 'Beta');
    await runTabMenuCommand(bar, 'Alpha', 'Delete');

    await expect.poll(() => bar.tabNames()).toEqual(['Gamma']);
    expect(await bar.stripMotionRecord()).toEqual({ sliding: false, ghosts: 0, animations: 0 });
    await expect(bar.ghost).toHaveCount(0);
  });

  test('reduced motion deletes a tab without any motion', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await bar.recordStripMotion();
    await removeThroughApi(bar, 'Beta');
    await runTabMenuCommand(bar, 'Alpha', 'Delete');

    await expect.poll(() => bar.tabNames()).toEqual(['Gamma']);
    expect(await bar.stripMotionRecord()).toEqual({ sliding: false, ghosts: 0, animations: 0 });
    await expect(bar.ghost).toHaveCount(0);
  });
});

test.describe('sheets bar tab motion – hover', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('hovering a tab fades its text color in and out over the theme transition', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await page.mouse.move(0, 0);
    await forceHoverColor(bar);

    const resting = await bar.tabColorMotion('Beta');

    expect(resting.colorDurationMs).toBe(SPEC_TIMING[theme].transition);
    expect(resting.backgroundDurationMs).toBe(0);

    await bar.recordTabTransitions();
    await bar.tabByName('Beta').hover();

    await expect.poll(() => bar.tabTransitions('color'))
      .toEqual([{ name: 'Beta', property: 'color' }]);
    await expect.poll(async() => (await bar.tabColorMotion('Beta')).color).toBe(FORCED_HOVER_COLOR);
    await expect.poll(async() => (await bar.tabColorMotion('Beta')).runningColor).toBe(0);
    expect((await bar.tabColorMotion('Beta')).background).toBe(resting.background);

    await page.mouse.move(0, 0);

    await expect.poll(async() => (await bar.tabTransitions('color')).length).toBe(2);
    await expect.poll(async() => (await bar.tabColorMotion('Beta')).color).toBe(resting.color);
    expect(await bar.tabTransitions('background-color')).toEqual([]);
  });

  test('the tabs a marker slide uncovers take their background back without a fade', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.gotoWithPausedClock();
    await bar.bar.evaluate((element) => {
      element.style.setProperty('--ht-sheets-bar-tab-background-color', 'rgb(255, 0, 0)');
    });
    await bar.clickTab(2);
    await page.clock.runFor(1000);
    await bar.clickTab(0);
    await page.mouse.move(0, 0);
    await bar.recordTabTransitions();

    await expect(bar.tabByName('Beta')).toHaveClass(/ht-sheets-bar__tab--indicator-path/);
    await expect(bar.tabByName('Gamma')).toHaveClass(/ht-sheets-bar__tab--indicator-path/);

    await page.clock.runFor(1000);

    await expect(bar.indicator).toHaveCount(0);
    await expect(bar.tabByName('Gamma')).not.toHaveClass(/ht-sheets-bar__tab--indicator-path/);
    expect((await bar.tabColorMotion('Gamma')).runningBackground).toBe(0);
    expect((await bar.tabColorMotion('Beta')).runningBackground).toBe(0);
    expect((await bar.tabColorMotion('Gamma')).backgroundDurationMs).toBe(0);
    expect((await bar.tabColorMotion('Gamma')).background).toBe('rgb(255, 0, 0)');
    expect(await bar.tabTransitions('background-color')).toEqual([]);
  });
});

test.describe('sheets bar tab motion – instant hover', { tag: THEMES_TAG }, () => {
  test('hovering an inactive tab takes the hover text color and leaves its background at rest', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await page.mouse.move(0, 0);

    const resting = await bar.tabColorMotion('Beta');
    const hoverColor = await resolveTabToken(bar, 'Beta', '--ht-sheets-bar-tab-hover-foreground-color');

    expect(hoverColor).not.toBe(resting.color);

    await bar.tabByName('Beta').hover();
    await expect.poll(() => bar.tabByName('Beta').evaluate(element => element.getAnimations().length)).toBe(0);

    const hovered = await bar.tabColorMotion('Beta');

    expect(hovered.color).toBe(hoverColor);
    expect(hovered.background).toBe(resting.background);
  });

  test('the active tab keeps its active colors on hover', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await page.mouse.move(0, 0);

    const resting = await bar.tabColorMotion('Alpha');

    await bar.tabByName('Alpha').hover();
    await expect.poll(() => bar.tabByName('Alpha').evaluate(element => element.getAnimations().length)).toBe(0);

    const hovered = await bar.tabColorMotion('Alpha');

    expect(hovered.color).toBe(resting.color);
    expect(hovered.background).toBe(resting.background);
  });

  test('the classic theme changes a hovered tab text color at once', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await page.mouse.move(0, 0);
    await forceHoverColor(bar);
    await bar.recordTabTransitions();

    const resting = await bar.tabColorMotion('Beta');

    expect(resting.colorDurationMs).toBe(0);

    await bar.tabByName('Beta').hover();

    const hovered = await bar.tabColorMotion('Beta');

    expect(hovered.color).toBe(FORCED_HOVER_COLOR);
    expect(hovered.colorDurationMs).toBe(0);
    expect(hovered.runningColor).toBe(0);
    expect(await bar.tabTransitions('color')).toEqual([]);
  });

  test('reduced motion changes a hovered tab text color at once', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'main', bundle);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bar.goto();
    await page.mouse.move(0, 0);
    await bar.recordTabTransitions();

    const resting = await bar.tabColorMotion('Beta');

    expect(resting.colorDurationMs).toBe(0);

    await bar.tabByName('Beta').hover();

    const hovered = await bar.tabColorMotion('Beta');

    expect(hovered.color).not.toBe(resting.color);
    expect(hovered.background).toBe(resting.background);
    expect(hovered.colorDurationMs).toBe(0);
    expect(hovered.runningColor).toBe(0);
    expect(await bar.tabTransitions('color')).toEqual([]);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.move(0, 0);

    expect((await bar.tabColorMotion('Beta')).colorDurationMs).toBe(150);
  });
});

test.describe('sheets bar tab motion – instant drag', { tag: THEMES_TAG }, () => {
  test('the classic theme moves the tabs a drag pushes aside at once', async ({ page, bundle }) => {
    const bar = new SheetsBarPage(page, 'classic', bundle);

    await bar.goto();
    await bar.holdStripMotion();
    await bar.dragTabPast('Alpha', 'Beta');

    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
    await expect(bar.tabByName('Alpha')).toHaveClass(/ht-sheets-bar__tab--dragging/);
    expect(await bar.tabTransformDurationMs('Beta')).toBe(0);
    expect(await bar.runningTabSlides()).toBe(0);

    await page.mouse.up();
    await expect.poll(() => bar.tabNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
  });
});
