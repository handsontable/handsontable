import { ColumnStatesManager, ASC_SORT_STATE, DESC_SORT_STATE } from 'handsontable/plugins/columnSorting/columnStatesManager';
import { deepClone } from '../../../helpers/object';

describe('ColumnSorting', function () {
  describe('ColumnStatesManager.updateAllColumnsProperties', function () {
    it('should update internal properties', function () {
      var columnStatesManager = new ColumnStatesManager();
      var compareFunctionFactory = function compareFunctionFactory() {};

      columnStatesManager.updateAllColumnsProperties({
        sortEmptyCells: true,
        indicator: true,
        compareFunctionFactory: compareFunctionFactory
      });

      expect(columnStatesManager.sortEmptyCells).toBeTruthy();
      expect(columnStatesManager.indicator).toBeTruthy();
      expect(columnStatesManager.compareFunctionFactory).toEqual(compareFunctionFactory);
    });
  });

  describe('ColumnStatesManager.getAllColumnsProperties', function () {
    it('should return default columns properties', function () {
      var columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.getAllColumnsProperties()).toEqual({
        sortEmptyCells: false,
        indicator: true,
        headerAction: true
      });
    });

    it('should return set columns properties', function () {
      var columnStatesManager = new ColumnStatesManager();
      var compareFunctionFactory = function compareFunctionFactory() {};

      columnStatesManager.updateAllColumnsProperties({
        sortEmptyCells: true,
        indicator: true,
        headerAction: false,
        compareFunctionFactory: compareFunctionFactory
      });

      expect(columnStatesManager.getAllColumnsProperties()).toEqual({
        sortEmptyCells: true,
        indicator: true,
        headerAction: false,
        compareFunctionFactory: compareFunctionFactory
      });
    });
  });

  describe('ColumnStatesManager.setSortStates', function () {
    it('should change state queue', function () {
      var columnStatesManager = new ColumnStatesManager();
      var initialState = deepClone(columnStatesManager.sortedColumnsStates);

      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);

      var stateAfterFunctionCall = deepClone(columnStatesManager.sortedColumnsStates);

      expect(stateAfterFunctionCall).not.toEqual(initialState);
    });
  });

  describe('ColumnStatesManager.getSortStates', function () {
    it('should return copy of states', function () {
      var columnStatesManager = new ColumnStatesManager();
      var newStatesQueue = [{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }];

      columnStatesManager.setSortStates(newStatesQueue);

      expect(columnStatesManager.getSortStates()).toEqual(newStatesQueue);
      expect(columnStatesManager.getSortStates()).not.toBe(newStatesQueue);
    });
  });

  describe('ColumnStatesManager.getColumnSortState', function () {
    it('should return copy of state', function () {
      var columnStatesManager = new ColumnStatesManager();
      var newStatesQueue = [{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }];

      columnStatesManager.setSortStates(newStatesQueue);

      expect(columnStatesManager.getColumnSortState(0)).toEqual(newStatesQueue[0]);
      expect(columnStatesManager.getColumnSortState(0)).not.toBe(newStatesQueue[0]);
    });
  });

  describe('ColumnStatesManager.isListOfSortedColumnsEmpty', function () {
    it('should return `true` when state queue is empty', function () {
      var columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();
    });

    it('should return `true` when state of the only sorted column was changed to not sorted', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);
      columnStatesManager.setSortStates([]);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();
    });

    it('should return `false` when state queue is not empty', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeFalsy();
    });
  });

  describe('ColumnStatesManager.getSortedColumns', function () {
    it('should return list of all sorted columns (respecting the states queue)', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.getSortedColumns()).toEqual([0, 2, 1]);
    });

    it('should return empty array when no column has been sorted', function () {
      var columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.getSortedColumns()).toEqual([]);
    });
  });

  describe('ColumnStatesManager.getIndexOfColumnInSortQueue', function () {
    it('should return index of particular column in the states queue', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.getIndexOfColumnInSortQueue(0)).toEqual(0);
      expect(columnStatesManager.getIndexOfColumnInSortQueue(2)).toEqual(1);
      expect(columnStatesManager.getIndexOfColumnInSortQueue(1)).toEqual(2);
    });

    it('should return -1 when particular column does not exist in the states queue', function () {
      var columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.getIndexOfColumnInSortQueue(0)).toEqual(-1);
    });
  });

  describe('ColumnStatesManager.getNumberOfSortedColumns', function () {
    it('should return number of sorted columns', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(3);

      columnStatesManager.setSortStates([{ column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(2);

      columnStatesManager.setSortStates([]);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(0);
    });
  });

  describe('ColumnStatesManager.getFirstSortedColumn', function () {
    it('should return first sorted column', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 2, sortOrder: ASC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.getFirstSortedColumn()).toEqual(0);
    });

    it('should return `undefined` when no column has been sorted', function () {
      var columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.getFirstSortedColumn()).toBeUndefined();
    });
  });

  describe('ColumnStatesManager.isColumnSorted', function () {
    it('should return if particular column is sorted', function () {
      var columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortStates([{ column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.isColumnSorted(1)).toBeTruthy();
      expect(columnStatesManager.isColumnSorted(2)).toBeFalsy();
    });
  });

  describe('ColumnStatesManager.getSortOrderOfColumn', function () {
    it('should return `undefined` when column is not sorted', function () {
      var columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.getSortOrderOfColumn(0)).toBeUndefined();
    });

    it('should return proper order when column is sorted', function () {
      var columnStatesManager = new ColumnStatesManager();
      columnStatesManager.setSortStates([{ column: 0, sortOrder: DESC_SORT_STATE }, { column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.getSortOrderOfColumn(0)).toEqual(DESC_SORT_STATE);
      expect(columnStatesManager.getSortOrderOfColumn(1)).toEqual(ASC_SORT_STATE);
    });
  });
});