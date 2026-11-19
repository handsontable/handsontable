import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import {
  EditorListA11yPage, type EditorCellType, type ListEditorCellType,
} from '../fixtures/pages/EditorListA11yPage';

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

/**
 * Typing narrows the autocomplete list without moving the highlight, so `aria-activedescendant` gives a
 * screen reader nothing to read. The editor says how many choices are left, and the first of them,
 * through the polite live region: once per keystroke that changed the list, never for a list a
 * highlight already names, never with `ariaTags: false`, and never for a response that lands after the
 * editor closed. The announcer writes 100 ms after it is called, so the negative cases run the page on
 * a fake clock: a write the code scheduled is then certain to have run by the time the log is read.
 */
test.describe('narrowed list announcement', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('announces the choices left after each keystroke that narrows the list', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto();
    await grid.startAnnouncementLog();
    await page.clock.install();
    await grid.openEditorAt(0, 0);
    await page.clock.runFor(1000);

    const listbox = grid.listbox('A, row 1');

    await expect(listbox.getByRole('option')).toHaveCount(3);

    await page.keyboard.type('f');
    await page.clock.runFor(1000);
    await expect(listbox.getByRole('option')).toHaveText(['Alfa']);

    await page.keyboard.press('Backspace');
    await page.clock.runFor(1000);
    await expect(listbox.getByRole('option')).toHaveCount(3);

    await page.keyboard.type('p');
    await page.clock.runFor(1000);
    await expect(listbox.getByRole('option')).toHaveText(['Alpha']);

    // `Alph` keeps the list `Alp` left.
    await page.keyboard.type('h');
    await page.clock.runFor(1000);
    await expect.poll(() => grid.listQuery()).toBe('Alph');

    // Opening the editor announces nothing, each keystroke that changed the list announces once, and the
    // one that left it as it was announces nothing.
    expect(await grid.announcements()).toEqual([
      '1 choice available: Alfa',
      '3 choices available. First: Alpha',
      '1 choice available: Alpha',
    ]);
    await expect(grid.politeRegion).toHaveText('1 choice available: Alpha');
  });

  test('announces the text a choice shows, not its markup, with allowHtml', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto({ allowHtml: true });
    await grid.startAnnouncementLog();
    await page.clock.install();
    await grid.openEditorAt(0, 0);
    await page.clock.runFor(1000);

    const listbox = grid.listbox('A, row 1');

    await expect(listbox.getByRole('option')).toHaveCount(3);

    await page.keyboard.type('f');
    await page.clock.runFor(1000);
    await expect(listbox.getByRole('option')).toHaveText(['Alfa']);

    expect(await grid.announcements()).toEqual(['1 choice available: Alfa']);
  });

  test('announces nothing for a response that lands after the editor closed', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto({ asyncSource: true });
    await grid.startAnnouncementLog();
    await grid.openEditorAt(0, 0);
    await grid.answerNextQuery();

    const listbox = grid.listbox('A, row 1');

    await expect(listbox.getByRole('option')).toHaveCount(3);

    await page.keyboard.type('f');
    await grid.answerNextQuery();
    await expect(grid.politeRegion).toHaveText('1 choice available: Alfa');

    // A keystroke whose query is still unanswered when Escape closes the editor.
    await page.keyboard.press('Backspace');
    await expect.poll(() => grid.pendingQueryCount()).toBe(1);
    await grid.cancelEditor();

    await page.clock.install();
    // The late response is delivered (the positive control), and the clock runs past the announcer's delay.
    expect(await grid.resolveQueries()).toBe(1);
    await page.clock.runFor(1000);

    expect(await grid.announcements()).toEqual(['1 choice available: Alfa']);
    await expect(grid.politeRegion).toHaveText('1 choice available: Alfa');
  });

  test('announces nothing when the typed text moves the highlight', async({ page, theme, bundle }) => {
    // A strict `autocomplete` narrows the list and highlights the choice the text completes to, which the
    // field names.
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto({ strict: true });
    await grid.startAnnouncementLog();
    await page.clock.install();
    await grid.openEditorAt(0, 0);
    await page.clock.runFor(1000);
    await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);

    await page.keyboard.type('f');
    await page.clock.runFor(1000);

    await expect(grid.listbox('A, row 1').getByRole('option')).toHaveText(['Alfa']);
    await expect.poll(() => grid.referencedElements())
      .toMatchObject({ activeDescendant: { role: 'option', text: 'Alfa' } });
    expect(await grid.announcements()).toEqual([]);
  });

  test('announces nothing with ariaTags: false', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto({ ariaTags: false });
    await grid.startAnnouncementLog();
    await page.clock.install();
    await grid.openEditorAt(0, 0);
    await page.clock.runFor(1000);
    await expect.poll(() => grid.listCellCount()).toBe(3);

    await page.keyboard.type('f');
    await page.clock.runFor(1000);

    await expect.poll(() => grid.listCellCount()).toBe(1);
    expect(await grid.announcements()).toEqual([]);
  });
});

/**
 * A commit ends the edit, so the browser focus leaves the editor's field for the cell the selection
 * lands on, and a screen reader reads that cell rather than a collapsed combobox. The `text` and
 * `handsontable` editors are the controls: each case asserts what they do in the same configuration.
 * Focus is an engine's to get wrong, so the cases run on Firefox and WebKit too.
 */
const COMMIT_CELL_TYPES: EditorCellType[] = ['autocomplete', 'dropdown', 'handsontable', 'text'];
// A bounded settle after the focus arrived: longer than the list editors' 100 ms debounced refocus.
const SETTLE_FRAMES = 15;

for (const cellType of COMMIT_CELL_TYPES) {
  const hasList = cellType !== 'text';

  test.describe(`focus after a commit (${cellType})`, { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
    let grid: EditorListA11yPage;

    test.beforeEach(({ page, theme, bundle }) => {
      grid = new EditorListA11yPage(page, theme, bundle, cellType);
    });

    /**
     * Waits for the focus to reach the cell, then proves it stayed there.
     */
    async function expectFocusOnCell(row: number, col: number): Promise<void> {
      await expect.poll(() => grid.focusTarget()).toEqual({ cell: [row, col] });
      expect(await grid.focusTargetAfterFrames(SETTLE_FRAMES)).toEqual({ cell: [row, col] });
    }

    test('moves the focus to the next cell when Enter commits a choice', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);

      if (hasList) {
        await expect(grid.page.locator('.handsontableEditor .ht_master td').first()).toBeVisible();
        await grid.page.keyboard.press('ArrowDown');
      }

      await grid.commitEditor();

      expect(await grid.selectedCell()).toEqual([1, 0]);
      await expectFocusOnCell(1, 0);
    });

    test('moves the focus to the next cell when Enter commits typed text', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);
      await grid.page.keyboard.type('x');
      await grid.commitEditor();

      expect(await grid.selectedCell()).toEqual([1, 0]);
      await expectFocusOnCell(1, 0);
    });

    test('moves the focus to the cell on the right when Tab commits', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);

      if (hasList) {
        await expect(grid.page.locator('.handsontableEditor .ht_master td').first()).toBeVisible();
        await grid.page.keyboard.press('ArrowDown');
      }

      await grid.page.keyboard.press('Tab');
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      expect(await grid.selectedCell()).toEqual([0, 1]);
      await expectFocusOnCell(0, 1);
    });

    test('keeps the focus on the edited cell with enterMoves: { row: 0, col: 0 }', async() => {
      await grid.goto({ enterStays: true });
      await grid.openEditorAt(0, 0);

      if (hasList) {
        await expect(grid.page.locator('.handsontableEditor .ht_master td').first()).toBeVisible();
        await grid.page.keyboard.press('ArrowDown');
      }

      await grid.commitEditor();

      expect(await grid.selectedCell()).toEqual([0, 0]);
      await expectFocusOnCell(0, 0);
    });

    test('leaves the focus in a menu opened while the commit waits for its validator', async() => {
      await grid.goto({ heldValidator: true, contextMenu: true });
      await grid.openEditorAt(0, 0);
      await grid.page.keyboard.type('x');
      await grid.page.keyboard.press('Enter');
      // The commit waits: the validator holds its answer.
      await expect.poll(() => grid.heldValidationCount()).toBe(1);

      await grid.cell(1, 1).click({ button: 'right' });
      await expect(grid.page.locator('.htContextMenu')).toBeVisible();
      await expect.poll(() => grid.isFocusInContextMenu()).toBe(true);

      expect(await grid.releaseValidations()).toBe(1);
      // The positive control: the answer closed the editor and wrote the value.
      await expect.poll(() => grid.isEditorOpened()).toBe(false);
      await expect(grid.cell(0, 0)).toHaveText(/Alx/);

      await grid.focusTargetAfterFrames(SETTLE_FRAMES);
      expect(await grid.isFocusInContextMenu()).toBe(true);
    });

    if (hasList) {
      test('moves the focus to the edited cell when a click commits a choice', async() => {
        await grid.goto();
        await grid.openEditorAt(0, 0);

        const option = grid.page.locator('.handsontableEditor .ht_master td').nth(1);

        await expect(option).toHaveText('Alfa');
        await option.click();
        await expect.poll(() => grid.isEditorOpened()).toBe(false);

        expect(await grid.selectedCell()).toEqual([0, 0]);
        await expectFocusOnCell(0, 0);
      });
    }
  });
}
