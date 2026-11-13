import { test, expect, THEMES_TAG, MOTION_TAG } from '../fixtures/test';
import { DataProviderSheetsBarPage } from '../fixtures/pages/DataProviderSheetsBarPage';

/**
 * Opens the fixture on Orders with its first rows loaded, then freezes the page clock, so the
 * timer that ends the marker slide waits until the test advances time. Tab 2 is the Customers
 * server sheet, whose first fetch parks until the test releases it.
 */
async function openPaused(server: DataProviderSheetsBarPage): Promise<void> {
  await server.gotoWithPausedClock();
}

test.describe('sheets bar switch animation – server sheets', { tag: [THEMES_TAG, MOTION_TAG] }, () => {
  test('a switch onto a sheet still fetching slides the marker while the grid shows its loading state', async ({
    page, theme, bundle,
  }) => {
    const server = new DataProviderSheetsBarPage(page, theme, bundle);

    await openPaused(server);
    await server.clickTab(2);

    await expect(server.tabIndicator()).toHaveCount(1);
    await expect(server.loadingOverlayVisible()).toHaveCount(1);

    await page.clock.runFor(2_000);

    await expect(server.tabIndicator()).toHaveCount(0);
    await expect(server.loadingOverlayVisible()).toHaveCount(1);
  });
});
