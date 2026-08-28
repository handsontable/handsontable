import { test, expect } from '../fixtures/test';
import { EditorTrimmedRowPage } from '../fixtures/pages/EditorTrimmedRowPage';

/**
 * A trimming index map (Filters, `trimRows`, `nestedRows`) collapses rows out of the visual space,
 * and the selection used to be left untouched: `core.ts` adjusted it for hidden indexes only. The
 * highlight could then keep a visual row the grid no longer had, and a write through that stale
 * coordinate made `applyChanges()` APPEND records to the data set.
 *
 * No editor takes part in any of these cases. Every write goes through a path that reads the
 * selection's own corners - a paste, or `populateFromArray` - which is what makes this a selection
 * defect rather than an editor one, and what `tests/e2e/editor-trimmed-row.spec.ts` does NOT cover.
 *
 * Each case asserts both halves: that the data did not grow, AND where the selection ended up. The
 * record count alone passes under a clamp, a deselect and a follow-the-record alike, so on its own
 * it pins nothing.
 */
test.describe('selection stranded by a trimming index map', () => {
  let grid: EditorTrimmedRowPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorTrimmedRowPage(page, theme, bundle);
    await grid.goto();
  });

  test('drops a selection a trim left past the last row, so a paste cannot append records', async() => {
    await grid.selectCell(3, 0);
    // Leaves A2 and A4 visible, so visual row 3 addresses nothing at all.
    await grid.trimRows([0, 1, 3]);

    expect(await grid.selected()).toBeUndefined();

    await grid.pasteIntoSelection('PASTED');

    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceData()).toEqual([
      ['A0', 'B0'],
      ['A1', 'B1'],
      ['A2', 'B2'],
      ['A3', 'B3'],
      ['A4', 'B4'],
    ]);
    expect(await grid.committedChangeCount()).toBe(0);
  });

  test('drops it for a Ctrl+Enter-style write through the selection corners too', async() => {
    await grid.selectCell(3, 0);
    await grid.trimRows([0, 1, 3]);
    await grid.populateFromSelection('POPULATED');

    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.committedChangeCount()).toBe(0);
  });

  test('drops it when the record survives further up but the coordinate is left out of range', async() => {
    await grid.selectCell(3, 0);
    // A3 stays visible, at visual row 1 - but the highlight still reads 3, and only two rows remain.
    await grid.trimRows([0, 1]);

    expect(await grid.selected()).toBeUndefined();

    await grid.pasteIntoSelection('PASTED');

    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.committedChangeCount()).toBe(0);
  });

  test('drops it when the trimmed record is gone while the coordinate stays in range', async() => {
    await grid.selectCell(1, 0);
    // Visual row 1 still exists afterwards - it holds A2 now. Only the captured record can tell
    // that A1 is gone, so this case is the one that proves the physical-index tracking works.
    await grid.trimRows([1]);

    expect(await grid.visibleRowCount()).toBe(4);
    expect(await grid.selected()).toBeUndefined();

    await grid.pasteIntoSelection('PASTED');

    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceCell(2, 0)).toBe('A2');
    expect(await grid.committedChangeCount()).toBe(0);
  });

  test('keeps a selection a trim touched neither by record nor by range', async() => {
    await grid.selectCell(3, 0);
    await grid.trimRows([4]);

    expect(await grid.selected()).toEqual([[3, 0, 3, 0]]);

    await grid.pasteIntoSelection('PASTED');

    // The write still lands on the record the user picked, and nothing is appended.
    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceCell(3, 0)).toBe('PASTED');
  });

  test('drops every layer when the active highlight is the stranded one', async() => {
    await grid.selectCell(0, 0);
    await grid.selectRangeWithFocusAt([3, 0, 3, 0], 0, 0);
    await grid.trimRows([0, 1, 3]);

    expect(await grid.selected()).toBeUndefined();
    expect(await grid.sourceRowCount()).toBe(5);
  });

  test('leaves the selection to Filters, which re-selects the highlighted column itself', async() => {
    await grid.selectCell(3, 0);
    await grid.filterToValues(0, ['A0']);

    // Filters reads the highlighted column BEFORE it writes the trimming map, so its own
    // re-selection survives the drop that the write triggers.
    expect(await grid.selected()).toEqual([[0, 0, 0, 0]]);
    expect(await grid.sourceRowCount()).toBe(5);
  });

  test('leaves no selection when a filter leaves no rows', async() => {
    await grid.selectCell(3, 0);
    await grid.filterToValues(0, ['nothing matches this']);

    expect(await grid.visibleRowCount()).toBe(0);
    expect(await grid.selected()).toBeUndefined();
  });

  test('does not touch the selection on a row insert or remove', async() => {
    await grid.selectCell(3, 0);
    // A structural change raises `trimmedIndexesChanged` exactly as a filter does. Only the size of
    // the physical space tells them apart, and without that discrimination the repair would read a
    // captured index the renumbering had just invalidated and deselect for no reason.
    await grid.insertRowAbove(0, 2);

    expect(await grid.selected()).toEqual([[5, 0, 5, 0]]);

    await grid.removeRow(0, 2);

    expect(await grid.selected()).toEqual([[3, 0, 3, 0]]);
  });

  test('drops a coordinate that addresses nothing even while an editor is open', async() => {
    await grid.openEditorAndType(3, 0, 'TYPED');
    // Two rows remain, so visual row 3 addresses nothing. An open editor does NOT exempt this
    // shape: `EditorManager` discards the stranded editor and would leave the highlight behind it,
    // and a paste through that highlight is what appends records.
    await grid.trimRows([0, 1, 3]);

    expect(await grid.selected()).toBeUndefined();

    await grid.pasteIntoSelection('PASTED');

    expect(await grid.sourceRowCount()).toBe(5);
  });

  test('keeps a still-addressable coordinate while an editor is open, so typing can continue', async() => {
    await grid.openEditorAndType(3, 0, 'TYPED');
    // Only the edited record is trimmed, so visual row 3 still addresses a cell - `A4` now. The
    // editor is discarded, and `EditorManager` deliberately keeps the selection there so the next
    // keystroke re-prepares against the record now under the cursor. A write lands on that real
    // record rather than appending, which is why this half is exempt.
    await grid.trimRows([3]);

    expect(await grid.selected()).toEqual([[3, 0, 3, 0]]);
    expect(await grid.sourceRowCount()).toBe(5);
  });

  test('judges the record by where it is now, not by where a sort left the captured index',
    async({ page, theme, bundle }) => {
      const sorted = new EditorTrimmedRowPage(page, theme, bundle, { sorting: true });

      await sorted.goto();
      await sorted.selectCell(1, 0);
      // Sorting permutes visual against physical without trimming anything, so the captured index
      // has to be re-read. Left stale it inverts the test: the record under the highlight is `A3`,
      // while the captured physical index still names `A1`.
      await sorted.sortFirstColumnDescending();

      // `A1` is trimmed, but it is NOT the highlighted record, so the selection has to survive.
      await sorted.trimRows([1]);

      expect(await sorted.selected()).toEqual([[1, 0, 1, 0]]);
    });

  test('drops the selection when a sort is followed by a trim of the highlighted record',
    async({ page, theme, bundle }) => {
      const sorted = new EditorTrimmedRowPage(page, theme, bundle, { sorting: true });

      await sorted.goto();
      await sorted.selectCell(1, 0);
      await sorted.sortFirstColumnDescending();
      // The mirror of the case above: `A3` IS the highlighted record after the sort, so trimming
      // it must drop the selection. A stale captured index would keep it, on a coordinate that now
      // holds a different record.
      await sorted.trimRows([3]);

      expect(await sorted.selected()).toBeUndefined();
    });

  test('keeps a selection whose row is merely hidden, since the record stays in the visual space', async() => {
    await grid.selectCell(3, 0);
    await grid.hideRows([0, 1, 3]);

    // Hiding is the reference behavior: the coordinate stays in range, the record stays under it,
    // and the write lands where the user put the selection.
    expect(await grid.selected()).toEqual([[3, 0, 3, 0]]);

    await grid.pasteIntoSelection('PASTED');

    expect(await grid.sourceRowCount()).toBe(5);
    expect(await grid.sourceCell(3, 0)).toBe('PASTED');
  });
});
