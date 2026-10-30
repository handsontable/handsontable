import { randomUUID } from 'node:crypto';
import { test, expect, CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG } from '../fixtures/test';
import { ClipboardShortcutsPage } from '../fixtures/pages/ClipboardShortcutsPage';

/**
 * Ctrl/Cmd+C, X and V are default grid shortcuts, so removing one through the shortcut manager has to
 * stop the keyboard action. The context menu items and the `copyPaste` API do not go through the
 * keyboard and keep working.
 *
 * The fix relies on the browser skipping its native copy, cut, or paste once the `keydown` is cancelled,
 * which is engine behavior, so the real key presses run on Firefox and WebKit as well. The clipboard is
 * never read through `navigator.clipboard`, which Playwright does not let Firefox or WebKit use: a copy
 * is proven by pasting it into another cell. Every case copies or pastes a value of its own, because the
 * browser clipboard outlives a test: a copy that silently did nothing would otherwise paste a leftover.
 * A negative assertion ("nothing was copied") ends with the same keystroke working once the shortcut is
 * back, so it cannot pass on a keystroke that never reached the grid.
 *
 * WebKit on Linux runs no native clipboard action for a real Ctrl+C, X or V, so the cases that need one
 * carry `CLIPBOARD_SHORTCUT_TAG` and WebKit leaves them out. The cases that read only the verdict the
 * grid leaves on the `keydown` run on every engine.
 */
const unique = (label: string) => `${label}-${randomUUID().slice(0, 8)}`;

test.describe('removing the clipboard shortcuts', { tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }, () => {
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

    const copied = unique('copied');
    const cut = unique('cut');

    await grid.setData(1, 1, copied);
    await grid.setData(3, 0, cut);

    await grid.copyCellWithKeyboard(1, 1);
    expect(await grid.lastKeydownWasPrevented('c')).toBe(false);
    await expect.poll(() => grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

    await grid.selectCell(2, 2);
    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(2, 2, copied);
    expect(await grid.lastKeydownWasPrevented('v')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 1, afterPaste: 1 });

    await grid.selectCell(3, 0);
    await page.keyboard.press('ControlOrMeta+x');
    await grid.expectCell(3, 0, '');
    expect(await grid.lastKeydownWasPrevented('x')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 1, afterCut: 1 });

    await grid.selectCell(4, 1);
    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(4, 1, cut);
  });

  test('stops the keyboard copy when Ctrl/Cmd+C is removed', async({ page }) => {
    const kept = unique('kept');
    const blocked = unique('blocked');

    await grid.setData(0, 0, kept);
    await grid.setData(1, 1, blocked);
    await grid.copyCellWithKeyboard(0, 0);
    await expect.poll(() => grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

    await grid.removeShortcut('C');
    await grid.copyCellWithKeyboard(1, 1);

    expect(await grid.lastKeydownWasPrevented('c')).toBe(true);
    expect(await grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

    await grid.selectCell(2, 2);
    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(2, 2, kept);

    await grid.addShortcut('C', false);
    await grid.copyCellWithKeyboard(1, 1);
    await expect.poll(() => grid.hookCalls()).toMatchObject({ beforeCopy: 2, afterCopy: 2 });

    await grid.selectCell(3, 2);
    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(3, 2, blocked);
  });

  test('stops the keyboard cut when Ctrl/Cmd+X is removed', async({ page }) => {
    const kept = unique('kept');
    const blocked = unique('blocked');

    await grid.setData(0, 0, kept);
    await grid.setData(1, 1, blocked);
    await grid.copyCellWithKeyboard(0, 0);

    await grid.removeShortcut('X');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+x');

    expect(await grid.lastKeydownWasPrevented('x')).toBe(true);
    await grid.expectCell(1, 1, blocked);
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 0, afterCut: 0 });

    await grid.selectCell(2, 2);
    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(2, 2, kept);

    await grid.addShortcut('X', false);
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+x');

    await grid.expectCell(1, 1, '');
    expect(await grid.hookCalls()).toMatchObject({ beforeCut: 1, afterCut: 1 });

    await grid.selectCell(3, 2);
    await page.keyboard.press('ControlOrMeta+v');
    await grid.expectCell(3, 2, blocked);
  });

  test('stops the keyboard paste when Ctrl/Cmd+V is removed', async({ page }) => {
    const pasted = unique('pasted');

    await grid.setData(0, 0, pasted);
    await grid.copyCellWithKeyboard(0, 0);

    await grid.removeShortcut('V');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+v');

    expect(await grid.lastKeydownWasPrevented('v')).toBe(true);
    await grid.expectCell(1, 1, 'B2');
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 0, afterPaste: 0 });

    await grid.addShortcut('V', false);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(1, 1, pasted);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 1, afterPaste: 1 });
  });

  test('keeps the other two shortcuts working when one is removed', async({ page }) => {
    const cut = unique('cut');

    await grid.setData(1, 1, cut);
    await grid.removeShortcut('C');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+x');

    await grid.expectCell(1, 1, '');

    await grid.selectCell(2, 2);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(2, 2, cut);
  });

  test('keeps a removal in force after updateSettings() re-enables the copyPaste plugin', async({ page }) => {
    const kept = unique('kept');

    await grid.setData(0, 0, kept);
    await grid.copyCellWithKeyboard(0, 0);

    await grid.removeShortcut('V');
    await grid.updateSettings({ copyPaste: { rowsLimit: 1000 } });
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+v');

    expect(await grid.lastKeydownWasPrevented('v')).toBe(true);
    await grid.expectCell(1, 1, 'B2');
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 0, afterPaste: 0 });

    await grid.addShortcut('V', false);
    await page.keyboard.press('ControlOrMeta+v');

    await grid.expectCell(1, 1, kept);
  });

  test('stops the keyboard copy while the empty data state overlay holds the keyboard', async({ page }) => {
    const kept = unique('kept');
    const blocked = unique('blocked');

    await grid.setData(0, 0, kept);
    await grid.setData(1, 1, blocked);
    await grid.copyCellWithKeyboard(0, 0);
    await expect.poll(() => grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

    await grid.removeShortcut('C');
    await grid.coverGridWithEmptyDataState(1, 1);
    expect(await grid.activeShortcutContext()).toBe('plugin:emptyDataState');

    await page.keyboard.press('ControlOrMeta+c');

    expect(await grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });
    expect(await grid.lastKeydownWasPrevented('c')).toBe(true);

    await grid.addShortcut('C', false);
    await page.keyboard.press('ControlOrMeta+c');

    await expect.poll(() => grid.hookCalls()).toMatchObject({ beforeCopy: 2, afterCopy: 2 });
  });

  test('leaves the native paste alone in an input of the application that is focused from code', async({ page }) => {
    const pasted = unique('pasted');

    await grid.setData(0, 0, pasted);
    await grid.copyCellWithKeyboard(0, 0);
    await grid.removeShortcut('V');

    const input = await grid.focusInputOutsideGrid();

    await page.keyboard.press('ControlOrMeta+v');

    await expect(input).toHaveValue(pasted);
    expect(await grid.lastKeydownWasPrevented('v')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 0, afterPaste: 0 });
  });

  test('keeps the context menu and the API working after the shortcuts are removed', async({ page }) => {
    const copied = unique('copied');
    const pasted = unique('pasted');

    await grid.editCell(1, 1, copied);
    for (const key of ['C', 'X', 'V'] as const) {
      await grid.removeShortcut(key);
    }

    await grid.openContextMenu(1, 1);
    await grid.clickContextMenuItem('Copy');
    await expect.poll(() => grid.hookCalls()).toMatchObject({ beforeCopy: 1, afterCopy: 1 });

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
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 1, afterPaste: 1 });
  });

  test('leaves the native copy, cut and paste alone in an open editor', async({ page }) => {
    const typed = unique('typed');

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

    await page.keyboard.press('ControlOrMeta+v');
    await expect(editor).toHaveValue(typed);
  });

  test('leaves the native paste alone in an editor that keeps the grid shortcuts active', async({ page }) => {
    const pasted = unique('pasted');

    await grid.setData(0, 0, pasted);
    await grid.copyCellWithKeyboard(0, 0);
    await grid.removeShortcut('V');

    const input = await grid.useInputEditor(1, 1);

    await grid.selectCell(1, 1);
    await page.keyboard.press('Enter');
    await expect(input).toBeFocused();
    expect(await grid.activeShortcutContext()).toBe('grid');

    await page.keyboard.press('ControlOrMeta+v');

    await expect(input).toHaveValue(pasted);
    expect(await grid.lastKeydownWasPrevented('v')).toBe(false);
    expect(await grid.hookCalls()).toMatchObject({ beforePaste: 0, afterPaste: 0 });
  });
});

test.describe('the keydown verdict of the removed clipboard shortcuts', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: ClipboardShortcutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ClipboardShortcutsPage(page, theme, bundle);
    await grid.goto();
    await grid.trackClipboard();
  });

  test('does not stop Ctrl+Shift+V, which is a different shortcut', async({ page }) => {
    await grid.removeShortcut('V');
    await grid.selectCell(1, 1);
    await page.keyboard.press('ControlOrMeta+Shift+v');

    expect(await grid.lastKeydownWasPrevented('V')).toBe(false);

    await page.keyboard.press('ControlOrMeta+v');

    expect(await grid.lastKeydownWasPrevented('v')).toBe(true);
  });
});

test.describe('removing the clipboard shortcuts on macOS', { tag: CROSS_BROWSER_TAG }, () => {
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
   * The verdict the grid leaves on the `keydown` is what is observable here: the shortcut leaves it
   * alone while it is registered, and cancels it once it is removed.
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
