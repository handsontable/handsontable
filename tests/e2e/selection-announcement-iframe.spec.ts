import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { SelectionAnnouncementIframePage } from '../fixtures/pages/SelectionAnnouncementIframePage';

/**
 * A grid whose DOM lives in an iframe, built by the PARENT page's `Handsontable`, announces a keyboard
 * selection once, after the key presses stop, like a grid in its own document. The announcer's timers
 * must be set and cleared through one realm, or a press inside the delay leaves the earlier timer running.
 */
const SETTLE_MS = 1000;
const BETWEEN_PRESSES_MS = 110;

test.describe('Selection announcements across realms', { tag: BUNDLES_TAG }, () => {
  let grid: SelectionAnnouncementIframePage;

  test.beforeEach(async({ theme, page, bundle }) => {
    grid = new SelectionAnnouncementIframePage(page, theme, bundle);
    await grid.goto();
    await grid.recordAnnouncements();
    await grid.freezeTime();
  });

  test('Shift+ArrowDown pressed five times inside the delay announces the final range once', async({ page }) => {
    await grid.cell(1, 1).click();

    for (let press = 0; press < 5; press += 1) {
      await page.keyboard.press('Shift+ArrowDown');
      await grid.advance(BETWEEN_PRESSES_MS);
    }

    await grid.advance(SETTLE_MS);

    expect(await grid.selected()).toEqual([[1, 1, 6, 1]]);
    expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column B, row 7']);
  });
});
