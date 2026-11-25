import { toFinalIndex } from '../restoredCells';
import type { JournalOp } from '../../../dataMap/dataJournal';

const cells = (): JournalOp => ({ type: 'cells', changes: [] }) as unknown as JournalOp;

const metaRows = (insert: boolean, physicalRow: number, amount: number, movesData?: boolean): JournalOp => ({
  type: 'metaRows',
  insert,
  physicalRow,
  amount,
  metas: [],
  ...(movesData ? { movesData } : {}),
});

describe('UndoRedo restored cells: rows moved with their data', () => {
  describe('a cell write recorded after the move', () => {
    const journal = [metaRows(false, 1, 1, true), metaRows(true, 3, 1, true), cells()];

    it('maps a row the move shifted up back to its row before the step on undo', () => {
      expect(toFinalIndex(journal, 2, 1, 'row', 'undo')).toBe(2);
      expect(toFinalIndex(journal, 2, 2, 'row', 'undo')).toBe(3);
    });

    it('maps the moved row back to the row it was taken from on undo', () => {
      expect(toFinalIndex(journal, 2, 3, 'row', 'undo')).toBe(1);
    });

    it('leaves a row above the move where it is', () => {
      expect(toFinalIndex(journal, 2, 0, 'row', 'undo')).toBe(0);
    });

    it('keeps the row on redo, which restores the shape the write was recorded in', () => {
      expect(toFinalIndex(journal, 2, 1, 'row', 'redo')).toBe(1);
      expect(toFinalIndex(journal, 2, 3, 'row', 'redo')).toBe(3);
    });

    it('leaves the column axis alone', () => {
      expect(toFinalIndex(journal, 2, 1, 'column', 'undo')).toBe(1);
    });
  });

  describe('a cell write recorded before the move', () => {
    const journal = [cells(), metaRows(false, 1, 2, true), metaRows(true, 2, 2, true)];

    it('maps the moved rows to the rows they land on on redo', () => {
      expect(toFinalIndex(journal, 0, 1, 'row', 'redo')).toBe(2);
      expect(toFinalIndex(journal, 0, 2, 'row', 'redo')).toBe(3);
    });

    it('maps a row the move shifted up to its row after the step on redo', () => {
      expect(toFinalIndex(journal, 0, 3, 'row', 'redo')).toBe(1);
    });
  });

  it('does not map through meta rows shifted without their data', () => {
    const journal = [metaRows(false, 1, 1), metaRows(true, 3, 1), cells()];

    expect(toFinalIndex(journal, 2, 1, 'row', 'undo')).toBe(1);
    expect(toFinalIndex(journal, 2, 3, 'row', 'undo')).toBe(3);
  });

  it('reports a row inserted by a move whose removal is not next to it as missing before the step', () => {
    const journal = [metaRows(true, 3, 1, true), cells()];

    expect(toFinalIndex(journal, 1, 3, 'row', 'undo')).toBeNull();
  });
});
