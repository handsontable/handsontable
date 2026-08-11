import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

/**
 * Real-clipboard copy/cut — migrated from the four legacy CopyPaste
 * placeholders (copy.spec.js / cut.spec.js), which were empty `xit` stubs:
 * simulated keyboard and mouse events can never drive the browser's native
 * clipboard, so the legacy env could not test this at all (DEV-2183).
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('clipboard', () => {
  let grid: GridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new GridPage(page, theme, bundle);
    await grid.goto();
  });

  test('copies the selected cell with the keyboard shortcut', async ({ page }) => {
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+c');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    // Copy leaves the source cell intact.
    await grid.expectCell(1, 1, 'B2');
  });

  test('copies the selected cell through the context menu', async () => {
    await grid.selectCell(1, 1);
    await grid.openContextMenu(1, 1);
    await grid.clickContextMenuItem('Copy');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    await grid.expectCell(1, 1, 'B2');
  });

  test('cuts the selected cell with the keyboard shortcut', async ({ page }) => {
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+x');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    // Cut empties the source cell.
    await grid.expectCell(1, 1, '');
  });

  test('cuts the selected cell through the context menu', async () => {
    await grid.selectCell(1, 1);
    await grid.openContextMenu(1, 1);
    await grid.clickContextMenuItem('Cut');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    await grid.expectCell(1, 1, '');
  });
});
