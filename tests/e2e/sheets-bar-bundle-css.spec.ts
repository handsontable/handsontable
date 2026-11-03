import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SheetsBarBundleCssPage } from '../fixtures/pages/SheetsBarBundleCssPage';

test.describe('sheets bar styled by the bundle alone', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('the stylesheet the bundle injects turns off text selection on a tab', async({ page, theme, bundle }) => {
    const bar = new SheetsBarBundleCssPage(page, theme, bundle);

    await bar.goto();

    expect(await bar.linkedBaseStylesheets()).toBe(0);
    await expect.poll(() => bar.tabUserSelect(0)).toBe('none');
  });

  test('the stylesheet the bundle injects turns off text selection on a multi-select option', async({ page, theme, bundle }) => {
    const bar = new SheetsBarBundleCssPage(page, theme, bundle);

    await bar.goto();
    await bar.openMultiSelect(0, 1);

    expect(await bar.linkedBaseStylesheets()).toBe(0);
    await expect.poll(() => bar.multiSelectOptionUserSelect(0)).toBe('none');
  });
});
