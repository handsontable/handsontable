import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { CollapsibleColumnsA11yPage } from '../fixtures/pages/CollapsibleColumnsA11yPage';

/**
 * A keyboard user must be able to collapse and expand a column group without reaching its header,
 * which takes the focus only with `navigableHeaders` on: Shift+Alt+ArrowUp toggles the group closest
 * to the data over the selected cell. `aria-expanded` on the header is read only when the header is
 * focused again, so every toggle made by a user gesture is also confirmed in the polite live region.
 *
 * Header layout of the fixture (visual columns in brackets):
 *   row -3:  Plain [0] | Group 1 [1-4]              | Group 2 [5-7]
 *   row -2:  Solo  [0] | Sub 1 [1-2] | Sub 2 [3-4]  | X [5] | Y [6] | Z [7]
 *   row -1:  c0 ... c7
 */

test.describe('CollapsibleColumns keyboard toggle', { tag: CROSS_BROWSER_TAG }, () => {
  test('Shift+Alt+ArrowUp from a data cell toggles the group closest to the data with navigableHeaders off',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off' });
      await columns.clickCell(1, 1);
      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'false');
      await expect(columns.header('Group 1')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Sub 1');
      expect(await columns.hiddenColumns()).toEqual([2]);
      expect(await columns.selectedCell()).toEqual([1, 1]);
      await expect(columns.cell(1, 1)).toBeFocused();

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.politeAnnouncer()).toHaveText('Expanded column group Sub 1');
      expect(await columns.hiddenColumns()).toEqual([]);
      expect(await columns.selectedCell()).toEqual([1, 1]);
    });

  test('a collapse from a column the group hides keeps the selection in the group, so the key expands it again',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off' });
      await columns.clickCell(1, 2);
      await columns.recordAnnouncements();

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'false');
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Sub 1');
      expect(await columns.hiddenColumns()).toEqual([2]);
      expect(await columns.selectedCell()).toEqual([1, 1]);
      await expect(columns.cell(1, 1)).toBeFocused();

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.politeAnnouncer()).toHaveText('Expanded column group Sub 1');
      expect(await columns.hiddenColumns()).toEqual([]);
      expect(await columns.selectedCell()).toEqual([1, 1]);
      expect(await columns.announcements()).toEqual([
        'Collapsed column group Sub 1',
        'Expanded column group Sub 1',
      ]);
    });

  test('a collapse from the first column of the group leaves the selection where it is',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off' });
      await columns.clickCell(2, 3);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'false');
      expect(await columns.hiddenColumns()).toEqual([4]);
      expect(await columns.selectedCell()).toEqual([2, 3]);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');
      expect(await columns.hiddenColumns()).toEqual([]);
      expect(await columns.selectedCell()).toEqual([2, 3]);
    });

  test('a collapse by a press on the indicator still moves a hidden selection to the nearest column',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off' });
      await columns.clickCell(1, 2);

      await columns.indicator('Sub 1').click();

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(() => columns.selectedCell()).toEqual([1, 3]);
    });

  test('a cell under a group whose lower headers cannot collapse toggles the group above them',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off' });
      await columns.clickCell(0, 5);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Group 2')).toHaveAttribute('aria-expanded', 'false');
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Group 2');
      expect(await columns.hiddenColumns()).toEqual([6, 7]);
    });

  test('a cell with no collapsible group above it leaves the key to the browser',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off' });
      await columns.recordKeyClaims();
      await columns.clickCell(0, 0);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await columns.clickCell(1, 3);
      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'false');
      expect(await columns.hiddenColumns()).toEqual([4]);
      expect(await columns.keyClaims()).toEqual([false, true]);
    });

  test('from a focused header the key toggles that header group', async({ page, theme, bundle }) => {
    const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

    await columns.goto({ navigableHeaders: 'on' });
    await columns.focusHeader(1, -3);

    await page.keyboard.press('Shift+Alt+ArrowUp');

    await expect(columns.header('Group 1')).toHaveAttribute('aria-expanded', 'false');
    await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');
    await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Group 1');
    expect(await columns.hiddenColumns()).toEqual([3, 4]);

    await page.keyboard.press('Shift+Alt+ArrowUp');

    await expect(columns.header('Group 1')).toHaveAttribute('aria-expanded', 'true');
    await expect(columns.politeAnnouncer()).toHaveText('Expanded column group Group 1');
    expect(await columns.hiddenColumns()).toEqual([]);
  });

  test('from a focused header that cannot collapse the key toggles the closest group above it',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'on' });
      await columns.focusHeader(3, -1);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'false');
      await expect(columns.header('Group 1')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Sub 2');
      expect(await columns.hiddenColumns()).toEqual([4]);
    });

  test('a collapse from a focused header of a column the group hides keeps the focus in the group',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'on' });
      await columns.focusHeader(4, -1);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'false');
      expect(await columns.hiddenColumns()).toEqual([4]);
      expect(await columns.selectedCell()).toEqual([-1, 3]);
      await expect(columns.header('c3')).toBeFocused();
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Sub 2');

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 2')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.header('Group 2')).toHaveAttribute('aria-expanded', 'true');
      expect(await columns.hiddenColumns()).toEqual([]);
      expect(await columns.selectedCell()).toEqual([-1, 3]);
    });

  test('Enter on a focused group header over a column the collapse hides keeps the focus on that header',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'on' });
      await columns.focusHeader(3, -3);

      await page.keyboard.press('Enter');

      await expect(columns.header('Group 1')).toHaveAttribute('aria-expanded', 'false');
      expect(await columns.hiddenColumns()).toEqual([3, 4]);
      expect(await columns.selectedCell()).toEqual([-3, 1]);
    });

  test('several selected ranges are left alone', async({ page, theme, bundle }) => {
    const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

    await columns.goto({ navigableHeaders: 'off' });
    await columns.clickCell(0, 0);
    await columns.selectTwoRanges();

    await page.keyboard.press('Shift+Alt+ArrowUp');

    await columns.clickCell(2, 5);
    await page.keyboard.press('Shift+Alt+ArrowUp');

    await expect(columns.header('Group 2')).toHaveAttribute('aria-expanded', 'false');
    expect(await columns.hiddenColumns()).toEqual([6, 7]);
  });

  test('a grid built with ariaTags off toggles without aria-expanded and without an announcement',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ aria: 'off', navigableHeaders: 'off' });
      await columns.recordAnnouncements();
      await columns.clickCell(0, 1);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect.poll(() => columns.hiddenColumns()).toEqual([2]);
      await expect(columns.header('Sub 1')).not.toHaveAttribute('aria-expanded');

      await columns.indicator('Sub 1').click();

      await expect.poll(() => columns.hiddenColumns()).toEqual([]);
      expect(await columns.announcements()).toEqual([]);
    });
});

test.describe('CollapsibleColumns announcements', { tag: CROSS_BROWSER_TAG }, () => {
  test('Enter on a focused group header announces the collapse and the expand',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'on' });
      await columns.focusHeader(1, -2);
      await columns.recordAnnouncements();

      await page.keyboard.press('Enter');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'false');
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Sub 1');

      await page.keyboard.press('Enter');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');
      await expect(columns.politeAnnouncer()).toHaveText('Expanded column group Sub 1');
      expect(await columns.announcements()).toEqual([
        'Collapsed column group Sub 1',
        'Expanded column group Sub 1',
      ]);
    });

  test('a press on the indicator announces the collapse and the expand', async({ page, theme, bundle }) => {
    const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

    await columns.goto({ navigableHeaders: 'off' });
    await expect(columns.indicator('Group 2')).toHaveAttribute('aria-hidden', 'true');

    await columns.indicator('Group 2').click();

    await expect(columns.header('Group 2')).toHaveAttribute('aria-expanded', 'false');
    await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Group 2');

    await columns.indicator('Group 2').click();

    await expect(columns.header('Group 2')).toHaveAttribute('aria-expanded', 'true');
    await expect(columns.politeAnnouncer()).toHaveText('Expanded column group Group 2');
  });

  test('a collapse the application vetoes changes nothing and announces nothing', async({ page, theme, bundle }) => {
    const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

    await columns.goto({ navigableHeaders: 'off' });
    await columns.clickCell(1, 5);
    await columns.setCollapsesVetoed(true);
    await columns.recordAnnouncements();

    await page.keyboard.press('Shift+Alt+ArrowUp');
    await columns.indicator('Sub 1').click();

    await expect(columns.header('Group 2')).toHaveAttribute('aria-expanded', 'true');
    await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');
    expect(await columns.hiddenColumns()).toEqual([]);

    await columns.setCollapsesVetoed(false);
    await page.keyboard.press('Shift+Alt+ArrowUp');

    await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Group 2');
    expect(await columns.announcements()).toEqual(['Collapsed column group Group 2']);
  });

  test('the public API changes aria-expanded but does not announce', async({ page, theme, bundle }) => {
    const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

    await columns.goto({ navigableHeaders: 'off' });
    await columns.recordAnnouncements();

    await columns.callSection('collapseSection', -2, 1);
    await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'false');
    await columns.callSection('expandSection', -2, 1);
    await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'true');

    await columns.indicator('Group 2').click();

    await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Group 2');
    expect(await columns.announcements()).toEqual(['Collapsed column group Group 2']);
  });
});

test.describe('CollapsibleColumns beside NestedRows', { tag: CROSS_BROWSER_TAG }, () => {
  test('each plugin answers its own chord from one data cell, and the dropdown menu keeps its own',
    async({ page, theme, bundle }) => {
      const columns = new CollapsibleColumnsA11yPage(page, theme, bundle);

      await columns.goto({ navigableHeaders: 'off', nestedRows: 'on' });
      await columns.clickCell(0, 1);

      await page.keyboard.press('Shift+Alt+ArrowUp');

      await expect(columns.header('Sub 1')).toHaveAttribute('aria-expanded', 'false');
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed column group Sub 1');
      expect(await columns.hiddenColumns()).toEqual([2]);
      expect(await columns.firstColumn()).toEqual(['Root A', 'A-1', 'A-2', 'Root B', 'B-1']);

      await page.keyboard.press('Shift+Alt+ArrowLeft');

      await expect.poll(() => columns.firstColumn()).toEqual(['Root A', 'Root B', 'B-1']);
      await expect(columns.politeAnnouncer()).toHaveText('Collapsed row 1');
      expect(await columns.hiddenColumns()).toEqual([2]);

      await page.keyboard.press('Shift+Alt+ArrowRight');

      await expect.poll(() => columns.firstColumn()).toEqual(['Root A', 'A-1', 'A-2', 'Root B', 'B-1']);
      expect(await columns.hiddenColumns()).toEqual([2]);
      expect(await columns.selectedCell()).toEqual([0, 1]);

      await page.keyboard.press('Shift+Alt+ArrowDown');

      await expect(columns.dropdownMenu()).toBeVisible();
      expect(await columns.hiddenColumns()).toEqual([2]);
      expect(await columns.firstColumn()).toEqual(['Root A', 'A-1', 'A-2', 'Root B', 'B-1']);
    });
});
