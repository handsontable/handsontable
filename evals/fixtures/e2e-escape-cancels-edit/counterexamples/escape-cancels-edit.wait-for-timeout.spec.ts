// COUNTEREXAMPLE — the scorer must mark this file `suspect`.
//
// Same scenario as the reference, but the author "gives the editor time to close"
// with Playwright's own fixed delay before asserting. It is the plainest fixed
// sleep the Playwright tier has, and the one its lint bans first. The only smell
// here is that call, so the harness proves the `wait-for-timeout` signal fires
// on its own. (The scorer is text-based, so this comment deliberately never
// spells the banned call with its parenthesis.)
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

    // The fixed sleep: 300 ms is a duration, not a wait on the editor closing.
    await page.waitForTimeout(300);

    await grid.expectCell(1, 1, 'B2');

    await grid.typeIntoSelected('kept');
    await grid.expectCell(1, 1, 'kept');
  });
});
