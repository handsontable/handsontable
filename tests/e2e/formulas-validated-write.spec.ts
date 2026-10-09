import { test, expect } from '../fixtures/test';
import { awaitBundle } from '../fixtures/bundle';

/**
 * A formula typed into a validated column while a hook updates the settings in the same task. The
 * Core applies the validated change in a microtask, after the Formulas plugin wrote it into the
 * engine and after the `updateSettings()` rebuilt the sheet from source data that did not hold it
 * yet - so the cell kept showing the raw `=SUM(A1:A2)` text. The plugin now writes the change back
 * when the Core applies it.
 */
test.describe('Formulas: a validated write across a settings update', () => {
  test('shows the result of a formula typed in the editor, not its raw text', async ({ page, theme, bundle }) => {
    await page.goto(`/tests/fixtures/demo/formulas-validated-write.html?theme=${theme}&bundle=${bundle}`);
    await awaitBundle(page);

    const cell = page.locator('.ht_master').getByTestId('cell-2-0');

    await cell.click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('=SUM(A1:A2)');
    await page.keyboard.press('Enter');

    await expect(cell).toHaveText('3');
    expect(await page.evaluate(() => (window as any).hot.getSourceDataAtCell(2, 0))).toBe('=SUM(A1:A2)');
  });
});
