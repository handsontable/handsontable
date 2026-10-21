// COUNTEREXAMPLE — the scorer must mark this file `suspect`.
//
// Same scenario as the reference, but the author "gives the editor time to close"
// with a fixed timer before asserting. A `setTimeout` inside `page.evaluate` is
// the Playwright tier's usual disguise for a sleep: `page.waitForTimeout` is
// banned, so the delay moves into the page. The only smell here is that timer,
// so the harness proves the `set-timeout` signal fires on its own.
import { test, expect } from '@playwright/test';
import { GridPage } from '../fixtures/pages/GridPage';

test.describe('editor escape', () => {
  test('Escape discards the in-progress edit and keeps the selection on the cell', async({ page }) => {
    const grid = new GridPage(page);

    await grid.goto();

    await grid.cell(1, 1).dblclick();
    const editor = page.locator('.handsontableInput');

    await expect(editor).toBeVisible();
    await editor.fill('discarded');
    await editor.press('Escape');

    // The disguised sleep: a fixed timer is not a wait on the editor closing.
    await page.evaluate(() => new Promise((resolve) => {
      setTimeout(resolve, 300);
    }));

    await grid.expectCell(1, 1, 'B2');

    await grid.typeIntoSelected('kept');
    await grid.expectCell(1, 1, 'kept');
  });
});
