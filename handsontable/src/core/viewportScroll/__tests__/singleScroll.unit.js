import { getMouseSingleScrollTarget, isLargerThanViewport } from '../scrollStrategies/singleScroll';

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

  it('should omit a last-partial column when neither axis is oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 0,
      col: 5,
      lastPartiallyVisibleRow: 8,
      lastPartiallyVisibleColumn: 5,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toEqual({ row: 0 });
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

  it('should omit a last-partial row when neither axis is oversized', () => {
    expect(getMouseSingleScrollTarget({
      row: 5,
      col: 0,
      lastPartiallyVisibleRow: 5,
      lastPartiallyVisibleColumn: 8,
      isRowLargerThanViewport: false,
      isColumnLargerThanViewport: false,
    })).toEqual({ col: 0 });
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
});
