import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import {
  ListEditorInputPage,
  MULTI_LINE_TEXT,
  type ListCellType,
} from '../fixtures/pages/ListEditorInputPage';

const CELL_TYPES: ListCellType[] = ['autocomplete', 'dropdown', 'handsontable'];

/**
 * The autocomplete, dropdown, and handsontable cell editors edit in a single-line
 * `<input type="text">`, because ARIA in HTML allows `role="combobox"` on an input and not on a
 * textarea. These cases pin what the swap must keep: the field's own attributes and place, its box over
 * the cell, typing into a selected cell, a confirm that leaves a multi-line value alone, and the Enter
 * chords. The box is the theme's to decide, so the spec runs on every theme; the keys are an engine's to
 * get wrong, so it runs on Firefox and WebKit too.
 */
for (const cellType of CELL_TYPES) {
  test.describe(`list editor input (${cellType})`, { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
    let grid: ListEditorInputPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new ListEditorInputPage(page, theme, bundle, cellType);
      await grid.goto();
    });

    test('edits in a text input inside the editor holder', async({ page }) => {
      await grid.build();
      await grid.selectCell(0, 0);
      await page.keyboard.press('Enter');
      await grid.expectEditorOpened();

      expect(await grid.editorFieldState()).toEqual({
        tagName: 'input',
        type: 'text',
        hotInput: true,
        tabIndex: '-1',
        inHolder: true,
        value: 'Al',
      });
      await expect(grid.editorField).toHaveCount(1);
    });

    test('covers the edited cell', async({ page }) => {
      await grid.build();
      await grid.selectCell(0, 0);
      await page.keyboard.press('Enter');
      await grid.expectEditorOpened();

      const { field, cell } = await grid.editorAndCellBoxes(0, 0);

      expect(Math.abs(field.left - cell.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(field.top - cell.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(field.width - cell.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(field.height - cell.height)).toBeLessThanOrEqual(1);
    });

    test('grows past a narrow cell no wider than the text editor does', async({ page }) => {
      await grid.build();

      // The text editor's box on the narrow text column, which holds the same value.
      await grid.selectCell(2, 3);
      await page.keyboard.press('Enter');
      await grid.expectEditorOpened();

      const text = await grid.editorAndCellBoxes(2, 3);

      await page.keyboard.press('Escape');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      await grid.selectCell(2, 2);
      await page.keyboard.press('Enter');
      await grid.expectEditorOpened();

      const list = await grid.editorAndCellBoxes(2, 2);

      // The precondition: the value is wider than the cell, so the text editor did grow.
      expect(text.field.width).toBeGreaterThan(text.cell.width + 1);
      expect(Math.abs(list.field.width - text.field.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(list.field.left - list.cell.left)).toBeLessThanOrEqual(1);
    });

    for (const imeFastEdit of [false, true]) {
      test(`opens holding a typed character (imeFastEdit: ${imeFastEdit})`, async({ page }) => {
        await grid.build({ imeFastEdit });
        await grid.selectCell(0, 0);

        if (imeFastEdit) {
          // The grid moves the focus to the closed editor's field a task after the selection, so the
          // key below lands in the field itself.
          await expect(page.locator('.handsontableInput:focus')).toHaveCount(1);
        }

        await page.keyboard.press('A');
        await grid.expectEditorOpened();

        expect((await grid.editorFieldState()).value).toBe('A');
      });
    }

    test('confirms a multi-line value it did not change without writing', async({ page }) => {
      await grid.build();
      await grid.selectCell(1, 0);
      await page.keyboard.press('Enter');
      await grid.expectEditorOpened();
      await page.keyboard.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      expect(await grid.sourceDataAtCell(1, 0)).toBe(MULTI_LINE_TEXT);
      expect(await grid.isUndoAvailable()).toBe(false);
    });

    if (cellType === 'handsontable') {
      // The rule above covers a value the input could not hold whole, and nothing more: an untouched
      // single-line value still goes through `trimWhitespace`, as it did in the textarea. (The autocomplete
      // and dropdown editors already keep any untouched text, for their key/value labels.)
      test('still trims an untouched single-line value on confirm', async({ page }) => {
        await grid.build({ data: [['  Alpha  ', null, null, null]] });
        await grid.selectCell(0, 0);
        await page.keyboard.press('Enter');
        await grid.expectEditorOpened();
        await page.keyboard.press('Enter');
        await expect.poll(() => grid.isEditorOpened()).toBe(false);

        expect(await grid.sourceDataAtCell(0, 0)).toBe('Alpha');
      });
    }

    test('keeps its value and stays open on Alt+Enter', async({ page }) => {
      await grid.build();
      await grid.selectCell(0, 0);
      await page.keyboard.press('Enter');
      await grid.expectEditorOpened();
      await page.keyboard.press('Alt+Enter');

      expect(await grid.isEditorOpened()).toBe(true);
      expect((await grid.editorFieldState()).value).toBe('Al');
    });

    test('fills a multi-cell selection on Ctrl/Cmd+Enter', async({ page }) => {
      await grid.build();
      await grid.selectCell(0, 0, 1, 0);
      await page.keyboard.type('Alto');
      await grid.expectEditorOpened();
      await expect.poll(async() => (await grid.editorFieldState()).value).toBe('Alto');
      await page.keyboard.press('ControlOrMeta+Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      expect([await grid.sourceDataAtCell(0, 0), await grid.sourceDataAtCell(1, 0)]).toEqual(['Alto', 'Alto']);
    });
  });
}
