import { test, expect, CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG } from '../fixtures/test';
import { TwoGridsPage } from '../fixtures/pages/TwoGridsPage';

// Reading the clipboard back needs `clipboard-read`. Playwright grants it on Chromium and WebKit and
// rejects the name on Firefox, where asking for it fails the context; the WebKit leg leaves this
// spec out (`CLIPBOARD_SHORTCUT_TAG`), so the permission is asked for, and the clipboard read back,
// on Chromium. The copy and paste themselves are real key presses and need no permission.
test.use({
  permissions: async({ browserName }, use) => {
    await use(browserName === 'chromium' ? ['clipboard-read'] : []);
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
test.describe('clipboard between two grids', { tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }, () => {
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
    await page.countPastes('top');

    // By default a click on the other grid drops the source grid's selection, and a grid with no
    // selection ignores a paste whether or not it should. Keeping the selection leaves the source
    // grid a cell that a paste reaching it as well would write to.
    await page.keepSelectionOnOutsideClick('bottom');

    await page.cell('bottom', 2, 3).click();
    await browserPage.keyboard.press('ControlOrMeta+c');

    // On Firefox the paste below, landing the copied value, is what shows the copy happened.
    if (browserName === 'chromium') {
      await expect.poll(async() => page.clipboardText()).toBe('bD3');
    }

    // Leave the source grid on a different cell, so a paste that reached it as well would show.
    await page.cell('bottom', 4, 4).click();

    // A writable cell of the other grid takes the value. The source grid keeps its cell selected,
    // and no longer listens.
    await page.cell('top', 2, 3).click();
    await expect.poll(async() => page.gridState('bottom')).toEqual({ selected: [[4, 4, 4, 4]], listening: false });
    await browserPage.keyboard.press('ControlOrMeta+v');

    await expect(page.cell('top', 2, 3)).toHaveText('bD3');
    expect(await page.dataAt('top', 2, 3)).toBe('bD3');
    expect(await page.pastesHandled('top')).toBe(1);

    // A cell of the read-only column keeps its own. The count shows the grid handled this paste
    // too, through the same keys and listeners, and refused only the write.
    await page.cell('top', 2, 4).click();
    await expect.poll(async() => page.gridState('top')).toEqual({ selected: [[2, 4, 2, 4]], listening: true });
    await browserPage.keyboard.press('ControlOrMeta+v');

    await expect.poll(async() => page.pastesHandled('top')).toBe(2);
    expect(await page.dataAt('top', 2, 4)).toBe('E3');
    await expect(page.cell('top', 2, 4)).toHaveText('E3');

    // The grid the value came from took neither paste, and the copy left its source cell as it was.
    expect(await page.dataAt('bottom', 4, 4)).toBe('bE5');
    expect(await page.dataAt('bottom', 2, 3)).toBe('bD3');
  });
});
