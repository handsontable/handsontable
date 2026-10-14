import { test, expect, MOTION_TAG } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

const NO_MOTION = { indicators: 0, entrances: 0 };

type HotWindow = { hot: any, htSheets: Array<{ name: string, data: unknown[][] }> };

/**
 * The bar's motion starts only once the grid has been on screen for a frame. Every case records
 * from before the fixture's first script, and proves the motion runs afterwards, so an instant
 * load is never the result of an animation that cannot run at all.
 */
test.describe('sheets bar switch animation – while the grid loads', { tag: MOTION_TAG }, () => {
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
