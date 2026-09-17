import {
  getMouseSingleScrollTarget,
  getRenderedRowHeight,
  isColumnOversized,
  isLargerThanViewport,
  isRowOversized,
} from '../scrollStrategies/singleScroll';

// Minimal Core stub for `isColumnOversized` / `isRowOversized`.
function createOversizedHot({
  colWidth = 400,
  viewportWidth = 200,
  rowHeight = 400,
  viewportHeight = 200,
  fixedColumnsStart = 0,
  fixedRowsTop = 0,
  fixedRowsBottom = 0,
  totalRows = 10,
  renderableRow = 0,
} = {}) {
  return {
    getColWidth: () => colWidth,
    getSettings: () => ({ fixedColumnsStart, fixedRowsTop, fixedRowsBottom }),
    countRows: () => totalRows,
    rowIndexMapper: {
      getRenderableFromVisualIndex: () => renderableRow,
    },
    view: {
      getViewportWidth: () => viewportWidth,
      getViewportHeight: () => viewportHeight,
      _wt: {
        wtTable: {
          getRowHeight: () => rowHeight,
        },
      },
    },
  };
}

describe('getMouseSingleScrollTarget', () => {
  it('should scroll both axes when the cell is not last-partial on either edge', () => {
    expect(getMouseSingleScrollTarget({
      row: 2,
      col: 3,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toEqual({ row: 2, col: 3 });
  });

  it('should skip a last-partial column when only the row is oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 0,
      col: 5,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 5,
      isRowLargerThanViewport: true,
      isColumnLargerThanViewport: false,
    })).toEqual({ row: 0, verticalSnap: 'top' });
  });

  it('should skip all scrolling when a last-partial column is not oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 0,
      col: 5,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 5,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toBeNull();
  });

  it('should skip a last-partial row when only the column is oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 0,
      lastPartiallyVisibleRow: 5,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: true,
    })).toEqual({ col: 0, horizontalSnap: 'start' });
  });

  it('should skip all scrolling when a last-partial row is not oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 0,
      lastPartiallyVisibleRow: 5,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toBeNull();
  });

  it('should skip all scrolling for a one-column last-partial list click below the fold', () => {
    expect(getMouseSingleScrollTarget({
      row: 4,
      col: 0,
      lastPartiallyVisibleRow: 3,
      lastPartiallyVisibleColumn: 0,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toBeNull();
  });

  it('should start-snap a last-partial row when measured height makes the row oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 0,
      lastPartiallyVisibleRow: 5,
      lastPartiallyVisibleColumn: 2,
      isRowLargerThanViewport: true,
      isColumnLargerThanViewport: false,
    })).toEqual({ row: 5, col: 0, verticalSnap: 'top' });
  });

  it('should force start-snap on an oversized axis that is not last-partial', () => {
    expect(getMouseSingleScrollTarget({
      row: 2,
      col: 3,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: true,
    })).toEqual({ row: 2, col: 3, horizontalSnap: 'start' });
  });

  it('should skip scrolling when both last-partial axes are not oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 5,
      lastPartiallyVisibleRow: 5,
      lastPartiallyVisibleColumn: 5,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toBeNull();
  });

  it('should start-snap both last-partial axes when both are oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 5,
      lastPartiallyVisibleRow: 5,
      lastPartiallyVisibleColumn: 5,
      isRowLargerThanViewport: true,
      isColumnLargerThanViewport: true,
    })).toEqual({
      row: 5,
      col: 5,
      horizontalSnap: 'start',
      verticalSnap: 'top',
    });
  });
});

describe('isLargerThanViewport', () => {
  it('should treat a missing provided height as not oversized', () => {
    expect(isLargerThanViewport(undefined, 200)).toBe(false);
  });

  it('should treat a measured content-tall height as oversized', () => {
    expect(isLargerThanViewport(400, 200)).toBe(true);
  });

  it('should not treat a size equal to the viewport as oversized', () => {
    expect(isLargerThanViewport(200, 200)).toBe(false);
  });

  it('should not treat a non-zero size as oversized when the viewport is 0', () => {
    expect(isLargerThanViewport(50, 0)).toBe(false);
    expect(isLargerThanViewport(400, 0)).toBe(false);
  });
});

describe('getRenderedRowHeight', () => {
  it('should read Walkontable row height at the renderable index', () => {
    const getRowHeight = jest.fn().mockReturnValue(400);
    const getRenderableFromVisualIndex = jest.fn().mockReturnValue(3);
    const hot = {
      rowIndexMapper: { getRenderableFromVisualIndex },
      view: { _wt: { wtTable: { getRowHeight } } },
    };

    expect(getRenderedRowHeight(hot, 1)).toBe(400);
    expect(getRenderableFromVisualIndex).toHaveBeenCalledWith(1);
    expect(getRowHeight).toHaveBeenCalledWith(3);
  });

  it('should return undefined when the visual row is not renderable', () => {
    const getRowHeight = jest.fn();
    const hot = {
      rowIndexMapper: { getRenderableFromVisualIndex: () => null },
      view: { _wt: { wtTable: { getRowHeight } } },
    };

    expect(getRenderedRowHeight(hot, 1)).toBeUndefined();
    expect(getRowHeight).not.toHaveBeenCalled();
  });
});

describe('isColumnOversized', () => {
  it('should treat a frozen start column as not oversized even when it is wider than the viewport', () => {
    const hot = createOversizedHot({ fixedColumnsStart: 2 });

    expect(isColumnOversized(hot, 0)).toBe(false);
    expect(isColumnOversized(hot, 1)).toBe(false);
  });

  it('should treat the first scrollable column as oversized when it is wider than the viewport', () => {
    const hot = createOversizedHot({ fixedColumnsStart: 2 });

    expect(isColumnOversized(hot, 2)).toBe(true);
  });

  it('should treat a wide column as oversized when no columns are frozen', () => {
    const hot = createOversizedHot({ fixedColumnsStart: 0 });

    expect(isColumnOversized(hot, 0)).toBe(true);
  });
});

describe('isRowOversized', () => {
  it('should treat a frozen top row as not oversized even when it is taller than the viewport', () => {
    const hot = createOversizedHot({ fixedRowsTop: 2 });

    expect(isRowOversized(hot, 0)).toBe(false);
    expect(isRowOversized(hot, 1)).toBe(false);
  });

  it('should treat a frozen bottom row as not oversized even when it is taller than the viewport', () => {
    const hot = createOversizedHot({ fixedRowsBottom: 2, totalRows: 10 });

    expect(isRowOversized(hot, 8)).toBe(false);
    expect(isRowOversized(hot, 9)).toBe(false);
  });

  it('should treat the first scrollable row as oversized when it is taller than the viewport', () => {
    const hot = createOversizedHot({ fixedRowsTop: 2, fixedRowsBottom: 2, totalRows: 10 });

    expect(isRowOversized(hot, 2)).toBe(true);
    expect(isRowOversized(hot, 7)).toBe(true);
  });

  it('should treat a tall row as oversized when no rows are frozen', () => {
    const hot = createOversizedHot({ fixedRowsTop: 0, fixedRowsBottom: 0 });

    expect(isRowOversized(hot, 0)).toBe(true);
  });

  it('should not treat a tall row as oversized when the viewport height is 0', () => {
    const hot = createOversizedHot({ viewportHeight: 0 });

    expect(isRowOversized(hot, 0)).toBe(false);
  });
});

describe('getMouseSingleScrollTarget with frozen oversized cells', () => {
  it('should start-snap only the scrollable axis when the other axis is a frozen oversized cell', () => {
    const hot = createOversizedHot({ fixedColumnsStart: 2 });

    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 0,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: isRowOversized(hot, 5),
      isColumnLargerThanViewport: isColumnOversized(hot, 0),
    })).toEqual({ row: 5, col: 0, verticalSnap: 'top' });
  });

  it('should start-snap only the scrollable column when the row is a frozen oversized cell', () => {
    const hot = createOversizedHot({ fixedRowsTop: 2 });

    expect(getMouseSingleScrollTarget({
      row: 0,
      col: 3,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: isRowOversized(hot, 0),
      isColumnLargerThanViewport: isColumnOversized(hot, 3),
    })).toEqual({ row: 0, col: 3, horizontalSnap: 'start' });
  });

  it('should start-snap only the scrollable column when the row is a frozen-bottom oversized cell', () => {
    const hot = createOversizedHot({ fixedRowsBottom: 2, totalRows: 10 });

    expect(getMouseSingleScrollTarget({
      row: 9,
      col: 3,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: isRowOversized(hot, 9),
      isColumnLargerThanViewport: isColumnOversized(hot, 3),
    })).toEqual({ row: 9, col: 3, horizontalSnap: 'start' });
  });

  it('should skip the whole move when a last-partial frozen column is treated as not oversized', () => {
    const hot = createOversizedHot({
      fixedColumnsStart: 1,
      colWidth: 400,
      viewportWidth: 200,
      rowHeight: 20,
      viewportHeight: 200,
    });

    expect(getMouseSingleScrollTarget({
      row: 4,
      col: 0,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 0,
      isRowLargerThanViewport: isRowOversized(hot, 4),
      isColumnLargerThanViewport: isColumnOversized(hot, 0),
    })).toBeNull();
  });

  it('should not force snap when both axes are frozen oversized cells', () => {
    const hot = createOversizedHot({
      fixedColumnsStart: 1,
      fixedRowsTop: 1,
    });

    expect(getMouseSingleScrollTarget({
      row: 0,
      col: 0,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: isRowOversized(hot, 0),
      isColumnLargerThanViewport: isColumnOversized(hot, 0),
    })).toEqual({ row: 0, col: 0 });
  });
});
