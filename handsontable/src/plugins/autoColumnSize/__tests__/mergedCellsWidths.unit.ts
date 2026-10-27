import {
  MergedCellsWidths,
  isMultiColumnMerge,
  type MergedCellArea,
  type MergedCellsWidthsHost,
} from '../mergedCellsWidths';

interface FakeGrid {
  areas: MergedCellArea[];
  baseWidths: number[];
  content: Map<string, number>;
  hiddenRows: Set<number>;
  hiddenColumns: Set<number>;
  measured: Array<Array<{ column: number, texts: Array<{ row: number, value: unknown }> }>>;
  areaReads: number;
  textReads: number;
}

/**
 * Builds a tracker over a fake grid whose visual and physical indexes are the same. A column renders
 * with its base width or the tracker's demand, whichever is larger. A hidden column keeps its width,
 * the way a column CollapsibleColumns hides does, so the tracker has to skip it on its own.
 *
 * @param {Partial<FakeGrid>} grid The grid's state.
 * @returns {object}
 */
function createTracker(grid: Partial<FakeGrid>) {
  const state: FakeGrid = {
    areas: [],
    baseWidths: [],
    content: new Map(),
    hiddenRows: new Set(),
    hiddenColumns: new Set(),
    measured: [],
    areaReads: 0,
    textReads: 0,
    ...grid,
  };
  let tracker: MergedCellsWidths | null = null;
  const host: MergedCellsWidthsHost = {
    getMergedAreas: () => {
      state.areaReads += 1;

      return state.areas;
    },
    isRowHidden: row => state.hiddenRows.has(row),
    isColumnHidden: column => state.hiddenColumns.has(column),
    toPhysicalRow: row => row,
    toPhysicalColumn: column => column,
    getColumnWidth: column => Math.max(state.baseWidths[column] ?? 50, tracker?.getWidth(column) ?? 0),
    // A text is its width here, so the measurement is the largest value.
    formatCellText: (row, column) => {
      state.textReads += 1;

      return state.content.get(`${row}:${column}`) ?? 0;
    },
    measureTexts: (groups) => {
      state.measured.push(groups);

      return new Map(groups.map(({ column, texts }) => [
        column,
        Math.max(...texts.map(({ value }) => Number(value))),
      ]));
    },
  };

  tracker = new MergedCellsWidths(host);

  return { tracker, state };
}

describe('MergedCellsWidths', () => {
  it('should treat only a colspan above 1 as a merge spanning several columns', () => {
    expect(isMultiColumnMerge(2)).toBe(true);
    expect(isMultiColumnMerge('3')).toBe(true);
    expect(isMultiColumnMerge(1)).toBe(false);
    expect(isMultiColumnMerge(undefined)).toBe(false);
  });

  it('should give the first column what the other spanned columns lack', () => {
    const { tracker } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      baseWidths: [50, 100],
      content: new Map([['0:0', 400]]),
    });

    tracker.markWidthsChanged();

    expect(tracker.fit()).toBe(true);
    expect(tracker.getWidth(0)).toBe(300);
    expect(tracker.getWidth(1)).toBeUndefined();
  });

  it('should record no demand when the spanned columns are already wide enough', () => {
    const { tracker } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      baseWidths: [50, 400],
      content: new Map([['0:0', 300]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBeUndefined();
  });

  it('should not fit, nor read the merges, until something it depends on changed', () => {
    const { tracker, state } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      content: new Map([['0:0', 400]]),
    });

    expect(tracker.fit()).toBe(false);
    expect(state.areaReads).toBe(0);
    expect(state.measured).toHaveLength(0);

    tracker.markWidthsChanged();
    tracker.fit();
    tracker.markWidthsChanged();

    expect(tracker.fit()).toBe(false);
    // The text of an unchanged merge is measured once.
    expect(state.measured).toHaveLength(1);
  });

  it('should measure a merge again when the text of its first column was invalidated', () => {
    const { tracker, state } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      content: new Map([['0:0', 400]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();
    state.content.set('0:0', 200);
    tracker.invalidateColumn(0);

    expect(tracker.fit()).toBe(true);
    expect(tracker.getWidth(0)).toBe(150);
    expect(state.measured).toHaveLength(2);
  });

  it('should read again only the text of the merge whose cell was invalidated', () => {
    const { tracker, state } = createTracker({
      areas: [
        { row: 0, col: 0, rowspan: 1, colspan: 2 },
        { row: 1, col: 0, rowspan: 1, colspan: 2 },
        { row: 2, col: 0, rowspan: 1, colspan: 2 },
      ],
      content: new Map([['0:0', 400], ['1:0', 200], ['2:0', 100]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(state.textReads).toBe(3);

    state.content.set('0:0', 150);
    tracker.invalidateCell(0, 0);
    tracker.fit();

    expect(state.textReads).toBe(4);
    expect(tracker.getWidth(0)).toBe(150);
  });

  it('should re-measure a group from its kept texts when a row of it is hidden or shown', () => {
    const { tracker, state } = createTracker({
      areas: [
        { row: 0, col: 0, rowspan: 1, colspan: 2 },
        { row: 1, col: 0, rowspan: 1, colspan: 2 },
      ],
      content: new Map([['0:0', 400], ['1:0', 200]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();
    state.hiddenRows.add(0);
    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBe(150);

    state.hiddenRows.delete(0);
    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBe(350);
    expect(state.textReads).toBe(2);
    expect(state.measured).toHaveLength(3);
  });

  it('should read every text again after it was marked stale', () => {
    const { tracker, state } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      content: new Map([['0:0', 400]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();
    tracker.markStale();
    tracker.fit();

    expect(state.textReads).toBe(2);
  });

  it('should not subtract a spanned column that is hidden, whatever hides it', () => {
    const { tracker } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 4 }],
      baseWidths: [50, 50, 50, 50],
      content: new Map([['0:0', 400]]),
      hiddenColumns: new Set([2, 3]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBe(350);
  });

  it('should resolve a merge that starts inside another one\'s span first', () => {
    // A spans columns 0-1 and B spans columns 1-2. A needs column 1 as B leaves it.
    const { tracker } = createTracker({
      areas: [
        { row: 0, col: 0, rowspan: 1, colspan: 2 },
        { row: 1, col: 1, rowspan: 1, colspan: 2 },
      ],
      baseWidths: [50, 50, 50],
      content: new Map([['0:0', 500], ['1:1', 300]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(1)).toBe(250);
    expect(tracker.getWidth(0)).toBe(250);
  });

  it('should keep the largest demand of merges that start in one column with different spans', () => {
    const { tracker, state } = createTracker({
      areas: [
        { row: 0, col: 0, rowspan: 1, colspan: 2 },
        { row: 1, col: 0, rowspan: 1, colspan: 3 },
      ],
      baseWidths: [50, 50, 50],
      content: new Map([['0:0', 200], ['1:0', 400]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBe(300);
    // Each span is measured on its own, since one measurement holds one column per index.
    expect(state.measured).toHaveLength(2);
  });

  it('should put the demand on the first visible column of the span', () => {
    const { tracker } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }],
      baseWidths: [50, 50, 50],
      content: new Map([['0:0', 400]]),
      hiddenColumns: new Set([0]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBeUndefined();
    expect(tracker.getWidth(1)).toBe(350);
  });

  it('should ignore a merge whose rows are all hidden', () => {
    const { tracker, state } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      content: new Map([['0:0', 400]]),
      hiddenRows: new Set([0]),
    });

    tracker.markWidthsChanged();
    tracker.fit();

    expect(tracker.getWidth(0)).toBe(350);

    state.hiddenRows.add(1);
    tracker.markStale();
    tracker.fit();

    expect(tracker.getWidth(0)).toBeUndefined();
    // The merge still exists, so a change that shows its rows again must still be able to reach a fit.
    expect(tracker.mayHaveMultiColumnMerges()).toBe(true);
  });

  it('should drop the demand of a column that no merge is drawn from any more', () => {
    const { tracker, state } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      content: new Map([['0:0', 400]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();
    state.areas = [];
    tracker.markWidthsChanged();

    expect(tracker.fit()).toBe(true);
    expect(tracker.getWidth(0)).toBeUndefined();
  });

  it('should drop the demand when the spanned columns grow wide enough', () => {
    const { tracker, state } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      baseWidths: [50, 50],
      content: new Map([['0:0', 400]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();
    state.baseWidths[1] = 500;
    tracker.markWidthsChanged();

    expect(tracker.fit()).toBe(true);
    expect(tracker.getWidth(0)).toBeUndefined();
  });

  it('should answer whether merges spanning several columns may exist', () => {
    const { tracker, state } = createTracker({});

    expect(tracker.mayHaveMultiColumnMerges()).toBe(false);

    tracker.markMergesChanged(0);

    expect(tracker.mayHaveMultiColumnMerges()).toBe(true);

    state.areas = [{ row: 0, col: 0, rowspan: 2, colspan: 1 }];
    tracker.fit();

    expect(tracker.mayHaveMultiColumnMerges()).toBe(false);
  });

  it('should forget every demand on clear', () => {
    const { tracker } = createTracker({
      areas: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      content: new Map([['0:0', 400]]),
    });

    tracker.markWidthsChanged();
    tracker.fit();
    tracker.clear();

    expect(tracker.getWidth(0)).toBeUndefined();
    expect(tracker.mayHaveMultiColumnMerges()).toBe(false);
  });
});
