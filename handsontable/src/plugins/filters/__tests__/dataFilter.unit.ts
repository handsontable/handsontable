import DataFilter from 'handsontable/plugins/filters/dataFilter';
import { ColumnDataMap } from 'handsontable/plugins/filters/columnDataMap';
import type { CellProperties } from 'handsontable/settings';

describe('DataFilter', () => {
  /**
   * Builds a column read over the mock dataset. The resolver hands every entry its own meta object,
   * which is what `Filters#_readColumn()` does for a row with no stored per-cell meta.
   *
   * @param column - The column index used to select the mock data row.
   * @param physicalRows - When given, only these physical rows are read.
   */
  function columnDataMock(column: number, physicalRows?: number[]) {
    const data = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
    ];
    const rows = physicalRows ?? data[column].map((_, index) => index);
    const values = rows.map(row => data[column][row]);

    return new ColumnDataMap(rows, values, column,
      (index: number) => ({ row: rows[index] } as unknown as CellProperties));
  }

  it('should initialize with dependencies', () => {
    const conditionCollectionMock = {} as never;
    const dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);

    expect(dataFilter.conditionCollection).toBe(conditionCollectionMock);
    expect(dataFilter.columnDataFactory).toBe(columnDataMock);
  });

  describe('filter', () => {
    it('should not filter input data when condition collection is empty', () => {
      const conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch'),
        getFilteredColumns: jasmine.createSpy('getFilteredColumns').and.returnValue([]),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      expect(dataFilter.filter()).toEqual([]);
      expect(conditionCollectionMock.isMatch).not.toHaveBeenCalled();
    });

    it('should filter input data based on condition collection (shallow filtering)', () => {
      const conditionCollectionMock = {
        // filtering applied to column index 0
        getFilteredColumns: jasmine.createSpy('getFilteredColumns').and.returnValue([0]),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      spyOn(dataFilter, 'columnDataFactory').and.callThrough();
      spyOn(dataFilter, 'filterByColumn').and.returnValue([1, 2]);

      const result = dataFilter.filter();

      expect((dataFilter.columnDataFactory as jasmine.Spy).calls.argsFor(0)).toEqual([0]);
      expect((dataFilter.filterByColumn as jasmine.Spy).calls.argsFor(0)[0]).toBe(0);
      expect((dataFilter.filterByColumn as jasmine.Spy).calls.argsFor(0)[1].values)
        .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(result).toEqual([1, 2]);
    });

    it('should filter input data based on condition collection (deep filtering)', () => {
      const conditionCollectionMock = {
        // filtering applied first to column at index 1 and later at index 0
        getFilteredColumns: jasmine.createSpy('getFilteredColumns').and.returnValue([1, 0]),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      spyOn(dataFilter, 'columnDataFactory').and.callThrough();
      spyOn(dataFilter, 'filterByColumn').and.returnValue([1, 4]);

      const result = dataFilter.filter();

      // the first filtered column reads every source row
      expect((dataFilter.columnDataFactory as jasmine.Spy).calls.argsFor(0)).toEqual([1]);
      // later columns read only the physical rows that survived the previous conditions
      expect((dataFilter.columnDataFactory as jasmine.Spy).calls.argsFor(1)).toEqual([0, [1, 4]]);
      expect((dataFilter.filterByColumn as jasmine.Spy).calls.argsFor(0)[1].values)
        .toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
      expect(result).toEqual([1, 4]);
    });
  });

  describe('filterByColumn', () => {
    it('should return the physical rows of every entry when everything matches', () => {
      const conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch').and.callFake(() => true),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      const result = dataFilter.filterByColumn(0, columnDataMock(0, [0, 1, 2, 3, 4]));

      expect(conditionCollectionMock.isMatch.calls.count()).toBe(5);
      expect(conditionCollectionMock.isMatch.calls.argsFor(0)[1]).toBe(0);
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('should return no rows when nothing matches', () => {
      const conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch').and.callFake(() => false),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      const result = dataFilter.filterByColumn(0, columnDataMock(0, [0, 1, 2, 3, 4]));

      expect(conditionCollectionMock.isMatch.calls.count()).toBe(5);
      expect(result).toEqual([]);
    });

    it('should return the physical rows of the entries that match', () => {
      const conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch')
          .and.callFake((dataRow: { value: number }) => dataRow.value % 2),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      // physical rows 4..8 hold the values 5..9, of which 5, 7 and 9 are odd
      const result = dataFilter.filterByColumn(0, columnDataMock(0, [4, 5, 6, 7, 8]));

      expect(conditionCollectionMock.isMatch.calls.count()).toBe(5);
      expect(result).toEqual([4, 6, 8]);
    });

    it('should hand each condition call its own `{row, meta, value}` object', () => {
      const seenRows: unknown[] = [];
      const conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch').and.callFake((dataRow: unknown) => {
          seenRows.push(dataRow);

          return true;
        }),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      dataFilter.filterByColumn(0, columnDataMock(0, [2, 3, 4]));

      // A reused cursor would make these the same object, and a condition that keeps what it was
      // handed would then read another row.
      expect(new Set(seenRows).size).toBe(3);
      expect(new Set(seenRows.map(dataRow => (dataRow as { meta: unknown }).meta)).size).toBe(3);
      expect(seenRows.map(dataRow => Object.keys(dataRow as object)))
        .toEqual([['row', 'meta', 'value'], ['row', 'meta', 'value'], ['row', 'meta', 'value']]);
      expect(seenRows).toEqual([
        { row: 2, meta: { row: 2, col: 0, visualRow: 2, visualCol: 0 }, value: 3 },
        { row: 3, meta: { row: 3, col: 0, visualRow: 3, visualCol: 0 }, value: 4 },
        { row: 4, meta: { row: 4, col: 0, visualRow: 4, visualCol: 0 }, value: 5 },
      ]);
    });

    it('should return no rows for an empty column read', () => {
      const conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch'),
      };
      const dataFilter = new DataFilter(conditionCollectionMock as never, columnDataMock);

      expect(dataFilter.filterByColumn(0, ColumnDataMap.empty())).toEqual([]);
      expect(dataFilter.filterByColumn(0)).toEqual([]);
      expect(conditionCollectionMock.isMatch).not.toHaveBeenCalled();
    });
  });
});
