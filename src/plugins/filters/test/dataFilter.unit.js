import DataFilter from 'handsontable-pro/plugins/filters/dataFilter';

describe('DataFilter', function() {
  function columnDataMock(column) {
    var data = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
    ];

    return data[column];
  }

  it('should initialize with dependencies', function() {
    var conditionCollectionMock = {};
    var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);

    expect(dataFilter.conditionCollection).toBe(conditionCollectionMock);
    expect(dataFilter.columnDataFactory).toBe(columnDataMock);
  });

  describe('filter', function() {
    it('should not filter input data when condition collection is empty', function() {
      var conditionCollectionMock = {isEmpty: jasmine.createSpy('isEmpty').and.returnValue(true)};
      var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);

      dataFilter.filter();

      expect(conditionCollectionMock.isEmpty).toHaveBeenCalled();
    });

    it('should filter input data based on condition collection (shallow filtering)', function() {
      var conditionCollectionMock = {
        isEmpty: jasmine.createSpy('isEmpty').and.returnValue(false),
        orderStack: [0] // filtering applied to column index 0
      };
      var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);

      spyOn(dataFilter, 'columnDataFactory').and.callThrough();
      spyOn(dataFilter, '_getIntersectData').and.callThrough();
      spyOn(dataFilter, 'filterByColumn').and.returnValue([1, 2]);

      var result = dataFilter.filter();

      expect(dataFilter.columnDataFactory).toHaveBeenCalledWith(0);
      expect(dataFilter._getIntersectData).not.toHaveBeenCalled();
      expect(dataFilter.filterByColumn).toHaveBeenCalledWith(0, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(result).toEqual([1, 2]);
    });

    it('should filter input data based on condition collection (deep filtering)', function() {
      var conditionCollectionMock = {
        isEmpty: jasmine.createSpy('isEmpty').and.returnValue(false),
        orderStack: [1, 0] // filtering applied first to column at index 1 and later at index 0
      };
      var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);

      spyOn(dataFilter, 'columnDataFactory').and.callThrough();
      spyOn(dataFilter, '_getIntersectData').and.returnValue([1, 2]);
      spyOn(dataFilter, 'filterByColumn').and.returnValue([1, 2]);

      var result = dataFilter.filter();

      expect(dataFilter.columnDataFactory).toHaveBeenCalledWith(0);
      expect(dataFilter._getIntersectData).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2]);
      expect(dataFilter.filterByColumn.calls.argsFor(0)).toEqual([1, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']]);
      expect(dataFilter.filterByColumn.calls.argsFor(1)).toEqual([0, [1, 2]]);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('filterByColumn', function() {
    it('should filter input data based on condition collection (filter all)', function() {
      var conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch').and.callFake(function() {
          return true;
        }),
      };
      var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);
      var data = [1, 2, 3, 4, 5];

      var result = dataFilter.filterByColumn(0, data);

      expect(conditionCollectionMock.isMatch.calls.count()).toBe(5);
      expect(conditionCollectionMock.isMatch.calls.argsFor(0)).toEqual([1, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(1)).toEqual([2, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(2)).toEqual([3, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(3)).toEqual([4, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(4)).toEqual([5, 0]);
      expect(result).toEqual(data);
    });

    it('should filter input data based on condition collection (filter none)', function() {
      var conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch').and.callFake(function() {
          return false;
        }),
      };
      var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);
      var data = [1, 2, 3, 4, 5];

      var result = dataFilter.filterByColumn(0, data);

      expect(conditionCollectionMock.isMatch.calls.count()).toBe(5);
      expect(conditionCollectionMock.isMatch.calls.argsFor(0)).toEqual([1, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(1)).toEqual([2, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(2)).toEqual([3, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(3)).toEqual([4, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(4)).toEqual([5, 0]);
      expect(result).toEqual([]);
    });

    it('should filter input data based on condition collection (filtering odd numbers)', function() {
      var conditionCollectionMock = {
        isMatch: jasmine.createSpy('isMatch').and.callFake(function(dataRow, column) {
          return dataRow % 2;
        }),
      };
      var dataFilter = new DataFilter(conditionCollectionMock, columnDataMock);
      var data = [1, 2, 3, 4, 5];

      var result = dataFilter.filterByColumn(0, data);

      expect(conditionCollectionMock.isMatch.calls.count()).toBe(5);
      expect(conditionCollectionMock.isMatch.calls.argsFor(0)).toEqual([1, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(1)).toEqual([2, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(2)).toEqual([3, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(3)).toEqual([4, 0]);
      expect(conditionCollectionMock.isMatch.calls.argsFor(4)).toEqual([5, 0]);
      expect(result).toEqual([1, 3, 5]);
    });
  });
});
