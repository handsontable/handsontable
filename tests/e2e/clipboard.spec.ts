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

  /**
   * A clipboard whose first row is narrower than a later one used to be cut down to the
   * first row's width, dropping the surplus cells with no warning (#7389).
   */
  test.describe('ragged clipboard', () => {
    test('pastes every column of ragged plain text', async ({ page }) => {
      // Row 1 holds one cell, row 2 holds three. "z" and "w" sat past the first row's width.
      await grid.selectCell(0, 0);
      await grid.writeClipboardText('x\ny\tz\tw');
      await page.keyboard.press('ControlOrMeta+v');

      await grid.expectCell(1, 0, 'y');
      await grid.expectCell(1, 1, 'z');
      await grid.expectCell(1, 2, 'w');
      // The short first row is padded out, so it blanks the cells it covers.
      await grid.expectCell(0, 0, 'x');
      await grid.expectCell(0, 1, '');
      // Rows the clipboard never covered keep their values.
      await grid.expectCell(2, 1, 'B3');
    });

    test('pastes every column of a ragged HTML table', async ({ page }) => {
      // The plain-text flavor is deliberately a single cell: if it were the one consumed,
      // "z" and "w" would never appear, so these assertions pin the HTML path.
      await grid.selectCell(0, 0);
      await grid.writeClipboardHtml(
        '<table><tr><td>x</td></tr><tr><td>y</td><td>z</td><td>w</td></tr></table>',
        'PLAIN-FLAVOR-ONLY'
      );
      await page.keyboard.press('ControlOrMeta+v');

      await grid.expectCell(1, 0, 'y');
      await grid.expectCell(1, 1, 'z');
      await grid.expectCell(1, 2, 'w');
      await grid.expectCell(0, 0, 'x');
      await grid.expectCell(2, 1, 'B3');
    });

    test('keeps pasting a clipboard whose first row is the widest', async ({ page }) => {
      // The reverse shape was never broken — this guards it against the fix.
      await grid.selectCell(0, 0);
      await grid.writeClipboardText('x\ty\tz\nw');
      await page.keyboard.press('ControlOrMeta+v');

      await grid.expectCell(0, 0, 'x');
      await grid.expectCell(0, 1, 'y');
      await grid.expectCell(0, 2, 'z');
      await grid.expectCell(1, 0, 'w');
      await grid.expectCell(1, 1, '');
    });
  });
});
