import { classifyRange } from '../classifyRange';

describe('classifyRange', () => {
  const grid = { rowCount: 10, columnCount: 6 };

  it('should classify a one-cell range as a cell', () => {
    expect(classifyRange({ top: 1, start: 1, bottom: 1, end: 1 }, grid, false)).toBe('cell');
  });

  it('should classify a range that is not multiple as a cell, even when its corners differ', () => {
    expect(classifyRange({ top: 1, start: 1, bottom: 2, end: 2 }, grid, false)).toBe('cell');
  });

  it('should classify a block of cells as a range', () => {
    expect(classifyRange({ top: 1, start: 1, bottom: 3, end: 2 }, grid, true)).toBe('range');
  });

  it('should classify a range that spans every row as columns', () => {
    expect(classifyRange({ top: 0, start: 2, bottom: 9, end: 2 }, grid, true)).toBe('columns');
    expect(classifyRange({ top: 0, start: 0, bottom: 9, end: 2 }, grid, true)).toBe('columns');
  });

  it('should classify a range that spans every column as rows', () => {
    expect(classifyRange({ top: 4, start: 0, bottom: 4, end: 5 }, grid, true)).toBe('rows');
    expect(classifyRange({ top: 4, start: 0, bottom: 8, end: 5 }, grid, true)).toBe('rows');
  });

  it('should classify a range that spans every row and every column as all cells', () => {
    expect(classifyRange({ top: 0, start: 0, bottom: 9, end: 5 }, grid, true)).toBe('all');
  });

  it('should not classify a range that stops one row short of the last row as columns', () => {
    expect(classifyRange({ top: 0, start: 2, bottom: 8, end: 2 }, grid, true)).toBe('range');
  });

  it('should classify a header range as columns when the grid has columns and no rows', () => {
    expect(classifyRange({ top: 0, start: 0, bottom: 0, end: 2 }, { rowCount: 0, columnCount: 4 }, true))
      .toBe('columns');
  });

  it('should classify a header range as rows when the grid has rows and no columns', () => {
    expect(classifyRange({ top: 1, start: 0, bottom: 3, end: 0 }, { rowCount: 5, columnCount: 0 }, true))
      .toBe('rows');
  });

  it('should classify a range as a cell, which is not announced, when the grid has no rows and no columns', () => {
    expect(classifyRange({ top: 0, start: 0, bottom: 0, end: 0 }, { rowCount: 0, columnCount: 0 }, true))
      .toBe('cell');
  });
});
