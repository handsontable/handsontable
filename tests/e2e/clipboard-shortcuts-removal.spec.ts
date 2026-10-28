import { randomUUID } from 'node:crypto';
import { test, expect } from '../fixtures/test';
import { ClipboardShortcutsPage } from '../fixtures/pages/ClipboardShortcutsPage';

/**
 * Ctrl/Cmd+C, X and V are default grid shortcuts, so removing one through the shortcut manager has to
 * stop the keyboard action. The context menu items and the `copyPaste` API do not go through the
 * keyboard and keep working.
 *
 * Every case copies or pastes a value of its own (`randomUUID()`), because the browser clipboard
 * outlives a test: a copy that silently did nothing would otherwise pass on a leftover. A negative
 * assertion ("nothing was copied") ends with the same keystroke working once the shortcut is back, so
 * it cannot pass on a keystroke that never reached the grid.
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('removing the clipboard shortcuts', () => {
  let grid: ClipboardShortcutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ClipboardShortcutsPage(page, theme, bundle);
    await grid.goto();
    await grid.trackClipboard();
  });

  test('registers the three shortcuts by default and leaves the native events alone', async({ page }) => {
    for (const key of ['C', 'X', 'V'] as const) {
      expect(await grid.hasShortcut(key)).toBe(true);
    }

    const sentinel = `sentinel-${randomUUID()}`;

    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+c');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    expect(await grid.lastKeydownWasPrevented('c')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

    await grid.writeClipboardText(sentinel);
    await grid.selectCell(2, 2);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(2, 2, sentinel);
    expect(await grid.lastKeydownWasPrevented('v')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 1, afterPaste: 1 });

    await grid.selectCell(3, 0);
    await page.keyboard.press('ControlOrMeta+x');

    await expect.poll(() => grid.clipboardText()).toBe('A4');
    await grid.expectCell(3, 0, '');
    expect(await grid.lastKeydownWasPrevented('x')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 1, afterCut: 1 });
  });

  test('stops the keyboard copy when Ctrl/Cmd+C is removed', async({ page }) => {
    const sentinel = `sentinel-${randomUUID()}`;

    await grid.writeClipboardText(sentinel);
    await grid.removeShortcut('C');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+c');

    expect(await grid.clipboardText()).toBe(sentinel);
    expect(await grid.hookCalls()).toMatchObject({ beforeCopy: 0, afterCopy: 0 });

    await grid.addShortcut('C', false);
    await page.keyboard.press('ControlOrMeta+c');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    expect(await grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });
  });

  test('stops the keyboard cut when Ctrl/Cmd+X is removed', async({ page }) => {
    const sentinel = `sentinel-${randomUUID()}`;

    await grid.writeClipboardText(sentinel);
    await grid.removeShortcut('X');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+x');

    expect(await grid.clipboardText()).toBe(sentinel);
    await grid.expectCell(1, 1, 'B2');
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 0, afterCut: 0 });

    await grid.addShortcut('X', false);
    await page.keyboard.press('ControlOrMeta+x');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    await grid.expectCell(1, 1, '');
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 1, afterCut: 1 });
  });

  test('stops the keyboard paste when Ctrl/Cmd+V is removed', async({ page }) => {
    const pasted = `pasted-${randomUUID()}`;

    await grid.writeClipboardText(pasted);
    await grid.removeShortcut('V');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(1, 1, 'B2');
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 0, afterPaste: 0 });

    await grid.addShortcut('V', false);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(1, 1, pasted);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 1, afterPaste: 1 });
  });

  test('keeps the other two shortcuts working when one is removed', async({ page }) => {
    await grid.removeShortcut('C');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+x');

    await expect.poll(() => grid.clipboardText()).toBe('B2');
    await grid.expectCell(1, 1, '');

    await grid.selectCell(2, 2);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(2, 2, 'B2');
  });

  test('does not stop Ctrl+Shift+V, which is a different shortcut', async({ page }) => {
    await grid.removeShortcut('V');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+Shift+v');

    expect(await grid.lastKeydownWasPrevented('V')).toBe(false);
  });

  test('keeps the context menu and the API working after the shortcuts are removed', async({ page }) => {
    const copied = `copied-${randomUUID()}`;
    const pasted = `pasted-${randomUUID()}`;

    await grid.editCell(1, 1, copied);
    for (const key of ['C', 'X', 'V'] as const) {
      await grid.removeShortcut(key);
    }

    await grid.openContextMenu(1, 1);
    await grid.clickContextMenuItem('Copy');
    await expect.poll(() => grid.clipboardText()).toBe(copied);
    expect(await grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

    await grid.openContextMenu(1, 1);
    await grid.clickContextMenuItem('Cut');
    await grid.expectCell(1, 1, '');
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 1, afterCut: 1 });

    await grid.selectCell(2, 2);
    await grid.pasteThroughApi(pasted);
    await grid.expectCell(2, 2, pasted);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 1, afterPaste: 1 });

    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(2, 2, pasted);
  });

  test('leaves the native copy, cut and paste alone in an open editor', async({ page }) => {
    const typed = `typed-${randomUUID()}`;

    for (const key of ['C', 'X', 'V'] as const) {
      await grid.removeShortcut(key);
    }

    await grid.cell(1, 1).dblclick();

    const editor = page.locator('.handsontableInput');

    await expect(editor).toBeVisible();
    await editor.fill(typed);
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+x');
    await expect(editor).toHaveValue('');
    await expect.poll(() => grid.clipboardText()).toBe(typed);

    await page.keyboard.press('ControlOrMeta+v');
    await expect(editor).toHaveValue(typed);
  });
});

test.describe('removing the clipboard shortcuts on macOS', () => {
  let grid: ClipboardShortcutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
    });
    grid = new ClipboardShortcutsPage(page, theme, bundle);
    await grid.goto();
    await grid.trackClipboard();
  });

  /**
   * Chromium on Linux runs no native copy for Cmd+C, so the verdict the grid leaves on the `keydown`
   * is what is observable here: the shortcut leaves it alone while it is registered, and cancels it
   * once it is removed.
   */
  test('treats Cmd+C, X and V as the clipboard shortcuts and Ctrl+C as nothing', async({ page }) => {
    await grid.selectCell(1, 1);

    for (const key of ['c', 'x', 'v']) {
      await page.keyboard.press(`Meta+${key}`);
      expect(await grid.lastKeydownWasPrevented(key)).toBe(false);
    }

    for (const key of ['C', 'X', 'V'] as const) {
      await grid.removeShortcut(key);
    }

    for (const key of ['c', 'x', 'v']) {
      await page.keyboard.press(`Meta+${key}`);
      expect(await grid.lastKeydownWasPrevented(key)).toBe(true);

      await page.keyboard.press(`Control+${key}`);
      expect(await grid.lastKeydownWasPrevented(key)).toBe(false);
    }
  });
});
