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
 * The case above cannot exercise the flush: its `source` is a function, which no flush can make
 * answer in time, so the guard is what carries it. This one uses the ARRAY source, where a flushed
 * query resolves inline - it is the only case that fails if `#flushPendingQuery()` is removed.
 */
test.describe('committing an autocomplete with a query still only scheduled', () => {
  test('runs the scheduled query rather than committing the previous match', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'A1');

    // One task: retype, schedule the query the keystroke defers, and commit before it can run.
    // Separate Playwright actions would round-trip past the 10 ms and let the timer fire on its
    // own, which is exactly the nondeterminism this case exists to remove.
    await page.evaluate(() => {
      const editor = (window as unknown as { hot: { getActiveEditor(): {
        TEXTAREA: HTMLTextAreaElement; finishEditing(restore: boolean): void;
      } } }).hot.getActiveEditor();

      editor.TEXTAREA.value = 'A4';
      editor.TEXTAREA.dispatchEvent(new KeyboardEvent('keydown', { key: '4', keyCode: 52, bubbles: true }));
      editor.finishEditing(false);
    });

    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A4', 'A2', 'A3', 'A4']);
  });
});
