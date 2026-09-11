import { expect, test } from '../fixtures/test';
import { AutocompleteKeyValuePastePage } from '../fixtures/pages/AutocompleteKeyValuePastePage';

/**
 * DEV-57 — a column whose `source` holds key/value entries stores the whole entry, but a bare
 * label arriving from anywhere other than the editor was stored as-is.
 *
 * The reported route is <kbd>Cmd/Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>, which is the browser's
 * "paste as plain text" command: it delivers a paste event carrying `text/plain` only, so the
 * private clipboard flavor that carries the entry is gone and the grid has no entry to restore.
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

      // Poll before capturing. The commit is synchronous for an array source today, but reading it
      // straight away would race if anything upstream ever deferred, and CI fails on a retry.
      await expect.poll(() => grid.sourceAt(0, column)).toMatch(/^object:/);

      const typed = await grid.sourceAt(0, column);

      await grid.pastePlainText(1, column, 'BMW');

      await expect.poll(() => grid.sourceAt(1, column)).toBe(typed);
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
    //
    // `'valid'`, not "not invalid". A probe reading `valid !== false` answers `true` for a cell
    // nothing has validated yet, so it would pass on the first poll - before validation ran, and
    // so also against the unfixed code. The class assertion is vacuous for the same reason and
    // only earns its place once the meta has been pinned to `'valid'` first.
    await expect.poll(() => grid.validState(0, 1)).toBe('valid');
    await expect(grid.cell(0, 1)).not.toHaveClass(/htInvalid/);
  });

  test('still marks a dropdown cell invalid when the label is not in the source', async() => {
    // The negative control. Without it, a fix that simply stopped validating would pass the case
    // above while accepting anything.
    await grid.pastePlainText(0, 1, 'Audi');

    await expect.poll(() => grid.validState(0, 1)).toBe('invalid');
    await expect(grid.cell(0, 1)).toHaveClass(/htInvalid/);
  });

  test('leaves a plain-string source column storing the bare label', async() => {
    // Column 2's source holds strings, not entries. Resolving a label there must not wrap it into
    // an object, or every non-key/value autocomplete column would change what it stores.
    await grid.pastePlainText(0, 2, 'red');

    await expect.poll(() => grid.sourceAt(0, 2)).toBe('string:red');
  });

  test('leaves an emptied editor empty rather than resolving it to a blank entry', async() => {
    // Column 3's source carries `{ key: '0', value: null }`, which the cell shows as nothing. An
    // emptied editor and that entry therefore look identical on screen. Resolving one to the other
    // would store an object where the user cleared the cell, and because it is an object the setter
    // returns it untouched, so its own empty gate never runs and neither `allowEmpty` nor
    // `emptyValue` ever sees a blank.
    await expect.poll(() => grid.sourceAt(1, 3)).toBe('object:{"key":"1","value":"BMW"}');

    const loadedChoices = await grid.emptyEditorAndCommit(1, 3);

    // Proof the test reached the lookup at all. The choices query is deferred, so an editor opened
    // and committed in the same tick holds none and `getValue()` returns the text without ever
    // consulting the source - which passes with or without the guard.
    expect(loadedChoices).toBe(2);

    await expect.poll(() => grid.sourceAt(1, 3)).toBe('string:');
  });

  test('does not resolve labels that arrive by loading data', async() => {
    // Loading is not a write, so it never reaches `valueSetter`. This is what keeps an existing
    // dataset holding plain labels untouched until something writes to those cells, and it is
    // stated in the migration guide — so it needs a test rather than a claim.
    await grid.loadPlainLabels();

    await expect.poll(() => grid.sourceAt(0, 0)).toBe('string:BMW');
    await expect.poll(() => grid.sourceAt(0, 1)).toBe('string:BMW');

    // A write to the same cell does resolve it, which is the contrast that makes the point.
    await grid.pastePlainText(0, 0, 'BMW');

    await expect.poll(() => grid.sourceAt(0, 0))
      .toBe('object:{"key":"1","value":"BMW"}');
  });

  test('restores a plain label verbatim on undo', async() => {
    // `utils/valueAccessors.ts` states the invariant: undo and redo restore what the cell held
    // before, verbatim. Resolving inside the setter would break it on exactly the dataset the
    // migration guide promises is untouched - a column loaded with plain labels - by turning them
    // into entries on the first undo, a value the user never typed and never undid to.
    await grid.loadPlainLabels();

    await expect.poll(() => grid.sourceAt(0, 0)).toBe('string:BMW');

    await grid.pastePlainText(0, 0, 'Chrysler');

    await expect.poll(() => grid.sourceAt(0, 0))
      .toBe('object:{"key":"2","value":"Chrysler"}');

    await grid.undo();

    await expect.poll(() => grid.sourceAt(0, 0)).toBe('string:BMW');
  });

  test('keeps preserving the entry through a copy and a plain paste', async() => {
    // The rich clipboard path, which already worked: all three flavors reach the grid and the
    // private one carries the entry. This is the regression guard for it.
    await grid.copyCell(2, 0);
    await grid.pasteClipboardInto(0, 0);

    await expect.poll(() => grid.sourceAt(0, 0))
      .toBe('object:{"key":"1","value":"BMW"}');
  });
});
