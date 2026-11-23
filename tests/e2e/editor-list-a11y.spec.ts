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
      // The nested grid's own wrappers (overlay, holder, hider, spreader, of the master table and of every
      // clone) sit between the listbox and its options. Chromium hands an exposed wrapper to VoiceOver as a
      // group, which then reads a list of 1 item. The selection borders are hidden: an option exposes its
      // highlight itself.
      const exposedWrappers = listbox
        .locator('div:not([role="presentation"], [aria-hidden="true"], [aria-hidden="true"] *)');

      await expect(exposedWrappers).toHaveCount(0);

      // A highlight draws the borders of the list, which the list creates on that draw.
      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: { role: 'option' } });
      await expect(listbox.locator('.htBorders').first()).toHaveAttribute('aria-hidden', 'true');
      await expect(exposedWrappers).toHaveCount(0);
    });

    test('gives each option its place among the choices the list shows', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);

      const options = grid.listbox('A, row 1').getByRole('option');

      await expect(options).toHaveText(['Alpha', 'Alfa', 'Alto']);
      await expect(options.nth(0)).toHaveAttribute('aria-posinset', '1');
      await expect(options.nth(1)).toHaveAttribute('aria-posinset', '2');
      await expect(options.nth(2)).toHaveAttribute('aria-posinset', '3');

      for (let index = 0; index < 3; index += 1) {
        await expect(options.nth(index)).toHaveAttribute('aria-setsize', '3');
      }

      if (cellType === 'autocomplete') {
        // Typing narrows the list to Alfa: the option counts the list, not the place Alfa has in `source`.
        await grid.page.keyboard.type('f');
        await expect(options).toHaveText(['Alfa']);
        await expect(options.first()).toHaveAttribute('aria-posinset', '1');
        await expect(options.first()).toHaveAttribute('aria-setsize', '1');
      }
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

    test('keeps every element of the list out of the tab order, also after it scrolls', async() => {
      await grid.goto({ longSource: true });
      await grid.openEditorAt(0, 0);

      const listbox = grid.listbox('A, row 1');

      await expect(listbox.getByRole('option').first()).toHaveText('Al 001');
      // A focusable scroll holder under the presentational table markup is a child the listbox role does
      // not allow, and a stop the keyboard could reach inside a popup that keeps the focus in its field.
      expect(await grid.focusableListElements()).toEqual([]);

      for (let i = 0; i < 30; i++) {
        await grid.page.keyboard.press('ArrowDown');
      }

      await expect.poll(() => grid.referencedElements())
        .toMatchObject({ activeDescendant: { text: 'Al 030' } });
      expect(await grid.focusableListElements()).toEqual([]);
    });

    // Known trade-off: without `tabindex` the list's scrolling holder is a Tab stop to Chromium and Firefox, but no Tab
    // reaches it: the editor prevents every Tab while the list is shown, and the list is hidden whenever it is not.
    test('runs no browser Tab navigation while the list is shown, and hides the list whenever the editor closes', async() => {
      await grid.goto({ longSource: true });
      await grid.leaveScrollingListByEveryKey();
    });

    test('hides the list while a grid scroll hides the edited cell', async() => {
      await grid.goto({ frozen: true });
      await grid.openEditorAt(0, 1);
      expect(await grid.displayedListCount()).toBe(1);

      await grid.scrollGridToInlineEnd();
      await expect.poll(() => grid.displayedListCount()).toBe(0);

      await grid.scrollGridToInlineStart();
      await expect.poll(() => grid.displayedListCount()).toBe(1);
    });

    test('renames the list for the next edited cell', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);
      await expect(grid.listbox('A, row 1')).toBeVisible();
      await grid.commitEditor();

      await grid.openEditorAt(1, 1);

      await expect(grid.combobox('B, row 2')).toBeFocused();
      await expect(grid.listbox('B, row 2')).toBeVisible();
      // The field names the list only once the list holds a choice, which the deferred first query decides.
      await expect.poll(async() => (await grid.referencedElements()).controls)
        .toEqual({ role: 'listbox', isListRoot: true });

      // The reused editor names an option of the new list, not one of the list it showed before. The key waits
      // for the list's first query: the list is empty until it answers.
      await expect(grid.listbox('B, row 2').getByRole('option')).toHaveCount(3);
      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.referencedElements()).toEqual({
        controls: { role: 'listbox', isListRoot: true },
        activeDescendant: { role: 'option', selected: 'true', text: 'Alpha', inList: true },
      });
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

      // A highlight writes nothing either: no reference on the field, no state or name on the list. (The list is
      // highlighted through its API: with `ariaTags: false` ArrowDown closes the editor, as on 18.1.)
      await grid.selectListRow(0);
      await expect.poll(() => grid.listSelection()).toEqual([0, 0]);
      // `aria-selected` on the highlighted cell is the core selection's own: every grid writes it whatever its
      // `ariaTags` (`Selection`'s `cellAttributes`), the root grid's cells too. The editor adds nothing.
      expect(await grid.ariaAttributeNames()).toEqual({ input: [], listRoot: [], cells: ['aria-selected'] });
    });

    test('names no option once ArrowUp leaves the list above its first option', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);
      await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.fieldReferences()).toMatchObject({ activeText: 'Alpha' });

      // The dropdown highlights a choice on open too, so walk up until the list highlights nothing.
      for (let i = 0; i < 4 && await grid.listSelection() !== null; i++) {
        await grid.page.keyboard.press('ArrowUp');
      }

      expect(await grid.listSelection()).toBeNull();
      await expect.poll(() => grid.fieldReferences()).toMatchObject({ activeDescendant: null });
    });

    test('never names a missing option after the wheel scrolls the highlight away', async() => {
      await grid.goto({ longSource: true });
      await grid.openEditorAt(0, 0);

      const listbox = grid.listbox('A, row 1');

      await expect(listbox.getByRole('option').first()).toHaveText('Al 001');

      for (let i = 0; i < 3; i++) {
        await grid.page.keyboard.press('ArrowDown');
      }

      await expect.poll(() => grid.fieldReferences()).toMatchObject({ activeText: 'Al 003' });

      await grid.wheelOverList(2000);
      // The precondition: the highlighted option is no longer drawn.
      await expect(listbox.getByRole('option', { name: 'Al 003', exact: true })).toHaveCount(0);

      // The field names the highlighted option or nothing: never an id no element carries.
      await expect.poll(async() => {
        const { activeDescendant, activeText } = await grid.fieldReferences();

        return activeDescendant === null || activeText === 'Al 003';
      }).toBe(true);
      expect(await grid.listSelection()).toEqual([2, 0]);
    });

    test('names nothing while a grid scroll hides the list, also after a key, and names it again on re-show', async() => {
      await grid.goto({ frozen: true });
      await grid.openEditorAt(0, 1);
      await expect(grid.listbox('B, row 1').getByRole('option')).toHaveCount(3);
      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.fieldReferences()).toMatchObject({ activeText: 'Alpha' });

      await grid.scrollGridToInlineEnd();
      await expect.poll(() => grid.displayedListCount()).toBe(0);
      expect(await grid.fieldReferences())
        .toEqual({ expanded: 'false', controls: null, activeDescendant: null, activeText: null });

      // The list keeps taking keys while hidden.
      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.listSelection()).toEqual([1, 0]);
      expect(await grid.fieldReferences())
        .toEqual({ expanded: 'false', controls: null, activeDescendant: null, activeText: null });

      await grid.scrollGridToInlineStart();
      await expect.poll(() => grid.displayedListCount()).toBe(1);
      await expect.poll(() => grid.fieldReferences()).toMatchObject({ expanded: 'true', activeText: 'Alfa' });
      expect((await grid.referencedElements()).controls).toEqual({ role: 'listbox', isListRoot: true });
    });

    test('names nothing after a theme change closed the list, also after the list renders', async() => {
      await grid.goto();
      await grid.openEditorAt(0, 0);
      await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
      await grid.page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.fieldReferences()).toMatchObject({ activeText: 'Alpha' });

      await grid.switchToAnotherTheme();
      await expect.poll(() => grid.isEditorOpened()).toBe(false);
      expect(await grid.fieldReferences())
        .toEqual({ expanded: 'false', controls: null, activeDescendant: null, activeText: null });

      // The closed list keeps its highlight; a render of it must not point the field at it again.
      expect(await grid.listSelection()).toEqual([0, 0]);
      await grid.renderList();
      expect(await grid.fieldReferences())
        .toEqual({ expanded: 'false', controls: null, activeDescendant: null, activeText: null });
    });
  });
}

/**
 * A list with no choice to show is hidden, so the field must not say it is expanded or point at it: an
 * autocomplete list narrowed to nothing, or one whose function `source` has not answered yet.
 */
test.describe('list with nothing to show (autocomplete)', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('collapses the field while the typed text matches nothing, and expands it again', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto();
    await grid.openEditorAt(0, 0);
    await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.fieldReferences()).toMatchObject({ activeText: 'Alpha' });

    await page.keyboard.type('zzz');
    await expect.poll(() => grid.listQuery()).toBe('Alzzz');
    // The positive control: the list is hidden.
    await expect.poll(() => grid.displayedListCount()).toBe(0);
    expect(await grid.fieldReferences())
      .toEqual({ expanded: 'false', controls: null, activeDescendant: null, activeText: null });

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Backspace');
    }

    await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
    expect(await grid.fieldReferences()).toMatchObject({ expanded: 'true' });
    expect((await grid.referencedElements()).controls).toEqual({ role: 'listbox', isListRoot: true });
  });

  test('keeps the field collapsed until a function source answers', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto({ asyncSource: true });
    await grid.openEditorAt(0, 0);
    await expect.poll(() => grid.pendingQueryCount()).toBe(1);
    expect(await grid.fieldReferences())
      .toEqual({ expanded: 'false', controls: null, activeDescendant: null, activeText: null });

    await grid.answerNextQuery();
    await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
    expect(await grid.fieldReferences()).toMatchObject({ expanded: 'true' });
    expect((await grid.referencedElements()).controls).toEqual({ role: 'listbox', isListRoot: true });
  });
});

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

  test('drops an arrow pick that typing superseded, and announces the narrowed list', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto();
    await grid.startAnnouncementLog();
    await page.clock.install();
    await grid.openEditorAt(0, 0);
    await page.clock.runFor(1000);

    const listbox = grid.listbox('A, row 1');

    await expect(listbox.getByRole('option')).toHaveCount(3);

    // Pick Alto, the last choice, with the arrows.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.referencedElements())
      .toMatchObject({ activeDescendant: { role: 'option', text: 'Alto' } });

    // `Alf` leaves Alfa only. The pick is gone with the list: nothing is highlighted, so Enter would commit the
    // typed text, and the live region says what is left.
    await page.keyboard.type('f');
    await page.clock.runFor(1000);
    await expect(listbox.getByRole('option')).toHaveText(['Alfa']);
    await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: null });
    await expect(listbox.getByRole('option', { selected: true })).toHaveCount(0);

    expect(await grid.announcements()).toEqual(['1 choice available: Alfa']);
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

/**
 * The focus rule after a validated commit is the core's, not the list editors': a `text` cell with a validator
 * waits for its answer too. An accepted value moves the focus to the cell the selection lands on; a rejected one
 * under `allowInvalid: false` reopens the editor, which keeps the focus.
 */
test.describe('focus after a commit (text with a validator)', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  for (const key of ['Enter', 'Tab'] as const) {
    test(`moves the focus to the next cell when ${key} commits an accepted value`, async({ page, theme, bundle }) => {
      const grid = new EditorListA11yPage(page, theme, bundle, 'text');
      const nextCell: [number, number] = key === 'Enter' ? [1, 0] : [0, 1];

      await grid.goto({ heldValidator: true });
      await grid.openEditorAt(0, 0);
      await page.keyboard.type('x');
      await page.keyboard.press(key);
      await expect.poll(() => grid.heldValidationCount()).toBe(1);
      expect(await grid.releaseValidations()).toBe(1);
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      expect(await grid.selectedCell()).toEqual(nextCell);
      await expect.poll(() => grid.focusTarget()).toEqual({ cell: nextCell });
      expect(await grid.focusTargetAfterFrames(SETTLE_FRAMES)).toEqual({ cell: nextCell });
    });
  }

  for (const leavesGrid of [false, true]) {
    const outcome = leavesGrid ? 'leaves the focus on a page input the user moved to' : 'moves the focus to the next cell';

    test(`${outcome} when the cell is rendered after the answer`, async({ page, theme, bundle }) => {
      const grid = new EditorListA11yPage(page, theme, bundle, 'text');

      await grid.goto({ heldValidator: true, frozen: true, outsideClickDeselects: false });

      const outsideInput = await grid.addOutsideInput();

      await grid.openEditorAt(0, 1);
      await page.keyboard.type('x');
      await page.keyboard.press('Enter');
      await expect.poll(() => grid.heldValidationCount()).toBe(1);

      // The answer arrives while the cell the selection moved to is scrolled out of the rendered range.
      await grid.scrollGridSideways('end');
      await expect.poll(() => grid.isCellRendered(1, 1)).toBe(false);
      expect(await grid.releaseValidations()).toBe(1);
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      if (leavesGrid) {
        await outsideInput.click();
        await expect(outsideInput).toBeFocused();
      }

      // `outsideClickDeselects: false` keeps the highlight, so only the focus says the user left.
      expect(await grid.selectedCell()).toEqual([1, 1]);
      await grid.scrollGridSideways('start');
      await expect.poll(() => grid.isCellRendered(1, 1)).toBe(true);

      if (leavesGrid) {
        // The positive control is the sibling case: the same scroll gives the focus to the cell there.
        expect(await grid.focusTargetAfterFrames(SETTLE_FRAMES)).toEqual({ other: 'input' });
        await expect(outsideInput).toBeFocused();
      } else {
        await expect.poll(() => grid.focusTarget()).toEqual({ cell: [1, 1] });
      }
    });
  }

  test('leaves the focus on the reopened editor when the validator rejects the value', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'text');

    await grid.goto({ rejectValidator: true });
    await grid.openEditorAt(0, 0);
    await page.keyboard.type('x');
    await page.keyboard.press('Enter');

    // The positive control: the rejected value wrote nothing, and the editor is open again on the same cell.
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    expect(await grid.dataAtCell(0, 0)).toBe('Al');
    expect(await grid.selectedCell()).toEqual([0, 0]);
    await expect.poll(() => grid.focusTarget()).toEqual({ editorField: true });
    expect(await grid.focusTargetAfterFrames(SETTLE_FRAMES)).toEqual({ editorField: true });
  });
});

/**
 * With `imeFastEdit` the browser focus rests on the editor's field between edits, so the next composed
 * character starts the next edit. A commit that waits for its validator must end there too, the way a
 * commit of a cell without a validator does: the plain `text` cell is the control, and each case asserts
 * the same end state for it first, in the same test.
 */
const IME_CASES: { name: string, cellType: EditorCellType, passValidator?: boolean, heldValidator?: boolean }[] = [
  { name: 'autocomplete', cellType: 'autocomplete' },
  { name: 'dropdown', cellType: 'dropdown' },
  { name: 'text with a validator', cellType: 'text', passValidator: true },
  // The answer comes on a later task, long after the key moved the selection.
  { name: 'text with a held validator', cellType: 'text', heldValidator: true },
  { name: 'autocomplete with a held validator', cellType: 'autocomplete', heldValidator: true },
];

test.describe('focus after a validated commit with imeFastEdit', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  for (const { name, cellType, passValidator = false, heldValidator = false } of IME_CASES) {
    for (const key of ['Enter', 'Tab'] as const) {
      test(`leaves the focus on the editor's field after ${key} commits (${name})`, async({ page, theme, bundle }) => {
        const nextCell = key === 'Enter' ? [1, 0] : [0, 1];
        const commitAndRead = async(grid: EditorListA11yPage, held: boolean) => {
          await grid.openEditorAt(0, 0);
          await page.keyboard.type('x');
          await page.keyboard.press(key);

          if (held) {
            await expect.poll(() => grid.heldValidationCount()).toBe(1);
            expect(await grid.releaseValidations()).toBe(1);
          }

          await expect.poll(() => grid.isEditorOpened()).toBe(false);
          expect(await grid.selectedCell()).toEqual(nextCell);
          await expect.poll(() => grid.focusTarget()).toEqual({ editorField: true });

          return grid.focusTargetAfterFrames(SETTLE_FRAMES);
        };

        // The control: a cell without a validator, in the same configuration.
        const control = new EditorListA11yPage(page, theme, bundle, 'text');

        await control.goto({ imeFastEdit: true });
        expect(await commitAndRead(control, false)).toEqual({ editorField: true });

        const grid = new EditorListA11yPage(page, theme, bundle, cellType);

        await grid.goto({ imeFastEdit: true, passValidator, heldValidator });
        expect(await commitAndRead(grid, heldValidator)).toEqual({ editorField: true });
      });
    }
  }
});

/**
 * The select editor edits in a native `<select>`, not in the text editors' field. With a validator its commit
 * waits for the answer too, and the focus must still reach the cell the selection lands on.
 */
test.describe('focus after a commit (select with a validator)', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('moves the focus to the next cell when Enter commits', async({ page, theme, bundle }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'select');

    await grid.goto({ passValidator: true });
    await grid.openEditorAt(0, 0);
    await page.keyboard.press('ArrowDown');
    await grid.commitEditor();

    expect(await grid.selectedCell()).toEqual([1, 0]);
    await expect.poll(() => grid.focusTarget()).toEqual({ cell: [1, 0] });
    expect(await grid.focusTargetAfterFrames(SETTLE_FRAMES)).toEqual({ cell: [1, 0] });
  });

  test('leaves the focus on the page when a press there blurred the editor during the wait', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'select');

    await grid.goto({ heldValidator: true, outsideClickDeselects: false });
    await grid.openEditorAt(0, 0);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect.poll(() => grid.heldValidationCount()).toBe(1);

    // A press on the page below the grid, where nothing takes the focus.
    await page.mouse.click(600, 600);
    await expect.poll(() => grid.focusTarget()).toEqual({ other: 'body' });

    expect(await grid.releaseValidations()).toBe(1);
    // The positive control: the answer closed the editor and wrote the value, and the selection is kept.
    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    // The seeded `Al` is no option, so any choice written replaces it.
    await expect(grid.cell(0, 0)).toHaveText(/^Al(pha|fa|to)$/);
    expect(await grid.selectedCell()).toEqual([1, 0]);

    expect(await grid.focusTargetAfterFrames(SETTLE_FRAMES)).toEqual({ other: 'body' });
  });
});
