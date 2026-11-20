import { test, expect } from '../fixtures/test';
import { EditorCloseFocusPage } from '../fixtures/pages/EditorCloseFocusPage';

/**
 * Closing an editor with Escape changes no selection, and the browser focus returns to a cell only
 * after a selection change. The focus therefore stayed on the closed editor's hidden input, and a
 * screen reader, which reads what takes the focus, said nothing: NVDA announced "edit, multi line,
 * Alice" on Enter and was silent on Escape.
 *
 * Each case drives the keyboard only and reads where the browser focus is afterwards.
 */
const EDITORS = [
  { type: 'text', col: 0 },
  { type: 'select', col: 1 },
  { type: 'date', col: 2 },
  { type: 'time', col: 3 },
  { type: 'multiselect', col: 4 },
] as const;

test.describe('Closing an editor hands the focus back to its cell', () => {
  for (const { type, col } of EDITORS) {
    test(`Escape on the ${type} editor focuses the edited cell`, async({ page, theme, bundle }) => {
      const grid = new EditorCloseFocusPage(page, theme, bundle);

      await grid.goto();
      await grid.selectCell('plain', 1, col);
      await grid.openEditor('plain');

      // The precondition the case rests on: while the editor is open the focus is NOT on the cell.
      expect((await grid.focus('plain', 1, col)).isCell).toBe(false);

      await grid.closeWithEscape('plain');

      await expect.poll(() => grid.focus('plain', 1, col)).toMatchObject({ isCell: true, inHiddenEditor: false });
      expect(await grid.selection('plain')).toEqual([1, col]);
    });
  }

  test('Escape moves the focus to the edited cell once, with no stop on another cell', async({ page, theme, bundle }) => {
    const grid = new EditorCloseFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('plain', 1, 0);
    await grid.openEditor('plain');
    await grid.startFocusLog('plain');
    await grid.closeWithEscape('plain');

    await expect.poll(() => grid.focusLog()).toEqual([[1, 0]]);
  });

  test('Enter with enterMoves of zero commits without moving the selection and keeps the focus on the edited cell', async({ page, theme, bundle }) => {
    const grid = new EditorCloseFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.keepSelectionOnEnter('plain');
    await grid.selectCell('plain', 1, 0);
    await grid.openEditor('plain');
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Zed');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpen('plain')).toBe(false);
    await expect.poll(() => grid.dataAtCell('plain', 1, 0)).toBe('Zed');
    await expect.poll(() => grid.focus('plain', 1, 0)).toMatchObject({ isCell: true });
    expect(await grid.selection('plain')).toEqual([1, 0]);
  });

  // The multiselect editor holds the focus in a search input that is not the grid's own hidden field, so
  // hiding it dropped the focus to the document body: nothing was focused for a screen reader to read.
  test('Tab out of the multiselect editor focuses the next cell, with no stop on another element', async({ page, theme, bundle }) => {
    const grid = new EditorCloseFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('plain', 1, 4);
    await grid.openEditor('plain');
    await grid.startFocusLog('plain');
    await page.keyboard.press('Tab');

    await expect.poll(() => grid.isEditorOpen('plain')).toBe(false);
    await expect.poll(() => grid.focus('plain', 1, 5)).toMatchObject({ isCell: true });
    expect(await grid.focusLog()).toEqual([[1, 5]]);
  });

  test('Enter out of the multiselect editor focuses the next row, with no stop on another element', async({ page, theme, bundle }) => {
    const grid = new EditorCloseFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('plain', 1, 4);
    await grid.openEditor('plain');
    await grid.startFocusLog('plain');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpen('plain')).toBe(false);
    await expect.poll(() => grid.focus('plain', 2, 4)).toMatchObject({ isCell: true });
    expect(await grid.focusLog()).toEqual([[2, 4]]);
  });

  test('Enter, which commits and moves the selection down, focuses the next cell', async({ page, theme, bundle }) => {
    const grid = new EditorCloseFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('plain', 0, 0);
    await grid.openEditor('plain');
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Zed');
    await grid.startFocusLog('plain');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpen('plain')).toBe(false);
    await expect.poll(() => grid.dataAtCell('plain', 0, 0)).toBe('Zed');
    await expect.poll(() => grid.focus('plain', 1, 0)).toMatchObject({ isCell: true });
    expect(await grid.selection('plain')).toEqual([1, 0]);

    // One stop, on the next cell. A stop on the edited cell first would make a screen reader read it twice.
    expect(await grid.focusLog()).toEqual([[1, 0]]);
  });

  test('keeps the focus on the editor input in imeFastEdit mode, where that input holds it by design', async({ page, theme, bundle }) => {
    const grid = new EditorCloseFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.select('ime', 0, 0);

    // The positive control: the refocus ran, so the settle below can prove that it stayed.
    await expect.poll(() => grid.settledFocusTag()).toBe('textarea');

    await page.keyboard.press('Enter');
    await expect.poll(() => grid.isEditorOpen('ime')).toBe(true);
    await grid.closeWithEscape('ime');

    expect(await grid.settledFocusTag()).toBe('textarea');
  });
});
