import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * With scrollbars that are always shown (the classic, non-overlay kind), a bar narrower than its minimum shows
 * its own horizontal scrollbar, the way the pagination bar does, so a user can see that it scrolls. A bar that
 * fits shows none and keeps its height.
 *
 * Dropping `--hide-scrollbars` and passing `--force-show-scrollbars` does not make every OS draw a scrollbar
 * that takes space: a headless Chromium on a Mac set to show scroll bars automatically draws 0px ones. The
 * scrollbar's size is measured first, and the checks that need a space-taking scrollbar run only where there
 * is one. Linux CI has one.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: ['--force-show-scrollbars'],
  },
});

test.describe('sheets bar with scrollbars that are always shown', { tag: THEMES_TAG }, () => {
  test('shows a scrollbar only while it scrolls', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const readBar = () => page.evaluate(() => {
      const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
      const border = bar.offsetHeight - bar.clientHeight;
      const style = getComputedStyle(bar);
      const borders = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);

      return {
        height: bar.getBoundingClientRect().height,
        scrolls: bar.scrollWidth > bar.clientWidth,
        showsScrollbar: border - borders > 0,
      };
    });

    await fixture.goto({
      sheets: 6,
      tabNames: Array.from({ length: 6 }, (_, index) => `Quarterly report ${index + 1}`),
      columnCounts: [25, 1, 4, 4, 4, 4],
      fixedHeight: false,
    });

    const scrollbarSize = await page.evaluate(() => {
      const probe = document.createElement('div');

      probe.style.cssText = 'position: absolute; width: 100px; height: 100px; overflow: scroll;';
      document.body.appendChild(probe);

      const size = probe.offsetHeight - probe.clientHeight;

      probe.remove();

      return size;
    });
    const fits = await readBar();

    expect(fits.scrolls).toBe(false);
    expect(fits.showsScrollbar).toBe(false);

    await fixture.setActiveSheet(1);
    await expect.poll(async() => (await readBar()).scrolls).toBe(true);

    const scrolls = await readBar();

    if (scrollbarSize > 0) {
      expect(scrolls.showsScrollbar).toBe(true);
      expect(scrolls.height).toBeGreaterThan(fits.height);
    } else {
      expect(scrolls.showsScrollbar).toBe(false);
      expect(scrolls.height).toBe(fits.height);
      test.info().annotations.push({
        type: 'scrollbars',
        description: 'no space-taking scrollbar on this machine, so the shown scrollbar is untested here',
      });
    }

    await fixture.setActiveSheet(0);
    await expect.poll(async() => (await readBar()).scrolls).toBe(false);

    expect((await readBar()).height).toBe(fits.height);
  });

  test('never scrolls vertically on a narrow table', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({
      sheets: 6,
      tabNames: Array.from({ length: 6 }, (_, index) => `Quarterly report ${index + 1}`),
      columnCounts: Array(6).fill(1),
      fixedHeight: false,
    });

    expect(await page.evaluate(() => {
      const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

      return {
        scrollsSideways: bar.scrollWidth > bar.clientWidth,
        overflowsDown: bar.scrollHeight > bar.clientHeight,
        overflowY: getComputedStyle(bar).overflowY,
      };
    })).toEqual({ scrollsSideways: true, overflowsDown: false, overflowY: 'hidden' });
  });
});

