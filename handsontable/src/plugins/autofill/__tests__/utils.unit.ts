import { countCellsPastEdge, getCopyDownEndRow, getDistanceOutsideRange, resolveDragDirection } from '../utils';

const BOTH = ['vertical', 'horizontal'];

describe('Autofill utils', () => {
  describe('getDistanceOutsideRange', () => {
    it('should return 0 for an index inside the range, edges included', () => {
      expect(getDistanceOutsideRange(2, 2, 4)).toBe(0);
      expect(getDistanceOutsideRange(3, 2, 4)).toBe(0);
      expect(getDistanceOutsideRange(4, 2, 4)).toBe(0);
    });

    it('should count the indexes between the range and an index past either edge', () => {
      expect(getDistanceOutsideRange(7, 2, 4)).toBe(3);
      expect(getDistanceOutsideRange(0, 2, 4)).toBe(2);
    });
  });

  describe('countCellsPastEdge', () => {
    it('should return 0 for a pointer on or inside the edge', () => {
      expect(countCellsPastEdge(0, 23)).toBe(0);
      expect(countCellsPastEdge(-40, 23)).toBe(0);
    });

    it('should count every cell the pointer reached past the edge, a started one included', () => {
      expect(countCellsPastEdge(1, 23)).toBe(1);
      expect(countCellsPastEdge(23, 23)).toBe(1);
      expect(countCellsPastEdge(24, 23)).toBe(2);
      expect(countCellsPastEdge(80, 29)).toBe(3);
    });

    it('should count one cell past the edge when the cell size is unknown', () => {
      expect(countCellsPastEdge(80, 0)).toBe(1);
      expect(countCellsPastEdge(80, Number.NaN)).toBe(1);
    });
  });

  describe('resolveDragDirection', () => {
    it('should return `null` while the pointer is inside the selection, whatever the current direction', () => {
      expect(resolveDragDirection(null, 0, 0, BOTH)).toBe(null);
      expect(resolveDragDirection('vertical', 0, 0, BOTH)).toBe(null);
      expect(resolveDragDirection('horizontal', 0, 0, BOTH)).toBe(null);
    });

    it('should resolve the only axis the pointer left', () => {
      expect(resolveDragDirection(null, 3, 0, BOTH)).toBe('vertical');
      expect(resolveDragDirection(null, 0, 2, BOTH)).toBe('horizontal');
    });

    // DEV-140: the fill handle sits on the selection's corner, so a diagonal pointer leaves the
    // selection on both axes at once and used to resolve nothing at all.
    it('should resolve the axis the pointer is further outside on when it left both', () => {
      expect(resolveDragDirection(null, 4, 1, BOTH)).toBe('vertical');
      expect(resolveDragDirection(null, 1, 3, BOTH)).toBe('horizontal');
    });

    it('should resolve a tie between the two axes as vertical', () => {
      expect(resolveDragDirection(null, 1, 1, BOTH)).toBe('vertical');
      expect(resolveDragDirection(null, 5, 5, BOTH)).toBe('vertical');
    });

    it('should ignore the axis the allowed directions leave out', () => {
      expect(resolveDragDirection(null, 1, 4, ['vertical'])).toBe('vertical');
      expect(resolveDragDirection(null, 4, 1, ['horizontal'])).toBe('horizontal');
    });

    it('should resolve nothing when the pointer left only along an axis the allowed directions leave out', () => {
      expect(resolveDragDirection(null, 0, 3, ['vertical'])).toBe(null);
      expect(resolveDragDirection(null, 3, 0, ['horizontal'])).toBe(null);
    });

    it('should keep the current direction while the pointer stays outside along its axis', () => {
      expect(resolveDragDirection('vertical', 2, 5, BOTH)).toBe('vertical');
      expect(resolveDragDirection('horizontal', 5, 2, BOTH)).toBe('horizontal');
    });

    it('should switch to the other axis once the pointer is back inside along the current one', () => {
      expect(resolveDragDirection('vertical', 0, 2, BOTH)).toBe('horizontal');
      expect(resolveDragDirection('horizontal', 2, 0, BOTH)).toBe('vertical');
    });

    it('should not switch to an axis the allowed directions leave out', () => {
      expect(resolveDragDirection('vertical', 0, 2, ['vertical'])).toBe('vertical');
      expect(resolveDragDirection('horizontal', 2, 0, ['horizontal'])).toBe('horizontal');
    });
  });

  describe('getCopyDownEndRow (DEV-859)', () => {
    const N = null;
    const isEmptyValue = (value: unknown) => value === null || value === undefined || value === '';

    type ReaderOptions = { hiddenRows?: number[], guide?: (row: number, column: number) => boolean };
    // A grid as rows of values; any column outside a row reads as empty.
    const readersFor = (grid: unknown[][], { hiddenRows = [], guide }: ReaderOptions = {}) => ({
      isFilledColumnEmpty: (row: number, column: number) => isEmptyValue(grid[row]?.[column]),
      isGuideColumnEmpty: guide ?? ((row: number, column: number) => isEmptyValue(grid[row]?.[column])),
      isRowHidden: (row: number) => hiddenRows.includes(row),
    });
    const endRow = (
      grid: unknown[][], startColumn = 0, endColumn = startColumn, lastSelectedRow = 0, options: ReaderOptions = {},
    ) =>
      getCopyDownEndRow(readersFor(grid, options), { endRow: lastSelectedRow, startColumn, endColumn }, grid.length);

    it('should fill down as far as the neighboring column has values', () => {
      expect(endRow([[1, 1], [N, 2], [N, 3], [N, 4], [N, N]])).toBe(3);
    });

    it('should stop above the first row that already has a value in the filled column (ticket case 1)', () => {
      expect(endRow([[0, 0], [N, 0], [N, 1], [N, 2], [N, 3], [9, 0], [9, 0], [9, 0]])).toBe(4);
    });

    it('should stop at the first gap in the neighboring column (ticket case 2)', () => {
      expect(endRow([[1, 1], [N, 0], [N, 0], [N, 0], [N, 1], [N, 0], [N, 0], [N, N], [N, N], [N, N], [N, 1]])).toBe(6);
    });

    it('should fill nothing when the row right below the selection has a value or a neighbor gap', () => {
      expect(endRow([[1, 1], [9, 2], [N, 3]])).toBeNull();
      expect(endRow([[1, 1], [N, N], [N, 3], [N, 4]])).toBeNull();
      expect(endRow([[1, N], [N, N]])).toBeNull();
    });

    it('should follow the left neighbor when it has a value in the first row below the selection', () => {
      // Left: rows 0-2; right: rows 2-5. The left column guides, so the fill stops at row 2.
      expect(endRow([[1, 5, N], [2, N, N], [3, N, 7], [N, N, 7], [N, N, 7], [N, N, 7]], 1)).toBe(2);
    });

    it('should follow the right neighbor when the left one is empty in the first row below the selection', () => {
      expect(endRow([[N, 5, 1], [N, N, 2], [N, N, 3], [N, N, N]], 1)).toBe(2);
      // The right column guides from then on, so the left one filling up later does not extend the fill.
      expect(endRow([[N, 5, 1], [N, N, 2], [4, N, N], [4, N, N]], 1)).toBe(1);
    });

    it('should treat every selected column as the filled column', () => {
      expect(endRow([['a', 'b', 1], [N, N, 2], [N, N, 3], [N, N, N]], 0, 1)).toBe(2);
      expect(endRow([['a', 'b', 1], [N, N, 2], [N, 'x', 3]], 0, 1)).toBe(1);
    });

    it('should start below a selection that spans several rows', () => {
      expect(endRow([[1, 1], [2, 2], [N, 3], [N, 4], [N, N]], 0, 0, 1)).toBe(3);
    });

    it('should stop at the last row of the grid', () => {
      expect(endRow([[1, 1], [N, 2], [N, 3]])).toBe(2);
    });

    it('should not end the fill at a hidden row, and should not end it on one either', () => {
      // Row 2 is hidden and has an empty neighbor: the fill carries on to row 4.
      expect(endRow([[1, 1], [N, 2], [N, N], [N, 4], [N, 5], [N, N]], 0, 0, 0, { hiddenRows: [2] })).toBe(4);
      // Hidden rows at the end are not counted as filled rows.
      expect(endRow([[1, 1], [N, 2], [N, N], [N, N]], 0, 0, 0, { hiddenRows: [2, 3] })).toBe(1);
    });

    it('should still stop above a hidden row that has a value in the filled column', () => {
      expect(endRow([[1, 1], [N, 2], [9, 3], [N, 4]], 0, 0, 0, { hiddenRows: [2] })).toBe(1);
    });

    it('should pick the guide column from the first visible row below the selection', () => {
      // Row 1 is hidden; in row 2 only the right neighbor has a value, so it guides.
      expect(endRow([[N, 5, 1], [4, N, N], [N, N, 3], [N, N, 4], [N, N, N]], 1, 1, 0, { hiddenRows: [1] })).toBe(3);
    });

    it('should read the guide column through its own reader, so a merged area can count as one value', () => {
      // Rows 1-2 of column 1 are covered by a merged area anchored at row 1; the reader resolves them.
      const grid = [[1, 'x'], [N, 'y'], [N, N], [N, 'z'], [N, N]];
      const guide = (row: number, column: number) => isEmptyValue(grid[row === 2 && column === 1 ? 1 : row]?.[column]);

      expect(endRow(grid, 0, 0, 0, { guide })).toBe(3);
      expect(endRow(grid)).toBe(1);
    });
  });
});
