import { test, expect, CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * Ctrl+Z and Ctrl+Shift+Z inside the open text editor are the textarea's own undo and redo, not the
 * grid's, and the editor resizes to what they leave behind. #10590 rewrote the editor's sizing
 * (`src/utils/autoResize.js`) and moved the Jasmine tests that checked the value and the height after
 * an undo or a redo to four visual specs, because a simulated key event cannot drive the browser's
 * undo stack (the Jasmine tests called `document.execCommand('undo')` and skipped Safari). Those specs
 * (`multi-frameworks/editors/textEditor/{undo,redo,undo-multiline-text,redo-multiline-text}`) took
 * nine captures on every js variant and copied them to the three wrappers, each after a fixed sleep
 * and with nothing asserted. They were the only check of either half until DEV-3351.
 *
 * Real key presses drive the real undo stack, so the states are asserted here instead: the value the
 * textarea holds after each press, that the editor stays open and the grid's own data and undo stack
 * stay as they were, and that the textarea fits its content after every step: as wide as it was for the
 * same text, and as tall (no inner scroll, the same height for the same number of lines whichever way it
 * got there). The third test types key by key, as the visual specs did, so the editor's keydown path
 * runs before the undo.
 *
 * Tagged `@cross-browser` and `@clipboard-shortcut`: Firefox runs it, and WebKit does not, because
 * Playwright's WebKit takes a shortcut's editing command from the macOS key map alone, so on the Linux
 * runner a real Ctrl+Z reaches the page and undoes nothing (the clipboard shortcuts' trap in
 * `tests/AGENTS.md`).
 */
test.describe('native undo and redo in the open text editor', { tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('undoes and redoes typed text inside the editor and leaves the grid\'s data and undo stack alone',
    async({ page }) => {
      // Give the grid's own undo stack a step first, so a Ctrl+Z that reached the grid would have
      // something to revert. Enter opens the editor with the caret after the value, so the text is
      // appended.
      const committed = `${await grid.dataAt(0, 1)}committed`;

      await grid.openEditor(0, 1);
      await page.keyboard.insertText('committed');
      await page.keyboard.press('Enter');

      expect(await grid.dataAt(0, 1)).toBe(committed);
      expect(await grid.gridUndoAvailable()).toBe(true);

      const original = await grid.dataAt(1, 1);

      await grid.openEditor(1, 1);

      const opened = await grid.editorState();

      expect(opened.value).toBe(original);

      // One input step, so one undo step whatever the engine coalesces typed characters into. Long
      // enough to widen the editor past the cell, which is the width it falls back to (#10590 sized it).
      const inserted = ' and a longer text that widens the editor';

      await page.keyboard.insertText(inserted);

      const typed = await grid.editorState();

      expect(typed).toMatchObject({ opened: true, value: `${original}${inserted}` });
      expect(typed.width).toBeGreaterThan(opened.width);
      expect(typed.scrollWidth).toBeLessThanOrEqual(typed.clientWidth + 1);

      await page.keyboard.press('ControlOrMeta+z');

      // Back to the opening value, and to the opening width: the editor narrows with its text.
      expect(await grid.editorState()).toMatchObject({ opened: true, value: original, width: opened.width });
      expect(await grid.dataAt(0, 1)).toBe(committed);
      expect(await grid.dataAt(1, 1)).toBe(original);

      await page.keyboard.press('ControlOrMeta+Shift+z');

      const redone = await grid.editorState();

      expect(redone).toMatchObject({ opened: true, value: `${original}${inserted}`, width: typed.width });
      expect(redone.scrollWidth).toBeLessThanOrEqual(redone.clientWidth + 1);
      expect(redone.scrollHeight).toBeLessThanOrEqual(redone.clientHeight + 1);
      expect(await grid.dataAt(0, 1)).toBe(committed);
    });

  test('undoes text typed key by key, as a user types it', async({ page }) => {
    const original = String(await grid.dataAt(1, 1));

    await grid.openEditor(1, 1);

    // Real key presses run the editor's keydown path for each character before the undo. How many
    // characters one undo step takes back is the engine's own choice, so only its direction is asserted.
    await page.keyboard.type('test');

    expect(await grid.editorState()).toMatchObject({ opened: true, value: `${original}test` });

    await page.keyboard.press('ControlOrMeta+z');

    const undone = (await grid.editorState()).value;

    expect(undone.length).toBeLessThan(`${original}test`.length);
    expect(`${original}test`.startsWith(undone)).toBe(true);
    expect(undone.startsWith(original)).toBe(true);

    // Undoing on reaches the opening value, one step a key at most, however the engine grouped them.
    // A handler that rewrites the value as the keys arrive leaves only the last key undoable.
    for (let press = 0; press < 3; press++) {
      // eslint-disable-next-line no-await-in-loop
      if ((await grid.editorState()).value === original) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      await page.keyboard.press('ControlOrMeta+z');
    }

    expect(await grid.editorState()).toMatchObject({ opened: true, value: original });
    expect(await grid.dataAt(1, 1)).toBe(original);
  });

  test('grows the editor a line for each line break and shrinks it back on undo, then grows it on redo',
    async({ page }) => {
      const original = String(await grid.dataAt(1, 1));

      await grid.openEditor(1, 1);

      // The height the editor takes for each line count, recorded on the way up.
      const heightForBreaks = [(await grid.editorState()).height];

      for (let breaks = 1; breaks <= 3; breaks++) {
        // eslint-disable-next-line no-await-in-loop
        await page.keyboard.press('ControlOrMeta+Enter');

        // eslint-disable-next-line no-await-in-loop
        const state = await grid.editorState();

        expect(state.value).toBe(`${original}${'\n'.repeat(breaks)}`);
        expect(state.height).toBeGreaterThan(heightForBreaks[breaks - 1]);
        expect(state.scrollHeight).toBeLessThanOrEqual(state.clientHeight + 1);
        heightForBreaks.push(state.height);
      }

      /**
       * Presses a key until the value holds a given number of line breaks, checking after every press
       * that the editor is open and as tall as it was for that many lines. The engine decides how many
       * line breaks one undo step takes back, so the count per press is not asserted.
       *
       * @param {string} key The chord.
       * @param {number} target The line-break count to stop at.
       */
      const pressUntil = async(key: string, target: number) => {
        for (let press = 0; press < 3; press++) {
          // eslint-disable-next-line no-await-in-loop
          await page.keyboard.press(key);

          // eslint-disable-next-line no-await-in-loop
          const state = await grid.editorState();
          const breaks = state.value.length - original.length;

          expect(state.opened).toBe(true);
          expect(state.value).toBe(`${original}${'\n'.repeat(breaks)}`);
          expect(state.height).toBe(heightForBreaks[breaks]);
          expect(state.scrollHeight).toBeLessThanOrEqual(state.clientHeight + 1);

          if (breaks === target) {
            return;
          }
        }

        throw new Error(`Three presses of ${key} did not bring the editor to ${target} line breaks.`);
      };

      await pressUntil('ControlOrMeta+z', 0);
      await pressUntil('ControlOrMeta+Shift+z', 3);

      expect(await grid.dataAt(1, 1)).toBe(original);
    });
});
