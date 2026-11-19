import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { EditorListA11yPage, type ListEditorCellType } from '../fixtures/pages/EditorListA11yPage';

const CELL_TYPES: ListEditorCellType[] = ['autocomplete', 'dropdown'];

/**
 * The autocomplete and dropdown editors follow the APG combobox pattern: the field is a `combobox` and
 * the list a named `listbox` of `option`s. The list is a nested Handsontable grid, so the table markup
 * between the two must stay out of the accessibility tree, and the field's references must name
 * elements that exist: `aria-controls` the list only while it is shown, `aria-activedescendant` the
 * highlighted option. The theme decides how many rows the list draws, so the spec runs on every theme;
 * the keys and focus are an engine's to get wrong, so it runs on Firefox and WebKit too.
 */
for (const cellType of CELL_TYPES) {
  test.describe(`list editor structure and references (${cellType})`, { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
    let grid: EditorListA11yPage;

    test.beforeEach(({ page, theme, bundle }) => {
      grid = new EditorListA11yPage(page, theme, bundle, cellType);
    });

    test('names the list after the edited cell and exposes only options in it', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);

      const listbox = grid.listbox('A, row 1');

      await expect(grid.combobox('A, row 1')).toBeFocused();
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole('option')).toHaveText(['Alpha', 'Alfa', 'Alto']);
      await expect(listbox.locator('[role="row"], [role="rowgroup"], table:not([role="presentation"])'))
        .toHaveCount(0);
    });

    test('keeps the table markup hidden after typing reloads the list', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);

      const listbox = grid.listbox('A, row 1');

      await expect(listbox.getByRole('option')).toHaveCount(3);
      await grid.page.keyboard.type('p');

      if (cellType === 'autocomplete') {
        // `autocomplete` narrows the list to the typed `Alp`.
        await expect(listbox.getByRole('option')).toHaveText(['Alpha']);
      } else {
        // `dropdown` keeps every choice and, being strict, highlights the one the text completes to.
        await expect.poll(() => grid.referencedElements())
          .toMatchObject({ activeDescendant: { role: 'option', text: 'Alpha' } });
      }

      await expect(listbox.locator('[role="row"], [role="rowgroup"], table:not([role="presentation"])'))
        .toHaveCount(0);
    });

    test('names the list only while it is shown', async() => {
      await grid.goto();
      await grid.selectCell(0, 0);

      const field = grid.field('A, row 1');

      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(field).not.toHaveAttribute('aria-controls');
      await expect(field).not.toHaveAttribute('aria-activedescendant');

      await grid.page.keyboard.press('Enter');
      await expect.poll(() => grid.isEditorOpened()).toBe(true);
      await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      expect((await grid.referencedElements()).controls).toEqual({ role: 'listbox', isListRoot: true });

      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: { text: 'Alpha' } });

      await grid.cancelEditor();

      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(field).not.toHaveAttribute('aria-controls');
      await expect(field).not.toHaveAttribute('aria-activedescendant');
    });

    test('points the field at the highlighted option', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);
      await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
      await grid.page.keyboard.press('ArrowDown');

      await expect.poll(() => grid.referencedElements()).toEqual({
        controls: { role: 'listbox', isListRoot: true },
        activeDescendant: { role: 'option', selected: 'true', text: 'Alpha', inList: true },
      });
    });

    test('points the field at an option the list scrolled to', async() => {
      await grid.goto({ longSource: true });
      await grid.openEditorAt(0, 0);

      const listbox = grid.listbox('A, row 1');

      await expect(listbox.getByRole('option').first()).toHaveText('Al 001');
      // Precondition: the 30th entry is not rendered when the list opens, so the scroll draws it.
      await expect(listbox.getByRole('option', { name: 'Al 030', exact: true })).toHaveCount(0);

      for (let i = 0; i < 30; i++) {
        await grid.page.keyboard.press('ArrowDown');
      }

      await expect.poll(() => grid.referencedElements()).toEqual({
        controls: { role: 'listbox', isListRoot: true },
        activeDescendant: { role: 'option', selected: 'true', text: 'Al 030', inList: true },
      });
      await expect(listbox.locator('[role="row"], [role="rowgroup"], table:not([role="presentation"])'))
        .toHaveCount(0);
    });

    test('renames the list for the next edited cell', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);
      await expect(grid.listbox('A, row 1')).toBeVisible();
      await grid.commitEditor();

      await grid.openEditorAt(1, 1);

      await expect(grid.combobox('B, row 2')).toBeFocused();
      await expect(grid.listbox('B, row 2')).toBeVisible();
      expect((await grid.referencedElements()).controls).toEqual({ role: 'listbox', isListRoot: true });
    });

    test('writes no role with ariaTags: false', async() => {
      await grid.goto({ ariaTags: false });
      await grid.openEditorAt(0, 0);
      await expect.poll(() => grid.listCellCount()).toBe(3);

      const roles = await grid.listRoles();

      expect(roles.input).toBeNull();
      expect(roles.listRoot).toBeNull();
      expect(roles.cells.every(role => role === null)).toBe(true);
      await expect(grid.editorInput).not.toHaveAttribute('aria-controls');
    });
  });
}
