import { test, expect } from '../fixtures/test';
import { ColumnSortingAnnouncementPage } from '../fixtures/pages/ColumnSortingAnnouncementPage';

/**
 * A sort the user makes is announced through the polite live region: the column, named by its rendered
 * header text, and the order it was left in. `aria-sort` alone is read only when the header is focused
 * again. A sort made through the API is silent, and so is a grid built with `ariaTags: false`.
 *
 * Fixture data (Name, Age, Tag): Mia 34 x, Liam 9 y, Olivia 27 z. The Age header is
 * `<b>Age</b> in <i>years</i>`.
 */
const AGE = 'Age in years';
const UNSORTED_AGE = ['34', '9', '27'];
const ASC_AGE = ['9', '27', '34'];
const DESC_AGE = ['34', '27', '9'];

test.describe('Column sorting announcements', () => {
  let grid: ColumnSortingAnnouncementPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSortingAnnouncementPage(page, theme, bundle);
  });

  for (const plugin of ['columnSorting', 'multiColumnSorting'] as const) {
    test(`${plugin}: Enter on a header announces the column and the order, keyboard only`, async({ page }) => {
      await grid.goto({ plugin });
      await grid.cell(0, 1).click();
      await page.keyboard.press('ArrowUp');

      await page.keyboard.press('Enter');
      await expect(grid.politeAnnouncer()).toHaveText(`Sorted by ${AGE}, ascending`);
      await expect(grid.header(1)).toHaveAttribute('aria-sort', 'ascending');
      await grid.expectColumn(1, ASC_AGE);

      await page.keyboard.press('Enter');
      await expect(grid.politeAnnouncer()).toHaveText(`Sorted by ${AGE}, descending`);
      await expect(grid.header(1)).toHaveAttribute('aria-sort', 'descending');
      await grid.expectColumn(1, DESC_AGE);

      await page.keyboard.press('Enter');
      await expect(grid.politeAnnouncer()).toHaveText(`Sorting removed from ${AGE}`);
      await expect(grid.header(1)).toHaveAttribute('aria-sort', 'none');
      await grid.expectColumn(1, UNSORTED_AGE);

      await expect(grid.assertiveAnnouncer()).toHaveText('');
    });

    test(`${plugin}: a header click announces the sort`, async() => {
      await grid.goto({ plugin });
      await grid.header(0).click();

      await expect(grid.politeAnnouncer()).toHaveText('Sorted by Name, ascending');
      await grid.expectColumn(0, ['Liam', 'Mia', 'Olivia']);
    });

    test(`${plugin}: a sort made through the API is not announced`, async() => {
      await grid.goto({ plugin });
      await grid.recordAnnouncements();

      await grid.sortThroughApi(plugin, 1, 'asc');
      await grid.expectColumn(1, ASC_AGE);

      await grid.header(0).click();
      await expect(grid.politeAnnouncer()).toHaveText('Sorted by Name, ascending');

      expect(await grid.announcements()).toEqual(['Sorted by Name, ascending']);
    });

    test(`${plugin}: a grid built with ariaTags off sorts and announces nothing`, async({ page }) => {
      await grid.goto({ plugin, aria: 'off' });
      await expect(grid.politeAnnouncer()).toHaveCount(1);
      await grid.recordAnnouncements();
      await page.clock.install();

      await grid.header(1).click();
      await grid.expectColumn(1, ASC_AGE);
      await grid.cell(0, 1).click();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');
      await grid.expectColumn(1, DESC_AGE);

      // The announcer writes 100ms after it clears the region: run the fake clock past that, so a late
      // write would be in the log. The sorted rows above are the positive control.
      await page.clock.runFor(300);
      expect(await grid.announcements()).toEqual([]);
    });
  }

  test('multiColumnSorting: Shift+Enter and Ctrl+click announce the column and its place in the sort', async({ page }) => {
    await grid.goto({ plugin: 'multiColumnSorting' });
    await grid.header(0).click();
    await expect(grid.politeAnnouncer()).toHaveText('Sorted by Name, ascending');

    await grid.cell(0, 1).click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Shift+Enter');
    await expect(grid.politeAnnouncer()).toHaveText(`Sorted by ${AGE}, ascending, sort priority 2`);
    await expect(grid.header(0)).toHaveAttribute('aria-sort', 'ascending');
    await expect(grid.header(1)).toHaveAttribute('aria-sort', 'ascending');

    await grid.header(2).click({ modifiers: ['ControlOrMeta'] });
    await expect(grid.politeAnnouncer()).toHaveText('Sorted by Tag, ascending, sort priority 3');
  });
});
