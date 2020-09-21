import {
  ColumnStatesManager,
  ASC_SORT_STATE,
  DESC_SORT_STATE
} from 'handsontable/plugins/columnSorting/columnStatesManager';
import { PhysicalIndexToValueMap as IndexToValueMap } from 'handsontable/translations';

describe('ColumnSorting', () => {
  describe('ColumnStatesManager.updateAllColumnsProperties', () => {
    it('should update internal properties', () => {
      const columnStatesManager = new ColumnStatesManager(new IndexToValueMap());
      const compareFunctionFactory = function() {};

      columnStatesManager.updateAllColumnsProperties({
        sortEmptyCells: true,
        indicator: true,
        compareFunctionFactory
      });

      expect(columnStatesManager.sortEmptyCells).toBeTruthy();
      expect(columnStatesManager.indicator).toBeTruthy();
      expect(columnStatesManager.compareFunctionFactory).toEqual(compareFunctionFactory);
    });
  });

  describe('ColumnStatesManager.getAllColumnsProperties', () => {
    it('should return default columns properties', () => {
      const columnStatesManager = new ColumnStatesManager(new IndexToValueMap());

      expect(columnStatesManager.getAllColumnsProperties()).toEqual({
        sortEmptyCells: false,
        indicator: true,
        headerAction: true
      });
    });

    it('should return set columns properties', () => {
      const columnStatesManager = new ColumnStatesManager(new IndexToValueMap());
      const compareFunctionFactory = function() {};

      columnStatesManager.updateAllColumnsProperties({
        sortEmptyCells: true,
        indicator: true,
        headerAction: false,
        compareFunctionFactory
      });

      expect(columnStatesManager.getAllColumnsProperties()).toEqual({
        sortEmptyCells: true,
        indicator: true,
        headerAction: false,
        compareFunctionFactory
      });
    });
  });

  describe('ColumnStatesManager.setSortStates', () => {
    it('should change state queue', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);
      const initialState = columnStatesManager.getSortStates();

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);

      const stateAfterFunctionCall = columnStatesManager.getSortStates();

      expect(stateAfterFunctionCall).not.toEqual(initialState);
    });
  });

  describe('ColumnStatesManager.getSortStates', () => {
    it('should return copy of states', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);
      const newStatesQueue = [
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ];

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates(newStatesQueue);

      expect(columnStatesManager.getSortStates()).toEqual(newStatesQueue);
      expect(columnStatesManager.getSortStates()).not.toBe(newStatesQueue);
    });
  });

  describe('ColumnStatesManager.getColumnSortState', () => {
    it('should return copy of state', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);
      const newStatesQueue = [
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ];

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates(newStatesQueue);

      expect(columnStatesManager.getColumnSortState(0)).toEqual(newStatesQueue[0]);
      expect(columnStatesManager.getColumnSortState(0)).not.toBe(newStatesQueue[0]);
    });
  });

  describe('ColumnStatesManager.isListOfSortedColumnsEmpty', () => {
    it('should return `true` when state queue is empty', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();
    });

    it('should return `true` when state of the only sorted column was changed to not sorted', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);
      columnStatesManager.setSortStates([]);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();
    });

    it('should return `false` when state queue is not empty', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeFalsy();
    });
  });

  describe('ColumnStatesManager.getIndexOfColumnInSortQueue', () => {
    it('should return index of particular column in the states queue', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates([
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ]);

      expect(columnStatesManager.getIndexOfColumnInSortQueue(0)).toEqual(0);
      expect(columnStatesManager.getIndexOfColumnInSortQueue(2)).toEqual(1);
      expect(columnStatesManager.getIndexOfColumnInSortQueue(1)).toEqual(2);
    });

    it('should return -1 when particular column does not exist in the states queue', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);

      expect(columnStatesManager.getIndexOfColumnInSortQueue(0)).toEqual(-1);
    });
  });

  describe('ColumnStatesManager.getNumberOfSortedColumns', () => {
    it('should return number of sorted columns', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);

      columnStatesManager.setSortStates([
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ]);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(3);

      columnStatesManager.setSortStates([
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ]);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(2);

      columnStatesManager.setSortStates([]);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(0);
    });
  });

  describe('ColumnStatesManager.isColumnSorted', () => {
    it('should return if particular column is sorted', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);

      columnStatesManager.setSortStates([{ column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.isColumnSorted(1)).toBeTruthy();
      expect(columnStatesManager.isColumnSorted(2)).toBeFalsy();
    });
  });

  describe('ColumnStatesManager.getSortOrderOfColumn', () => {
    it('should return `undefined` when column is not sorted', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);

      expect(columnStatesManager.getSortOrderOfColumn(0)).toBeUndefined();
    });

    it('should return proper order when column is sorted', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 3 columns.
      indexToValueMap.init(3);
      columnStatesManager.setSortStates([
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE }
      ]);

      expect(columnStatesManager.getSortOrderOfColumn(0)).toEqual(DESC_SORT_STATE);
      expect(columnStatesManager.getSortOrderOfColumn(1)).toEqual(ASC_SORT_STATE);
    });
  });
});
