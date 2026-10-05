import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { TwoGridsPage } from '../fixtures/pages/TwoGridsPage';

// The permissions let a test read the clipboard back. Only Chromium grants them (Firefox rejects
// `clipboard-read`, WebKit `clipboard-write`), and the copy and paste themselves are real key presses
// that need neither, so the engine legs run these specs without them.
test.use({
  permissions: async({ browserName }, use) => {
    await use(browserName === 'chromium' ? ['clipboard-read', 'clipboard-write'] : []);
  },
});

/**
 * A value copied in one grid pastes into another grid on the same page through the system
 * clipboard, into a writable cell, and is refused by a cell of a column made read-only through the
 * context menu.
 *
 * Both grids hear the page's clipboard events, so the paste has to land in the grid the user
 * clicked and nowhere else; the read-only refusal is the paste path honoring cell meta set at run
 * time from the menu. Until DEV-3257 this ran in the cross-browser visual suite
 * (`copy-paste.spec.ts` on `/two-tables-demo`, Chromium only, no screenshot), so it ran on the
 * develop seed and the nightly, and on a pull request only when the pull request changed the
 * visual suite.
 */
test.describe('clipboard between two grids', { tag: CROSS_BROWSER_TAG }, () => {
  let page: TwoGridsPage;

  test.beforeEach(async({ page: browserPage, theme, bundle }) => {
    page = new TwoGridsPage(browserPage, theme, bundle);
    await page.goto();
  });

  test('pastes a value copied in one grid into the other grid, but not into a read-only column', async({
    page: browserPage,
    browserName,
  }) => {
    await page.makeColumnReadOnly('top', 4);

    await page.cell('bottom', 2, 3).click();
    await browserPage.keyboard.press('ControlOrMeta+c');

    // Reading the clipboard back needs `clipboard-read`, which only Chromium grants; on Firefox and
    // WebKit the paste below, landing the copied value, is what shows the copy happened.
    if (browserName === 'chromium') {
      await expect.poll(async() => page.clipboardText()).toBe('bD3');
    }

    // Leave the source grid on a different cell, so a paste that reached it as well would show.
    await page.cell('bottom', 4, 4).click();

    // A writable cell of the other grid takes the value.
    await page.cell('top', 2, 3).click();
    await browserPage.keyboard.press('ControlOrMeta+v');

    await expect(page.cell('top', 2, 3)).toHaveText('bD3');
    expect(await page.dataAt('top', 2, 3)).toBe('bD3');

    // A cell of the read-only column keeps its own. The writable paste above, through the same
    // keys and listeners, is what shows a paste reached this grid at all.
    await page.cell('top', 2, 4).click();
    await browserPage.keyboard.press('ControlOrMeta+v');

    await expect.poll(async() => page.gridState('top')).toEqual({ selected: [[2, 4, 2, 4]], listening: true });
    expect(await page.dataAt('top', 2, 4)).toBe('E3');
    await expect(page.cell('top', 2, 4)).toHaveText('E3');

    // The grid the value came from took neither paste.
    expect(await page.dataAt('bottom', 4, 4)).toBe('bE5');
    expect(await page.dataAt('bottom', 2, 3)).toBe('bD3');
  });
});
