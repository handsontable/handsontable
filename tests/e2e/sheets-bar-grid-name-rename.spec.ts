import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * The sheets bar names the grid after the active sheet: the grid's root points at the active tab's
 * label through `aria-labelledby`. A rename ended in the tab rebuilds the tab, and its new label
 * takes the `id` back from the hidden span that kept the saved name during the edit. Firefox kept
 * the name it had read from that span, so NVDA with Firefox named the grid by the old name after a
 * rename. The bar now removes the attribute and sets it back when another element holds the `id`.
 *
 * Playwright computes an accessible name from the DOM, not from the browser's accessibility cache,
 * so `toHaveAccessibleName` reads the new name in every engine with or without the fix (it passed
 * on unfixed code in Firefox too). The specs therefore pin the re-write itself: the attribute is
 * removed and set back when the rename ends, and left alone when nothing moved the `id`.
 */
test.describe('the grid name after a sheet rename', { tag: CROSS_BROWSER_TAG }, () => {
  test('a rename ended in the tab names the grid again', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const label = fixture.tab(1).locator('.ht-sheets-bar__tab-label');

    await fixture.goto();
    await fixture.tab(1).click();
    await expect(fixture.grid()).toHaveAccessibleName('Sheet 2');

    const labelId = await label.getAttribute('id');

    expect(labelId, 'the tab label carries an id').toBeTruthy();

    await label.dblclick();
    await fixture.renameInput.fill('Budget');
    await fixture.recordGridNameWrites();
    await page.keyboard.press('Enter');

    await expect(fixture.grid()).toHaveAccessibleName('Budget');
    await expect(fixture.grid()).toHaveAttribute('aria-labelledby', labelId!);
    await expect.poll(() => fixture.gridNameWrites(), {
      message: 'the attribute is removed and set back once, when the rename ends',
    }).toEqual([labelId, null]);
  });

  test('a rename the API makes in place leaves the attribute alone', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();

    const firstLabelId = await fixture.tab(0).locator('.ht-sheets-bar__tab-label').getAttribute('id');

    await fixture.recordGridNameWrites();
    await page.evaluate(() => {
      const sheetsBar = (window as any).hot.getPlugin('sheetsBar');

      sheetsBar.renameSheet(sheetsBar.getSheets()[0].id, 'Forecast');
    });

    await expect(fixture.grid()).toHaveAccessibleName('Forecast');
    // The positive control: a switch writes the arriving tab's id, so the recorder sees a write.
    await fixture.tab(1).click();
    await expect(fixture.grid()).toHaveAccessibleName('Sheet 2');
    await expect.poll(() => fixture.gridNameWrites(), {
      message: 'only the switch wrote the attribute, from the first tab\'s id',
    }).toEqual([firstLabelId]);
  });

  test('a rename keeps the name the host gave the grid', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ hostLabel: 'Quarterly report' });
    await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Budget');
    await page.keyboard.press('Enter');

    await expect(fixture.tab(0).locator('.ht-sheets-bar__tab-label')).toHaveText('Budget');
    await expect(fixture.grid()).toHaveAccessibleName('Quarterly report');
    await expect(fixture.grid()).not.toHaveAttribute('aria-labelledby');
  });

  test('with ariaTags off a rename names nothing', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ ariaTags: false });
    await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Budget');
    await page.keyboard.press('Enter');

    await expect(fixture.tab(0).locator('.ht-sheets-bar__tab-label')).toHaveText('Budget');
    expect(await page.evaluate(() => (window as any).hot.rootElement.hasAttribute('aria-labelledby'))).toBe(false);
  });
});
