import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * With scrollbars that are always shown (the classic, non-overlay kind), a bar narrower than its minimum
 * painted its own horizontal scrollbar under the tabs and grew taller by its height. The bar scrolls without
 * a scrollbar of its own, the way the tab strip does.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: ['--force-show-scrollbars'],
  },
});

test.describe('sheets bar with scrollbars that are always shown', { tag: THEMES_TAG }, () => {
  test('keeps its height when it scrolls', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const readBar = () => page.evaluate(() => {
      const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

      return { height: bar.getBoundingClientRect().height, scrolls: bar.scrollWidth > bar.clientWidth };
    });

    await fixture.goto({
      sheets: 6,
      tabNames: Array.from({ length: 6 }, (_, index) => `Quarterly report ${index + 1}`),
      columnCounts: [25, 1, 4, 4, 4, 4],
      fixedHeight: false,
    });

    const fits = await readBar();

    expect(fits.scrolls).toBe(false);

    await fixture.setActiveSheet(1);
    await expect.poll(async() => (await readBar()).scrolls).toBe(true);

    expect((await readBar()).height).toBe(fits.height);
  });
});
