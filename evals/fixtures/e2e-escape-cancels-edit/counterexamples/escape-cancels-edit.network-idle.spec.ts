// COUNTEREXAMPLE — the scorer must mark this file `suspect`.
//
// Same scenario as the reference, but the author waits for the page's
// network-idle load state before driving the grid. That state is flaky by
// design (it depends on what else the page happens to fetch) and Playwright
// discourages it for web apps; the grid being ready is what the test needs, and
// the fixture already exposes it. The only smell here is that wait, so the
// harness proves the `network-idle` signal fires on its own. (The scorer is
// text-based, so this comment deliberately never spells the banned load-state
// value as one word.)
import { test, expect } from '@playwright/test';
import { GridPage } from '../fixtures/pages/GridPage';

test.describe('editor escape', () => {
  test('Escape discards the in-progress edit and keeps the selection on the cell', async({ page }) => {
    const grid = new GridPage(page);

    await grid.goto();
    // The flaky wait: the network going quiet is not the grid being ready.
    await page.waitForLoadState('networkidle');

    await grid.cell(1, 1).dblclick();
    const editor = page.locator('.handsontableInput');

    await expect(editor).toBeVisible();
    await editor.fill('discarded');
    await editor.press('Escape');

    await grid.expectCell(1, 1, 'B2');

    await grid.typeIntoSelected('kept');
    await grid.expectCell(1, 1, 'kept');
  });
});
