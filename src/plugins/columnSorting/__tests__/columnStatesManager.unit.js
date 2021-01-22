import { ColumnStatesManager } from 'handsontable/plugins/columnSorting/columnStatesManager';
import { ASC_SORT_STATE, DESC_SORT_STATE } from 'handsontable/plugins/columnSorting/utils';
import { IndexMapper } from 'handsontable/translations';

const hotMock = {
  toPhysicalColumn: column => column,
  toVisualColumn: column => column,
  columnIndexMapper: new IndexMapper()
};

// Mocking that table have 3 columns.
hotMock.columnIndexMapper.initToLength(3);

describe('ColumnSorting', () => {
  describe('ColumnStatesManager.updateAllColumnsProperties', () => {
    it('should update internal properties', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');
      const compareFunctionFactory = function() {};

      columnStatesManager.updateAllColumnsProperties({
        sortEmptyCells: true,
        indicator: true,
        compareFunctionFactory
      });

      expect(columnStatesManager.sortEmptyCells).toBeTruthy();
      expect(columnStatesManager.indicator).toBeTruthy();
      expect(columnStatesManager.compareFunctionFactory).toEqual(compareFunctionFactory);

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.getAllColumnsProperties', () => {
    it('should return default columns properties', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      expect(columnStatesManager.getAllColumnsProperties()).toEqual({
        sortEmptyCells: false,
        indicator: true,
        headerAction: true
      });

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    it('should return set columns properties', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');
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

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.setSortStates', () => {
    it('should change state queue', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');
      const initialState = columnStatesManager.getSortStates();

      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);

      const stateAfterFunctionCall = columnStatesManager.getSortStates();

      expect(stateAfterFunctionCall).not.toEqual(initialState);

      columnStatesManager.destroy();
    });
  });

  describe('ColumnStatesManager.getSortStates', () => {
    it('should return copy of states', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');
      const newStatesQueue = [
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ];

      columnStatesManager.setSortStates(newStatesQueue);

      expect(columnStatesManager.getSortStates()).toEqual(newStatesQueue);
      expect(columnStatesManager.getSortStates()).not.toBe(newStatesQueue);

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.getColumnSortState', () => {
    it('should return copy of state', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      const newStatesQueue = [
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ];

      columnStatesManager.setSortStates(newStatesQueue);

      expect(columnStatesManager.getColumnSortState(0)).toEqual(newStatesQueue[0]);
      expect(columnStatesManager.getColumnSortState(0)).not.toBe(newStatesQueue[0]);

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.isListOfSortedColumnsEmpty', () => {
    it('should return `true` when state queue is empty', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    it('should return `true` when state of the only sorted column was changed to not sorted', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);
      columnStatesManager.setSortStates([]);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    it('should return `false` when state queue is not empty', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      columnStatesManager.setSortStates([{ column: 0, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeFalsy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.getIndexOfColumnInSortQueue', () => {
    it('should return index of particular column in the states queue', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      columnStatesManager.setSortStates([
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE },
      ]);

      expect(columnStatesManager.getIndexOfColumnInSortQueue(0)).toEqual(0);
      expect(columnStatesManager.getIndexOfColumnInSortQueue(2)).toEqual(1);
      expect(columnStatesManager.getIndexOfColumnInSortQueue(1)).toEqual(2);

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    it('should return -1 when particular column does not exist in the states queue', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      expect(columnStatesManager.getIndexOfColumnInSortQueue(0)).toEqual(-1);

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.getNumberOfSortedColumns', () => {
    it('should return number of sorted columns', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

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

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.isColumnSorted', () => {
    it('should return if particular column is sorted', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      columnStatesManager.setSortStates([{ column: 1, sortOrder: ASC_SORT_STATE }]);

      expect(columnStatesManager.isColumnSorted(1)).toBeTruthy();
      expect(columnStatesManager.isColumnSorted(2)).toBeFalsy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });

  describe('ColumnStatesManager.getSortOrderOfColumn', () => {
    it('should return `undefined` when column is not sorted', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      expect(columnStatesManager.getSortOrderOfColumn(0)).toBeUndefined();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    it('should return proper order when column is sorted', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock, 'sortingStates');

      columnStatesManager.setSortStates([
        { column: 0, sortOrder: DESC_SORT_STATE },
        { column: 1, sortOrder: ASC_SORT_STATE }
      ]);

      expect(columnStatesManager.getSortOrderOfColumn(0)).toEqual(DESC_SORT_STATE);
      expect(columnStatesManager.getSortOrderOfColumn(1)).toEqual(ASC_SORT_STATE);

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });
});
