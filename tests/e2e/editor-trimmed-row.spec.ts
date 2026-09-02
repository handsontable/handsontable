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
   * Removing a row ABOVE the edited one is the case the reconciliation must keep its hands off.
   *
   * `dataMap.removeRow()` fires the cache update synchronously and `selection.shiftRows()` runs only
   * afterwards, so at handler time the editor still holds its pre-removal coordinate - which is now
   * past the last row and resolves to nothing. Treating that as "the record is gone" and discarding
   * would destroy a live edit, because the selection shift immediately behind it re-prepares the
   * editor on the right row and the value commits correctly. Core carries this across on its own;
   * the reconciliation's job here is to not get in the way.
   *
   * `'A4'` is being edited when row 1 disappears, so it lands at visual 3 and the edit belongs to it.
   */
  test('leaves an edit alone when a row above it is removed', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(4, 0, 'EDITED');

    await grid.removeRow(1);

    // Still live, and re-prepared onto the shifted row rather than discarded.
    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');
    await expect.poll(() => grid.editorRow()).toBe(3);
    await expect.poll(() => grid.editorText()).toBe('EDITED');

    await grid.cell(0, 0).click();

    await expect.poll(() => grid.sourceRowCount()).toBe(4);
    await expect.poll(() => grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['EDITED', 'B4'],
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
 * Discriminating on the cache update source sidesteps that entirely - a cancelled insert produces no
 * cache update, so there is nothing to arm and nothing to strand. This case pins the invariant rather than
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

/**
 * The COLUMN axis. No core plugin trims columns, so the trimming half of the repair is unreachable
 * there - but `manualColumnMove` permutes the column sequence and `alter('remove_col')` restructures
 * it, which are the two shapes the column arm of the repair exists for. Without these the captured
 * physical column, the column half of the recapture, and the column index count are all dead code.
 */
test.describe('an index-map change on the column axis', () => {
  /**
   * Moving column 0 to index 1 puts the edited cell at visual column 1. The editor has to follow it,
   * or the commit lands in column `'B'`.
   */
  test('follows the record through a column move', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(2, 0, 'EDITED');

    await grid.moveColumn(0, 1);

    await expect.poll(() => grid.sawSequenceCacheUpdate('column')).toBe(true);
    await expect.poll(() => grid.editorCol()).toBe(1);

    await grid.commitWithEnter();

    // Physical column 0 is still the one that was edited, wherever it now sits on screen.
    await expect.poll(() => grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['A1', 'B1'],
      ['EDITED', 'B2'],
      ['A3', 'B3'],
      ['A4', 'B4'],
    ]);
  });

  /**
   * Removing the OTHER column restructures the column space while the edited cell survives at the
   * same visual index. The edit must come through untouched - the column mirror of the row case.
   */
  test('keeps a valid edit when another column is removed', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(2, 0, 'EDITED');

    await grid.removeColumn(1);

    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([['A0'], ['A1'], ['EDITED'], ['A3'], ['A4']]);
  });
});

/**
 * Commit paths that read selection coordinates after an editor rebind caused by trimming.
 *
 * Both `DropdownEditor#finishEditing()` and Ctrl+Enter's `BaseEditor#saveValue()` use the active
 * selection. For a pure trim, the selection follows surviving physical records as the mapper
 * rebuilds. Sequence permutations keep their visual range because one rectangular range cannot
 * represent records that a move or sort makes non-contiguous.
 */
test.describe('commit paths that read the selection after trimming', () => {
  /**
   * Selecting an entire column uses `-1` as the range's row-header sentinel. When the editor's
   * record moves, only real visual coordinates may move; shifting the sentinel makes the selection
   * invalid.
   */
  test('preserves a whole-column selection when rows are trimmed',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectColumnWithFocusAndType(0, 0, 'EDITED');

      await expect.poll(() => grid.selected()).toEqual([[-1, 0, 4, 0]]);
      await expect.poll(() => grid.editorRow()).toBe(0);

      await grid.trimRows([3, 4]);

      await expect.poll(() => grid.selected()).toEqual([[-1, 0, 2, 0]]);
      await expect.poll(() => grid.isEntireColumnSelected()).toBe(true);
      await expect.poll(() => grid.editorRow()).toBe(0);

      await grid.commitWithEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['EDITED', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
      ]);
    });

  /**
   * Trimming a record out of a non-active layer must remove that layer instead of moving it onto a
   * neighboring record. The active layer and its pending edit still follow their surviving record.
   */
  test('drops unresolved layers without changing the source or firing selection hooks',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[0, 0, 1, 0], [4, 0, 4, 1]], 'EDITED');

      const beforeState = await page.evaluate(() => {
        const hot = (window as Window & {
          hot: {
            addHook(name: string, callback: () => void): void;
            getSelectedRange(): Array<{ from: { row: number; col: number }; to: { row: number; col: number };
              highlight: { row: number; col: number } }>;
            selection: {
              getActiveSelectionLayerIndex(): number; getSelectionSource(): string; markSource(source: string): void;
            };
          };
          selectionHookCalls: number;
        }).hot;

        hot.selection.markSource('editor-rebase-test');
        (window as Window & { selectionHookCalls: number }).selectionHookCalls = 0;
        hot.addHook('afterSelection', () => {
          (window as Window & { selectionHookCalls: number }).selectionHookCalls += 1;
        });

        return {
          activeLayer: hot.selection.getActiveSelectionLayerIndex(),
          source: hot.selection.getSelectionSource(),
          ranges: hot.getSelectedRange(),
        };
      });

      await grid.trimRows([0]);

      const afterState = await page.evaluate(() => {
        const hot = (window as Window & {
          hot: {
            getSelectedRange(): Array<{ from: { row: number; col: number }; to: { row: number; col: number };
              highlight: { row: number; col: number } }>;
            selection: { getActiveSelectionLayerIndex(): number; getSelectionSource(): string };
          };
          selectionHookCalls: number;
        }).hot;

        return {
          activeLayer: hot.selection.getActiveSelectionLayerIndex(),
          source: hot.selection.getSelectionSource(),
          ranges: hot.getSelectedRange(),
          selectionHookCalls: (window as Window & { selectionHookCalls: number }).selectionHookCalls,
        };
      });

      expect(beforeState).toEqual({
        activeLayer: 1,
        source: 'editor-rebase-test',
        ranges: [
          { from: { row: 0, col: 0 }, to: { row: 1, col: 0 }, highlight: { row: 0, col: 0 } },
          { from: { row: 4, col: 0 }, to: { row: 4, col: 1 }, highlight: { row: 4, col: 0 } },
        ],
      });
      expect(afterState).toEqual({
        activeLayer: 0,
        source: 'editor-rebase-test',
        ranges: [
          { from: { row: 3, col: 0 }, to: { row: 3, col: 1 }, highlight: { row: 3, col: 0 } },
        ],
        selectionHookCalls: 0,
      });
      expect(await grid.highlightedAreaCorners()).toEqual([[3, 0, 3, 1]]);
    });

  /**
   * `saveValue()` fills the ACTIVE range on `Ctrl+Enter`, so dropping a partially trimmed active
   * layer does not merely lose the highlight - it hands the commit to whichever layer inherits the
   * active slot. The user selected physical rows 1-3 and typed into row 3; trimming row 1 leaves
   * rows 2 and 3 selected. Dropping the layer instead filled physical row 4, from the other layer -
   * two records the user never opened an editor on.
   */
  test('commits to the surviving selected records when the active range loses a corner',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[4, 0, 4, 1], [3, 0, 1, 0]], 'EDITED');
      await grid.trimRows([1]);
      await grid.commitWithCtrlOrMetaEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['EDITED', 'B2'],
        ['EDITED', 'B3'],
        ['A4', 'B4'],
      ]);
    });

  /**
   * The shrink keeps the range describing the records the user selected, so the layer stays active
   * and the editor stays on its own record instead of being orphaned onto another layer.
   */
  test('shrinks the active range onto its surviving records rather than dropping it',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[4, 0, 4, 0], [1, 0, 0, 0]], 'EDITED');
      await grid.trimRows([0]);

      await expect.poll(() => grid.selected()).toEqual([[3, 0, 3, 0], [0, 0, 0, 0]]);
      await expect.poll(() => grid.activeSelectionLayer()).toBe(1);
      await expect.poll(() => grid.editorRow()).toBe(0);
      await expect.poll(() => grid.isEditorOpen()).toBe(true);
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
    });

  /**
   * The restored corners have to live in ONE index space. A corner whose record survived is rebased
   * through the post-update mapper; a corner whose record was trimmed used to fall back to the
   * visual slot it held BEFORE the update. When the same trim also removes records ABOVE the range,
   * those two spaces differ by exactly that many records, so the restored range slides off its
   * survivors - and `Ctrl+Enter`, which fills the active range, writes to the wrong ones.
   *
   * Physical rows 1-4 are selected with the focus on row 1. Trimming rows 0 and 1 leaves rows 2, 3
   * and 4 selected at visual 0-2. Mixing the spaces pinned `from` to the stale visual 1 and left
   * `to` at the rebased visual 2, dropping physical row 2 out of the fill.
   */
  test('keeps the active range on its survivors when the trim removes its focus and rows above it',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[1, 0, 4, 0]], 'EDITED');
      await grid.trimRows([0, 1]);

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 2, 0]]);

      await grid.typeOnSelection('AGAIN');

      await expect.poll(() => grid.isEditorOpen()).toBe(true);
      await grid.commitWithCtrlOrMetaEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['AGAIN', 'B2'],
        ['AGAIN', 'B3'],
        ['AGAIN', 'B4'],
      ]);
    });

  /**
   * The other half of the same index-space mix, and the severe one: with the trim removing more
   * records above the range than the range has survivors, the stale `from` slot lands BELOW the
   * rebased `to`, so the restored range covers records the trim merely slid into those visual slots.
   * Physical rows 2 and 3 are selected; trimming rows 0-2 leaves only physical row 3, but the range
   * used to span visual 0-1 - physical rows 3 AND 4, and row 4 was never selected.
   */
  test('does not widen the active range onto records the trim slid in behind it',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[2, 0, 3, 0]], 'EDITED');
      await grid.trimRows([0, 1, 2]);

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
      expect(await grid.highlightedAreaCorners()).toEqual([]);
      // The focus record is trimmed, so `EditorManager` discards the edit and nothing is written.
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
    });

  /**
   * With NO survivor left there is no post-update index to shrink onto, and the range parks on the
   * focus's pre-update slot, which this trim leaves in range - the next keystroke re-prepares
   * against the record now sitting there and writes to it, rather than appending. All three corners
   * take that one slot together: letting `to` keep its own stale slot spanned whatever now sits
   * between two independently stale corners - here physical row 4, which was never selected.
   */
  test('collapses a fully trimmed active range onto one parked cell',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[1, 0, 2, 0]], 'EDITED');
      await grid.watchHook('afterDeselect');
      await grid.trimRows([1, 2]);

      await expect.poll(() => grid.selected()).toEqual([[1, 0, 1, 0]]);
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
      // A parked selection is still a selection, so nothing is deselected.
      expect(await grid.hookCalls('afterDeselect')).toBe(0);
    });

  /**
   * The other end of the same rule. Trimming rows 0, 1 and 3 leaves two rows, so the focus's
   * pre-update slot - visual row 3 - addresses nothing at all, and the range is DROPPED rather than
   * clamped inward onto row 1, which the trim merely slid into view. A range parked there would be
   * repainted over a record the user never chose, and the next fill or paste would write into it:
   * the shape `Selection#deselectIfHighlightStranded()` drops for a selection with no editor, and
   * `selection-trimmed-row.spec.ts` pins from the other side.
   */
  test('drops a fully trimmed active range whose own slot the trim left out of range',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[3, 0, 3, 0]], 'EDITED');
      await grid.watchHook('afterDeselect');
      await grid.trimRows([0, 1, 3]);

      await expect.poll(() => grid.selected()).toBeUndefined();
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
      expect(await grid.sourceRowCount()).toBe(5);
      // The drop is a real deselection, and it is announced as one - `deselectIfHighlightStranded()`
      // does that for the same shape without an editor. It is announced AFTER the public
      // cache-update hooks, because `afterDeselect` closes the editor and closing it saves: the
      // untouched source above is what proves the pending edit was discarded rather than committed
      // through the coordinates this drop abandons.
      expect(await grid.hookCalls('afterDeselect')).toBe(1);
    });

  test('repaints a surviving multi-cell layer when the active layer is a single cell',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangesAndType([[2, 0, 3, 1], [4, 0, 4, 0]], 'EDITED');
      await grid.trimRows([0]);

      await expect.poll(() => grid.selected()).toEqual([[1, 0, 2, 1], [3, 0, 3, 0]]);
      await expect.poll(() => grid.activeSelectionLayer()).toBe(1);
      expect(await grid.highlightedAreaCorners()).toEqual([[1, 0, 2, 1], [3, 0, 3, 0]]);
    });

  test('does not widen a multi-cell selection when a moved row crosses it',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangeWithFocusAt([0, 0, 2, 0], 0, 0);
      await grid.typeOnSelection('EDITED');
      await grid.moveRow(4, 1);

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 2, 0]]);
      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
    });

  /**
   * `DropdownEditor#finishEditing()` rewrites the commit into a discard when the active range no
   * longer contains `(this.row, this.col)`. The rebind moves those coordinates and nothing moves the
   * selection, so `Enter` discards. On develop this appended two records and wrote `'EDITED'` onto
   * the second of them.
   */
  test('a dropdown edit commits to its record after a trim moves it',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle, { editor: 'dropdown' });

      await grid.goto();

      await grid.cell(4, 0).click();
      await grid.typeOnSelection('EDITED');

      await grid.trimRows([0, 1]);

      await expect.poll(() => grid.editorRow()).toBe(2);
      await expect.poll(() => grid.isEditorOpen()).toBe(true);

      await grid.commitWithEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['EDITED', 'B4'],
      ]);
    });

  /**
   * `BaseEditor#saveValue()` reads the SELECTION corners under `ctrlDown`, never the editor's own
   * coordinates. Ctrl+Enter only saves a multi-cell selection, because TextEditor uses that shortcut
   * to insert a newline for one selected cell.
   */
  test('a Ctrl+Enter commit writes to its record after a trim',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectRangeWithFocusAt([4, 0, 4, 1], 4, 0);
      await grid.typeOnSelection('EDITED');

      await grid.trimRows([0, 1]);

      await expect.poll(() => grid.editorRow()).toBe(2);
      await expect.poll(() => grid.isEditorOpen()).toBe(true);

      await grid.commitWithCtrlOrMetaEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['EDITED', 'EDITED'],
      ]);
    });
});

/**
 * `updateData()` swaps the whole physical space without closing an open editor - `core.ts` excludes
 * it from the teardown list on purpose - and it is the path every wrapper takes when its `data` prop
 * changes. The mapper's cache-update source lets the repair preserve the edit against the NEW data
 * set rather than discarding it.
 */
test.describe('a data swap under an open editor', () => {
  /**
   * The same swap at the SAME length routes to the rearrangement repair, which resolves the captured index against a data set
   * that shares nothing with the one the edit was typed into. A replaced `data` prop of unchanged
   * length is the dominant wrapper shape, so the two branches both need pinning.
   */
  test('keeps the edit when the swap does not change the row count',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(1, 0, 'EDITED');

      await grid.updateData([
        ['N0', 'M0'], ['N1', 'M1'], ['N2', 'M2'], ['N3', 'M3'], ['N4', 'M4'],
      ]);

      await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');
      await expect.poll(() => grid.editorRow()).toBe(1);

      await grid.commitWithEnter();

      await expect.poll(() => grid.sourceData()).toEqual([
        ['N0', 'M0'],
        ['EDITED', 'M1'],
        ['N2', 'M2'],
        ['N3', 'M3'],
        ['N4', 'M4'],
      ]);
      expect(await grid.sourceRowCount()).toBe(5);
    });

  test('keeps the edit against the new data set', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(1, 0, 'EDITED');

    await grid.updateData([['N0', 'M0'], ['N1', 'M1'], ['N2', 'M2']]);

    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([
      ['N0', 'M0'],
      ['EDITED', 'M1'],
      ['N2', 'M2'],
    ]);
    expect(await grid.sourceRowCount()).toBe(3);
  });
});

/**
 * Two states around the edges of the repair: an editor that exists but has not been typed into, and
 * the public hook being fired by hand.
 */
test.describe('edges of the repair', () => {
  /**
   * Rebuilding a selection against an empty visual grid must clear it. A fallback visual index of
   * zero would otherwise leave an addressable-looking selection that a later keystroke can append to.
   */
  test('deselects when a trim removes every row while an editor is open',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(0, 0, 'EDITED');
      await grid.trimRows([0, 1, 2, 3, 4]);

      await expect.poll(() => grid.selected()).toBeUndefined();
      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual(UNTOUCHED);
    });

  /**
   * Clicking a cell runs `prepareEditor()`, so an editor exists in `VIRGIN` holding that cell's
   * coordinates, `TD`, `prop`, `originalValue` and cell meta - and nothing re-prepares it when a trim
   * moves the visual space underneath. `openEditor()` skips `prepareEditor()` while a reference
   * exists, so the first keystroke would otherwise begin editing against the trimmed-away record's
   * state.
   *
   * `originalValue` is the read that shows it: visual row 3 displays `'A4'` after row 0 is trimmed,
   * so a correctly re-prepared editor reports `'A4'`. Reporting `'A3'` means the stale meta survived,
   * and with it that record's `readOnly`, `validator` and `type`.
   *
   * The target record is NOT what changes here. The selection never moved, so the write goes to the
   * row the user can see highlighted either way - this is about the editor agreeing with it.
   */
  test('re-prepares a prepared-but-untyped editor when a trim moves its cell',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();

      await grid.cell(3, 0).click();
      await grid.trimRows([0]);

      await grid.typeOnSelection('EDITED');

      expect(await grid.editorOriginalValue()).toBe('A4');

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
   * `afterRowSequenceCacheUpdate` is public, so anyone can fire it through `runHooks()` with no
   * payload. The handler reads two flags off that payload, and an unguarded read throws - which also
   * skips the hidden-cell guard that runs behind it.
   */
  test('survives the public hook being fired without a payload', async({ page, theme, bundle }) => {
    const grid = new EditorTrimmedRowPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditorAndType(1, 0, 'EDITED');

    expect(await grid.fireCacheUpdateHookWithoutPayload()).toBeNull();

    // The edit is untouched, and still commits where it was typed.
    await expect.poll(() => grid.editorState()).toBe('STATE_EDITING');

    await grid.commitWithEnter();

    await expect.poll(() => grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['EDITED', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['A4', 'B4'],
    ]);
  });
});

/**
 * A removal that `Selection#shiftRows()` declines to shift. It only shifts a range whose outer
 * top-start corner is at or below the removed row, and `core.ts` only closes the editor when the
 * removed range covers the HIGHLIGHT - so a focus moved below that corner (Enter or Tab inside a
 * multi-cell selection) leaves the editor sitting past the last row with nothing re-preparing it.
 *
 * The commit through those coordinates is the row-appending corruption. This is the one shape where
 * the repair cannot recover the record: the renumbering invalidated the captured index and the
 * editor's own coordinates address nothing, so there is nothing left to follow. What it can do is
 * refuse to write, which is what the next index-map change does.
 */
test.describe('a removal that strands the editor', () => {
  test('discards rather than appending when a later filter would commit through it',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();

      await grid.selectRangeWithFocusAt([0, 0, 4, 0], 4, 0);
      await grid.typeOnSelection('EDITED');

      // Row 1 goes; the highlight is not inside the removed range and the range's top-start corner
      // is above it, so neither `closeEditor()` nor `shiftRows()` touches the editor.
      await grid.removeRow(1);

      await expect.poll(() => grid.editorRow()).toBe(4);
      expect(await grid.sourceRowCount()).toBe(4);

      // On develop this filter commits through visual row 4 and appends four records.
      await grid.filterToValues(0, ['A2']);

      expect(await grid.committedChangeCount()).toBe(0);
      expect(await grid.sourceRowCount()).toBe(4);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
      ]);
    });
});

/**
 * An index-map change fired from INSIDE the `alter()` that is still running.
 *
 * `alter()` emits its cache update before `selection.shiftRows()`, so in between the editor sits on
 * a coordinate that resolves to nothing while a `prepareEditor()` is still coming. A plugin trimming
 * from `afterRemoveRow` lands exactly there. Reading the editor as unusable at that moment and
 * discarding would throw away an edit that was about to commit correctly – `develop` commits it, so
 * doing anything else here is a regression rather than a gap.
 */
test.describe('an index-map change nested inside a removal', () => {
  test('keeps an edit that the pending re-prepare is about to rescue',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditorAndType(4, 0, 'EDITED');

      // Removes `'A0'`, and trims what is then physical row 0 (`'A1'`) from inside `afterRemoveRow`.
      await grid.removeRowTrimmingFrom(0, 0);

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
});

/**
 * Whether a layer's extent TRACKS THE GRID rather than naming records decides whether the restore
 * re-pins it to the axis boundaries or shrinks it onto survivors, and it is measured at capture
 * time from the range itself.
 *
 * Neither state set can answer it. `selectedByRowHeader` / `selectedByColumnHeader` are written only
 * when a header is actually rendered - `selectAll()` writes `selectedByColumnHeader` only when
 * `rowFrom < 0`, and with the default `colHeaders: false` that is never, so `Ctrl+A` did not
 * register as grid-tracking at all. And both those sets and the `…ExtentSpansGrid` pair are STICKY:
 * they survive a `Shift+Up` that shrinks the selection, so reading either would grow a shrunk
 * selection back to the whole column.
 */
test.describe('a grid-tracking extent through a restore', () => {
  /**
   * An UNTRIM is the only shape that separates re-pinning from shrinking. On a removal the two agree
   * by construction - a select-all's span covers every record, so its surviving records ARE the
   * whole remaining grid - which is why this case is written against rows coming back.
   */
  test('re-pins a select-all onto the rows an untrim brought back',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.trimRows([1, 3]);
      await grid.selectEverythingWithoutHeaders();
      await grid.listenAndType('EDITED');
      // The select-all was laid over three records; five are visible now. A range shrunk onto the
      // captured span would still cover only three of them, and the select-all would silently stop
      // meaning "everything".
      await grid.untrimRows([1, 3]);

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 4, 1]]);

      // `Ctrl+Enter` fills the active range, so the range this restore produced is what decides
      // where the pending edit lands.
      await grid.commitWithCtrlOrMetaEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['EDITED', 'EDITED'],
        ['EDITED', 'EDITED'],
        ['EDITED', 'EDITED'],
        ['EDITED', 'EDITED'],
        ['EDITED', 'EDITED'],
      ]);
    });

  test('does not grow a shrunk select-all back over the row it excluded',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.selectEverythingWithoutHeaders();
      // Shift+Up: rows 0-3 now, and row 4 is deliberately outside the selection. The layer's
      // grid-tracking flag is sticky and still set, so only the geometry knows it was shrunk.
      await grid.shrinkSelectionUpwards();
      await grid.listenAndType('EDITED');
      await grid.trimRows([0]);

      // Rows 1-3 survive as visual 0-2 of the four that remain. Re-pinning to the axis boundaries
      // would restore 0-3 instead, silently taking row 4 back in.
      await expect.poll(() => grid.selected()).toEqual([[0, 0, 2, 1]]);

      // The trim took the focus's own record, so `EditorManager` discarded the pending edit - the
      // fill below is a fresh gesture, and it writes the new focus's value (`A1`). What it proves is
      // the RANGE it writes through: rows 1-3 and not row 4, which a re-pinned selection would have
      // taken back in.
      await grid.commitWithCtrlOrMetaEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['A1', 'A1'],
        ['A1', 'A1'],
        ['A1', 'A1'],
        ['A4', 'B4'],
      ]);
    });

  test('does not re-pin a drag-selected range that merely reached both ends of the grid',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.trimRows([1, 3]);
      // Geometrically this covers every visible row, but it carries no grid-tracking flag: the user
      // dragged over three records. Re-pinning it would make an untrim grow it onto the two records
      // that came back, which the user never selected.
      await grid.selectRangeAndType([0, 0, 2, 0], 'EDITED');
      await grid.untrimRows([1, 3]);

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

      await grid.commitWithEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['EDITED', 'B0'],
        ['A1', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
      ]);
    });
});

/**
 * `IndexMapper` raises `trimmedIndexesChanged` for ANY trimming-map write, so clearing a filter or
 * calling `untrimRow()` reaches the restore exactly as a trim does. The survivors of a removal stay
 * contiguous, which is what lets a shrunk range still be one `CellRange` - but a record REVEALED
 * between two corners lands inside the rectangle they describe, and no `CellRange` can exclude it.
 */
test.describe('a trimming update that reveals records', () => {
  test('does not widen the active range onto a record an untrim revealed between its corners',
    async({ page, theme, bundle }) => {
      const grid = new EditorTrimmedRowPage(page, theme, bundle);

      await grid.goto();
      await grid.trimRows([2]);
      // Visual 1-2 is physical 1 and 3 while physical 2 is trimmed away.
      await grid.selectRangesAndType([[1, 0, 2, 0]], 'EDITED');
      await grid.untrimRows([2]);

      // Physical 2 reappears between the selected records. The range collapses onto its focus rather
      // than covering a record the user never selected - `A2` would otherwise be inside the range a
      // fill writes through.
      await expect.poll(() => grid.selected()).toEqual([[1, 0, 1, 0]]);

      // Plain Enter, because the range is now a single cell and `Ctrl+Enter` inserts a line break
      // there rather than filling. The edit still has to land on the record it was typed into.
      await grid.commitWithEnter();

      expect(await grid.sourceRowCount()).toBe(5);
      expect(await grid.sourceData()).toEqual([
        ['A0', 'B0'],
        ['EDITED', 'B1'],
        ['A2', 'B2'],
        ['A3', 'B3'],
        ['A4', 'B4'],
      ]);
    });
});
