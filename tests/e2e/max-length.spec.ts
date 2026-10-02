import { test, expect } from '../fixtures/test';
import { MaxLengthPage } from '../fixtures/pages/MaxLengthPage';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * The `maxLength` cell option: a limit on the length of a cell's text, counted in Unicode code points
 * (an emoji is one character). Two parts of the grid enforce it, and the specs below separate them:
 *
 * - the plain text editor stops the user from typing or pasting past the limit, and
 * - the cell validator marks (or, with `allowInvalid: false`, rejects) a value that is too long, which
 *   is how a value reaches the cell through `setDataAtCell()`, a paste into the grid, or old data.
 *
 * Not covered here: an IME composition. The cap deliberately waits for `compositionend`, but Playwright
 * cannot drive a real composition (`insertText` bypasses it), and a synthetic `compositionstart` event
 * would only restate the implementation, so that path has no E2E case.
 */
test.describe('maxLength', () => {
  let grid: MaxLengthPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MaxLengthPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('typing in the text editor', () => {
    test('stops at the limit', async () => {
      await grid.initGrid({ maxLength: 3 });
      await grid.openEditor(0, 0);

      await grid.type('abcdef');

      await expect(grid.editor).toHaveValue('abc');

      await grid.commit();

      expect(await grid.dataAt(0, 0)).toBe('abc');
      await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    });

    test('does not cap the text when `maxLength` is not set', async () => {
      await grid.initGrid();
      await grid.openEditor(0, 0);

      await grid.type('abcdefghijklmnopqrstuvwxyz');

      await expect(grid.editor).toHaveValue('abcdefghijklmnopqrstuvwxyz');
    });

    test('counts an emoji as one character', async () => {
      await grid.initGrid({ maxLength: 3 });
      await grid.openEditor(0, 0);

      await grid.typeEmoji('😀', '😁', '😂', '🤣');

      // Four emoji were typed, three fit. The fourth is dropped whole, not split in the middle.
      await expect(grid.editor).toHaveValue('😀😁😂');

      await grid.commit();

      expect(await grid.dataAt(0, 0)).toBe('😀😁😂');
      await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    });

    test('ignores typing in the middle of a full cell and keeps the caret where it was', async ({ page }) => {
      await grid.initGrid({ maxLength: 3, data: [['abc', '', '', '']] });
      await grid.openEditor(0, 0);
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      expect(await grid.caret()).toEqual({ start: 1, end: 1 });

      await grid.type('X');

      await expect(grid.editor).toHaveValue('abc');
      expect(await grid.caret()).toEqual({ start: 1, end: 1 });
    });
  });

  test.describe('typing into a value that is already too long', () => {
    test('rejects the typed text and leaves the existing text and the caret alone', async ({ page }) => {
      await grid.initGrid({ maxLength: 3, data: [['abcdef', '', '', '']] });
      await grid.openEditor(0, 0);
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowRight');
      expect(await grid.caret()).toEqual({ start: 1, end: 1 });

      await grid.type('X');

      // Only the inserted character may be removed. The old cap removed the whole excess (4), which
      // ate 'a', 'b' and 'c' as well.
      await expect(grid.editor).toHaveValue('abcdef');
      expect(await grid.caret()).toEqual({ start: 1, end: 1 });
    });

    test('lets a replacement delete the selection but never adds to the value', async () => {
      await grid.initGrid({ maxLength: 3, data: [['abcdef', '', '', '']] });
      await grid.openEditor(0, 0);
      await grid.selectInEditor(1, 3);

      await grid.type('X');

      // The browser replaces 'bc' with 'X' ('aXdef', 5 characters). The value was 6 long and the
      // limit is 3, so the one inserted character is over the limit and is removed again: the
      // selection is deleted and nothing else changes. 'a', 'd', 'e' and 'f' stay.
      await expect(grid.editor).toHaveValue('adef');
      expect(await grid.caret()).toEqual({ start: 1, end: 1 });
    });
  });

  test.describe('pasting into the text editor', () => {
    test('cuts a text that is too long at the limit', async () => {
      await grid.initGrid({ maxLength: 3 });
      await grid.openEditor(0, 0);

      await grid.pasteText('abcdefgh');

      await expect(grid.editor).toHaveValue('abc');
      expect(await grid.caret()).toEqual({ start: 3, end: 3 });
    });

    test('keeps what was already in the cell and fills only the room that is left', async () => {
      await grid.initGrid({ maxLength: 4, data: [['ab', '', '', '']] });
      await grid.openEditor(0, 0);

      await grid.pasteText('XYZW');

      await expect(grid.editor).toHaveValue('abXY');
    });

    test('cuts the excess of a paste in the middle, keeping the text on both sides', async () => {
      await grid.initGrid({ maxLength: 4, data: [['abc', '', '', '']] });
      await grid.openEditor(0, 0);
      await grid.page.keyboard.press('ArrowLeft');
      await grid.page.keyboard.press('ArrowLeft');

      // "a|bc" plus 3 pasted characters overflows by 2. The excess leaves from the end of the pasted text.
      await grid.pasteText('XYZ');

      await expect(grid.editor).toHaveValue('aXbc');
      expect(await grid.caret()).toEqual({ start: 2, end: 2 });
    });
  });

  test.describe('a value that is already too long', () => {
    test('is not truncated when the editor opens, and deleting shortens it down to the limit', async ({ page }) => {
      await grid.initGrid({ maxLength: 3, data: [['abcdef', '', '', '']] });
      await grid.openEditor(0, 0);

      await expect(grid.editor).toHaveValue('abcdef');

      await page.keyboard.press('Backspace');

      // Deleting is never capped: it is how the user gets under the limit.
      await expect(grid.editor).toHaveValue('abcde');

      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');

      await expect(grid.editor).toHaveValue('abc');

      await grid.commit();

      expect(await grid.dataAt(0, 0)).toBe('abc');
      await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    });

    test('is kept and marked invalid when the user commits it while it is still too long', async ({ page }) => {
      await grid.initGrid({ maxLength: 3, data: [['abcdef', '', '', '']] });
      await grid.openEditor(0, 0);
      await page.keyboard.press('Backspace');

      await grid.commit();

      expect(await grid.dataAt(0, 0)).toBe('abcde');
      await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);
    });
  });

  test.describe('validation of a value that did not come through the editor', () => {
    test('marks a value that is too long as invalid and keeps it, with `allowInvalid: true`', async () => {
      await grid.initGrid({ maxLength: 3, allowInvalid: true });

      await grid.setDataAtCell(0, 0, 'toolong');

      await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);
      expect(await grid.dataAt(0, 0)).toBe('toolong');

      await grid.setDataAtCell(0, 0, 'ok');

      await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    });

    test('marks a value pasted into the grid as invalid and keeps it, with `allowInvalid: true`', async () => {
      await grid.initGrid({ maxLength: 3, allowInvalid: true });
      await grid.selectCell(0, 0);

      await grid.pasteText('toolong');

      await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);
      expect(await grid.dataAt(0, 0)).toBe('toolong');
    });

    test('rejects a value pasted into the grid, with `allowInvalid: false`', async () => {
      await grid.initGrid({ maxLength: 3, allowInvalid: false, data: [['abc', '', '', '']] });

      // The second paste fits, so it shows that pasting works at all and that the first one was
      // turned down by the limit.
      await grid.selectCell(0, 0);
      await grid.pasteText('toolong');
      await grid.selectCell(0, 1);
      await grid.pasteText('ok');

      await expect.poll(() => grid.dataAt(0, 1)).toBe('ok');
      expect(await grid.dataAt(0, 0)).toBe('abc');
      await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    });
  });

  test.describe('cascading configuration', () => {
    test('limits each column by its own `maxLength`', async () => {
      await grid.initGrid({ maxLength: 8, columns: [{ maxLength: 3 }, { maxLength: 5 }, {}] });

      await grid.openEditor(0, 0);
      await grid.type('abcdefghij');
      await expect(grid.editor).toHaveValue('abc');
      await grid.commit();

      await grid.openEditor(0, 1);
      await grid.type('abcdefghij');
      await expect(grid.editor).toHaveValue('abcde');
      await grid.commit();

      // The column without its own limit falls back to the grid-level one.
      await grid.openEditor(0, 2);
      await grid.type('abcdefghij');
      await expect(grid.editor).toHaveValue('abcdefgh');
    });

    test('lets a cell override the limit of its column', async () => {
      await grid.initGrid({ columns: [{ maxLength: 5 }, { maxLength: 5 }], cell: [{ row: 1, col: 0, maxLength: 2 }] });

      await grid.openEditor(1, 0);
      await grid.type('abcdef');
      await expect(grid.editor).toHaveValue('ab');
      await grid.commit();

      await grid.openEditor(0, 0);
      await grid.type('abcdef');
      await expect(grid.editor).toHaveValue('abcde');
    });
  });

  test.describe('together with a custom validator', () => {
    test('requires the value to pass both, and does not call the custom validator for a value that is too long', async () => {
      await grid.useRecordingValidator({ maxLength: 3 });

      await grid.setDataAtCell(0, 0, 'toolong');
      await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);

      // The custom validator would have accepted it: only the limit can have turned it down.
      expect(await grid.validatorCalls()).toEqual([]);

      await grid.setDataAtCell(0, 1, 'ok');
      await expect(grid.cell(0, 1)).not.toHaveClass(/htInvalid/);

      expect(await grid.validatorCalls()).toEqual(['ok']);
    });
  });

  test.describe('editors other than the plain text editor', () => {
    test('does not cap what is typed into a numeric or a password editor', async ({ page }) => {
      await grid.initGrid({ columns: [{ type: 'numeric', maxLength: 3 }, { type: 'password', maxLength: 3 }] });

      await grid.openEditor(0, 0);
      await grid.type('12345');
      await expect(grid.editor).toHaveValue('12345');
      await page.keyboard.press('Escape');
      await expect(grid.editor).toBeHidden();

      await grid.openEditor(0, 1);
      await grid.type('abcdef');
      await expect(grid.editor).toHaveValue('abcdef');
      await grid.commit();

      // Not capped while typing, but the limit still applies to the committed value.
      expect(await grid.dataAt(0, 1)).toBe('abcdef');
      await expect(grid.cell(0, 1)).toHaveClass(/htInvalid/);
    });

    test('does not flag over-limit digits committed from a numeric column, because they are stored as a number', async () => {
      await grid.initGrid({ columns: [{ type: 'numeric', maxLength: 3 }] });

      await grid.openEditor(0, 0);
      await grid.type('12345');
      await expect(grid.editor).toHaveValue('12345');
      await grid.commit();

      // The numeric editor hands the grid a number, and `maxLength` measures strings only, so a
      // number is always valid. The positive control is the password column above, whose string is flagged.
      expect(await grid.dataAt(0, 0)).toBe(12345);
      await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    });
  });
});
