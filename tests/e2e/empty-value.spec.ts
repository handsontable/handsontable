import { test } from '../fixtures/test';
import { EmptyValuePage } from '../fixtures/pages/EmptyValuePage';

/**
 * Two long-standing issues about the same thing: Handsontable stored two different values for an
 * empty cell depending on how the cell was emptied.
 *
 * - #3927 — opening an editor on a `null` cell and confirming without typing stored `''`.
 * - #6380 — a `null` carried through copy/paste came back as `''`.
 *
 * Every assertion reads the DATA SOURCE. `null` and `''` render as the same blank cell, so a spec
 * written against rendered text would pass against the bug it is meant to catch.
 *
 * The fixture's row 0 is all `null`; row 1 carries real values.
 */
test.describe('empty cell values', () => {
  test.describe('a confirm that changed nothing (#3927)', () => {
    let grid: EmptyValuePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new EmptyValuePage(page, theme, bundle);
      await grid.goto();
    });

    // The `date` column is covered through the paste path below, not here. Its editor is a native
    // `<input type="date">`, and Chrome consumes Enter inside one, so no keyboard-driven edit on a
    // date cell ever commits under Playwright - a REAL edit does not close the editor or save
    // either, so this is not about the no-op guard. Asserting it here would test the harness.
    for (const [name, column] of [['text', 0], ['numeric', 1]] as const) {
      test(`keeps \`null\` in a ${name} cell`, async() => {
        await grid.expectSource(0, column, 'null');

        await grid.openAndConfirmUnchanged(0, column);

        // Before the fix this stored `''`: the editor is seeded with `stringify(null)`, which is
        // an empty string, and the confirm wrote that back over the cell.
        await grid.expectSource(0, column, 'null');
      });
    }

    test('fires no change event on a cell without a validator', async() => {
      // Column 0 is `text`, which ships no validator. The user typed nothing, and an `afterChange`
      // here would make any dirty-state flag, change tracker or autosave report an edit that never
      // happened, so nothing is written at all.
      await grid.openAndConfirmUnchanged(0, 0);

      await grid.expectChangeCount(0);
    });

    test('still runs the validator on a validated cell, keeping the value intact', async() => {
      // Column 1 is `numeric`, which ships a validator. A validated cell has to see this confirm,
      // because `allowInvalid: false` must keep the editor open on an invalid value however the
      // user got there. So the cell's OWN value is written back - one change event, and the stored
      // value is byte-identical. Skipping the write here instead would silently drop validation.
      await grid.expectSource(0, 1, 'null');

      await grid.openAndConfirmUnchanged(0, 1);

      await grid.expectSource(0, 1, 'null');
      await grid.expectChangeCount(1);
    });

    test('leaves a populated cell untouched, and still fires no change event', async() => {
      await grid.expectSource(1, 0, 'string:abc');

      await grid.openAndConfirmUnchanged(1, 0);

      await grid.expectSource(1, 0, 'string:abc');
      await grid.expectChangeCount(0);
    });

    test('does not stringify a number confirmed unchanged in a text column', async() => {
      // Column 3 is `text`, so it ships no `valueSetter` to parse the editor's string back. A no-op
      // confirm used to push the value through the editor's textarea and store the string '5'.
      // Asserting this on the `numeric` column would prove nothing: that type's own `valueSetter`
      // parses '5' back to 5, so the cell looks correct with or without the guard.
      await grid.expectSource(1, 3, 'number:5');

      await grid.openAndConfirmUnchanged(1, 3);

      await grid.expectSource(1, 3, 'number:5');
    });

    test('does not stringify a boolean confirmed unchanged in a text column', async() => {
      await grid.expectSource(2, 3, 'boolean:true');

      await grid.openAndConfirmUnchanged(2, 3);

      // Without the guard this stored the string 'true'.
      await grid.expectSource(2, 3, 'boolean:true');
    });
  });

  test.describe('the guard must not swallow a real edit', () => {
    let grid: EmptyValuePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new EmptyValuePage(page, theme, bundle);
      await grid.goto();
    });

    test('saves a typed value over a populated cell', async() => {
      await grid.openAndReplace(1, 0, 'xyz');

      await grid.expectSource(1, 0, 'string:xyz');
      await grid.expectChangeCount(1);
    });

    test('saves a typed value into a `null` cell', async() => {
      await grid.openAndReplace(0, 0, 'typed');

      await grid.expectSource(0, 0, 'string:typed');
    });

    test('saves when the user genuinely empties a populated cell', async() => {
      await grid.openAndReplace(1, 0, '');

      // The default `emptyValue` is `''`, so emptying still stores an empty string here.
      await grid.expectSource(1, 0, 'empty-string');
      await grid.expectChangeCount(1);
    });

    test('saves a fast edit, where typing opens the editor', async() => {
      // Fast edit does not seed the editor from the cell, so the guard must stay disarmed.
      await grid.typeOver(1, 0, 'z');

      await grid.expectSource(1, 0, 'string:z');
    });
  });

  test.describe('`emptyValue` defaults', () => {
    test('stores an empty string, so existing grids are unchanged', async({ page, theme, bundle }) => {
      const grid = new EmptyValuePage(page, theme, bundle);

      await grid.goto();
      await grid.openAndReplace(1, 1, '');

      await grid.expectSource(1, 1, 'empty-string');
    });
  });

  test.describe('`emptyValue: null`', () => {
    let grid: EmptyValuePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new EmptyValuePage(page, theme, bundle, 'null');
      await grid.goto();
    });

    test('stores `null` when the user empties a numeric cell', async() => {
      await grid.openAndReplace(1, 1, '');

      await grid.expectSource(1, 1, 'null');
    });

    test('stores `null` when the user empties a text cell', async() => {
      await grid.openAndReplace(1, 0, '');

      await grid.expectSource(1, 0, 'null');
    });

    test('stores `null` for a blank pasted cell (#6380)', async() => {
      // A tab with nothing either side is two empty cells. This is what a `null` copied out of
      // the grid comes back as: the clipboard carries text, which cannot express `null`.
      await grid.pasteAt(1, 0, '\t');

      await grid.expectSource(1, 0, 'null');
      await grid.expectSource(1, 1, 'null');
    });

    test('leaves a real pasted value alone, and lets the column type parse it', async() => {
      await grid.pasteAt(1, 0, 'kept\t7');

      await grid.expectSource(1, 0, 'string:kept');
      // The numeric column's own `valueSetter` still turns the pasted text into a number.
      await grid.expectSource(1, 1, 'number:7');
    });

    test('applies to a date column too', async() => {
      // The date column's editor cannot be driven by keyboard under Playwright (see the note
      // above), so its empty-value handling is covered through the paste path instead.
      await grid.expectSource(1, 2, 'string:2024-01-01');

      // A lone `''` pastes nothing at all - the parser reads it as no cells, so it is a no-op.
      // One tab is two empty cells, which lands a blank on the numeric and the date column.
      await grid.pasteAt(1, 1, '\t');

      await grid.expectSource(1, 2, 'null');
    });

    test('does not touch a zero, which is a real value and not an empty cell', async() => {
      await grid.openAndReplace(1, 1, '0');

      await grid.expectSource(1, 1, 'number:0');
    });

    test('still preserves `null` on a confirm that changed nothing', async() => {
      await grid.openAndConfirmUnchanged(0, 1);

      await grid.expectSource(0, 1, 'null');
    });
  });
});
