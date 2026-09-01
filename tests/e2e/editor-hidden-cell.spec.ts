import { test, expect } from '../fixtures/test';
import { EditorHiddenCellPage } from '../fixtures/pages/EditorHiddenCellPage';

/**
 * A HIDING index map (Pagination turning the page, `hiddenRows`, `hiddenColumns`) removes the
 * edited cell from the DOM while its visual index stays valid. The editor must not survive that.
 *
 * The fixture pages 4 rows two at a time, so page 2 leaves row 0 unrendered.
 */
test.describe('editor whose cell is hidden by a hiding index map', () => {
  let grid: EditorHiddenCellPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorHiddenCellPage(page, theme, bundle);
    await grid.goto();
  });

  test('finishes the edit when a programmatic page change hides the edited cell', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    // No pointer interaction, so the document mousedown handler never runs.
    await grid.setPage(2);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['EDITED', 'A2', 'A3', 'A4']);
  });

  test('finishes the edit when a pagination button click hides the edited cell', async({ page }) => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    await page.getByRole('button', { name: 'Go to next page' }).click();

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['EDITED', 'A2', 'A3', 'A4']);
  });

  test('finishes the edit when hiddenRows hides the edited cell', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.hideRow(0);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['EDITED', 'A2', 'A3', 'A4']);
  });

  test('finishes the edit when hiddenColumns hides the edited cell', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    // The only trigger that goes through `afterColumnSequenceCacheUpdate` and the column half of
    // the physical-index conversion. Without it that branch ships untested.
    await grid.hideColumn(0);

    await expect.poll(() => grid.sawHidingCacheUpdate('column')).toBe(true);
    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['EDITED', 'A2', 'A3', 'A4']);
  });

  test('leaves the editor open when an index-map change keeps the edited cell rendered', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    // Rewrites Pagination's hiding map without hiding row 0. `render()` would be vacuous here:
    // the guard's hooks do not fire on a plain render, so nothing would have been exercised.
    await grid.setPageSize(3);

    await expect.poll(() => grid.sawHidingCacheUpdate('row')).toBe(true);
    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.editorText()).toBe('EDITED');
  });
});

/**
 * Sorting shifts the visual-to-physical mapping. `IndexMapper#isHidden()` is keyed by PHYSICAL
 * index, so a guard fed the raw visual index reads another row's hidden flag. Without these two
 * cases every other case in this file passes over that, because visual equals physical whenever no
 * sorting, move or trimming map is active.
 */
test.describe('editor with a hiding map and a sorted index mapping', () => {
  let grid: EditorHiddenCellPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorHiddenCellPage(page, theme, bundle, { sorting: true });
    await grid.goto();
    await grid.sortFirstColumnDescending();

    // Descending puts the last record first, so the two index spaces genuinely differ now.
    await expect.poll(() => grid.toPhysicalRow(0)).toBe(3);
  });

  test('commits to the record being edited, not the one at the same visual index', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.setPage(2);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    // Assert the whole column: a commit that lands on the right record while corrupting the row
    // count still fails.
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A1', 'A2', 'A3', 'EDITED']);
  });

  test('leaves a visible cell alone when the row at its physical index is the hidden one', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    // Visual row 0 is physical row 3 and stays on screen, while physical row 0 is hidden. A guard
    // that skips the conversion reads physical 0's flag and tears down a fully visible edit.
    await grid.setPageSize(3);

    await expect.poll(() => grid.sawHidingCacheUpdate('row')).toBe(true);
    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.editorText()).toBe('EDITED');
  });
});

/**
 * `SelectEditor` and `MultiSelectEditor` extend `BaseEditor` directly, so an editor-level hook on
 * `TextEditor` never reached them. These are the cases that require the guard to live in the
 * manager rather than in an editor.
 */
test.describe('non-text editors whose cell is hidden', () => {
  test('finishes the select edit when a page change hides the edited cell', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { editor: 'select' });

    await grid.goto();
    await grid.openEditor(0, 0);
    await grid.chooseSelectOption('A4');

    await grid.setPage(2);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect(grid.selectEditor).toBeHidden();
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A4', 'A2', 'A3', 'A4']);
  });

  test('closes the multiselect editor when a page change hides the edited cell', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { editor: 'multiSelect' });

    await grid.goto();
    await grid.openEditor(0, 0);

    await grid.setPage(2);

    // `MultiSelectEditor` saves on every toggle, so there is no pending value to assert on. The
    // observable defect is a dropdown left open over a row the user can no longer see.
    await expect.poll(() => grid.isEditorOpen()).toBe(false);
  });

  test('finishes the dropdown edit when a page change hides the edited cell', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'A4');

    await grid.setPage(2);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    // The typed value, not the choice the list happened to be highlighting. `AutocompleteEditor`
    // defers every query by 10 ms, so a close forced inside that window used to read the match for
    // `'A'` - the previous keystroke - and commit `'A1'` over it. Pinned across all six legs at
    // 600 repeats; before the fix that reproduced 14 times.
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A4', 'A2', 'A3', 'A4']);
  });

  test('finishes the dropdown edit when hiddenRows hides the edited cell', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { editor: 'dropdown' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'A4');

    // A second hiding trigger, so the commit is not pinned to Pagination alone.
    await grid.hideRow(0);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A4', 'A2', 'A3', 'A4']);
  });
});

/**
 * `allowInvalid: false` with a rejecting validator sends `finishEditing()` down its worst path: it
 * re-selects the hidden cell and restores `EDITING` rather than closing, and it clears the
 * manager's `activeEditor` reference on the way. Both cases pin that the editor still ends up
 * closed, which is why the guard holds its own reference rather than reading the manager's.
 */
test.describe('editor whose commit is rejected while its cell is hidden', () => {
  test('closes when a synchronous validator rejects the value', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { validator: 'reject' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'BAD');
    await grid.rememberActiveEditor();

    await grid.setPage(2);

    await expect.poll(() => grid.isAnyEditorStillOpen()).toBe(false);
    // The rejected value never reaches the dataset - `validateChanges()` splices it out.
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
  });

  test('closes when an async validator is still in flight as the cell is hidden', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { validator: 'rejectAsync' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'BAD');
    await grid.rememberActiveEditor();

    // Park the editor in WAITING first: `finishEditing()` is a no-op there, so the guard has to
    // retry once validation settles instead of giving up.
    await grid.beginSave();

    await grid.setPage(2);

    await expect.poll(() => grid.isAnyEditorStillOpen()).toBe(false);
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
  });
});

/**
 * Virtualization is not hiding. This keeps the guard from being rewritten against DOM presence,
 * which would silently commit an in-progress edit on every scroll away.
 */
test.describe('editor whose cell is only scrolled out of view', () => {
  test('leaves the edit pending', async({ page, theme, bundle }) => {
    const grid = new EditorHiddenCellPage(page, theme, bundle, { scenario: 'scroll' });

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.scrollToRow(90);
    await expect(grid.cell(0, 0)).toBeHidden();

    await grid.scrollToRow(0);
    await expect(grid.cell(0, 0)).toBeVisible();

    // The round trip is what makes this deterministic: it guarantees the render cycles a wrongly
    // scheduled commit would have ridden on, so an empty recorder rules the commit out rather than
    // merely sampling before it.
    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.sawHidingCacheUpdate('row')).toBe(false);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.editorText()).toBe('EDITED');
  });
});
