import { test, expect } from '../fixtures/test';
import { EditorTrimmedRowPage } from '../fixtures/pages/EditorTrimmedRowPage';

const UNTOUCHED = [
  ['A0', 'B0'],
  ['A1', 'B1'],
  ['A2', 'B2'],
  ['A3', 'B3'],
  ['A4', 'B4'],
];

/**
 * A TRIMMING index map collapses the visual index space: rows below a trimmed row shift up, and the
 * row count shrinks. An open editor holds the VISUAL coordinates it captured when it was prepared,
 * and `BaseEditor#saveValue()` writes through them with no bounds check, so before the fix a trim
 * under an open editor produced silent data corruption in one of three shapes - a write to the
 * wrong record, a write to a record the grid APPENDED to reach the stale coordinate, or a write to
 * the wrong record after the edited row merely moved.
 *
 * Every case here asserts the whole source data set AND the record count. Checking one cell is not
 * enough: a commit that lands on the right record while growing the dataset is still the bug.
 */
test.describe('Filters trims the edited record away', () => {
  /**
   * The append shape, and the severe one: the edited visual row sits past the post-filter row
   * count, so `applyChanges()` creates the missing rows to reach it. Before the fix this produced
   * `['A0','A1','A2','A3','A4', null, null, 'EDITED']` - eight records where there were five, with
   * the typed value on a record that did not exist a moment earlier.
   */
  test('discards the edit instead of appending rows to reach a stale coordinate', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(3, 0, 'EDITED');

    await grid.filterToValues(0, ['A2']);

    await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);

    // The change count is what rules out a commit landing a tick later; `expect.poll` would pass on
    // its first sample and prove nothing about persistence. Read the data plainly, after it.
    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceData()).toEqual(UNTOUCHED);

    // Pins that this case really is the append shape: the editor's visual row (3) is past the last
    // visible row. Without this the case would silently degrade into the wrong-record shape below.
    expect(await grid.visibleRowCount()).toBe(1);
  });

  /**
   * The same cause with the row count intact, which is the shape a fix aimed only at the append
   * would leave behind. The edited visual row (0) still resolves after the filter, but to a
   * different record: before the fix `'A2'` was overwritten with the value typed into `'A0'`.
   */
  test('discards the edit instead of writing it onto the record that took the slot',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(0, 0, 'EDITED');

      await grid.filterToValues(0, ['A2']);

      // The surviving record moved into the edited row's visual slot. That coincidence is the whole
      // case, so assert it rather than assuming the filter produced it.
      await expect.poll(() => grid.toPhysicalRow(0)).toBe(2);
      await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);

      expect(await grid.committedChangeCount()).toBe(0);
      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
    });
});

/**
 * The edited record survives the filter and only MOVES, because rows above it were trimmed. Nothing
 * about the row count betrays this one, and a guard that only reacts to "the edited row became
 * invisible" misses it entirely - which is why the fix resolves the editor's physical record on
 * every trimming change rather than testing for disappearance.
 */
test.describe('Filters keeps the edited record but moves it', () => {
  /**
   * `filter()` re-selects the highlighted column before it returns, and that selection change is
   * what commits the edit - synchronously, inside `filter()`. So the edit does land, and it must
   * land on `'A4'`. Before the fix the stale visual row 4 was past the two remaining rows, which
   * appended three records and put `'EDITED'` on the last of them.
   */
  test('commits the edit to the record it was typed into', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(4, 0, 'EDITED');

    await grid.filterToValues(0, ['A3', 'A4']);

    await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);

    await expect.poll(() => grid.sourceRowCount()).toBe(5);
    await expect.poll(() => grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['A1', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['EDITED', 'B4'],
    ]);

    // Pins that the edited record really did move: had the filter left it at visual row 4, the
    // stale coordinate would have been in range and this case would prove nothing.
    expect(await grid.visibleRowCount()).toBe(2);
  });
});

/**
 * `trimRows()` reaches the editor by a different route from `filter()`: it touches neither the
 * selection nor the render, so nothing commits the edit as a side effect. The stale editor is left
 * armed and corrupts on whatever the user does next. These cases therefore end with a real commit
 * trigger rather than reading the data straight after the trim.
 */
test.describe('trimRows removes or moves the edited record', () => {
  /**
   * With the record gone the edit is dropped, and it must be dropped THERE - not left pending on a
   * stale coordinate. Before the fix the editor stayed open and the next click committed `'EDITED'`
   * onto `'A4'`, the record that had taken over visual row 3.
   */
  test('closes the editor and leaves a later click unable to commit', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(3, 0, 'EDITED');

    await grid.trimRows([3]);

    await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);
    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    // `trimRows()` issues no render of its own, so the editor has to take itself off screen. The
    // textarea wrapper lives in the DOM permanently; its hidden class is the real signal.
    await expect(grid.editorHolder).toHaveClass(/ht_editor_hidden/);

    await grid.cell(0, 0).click();

    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceData()).toEqual(UNTOUCHED);
  });

  /**
   * The discard has to release the editor, not just its value. `openEditor()` re-prepares only when
   * there is no active editor, so a lingering reference would let the next keystroke reuse the
   * pre-trim `TD`, `prop`, `originalValue` and cell meta of a record that is no longer on screen.
   *
   * `originalValue` is the discriminating read, not the write. The selection is not adjusted by a
   * trim, so the coordinates a save goes through are the same either way and the value lands on
   * `'A4'` regardless - what a stale reference changes is the record the editor was SET UP for:
   * `'A3'`'s cell meta, `prop`, `TD` and original value, for a record no longer on screen. A stale
   * `readOnly` or `validator` from that meta would decide the next edit.
   */
  test('re-prepares from post-trim state when the user keeps typing after the discard',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(3, 0, 'EDITED');

      // Physical row 3 is trimmed, so visual row 3 - still the selected one - now shows `'A4'`.
      await grid.trimRows([3]);

      await expect.poll(() => grid.isEditorOpen()).toBe(false);

      await grid.typeOnSelection('X');

      await expect.poll(() => grid.isEditorOpen()).toBe(true);
      // `'A3'` here would mean the discarded editor was reused with the trimmed record's state.
      expect(await grid.editorOriginalValue()).toBe('A4');

      await grid.commitWithEnter();

      await expect.poll(() => grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['X', 'B4'],
      ]);
      expect(await grid.sourceRowCount()).toBe(5);
    });

  /**
   * The record survives two rows above it being trimmed, so the editor stays open and rebinds. The
   * direct read is `editorRow()`: 4 before the trim, 2 after. Before the fix it stayed at 4, which
   * is past the three remaining rows - Enter then appended two records and wrote `'EDITED'` onto
   * the last one.
   */
  test('rebinds the open editor so Enter commits to the record it was typed into',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(4, 0, 'EDITED');

      await grid.trimRows([0, 1]);

      await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);
      await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');
      await expect.poll(() => grid.editorRow()).toBe(2);
      await expect.poll(() => grid.editorText()).toBe('EDITED');

      await grid.commitWithEnter();

      await expect.poll(() => grid.sourceRowCount()).toBe(5);
      await expect.poll(() => grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['EDITED', 'B4'],
      ]);
    });
});

/**
 * The guard reacts to a trimming-map write, and trimming maps are written far more often than they
 * actually move anything - `BooleanMap#setValues()` emits its change event even when every value it
 * writes is the one already there. Tearing an edit down on that churn would be a regression worse
 * than the bug, so the fix compares the edited record's resolved visual index instead of trusting
 * the change event.
 */
test.describe('a trimming-map write that moves nothing', () => {
  test('leaves the open edit untouched', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(2, 0, 'EDITED');

    // Untrimming a row that was never trimmed: the map is rewritten, the change event fires, and
    // not one index moves.
    await grid.untrimRows([1]);

    await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);
    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');
    await expect.poll(() => grid.editorRow()).toBe(2);
    expect(await grid.committedChangeCount()).toBe(0);

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceRowCount()).toBe(5);
    await expect.poll(() => grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['A1', 'B1'],
      ['EDITED', 'B2'],
      ['A3', 'B3'],
      ['A4', 'B4'],
    ]);
  });
});

/**
 * Two states that reach the guard by a route none of the cases above take, and that the fix has to
 * survive rather than improve: the editor's cell has no rendered `TD` at all, and a physical index
 * shift that no trimming map performed.
 */
test.describe('states the captured record has to survive', () => {
  /**
   * `EditorManager#prepareEditor()` does its work only when the edited cell has a rendered `TD`, so
   * a cell scrolled out of the viewport leaves the editor open on coordinates the manager will not
   * refresh. Filtering from there still has to resolve the right record. Before the fix the stale
   * visual row 0 pointed at the single surviving record and overwrote `'A50'`.
   */
  test('discards an edit whose cell was scrolled out of view before the filter ran',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle, { scenario: 'tall' });

      await grid.goto();
      await grid.openEditorAndType(0, 0, 'EDITED');

      await grid.scrollToRow(60);

      // The edit survives a scroll - that is deliberate, long-standing behavior - so this is the
      // state the filter has to be applied from, not an incidental one.
      await expect.poll(() => grid.isRowRendered(0)).toBe(false);
      await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');

      await grid.filterToValues(0, ['A50']);

      await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);

      await expect.poll(() => grid.sourceRowCount()).toBe(100);
      await expect.poll(() => grid.sourceCell(0, 0)).toBe('A0');
      await expect.poll(() => grid.sourceCell(50, 0)).toBe('A50');
      expect(await grid.committedChangeCount()).toBe(0);
    });

  /**
   * `alter('remove_row')` shifts PHYSICAL indexes and emits a trimming-map change on the way, so the
   * captured record index can go stale. Core closes the editor only when the removed range covers
   * the highlighted row, so editing row 4 while row 1 is removed leaves the editor open with a
   * coordinate that is now past the end - which before the fix appended a record on the next commit.
   *
   * This pins the past-the-end shape only: the captured index no longer resolves, so the edit is
   * dropped and nothing is invented. The other stale shape - the captured index still resolves, but
   * to a different surviving record - is not covered here, and the fix does not claim to repair it.
   */
  test('never grows the data set when a row removal strands the editor past the last row',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(4, 0, 'EDITED');

      await grid.removeRow(1);

      await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);

      await grid.cell(0, 0).click();

      await expect.poll(() => grid.sourceRowCount()).toBe(4);
      await expect.poll(() => grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
      ]);
    });
});

/**
 * With `columnSorting` active a visual row index no longer equals its physical one, so a fix that
 * accidentally captured or resolved a VISUAL index still passes every case above. This case is the
 * one that separates the two: the record being edited sits at a visual index that belongs to a
 * different physical row, and the assertion is which physical record the value lands on.
 */
test.describe('a sorted index mapping under the trim', () => {
  /**
   * Sorted descending, visual 1 is physical 3 (`'A3'`). The filter then trims physical 0, 1 and 4,
   * leaving `'A3'` and `'A2'` at visual 0 and 1 - so the edited record moves up one slot and the
   * editor has to follow it. Before the fix the stale visual row 1 was still in range and the value
   * landed on `'A2'`, with no row-count change to betray it.
   */
  test('commits to the record being edited, not the one at the same visual index',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle, { sorting: true });

      await grid.goto();
      await grid.sortFirstColumnDescending();

      // The two index spaces genuinely differ here. Without this the case degrades into a plain
      // repeat of the unsorted moved-record case.
      await expect.poll(() => grid.toPhysicalRow(1)).toBe(3);

      await grid.openEditorAndType(1, 0, 'EDITED');

      await grid.filterToValues(0, ['A3', 'A2']);

      await expect.poll(() => grid.sawTrimmingCacheUpdate('row')).toBe(true);

      await expect.poll(() => grid.sourceRowCount()).toBe(5);
      await expect.poll(() => grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['EDITED', 'B3'],
        ['A4', 'B4'],
      ]);
    });
});

/**
 * A SEQUENCE change permutes the visual space without trimming anything: `columnSorting` and
 * `manualRowMove` report `indexesSequenceChanged` and leave `trimmedIndexesChanged` false. The
 * editor is stranded exactly as a trim strands it - it holds a visual index that now belongs to a
 * different record - so the same reconciliation has to cover both, and the row count never betrays
 * these because no record is added or removed.
 */
test.describe('a sequence change under an open editor', () => {
  /**
   * Sorting descending while `'A4'` is being edited moves that record from visual 4 to visual 0.
   * Before the gate covered sequence changes, the stale visual row 4 addressed `'A0'` and the edit
   * landed there - `['EDITED','A1','A2','A3','A4']`.
   */
  test('follows the record through a sort', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle, { sorting: true });

    await grid.goto();
    await grid.openEditorAndType(4, 0, 'EDITED');

    await grid.sortFirstColumnDescending();

    // Sorting trims nothing - this is the flag that a trimming-only gate does not react to.
    await expect.poll(() => grid.sawSequenceCacheUpdate('row')).toBe(true);
    expect(await grid.sawTrimmingCacheUpdate('row')).toBe(false);
    await expect.poll(() => grid.editorRow()).toBe(0);

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['A1', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['EDITED', 'B4'],
    ]);
    expect(await grid.sourceRowCount()).toBe(5);
  });

  /**
   * `manualRowMove` reaches the same state by a different plugin. Moving the edited record `'A0'`
   * down to index 3 leaves `'A1'` occupying visual 0, which is where the stale coordinate pointed.
   */
  test('follows the record through a row move', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.moveRow(0, 3);

    await expect.poll(() => grid.sawSequenceCacheUpdate('row')).toBe(true);
    // Same negative assertion as the sort case, so this cannot silently start passing for the
    // trimming reason instead of the sequence one.
    expect(await grid.sawTrimmingCacheUpdate('row')).toBe(false);
    await expect.poll(() => grid.editorRow()).toBe(3);

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([
      ['EDITED', 'B0'],
      ['A1', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['A4', 'B4'],
    ]);
    expect(await grid.sourceRowCount()).toBe(5);
  });
});

/**
 * A structural change - `alter()` inserting or removing rows - is the case the physical-index
 * approach gets backwards. It RENUMBERS the physical space, so the captured index goes stale while
 * the editor's visual coordinate stays correct; reconciling against the captured index then discards
 * a valid edit or rebinds onto the wrong record. Both cases below need a permutation active, because
 * unsorted the two index spaces shift together and the error cancels out.
 *
 * Core only closes the editor when the removed range covers the highlighted row (`core.ts`), so an
 * `alter()` elsewhere in the grid leaves the edit open and live.
 */
test.describe('a structural change while an editor is open', () => {
  /**
   * Sorted descending, visual 0 is physical 4 (`'A4'`). Removing visual row 4 removes `'A0'` - a
   * different record entirely - and `'A4'` is still at visual 0, so the edit must still commit onto
   * it. Reconciling against the captured index instead saw physical 4 fall out of range and dropped
   * the edit: `['A1','A2','A3','A4']` with the typing lost.
   */
  test('keeps a valid edit when an unrelated row is removed', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle, { sorting: true });

    await grid.goto();
    await grid.sortFirstColumnDescending();

    await expect.poll(() => grid.toPhysicalRow(0)).toBe(4);

    await grid.openEditorAndType(0, 0, 'EDITED');
    await grid.removeRow(4, 1);

    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([
      ['A1', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['EDITED', 'B4'],
    ]);
    expect(await grid.sourceRowCount()).toBe(4);
  });

  /**
   * The insert half. `'A4'` is at visual 0 and stays there, but every physical index at or above the
   * insertion point shifts up by one, so the captured index 4 now addresses `'A3'`. Reconciling
   * against it rebound the editor to visual 1 and committed onto `'A3'` - the exact corruption shape
   * this whole change exists to prevent.
   */
  test('commits to the right record when a row is inserted', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle, { sorting: true });

    await grid.goto();
    await grid.sortFirstColumnDescending();
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.insertRowAbove(4, 1);

    await expect.poll(() => grid.editorRow()).toBe(0);

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([
      [null, null],
      ['A0', 'B0'],
      ['A1', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['EDITED', 'B4'],
    ]);
  });
});

/**
 * An invariant guard, not a reproduction: a structural change that gets CANCELLED must leave the
 * reconciliation working for the rest of the edit.
 *
 * `Formulas` returns `false` from `beforeCreateRow` and `beforeRemoveRow` whenever HyperFormula
 * rejects the operation, and a cancelled insert fires `beforeCreateRow` with no `afterCreateRow` and
 * no cache update behind it (verified). Any design that armed on the `before` hook and disarmed on
 * the `after` one is therefore one re-prepare away from latching permanently, which would silently
 * stop reconciling and put the original corruption back.
 *
 * Discriminating on the physical index count sidesteps that entirely - a cancelled insert changes no
 * counts, so there is nothing to arm and nothing to strand. This case pins the invariant rather than
 * a failure: it also passes against the earlier hook-pair implementation, because an `alter()` is
 * followed by a re-prepare that happened to clear the latch. It exists so a future refactor back to
 * a hook-armed design has to prove the same property.
 */
test.describe('a structural change that gets vetoed', () => {
  test('leaves the reconciliation working for the rest of the edit', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.vetoRowCreation();

    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.insertRowAbove(0, 1);

    // The veto held, so nothing about the data changed - but `beforeCreateRow` did fire.
    expect(await grid.sourceRowCount()).toBe(5);
    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');

    // The edited record is trimmed away here, so the edit must be discarded rather than written
    // through a coordinate that now addresses `'A2'`.
    await grid.filterToValues(0, ['A2']);

    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceData()).toEqual(UNTOUCHED);
  });
});
