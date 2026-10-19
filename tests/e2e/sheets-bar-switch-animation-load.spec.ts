import { test, expect, THEMES_TAG, MOTION_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

const NO_MOTION = { indicators: 0, entrances: 0 };

type HotWindow = { hot: any, htSheets: Array<{ name: string, data: unknown[][] }> };

type SecondGrid = { container: HTMLElement, hot: any, record: { sliding: boolean, indicators: number } };

type SecondGridWindow = { htSecond: SecondGrid, Handsontable: any };

/**
 * Adds an empty container in the theme of the fixture's grid, and records from now on whether a
 * sheets bar built inside it slides its tabs and how many tab markers it inserts. The grid itself
 * is built later, in the task that also acts on it, so the test decides what runs while it loads.
 */
async function prepareSecondGrid(bar: SheetsBarPage): Promise<void> {
  await bar.page.evaluate((theme) => {
    const container = document.createElement('div');
    const record = { sliding: false, indicators: 0 };

    container.className = `ht-theme-${theme}`;
    document.body.appendChild(container);
    new MutationObserver((mutations) => {
      record.sliding ||= container.querySelector('.ht-sheets-bar__tabs--sliding') !== null;
      mutations.forEach(mutation => mutation.addedNodes.forEach((node) => {
        if (node instanceof Element && node.classList.contains('ht-sheets-bar__tab-indicator')) {
          record.indicators += 1;
        }
      }));
    }).observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    (window as never as SecondGridWindow).htSecond = { container, hot: null, record };
  }, bar.theme);
}

/**
 * What the recorder of `prepareSecondGrid()` saw so far. Mutation records are delivered as
 * microtasks, so everything a finished evaluation did is counted.
 */
async function secondGridRecord(bar: SheetsBarPage): Promise<{ sliding: boolean, indicators: number }> {
  return bar.page.evaluate(() => ({ ...(window as never as SecondGridWindow).htSecond.record }));
}

/**
 * The tab names of the second grid, in strip order.
 */
async function secondGridTabNames(bar: SheetsBarPage): Promise<string[]> {
  return bar.page.evaluate(() => Array.from(
    (window as never as SecondGridWindow).htSecond.container.querySelectorAll('.ht-sheets-bar__tab-label'),
    label => label.textContent ?? '',
  ));
}

/**
 * Moves the first sheet of the second grid one place to the right, through the API.
 */
async function moveSecondGridFirstSheet(bar: SheetsBarPage): Promise<void> {
  await bar.page.evaluate(() => {
    const plugin = (window as never as SecondGridWindow).htSecond.hot.getPlugin('sheetsBar');

    plugin.moveSheetToIndex(plugin.getSheets()[0].id, 1);
  });
}

/**
 * The bar's motion starts only once the grid has been painted: the motion gate opens in the
 * second animation frame after the first render. Every case records from before the grid is
 * built, and proves the motion runs afterwards, so an instant load is never the result of an
 * animation that cannot run at all.
 */
test.describe('sheets bar switch animation – while the grid loads', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('switches, adds, and duplicates made in the constructor\'s task do not animate', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.recordMotionFromStart();
    await bar.goto({ loadSwitches: true });

    await expect(bar.tabByName('Gamma')).toHaveClass(/ht-sheets-bar__tab--active/);
    await expect(bar.tabByName('Delta')).toBeVisible();
    await bar.waitForFrames();

    expect(await bar.motionRecord()).toEqual(NO_MOTION);

    await bar.tabByName('Beta').click();

    await expect.poll(async() => (await bar.motionRecord()).indicators).toBeGreaterThan(0);

    await page.evaluate(() => (window as never as HotWindow).hot.getPlugin('sheetsBar').addSheet('Epsilon'));

    expect((await bar.motionRecord()).entrances).toBeGreaterThan(0);
  });

  test('a switch made through the API a frame after the grid was painted animates', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.recordMotionFromStart();
    await bar.goto();
    await bar.waitForFrames();

    expect(await bar.motionRecord()).toEqual(NO_MOTION);

    await page.evaluate(() => (window as never as HotWindow).hot.getPlugin('sheetsBar').setActiveSheet('Beta'));

    expect((await bar.motionRecord()).indicators).toBe(1);
  });

  test('a bar turned on through updateSettings does not animate until the next frame', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.recordMotionFromStart();
    await bar.goto({ barOff: true });
    await bar.waitForFrames();

    await page.evaluate(() => {
      const { hot, htSheets } = window as never as HotWindow;

      hot.updateSettings({ sheetsBar: { sheets: htSheets } });
      hot.getPlugin('sheetsBar').setActiveSheet('Beta');
      hot.getPlugin('sheetsBar').addSheet('Delta');
    });

    await expect(bar.tabByName('Beta')).toHaveClass(/ht-sheets-bar__tab--active/);
    await bar.expectCell(0, 0, 'B1');
    await bar.waitForFrames();

    expect(await bar.motionRecord()).toEqual(NO_MOTION);

    await page.evaluate(() => (window as never as HotWindow).hot.getPlugin('sheetsBar').setActiveSheet('Gamma'));

    expect((await bar.motionRecord()).indicators).toBe(1);
  });

  test('a workbook rebuilt through updateSettings does not animate until the next frame', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.recordMotionFromStart();
    await bar.goto();
    await bar.waitForFrames();

    await page.evaluate(() => {
      const { hot, htSheets } = window as never as HotWindow;

      hot.updateSettings({
        sheetsBar: { sheets: htSheets.map(sheet => ({ ...sheet, data: sheet.data.map(row => [...row]) })) },
      });
      hot.getPlugin('sheetsBar').setActiveSheet('Beta');
    });

    await bar.expectCell(0, 0, 'B1');
    await bar.waitForFrames();

    expect(await bar.motionRecord()).toEqual(NO_MOTION);

    await page.evaluate(() => (window as never as HotWindow).hot.getPlugin('sheetsBar').setActiveSheet('Gamma'));

    expect((await bar.motionRecord()).indicators).toBe(1);
  });

  test('a switch made in an animation frame requested right after the constructor does not animate', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await prepareSecondGrid(bar);
    await page.evaluate(() => new Promise<void>((resolve) => {
      const target = window as never as SecondGridWindow;

      target.htSecond.hot = new target.Handsontable(target.htSecond.container, {
        licenseKey: 'non-commercial-and-evaluation',
        sheetsBar: { sheets: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }] },
      });
      requestAnimationFrame(() => {
        target.htSecond.hot.getPlugin('sheetsBar').setActiveSheet('Two');
        resolve();
      });
    }));

    expect(await page.evaluate(() => (window as never as SecondGridWindow).htSecond.hot
      .getPlugin('sheetsBar').getSheets().find((sheet: { isActive: boolean }) => sheet.isActive).name)).toBe('Two');
    expect(await secondGridRecord(bar)).toEqual({ sliding: false, indicators: 0 });

    await bar.waitForFrames();
    await page.evaluate(() => (window as never as SecondGridWindow).htSecond.hot
      .getPlugin('sheetsBar').setActiveSheet('Three'));

    expect((await secondGridRecord(bar)).indicators).toBe(1);
  });

  test('a move made while the grid loads is instant, and a later move slides', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await prepareSecondGrid(bar);
    await page.evaluate(() => {
      const target = window as never as SecondGridWindow;

      target.htSecond.hot = new target.Handsontable(target.htSecond.container, {
        licenseKey: 'non-commercial-and-evaluation',
        sheetsBar: { sheets: [{ name: 'One' }, { name: 'Two' }] },
      });

      const plugin = target.htSecond.hot.getPlugin('sheetsBar');

      plugin.moveSheetToIndex(plugin.getSheets()[0].id, 1);
    });

    expect(await secondGridTabNames(bar)).toEqual(['Two', 'One']);
    expect((await secondGridRecord(bar)).sliding).toBe(false);

    await bar.waitForFrames();
    await moveSecondGridFirstSheet(bar);

    expect(await secondGridTabNames(bar)).toEqual(['One', 'Two']);
    expect((await secondGridRecord(bar)).sliding).toBe(true);
  });

  test('a settings update that keeps the workbook leaves the motion on', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.recordMotionFromStart();
    await bar.goto();
    await bar.waitForFrames();

    await page.evaluate(() => {
      const { hot, htSheets } = window as never as HotWindow;

      hot.updateSettings({ sheetsBar: { sheets: htSheets } });
      hot.getPlugin('sheetsBar').setActiveSheet('Beta');
    });

    expect((await bar.motionRecord()).indicators).toBeGreaterThan(0);
  });
});
