import { test, expect, MOTION_TAG } from '../fixtures/test';
import { DataProviderSheetsBarPage } from '../fixtures/pages/DataProviderSheetsBarPage';

/**
 * The base transition `T` of each animated theme, from the design table of the switch animation.
 */
const SPEC_TRANSITION_MS: Record<string, number> = { main: 150, horizon: 200 };

/**
 * Opens the fixture on Orders with its first rows loaded, then freezes the page clock, so every
 * animation timer waits until the test advances time. Tab 1 is the local Notes sheet, tab 2 the
 * Customers server sheet, whose first fetch parks until the test releases it.
 */
async function openPaused(server: DataProviderSheetsBarPage): Promise<void> {
  await server.page.clock.install();
  await server.goto();
  await server.page.clock.pauseAt(Date.now() + 60_000);
}

test.describe('sheets bar switch animation – server sheets', { tag: MOTION_TAG }, () => {
  test('a switch onto a sheet still fetching slides the marker and waits for the rows, with no content swap', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(2);

    await expect(server.tabIndicator()).toHaveCount(1);
    await expect(server.loadingOverlayVisible()).toHaveCount(1);
    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBe('awaiting');

    await page.clock.runFor(2_000);

    await expect(server.tabIndicator()).toHaveCount(0);
    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBe('awaiting');
  });

  test('the rows fade in where they land once the fetch resolves, then the selection is revealed', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);

    const transition = SPEC_TRANSITION_MS[theme];

    await server.clickTab(2);
    await page.clock.runFor(2_000);

    expect(await server.release('CUS')).toBe(1);

    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    await expect(server.switchLayer()).toHaveCount(1);

    const layer = await server.switchLayerContent();

    expect(layer.isFade).toBe(true);
    expect(layer.out).toBe(0);
    expect(layer.headers).toEqual([]);
    expect(layer.body).toContain('CUS-01');
    expect(layer.body).toContain('CUS-05');
    expect(layer.body.filter(text => !text.startsWith('CUS') && text !== '#1')).toEqual([]);
    expect(await server.switchState()).toBe('awaiting');

    await page.clock.runFor(Math.floor(transition) - 1);

    await expect(server.switchLayer()).toHaveCount(1);

    await page.clock.runFor(2);

    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBe('reveal');

    await page.clock.runFor(Math.ceil(transition));

    expect(await server.switchState()).toBeNull();
  });

  test('a failed fetch fades nothing in and shows the selection at once', async ({ page, theme, bundle }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.failNext('CUS');
    await server.clickTab(2);

    expect(await server.switchState()).toBe('awaiting');
    expect(await server.release('CUS')).toBe(1);

    await expect(server.toast()).toBeVisible();
    await expect.poll(() => server.switchState()).toBeNull();
    await expect(server.switchLayer()).toHaveCount(0);

    await page.clock.runFor(2_000);

    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();
  });

  test('a switch away while the fetch runs drops the fade, and the sheet shows its kept rows on return with a content swap', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(2);
    await server.clickTab(1);
    await page.clock.runFor(2_000);

    await expect(server.cell(0, 0)).toHaveText('NOTE-1');
    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();
    expect(await server.release('CUS')).toBe(1);

    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();

    await server.clickTab(2);

    expect(await server.fetchCount('CUS')).toBe(1);
    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    await expect(server.switchLayer()).toHaveCount(1);

    const layer = await server.switchLayerContent();

    expect(layer.isFade).toBe(false);
    expect(layer.out).toBeGreaterThan(0);
    expect(layer.body).toContain('CUS-01');
  });

  test('a switch onto a sheet with a kept response swaps the content at once', async ({ page, theme, bundle }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(1);
    await page.clock.runFor(2_000);
    await server.clickTab(0);

    expect(await server.fetchCount('ORD')).toBe(1);
    await expect(server.cell(0, 0)).toHaveText('ORD-01');
    await expect(server.switchLayer()).toHaveCount(1);

    const layer = await server.switchLayerContent();

    expect(layer.isFade).toBe(false);
    expect(layer.out).toBeGreaterThan(0);
    expect(layer.body).toContain('ORD-01');
  });

  test('a host loadData() during the wait drops it, and nothing fades in when the fetch resolves', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(2);

    expect(await server.switchState()).toBe('awaiting');

    await page.evaluate(() => (window as never as { hot: any }).hot.loadData([{ id: 'HOST-1', fetch: 0 }]));

    expect(await server.switchState()).toBeNull();
    expect(await server.release('CUS')).toBe(1);

    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    await expect(server.switchLayer()).toHaveCount(0);

    await page.clock.runFor(2_000);

    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();
  });

  test('a scroll during the wait drops it, and nothing fades in when the fetch resolves', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await page.clock.install();
    await server.goto({ windowScroll: true });
    await page.evaluate(() => {
      document.body.style.minHeight = '5000px';
    });
    await page.clock.pauseAt(Date.now() + 60_000);
    await server.clickTab(2);

    expect(await server.switchState()).toBe('awaiting');

    await page.evaluate(() => new Promise<void>((resolve) => {
      const hot = (window as never as { hot: any }).hot;

      hot.addHookOnce('afterScroll', () => resolve());
      window.scrollTo(0, 120);
    }));

    expect(await server.switchState()).toBeNull();
    expect(await server.release('CUS')).toBe(1);

    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();
  });

  test('in a grid the window scrolls, the rows still fade in when their load grows the grid', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await page.clock.install();
    await server.goto({ windowScroll: true });
    await page.clock.pauseAt(Date.now() + 60_000);
    await server.clickTab(2);

    const rootSize = () => page.evaluate(() => {
      const root = (window as never as { hot: any }).hot.rootElement as HTMLElement;

      return `${root.offsetWidth}x${root.offsetHeight}`;
    });
    const before = await rootSize();

    expect(await server.switchState()).toBe('awaiting');
    expect(await server.release('CUS')).toBe(1);

    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    expect(await rootSize()).not.toBe(before);
    await expect(server.switchLayer()).toHaveCount(1);
    expect((await server.switchLayerContent()).isFade).toBe(true);
  });

  test('while a switch waits for its rows, the focused cell keeps its border and the rest of the selection stays hidden', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(2);
    expect(await server.release('CUS')).toBe(1);

    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    await expect(server.switchLayer()).toHaveCount(1);

    await page.evaluate(() => (window as never as { hot: any }).hot.selectCell(0, 0, 1, 1));

    expect(await server.switchState()).toBe('awaiting');

    const opacities = await server.selectionBorderOpacities();

    expect(opacities.current.length).toBeGreaterThan(0);
    expect(opacities.current.every(opacity => opacity === '1')).toBe(true);
    expect(opacities.area.length).toBeGreaterThan(0);
    expect(opacities.area.every(opacity => opacity === '0')).toBe(true);
  });

  test('a switch an afterSheetTabChange listener makes onto a second fetching sheet fades that sheet in once its rows land', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await page.clock.install();
    await server.goto({ invoices: true });
    await page.clock.pauseAt(Date.now() + 60_000);

    const transition = SPEC_TRANSITION_MS[theme];

    await server.activateSheetWithChangeListener(2, 3);

    expect(await server.activeSheetIndex()).toBe(3);
    expect(await server.switchState()).toBe('awaiting');
    expect(await server.release('INV')).toBe(1);

    await expect(server.switchLayer()).toHaveCount(1);
    expect((await server.switchLayerContent()).isFade).toBe(true);

    await page.clock.runFor(Math.ceil(transition) + 1);

    expect(await server.switchState()).toBe('reveal');

    await page.clock.runFor(Math.ceil(transition) + 1);

    expect(await server.switchState()).toBeNull();
    await expect(server.switchLayer()).toHaveCount(0);
  });

  test('an afterSheetTabChange listener that turns the sheets bar off leaves no switch state behind', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.activateSheetWithChangeListener(2, null);

    await expect(server.tabIndicator()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();
    await expect(server.switchLayer()).toHaveCount(0);

    await page.clock.runFor(2_000);

    expect(await server.switchState()).toBeNull();
  });

  test('a resize during the wait drops it, and nothing fades in when the fetch resolves', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(2);

    expect(await server.switchState()).toBe('awaiting');

    await page.evaluate(() => (window as never as { hot: any }).hot.updateSettings({ width: 600 }));

    expect(await server.switchState()).toBeNull();
    expect(await server.release('CUS')).toBe(1);

    await expect(server.cell(0, 0)).toHaveText('CUS-01');
    await expect(server.switchLayer()).toHaveCount(0);
    expect(await server.switchState()).toBeNull();
  });
});
