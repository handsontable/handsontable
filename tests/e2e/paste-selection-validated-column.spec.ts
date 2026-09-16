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
   * The no-focus-steal case. With a genuinely ASYNC validator, `applyChanges` - and the deferred
   * re-select - can land long after the paste, and focus may have left the grid in the meantime. The
   * correction still fixes the selection, but through `selectCell(..., false, false)`: no scroll and
   * `changeListener: false`, so `selectCells` does NOT call `listen()`. The range is corrected while
   * the grid stays not listening - the pasted block ends up selected without focus being yanked back.
   *
   * Focus leaves via `hot.unlisten()`, not a real outside click, and that is load-bearing: an outside
   * click DESELECTS the cell, and a null selection would be caught by the handler's own guard before
   * the correction. `unlisten()` is the one gesture that leaves the grid not listening WITH the
   * selection still exactly the range the paste produced - so only `changeListener: false` keeps the
   * correction from re-listening.
   *
   * The validator parks its callbacks, so the write is held open across the focus move and released
   * here on purpose. This case MUST fail two ways: if the correction re-listens (`changeListener`
   * regressed to `true`), `isListening()` flips back to `true`; if the correction is skipped
   * altogether (an early `isListening()` bail), the selection stays collapsed at `[[4, 0, 4, 1]]`.
   */
  test('corrects the selection without stealing focus when focus left before an async write settled',
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

      // Release the parked write. `afterChange` fires and the correction runs against the grown count.
      await grid.resolveValidations();

      // The correction expands the selection over the grown rows without re-listening: the range is
      // fixed AND the grid stays not listening. Both halves are load-bearing (see the docblock).
      await expect.poll(() => grid.selected()).toEqual([[4, 0, 7, 1]]);
      expect(await grid.isListening()).toBe(false);
      expect(await grid.sourceRowCount()).toBe(8);
    });

  /**
   * The positive control for focus: the same async validator and paste, but focus stays in the grid.
   * Releasing the parked write expands the selection over the grown rows, exactly as the case above
   * does - the two differ only in where focus is, which is the point of the pair.
   */
  test('corrects the selection when the async write settles and focus never left the grid',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { asyncValidator: true });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // Same held-open precondition, so the only variable versus the case above is where focus goes.
      expect(await grid.selected()).toEqual([[4, 0, 4, 1]]);
      expect(await grid.pendingValidationCount()).toBeGreaterThan(0);
      expect(await grid.isListening()).toBe(true);

      await grid.resolveValidations();

      // The correction lands a tick after the write settles, so poll it.
      await expect.poll(() => grid.selected()).toEqual([[4, 0, 7, 1]]);
      expect(await grid.sourceRowCount()).toBe(8);
    });

  /**
   * The correction must not overwrite a selection an `afterPaste` handler moved. `afterPaste` runs
   * synchronously inside the paste and here reselects the paste origin as a single cell
   * (`[[4, 0, 4, 0]]`); the ASYNC validator then holds the write open, so the deferred correction
   * runs only after that move. The moved selection SHARES the paste's start corner but not its
   * extent, so only a whole-range comparison recognizes that it changed and leaves it alone.
   *
   * This MUST fail if the handler compared only the selection's start corner (`getTopStartCorner()`
   * alone): that check passes here, and the correction would expand the single cell to
   * `[[4, 0, 7, 1]]`, overwriting the handler's deliberate selection.
   */
  test('leaves a single-cell selection an afterPaste handler set at the paste origin',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, {
        asyncValidator: true,
        afterPasteMove: true,
      });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // `afterPaste` already reselected the origin cell, and the write is held open, so the
      // correction is still pending - the exact window in which it could wrongly expand this range.
      expect(await grid.selected()).toEqual([[4, 0, 4, 0]]);
      expect(await grid.pendingValidationCount()).toBeGreaterThan(0);

      await grid.resolveValidations();
      await expect.poll(() => grid.changeCount()).toBeGreaterThan(0);

      // The moved selection stands; the rows still grew, so the write settled and the correction had
      // its chance and correctly declined it.
      expect(await grid.selected()).toEqual([[4, 0, 4, 0]]);
      expect(await grid.sourceRowCount()).toBe(8);
    });

  /**
   * A paste over a merge that STRADDLES the paste boundary, with a validated column. `mergeCells`
   * merges a 2x2 area over rows 3-4 (`{ row: 3, col: 0, rowspan: 2, colspan: 2 }`), so it overlaps
   * the paste (which starts at row 4) and extends one row ABOVE it. Its `beforeSetRangeStart`
   * snapping and its post-paste unmerge both run alongside the deferred re-select.
   *
   * The two paths - a validated (deferred) paste and a validator-free (synchronous) one - land on
   * the SAME range here, which is the point of the case. `pasteBlockAt(4, 0)` selects the origin
   * cell before pasting, and with the merge live that selection snaps up to the merge's top-start
   * corner (3, 0) on BOTH paths, so the paste anchors at row 3 either way and grows the grid from
   * five records to seven. The correction reads its applied range back from the grid AFTER that
   * snap, recognizes the untouched selection and re-selects it against the grown count without
   * widening past what the paste wrote.
   *
   * This pins the ROW axis, which is closed by construction: a merge that overlaps a paste starting
   * at the last row and extends outside it must contain the paste origin (row 4 is the paste's top,
   * and the paste ends on the grid's last row so nothing extends below), so the pre-paste snap moves
   * the anchor identically for both paths. The COLUMN axis is NOT closed - a narrower paste can
   * overlap a merge extending sideways out of it without the origin snap, and there the deferred
   * path ends wider than the synchronous one. That is a scoped-out interaction the fix introduces;
   * see the plugin `AGENTS.md` "Scope" note (c).
   */
  test('corrects the selection when the paste covers a merged area', async({ page, theme, bundle }) => {
    const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { validated: true, merge: true });

    await grid.goto();
    await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

    // The merge snaps the paste anchor up to row 3, so the block writes rows 3-6 and the selection
    // spans them. The record count grew by two (five to seven), proving the paste really wrote.
    await expect.poll(() => grid.selected()).toEqual([[3, 0, 6, 1]]);
    expect(await grid.sourceRowCount()).toBe(7);
    // The block landed at the snapped anchor: row 4 sits inside the merged area, so pin the corners.
    expect(await grid.sourceCell(3, 0)).toBe('P0');
    expect(await grid.sourceCell(6, 1)).toBe('Q3');
  });

  /**
   * A later paste event that BAILS must not wipe a still-pending async paste's plan. The plan is
   * cleared inside `onPaste` BELOW its early-return guard, not above it, so a paste event that returns
   * immediately (here: the grid is not listening) leaves the pending plan intact and the first paste
   * still corrects once its write settles.
   *
   * This MUST fail if the clear runs at the top of `onPaste`, before the guard: the bailing paste
   * would wipe `#pastePlan`/`#appliedPasteRange`, the deferred `afterChange` would find an empty slot
   * and return, and the first paste would stay collapsed at `[[4, 0, 4, 1]]`.
   */
  test('keeps correcting the first async paste when a later paste event bails at the guard',
    async({ page, theme, bundle }) => {
      const grid = new PasteSelectionValidatedColumnPage(page, theme, bundle, { asyncValidator: true });

      await grid.goto();
      await grid.pasteBlockAt(4, 0, PASTE_BLOCK);

      // The first paste is held open (validators parked) and collapsed by the inline clamp.
      expect(await grid.selected()).toEqual([[4, 0, 4, 1]]);
      expect(await grid.pendingValidationCount()).toBeGreaterThan(0);

      // A second paste event reaches `onPaste` while the grid is not listening, so it bails at the
      // guard. It must not touch the first paste's pending plan.
      await grid.unlisten();
      await grid.pasteWhileNotListening('X\tY');
      expect(await grid.isListening()).toBe(false);

      // Release the first paste's write. Its plan survived the bailing event, so it corrects.
      await grid.resolveValidations();

      await expect.poll(() => grid.selected()).toEqual([[4, 0, 7, 1]]);
      expect(await grid.sourceRowCount()).toBe(8);
    });
});
