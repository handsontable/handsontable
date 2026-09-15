import { test, expect } from '../fixtures/test';
import { PasteSelectionValidatedColumnPage } from '../fixtures/pages/PasteSelectionValidatedColumnPage';

// Four rows, two columns. Pasted at the last existing row (4) of a five-row grid, it runs down to
// visual row 7 - three rows past the end - so the grid must grow from five records to eight. Every
// value is distinct, and column 0's labels are all members of the dropdown source, so a validated
// column accepts them and validity is never the variable a case turns on.
const PASTE_BLOCK = 'P0\tQ0\nP1\tQ1\nP2\tQ2\nP3\tQ3';

const GROWN_DATA = [
  ['A0', 'B0'],
  ['A1', 'B1'],
  ['A2', 'B2'],
  ['A3', 'B3'],
  ['P0', 'Q0'],
  ['P1', 'Q1'],
  ['P2', 'Q2'],
  ['P3', 'Q3'],
];

/**
 * Pasting a block that runs past the last row grows the grid through `allowInsertRow`, and the
 * post-paste selection must cover every pasted row. A VALIDATED column (a `dropdown` always carries
 * a validator) defers row creation to a microtask - `applyChanges()` creates the rows only after
 * `validateChanges()` drains its queue, and every validated cell is deferred even when its value is
 * valid. So `CopyPaste`'s own synchronous `selectCell()`, which runs the instant `populateFromArray()`
 * returns, clamps the selection's end against a row count that has not grown yet, collapsing it back
 * onto the pre-paste last row. The fix re-selects once `afterChange` reports the write settled.
 *
 * Each case reads the SELECTION and the source row count together: a selection that spans the grown
 * rows while the record count grew is the whole behavior, and either half alone pins nothing.
 */
test.describe('paste selection with a validated column', () => {
  /**
   * The core regression. Column 0 is a `dropdown`, so the pasted range carries a validator and row
   * creation is deferred. The post-paste selection must reach visual row 7 - which on the unfixed
   * build only ever appears AFTER the deferred re-select that does not exist there, so this poll
   * exhausts on pre-fix code while it settles here.
   */
  test('spans the grown rows when the pasted range includes a validated column', async({ page, theme, bundle }) => {
    const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { validated: true });

    await grid.goto();
    await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

    // The selection settles a microtask after the write, so poll it rather than read it once. This
    // is the assertion that fails on the unfixed build: the collapsed `[[4, 0, 4, 1]]` never becomes
    // this range without the deferred re-select.
    await expect.poll(() => grid.selected()).toEqual([[4, 0, 7, 1]]);

    // The grid grew, and the paste really wrote the block - not merely re-selected an empty range.
    expect(await grid.sourceRowCount()).toBe(8);
    expect(await grid.sourceData()).toEqual(GROWN_DATA);
  });

  /**
   * The control that pins the synchronous path is undisturbed by the fix. With NO validator anywhere
   * in the range (both columns plain text), `applyChanges()` creates the rows and fires `afterChange`
   * from INSIDE `populateFromArray()`, so `CopyPaste`'s inline `selectCell()` already runs against the
   * grown count. The selection is therefore final the instant the paste returns - asserted with a
   * PLAIN read, not a poll, because "synchronous" is exactly the property under test.
   */
  test('covers the full pasted region synchronously when no validator is in range',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { validated: false });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // No poll: on the validator-free path the selection is complete before `pasteBlockAt` resolves.
      // Polling here would hide a regression that made this path asynchronous.
      expect(await grid.selected()).toEqual([[4, 0, 7, 1]]);
      expect(await grid.sourceRowCount()).toBe(8);
      expect(await grid.sourceData()).toEqual(GROWN_DATA);
    });

  /**
   * The clamp invariant. A `dropdown` column is in range, but `allowInsertRow: false` forbids the
   * grid from growing, so the rows past the end are never created and the selection must stay clamped
   * to the last existing row. `changeCount()` is the positive control that the write settled and the
   * fix's `afterChange` handler had its chance to fire - without it, a poll on the selection would
   * pass before the deferred validator ran, i.e. on any code at all.
   */
  test('stays clamped to the last row when a validated paste cannot grow the grid',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, {
        validated: true,
        allowInsertRow: false,
      });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // Wait for the write to settle before reading the selection plainly. The two cells of row 4 are
      // the only ones a paste can write when the grid may not grow.
      await expect.poll(() => grid.changeCount()).toBeGreaterThan(0);

      expect(await grid.selected()).toEqual([[4, 0, 4, 1]]);
      expect(await grid.sourceRowCount()).toBe(5);
      // The in-range row was written; nothing was appended past it.
      expect(await grid.sourceCell(4, 0)).toBe('P0');
      expect(await grid.sourceCell(4, 1)).toBe('Q0');
    });

  /**
   * The focus-steal guard. With a genuinely ASYNC validator, `applyChanges` - and the deferred
   * re-select - can land long after the paste, and focus may have left the grid in the meantime. The
   * selection range is unchanged (still collapsed at the paste origin, so the guard's origin check
   * would PASS), so re-selecting would call `selectCell`, which re-listens and yanks focus back into
   * the table. The `isListening()` guard skips the correction when the grid is no longer listening.
   *
   * Focus leaves via `hot.unlisten()`, not a real outside click, and that is load-bearing: an outside
   * click DESELECTS the cell, and a null selection is caught by the earlier origin guard - so it
   * would never reach the `isListening()` branch this case exists to pin. `unlisten()` is the one
   * gesture that leaves the grid not listening WITH the selection still at the origin.
   *
   * The validator parks its callbacks, so the write is held open across the focus move and released
   * here on purpose - the timing is the test's, not the scheduler's. This case MUST fail if the
   * `isListening()` guard is removed: without it the correction runs, the selection expands to
   * `[[4, 0, 7, 1]]`, and `selectCell` re-listens (the grid is listening again - the focus steal).
   */
  test('does not re-select or re-listen when focus left the grid before an async write settled',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { asyncValidator: true });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // Precondition: the inline clamp collapsed the selection, and the write is genuinely held open
      // (validators parked), so the correction has not run and cannot until this test releases it.
      expect(await grid.selected()).toEqual([[4, 0, 4, 1]]);
      expect(await grid.pendingValidationCount()).toBeGreaterThan(0);
      expect(await grid.isListening()).toBe(true);

      // Focus leaves the grid, selection preserved at the origin - the exact state the guard reads.
      await grid.unlisten();
      expect(await grid.isListening()).toBe(false);

      // Release the parked write. `afterChange` now fires and the guard gets its chance to (not) run.
      await grid.resolveValidations();
      await expect.poll(() => grid.changeCount()).toBeGreaterThan(0);

      // The guard held: the grid is still not listening (no focus steal) and the selection was NOT
      // expanded. The rows still grew - the data settled - which isolates the guard as the reason the
      // selection did not follow, rather than the rows never being created.
      expect(await grid.isListening()).toBe(false);
      expect(await grid.selected()).toEqual([[4, 0, 4, 1]]);
      expect(await grid.sourceRowCount()).toBe(8);
    });

  /**
   * The positive control for the guard: the same async validator and the same paste, but focus stays
   * in the grid. Releasing the parked write must now expand the selection over the grown rows. This
   * isolates the `isListening()` guard as the ONLY difference from the case above - the async
   * deferral path itself corrects exactly as the synchronous validated path does.
   */
  test('corrects the selection when the async write settles and focus never left the grid',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { asyncValidator: true });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // Same held-open precondition, so the only variable versus the guard case is where focus goes.
      expect(await grid.selected()).toEqual([[4, 0, 4, 1]]);
      expect(await grid.pendingValidationCount()).toBeGreaterThan(0);
      expect(await grid.isListening()).toBe(true);

      await grid.resolveValidations();

      // The correction lands a tick after the write settles, so poll it.
      await expect.poll(() => grid.selected()).toEqual([[4, 0, 7, 1]]);
      expect(await grid.sourceRowCount()).toBe(8);
    });
});
