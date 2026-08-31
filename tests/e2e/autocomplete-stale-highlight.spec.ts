import { test, expect } from '../fixtures/test';
import { AutocompleteAsyncSourcePage } from '../fixtures/pages/AutocompleteAsyncSourcePage';
import { EditorHiddenCellPage } from '../fixtures/pages/EditorHiddenCellPage';

/**
 * `AutocompleteEditor` highlights the choice matching the typed value, and
 * `HandsontableEditor#finishEditing()` commits that highlight over the typed text. In strict mode
 * that is the point - it normalizes `'Al'` to `'Alfa'`. But the highlight is moved from a query
 * DEFERRED by 10 ms (`#deferQuery`, the #7570 workaround), so a commit forced before that query
 * runs used to read the match for an EARLIER keystroke and write it into the cell.
 *
 * These cases pin which of the two values wins, per selection origin. The async fixture's `source`
 * never answers on its own, so "the list is out of date" is exact here rather than a race.
 */
/**
 * Presses Enter and answers the query the STRICT validator then issues. `autocompleteValidator`
 * calls the same `source`, and this fixture's never answers on its own, so without this the editor
 * parks in `STATE_WAITING` and no value ever reaches the dataset.
 */
async function commit(grid: AutocompleteAsyncSourcePage): Promise<void> {
  await grid.page.keyboard.press('Enter');

  await expect.poll(() => grid.pendingQueryCount(0)).toBeGreaterThan(0);
  await grid.resolveQueries(0);
}

test.describe('committing an autocomplete whose choice list is out of date', () => {
  test('keeps a choice the user picked with the arrow keys', async({ page, theme, bundle }) => {
    const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditor(0, 0);
    await grid.resolveQueries(0);

    await expect.poll(() => grid.dropdownChoices()).toEqual(['Alpha', 'Alfa', 'Alto']);

    // Off the derived match on row 0 and onto row 1. An arrow pick is the user's own choice, so it
    // must win outright - the freshness test below must never be applied to it.
    await page.keyboard.press('ArrowDown');
    await commit(grid);

    await expect.poll(() => grid.cellValue(0, 0)).toBe('Alfa');
  });

  test('lets typing supersede a pick made with the arrow keys', async({ page, theme, bundle }) => {
    const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditor(0, 0);
    await grid.resolveQueries(0);

    await page.keyboard.press('ArrowDown');

    // An arrow pick never writes to the TEXTAREA, so nothing about the text says it happened. New
    // text has to clear it, or the pick keeps winning over the value now on screen - the same defect
    // this file exists for, reached through the branch that lets a pick win.
    //
    // Deliberately NO keydown: this is the right-click Paste / drag-and-drop / IME shape, where text
    // lands in the box with no key event at all. Watching keystrokes alone misses it.
    await page.evaluate(() => {
      const editor = (window as unknown as { hot: { getActiveEditor(): {
        TEXTAREA: HTMLTextAreaElement; finishEditing(restore: boolean): void;
      } } }).hot.getActiveEditor();

      editor.TEXTAREA.value = 'Alx';
      editor.TEXTAREA.dispatchEvent(new Event('input', { bubbles: true }));
      editor.finishEditing(false);
    });

    await expect.poll(() => grid.pendingQueryCount(0)).toBeGreaterThan(0);
    await grid.resolveQueries(0);

    // `'Alx'` matches no choice, so nothing is committed over it.
    await expect.poll(() => grid.cellValue(0, 0)).toBe('Alx');
  });

  test('commits the typed value when the list has not caught up with it', async({ page, theme, bundle }) => {
    const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditor(0, 0);
    await grid.resolveQueries(0);

    // The list now describes `'Al'` and highlights `'Alpha'`. Typing moves the textarea on, but the
    // source is never answered, so the highlight is left describing the older text. Typing appends
    // to the seed, so this makes the textarea `'Alto'`.
    await page.keyboard.type('to');
    await expect.poll(() => grid.pendingQueryCount(0)).toBeGreaterThan(0);

    await commit(grid);

    // `'Alto'`, not `'Alpha'`. Before the fix the stale highlight won.
    await expect.poll(() => grid.cellValue(0, 0)).toBe('Alto');
  });

  test('normalizes to a highlight that is stale but still the right match', async({ page, theme, bundle }) => {
    const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditor(0, 0);
    await grid.resolveQueries(0);

    // `'Al'` matched `'Alpha'`. Typing `'p'` makes the list stale - the query for `'Alp'` is issued
    // and never answered - but `'Alpha'` is still what `'Alp'` matches, so the suggestion is not
    // wrong, only old. A freshness test refuses it and commits `'Alp'`; the value must be `'Alpha'`.
    // This is the whole reason the guard re-derives the match instead of comparing recorded text,
    // and it is the shape every network-backed strict autocomplete hits on a slow response.
    await page.keyboard.type('p');
    await expect.poll(() => grid.pendingQueryCount(0)).toBeGreaterThan(0);

    await commit(grid);

    await expect.poll(() => grid.cellValue(0, 0)).toBe('Alpha');
  });

  test('still normalizes the typed value to its match once the list is current', async({ page, theme, bundle }) => {
    const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditor(0, 0);

    await page.keyboard.type('f');
    await expect.poll(() => grid.pendingQueryCount(0)).toBeGreaterThan(0);

    // Answering brings the list up to date with `'Alf'`, so its match is a current one.
    await grid.resolveQueries(0);
    await expect.poll(() => grid.dropdownChoices()).toEqual(['Alpha', 'Alfa', 'Alto']);

    await commit(grid);

    // The whole choice, not the prefix - the guard must not turn into "typed always wins".
    await expect.poll(() => grid.cellValue(0, 0)).toBe('Alfa');
  });
});

/**
 * `DropdownEditor.prepare()` hardcodes `filter: false`, so every case above exercises only the
 * first-substring-match branch. Plain `autocomplete` keeps `filter: true` and takes the other one,
 * which narrows the list and falls back to index 0. The changelog claims both editors, so this
 * covers the branch that claim rests on.
 */
test.describe('committing a filtering autocomplete whose choice list is out of date', () => {
  test('commits the match the current value would produce, not the one on screen', async({ page, theme, bundle }) => {
    // Strict is what makes the editor derive a highlight at all; `autocomplete` does not force it
    // the way `dropdown` does.
    const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor: 'autocomplete', strict: true });

    await grid.goto();
    await grid.openEditor(0, 0);
    await grid.resolveQueries(0);

    await page.keyboard.type('f');
    await expect.poll(() => grid.pendingQueryCount(0)).toBeGreaterThan(0);

    await commit(grid);

    // `'Alfa'`: the list still describes `'Al'`, but `'Alf'` narrows to `'Alfa'`. Answering merely
    // "the highlight is stale" would commit `'Alf'`, which the strict validator rejects.
    await expect.poll(() => grid.cellValue(0, 0)).toBe('Alfa');
  });
});

/**
 * The same rule on the ARRAY-source path, where the deferred query has not run at all rather than
 * merely being outstanding. Deleting a character leaves the choice `'A1'` still the right match for
 * `'A'`, so strict mode must normalize to it even though the list still describes `'A1'`.
 */
test.describe('committing an autocomplete with a query still only scheduled', () => {
  test('normalizes to the match the current value would produce', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'A1');

    // The premise is that the list already describes `'A1'`. `open()` defers its query too, so
    // without waiting for that highlight this races the very timer the case is about - and a cold
    // run then commits the typed `'A'` for the wrong reason.
    await expect.poll(() => page.evaluate(() => {
      const inner = (window as unknown as { hot: { getActiveEditor(): {
        htEditor?: { getValue(): unknown };
      } } }).hot.getActiveEditor()?.htEditor;

      return inner ? inner.getValue() : null;
    })).toBe('A1');

    // One task: delete a character, schedule the query the keystroke defers, and commit before it
    // can run. Separate Playwright actions would round-trip past the 10 ms and let the timer fire
    // on its own, which is exactly the nondeterminism this case exists to remove.
    await page.evaluate(() => {
      const editor = (window as unknown as { hot: { getActiveEditor(): {
        TEXTAREA: HTMLTextAreaElement; finishEditing(restore: boolean): void;
      } } }).hot.getActiveEditor();

      editor.TEXTAREA.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', keyCode: 8, bubbles: true }));
      editor.TEXTAREA.value = 'A';
      editor.TEXTAREA.dispatchEvent(new Event('input', { bubbles: true }));
      editor.finishEditing(false);
    });

    // `'A1'`, not the typed `'A'`: `filter: false` makes the first choice containing `'A'` the
    // match, and the list already holds it.
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
  });
});
