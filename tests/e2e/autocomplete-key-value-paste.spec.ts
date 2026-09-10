import { expect, test } from '../fixtures/test';
import { AutocompleteKeyValuePastePage } from '../fixtures/pages/AutocompleteKeyValuePastePage';

/**
 * DEV-57 — a column whose `source` holds key/value entries stores the whole entry, but a bare
 * label arriving from anywhere other than the editor was stored as-is.
 *
 * The reported route is <kbd>Cmd/Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>, which is the browser's
 * "paste as plain text" command: it delivers a paste event carrying `text/plain` only, so the
 * private clipboard flavour that carries the entry is gone and the grid has no entry to restore.
 * The same thing happens for a paste from any other application, and for
 * `getPlugin('copyPaste').paste()`.
 *
 * Every case here drives that plain-text route, because the key combination itself is handled in
 * the browser process — a synthetic key event never reaches the paste code path, so simulating it
 * would test the harness. Two rich-clipboard cases sit alongside as the regression guard for the
 * path that already worked.
 *
 * Every assertion reads the DATA SOURCE. A stored entry and a bare label render the same text, so
 * a spec written against the rendered cell would pass against the bug it is meant to catch.
 */
test.describe('pasting a label into a key/value source (DEV-57)', () => {
  let grid: AutocompleteKeyValuePastePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutocompleteKeyValuePastePage(page, theme, bundle);
    await grid.goto();
  });

  // Column 0 is a non-strict `autocomplete`, column 1 a `strict` `dropdown`. Both carry the same
  // key/value source, and both were broken — the dropdown visibly, the autocomplete silently.
  for (const [name, column] of [['autocomplete', 0], ['dropdown', 1]] as const) {
    test(`resolves a pasted label into the source entry in a ${name} column`, async() => {
      await expect.poll(() => grid.sourceAt(0, column)).toBe('null');

      await grid.pastePlainText(0, column, 'BMW');

      // Before the fix this stored the bare string `'BMW'`, leaving a string among the entries
      // the other rows hold.
      await expect.poll(() => grid.sourceAt(0, column))
        .toBe('object:{"key":"1","value":"BMW"}');
    });

    test(`pastes the same value a typed label produces in a ${name} column`, async() => {
      // The editor has always resolved a typed label. This pins the two paths to one result, which
      // is the actual contract — if the editor's rule changes, this fails rather than drifting.
      await grid.typeAndCommit(0, column, 'BMW');

      const typed = await grid.sourceAt(0, column);

      await grid.pastePlainText(1, column, 'BMW');

      expect(await grid.sourceAt(1, column)).toBe(typed);
    });

    test(`keeps the source entry's own key when the ${name} cell already held one`, async() => {
      await expect.poll(() => grid.sourceAt(1, column))
        .toBe('object:{"key":"2","value":"Chrysler"}');

      await grid.pastePlainText(1, column, 'BMW');

      // Before the fix this stored `{ key: 'BMW', value: 'BMW' }` — the label reused as the key.
      // A strict column rejected that just as it rejected the bare string.
      await expect.poll(() => grid.sourceAt(1, column))
        .toBe('object:{"key":"1","value":"BMW"}');
    });

    test(`stores a label the source does not contain unchanged in a ${name} column`, async() => {
      await grid.pastePlainText(0, column, 'Audi');

      await expect.poll(() => grid.sourceAt(0, column)).toBe('string:Audi');
    });
  }

  test('leaves a pasted dropdown cell valid instead of marking it invalid', async() => {
    await grid.pastePlainText(0, 1, 'BMW');

    // The user-visible half of the bug: `dropdown` is strict, so the bare string failed the
    // validator and the cell was painted with `invalidCellClassName`.
    await expect.poll(() => grid.isValid(0, 1)).toBe(true);
    await expect(grid.cell(0, 1)).not.toHaveClass(/htInvalid/);
  });

  test('still marks a dropdown cell invalid when the label is not in the source', async() => {
    // The negative control. Without it, a fix that simply stopped validating would pass the case
    // above while accepting anything.
    await grid.pastePlainText(0, 1, 'Audi');

    await expect.poll(() => grid.isValid(0, 1)).toBe(false);
    await expect(grid.cell(0, 1)).toHaveClass(/htInvalid/);
  });

  test('leaves a plain-string source column storing the bare label', async() => {
    // Column 2's source holds strings, not entries. Resolving a label there must not wrap it into
    // an object, or every non-key/value autocomplete column would change what it stores.
    await grid.pastePlainText(0, 2, 'red');

    await expect.poll(() => grid.sourceAt(0, 2)).toBe('string:red');
  });

  test('keeps preserving the entry through a copy and a plain paste', async() => {
    // The rich clipboard path, which already worked: all three flavours reach the grid and the
    // private one carries the entry. This is the regression guard for it.
    await grid.copyCell(2, 0);
    await grid.pasteClipboardInto(0, 0);

    await expect.poll(() => grid.sourceAt(0, 0))
      .toBe('object:{"key":"1","value":"BMW"}');
  });
});
